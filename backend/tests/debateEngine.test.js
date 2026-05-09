const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');
const { DebateEngine } = require('../src/services/debateEngine');

describe('DebateEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new DebateEngine({
      id: 'test-debate-1',
      topic: 'AI会取代人类的工作吗？',
      roles: [
        { name: '主持人', roleType: 'host', model: 'deepseek' },
        { name: '提案者', roleType: 'proposer', model: 'minimax' },
        { name: '审查者', roleType: 'reviewer', model: 'deepseek' },
      ],
      maxRounds: 3,
      maxPhases: 2,
    });
  });

  describe('构造函数', () => {
    it('应该正确初始化引擎配置', () => {
      expect(engine.id).toBe('test-debate-1');
      expect(engine.topic).toBe('AI会取代人类的工作吗？');
      expect(engine.roles.length).toBe(3);
      expect(engine.maxRounds).toBe(3);
      expect(engine.maxPhases).toBe(2);
    });

    it('应该初始化为 idle 状态', () => {
      expect(engine.status).toBe('idle');
    });

    it('应该初始化空的消息和承诺数组', () => {
      expect(engine.messages.length).toBe(0);
      expect(engine.commitments.length).toBe(0);
      expect(engine.consensus.length).toBe(0);
    });

    it('应该正确初始化阶段配置', () => {
      expect(engine.phases.length).toBe(2);
      expect(engine.phases[0].id).toBe('probe');
      expect(engine.phases[1].id).toBe('design');
    });
  });

  describe('start()', () => {
    it('应该将状态设置为 running', async () => {
      await engine.start();
      expect(engine.status).toBe('running');
    });

    it('应该在运行时抛出错误', async () => {
      await engine.start();
      await expect(engine.start()).rejects.toThrow('已在进行中');
    });

    it('应该重置消息、承诺和共识', async () => {
      engine.messages.push({ test: true });
      engine.commitments.push({ test: true });
      
      await engine.start();
      
      expect(engine.messages.length).toBe(0);
      expect(engine.commitments.length).toBe(0);
    });

    it('应该触发 debate:started 事件', (done) => {
      engine.on('debate:started', (data) => {
        expect(data.id).toBe('test-debate-1');
        expect(data.topic).toBe('AI会取代人类的工作吗？');
        expect(data.phases.length).toBe(2);
        done();
      });
      
      engine.start();
    });
  });

  describe('stop()', () => {
    it('应该将状态设置为 stopped', async () => {
      await engine.start();
      await engine.stop();
      expect(engine.status).toBe('stopped');
    });

    it('应该在非运行状态下抛出错误', async () => {
      await expect(engine.stop()).rejects.toThrow('辩论未在进行中');
    });

    it('应该触发 debate:stopped 事件', (done) => {
      const handler = () => {
        done();
      };
      
      engine.on('debate:stopped', handler);
      engine.start().then(() => engine.stop());
    });
  });

  describe('pause() 和 resume()', () => {
    it('应该暂停正在运行的辩论', async () => {
      await engine.start();
      await engine.pause();
      expect(engine.status).toBe('paused');
    });

    it('应该恢复暂停的辩论', async () => {
      await engine.start();
      await engine.pause();
      await engine.resume();
      expect(engine.status).toBe('running');
    });
  });

  describe('addMessage()', () => {
    it('应该正确添加消息', async () => {
      await engine.start();
      
      const message = {
        type: 'proposal',
        role: 'proposer',
        roleName: '提案者',
        content: '这是提案内容',
        phase: 0,
        round: 1,
        timestamp: new Date().toISOString(),
      };

      engine.addMessage(message);
      
      expect(engine.messages.length).toBe(1);
      expect(engine.messages[0].content).toBe('这是提案内容');
    });

    it('应该触发 debate:message 事件', (done) => {
      engine.on('debate:message', (data) => {
        expect(data.content).toBe('测试消息');
        done();
      });
      
      engine.start().then(() => {
        engine.addMessage({
          content: '测试消息',
          timestamp: new Date().toISOString(),
        });
      });
    });
  });

  describe('addCommitment()', () => {
    it('应该正确添加承诺', async () => {
      await engine.start();
      
      engine.addCommitment({
        text: '承诺：使用 AI 辅助决策',
        phase: 0,
        priority: 'HIGH',
      });

      expect(engine.commitments.length).toBe(1);
      expect(engine.commitments[0].text).toBe('承诺：使用 AI 辅助决策');
    });
  });

  describe('generateConsensus()', () => {
    it('应该生成共识并触发事件', (done) => {
      engine.on('debate:consensus', (consensus) => {
        expect(consensus.phaseName).toBeDefined();
        expect(consensus.summary).toBeDefined();
        expect(Array.isArray(consensus.commitments)).toBeTruthy();
        done();
      });

      engine.start().then(() => {
        engine.generateConsensus();
      });
    });

    it('应该将共识添加到列表中', async () => {
      await engine.start();
      
      engine.generateConsensus();
      
      expect(engine.consensus.length).toBe(1);
    });
  });

  describe('BacktrackValidator', () => {
    it('应该执行回溯校验', async () => {
      await engine.start();

      engine.addCommitment({ text: '承诺1', phase: 0, priority: 'HIGH' });
      engine.addCommitment({ text: '承诺2', phase: 0, priority: 'MEDIUM' });
      engine.generateConsensus();

      const result = await engine.backtrackValidator.validate();
      
      expect(result).toBeDefined();
      expect(['SUPPORTED', 'TENSION', 'CONTRADICTED']).toContain(result.status);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('应该检测到矛盾', async () => {
      await engine.start();

      // 添加矛盾的承诺
      engine.addCommitment({ 
        text: '必须采用 AI 技术', 
        phase: 0, 
        priority: 'HIGH' 
      });
      
      engine.generateConsensus({
        summary: '决定不使用 AI 技术，因为成本太高',
        phaseName: '方案设计',
      });

      const result = await engine.backtrackValidator.validate();
      
      // 应该检测到某种程度的张力或矛盾
      expect(['TENSION', 'CONTRADICTED']).toContain(result.status);
    });
  });

  describe('ContextManager', () => {
    it('应该管理阶段上下文', async () => {
      await engine.start();

      const context = engine.contextManager.getPhaseContext();
      
      expect(context).toBeDefined();
      expect(context.phaseId).toBe('probe');
      expect(context.proposals).toEqual([]);
      expect(context.reviews).toEqual([]);
    });

    it('应该记录提案', async () => {
      await engine.start();

      engine.contextManager.recordProposal({
        content: '提案内容',
        role: 'proposer',
      });

      const context = engine.contextManager.getPhaseContext();
      expect(context.proposals.length).toBe(1);
    });

    it('应该记录审查', async () => {
      await engine.start();

      engine.contextManager.recordReview({
        verdict: 'strong',
        content: '审查通过',
        role: 'reviewer',
      });

      const context = engine.contextManager.getPhaseContext();
      expect(context.reviews.length).toBe(1);
    });
  });

  describe('5选3推进规则', () => {
    it('应该评估推进条件', async () => {
      await engine.start();

      engine.addCommitment({ text: '承诺1', phase: 0, priority: 'HIGH' });
      engine.addCommitment({ text: '承诺2', phase: 0, priority: 'HIGH' });
      engine.addCommitment({ text: '承诺3', phase: 0, priority: 'MEDIUM' });

      const result = engine.evaluateProgression();
      
      expect(result).toHaveProperty('canProgress');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('strongCount');
      expect(result.strongCount).toBeGreaterThanOrEqual(0);
    });
  });
});
