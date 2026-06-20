const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const jwt = require('jsonwebtoken');

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

    let room = await Room.findOne({ roomId });
    if (room) {
      return res.status(400).json({ message: 'Room ID already exists' });
    }

    room = new Room({
      roomId,
      roomPassword, // In a real prod app, hash this password as well!
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
