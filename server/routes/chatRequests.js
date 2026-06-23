const express = require('express');
const router = express.Router();
const ChatRequest = require('../models/ChatRequest');
const Conversation = require('../models/Conversation');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

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

router.post('/', auth, async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ message: 'Recipient is required' });
    if (to === req.user.id) return res.status(400).json({ message: 'Cannot send request to yourself' });

    const existing = await ChatRequest.findOne({ from: req.user.id, to, status: 'pending' });
    if (existing) return res.status(400).json({ message: 'Chat request already sent' });

    const reverse = await ChatRequest.findOne({ from: to, to: req.user.id, status: 'pending' });
    if (reverse) return res.status(400).json({ message: 'This user already sent you a request. Accept it instead.' });

    const request = new ChatRequest({ from: req.user.id, to });
    await request.save();
    const populated = await ChatRequest.findById(request._id)
      .populate('from', 'username fullName avatarColor')
      .populate('to', 'username fullName avatarColor');
    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/incoming', auth, async (req, res) => {
  try {
    const requests = await ChatRequest.find({ to: req.user.id, status: 'pending' })
      .populate('from', 'username fullName avatarColor bio collegeName')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/outgoing', auth, async (req, res) => {
  try {
    const requests = await ChatRequest.find({ from: req.user.id })
      .populate('to', 'username fullName avatarColor bio collegeName')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/accept', auth, async (req, res) => {
  try {
    const request = await ChatRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.to.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    request.status = 'accepted';
    await request.save();

    const existingConv = await Conversation.findOne({
      participants: { $all: [request.from, request.to] },
    });
    if (!existingConv) {
      const conv = new Conversation({
        participants: [request.from, request.to],
        unread: { [String(request.from)]: 0, [String(request.to)]: 0 },
      });
      await conv.save();
    }

    const populated = await ChatRequest.findById(request._id)
      .populate('from', 'username fullName avatarColor')
      .populate('to', 'username fullName avatarColor');
    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/reject', auth, async (req, res) => {
  try {
    const request = await ChatRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.to.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    request.status = 'rejected';
    await request.save();
    res.json({ message: 'Request rejected' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
