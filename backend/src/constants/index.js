/**
 * PRD辩论系统 - 共享常量定义
 * 
 * 前后端统一使用，消除接口不一致问题
 * 版本: V1.0
 * 日期: 2026-05-10
 */

// ==================== 辩论阶段 ====================
const PHASES = {
  PROBE: { id: 'probe', name: '需求探查', description: '深入理解需求背景和目标', order: 1 },
  DESIGN: { id: 'design', name: '方案设计', description: '提出和评估技术方案', order: 2 },
  IMPL: { id: 'impl', name: '实现规划', description: '细化实现步骤和资源规划', order: 3 },
  VALIDATE: { id: 'validate', name: '验证确认', description: '确认方案满足所有需求', order: 4 },
};

const PHASE_LIST = Object.values(PHASES);

// ==================== 角色类型（完整清单）====================
const ROLES = {
  // 基础角色
  HOST: 'host',
  PROPOSER: 'proposer',
  REVIEWER: 'reviewer',
  
  // 头脑风暴模式
  IDEATOR: 'ideator',
  BRAINSTORMER: 'brainstormer',
  
  // 辩论角色
  DEBATER: 'debater',
  PRO_SIDE: 'pro-side',
  CON_SIDE: 'con-side',
  NEUTRAL: 'neutral',
  JUDGE: 'judge',
  
  // 方案评审角色
  PRESENTER: 'presenter',
  SUPPLEMENTER: 'supplementer',
  CRITIC: 'critic',
  CRITIC_LOGIC: 'critic-logic',
  CRITIC_DETAIL: 'critic-detail',
  CRITIC_RISK: 'critic-risk',
  SUMMARIZER: 'summarizer',
  
  // 投票决策角色
  VOTER: 'voter',
  QUESTIONER: 'questioner',
  
  // 圆桌讨论角色
  MEMBER: 'member',
  MODERATOR: 'moderator',
  
  // 多维度分析角色
  DIMENSION_1: 'dimension-1',
  DIMENSION_2: 'dimension-2',
  DIMENSION_3: 'dimension-3',
  
  // 优缺点分析角色
  PROS_SIDE: 'pros-side',
  CONS_SIDE: 'cons-side',
  
  // AI协作角色
  AI: 'ai',
  MAIN_AI: 'main-ai',
  SUB_AI: 'sub-ai',
  EXPERT_TECH: 'expert-tech',
  EXPERT_BUSINESS: 'expert-business',
  EXPERT_RISK: 'expert-risk',
  
  // 创意接龙角色
  INITIATOR: 'initiator',
  CHAINER: 'chainer',
  
  // 双方讨论角色
  PARTICIPANT_A: 'participant-a',
  PARTICIPANT_B: 'participant-b',
  ASKER: 'asker',
  ANSWERER: 'answerer',
};

// 角色类别映射（用于判断消息类型）
const ROLE_CATEGORIES = {
  // 提案类角色（返回 proposal 消息）
  PROPOSAL_ROLES: [
    ROLES.PROPOSER,
    ROLES.IDEATOR,
    ROLES.BRAINSTORMER,
    ROLES.DEBATER,
    ROLES.PRESENTER,
    ROLES.SUPPLEMENTER,
    ROLES.VOTER,
    ROLES.MEMBER,
    ROLES.INITIATOR,
    ROLES.CHAINER,
    ROLES.AI,
    ROLES.MAIN_AI,
    ROLES.SUB_AI,
    ROLES.EXPERT_TECH,
    ROLES.EXPERT_BUSINESS,
    ROLES.EXPERT_RISK,
    ROLES.PARTICIPANT_A,
    ROLES.PARTICIPANT_B,
    ROLES.ASKER,
    ROLES.ANSWERER,
    ROLES.PRO_SIDE,
    ROLES.PROS_SIDE,
    ROLES.DIMENSION_1,
    ROLES.DIMENSION_2,
    ROLES.DIMENSION_3,
    ROLES.NEUTRAL,
    ROLES.CONS_SIDE,
  ],
  
  // 审查类角色（返回 review 消息）
  REVIEW_ROLES: [
    ROLES.REVIEWER,
    ROLES.CON_SIDE,
    ROLES.CRITIC,
    ROLES.CRITIC_LOGIC,
    ROLES.CRITIC_DETAIL,
    ROLES.CRITIC_RISK,
    ROLES.QUESTIONER,
    ROLES.JUDGE,
  ],
  
  // 主持人/协调类角色（不参与轮次发言）
  HOST_ROLES: [
    ROLES.HOST,
    ROLES.MODERATOR,
    ROLES.SUMMARIZER,
  ],
};

// ==================== 消息类型 ====================
const MESSAGE_TYPES = {
  PROPOSAL: 'proposal',
  REVIEW: 'review',
  CONSENSUS: 'consensus',
  SYSTEM: 'system',
  STREAM_CHUNK: 'stream_chunk',
  ERROR: 'error',
};

// ==================== 辩论模式 ====================
const DEBATE_MODES = {
  STANDARD_DEBATE: 'standard-debate',
  BRAINSTORM: 'brainstorm',
  ROUNDTABLE: 'roundtable',
  REVIEW: 'review',
  VOTING: 'voting',
  WORKSHOP: 'workshop',
  MULTI_DIMENSION: 'multi-dimension',
  PROS_CONS: 'pros-cons',
  IDEATION_CHAIN: 'ideation-chain',
  AI_COLLABORATION: 'ai-collaboration',
  AI_EXPERT_PANEL: 'ai-expert-panel',
  DUAL_PERSPECTIVE: 'dual-perspective',
  STRUCTURED_DISCUSSION: 'structured-discussion',
};

// ==================== 显示样式 ====================
const DISPLAY_STYLES = {
  DEBATE: 'debate',
  CARD: 'card',
  TIMELINE: 'timeline',
  COMPARISON: 'comparison',
};

// ==================== 输出深度 ====================
const OUTPUT_DEPTHS = {
  BRIEF: 'brief',
  DETAILED: 'detailed',
  COMPREHENSIVE: 'comprehensive',
};

// ==================== WebSocket 事件类型 ====================
const WS_EVENTS = {
  // 客户端 → 服务端
  DEBATE_START: 'debate:start',
  DEBATE_CANCEL: 'debate:cancel',
  DEBATE_PAUSE: 'debate:pause',
  DEBATE_RESUME: 'debate:resume',
  
  // 服务端 → 客户端
  DEBATE_ROUND: 'debate:round',
  DEBATE_MESSAGE: 'debate:message',
  DEBATE_STREAM_START: 'debate:stream:start',
  DEBATE_STREAM_CHUNK: 'debate:stream:chunk',
  DEBATE_STREAM_END: 'debate:stream:end',
  DEBATE_PHASE_CHANGE: 'debate:phase:change',
  DEBATE_ERROR: 'debate:error',
  DEBATE_COMPLETE: 'debate:complete',
  DEBATE_STATUS: 'debate:status',
  COMMITMENT_ADD: 'commitment:add',
  BACKTRACK_RESULT: 'backtrack:result',
  VERDICT_UPDATE: 'verdict:update',
};

// ==================== 工具函数 ====================

/**
 * 判断是否为主持人类角色
 */
function isHostRole(roleType) {
  if (!roleType) return false;
  return ROLE_CATEGORIES.HOST_ROLES.includes(roleType.toLowerCase());
}

/**
 * 判断角色应返回的消息类型
 */
function getMessageTypeForRole(roleType) {
  if (!roleType) return MESSAGE_TYPES.PROPOSAL;
  const rt = roleType.toLowerCase();
  
  if (ROLE_CATEGORIES.REVIEW_ROLES.includes(rt)) {
    return MESSAGE_TYPES.REVIEW;
  }
  return MESSAGE_TYPES.PROPOSAL;
}

/**
 * 获取角色的默认灵魂描述
 */
function getDefaultSoulForRole(roleType) {
  const defaults = {
    [ROLES.IDEATOR]: '你是一位富有创意的思考者，擅长提出新颖的想法和独特的视角。',
    [ROLES.BRAINSTORMER]: '你是一位头脑风暴专家，能够快速产生大量创意点子。',
    [ROLES.DEBATER]: '你是一位辩论高手，善于从多角度分析问题。',
    [ROLES.SUPPLEMENTER]: '你是一位细致的补充者，善于发现遗漏的细节和盲区。',
    [ROLES.SUMMARIZER]: '你是一位优秀的总结者，能够提炼核心观点并整合输出。',
    [ROLES.CRITIC]: '你是一位批判性思维者，善于发现问题和风险。',
    [ROLES.VOTER]: '你是一位决策者，善于评估利弊并做出判断。',
    [ROLES.MEMBER]: '你是一位积极的参与者，乐于分享观点并尊重他人。',
    [ROLES.PROPOSER]: '你是一位提案者，负责提出建设性的方案和观点。',
    [ROLES.REVIEWER]: '你是一位审查者，负责评估方案的优缺点并提出改进建议。',
    [ROLES.PRO_SIDE]: '你是正方辩手，负责支持并论证当前立场。',
    [ROLES.CON_SIDE]: '你是反方辩手，负责质疑并反驳对方观点。',
    [ROLES.JUDGE]: '你是裁判，负责公正评判双方表现并给出结论。',
    [ROLES.PRESENTER]: '你是方案提出方，负责展示你的方案并回答质疑。',
    [ROLES.QUESTIONER]: '你是质询方，负责提出尖锐问题检验方案可行性。',
  };

  return defaults[roleType] || `你是一位${roleType}，请积极参与讨论并贡献你的观点。`;
}

/**
 * 验证角色类型是否有效
 */
function isValidRoleType(roleType) {
  if (!roleType) return false;
  const allRoles = Object.values(ROLES);
  return allRoles.includes(roleType.toLowerCase());
}

/**
 * 获取所有有效的角色类型列表
 */
function getAllValidRoleTypes() {
  return Object.values(ROLES);
}

module.exports = {
  PHASES,
  PHASE_LIST,
  ROLES,
  ROLE_CATEGORIES,
  MESSAGE_TYPES,
  DEBATE_MODES,
  DISPLAY_STYLES,
  OUTPUT_DEPTHS,
  WS_EVENTS,
  isHostRole,
  getMessageTypeForRole,
  getDefaultSoulForRole,
  isValidRoleType,
  getAllValidRoleTypes,
};
