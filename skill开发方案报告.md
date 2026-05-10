# 多AI讨论 Skill 开发方案报告

## 1. 项目概述

### 1.1 当前项目状态

本项目（taolun-web）是一个**结构化多AI讨论系统**，核心功能包括：

- **DebateEngine（辩论引擎V4.1）**：基于Node.js的对抗式辩论核心引擎
- **WebSocket实时通信**：前后端实时消息推送
- **React前端Dashboard**：可视化监控辩论过程（V2.2版本，含流式输出、取消按钮、离线模式）
- **多角色支持**：主持人、提案者、审查者等角色，可自定义角色和性格（Soul）
- **多讨论模式**：6种预设讨论模式（辩论、头脑风暴、评审、教学、协商、自由讨论）
- **文件导出**：支持Markdown、Word、HTML格式导出
- **回溯验证**：跨阶段一致性检查

### 1.2 Skill化目标

将核心辩论引擎及相关逻辑封装为**独立的Skill模块**，供WorkBuddy、OpenClaw、Claude Code等Agent框架调用。

**触发方式**：用户输入 `/多AI讨论` 或相关关键词激活

**运行环境**：本地Node.js环境（不依赖Web UI）

---

## 2. Skill架构设计

### 2.1 Skill定位

| 属性 | 说明 |
|------|------|
| **Skill名称** | `multi-ai-debate` / `多AI讨论` |
| **类型** | 执行操作型（直接执行具体操作产出成果） |
| **交互模式** | 对话采集型 + 自主执行型 |
| **触发条件** | 用户输入 `/多AI讨论` 或包含"多AI讨论"、"AI辩论"、"结构化讨论"等关键词 |
| **依赖环境** | Node.js 18+、本地文件系统 |
| **API依赖** | DeepSeek API / MiniMax API（通过环境变量配置） |

### 2.2 核心功能模块

```
┌─────────────────────────────────────────────────────────────┐
│                    多AI讨论 Skill                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  意图澄清    │  │  角色配置    │  │   讨论引擎执行       │ │
│  │  模块       │  │  模块       │  │   (DebateEngine)    │ │
│  │             │  │             │  │                     │ │
│  │ - 话题收集  │  │ - 角色选择  │  │ - 多轮对抗讨论      │ │
│  │ - 需求确认  │  │ - Soul配置  │  │ - 流式输出          │ │
│  │ - 模式选择  │  │ - 模型分配  │  │ - 共识生成          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  回溯验证    │  │  报告生成    │  │   文件导出          │ │
│  │  模块       │  │  模块       │  │   (ExportService)   │ │
│  │             │  │             │  │                     │ │
│  │ - 一致性检查│  │ - 辩论记录  │  │ - Markdown          │ │
│  │ - 矛盾检测  │  │ - 共识总结  │  │ - Word (.docx)      │ │
│  │ - 承诺提取  │  │ - 决策日志  │  │ - HTML页面          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 与现有项目的关系

```
现有项目结构                          Skill化后结构
─────────────────                    ─────────────────
taolun-web/                          multi-ai-debate-skill/
├── backend/                         ├── src/
│   ├── src/                         │   ├── engine/          ← 核心引擎
│   │   ├── services/                │   │   ├── DebateEngine.js
│   │   │   ├── debateEngine.js  ───→│   │   ├── ContextManager.js
│   │   │   ├── debateService.js     │   │   └── BacktrackValidator.js
│   │   │   ├── exportService.js ───→│   ├── services/
│   │   │   └── documentAnalyzer.js  │   │   ├── ExportService.js
│   │   ├── routes/                  │   │   └── ReportGenerator.js
│   │   ├── websocket/               │   ├── config/
│   │   └── index.js                 │   │   ├── constants.js
├── frontend/                        │   │   └── modes.js
│   ├── src/                         │   ├── cli/
│   │   ├── components/              │   │   └── index.js     ← CLI入口
│   │   ├── stores/                  │   └── utils/
│   │   └── ...                      │       └── fileHelpers.js
├── debate/                          ├── templates/
│   ├── SKILL.md                     │   ├── debate-template.md
│   └── references/                  │   └── report-template.md
└── ...                              ├── output/              ← 输出目录
                                     ├── package.json
                                     └── SKILL.md             ← Skill定义
```

---

## 3. 详细功能设计

### 3.1 激活与初始化流程

```
用户输入: "/多AI讨论"
        ↓
Skill激活
        ↓
┌─────────────────┐
│  步骤1: 意图澄清  │ ← 必须步骤，不可跳过
│                 │
│ 1. 询问讨论话题  │
│ 2. 询问讨论目标  │
│ 3. 推荐讨论模式  │
│ 4. 确认输出格式  │
└─────────────────┘
        ↓
┌─────────────────┐
│  步骤2: 角色配置  │
│                 │
│ 1. 选择预设角色  │
│ 2. 或自定义角色  │
│ 3. 分配AI模型   │
│ 4. 配置Soul性格 │
└─────────────────┘
        ↓
┌─────────────────┐
│  步骤3: 参数确认  │
│                 │
│ 1. 轮数设置     │
│ 2. 阶段设置     │
│ 3. 输出深度     │
│ 4. 用户最终确认 │
└─────────────────┘
        ↓
开始执行讨论
```

### 3.2 讨论模式预设

| 模式ID | 模式名称 | 角色配置 | 适用场景 |
|--------|----------|----------|----------|
| `debate` | 正反辩论 | 正方 + 反方 + 主持人 | 观点对抗、决策论证 |
| `brainstorm` | 头脑风暴 | 创意者A + 创意者B + 整合者 | 创意发散、方案收集 |
| `review` | 方案评审 | 提案者 + 审查者 + 主持人 | PRD评审、代码评审 |
| `teaching` | 教学讨论 | 老师 + 学生 + 观察者 | 知识讲解、概念澄清 |
| `negotiation` | 协商讨论 | 甲方 + 乙方 + 调解人 | 需求协商、冲突解决 |
| `free` | 自由讨论 | 参与者A + 参与者B + ... | 开放式探讨 |

### 3.3 角色系统

**预设角色库**：

| 角色类型 | 默认Soul | 默认模型 | 职责 |
|----------|----------|----------|------|
| `proposer` | 建设性提案者 | deepseek-v4-flash | 提出观点、方案 |
| `reviewer` | 批判性审查者 | deepseek-v4-flash | 质疑、审查、找漏洞 |
| `host` | 中立主持人 | deepseek-v4-flash | 引导、总结、推进 |
| `creative` | 创意发散者 | MiniMax-M2.7 | 头脑风暴、联想 |
| `analyst` | 数据分析者 | deepseek-v4-flash | 逻辑分析、证据评估 |
| `skeptic` | 怀疑论者 | deepseek-v4-flash | 挑战假设、指出风险 |

**自定义角色**：用户可自定义角色名称、Soul描述、使用的AI模型

### 3.4 输出格式

**实时显示**：
- 终端彩色输出（支持Markdown渲染）
- 流式输出（逐字显示AI回复）
- 进度指示（当前阶段/轮次）

**文件输出**：

| 格式 | 文件扩展名 | 用途 | 生成时机 |
|------|-----------|------|----------|
| Markdown | `.md` | 默认格式，包含完整记录 | 讨论完成自动保存 |
| Word | `.docx` | 可打印的精美文档 | 用户请求时生成 |
| HTML | `.html` | 可在浏览器中查看的页面 | 用户请求时生成 |

**输出文件清单**：

```
output/
└── {timestamp}_{topicSlug}/
    ├── 辩论记录.md          ← 完整讨论过程
    ├── 共识报告.md          ← 达成的共识
    ├── 承诺清单.md          ← 行动项承诺
    ├── 决策日志.md          ← 决策过程记录
    ├── 辩论总结.md          ← 一键总结
    ├── 辩论报告.docx        ← Word版本（可选）
    └── 辩论报告.html        ← HTML版本（可选）
```

---

## 4. 技术实现方案

### 4.1 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 运行时 | Node.js 18+ | 支持ES Modules和async/await |
| 语言 | JavaScript (ES2022) | 保持与现有项目一致 |
| AI调用 | OpenAI SDK | 兼容DeepSeek、MiniMax等 |
| 文件生成 | markdown-it + docx.js + handlebars | 多格式导出 |
| CLI交互 | inquirer.js + chalk + ora | 交互式命令行 |
| 配置管理 | dotenv + config.js | 环境变量和配置 |

### 4.2 核心类设计

```javascript
// 主入口类
class MultiAIDebateSkill {
  constructor() {
    this.engine = null;
    this.config = null;
    this.outputDir = './output';
  }

  // 激活Skill
  async activate(userInput) {
    // 1. 意图澄清
    const intent = await this.clarifyIntent(userInput);
    // 2. 角色配置
    const roles = await this.configureRoles(intent);
    // 3. 执行讨论
    await this.executeDebate(intent, roles);
    // 4. 生成报告
    await this.generateReports();
  }

  // 意图澄清
  async clarifyIntent(userInput) { ... }

  // 角色配置
  async configureRoles(intent) { ... }

  // 执行讨论
  async executeDebate(intent, roles) { ... }

  // 生成报告
  async generateReports() { ... }
}

// 导出服务
class ExportService {
  async exportToMarkdown(debateData, outputPath) { ... }
  async exportToDocx(debateData, outputPath) { ... }
  async exportToHtml(debateData, outputPath) { ... }
}
```

### 4.3 配置文件

```javascript
// config/default.js
module.exports = {
  // API配置
  api: {
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
    },
    minimax: {
      apiKey: process.env.MINIMAX_API_KEY,
      baseURL: process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1',
      model: process.env.MINIMAX_MODEL || 'MiniMax-M2.7',
    }
  },

  // 讨论默认配置
  debate: {
    maxRounds: 5,
    maxPhases: 4,
    outputDepth: 'normal', // brief | normal | detailed
    autoSave: true,
  },

  // 输出配置
  output: {
    dir: './output',
    formats: ['md'], // 默认只生成md，用户可请求docx/html
  }
};
```

### 4.4 命令行接口

```bash
# 直接激活（交互模式）
npx multi-ai-debate

# 快速模式（带话题）
npx multi-ai-debate --topic "AI会取代人类工作吗？"

# 指定模式
npx multi-ai-debate --topic "xxx" --mode debate

# 指定角色数
npx multi-ai-debate --topic "xxx" --roles 3

# 指定输出深度
npx multi-ai-debate --topic "xxx" --depth detailed

# 指定输出格式
npx multi-ai-debate --topic "xxx" --format md,docx,html

# 非交互模式（全自动）
npx multi-ai-debate --topic "xxx" --auto
```

---

## 5. Skill文件结构

```
multi-ai-debate/
├── SKILL.md                          # Skill定义文件（给Agent看的）
├── README.md                         # 使用说明（给用户看的）
├── package.json                      # 包配置
├── .env.example                      # 环境变量示例
├── src/
│   ├── index.js                      # 主入口/CLI
│   ├── skill.js                      # Skill核心类
│   ├── config/
│   │   ├── index.js                  # 配置加载
│   │   ├── constants.js              # 常量定义
│   │   └── modes.js                  # 讨论模式配置
│   ├── engine/
│   │   ├── DebateEngine.js           # 辩论引擎（从现有项目迁移）
│   │   ├── ContextManager.js         # 上下文管理
│   │   └── BacktrackValidator.js     # 回溯验证
│   ├── services/
│   │   ├── ExportService.js          # 导出服务
│   │   └── ReportGenerator.js        # 报告生成器
│   ├── cli/
│   │   ├── index.js                  # CLI入口
│   │   ├── prompts.js                # 交互式提示
│   │   └── display.js                # 终端显示
│   └── utils/
│       ├── fileHelpers.js            # 文件操作
│       ├── textHelpers.js            # 文本处理
│       └── apiHelpers.js             # API调用封装
├── templates/
│   ├── debate-prompts/               # 各角色提示词模板
│   │   ├── proposer.md
│   │   ├── reviewer.md
│   │   └── host.md
│   └── report-templates/             # 报告模板
│       ├── markdown.hbs
│       ├── docx-template/
│       └── html-template/
└── output/                           # 默认输出目录
```

---

## 6. 与现有项目的代码复用

### 6.1 可直接迁移的文件

| 现有文件 | Skill目标路径 | 复用度 | 修改说明 |
|----------|--------------|--------|----------|
| `backend/src/services/debateEngine.js` | `src/engine/DebateEngine.js` | 90% | 移除WebSocket相关代码，改为事件监听 |
| `backend/src/constants/index.js` | `src/config/constants.js` | 100% | 直接复制 |
| `backend/src/services/exportService.js` | `src/services/ExportService.js` | 80% | 增强多格式导出 |
| `debate/references/*.md` | `templates/debate-prompts/*.md` | 100% | 直接复制 |

### 6.2 需要重构的部分

| 功能 | 现有实现 | Skill实现 | 重构说明 |
|------|----------|-----------|----------|
| 状态通知 | WebSocket推送 | 事件发射器 + CLI显示 | 替换传输层 |
| 用户交互 | React UI | inquirer.js CLI | 完全重写交互层 |
| 文件下载 | HTTP API响应 | 本地文件写入 | 简化文件操作 |
| 配置面板 | React组件 | CLI交互提示 | 命令行化 |

---

## 7. 开发计划

### Phase 1: 核心迁移（预计2-3天）

- [ ] 创建Skill项目骨架
- [ ] 迁移DebateEngine核心代码
- [ ] 迁移常量配置
- [ ] 实现基础CLI交互
- [ ] 实现Markdown导出

### Phase 2: 功能完善（预计2-3天）

- [ ] 实现6种讨论模式
- [ ] 实现角色配置系统
- [ ] 实现意图澄清流程
- [ ] 实现流式输出显示
- [ ] 实现回溯验证

### Phase 3: 导出增强（预计1-2天）

- [ ] 实现Word (.docx)导出
- [ ] 实现HTML导出
- [ ] 美化报告模板
- [ ] 实现批量导出

### Phase 4: 集成测试（预计1-2天）

- [ ] 编写单元测试
- [ ] 集成测试（端到端）
- [ ] 性能测试
- [ ] 文档完善

---

## 8. 使用示例

### 8.1 交互式使用

```bash
$ npx multi-ai-debate

🤖 多AI讨论 Skill 已激活

📋 步骤1/3: 意图澄清
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 请输入您想讨论的话题:
> AI会取代人类工作吗？

🎯 检测到话题类型: 观点辩论
💡 推荐模式: 正反辩论 (debate)
   角色: 正方 + 反方 + 主持人

✅ 是否使用推荐配置? (Y/n): Y

📋 步骤2/3: 角色配置
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎭 角色1: 正方 (proposer)
   模型: deepseek-v4-flash
   Soul: 建设性提案者

🎭 角色2: 反方 (reviewer)
   模型: deepseek-v4-flash
   Soul: 批判性审查者

🎭 角色3: 主持人 (host)
   模型: deepseek-v4-flash
   Soul: 中立主持人

✅ 是否开始讨论? (Y/n): Y

📋 步骤3/3: 执行讨论
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 讨论开始！
📌 阶段1/4: 观点阐述
🔄 轮次1/5

💡 正方: 我认为AI不会完全取代人类工作...
[流式输出中...]

🔍 反方: 我不同意正方的观点...
[流式输出中...]

🎙️ 主持人: 双方的观点都有一定的道理...
[流式输出中...]

...

✅ 讨论完成！
📁 输出文件:
   - output/20260510_AI会取代人类工作吗/辩论记录.md
   - output/20260510_AI会取代人类工作吗/共识报告.md
   - output/20260510_AI会取代人类工作吗/承诺清单.md

📄 是否需要生成Word版本? (y/N): y
✅ 已生成: output/20260510_AI会取代人类工作吗/辩论报告.docx

📄 是否需要生成HTML版本? (y/N): y
✅ 已生成: output/20260510_AI会取代人类工作吗/辩论报告.html
```

### 8.2 非交互式使用（Agent调用）

```javascript
// 在Agent中调用
const { MultiAIDebateSkill } = require('multi-ai-debate');

const skill = new MultiAIDebateSkill();

await skill.activate({
  topic: "AI会取代人类工作吗？",
  mode: "debate",
  roles: [
    { type: "proposer", model: "deepseek-v4-flash" },
    { type: "reviewer", model: "deepseek-v4-flash" },
    { type: "host", model: "deepseek-v4-flash" }
  ],
  maxRounds: 5,
  outputFormats: ["md", "docx", "html"],
  autoSave: true
});
```

---

## 9. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| API调用成本 | 中 | 提供预算提醒，支持本地模型 |
| 输出质量不稳定 | 中 | 优化提示词，增加重试机制 |
| 长文本处理 | 低 | 实现上下文压缩 |
| 文件权限问题 | 低 | 自动检测并提示 |

---

## 10. 下一步行动

1. **等待用户确认本方案**
2. 确认后开始Phase 1开发
3. 每完成一个Phase进行测试和反馈
4. 最终交付完整的Skill包

---

**方案版本**: v1.0
**编写日期**: 2026-05-10
**编写者**: Kimi-K2.6 (Trae IDE)
