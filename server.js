require('dotenv').config({ path: './config.env' });
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');

// Import services
const GameEngine = require('./services/gameEngine');

const app = express();

// ✅ Fix: trust proxy so express-rate-limit works on Render
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  maxHttpBufferSize: 1e8,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  allowUpgrades: true,
  cookie: false
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Serve static files
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Crypto Crash Game Backend is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('authenticate', (token) => {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      socket.join('authenticated');
      socket.emit('authenticated', { success: true });
    } catch (error) {
      socket.emit('authenticated', { success: false, message: 'Invalid token' });
    }
  });

  socket.on('placeBet', async (betData) => {
    if (!socket.userId) {
      socket.emit('betResult', { success: false, message: 'Not authenticated' });
      return;
    }
    const result = await global.gameEngine.handleBet(socket.userId, betData);
    socket.emit('betResult', result);
  });

  socket.on('cashout', async () => {
    if (!socket.userId) {
      socket.emit('cashoutResult', { success: false, message: 'Not authenticated' });
      return;
    }
    const result = await global.gameEngine.handleCashout(socket.userId);
    socket.emit('cashoutResult', result);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  socket.on('test', (data) => {
    console.log('Test event received:', data);
    socket.emit('testResponse', { message: 'Server received your test!' });
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB');
  global.gameEngine = new GameEngine(io);
  global.gameEngine.init();
  console.log('Game engine initialized');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 1254;
const ENV = process.env.NODE_ENV || 'production';
server.listen(PORT, () => {
  console.log(`🚀 Crypto Crash Game Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${ENV}`);
  console.log(`🎮 Game rounds: ${process.env.GAME_ROUND_DURATION || 10000}ms`);
  console.log(`⚡ Multiplier updates: ${process.env.MULTIPLIER_UPDATE_INTERVAL || 100}ms`);
});
