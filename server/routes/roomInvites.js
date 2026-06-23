const express = require('express');
const router = express.Router();
const RoomInvite = require('../models/RoomInvite');
const Room = require('../models/Room');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
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

    // Notify both sender and recipient about the new invite
    try {
      const io = req.app.get('io');
      const payload = {
        ...populated.toObject(),
        fromUserId: req.user.id,
        toUserId: to,
      };
      [req.user.id, to].forEach((uid) => {
        const sockets = onlineUsers[uid];
        if (sockets) {
          sockets.forEach((sid) => io.to(sid).emit('invite-sent', payload));
        }
      });
    } catch (notifyErr) {
      console.error('Failed to notify about invite-sent:', notifyErr.message);
    }

    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
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
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/between/:userId', auth, async (req, res) => {
  try {
    const otherId = req.params.userId;
    const myId = req.user.id;
    const invites = await RoomInvite.find({
      $or: [
        { from: myId, to: otherId },
        { from: otherId, to: myId },
      ],
    })
      .populate('from', 'username fullName avatarColor')
      .populate('to', 'username fullName avatarColor')
      .sort({ createdAt: -1 });
    res.json(invites);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/outgoing', auth, async (req, res) => {
  try {
    const invites = await RoomInvite.find({ from: req.user.id })
      .populate('to', 'username fullName avatarColor')
      .sort({ createdAt: -1 });
    res.json(invites);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
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

    // Notify the sender (invite creator) that their invite was accepted
    try {
      const acceptor = await User.findById(req.user.id).select('username fullName');
      const senderId = invite.from.toString();
      const io = req.app.get('io');
      const payload = {
        fromUserId: req.user.id,
        fromUsername: acceptor?.username || 'Someone',
        fromFullName: acceptor?.fullName || '',
        roomId: invite.roomId,
        note: invite.note || '',
      };
      // Emit to all socket connections of the sender
      const senderSockets = onlineUsers[senderId];
      if (senderSockets) {
        senderSockets.forEach((sid) => {
          io.to(sid).emit('invite-accepted', payload);
        });
      }
    } catch (notifyErr) {
      console.error('Failed to notify sender about accepted invite:', notifyErr.message);
    }

    res.json({ message: 'Invite accepted', roomId: invite.roomId, roomPassword: room.roomPassword });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const invite = await RoomInvite.findById(req.params.id);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    if (invite.from.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    await RoomInvite.findByIdAndDelete(req.params.id);

    // Notify the recipient that this invite was deleted
    try {
      const recipientId = invite.to.toString();
      const io = req.app.get('io');
      const recipientSockets = onlineUsers[recipientId];
      if (recipientSockets) {
        recipientSockets.forEach((sid) => {
          io.to(sid).emit('invite-deleted', { inviteId: req.params.id });
        });
      }
    } catch (notifyErr) {
      console.error('Failed to notify recipient about deleted invite:', notifyErr.message);
    }

    res.json({ message: 'Invite deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
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
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
