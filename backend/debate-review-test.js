/**
 * 辩论内容生成与审查完整流程测试
 *
 * 功能：
 * 1. 调用辩论引擎生成内容
 * 2. 对生成内容进行全面审查
 * 3. 输出详细的审查报告和优化建议
 */

const { DebateEngine } = require('./src/services/debateEngine');

// 测试配置
const TEST_TOPIC = '人工智能是否能取代教师的工作？';

const TEST_CONFIG = {
  topic: TEST_TOPIC,
  roles: [
    {
      id: 1,
      name: '主持人',
      model: 'deepseek-v4-flash',
      soul: '你是一位专业的中立主持人，负责引导辩论方向，保持讨论的专业性和建设性。你的风格是理性、客观、善于引导。',
      roleType: 'host'
    },
    {
      id: 2,
      name: '提案者',
      model: 'deepseek-v4-flash',
      soul: '你是一位教育政策专家和AI技术倡导者，你支持在教育领域引入AI辅助教学。你的论证风格是数据驱动、逻辑严密、注重实际效果。',
      roleType: 'proposer'
    },
    {
      id: 3,
      name: '审查者',
      model: 'deepseek-v4-flash',
      soul: '你是一位批判性思维专家和伦理学者，你对AI在教育中的应用持审慎态度。你的审查风格是严格质疑、注重风险、强调伦理边界。',
      roleType: 'reviewer'
    }
  ],
  maxRounds: 1,  // 快速测试用1轮
  maxPhases: 1,  // 快速测试用1阶段
};

// 审查维度定义
const REVIEW_DIMENSIONS = [
  { key: 'themeRelevance', label: '主题相关性', weight: 0.20, desc: '内容是否紧扣主题，回应核心问题' },
  { key: 'logicalCoherence', label: '逻辑连贯性', weight: 0.25, desc: '论证链条是否完整，前后是否一致' },
  { key: 'informationAccuracy', label: '信息准确性', weight: 0.20, desc: '数据、事实、引用是否准确可信' },
  { key: 'languageFluency', label: '语言流畅度', weight: 0.15, desc: '表达是否清晰流畅，术语使用是否得当' },
  { key: 'formatCompliance', label: '格式规范性', weight: 0.10, desc: '是否符合输出格式要求，结构是否清晰' },
  { key: 'platformStandards', label: '平台契合度', weight: 0.10, desc: '是否符合平台内容标准，适合展示传播' },
];

/**
 * 评分转标签
 */
function scoreToLabel(score) {
  if (score >= 90) return '优秀';
  if (score >= 80) return '良好';
  if (score >= 70) return '合格';
  if (score >= 60) return '勉强';
  return '不合格';
}

/**
 * 审查单条消息
 */
function reviewMessage(message, index) {
  const issues = [];
  const suggestions = [];
  const content = message.content || '';
  const contentLower = content.toLowerCase();

  // 1. 主题相关性检查
  const topicKeywords = ['AI', '人工智能', '教学', '教育', '教师', '学生', '技术', '取代', '辅助'];
  const topicHits = topicKeywords.filter(kw => contentLower.includes(kw.toLowerCase()));
  let topicRelevance = topicHits.length >= 4 ? 90 : topicHits.length >= 2 ? 75 : 50;

  if (topicHits.length < 2) {
    issues.push(`[主题相关性] 消息 ${index + 1} 关键词不足：${topicHits.join(', ')}`);
    suggestions.push('增加与核心主题相关的关键词密度');
  }

  // 2. 逻辑连贯性检查
  const hasHeaders = /^#{1,3}\s/m.test(content);
  const hasLists = /^[-*]\s|^(\d+)\.\s/m.test(content);
  const hasTransitions = /(因此|所以|然而|但是|总之|综上)/.test(content);
  const hasStructure = hasHeaders || hasLists;
  let logicalScore = hasStructure ? 35 : 15;
  if (hasTransitions) logicalScore += 25;
  if (hasLists && hasHeaders) logicalScore += 25;
  if (content.length > 200) logicalScore += 15;

  if (!hasStructure) {
    issues.push(`[逻辑连贯性] 消息 ${index + 1} 缺少结构化组织`);
    suggestions.push('使用Markdown标题（##）和列表（-）组织论证结构');
  }

  // 3. 信息准确性检查
  const vaguePhrases = ['众所周知', '显然', '大家认为', '可能差不多', '大约似乎', '据说', '有人说'];
  const vagueCount = vaguePhrases.filter(p => content.includes(p)).length;
  const hasDataCitation = /\d+%|\d+倍|\d+年|研究表明|数据显示|根据.*报告/.test(content);
  const hasSourceReference = /UNESCO|世界银行|教育部|研究机构|专家/.test(content);
  let accuracyScore = 60;
  if (hasDataCitation) accuracyScore += 15;
  if (hasSourceReference) accuracyScore += 10;
  accuracyScore -= vagueCount * 8;

  if (vagueCount > 0) {
    issues.push(`[信息准确性] 消息 ${index + 1} 包含 ${vagueCount} 处模糊表述`);
    suggestions.push('将"众所周知"等改为具体的数据来源和机构名称');
  }

  // 4. 语言流畅度检查
  const excessivePunctuation = /[！？]{2,}/.test(content);
  const emojiCount = (content.match(/[📊💡🔍✅❌⚠️]/g) || []).length;
  let fluencyScore = excessivePunctuation ? 65 : (emojiCount > 8 ? 75 : 88);

  if (excessivePunctuation) {
    issues.push(`[语言流畅度] 消息 ${index + 1} 过度使用重复标点`);
    suggestions.push('减少！！！等连续标点的使用');
  }

  // 5. 格式规范性检查
  const hasTable = /\|.*\|.*\|/.test(content);
  const hasCodeBlock = /```/.test(content);
  const lineBreaks = content.split('\n').length;
  let formatScore = 40;
  if (hasTable) formatScore += 25;
  if (hasHeaders) formatScore += 20;
  if (lineBreaks > 10) formatScore += 15;

  // 6. 平台契合度检查
  const rolePatterns = {
    proposer: ['我的立场', '核心论点', '关键承诺', '数据', '优势', '支持', '方案'],
    reviewer: ['审查', '问题', '改进建议', '严重', '一般', 'Verdict', '评分', '评估'],
    host: ['主持', '引导', '阶段', '讨论', '总结']
  };
  const expectedRole = message.role;
  const roleKeywords = rolePatterns[expectedRole] || [];
  const roleHits = roleKeywords.filter(kw => contentLower.includes(kw));
  const platformScore = roleHits.length >= 2 ? 90 : roleHits.length >= 1 ? 75 : 55;

  if (roleHits.length < 1 && expectedRole !== 'host') {
    issues.push(`[平台契合度] 消息 ${index + 1} 与角色"${expectedRole}"特征不匹配`);
    suggestions.push(`增加${expectedRole}角色特有的表达模式`);
  }

  return {
    index,
    role: message.role,
    contentLength: content.length,
    topicKeywords: topicHits,
    scores: {
      themeRelevance: Math.min(100, topicRelevance),
      logicalCoherence: Math.min(100, logicalScore),
      informationAccuracy: Math.max(0, accuracyScore),
      languageFluency: fluencyScore,
      formatCompliance: Math.min(100, formatScore),
      platformStandards: platformScore,
    },
    issues,
    suggestions,
  };
}

/**
 * 计算综合评分
 */
function calculateOverallScore(reviewResults) {
  const dimensionScores = {};

  for (const dim of REVIEW_DIMENSIONS) {
    const scores = reviewResults.map(r => r.scores[dim.key] || 0);
    dimensionScores[dim.key] = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
  }

  let overall = 0;
  for (const dim of REVIEW_DIMENSIONS) {
    overall += dimensionScores[dim.key] * dim.weight;
  }

  return { dimensionScores, overall: Math.round(overall) };
}

/**
 * 生成完整的审查报告
 */
function generateReviewReport(messages, reviewResults, overallScore, elapsedTime) {
  const lines = [];

  lines.push('');
  lines.push('================================================================================');
  lines.push('                    辩论内容生成质量审查报告');
  lines.push('================================================================================');
  lines.push('');
  lines.push(`【测试信息】`);
  lines.push(`  主题：${TEST_TOPIC}`);
  lines.push(`  审查时间：${new Date().toLocaleString('zh-CN')}`);
  lines.push(`  生成耗时：${elapsedTime}秒`);
  lines.push(`  消息数量：${messages.length} 条`);
  lines.push('');

  lines.push('--------------------------------------------------------------------------------');
  lines.push('一、内容生成概况');
  lines.push('--------------------------------------------------------------------------------');

  const roleStats = {};
  messages.forEach(m => {
    const role = m.role || 'unknown';
    if (!roleStats[role]) roleStats[role] = { count: 0, totalLength: 0 };
    roleStats[role].count++;
    roleStats[role].totalLength += m.content?.length || 0;
  });

  for (const [role, stats] of Object.entries(roleStats)) {
    const roleLabel = role === 'proposer' ? '💡 提案者' : role === 'reviewer' ? '🔍 审查者' : role === 'host' ? '🎙️ 主持人' : role;
    const avgLen = stats.count > 0 ? Math.round(stats.totalLength / stats.count) : 0;
    lines.push(`  ${roleLabel}：${stats.count} 条消息，共 ${stats.totalLength} 字符，平均 ${avgLen} 字符/条`);
  }

  lines.push('');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('二、质量维度评分');
  lines.push('--------------------------------------------------------------------------------');

  for (const dim of REVIEW_DIMENSIONS) {
    const score = overallScore.dimensionScores[dim.key] || 0;
    const bar = '█'.repeat(Math.round(score / 5)) + '░'.repeat(20 - Math.round(score / 5));
    const label = scoreToLabel(score);
    lines.push(`  ${dim.label}：${bar} ${score.toFixed(1)}分 (${label})`);
    lines.push(`    → 权重:${(dim.weight * 100).toFixed(0)}% | ${dim.desc}`);
  }

  const overallBar = '█'.repeat(Math.round(overallScore.overall / 5)) + '░'.repeat(20 - Math.round(overallScore.overall / 5));
  lines.push('');
  lines.push(`  【综合评分】${overallBar} ${overallScore.overall}分 (${scoreToLabel(overallScore.overall)})`);

  lines.push('');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('三、问题汇总');
  lines.push('--------------------------------------------------------------------------------');

  const allIssues = reviewResults.flatMap(r => r.issues);
  const allSuggestions = [...new Set(reviewResults.flatMap(r => r.suggestions))];

  if (allIssues.length === 0) {
    lines.push('  ✅ 未发现明显问题');
  } else {
    allIssues.forEach((issue, i) => {
      lines.push(`  ${i + 1}. ${issue}`);
    });
  }

  lines.push('');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('四、优化建议');
  lines.push('--------------------------------------------------------------------------------');

  if (allSuggestions.length === 0) {
    lines.push('  ✅ 内容质量良好，无需强制优化');
  } else {
    allSuggestions.forEach((suggestion, i) => {
      lines.push(`  ${i + 1}. ${suggestion}`);
    });
  }

  lines.push('');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('五、内容质量等级');
  lines.push('--------------------------------------------------------------------------------');

  const grade = overallScore.overall >= 85 ? 'A' : overallScore.overall >= 75 ? 'B' : overallScore.overall >= 65 ? 'C' : 'D';
  const gradeDesc = {
    'A': '优秀 - 内容质量高，可以直接使用',
    'B': '良好 - 有小问题需要小幅修改',
    'C': '合格 - 有较大问题需要较大修改',
    'D': '不合格 - 需要重新生成或重大修改'
  };

  lines.push(`  评级：${grade} 级`);
  lines.push(`  说明：${gradeDesc[grade]}`);

  lines.push('');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('六、代表性内容摘录');
  lines.push('--------------------------------------------------------------------------------');

  messages.slice(0, 4).forEach((msg, i) => {
    const roleLabel = msg.role === 'proposer' ? '💡 提案者' : msg.role === 'reviewer' ? '🔍 审查者' : '🎙️ 主持人';
    lines.push('');
    lines.push(`  [${i + 1}] ${roleLabel} (${msg.content?.length || 0} 字符)`);
    const preview = msg.content?.substring(0, 150)?.replace(/\n/g, ' ') || '(空)';
    lines.push(`     ${preview}${msg.content?.length > 150 ? '...' : ''}`);
  });

  lines.push('');
  lines.push('================================================================================');
  lines.push('                         报告结束');
  lines.push('================================================================================');
  lines.push('');

  return lines.join('\n');
}

/**
 * 执行辩论生成与审查
 */
async function runDebateReview() {
  console.log('🚀 辩论内容生成与审查流程');
  console.log(`📋 测试主题：${TEST_TOPIC}`);
  console.log('');

  const startTime = Date.now();
  const messages = [];
  let engine = null;

  try {
    // 初始化辩论引擎
    console.log('🔧 初始化辩论引擎...');
    engine = new DebateEngine({
      id: `review-${Date.now()}`,
      topic: TEST_CONFIG.topic,
      roles: TEST_CONFIG.roles,
      maxRounds: TEST_CONFIG.maxRounds,
      maxPhases: TEST_CONFIG.maxPhases,
    });

    // 设置事件监听
    engine.on('debate:message', (msg) => {
      messages.push({ ...msg, timestamp: new Date().toISOString() });
      const preview = msg.content?.substring(0, 60)?.replace(/\n/g, ' ') || '';
      console.log(`  📩 [${msg.role}] ${preview}...`);
    });

    engine.on('debate:phase', (data) => {
      console.log(`  📍 阶段：${data.phaseName}`);
    });

    engine.on('debate:round', (data) => {
      console.log(`  🔄 轮次：${data.round}`);
    });

    console.log('⏳ 开始生成内容（超时60秒）...\n');

    // 设置超时保护
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('生成超时（60秒）')), 60000);
    });

    // 并行执行：生成辩论 或 超时
    await Promise.race([
      engine.start().then(() => {
        console.log('\n✅ 辩论引擎完成');
      }),
      timeoutPromise
    ]);

    // 等待一小段时间确保所有消息都被接收
    await new Promise(resolve => setTimeout(resolve, 2000));

  } catch (error) {
    console.log(`\n⚠️ 生成过程结束：${error.message}`);

    // 即使超时/出错，也检查是否已有部分消息
    if (messages.length === 0) {
      console.log('❌ 未生成任何消息，尝试加载模拟数据进行审查测试...\n');

      // 如果真实生成失败，使用模拟数据进行审查流程演示
      messages.push(
        {
          role: 'proposer',
          content: `## 我的立场：AI可以显著提升教学效果，但无法完全取代教师

### 核心论点1：AI辅助教学的数据支撑
- **数据来源**：根据UNESCO2024年报告，AI辅助教学使学习效率提升30%
- **应用场景**：智能备课系统可节省教师60%的时间
- **实际案例**：某省重点中学使用AI批改作文，准确率达92%

### 核心论点2：AI的独特优势
- **个性化**：AI能根据每个学生的学习进度动态调整内容
- **规模化**：一位AI教师可同时服务成千上万学生
- **客观性**：AI评估不受情绪影响，评分一致性高

### 我的关键承诺
1. AI将承担80%的标准化教学工作
2. 教师转型为学习规划师和情感陪伴者`,
          timestamp: new Date().toISOString(),
        },
        {
          role: 'reviewer',
          content: `## 🎯 审查总评卡

| 维度 | 得分 | 简评 |
|------|------|------|
| 论证结构 | 7/10 | 基本完整但反驳预留不足 |
| 论据质量 | 6/10 | 数据有来源但案例单一 |
| 逻辑严密性 | 5/10 | 存在逻辑跳跃 |
| 反驳准备 | 4/10 | 未考虑伦理反对意见 |
| 表达专业 | 8/10 | 表达流畅准确 |

### 问题清单

#### 严重问题
- **数据来源存疑**：UNESCO报告未注明具体研究机构名称和样本量
- **逻辑跳跃**：从"AI可以个性化"直接跳到"AI能服务万千学生"

#### 一般问题
- 缺少对教师情感关怀能力的讨论
- 未回应"AI是否能真正理解学生情感需求"的质疑`,
          timestamp: new Date().toISOString(),
        }
      );
    }
  }

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n📊 共生成 ${messages.length} 条消息，耗时 ${elapsedTime} 秒\n`);

  // 审查消息
  console.log('🔍 开始内容审查...\n');
  const reviewResults = messages.map((msg, i) => reviewMessage(msg, i));
  const overallScore = calculateOverallScore(reviewResults);

  // 生成报告
  const report = generateReviewReport(messages, reviewResults, overallScore, elapsedTime);
  console.log(report);

  // 输出修复优先级
  console.log('\n📋 修复优先级排序：\n');

  const criticalIssues = reviewResults
    .flatMap(r => r.issues)
    .filter(i => i.includes('严重') || i.includes('逻辑') || i.includes('结构'))
    .slice(0, 5);

  const otherIssues = reviewResults
    .flatMap(r => r.issues)
    .filter(i => !i.includes('严重') && !i.includes('逻辑') && !i.includes('结构'))
    .slice(0, 5);

  if (criticalIssues.length > 0) {
    console.log('【高优先级 - 必须修复】');
    criticalIssues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
  }

  if (otherIssues.length > 0) {
    console.log('\n【中优先级 - 建议修复】');
    otherIssues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
  }

  if (criticalIssues.length === 0 && otherIssues.length === 0) {
    console.log('✅ 内容质量良好，无需修复');
  }

  console.log('\n✅ 审查流程完成！');

  // 返回结果供进一步处理
  return {
    messages,
    reviewResults,
    overallScore,
    report,
  };
}

// 执行
runDebateReview().catch(console.error);