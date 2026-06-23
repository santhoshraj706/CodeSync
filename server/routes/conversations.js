const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const DirectMessage = require('../models/DirectMessage');
const BlockedUser = require('../models/BlockedUser');
const jwt = require('jsonwebtoken');

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

router.get('/', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate('participants', 'username fullName avatarColor bio collegeName')
      .sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/conversations/frequent - Top 5 frequent collaborators
router.get('/frequent', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate('participants', 'username fullName avatarColor bio collegeName experienceLevel')
      .lean();

    const blockedByMe = await BlockedUser.find({ blocker: req.user.id }).select('blocked').lean();
    const blockedIds = new Set(blockedByMe.map(b => b.blocked.toString()));

    const frequent = [];

    for (const conv of conversations) {
      const other = (conv.participants || []).filter(Boolean).find(p => p._id.toString() !== req.user.id);
      if (!other) continue;
      if (blockedIds.has(other._id.toString())) continue;

      const messageCount = await DirectMessage.countDocuments({ conversation: conv._id });

      frequent.push({
        conversationId: conv._id,
        user: {
          _id: other._id,
          fullName: other.fullName || '',
          username: other.username || '',
          avatarColor: other.avatarColor || '',
          collegeName: other.collegeName || '',
          experienceLevel: other.experienceLevel || '',
        },
        lastMessage: conv.lastMessage?.text || '',
        lastMessageAt: conv.lastMessage?.timestamp || conv.updatedAt,
        messageCount,
        unreadCount: (conv.unread && typeof conv.unread === 'object' ? conv.unread[req.user.id] : 0) || 0,
      });
    }

    frequent.sort((a, b) => {
      const diff = new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      if (diff !== 0) return diff;
      return b.messageCount - a.messageCount;
    });

    res.json({ success: true, data: frequent.slice(0, 5) });
  } catch (err) {
    console.error('Error fetching frequent collaborators:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch frequent collaborators' });
  }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    await Conversation.findByIdAndUpdate(req.params.id, {
      $set: { [`unread.${req.user.id}`]: 0 },
    });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
