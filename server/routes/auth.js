const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// In-memory user store fallback when database connection is down
const memoryUsers = [];

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Use in-memory fallback if MongoDB connection is not active
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, using in-memory signup fallback');
      
      const userExists = memoryUsers.find(u => u.email === email || u.username === username);
      if (userExists) {
        return res.status(400).json({ message: 'User already exists with this email or username' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = {
        id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        username,
        email,
        password: hashedPassword
      };
      memoryUsers.push(newUser);

      const payload = {
        user: { id: newUser.id, username: newUser.username }
      };

      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: newUser.id, username: newUser.username, email: newUser.email, fullName: '', collegeName: '', experienceLevel: '', bio: '', avatarColor: '' } });
      });
      return;
    }
    
    // Check if user exists in database
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'Username is taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    const userData = await User.findById(user.id).select('-password');

    const payload = {
      user: { id: user.id, username: user.username }
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: userData || { id: user.id, username: user.username, email: user.email, fullName: '', collegeName: '', experienceLevel: '', bio: '', avatarColor: '' } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Use in-memory fallback if MongoDB connection is not active
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, using in-memory login fallback');

      const user = memoryUsers.find(u => u.email === email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid Credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid Credentials' });
      }

      const payload = {
        user: { id: user.id, username: user.username }
      };

      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, fullName: user.fullName || '', collegeName: user.collegeName || '', experienceLevel: user.experienceLevel || '', bio: user.bio || '', avatarColor: user.avatarColor || '' } });
      });
      return;
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const userData = await User.findById(user.id).select('-password');

    const payload = {
      user: { id: user.id, username: user.username }
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: userData || { id: user.id, username: user.username, email: user.email, fullName: '', collegeName: '', experienceLevel: '', bio: '', avatarColor: '' } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
