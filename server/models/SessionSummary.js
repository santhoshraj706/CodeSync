const mongoose = require('mongoose');

/**
 * SessionSummary — stores AI-generated summaries of coding sessions.
 * Will be used by Phase 4: AI Session Summary feature.
 * NOT yet used by any active code paths.
 */
const SessionSummarySchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Markdown-formatted AI summary
  markdownContent: {
    type: String,
    default: '',
  },
  // Snapshot of the code at time of summary
  codeSnapshot: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    default: 'javascript',
  },
  // Number of chat messages included in the summary
  chatMessagesCount: {
    type: Number,
    default: 0,
  },
  // Number of code comments included
  codeCommentsCount: {
    type: Number,
    default: 0,
  },
  // Model used to generate summary (e.g. "gemini-pro")
  model: {
    type: String,
    default: 'gemini-pro',
  },
}, { timestamps: true });

module.exports = mongoose.model('SessionSummary', SessionSummarySchema);
