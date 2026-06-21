const mongoose = require('mongoose');

/**
 * RunHistory — standalone collection version of code execution history.
 * Currently the app uses embedded runHistory[] inside Room.
 * This model exists for future migration to a proper separate collection.
 * NOT yet used by active code paths — Room.runHistory[] is still live.
 */
const RunResultSchema = new mongoose.Schema({
  testCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase', default: null },
  passed: { type: Boolean, default: false },
  actual: { type: String, default: '' },
  stderr: { type: String, default: '' },
  time: { type: String, default: '' },
  memory: { type: String, default: '' },
}, { _id: false });

const RunHistorySchema = new mongoose.Schema({
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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  username: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    default: '',
  },
  passedCount: {
    type: Number,
    default: 0,
  },
  totalCount: {
    type: Number,
    default: 0,
  },
  results: {
    type: [RunResultSchema],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('RunHistory', RunHistorySchema);
