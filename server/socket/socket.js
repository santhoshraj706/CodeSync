const Room = require('../models/Room');

const roomUsers = {}; // { roomId: [{ username, socketId }] } — active connections only (in-memory)

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    let currentUsername = 'A user';

    socket.on('join-room', async ({ roomId, username }) => {
      currentUsername = username;
      socket.join(roomId);

      // Track active socket connections in memory
      if (!roomUsers[roomId]) roomUsers[roomId] = [];
      if (!roomUsers[roomId].find(u => u.socketId === socket.id)) {
        roomUsers[roomId].push({ username, socketId: socket.id });
      }

      // Broadcast full active users list to EVERYONE in the room
      io.to(roomId).emit('active-users', roomUsers[roomId]);

      // Load persisted room state from MongoDB
      try {
        const room = await Room.findOne({ roomId });
        if (room) {
          socket.emit('room-state', {
            code: room.lastCode,
            language: room.language
          });

          // Send persisted messages (last 50)
          if (room.messages && room.messages.length > 0) {
            socket.emit('chat-history', room.messages.slice(-50));
          }

          // Send persisted strokes
          if (room.strokes && room.strokes.length > 0) {
            socket.emit('whiteboard-history', room.strokes);
          }
        }
      } catch (err) {
        console.error('Error loading room state:', err);
      }

      console.log(`${username} joined room ${roomId}`);
    });

    socket.on('code-change', ({ roomId, code }) => {
      socket.to(roomId).emit('code-sync', { code });
      Room.updateOne({ roomId }, { lastCode: code }).catch(err => console.error(err));
    });

    socket.on('language-change', ({ roomId, language }) => {
      socket.to(roomId).emit('language-sync', { language });
      Room.updateOne({ roomId }, { language }).catch(err => console.error(err));
    });

    socket.on('chat-message', async ({ roomId, message, username, timestamp }) => {
      const msgObj = { message, username, timestamp };

      // Persist to MongoDB (keep last 50)
      try {
        await Room.updateOne(
          { roomId },
          {
            $push: {
              messages: {
                $each: [msgObj],
                $slice: -50
              }
            }
          }
        );
      } catch (err) {
        console.error('Error saving message:', err);
      }

      io.to(roomId).emit('chat-message', msgObj);
    });

    socket.on('whiteboard-draw', async ({ roomId, drawData }) => {
      // Persist stroke to MongoDB
      try {
        await Room.updateOne(
          { roomId },
          { $push: { strokes: drawData } }
        );
      } catch (err) {
        console.error('Error saving stroke:', err);
      }

      socket.to(roomId).emit('whiteboard-draw', { drawData });
    });

    socket.on('whiteboard-clear', async ({ roomId }) => {
      // Clear all strokes from MongoDB
      try {
        await Room.updateOne({ roomId }, { strokes: [] });
      } catch (err) {
        console.error('Error clearing strokes:', err);
      }

      socket.to(roomId).emit('whiteboard-clear');
    });

    socket.on('leave-room', ({ roomId, username }) => {
      socket.leave(roomId);
      if (roomUsers[roomId]) {
        roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socket.id);
        // Broadcast updated list to everyone remaining
        io.to(roomId).emit('active-users', roomUsers[roomId]);
      }
      console.log(`${username} left room ${roomId}`);
    });

    socket.on('disconnecting', () => {
      const rooms = Array.from(socket.rooms);
      rooms.forEach(roomId => {
        if (roomId !== socket.id) {
          if (roomUsers[roomId]) {
            roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socket.id);
            // Broadcast updated list to everyone remaining
            io.to(roomId).emit('active-users', roomUsers[roomId]);
          }
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = socketHandler;
