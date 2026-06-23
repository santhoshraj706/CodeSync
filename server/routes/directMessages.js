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
    res.status(500).send('Server Error');
  }
});

module.exports = router;
