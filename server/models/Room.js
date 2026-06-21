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
  id: String,
  message: String,
  username: String,
  timestamp: String,
  isEdited: { type: Boolean, default: false },
  replyTo: String,
  replyToText: String,
  replyToUser: String,
}, { _id: false });

const TestCaseSchema = new mongoose.Schema({
  id: String,
  input: String,
  expectedOutput: String,
}, { _id: false });

const RunHistorySchema = new mongoose.Schema({
  id: String,
  timestamp: String,
  code: String,
  language: String,
  passedCount: Number,
  totalCount: Number,
  results: Array // Array of execution result objects
}, { _id: false });

const CommentReplySchema = new mongoose.Schema({
  id: String,
  text: String,
  username: String,
  timestamp: String,
}, { _id: false });

const CommentSchema = new mongoose.Schema({
  id: String,
  lineNumber: Number,
  text: String,
  username: String,
  timestamp: String,
  resolved: { type: Boolean, default: false },
  replies: {
    type: [CommentReplySchema],
    default: []
  }
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
  // --- Scalable DB Foundation ---
  // Points to the currently active CodeFile for this room.
  // Null for rooms created before this refactor; a migration fallback
  // in the /rooms/:roomId route creates one on first load if missing.
  activeFile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodeFile',
    default: null,
  },
  testCases: {
    type: [TestCaseSchema],
    default: []
  },
  runHistory: {
    type: [RunHistorySchema],
    default: []
  },
  codeComments: {
    type: [CommentSchema],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
