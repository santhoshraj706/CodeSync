const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const SessionNote = require('../models/SessionNote');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const VALID_STATUSES = ['todo', 'doing', 'done'];

const emitNotesUpdate = async (req, notes, prePopulated, notification) => {
  try {
    const io = req.app.get('io');
    if (io) {
      const payload = prePopulated || (notes ? await SessionNote.findById(notes._id)
        .populate('createdBy', 'username')
        .populate('updatedBy', 'username') : null);
      if (payload) {
        io.to(req.params.roomId).emit('notes-updated', { notes: payload });
      }
      if (notification) {
        io.to(req.params.roomId).emit('notes-notification', { message: notification });
      }
    }
  } catch (err) {
    console.error('[notes-socket] emit error:', err.message);
  }
};

const getRoom = async (roomId, userId) => {
  if (mongoose.connection.readyState !== 1) {
    return { error: { status: 503, message: 'Database not connected' } };
  }
  const room = await Room.findOne({ roomId });
  if (!room) {
    return { error: { status: 404, message: 'Room not found' } };
  }
  if (!room.members.some(m => m.toString() === userId)) {
    return { error: { status: 403, message: 'Not a member of this room' } };
  }
  return { room };
};

const getNotesOrEmpty = (notes) => {
  if (notes) {
    return {
      _id: notes._id,
      aim: notes.aim,
      agenda: notes.agenda,
      tasks: notes.tasks,
      expectedResult: notes.expectedResult,
      decisions: notes.decisions,
      pendingWork: notes.pendingWork,
      createdBy: notes.createdBy,
      updatedBy: notes.updatedBy,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    };
  }
  return {
    aim: '',
    agenda: '',
    tasks: [],
    expectedResult: '',
    decisions: '',
    pendingWork: '',
    createdBy: null,
    updatedBy: null,
    createdAt: null,
    updatedAt: null,
  };
};

// GET /api/rooms/:roomId/notes
router.get('/:roomId/notes', auth, async (req, res) => {
  try {
    const { room, error } = await getRoom(req.params.roomId, req.user.id);
    if (error) return res.status(error.status).json({ message: error.message });

    const notes = await SessionNote.findOne({ room: room._id })
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    res.json({ success: true, notes: getNotesOrEmpty(notes) });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/rooms/:roomId/notes
router.post('/:roomId/notes', auth, async (req, res) => {
  try {
    const { room, error } = await getRoom(req.params.roomId, req.user.id);
    if (error) return res.status(error.status).json({ message: error.message });

    const existing = await SessionNote.findOne({ room: room._id });
    if (existing) {
      return res.status(409).json({ message: 'Notes already exist for this room' });
    }

    const { aim, agenda, tasks, expectedResult, decisions, pendingWork } = req.body;

    if (aim && aim.length > 1000) return res.status(400).json({ message: 'Aim must be 1000 characters or less' });
    if (agenda && agenda.length > 1500) return res.status(400).json({ message: 'Agenda must be 1500 characters or less' });
    if (expectedResult && expectedResult.length > 1000) return res.status(400).json({ message: 'Expected result must be 1000 characters or less' });
    if (decisions && decisions.length > 1500) return res.status(400).json({ message: 'Decisions must be 1500 characters or less' });
    if (pendingWork && pendingWork.length > 1500) return res.status(400).json({ message: 'Pending work must be 1500 characters or less' });

    const notes = new SessionNote({
      room: room._id,
      aim: aim || '',
      agenda: agenda || '',
      tasks: tasks || [],
      expectedResult: expectedResult || '',
      decisions: decisions || '',
      pendingWork: pendingWork || '',
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    await notes.save();

    const populated = await SessionNote.findById(notes._id)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    await emitNotesUpdate(req, null, populated, `${req.user.username} created session notes`);

    res.status(201).json({ success: true, notes: populated });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/rooms/:roomId/notes
router.put('/:roomId/notes', auth, async (req, res) => {
  try {
    const { room, error } = await getRoom(req.params.roomId, req.user.id);
    if (error) return res.status(error.status).json({ message: error.message });

    const { aim, agenda, tasks, expectedResult, decisions, pendingWork } = req.body;

    if (aim && aim.length > 1000) return res.status(400).json({ message: 'Aim must be 1000 characters or less' });
    if (agenda && agenda.length > 1500) return res.status(400).json({ message: 'Agenda must be 1500 characters or less' });
    if (expectedResult && expectedResult.length > 1000) return res.status(400).json({ message: 'Expected result must be 1000 characters or less' });
    if (decisions && decisions.length > 1500) return res.status(400).json({ message: 'Decisions must be 1500 characters or less' });
    if (pendingWork && pendingWork.length > 1500) return res.status(400).json({ message: 'Pending work must be 1500 characters or less' });

    let notes = await SessionNote.findOne({ room: room._id });
    if (!notes) {
      notes = new SessionNote({
        room: room._id,
        createdBy: req.user.id,
      });
    }

    if (aim !== undefined) notes.aim = aim;
    if (agenda !== undefined) notes.agenda = agenda;
    if (tasks !== undefined) notes.tasks = tasks;
    if (expectedResult !== undefined) notes.expectedResult = expectedResult;
    if (decisions !== undefined) notes.decisions = decisions;
    if (pendingWork !== undefined) notes.pendingWork = pendingWork;
    notes.updatedBy = req.user.id;

    await notes.save();
    const populated = await SessionNote.findById(notes._id)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    await emitNotesUpdate(req, null, populated, `${req.user.username} updated session notes`);

    res.json({ success: true, notes: populated });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/rooms/:roomId/notes (reset)
router.delete('/:roomId/notes', auth, async (req, res) => {
  try {
    const { room, error } = await getRoom(req.params.roomId, req.user.id);
    if (error) return res.status(error.status).json({ message: error.message });

    let notes = await SessionNote.findOne({ room: room._id });
    if (notes) {
      notes.aim = '';
      notes.agenda = '';
      notes.tasks = [];
      notes.expectedResult = '';
      notes.decisions = '';
      notes.pendingWork = '';
      notes.updatedBy = req.user.id;
      await notes.save();
      await emitNotesUpdate(req, notes, null, `${req.user.username} reset session notes`);
    }

    res.json({ success: true, message: 'Session notes reset successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/rooms/:roomId/notes/tasks
router.post('/:roomId/notes/tasks', auth, async (req, res) => {
  try {
    const { room, error } = await getRoom(req.params.roomId, req.user.id);
    if (error) return res.status(error.status).json({ message: error.message });

    let notes = await SessionNote.findOne({ room: room._id });
    if (!notes) {
      notes = new SessionNote({
        room: room._id,
        createdBy: req.user.id,
        updatedBy: req.user.id,
      });
    }

    const { title, description, assignedTo, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }
    if (title.length > 150) {
      return res.status(400).json({ message: 'Task title must be 150 characters or less' });
    }
    if (description && description.length > 500) {
      return res.status(400).json({ message: 'Task description must be 500 characters or less' });
    }
    if (assignedTo && assignedTo.length > 100) {
      return res.status(400).json({ message: 'Assigned to must be 100 characters or less' });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Status must be one of: todo, doing, done' });
    }

    const taskData = {
      title: title.trim(),
      description: description || '',
      status: status || 'todo',
      assignedTo: assignedTo || '',
    };

    notes.tasks.push(taskData);
    notes.updatedBy = req.user.id;
    await notes.save();

    const populated = await SessionNote.findById(notes._id)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    const taskTitle = taskData.title.length > 40 ? taskData.title.slice(0, 40) + '...' : taskData.title;
    await emitNotesUpdate(req, null, populated, `${req.user.username} added task: ${taskTitle}`);

    res.status(201).json({ success: true, notes: populated });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/rooms/:roomId/notes/tasks/:taskId
router.put('/:roomId/notes/tasks/:taskId', auth, async (req, res) => {
  try {
    const { room, error } = await getRoom(req.params.roomId, req.user.id);
    if (error) return res.status(error.status).json({ message: error.message });

    const notes = await SessionNote.findOne({ room: room._id });
    if (!notes) {
      return res.status(404).json({ message: 'Session notes not found' });
    }

    const task = notes.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title, description, assignedTo, status } = req.body;

    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ message: 'Task title cannot be empty' });
      if (title.length > 150) return res.status(400).json({ message: 'Task title must be 150 characters or less' });
      task.title = title.trim();
    }
    if (description !== undefined) {
      if (description.length > 500) return res.status(400).json({ message: 'Task description must be 500 characters or less' });
      task.description = description;
    }
    if (assignedTo !== undefined) {
      if (assignedTo.length > 100) return res.status(400).json({ message: 'Assigned to must be 100 characters or less' });
      task.assignedTo = assignedTo;
    }
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) return res.status(400).json({ message: 'Status must be one of: todo, doing, done' });
      task.status = status;
    }

    task.updatedAt = new Date();
    notes.updatedBy = req.user.id;
    await notes.save();

    const populated = await SessionNote.findById(notes._id)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    await emitNotesUpdate(req, null, populated, `${req.user.username} updated a task`);

    res.json({ success: true, notes: populated });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PATCH /api/rooms/:roomId/notes/tasks/:taskId/status
router.patch('/:roomId/notes/tasks/:taskId/status', auth, async (req, res) => {
  try {
    const { room, error } = await getRoom(req.params.roomId, req.user.id);
    if (error) return res.status(error.status).json({ message: error.message });

    const notes = await SessionNote.findOne({ room: room._id });
    if (!notes) {
      return res.status(404).json({ message: 'Session notes not found' });
    }

    const task = notes.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Status must be one of: todo, doing, done' });
    }

    task.status = status;
    task.updatedAt = new Date();
    notes.updatedBy = req.user.id;
    await notes.save();

    const populated = await SessionNote.findById(notes._id)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    await emitNotesUpdate(req, null, populated, `${req.user.username} marked task as ${statusLabel}`);

    res.json({ success: true, notes: populated });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/rooms/:roomId/notes/tasks/:taskId
router.delete('/:roomId/notes/tasks/:taskId', auth, async (req, res) => {
  try {
    const { room, error } = await getRoom(req.params.roomId, req.user.id);
    if (error) return res.status(error.status).json({ message: error.message });

    const notes = await SessionNote.findOne({ room: room._id });
    if (!notes) {
      return res.status(404).json({ message: 'Session notes not found' });
    }

    const task = notes.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.deleteOne();
    notes.updatedBy = req.user.id;
    await notes.save();

    const populated = await SessionNote.findById(notes._id)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    await emitNotesUpdate(req, null, populated, `${req.user.username} deleted a task`);

    res.json({ success: true, notes: populated });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
