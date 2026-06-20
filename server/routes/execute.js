const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Middleware to verify token
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

const LANGUAGE_MAPPING = {
  'javascript': 63,
  'python': 71,
  'java': 62,
  'cpp': 54,
  'c': 50
};

router.post('/run-code', auth, async (req, res) => {
  try {
    const { source_code, language, stdin } = req.body;
    const language_id = LANGUAGE_MAPPING[language];

    if (!language_id) {
      return res.status(400).json({ message: 'Unsupported language' });
    }

    const options = {
      method: 'POST',
      url: 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        language_id,
        source_code,
        stdin: stdin || ''
      }
    };

    const response = await axios.request(options);
    const result = response.data;

    res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      time: result.time,
      memory: result.memory
    });

  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
    res.status(500).json({ message: 'Error executing code', error: err.response?.data?.message || err.response?.data?.error || err.message });
  }
});

module.exports = router;
