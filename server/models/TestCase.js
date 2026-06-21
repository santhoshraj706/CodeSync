const mongoose = require('mongoose');

/**
 * TestCase — standalone collection version of custom test cases.
 * Currently the app uses embedded testCases[] inside Room.
 * This model exists for future migration to a proper separate collection.
 * NOT yet used by active code paths — Room.testCases[] is still live.
 */
const TestCaseSchema = new mongoose.Schema({
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
  label: {
    type: String,
    default: '',
  },
  input: {
    type: String,
    default: '',
  },
  expectedOutput: {
    type: String,
    default: '',
  },
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('TestCase', TestCaseSchema);
