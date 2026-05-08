import { create } from 'zustand';

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
  
  // 数据
  messages: [],
  commitments: [],
  files: [],
  
  // 配置
  config: {
    topic: '',
    roles: [
      { id: 1, name: '主持人', model: 'deepseek-v4-flash', soul: '专业、理性、善于引导讨论' },
      { id: 2, name: '提案者', model: 'deepseek-v4-flash', soul: '积极、创新、善于提出方案' },
      { id: 3, name: '审查者', model: 'deepseek-v4-flash', soul: '严谨、批判、善于发现问题' },
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
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  setMessages: (messages) => set({ messages }),
  
  addCommitment: (commitment) => set((state) => ({
    commitments: [...state.commitments, commitment]
  })),
  
  setFiles: (files) => set({ files }),
  
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
  
  addRole: () => set((state) => ({
    config: {
      ...state.config,
      roles: [
        ...state.config.roles,
        {
          id: Date.now(),
          name: `角色${state.config.roles.length + 1}`,
          model: 'deepseek-v4-flash',
          soul: ''
        }
      ]
    }
  })),
  
  removeRole: (roleId) => set((state) => ({
    config: {
      ...state.config,
      roles: state.config.roles.filter(r => r.id !== roleId)
    }
  })),
  
  reset: () => set({
    debateStatus: 'idle',
    currentPhase: 0,
    currentRound: 0,
    messages: [],
    commitments: [],
  }),
}));
