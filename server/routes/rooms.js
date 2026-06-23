const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const CodeFile = require('../models/CodeFile');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { roomUsers, roomStates, roomPresenters } = require('../socket/socket');

// In-memory room store fallback when database connection is down
const memoryRooms = [];

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Create a room
router.post('/create', auth, async (req, res) => {
  try {
    const { roomId, roomPassword } = req.body;

    // Use in-memory fallback if MongoDB connection is not active
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, using in-memory room creation fallback');

      const roomExists = memoryRooms.find(r => r.roomId === roomId);
      if (roomExists) {
        return res.status(400).json({ message: 'Room ID already exists' });
      }

      const newRoom = {
        roomId,
        roomPassword,
        admin: req.user.id,
        members: [req.user.id],
        lastCode: '// Write your code here...',
        language: 'javascript',
        strokes: [],
        messages: []
      };
      memoryRooms.push(newRoom);
      return res.json(newRoom);
    }

    let room = await Room.findOne({ roomId });
    if (room) {
      return res.status(400).json({ message: 'Room ID already exists' });
    }

    room = new Room({
      roomId,
      roomPassword,
      admin: req.user.id,
      members: [req.user.id]
    });

    await room.save();

    // --- Scalable DB Foundation ---
    // Auto-create a default CodeFile for this new room.
    // This does NOT change anything visible to the user.
    try {
      const defaultFile = new CodeFile({
        roomId: room._id,
        filename: 'main.js',
        language: 'javascript',
        content: '// Write your code here...',
        isDefault: true,
      });
      await defaultFile.save();
      room.activeFile = defaultFile._id;
      await room.save();
      console.log(`[CodeFile] Created default file for room: ${roomId}`);
    } catch (fileErr) {
      // Non-fatal: room still works via lastCode fallback
      console.error('[CodeFile] Failed to create default file:', fileErr.message);
    }

    res.json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a room
router.post('/join', auth, async (req, res) => {
  try {
    const { roomId, roomPassword } = req.body;

    // Use in-memory fallback if MongoDB connection is not active
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, using in-memory room join fallback');

      const room = memoryRooms.find(r => r.roomId === roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      if (room.roomPassword !== roomPassword) {
        return res.status(400).json({ message: 'Invalid room password' });
      }

      if (!room.members.includes(req.user.id)) {
        room.members.push(req.user.id);
      }

      return res.json(room);
    }

    let room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.roomPassword !== roomPassword) {
      return res.status(400).json({ message: 'Invalid room password' });
    }

    // Add user to members if not already
    if (!room.members.includes(req.user.id)) {
      room.members.push(req.user.id);
      await room.save();
    }

    res.json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent rooms for user
router.get('/recent', auth, async (req, res) => {
  try {
    const onlyAdmin = req.query.admin === 'true';

    // Use in-memory fallback if MongoDB connection is not active
    if (mongoose.connection.readyState !== 1) {
      const rooms = memoryRooms.filter(r => onlyAdmin ? r.admin === req.user.id : r.members.includes(req.user.id));
      return res.json(rooms);
    }

    const filter = onlyAdmin ? { admin: req.user.id } : { members: req.user.id };
    const rooms = await Room.find(filter).sort({ updatedAt: -1 }).limit(10);
    res.json(rooms);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get room details
router.get('/:roomId', auth, async (req, res) => {
  try {
    // Use in-memory fallback if MongoDB connection is not active
    if (mongoose.connection.readyState !== 1) {
      const room = memoryRooms.find(r => r.roomId === req.params.roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      if (!room.members.includes(req.user.id)) {
        return res.status(403).json({ message: 'Not a member of this room' });
      }

      const populatedMembers = room.members.map(memberId => ({
        _id: memberId,
        username: memberId === req.user.id ? req.user.username : 'Collaborator'
      }));

      const populatedRoom = {
        ...room,
        members: populatedMembers
      };
      return res.json(populatedRoom);
    }

    const room = await Room.findOne({ roomId: req.params.roomId }).populate('members', 'username');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    // Check if user is member
    if (!room.members.some(member => member._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this room' });
    }

    // --- Backward Compatibility Migration ---
    // If this room was created before the CodeFile refactor, create a
    // default CodeFile from room.lastCode so future features have a file to work with.
    if (!room.activeFile) {
      try {
        // Check if a file already exists for this room (e.g., from a previous partial run)
        let existingFile = await CodeFile.findOne({ roomId: room._id, isDefault: true });
        if (!existingFile) {
          existingFile = new CodeFile({
            roomId: room._id,
            filename: 'main.js',
            language: room.language || 'javascript',
            content: room.lastCode || '// Write your code here...',
            isDefault: true,
          });
          await existingFile.save();
          console.log(`[CodeFile] Migrated legacy room to CodeFile: ${req.params.roomId}`);
        }
        room.activeFile = existingFile._id;
        await room.save();
      } catch (fileErr) {
        // Non-fatal: existing code sync via room.lastCode continues to work
        console.error('[CodeFile] Migration fallback failed:', fileErr.message);
      }
    }

    res.json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a room (admin only) — removes all code, messages, strokes
router.delete('/:roomId', auth, async (req, res) => {
  try {
    // Use in-memory fallback if MongoDB connection is not active
    if (mongoose.connection.readyState !== 1) {
      const roomIndex = memoryRooms.findIndex(r => r.roomId === req.params.roomId);
      if (roomIndex === -1) {
        return res.status(404).json({ message: 'Room not found' });
      }

      if (memoryRooms[roomIndex].admin !== req.user.id) {
        return res.status(403).json({ message: 'Only the room admin can delete this room' });
      }

      memoryRooms.splice(roomIndex, 1);

      // Clean up in-memory socket stores and force-kick connected users
      const roomId = req.params.roomId;
      delete roomStates[roomId];
      delete roomUsers[roomId];
      delete roomPresenters[roomId];
      const ioFallback = req.app.get('io');
      if (ioFallback) {
        ioFallback.to(roomId).emit('room-deleted', { roomId });
      }

      return res.json({ message: 'Room deleted successfully' });
    }

    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Only admin can delete
    if (room.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the room admin can delete this room' });
    }

    await Room.deleteOne({ roomId: req.params.roomId });

    // Clean up in-memory socket stores and force-kick connected users
    delete roomStates[req.params.roomId];
    delete roomUsers[req.params.roomId];
    delete roomPresenters[req.params.roomId];
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.roomId).emit('room-deleted', { roomId: req.params.roomId });
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
