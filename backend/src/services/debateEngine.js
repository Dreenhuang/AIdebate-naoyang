/**
 * DebateEngine - 结构化对抗性辩论引擎 V4.1
 * 基于 debate skill 的核心原理实现
 * 
 * 改进点：
 * - 使用共享常量（消除硬编码）
 * - 完整日志体系
 * - 参数校验机制
 * - 通用角色处理架构
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');

// 🔥 V4.1: 引入共享常量
const {
  PHASES,
  ROLES,
  ROLE_CATEGORIES,
  MESSAGE_TYPES,
  WS_EVENTS,
  isHostRole,
  getMessageTypeForRole,
  getDefaultSoulForRole,
  isValidRoleType,
} = require('../constants');

// ==================== 日志工具 ====================
const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
let currentLogLevel = LOG_LEVELS.INFO;

function log(level, module, message, data = null) {
  if (level < currentLogLevel) return;
  
  const timestamp = new Date().toISOString();
  const levelStr = Object.keys(LOG_LEVELS).find(k => LOG_LEVELS[k] === level);
  const prefix = `[${timestamp}] [${levelStr}] [${module}]`;
  
  const logMessage = data ? `${prefix} ${message}` : `${prefix} ${message}`;
  
  switch (level) {
    case LOG_LEVELS.ERROR:
      console.error(logMessage, data || '');
      break;
    case LOG_LEVELS.WARN:
      console.warn(logMessage, data || '');
      break;
    case LOG_LEVELS.INFO:
      console.log(logMessage);
      break;
    default:
      console.debug(logMessage, data || '');
  }
}

// ==================== 参数校验工具 ====================
function validateRequired(value, name, context = '') {
  if (value === undefined || value === null) {
    throw new Error(`[ValidationError] ${context}: "${name}" 是必填参数，但收到 ${typeof value}`);
  }
  return value;
}

function validateString(value, name, minLength = 0) {
  if (typeof value !== 'string') {
    throw new Error(`[ValidationError] "${name}" 必须是字符串，但收到 ${typeof value}`);
  }
  if (minLength > 0 && value.length < minLength) {
    throw new Error(`[ValidationError] "${name}" 长度不能小于 ${minLength}`);
  }
  return value.trim();
}

function validateArray(value, name, minItems = 0) {
  if (!Array.isArray(value)) {
    throw new Error(`[ValidationError] "${name}" 必须是数组，但收到 ${typeof value}`);
  }
  if (minItems > 0 && value.length < minItems) {
    throw new Error(`[ValidationError] "${name}" 至少需要 ${minItems} 个元素`);
  }
  return value;
}

class DebateEngine extends EventEmitter {
  constructor(config = {}) {
    super();

    // 🔥 V4.1: 参数校验
    log(LOG_LEVELS.INFO, 'DebateEngine', '初始化辩论引擎...');
    
    this.id = config.id || uuidv4();
    this.topic = validateString(config.topic || '', 'topic', 0);
    this.roles = validateArray(config.roles || [], 'roles', 0);
    this.maxRounds = config.maxRounds || 5;
    this.maxPhases = config.maxPhases || 4;

    // 🔥 新增：输出深度和模式配置
    this.outputDepth = config.outputDepth || 'normal';
    this.modeId = config.modeId;
    this.displayStyle = config.displayStyle;

    // 🔥 V8.0 新增：流程配置（支持主持人角色调度）
    this.modeConfig = config.modeConfig || null;  // 完整的模式配置（含flow）
    this.flowConfig = config.modeConfig?.flow || [];  // 流程步骤数组
    this.currentFlowStep = 0;  // 当前执行到的流程步骤
    this.hostRole = null;  // 缓存主持人角色
    this.hasHostRole = false;  // 是否有主持人角色

    // 预检查：是否有主持人角色
    if (this.roles && this.roles.length > 0) {
      this.hostRole = this.roles.find(r => isHostRole(r.roleType));
      this.hasHostRole = !!this.hostRole;
      if (this.hasHostRole) {
        console.log(`[DebateEngine] 🎙️ 检测到主持人角色: ${this.hostRole.name} (${this.hostRole.roleType})`);
      }
    }

    // 状态
    this.status = 'idle';
    this.currentPhase = 0;
    this.currentRound = 0;
    this.messages = [];
    this.commitments = [];
    this.consensus = [];
    this.backtrackResults = [];

    // 阶段配置
    this.phases = Object.values(PHASES).slice(0, this.maxPhases);

    // AI 客户端初始化（带超时保护）
    const apiTimeout = parseInt(process.env.API_TIMEOUT_MS) || 60000; // 默认60秒超时

    // 从环境变量读取 API Key
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      log(LOG_LEVELS.ERROR, 'DebateEngine', 'DEEPSEEK_API_KEY 未配置');
      throw new Error('【严重】DEEPSEEK_API_KEY 未在环境变量中配置。请在 .env 文件中设置 DEEPSEEK_API_KEY=your-api-key');
    }

    this.aiClient = new OpenAI({
      apiKey: apiKey,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      timeout: apiTimeout,
    });

    // 🔥 新增：API 调用配置
    this.apiConfig = {
      timeout: apiTimeout,
      maxRetries: parseInt(process.env.API_MAX_RETRIES) || 3,
      defaultModel: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
    };

    log(LOG_LEVELS.INFO, 'DebateEngine', `AI客户端初始化完成`);
    log(LOG_LEVELS.INFO, 'DebateEngine', `API端点: ${this.aiClient.baseURL}`);
    log(LOG_LEVELS.INFO, 'DebateEngine', `超时设置: ${apiTimeout}ms`);
    log(LOG_LEVELS.INFO, 'DebateEngine', `最大重试: ${this.apiConfig.maxRetries}次`);
    log(LOG_LEVELS.INFO, 'DebateEngine', `输出深度: ${this.outputDepth}`);
    log(LOG_LEVELS.DEBUG, 'DebateEngine', `角色数量: ${this.roles.length}`, this.roles.map(r => r.roleType));

    // 上下文管理
    this.contextManager = new ContextManager(this);

    // 回溯校验
    this.backtrackValidator = new BacktrackValidator(this);
  }

  /**
   * 🔥 新增：自动生成辩论相关文件
   * 在辩论完成时调用，生成多个文档供用户下载
   */
  async generateDebateFiles() {
    const files = [];
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
    const topicSlug = this.topic.slice(0, 20).replace(/[^\w\u4e00-\u9fa5]/g, '_');
    
    try {
      // 文件1：完整辩论记录（Markdown格式）
      const debateLogContent = this.generateDebateLogMarkdown();
      files.push({
        name: `${timestamp}_${topicSlug}_辩论记录.md`,
        size: Buffer.byteLength(debateLogContent, 'utf8'),
        type: 'markdown',
        content: debateLogContent,
        category: 'debate-log',
        description: '完整的辩论对话记录',
      });
      
      // 文件2：共识总结报告
      if (this.consensus && this.consensus.length > 0) {
        const consensusContent = this.generateConsensusReport();
        files.push({
          name: `${timestamp}_${topicSlug}_共识报告.md`,
          size: Buffer.byteLength(consensusContent, 'utf8'),
          type: 'markdown',
          content: consensusContent,
          category: 'consensus',
          description: '各方达成的共识与结论',
        });
      }
      
      // 文件3：承诺清单
      if (this.commitments && this.commitments.length > 0) {
        const commitmentsContent = this.generateCommitmentsList();
        files.push({
          name: `${timestamp}_${topicSlug}_承诺清单.md`,
          size: Buffer.byteLength(commitmentsContent, 'utf8'),
          type: 'markdown',
          content: commitmentsContent,
          category: 'commitments',
          description: '辩论中形成的核心承诺与行动项',
        });
      }
      
      console.log(`[DebateEngine] 生成了 ${files.length} 个文件`);
      return files;
      
    } catch (error) {
      console.error('[DebateEngine] 文件生成失败:', error);
      return [];
    }
  }
  
  /**
   * 🔥 V6.0 修复：生成Markdown格式的辩论记录（含完整性验证）
   * 修复第一轮缺失显示问题 + 添加轮次完整性检查
   */
  generateDebateLogMarkdown() {
    const lines = [];
    
    lines.push('# 📝 辩论记录报告');
    lines.push('');
    lines.push(`**话题**: ${this.topic}`);
    lines.push(`**生成时间**: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`**总消息数**: ${this.messages.length} 条`);
    lines.push(`**参与角色**: ${this.roles.map(r => r.name || r.roleType).join(', ')}`);
    lines.push('');
    
    // 🔥 V6.0 新增：预分析 - 检测所有轮次，验证完整性
    const roundAnalysis = this.analyzeMessageRounds();
    
    // 添加完整性报告
    if (roundAnalysis.missingRounds.length > 0) {
      lines.push(`⚠️ **警告**: 检测到 ${roundAnalysis.missingRounds.length} 个缺失的轮次: ${roundAnalysis.missingRounds.join(', ')}`);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
    
    // 按阶段和轮次组织
    let currentPhase = -1;
    let currentRound = -1;
    
    this.messages.forEach((msg, index) => {
      // 阶段分隔
      if (msg.phase !== undefined && msg.phase !== currentPhase) {
        currentPhase = msg.phase;
        const phaseName = this.phases[currentPhase]?.name || `阶段${currentPhase + 1}`;
        lines.push(`## 📌 ${phaseName}`);
        lines.push('');
      }
      
      // 轮次分隔（V6.0 FIX: 移除错误的 +1）
      if (msg.round !== undefined && msg.round !== currentRound) {
        currentRound = msg.round;
        // ✅ 修复：直接使用 round 值，不再 +1
        lines.push(`### 🔄 第 ${currentRound} 轮`);
        lines.push('');
      }
      
      // 消息内容
      const roleEmoji = this.getRoleEmoji(msg.role);
      const time = new Date(msg.timestamp).toLocaleTimeString('zh-CN');
      
      lines.push(`**${roleEmoji} ${msg.role || '未知角色'}** (*${time}*)`);
      lines.push('');
      lines.push(msg.content || '（无内容）');
      lines.push('');
      lines.push('---');
      lines.push('');
    });
    
    // 🔥 V6.0 新增：添加统计摘要
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(`## 📊 统计摘要`);
    lines.push('');
    lines.push(`- 总阶段数: ${roundAnalysis.totalPhases}`);
    lines.push(`- 总轮次数: ${roundAnalysis.totalRounds}`);
    lines.push(`- 实际包含轮次: [${roundAnalysis.existingRounds.join(', ')}]`);
    if (roundAnalysis.missingRounds.length > 0) {
      lines.push(`- ⚠️ 缺失轮次: [${roundAnalysis.missingRounds.join(', ')}]`);
    }
    lines.push(`- 消息总数: ${this.messages.length} 条`);
    lines.push('');
    lines.push('*本报告由 DebateEngine V6.0 自动生成*');
    
    return lines.join('\n');
  }

  /**
   * 🔥 V6.0 新增：分析消息轮次完整性
   * 检测是否存在缺失的轮次
   */
  analyzeMessageRounds() {
    const rounds = new Set();
    const phases = new Set();
    
    this.messages.forEach(msg => {
      if (msg.round !== undefined) rounds.add(msg.round);
      if (msg.phase !== undefined) phases.add(msg.phase);
    });
    
    const existingRounds = Array.from(rounds).sort((a, b) => a - b);
    const totalRounds = existingRounds.length > 0 ? Math.max(...existingRounds) : 0;
    const totalPhases = phases.size;
    
    // 检测缺失的轮次（从1到最大轮次）
    const missingRounds = [];
    for (let i = 1; i <= totalRounds; i++) {
      if (!rounds.has(i)) {
        missingRounds.push(i);
      }
    }
    
    // 记录分析结果
    console.log(`\n[DebateEngine] 📋 轮次完整性分析:`);
    console.log(`[DebateEngine]   - 阶段数: ${totalPhases}`);
    console.log(`[DebateEngine]   - 最大轮次: ${totalRounds}`);
    console.log(`[DebateEngine]   - 已有轮次: [${existingRounds.join(', ')}]`);
    if (missingRounds.length > 0) {
      console.error(`[DebateEngine]   ⚠️ 缺失轮次: [${missingRounds.join(', ')}]`);
    } else {
      console.log(`[DebateEngine]   ✅ 所有轮次完整，无缺失`);
    }
    
    return {
      totalPhases,
      totalRounds,
      existingRounds,
      missingRounds,
      isComplete: missingRounds.length === 0,
    };
  }
  
  /**
   * 生成共识总结报告
   */
  generateConsensusReport() {
    const lines = [];
    
    lines.push('# 🤝 共识总结报告');
    lines.push('');
    lines.push(`**话题**: ${this.topic}`);
    lines.push(`**生成时间**: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`**共识数量**: ${this.consensus.length} 条`);
    lines.push('');
    lines.push('---');
    lines.push('');
    
    this.consensus.forEach((consensus, index) => {
      lines.push(`## ${index + 1}. ${consensus.phaseName || `阶段${index + 1}共识`}`);
      lines.push('');
      lines.push(consensus.summary || '（无摘要）');
      lines.push('');
      
      if (consensus.commitments && consensus.commitments.length > 0) {
        lines.push('### ✅ 核心承诺');
        lines.push('');
        consensus.commitments.forEach(commitment => {
          lines.push(`- ${commitment}`);
        });
        lines.push('');
      }
      
      lines.push('---');
      lines.push('');
    });
    
    lines.push('*本报告由 DebateEngine 自动生成*');
    
    return lines.join('\n');
  }
  
  /**
   * 生成承诺清单
   */
  generateCommitmentsList() {
    const lines = [];
    
    lines.push('# ✅ 辩论承诺清单');
    lines.push('');
    lines.push(`**话题**: ${this.topic}`);
    lines.push(`**生成时间**: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`**承诺总数**: ${this.commitments.length} 项`);
    lines.push('');
    lines.push('---');
    lines.push('');
    
    this.commitments.forEach((commitment, index) => {
      const text = commitment.text || commitment.content || commitment;
      lines.push(`${index + 1}. **${text}**`);
      lines.push('');
    });
    
    lines.push('---');
    lines.push('');
    lines.push('> 💡 **提示**: 请在项目实施过程中逐一验证这些承诺的落实情况。');
    lines.push('');
    lines.push('*本清单由 DebateEngine 自动生成*');
    
    return lines.join('\n');
  }
  
  /**
   * 获取角色对应的emoji
   */
  getRoleEmoji(role) {
    const emojiMap = {
      'proposer': '💡',
      'reviewer': '🔍',
      'host': '🎙️',
      '主持人': '🎙️',
      '提案者': '💡',
      '审查者': '🔍',
      'system': '📢',
    };
    return emojiMap[role] || '👤';
  }

  /**
   * 开始辩论（V4.1: 增强日志和校验）
   */
  async start() {
    // 🔥 V4.1: 参数校验
    log(LOG_LEVELS.INFO, 'DebateEngine', '开始辩论流程');
    
    if (this.status === 'running') {
      log(LOG_LEVELS.WARN, 'DebateEngine', '辩论已在进行中，忽略重复启动');
      return;
    }
    
    if (!this.topic || this.topic.trim().length === 0) {
      log(LOG_LEVELS.ERROR, 'DebateEngine', '缺少讨论主题');
      throw new Error('缺少讨论主题（topic）');
    }

    if (!this.roles || this.roles.length === 0) {
      log(LOG_LEVELS.WARN, 'DebateEngine', '没有配置角色，将使用默认角色');
      this.roles = [
        { id: uuidv4(), name: '提案者', roleType: ROLES.PROPOSER },
        { id: uuidv4(), name: '审查者', roleType: ROLES.REVIEWER },
      ];
    }

    log(LOG_LEVELS.INFO, 'DebateEngine', `主题: "${this.topic}"`);
    log(LOG_LEVELS.INFO, 'DebateEngine', `模式: ${this.modeId || 'default'}`);
    log(LOG_LEVELS.DEBUG, 'DebateEngine', `角色列表:`, this.roles.map(r => ({ name: r.name, type: r.roleType })));

    try {
      this.status = 'running';
      this.currentPhase = 0;
      this.currentRound = 0;
      this.messages = [];
      this.commitments = [];
      this.consensus = [];
      
      this.emit('debate:started', {
        id: this.id,
        topic: this.topic,
        phases: this.phases,
        totalPhases: this.maxPhases,
        totalRounds: this.maxRounds,
      });
      
      // 开始第一阶段
      await this.startPhase(0);
      
    } catch (error) {
      log(LOG_LEVELS.ERROR, 'DebateEngine', `辩论启动失败: ${error.message}`, error.stack);
      this.emit('debate:error', { error: error.message, phase: 'startup' });
      this.status = 'error';
      throw error;
    }
  }

  /**
   * 开始指定阶段
   */
  async startPhase(phaseIndex) {
    if (phaseIndex >= this.phases.length) {
      await this.complete();
      return;
    }
    
    this.currentPhase = phaseIndex;
    this.currentRound = 0;
    
    const phase = this.phases[phaseIndex];
    
    this.emit('debate:phase', {
      phase: phaseIndex,
      phaseId: phase.id,
      phaseName: phase.name,
      totalPhases: this.phases.length,
      totalRounds: this.maxRounds,
    });
    
    // 阶段探查（Probe）
    await this.probePhase(phase);
  }

  /**
   * 阶段探查 - 生成阶段框架和关键问题
   */
  async probePhase(phase) {
    const host = this.getRole(ROLES.HOST);
    if (!host) return;
    
    // 构建探查 prompt
    const probePrompt = this.buildProbePrompt(phase);
    
    // 模拟 Host 生成阶段框架
    const framework = {
      phase: phase.id,
      keyQuestions: this.generateKeyQuestions(phase),
      successCriteria: this.generateSuccessCriteria(phase),
      context: this.contextManager.getPhaseContext(phase.id),
    };
    
    this.emit('debate:probe', {
      phase: phase.id,
      framework,
    });
    
    // 开始第一轮
    await this.startRound(1);
  }

  /**
   * 开始指定轮次（V8.0：支持主持人流程调度）
   * 改进点：
   * - 如果配置了flow且有主持人，按流程步骤执行
   * - 主持人在正确的时机发言（开场/协调/总结）
   * - 向后兼容：无flow配置时使用原有逻辑
   */
  async startRound(roundNumber) {
    if (roundNumber > this.maxRounds) {
      await this.attemptPhaseProgression();
      return;
    }

    this.currentRound = roundNumber;

    this.emit('debate:round', {
      round: roundNumber,
      phase: this.currentPhase,
      phaseId: this.phases[this.currentPhase].id,
      totalRounds: this.maxRounds,
      totalPhases: this.maxPhases,
    });

    console.log(`\n[DebateEngine] ══════════════════════════════════`);
    console.log(`[DebateEngine] 🎭 第 ${roundNumber} 轮开始`);
    console.log(`[DebateEngine] ══════════════════════════════════`);

    // 🔥 V8.0 判断：是否使用流程化执行
    const shouldUseFlowExecution = this.hasHostRole && this.flowConfig && this.flowConfig.length > 0;

    if (shouldUseFlowExecution) {
      // ✅ 流程化执行模式：按flow配置的步骤执行
      console.log(`[DebateEngine] 📋 使用流程化执行模式 (共${this.flowConfig.length}个步骤)`);
      await this.executeFlowBasedRound(roundNumber);
    } else {
      // ⚙️ 传统执行模式：所有非host角色轮流发言
      console.log(`[DebateEngine] ⚙️ 使用传统轮次执行模式`);
      await this.executeTraditionalRound(roundNumber);
    }

    console.log(`[DebateEngine] 🔄 第 ${roundNumber} 轮所有角色发言完毕，准备推进...`);
    await this.advanceAfterRound();
  }

  /**
   * 🔥 V8.0 新增：流程化轮次执行（支持主持人）
   * 按照模式的flow配置依次执行每个步骤
   */
  async executeFlowBasedRound(roundNumber) {
    const flowSteps = this.flowConfig;

    for (let stepIndex = 0; stepIndex < flowSteps.length; stepIndex++) {
      const step = flowSteps[stepIndex];
      this.currentFlowStep = stepIndex;

      console.log(`\n[DebateEngine] ┌─────────────────────────────────────┐`);
      console.log(`[DebateEngine] │ Step ${stepIndex + 1}/${flowSteps.length}: ${step.label || step.action}`);
      console.log(`[DebateEngine] │ Actor: ${step.actor} | Action: ${step.action}`);
      console.log(`[DebateEngine] └─────────────────────────────────────┘`);

      // 根据actor类型决定谁发言
      switch (step.actor) {
        case 'host':
          // 👤 主持人专属步骤
          if (this.hostRole) {
            await this.executeHostStep(step, roundNumber, stepIndex);
          } else {
            console.warn('[DebateEngine] ⚠️ 流程要求host发言，但未找到主持人角色');
          }
          break;

        case 'all-but-host':
          // 👥 除主持人外的所有角色
          await this.executeAllRolesExceptHost(roundNumber, stepIndex, step);
          break;

        case 'all':
          // 👥 所有角色（包括主持人）
          await this.executeAllRoles(roundNumber, stepIndex, step);
          break;

        default:
          // 🔍 特定角色类型
          await this.executeSpecificActor(step.actor, roundNumber, stepIndex, step);
          break;
      }

      // 检查是否有loop标记（循环步骤）
      if (step.loop && roundNumber < this.maxRounds - 1) {
        console.log(`[DebateEngine] 🔄 步骤 ${step.label} 设置为循环，将在下一轮继续`);
      }
    }
  }

  /**
   * 🔥 V8.0 新增：传统轮次执行（向后兼容）
   * 原有逻辑：所有非host角色轮流发言
   */
  async executeTraditionalRound(roundNumber) {
    const activeRoles = this.getActiveRoles();

    console.log(`[DebateEngine] 可用角色:`, activeRoles.map(r => `${r.name}(${r.roleType})`));

    if (activeRoles.length === 0) {
      console.warn('[DebateEngine] ⚠️ 无可用角色，跳过本轮');
      return;
    }

    for (let i = 0; i < activeRoles.length; i++) {
      const role = activeRoles[i];
      const context = this.buildRoleContext(role, i, activeRoles.length);
      await this.executeGenericRole(role, context);
    }
  }

  /**
   * 🔥 V8.0 新增：执行主持人专属步骤
   */
  async executeHostStep(step, roundNumber, stepIndex) {
    const hostContext = {
      topic: this.topic,
      currentPhase: this.phases[this.currentPhase],
      currentRound: roundNumber,
      messages: this.messages,
      role: this.hostRole.roleType,
      roleName: this.hostRole.name,
      isFirstSpeaker: stepIndex === 0,
      isLastSpeaker: false,
      previousMessages: this.messages.filter(m =>
        m.round === roundNumber && m.phase === this.currentPhase
      ),
      // 传递流程步骤信息
      flowStep: step,
      stepLabel: step.label,
      stepAction: step.action,
      stepDescription: step.description,
    };

    console.log(`[DebateEngine] 🎙️ 主持人 (${this.hostRole.name}) 发言: ${step.label}`);

    // 构建主持人专用的提示词
    const prompt = this.buildHostPrompt(this.hostRole, hostContext, step);
    const soul = this.hostRole.soul || this.getDefaultSoulForRole(this.hostRole.roleType);

    try {
      const content = await this.callAIStream(
        soul,
        prompt,
        this.hostRole.model || 'deepseek-v4-flash',
        {
          role: this.hostRole.roleType,
          roleName: this.hostRole.name,
          phase: this.currentPhase,
          round: roundNumber,
          phaseId: this.phases[this.currentPhase]?.id || 'unknown',
          isHostTurn: true,  // 标记这是主持人回合
        },
        () => {}
      );

      if (content && content !== '[已取消]') {
        this.saveMessage({
          role: this.hostRole.name,
          roleType: this.hostRole.roleType,
          content,
          phase: this.currentPhase,
          round: roundNumber,
          timestamp: new Date(),
          metadata: { flowStep: stepIndex, action: step.action },
        });
      }
    } catch (error) {
      console.error(`[DebateEngine] ❌ 主持人发言失败:`, error.message);
    }
  }

  /**
   * 🔥 V8.0 新增：构建主持人专用提示词
   */
  buildHostPrompt(role, context, step) {
    let prompt = '';

    // 字数配置
    const depthConfig = {
      brief: { min: 150, max: 500, name: '简短讨论' },
      normal: { min: 500, max: 1000, name: '深入讨论' },
      detailed: { min: 1000, max: 2000, name: '详细研究' },
    };
    const depth = this.outputDepth || 'normal';
    const wordLimit = depthConfig[depth] || depthConfig.normal;

    // 开头
    prompt += `═══════════════════════════════════════\n`;
    prompt += `【🎙️ 主持人任务 - ${step.label}】\n`;
    prompt += `═══════════════════════════════════════\n\n`;

    prompt += `【当前阶段】${context.currentPhase?.name || '讨论'}\n`;
    prompt += `【当前轮次】第 ${context.currentRound} 轮\n`;
    prompt += `【讨论主题】${this.topic}\n\n`;

    // 流程步骤说明
    prompt += `┌─────────────────────────────────────────────┐\n`;
    prompt += `│ 📋 当前任务                                 │\n`;
    prompt += `├─────────────────────────────────────────────┤\n`;
    prompt += `│ 动作: ${step.action}\n`;
    prompt += `│ 描述: ${step.description || '无详细描述'}\n`;
    prompt += `└─────────────────────────────────────────────┘\n\n`;

    // 历史消息摘要
    if (this.messages && this.messages.length > 0) {
      prompt += `【当前讨论进展】\n`;
      prompt += `已产生 ${this.messages.length} 条消息。\n`;

      // 提取关键论点
      const recentMessages = this.messages.slice(-5);
      recentMessages.forEach((msg, idx) => {
        const preview = msg.content.substring(0, 100);
        prompt += `${idx + 1}. [${msg.roleName}] ${preview}${msg.content.length > 100 ? '...' : ''}\n`;
      });
      prompt += `\n`;
    }

    // 主持人具体指令
    prompt += `✅ 【你的具体任务】\n\n`;
    switch (step.action) {
      case 'open':
        prompt += `作为主持人，请进行开场引导：\n`;
        prompt += `1. 欢迎大家参与讨论\n`;
        prompt += `2. 明确介绍本次讨论的主题："${this.topic}"\n`;
        prompt += `3. 说明本次讨论的目标和预期成果\n`;
        prompt += `4. 简要说明讨论规则和时间安排\n`;
        prompt += `5. 可以提出1-2个引导性问题激发思考\n`;
        break;

      case 'cluster':
        prompt += `作为主持人，请对已产生的观点进行归类整理：\n`;
        prompt += `1. 识别主要观点类别（如：技术、商业、风险等）\n`;
        prompt += `2. 将每条观点归入对应类别\n`;
        prompt += `3. 指出各类别的核心共识点和分歧点\n`;
        prompt += `4. 标注需要进一步深入讨论的问题\n`;
        break;

      case 'conclude':
        prompt += `作为主持人，请进行总结收尾：\n`;
        prompt += `1. 归纳本次讨论的核心结论\n`;
        prompt += `2. 列出已达成共识的要点\n`;
        prompt += `3. 梳理仍存在分歧的问题\n`;
        prompt += `4. 给出下一步行动建议\n`;
        prompt += `5. 感谢各位参与者的贡献\n`;
        break;

      default:
        prompt += `根据当前动作"${step.action}"，完成相应的主持工作。\n`;
        prompt += `参考描述：${step.description || '请根据上下文判断应该做什么'}\n`;
        break;
    }

    prompt += `\n⚠️ 控制总字数在 ${wordLimit.min}-${wordLimit.max} 字以内\n`;

    // 结尾检查清单
    prompt += `\n═══════════════════════════════════════\n`;
    prompt += `【✅ 输出前检查】\n`;
    prompt += `□ 字数在 ${wordLimit.min}-${wordLimit.max} 之间？\n`;
    prompt += `□ 是否完成了"${step.label}"的任务目标？\n`;
    prompt += `□ 语言是否专业、得体、具有主持人的权威感？\n`;
    prompt += `═══════════════════════════════════════\n`;

    return prompt;
  }

  /**
   * 🔥 V8.0 新增：执行除主持人外的所有角色
   */
  async executeAllRolesExceptHost(roundNumber, stepIndex, step) {
    const activeRoles = this.getActiveRoles();  // 已排除host

    if (activeRoles.length === 0) {
      console.warn('[DebateEngine] ⚠️ 无可用角色');
      return;
    }

    for (let i = 0; i < activeRoles.length; i++) {
      const role = activeRoles[i];
      const context = this.buildRoleContext(role, i, activeRoles.length);
      // 注入流程步骤信息
      context.flowStep = step;
      context.stepLabel = step.label;
      await this.executeGenericRole(role, context);
    }
  }

  /**
   * 🔥 V8.0 新增：执行所有角色（包括主持人）
   */
  async executeAllRoles(roundNumber, stepIndex, step) {
    // 先让主持人发言
    if (this.hostRole) {
      await this.executeHostStep(step, roundNumber, stepIndex);
    }

    // 再让其他角色发言
    await this.executeAllRolesExceptHost(roundNumber, stepIndex, step);
  }

  /**
   * 🔥 V8.0 新增：执行特定actor类型的角色
   */
  async executeSpecificActor(actorType, roundNumber, stepIndex, step) {
    // 类型安全检查
    const safeActorType = typeof actorType === 'string' ? actorType.toLowerCase().trim() : String(actorType || '').toLowerCase();
    
    // 查找匹配的角色
    const matchedRoles = this.roles.filter(r => {
      const rt = (r.roleType || '').toString().toLowerCase().trim();
      return rt === safeActorType || r.id === actorType;
    });

    if (matchedRoles.length === 0) {
      console.warn(`[DebateEngine] ⚠️ 未找到类型为 "${actorType}" 的角色`);
      return;
    }

    for (const role of matchedRoles) {
      const context = this.buildRoleContext(role, 0, 1);
      context.flowStep = step;
      context.stepLabel = step.label;
      await this.executeGenericRole(role, context);
    }
  }

  async advanceAfterRound() {
    if (this.currentRound >= this.maxRounds) {
      console.log(`[DebateEngine] 达到最大轮次 ${this.maxRounds}，推进到下一阶段`);
      await this.generateConsensus();
      const nextPhase = this.currentPhase + 1;
      if (nextPhase < this.phases.length) {
        await this.startPhase(nextPhase);
      } else {
        console.log(`[DebateEngine] 所有阶段已完成，结束辩论`);
        await this.complete();
      }
      return;
    }

    const shouldAdvancePhase = this.evaluateGenericProgression();
    
    if (shouldAdvancePhase) {
      console.log(`[DebateEngine] 阶段 ${this.currentPhase} 讨论充分，推进到下一阶段`);
      await this.generateConsensus();
      const nextPhase = this.currentPhase + 1;
      if (nextPhase < this.phases.length) {
        await this.startPhase(nextPhase);
      } else {
        await this.complete();
      }
    } else {
      console.log(`[DebateEngine] 继续第 ${this.currentRound + 1}/${this.maxRounds} 轮讨论`);
      await this.startRound(this.currentRound + 1);
    }
  }

  evaluateGenericProgression() {
    let score = 0;
    if (this.currentRound >= 2) score++;
    if (this.currentRound >= this.maxRounds - 1) score++;
    if (this.messages.length >= 4 * this.currentRound) score++;
    if (this.messages.length >= 6) score++;
    return score >= 2;
  }

  /**
   * 🔥 V4.0 新增：获取所有活跃的非 host 角色
   */
  /**
   * 🔥 V4.1: 获取所有活跃的非 host 角色（使用共享常量）
   */
  getActiveRoles() {
    const activeRoles = this.roles.filter(r => {
      const rt = (r.roleType || '').toLowerCase().trim();
      // 使用 isHostRole 函数判断（来自共享常量）
      return !isHostRole(rt);
    });
    
    log(LOG_LEVELS.DEBUG, 'DebateEngine', `活跃角色数量: ${activeRoles.length}`, activeRoles.map(r => r.roleType));
    
    return activeRoles;
  }

  /**
   * 🔥 V4.0 新增：构建角色发言上下文
   */
  buildRoleContext(role, index, totalCount) {
    const baseContext = {
      topic: this.topic,
      currentPhase: this.phases[this.currentPhase],
      currentRound: this.currentRound,
      messages: this.messages,
      role: role.roleType,
      roleName: role.name,
      isFirstSpeaker: index === 0,
      isLastSpeaker: index === totalCount - 1,
      previousMessages: this.messages.filter(m => 
        m.round === this.currentRound && m.phase === this.currentPhase
      ),
    };
    
    return baseContext;
  }

  /**
   * 🔥 V4.0 新增：通用角色执行器（支持任意角色类型）
   */
  async executeGenericRole(role, context) {
    console.log(`[DebateEngine] 🎤 ${role.name} (${role.roleType}) 开始发言...`);
    
    // 根据角色类型确定提示词策略
    const prompt = this.buildGenericPrompt(role, context);
    const soul = role.soul || this.getDefaultSoulForRole(role.roleType);

    try {
      // 调用 AI 流式输出
      const content = await this.callAIStream(
        soul,
        prompt,
        role.model || 'deepseek-v4-flash',
        {
          role: role.roleType,
          roleName: role.name,
          phase: this.currentPhase,
          round: this.currentRound,
          phaseId: this.phases[this.currentPhase]?.id || 'unknown',
        },
        () => {} // 空回调
      );

      if (content === '[已取消]') {
        console.log(`[DebateEngine] ${role.name} 输出被取消`);
        return;
      }

      // 确定消息类型
      const messageType = this.determineMessageType(role.roleType, context.isFirstSpeaker);

      const message = {
        type: messageType,
        role: role.roleType,
        roleName: role.name,
        round: this.currentRound,
        phase: this.currentPhase,
        phaseId: this.phases[this.currentPhase]?.id || 'unknown',
        content: content,
        timestamp: new Date().toISOString(),
      };

      this.messages.push(message);

      // 🔥 BUG-002 FIX: 不再发送 debate:message 事件
      // 原因：流式输出已通过 stream:end 事件将内容传递给前端
      // 如果再发送 debate:message，会导致同一条消息被添加两次
      // 前端通过 endStream() → messages: [...state.messages, newMessage] 添加消息
      // this.emit('debate:message', message); // 已禁用 - 避免重复

      console.log(`[DebateEngine] ✅ ${role.name} 发言完成 (${content.length}字符) [仅流式]`);
      
    } catch (error) {
      console.error(`[DebateEngine] ❌ ${role.name} 发言失败:`, error.message);
      
      // 发送错误消息
      this.emit('debate:error', {
        role: role.roleType,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 🔥 V4.1: 为不同角色类型生成默认灵魂描述（使用共享常量）
   */
  getDefaultSoulForRole(roleType) {
    // 直接使用共享常量中的函数
    return getDefaultSoulForRole(roleType);
  }

  /**
   * 🔥 V7.0 全面重构：构建通用提示词（含阶段差异化+多角度引导）
   * 核心改进：
   * 1. 阶段差异化指令（每个阶段有不同的侧重点和目标）
   * 2. 多维度分析引导（确保覆盖全面）
   * 3. 强化防重复机制（已用论点地图+语义去重）
   * 4. 创新性激励（每轮必须有新发现）
   * 5. 深度递进要求（后轮必须比前轮更深入）
   */
  buildGenericPrompt(role, context) {
    const { topic, currentPhase, currentRound, previousMessages, isFirstSpeaker } = context;
    
    // 获取当前输出深度的字数配置
    const depthConfig = {
      brief: { min: 150, max: 500, name: '简短讨论' },
      normal: { min: 500, max: 1000, name: '深入讨论' },
      detailed: { min: 1000, max: 2000, name: '详细研究' },
    };
    const depth = this.outputDepth || 'normal';
    const wordLimit = depthConfig[depth] || depthConfig.normal;
    
    // ========== 阶段差异化配置 ==========
    const phaseConfig = this.getPhaseConfig(currentPhase?.id, currentRound);
    
    let prompt = '';
    
    // ═══════════════════════════════════════
    // 第一层：字数强制要求（保持不变）
    // ═══════════════════════════════════════
    prompt += `═══════════════════════════════════════\n`;
    prompt += `【⚠️ 字数强制要求 - ${wordLimit.name}模式】\n`;
    prompt += `✅ 你的回复必须控制在 ${wordLimit.min}-${wordLimit.max} 字之间\n`;
    prompt += `🚫 绝对不可超过 ${wordLimit.max} 字，否则判定为不合格\n`;
    prompt += `═══════════════════════════════════════\n\n`;
    
    // 基础上下文信息
    prompt += `【当前阶段】${currentPhase?.name || '讨论'} (Phase ID: ${currentPhase?.id || 'unknown'})\n`;
    prompt += `【阶段目标】${phaseConfig.objective}\n`;
    prompt += `【讨论主题】${topic}\n`;
    prompt += `【当前轮次】第 ${currentRound} 轮 (共${this.maxRounds}轮)\n`;
    prompt += `【你的身份】${role.name} (${role.roleType})\n\n`;
    
    // ═══════════════════════════════════════
    // 第二层：阶段专属指令（V7.0 新增）
    // ═══════════════════════════════════════
    prompt += `┌─────────────────────────────────────────────┐\n`;
    prompt += `│ 🎯 【本阶段核心任务 - V7.0 阶段差异化】     │\n`;
    prompt += `└─────────────────────────────────────────────┘\n\n`;
    prompt += `${phaseConfig.instruction}\n\n`;
    
    // 如果有历史消息，添加上下文（V7.0 增强：包含论点地图和防重复警告）
    if (previousMessages && previousMessages.length > 0) {
      prompt += `┌─────────────────────────────────────────────┐\n`;
      prompt += `│ 📜 【历史讨论记录 - 最近${Math.min(5, previousMessages.length)}条】       │\n`;
      prompt += `└─────────────────────────────────────────────┘\n\n`;
      
      previousMessages.slice(-5).forEach((msg, idx) => {
        const contentPreview = msg.content.substring(0, 120);
        prompt += `${idx + 1}. [${msg.roleName || msg.role}] (第${msg.round || '?'}轮-${this.phases[msg.phase]?.name || '?'})\n`;
        prompt += `   ${contentPreview}${msg.content.length > 120 ? '...' : ''}\n\n`;
      });
      
      // 🔥 V7.0 新增：提取并展示"已用论点地图"
      const argumentMap = this.buildArgumentMap(previousMessages);
      if (argumentMap.usedArguments.length > 0) {
        prompt += `┌─────────────────────────────────────────────┐\n`;
        prompt += `│ 🚫 【已用论点黑名单 - 绝对禁止重复！】      │\n`;
        prompt += `└─────────────────────────────────────────────┘\n\n`;
        
        prompt += `以下论点已被使用过，**禁止再次提及相同或相似内容**：\n\n`;
        
        // 按类别分组显示
        const groupedArgs = this.groupArgumentsByCategory(argumentMap.usedArguments);
        Object.entries(groupedArgs).forEach(([category, args]) => {
          prompt += `【${category}】(${args.length}个)\n`;
          args.forEach((arg, idx) => {
            prompt += `   ${idx + 1}. ${arg.text.substring(0, 80)}${arg.text.length > 80 ? '...' : ''} [by ${arg.author}]\n`;
          });
          prompt += `\n`;
        });
        
        prompt += `⚠️ 警告：如果你发现自己要说的内容与上述任何论点相似度>70%，请立即换一个全新角度！\n\n`;
      }
      
      // 🔥 V7.0 新增：显示"未覆盖维度"
      if (argumentMap.uncoveredDimensions.length > 0) {
        prompt += `💡 【建议探索的新维度】：\n`;
        argumentMap.uncoveredDimensions.slice(0, 3).forEach((dim, idx) => {
          prompt += `   ${idx + 1}. ${dim}\n`;
        });
        prompt += `\n`;
      }
    }
    
    // ═══════════════════════════════════════
    // 第三层：角色任务指令（V7.0 增强）
    // ═══════════════════════════════════════
    prompt += `┌─────────────────────────────────────────────┐\n`;
    prompt += `│ ✅ 【你的具体任务 - 第${currentRound}轮】              │\n`;
    prompt += `└─────────────────────────────────────────────┘\n\n`;
    
    if (isFirstSpeaker && currentRound <= 1) {
      // 首轮发言的特殊指令
      prompt += `🎬 **首轮发言 - 设定基调**\n\n`;
      prompt += `作为首位发言者，你需要：\n`;
      prompt += `1. 提出你的**核心假设**或**初步判断**（1-2句话）\n`;
      prompt += `2. 给出**2-3个关键理由**支撑你的观点\n`;
      prompt += `3. 可以留下1-2个**开放性问题**引导后续讨论\n\n`;
      prompt += `💡 首轮策略：不要试图面面俱到，聚焦最有力的1-2个论点即可。\n\n`;
    } else {
      // 非首轮发言的递进指令
      const roundStrategy = this.getRoundStrategy(currentRound, previousMessages?.length || 0);
      prompt += `🔄 **第${currentRound}轮发言 - ${roundStrategy.name}**\n\n`;
      prompt += `${roundStrategy.description}\n\n`;
      prompt += `本轮具体要求：\n`;
      roundStrategy.requirements.forEach((req, idx) => {
        prompt += `${idx + 1}. ${req}\n`;
      });
      prompt += `\n`;
    }
    
    // 字数提醒
    prompt += `⚠️ 控制总字数在 ${wordLimit.min}-${wordLimit.max} 字以内\n\n`;
    
    // ═══════════════════════════════════════
    // 第四层：多角度分析引导（V7.0 新增）
    // ═══════════════════════════════════════
    prompt += `┌─────────────────────────────────────────────┐\n`;
    prompt += `│ 📊 【多维度分析参考矩阵 - V7.0】           │\n`;
    prompt += `└─────────────────────────────────────────────┘\n\n`;
    prompt += `请确保你的分析覆盖以下维度（选择与本话题最相关的2-3个）：\n\n`;
    
    const dimensionMatrix = [
      ['技术可行性', '能否用现有技术实现？难点在哪？需要什么创新？'],
      ['商业价值', '市场规模多大？盈利模式是什么？ROI如何？'],
      ['用户需求', '真实痛点是什么？付费意愿有多强？'],
      ['法律合规', '有哪些法律风险？如何规避？责任归属？'],
      ['竞争格局', '竞争对手是谁？差异化优势在哪里？护城河？'],
      ['实施路径', 'MVP应该做什么？分几步实施？资源需求？'],
      ['风险评估', '最大风险是什么？概率多大？如何应对？'],
      ['创新机会', '有什么被忽视的机会？跨界借鉴的可能性？'],
    ];
    
    dimensionMatrix.forEach(([dim, desc], idx) => {
      prompt += `${idx + 1}. **${dim}**：${desc}\n`;
    });
    prompt += `\n💡 提示：不要试图覆盖所有维度，选择最关键的2-3个深入阐述即可。\n\n`;
    
    // ═══════════════════════════════════════
    // 第五层：质量标准与检查清单（V7.0 增强）
    // ═══════════════════════════════════════
    prompt += `┌─────────────────────────────────────────────┐\n`;
    prompt += `│ 📏 【字数红线】上限:${wordLimit.max} | 下限:${wordLimit.min}     │\n`;
    prompt += `└─────────────────────────────────────────────┘\n\n`;
    
    // 输出深度控制（使用新的V6.0指令）
    const depthInstruction = this.getDepthInstruction(depth);
    prompt += `${depthInstruction}\n`;
    
    // 最终检查清单（增强版）
    prompt += `═══════════════════════════════════════\n`;
    prompt += `【✅ V7.0 输出前最终检查清单】\n`;
    prompt += `□ 字数是否在 ${wordLimit.min}-${wordLimit.max} 之间？\n`;
    prompt += `□ 是否有至少1个**全新的观点/角度**？（非重复内容）\n`;
    prompt += `□ 是否比上一轮**更深入**或**更新颖**？\n`;
    prompt += `□ 是否避免了"正如之前提到的"这类重复表述？\n`;
    prompt += `□ 是否删除了所有冗余、废话、套话？\n`;
    prompt += `□ 是否提供了具体的案例/数据/数字？（而非空泛论述）\n`;
    prompt += `═══════════════════════════════════════\n`;
    
    return prompt;
  }

  /**
   * 🔥 V7.0 新增：获取阶段配置（阶段差异化核心）
   */
  getPhaseConfig(phaseId, currentRound) {
    const phaseConfigs = {
      'probe': {
        objective: '深入理解需求背景、识别核心问题、明确成功标准',
        instruction: `【需求探查阶段 - 你的核心任务】

本阶段目标：
🔍 **挖掘表象背后的真正需求**
很多需求在表述时是模糊的或不准确的，你的任务是：
1. 识别需求的**隐含假设**（"用户真的需要X吗？还是其实需要Y？"）
2. 发现**未被说出的痛点**（"用户没提到但实际很困扰的问题"）
3. 明确**成功的衡量标准**（"怎么做算做好了？"）

分析框架：
• WHO：谁会用？他们的技术水平、预算、决策权？
• WHAT：解决什么问题？问题的紧迫性和频率？
• WHY：为什么现有方案不够好？根本原因是什么？
• HOW MUCH：愿意付出多少成本（时间/金钱/精力）？

⚠️ 禁止行为：
- 不要急于给出解决方案（这是下一阶段的任务）
- 不要接受表面需求而不追问"为什么"
- 不要假设用户的需求是正确的`,
      },
      'design': {
        objective: '提出和评估多种技术方案，找出最优解',
        instruction: `【方案设计阶段 - 你的核心任务】

本阶段目标：
🎨 **设计解决方案并提出评估**
基于需求探查的发现，现在需要：
1. 提出**2-3种可行的方案选项**（不是只有一种）
2. 每种方案的**优劣对比**（Trade-off分析）
3. 推荐**最优方案及理由**

方案设计原则：
• 可行性：技术上能实现吗？需要什么资源？
• 可扩展性：未来增长时还能用吗？
• 成本效益：投入产出比合理吗？
• 风险可控：最坏情况是什么？能承受吗？

评估矩阵（建议使用）：
| 方案 | 开发成本 | 维护成本 | 风险等级 | 推荐度 |
|------|---------|---------|---------|--------|
| 方案A | ? | ? | ? | ?/5 |
| 方案B | ? | ? | ? | ?/5 |

⚠️ 禁止行为：
- 不要只提一种方案（要有备选）
- 不要忽略方案的缺点（要客观）
- 不要陷入细节实现（先定方向再谈细节）`,
      },
      'impl': {
        objective: '细化实现步骤、资源规划和时间安排',
        instruction: `【实现规划阶段 - 你的核心任务】

本阶段目标：
🔧 **将方案转化为可执行的行动计划**
选定方案后，需要规划如何落地：
1. **拆解任务**：将大目标分解为小步骤（WBS工作分解结构）
2. **资源规划**：人力、技术、资金、时间各需要多少？
3. **里程碑设定**：关键节点和验收标准是什么？
4. **风险预案**：可能遇到什么障碍？Plan B是什么？

实施规划框架：
Phase 1（第1-X周）：基础搭建
  - 任务1.1：...
  - 任务1.2：...
  - 交付物：...

Phase 2（第X-Y周）：核心功能
  ...

Phase 3（第Y-Z周）：优化上线
  ...

资源需求清单：
□ 人员：角色、数量、技能要求
□ 技术：工具、框架、第三方服务
□ 预算：开发、运营、 contingency
□ 时间：关键路径、依赖关系

⚠️ 禁止行为：
- 不要过于理想化（要考虑实际情况）
- 不要忽略依赖关系（A完成后才能做B）
- 不要忘记测试和验证环节`,
      },
      'validate': {
        objective: '确认方案满足所有需求，识别遗留风险',
        instruction: `【验证确认阶段 - 你的核心任务】

本阶段目标：
✅ **最终检验方案完整性和可行性**
在动手实施前，最后检查一遍：
1. **需求覆盖度**：原始需求都满足了吗？有没有遗漏？
2. **方案完整性**：从端到端跑通了吗？有无断点？
3. **风险残留**：还有什么可能出错的地方？严重程度？

验证方法：
• 回溯检查：对照最初的需求列表逐项确认
• 场景推演：模拟用户使用的典型流程
• 压力测试：极端情况下的表现如何？
• 专家评审：邀请外部视角发现问题

输出格式建议：
## 验证结论
### ✅ 已满足的需求（列出）
### ⚠️ 部分满足的需求（说明差距）
### ❌ 未满足的需求（说明原因或替代方案）
### 📋 遗留风险清单（按优先级排序）
### 🎯 最终行动建议

⚠️ 禁止行为：
- 不要形式主义走过场（要认真检查）
- 不要隐瞒问题（早发现比晚发现好）
- 不要过度优化（完美是好的敌人）`,
      },
    };

    return phaseConfigs[phaseId] || phaseConfigs['probe'];
  }

  /**
   * 🔥 V7.0 新增：获取轮次策略（深度递进核心）
   */
  getRoundStrategy(roundNum, totalPreviousMessages) {
    const strategies = {
      1: {
        name: '开局破题',
        description: '第一轮发言，任务是**设定讨论基调和初步立场**。',
        requirements: [
          '明确提出你的核心观点或假设（1句话）',
          '给出2-3个关键理由支撑',
          '可以预留1-2个开放性问题',
          '不需要太深入，但要足够清晰',
        ],
      },
      2: {
        name: '深化论证',
        description: '第二轮发言，需要在第一轮基础上**深入展开或回应质疑**。',
        requirements: [
          '选择一个论点深入剖析（而非泛泛而谈）',
          '提供具体的数据、案例或证据',
          '回应可能的反驳意见',
          '引入一个新的视角或维度',
        ],
      },
      3: {
        name: '多维拓展',
        description: '第三轮发言，必须**跳出原有框架，探索新维度**。',
        requirements: [
          '提出一个前两轮未涉及的新角度',
          '进行跨行业/跨领域的类比分析',
          '探讨边界情况或极端场景',
          '质疑或修正之前的假设',
        ],
      },
      4: {
        name: '综合洞察',
        description: '第四轮发言，目标是**提炼洞察、提出创新性发现**。',
        requirements: [
          '综合前几轮讨论的核心要点',
          '提出1-2个原创性的洞察或发现',
          '指出讨论中被忽视的关键问题',
          '给出具有前瞻性的建议或预测',
        ],
      },
      5: {
        name: '收尾总结',
        description: '最后一轮发言，需要**总结成果并明确下一步**。',
        requirements: [
          '归纳已达成共识的部分',
          '梳理仍存在分歧的要点',
          '给出明确的行动建议',
          '评估整体方案成熟度（1-10分）',
        ],
      },
    };

    // 根据轮次返回对应策略，如果超过5轮则使用"收尾总结"
    return strategies[Math.min(roundNum, 5)] || strategies[4];
  }

  /**
   * 🔥 V7.0 新增：构建论点地图（增强版防重复机制）
   */
  buildArgumentMap(messages) {
    const usedArguments = [];
    const allDimensions = [
      '技术可行性', '商业价值', '用户需求', '法律合规', 
      '竞争格局', '实施路径', '风险评估', '创新机会'
    ];
    const coveredDimensions = new Set();
    
    messages.forEach(msg => {
      if (!msg.content) return;
      
      // 提取核心论点（更精准的模式匹配）
      const patterns = [
        /(?:核心|关键|主要|重要)[^。]{15,100}/g,
        /(?:认为|指出|强调|表示|主张|建议)[^。]{20,120}/g,
        /(?:第一|首先|其一|1[.、]|一、)[^。]{25,120}/g,
        /(?:第二|其次|其二|2[.、]|二、)[^。]{25,120}/g,
        /(?:第三|再次|其三|3[.、]|三、)[^。]{25,120}/g,
        /(?:因此|所以|综上|总之|结论)[^。]{20,100}/g,
        /(?:风险|挑战|问题|难点|障碍)[^。]{20,100}/g,
        /(?:优势|机会|价值|好处|收益)[^。]{20,100}/g,
        /(?:建议|推荐|应该|需要|必须)[^。]{20,100}/g,
      ];
      
      patterns.forEach(pattern => {
        const matches = msg.content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const cleaned = match.trim().slice(0, 100);
            if (cleaned.length > 15) {
              usedArguments.push({
                text: cleaned,
                author: msg.roleName || msg.role,
                round: msg.round,
                phase: msg.phase,
              });
              
              // 检测覆盖的维度
              allDimensions.forEach(dim => {
                if (cleaned.includes(dim) || this.isRelatedToDimension(cleaned, dim)) {
                  coveredDimensions.add(dim);
                }
              });
            }
          });
        }
      });
    });
    
    // 计算未覆盖的维度
    const uncoveredDimensions = allDimensions.filter(d => !coveredDimensions.has(d));
    
    return {
      usedArguments: usedArguments.slice(-20), // 保留最近20个论点
      coveredDimensions: [...coveredDimensions],
      uncoveredDimensions,
      totalArguments: usedArguments.length,
    };
  }

  /**
   * 🔥 V7.0 新增：将论点按类别分组
   */
  groupArgumentsByCategory(argList) {
    const categories = {
      '核心观点': [],
      '风险挑战': [],
      '建议方案': [],
      '数据证据': [],
      '其他': [],
    };

    argList.forEach(arg => {
      const text = arg.text;
      if (/核心|认为|主张|观点|假设/.test(text)) {
        categories['核心观点'].push(arg);
      } else if (/风险|挑战|问题|难点|障碍|隐患/.test(text)) {
        categories['风险挑战'].push(arg);
      } else if (/建议|推荐|应该|需要|必须|方案/.test(text)) {
        categories['建议方案'].push(arg);
      } else if (/\d+%|\d+万|数据显示?|根据.*调查|研究显示/.test(text)) {
        categories['数据证据'].push(arg);
      } else {
        categories['其他'].push(arg);
      }
    });
    
    // 移除空分类
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0) delete categories[key];
    });
    
    return categories;
  }

  /**
   * 🔥 V7.0 新增：检测文本是否与某个维度相关
   */
  isRelatedToDimension(text, dimension) {
    const keywords = {
      '技术可行性': ['技术', '实现', '开发', '架构', '算法', '性能', '扩展'],
      '商业价值': ['市场', '盈利', '收入', '商业模式', '客户', '定价', 'ROI'],
      '用户需求': ['用户', '痛点', '体验', '需求', '场景', '使用', '交互'],
      '法律合规': ['法律', '合规', '风险', '隐私', '数据保护', '监管', '政策'],
      '竞争格局': ['竞争', '对手', '替代', '市场份额', '差异化', '优势'],
      '实施路径': ['实施', '步骤', '计划', '里程碑', '资源', '团队', '时间'],
      '风险评估': ['风险', '失败', '不确定性', '依赖', '瓶颈', '单点'],
      '创新机会': ['创新', '机会', '趋势', '未来', '前沿', '突破', '变革'],
    };
    
    const dims = keywords[dimension] || [];
    return dims.some(keyword => text.includes(keyword));
  }

  /**
   * 🔥 V5.0 新增：从历史消息中提取关键论点（用于上下文记忆）
   */
  extractKeyPointsFromMessages(messages) {
    if (!messages || messages.length === 0) return [];
    
    const keyPoints = new Set();
    
    messages.forEach(msg => {
      if (!msg.content) return;
      
      // 提取核心观点的模式匹配
      const patterns = [
        /(?:核心|关键|主要|重要)[^。]{10,80}/g,  // 核心观点句
        /(?:认为|指出|强调|表示)[^。]{15,100}/g,  // 观点陈述句
        /(?:第一|首先|其一|1[.、])[^。]{20,100}/g,  // 第一点
        /(?:第二|其次|其二|2[.、])[^。]{20,100}/g,  // 第二点
        /(?:因此|所以|综上|总之)[^。]{15,80}/g,     // 结论句
      ];
      
      patterns.forEach(pattern => {
        const matches = msg.content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // 清理并缩短
            const cleaned = match.trim().slice(0, 60);
            if (cleaned.length > 10) {
              keyPoints.add(cleaned);
            }
          });
        }
      });
    });
    
    // 返回唯一的关键点（最多保留最近15个）
    return [...keyPoints].slice(-15);
  }

  /**
   * 🔥 V4.0 新增：确定消息类型
   */
  /**
   * 🔥 V4.1: 确定消息类型（使用共享常量的 getMessageTypeForRole）
   */
  determineMessageType(roleType, isFirstSpeaker) {
    // 使用共享常量中的函数判断
    return getMessageTypeForRole(roleType);
  }

  /**
   * 执行 Proposer 角色（V2.2：使用流式输出）
   */
  async executeProposer() {
    const proposer = this.getRole(ROLES.PROPOSER);
    if (!proposer) return;

    const context = this.contextManager.getProposerContext();
    const prompt = this.buildProposerPrompt(context);

    // 🔥 V2.2 修复：传递消息元数据
    const content = await this.callAIStream(
      proposer.soul || '你是一位提案者，负责提出建设性方案',
      prompt,
      proposer.model,
      {
        role: ROLES.PROPOSER,
        roleName: proposer.name,
        phase: this.currentPhase,
        round: this.currentRound,
        phaseId: this.phases[this.currentPhase].id,
      },
      (chunk, fullContent) => {
        // 实时回调（可选）
      }
    );

    if (content === '[已取消]') {
      console.log('[DebateEngine] Proposer 输出被取消');
      return;
    }

    const proposal = {
      type: MESSAGE_TYPES.PROPOSAL,
      role: ROLES.PROPOSER,
      roleName: proposer.name,
      round: this.currentRound,
      phase: this.currentPhase,
      phaseId: this.phases[this.currentPhase].id,
      content: content,
      timestamp: new Date().toISOString(),
    };

    this.messages.push(proposal);

    // 🔥 BUG-002 FIX: 同上，不再重复发送 debate:message
    // this.emit('debate:message', proposal); // 已禁用 - 避免与流式输出重复

    await this.executeReviewer(proposal);
  }

  /**
   * 执行 Reviewer 角色（V2.2：使用流式输出）
   */
  async executeReviewer(proposal) {
    const reviewer = this.getRole(ROLES.REVIEWER);
    if (!reviewer) {
      console.warn('[DebateEngine] ⚠️ Reviewer 角色未找到，跳过审查环节');
      // 如果没有 Reviewer，直接推进到下一轮
      await this.checkProgression({ verdict: 'adequate' });
      return;
    }

    console.log(`[DebateEngine] 🔍 Reviewer 准备审查提案: ${proposal.content?.substring(0, 50)}...`);

    const context = this.contextManager.getReviewerContext(proposal);
    const prompt = this.buildReviewerPrompt(context);

    // 🔥 V2.2 修复：传递消息元数据
    const content = await this.callAIStream(
      reviewer.soul || '你是一位审查者，负责严格审查提案',
      prompt,
      reviewer.model,
      {
        role: ROLES.REVIEWER,
        roleName: reviewer.name,
        phase: this.currentPhase,
        round: this.currentRound,
        phaseId: this.phases[this.currentPhase].id,
      }
    );

    if (content === '[已取消]') {
      console.log('[DebateEngine] Reviewer 输出被取消');
      return;
    }

    // 从 AI 回复中智能提取 verdict
    const verdict = this.extractVerdictFromContent(content);

    const review = {
      type: MESSAGE_TYPES.REVIEW,
      role: ROLES.REVIEWER,
      roleName: reviewer.name,
      round: this.currentRound,
      phase: this.currentPhase,
      phaseId: this.phases[this.currentPhase].id,
      content: content,
      verdict: verdict,
      timestamp: new Date().toISOString(),
    };

    this.messages.push(review);

    // 🔥 BUG-002 FIX: 同上，不再重复发送 debate:message
    // this.emit('debate:message', review); // 已禁用 - 避免与流式输出重复

    // 🔥 V2.0新增：触发Proposer对Review的回应（增强双向交锋）
    if (review.verdict === 'needs_work' || review.verdict === 'rejected') {
      await this.executeRebuttal(review);
    }

    await this.checkProgression(review);
  }

  /**
   * 🔥 V2.0新增：执行Proposer对审查意见的回应
   * 实现真正的双向辩论交锋，而非单向审查
   */
  async executeRebuttal(review) {
    const proposer = this.getRole(ROLES.PROPOSER);
    if (!proposer) return;

    console.log(`[DebateEngine] Proposer正在回应审查意见 (verdict: ${review.verdict})...`);

    const context = {
      topic: this.topic,
      phase: this.phases[this.currentPhase].id,
      phaseName: this.phases[this.currentPhase].name,
      round: this.currentRound,
      originalProposal: this.messages
        .filter(m => m.type === MESSAGE_TYPES.PROPOSAL && m.round === this.currentRound)
        .pop()?.content || '未找到原始提案',
      reviewContent: review.content,
      reviewVerdict: review.verdict,
      keyIssuesFromReview: this.extractKeyIssuesFromReview(review.content),
    };

    const prompt = `审查者对你的方案给出了**${this.getVerdictLabel(review.verdict)}**的评价。

## 审查者的核心质疑（摘要）
${context.keyIssuesFromReview.length > 0 ? context.keyIssuesFromReview.join('\n') : review.content.substring(0, 600)}

## 你的回应任务

作为提案者，请针对上述审查意见进行**专业、有建设性的回应**：

### 回应要求：
1. **承认合理批评**：对于确实存在的问题，诚实承认并说明改进方案
2. **澄清误解**：如果审查者误解了你的观点，礼貌地澄清并提供补充证据
3. **强化核心论点**：重申你最有力的论点，并可能增加新的支撑证据
4. **保持专业态度**：即使面对严厉批评也要保持尊重和理性

### 输出格式：
\`\`\`
## 我的回应

### 对审查意见的总体回应
[1-2句话概括你对这次审查的整体态度]

### 针对关键问题的逐项回应

#### 问题1：[审查者提出的具体问题]
- **我的立场**：[同意/部分同意/不同意]
- **我的解释/改进方案**：[详细展开，50-150字]

#### 问题2：[另一个问题]
[同上结构...]

### 基于反馈的调整声明
[如果有需要修改的地方，明确说明你愿意如何调整；如果没有重大修改，说明原因]

### 重申核心价值
[用2-3句话强调你的方案最核心的优势和价值]
\`\`\`

## 重要提醒
- 不要情绪化或防御性过强
- 用事实和逻辑回应，不要空谈
- 控制总字数在400-700字之间
- 如果verdict是REJECTED，你需要更有力地辩护核心主张`;

    // 🔥 V2.2 修复：传递消息元数据
    const content = await this.callAIStream(
      proposer.soul || '你是一位专业的提案者',
      prompt,
      proposer.model,
      {
        role: ROLES.PROPOSER,
        roleName: proposer.name,
        phase: this.currentPhase,
        round: this.currentRound,
        phaseId: this.phases[this.currentPhase].id,
        type: 'rebuttal',
      }
    );

    if (content === '[已取消]') {
      console.log('[DebateEngine] Rebuttal 输出被取消');
      return;
    }

    const rebuttal = {
      type: 'rebuttal',  // 新增消息类型标识
      role: ROLES.PROPOSER,
      roleName: proposer.name,
      round: this.currentRound,
      phase: this.currentPhase,
      phaseId: this.phases[this.currentPhase].id,
      content: content,
      timestamp: new Date().toISOString(),
      replyTo: `${this.currentPhase}-${this.currentRound}-review`,
      triggeredByVerdict: review.verdict,  // 记录是什么触发了这次回应
    };

    this.messages.push(rebuttal);

    // 🔥 BUG-002 FIX: 同上，不再重复发送 debate:message
    // this.emit('debate:message', rebuttal); // 已禁用 - 避免与流式输出重复
    console.log(`[DebateEngine] Proposer回应完成 (${content.length} 字符) [仅流式]`);
  }

  /**
   * 🔥 新增：从审查内容中提取关键问题点
   */
  extractKeyIssuesFromReview(reviewContent) {
    const issues = [];
    const patterns = [
      /(?:问题|缺陷|漏洞|风险|不足)[：:]\s*([^\n]{20,200})/gi,
      /(?:致命|严重|一般|轻微)\s*(?:问题|缺陷)[^：:]*[：:]\s*([^\n]{20,200})/gi,
      /- \*\*([^*]+)\*\*[^\n]*\n\s*- \*\*[^*]*分析[^\n]*\n\s*([^\n]+)/gi,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(reviewContent)) !== null) {
        const issue = (match[1] || match[2] || '').trim();
        if (issue && issue.length > 15 && issues.length < 5) {  // 最多提取5个关键问题
          issues.push(issue.substring(0, 100));  // 截断过长的问题描述
        }
      }
    });

    return issues;
  }

  /**
   * 获取Verdict的中文标签
   */
  getVerdictLabel(verdict) {
    const labels = {
      'strong': '强烈通过 ✅',
      'adequate': '基本通过 👍',
      'needs_work': '需修改 ⚠️',
      'rejected': '拒绝 ❌'
    };
    return labels[verdict] || verdict;
  }

  /**
   * 🔥 V2.0: 智能Verdict提取（彻底消除Math.random()）
   * 优先级：结构化标签提取 > AI辅助判断 > 安全默认值
   */
  extractVerdictFromContent(content) {
    if (!content) return 'needs_work';

    // 方法1：从结构化输出标签中提取（最可靠 - 零成本）
    const structuredPatterns = [
      /VERDICT[:\s]*(STRONG_APPROVE|STRONG|APPROVE|NEEDS_WORK|NEEDS|REJECTED?)/i,
      /\*\*Verdict\*\*[:\s]*(STRONG_APPROVE|STRONG|APPROVE|NEEDS_WORK|NEEDS|REJECTED?)/i,
      /最终评判[:\s]*(STRONG_APPROVE|STRONG|APPROVE|NEEDS_WORK|NEEDS|REJECTED?)/i,
      /判定结果[:\s]*(STRONG_APPROVE|STRONG|APPROVE|NEEDS_WORK|NEEDS|REJECTED?)/i,
    ];

    for (const pattern of structuredPatterns) {
      const match = content.match(pattern);
      if (match) {
        const verdictMap = {
          'STRONG_APPROVE': 'strong',
          'STRONG': 'strong',
          'APPROVE': 'adequate',
          'NEEDS_WORK': 'needs_work',
          'NEEDS': 'needs_work',
          'REJECT': 'rejected',
          'REJECTED': 'rejected'
        };
        const normalized = match[1].toUpperCase().replace(/\s+/g, '_');
        if (verdictMap[normalized]) {
          console.log(`[DebateEngine] Verdict extracted from structured tag: ${normalized}`);
          return verdictMap[normalized];
        }
      }
    }

    // 方法2：从评分总分推断（如果审查者按格式输出了分数）
    const scoreMatch = content.match(/总分[:\s]*(\d{1,2})\/50/i);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1]);
      console.log(`[DebateEngine] Verdict inferred from score: ${score}/50`);
      if (score >= 43) return 'strong';
      if (score >= 35) return 'adequate';
      if (score >= 25) return 'needs_work';
      return 'rejected';
    }

    // 方法3：关键词语义分析（作为辅助参考）
    const strongKeywords = ['强烈通过', '强烈推荐', '优秀', '完美', '无可挑剔', 'strong approve'];
    const adequateKeywords = ['通过', '认可', '良好', '可以接受', '基本同意', 'approve', 'adequate'];
    const rejectKeywords = ['拒绝', '驳回', '不通过', '不可行', '完全不同意', 'reject'];

    let strongCount = 0, adequateCount = 0, rejectCount = 0;

    strongKeywords.forEach(kw => { if (content.includes(kw)) strongCount++; });
    adequateKeywords.forEach(kw => { if (content.includes(kw)) adequateCount++; });
    rejectKeywords.forEach(kw => { if (content.includes(kw)) rejectCount++; });

    if (strongCount > Math.max(adequateCount, rejectCount) && strongCount > 0) {
      console.log(`[DebateEngine] Verdict inferred from keywords: strong (${strongCount} matches)`);
      return 'strong';
    }
    if (rejectCount > Math.max(strongCount, adequateCount) && rejectCount > 0) {
      console.log(`[DebateEngine] Verdict inferred from keywords: rejected (${rejectCount} matches)`);
      return 'rejected';
    }
    if (adequateCount > 0) {
      console.log(`[DebateEngine] Verdict inferred from keywords: adequate (${adequateCount} matches)`);
      return 'adequate';
    }

    // 方法4：AI辅助判断（最后手段，但比random可靠得多）
    console.log('[DebateEngine] Structured extraction failed, falling back to AI inference...');
    this.inferVerdictWithAI(content).then(verdict => {
      console.log(`[DebateEngine] AI-inferred verdict: ${verdict}`);
    }).catch(err => {
      console.warn('[DebateEngine] AI inference failed:', err.message);
    });

    return 'needs_work';  // 同步返回默认值，异步更新
  }

  /**
   * 🔥 新增：AI辅助Verdict推断（异步版本）
   * 使用低temperature的二次调用确保确定性
   */
  async inferVerdictWithAI(content) {
    try {
      const truncatedContent = content.substring(0, 1500);

      const response = await this.aiClient.chat.completions.create({
        model: 'deepseek-v4-flash',
        messages: [
          {
            role: 'system',
            content: `你是辩论评判专家。你的唯一任务是判断以下审查内容的态度。
只输出一个单词（不要任何解释）：STRONG_APPROVE 或 APPROVE 或 NEEDS_WORK 或 REJECT`
          },
          {
            role: 'user',
            content: `请判断这个审查的整体态度（${truncatedContent.length}字）：\n\n${truncatedContent}\n\n\n只回复一个词：`
          }
        ],
        temperature: 0.1,
        max_tokens: 20,
        top_p: 0.95
      });

      const result = (response.choices[0]?.message?.content || '').trim().toUpperCase();

      if (result.includes('STRONG') || result.includes('EXCELLENT')) return 'strong';
      if (result.includes('REJECT') || result.includes('FAIL')) return 'rejected';
      if (result.includes('NEEDS') || result.includes('WEAK')) return 'needs_work';
      if (result.includes('APPROVE') || result.includes('PASS') || result.includes('OK')) return 'adequate';

      console.warn(`[DebateEngine] AI returned unrecognizable verdict: "${result}"`);
      return 'needs_work';

    } catch (error) {
      console.error('[DebateEngine] AI verdict inference failed:', error.message);
      return 'needs_work';
    }
  }

  /**
   * 检查是否可以推进到下一轮或下一阶段
   */
  async checkProgression(review) {
    // 轮次上限保护：达到最大轮次后强制推进
    if (this.currentRound >= this.maxRounds) {
      console.log(`[DebateEngine] 达到最大轮次 ${this.maxRounds}，强制推进到下一阶段`);
      await this.generateConsensus();
      await this.startPhase(this.currentPhase + 1);
      return;
    }

    const canProgress = this.evaluateProgression(review);

    if (canProgress) {
      console.log(`[DebateEngine] 阶段 ${this.currentPhase} 完成，准备推进...`);
      await this.generateConsensus();
      
      const backtrackResult = await this.backtrackValidator.validate();
      
      if (backtrackResult.status === 'CONTRADICTED') {
        this.emit('debate:backtrack', backtrackResult);
        await this.resolveContradiction(backtrackResult);
      } else {
        await this.startPhase(this.currentPhase + 1);
      }
    } else {
      console.log(`[DebateEngine] 继续轮次 ${this.currentRound + 1}/${this.maxRounds}`);
      await this.startRound(this.currentRound + 1);
    }
  }

  /**
   * 评估是否可以推进（优化后的规则）
   */
  evaluateProgression(review) {
    let score = 0;

    // 1. 最低轮次检查（必须完成至少2轮）
    if (this.currentRound >= 2) score++;

    // 2. Reviewer 认可度
    if (review.verdict === 'strong' || review.verdict === 'adequate') {
      score += 2; // 认可的话直接+2分
    } else if (review.verdict === 'needs_work') {
      score += 0.5; // needs_work 给半分
    }

    // 3. 轮次接近上限时加分（避免无限循环）
    if (this.currentRound >= this.maxRounds - 1) score++;

    // 4. 消息数量足够
    if (this.messages.length >= 6) score++;

    // 降低门槛：2分即可推进（原来是3分）
    return score >= 2;
  }

  /**
   * 🔥 新增：尝试推进阶段（修复缺失的方法）
   * 在达到最大轮次时调用，尝试进入下一阶段
   */
  async attemptPhaseProgression() {
    console.log(`[DebateEngine] 尝试推进到下一阶段...`);
    
    // 生成当前阶段的共识
    await this.generateConsensus();
    
    // 尝试进入下一阶段
    const nextPhase = this.currentPhase + 1;
    if (nextPhase < this.phases.length) {
      console.log(`[DebateEngine] 进入阶段 ${nextPhase}: ${this.phases[nextPhase].name}`);
      await this.startPhase(nextPhase);
    } else {
      console.log(`[DebateEngine] 所有阶段已完成，结束辩论`);
      await this.complete();
    }
  }

  /**
   * 生成本阶段共识
   */
  async generateConsensus() {
    const phase = this.phases[this.currentPhase];
    const phaseMessages = this.getPhaseMessages(phase.id);
    
    // 提取承诺
    const newCommitments = this.extractCommitments(phaseMessages);
    this.commitments.push(...newCommitments);
    
    // 🔥 修复：生成有意义的共识摘要
    const summary = this.generateSimpleConsensusSummary(phase, phaseMessages, newCommitments);
    
    const consensus = {
      phase: phase.id,
      phaseName: phase.name,
      round: this.currentRound,
      summary: summary,
      commitments: newCommitments,
      timestamp: new Date().toISOString(),
      // 🔥 新增：为每轮每角色生成独立摘要
      roleSummaries: this.generateRoleSummaries(phaseMessages),
    };
    
    this.consensus.push(consensus);
    this.emit('debate:consensus', consensus);
  }
  
  /**
   * 🔥 新增：生成简单的共识摘要
   */
  generateSimpleConsensusSummary(phase, phaseMessages, commitments) {
    if (phaseMessages.length === 0) {
      return '本阶段暂无讨论内容。';
    }
    
    // 统计参与角色
    const roles = [...new Set(phaseMessages.map(m => m.role).filter(r => r !== 'system'))];
    const messageCount = phaseMessages.length;
    
    // 统计正反方观点数量
    const proposerMessages = phaseMessages.filter(m => 
      m.role && (m.role.includes('proposer') || m.role.includes('正方') || m.role.includes('提案'))
    );
    const reviewerMessages = phaseMessages.filter(m => 
      m.role && (m.role.includes('reviewer') || m.role.includes('反方') || m.role.includes('审查'))
    );
    
    // 生成摘要
    let summary = `本阶段（${phase.name}）共有 ${roles.length} 个角色参与讨论，产生 ${messageCount} 条消息。`;
    
    if (proposerMessages.length > 0 && reviewerMessages.length > 0) {
      summary += `其中正方提出 ${proposerMessages.length} 个观点，反方提出 ${reviewerMessages.length} 个观点。`;
    }
    
    if (commitments.length > 0) {
      summary += `各方共达成 ${commitments.length} 项核心承诺。`;
    }
    
    // 添加主要观点摘要
    const keyPoints = phaseMessages
      .filter(m => m.content && m.content.length > 50)
      .slice(0, 2)
      .map(m => m.content.substring(0, 100) + '...')
      .join('；');
    
    if (keyPoints) {
      summary += ` 主要观点：${keyPoints}`;
    }
    
    return summary;
  }
  
  /**
   * 🔥 新增：为每轮每角色生成独立摘要
   */
  generateRoleSummaries(phaseMessages) {
    const roleGroups = {};
    
    // 按角色分组消息
    phaseMessages.forEach(msg => {
      if (msg.role && msg.role !== 'system') {
        if (!roleGroups[msg.role]) {
          roleGroups[msg.role] = [];
        }
        roleGroups[msg.role].push(msg);
      }
    });
    
    // 为每个角色生成摘要
    const summaries = {};
    Object.entries(roleGroups).forEach(([role, messages]) => {
      const totalChars = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
      const avgChars = messages.length > 0 ? Math.round(totalChars / messages.length) : 0;
      
      summaries[role] = {
        messageCount: messages.length,
        totalChars: totalChars,
        avgCharsPerMessage: avgChars,
        // 取第一条消息的角色名作为显示名
        displayName: messages[0]?.roleName || role,
        // 简要总结（取前两条消息的内容摘要）
        briefSummary: messages
          .slice(0, 2)
          .map(m => m.content?.substring(0, 50) + '...')
          .join(' | ') || '暂无内容',
      };
    });
    
    return summaries;
  }

  /**
   * 解决矛盾
   */
  async resolveContradiction(backtrackResult) {
    // 生成矛盾解决提示
    const resolutionPrompt = this.buildResolutionPrompt(backtrackResult);
    
    // 继续讨论以解决矛盾
    await this.startRound(this.currentRound + 1);
  }

  /**
   * 完成辩论
   */
  async complete() {
    this.status = 'completed';
    
    // 生成最终报告
    const finalReport = this.generateFinalReport();
    
    // 🔥 新增：生成辩论文件并触发事件
    const generatedFiles = await this.generateDebateFiles();
    
    this.emit('debate:complete', {
      id: this.id,
      topic: this.topic,
      report: finalReport,
      totalPhases: this.currentPhase + 1,
      totalRounds: this.messages.filter(m => m.type === MESSAGE_TYPES.PROPOSAL).length,
      commitments: this.commitments,
      consensus: this.consensus,
      files: generatedFiles,  // 包含生成的文件列表
    });
    
    // 发送文件生成事件（让前端可以更新文件列表）
    if (generatedFiles && generatedFiles.length > 0) {
      this.emit('debate:files-generated', {
        files: generatedFiles,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 停止辩论
   */
  stop() {
    this.status = 'idle';
    this.emit('debate:stopped', {
      id: this.id,
      currentPhase: this.currentPhase,
      currentRound: this.currentRound,
    });
  }

  // ===== 辅助方法 =====

  /**
   * 🔥 V2.2 修复：流式 AI 调用（逐字/逐块输出）
   * 实现实时流式显示，提升用户体验
   * @param {string} systemPrompt - 系统提示（角色设定）
   * @param {string} userPrompt - 用户提示（任务内容）
   * @param {string} modelName - 模型名称（可选）
   * @param {object} messageMeta - 消息元数据（可选）
   * @param {function} onChunk - 回调函数（可选）
   * @param {string} outputDepth - 输出深度（可选，默认 this.outputDepth）
   */
  async callAIStream(systemPrompt, userPrompt, modelName = null, messageMeta = null, onChunk = null, outputDepth = null) {
    const model = modelName || this.apiConfig.defaultModel;
    const timeout = this.apiConfig.timeout;
    const depth = outputDepth || this.outputDepth || 'normal';

    console.log(`\n[DebateEngine] 🌊 开始流式调用AI API...`);
    console.log(`[DebateEngine] 模型: ${model} (流式模式)`);
    console.log(`[DebateEngine] 输出深度: ${depth}`);

    // 🔥 新增：根据输出深度获取指令模板
    const depthInstruction = this.getDepthInstruction(depth);
    const finalSystemPrompt = depthInstruction + '\n\n' + systemPrompt;

    // 🔥 修复：传递消息元数据
    this.emit('debate:stream:start', {
      model: model,
      timestamp: new Date().toISOString(),
      ...messageMeta, // 包含 role, phase, round 等信息
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // 保存 controller 以便后续取消
      this._currentAbortController = controller;

      const stream = await this.aiClient.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.25,  // 🔥 V5.0 进一步降低温度（0.3→0.25）减少重复
        max_tokens: 3500,
        top_p: 0.8,       // 🔥 V5.0 降低top_p（0.85→0.8）使采样更集中
        presence_penalty: 0.4,   // 🔥 V5.0 大幅提升（0.1→0.4）强力抑制主题重复
        frequency_penalty: 0.5,  // 🔥 V5.0 大幅提升（0.15→0.5）强力抑制词汇重复
        stream: true,
        signal: controller.signal,
      });

      let fullContent = '';
      let chunkCount = 0;
      let lastChunkContent = '';
      const DUPLICATE_THRESHOLD = 0.7;  // 🔥 V5.0 降低阈值（0.85→0.7）更严格检测

      // 🔥 V10.0 核心修复：词语级别翻倍检测与剔除
      const cleanWordDuplication = (text) => {
        if (!text || text.length < 4) return text;
        const chineseDupRegex = /([\u4e00-\u9fa5]{2,6})\1+/g;
        let cleaned = text.replace(chineseDupRegex, '$1');
        const englishDupRegex = /(\b\w+\b)\s+\1\b/g;
        cleaned = cleaned.replace(englishDupRegex, '$1');
        return cleaned;
      };
      let lastCheckLength = 0;

      // 🔥 逐块读取流式数据
      for await (const chunk of stream) {
        if (controller.signal.aborted) {
          console.log('[DebateEngine] 流式传输被用户取消');
          throw new Error('STREAM_CANCELLED');
        }

        let content = chunk.choices[0]?.delta?.content || '';

        // 🔥 chunk边界去重检测
        if (content && lastChunkContent) {
          if (this.backtrackValidator.detectRepetition(content, lastChunkContent)) {
            console.log(`[DebateEngine] chunk边界检测到重复，跳过: "${content.slice(0, 20)}..."`);
            lastChunkContent = content.slice(-10);
            continue;
          }
        }

        if (content) {
          lastChunkContent = content.slice(-10);
          fullContent += content;
          chunkCount++;
          
          // 🔥 V10.0 新增：定期检测fullContent中的词语翻倍（每100字符检测一次）
          if (fullContent.length - lastCheckLength > 100) {
            const cleanedContent = cleanWordDuplication(fullContent);
            if (cleanedContent.length < fullContent.length * 0.95) {
              console.log(`[DebateEngine] 检测到词语翻倍，清理: ${fullContent.length} → ${cleanedContent.length} 字符`);
              fullContent = cleanedContent;
            }
            lastCheckLength = fullContent.length;
          }

          // 🔥 发送每个文本块到前端
          this.emit('debate:stream:chunk', {
            content: content,
            chunkIndex: chunkCount,
            totalLength: fullContent.length,
            timestamp: new Date().toISOString(),
          });

          // 如果提供了回调函数，也调用它
          if (onChunk) {
            onChunk(content, fullContent);
          }
        }
      }

      // 🔥 V10.0 流式结束后最终清理
      fullContent = cleanWordDuplication(fullContent);

      clearTimeout(timeoutId);
      this._currentAbortController = null;

      console.log(`\n✅ [DebateEngine] 流式输出完成!`);
      console.log(`[DebateEngine] 总块数: ${chunkCount}`);
      console.log(`[DebateEngine] 最终长度: ${fullContent.length} 字符`);

      // 🔥 V6.0 新增：字数合规性检测（仅记录，不截断）
      this.checkWordCountCompliance(fullContent, depth);

      // 通知前端流式结束
      this.emit('debate:stream:end', {
        totalChunks: chunkCount,
        contentLength: fullContent.length,
        timestamp: new Date().toISOString(),
      });

      return fullContent;

    } catch (error) {
      this._currentAbortController = null;

      if (error.message === 'STREAM_CANCELLED') {
        this.emit('debate:stream:cancelled', {
          message: '用户取消了当前生成',
          timestamp: new Date().toISOString(),
        });
        return '[已取消]';
      }

      console.error('[DebateEngine] 流式API错误:', error.message);
      this.emit('debate:stream:error', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return `[AI调用失败: ${error.message}]`;
    }
  }

  /**
   * 🔥 V2.2 新增：取消当前正在进行的流式请求
   */
  cancelCurrentRequest() {
    if (this._currentAbortController) {
      console.log('[DebateEngine] 🛑 取消当前请求...');
      this._currentAbortController.abort();
      this._currentAbortController = null;
      return true;
    }
    return false;
  }

  /**
   * 🔥 V2.1 优化版：带超时保护和重试机制的 AI 调用
   * 解决"卡在 AI 正在思考..."问题的核心修复
   */
  async callAI(systemPrompt, userPrompt, modelName = null) {
    const model = modelName || this.apiConfig.defaultModel;
    const maxRetries = this.apiConfig.maxRetries;
    const timeout = this.apiConfig.timeout;

    console.log(`\n[DebateEngine] 🚀 开始调用AI API...`);
    console.log(`[DebateEngine] 模型: ${model}`);
    console.log(`[DebateEngine] 超时: ${timeout}ms | 最大重试: ${maxRetries}次`);
    console.log(`[DebateEngine] System提示长度: ${systemPrompt.length} 字符`);
    console.log(`[DebateEngine] User提示长度: ${userPrompt.length} 字符`);

    // 🔥 新增：通知前端正在调用API
    this.emit('debate:status', {
      status: 'calling_ai',
      message: '正在连接 AI 服务...',
      model: model,
      timestamp: new Date().toISOString(),
    });

    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`\n[DebateEngine] 📞 第 ${attempt}/${maxRetries} 次尝试...`);

        // 🔥 新增：创建 AbortController 用于超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, timeout);

        // 🔥 更新状态：等待响应
        this.emit('debate:status', {
          status: 'waiting_response',
          message: `等待 AI 响应中... (${attempt}/${maxRetries})`,
          elapsed: '0s',
          timestamp: new Date().toISOString(),
        });

        const startTime = Date.now();

        const response = await this.aiClient.chat.completions.create({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.65,
          max_tokens: 3500,
          top_p: 0.92,
          presence_penalty: 0.3,
          frequency_penalty: 0.2,
          signal: controller.signal, // 🔥 新增：传入 abort signal
        });

        clearTimeout(timeoutId); // 清除超时计时器

        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
        const content = response.choices[0]?.message?.content || '';

        if (!content.trim()) {
          throw new Error('AI 返回了空内容');
        }

        console.log(`\n✅ [DebateEngine] AI 调用成功!`);
        console.log(`[DebateEngine] 耗时: ${elapsedTime}s`);
        console.log(`[DebateEngine] 回复长度: ${content.length} 字符`);
        console.log(`[DebateEngine] 回复预览: ${content.substring(0, 150)}...`);

        // 🔥 新增：通知前端 API 调用成功
        this.emit('debate:status', {
          status: 'success',
          message: 'AI 响应成功',
          elapsedTime: `${elapsedTime}s`,
          contentLength: content.length,
          timestamp: new Date().toISOString(),
        });

        return content;

      } catch (error) {
        lastError = error;
        clearTimeout(timeoutId); // 确保清除计时器

        // 分类错误类型
        const errorType = this.classifyError(error);
        console.error(`\n❌ [DebateEngine] 第 ${attempt} 次尝试失败:`);
        console.error(`[DebateEngine] 错误类型: ${errorType}`);
        console.error(`[DebateEngine] 错误信息: ${error.message}`);

        // 🔥 新增：通知前端错误状态
        this.emit('debate:status', {
          status: 'error',
          errorType: errorType,
          message: `API 调用失败 (${attempt}/${maxRetries}): ${error.message}`,
          attempt: attempt,
          maxRetries: maxRetries,
          willRetry: attempt < maxRetries,
          timestamp: new Date().toISOString(),
        });

        // 如果是认证错误或参数错误，不需要重试
        if (errorType === 'auth_error' || errorType === 'invalid_request') {
          console.error(`[DebateEngine] 致命错误，不重试: ${errorType}`);
          break;
        }

        // 如果还有重试机会，等待一段时间再试
        if (attempt < maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000); // 指数退避，最大5秒
          console.log(`[DebateEngine] ⏳ 等待 ${waitTime}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // 所有重试都失败了
    const errorMessage = `[AI调用失败] ${lastError?.message || '未知错误'} (已重试${maxRetries}次)`;
    console.error(`\n💥 [DebateEngine] API 调用最终失败!`);
    console.error(`[DebateEngine] ${errorMessage}`);

    // 🔥 新增：通知前端最终失败
    this.emit('debate:error', {
      type: 'api_call_failed',
      message: errorMessage,
      originalError: lastError?.message,
      suggestions: this.getErrorSuggestions(lastError),
      timestamp: new Date().toISOString(),
    });

    return errorMessage;
  }

  /**
   * 🔥 新增：错误分类器
   * 帮助识别错误类型，决定是否需要重试
   */
  classifyError(error) {
    const message = (error.message || '').toLowerCase();

    if (error.name === 'AbortError' || message.includes('abort')) {
      return 'timeout';
    }
    if (message.includes('401') || message.includes('403') || message.includes('authentication') || message.includes('api key')) {
      return 'auth_error';
    }
    if (message.includes('400') || message.includes('invalid')) {
      return 'invalid_request';
    }
    if (message.includes('429') || message.includes('rate limit')) {
      return 'rate_limit';
    }
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return 'server_error';
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('econnrefused') || message.includes('enotfound')) {
      return 'network_error';
    }

    return 'unknown';
  }

  /**
   * 🔥 新增：根据错误类型提供建议
   */
  getErrorSuggestions(error) {
    const errorType = this.classifyError(error);

    const suggestions = {
      timeout: [
        'AI 服务响应超时',
        '建议：检查网络连接是否正常',
        '建议：稍后重试或简化讨论话题',
      ],
      auth_error: [
        'API 密钥无效或已过期',
        '建议：检查 .env 文件中的 DEEPSEEK_API_KEY 配置',
        '建议：到 DeepSeek 控制台重新生成密钥',
      ],
      rate_limit: [
        'API 调用频率超限',
        '建议：等待几秒后重试',
        '建议：考虑升级 API 套餐',
      ],
      network_error: [
        '网络连接失败',
        '建议：检查网络连接和代理设置',
        '建议：确认可以访问 api.deepseek.com',
      ],
      server_error: [
        'AI 服务暂时不可用',
        '建议：稍后重试',
      ],
    };

    return suggestions[errorType] || ['未知错误，请查看日志'];
  }

  getRole(roleType) {
    if (!roleType) return undefined;
    
    const normalizedType = String(roleType || '').toLowerCase().trim();
    
    let role = this.roles.find(r => {
      const rt = (r.roleType || '').toString().toLowerCase().trim();
      return rt === normalizedType;
    });
    
    if (!role) {
      const aliasMap = {
        'proposer': ['pro-side', 'proposer', 'proposal', 'positive', '正方', '提案者', '支持方'],
        'reviewer': ['con-side', 'reviewer', 'review', 'opponent', 'negative', '反方', '审查者', '质疑方', 'con'],
        'host': ['host', 'moderator', '主持人', 'mod', '裁判', 'judge'],
      };
      
      for (const [canonical, aliases] of Object.entries(aliasMap)) {
        if (aliases.includes(normalizedType) || canonical === normalizedType) {
          role = this.roles.find(r => {
            const rt = (r.roleType || '').toString().toLowerCase().trim();
            return aliases.includes(rt) || rt === canonical;
          });
          if (role) {
            console.log(`[DebateEngine] 角色映射: ${normalizedType} → ${role.roleType} (${role.name})`);
            break;
          }
        }
      }
    }
    
    return role;
  }

  /**
   * 🔥 V6.0 新增：根据输出深度获取指令模板（多层强化版）
   * 核心策略：通过提示词工程让AI自觉遵守字数约束，而非硬截断
   * @param {string} depth - 输出深度 ('brief' | 'normal' | 'detailed')
   * @returns {string} 深度指令字符串
   */
  getDepthInstruction(depth) {
    const depthConfigs = {
      brief: {
        id: 'brief',
        name: '简短讨论',
        minWords: 150,
        maxWords: 500,
        instruction: `【⚠️ 核心纪律 - 字数强制约束】

📏 目标字数：150-500字（绝对不可超过500字！）

🔴 违规后果说明：
- 如果你的回复超过500字，将被判定为"不合格输出"
- 用户需要的是简洁精炼的观点，不是长篇大论
- 超长=质量差=无法使用

✅ 正确做法：
① 用1-2句话直接表达核心观点（50-100字）
② 用2-3个要点支撑理由（每个要点30-60字）
③ 用1句话总结或补充（20-40字）
④ 总计控制在150-500字之间

❌ 错误做法：
- 长篇大论展开论述（超过600字直接判废）
- 反复解释同一个观点
- 堆砌大量案例和数据
- 使用"首先...其次...再次...最后...另外...此外..."的冗长结构

📝 字数自检清单（输出前必须执行）：
□ 总字数是否在150-500字之间？
□ 是否删除了所有冗余表述？
□ 每个观点是否只说了一次？
□ 是否去掉了"众所周知"、"显而易见"等废话？

💡 技巧：宁可少写不要多写，精炼比全面更重要！`,
      },
      normal: {
        id: 'normal',
        name: '深入讨论',
        minWords: 500,
        maxWords: 1000,
        instruction: `【⚠️ 核心纪律 - 字数强制约束】

📏 目标字数：500-1000字（绝对不可超过1000字！）

🔴 违规后果说明：
- 如果你的回复超过1000字，将被判定为"冗余输出"
- 这是一场辩论，不是写论文，需要高效表达
- 对手也在等待发言，占用过多时间是不专业的表现

✅ 正确做法（推荐结构）：
① 开门见山：核心观点+论点预览（80-120字）
② 论据支撑：2-3个核心论点，每个论点（120-180字）
③ 案例佐证：1个简短案例（80-120字）
④ 回应/延伸：针对可能的反驳或补充角度（80-120字）
⑤ 总结收尾：重申核心立场（40-60字）
⑥ 总计控制在500-1000字之间

❌ 绝对禁止：
- 单个论点展开超过250字（太啰嗦）
- 引用超过2个案例（太冗余）
- 使用5个以上的序号项（结构过于复杂）
- 大段引用数据或文献（这是辩论不是学术报告）

📊 字数分配参考表：
| 部分 | 建议字数 | 上限 |
|------|---------|------|
| 核心观点 | 80-120 | 150 |
| 论点1 | 120-180 | 220 |
| 论点2 | 120-180 | 220 |
| 案例 | 80-120 | 150 |
| 回应/补充 | 80-120 | 150 |
| 总结 | 40-60 | 80 |
| **总计** | **520-740** | **1000** |

🔄 自检流程（输出前必须执行）：
Step 1: 统计当前总字数
Step 2: 如果>1000字，立即删减最不重要的30%
Step 3: 再次检查，确保≤1000字
Step 4: 确认每个段落都有信息增量，无重复`,
      },
      detailed: {
        id: 'detailed',
        name: '详细研究',
        minWords: 1000,
        maxWords: 2000,
        instruction: `【⚠️ 核心纪律 - 字数强制约束】

📏 目标字数：1000-2000字（绝对不可超过2000字！）

🔴 违规后果说明：
- 如果你的回复超过2000字，将被判定为"失控输出"
- 即使是"详细研究"模式，也需要克制和精准
- 冗长≠深刻，简洁的力量往往更强

✅ 推荐结构（系统性分析框架）：
┌─────────────────────────────────────┐
│ 【引言】核心论点与论证路线图（100-150字）│
├─────────────────────────────────────┤
│ 【维度1】深度分析（300-400字）         │
│   - 核心论点                          │
│   - 数据/证据支撑                     │
│   - 逻辑推导                         │
├─────────────────────────────────────┤
│ 【维度2】对比/反驳视角（250-350字）     │
│   - 不同角度的考量                    │
│   - 可能的质疑及回应                  │
├─────────────────────────────────────┤
│ 【维度3】实践应用/案例（200-300字）    │
│   - 具体场景分析                     │
│   - 可操作性建议                     │
├─────────────────────────────────────┤
│ 【结论】总结与前瞻（100-150字）       │
│   - 核心发现回顾                     │
│   - 未来展望                         │
├─────────────────────────────────────┤
│ **目标总计：1000-2000字**            │
└─────────────────────────────────────┘

❌ 危险信号（出现以下情况立即停止并精简）：
⚠ 单个段落超过400字 → 太冗长，拆分或删减
⚠ 出现第5个一级标题 → 结构过于复杂
⚠ 连续3段都是纯理论阐述 → 缺乏实际内容
⚠ 引用超过3个不同来源的案例 → 信息过载
⚣ 总字数接近2000 → 立即进入"精简模式"

📝 "精简模式"操作指南：
当检测到字数超标时：
1. 删除所有修饰性形容词（"非常重要的"→"重要的"）
2. 合并相似论点（如果两个论点说的是同一件事）
3. 把长句改成短句（"由于...的原因导致了...的结果"→"...导致..."）
4. 删除可以推断出来的背景信息
5. 保留最核心的数据，删除次要数据

🎯 最终检验标准：
读完全文，问自己三个问题：
Q1: 如果删掉某一段，是否影响理解？→ 如果否，删掉它
Q2: 是否有哪个观点被重复说了2次以上？→ 合并成1次
Q3: 这篇文章的核心价值能否用一半的字数表达？→ 如果能，重写`,
      },
    };

    const config = depthConfigs[depth] || depthConfigs.normal;
    console.log(`[DebateEngine] 🎯 使用输出深度配置: ${config.name} (${config.minWords}-${config.maxWords}字) [V6.0多层强化版]`);
    return config.instruction;
  }

  /**
   * 🔥 V6.0 新增：字数合规性检测（温和版：仅记录，不截断）
   * 核心原则：不破坏内容完整性，但记录违规情况供后续优化
   * @param {string} content - 待检测的内容
   * @param {string} depth - 输出深度 ('brief' | 'normal' | 'detailed')
   */
  checkWordCountCompliance(content, depth) {
    if (!content) return;
    
    const wordCount = content.length;
    const depthConfigs = {
      brief: { min: 150, max: 500, name: '简短讨论' },
      normal: { min: 500, max: 1000, name: '深入讨论' },
      detailed: { min: 1000, max: 2000, name: '详细研究' },
    };
    
    const config = depthConfigs[depth] || depthConfigs.normal;
    const { min, max, name } = config;
    
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`[DebateEngine] 📊 字数合规性检测报告 [${name}模式]`);
    console.log(`[DebateEngine] 目标范围: ${min}-${max} 字`);
    console.log(`[DebateEngine] 实际字数: ${wordCount} 字`);
    
    if (wordCount < min) {
      console.warn(`[DebateEngine] ⚠️ 字数不足！实际(${wordCount}) < 最低要求(${min})，差 ${min - wordCount} 字`);
      console.warn(`[DebateEngine] 建议：内容可能过于简略，可适当补充论据或案例`);
    } else if (wordCount > max) {
      const excess = wordCount - max;
      const excessPercent = ((excess / max) * 100).toFixed(1);
      console.error(`[DebateEngine] 🔴 字数超标！实际(${wordCount}) > 上限(${max})，超出 ${excess} 字 (${excessPercent}%)`);
      console.error(`[DebateEngine] ⚠️ 警告：AI模型未严格遵守字数约束，建议优化提示词`);
      
      // 记录到违规统计（可用于后续分析）
      if (!this._wordCountViolations) {
        this._wordCountViolations = [];
      }
      this._wordCountViolations.push({
        timestamp: new Date().toISOString(),
        depth: depth,
        targetMax: max,
        actual: wordCount,
        excess: excess,
        excessPercent: parseFloat(excessPercent),
      });
      
      // 如果严重超标（超过上限的2倍），发出强烈警告
      if (wordCount > max * 2) {
        console.error(`[DebateEngine] 💥 严重超标！字数达到上限的 ${Math.round(wordCount/max * 100)}%`);
        console.error(`[DebateEngine] 可能原因：1) 提示词约束不够强 2) 模型对该话题有大量输出倾向 3) 需要调整max_tokens参数`);
      }
    } else {
      const usagePercent = ((wordCount / max) * 100).toFixed(1);
      console.log(`[DebateEngine] ✅ 字数合规！使用率: ${usagePercent}% (${wordCount}/${max})`);
    }
    
    console.log(`${'═'.repeat(50)}\n`);
  }

  /**
   * 🔥 新增：获取字数违规统计（用于调试和分析）
   */
  getWordCountViolationStats() {
    if (!this._wordCountViolations || this._wordCountViolations.length === 0) {
      return { totalViolations: 0, message: '无字数违规记录' };
    }
    
    return {
      totalViolations: this._wordCountViolations.length,
      violations: this._wordCountViolations,
      avgExcessPercent: this._wordCountViolations.reduce((sum, v) => sum + v.excessPercent, 0) / this._wordCountViolations.length,
      maxExcessPercent: Math.max(...this._wordCountViolations.map(v => v.excessPercent)),
    };
  }

  getCurrentPhaseKeyQuestions() {
    const phase = this.phases[this.currentPhase];
    return phase.keyQuestions || [];
  }

  getAnsweredQuestions() {
    // 从消息中提取已回答的问题
    return [];
  }

  getRecentMessages(count) {
    return this.messages.slice(-count);
  }

  getRecentPositions(count) {
    const proposals = this.messages.filter(m => m.type === MESSAGE_TYPES.PROPOSAL);
    return proposals.slice(-count).map(p => p.position);
  }

  arePositionsStable(positions) {
    if (positions.length < 2) return false;
    // 检查最近两个立场是否实质相同
    return JSON.stringify(positions[positions.length - 1]) === 
           JSON.stringify(positions[positions.length - 2]);
  }

  getPhaseMessages(phaseId) {
    return this.messages.filter(m => m.phase === phaseId);
  }

  extractCommitments(messages) {
    // 从消息中提取承诺
    const commitments = [];
    messages.forEach(msg => {
      if (msg.commitments) {
        commitments.push(...msg.commitments);
      }
    });
    return commitments;
  }

  generateFinalReport() {
    return {
      topic: this.topic,
      phases: this.consensus.map(c => ({
        phase: c.phase,
        summary: c.summary,
        commitments: c.commitments,
      })),
      coreCommitments: this.commitments,
      totalRounds: this.currentRound,
    };
  }

  // ===== Prompt 构建方法（V2.0 专业级版本） =====

  /**
   * 🔥 V2.0: 专业级提案者提示词
   * 引入Toulmin论证模型 + 多类型论据要求 + 质量自查机制
   */
  buildProposerPrompt(context) {
    const soulHint = context.soul ? `\n\n【你的角色设定】\n${context.soul}\n请严格遵循上述角色设定，包括其专业背景、思维方式和表达风格。` : '';

    return `你是一位专业的辩论选手，正在参与一场关于"${context.topic}"的结构化辩论。

${soulHint}

## 当前阶段：${context.phaseName}（第${context.round}轮）

## 你的任务
请针对本阶段的核心问题，提出一个**结构化、有深度的论证方案**。

## 论证框架要求（必须遵循Toulmin论证模型）

### 1. 主张（CLAIM）
- 用一句话明确你的核心观点
- 必须具有争议性，不能是显而易见的真理

### 2. 数据/证据（DATA/EVIDENCE）
- 提供**至少2类**不同类型的论据：
  a) 【事实型】统计数据、研究结果、历史先例
  b) 【权威型】专家观点、行业报告、法律法规
  c) 【案例型】真实案例、类比案例、思想实验
  d) 【理论型】理论原理、逻辑推演
- **禁止**使用"众所周知"、"显然"、"大家都认为"等空洞表述
- 如不确定的数据，用"据估计/约"并说明来源或标注"[待验证]"

### 3. 保证（WARRANT）
- 解释为什么你的证据能够支持你的主张
- 建立证据→结论的逻辑桥梁
- 可以引用公认的推理原则或因果规律

### 4. 支撑（BACKING）
- 为你的保证提供进一步的理论或事实支撑
- 可以引用公认的原理、学术共识或权威来源

### 5. 反驳预留（REBUTTAL）
- 主动预见可能的反对意见（至少2个）
- 说明为何这些反对意见不成立或仅在一定条件下成立
- 展示你对反面观点的理解深度

## 输出格式要求（严格遵守）

\`\`\`
## 我的立场：[一句话核心主张]

### 核心论点1：[论点标题]
- **论点陈述**：[2-3句话展开这个分论点]
- **论据类型**：[事实/权威/案例/理论]
- **具体证据**：
  • [证据1详细内容，至少80字，包含具体数字/名称/来源]
  • [证据2详细内容...]
- **逻辑链条**：因为[证据] → 所以[中间结论] → 最终支持[本论点] → 从而强化[核心主张]

### 核心论点2：[论点标题]
[同上结构，确保至少2个核心论点]

### 核心论点3（可选）：[补充论点标题]
[如果需要第三个角度来增强论证]

### 我的关键承诺（可验证的行动项）
1. [具体的、可被后续检验的承诺1]
2. [承诺2]

### 预见反驳及应对策略
- **可能的反对1**：[描述反对者可能提出的质疑]
  - **我的回应**：[解释为何此反对不成立或不完全成立]
- **可能的反对2**：[另一个潜在质疑]
  - **我的回应**：[应对方案]
\`\`\`

## 质量自查清单（输出前必须确认）
- [ ] 我的论点是否直接回答了本阶段的核心问题？
- [ ] 每个核心论点是否有至少一个具体、可查证的证据？
- [ ] 是否避免了稻草人谬误（即没有歪曲对方可能的观点）？
- [ ] 承诺是否具体到可以被独立验证？
- [ ] 是否考虑了至少2个反面观点并给出了应对？

## 上下文信息
${JSON.stringify({
    topic: context.topic,
    phase: context.phase,
    phaseName: context.phaseName,
    round: context.round,
    previousMessages: (context.previousMessages || []).slice(-2),
    lastReviewFeedback: context.lastReviewFeedback || '这是第一轮，无历史反馈',
    keyQuestions: context.keyQuestions || [],
    existingCommitments: context.commitments || [],
}, null, 2)}

现在，请严格按照上述框架和格式，输出你在这个阶段的完整专业级论证方案。`;
  }

  /**
   * 🔥 V2.0: 专业级审查者提示词
   * 引入四步审查法 + 谬误检测清单 + 结构化Verdict输出
   */
  buildReviewerPrompt(context) {
    return `你是一位资深辩论评委和批判性思维专家，正在审查一份关于"${context.topic}"的论证方案。

## 审查对象（提案者的原始论证）
\`\`\`
${context.proposal ? context.proposal.substring(0, 2000) : '[待审查的提案内容]'}
${context.proposal && context.proposal.length > 2000 ? '\n... [内容过长，已截断显示]' : ''}
\`\`\`

## 你的审查任务（必须严格按以下四步执行）

### ⚠️ 第一步：理解重构（最重要的步骤 - 决定审查质量的关键）
在开始批评之前，先用你自己的话**准确概括**提案者的核心论点：
- 核心主张是什么？
- 提出了哪几个主要论点？
- 每个论点用了什么类型的证据？
- 整体论证结构是怎样的？

**如果你无法清晰重构，这本身就说明论证不够清晰，需要在"结构完整性"项扣分。**

### 🔍 第二步：逻辑漏洞检测（逐项检查以下两类问题）

#### A. 形式谬误检测（请检查是否存在，如果存在必须指出）
1. **稻草人谬误**（Straw Man）：是否歪曲或简化了对方/反方的观点后再攻击？
2. **滑坡谬误**（Slippery Slope）：是否过度推断因果链（A→B→C→D，但B→C的必然性存疑）？
3. **虚假两难**（False Dilemma）：是否只给出两个极端选项而忽略中间可能？
4. **循环论证**（Circular Reasoning）：结论是否隐藏在前提中？
5. **诉诸不当**（Appeal to ...）：
   - 诉诸情感（Appeal to Emotion）：用煽情代替推理
   - 诉诸权威（Appeal to Authority）：仅因某专家说就接受，不考察证据
   - 诉诸群众（Appeal to Popularity）："大家都这么认为"
   - 诉诸无知（Appeal to Ignorance）："没人证明它是错的"
6. **以偏概全**（Hasty Generalization）：样本不足或代表性不够就下普遍结论
7. **不当类比**（Faulty Analogy）：类比的两个对象在关键属性上差异过大
8. **合成谬误/分解谬误**：因为部分有属性就推断整体有（或反之）

#### B. 实质性问题
1. **论据不足**：关键断言缺乏任何具体证据支撑
2. **证据存疑**：
   - 引用的数据没有来源标注
   - 案例过于陈旧或不相关
   - "专家观点"未指明是谁、哪个领域
   - 统计数字看起来可疑（如精确到不合理的小数位）
3. **逻辑跳跃**：从证据到结论之间缺少必要的推导环节
4. **遗漏反面**：故意或无意忽略了明显的不利证据或反对观点
5. **概念模糊**：关键词定义不清导致歧义（如"人工智能"到底指什么？）
6. **可行性问题**：方案在现实层面难以实施（成本/技术/伦理/法律障碍）
7. **自相矛盾**：不同论点之间存在逻辑冲突

### 💡 第三步：建设性反驳
对于每一个发现的问题（尤其是严重程度为"致命"或"严重"的），请提供：

| 项目 | 内容要求 |
|------|---------|
| **问题描述** | 具体引用原文中的哪句话/哪个段落有问题 |
| **严重程度** | 致命 / 严重 / 一般 / 轻微 |
| **为什么是问题** | 用2-3句话解释逻辑缺陷或事实错误 |
| **反驳论证** | 给出具体的反例、数据或理由说明为何这是错的 |
| **改进建议** | 提案者应该如何修正这个问题（给出可操作的步骤） |

### 📊 第四步：整体评价（Verdict判定 - 必须量化）

根据以下标准打分并给出最终评判：

**评分维度（每项10分，满分50分）：**

| 维度 | 权重 | 评分标准 |
|------|------|---------|
| **论证结构** (20%) |  | 10分=Toulmin模型完整；7分=基本完整但有缺漏；4分=结构松散；1分=无结构 |
| **论据质量** (25%) |  | 10分=多类型权威来源；7分=有真实来源但不多样；4分=仅有主观陈述；1分=无依据 |
| **逻辑严密性** (30%) |  | 10分=无明显漏洞；7分=有小瑕疵；4分=有明显谬误；1分=多处矛盾 |
| **反驳准备** (15%) |  | 10分=主动考虑多角度；7分=有少量预留；4分=完全未考虑；1分=无视反面 |
| **表达专业性** (10%) |  | 10分=精准流畅；7分=通顺易懂；4分=晦涩冗余；1分=不知所云 |

**Verdict判定标准：**

| 总分 | Verdict | 含义 |
|------|---------|------|
| **43-50** | **STRONG_APPROVE** | 优秀论证，可直接采纳 |
| **35-42** | **APPROVE** | 良好论证，小幅修改后可用 |
| **25-34** | **NEEDS_WORK** | 有价值但需重大修订 |
| **0-24** | **REJECT** | 存在根本性问题，建议推翻重来 |

## 输出格式（严格遵守）

\`\`\`
## 🎯 审查总评卡

| 维度 | 得分 | 简评 |
|------|------|------|
| 论证结构 | X/10 | [一句话] |
| 论据质量 | X/10 | [一句话] |
| 逻辑严密性 | X/10 | [一句话] |
| 反驳准备 | X/10 | [一句话] |
| 表达专业 | X/10 | [一句话] |
| **总分** | **XX/50** | |
| **Verdict** | **[STRONG_APPROVE / APPROVE / NEEDS_WORK / REJECT]** | |
| **一句话总结** | [20字以内的整体评价] | |

## 📝 第一步：论证重构
[你的重构内容，100-200字]

## 🔍 第二步：问题清单

### 致命问题（如有）
#### 问题N：[问题类型] - [严重程度]
- **原文引用**："[直接复制提案者的原话]"
- **问题分析**：[解释]
- **反驳论证**：[你的反驳]
- **改进建议**：[建议]

### 严重问题（如有）
[同上格式...]

### 一般问题（如有）
[同上格式...]

### 轻微问题（如有）
[同上格式...]

*(如果没有某个级别的问题，写"本级别无问题")*

## 💡 第三步：建设性反馈

### 最关键的3个修改点（按优先级排序）
1. **[修改点1]**：[详细描述]
2. **[修改点2]**：[详细描述]
3. **[修改点3]**：[详细描述]

### 修改后的预期效果
[如果提案者按照上述建议修改，预期可以达到什么水平]
\`\`\`

## ⚖️ 审查原则（必须遵守）
1. **客观中立**：不要因为你个人认同或反对该主张而影响判断
2. **具体明确**：每一条批评都必须有**原文引用**作为依据，不要空对空
3. **建设性**：目标是帮助改进论证质量，而不是单纯否定或炫耀批判能力
4. **公平公正**：承认提案的优点和亮点（即使最终verdict是reject），也必须指出不足
5. **区分层级**：区分"致命缺陷"（使整个论证失效）和"轻微瑕疵"（不影响主旨）

## 参考上下文信息
- **当前阶段**：${context.phase} 第${context.round}轮
- **历史审查记录**：
${JSON.stringify((context.previousReviews || []).slice(-2), null, 2)}
- **本阶段关键问题**：
${JSON.stringify(context.keyQuestions || [], null, 2)}

---
现在，请开始你专业的审查工作。记住：你的目标是通过严格的批判帮助提升论证质量，而不是为了批评而批评。`;
  }

  buildResolutionPrompt(backtrackResult) {
    return `发现跨阶段矛盾，需要解决：\n\n${JSON.stringify(backtrackResult, null, 2)}\n\n请提出解决方案，确保所有承诺保持一致。`;
  }

  /**
   * 🔥 新增：构建阶段探查 Prompt（修复缺失的方法）
   * 用于辩论开始前的阶段探查，生成关键问题和框架
   */
  buildProbePrompt(phase) {
    const keyQuestions = this.generateKeyQuestions(phase);
    const successCriteria = this.generateSuccessCriteria(phase);

    return `你现在处于**${phase.name}**阶段。

## 阶段描述
${phase.description}

## 核心目标
在这个阶段，我们需要明确：
${keyQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## 成功标准
${successCriteria.map((c, i) => `✅ ${c}`).join('\n')}

## 你的任务
作为主持人，请引导辩论双方：
1. 围绕上述核心问题展开深入讨论
2. 确保每个问题都得到充分的正反论证
3. 在阶段结束时达成共识

请以主持人的身份，输出本阶段的**开场引导词**和**讨论框架**。`;
  }

  generateKeyQuestions(phase) {
    const questionsMap = {
      probe: [
        '这个需求的核心用户价值是什么？',
        '需求覆盖的用户场景是否完整？',
        '有哪些潜在的边界条件？',
      ],
      design: [
        '技术方案的可行性如何？',
        '架构设计是否满足扩展性要求？',
        '有哪些技术风险需要关注？',
      ],
      impl: [
        '实现步骤是否合理？',
        '资源分配是否充足？',
        '里程碑设置是否现实？',
      ],
      validate: [
        '方案是否满足所有需求？',
        '测试策略是否完整？',
        '验收标准是否可衡量？',
      ],
    };
    return questionsMap[phase.id] || [];
  }

  generateSuccessCriteria(phase) {
    const criteriaMap = {
      probe: ['需求理解一致', '用户场景完整', '边界条件清晰'],
      design: ['技术方案可行', '架构设计合理', '风险评估完整'],
      impl: ['实现步骤清晰', '资源分配合理', '里程碑可达成'],
      validate: ['需求全部覆盖', '测试策略完整', '验收标准明确'],
    };
    return criteriaMap[phase.id] || [];
  }
}

// ===== ContextManager =====

class ContextManager {
  constructor(engine) {
    this.engine = engine;
  }

  getPhaseContext(phaseId) {
    // 获取阶段上下文
    const previousConsensus = this.engine.consensus.filter(c => c.phase !== phaseId);
    const previousCommitments = this.engine.commitments;
    
    return {
      topic: this.engine.topic,
      phase: phaseId,
      previousConsensus: previousConsensus.slice(-2),
      previousCommitments: previousCommitments.slice(-5),
      currentRound: this.engine.currentRound,
    };
  }

  getProposerContext() {
    const phase = this.engine.phases[this.engine.currentPhase];
    const phaseMessages = this.engine.getPhaseMessages(phase.id);
    const lastReview = phaseMessages.reverse().find(m => m.type === MESSAGE_TYPES.REVIEW);
    
    return {
      topic: this.engine.topic,
      phase: phase.id,
      phaseName: phase.name,
      round: this.engine.currentRound,
      previousMessages: phaseMessages.slice(-3),
      lastReviewFeedback: lastReview ? lastReview.content : null,
      keyQuestions: this.engine.getCurrentPhaseKeyQuestions(),
      commitments: this.engine.commitments,
    };
  }

  getReviewerContext(proposal) {
    return {
      topic: this.engine.topic,
      phase: this.engine.phases[this.engine.currentPhase].id,
      round: this.engine.currentRound,
      proposal: proposal.content,
      proposalCommitments: proposal.commitments || [],
      previousReviews: this.engine.messages
        .filter(m => m.type === MESSAGE_TYPES.REVIEW)
        .slice(-2),
      keyQuestions: this.engine.getCurrentPhaseKeyQuestions(),
    };
  }

  synthesizeRoundSummary(phaseId, roundNumber) {
    const phaseMessages = this.engine.getPhaseMessages(phaseId);
    const roundMessages = phaseMessages.filter(m => m.round === roundNumber);
    
    return {
      phase: phaseId,
      round: roundNumber,
      proposal: roundMessages.find(m => m.type === MESSAGE_TYPES.PROPOSAL)?.content,
      review: roundMessages.find(m => m.type === MESSAGE_TYPES.REVIEW)?.content,
      verdict: roundMessages.find(m => m.type === MESSAGE_TYPES.REVIEW)?.verdict,
    };
  }
}

// ===== BacktrackValidator =====

class BacktrackValidator {
  constructor(engine) {
    this.engine = engine;
    
    this.SEVERITY_LEVELS = {
      NONE: 0,
      WARNING: 1,
      SOFT_VIOLATION: 2,
      HARD_VIOLATION: 3,
      CRITICAL: 4,
    };
    
    this.CHECK_TYPES = {
      ALIGNMENT: 'alignment',
      SCOPE: 'scope',
      PRIORITY: 'priority',
      CONSISTENCY: 'consistency',
      FEASIBILITY: 'feasibility',
    };
  }

  async validate() {
    const commitments = this.engine.commitments;
    const newConsensus = this.engine.consensus[this.engine.consensus.length - 1];
    const previousConsensus = this.engine.consensus.slice(0, -1);
    
    const validationResult = {
      status: 'SUPPORTED',
      overallScore: 100,
      checks: [],
      violations: [],
      warnings: [],
      suggestions: [],
      timestamp: new Date().toISOString(),
      phase: newConsensus?.phase || this.engine.phases[this.engine.currentPhase]?.id,
      summary: '',
    };

    for (let i = 0; i < commitments.length; i++) {
      const commitment = commitments[i];
      const checkResult = await this.performFullCheck(
        commitment, 
        newConsensus, 
        previousConsensus,
        i
      );
      
      validationResult.checks.push(checkResult);
      
      if (checkResult.status === 'CONTRADICTED') {
        validationResult.status = 'CONTRADICTED';
        validationResult.violations.push(checkResult);
        validationResult.overallScore -= 25;
      } else if (checkResult.status === 'TENSION') {
        if (validationResult.status !== 'CONTRADICTED') {
          validationResult.status = 'TENSION';
        }
        validationResult.warnings.push(checkResult);
        validationResult.overallScore -= 10;
      }
    }

    // 检测跨阶段一致性
    const crossPhaseIssues = this.checkCrossPhaseConsistency(previousConsensus, newConsensus);
    validationResult.crossPhaseChecks = crossPhaseIssues;
    
    if (crossPhaseIssues.some(issue => issue.severity >= this.SEVERITY_LEVELS.HARD_VIOLATION)) {
      validationResult.overallScore -= 15;
    }

    // 生成摘要
    validationResult.summary = this.generateValidationSummary(validationResult);

    // 确保分数在合理范围内
    validationResult.overallScore = Math.max(0, Math.min(100, validationResult.overallScore));

    this.engine.backtrackResults.push(validationResult);
    return validationResult;
  }

  async performFullCheck(commitment, currentConsensus, previousConsensus, index) {
    const result = {
      id: `check-${Date.now()}-${index}`,
      commitment: commitment.text || commitment.content || String(commitment),
      originalCommitment: commitment,
      status: 'OK',
      score: 100,
      details: {},
      issues: [],
      timestamp: new Date().toISOString(),
    };

    // 1. 对齐检查
    const alignmentCheck = this.checkAlignment(commitment, currentConsensus);
    result.details.alignment = alignmentCheck;
    result.score -= alignmentCheck.penalty;

    // 2. 范围检查
    const scopeCheck = this.checkScope(commitment, currentConsensus);
    result.details.scope = scopeCheck;
    result.score -= scopeCheck.penalty;

    // 3. 优先级检查
    const priorityCheck = this.checkPriority(commitment, currentConsensus);
    result.details.priority = priorityCheck;
    result.score -= priorityCheck.penalty;

    // 4. 一致性检查（与历史共识）
    const consistencyCheck = this.checkConsistencyWithHistory(commitment, previousConsensus);
    result.details.consistency = consistencyCheck;
    result.score -= consistencyCheck.penalty;

    // 5. 可行性检查
    const feasibilityCheck = this.checkFeasibility(commitment, currentConsensus);
    result.details.feasibility = feasibilityCheck;
    result.score -= feasibilityCheck.penalty;

    // 收集所有问题
    result.issues = [
      ...alignmentCheck.issues,
      ...scopeCheck.issues,
      ...priorityCheck.issues,
      ...consistencyCheck.issues,
      ...feasibilityCheck.issues,
    ];

    // 确定最终状态
    if (result.issues.some(issue => issue.severity >= this.SEVERITY_LEVELS.HARD_VIOLATION)) {
      result.status = 'CONTRADICTED';
    } else if (result.issues.length > 0) {
      result.status = 'TENSION';
    } else {
      result.status = 'OK';
    }

    // 确保分数在合理范围内
    result.score = Math.max(0, Math.min(100, result.score));

    return result;
  }

  checkAlignment(commitment, consensus) {
    const check = {
      type: this.CHECK_TYPES.ALIGNMENT,
      status: 'PASS',
      penalty: 0,
      issues: [],
      details: {},
    };

    if (!consensus) {
      check.status = 'WARNING';
      check.penalty = 5;
      check.issues.push({
        code: 'NO_CONSENSUS',
        message: '无可用共识进行对齐检查',
        severity: this.SEVERITY_LEVELS.WARNING,
      });
      return check;
    }

    const commitmentText = this.normalizeText(commitment.text || commitment.content || '');
    const consensusText = this.normalizeText(consensus.summary || '');

    // 关键词匹配度
    const keywords = this.extractKeywords(commitmentText);
    check.details.keywords = keywords;
    check.details.matchedKeywords = [];

    let matchCount = 0;
    for (const keyword of keywords) {
      if (consensusText.includes(keyword.toLowerCase())) {
        matchCount++;
        check.details.matchedKeywords.push(keyword);
      }
    }

    check.details.keywordMatchRate = keywords.length > 0 ? matchCount / keywords.length : 0;

    // 语义相似度（简化版：基于共同词汇比例）
    const similarity = this.calculateSimilarity(commitmentText, consensusText);
    check.details.semanticSimilarity = similarity;

    if (similarity < 0.2) {
      check.status = 'FAIL';
      check.penalty = 20;
      check.issues.push({
        code: 'LOW_ALIGNMENT',
        message: `承诺与共识的对齐度过低 (${(similarity * 100).toFixed(1)}%)`,
        severity: this.SEVERITY_LEVELS.HARD_VIOLATION,
        suggestion: '建议重新审视该承诺与当前共识的关系',
      });
    } else if (similarity < 0.5) {
      check.status = 'WARNING';
      check.penalty = 8;
      check.issues.push({
        code: 'PARTIAL_ALIGNMENT',
        message: `承诺与共识部分对齐 (${(similarity * 100).toFixed(1)}%)`,
        severity: this.SEVERITY_LEVELS.SOFT_VIOLATION,
        suggestion: '建议明确说明该承诺如何支持当前决策',
      });
    } else if (check.details.keywordMatchRate < 0.5 && keywords.length > 2) {
      check.status = 'WARNING';
      check.penalty = 5;
      check.issues.push({
        code: 'KEYWORD_MISMATCH',
        message: `关键术语匹配率较低 (${(check.details.keywordMatchRate * 100).toFixed(1)}%)`,
        severity: this.SEVERITY_LEVELS.WARNING,
      });
    }

    return check;
  }

  checkScope(commitment, consensus) {
    const check = {
      type: this.CHECK_TYPES.SCOPE,
      status: 'PASS',
      penalty: 0,
      issues: [],
      details: {},
    };

    const commitmentText = this.normalizeText(commitment.text || commitment.content || '');
    
    // 检查承诺是否超出当前阶段范围
    const currentPhase = this.engine.phases[this.engine.currentPhase];
    const phaseContext = this.getPhaseScope(currentPhase);
    
    check.details.currentPhase = currentPhase?.id;
    check.details.phaseScope = phaseContext;

    // 检测承诺中是否有跨阶段引用
    const crossPhaseReferences = this.detectCrossPhaseReferences(commitmentText);
    check.details.crossPhaseReferences = crossPhaseReferences;

    if (crossPhaseReferences.length > 0) {
      check.status = 'INFO';
      check.details.hasCrossPhaseRef = true;
      
      // 验证跨阶段引用是否合理
      const invalidRefs = crossPhaseReferences.filter(ref => !this.isValidPhaseReference(ref));
      if (invalidRefs.length > 0) {
        check.status = 'WARNING';
        check.penalty = 5;
        check.issues.push({
          code: 'INVALID_CROSS_PHASE_REF',
          message: `发现无效的跨阶段引用: ${invalidRefs.join(', ')}`,
          severity: this.SEVERITY_LEVELS.WARNING,
          suggestion: '请确保跨阶段引用的内容已在相应阶段得到确认',
        });
      }
    }

    // 检查承诺是否过于宽泛或模糊
    if (this.isTooVague(commitmentText)) {
      check.status = 'WARNING';
      check.penalty = 3;
      check.issues.push({
        code: 'VAGUE_COMMITMENT',
        message: '承诺表述过于宽泛或模糊',
        severity: this.SEVERITY_LEVELS.WARNING,
        suggestion: '建议使用更具体、可衡量的表述',
      });
    }

    return check;
  }

  checkPriority(commitment, consensus) {
    const check = {
      type: this.CHECK_TYPES.PRIORITY,
      status: 'PASS',
      penalty: 0,
      issues: [],
      details: {},
    };

    const commitmentPriority = commitment.priority || 'MEDIUM';
    const currentPhase = this.engine.phases[this.engine.currentPhase];

    check.details.committedPriority = commitmentPriority;
    check.details.currentPhase = currentPhase?.id;

    // 根据阶段评估优先级合理性
    const priorityMap = {
      PROBE: { HIGH: 5, MEDIUM: 3, LOW: 1 },
      DESIGN: { HIGH: 4, MEDIUM: 3, LOW: 2 },
      IMPL: { HIGH: 3, MEDIUM: 4, LOW: 3 },
      VALIDATE: { HIGH: 2, MEDIUM: 3, LOW: 4 },
    };

    const expectedPriority = priorityMap[currentPhase?.id] || {};
    const priorityScore = expectedPriority[commitmentPriority] || 3;

    check.details.priorityScore = priorityScore;

    if (priorityScore <= 1) {
      check.status = 'WARNING';
      check.penalty = 5;
      check.issues.push({
        code: 'PRIORITY_MISMATCH',
        message: `承诺优先级 ${commitmentPriority} 与当前阶段 ${currentPhase?.name} 不太匹配`,
        severity: this.SEVERITY_LEVELS.WARNING,
        suggestion: `在此阶段建议关注${priorityScore <= 1 ? '其他' : '核心'}问题`,
      });
    }

    // 检查高优先级承诺是否得到充分讨论
    if (commitmentPriority === 'HIGH' && !this.isHighPriorityDiscussed(commitment)) {
      check.status = 'WARNING';
      check.penalty = 3;
      check.issues.push({
        code: 'HIGH_PRIORITY_UNDERDISCUSSED',
        message: '高优先级承诺似乎未得到充分讨论',
        severity: this.SEVERITY_LEVELS.WARNING,
      });
    }

    return check;
  }

  checkConsistencyWithHistory(commitment, previousConsensusList) {
    const check = {
      type: this.CHECK_TYPES.CONSISTENCY,
      status: 'PASS',
      penalty: 0,
      issues: [],
      details: {},
    };

    if (!previousConsensusList || previousConsensusList.length === 0) {
      check.details.message = '无历史共识可比较';
      return check;
    }

    const commitmentText = this.normalizeText(commitment.text || commitment.content || '');
    check.details.previousConsensusCount = previousConsensusList.length;

    // 与每个历史共识进行比较
    const contradictions = [];
    for (let i = 0; i < previousConsensusList.length; i++) {
      const prevConsensus = previousConsensusList[i];
      const prevText = this.normalizeText(prevConsensus.summary || '');
      
      const contradiction = this.detectContradiction(commitmentText, prevText);
      if (contradiction) {
        contradictions.push({
          phase: prevConsensus.phaseName || prevConsensus.phase,
          contradiction: contradiction,
          index: i,
        });
      }
    }

    check.details.contradictions = contradictions;

    if (contradictions.length > 0) {
      const hardContradictions = contradictions.filter(c => c.contradiction.severity >= this.SEVERITY_LEVELS.HARD_VIOLATION);
      
      if (hardContradictions.length > 0) {
        check.status = 'FAIL';
        check.penalty = 20;
        check.issues.push({
          code: 'HISTORICAL_CONTRADICTION',
          message: `发现 ${hardContradictions.length} 处与历史共识的硬性矛盾`,
          severity: this.SEVERITY_LEVELS.HARD_VIOLATION,
          details: hardContradictions,
          suggestion: '需要解决这些矛盾才能继续推进',
        });
      } else {
        check.status = 'WARNING';
        check.penalty = 8;
        check.issues.push({
          code: 'HISTORICAL_TENSION',
          message: `发现 ${contradictions.length} 处与历史共识的潜在张力`,
          severity: this.SEVERITY_LEVELS.SOFT_VIOLATION,
          details: contradictions,
          suggestion: '建议记录这些张力点，后续讨论中解决',
        });
      }
    }

    return check;
  }

  checkFeasibility(commitment, consensus) {
    const check = {
      type: this.CHECK_TYPES.FEASIBILITY,
      status: 'PASS',
      penalty: 0,
      issues: [],
      details: {},
    };

    const commitmentText = this.normalizeText(commitment.text || commitment.content || '');

    // 检测不切实际的承诺
    const unrealisticPatterns = [
      /无限/i,
      /绝对/i,
      /永远/i,
      /完美/i,
      /零(错误|缺陷|延迟)/i,
      /100%.*保证/i,
      /立即.*完成/i,
      /不需要.*资源/i,
    ];

    const detectedPatterns = [];
    for (const pattern of unrealisticPatterns) {
      if (pattern.test(commitmentText)) {
        detectedPatterns.push(pattern.source.replace(/\/i$/, ''));
      }
    }

    check.details.unrealisticPatterns = detectedPatterns;

    if (detectedPatterns.length > 0) {
      check.status = 'WARNING';
      check.penalty = 5 + detectedPatterns.length * 2;
      check.issues.push({
        code: 'FEASIBILITY_CONCERN',
        message: `承诺可能不够现实，检测到以下模式: ${detectedPatterns.join(', ')}`,
        severity: this.SEVERITY_LEVELS.WARNING,
        suggestion: '建议使用更务实、可衡量的表述',
      });
    }

    // 检查是否有时间/资源约束
    const hasTimeConstraint = /\d+\s*(天|周|月|小时)/i.test(commitmentText);
    const hasResourceConstraint = /(资源|预算|人力|成本)/i.test(commitmentText);
    
    check.details.hasTimeConstraint = hasTimeConstraint;
    check.details.hasResourceConstraint = hasResourceConstraint;

    if (!hasTimeConstraint && !hasResourceConstraint && commitmentText.length > 50) {
      check.status = 'INFO';
      check.issues.push({
        code: 'MISSING_CONSTRAINTS',
        message: '承诺缺少时间或资源约束说明',
        severity: this.SEVERITY_LEVELS.NONE,
        suggestion: '考虑添加具体的完成时间或所需资源',
      });
    }

    return check;
  }

  checkCrossPhaseConsistency(previousConsensusList, currentConsensus) {
    const issues = [];

    if (!previousConsensusList || previousConsensusList.length < 2) {
      return issues;
    }

    // 比较相邻阶段的共识
    for (let i = 1; i < previousConsensusList.length; i++) {
      const prev = previousConsensusList[i - 1];
      const curr = previousConsensusList[i];
      
      const prevText = this.normalizeText(prev.summary || '');
      const currText = this.normalizeText(curr.summary || '');

      const drift = this.detectSemanticDrift(prevText, currText);
      if (drift > 0.7) {
        issues.push({
          type: 'SEMANTIC_DRIFT',
          fromPhase: prev.phaseName || prev.phase,
          toPhase: curr.phaseName || curr.phase,
          drift: drift,
          severity: this.SEVERITY_LEVELS.SOFT_VIOLATION,
          message: `${prev.phaseName || prev.phase} → ${curr.phaseName || curr.phase} 存在较大语义偏移`,
        });
      }
    }

    // 检查承诺链的一致性
    const commitmentChains = this.analyzeCommitmentChains();
    issues.push(...commitmentChains);

    return issues;
  }

  analyzeCommitmentChains() {
    const chains = [];
    const commitmentsByPhase = {};

    // 按阶段分组承诺
    for (const commitment of this.engine.commitments) {
      const phase = commitment.phase || 'unknown';
      if (!commitmentsByPhase[phase]) {
        commitmentsByPhase[phase] = [];
      }
      commitmentsByPhase[phase].push(commitment);
    }

    // 分析各阶段承诺之间的关系
    const phases = Object.keys(commitmentsByPhase);
    for (let i = 1; i < phases.length; i++) {
      const prevPhase = phases[i - 1];
      const currPhase = phases[i];
      
      const prevCommitments = commitmentsByPhase[prevPhase];
      const currCommitments = commitmentsByPhase[currPhase];

      // 检查是否有被遗忘的重要承诺
      const forgotten = prevCommitments.filter(pc => {
        const pcText = this.normalizeText(pc.text || pc.content || '');
        return !currCommitments.some(cc => {
          const ccText = this.normalizeText(cc.text || cc.content || '');
          return this.calculateSimilarity(pcText, ccText) > 0.6;
        });
      });

      if (forgotten.length > 0) {
        chains.push({
          type: 'FORGOTTEN_COMMITMENT',
          fromPhase: prevPhase,
          toPhase: currPhase,
          forgottenCount: forgotten.length,
          forgotten: forgotten.map(f => f.text || f.content),
          severity: this.SEVERITY_LEVELS.WARNING,
          message: `${forgotten.length} 个来自 ${prevPhase} 的承诺在 ${currPhase} 中未被提及`,
        });
      }
    }

    return chains;
  }

  generateValidationSummary(result) {
    const parts = [];

    switch (result.status) {
      case 'SUPPORTED':
        parts.push('所有承诺通过回溯校验');
        break;
      case 'TENSION':
        parts.push(`发现 ${result.warnings.length} 处潜在问题`);
        break;
      case 'CONTRADICTED':
        parts.push(`发现 ${result.violations.length} 处严重矛盾`);
        break;
    }

    parts.push(`整体评分: ${result.overallScore}/100`);

    if (result.crossPhaseChecks && result.crossPhaseChecks.length > 0) {
      parts.push(`跨阶段检查: ${result.crossPhaseChecks.filter(c => c.severity >= this.SEVERITY_LEVELS.SOFT_VIOLATION).length} 个问题`);
    }

    return parts.join('；');
  }

  // 辅助方法

  normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // 🔥 V5.0 超级增强版：检测重复内容（6级检测体系）
  detectRepetition(newContent, lastContent) {
    if (!newContent || !lastContent) return false;

    const combined = lastContent.slice(-12) + newContent.slice(0, 12);

    // ========== Level 1: 字符级暴力重复（同一字符连续3次+） ==========
    const charCount = {};
    for (const char of combined) {
      charCount[char] = (charCount[char] || 0) + 1;
      if (charCount[char] >= 3) {
        console.log(`[BacktrackValidator] L1-字符重复检测: "${char}"连续${charCount[char]}次`);
        return true;
      }
    }

    // ========== Level 2: 短语模式重复（2-6字模式） ==========
    for (let len = 2; len <= Math.min(6, newContent.length); len++) {
      const lastPart = lastContent.slice(-8);
      const firstPart = newContent.slice(0, 8);
      
      for (let i = 0; i <= lastPart.length - len; i++) {
        const pattern = lastPart.slice(i, i + len);
        // 检查是否在新内容开头重复出现
        if (firstPart.includes(pattern) && pattern.length >= 2) {
          const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '{2,}');
          if (regex.test(firstPart)) {
            console.log(`[BacktrackValidator] L2-短语模式重复: "${pattern}"`);
            return true;
          }
        }
      }
    }

    // ========== Level 3: 中文叠词/冗余表达检测（增强版） ==========
    const redundantPatterns = [
      // 叠词副词
      /(?:非常|特别|十分|极其|相当|比较){2,}/,
      /(?:好好|常常|往往|刚刚|渐渐|慢慢|快快|频频|屡屡){2,}/,
      // 动词重复
      /(?:分析和|研究并|计划与|规划及|考虑和|讨论并){2,}/,
      // 虚词堆砌
      /(?:的{2,}|了{2,}|是{2,}|在{2,}|有{2,}|和{2,})/,
      // 程度副词+主题词重复
      /(?:重要|关键|核心|主要|基本|根本){2,}.*?(?:重要|关键|核心|主要|基本|根本)/,
      // 新增：常见AI生成冗余模式
      /(?:值得注意的是|需要指出的是|众所周知|显而易见|不言而喻){2,}/,
      /(?:首先.*?其次.*?最后).*?\1/,  // 结构化重复
      /(?:一方面.*?另一方面){2,}/,     // 对比结构重复
    ];

    for (const pattern of redundantPatterns) {
      if (pattern.test(combined)) {
        console.log(`[BacktrackValidator] L3-冗余模式匹配: ${pattern}`);
        return true;
      }
    }

    // ========== Level 4: 编辑距离/相似度检测（严格化） ==========
    if (newContent.length >= 4 && lastContent.length >= 4) {
      const similarity = this.calculateChunkSimilarity(
        lastContent.slice(-8),
        newContent.slice(0, 8)
      );
      
      // 🔥 V5.0 降低阈值：从0.85降至0.7
      if (similarity > 0.7) {
        console.log(`[BacktrackValidator] L4-相似度超标: ${(similarity * 100).toFixed(1)}% > 70%`);
        return true;
      }
    }

    // ========== Level 5: N-gram重叠检测（新增） ==========
    const ngramOverlap = this.checkNgramOverlap(lastContent.slice(-10), newContent.slice(0, 10), 3);
    if (ngramOverlap > 0.6) {
      console.log(`[BacktrackValidator] L5-Ngram重叠过高: ${(ngramOverlap * 100).toFixed(1)}%`);
      return true;
    }

    // ========== Level 6: 语义指纹检测（新增） ==========
    const lastFingerprint = this.generateTextFingerprint(lastContent.slice(-15));
    const newFingerprint = this.generateTextFingerprint(newContent.slice(0, 15));
    
    if (lastFingerprint === newFingerprint && lastFingerprint.length > 5) {
      console.log(`[BacktrackValidator] L6-语义指纹完全相同`);
      return true;
    }

    return false;
  }

  // 🔥 V5.0 新增：N-gram重叠度计算
  checkNgramOverlap(text1, text2, n = 3) {
    if (!text1 || !text2 || text1.length < n || text2.length < n) return 0;

    const getNgrams = (text) => {
      const ngrams = new Set();
      for (let i = 0; i <= text.length - n; i++) {
        ngrams.add(text.slice(i, i + n));
      }
      return ngrams;
    };

    const ngrams1 = getNgrams(text1);
    const ngrams2 = getNgrams(text2);

    const intersection = [...ngrams1].filter(x => ngrams2.has(x)).length;
    const union = new Set([...ngrams1, ...ngrams2]).size;

    return union > 0 ? intersection / union : 0;
  }

  // 🔥 V5.0 新增：生成文本指纹（用于快速语义去重）
  generateTextFingerprint(text) {
    if (!text) return '';
    
    // 提取关键特征：去除虚词、标点，保留实词的前几个字
    return text
      .replace(/[的了吗呢吧啊哈呀哦嘛呗，。！？、；：""''（）【】]/g, '')
      .replace(/\s+/g, '')
      .slice(0, 20)
      .toLowerCase();
  }

  // 🔥 新增：计算两个短文本的相似度
  calculateChunkSimilarity(a, b) {
    if (!a || !b) return 0;
    const setA = new Set(a.split(''));
    const setB = new Set(b.split(''));
    const intersection = [...setA].filter(x => setB.has(x)).length;
    const union = new Set([...setA, ...setB]).size;
    return union > 0 ? intersection / union : 0;
  }

  // 🔥 V5.0 超级增强版：后处理清理重复模式（7级清理体系）
  cleanDuplicatePatterns(text) {
    if (!text) return text;

    let result = text;
    let originalLength = result.length;

    // ========== Level 1: 字符级暴力去重 ==========
    // 连续重复超过2次的字符（如"的有有有" -> "的有"）
    result = result.replace(/(.)\1{2,}/g, '$1$1');

    // ========== Level 2: 词语级去重 ==========
    // 完全相同的词语连续重复2+次
    result = result.replace(/(\S{2,})\1{2,}/g, '$1');

    // ========== Level 3: 中文叠词/冗余表达优化（全面版） ==========
    
    // 副词重复："非常非常" -> "非常"
    result = result.replace(/(非常|特别|十分|极其|相当|比较|稍微|略微|格外|尤其)\1+/g, '$1');
    
    // 动词重叠："研究研究" -> "研究"（保留合法叠词如"好好"、"慢慢"）
    const verbRepeatPattern = /(研究|分析|讨论|考虑|计划|规划|设计|开发|测试|审查|评估|检查|实施|执行|制定|建立|构建|创建)\1/g;
    result = result.replace(verbRepeatPattern, '$1');
    
    // 虚词重复：多个"的"、"了"、"是"
    result = result.replace(/的{2,}/g, '的');
    result = result.replace(/了{2,}/g, '了');
    result = result.replace(/是{2,}/g, '是');
    result = result.replace(/在{2,}/g, '在');
    result = result.replace(/和{2,}/g, '和');
    result = result.replace(/与{2,}/g, '与');
    result = result.replace(/或{2,}/g, '或');

    // ========== Level 4: 语义冗余优化（智能合并） ==========
    
    // 近义动词并列冗余："分析和研究" -> "分析研究" 或 "分析"
    const verbRedundancyMap = [
      [ /分析和研究/g, '分析研究' ],
      [ /研究和分析/g, '系统研究' ],
      [ /计划和规划/g, '统筹规划' ],
      [ /规划和计划/g, '详细计划' ],
      [ /考虑和思考/g, '深入思考' ],
      [ /思考和考虑/g, '审慎考虑' ],
      [ /设计与实现/g, '设计实现' ],
      [ /制定和实施/g, '制定实施' ],
      [ /检查和验证/g, '检验验证' ],
      [ /测试和验证/g, '测试验证' ],
      [ /分析和评估/g, '分析评估' ],
      [ /讨论和交流/g, '研讨交流' ],
    ];
    
    verbRedundancyMap.forEach(([pattern, replacement]) => {
      result = result.replace(pattern, replacement);
    });

    // 主题词重复："核心的核心" -> "核心"
    result = result.replace(/(核心|关键|重要|主要|基本|根本|首要)(之\1|之\2)?\1/g, '$1');
    
    // 程度副词堆砌："非常十分重要" -> "十分重要"
    result = result.replace(/(非常|特别|十分|极其|相当)+(重要|关键|核心|主要|必要|紧迫)/g, '$2');

    // 新增：常见AI生成废话删除
    const fillerPhrases = [
      /众所周知，?/g,
      /显而易见，?/g,
      /不言而喻，?/g,
      /值得注意的是，?/g,
      /需要指出的是，?/g,
      /事实上，?/g,
      /实际上，?/g,
      /总的来说，?/g,
      /综上所述，?(?!以上)/g,  // 保留"综上所述以上"
    ];
    
    fillerPhrases.forEach(pattern => {
      result = result.replace(pattern, '');
    });

    // ========== Level 5: 句式规范化 ==========
    
    // 清理多余的空格和换行
    result = result.replace(/[ \t]+/g, ' ');
    result = result.replace(/\n{3,}/g, '\n\n');
    
    // 清理标点符号重复
    result = result.replace(/。{2,}/g, '。');
    result = result.replace(/，{2,}/g, '，');
    result = result.replace(/、{2,}/g, '、');
    result = result.replace(/…{2,}/g, '……');
    result = result.replace(/！！+/g, '！');
    result = result.replace(/？？+/g, '？');

    // ========== Level 6: 结构化重复清理（新增） ==========
    
    // 清理重复的过渡词："首先...首先..." -> "首先..."
    result = result.replace(/(首先)[^\n]*?\n\s*(首先)/g, '$1');
    result = result.replace(/(其次)[^\n]*?\n\s*(其次)/g, '$1');
    result = result.replace(/(最后)[^\n]*?\n\s*(最后)/g, '$1');
    
    // 清理重复的引用标记
    result = result.replace(/("[^"]+")[^"]*\1/g, '$1');

    // 🔥 BUG-003 FIX: 新增 - AI模型常见重复模式清理
    
    // 清理重复的总结性短语
    const summaryPatterns = [
      /(?:综上所述|总而言之|一言以蔽之|简而言之|概括来说)[^\n]*?\n\s*(?:综上所述|总而言之|一言以蔽之|简而言之|概括来说)/g,
      /(?:总之|故而|因此|所以)[^\n]*?\n\s*(?:总之|故而|因此|所以)/g,
    ];
    summaryPatterns.forEach(p => result = result.replace(p, '$1'));

    // 清理重复的序号词
    result = result.replace(/(?:第一|首先|其一)[^\n]*?\n\s*(?:第一|首先|其一)/g, '$1');
    result = result.replace(/(?:第二|其次|其二)[^\n]*?\n\s*(?:第二|其次|其二)/g, '$1');
    result = result.replace(/(?:第三|再次|其三)[^\n]*?\n\s*(?:第三|再次|其三)/g, '$1');

    // 清理重复的Markdown加粗标记：**text** **text** -> **text**
    result = result.replace(/(\*\*[^*]+\*\*)\s+\1+/g, '$1');

    // 清理重复的括号说明：（text）（text）->（text）
    result = result.replace(/（[^）]+）\s*（\1）/g, '（$1）');

    // ========== Level 7: 智能压缩（信息无损前提下的精简） ==========
    
    // 合并连续的短句（每句<15字且语义相似）
    const sentences = result.split(/(?<=[。！？])/);
    const compressedSentences = [];
    
    for (let i = 0; i < sentences.length; i++) {
      const current = sentences[i].trim();
      
      if (current.length < 10 && i > 0) {
        // 短句尝试与前一句合并
        const prev = compressedSentences[compressedSentences.length - 1];
        if (prev && prev.length < 30 && !prev.endsWith('。')) {
          compressedSentences[compressedSentences.length - 1] = prev + current;
          continue;
        }
      }
      
      if (current.length > 0) {
        compressedSentences.push(current);
      }
    }
    
    result = compressedSentences.join('');

    // 记录清理效果
    const cleanedChars = originalLength - result.length;
    if (cleanedChars > 0) {
      console.log(`[BacktrackValidator] 🧹 后处理清理: 去除 ${cleanedChars} 字符冗余 (${((cleanedChars/originalLength)*100).toFixed(1)}%)`);
    }

    return result.trim();
  }

  // 🔥 V3.0 新增：智能文本精炼器（最终输出前调用）
  refineOutputText(text) {
    if (!text || text.length < 20) return text;

    let result = this.cleanDuplicatePatterns(text);

    // 按句子分割，检测相邻句相似度
    const sentences = result.split(/(?<=[。！？\n])/).filter(s => s.trim().length > 5);
    const uniqueSentences = [];
    const seenPatterns = new Set();

    for (const sentence of sentences) {
      // 生成句子指纹（取关键词）
      const fingerprint = sentence
        .replace(/[的了吗呢吧啊哈呀哦]/g, '')
        .slice(0, 30)
        .trim();
      
      if (fingerprint && !seenPatterns.has(fingerprint)) {
        seenPatterns.add(fingerprint);
        uniqueSentences.push(sentence);
      }
      // 跳过高度相似的句子（简单实现）
    }

    // 如果去重后内容太短，返回原文本的基础清理版本
    if (uniqueSentences.join('').length < result.length * 0.6) {
      return result;
    }

    return uniqueSentences.join('');
  }

  extractKeywords(text) {
    const words = text.split(/\s+/)
      .filter(word => word.length > 1)
      .filter(word => !this.isStopWord(word));
    
    const uniqueWords = [...new Set(words)];
    return uniqueWords.slice(0, 10); // 返回最多10个关键词
  }

  isStopWord(word) {
    const stopWords = ['的', '了', '是', '在', '有', '和', '与', '或', '等', '及', '其', '这', '那', '将', '会', '可以', '应该', '需要', '进行', '通过'];
    return stopWords.includes(word.toLowerCase());
  }

  calculateSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const words1 = new Set(this.extractKeywords(text1));
    const words2 = new Set(this.extractKeywords(text2));
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
    const intersection = [...words1].filter(x => words2.has(x)).length;
    const union = new Set([...words1, ...words2]).size;
    
    return union > 0 ? intersection / union : 0;
  }

  getPhaseScope(phase) {
    const scopes = {
      probe: ['需求', '用户', '场景', '目标', '背景'],
      design: ['方案', '架构', '技术', '设计', '选型'],
      impl: ['实现', '步骤', '计划', '资源', '时间'],
      validate: ['验证', '测试', '验收', '标准', '指标'],
    };
    return scopes[phase?.id] || [];
  }

  detectCrossPhaseReferences(text) {
    const references = [];
    const patterns = [
      { pattern: /前面.*?阶段/g, ref: '前置阶段' },
      { pattern: /之前.*?讨论/g, ref: '历史讨论' },
      { pattern: /根据.*?需求/g, ref: '需求探查阶段' },
      { pattern: /按照.*?方案/g, ref: '方案设计阶段' },
    ];

    for (const { pattern, ref } of patterns) {
      if (pattern.test(text)) {
        references.push(ref);
      }
    }

    return references;
  }

  isValidPhaseReference(ref) {
    const validRefs = ['前置阶段', '历史讨论', '需求探查阶段', '方案设计阶段'];
    return validRefs.includes(ref);
  }

  isTooVague(text) {
    const vaguePatterns = [
      /^(一些|某些|适当|合理|必要|相关)$/i,
      /^(可能|也许|大概|大约|左右)$/i,
      /^(等|等等|之类|之类的)$/i,
    ];
    return vaguePatterns.some(p => p.test(text)) || text.length < 5;
  }

  detectContradiction(text1, text2) {
    const contradictionPairs = [
      { positive: /必须/i, negative: /不需要|不必|可以不做/i },
      { positive: /支持|采用|使用/i, negative: /反对|拒绝|放弃/i },
      { positive: /包含|包括|有/i, negative: /排除|不包括|没有/i },
      { positive: /重要|关键|核心/i, negative: /次要|不重要|可选/i },
      { positive: /增加|添加|扩展/i, negative: /减少|删除|精简/i },
    ];

    for (const pair of contradictionPairs) {
      if (pair.positive.test(text1) && pair.negative.test(text2)) {
        return {
          type: 'DIRECT_CONTRADICTION',
          severity: this.SEVERITY_LEVELS.HARD_VIOLATION,
          description: '直接矛盾',
        };
      }
      if (pair.negative.test(text1) && pair.positive.test(text2)) {
        return {
          type: 'REVERSE_CONTRADICTION',
          severity: this.SEVERITY_LEVELS.HARD_VIOLATION,
          description: '反向矛盾',
        };
      }
    }

    return null;
  }

  detectSemanticDrift(text1, text2) {
    return 1 - this.calculateSimilarity(text1, text2);
  }

  isHighPriorityDiscussed(commitment) {
    const relatedMessages = this.engine.messages.filter(m => {
      const mText = this.normalizeText(m.content || '');
      const cText = this.normalizeText(commitment.text || commitment.content || '');
      return this.calculateSimilarity(mText, cText) > 0.3;
    });
    return relatedMessages.length >= 2; // 至少有2条相关消息才算充分讨论
  }
}

module.exports = {
  DebateEngine,
  ContextManager,
  BacktrackValidator,
  PHASES,
  ROLES,
  MESSAGE_TYPES,
};
