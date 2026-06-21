const mongoose = require('mongoose');

/**
 * CodeFile — stores a single file's content for a room.
 * One room can have multiple CodeFiles (multi-file workspace, future).
 * Currently one default file (main.js) is auto-created per room.
 */
const CodeFileSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  },
  filename: {
    type: String,
    required: true,
    default: 'main.js',
  },
  language: {
    type: String,
    required: true,
    default: 'javascript',
  },
  content: {
    type: String,
    default: '// Write your code here...',
  },
  isDefault: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Compound index: each filename is unique per room
CodeFileSchema.index({ roomId: 1, filename: 1 }, { unique: true });

module.exports = mongoose.model('CodeFile', CodeFileSchema);
