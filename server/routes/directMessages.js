const express = require('express');
const router = express.Router();
const DirectMessage = require('../models/DirectMessage');
const Conversation = require('../models/Conversation');
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

router.get('/:conversationId', auth, async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.conversationId);
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    if (!conv.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not a participant' });
    }
    const messages = await DirectMessage.find({ conversation: req.params.conversationId })
      .populate('sender', 'username fullName avatarColor')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit a direct message (sender only)
router.put('/:messageId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const msg = await DirectMessage.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    if (msg.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    msg.text = text.trim();
    msg.isEdited = true;
    await msg.save();

    const populated = await DirectMessage.findById(msg._id)
      .populate('sender', 'username fullName avatarColor');

    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a direct message (sender only)
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const msg = await DirectMessage.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    if (msg.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await DirectMessage.findByIdAndDelete(req.params.messageId);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
