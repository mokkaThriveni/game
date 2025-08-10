const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Crypto Crash Game - Simple Test</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .status { color: green; font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>🚀 Crypto Crash Game Backend</h1>
        <p class="status">✅ Server is running successfully!</p>
        <p>This is a simple test to verify the server is working.</p>
        <p>Next steps:</p>
        <ul>
            <li>Install all dependencies: <code>npm install</code></li>
            <li>Start the full server: <code>node server.js</code></li>
            <li>Access the game demo at: <a href="http://localhost:1256">http://localhost:1256</a></li>
        </ul>
    </body>
    </html>
  `);
});

const PORT = 1256;
server.listen(PORT, () => {
  console.log(`✅ Simple test server running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} in your browser`);
});
