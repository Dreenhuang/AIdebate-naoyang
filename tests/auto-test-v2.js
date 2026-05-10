/**
 * PRD辩论系统 - 自动化测试程序 V2.0
 * 
 * 改进点：
 * - ✅ 修复字段映射（完全匹配后端事件格式）
 * - ✅ 覆盖全部13种辩论模式
 * - ✅ 增强超时处理和错误恢复
 * - ✅ 完善日志输出
 * - ✅ 智能等待机制（debate:complete事件）
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const CONFIG = {
  backendUrl: 'http://localhost:9528',
  wsUrl: 'ws://localhost:9528',
  testTimeout: 180000, // 3分钟超时（多轮讨论需要更长时间）
  outputDir: path.join(__dirname, '../test-reports'),
};

// ==================== 后端事件字段映射表 ====================
// 后端格式: { type: '事件名', payload: { ...数据 } }
const EVENT_FIELDS = {
  // 阶段切换事件
  'debate:phase': {
    phase: '当前阶段索引(从0开始)',
    phaseId: '阶段ID(probe/design/impl/validate)',
    phaseName: '阶段中文名',
    totalPhases: '总阶段数',
    totalRounds: '每阶段轮次数',
  },
  
  // 轮次事件
  'debate:round': {
    round: '当前轮次(从1开始)',
    phase: '当前阶段索引',
    phaseId: '阶段ID',
    totalRounds: '总轮次',
    totalPhases: '总阶段数',
  },
  
  // 消息事件（核心）
  'debate:message': {
    type: '消息类型(proposal/review/consensus)',
    role: '角色类型(ideator/proposer/reviewer等)',
    roleName: '角色显示名称',
    round: '轮次',
    phase: '阶段',
    phaseId: '阶段ID',
    content: '消息内容文本',
    timestamp: 'ISO时间戳',
  },
  
  // 流式输出开始
  'debate:stream:start': {
    model: '使用的AI模型',
    timestamp: '开始时间',
    role: '发言角色类型',
    roleName: '发言角色名称',
    phase: '阶段',
    round: '轮次',
    phaseId: '阶段ID',
  },
  
  // 流式输出结束
  'debate:stream:end': {
    totalChunks: '总块数',
    contentLength: '内容长度(字符)',
    timestamp: '结束时间',
  },
  
  // 辩论完成
  'debate:complete': {
    // 需要确认具体字段
  },
  
  // 错误事件
  'debate:error': {
    message: '错误信息',
    role: '出错的角色(可选)',
    timestamp: '时间戳',
  },
  
  // 状态更新
  'debate:status': {
    status: '状态字符串',
    message: '状态描述',
  },
};

// ==================== 13种辩论模式的完整测试用例 ====================
const TEST_CASES = [
  // ====== 基础模式 (5种) ======
  {
    id: 'TC-001',
    modeId: 'brainstorm',
    modeName: '发散头脑风暴',
    topic: '人工智能是否会取代人类的工作？',
    expectedRoles: ['host', 'ideator'],
    roundsPerPhase: 2,
    totalPhases: 2,
    expectations: { minMessages: 3, hasCreativeIdeas: true },
    description: '创意激发型头脑风暴，生成新颖想法',
  },
  {
    id: 'TC-002',
    modeId: 'standard-debate',
    modeName: '标准正反方辩论',
    topic: '远程办公是否应该成为常态？',
    expectedRoles: ['host', 'pro-side', 'con-side', 'judge'],
    roundsPerPhase: 2,
    totalPhases: 2,
    expectations: { minMessages: 5, hasProArguments: true, hasConArguments: true },
    description: '标准正反方对抗性辩论',
  },
  {
    id: 'TC-003',
    modeId: 'roundtable',
    modeName: '圆桌讨论',
    topic: '如何平衡工作与生活？',
    expectedRoles: ['host', 'member'],
    roundsPerPhase: 2,
    totalPhases: 2,
    expectations: { minMessages: 3, balancedDiscussion: true },
    description: '平等参与的圆桌式讨论',
  },
  {
    id: 'TC-004',
    modeId: 'review',
    modeName: '方案评审',
    topic: '评估"每周四天工作制"方案的可行性',
    expectedRoles: ['host', 'presenter', 'supplementer', 'critic', 'summarizer'],
    roundsPerPhase: 1,
    totalPhases: 1,
    expectations: { minMessages: 4, hasProposal: true, hasCritique: true },
    description: '多角色方案评审流程',
  },
  {
    id: 'TC-005',
    modeId: 'voting',
    modeName: '投票决策',
    topic: '是否应该在公司实施AI监控员工系统？',
    expectedRoles: ['host', 'proposer', 'voter'],
    roundsPerPhase: 2,
    totalPhases: 2,
    expectations: { minMessages: 3, hasProposal: true },
    description: '提案+投票决策流程',
  },

  // ====== 进阶模式 (4种) ======
  {
    id: 'TC-006',
    modeId: 'workshop',
    modeName: '工作坊研讨',
    topic: '设计一个面向初学者的编程学习平台',
    expectedRoles: ['host', 'facilitator', 'participant', 'recorder'],
    roundsPerPhase: 2,
    totalPhases: 2,
    expectations: { minMessages: 4, hasWorkshopOutput: true },
    description: '结构化工作坊研讨',
  },
  {
    id: 'TC-007',
    modeId: 'multi-dimension',
    modeName: '多维度分析',
    topic: '分析"新能源汽车普及"的多维度影响',
    expectedRoles: ['host', 'dimension-1', 'dimension-2', 'dimension-3', 'synthesizer'],
    roundsPerPhase: 1,
    totalPhases: 1,
    expectations: { minMessages: 4, multiDimensional: true },
    description: '从多个维度深入分析问题',
  },
  {
    id: 'TC-008',
    modeId: 'pros-cons',
    modeName: '优缺点分析',
    topic: '全面分析"远程教育"的利弊',
    expectedRoles: ['host', 'pros-side', 'cons-side', 'evaluator'],
    roundsPerPhase: 2,
    totalPhases: 2,
    expectations: { minMessages: 4, hasPros: true, hasCons: true },
    description: '系统性的优缺点对比分析',
  },
  {
    id: 'TC-009',
    modeId: 'ideation-chain',
    modeName: '创意接龙',
    topic: '如何让城市交通更加智能化？',
    expectedRoles: ['host', 'initiator', 'chainer'],
    roundsPerPhase: 3,
    totalPhases: 2,
    expectations: { minMessages: 5, chainContinuity: true },
    description: '接龙式创意发散',
  },

  // ====== AI协作模式 (2种) ======
  {
    id: 'TC-010',
    modeId: 'ai-collaboration',
    modeName: 'AI协作创作',
    topic: '共同撰写一篇关于"未来教育形态"的文章',
    expectedRoles: ['human', 'ai', 'reviewer'],
    roundsPerPhase: 2,
    totalPhases: 2,
    expectations: { minMessages: 4, humanAICollab: true },
    description: '人类与AI协同创作',
  },
  {
    id: 'TC-011',
    modeId: 'ai-expert-panel',
    modeName: 'AI专家会诊',
    topic: '评估"区块链技术在供应链管理中的应用前景"',
    expectedRoles: ['moderator', 'expert-tech', 'expert-business', 'expert-risk', 'synthesizer'],
    roundsPerPhase: 1,
    totalPhases: 1,
    expectations: { minMessages: 4, expertOpinions: true },
    description: '多位AI专家联合诊断',
  },

  // ====== 特殊模式 (2种) ======
  {
    id: 'TC-012',
    modeId: 'dual-perspective',
    modeName: '双方视角对话',
    topic: '从企业和员工双视角讨论"弹性工作制"',
    expectedRoles: ['host', 'participant-a', 'participant-b', 'mediator'],
    roundsPerPhase: 2,
    totalPhases: 2,
    expectations: { minMessages: 4, dualPerspective: true },
    description: '换位思考的双视角对话',
  },
  {
    id: 'TC-013',
    modeId: 'structured-discussion',
    modeName: '结构化讨论',
    topic: '制定"团队代码审查规范"',
    expectedRoles: ['host', 'proposer', 'questioner', 'answerer', 'summarizer'],
    roundsPerPhase: 2,
    totalPhases: 2,
    expectations: { minMessages: 5, structuredFlow: true },
    description: '严格按流程的结构化讨论',
  },
];

// ==================== 角色模板库 ====================
const ROLE_TEMPLATES = {
  // 基础角色
  host: { name: '主持人', soul: '你是一位公正的主持人，负责引导讨论流程。' },
  moderator: { name: '协调员', soul: '你负责协调各方观点。' },
  
  // 头脑风暴
  ideator: { name: '创意者', soul: '你是一位富有创意的思考者，善于提出新颖想法。' },
  brainstormer: { name: '风暴者', soul: '你擅长快速产生大量创意点子。' },
  
  // 辩论角色
  'pro-side': { name: '正方', soul: '你是正方辩手，支持并论证当前立场。' },
  'con-side': { name: '反方', soul: '你是反方辩手，反对并质疑对方观点。' },
  judge: { name: '裁判', soul: '你是裁判，公正评判双方表现。' },
  debater: { name: '辩手', soul: '你是一位辩论高手。' },
  
  // 方案评审
  presenter: { name: '方案方', soul: '你负责提出和展示方案。' },
  supplementer: { name: '补位方', soul: '你负责补充遗漏细节。' },
  critic: { name: '挑错方', soul: '你负责发现问题和风险。' },
  summarizer: { name: '总结方', soul: '你负责整合总结。' },
  
  // 投票决策
  proposer: { name: '提案方', soul: '你负责提出提案。' },
  voter: { name: '投票方', soul: '你负责投票表决。' },
  
  // 圆桌/工作坊
  member: { name: '成员', soul: '你是一位积极参与的成员。' },
  facilitator: { name: '引导师', soul: '你负责引导讨论方向。' },
  participant: { name: '参与者', soul: '你积极参与讨论。' },
  recorder: { name: '记录员', soul: '你负责记录要点。' },
  
  // 多维度分析
  'dimension-1': { name: '技术维度', soul: '你从技术角度分析问题。' },
  'dimension-2': { name: '商业维度', soul: '你从商业角度分析问题。' },
  'dimension-3': { name: '社会维度', soul: '你从社会角度分析问题。' },
  synthesizer: { name: '综合者', soul: '你整合各维度观点。' },
  
  // 优缺点分析
  'pros-side': { name: '优点方', soul: '你列举优点和好处。' },
  'cons-side': { name: '缺点方', soul: '你列举缺点和风险。' },
  evaluator: { name: '评估员', soul: '你综合评估利弊。' },
  
  // 创意接龙
  initiator: { name: '发起人', soul: '你首先提出创意想法。' },
  chainer: { name: '接龙者', soul: '你在前人的基础上延伸发展。' },
  
  // AI协作
  human: { name: '人类代表', soul: '你代表人类的视角和需求。' },
  ai: { name: 'AI助手', soul: '你作为AI提供客观分析和建议。' },
  reviewer: { name: '审阅者', soul: '你审阅并改进产出物。' },
  
  // 专家会诊
  'expert-tech': { name: '技术专家', soul: '你从技术专业角度分析。' },
  'expert-business': { name: '商业专家', soul: '你从商业价值角度分析。' },
  'expert-risk': { name: '风控专家', soul: '你从风险管理角度分析。' },
  
  // 双视角
  'participant-a': { name: '视角A', soul: '你代表第一方视角。' },
  'participant-b': { name: '视角B', soul: '你代表第二方视角。' },
  mediator: { name: '调解员', soul: '你促进双方理解。' },
  
  // 结构化讨论
  questioner: { name: '提问方', soul: '你提出关键问题。' },
  answerer: { name: '回答方', soul: '你回答问题并提供方案。' },
};

// ==================== 测试引擎类 V2.0 ====================
class DebateTestEngineV2 {
  constructor() {
    this.results = [];
    this.currentTest = null;
    this.ws = null;
    this.messageBuffer = [];
    this.eventLog = [];
    this.startTime = null;
    this.testCompleteResolver = null;
    this.streamActiveCount = 0;
    this.totalStreamEnds = 0;
  }

  /**
   * 运行所有测试用例
   */
  async runAllTests() {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║     PRD辩论系统 - 自动化测试程序 V2.0 (完整版)           ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    console.log(`🚀 开始运行自动化测试...`);
    console.log(`📋 共 ${TEST_CASES.length} 个测试用例 (覆盖13种辩论模式)\n`);
    
    for (let i = 0; i < TEST_CASES.length; i++) {
      const testCase = TEST_CASES[i];
      console.log(`\n${'═'.repeat(70)}`);
      console.log(`📝 [${i + 1}/${TEST_CASES.length}] ${testCase.id}: ${testCase.modeName}`);
      console.log(`📌 ${testCase.description}`);
      console.log(`${'═'.repeat(70)}`);
      
      try {
        const result = await this.runSingleTest(testCase);
        this.results.push(result);
        
        const status = result.passed ? '✅ 通过' : '❌ 失败';
        const score = result.qualityScore ? `${result.qualityScore.total}/100` : 'N/A';
        const msgs = `${result.messageCount}条消息`;
        const streams = `${result.streamCount || 0}次流式输出`;
        console.log(`\n结果: ${status} | 质量分: ${score} | ${msgs} | ${streams}`);
      } catch (error) {
        console.error(`\n❌ 测试异常:`, error.message);
        this.results.push({
          ...testCase,
          passed: false,
          error: error.message,
          duration: Date.now() - (this.startTime || Date.now()),
          qualityScore: null,
          messageCount: 0,
          streamCount: 0,
        });
      }
      
      // 测试间间隔，避免服务器压力过大
      if (i < TEST_CASES.length - 1) {
        await this.sleep(2000);
      }
    }
    
    return this.results;
  }

  /**
   * 运行单个测试用例
   */
  async runSingleTest(testCase) {
    this.currentTest = testCase;
    this.messageBuffer = [];
    this.eventLog = [];
    this.startTime = Date.now();
    this.streamActiveCount = 0;
    this.totalStreamEnds = 0;

    console.log(`\n🎯 主题: ${testCase.topic}`);
    console.log(`👥 角色: ${testCase.expectedRoles.join(', ')}`);
    console.log(`⚙️ 配置: ${testCase.roundsPerPhase}轮/阶段 × ${testCase.totalPhases}阶段`);
    
    return new Promise((resolve, reject) => {
      let timeoutId = null;
      let completed = false;

      const completeTest = () => {
        if (completed) return;
        completed = true;
        clearTimeout(timeoutId);
        
        const duration = Date.now() - this.startTime;
        const evaluation = this.evaluateResult(testCase);
        
        resolve({
          ...testCase,
          duration,
          messageCount: this.messageBuffer.length,
          streamCount: this.totalStreamEnds,
          eventCount: this.eventLog.length,
          messages: [...this.messageBuffer],
          events: [...this.eventLog],
          passed: evaluation.passed,
          qualityScore: evaluation.score,
          issues: evaluation.issues,
          recommendations: evaluation.recommendations,
        });
        
        this.disconnect();
      };

      // 设置超时
      timeoutId = setTimeout(() => {
        console.warn(`\n⏰ 测试超时 (${CONFIG.testTimeout / 1000}s)，强制完成...`);
        completeTest();
      }, CONFIG.testTimeout);

      // 连接WebSocket
      this.connect((success) => {
        if (!success) {
          clearTimeout(timeoutId);
          reject(new Error('WebSocket连接失败'));
          return;
        }

        // 发送开始请求
        this.startDebate(testCase);
      });

      // 设置完成回调
      this.onComplete = completeTest;
      this.onError = (error) => {
        console.error(`\n⚠️ 收到错误事件:`, error);
        // 错误也视为一种完成状态，继续评估已有数据
        setTimeout(completeTest, 1000);
      };
    });
  }

  /**
   * 连接WebSocket服务器
   */
  connect(callback) {
    try {
      this.ws = new WebSocket(CONFIG.wsUrl);
      
      this.ws.on('open', () => {
        console.log('✅ WebSocket 已连接');
        callback(true);
      });

      this.ws.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          this.handleMessage(parsed);
        } catch (e) {
          console.warn('⚠️ 消息解析失败:', e.message.substring(0, 100));
        }
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket 错误:', error.message);
        callback(false);
      });

      this.ws.on('close', () => {
        console.log('🔌 WebSocket 已断开');
      });
    } catch (error) {
      console.error('❌ 连接异常:', error.message);
      callback(false);
    }
  }

  disconnect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 发送开始辩论请求（修正后的格式）
   */
  startDebate(testCase) {
    const payload = {
      topic: testCase.topic,
      roles: this.generateRoles(testCase),
      roundsPerPhase: testCase.roundsPerPhase,
      totalPhases: testCase.totalPhases,
      outputDepth: 'brief', // 使用brief加快测试速度
      modeId: testCase.modeId,
      displayStyle: 'card',
    };

    console.log(`\n📤 发送 debate:start 请求...`);
    this.eventLog.push({ type: 'send', event: 'debate:start', timestamp: Date.now(), payload: JSON.stringify(payload).substring(0, 150) });
    
    // 🔥 关键修复：后端期望 { type, payload } 格式
    this.ws.send(JSON.stringify({ type: 'debate:start', payload }));
  }

  /**
   * 生成测试角色
   */
  generateRoles(testCase) {
    return testCase.expectedRoles.map((roleType, index) => ({
      id: Date.now() + index,
      name: ROLE_TEMPLATES[roleType]?.name || roleType,
      roleType,
      soul: ROLE_TEMPLATES[roleType]?.soul || '',
      soulPresetId: null,
      model: 'deepseek-v4-flash',
    }));
  }

  /**
   * 🔥 核心方法：处理后端消息（V2.1 增强版 - 完善字段映射）
   * 
   * 后端格式: { type: '事件名', payload: {...数据} }
   * 兼容格式: { event: '事件名', data: {...数据} } (旧版本)
   */
  handleMessage(data) {
    // 🔥 V2.1: 多格式兼容解析
    let type, payload;
    
    if (data.type) {
      // 标准格式: { type, payload }
      type = data.type;
      payload = data.payload || data.data || data;
    } else if (data.event) {
      // 兼容格式: { event, data }
      type = data.event;
      payload = data.data || data.payload || data;
    } else if (typeof data === 'string') {
      // 字符串格式（尝试JSON解析）
      try {
        const parsed = JSON.parse(data);
        type = parsed.type || parsed.event;
        payload = parsed.payload || parsed.data || parsed;
      } catch (e) {
        console.warn('⚠️ 无法解析字符串消息:', data.substring(0, 100));
        return;
      }
    } else {
      // 其他格式，记录原始数据
      console.warn('⚠️ 收到未知格式的消息:', JSON.stringify(data).substring(0, 150));
      this.eventLog.push({ 
        type: 'receive', 
        event: 'unknown', 
        timestamp: Date.now(),
        payloadPreview: JSON.stringify(data).substring(0, 200),
        formatError: true,
      });
      return;
    }

    if (!type) {
      console.warn('⚠️ 收到无type的消息:', JSON.stringify(data).substring(0, 100));
      return;
    }

    // 记录原始事件（包含完整payload预览）
    this.eventLog.push({ 
      type: 'receive', 
      event: type, 
      timestamp: Date.now(),
      payloadPreview: JSON.stringify(payload || {}).substring(0, 300),
      payloadKeys: Object.keys(payload || {}),
    });

    // 🔥 V2.1: 增强的事件分发
    switch (type) {
      case 'debate:message':
        this.handleMessageEvent(payload);
        break;
        
      case 'debate:stream:start':
        this.streamActiveCount++;
        const streamRoleName = payload?.roleName || payload?.role || '未知';
        const streamModel = payload?.model || '未指定';
        console.log(`  🔄 [流式#${this.streamActiveCount}] 开始: ${streamRoleName} (模型: ${streamModel})`);
        break;
        
      case 'debate:stream:end':
        this.totalStreamEnds++;
        const chars = payload?.contentLength || payload?.length || 0;
        const chunks = payload?.totalChunks || payload?.chunks || 0;
        const duration = payload?.duration || 0;
        console.log(`  ✅ [流式#${this.totalStreamEnds}] 结束: ${chars}字符 (${chunks}块) ${duration > 0 ? `${duration}ms` : ''}`);
        break;
        
      case 'debate:round':
        const roundNum = payload?.round || payload?.roundNumber || '?';
        const totalRounds = payload?.totalRounds || payload?.total || '?';
        const phaseId = payload?.phaseId || payload?.phase || '?';
        console.log(`  📍 第 ${roundNum}/${totalRounds} 轮 (阶段: ${phaseId})`);
        break;
        
      case 'debate:phase':
        const phaseName = payload?.phaseName || payload?.name || payload?.phaseId || '?';
        const phaseIndex = payload?.phase || payload?.index || '?';
        const totalPhases = payload?.totalPhases || payload?.total || '?';
        console.log(`  ➡️ 阶段${phaseIndex}/${totalPhases}: ${phaseName}`);
        break;
        
      case 'debate:complete':
        console.log(`  🏁 辩论完成!`);
        // 🔥 V2.1: 延迟完成，确保所有消息都已接收
        setTimeout(() => {
          if (this.onComplete) this.onComplete();
        }, 500);
        break;
        
      case 'debate:error':
        const errMsg = payload?.message || payload?.error || payload?.msg || '未知错误';
        const errorRole = payload?.role || payload?.roleName || '';
        console.error(`  ❌ 错误${errorRole ? `(${errorRole})` : ''}: ${errMsg}`);
        if (this.onError) this.onError(errMsg);
        break;
        
      case 'debate:status':
        const status = payload?.status || payload?.state || 'unknown';
        const statusMsg = payload?.message || payload?.msg || '';
        console.log(`  📊 状态更新: ${status}${statusMsg ? ` - ${statusMsg}` : ''}`);
        break;
        
      case 'debate:progress':
        const progress = payload?.progress || payload?.percent || 0;
        const progressMsg = payload?.message || payload?.msg || '';
        if (parseInt(progress) % 25 === 0) { // 每25%显示一次
          console.log(`  ⏳ 进度: ${progress}%${progressMsg ? ` - ${progressMsg}` : ''}`);
        }
        break;

      // 🔥 V2.1: 新增事件类型支持
      case 'debate:thinking':
        console.log(`  💭 AI思考中... (${payload?.role || '未知'})`);
        break;

      case 'debate:role:start':
        console.log(`  👤 角色开始发言: ${payload?.roleName || payload?.role || '未知'}`);
        break;

      case 'debate:role:end':
        console.log(`  👤 角色发言结束: ${payload?.roleName || payload?.role || '未知'}`);
        break;
        
      default:
        // 其他未识别事件，记录但不报错
        console.log(`  ℹ️ [${type}]`, Object.keys(payload || {}).join(', '));
        break;
    }
  }

  /**
   * 处理消息事件（使用正确的字段名）
   */
  handleMessageEvent(payload) {
    if (!payload) return;
    
    // 🔥 使用后端实际字段名
    const message = {
      id: payload.id || `msg-${Date.now()}`,
      type: payload.type || 'unknown',
      role: payload.role || 'unknown',
      roleName: payload.roleName || payload.role || '未知',
      round: payload.round || 0,
      phase: payload.phase || 0,
      phaseId: payload.phaseId || 'unknown',
      content: payload.content || '',
      timestamp: payload.timestamp || new Date().toISOString(),
    };
    
    this.messageBuffer.push(message);
    
    // 显示消息预览
    const preview = message.content.substring(0, 60) + (message.content.length > 60 ? '...' : '');
    console.log(`  💬 [${message.roleName}]: ${preview}`);
  }

  // ==================== 评估模块 V2.0 ====================

  evaluateResult(testCase) {
    const checks = [
      this.checkBasicConnectivity(testCase),
      this.checkMessageCount(testCase),
      this.checkRoleParticipation(testCase),
      this.checkContentQuality(testCase),
      this.checkNoRepetition(testCase),
      this.checkFlowCompleteness(testCase),
      this.checkStreamOutput(testCase),
    ];

    const issues = checks.filter(c => !c.passed).map(c => c.issue);
    const allPassed = checks.every(c => c.passed);
    const score = this.calculateScore(checks);

    return {
      passed: allPassed,
      score,
      issues,
      recommendations: this.generateRecommendations(checks, testCase),
      details: checks,
    };
  }

  checkBasicConnectivity(testCase) {
    const connected = this.eventLog.some(e => e.type === 'send');
    return {
      name: '基础连接检查',
      passed: connected,
      issue: connected ? null : 'WebSocket未成功发送请求',
      score: connected ? 100 : 0,
    };
  }

  checkMessageCount(testCase) {
    const count = this.messageBuffer.length;
    const expected = testCase.expectations.minMessages || 1;
    const passed = count >= expected;
    return {
      name: '消息数量检查',
      passed,
      issue: passed ? null : `消息不足: ${count}/${expected}`,
      score: Math.min(100, (count / expected) * 100),
    };
  }

  checkRoleParticipation(testCase) {
    const participatedRoles = new Set(this.messageBuffer.map(m => m.role));
    const missingRoles = testCase.expectedRoles.filter(r => !participatedRoles.has(r));
    const passed = missingRoles.length === 0;
    return {
      name: '角色参与度',
      passed,
      issue: passed ? null : `缺失角色: ${missingRoles.join(', ')}`,
      score: passed ? 100 : ((testCase.expectedRoles.length - missingRoles.length) / testCase.expectedRoles.length) * 100,
    };
  }

  checkContentQuality(testCase) {
    if (this.messageBuffer.length === 0) {
      return { name: '内容质量', passed: false, issue: '无任何消息', score: 0 };
    }
    
    const lengths = this.messageBuffer.map(m => m.content.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const minLength = Math.min(...lengths);
    
    const passed = avgLength >= 20 && minLength >= 10;
    return {
      name: '内容质量',
      passed,
      issue: passed ? null : `平均${avgLength.toFixed(0)}字符, 最短${minLength}字符`,
      score: Math.min(100, avgLength * 1.5),
    };
  }

  checkNoRepetition(testCase) {
    if (this.messageBuffer.length < 2) {
      return { name: '去重效果', passed: true, issue: null, score: 100 };
    }
    
    let repetitionCount = 0;
    for (let i = 0; i < this.messageBuffer.length; i++) {
      for (let j = i + 1; j < this.messageBuffer.length; j++) {
        const sim = this.similarity(this.messageBuffer[i].content, this.messageBuffer[j].content);
        if (sim > 0.85) repetitionCount++;
      }
    }
    
    return {
      name: '去重效果',
      passed: repetitionCount === 0,
      issue: repetitionCount === 0 ? null : `发现${repetitionCount}对高度相似消息`,
      score: Math.max(0, 100 - repetitionCount * 25),
    };
  }

  checkFlowCompleteness(testCase) {
    const events = this.eventLog.map(e => e.event);
    const hasStart = events.includes('debate:start');
    const hasRound = events.some(e => e.includes('round'));
    const hasMessage = this.messageBuffer.length > 0;
    const hasStream = this.totalStreamEnds > 0;
    const hasEnd = events.includes('debate:complete') || events.includes('debate:error');
    
    const missing = [];
    if (!hasStart) missing.push('start');
    if (!hasRound && this.totalStreamEnds > 0) missing.push('round');
    if (!hasStream) missing.push('stream');
    if (!hasMessage) missing.push('message');
    
    return {
      name: '流程完整性',
      passed: missing.length === 0 && hasMessage,
      issue: missing.length === 0 ? null : `缺少: ${missing.join(', ')}`,
      score: Math.max(0, 100 - missing.length * 20 + (hasMessage ? 20 : 0)),
    };
  }

  checkStreamOutput(testCase) {
    const passed = this.totalStreamEnds > 0;
    return {
      name: '流式输出',
      passed,
      issue: passed ? null : `无流式输出(${this.totalStreamEnds}次)`,
      score: passed ? Math.min(100, this.totalStreamEnds * 25) : 0,
    };
  }

  similarity(a, b) {
    if (!a || !b) return 0;
    const setA = new Set(a.split(''));
    const setB = new Set(b.split(''));
    const inter = [...setA].filter(x => setB.has(x)).length;
    const union = new Set([...setA, ...setB]).size;
    return union > 0 ? inter / union : 0;
  }

  calculateScore(checks) {
    const weights = {
      '基础连接检查': 0.05,
      '消息数量检查': 0.15,
      '角色参与度': 0.25,
      '内容质量': 0.25,
      '去重效果': 0.10,
      '流程完整性': 0.10,
      '流式输出': 0.10,
    };

    let weightedSum = 0, totalWeight = 0;
    for (const c of checks) {
      const w = weights[c.name] || 0.1;
      weightedSum += c.score * w;
      totalWeight += w;
    }

    return {
      total: Math.round(weightedSum / totalWeight),
      breakdown: Object.fromEntries(checks.map(c => [c.name, c.score])),
    };
  }

  generateRecommendations(checks, testCase) {
    const recs = [];
    for (const c of checks) {
      if (!c.passed) {
        switch (c.name) {
          case '消息数量检查':
            recs.push('考虑减少轮次/角色数或增加超时时间'); break;
          case '角色参与度':
            recs.push('检查角色路由逻辑和getActiveRoles方法'); break;
          case '内容质量':
            recs.push('优化提示词模板或调整输出深度配置'); break;
          case '去重效果':
            recs.push('增强cleanDuplicatePatterns或refineOutputText'); break;
          case '流程完整性':
            recs.push('检查事件发射链路是否完整'); break;
          case '流式输出':
            recs.push('确认callAIStream正常调用且未被中断'); break;
        }
      }
    }
    return recs;
  }
}

// ==================== 报告生成器 V2.0 ====================
class TestReportGeneratorV2 {
  constructor(results) {
    this.results = results;
    this.generatedAt = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  }

  generateMarkdown() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const rate = (passed / this.results.length * 100).toFixed(1);
    const avgScore = this.results
      .filter(r => r.qualityScore)
      .reduce((s, r) => s + r.qualityScore.total, 0) / 
      Math.max(1, this.results.filter(r => r.qualityScore).length);

    let md = `# PRD辩论系统 - 自动化测试报告 V2.0\n\n`;
    md += `> **生成时间**: ${this.generatedAt}\n`;
    md += `> **测试环境**: localhost:9528 (Backend) + 9529 (Frontend)\n`;
    md += `> **测试用例**: ${this.results.length} 个 (全覆盖13种辩论模式)\n\n`;

    // 执行摘要
    md += `## 📊 执行摘要\n\n`;
    md += `| 指标 | 数值 | 状态 |\n|------|------|------|\n`;
    md += `| 总测试数 | ${this.results.length} | - |\n`;
    md += `| ✅ 通过 | ${passed} | ${passed === this.results.length ? '🎉 完美!' : ''} |\n`;
    md += `| ❌ 失败 | ${failed} | ${failed > 0 ? '需关注' : ''} |\n`;
    md += `| 通过率 | **${rate}%** | ${rate >= 80 ? '✅ 达标' : rate >= 50 ? '⚠️ 待优化' : '❌ 需修复'} |\n`;
    md += `| 平均分 | **${avgScore.toFixed(1)}/100** | ${avgScore >= 80 ? '优秀' : avgScore >= 60 ? '良好' : '需改进'} |\n\n`;

    // 详细结果表格
    md += `## 🔍 各模式测试详情\n\n`;
    md += `| ID | 模式 | 主题 | 状态 | 分数 | 消息 | 流式 | 耗时 |\n`;
    md += `|----|------|------|------|------|------|------|------|\n`;
    
    for (const r of this.results) {
      const status = r.passed ? '✅' : '❌';
      const score = r.qualityScore ? `${r.qualityScore.total}` : '-';
      const dur = r.duration ? `${(r.duration / 1000).toFixed(0)}s` : '-';
      md += `| ${r.id} | ${r.modeName} | ${r.topic.substring(0, 15)}... | ${status} | ${score} | ${r.messageCount} | ${r.streamCount || 0} | ${dur} |\n`;
    }
    md += `\n`;

    // 失败用例详情
    const failures = this.results.filter(r => !r.passed);
    if (failures.length > 0) {
      md += `## ⚠️ 失败用例分析\n\n`;
      for (const f of failures) {
        md += `### ${f.id}: ${f.modeName}\n\n`;
        md += `- **主题**: ${f.topic}\n`;
        md += `- **错误**: ${f.error || '未在规定时间内完成'}\n`;
        if (f.issues && f.issues.length > 0) {
          md += `- **问题**:\n`;
          for (const issue of f.issues) md += `  - ${issue}\n`;
        }
        if (f.recommendations && f.recommendations.length > 0) {
          md += `- **建议**:\n`;
          for (const rec of f.recommendations) md += `  - 💡 ${rec}\n`;
        }
        md += `\n---\n\n`;
      }
    }

    // 统计信息
    const totalMsgs = this.results.reduce((s, r) => s + r.messageCount, 0);
    const totalStreams = this.results.reduce((s, r) => s + (r.streamCount || 0), 0);
    const totalTime = this.results.reduce((s, r) => s + (r.duration || 0), 0);
    
    md += `## 📈 统计汇总\n\n`;
    md += `- 总消息数: ${totalMsgs}\n`;
    md += `- 总流式输出: ${totalStreams}次\n`;
    md += `- 总耗时: ${(totalTime / 60000).toFixed(1)}分钟\n\n`;

    md += `---\n*报告由 DebateTestEngine V2.0 自动生成*\n`;
    return md;
  }

  async saveReport() {
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    const mdPath = path.join(CONFIG.outputDir, `test-report-v2-${ts}.md`);
    fs.writeFileSync(mdPath, this.generateMarkdown(), 'utf8');
    
    const jsonPath = path.join(CONFIG.outputDir, `test-results-v2-${ts}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2), 'utf8');

    console.log(`\n📄 报告已保存:`);
    console.log(`   Markdown: ${mdPath}`);
    console.log(`   JSON:    ${jsonPath}`);

    return { mdPath, jsonPath };
  }
}

// ==================== 主程序 ====================
async function main() {
  const engine = new DebateTestEngineV2();

  try {
    const results = await engine.runAllTests();

    console.log('\n\n' + '='.repeat(70));
    console.log('📊 正在生成测试报告...');
    
    const reporter = new TestReportGeneratorV2(results);
    const paths = await reporter.saveReport();

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log('\n' + '='.repeat(70));
    console.log('🏁 全部测试完成!');
    console.log(`\n📈 最终统计:`);
    console.log(`   ┌─────────────────────────────────────┐`);
    console.log(`   │  总计: ${results.length.toString().padEnd(27)}│`);
    console.log(`   │  ✅ 通过: ${passed.toString().padEnd(24)}│`);
    console.log(`   │  ❌ 失败: ${failed.toString().padEnd(24)}│`);
    console.log(`   │  通过率: ${(passed / results.length * 100).toFixed(1).padEnd(19)}% │`);
    console.log(`   └─────────────────────────────────────┘`);

    if (passed === results.length) {
      console.log(`\n🎉🎉🎉 所有 ${results.length} 个测试全部通过！系统运行完美！`);
    } else if (passed >= results.length * 0.7) {
      console.log(`\n✨ 大部分测试通过 (${passed}/${results.length})，系统基本正常`);
    } else {
      console.log(`\n⚠️ 有较多测试失败，请查看报告了解详情`);
    }

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n💥 程序异常:', error.message);
    process.exit(1);
  }
}

main();
