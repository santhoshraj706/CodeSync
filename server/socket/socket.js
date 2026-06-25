const mongoose = require('mongoose');
const Room = require('../models/Room');
const User = require('../models/User');
const DirectMessage = require('../models/DirectMessage');
const Conversation = require('../models/Conversation');
const BlockedUser = require('../models/BlockedUser');

const roomUsers = {}; // { roomId: [{ username, socketId }] } — active connections only (in-memory)
const roomStates = {}; // { roomId: { code: string, language: string, messages: Array, strokes: Array } } - active room state cache
const roomPresenters = {}; // { roomId: username } - tracks active presenter
const roomAdmins = {}; // { roomId: { id: string, username: string } } - cached admin info for delete authorization
const onlineUsers = {}; // { userId: [socketIds] } - track online users for direct messaging
const crypto = require('crypto');
const pendingCalls = new Map(); // callId -> { callId, conversationId, callerId, receiverId, callerName, callerUsername, callerAvatar, receiverName, receiverUsername, status, createdAt, timeout }
const roomCalls = new Map(); // roomId -> { roomId, active: boolean, participants: [{ userId, username, socketId }] }

function generateCallId() {
  return crypto.randomBytes(12).toString('hex');
}

const socketHandler = (io) => {
  function getSocketIds(userId) {
    return onlineUsers[userId] || [];
  }

  function emitToUser(userId, event, payload) {
    const socketIds = getSocketIds(userId);
    socketIds.forEach(sid => {
      const sock = io.sockets.sockets.get(sid);
      if (sock) sock.emit(event, payload);
    });
  }

  function cleanupCallForUser(userId) {
    for (const [callId, call] of pendingCalls) {
      if (call.callerId === userId) {
        if (call.status === 'ringing') {
          clearTimeout(call.timeout);
          call.status = 'cancelled';
          emitToUser(call.receiverId, 'direct-call-cancelled', {
            callId, conversationId: call.conversationId,
            message: 'Caller went offline',
          });
        }
        pendingCalls.delete(callId);
      } else if (call.receiverId === userId && call.status === 'ringing') {
        clearTimeout(call.timeout);
        call.status = 'ended';
        emitToUser(call.callerId, 'direct-call-unavailable', {
          callId, conversationId: call.conversationId,
          message: 'User is offline',
        });
        pendingCalls.delete(callId);
      }
    }
  }

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    let currentRoomId = null;
    let currentUsername = 'A user';

    socket.on('join-room', async ({ roomId, username, fullName: fn, collegeName: cn, experienceLevel: el, avatarColor: ac }) => {
      // Validate room exists before allowing join
      const roomExists = await Room.findOne({ roomId }).select('_id');
      if (!roomExists) {
        socket.emit('room-join-error', { message: 'Room not found' });
        return;
      }

      currentRoomId = roomId;
      currentUsername = username;
      socket.join(roomId);

      // Track active socket connections in memory
      if (!roomUsers[roomId]) roomUsers[roomId] = [];
      roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socket.id);

      // Use client-provided profile data, filling any gaps from DB
      let profileData = {
        fullName: fn || '',
        collegeName: cn || '',
        experienceLevel: el || '',
        avatarColor: ac || '',
      };
      const missingFields = !fn || !cn || !el || !ac;
      if (missingFields) {
        try {
          const userDoc = await User.findOne({ username }).select('fullName collegeName experienceLevel avatarColor');
          if (userDoc) {
            profileData = {
              fullName: userDoc.fullName || fn || '',
              collegeName: userDoc.collegeName || cn || '',
              experienceLevel: userDoc.experienceLevel || el || '',
              avatarColor: userDoc.avatarColor || ac || '',
            };
          }
        } catch (e) {
          // Non-fatal; profile data optional
        }
      }

      roomUsers[roomId].push({ username, socketId: socket.id, isEditing: false, ...profileData });

      // Broadcast full active users list to EVERYONE in the room
      io.to(roomId).emit('active-users', roomUsers[roomId]);

      // Notify others that a new user joined
      socket.to(roomId).emit('user-joined', { username });

      // --- Room State Loading ---
      // Always load from DB if the in-memory cache is absent or has never
      // received real data (i.e. still on default values with no live peers).
      const cacheExists = !!roomStates[roomId];
      const cacheIsWarm = cacheExists && (
        roomStates[roomId].code !== '// Write your code here...' ||
        roomStates[roomId].messages.length > 0 ||
        roomStates[roomId].strokes.length > 0
      );

      if (!cacheExists) {
        // First person into this room (or server restarted) — init empty cache first
        roomStates[roomId] = {
          code: '// Write your code here...',
          language: 'javascript',
          messages: [],
          strokes: [],
          testCases: [],
          runHistory: [],
          codeComments: []
        };
      }

      if (!cacheIsWarm) {
        // Cache is cold — load fresh from MongoDB before sending to client
        try {
          const room = await Room.findOne({ roomId });
          if (room && roomStates[roomId]) {
            roomStates[roomId].code = room.lastCode || '// Write your code here...';
            roomStates[roomId].language = room.language || 'javascript';
            roomStates[roomId].messages = room.messages || [];
            roomStates[roomId].strokes = room.strokes || [];
            roomStates[roomId].testCases = room.testCases || [];
            roomStates[roomId].runHistory = room.runHistory || [];
            roomStates[roomId].codeComments = room.codeComments || [];
          }
          if (room && room.admin) {
            // Cache admin info for delete-message authorization
            try {
              const adminUser = await User.findById(room.admin).select('username');
              if (adminUser) {
                roomAdmins[roomId] = { id: adminUser._id.toString(), username: adminUser.username };
              }
            } catch (adminErr) {
              console.error('Error loading admin info:', adminErr.message);
            }
          }
        } catch (err) {
          console.error('Error loading room state from MongoDB:', err.message);
        }
      }

      // Send full cached state to the joining user
      socket.emit('room-state', {
        code: roomStates[roomId].code,
        language: roomStates[roomId].language
      });

      // Always emit all history so clients initialise correctly on join/refresh
      socket.emit('chat-history', roomStates[roomId].messages);
      socket.emit('whiteboard-history', roomStates[roomId].strokes);
      socket.emit('test-cases-history', roomStates[roomId].testCases);
      socket.emit('run-history', roomStates[roomId].runHistory);
      socket.emit('code-comments-history', roomStates[roomId].codeComments);

      if (roomPresenters[roomId]) {
        socket.emit('start-presenting', { username: roomPresenters[roomId] });
      }

      // Send current room call state to joining user
      const roomCall = roomCalls.get(roomId);
      if (roomCall && roomCall.active) {
        socket.emit('room-call-active', {
          roomId,
          participants: roomCall.participants,
        });
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

    socket.on('delete-message', ({ roomId, id }) => {
      // Find the message in cache
      let msg = null;
      if (roomStates[roomId]) {
        msg = roomStates[roomId].messages.find(m => m.id === id);
      }

      if (!msg) return;

      // Check authorization: must be the message author OR the room admin
      const isAuthor = msg.username === currentUsername;
      const adminInfo = roomAdmins[roomId];
      const isAdmin = adminInfo && adminInfo.username === currentUsername;

      if (!isAuthor && !isAdmin) return;

      // Remove from in-memory cache
      if (roomStates[roomId]) {
        roomStates[roomId].messages = roomStates[roomId].messages.filter(m => m.id !== id);
      }

      // Broadcast deletion to ALL clients
      io.to(roomId).emit('message-deleted', { id });

      // Remove from MongoDB
      Room.updateOne(
        { roomId },
        { $pull: { messages: { id } } }
      ).catch(err => console.error('DB Error deleting message:', err.message));
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

    socket.on('whiteboard-undo', ({ roomId, strokeGroup }) => {
      if (roomStates[roomId]) {
        if (strokeGroup) {
          roomStates[roomId].strokes = roomStates[roomId].strokes.filter(s => s.strokeGroup !== strokeGroup);
          socket.to(roomId).emit('whiteboard-undo', { strokeGroup });
          Room.updateOne({ roomId }, { $pull: { strokes: { strokeGroup } } }).catch(err => console.error('DB Error undoing stroke group:', err.message));
        } else if (roomStates[roomId].strokes.length > 0) {
          roomStates[roomId].strokes.pop();
          socket.to(roomId).emit('whiteboard-undo');
          Room.updateOne({ roomId }, { $pop: { strokes: 1 } }).catch(err => console.error('DB Error undoing stroke:', err.message));
        }
      }
    });

    socket.on('whiteboard-cursor-move', ({ roomId, socketId, userId, username, fullName, avatarColor, x, y }) => {
      socket.to(roomId).emit('whiteboard-cursor-update', { socketId, userId, username, fullName, avatarColor, x, y });
    });

    socket.on('whiteboard-cursor-leave', ({ roomId, socketId }) => {
      socket.to(roomId).emit('whiteboard-cursor-remove', { socketId });
    });

    socket.on('start-presenting', ({ roomId, username }) => {
      roomPresenters[roomId] = username;
      socket.to(roomId).emit('start-presenting', { username });
    });

    socket.on('stop-presenting', ({ roomId }) => {
      delete roomPresenters[roomId];
      socket.to(roomId).emit('stop-presenting');
    });

    socket.on('presenter-sync', ({ roomId, cursor, scroll }) => {
      // Only broadcast; we don't store scroll/cursor in DB
      socket.to(roomId).emit('presenter-sync', { cursor, scroll });
    });

    // --- Phase 2: Test Cases ---
    socket.on('save-test-cases', ({ roomId, testCases }) => {
      if (roomStates[roomId]) {
        roomStates[roomId].testCases = testCases;
      }
      socket.to(roomId).emit('test-cases-sync', testCases);
      Room.updateOne({ roomId }, { testCases }).catch(err => console.error(err));
    });

    socket.on('add-run-history', ({ roomId, runResult }) => {
      if (roomStates[roomId]) {
        roomStates[roomId].runHistory.unshift(runResult);
        if (roomStates[roomId].runHistory.length > 20) roomStates[roomId].runHistory.pop();
      }
      socket.to(roomId).emit('new-run-history', runResult);
      Room.updateOne({ roomId }, { 
        $push: { runHistory: { $each: [runResult], $position: 0, $slice: 20 } } 
      }).catch(err => console.error(err));
    });

    // --- Phase 3: Code Comments ---
    socket.on('add-code-comment', ({ roomId, comment }) => {
      if (roomStates[roomId]) {
        roomStates[roomId].codeComments.push(comment);
      }
      socket.to(roomId).emit('new-code-comment', comment);
      Room.updateOne({ roomId }, { $push: { codeComments: comment } }).catch(err => console.error(err));
    });

    socket.on('resolve-code-comment', ({ roomId, commentId }) => {
      if (roomStates[roomId]) {
        const c = roomStates[roomId].codeComments.find(c => c.id === commentId);
        if (c) c.resolved = true;
      }
      socket.to(roomId).emit('resolve-code-comment', commentId);
      Room.updateOne(
        { roomId, "codeComments.id": commentId },
        { $set: { "codeComments.$.resolved": true } }
      ).catch(err => console.error(err));
    });

    socket.on('reply-code-comment', ({ roomId, commentId, reply }) => {
      if (roomStates[roomId]) {
        const c = roomStates[roomId].codeComments.find(c => c.id === commentId);
        if (c) c.replies.push(reply);
      }
      socket.to(roomId).emit('reply-code-comment', { commentId, reply });
      Room.updateOne(
        { roomId, "codeComments.id": commentId },
        { $push: { "codeComments.$.replies": reply } }
      ).catch(err => console.error(err));
    });

    const leaveRoomHandler = (roomId, socketId) => {
      if (roomUsers[roomId]) {
        const leavingUser = roomUsers[roomId].find(u => u.socketId === socketId);
        roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socketId);
        if (leavingUser) {
          io.to(roomId).emit('user-left', { username: leavingUser.username });
        }
        io.to(roomId).emit('active-users', roomUsers[roomId]);

        // Clean up inactive room cache to prevent memory leaks when room becomes empty
        if (roomUsers[roomId].length === 0) {
          delete roomStates[roomId];
          delete roomUsers[roomId];
          delete roomPresenters[roomId];
          console.log(`Cleaned up memory for inactive room: ${roomId}`);
        }
      }
    };

    socket.on('leave-room', ({ roomId, username }) => {
      socket.leave(roomId);
      leaveRoomHandler(roomId, socket.id);

      // Clean up room call participation
      const call = roomCalls.get(roomId);
      if (call) {
        const currentUserId = socket.data.userId;
        call.participants = call.participants.filter(p => p.userId !== currentUserId && p.socketId !== socket.id);
        if (call.participants.length === 0) {
          call.active = false;
          roomCalls.delete(roomId);
          io.to(roomId).emit('room-call-ended', { roomId });
        } else {
          io.to(roomId).emit('room-call-left', {
            roomId,
            participants: call.participants,
            userId: currentUserId,
            username,
          });
        }
      }
      
      // If the presenter leaves, stop presenting
      if (roomPresenters[roomId] === username) {
        delete roomPresenters[roomId];
        io.to(roomId).emit('stop-presenting');
      }

      currentRoomId = null;
      console.log(`${username} left room ${roomId}`);
    });

    socket.on('user-editing', ({ roomId }) => {
      if (roomUsers[roomId]) {
        roomUsers[roomId] = roomUsers[roomId].map(u =>
          u.socketId === socket.id ? { ...u, isEditing: true } : u
        );
        io.to(roomId).emit('active-users', roomUsers[roomId]);
      }
    });

    socket.on('user-idle', ({ roomId }) => {
      if (roomUsers[roomId]) {
        roomUsers[roomId] = roomUsers[roomId].map(u =>
          u.socketId === socket.id ? { ...u, isEditing: false } : u
        );
        io.to(roomId).emit('active-users', roomUsers[roomId]);
      }
    });

    socket.on('disconnecting', () => {
      const currentUserId = socket.data.userId;
      // Clean up room call participation
      for (const [roomId, call] of roomCalls) {
        if (call.participants.some(p => p.socketId === socket.id)) {
          call.participants = call.participants.filter(p => p.socketId !== socket.id);
          if (call.participants.length === 0) {
            call.active = false;
            roomCalls.delete(roomId);
            io.to(roomId).emit('room-call-ended', { roomId });
          } else {
            io.to(roomId).emit('room-call-left', {
              roomId,
              participants: call.participants,
              userId: currentUserId,
              username: currentUsername || 'Unknown',
            });
          }
        }
      }

      const rooms = Array.from(socket.rooms);
      rooms.forEach(roomId => {
        if (roomId !== socket.id) {
          leaveRoomHandler(roomId, socket.id);
        }
      });
    });

    // ─── Direct Chat (User Discovery) Events ───
    socket.on('user-online', ({ userId }) => {
      if (userId) {
        if (!onlineUsers[userId]) onlineUsers[userId] = [];
        if (!onlineUsers[userId].includes(socket.id)) {
          onlineUsers[userId].push(socket.id);
        }
        socket.data.userId = userId;
        io.emit('user-status-changed', { userId, online: true });
      }
    });

    socket.on('join-dm', ({ conversationId }) => {
      if (conversationId) {
        socket.join(`dm:${conversationId}`);
      }
    });

    socket.on('leave-dm', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`dm:${conversationId}`);
      }
    });

    socket.on('direct-message', async ({ conversationId, text, senderId, recipientId, replyToMessageId }) => {
      try {
        // Check block status: if either side blocked the other, reject
        const [blockedByRecipient, blockedBySender] = await Promise.all([
          BlockedUser.findOne({ blocker: recipientId, blocked: senderId }),
          BlockedUser.findOne({ blocker: senderId, blocked: recipientId }),
        ]);
        if (blockedByRecipient) {
          socket.emit('direct-message-blocked', {
            conversationId,
            message: 'You cannot send messages to this user.',
          });
          return;
        }
        if (blockedBySender) {
          socket.emit('direct-message-blocked', {
            conversationId,
            message: 'Unblock this user to send messages.',
          });
          return;
        }

        // Handle replyTo
        let replyToData = null;
        if (replyToMessageId) {
          const originalMsg = await DirectMessage.findById(replyToMessageId);
          if (!originalMsg) {
            socket.emit('direct-message-error', {
              conversationId,
              message: 'The message you are replying to was not found.',
            });
            return;
          }
          if (String(originalMsg.conversation) !== String(conversationId)) {
            socket.emit('direct-message-error', {
              conversationId,
              message: 'Cannot reply to a message from a different conversation.',
            });
            return;
          }
          const originalSender = await User.findById(originalMsg.sender).select('username fullName');
          replyToData = {
            messageId: originalMsg._id,
            sender: originalMsg.sender,
            senderName: originalSender?.fullName || originalSender?.username || 'Unknown',
            text: originalMsg.text,
            createdAt: originalMsg.createdAt,
          };
        }

        const msg = new DirectMessage({
          conversation: conversationId,
          sender: senderId,
          text,
          replyTo: replyToData,
        });
        await msg.save();

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: { text, sender: senderId, timestamp: new Date() },
          $inc: { [`unread.${recipientId}`]: 1 },
        });

        const populated = await DirectMessage.findById(msg._id)
          .populate('sender', 'username fullName avatarColor');

        const plain = populated.toObject({ getters: true });
        plain._id = String(plain._id);
        plain.conversation = String(plain.conversation);
        if (plain.sender) plain.sender._id = String(plain.sender._id);
        if (plain.replyTo?.messageId) plain.replyTo.messageId = String(plain.replyTo.messageId);
        if (plain.replyTo?.sender) plain.replyTo.sender = String(plain.replyTo.sender);

        // Always emit back to sender immediately
        socket.emit('direct-message', plain);
        // Broadcast to all other participants in the room
        socket.to(`dm:${conversationId}`).emit('direct-message', plain);
      } catch (err) {
        console.error('Error handling direct message:', err.message);
      }
    });

    socket.on('direct-message-edit', async ({ conversationId, messageId, text }) => {
      try {
        const msg = await DirectMessage.findById(messageId);
        if (!msg) return;
        // Verify sender owns this message
        const userId = socket.data.userId;
        if (msg.sender.toString() !== userId) return;

        msg.text = text;
        msg.isEdited = true;
        await msg.save();

        io.to(`dm:${conversationId}`).emit('direct-message-edited', {
          _id: String(msg._id),
          text: msg.text,
          isEdited: msg.isEdited,
          conversation: String(msg.conversation),
        });
      } catch (err) {
        console.error('Error editing direct message:', err.message);
      }
    });

    socket.on('direct-message-delete', async ({ conversationId, messageId }) => {
      try {
        const msg = await DirectMessage.findById(messageId);
        if (!msg) return;
        const userId = socket.data.userId;
        if (msg.sender.toString() !== userId) return;

        await DirectMessage.findByIdAndDelete(messageId);

        io.to(`dm:${conversationId}`).emit('direct-message-deleted', {
          _id: String(messageId),
          conversation: String(msg.conversation),
        });
      } catch (err) {
        console.error('Error deleting direct message:', err.message);
      }
    });

    socket.on('direct-typing-start', ({ conversationId, userId, username }) => {
      socket.to(`dm:${conversationId}`).emit('direct-typing-start', { conversationId, userId, username });
    });

    socket.on('direct-typing-stop', ({ conversationId, userId, username }) => {
      socket.to(`dm:${conversationId}`).emit('direct-typing-stop', { conversationId, userId, username });
    });

    // ─── Direct Audio Call Socket Events ───
    socket.on('direct-call-initiate', async ({ conversationId, receiverId }) => {
      try {
        const currentUserId = socket.data.userId;
        if (!currentUserId || !conversationId || !receiverId) return;
        if (!mongoose.Types.ObjectId.isValid(conversationId)) return;

        const conversation = await Conversation.findById(conversationId).select('participants');
        if (!conversation) {
          socket.emit('direct-call-unavailable', { message: 'Conversation not found' });
          return;
        }

        const isParticipant = conversation.participants.some(
          p => String(p) === String(currentUserId)
        );
        if (!isParticipant) {
          socket.emit('direct-call-unavailable', { message: 'Not a participant' });
          return;
        }

        const isOtherParticipant = conversation.participants.some(
          p => String(p) === String(receiverId)
        );
        if (!isOtherParticipant) {
          socket.emit('direct-call-unavailable', { message: 'Receiver is not in this conversation' });
          return;
        }

        if (String(currentUserId) === String(receiverId)) {
          socket.emit('direct-call-unavailable', { message: 'Cannot call yourself' });
          return;
        }

        const blockExists = await BlockedUser.findOne({
          $or: [
            { blocker: currentUserId, blocked: receiverId },
            { blocker: receiverId, blocked: currentUserId },
          ],
        });
        if (blockExists) {
          socket.emit('direct-call-unavailable', {
            message: 'Audio call unavailable for blocked conversations',
          });
          return;
        }

        const receiverSockets = getSocketIds(receiverId);
        if (receiverSockets.length === 0) {
          socket.emit('direct-call-unavailable', { message: 'User is offline' });
          return;
        }

        for (const [, call] of pendingCalls) {
          if (
            (call.callerId === currentUserId || call.receiverId === currentUserId) &&
            call.status === 'ringing'
          ) {
            socket.emit('direct-call-unavailable', { message: 'Call already in progress' });
            return;
          }
        }

        const caller = await User.findById(currentUserId).select('username fullName avatarColor');
        if (!caller) return;
        const receiver = await User.findById(receiverId).select('username fullName avatarColor');
        if (!receiver) return;

        const callId = generateCallId();
        const callRecord = {
          callId, conversationId, callerId: currentUserId, receiverId,
          callerName: caller.fullName || caller.username,
          callerUsername: caller.username,
          callerAvatar: caller.avatarColor || '#6366f1',
          receiverName: receiver.fullName || receiver.username,
          receiverUsername: receiver.username,
          receiverAvatar: receiver.avatarColor || '#6366f1',
          status: 'ringing', createdAt: Date.now(), timeout: null,
        };

        callRecord.timeout = setTimeout(() => {
          if (pendingCalls.has(callId) && pendingCalls.get(callId).status === 'ringing') {
            pendingCalls.get(callId).status = 'timeout';
            emitToUser(currentUserId, 'direct-call-timeout', {
              callId, conversationId,
              message: "They didn't pick the phone",
            });
            emitToUser(receiverId, 'direct-call-missed', { callId, conversationId });
            pendingCalls.delete(callId);
          }
        }, 30000);

        pendingCalls.set(callId, callRecord);

        emitToUser(receiverId, 'incoming-direct-call', {
          callId, conversationId, callerId: currentUserId,
          callerName: caller.fullName || caller.username,
          callerUsername: caller.username,
          callerAvatar: caller.avatarColor || '#6366f1',
          startedAt: callRecord.createdAt, timeoutSeconds: 30,
        });

        socket.emit('direct-call-ringing', {
          callId, conversationId, receiverId, timeoutSeconds: 30,
        });
      } catch (err) {
        console.error('direct-call-initiate error:', err.message);
      }
    });

    socket.on('direct-call-accept', async ({ callId }) => {
      const call = pendingCalls.get(callId);
      if (!call || call.status !== 'ringing') return;
      const currentUserId = socket.data.userId;
      if (String(currentUserId) !== String(call.receiverId)) return;

      clearTimeout(call.timeout);
      call.status = 'accepted';
      pendingCalls.delete(callId);

      const payload = { callId, conversationId: call.conversationId, channel: `codesync-dm-${call.conversationId}` };
      emitToUser(call.callerId, 'direct-call-accepted', payload);
      socket.emit('direct-call-accepted', payload);
    });

    socket.on('direct-call-reject', ({ callId }) => {
      const call = pendingCalls.get(callId);
      if (!call || call.status !== 'ringing') return;
      const currentUserId = socket.data.userId;
      if (String(currentUserId) !== String(call.receiverId)) return;

      clearTimeout(call.timeout);
      call.status = 'rejected';
      pendingCalls.delete(callId);
      emitToUser(call.callerId, 'direct-call-rejected', {
        callId, conversationId: call.conversationId, message: 'Call declined',
      });
    });

    socket.on('direct-call-cancel', ({ callId }) => {
      const call = pendingCalls.get(callId);
      if (!call || call.status !== 'ringing') return;
      const currentUserId = socket.data.userId;
      if (String(currentUserId) !== String(call.callerId)) return;

      clearTimeout(call.timeout);
      call.status = 'cancelled';
      pendingCalls.delete(callId);
      emitToUser(call.receiverId, 'direct-call-cancelled', {
        callId, conversationId: call.conversationId, message: 'Call cancelled',
      });
    });

    socket.on('direct-call-ended', ({ callId, conversationId }) => {
      const currentUserId = socket.data.userId;
      socket.to(`dm:${conversationId}`).emit('direct-call-ended', {
        callId, conversationId, endedBy: currentUserId,
      });
    });

    // ─── Room Audio Call Socket Events ───
    socket.on('room-call-start', ({ roomId }) => {
      const currentUserId = socket.data.userId;
      if (!currentUserId || !roomId) return;
      if (!socket.rooms.has(roomId)) return;

      if (roomCalls.has(roomId) && roomCalls.get(roomId).active) {
        socket.emit('room-call-error', { message: 'Room call already active' });
        return;
      }

      const username = currentUsername || 'Unknown';
      roomCalls.set(roomId, {
        roomId,
        active: true,
        participants: [{ userId: currentUserId, username, socketId: socket.id }],
      });

      io.to(roomId).emit('room-call-started', {
        roomId,
        participants: roomCalls.get(roomId).participants,
      });
    });

    socket.on('room-call-join', ({ roomId }) => {
      const currentUserId = socket.data.userId;
      if (!currentUserId || !roomId) return;
      if (!socket.rooms.has(roomId)) return;

      const call = roomCalls.get(roomId);
      if (!call || !call.active) {
        socket.emit('room-call-error', { message: 'No active room call to join' });
        return;
      }

      const alreadyJoined = call.participants.some(p => p.userId === currentUserId);
      if (!alreadyJoined) {
        call.participants.push({ userId: currentUserId, username: currentUsername || 'Unknown', socketId: socket.id });
      }

      io.to(roomId).emit('room-call-joined', {
        roomId,
        participants: call.participants,
        userId: currentUserId,
        username: currentUsername || 'Unknown',
      });
    });

    socket.on('room-call-leave', ({ roomId }) => {
      const currentUserId = socket.data.userId;
      if (!currentUserId || !roomId) return;

      const call = roomCalls.get(roomId);
      if (!call) return;

      call.participants = call.participants.filter(p => p.userId !== currentUserId);

      if (call.participants.length === 0) {
        call.active = false;
        roomCalls.delete(roomId);
        io.to(roomId).emit('room-call-ended', { roomId });
      } else {
        io.to(roomId).emit('room-call-left', {
          roomId,
          participants: call.participants,
          userId: currentUserId,
          username: currentUsername || 'Unknown',
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      const userId = socket.data.userId;
      if (userId && onlineUsers[userId]) {
        onlineUsers[userId] = onlineUsers[userId].filter(sid => sid !== socket.id);
        if (onlineUsers[userId].length === 0) {
          delete onlineUsers[userId];
          io.emit('user-status-changed', { userId, online: false });
          // Clean up any pending calls for this user
          cleanupCallForUser(userId);
        }
      }
    });
  });
};

module.exports = { socketHandler, roomUsers, roomStates, roomPresenters, roomAdmins, onlineUsers, pendingCalls, roomCalls };
