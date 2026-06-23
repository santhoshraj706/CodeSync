require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

// Validate required env vars at startup
const REQUIRED_ENV = ['JWT_SECRET', 'MONGO_URI', 'GEMINI_API_KEY'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
  console.error('Please set them in a .env file or in your environment.');
  process.exit(1);
}

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const roomRoutes = require('./routes/rooms');
const executeRoutes = require('./routes/execute');
const aiRoutes = require('./routes/ai');
const noteRoutes = require('./routes/note');
const userRoutes = require('./routes/users');
const chatRequestRoutes = require('./routes/chatRequests');
const conversationRoutes = require('./routes/conversations');
const directMessageRoutes = require('./routes/directMessages');
const roomInviteRoutes = require('./routes/roomInvites');
const blockRoutes = require('./routes/blocks');
const { socketHandler } = require('./socket/socket');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || '*';

// Middleware
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

socketHandler(io);
app.set('io', io);

// Health check routes
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'CodeSync Backend is running 🚀' });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CodeSync server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/rooms', noteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat-requests', chatRequestRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/direct-messages', directMessageRoutes);
app.use('/api/room-invites', roomInviteRoutes);
app.use('/api/blocks', blockRoutes);

// Global error handling middleware (must be after routes)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message, err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
