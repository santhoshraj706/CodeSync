const mongoose = require('mongoose');

const StrokeSchema = new mongoose.Schema({
  type: String,
  x0: Number,
  y0: Number,
  x1: Number,
  y1: Number,
  strokeColor: String,
  lineWidth: Number,
  text: String,
  // Sticky note fields
  action: String,
  id: String,
}, { _id: false });

const MessageSchema = new mongoose.Schema({
  message: String,
  username: String,
  timestamp: String,
}, { _id: false });

const RoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  roomPassword: {
    type: String,
    required: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  lastCode: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    default: 'javascript',
  },
  strokes: {
    type: [StrokeSchema],
    default: [],
  },
  messages: {
    type: [MessageSchema],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
