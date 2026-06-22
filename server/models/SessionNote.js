const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150,
  },
  description: {
    type: String,
    default: '',
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['todo', 'doing', 'done'],
    default: 'todo',
  },
  assignedTo: {
    type: String,
    default: '',
    maxlength: 100,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const SessionNoteSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    unique: true,
  },
  aim: {
    type: String,
    default: '',
    maxlength: 1000,
  },
  agenda: {
    type: String,
    default: '',
    maxlength: 1500,
  },
  tasks: {
    type: [TaskSchema],
    default: [],
  },
  expectedResult: {
    type: String,
    default: '',
    maxlength: 1000,
  },
  decisions: {
    type: String,
    default: '',
    maxlength: 1500,
  },
  pendingWork: {
    type: String,
    default: '',
    maxlength: 1500,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('SessionNote', SessionNoteSchema);
