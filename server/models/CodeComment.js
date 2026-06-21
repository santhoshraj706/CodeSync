const mongoose = require('mongoose');

/**
 * CodeComment — standalone collection version of code line comments.
 * Currently the app uses embedded codeComments[] inside Room.
 * This model exists for future migration to a proper separate collection.
 * NOT yet used by active code paths — Room.codeComments[] is still live.
 */
const CommentReplySchema = new mongoose.Schema({
  text: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String, required: true },
}, { timestamps: true });

const CodeCommentSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodeFile',
    default: null,
  },
  lineNumber: {
    type: Number,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  username: {
    type: String,
    required: true,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  replies: {
    type: [CommentReplySchema],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('CodeComment', CodeCommentSchema);
