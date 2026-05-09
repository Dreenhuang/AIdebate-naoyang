const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

class DebateService {
  constructor() {
    this.debateState = {
      status: 'idle',
      currentPhase: 0,
      currentRound: 0,
      totalPhases: 5,
      totalRounds: 5,
      commitments: [],
      messages: [],
      config: null,
    };
    this.debateDir = path.join(process.cwd(), '..', '..', 'debates');
    this.soulsFile = path.join(process.cwd(), '..', 'data', 'customSouls.json');
    this.broadcastCallback = null;
  }

  setBroadcastCallback(callback) {
    this.broadcastCallback = callback;
  }

  broadcast(type, payload) {
    if (this.broadcastCallback) {
      this.broadcastCallback(type, payload);
    }
  }

  async startDebate(config) {
    console.log('[Debate] Starting debate with config:', config);
    
    this.debateState = {
      ...this.debateState,
      status: 'running',
      currentPhase: 1,
      currentRound: 1,
      totalPhases: config.totalPhases || 5,
      totalRounds: config.roundsPerPhase || 5,
      config,
      messages: [],
      commitments: [],
    };

    // Add system message
    this.addMessage({
      role: 'system',
      content: `辩论开始: ${config.topic}`,
      timestamp: new Date().toISOString(),
    });

    // Simulate debate progression (in real implementation, this would call AI APIs)
    this.simulateDebate();
  }

  stopDebate() {
    console.log('[Debate] Stopping debate');
    this.debateState.status = 'idle';
    
    this.addMessage({
      role: 'system',
      content: '辩论已停止',
      timestamp: new Date().toISOString(),
    });
  }

  resetDebate() {
    console.log('[Debate] Resetting debate');
    this.debateState = {
      status: 'idle',
      currentPhase: 0,
      currentRound: 0,
      totalPhases: 5,
      totalRounds: 5,
      commitments: [],
      messages: [],
      config: null,
    };
  }

  addMessage(message) {
    this.debateState.messages.push(message);
    // 广播消息给客户端
    this.broadcast('debate:message', message);
  }

  async loadDebateState(slug) {
    try {
      const statePath = path.join(this.debateDir, slug, '.debate-state');
      const content = await fs.readFile(statePath, 'utf8');
      return yaml.load(content);
    } catch (error) {
      console.error('[Debate] Load state error:', error);
      return null;
    }
  }

  getState() {
    return { ...this.debateState };
  }

  // ===== Soul预设管理 =====
  
  async loadCustomSouls() {
    try {
      const content = await fs.readFile(this.soulsFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      // 文件不存在时返回空对象
      return {};
    }
  }

  async saveCustomSouls(souls) {
    try {
      await fs.mkdir(path.dirname(this.soulsFile), { recursive: true });
      await fs.writeFile(this.soulsFile, JSON.stringify(souls, null, 2));
      return true;
    } catch (error) {
      console.error('[Debate] Save custom souls error:', error);
      return false;
    }
  }

  async addCustomSoul(roleType, soulConfig) {
    const souls = await this.loadCustomSouls();
    if (!souls[roleType]) {
      souls[roleType] = [];
    }
    
    const newSoul = {
      ...soulConfig,
      id: `custom-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    souls[roleType].push(newSoul);
    await this.saveCustomSouls(souls);
    return newSoul;
  }

  async updateCustomSoul(roleType, soulId, updates) {
    const souls = await this.loadCustomSouls();
    if (!souls[roleType]) return false;
    
    const index = souls[roleType].findIndex(s => s.id === soulId);
    if (index === -1) return false;
    
    souls[roleType][index] = { ...souls[roleType][index], ...updates };
    await this.saveCustomSouls(souls);
    return true;
  }

  async removeCustomSoul(roleType, soulId) {
    const souls = await this.loadCustomSouls();
    if (!souls[roleType]) return false;
    
    souls[roleType] = souls[roleType].filter(s => s.id !== soulId);
    await this.saveCustomSouls(souls);
    return true;
  }

  async getAllSouls() {
    const customSouls = await this.loadCustomSouls();
    return customSouls;
  }

  // Simulation for testing (remove in production)
  simulateDebate() {
    const roles = this.debateState.config?.roles || [];
    let messageCount = 0;

    // 广播辩论开始
    this.broadcast('debate:started', {
      topic: this.debateState.config.topic,
      phases: this.debateState.totalPhases,
      totalRounds: this.debateState.totalRounds,
    });

    const interval = setInterval(() => {
      if (this.debateState.status !== 'running') {
        clearInterval(interval);
        return;
      }

      const role = roles[messageCount % roles.length];
      if (role) {
        this.addMessage({
          role: role.name,
          content: `这是${role.name}的第${messageCount + 1}条消息。正在讨论话题：${this.debateState.config.topic}`,
          phase: this.debateState.currentPhase,
          round: this.debateState.currentRound,
          timestamp: new Date().toISOString(),
        });

        // Update phase/round
        messageCount++;
        if (messageCount % 3 === 0) {
          this.debateState.currentRound++;

          if (this.debateState.currentRound > this.debateState.totalRounds) {
            this.debateState.currentPhase++;
            this.debateState.currentRound = 1;

            // 广播阶段更新
            this.broadcast('debate:phase', {
              phase: this.debateState.currentPhase,
              phaseName: `阶段 ${this.debateState.currentPhase}`,
              totalPhases: this.debateState.totalPhases,
              totalRounds: this.debateState.totalRounds,
            });

            if (this.debateState.currentPhase > this.debateState.totalPhases) {
              this.debateState.status = 'completed';

              // 广播辩论完成
              this.broadcast('debate:complete', {
                topic: this.debateState.config.topic,
                totalPhases: this.debateState.currentPhase,
                totalRounds: messageCount,
              });

              this.addMessage({
                role: 'system',
                content: '辩论已完成！',
                timestamp: new Date().toISOString(),
              });
              clearInterval(interval);
              return;
            }
          }

          // 广播轮次更新
          this.broadcast('debate:round', {
            round: this.debateState.currentRound,
            phase: this.debateState.currentPhase,
            totalRounds: this.debateState.totalRounds,
            totalPhases: this.debateState.totalPhases,
          });
        }
      }
    }, 2000);
  }
}

module.exports = new DebateService();
