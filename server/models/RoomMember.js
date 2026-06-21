const mongoose = require('mongoose');

/**
 * RoomMember — tracks each user's participation in a room.
 * Separates membership metadata from the Room document itself.
 * Future use: per-user role, permissions, join/leave timestamps.
 */
const RoomMemberSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'member', 'viewer'],
    default: 'member',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// A user can only be a member of a room once
RoomMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('RoomMember', RoomMemberSchema);
