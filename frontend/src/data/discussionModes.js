/**
 * PRD辩论系统 - 讨论模式配置
 * 包含19种讨论模式的完整配置
 *
 * V2.0 更新：输出深度字数规范调整
 * - 简短讨论：150-500字/角色·轮
 * - 深入讨论：500-1000字/角色·轮
 * - 详细研究：1000-2000字/角色·轮
 *
 * V3.0 更新：角色类型映射与默认Soul配置
 * - 修复：所有模式使用soulPresets支持的角色类型
 * - 新增：每个模式预配最佳默认Soul组合
 */

// 输出深度配置（V2.0 按用户要求调整）
export const OUTPUT_DEPTH = {
  brief: {
    id: 'brief',
    name: '简短讨论',
    charRange: '150-500字/轮',
    description: '快速结论，适合简单议题',
    instruction: `请用简洁的语言回答，控制在150-500字以内。
要求：
- 一句话表达核心观点
- 给出1-2个关键支撑理由
- 不展开详细论证
- 直击要害，不废话`,
  },
  normal: {
    id: 'normal',
    name: '深入讨论',
    charRange: '500-1000字/轮',
    description: '平衡深度与效率，适合大多数场景',
    instruction: `请用适中的长度回答，控制在500-1000字以内。
要求：
- 清晰表达核心观点
- 给出2-3个有力支撑理由
- 可以有1个简短案例或数据
- 逻辑清晰，层次分明`,
  },
  detailed: {
    id: 'detailed',
    name: '详细研究',
    charRange: '1000-2000字/轮',
    description: '全面分析，适合复杂议题',
    instruction: `请详细深入地回答，控制在1000-2000字以内。
要求：
- 系统性地分析问题
- 多个维度的深度论证
- 引用数据和案例支撑
- 分析风险和不确定性
- 给出前瞻性思考
- 可以使用结构化表达`,
  },
};

// ══════════════════════════════════════
// V3.0 角色类型映射系统
// 将模式中的逻辑角色类型映射到 soulPresets 支持的物理类型
// ══════════════════════════════════════

export const ROLE_TYPE_MAP = {
  // === 主持人相关 ===
  'host': 'host',
  'moderator': 'host',
  'coordinator': 'host',

  // === 提案者/正方相关 ===
  'proposer': 'proposer',
  'pro-side': 'proposer',
  'pros-side': 'proposer',
  'presenter': 'proposer',
  'participant-a': 'proposer',
  'initiator': 'proposer',
  'ideator': 'proposer',
  'main-ai': 'proposer',

  // === 审查者/反方相关 ===
  'reviewer': 'reviewer',
  'con-side': 'reviewer',
  'cons-side': 'reviewer',
  'participant-b': 'reviewer',
  'answerer': 'reviewer',
  'chainer': 'reviewer',
  'sub-ai': 'reviewer',

  // === 补充者相关 ===
  'supplementer': 'supplementer',

  // === 总结者/中立相关 ===
  'summarizer': 'summarizer',
  'neutral': 'summarizer',
  'judge': 'summarizer',
  'voter': 'summarizer',

  // === 辩论者相关 ===
  'debater': 'debater',
  'member': 'debater',

  // === 头脑风暴相关 ===
  'brainstormer': 'brainstormer',

  // === 特殊类型（需要映射） ===
  'asker': 'proposer',
  'questioner': 'reviewer',
  'dimension-1': 'debater',
  'dimension-2': 'debater',
  'dimension-3': 'debater',
  'critic': 'debater',
  'critic-logic': 'debater',
  'critic-detail': 'reviewer',
  'critic-risk': 'debater',
  'expert-tech': 'brainstormer',
  'expert-business': 'proposer',
  'expert-risk': 'reviewer',
  'ai': 'brainstormer',
};

/**
 * 获取映射后的物理角色类型
 */
export const getMappedRoleType = (logicalType) => {
  return ROLE_TYPE_MAP[logicalType] || 'debater';
};

// ══════════════════════════════════════
// V3.0 默认Soul预设配置
// 为每种讨论模式推荐最佳的角色Soul组合
// ══════════════════════════════════════

export const MODE_DEFAULT_SOULS = {
  // ========== 一对一双向商量类 ==========
  'free-dialogue': {
    'proposer': 'proposer-logical',
    'reviewer': 'reviewer-detailed',
  },
  'qa-chase': {
    'proposer': 'proposer-innovative',
    'reviewer': 'reviewer-user',
  },
  'complement': {
    'proposer': 'proposer-practical',
    'supplementer': null,
  },

  // ========== 多人圆桌合议类 ==========
  'roundtable-free': {
    'host': 'host-neutral',
    'debater': 'debater-collaborative',
  },
  'rotating-speaker': {
    'host': 'host-efficiency',
    'debater': 'debater-analytical',
  },
  'split-thesis': {
    'host': 'host-strict',
    'debater': 'debater-specialized',
  },
  'specialized': {
    'host': 'host-encouraging',
    'proposer': 'proposer-theoretical',
    'supplementer': null,
    'debater': 'debater-devils-advocate',
    'summarizer': 'summarizer-synthesizer',
  },
  'problem-breakdown': {
    'host': 'host-creative',
    'debater': 'debater-systematic',
  },

  // ========== 正式对抗辩论类 ==========
  'standard-debate': {
    'host': 'host-neutral',
    'proposer': 'proposer-theoretical',
    'reviewer': 'reviewer-detailed',
    'summarizer': 'summarizer-judge',
  },
  'triangular': {
    'proposer': 'proposer-innovative',
    'reviewer': 'reviewer-risk-aware',
    'summarizer': 'summarizer-mediator',
  },
  'rebuttal-review': {
    'proposer': 'proposer-experienced',
    'reviewer': 'reviewer-detailed',
    'summarizer': 'summarizer-synthesizer',
  },
  'pros-cons': {
    'host': 'host-neutral',
    'proposer': 'proposer-user-centric',
    'reviewer': 'reviewer-cost-benefit',
    'summarizer': 'summarizer-balancer',
  },

  // ========== 决策辅助类 ==========
  'qa-defense': {
    'host': 'host-strict',
    'proposer': 'proposer-logical',
    'reviewer': 'reviewer-technical',
  },
  'proposal-vote': {
    'host': 'host-efficiency',
    'proposer': 'proposer-practical',
    'summarizer': 'summarizer-tally',
  },

  // ========== 头脑风暴共创类 ==========
  'brainstorm': {
    'host': 'host-creative',
    'brainstormer': 'brainstormer-divergent',
  },
  'idea-chain': {
    'proposer': 'brainstormer-divergent',
    'reviewer': 'brainstormer-convergent',
  },

  // ========== 多AI专属协同类 ==========
  'ai-lead-supplement': {
    'proposer': 'proposer-theoretical',
    'reviewer': 'reviewer-detailed',
  },
  'ai-parallel': {
    'brainstormer': 'brainstormer-multidimensional',
  },
  'ai-role-simulation': {
    'brainstormer': 'brainstormer-perspective-taking',
    'proposer': 'proposer-user-centric',
    'reviewer': 'reviewer-risk-aware',
  },
};

// 讨论模式配置
export const DISCUSSION_MODES = {
  // ========== 一对一双向商量类 ==========

  // 模式1：双向自由对谈式
  'free-dialogue': {
    id: 'free-dialogue',
    name: '双向自由对谈式',
    category: '一对一双向商量',
    icon: '💬',
    description: '两人简单交换想法，初步探讨',
    minRoles: 2,
    maxRoles: 2,
    rolesAreEqual: true,
    needsHost: false,
    defaultRoles: [
      { roleType: 'participant-a', label: '甲方', description: '参与方A' },
      { roleType: 'participant-b', label: '乙方', description: '参与方B' },
    ],
    flow: [
      {
        step: 1,
        actor: 0,
        action: 'full-output',
        label: '甲方完整输出',
        description: '甲方完整表达观点和方案',
      },
      {
        step: 2,
        actor: 1,
        action: 'full-output',
        label: '乙方完整输出',
        description: '乙方完整表达观点和方案',
      },
      {
        step: 3,
        actor: 'all',
        action: 'discuss',
        label: '双方商讨',
        description: '针对对方观点进行讨论',
        loop: true,
      },
      {
        step: 4,
        actor: 'all',
        action: 'conclude',
        label: '共同结论',
        description: '整合双方观点，形成共识',
      },
    ],
    displayStyle: 'bubble',
    defaultDepth: 'normal',
  },

  // 模式2：一问一答追问式
  'qa-chase': {
    id: 'qa-chase',
    name: '一问一答追问式',
    category: '一对一双向商量',
    icon: '❓',
    description: '精准答疑，缩小信息差',
    minRoles: 2,
    maxRoles: 2,
    rolesAreEqual: true,
    needsHost: false,
    defaultRoles: [
      { roleType: 'asker', label: '提问方', description: '主动提问，寻求解答' },
      { roleType: 'answerer', label: '回答方', description: '回答问题，补充信息' },
    ],
    flow: [
      {
        step: 1,
        actor: 0,
        action: 'ask',
        label: '提问方提问',
        description: '提出一个具体问题',
      },
      {
        step: 2,
        actor: 1,
        action: 'answer',
        label: '回答方回答',
        description: '直接回答问题',
      },
      {
        step: 3,
        actor: 0,
        action: 'followup',
        label: '提问方追问',
        description: '基于回答继续追问',
        loop: true,
      },
      {
        step: 4,
        actor: 1,
        action: 'answer',
        label: '回答方再答',
        description: '回应追问',
      },
      {
        step: 5,
        actor: 'all',
        action: 'conclude',
        label: '共识确认',
        description: '确认已获得满意答案',
      },
    ],
    displayStyle: 'bubble',
    defaultDepth: 'normal',
    maxFollowUps: 5,
  },

  // 模式3：互补完善式
  'complement': {
    id: 'complement',
    name: '互补完善式',
    category: '一对一双向商量',
    icon: '🔧',
    description: '整合双方优势，补充漏洞',
    minRoles: 2,
    maxRoles: 2,
    rolesAreEqual: false,
    needsHost: false,
    defaultRoles: [
      { roleType: 'presenter', label: '方案方', description: '提出初始方案' },
      { roleType: 'supplementer', label: '补位方', description: '补充漏洞盲区' },
    ],
    rules: {
      supplementerMustNotRepeat: true,
      supplementerMustNotDeny: true,
    },
    flow: [
      {
        step: 1,
        actor: 0,
        action: 'present',
        label: '方案方完整输出',
        description: '完整呈现核心方案',
      },
      {
        step: 2,
        actor: 1,
        action: 'supplement',
        label: '补位方补充漏洞',
        description: '只补充未覆盖的漏洞、盲区、细节',
      },
      {
        step: 3,
        actor: 0,
        action: 'integrate',
        label: '方案方整合',
        description: '吸收补充，优化自身方案',
      },
      {
        step: 4,
        actor: 1,
        action: 'review',
        label: '补位方再审',
        description: '审阅优化后的方案',
      },
      {
        step: 5,
        actor: 'all',
        action: 'confirm',
        label: '共同敲定',
        description: '协商取舍，达成一致结论',
      },
    ],
    displayStyle: 'bubble',
    defaultDepth: 'normal',
  },

  // ========== 多人圆桌合议类 ==========

  // 模式4：圆桌自由研讨式
  'roundtable-free': {
    id: 'roundtable-free',
    name: '圆桌自由研讨式',
    category: '多人圆桌合议',
    icon: '👥',
    description: '发散创意，广集观点',
    minRoles: 3,
    maxRoles: 10,
    rolesAreEqual: true,
    needsHost: true,
    defaultRoles: [
      { roleType: 'host', label: '主持人', description: '协调讨论' },
      { roleType: 'member', label: '成员', description: '参与讨论' },
    ],
    flow: [
      {
        step: 1,
        actor: 'host',
        action: 'open',
        label: '主持人开场',
        description: '介绍议题背景和讨论目标',
      },
      {
        step: 2,
        actor: 'all',
        action: 'free-discuss',
        label: '自由发言讨论',
        description: '所有人自由发言，主持人协调',
        loop: true,
      },
      {
        step: 3,
        actor: 'host',
        action: 'cluster',
        label: '观点归类',
        description: '将所有观点归类整理',
      },
      {
        step: 4,
        actor: 'all',
        action: 'vote',
        label: '投票确认',
        description: '筛选出最重要观点',
      },
      {
        step: 5,
        actor: 'host',
        action: 'conclude',
        label: '结论输出',
        description: '汇总形成结论',
      },
    ],
    displayStyle: 'roundtable',
    defaultDepth: 'normal',
  },

  // 模式5：轮值发言合议式
  'rotating-speaker': {
    id: 'rotating-speaker',
    name: '轮值发言合议式',
    category: '多人圆桌合议',
    icon: '🔄',
    description: '避免混乱，确保各方表达',
    minRoles: 3,
    maxRoles: 10,
    rolesAreEqual: true,
    needsHost: true,
    defaultRoles: [
      { roleType: 'host', label: '主持人', description: '控场轮次' },
      { roleType: 'member', label: '成员', description: '轮值发言' },
    ],
    flow: [
      {
        step: 1,
        actor: 'host',
        action: 'open',
        label: '主持人说明议题',
        description: '明确讨论主题和轮次规则',
      },
      {
        step: 2,
        actor: 'all',
        action: 'rotate-speak',
        label: '第一轮轮值发言',
        description: '所有人轮流发言一次',
      },
      {
        step: 3,
        actor: 'all',
        action: 'rotate-respond',
        label: '第二轮轮值回应',
        description: '基于第一轮观点进行回应',
        loop: true,
      },
      {
        step: 4,
        actor: 'host',
        action: 'conclude',
        label: '主持人汇总',
        description: '整理各轮发言，形成结论',
      },
    ],
    displayStyle: 'roundtable',
    defaultDepth: 'normal',
    maxRounds: 5,
  },

  // 模式6：分头立论再汇总式
  'split-thesis': {
    id: 'split-thesis',
    name: '分头立论再汇总式',
    category: '多人圆桌合议',
    icon: '📋',
    description: '分工覆盖多维度',
    minRoles: 4,
    maxRoles: 10,
    rolesAreEqual: false,
    needsHost: true,
    defaultRoles: [
      { roleType: 'host', label: '主持人', description: '分配维度、汇总整合' },
      { roleType: 'dimension-1', label: '维度1方', description: '覆盖维度1' },
      { roleType: 'dimension-2', label: '维度2方', description: '覆盖维度2' },
      { roleType: 'dimension-3', label: '维度3方', description: '覆盖维度3' },
    ],
    flow: [
      {
        step: 1,
        actor: 'host',
        action: 'assign',
        label: '主持人分配维度',
        description: '拆分议题为多个维度，分配给各方',
      },
      {
        step: 2,
        actor: 'all-but-host',
        action: 'thesis',
        label: '各维度方独立输出',
        description: '各方独立输出该维度的观点',
      },
      {
        step: 3,
        actor: 'all',
        action: 'review',
        label: '互相审阅',
        description: '各方审阅其他维度的内容',
      },
      {
        step: 4,
        actor: 'all-but-host',
        action: 'supplement',
        label: '补充修正',
        description: '针对他人内容提出补充建议',
      },
      {
        step: 5,
        actor: 'host',
        action: 'integrate',
        label: '主持人汇总整合',
        description: '整合所有维度的内容',
      },
      {
        step: 6,
        actor: 'all',
        action: 'confirm',
        label: '全员确认',
        description: '审阅整合后的版本，确认通过',
      },
    ],
    displayStyle: 'roundtable',
    defaultDepth: 'detailed',
  },

  // 模式7：分工专项研讨式（PRD评审模式）
  'specialized': {
    id: 'specialized',
    name: '分工专项研讨式',
    category: '多人圆桌合议',
    icon: '⚙️',
    description: '严谨把控漏洞，适合PRD评审',
    minRoles: 5,
    maxRoles: 8,
    rolesAreEqual: false,
    needsHost: true,
    defaultRoles: [
      { roleType: 'host', label: '主持人', description: '控场协调' },
      { roleType: 'proposer', label: '立论方', description: '提出基础方案' },
      { roleType: 'supplementer', label: '补漏方', description: '补充未覆盖细节' },
      { roleType: 'critic', label: '挑错方', description: '排查漏洞风险' },
      { roleType: 'summarizer', label: '总结方', description: '整合输出最终版本' },
    ],
    flow: [
      {
        step: 1,
        actor: 'proposer',
        action: 'thesis',
        label: '立论方基础方案',
        description: '完整呈现核心思路和主要内容',
      },
      {
        step: 2,
        actor: 'supplementer',
        action: 'supplement',
        label: '补漏方补充细节',
        description: '补充未覆盖的细节、延伸角度',
      },
      {
        step: 3,
        actor: 'critic',
        action: 'criticize',
        label: '挑错方挑漏洞',
        description: '排查漏洞、潜在风险、不合理之处',
      },
      {
        step: 4,
        actor: 'proposer',
        action: 'revise',
        label: '立论方修正',
        description: '针对问题进行解释和修正',
      },
      {
        step: 5,
        actor: ['supplementer', 'critic'],
        action: 're-review',
        label: '补漏/挑错再审',
        description: '再次审查修正后的内容',
      },
      {
        step: 6,
        actor: 'summarizer',
        action: 'summary',
        label: '总结方输出',
        description: '整合所有内容，输出最终版本',
      },
      {
        step: 7,
        actor: 'all',
        action: 'confirm',
        label: '全员确认',
        description: '审阅最终版本，确认通过',
      },
    ],
    displayStyle: 'step',
    defaultDepth: 'normal',
  },

  // ========== 正式对抗辩论类 ==========

  // 模式8：标准正反方辩论赛制
  'standard-debate': {
    id: 'standard-debate',
    name: '标准正反方辩论赛制',
    category: '正式对抗辩论',
    icon: '⚔️',
    description: '非黑即白，明确立场输赢',
    minRoles: 4,
    maxRoles: 6,
    rolesAreEqual: false,
    needsHost: true,
    defaultRoles: [
      { roleType: 'host', label: '主持人', description: '主持辩论流程' },
      { roleType: 'pro-side', label: '正方', description: '支持立场' },
      { roleType: 'con-side', label: '反方', description: '反对立场' },
      { roleType: 'judge', label: '裁判', description: '评判胜负' },
    ],
    flow: [
      {
        step: 1,
        actor: 'pro-side',
        action: 'open',
        label: '正方立论',
        description: '亮明支持立场，阐述核心论据',
      },
      {
        step: 2,
        actor: 'con-side',
        action: 'open',
        label: '反方立论',
        description: '亮明反对立场，阐述核心论据',
      },
      {
        step: 3,
        actor: 'pro-side',
        action: 'rebut',
        label: '正方驳论',
        description: '针对反方论据反驳',
      },
      {
        step: 4,
        actor: 'con-side',
        action: 'rebut',
        label: '反方驳论',
        description: '针对正方论据反驳',
      },
      {
        step: 5,
        actor: 'all',
        action: 'free-debate',
        label: '自由辩论',
        description: '双方自由攻防',
        loop: true,
      },
      {
        step: 6,
        actor: ['pro-side', 'con-side'],
        action: 'summary',
        label: '双方总结',
        description: '重申核心立场',
      },
      {
        step: 7,
        actor: 'judge',
        action: 'judge',
        label: '裁判评判',
        description: '评判胜负，分析双方表现',
      },
    ],
    displayStyle: 'debate',
    defaultDepth: 'detailed',
  },

  // 模式9：质询答辩辩论制
  'qa-defense': {
    id: 'qa-defense',
    name: '质询答辩辩论制',
    category: '正式对抗辩论',
    icon: '🔍',
    description: '审核方案，深挖漏洞',
    minRoles: 3,
    maxRoles: 6,
    rolesAreEqual: false,
    needsHost: true,
    defaultRoles: [
      { roleType: 'host', label: '主持人', description: '主持流程' },
      { roleType: 'proposer', label: '立论方', description: '提出方案并答辩' },
      { roleType: 'questioner', label: '质询方', description: '质询方案漏洞' },
    ],
    flow: [
      {
        step: 1,
        actor: 'proposer',
        action: 'thesis',
        label: '立论方完整立论',
        description: '呈现完整方案/结论',
      },
      {
        step: 2,
        actor: 'questioner',
        action: 'question',
        label: '质询方提问',
        description: '针对立论内容提问，挖掘漏洞',
      },
      {
        step: 3,
        actor: 'proposer',
        action: 'defend',
        label: '立论方答辩',
        description: '回应质询，解释/修正',
      },
      {
        step: 4,
        actor: 'questioner',
        action: 'followup',
        label: '质询方追问',
        description: '基于答辩继续追问',
        loop: true,
      },
      {
        step: 5,
        actor: 'host',
        action: 'conclude',
        label: '主持人汇总',
        description: '整理质询和答辩，给出客观评价',
      },
    ],
    displayStyle: 'debate',
    defaultDepth: 'normal',
    maxFollowUps: 5,
  },

  // 模式10：三方三角辩论制
  'triangular': {
    id: 'triangular',
    name: '三方三角辩论制',
    category: '正式对抗辩论',
    icon: '🔺',
    description: '客观权衡利弊，折中结论',
    minRoles: 3,
    maxRoles: 6,
    rolesAreEqual: false,
    needsHost: false,
    defaultRoles: [
      { roleType: 'pro-side', label: '正方', description: '支持立场' },
      { roleType: 'con-side', label: '反方', description: '反对立场' },
      { roleType: 'neutral', label: '中立方', description: '折中分析' },
    ],
    flow: [
      {
        step: 1,
        actor: 'pro-side',
        action: 'open',
        label: '正方立论',
        description: '亮明支持立场，阐述核心论据',
      },
      {
        step: 2,
        actor: 'con-side',
        action: 'open',
        label: '反方立论',
        description: '亮明反对立场，阐述核心论据',
      },
      {
        step: 3,
        actor: 'neutral',
        action: 'analyze',
        label: '中立方分析',
        description: '亮明折中立场，客观分析双方',
      },
      {
        step: 4,
        actor: 'all',
        action: 'debate',
        label: '三角辩论',
        description: '正反双方互相质询，中立方点评引导',
      },
      {
        step: 5,
        actor: ['pro-side', 'con-side'],
        action: 'summary',
        label: '各方总结',
        description: '总结立场，回应中立方的点评',
      },
      {
        step: 6,
        actor: 'neutral',
        action: 'integrate',
        label: '中立方汇总',
        description: '整合三方观点，梳理综合结论',
      },
      {
        step: 7,
        actor: 'all',
        action: 'confirm',
        label: '三方共识',
        description: '补充异议，达成共识',
      },
    ],
    displayStyle: 'debate',
    defaultDepth: 'detailed',
  },

  // 模式11：驳论复盘辩论制
  'rebuttal-review': {
    id: 'rebuttal-review',
    name: '驳论复盘辩论制',
    category: '正式对抗辩论',
    icon: '🔄',
    description: '优化初步结论/方案',
    minRoles: 5,
    maxRoles: 10,
    rolesAreEqual: false,
    needsHost: false,
    defaultRoles: [
      { roleType: 'proposer', label: '立论方', description: '提出初始方案' },
      { roleType: 'critic-logic', label: '驳论方-逻辑', description: '从逻辑角度反驳' },
      { roleType: 'critic-detail', label: '驳论方-细节', description: '从细节角度反驳' },
      { roleType: 'critic-risk', label: '驳论方-风险', description: '从风险角度反驳' },
      { roleType: 'summarizer', label: '总结方', description: '整合优化结论' },
    ],
    flow: [
      {
        step: 1,
        actor: 'proposer',
        action: 'thesis',
        label: '立论方完整立论',
        description: '完整呈现初步结论/方案',
      },
      {
        step: 2,
        actor: 'all-critics',
        action: 'rebut',
        label: '驳论方轮流反驳',
        description: '从逻辑、细节、风险角度反驳',
      },
      {
        step: 3,
        actor: 'proposer',
        action: 'respond',
        label: '立论方回应',
        description: '逐一回应驳论，有漏洞则修正',
      },
      {
        step: 4,
        actor: 'all-critics',
        action: 're-review',
        label: '驳论方再审',
        description: '再次审查，若仍有漏洞继续驳论',
      },
      {
        step: 5,
        actor: 'summarizer',
        action: 'integrate',
        label: '总结方整合',
        description: '整合所有修正建议，输出最终版本',
      },
      {
        step: 6,
        actor: 'all',
        action: 'confirm',
        label: '全员审阅',
        description: '审阅最终版本，确认无漏洞',
      },
    ],
    displayStyle: 'debate',
    defaultDepth: 'detailed',
  },

  // ========== 结构化议事决策类 ==========

  // 模式12：提案表决式
  'proposal-vote': {
    id: 'proposal-vote',
    name: '提案表决式',
    category: '结构化议事决策',
    icon: '🗳️',
    description: '多方案快速决策',
    minRoles: 4,
    maxRoles: 20,
    rolesAreEqual: false,
    needsHost: true,
    defaultRoles: [
      { roleType: 'host', label: '主持人', description: '主持投票' },
      { roleType: 'proposer', label: '提案方', description: '提出方案' },
      { roleType: 'voter', label: '投票方', description: '投票表决' },
    ],
    flow: [
      {
        step: 1,
        actor: 'proposer',
        action: 'propose',
        label: '提案方说明方案',
        description: '清晰阐述方案内容，说明优缺点',
      },
      {
        step: 2,
        actor: 'voters',
        action: 'question',
        label: '投票方提问',
        description: '针对方案提问，澄清疑惑',
      },
      {
        step: 3,
        actor: 'proposer',
        action: 'answer',
        label: '提案方答辩',
        description: '回答问题，补充说明',
      },
      {
        step: 4,
        actor: 'voters',
        action: 'discuss',
        label: '投票方讨论',
        description: '私下交流意见',
      },
      {
        step: 5,
        actor: 'voters',
        action: 'vote',
        label: '正式投票',
        description: '同意/反对/弃权',
      },
      {
        step: 6,
        actor: 'host',
        action: 'result',
        label: '宣布结果',
        description: '宣布结果，达成共识或重新讨论',
      },
    ],
    displayStyle: 'step',
    defaultDepth: 'normal',
    votingRules: {
      majority: true,
      threshold: 0.5,
      allowAbstain: true,
    },
  },

  // 模式13：问题拆解逐级研讨式
  'problem-breakdown': {
    id: 'problem-breakdown',
    name: '问题拆解逐级研讨式',
    category: '结构化议事决策',
    icon: '📊',
    description: '复杂问题逐层突破',
    minRoles: 3,
    maxRoles: 10,
    rolesAreEqual: true,
    needsHost: true,
    defaultRoles: [
      { roleType: 'host', label: '主持人', description: '拆分问题' },
      { roleType: 'member', label: '成员', description: '参与研讨' },
    ],
    flow: [
      {
        step: 1,
        actor: 'host',
        action: 'breakdown',
        label: '主持人拆分问题',
        description: '将大问题拆分为子问题，明确层级关系',
      },
      {
        step: 2,
        actor: 'all',
        action: 'discuss-sub',
        label: '研讨子问题',
        description: '逐个研讨所有子问题',
        loop: true,
      },
      {
        step: 3,
        actor: 'host',
        action: 'integrate',
        label: '汇总整合',
        description: '汇总所有子结论，形成完整方案',
      },
      {
        step: 4,
        actor: 'all',
        action: 'confirm',
        label: '全员确认',
        description: '审阅完整方案，确认通过',
      },
    ],
    displayStyle: 'step',
    defaultDepth: 'detailed',
  },

  // 模式14：优缺点分列合议式
  'pros-cons': {
    id: 'pros-cons',
    name: '优缺点分列合议式',
    category: '结构化议事决策',
    icon: '⚖️',
    description: '评估单一对象优劣，明确取舍',
    minRoles: 4,
    maxRoles: 10,
    rolesAreEqual: false,
    needsHost: true,
    defaultRoles: [
      { roleType: 'host', label: '主持人', description: '主持讨论' },
      { roleType: 'pros-side', label: '优点方', description: '罗列优点' },
      { roleType: 'cons-side', label: '缺点方', description: '罗列缺点' },
      { roleType: 'neutral', label: '综合方', description: '给出结论' },
    ],
    flow: [
      {
        step: 1,
        actor: 'host',
        action: 'define',
        label: '主持人明确对象',
        description: '明确本次讨论的核心对象',
      },
      {
        step: 2,
        actor: 'pros-side',
        action: 'list-pros',
        label: '优点方罗列优点',
        description: '不重复、不夸大，聚焦优势和可行性',
      },
      {
        step: 3,
        actor: 'cons-side',
        action: 'list-cons',
        label: '缺点方罗列缺点',
        description: '不遗漏、不放大，聚焦漏洞和不足',
      },
      {
        step: 4,
        actor: 'all',
        action: 'analyze',
        label: '权衡分析讨论',
        description: '分析优缺点权重和可规避性',
      },
      {
        step: 5,
        actor: 'neutral',
        action: 'conclude',
        label: '综合方给出结论',
        description: '结合分析，给出中立结论和取舍建议',
      },
      {
        step: 6,
        actor: 'all',
        action: 'confirm',
        label: '各方补充',
        description: '补充异议，达成共识',
      },
    ],
    displayStyle: 'step',
    defaultDepth: 'normal',
  },

  // ========== 头脑风暴共创类 ==========

  // 模式15：发散头脑风暴式
  'brainstorm': {
    id: 'brainstorm',
    name: '发散头脑风暴式',
    category: '头脑风暴共创',
    icon: '💡',
    description: '收集大量创意',
    minRoles: 2,
    maxRoles: 20,
    rolesAreEqual: true,
    needsHost: true,
    defaultRoles: [
      { roleType: 'host', label: '主持人', description: '引导发散、归类汇总' },
      { roleType: 'ideator', label: '创意者', description: '提出创意' },
    ],
    brainstormRules: [
      '不批评任何想法',
      '鼓励疯狂的想法',
      '追求数量而非质量',
      '可以基于他人想法延伸',
    ],
    flow: [
      {
        step: 1,
        actor: 'host',
        action: 'open',
        label: '主持人开场',
        description: '介绍议题，宣布规则，鼓励发散',
      },
      {
        step: 2,
        actor: 'all',
        action: 'collect',
        label: '自由收集创意',
        description: '所有人自由发言提出创意',
        loop: true,
      },
      {
        step: 3,
        actor: 'host',
        action: 'cluster',
        label: '观点归类',
        description: '将所有创意归类整理',
      },
      {
        step: 4,
        actor: 'all',
        action: 'vote',
        label: '投票选择',
        description: '针对各类创意投票',
      },
      {
        step: 5,
        actor: 'all',
        action: 'deep-discuss',
        label: '深化讨论',
        description: '针对高票创意深入讨论',
      },
      {
        step: 6,
        actor: 'host',
        action: 'conclude',
        label: '输出结论',
        description: '形成创意方案',
      },
    ],
    displayStyle: 'card',
    defaultDepth: 'brief',
  },

  // 模式16：创意接龙讨论式
  'idea-chain': {
    id: 'idea-chain',
    name: '创意接龙讨论式',
    category: '头脑风暴共创',
    icon: '🔗',
    description: '迭代优化基础创意',
    minRoles: 2,
    maxRoles: 20,
    rolesAreEqual: true,
    needsHost: false,
    defaultRoles: [
      { roleType: 'initiator', label: '发起人', description: '提出初始创意' },
      { roleType: 'chainer', label: '接龙者', description: '接力延伸创意' },
    ],
    flow: [
      {
        step: 1,
        actor: 0,
        action: 'start',
        label: '发起人开场',
        description: '提出初始创意/方案',
      },
      {
        step: 2,
        actor: 1,
        action: 'extend',
        label: '接龙者1延伸',
        description: '基于初始创意，补充新角度/元素',
      },
      {
        step: 3,
        actor: 'all',
        action: 'continue-chain',
        label: '继续接龙',
        description: '继续叠加新元素，迭代优化',
        loop: true,
      },
      {
        step: 4,
        actor: 'all',
        action: 'conclude',
        label: '整合输出',
        description: '整合所有接龙内容，形成完整方案',
      },
    ],
    displayStyle: 'card',
    defaultDepth: 'normal',
  },

  // ========== 多AI专属协同类 ==========

  // 模式17：主AI牵头+副AI补位式
  'ai-lead-supplement': {
    id: 'ai-lead-supplement',
    name: '主AI牵头+副AI补位式',
    category: '多AI专属协同',
    icon: '🤖',
    description: '核心主导，快速落地',
    minRoles: 3,
    maxRoles: 10,
    rolesAreEqual: false,
    needsHost: false,
    mainAIIsHost: true,
    defaultRoles: [
      { roleType: 'main-ai', label: '主AI', description: '主导讨论方向' },
      { roleType: 'sub-ai', label: '副AI', description: '补充专业视角' },
    ],
    flow: [
      {
        step: 1,
        actor: 'main-ai',
        action: 'lead',
        label: '主AI主导开场',
        description: '分析议题，确定讨论方向，分配任务',
      },
      {
        step: 2,
        actor: 'sub-ai',
        action: 'supplement',
        label: '副AI专业补充',
        description: '针对分配的维度，提供专业补充',
        loop: true,
      },
      {
        step: 3,
        actor: 'main-ai',
        action: 'integrate',
        label: '主AI汇总',
        description: '整合所有补充，平衡各维度',
      },
      {
        step: 4,
        actor: 'sub-ai',
        action: 'review',
        label: '副AI审阅',
        description: '审阅结论，确认无遗漏',
      },
    ],
    displayStyle: 'hub-spoke',
    defaultDepth: 'normal',
  },

  // 模式18：平行AI独立输出再整合式
  'ai-parallel': {
    id: 'ai-parallel',
    name: '平行AI独立输出再整合式',
    category: '多AI专属协同',
    icon: '⚡',
    description: '多维度无干扰观点',
    minRoles: 3,
    maxRoles: 10,
    rolesAreEqual: true,
    needsHost: false,
    parallelMode: true,
    defaultRoles: [
      { roleType: 'ai', label: 'AI', description: '独立输出' },
    ],
    flow: [
      {
        step: 1,
        actor: 'all',
        action: 'assign-dimension',
        label: '分配维度',
        description: '给每个AI分配独立维度',
      },
      {
        step: 2,
        actor: 'all',
        action: 'independent-output',
        label: 'AI独立输出',
        description: '各AI独立思考，不受干扰',
        parallel: true,
      },
      {
        step: 3,
        actor: 'all',
        action: 'integrate',
        label: '汇总整合',
        description: '收集所有输出，整合成完整结论',
      },
      {
        step: 4,
        actor: 'all',
        action: 'confirm',
        label: '各AI确认',
        description: '审阅整合结果，补充修正',
      },
    ],
    displayStyle: 'hub-spoke',
    defaultDepth: 'detailed',
  },

  // 模式19：角色模拟合议式
  'ai-role-simulation': {
    id: 'ai-role-simulation',
    name: '角色模拟合议式',
    category: '多AI专属协同',
    icon: '🎭',
    description: '多专业视角覆盖',
    minRoles: 4,
    maxRoles: 10,
    rolesAreEqual: false,
    needsHost: false,
    mainAIIsHost: true,
    defaultRoles: [
      { roleType: 'main-ai', label: '主AI', description: '分配角色、汇总整合' },
      { roleType: 'expert-tech', label: '技术专家AI', description: '技术视角' },
      { roleType: 'expert-business', label: '业务专家AI', description: '业务视角' },
      { roleType: 'expert-risk', label: '风险专家AI', description: '风险视角' },
    ],
    flow: [
      {
        step: 1,
        actor: 'main-ai',
        action: 'assign',
        label: '主AI分配角色',
        description: '分析议题涉及的专业维度，分配专家角色',
      },
      {
        step: 2,
        actor: 'experts',
        action: 'expert-opinion',
        label: '各专家AI独立发表',
        description: '严格代入专家角色，聚焦自身领域',
        parallel: true,
      },
      {
        step: 3,
        actor: 'experts',
        action: 'question',
        label: '各专家AI互相提问',
        description: '站在自身专业角度，对其他专家提问',
      },
      {
        step: 4,
        actor: 'main-ai',
        action: 'guide',
        label: '主AI引导聚焦',
        description: '引导讨论聚焦核心争议，确保每个维度被覆盖',
      },
      {
        step: 5,
        actor: 'main-ai',
        action: 'integrate',
        label: '主AI整合',
        description: '整合所有专业视角，形成初步结论',
      },
      {
        step: 6,
        actor: 'experts',
        action: 'review',
        label: '各专家AI审阅',
        description: '审阅初步结论，确认无遗漏，达成共识',
      },
    ],
    displayStyle: 'hub-spoke',
    defaultDepth: 'detailed',
  },
};

// 获取所有模式
export const getAllModes = () => Object.values(DISCUSSION_MODES);

// 获取某分类下的所有模式
export const getModesByCategory = (category) => {
  return Object.values(DISCUSSION_MODES).filter((mode) => mode.category === category);
};

// 根据ID获取模式
export const getModeById = (id) => DISCUSSION_MODES[id];

// 获取模式类别列表
export const getModeCategories = () => {
  const categories = {};
  Object.values(DISCUSSION_MODES).forEach((mode) => {
    if (!categories[mode.category]) {
      categories[mode.category] = [];
    }
    categories[mode.category].push(mode);
  });
  return categories;
};

// PRD评审模式（简化别名）
export const PRD_REVIEW_MODE = DISCUSSION_MODES['specialized'];