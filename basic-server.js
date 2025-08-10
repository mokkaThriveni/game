const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Crypto Crash Game Backend is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
    return;
  }

  // Game API endpoint
  if (req.url === '/api/game/current') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      game: {
        status: 'waiting',
        timeRemaining: 10000,
        currentMultiplier: 1.00,
        totalBets: 0,
        totalAmount: 0
      }
    }));
    return;
  }

  // Serve static files
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
              <title>Crypto Crash Game</title>
              <style>
                  body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
                  .status { color: green; font-weight: bold; font-size: 24px; }
                  .info { margin: 20px 0; }
              </style>
          </head>
          <body>
              <h1>🚀 Crypto Crash Game Backend</h1>
              <p class="status">✅ Server is running successfully!</p>
              <div class="info">
                  <p><strong>Health Check:</strong> <a href="/health">/health</a></p>
                  <p><strong>Game API:</strong> <a href="/api/game/current">/api/game/current</a></p>
              </div>
              <p>This is a basic server running without external dependencies.</p>
          </body>
          </html>
        `);
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
    return;
  }

  // 404 handler
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    message: 'Endpoint not found'
  }));
});

const PORT = 1256;
server.listen(PORT, () => {
  console.log(`🚀 Crypto Crash Game Backend running on port ${PORT}`);
  console.log(`📊 Environment: development`);
  console.log(`🌐 Open http://localhost:${PORT} in your browser`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🎮 Game API: http://localhost:${PORT}/api/game/current`);
});
