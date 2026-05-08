const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const debateRoutes = require('./routes/debate');
const fileRoutes = require('./routes/files');
const WebSocketHandler = require('./websocket/handler');

const app = express();
const PORT = process.env.PORT || 9528;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/debate', debateRoutes);
app.use('/api/files', fileRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`[Server] Backend running on port ${PORT}`);
});

// WebSocket server
const wss = new WebSocketServer({ server });
const wsHandler = new WebSocketHandler(wss);

console.log('[WebSocket] Server initialized');

// Export for testing
module.exports = { app, server, wss };
