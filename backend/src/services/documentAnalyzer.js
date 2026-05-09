/**
 * PRD Document Analysis & Expert Role System
 * 文档分析引擎 + PRD 专家角色体系
 */

// ===== PRD 专家角色预设库 =====
const PRD_EXPERT_ROLES = [
  {
    id: 'product-manager',
    name: '产品经理专家',
    model: 'deepseek-v4-flash',
    soul: '你是一位资深产品经理专家，拥有15年互联网产品经验，主导过200+产品需求的分析与评审。你的思维方式是系统性的，善于从用户价值、商业目标、技术可行性三个维度拆解需求。你会：1）首先确认需求的核心用户价值，质疑不产生价值的伪需求；2）分析需求覆盖的用户场景是否完整，识别遗漏的边界场景；3）评估功能优先级，区分Must-have/Should-have/Nice-to-have；4）关注用户体验的一致性，确保新功能与现有产品体验融合；5）提出需求文档中缺失的信息，如数据指标定义、成功标准、灰度策略等。你的沟通风格是：直击要害、数据驱动、但不缺乏同理心。你会用"这个需求的用户价值在哪里？"、"如果资源有限只能做一个功能，哪个是核心？"、"成功标准是什么？"这类问题来引导讨论。',
    roleType: 'expert-product',
    focus: '需求完整性、用户价值、功能优先级、产品定位',
    perspective: '从用户和商业角度审视PRD文档的完整性和可行性',
    triggers: ['需求分析', '功能模块', '用户故事', '产品定位', '优先级', '用户场景'],
  },
  {
    id: 'ui-ux-designer',
    name: 'UI/UX设计专家',
    model: 'minimax',
    soul: '你是一位UI/UX设计专家，专注于用户界面设计和交互体验优化。你拥有敏锐的用户同理心，总能从用户操作的第一视角审视产品。你的分析框架是"认知负荷最小化"——让用户在完成任务时付出最少的脑力。你会：1）审视PRD中的界面描述是否考虑了用户心智模型；2）提出交互流程优化建议，减少用户操作步骤；3）关注无障碍设计，确保产品对残障用户友好；4）评估信息架构的合理性，确保用户能快速找到所需信息；5）提出视觉设计建议，确保界面美观且符合品牌调性。你的沟通风格是：以用户为中心，善于用具体场景描述问题。你会用"用户在这个场景下会怎么想？"、"这个流程能不能再减少一步？"、"新用户第一次使用能理解吗？"这类问题来引导讨论。',
    roleType: 'expert-design',
    focus: '交互流程、界面布局、用户痛点、无障碍设计、视觉体验',
    perspective: '从用户体验角度审视PRD文档的界面和交互设计',
    triggers: ['界面', '交互', '体验', '用户流程', '易用性', '无障碍'],
  },
  {
    id: 'tech-architect',
    name: '技术架构专家',
    model: 'deepseek-v4-flash',
    soul: '你是一位技术架构专家，拥有全栈开发经验，精通分布式系统设计和微服务架构。你的思维方式是"防御性设计"——总是考虑最坏情况和边界条件。你会：1）评估PRD中描述的功能在技术上的可行性；2）识别潜在的技术风险，如性能瓶颈、数据一致性、扩展性问题；3）提出技术架构建议，包括服务拆分、数据存储、缓存策略；4）关注非功能性需求，如性能指标（响应时间、并发量）、安全要求、监控方案；5）评估第三方依赖的风险，提出替代方案。你的沟通风格是：务实严谨，善于用具体数据说明问题。你会用"这个功能预期的QPS是多少？"、"数据量增长10倍后系统还能正常工作吗？"、"如果第三方API挂了怎么办？"这类问题来引导讨论。',
    roleType: 'expert-tech',
    focus: '技术可行性、架构设计、性能风险、扩展性、安全',
    perspective: '从技术实现角度审视PRD文档的可行性和风险',
    triggers: ['技术', '性能', '架构', '扩展', '安全', '并发', '数据'],
  },
  {
    id: 'qa-specialist',
    name: '测试专家',
    model: 'deepseek-v4-flash',
    soul: '你是一位测试质量专家，拥有丰富的自动化测试和质量管理经验。你的思维方式是"破坏性思维"——总是寻找系统可能失败的场景。你会：1）从PRD文档中提取测试要点，构建测试用例框架；2）识别边界条件和异常场景，这些往往是bug高发区；3）评估验收标准的可测试性，确保每个需求都有明确的验证方法；4）关注数据迁移、兼容性、回归测试等容易被忽视的测试类型；5）提出质量风险评估，识别高风险功能模块。你的沟通风格是：批判性思维，善于发现漏洞。你会用"这个场景如果同时有100个用户操作会怎样？"、"网络超时了数据能恢复吗？"、"这个功能在iOS和Android上的表现一致吗？"这类问题来引导讨论。',
    roleType: 'expert-qa',
    focus: '测试覆盖率、边界场景、质量风险、验收标准可测试性',
    perspective: '从质量保障角度审视PRD文档的完整性和可测试性',
    triggers: ['测试', '边界', '异常', '质量', '验证', '风险', '兼容'],
  },
  {
    id: 'project-manager',
    name: '项目管理专家',
    model: 'deepseek-v4-flash',
    soul: '你是一位项目管理专家，擅长复杂项目的规划、资源分配和风险管理。你的思维方式是"全局统筹"——关注项目的全生命周期和各要素间的依赖关系。你会：1）从PRD中提取项目里程碑和关键路径；2）评估资源需求，识别资源瓶颈；3）提出风险预案，关注进度风险、技术风险、人员风险；4）建议迭代计划和发布策略；5）关注跨团队协调和外部依赖管理。你的沟通风格是：全局视野、务实、善于统筹协调。你会用"这个功能的开发周期大概多长？"、"哪些功能可以并行开发？"、"如果关键人员请假了怎么办？"、"有没有可以复用的现有模块？"这类问题来引导讨论。',
    roleType: 'expert-pm',
    focus: '里程碑规划、资源分配、风险预案、迭代计划、依赖管理',
    perspective: '从项目管理角度审视PRD文档的可执行性和资源需求',
    triggers: ['项目', '资源', '里程碑', '迭代', '计划', '依赖', '协调'],
  },
];

// ===== 文档分析引擎 =====

// PRD 文档特征关键词（中文）
const PRD_FEATURES_CN = {
  // 高权重特征（出现即强烈暗示是PRD）
  high: [
    '需求文档', '产品需求', 'PRD', '需求规格', '需求分析',
    '功能需求', '用户故事', '验收标准', '产品需求文档',
    '需求评审', '需求变更', '需求跟踪',
  ],
  // 中权重特征
  medium: [
    '需求', '功能', '模块', '接口', '优先级', '里程碑',
    '用例', '场景', '用户', '体验', '性能', '安全',
    '测试', '验收', '发布', '版本', '迭代',
    'Must-have', 'Should-have', 'Nice-to-have',
    '用户画像', '竞品分析', '数据指标', 'KPI',
  ],
  // 低权重特征
  low: [
    '设计', '开发', '测试', '部署', '架构', '数据库',
    '前端', '后端', 'API', '配置', '日志', '监控',
  ],
};

// PRD 结构特征（文档中应出现的章节）
const PRD_STRUCTURE_PATTERNS = [
  /第[一二三四五六七八九十]+章/,
  /第[一二三四五六七八九十]+节/,
  /^\d+\.\d+[\s、]/m,
  /^\d+[\s、.]/m,
  /需求编号/,
  /功能编号/,
  /版本号|Version/,
  /修订记录|修改历史/,
  /需求概述/,
  /功能描述/,
  /非功能性需求/,
  /验收标准/,
  /验收条件/,
];

/**
 * 分析文档类型
 * @param {string} fileName - 文件名
 * @param {string} content - 文档内容
 * @returns {{ type: string, confidence: number, features: Array, summary: string }}
 */
function analyzeDocument(fileName, content) {
  const lowerFileName = (fileName || '').toLowerCase();
  const fullContent = (content || '').toLowerCase();
  
  // 特征评分
  let score = 0;
  const detectedFeatures = [];
  
  // 检查高权重特征
  PRD_FEATURES_CN.high.forEach(keyword => {
    if (fullContent.includes(keyword.toLowerCase())) {
      score += 3;
      detectedFeatures.push(keyword);
    }
  });
  
  // 检查中权重特征
  PRD_FEATURES_CN.medium.forEach(keyword => {
    if (fullContent.includes(keyword.toLowerCase())) {
      score += 1;
      detectedFeatures.push(keyword);
    }
  });
  
  // 检查结构特征
  PRD_STRUCTURE_PATTERNS.forEach(pattern => {
    if (pattern.test(content)) {
      score += 2;
    }
  });
  
  // 文件名检查
  if (lowerFileName.includes('prd') || lowerFileName.includes('需求')) {
    score += 5;
  }
  
  // 计算置信度（归一化到 0-1）
  const maxPossibleScore = PRD_FEATURES_CN.high.length * 3 + PRD_FEATURES_CN.medium.length * 1 + PRD_STRUCTURE_PATTERNS.length * 2 + 5;
  const confidence = Math.min(score / (maxPossibleScore * 0.4), 0.98);
  
  // 生成摘要
  const summary = generateSummary(content);
  
  return {
    type: confidence >= 0.2 ? 'prd' : 'general',
    confidence: Math.max(confidence, 0.1),
    score,
    features: detectedFeatures.slice(0, 10),
    summary,
  };
}

/**
 * 生成文档摘要
 */
function generateSummary(content) {
  if (!content) return '';
  
  const lines = content.split('\n').filter(line => line.trim());
  const firstLines = lines.slice(0, 8);
  const summary = firstLines.join('\n').substring(0, 500);
  
  return summary + (content.length > 500 ? '\n...' : '');
}

/**
 * 根据文档分析结果，推荐合适的专家角色
 * @param {Object} analysis - 文档分析结果
 * @param {string} content - 文档完整内容
 * @returns {Array} 推荐的专家角色列表
 */
function recommendExperts(analysis, content) {
  if (analysis.type !== 'prd') {
    return []; // 非PRD文档不推荐专家
  }
  
  const lowerContent = (content || '').toLowerCase();
  const matchedExperts = [];
  
  PRD_EXPERT_ROLES.forEach(expert => {
    let matchScore = 0;
    
    expert.triggers.forEach(trigger => {
      if (lowerContent.includes(trigger)) {
        matchScore += 2;
      }
    });
    
    // 如果文档内容中匹配到专家关注点，则推荐该专家
    if (matchScore >= 2) {
      matchedExperts.push({
        ...expert,
        matchScore,
      });
    }
  });
  
  // 至少推荐产品经理专家
  if (matchedExperts.length === 0) {
    matchedExperts.push({
      ...PRD_EXPERT_ROLES[0],
      matchScore: 1,
    });
  }
  
  // 按匹配分数排序
  matchedExperts.sort((a, b) => b.matchScore - a.matchScore);
  
  return matchedExperts;
}

/**
 * 根据推荐的专家生成辩论配置
 */
function generateDebateConfig(analysis, recommendedExperts) {
  const roles = [
    // 主持人（固定）
    {
      id: 1,
      name: '主持人',
      model: 'deepseek-v4-flash',
      soul: '公正、严谨、逻辑清晰，善于引导讨论',
      soulPresetId: null,
      roleType: 'host',
    },
  ];
  
  // 添加推荐的专家角色
  recommendedExperts.forEach((expert, index) => {
    roles.push({
      id: index + 2,
      name: expert.name,
      model: expert.model,
      soul: expert.soul,
      soulPresetId: expert.id,
      roleType: expert.roleType,
      expertise: expert.focus,
    });
  });
  
  // 确保至少有提案者和审查者
  if (!roles.find(r => r.roleType === 'expert-product' || r.roleType === 'proposer')) {
    roles.push({
      id: roles.length + 1,
      name: '提案者',
      model: 'deepseek-v4-flash',
      soul: '积极、创新、善于提出方案',
      soulPresetId: null,
      roleType: 'proposer',
    });
  }
  
  if (!roles.find(r => r.roleType === 'expert-qa' || r.roleType === 'reviewer')) {
    roles.push({
      id: roles.length + 1,
      name: '审查者',
      model: 'deepseek-v4-flash',
      soul: '严谨、批判、善于发现问题',
      soulPresetId: null,
      roleType: 'reviewer',
    });
  }
  
  return {
    roles: roles.slice(0, 5), // 最多5个角色
    documentAnalysis: analysis,
    recommendedExperts: recommendedExperts,
  };
}

module.exports = {
  PRD_EXPERT_ROLES,
  analyzeDocument,
  recommendExperts,
  generateDebateConfig,
  generateSummary,
};
