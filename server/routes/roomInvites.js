const express = require('express');
const router = express.Router();
const RoomInvite = require('../models/RoomInvite');
const Room = require('../models/Room');
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

router.post('/', auth, async (req, res) => {
  try {
    const { to, roomId, note } = req.body;
    if (!to || !roomId) return res.status(400).json({ message: 'Recipient and roomId are required' });

    const existing = await RoomInvite.findOne({ from: req.user.id, to, roomId, status: 'pending' });
    if (existing) return res.status(400).json({ message: 'Invite already sent' });

    const invite = new RoomInvite({ from: req.user.id, to, roomId, note: note || '' });
    await invite.save();
    const populated = await RoomInvite.findById(invite._id)
      .populate('from', 'username fullName avatarColor')
      .populate('to', 'username fullName avatarColor');
    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/incoming', auth, async (req, res) => {
  try {
    const invites = await RoomInvite.find({ to: req.user.id, status: 'pending' })
      .populate('from', 'username fullName avatarColor')
      .sort({ createdAt: -1 });
    res.json(invites);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/:id/accept', auth, async (req, res) => {
  try {
    const invite = await RoomInvite.findById(req.params.id);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    if (invite.to.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (invite.status !== 'pending') return res.status(400).json({ message: 'Invite already processed' });

    const room = await Room.findOne({ roomId: invite.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    invite.status = 'accepted';
    await invite.save();

    if (!room.members.includes(req.user.id)) {
      room.members.push(req.user.id);
      await room.save();
    }

    res.json({ message: 'Invite accepted', roomId: invite.roomId, roomPassword: room.roomPassword });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/:id/reject', auth, async (req, res) => {
  try {
    const invite = await RoomInvite.findById(req.params.id);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    if (invite.to.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (invite.status !== 'pending') return res.status(400).json({ message: 'Invite already processed' });

    invite.status = 'rejected';
    await invite.save();
    res.json({ message: 'Invite rejected' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
