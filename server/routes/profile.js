const express = require('express');
const router = express.Router();
const User = require('../models/User');
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

const VALID_EXPERIENCE = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

router.get('/', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected' });
    }

    const { fullName, username, email, collegeName, experienceLevel, bio, avatarColor } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    const trimmedUsername = username ? username.trim() : '';
    if (!trimmedUsername) {
      return res.status(400).json({ message: 'Username is required' });
    }
    if (trimmedUsername.includes(' ')) {
      return res.status(400).json({ message: 'Username cannot contain spaces' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    if (experienceLevel && !VALID_EXPERIENCE.includes(experienceLevel)) {
      return res.status(400).json({ message: 'Experience level must be one of: Beginner, Intermediate, Advanced, Professional' });
    }

    if (bio && bio.length > 200) {
      return res.status(400).json({ message: 'Bio must be 200 characters or less' });
    }

    const existingUser = await User.findOne({ username: trimmedUsername });
    if (existingUser && existingUser._id.toString() !== req.user.id) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail && existingEmail._id.toString() !== req.user.id) {
      return res.status(400).json({ message: 'Email is already in use' });
    }

    const updateData = {
      fullName: fullName.trim(),
      username: trimmedUsername,
      email,
      collegeName: collegeName ? collegeName.trim() : '',
      experienceLevel: experienceLevel || '',
      bio: bio || '',
      avatarColor: avatarColor || '',
    };

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `${field === 'username' ? 'Username' : 'Email'} is already taken` });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
