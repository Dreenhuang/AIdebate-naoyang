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

  // 🔥 V2.2 新增：流式输出状态
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
    // 🔥 BUG-002 FIX: 防御性去重 - 检查是否已存在完全相同的消息
    const isDuplicate = state.messages.some(existingMsg =>
      existingMsg.role === message.role &&
      existingMsg.content === message.content &&
      existingMsg.round === message.round &&
      existingMsg.phase === message.phase
    );

    if (isDuplicate) {
      console.warn(`⚠️ [DebateStore] 检测到重复消息，已忽略:`, {
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

  // 🔥 V2.2 修复：流式输出 Actions
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

  //  V7.0 终极修复版：流式输出追加 - 移除破坏性去重，保留基础安全过滤
  appendStreamChunk: (chunk) => set((state) => {
    try {
      if (!chunk || chunk.length === 0) return state;

      const currentContent = state.streamContent || '';
      const newContent = currentContent + chunk;

      // 🔥 修复：只做最小限度的安全过滤，不进行破坏性去重
      // 原因：AI 模型输出的重复内容是正常现象，前端去重会破坏 Markdown 格式
      const cleanedContent = safeFilterStreamContent(newContent);

      return { streamContent: cleanedContent };
    } catch (error) {
      console.error('❌ [DebateStore] appendStreamChunk 错误:', error);
      // 出错时安全地追加内容，不做任何处理
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

        // 🔥 V7.0 终极修复：调用最终精炼函数（带更强错误保护）
        let refinedContent = content;
        try {
          refinedContent = refineFinalOutput(content);
          // 如果精炼后有明显变化，记录日志
          if (refinedContent.length !== content.length) {
            console.log(`📝 前端精炼: ${content.length} → ${refinedContent.length} 字符`);
          }
          // 🔥 关键修复：确保精炼后内容不为空
          if (!refinedContent || refinedContent.trim().length === 0) {
            console.error('⚠️ [DebateStore] refineFinalOutput 返回空内容！使用原始内容');
            refinedContent = content;
          }
        } catch (refineError) {
          console.error('❌ [DebateStore] refineFinalOutput 错误:', refineError);
          refinedContent = content; // 精炼失败时使用原始内容
        }

        const newMessage = {
          id: messageId,
          type: roleType === 'reviewer' ? 'review' : 'proposal',
          role: roleType,
          roleName: roleType === 'proposer' ? '提案者' : roleType === 'reviewer' ? '审查者' : '主持人',
          phase: phase,
          round: round,
          phaseId: state.phases[phase]?.id || 'probe',
          content: refinedContent, // 使用精炼后的内容
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
      console.error('❌ [DebateStore] endStream 错误:', error);
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

//  V7.0 终极修复版：最小安全过滤器 - 只做基础清理，不做破坏性去重
// 核心原则：流式输出时不要修改 AI 原始内容，保留完整 Markdown 格式
// 所有精炼工作统一在 endStream 时一次性完成

function safeFilterStreamContent(text) {
  if (!text || typeof text !== 'string') return text;
  
  let result = text;
  
  // Level 1: 只修复明显的格式错误（不修改内容）
  // 修复多余的空行（3个以上空行 -> 2个）
  result = result.replace(/\n{4,}/g, '\n\n');
  
  // Level 2: 修复明显的标点错误（不影响内容）
  result = result.replace(/。{3,}/g, '。');
  result = result.replace(/，{3,}/g, '，');
  
  // Level 3: 移除控制字符（不影响显示）
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // 不再做内容去重！让 AI 原始内容完整展示
  // 所有精炼在 endStream 时统一处理
  
  return result;
}

// 🔥 V6.0 修复版：前端实时去重引擎（已废弃，保留用于向后兼容）
// 修复 L3 正则过宽、L4.5 逻辑无效等问题
// 注意：此函数已不再用于流式输出，仅在特定场景下可能需要

function deduplicateStreamContent(newContent, previousContent) {
  if (!newContent) return newContent;
  
  let result = newContent;
  
  // ========== Level 1: 字符级暴力去重（连续3+相同字符） ==========
  result = result.replace(/(.)\1{2,}/g, '$1$1');
  
  // ========== Level 2: 虚词重复控制 ==========
  result = result.replace(/的{3,}/g, '的的');
  result = result.replace(/了{3,}/g, '了了');
  result = result.replace(/是{3,}/g, '是是');
  result = result.replace(/在{3,}/g, '在在');
  
  // ========== Level 3: 边界重复检测（修复：精确匹配模式） ==========
  if (previousContent && previousContent.length > 5) {
    const lastFew = previousContent.slice(-8);
    const firstFew = result.slice(0, 8);
    const boundary = lastFew + firstFew;
    
    // 🔥 修复：使用精确的重复模式，不再用宽泛的/(.){3,}/
    const boundaryPatterns = [
      /(非常|特别|十分|极其)\1/,  // 程度副词自身重复
      /(研究|分析|讨论|考虑)\1/,   // 动词自身重复
      /的{3,}|了{3,}|是{3,}/,      // 虚词连续重复
      /(重要|关键|核心)\1/,         // 主题词自身重复
    ];
    
    for (const pattern of boundaryPatterns) {
      if (pattern.test(boundary)) {
        console.log(`🔍 [前端去重] L3-边界重复检测触发`);
        // 截断新内容的开头重复部分
        result = result.replace(/^[\s\S]{0,4}/, '');
        break;
      }
    }
  }
  
  // ========== Level 4: 实时短语去重 ==========
  const internalRepeatPattern = /(\S{2,4})\1{2,}/g;
  if (internalRepeatPattern.test(result)) {
    result = result.replace(internalRepeatPattern, '$1');
    console.log(`🔍 [前端去重] L4-内部短语重复已清理`);
  }

  // ========== Level 4.5: AI特有重复模式实时清理（修复：正确替换逻辑） ==========
  
  // 清理重复的Markdown标记：**text** **text**
  result = result.replace(/(\*\*[^*]{2,20}\*\*)\s+\1+/g, '$1');
  
  // 🔥 修复：正确实现连接词重复清理
  // "因为...所以...所以" -> 移除多余的"所以"
  result = result.replace(/((?:因为|由于|鉴于)[^\n]{0,30}?(?:所以|因此|故而))[^\n]{0,10}?(?:所以|因此|故而)/g, '$1');
  
  // "不仅...而且...而且" -> 移除多余的"而且"
  result = result.replace(/((?:不仅|不但)[^\n]{0,20}?(?:而且|并且))[^\n]{0,10}?(?:而且|并且)/g, '$1');
  
  // 清理重复的总结性短语
  result = result.replace(/((?:综上所述|总而言之|简而言之|概括来说))[^\n]{0,20}?\1/g, '$1');
  result = result.replace(/((?:总之|因此|所以))[^\n]{0,15}?\1/g, '$1');

  // ========== Level 5: AI生成废话实时过滤 ==========
  const fillerWords = [
    '众所周知',
    '显而易见', 
    '不言而喻',
    '值得注意的是',
    '需要指出的是',
  ];
  
  fillerWords.forEach(filler => {
    if (result.startsWith(filler) && previousContent && !previousContent.endsWith(filler)) {
      result = result.slice(filler.length);
      console.log(`🔍 [前端去重] L5-废话过滤: "${filler}"`);
    }
  });
  
  return result;
}

// 🔥 V7.0 终极修复版：最终输出精炼（endStream时调用）
// 核心原则：保守精炼，绝不破坏内容完整性
// 修复：降低去重强度，避免过度删除导致内容丢失和页面空白

export function refineFinalOutput(text) {
  if (!text || text.length < 30) return text;
  
  let result = text;
  let originalLength = result.length;
  
  console.log(`📝 [前端精炼] 开始处理 ${result.length} 字符...`);
  
  // ========== Level 1: 基础字符去重（保守） ==========
  // 只处理4次以上重复，保留正常的修辞重复
  result = result.replace(/(.)\1{3,}/g, '$1$1');
  result = result.replace(/(\S{3,})\1{2,}/g, '$1');
  
  // ========== Level 2: 虚词优化（保守） ==========
  // 只处理3次以上重复，保留正常的修辞重复
  result = result.replace(/的{3,}/g, '的的');
  result = result.replace(/了{3,}/g, '了了');
  result = result.replace(/是{3,}/g, '是是');
  result = result.replace(/在{3,}/g, '在在');
  
  // ========== Level 3: 副词/动词重复优化（保守） ==========
  // 只处理3次以上重复
  result = result.replace(/(非常|特别|十分|极其|相当|比较|格外|尤其)\1{2,}/g, '$1$1');
  
  // 动词重叠 - 只处理3次以上
  const verbPattern = /(研究|分析|讨论|考虑|计划|规划|设计|开发|测试|审查|评估|检查|实施|执行|制定|建立|构建|创建)\1{2,}/g;
  result = result.replace(verbPattern, '$1$1');
  
  // ========== Level 4: 近义冗余智能合并 ==========
  const redundancyMap = [
    [ /分析和研究/g, '分析研究' ],
    [ /计划和规划/g, '统筹规划' ],
    [ /考虑和思考/g, '深入思考' ],
    [ /测试和验证/g, '检验验证' ],
    [ /制定和实施/g, '制定实施' ],
    [ /核心的核心/g, '核心' ],
    [ /关键的关键/g, '关键' ],
    [ /重要的重点/g, '重要' ],
  ];
  
  redundancyMap.forEach(([pattern, replacement]) => {
    result = result.replace(pattern, replacement);
  });
  
  // ========== Level 5: AI生成废话删除 ==========
  const fillerPhrases = [
    /众所周知，?/g,
    /显而易见，?/g,
    /不言而喻，?/g,
    /值得注意的是，?/g,
    /需要指出的是，?/g,
    /事实上，?/g,
    /实际上，?/g,
    /总的来说，?(?!以上)/g,
    /从某种意义上说，?/g,
    /在一定程度上，?/g,
  ];
  
  fillerPhrases.forEach(pattern => {
    result = result.replace(pattern, '');
  });
  
  // ========== Level 6: 标点规范化 ==========
  result = result.replace(/[ \t]+/g, ' ');
  result = result.replace(/\n{3,}/g, '\n\n');
  result = result.replace(/。{3,}/g, '。');
  result = result.replace(/，{3,}/g, '，');
  result = result.replace(/、{3,}/g, '、');
  result = result.replace(/！！+/g, '！');
  result = result.replace(/？？+/g, '？');
  result = result.replace(/…{3,}/g, '……');
  
  // ========== Level 7: 句子级智能去重（修复：提高相似度阈值，降低误杀） ==========
  // 分割句子并去除高度相似的相邻句
  const sentences = result.split(/(?<=[。！？])/);
  const uniqueSentences = [];
  const recentFingerprints = [];  // 保留最近3个句子指纹

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length < 5) {
      uniqueSentences.push(trimmed);
      continue;
    }

    // 生成句子指纹（关键词提取）
    const fingerprint = trimmed
      .replace(/[的了吗呢吧啊哈呀哦嘛呗，。！？、；：""''（）【】\s]/g, '')
      .slice(0, 25)
      .toLowerCase();

    // 检查是否与最近句子高度相似（修复：提高阈值到0.85，降低误杀）
    const isDuplicate = fingerprint && recentFingerprints.some(fp => {
      const similarity = calculateStringSimilarity(fp, fingerprint);
      return similarity > 0.85;  // 修复：从0.75提高到0.85，降低误杀率
    });

    if (!isDuplicate) {
      uniqueSentences.push(trimmed);
      if (fingerprint) {
        recentFingerprints.push(fingerprint);
        // 只保留最近3个指纹用于比较
        if (recentFingerprints.length > 3) {
          recentFingerprints.shift();
        }
      }
    } else {
      console.log(`🔍 [前端精炼] L7-句子去重: "${trimmed.slice(0, 20)}..."`);
    }
  }

  result = uniqueSentences.join('');
  
  // ========== Level 8: 最终质量检验（修复：提高保守版本阈值） ==========
  // 如果去重过度（<原长度70%），返回保守版本（修复：从60%提高到70%）
  if (result.length < originalLength * 0.7) {
    console.warn(`⚠️ [前端精炼] 去重过度 (${originalLength} → ${result.length}, ${(result.length/originalLength*100).toFixed(1)}%), 使用保守版本`);
    
    // 保守版本：只做基础清理，保留原始内容完整性
    let conservativeResult = text;
    conservativeResult = conservativeResult.replace(/(.)\1{4,}/g, '$1$1');
    conservativeResult = conservativeResult.replace(/的{4,}/g, '的的');
    conservativeResult = conservativeResult.replace(/了{4,}/g, '了了');
    conservativeResult = conservativeResult.replace(/\n{3,}/g, '\n\n');
    conservativeResult = conservativeResult.replace(/。{4,}/g, '。');
    
    return conservativeResult.trim();
  }
  
  // 记录精炼效果
  const refinedChars = originalLength - result.length;
  if (refinedChars > 0) {
    console.log(`✅ [前端精炼] 完成! ${originalLength} → ${result.length} 字符 (去除 ${refinedChars} 字符, ${(refinedChars/originalLength*100).toFixed(1)}%)`);
  }
  
  return result.trim();
}

// 🔥 V5.0 新增：字符串相似度计算（用于句子级去重）
function calculateStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  // 使用简单的Jaccard相似度（基于字符集合）
  const set1 = new Set(str1.split(''));
  const set2 = new Set(str2.split(''));
  
  const intersection = [...set1].filter(x => set2.has(x)).length;
  const union = new Set([...set1, ...set2]).size;
  
  return union > 0 ? intersection / union : 0;
}
