/**
 * PRD辩论系统 - 自动化测试程序 V1.0
 * 
 * 功能：
 * - 13种讨论模式的自动化测试
 * - 模拟对话流程验证
 * - 多维度质量评估
 * - 详细测试报告生成
 * 
 * 使用方法：node tests/auto-test.js
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const CONFIG = {
  backendUrl: 'http://localhost:9528',
  wsUrl: 'ws://localhost:9528',
  testTimeout: 120000, // 2分钟超时
  outputDir: path.join(__dirname, '../test-reports'),
};

// ==================== 测试用例定义 ====================
const TEST_CASES = [
  {
    id: 'TC-001',
    modeId: 'brainstorm',
    modeName: '发散头脑风暴',
    topic: '人工智能是否会取代人类的工作？',
    expectedRoles: ['host', 'ideator'],
    roundsPerPhase: 3,
    totalPhases: 3,
    expectations: {
      minMessages: 4,
      hasCreativeIdeas: true,
      noRepetition: true,
      roleParticipation: true,
    },
  },
  {
    id: 'TC-002',
    modeId: 'standard-debate',
    modeName: '标准正反方辩论',
    topic: '远程办公是否应该成为常态？',
    expectedRoles: ['host', 'pro-side', 'con-side', 'judge'],
    roundsPerPhase: 2,
    totalPhases: 3,
    expectations: {
      minMessages: 6,
      hasProArguments: true,
      hasConArguments: true,
      hasVerdict: true,
    },
  },
  {
    id: 'TC-003',
    modeId: 'roundtable',
    modeName: '圆桌讨论',
    topic: '如何平衡工作与生活？',
    expectedRoles: ['host', 'member'],
    roundsPerPhase: 2,
    totalPhases: 2,
    expectations: {
      minMessages: 4,
      balancedDiscussion: true,
      diversePerspectives: true,
    },
  },
  {
    id: 'TC-004',
    modeId: 'review',
    modeName: '方案评审',
    topic: '评估"每周四天工作制"方案的可行性',
    expectedRoles: ['host', 'presenter', 'supplementer', 'critic', 'summarizer'],
    roundsPerPhase: 2,
    totalPhases: 2,
    expectations: {
      minMessages: 6,
      hasProposal: true,
      hasCritique: true,
      hasSummary: true,
    },
  },
  {
    id: 'TC-005',
    modeId: 'voting',
    modeName: '投票决策',
    topic: '是否应该在公司实施AI监控员工系统？',
    expectedRoles: ['host', 'proposer', 'voter'],
    roundsPerPhase: 2,
    totalPhases: 2,
    expectations: {
      minMessages: 4,
      hasProposal: true,
      hasVotingProcess: true,
    },
  },
];

// ==================== 测试引擎类 ====================
class DebateTestEngine {
  constructor() {
    this.results = [];
    this.currentTest = null;
    this.ws = null;
    this.messageBuffer = [];
    this.eventLog = [];
    this.startTime = null;
  }

  /**
   * 运行所有测试用例
   */
  async runAllTests() {
    console.log('\n🚀 开始运行 PRD辩论系统自动化测试...\n');
    console.log(`📋 共 ${TEST_CASES.length} 个测试用例\n`);
    
    for (let i = 0; i < TEST_CASES.length; i++) {
      const testCase = TEST_CASES[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📝 [${i + 1}/${TEST_CASES.length}] ${testCase.id}: ${testCase.modeName}`);
      console.log(`${'='.repeat(60)}`);
      
      try {
        const result = await this.runSingleTest(testCase);
        this.results.push(result);
        
        const status = result.passed ? '✅ 通过' : '❌ 失败';
        const score = result.qualityScore ? `${result.qualityScore.total}/100` : 'N/A';
        console.log(`\n结果: ${status} | 质量分: ${score}`);
      } catch (error) {
        console.error(`\n❌ 测试异常:`, error.message);
        this.results.push({
          ...testCase,
          passed: false,
          error: error.message,
          duration: 0,
          qualityScore: null,
        });
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
    
    console.log(`\n🎯 主题: ${testCase.topic}`);
    console.log(`👥 预期角色: ${testCase.expectedRoles.join(', ')}`);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.disconnect();
        reject(new Error(`测试超时 (${CONFIG.testTimeout / 1000}s)`));
      }, CONFIG.testTimeout);

      // 连接WebSocket
      this.connect((success) => {
        if (!success) {
          clearTimeout(timeout);
          reject(new Error('WebSocket连接失败'));
          return;
        }

        // 发送开始辩论请求
        this.startDebate(testCase);
      });

      // 监听完成事件
      this.onComplete = () => {
        clearTimeout(timeout);
        const duration = Date.now() - this.startTime;
        
        // 评估结果
        const evaluation = this.evaluateResult(testCase);
        
        resolve({
          ...testCase,
          duration,
          messageCount: this.messageBuffer.length,
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
        this.handleMessage(JSON.parse(data.toString()));
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket 错误:', error.message);
        callback(false);
      });

      this.ws.on('close', () => {
        console.log('🔌 WebSocket 已断开');
      });
    } catch (error) {
      console.error('❌ 连接失败:', error.message);
      callback(false);
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }

  /**
   * 发送开始辩论请求
   */
  startDebate(testCase) {
    const payload = {
      topic: testCase.topic,
      roles: this.generateRoles(testCase),
      roundsPerPhase: testCase.roundsPerPhase,
      totalPhases: testCase.totalPhases,
      outputDepth: 'brief',
      modeId: testCase.modeId,
      displayStyle: 'card',
    };

    console.log(`\n📤 发送辩论开始请求...`);
    this.eventLog.push({ type: 'send', event: 'debate:start', timestamp: Date.now() });
    
    // 🔥 修正：后端期望 { type, payload } 格式
    this.ws.send(JSON.stringify({ type: 'debate:start', payload }));
  }

  /**
   * 生成测试角色
   */
  generateRoles(testCase) {
    const roleTemplates = {
      host: { name: '主持人', soul: '你是一位公正的主持人，负责引导讨论流程。', model: 'deepseek-v4-flash' },
      ideator: { name: '创意者', soul: '你是一位富有创意的思考者。', model: 'deepseek-v4-flash' },
      'pro-side': { name: '正方', soul: '你是正方辩手，支持当前立场。', model: 'deepseek-v4-flash' },
      'con-side': { name: '反方', soul: '你是反方辩手，反对当前立场。', model: 'deepseek-v4-flash' },
      judge: { name: '裁判', soul: '你是裁判，公正评判双方表现。', model: 'deepseek-v4-flash' },
      member: { name: '成员', soul: '你是一位积极参与的成员。', model: 'deepseek-v4-flash' },
      presenter: { name: '方案方', soul: '你负责提出和展示方案。', model: 'deepseek-v4-flash' },
      supplementer: { name: '补位方', soul: '你负责补充遗漏的细节。', model: 'deepseek-v4-flash' },
      critic: { name: '挑错方', soul: '你负责发现问题和风险。', model: 'deepseek-v4-flash' },
      summarizer: { name: '总结方', soul: '你负责整合总结。', model: 'deepseek-v4-flash' },
      proposer: { name: '提案方', soul: '你负责提出提案。', model: 'deepseek-v4-flash' },
      voter: { name: '投票方', soul: '你负责投票表决。', model: 'deepseek-v4-flash' },
    };

    return testCase.expectedRoles.map((roleType, index) => ({
      id: Date.now() + index,
      name: roleTemplates[roleType]?.name || roleType,
      roleType,
      soul: roleTemplates[roleType]?.soul || '',
      soulPresetId: null,
      model: roleTemplates[roleType]?.model || 'deepseek-v4-flash',
    }));
  }

  /**
   * 处理WebSocket消息
   */
  handleMessage(data) {
    const { type, ...payload } = data;
    
    this.eventLog.push({ 
      type: 'receive', 
      event: type, 
      timestamp: Date.now(),
      payload: JSON.stringify(payload).substring(0, 200),
    });

    switch (type) {
      case 'debate:message':
        this.handleMessageEvent(payload);
        break;
      case 'debate:stream:start':
        console.log(`  🔄 流式输出开始: ${payload.roleName}`);
        break;
      case 'debate:stream:end':
        console.log(`  ✅ 流式输出结束: ${payload.contentLength}字符`);
        break;
      case 'debate:round':
        console.log(`  📍 第 ${payload.round}/${payload.totalRounds} 轮`);
        break;
      case 'debate:phase:change':
        console.log(`  ➡️ 阶段切换: ${payload.phaseName}`);
        break;
      case 'debate:complete':
        console.log(`  🏁 辩论完成!`);
        if (this.onComplete) this.onComplete();
        break;
      case 'debate:error':
        console.error(`  ❌ 错误: ${payload.error}`);
        if (this.onComplete) this.onComplete(); // 即使出错也完成测试
        break;
    }
  }

  /**
   * 处理消息事件
   */
  handleMessageEvent(payload) {
    this.messageBuffer.push(payload);
    
    const preview = (payload.content || '').substring(0, 50) + '...';
    console.log(`  💬 [${payload.roleName || payload.role}]: ${preview}`);
  }

  // ==================== 评估模块 ====================

  /**
   * 评估测试结果
   */
  evaluateResult(testCase) {
    const checks = [
      this.checkMessageCount(testCase),
      this.checkRoleParticipation(testCase),
      this.checkContentQuality(testCase),
      this.checkNoRepetition(testCase),
      this.checkFlowCompleteness(testCase),
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

  /**
   * 检查消息数量
   */
  checkMessageCount(testCase) {
    const count = this.messageBuffer.length;
    const expected = testCase.expectations.minMessages;
    const passed = count >= expected;

    return {
      name: '消息数量检查',
      passed,
      issue: passed ? null : `消息数量不足: 实际 ${count}, 期望 >= ${expected}`,
      score: passed ? 100 : Math.max(0, (count / expected) * 100),
    };
  }

  /**
   * 检查角色参与度
   */
  checkRoleParticipation(testCase) {
    const participatedRoles = new Set(
      this.messageBuffer.map(m => m.role || m.roleType)
    );
    
    const missingRoles = testCase.expectedRoles.filter(
      r => !participatedRoles.has(r)
    );

    const passed = missingRoles.length === 0;

    return {
      name: '角色参与度检查',
      passed,
      issue: passed ? null : `缺少角色发言: ${missingRoles.join(', ')}`,
      score: passed ? 100 : Math.max(0, ((testCase.expectedRoles.length - missingRoles.length) / testCase.expectedRoles.length) * 100),
    };
  }

  /**
   * 检查内容质量
   */
  checkContentQuality(testCase) {
    let totalLength = 0;
    let avgLength = 0;
    let qualityIssues = [];

    for (const msg of this.messageBuffer) {
      const content = msg.content || '';
      totalLength += content.length;
      
      // 检查内容是否过短
      if (content.length < 20 && content.length > 0) {
        qualityIssues.push(`${msg.roleName || msg.role} 内容过短`);
      }
    }

    avgLength = this.messageBuffer.length > 0 
      ? totalLength / this.messageBuffer.length 
      : 0;

    const passed = avgLength >= 30 && qualityIssues.length === 0;

    return {
      name: '内容质量检查',
      passed,
      issue: passed ? null : `质量问题: ${qualityIssues.join('; ')}, 平均长度: ${avgLength.toFixed(0)}字符`,
      score: passed ? 100 : Math.max(0, Math.min(avgLength * 2, 90)),
    };
  }

  /**
   * 检查重复内容
   */
  checkNoRepetition(testCase) {
    const contents = this.messageBuffer.map(m => (m.content || '').trim());
    let repetitionCount = 0;

    for (let i = 0; i < contents.length; i++) {
      for (let j = i + 1; j < contents.length; j++) {
        if (contents[i] && contents[j]) {
          const similarity = this.calculateSimilarity(contents[i], contents[j]);
          if (similarity > 0.8) repetitionCount++;
        }
      }
    }

    const passed = repetitionCount === 0;

    return {
      name: '内容重复检查',
      passed,
      issue: passed ? null : `发现 ${repetitionCount} 对高度相似的消息`,
      score: passed ? 100 : Math.max(0, 100 - repetitionCount * 20),
    };
  }

  /**
   * 检查流程完整性
   */
  checkFlowCompleteness(testCase) {
    const events = this.eventLog.map(e => e.event);
    
    const hasStart = events.includes('debate:start');
    const hasRound = events.some(e => e.includes('round'));
    const hasEnd = events.includes('debate:complete') || events.includes('debate:error');
    const hasMessages = this.messageBuffer.length > 0;

    const missingSteps = [];
    if (!hasStart) missingSteps.push('缺少启动事件');
    if (!hasRound) missingSteps.push('缺少轮次事件');
    if (!hasEnd) missingSteps.push('缺少结束事件');
    if (!hasMessages) missingSteps.push('没有收到任何消息');

    const passed = missingSteps.length === 0;

    return {
      name: '流程完整性检查',
      passed,
      issue: passed ? null : `流程不完整: ${missingSteps.join(', ')}`,
      score: passed ? 100 : Math.max(0, 100 - missingSteps.length * 25),
    };
  }

  /**
   * 计算文本相似度（简化版）
   */
  calculateSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const words1 = new Set(text1.split(''));
    const words2 = new Set(text2.split(''));
    
    const intersection = [...words1].filter(x => words2.has(x)).length;
    const union = new Set([...words1, ...words2]).size;
    
    return union > 0 ? intersection / union : 0;
  }

  /**
   * 计算总分
   */
  calculateScore(checks) {
    const weights = {
      '消息数量检查': 0.15,
      '角色参与度检查': 0.25,
      '内容质量检查': 0.30,
      '内容重复检查': 0.15,
      '流程完整性检查': 0.15,
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const check of checks) {
      const weight = weights[check.name] || 0.1;
      weightedSum += check.score * weight;
      totalWeight += weight;
    }

    return {
      total: Math.round(weightedSum / totalWeight),
      breakdown: checks.reduce((acc, c) => ({ ...acc, [c.name]: c.score }), {}),
    };
  }

  /**
   * 生成改进建议
   */
  generateRecommendations(checks, testCase) {
    const recommendations = [];

    for (const check of checks) {
      if (!check.passed) {
        switch (check.name) {
          case '消息数量检查':
            recommendations.push('建议增加轮次或减少角色数量以确保充分讨论');
            break;
          case '角色参与度检查':
            recommendations.push('检查角色路由逻辑，确保所有角色都能正常发言');
            break;
          case '内容质量检查':
            recommendations.push('优化提示词模板，要求更详细的内容输出');
            break;
          case '内容重复检查':
            recommendations.push('增强去重机制，或在提示词中明确禁止重复');
            break;
          case '流程完整性检查':
            recommendations.push('检查事件发射逻辑，确保完整的事件链路');
            break;
        }
      }
    }

    return recommendations;
  }
}

// ==================== 报告生成器 ====================
class TestReportGenerator {
  constructor(results) {
    this.results = results;
    this.generatedAt = new Date().toISOString();
  }

  /**
   * 生成Markdown报告
   */
  generateMarkdown() {
    let md = `# PRD辩论系统自动化测试报告\n\n`;
    md += `> 生成时间: ${this.generatedAt}\n`;
    md += `> 测试环境: http://localhost:9528 + 9529\n\n`;

    // 执行摘要
    md += `## 📊 执行摘要\n\n`;
    md += `| 指标 | 数值 |\n|------|------|\n`;
    md += `| 总测试数 | ${this.results.length} |\n`;
    md += `| 通过数 | ${this.results.filter(r => r.passed).length} |\n`;
    md += `| 失败数 | ${this.results.filter(r => !r.passed).length} |\n`;
    md += `| 通过率 | ${(this.results.filter(r => r.passed).length / this.results.length * 100).toFixed(1)}% |\n`;
    
    const avgScore = this.results
      .filter(r => r.qualityScore)
      .reduce((sum, r) => sum + r.qualityScore.total, 0) / 
      (this.results.filter(r => r.qualityScore).length || 1);
    md += `| 平均质量分 | ${avgScore.toFixed(1)}/100 |\n\n`;

    // 详细结果
    md += `## 🔍 详细测试结果\n\n`;
    
    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      const score = result.qualityScore ? `${result.qualityScore.total}/100` : 'N/A';
      const duration = (result.duration / 1000).toFixed(1);
      
      md += `### ${status} ${result.id}: ${result.modeName}\n\n`;
      md += `- **主题**: ${result.topic}\n`;
      md += `- **状态**: ${result.passed ? '通过' : '失败'}\n`;
      md += `- **质量分**: ${score}\n`;
      md += `- **耗时**: ${duration}s\n`;
      md += `- **消息数**: ${result.messageCount}\n`;
      md += `- **事件数**: ${result.eventCount}\n\n`;

      if (result.issues && result.issues.length > 0) {
        md += `**问题点**:\n`;
        for (const issue of result.issues) {
          md += `- ⚠️ ${issue}\n`;
        }
        md += `\n`;
      }

      if (result.recommendations && result.recommendations.length > 0) {
        md += `**改进建议**:\n`;
        for (const rec of result.recommendations) {
          md += `- 💡 ${rec}\n`;
        }
        md += `\n`;
      }

      md += `---\n\n`;
    }

    // 问题汇总
    const allIssues = this.results.flatMap(r => r.issues || []);
    if (allIssues.length > 0) {
      md += `## ⚠️ 问题汇总\n\n`;
      for (const issue of allIssues) {
        md += `- ${issue}\n`;
      }
      md += `\n`;
    }

    return md;
  }

  /**
   * 保存报告
   */
  async saveReport() {
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    
    // Markdown报告
    const mdContent = this.generateMarkdown();
    const mdPath = path.join(CONFIG.outputDir, `test-report-${timestamp}.md`);
    fs.writeFileSync(mdPath, mdContent, 'utf8');
    console.log(`\n📄 Markdown报告已保存: ${mdPath}`);

    // JSON详细数据
    const jsonPath = path.join(CONFIG.outputDir, `test-results-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2), 'utf8');
    console.log(`📄 JSON数据已保存: ${jsonPath}`);

    return { mdPath, jsonPath };
  }
}

// ==================== 主程序 ====================
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       PRD辩论系统 - 自动化测试程序 V1.0                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const engine = new DebateTestEngine();

  try {
    // 运行所有测试
    const results = await engine.runAllTests();

    // 生成报告
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 正在生成测试报告...');
    
    const reporter = new TestReportGenerator(results);
    const reportPaths = await reporter.saveReport();

    // 输出摘要
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 测试完成!');
    console.log(`\n📈 结果统计:`);
    console.log(`   总计: ${results.length} 个测试`);
    console.log(`   通过: ${passed} 个 ✅`);
    console.log(`   失败: ${failed} 个 ❌`);
    console.log(`   通过率: ${(passed / results.length * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log(`\n⚠️  有 ${failed} 个测试未通过，请查看报告了解详情`);
    } else {
      console.log(`\n🎉 所有测试通过！系统运行正常！`);
    }

    process.exit(failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ 测试程序异常:', error.message);
    process.exit(1);
  }
}

// 运行主程序
main();
