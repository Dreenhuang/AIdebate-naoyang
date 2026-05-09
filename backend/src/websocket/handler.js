const debateService = require('../services/debateService');
const { DebateEngine } = require('../services/debateEngine');

class WebSocketHandler {
  constructor(wss) {
    this.wss = wss;
    this.clients = new Set();
    this.debateEngine = null;

    // 设置 debateService 的广播回调
    debateService.setBroadcastCallback((type, payload) => {
      this.broadcast(type, payload);
    });

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
      // 🔥 V2.2 新增：取消当前请求
      case 'debate:cancel':
        this.handleDebateCancel();
        break;
      default:
        console.log(`[WebSocket] Unknown message type: ${type}`);
    }
  }

  async handleDebateStart(config) {
    try {
      this.debateEngine = new DebateEngine({
        id: `debate-${Date.now()}`,
        topic: config.topic,
        roles: config.roles,
        maxRounds: config.roundsPerPhase || 5,
        maxPhases: config.totalPhases || 4,
        // 🔥 新增：传递输出深度和模式配置
        outputDepth: config.outputDepth || 'normal',
        modeId: config.modeId,
        displayStyle: config.displayStyle,
      });

      this.setupDebateEngineListeners();

      await this.debateEngine.start();
    } catch (error) {
      console.error('[Debate] Start error:', error);
      this.broadcast('debate:error', { message: error.message });
    }
  }

  setupDebateEngineListeners() {
    if (!this.debateEngine) return;

    this.debateEngine.on('debate:started', (data) => {
      this.broadcast('debate:started', data);
    });

    this.debateEngine.on('debate:phase', (data) => {
      this.broadcast('debate:phase', data);
    });

    this.debateEngine.on('debate:round', (data) => {
      this.broadcast('debate:round', data);
    });

    // 🔥 修复：监听并转发辩论消息事件
    this.debateEngine.on('debate:message', (data) => {
      this.broadcast('debate:message', data);
    });

    // 🔥 新增：监听探查阶段事件
    this.debateEngine.on('debate:probe', (data) => {
      this.broadcast('debate:probe', data);
    });

    this.debateEngine.on('debate:consensus', (data) => {
      this.broadcast('debate:consensus', data);
    });

    this.debateEngine.on('debate:backtrack', (data) => {
      this.broadcast('debate:backtrack', data);
    });

    this.debateEngine.on('debate:complete', (data) => {
      this.broadcast('debate:complete', data);
    });

    // 🔥 新增：监听文件生成事件
    this.debateEngine.on('debate:files-generated', (data) => {
      console.log('[WebSocket] Files generated:', data.files?.length, 'files');
      this.broadcast('debate:files-generated', data);
    });

    // 🔥 新增 V2.1：监听 API 调用状态事件（解决卡死问题）
    this.debateEngine.on('debate:status', (data) => {
      console.log(`[WebSocket] Status update: ${data.status} - ${data.message}`);
      this.broadcast('debate:status', data);
    });

    // 🔥 V2.2 新增：监听流式输出事件
    this.debateEngine.on('debate:stream:start', (data) => {
      console.log('[WebSocket] Stream started');
      this.broadcast('debate:stream:start', data);
    });

    this.debateEngine.on('debate:stream:chunk', (data) => {
      // 流式数据块 - 高频发送，只广播不记录日志
      this.broadcast('debate:stream:chunk', data);
    });

    this.debateEngine.on('debate:stream:end', (data) => {
      console.log(`[WebSocket] Stream ended (${data.contentLength} chars)`);
      this.broadcast('debate:stream:end', data);
    });

    this.debateEngine.on('debate:stream:cancelled', (data) => {
      console.log('[WebSocket] Stream cancelled');
      this.broadcast('debate:stream:cancelled', data);
    });

    this.debateEngine.on('debate:stream:error', (data) => {
      console.error('[WebSocket] Stream error:', data.error);
      this.broadcast('debate:stream:error', data);
    });

    this.debateEngine.on('debate:stopped', (data) => {
      this.broadcast('debate:stopped', data);
    });
  }

  handleDebateStop() {
    if (this.debateEngine) {
      this.debateEngine.stop();
    }
    debateService.stopDebate();
    this.broadcast('debate:stopped', { timestamp: new Date().toISOString() });
  }

  handleDebateReset() {
    if (this.debateEngine) {
      this.debateEngine.stop();
      this.debateEngine = null;
    }
    debateService.resetDebate();
    this.broadcast('debate:reset', { timestamp: new Date().toISOString() });
  }

  /**
   * 🔥 V2.2 新增：取消当前正在进行的请求
   */
  handleDebateCancel() {
    console.log('[WebSocket] 🛑 收到取消请求');

    if (this.debateEngine) {
      const cancelled = this.debateEngine.cancelCurrentRequest();
      if (cancelled) {
        this.broadcast('debate:cancelled', {
          message: '已取消当前生成',
          timestamp: new Date().toISOString(),
        });
      } else {
        this.broadcast('debate:cancel-failed', {
          message: '没有可取消的请求',
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      this.broadcast('debate:cancel-failed', {
        message: '辩论引擎未运行',
        timestamp: new Date().toISOString(),
      });
    }
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
