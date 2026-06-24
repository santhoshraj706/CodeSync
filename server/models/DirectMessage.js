const mongoose = require('mongoose');

const DirectMessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  replyTo: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DirectMessage',
      default: null,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    senderName: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: null,
    },
  },
}, { timestamps: true });

DirectMessageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('DirectMessage', DirectMessageSchema);
