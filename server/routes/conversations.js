const express = require('express');
const router = express.Router();
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
    res.status(500).send('Server Error');
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
    res.status(500).send('Server Error');
  }
});

module.exports = router;
