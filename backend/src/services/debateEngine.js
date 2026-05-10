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
   * 生成Markdown格式的辩论记录
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
      
      // 轮次分隔
      if (msg.round !== undefined && msg.round !== currentRound) {
        currentRound = msg.round;
        lines.push(`### 🔄 第 ${currentRound + 1} 轮`);
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
    
    lines.push('*本报告由 DebateEngine 自动生成*');
    
    return lines.join('\n');
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
   * 开始指定轮次（V4.0：通用角色处理）
   * 支持所有辩论模式，不再局限于 proposer/reviewer
   */
  async startRound(roundNumber) {
    if (roundNumber > this.maxRounds) {
      // 达到最大轮次，尝试推进阶段
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
    
    // 🔥 V4.0 获取所有可用角色（排除 host）
    const activeRoles = this.getActiveRoles();
    
    console.log(`[DebateEngine] 🎭 第 ${roundNumber} 轮 - 可用角色:`, activeRoles.map(r => `${r.name}(${r.roleType})`));
    
    if (activeRoles.length === 0) {
      console.warn('[DebateEngine] ⚠️ 无可用角色，跳过本轮');
      return;
    }
    
    // 按顺序执行每个角色
    for (let i = 0; i < activeRoles.length; i++) {
      const role = activeRoles[i];
      
      // 构建上下文（根据角色位置决定）
      const context = this.buildRoleContext(role, i, activeRoles.length);
      
      // 执行该角色的发言
      await this.executeGenericRole(role, context);
    }
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
   * 🔥 V5.0 新增：构建通用提示词（含上下文记忆防重复）
   */
  buildGenericPrompt(role, context) {
    const { topic, currentPhase, currentRound, previousMessages, isFirstSpeaker } = context;
    
    let prompt = '';
    
    // 基础指令
    prompt += `【当前阶段】${currentPhase?.name || '讨论'}\n`;
    prompt += `【讨论主题】${topic}\n`;
    prompt += `【当前轮次】第 ${currentRound} 轮\n`;
    prompt += `【你的身份】${role.name}\n\n`;
    
    // 如果有历史消息，添加上下文（增强版：包含防重复提醒）
    if (previousMessages && previousMessages.length > 0) {
      prompt += `【之前的讨论】\n`;
      previousMessages.slice(-5).forEach((msg, idx) => {
        const contentPreview = msg.content.substring(0, 150);
        prompt += `${idx + 1}. ${msg.roleName || msg.role}: ${contentPreview}${msg.content.length > 150 ? '...' : ''}\n`;
      });
      
      // 🔥 V5.0 新增：提取已使用的关键论点，防止重复
      const usedPoints = this.extractKeyPointsFromMessages(previousMessages);
      if (usedPoints.length > 0) {
        prompt += `\n⚠️ 【已论述的观点（请勿重复）】：\n`;
        usedPoints.slice(-8).forEach((point, idx) => {
          prompt += `- ${point}\n`;
        });
        prompt += `\n以上观点已被其他角色阐述过，请避免重复相同内容，可以从新的角度或更深层次展开。\n\n`;
      }
    }
    
    // 根据是否首位发言调整指令（含防重复约束）
    if (isFirstSpeaker) {
      prompt += `请作为${role.name}，针对"${topic}"这个话题，提出你的核心观点。\n`;
      prompt += `要求：\n- 观点明确、逻辑清晰\n- 内容充实、言之有物\n- 避免重复表达\n`;
    } else {
      prompt += `基于以上讨论，作为${role.name}，请继续补充你的观点或回应之前的发言。\n`;
      prompt += `要求：\n- 可以补充新角度、新论据\n- 可以对之前的观点进行延伸或质疑\n- 保持内容简洁、避免冗余\n`;
      prompt += `- ⚠️ 不要重复前面已经说过的观点和论据\n`;
      prompt += `- ⚠️ 使用不同的表达方式，避免"首先/其次/最后"的机械结构\n`;
    }
    
    // 输出深度控制
    const depthInstruction = this.outputDepth === 'brief' 
      ? '请用简洁的语言回答（200字左右）'
      : this.outputDepth === 'detailed'
        ? '请详细阐述你的观点（500-800字）'
        : '请给出完整深入的分析（800-1200字）';
    
    prompt += `\n${depthInstruction}`;
    
    return prompt;
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
    
    // 生成共识摘要
    const consensus = {
      phase: phase.id,
      phaseName: phase.name,
      round: this.currentRound,
      summary: '', // 实际应由 AI 生成
      commitments: newCommitments,
      timestamp: new Date().toISOString(),
    };
    
    this.consensus.push(consensus);
    this.emit('debate:consensus', consensus);
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

      // 🔥 逐块读取流式数据
      for await (const chunk of stream) {
        if (controller.signal.aborted) {
          console.log('[DebateEngine] 流式传输被用户取消');
          throw new Error('STREAM_CANCELLED');
        }

        let content = chunk.choices[0]?.delta?.content || '';

        // 🔥 新增：去重检测 - 如果当前块与上一块高度相似（重复字符过多），跳过
        if (content && lastChunkContent) {
          // 检查是否有重复模式（如"的有有"）
          const combined = lastChunkContent.slice(-10) + content.slice(0, 10);
          // 如果新内容开始与旧的结束有超过3个连续相同字符，可能是重复
          if (this.backtrackValidator.detectRepetition(content, lastChunkContent)) {
            console.log(`[DebateEngine] ⚠️ 检测到重复内容，跳过: "${content.slice(0, 20)}..."`);
            lastChunkContent = content.slice(-10);  // 更新最后内容
            continue;
          }
        }

        if (content) {
          lastChunkContent = content.slice(-10);  // 保留最后10个字符用于下次比较
          fullContent += content;
          chunkCount++;

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

      // 🔥 V9.0 极简修复：跳过所有后处理清理，保留 AI 原始输出
      // 原则：程序可用性优先，不要复杂逻辑导致内容丢失

      clearTimeout(timeoutId);
      this._currentAbortController = null;

      console.log(`\n✅ [DebateEngine] 流式输出完成!`);
      console.log(`[DebateEngine] 总块数: ${chunkCount}`);
      console.log(`[DebateEngine] 最终长度: ${fullContent.length} 字符`);

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
    
    const normalizedType = roleType.toLowerCase().trim();
    
    let role = this.roles.find(r => {
      const rt = (r.roleType || '').toLowerCase().trim();
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
            const rt = (r.roleType || '').toLowerCase().trim();
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
   * 🔥 新增：根据输出深度获取指令模板
   * @param {string} depth - 输出深度 ('brief' | 'normal' | 'detailed')
   * @returns {string} 深度指令字符串
   */
  getDepthInstruction(depth) {
    const depthConfigs = {
      brief: {
        id: 'brief',
        name: '简短讨论',
        instruction: `请用简洁的语言回答，控制在50-150字以内。
要求：
- 一句话表达核心观点
- 可以有一个补充说明
- 不展开详细论证
- 直击要害，不废话

⚠️ 【严格防重复约束】
1. 禁止使用"非常非常"、"特别特别"等叠词副词
2. 同一词语在50字内不得重复出现2次以上
3. 禁止"分析和研究"、"计划和规划"等近义冗余表达
4. 每个观点只说一次，不要反复强调
5. 使用多样化的句式，避免"首先...其次...最后"的机械结构`,
      },
      normal: {
        id: 'normal',
        name: '深入讨论',
        instruction: `请用适中的长度回答，控制在200-500字以内。
要求：
- 清晰表达核心观点
- 给出支撑理由（2-3个要点）
- 可以有一个简短案例
- 逻辑清晰，层次分明

⚠️ 【严格防重复约束 - V5.0增强版】
🚫 绝对禁止的重复模式：
1. **字符级**：连续3个相同字符（如"的有有有"）
2. **词语级**：同一实词（名词/动词/形容词）在100字内最多出现2次
3. **短语级**：禁止"非常重要"、"十分关键"、"极其核心"等程度副词堆砌
4. **句式级**：相邻两句不能使用相同的主语开头
5. **段落级**：每个论点只阐述一次，不要换种说法重复

✅ 推荐的多样化表达：
- 用同义词替换："重要"→"关键/核心/主要/根本/至关重要"
- 变换句式："A是B"→"B体现了A"/"从A角度看..."
- 合并冗余："分析和研究"→"深入分析"或"系统研究"
- 删除废话：去掉"众所周知"、"显然"、"不言而喻"

🎯 质量标准：
- 信息密度高，无冗余表述
- 语言自然流畅，不像机器生成
- 逻辑递进，不原地踏步`,
      },
      detailed: {
        id: 'detailed',
        name: '详细研究',
        instruction: `请详细深入地回答，控制在800-2000字以内。
要求：
- 系统性地分析问题
- 多个维度的深度论证
- 引用数据和案例支撑
- 分析风险和不确定性
- 给出前瞻性思考
- 可以使用结构化表达

⚠️ 【严格防重复约束 - V5.0增强版】
📌 长文本特别注意事项：

🚫 **三级重复检测机制**：

**Level 1 - 微观（字符/词）**
- 禁止连续重复：好好、常常、往往等叠词（合法叠词除外）
- 虚词控制："的"字密度<8%，"了"字密度<5%
- 副词限制：每200字内"非常/特别/十分"总计≤1次

**Level 2 - 中观（句子/段落）**
- 句子指纹：相邻句子关键词重叠度<60%
- 论点唯一性：每个核心观点只完整阐述一次
- 引用规范：同一证据/案例只在最相关位置引用1次

**Level 3 - 宏观（篇章）**
- 结构避免：不要每段都用"首先/其次/最后"
- 主题词分散：核心术语在全文字频均匀分布，不要集中堆在某段
- 语义推进：每段都要有新信息增量，不要"换汤不换药"

✅ **高质量写作技巧**：
1. **同义词库**：
   - 重要：关键、核心、主要、根本、至关重要、举足轻重
   - 分析：剖析、探究、考察、审视、解读、研讨
   - 影响：作用、效应、效果、意义、价值、冲击
   
2. **句式变换矩阵**：
   - 主动句↔被动句
   - 长句↔短句结合
   - 陈述句↔设问句/反问句
   - 正说↔反说（"之所以...是因为..." ↔ "如果不...就..."）

3. **信息增量原则**：
   - 每新的一段都必须提供前文未覆盖的信息
   - 如果发现要重复前面的内容，改为"如前所述（见第X点）"一笔带过

🎯 最终检验标准：
读完全文，如果感觉任何一段可以删除而不影响理解，那就是冗余，应该删掉。`,
      },
    };

    const config = depthConfigs[depth] || depthConfigs.normal;
    console.log(`[DebateEngine] 使用输出深度配置: ${config.name} (含V5.0防重复约束)`);
    return config.instruction;
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
