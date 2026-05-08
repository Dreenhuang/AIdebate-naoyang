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

  // Simulation for testing (remove in production)
  simulateDebate() {
    const roles = this.debateState.config?.roles || [];
    let messageCount = 0;
    
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
            
            if (this.debateState.currentPhase > this.debateState.totalPhases) {
              this.debateState.status = 'completed';
              this.addMessage({
                role: 'system',
                content: '辩论已完成！',
                timestamp: new Date().toISOString(),
              });
              clearInterval(interval);
            }
          }
        }
      }
    }, 2000);
  }
}

module.exports = new DebateService();
