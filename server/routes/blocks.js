const express = require('express');
const router = express.Router();
const BlockedUser = require('../models/BlockedUser');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { onlineUsers } = require('../socket/socket');

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

// POST /api/blocks/:userId - Block a user
router.post('/:userId', auth, async (req, res) => {
  try {
    const blockedId = req.params.userId;
    if (blockedId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot block yourself' });
    }
    const existing = await BlockedUser.findOne({ blocker: req.user.id, blocked: blockedId });
    if (existing) {
      return res.json({ success: true, message: 'User already blocked' });
    }
    const block = new BlockedUser({ blocker: req.user.id, blocked: blockedId });
    await block.save();

    // Notify the blocked user if online
    const io = req.app.get('io');
    const sockets = onlineUsers[blockedId];
    if (sockets) {
      sockets.forEach((sid) => io.to(sid).emit('user-blocked', { userId: req.user.id }));
    }

    res.json({ success: true, message: 'User blocked successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/blocks/:userId - Unblock a user
router.delete('/:userId', auth, async (req, res) => {
  try {
    const blockedId = req.params.userId;
    await BlockedUser.deleteOne({ blocker: req.user.id, blocked: blockedId });

    // Notify the unblocked user if online
    const io = req.app.get('io');
    const sockets = onlineUsers[blockedId];
    if (sockets) {
      sockets.forEach((sid) => io.to(sid).emit('user-unblocked', { userId: req.user.id }));
    }

    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/blocks - Get users blocked by current user
router.get('/', auth, async (req, res) => {
  try {
    const blocks = await BlockedUser.find({ blocker: req.user.id })
      .populate('blocked', '_id fullName username avatarColor profileImageUrl bio collegeName experienceLevel');
    const users = blocks.map(b => b.blocked);
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/blocks/status/:userId - Check block relationship
router.get('/status/:userId', auth, async (req, res) => {
  try {
    const otherId = req.params.userId;
    const [blockedByMe, blockedMe] = await Promise.all([
      BlockedUser.findOne({ blocker: req.user.id, blocked: otherId }),
      BlockedUser.findOne({ blocker: otherId, blocked: req.user.id }),
    ]);
    res.json({
      blockedByMe: !!blockedByMe,
      blockedMe: !!blockedMe,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
