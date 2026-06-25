const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const Conversation = require('../models/Conversation');
const Room = require('../models/Room');
const BlockedUser = require('../models/BlockedUser');

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

// POST /api/agora/direct-token
router.post('/direct-token', auth, async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, message: 'Invalid conversation ID' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const currentUserId = req.user.id;

    const isParticipant = conversation.participants.some(
      p => String(p) === String(currentUserId)
    );
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not a participant of this conversation' });
    }

    const otherParticipant = conversation.participants.find(
      p => String(p) !== String(currentUserId)
    );

    if (otherParticipant) {
      const blockExists = await BlockedUser.findOne({
        $or: [
          { blocker: currentUserId, blocked: otherParticipant },
          { blocker: otherParticipant, blocked: currentUserId },
        ],
      });
      if (blockExists) {
        return res.status(403).json({
          success: false,
          message: 'Audio call unavailable for blocked conversations',
        });
      }
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return res.status(500).json({ success: false, message: 'Agora credentials not configured on server' });
    }

    const channel = `codesync-dm-${conversationId}`;
    const uid = Math.floor(Math.random() * 2147483647);
    const role = RtcRole.PUBLISHER;
    const expireTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expireTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channel,
      uid,
      role,
      privilegeExpiredTs
    );

    return res.json({
      success: true,
      appId,
      channel,
      token,
      uid,
    });
  } catch (err) {
    console.error('Agora token error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to create audio call token' });
  }
});

// POST /api/agora/room-token
router.post('/room-token', auth, async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId || typeof roomId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid room ID' });
    }

    const room = await Room.findOne({ roomId }).select('_id');
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return res.status(500).json({ success: false, message: 'Agora credentials not configured on server' });
    }

    const channel = `codesync-room-${roomId}`;
    const uid = Math.floor(Math.random() * 2147483647);
    const role = RtcRole.PUBLISHER;
    const expireTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expireTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channel,
      uid,
      role,
      privilegeExpiredTs
    );

    return res.json({
      success: true,
      appId,
      channel,
      token,
      uid,
    });
  } catch (err) {
    console.error('Agora room token error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to create room audio call token' });
  }
});

module.exports = router;
