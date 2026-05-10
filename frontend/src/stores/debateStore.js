import { create } from 'zustand';
import { getRandomSoulPreset, getSoulPresetById, soulPresets } from '../data/soulPresets';
import { getSoulVersionManager } from '../data/soulVersionManager';

export const useDebateStore = create((set, get) => ({
  // 连接状态
  wsConnected: false,
  wsReconnecting: false,
  reconnectCount: 0,

  // 辩论状态
  debateStatus: 'idle',
  currentPhase: 0,
  currentRound: 0,
  totalPhases: 5,
  totalRounds: 5,

  // V2.2 新增：流式输出状态
  isStreaming: false,
  streamContent: '',           // 当前正在流式输出的内容
  streamMessageId: null,       // 当前流式消息的临时ID
  canCancel: false,            // 是否可以取消

  // 数据
  messages: [],
  commitments: [],
  consensus: [],
  backtrackResults: [],
  files: [],

  // 辩论引擎状态
  debateEngine: null,
  phases: [
    { id: 'probe', name: '需求探查', description: '深入理解需求背景和目标' },
    { id: 'design', name: '方案设计', description: '提出和评估技术方案' },
    { id: 'impl', name: '实现规划', description: '细化实现步骤和资源规划' },
    { id: 'validate', name: '验证确认', description: '确认方案满足所有需求' },
  ],

  // Soul预设管理
  soulManagerOpen: false,
  editingRoleId: null,
  customSouls: {}, // 用户自定义的soul { roleType: [{ id, name, soul, description, tags }] }

  // 侧边栏状态
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // 音效状态
  soundEnabled: true,
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

  // 文档管理
  uploadedDoc: null,
  setUploadedDoc: (doc) => set({ uploadedDoc: doc }),

  // 配置
  config: {
    topic: '',
    roles: [
      { id: 1, name: '主持人', model: 'deepseek-v4-flash', soul: soulPresets.host[0].soul, soulPresetId: soulPresets.host[0].id, roleType: 'host' },
      { id: 2, name: '提案者', model: 'deepseek-v4-flash', soul: soulPresets.proposer[0].soul, soulPresetId: soulPresets.proposer[0].id, roleType: 'proposer' },
      { id: 3, name: '审查者', model: 'deepseek-v4-flash', soul: soulPresets.reviewer[0].soul, soulPresetId: soulPresets.reviewer[0].id, roleType: 'reviewer' },
    ],
    roundsPerPhase: 5,
    totalPhases: 5,
  },

  // Actions
  setWsConnected: (connected) => set({ wsConnected: connected }),
  setWsReconnecting: (reconnecting) => set({ wsReconnecting: reconnecting }),

  setDebateStatus: (status) => set({ debateStatus: status }),
  setPhase: (phase) => set({ currentPhase: phase }),
  setRound: (round) => set({ currentRound: round }),
  setTotalPhases: (total) => set({ totalPhases: total }),
  setTotalRounds: (total) => set({ totalRounds: total }),

  addMessage: (message) => set((state) => {
    // BUG-002 FIX: 防御性去重 - 检查是否已存在完全相同的消息
    const isDuplicate = state.messages.some(existingMsg =>
      existingMsg.role === message.role &&
      existingMsg.content === message.content &&
      existingMsg.round === message.round &&
      existingMsg.phase === message.phase
    );

    if (isDuplicate) {
      console.warn(` [DebateStore] 检测到重复消息，已忽略:`, {
        role: message.roleName || message.role,
        content: message.content?.substring(0, 50) + '...'
      });
      return state; // 不添加重复消息
    }

    return { messages: [...state.messages, message] };
  }),

  setMessages: (messages) => set({ messages }),

  addCommitment: (commitment) => set((state) => ({
    commitments: [...state.commitments, commitment]
  })),

  setConsensus: (consensus) => set({ consensus }),
  addConsensus: (consensus) => set((state) => ({
    consensus: [...state.consensus, consensus]
  })),

  setBacktrackResults: (results) => set({ backtrackResults: results }),
  addBacktrackResult: (result) => set((state) => ({
    backtrackResults: [...state.backtrackResults, result]
  })),

  setDebateEngine: (engine) => set({ debateEngine: engine }),

  setFiles: (files) => set({ files }),

  // V2.2 修复：流式输出 Actions
  startStream: () => set({
    isStreaming: true,
    streamContent: '',
    canCancel: true,
    streamMessageId: null, // 将在 setStreamMeta 中设置
  }),

  setStreamMeta: (meta) => set((state) => ({
    // 根据元数据创建消息ID
    streamMessageId: `${meta.phase || 0}-${meta.role || 'proposer'}-${meta.round || 0}-${Date.now()}`,
  })),

  // V8.0 极简版：直接追加内容，不做任何处理
  // 原则：程序可用性优先，不要复杂逻辑导致问题
  appendStreamChunk: (chunk) => set((state) => {
    try {
      if (!chunk || chunk.length === 0) return state;

      const currentContent = state.streamContent || '';
      const newContent = currentContent + chunk;

      // 直接追加，不做任何处理
      return { streamContent: newContent };
    } catch (error) {
      console.error(' [DebateStore] appendStreamChunk 错误:', error);
      return { streamContent: (state.streamContent || '') + (chunk || '') };
    }
  }),

  endStream: () => set((state) => {
    try {
      const content = state.streamContent;
      const messageId = state.streamMessageId;

      // 如果有流式内容，创建正式消息
      if (content && messageId) {
        // 从 messageId 提取角色信息（格式：phaseId-roleType-round-timestamp）
        const parts = messageId.split('-');
        const roleType = parts[1] || 'proposer';
        const phase = parseInt(parts[0]) || 0;
        const round = parseInt(parts[2]) || 0;

        // V8.0 极简版：直接使用原始内容，不做精炼
        // 原则：程序可用性优先，不要复杂逻辑导致问题

        const newMessage = {
          id: messageId,
          type: roleType === 'reviewer' ? 'review' : 'proposal',
          role: roleType,
          roleName: roleType === 'proposer' ? '提案者' : roleType === 'reviewer' ? '审查者' : '主持人',
          phase: phase,
          round: round,
          phaseId: state.phases[phase]?.id || 'probe',
          content: content, // 直接使用原始内容
          timestamp: new Date().toISOString(),
        };

        return {
          isStreaming: false,
          streamContent: '',
          canCancel: false,
          streamMessageId: null,
          messages: [...state.messages, newMessage],
        };
      }

      // 没有内容时仅重置状态
      return {
        isStreaming: false,
        streamContent: '',
        canCancel: false,
        streamMessageId: null,
      };
    } catch (error) {
      console.error(' [DebateStore] endStream 错误:', error);
      // 出错时重置流式状态，保留已有消息
      return {
        isStreaming: false,
        streamContent: '',
        canCancel: false,
        streamMessageId: null,
        error: error.message, // 记录错误信息
      };
    }
  }),

  cancelStream: () => set({
    isStreaming: false,
    streamContent: '',
    canCancel: false,
    streamMessageId: null,
  }),

  updateConfig: (config) => set((state) => ({
    config: { ...state.config, ...config }
  })),

  updateRole: (roleId, updates) => set((state) => ({
    config: {
      ...state.config,
      roles: state.config.roles.map(r =>
        r.id === roleId ? { ...r, ...updates } : r
      )
    }
  })),

  addRole: () => set((state) => {
    const roleTypes = ['host', 'proposer', 'reviewer'];
    const roleType = roleTypes[state.config.roles.length % 3];
    const randomPreset = getRandomSoulPreset(roleType);

    return {
      config: {
        ...state.config,
        roles: [
          ...state.config.roles,
          {
            id: Date.now(),
            name: randomPreset ? randomPreset.name : `角色${state.config.roles.length + 1}`,
            model: 'deepseek-v4-flash',
            soul: randomPreset ? randomPreset.soul : '',
            soulPresetId: randomPreset ? randomPreset.id : null,
            roleType: roleType
          }
        ]
      }
    };
  }),

  removeRole: (roleId) => set((state) => ({
    config: {
      ...state.config,
      roles: state.config.roles.filter(r => r.id !== roleId)
    }
  })),

  // Soul预设管理Actions
  setSoulManagerOpen: (open) => set({ soulManagerOpen: open }),
  setEditingRoleId: (roleId) => set({ editingRoleId: roleId }),

  // 为角色应用soul预设
  applySoulPreset: (roleId, preset) => set((state) => ({
    config: {
      ...state.config,
      roles: state.config.roles.map(r =>
        r.id === roleId
          ? { ...r, soul: preset.soul, soulPresetId: preset.id, name: preset.name }
          : r
      )
    }
  })),

  // 添加自定义soul
  addCustomSoul: (roleType, soulConfig) => set((state) => {
    const customSoulsForType = state.customSouls[roleType] || [];
    return {
      customSouls: {
        ...state.customSouls,
        [roleType]: [...customSoulsForType, { ...soulConfig, id: `custom-${Date.now()}` }]
      }
    };
  }),

  // 删除自定义soul
  removeCustomSoul: (roleType, soulId) => set((state) => {
    const customSoulsForType = state.customSouls[roleType] || [];
    return {
      customSouls: {
        ...state.customSouls,
        [roleType]: customSoulsForType.filter(s => s.id !== soulId)
      }
    };
  }),

  // 更新自定义soul
  updateCustomSoul: (roleType, soulId, updates) => set((state) => {
    const customSoulsForType = state.customSouls[roleType] || [];
    return {
      customSouls: {
        ...state.customSouls,
        [roleType]: customSoulsForType.map(s =>
          s.id === soulId ? { ...s, ...updates } : s
        )
      }
    };
  }),

  // 随机分配所有角色的soul
  randomizeAllSouls: () => set((state) => ({
    config: {
      ...state.config,
      roles: state.config.roles.map(r => {
        const randomPreset = getRandomSoulPreset(r.roleType || 'host');
        return randomPreset
          ? { ...r, soul: randomPreset.soul, soulPresetId: randomPreset.id, name: randomPreset.name }
          : r;
      })
    }
  })),

  // 从版本管理器同步提示词
  syncSoulsFromVersionManager: () => set((state) => {
    const versionManager = getSoulVersionManager();
    const activeVersion = versionManager.getActiveVersion();
    if (!activeVersion) return state;

    const newRoles = state.config.roles.map(r => {
      const roleConfig = activeVersion.roleConfigs[r.roleType];
      if (roleConfig) {
        return {
          ...r,
          soul: roleConfig.soul,
          soulPresetId: roleConfig.presetId,
          name: roleConfig.name || r.name
        };
      }
      return r;
    });

    return {
      config: {
        ...state.config,
        roles: newRoles
      }
    };
  }),

  reset: () => set({
    debateStatus: 'idle',
    currentPhase: 0,
    currentRound: 0,
    messages: [],
    commitments: [],
    consensus: [],
    backtrackResults: [],
    debateEngine: null,
  }),
}));
