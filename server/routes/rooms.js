const express = require('express');
const router = Router = express.Router();
const Room = require('../models/Room');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

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
    res.json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
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
    res.status(500).send('Server Error');
  }
});

// Get recent rooms for user
router.get('/recent', auth, async (req, res) => {
  try {
    // Use in-memory fallback if MongoDB connection is not active
    if (mongoose.connection.readyState !== 1) {
      const rooms = memoryRooms.filter(r => r.members.includes(req.user.id));
      return res.json(rooms);
    }

    const rooms = await Room.find({ members: req.user.id }).sort({ updatedAt: -1 }).limit(10);
    res.json(rooms);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
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
    res.json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
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
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
