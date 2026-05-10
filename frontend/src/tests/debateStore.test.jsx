import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebateStore } from '../src/stores/debateStore';

describe('debateStore', () => {
  beforeEach(() => {
    useDebateStore.setState({
      debateStatus: 'idle',
      currentPhase: 0,
      currentRound: 0,
      messages: [],
      commitments: [],
      consensus: [],
      backtrackResults: [],
      files: [],
      topic: '',
      config: null,
    });
  });

  describe('初始状态', () => {
    it('应该有正确的默认状态', () => {
      const { result } = renderHook(() => useDebateStore());
      
      expect(result.current.debateStatus).toBe('idle');
      expect(result.current.currentPhase).toBe(0);
      expect(result.current.currentRound).toBe(0);
      expect(result.current.messages.length).toBe(0);
      expect(result.current.commitments.length).toBe(0);
      expect(result.current.consensus.length).toBe(0);
    });
  });

  describe('setDebateStatus()', () => {
    it('应该更新辩论状态', () => {
      const { result } = renderHook(() => useDebateStore());
      
      act(() => {
        result.current.setDebateStatus('running');
      });
      
      expect(result.current.debateStatus).toBe('running');
    });
  });

  describe('setPhase() 和 setRound()', () => {
    it('应该正确设置阶段和轮次', () => {
      const { result } = renderHook(() => useDebateStore());
      
      act(() => {
        result.current.setPhase(2);
        result.current.setRound(3);
      });
      
      expect(result.current.currentPhase).toBe(2);
      expect(result.current.currentRound).toBe(3);
    });
  });

  describe('addMessage()', () => {
    it('应该添加消息到列表', () => {
      const { result } = renderHook(() => useDebateStore());
      
      const message1 = { role: '提案者', content: '消息1', timestamp: new Date().toISOString() };
      const message2 = { role: '审查者', content: '消息2', timestamp: new Date().toISOString() };

      act(() => {
        result.current.addMessage(message1);
        result.current.addMessage(message2);
      });
      
      expect(result.current.messages.length).toBe(2);
      expect(result.current.messages[0].role).toBe('提案者');
      expect(result.current.messages[1].role).toBe('审查者');
    });
  });

  describe('addCommitment()', () => {
    it('应该添加承诺到列表', () => {
      const { result } = renderHook(() => useDebateStore());
      
      const commitment = { text: '承诺内容', phase: 0, priority: 'HIGH' };

      act(() => {
        result.current.addCommitment(commitment);
      });
      
      expect(result.current.commitments.length).toBe(1);
      expect(result.current.commitments[0].text).toBe('承诺内容');
    });
  });

  describe('addConsensus()', () => {
    it('应该添加共识到列表', () => {
      const { result } = renderHook(() => useDebateStore());
      
      const consensus = {
        phaseName: '需求探查',
        summary: '共识摘要',
        commitments: ['承诺1', '承诺2'],
      };

      act(() => {
        result.current.addConsensus(consensus);
      });
      
      expect(result.current.consensus.length).toBe(1);
      expect(result.current.consensus[0].phaseName).toBe('需求探查');
    });
  });

  describe('addBacktrackResult()', () => {
    it('应该添加回溯结果到列表', () => {
      const { result } = renderHook(() => useDebateStore());
      
      const backtrackResult = {
        status: 'SUPPORTED',
        overallScore: 90,
        violations: [],
        warnings: [],
        checks: [],
        summary: '校验通过',
      };

      act(() => {
        result.current.addBacktrackResult(backtrackResult);
      });
      
      expect(result.current.backtrackResults.length).toBe(1);
      expect(result.current.backtrackResults[0].status).toBe('SUPPORTED');
    });
  });

  describe('setTopic()', () => {
    it('应该设置话题', () => {
      const { result } = renderHook(() => useDebateStore());
      
      act(() => {
        result.current.setTopic('测试话题');
      });
      
      expect(result.current.topic).toBe('测试话题');
    });
  });

  describe('阶段配置', () => {
    it('应该有预定义的四个阶段', () => {
      const { result } = renderHook(() => useDebateStore());
      
      expect(result.current.phases.length).toBe(4);
      expect(result.current.phases[0].id).toBe('probe');
      expect(result.current.phases[0].name).toBe('需求探查');
      expect(result.current.phases[1].id).toBe('design');
      expect(result.current.phases[1].name).toBe('方案设计');
      expect(result.current.phases[2].id).toBe('impl');
      expect(result.current.phases[2].name).toBe('实现规划');
      expect(result.current.phases[3].id).toBe('validate');
      expect(result.current.phases[3].name).toBe('验证确认');
    });
  });

  describe('重置功能', () => {
    it('resetDebate 应该重置所有状态', () => {
      const { result } = renderHook(() => useDebateStore());

      // 先设置一些数据
      act(() => {
        result.current.setDebateStatus('running');
        result.current.setPhase(2);
        result.current.addMessage({ role: 'test', content: 'test' });
        result.current.addCommitment({ text: 'test' });
        result.current.addConsensus({ phaseName: 'test' });
        result.current.setTopic('测试话题');
      });

      // 重置
      act(() => {
        result.current.reset();
      });

      // 验证重置
      expect(result.current.debateStatus).toBe('idle');
      expect(result.current.currentPhase).toBe(0);
      expect(result.current.currentRound).toBe(0);
      expect(result.current.messages.length).toBe(0);
      expect(result.current.commitments.length).toBe(0);
      expect(result.current.consensus.length).toBe(0);
      expect(result.current.topic).toBe('');
    });
  });
});
