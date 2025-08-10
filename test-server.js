const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello! Server is working!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
