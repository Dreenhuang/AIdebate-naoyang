const debateService = require('../services/debateService');

class WebSocketHandler {
  constructor(wss) {
    this.wss = wss;
    this.clients = new Set();
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('[WebSocket] Client connected');
      this.clients.add(ws);

      // Send initial connection message
      this.sendToClient(ws, 'system:connected', { timestamp: new Date().toISOString() });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('[WebSocket] Message parse error:', error);
        }
      });

      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('[WebSocket] Client error:', error);
        this.clients.delete(ws);
      });
    });
  }

  handleMessage(ws, message) {
    const { type, payload } = message;
    console.log(`[WebSocket] Received: ${type}`, payload);

    switch (type) {
      case 'debate:start':
        this.handleDebateStart(payload);
        break;
      case 'debate:stop':
        this.handleDebateStop();
        break;
      case 'debate:reset':
        this.handleDebateReset();
        break;
      default:
        console.log(`[WebSocket] Unknown message type: ${type}`);
    }
  }

  async handleDebateStart(config) {
    try {
      await debateService.startDebate(config);
      this.broadcast('debate:started', { timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('[Debate] Start error:', error);
      this.broadcast('debate:error', { message: error.message });
    }
  }

  handleDebateStop() {
    debateService.stopDebate();
    this.broadcast('debate:stopped', { timestamp: new Date().toISOString() });
  }

  handleDebateReset() {
    debateService.resetDebate();
    this.broadcast('debate:reset', { timestamp: new Date().toISOString() });
  }

  sendToClient(ws, type, payload) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify({ type, payload }));
    }
  }

  broadcast(type, payload) {
    const message = JSON.stringify({ type, payload });
    this.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  }
}

module.exports = WebSocketHandler;
