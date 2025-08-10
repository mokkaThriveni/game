const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Crypto Crash Game Backend is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Simple game endpoint
app.get('/api/game/current', (req, res) => {
  res.json({
    success: true,
    game: {
      status: 'waiting',
      timeRemaining: 10000,
      currentMultiplier: 1.00,
      totalBets: 0,
      totalAmount: 0
    }
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Send current game state
  socket.emit('gameState', {
    status: 'waiting',
    timeRemaining: 10000,
    currentMultiplier: 1.00,
    totalBets: 0,
    totalAmount: 0
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = 1256;
server.listen(PORT, () => {
  console.log(`🚀 Crypto Crash Game Backend running on port ${PORT}`);
  console.log(`📊 Environment: development`);
  console.log(`🎮 Game rounds: 10000ms`);
  console.log(`⚡ Multiplier updates: 100ms`);
  console.log(`🌐 Open http://localhost:${PORT} in your browser`);
});
