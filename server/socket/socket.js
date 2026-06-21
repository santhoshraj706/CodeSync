const Room = require('../models/Room');

const roomUsers = {}; // { roomId: [{ username, socketId }] } — active connections only (in-memory)
const roomStates = {}; // { roomId: { code: string, language: string, messages: Array, strokes: Array } } - active room state cache

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    let currentRoomId = null;
    let currentUsername = 'A user';

    socket.on('join-room', async ({ roomId, username }) => {
      currentRoomId = roomId;
      currentUsername = username;
      socket.join(roomId);

      // Track active socket connections in memory
      if (!roomUsers[roomId]) roomUsers[roomId] = [];
      roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socket.id);
      roomUsers[roomId].push({ username, socketId: socket.id });

      // Broadcast full active users list to EVERYONE in the room
      io.to(roomId).emit('active-users', roomUsers[roomId]);

      // Initialize in-memory cache for this room if it doesn't exist
      if (!roomStates[roomId]) {
        roomStates[roomId] = {
          code: '// Write your code here...',
          language: 'javascript',
          messages: [],
          strokes: []
        };

        // Try to load persisted state from MongoDB as background task
        try {
          const room = await Room.findOne({ roomId });
          if (room && roomStates[roomId]) {
            // Only update cache if it hasn't been heavily modified in-memory yet
            if (roomStates[roomId].code === '// Write your code here...' && roomStates[roomId].messages.length === 0) {
              roomStates[roomId].code = room.lastCode || '// Write your code here...';
              roomStates[roomId].language = room.language || 'javascript';
              roomStates[roomId].messages = room.messages || [];
              roomStates[roomId].strokes = room.strokes || [];
            }
          }
        } catch (err) {
          console.error('Error loading room state from MongoDB:', err.message);
        }
      }

      // Instantly send cached in-memory state to the joining user
      socket.emit('room-state', {
        code: roomStates[roomId].code,
        language: roomStates[roomId].language
      });

      if (roomStates[roomId].messages.length > 0) {
        socket.emit('chat-history', roomStates[roomId].messages);
      }

      if (roomStates[roomId].strokes.length > 0) {
        socket.emit('whiteboard-history', roomStates[roomId].strokes);
      }

      console.log(`${username} joined room ${roomId}`);
    });

    socket.on('code-change', ({ roomId, code }) => {
      // Sync in-memory cache
      if (roomStates[roomId]) {
        roomStates[roomId].code = code;
      }
      
      // Broadcast to other users immediately
      socket.to(roomId).emit('code-sync', { code });
      
      // Persist to MongoDB in background
      Room.updateOne({ roomId }, { lastCode: code }).catch(err => console.error('DB Error updating code:', err.message));
    });

    socket.on('language-change', ({ roomId, language }) => {
      if (roomStates[roomId]) {
        roomStates[roomId].language = language;
      }
      socket.to(roomId).emit('language-sync', { language });
      Room.updateOne({ roomId }, { language }).catch(err => console.error('DB Error updating language:', err.message));
    });

    socket.on('chat-message', ({ roomId, id, message, username, timestamp, replyTo, replyToText, replyToUser, isEdited }) => {
      const msgObj = { 
        id: id || Date.now().toString(), 
        message, 
        username, 
        timestamp,
        replyTo,
        replyToText,
        replyToUser,
        isEdited: isEdited || false
      };

      // Sync in-memory cache
      if (roomStates[roomId]) {
        roomStates[roomId].messages.push(msgObj);
        if (roomStates[roomId].messages.length > 50) {
          roomStates[roomId].messages.shift();
        }
      }

      // Broadcast to all OTHER clients
      socket.to(roomId).emit('chat-message', msgObj);

      // Persist to MongoDB in background
      Room.updateOne(
        { roomId },
        {
          $push: {
            messages: {
              $each: [msgObj],
              $slice: -50
            }
          }
        }
      ).catch(err => console.error('DB Error saving message:', err.message));
    });

    socket.on('edit-message', ({ roomId, id, newMessage }) => {
      // Sync in-memory cache
      if (roomStates[roomId]) {
        const msgIndex = roomStates[roomId].messages.findIndex(m => m.id === id);
        if (msgIndex !== -1) {
          roomStates[roomId].messages[msgIndex].message = newMessage;
          roomStates[roomId].messages[msgIndex].isEdited = true;
        }
      }

      // Broadcast to all OTHER clients
      socket.to(roomId).emit('edit-message', { id, newMessage });

      // Persist to MongoDB in background
      Room.updateOne(
        { roomId, "messages.id": id },
        { 
          $set: { 
            "messages.$.message": newMessage,
            "messages.$.isEdited": true
          } 
        }
      ).catch(err => console.error('DB Error updating message:', err.message));
    });

    socket.on('whiteboard-draw', ({ roomId, drawData }) => {
      // Sync in-memory cache
      if (roomStates[roomId]) {
        if (drawData.type === 'stickynote') {
          const { action, id, x0, y0, text, strokeColor } = drawData;
          if (action === 'create') {
            roomStates[roomId].strokes.push(drawData);
          } else if (action === 'update') {
            roomStates[roomId].strokes = roomStates[roomId].strokes.map(s => 
              (s.type === 'stickynote' && s.id === id) ? { ...s, x0: x0 ?? s.x0, y0: y0 ?? s.y0, text: text ?? s.text, strokeColor: strokeColor ?? s.strokeColor } : s
            );
          } else if (action === 'delete') {
            roomStates[roomId].strokes = roomStates[roomId].strokes.filter(s => !(s.type === 'stickynote' && s.id === id));
          }
        } else {
          roomStates[roomId].strokes.push(drawData);
        }
      }

      // Broadcast to other users immediately
      socket.to(roomId).emit('whiteboard-draw', { drawData });

      // Persist to MongoDB in background
      if (drawData.type === 'stickynote') {
        const { action, id, x0, y0, text, strokeColor } = drawData;
        if (action === 'create') {
          Room.updateOne({ roomId }, { $push: { strokes: drawData } }).catch(err => console.error(err));
        } else if (action === 'update') {
          Room.updateOne(
            { roomId, "strokes.id": id },
            { 
              $set: { 
                "strokes.$.x0": x0, 
                "strokes.$.y0": y0, 
                "strokes.$.text": text,
                "strokes.$.strokeColor": strokeColor
              } 
            }
          ).catch(err => console.error('DB Error updating sticky note:', err.message));
        } else if (action === 'delete') {
          Room.updateOne(
            { roomId },
            { $pull: { strokes: { id } } }
          ).catch(err => console.error('DB Error deleting sticky note:', err.message));
        }
      } else {
        Room.updateOne({ roomId }, { $push: { strokes: drawData } }).catch(err => console.error('DB Error saving stroke:', err.message));
      }
    });

    socket.on('whiteboard-clear', ({ roomId }) => {
      if (roomStates[roomId]) {
        roomStates[roomId].strokes = [];
      }
      socket.to(roomId).emit('whiteboard-clear');
      Room.updateOne({ roomId }, { strokes: [] }).catch(err => console.error('DB Error clearing board:', err.message));
    });

    const leaveRoomHandler = (roomId, socketId) => {
      if (roomUsers[roomId]) {
        roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socketId);
        io.to(roomId).emit('active-users', roomUsers[roomId]);

        // Clean up inactive room cache to prevent memory leaks when room becomes empty
        if (roomUsers[roomId].length === 0) {
          delete roomStates[roomId];
          delete roomUsers[roomId];
          console.log(`Cleaned up memory for inactive room: ${roomId}`);
        }
      }
    };

    socket.on('leave-room', ({ roomId, username }) => {
      socket.leave(roomId);
      leaveRoomHandler(roomId, socket.id);
      currentRoomId = null;
      console.log(`${username} left room ${roomId}`);
    });

    socket.on('disconnecting', () => {
      const rooms = Array.from(socket.rooms);
      rooms.forEach(roomId => {
        if (roomId !== socket.id) {
          leaveRoomHandler(roomId, socket.id);
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = socketHandler;
