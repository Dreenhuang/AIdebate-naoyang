const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const debateRoutes = require('./routes/debate');
const fileRoutes = require('./routes/files');
const soulRoutes = require('./routes/souls');
const documentRoutes = require('./routes/documents');
const exportRoutes = require('./routes/exports');
const WebSocketHandler = require('./websocket/handler');

const app = express();
const PORT = process.env.PORT || 9528;

app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// API Routes
app.use('/api/debate', debateRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/souls', soulRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/exports', exportRoutes);

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
