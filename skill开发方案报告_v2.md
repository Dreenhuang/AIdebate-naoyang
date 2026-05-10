# 多AI讨论 Skill 开发方案报告（v2.0 - 基于实际代码梳理）

## 1. 项目现状深度分析

### 1.1 现有程序核心架构

经过完整代码遍历，现有程序（taolun-web）的实际架构如下：

```
taolun-web/
├── backend/                          # Node.js后端服务
│   ├── src/
│   │   ├── services/
│   │   │   ├── debateEngine.js       # 辩论引擎V4.1（核心）
│   │   │   ├── debateService.js      # 辩论状态管理（模拟实现）
│   │   │   ├── exportService.js      # 导出服务（MD/HTML）
│   │   │   └── documentAnalyzer.js   # PRD文档分析+专家角色推荐
│   │   ├── constants/
│   │   │   └── index.js              # 共享常量（前后端统一）
│   │   ├── routes/
│   │   │   └── debate.js             # REST API路由
│   │   ├── websocket/
│   │   │   └── debateSocket.js       # WebSocket实时通信
│   │   └── index.js                  # 服务入口
│   └── package.json
├── frontend/                         # React前端（V2.2 Dashboard）
│   ├── src/
│   │   ├── data/
│   │   │   ├── discussionModes.js    # 19种讨论模式完整配置
│   │   │   ├── soulPresets.js        # 35个Soul角色预设
│   │   │   └── soulVersionManager.js # Soul版本管理系统
│   │   ├── stores/
│   │   │   └── debateStore.js        # Zustand状态管理（含流式输出）
│   │   ├── components/               # UI组件
│   │   └── App.jsx                   # 主应用
├── debate/                           # Skill定义（现有）
│   ├── SKILL.md                      # 当前Skill定义
│   └── references/                   # 提示词参考
└── Product-Spec.md                   # 产品规格文档
```

### 1.2 核心发现与纠正

**发现1：讨论模式不是6种，而是19种**

现有程序实际包含**19种讨论模式**，分为5大类：

| 分类 | 模式数量 | 具体模式 |
|------|----------|----------|
| 一对一双向商量 | 3种 | 双向自由对谈式、一问一答追问式、互补完善式 |
| 多人圆桌合议 | 4种 | 圆桌自由研讨式、轮值发言合议式、分头立论再汇总式、分工专项研讨式(PR D评审) |
| 正式对抗辩论 | 4种 | 标准正反方辩论赛制、质询答辩辩论制、三方三角辩论制、驳论复盘辩论制 |
| 结构化议事决策 | 3种 | 提案表决式、问题拆解逐级研讨式、优缺点分列合议式 |
| 头脑风暴共创 | 2种 | 发散头脑风暴式、创意接龙讨论式 |
| 多AI专属协同 | 3种 | 主AI牵头+副AI补位式、平行AI独立输出再整合式、角色模拟合议式 |

**发现2：角色系统不是6个预设，而是35个Soul预设**

现有程序包含**35个完整的Soul角色预设**，分为7大类：

| 角色类别 | 数量 | 说明 |
|----------|------|------|
| 主持人类 | 5个 | 中立协调型、效率优先型、温和鼓励型、严格控场型、创意激发型 |
| 提案/立论类 | 6个 | 逻辑严谨型、创新激进型、务实可行型、理论深度型、经验丰富型、用户导向型 |
| 审查/质疑类 | 5个 | 挑剔细节型、风险意识型、成本效益型、用户导向型、技术可行型 |
| 补位/补充类 | 5个 | 全面覆盖型、细节丰富型、案例驱动型、扩展思考型、实操落地型 |
| 总结类 | 4个 | 简明扼要型、系统整合型、行动导向型、共识构建型 |
| 辩手/对抗类 | 5个 | 进攻型、防守型、逻辑型、情感型、综合型 |
| 头脑风暴类 | 5个 | 点子王型、批判型、执行型、用户型、商业型 |

**发现3：辩论逻辑不是简单轮次，而是复杂的阶段-流程驱动**

每个讨论模式都有独立的`flow`配置，定义了：
- **步骤顺序**：谁先发言、谁后发言
- **动作类型**：full-output、ask、answer、supplement、criticize、vote等
- **循环标记**：哪些步骤可以循环（loop: true）
- **角色分配**：每个步骤由哪个角色执行
- **特殊规则**：如补位方不能重复、不能否认

**发现4：输出深度有3级，不是2级**

| 深度 | 字数范围 | 适用场景 |
|------|----------|----------|
| brief（简短） | 50-150字 | 快速结论、头脑风暴 |
| normal（深入） | 200-500字 | 大多数场景 |
| detailed（详细） | 800-2000字 | 复杂议题、正式辩论 |

**发现5：存在Soul版本管理系统**

- 支持保存多个Soul版本
- 支持动态切换提示词
- 支持混合不同Soul特点
- 支持历史记录追踪

**发现6：存在PRD文档分析引擎**

- 自动分析上传文档类型
- 识别PRD文档特征
- 推荐合适的专家角色
- 自动生成辩论配置

---

## 2. Skill化需求澄清

基于用户反馈，明确以下关键需求：

### 2.1 讨论模式
✅ **严格按照现有程序的19种讨论模式**
- 不复用我之前方案的6种简化模式
- 完整保留所有模式的flow配置、角色分配、特殊规则
- 保留分类体系（一对一双向商量/多人圆桌合议/正式对抗辩论/结构化议事决策/头脑风暴共创/多AI专属协同）

### 2.2 角色系统
✅ **复用现有程序的35个Soul预设**
- 完整迁移soulPresets.js中的所有角色
- 保留每个角色的完整Soul描述、性格、思维方式
- 保留角色类别体系（主持人类/提案立论类/审查质疑类/补位补充类/总结类/辩手对抗类/头脑风暴类）
- 支持自定义Soul（可选）

### 2.3 输出格式
✅ **Markdown默认必出，Word和HTML按需生成**
- 讨论完成后自动保存Markdown格式
- 用户可请求生成Word (.docx)版本
- 用户可请求生成HTML页面版本
- 保留现有exportService.js的生成逻辑

### 2.4 API配置
✅ **由外部Agent（WorkBuddy/OpenClaw）驱动，不内置大模型API**
- Skill本身不直接调用DeepSeek/MiniMax API
- 通过标准接口接收外部Agent的AI调用结果
- 或者：由外部Agent负责调用AI，Skill只负责编排讨论流程
- **需要确认**：具体采用哪种集成方式？

---

## 3. 需要用户确认的关键问题

### 问题1：API集成方式（最重要）

由于Skill不内置大模型API，有两种实现方式：

**方式A：Skill只负责流程编排，AI调用完全由外部Agent处理**
```
用户输入话题 → Skill生成讨论配置 → 外部Agent调用AI → 返回结果给Skill → Skill整理输出
```
- Skill输出："现在需要[正方]发言，请调用AI生成内容"
- 外部Agent：调用DeepSeek API获取内容 → 返回给Skill
- Skill：接收内容，继续下一步流程

**方式B：Skill提供标准接口，外部Agent注入AI调用能力**
```
外部Agent初始化Skill时，注入一个aiCall函数
Skill在需要时调用：aiCall(role, prompt) → 返回AI生成的内容
```

**方式C：混合模式（推荐）**
- Skill内置简单的HTTP调用能力（通过配置）
- 但优先使用外部Agent提供的AI调用接口
- 如果外部Agent没有提供，则使用内置配置

**请用户确认：希望采用哪种方式？**

### 问题2：讨论流程的自动化程度

**选项A：全自动**
- 用户输入话题后，Skill自动选择模式、分配角色、执行完整讨论
- 用户只需等待结果

**选项B：半自动（推荐）**
- 用户输入话题
- Skill推荐模式和角色
- 用户确认或修改
- 开始执行

**选项C：全手动**
- 用户逐步选择每个配置项
- 类似现有前端配置面板

**请用户确认：希望哪种自动化程度？**

### 问题3：PRD文档分析功能是否保留

现有程序支持上传PRD文档，自动分析并推荐专家角色。

**选项A：保留**
- Skill支持读取本地文件
- 自动分析文档类型
- 推荐合适的讨论模式和角色

**选项B：简化**
- 只保留基本的文档读取功能
- 不自动分析，由用户指定

**选项C：移除**
- 完全移除文档分析功能
- 纯文本话题输入

**请用户确认：是否保留PRD文档分析功能？**

### 问题4：Soul版本管理是否保留

现有程序有复杂的Soul版本管理系统（保存多个版本、混合Soul等）。

**选项A：保留完整功能**
- 支持保存多个Soul配置版本
- 支持混合不同Soul特点
- 支持历史记录

**选项B：简化**
- 只使用默认Soul预设
- 支持自定义Soul（保存到本地文件）
- 不支持版本管理

**选项C：完全移除**
- 只使用35个固定预设
- 不支持自定义

**请用户确认：Soul版本管理保留到什么程度？**

### 问题5：实时显示需求

**选项A：流式输出**
- 类似现有前端，逐字显示AI输出
- 需要外部Agent支持流式返回

**选项B：整段输出**
- 等AI完整输出后再显示
- 简单但等待时间较长

**选项C：进度指示**
- 只显示当前步骤和进度
- 不显示具体内容，最后统一输出

**请用户确认：希望怎样的实时显示方式？**

---

## 4. 更新后的Skill架构设计

### 4.1 核心模块（基于实际代码）

```
multi-ai-debate-skill/
├── SKILL.md                          # Skill定义文件
├── README.md                         # 使用说明
├── package.json                      # 包配置
├── src/
│   ├── index.js                      # 主入口/CLI
│   ├── skill.js                      # Skill核心类
│   ├── config/
│   │   ├── constants.js              # 共享常量（迁移自backend/src/constants）
│   │   ├── discussionModes.js        # 19种讨论模式（迁移自frontend/src/data）
│   │   ├── soulPresets.js            # 35个Soul预设（迁移自frontend/src/data）
│   │   └── outputDepth.js            # 输出深度配置
│   ├── engine/
│   │   ├── DebateEngine.js           # 辩论引擎（迁移自backend/src/services）
│   │   ├── ContextManager.js         # 上下文管理
│   │   └── FlowExecutor.js           # 流程执行器（新增，执行flow配置）
│   ├── services/
│   │   ├── ExportService.js          # 导出服务（迁移自backend/src/services）
│   │   ├── ReportGenerator.js        # 报告生成器
│   │   └── DocumentAnalyzer.js       # 文档分析（可选，迁移自backend/src/services）
│   ├── cli/
│   │   ├── index.js                  # CLI入口
│   │   ├── prompts.js                # 交互式提示
│   │   └── display.js                # 终端显示
│   └── utils/
│       ├── fileHelpers.js            # 文件操作
│       └── textHelpers.js            # 文本处理
├── templates/
│   └── report-templates/             # 报告模板
│       ├── markdown.hbs
│       ├── docx-template/
│       └── html-template/
└── output/                           # 默认输出目录
```

### 4.2 与现有项目的代码复用计划

| 现有文件 | Skill目标路径 | 复用度 | 修改说明 |
|----------|--------------|--------|----------|
| `frontend/src/data/discussionModes.js` | `src/config/discussionModes.js` | 95% | 移除前端特有属性（icon、displayStyle） |
| `frontend/src/data/soulPresets.js` | `src/config/soulPresets.js` | 95% | 直接迁移，移除前端导出语法 |
| `backend/src/constants/index.js` | `src/config/constants.js` | 100% | 直接复制 |
| `backend/src/services/debateEngine.js` | `src/engine/DebateEngine.js` | 80% | 移除WebSocket，改为事件/回调 |
| `backend/src/services/exportService.js` | `src/services/ExportService.js` | 90% | 增强docx导出 |
| `backend/src/services/documentAnalyzer.js` | `src/services/DocumentAnalyzer.js` | 80% | 移除Express依赖 |
| `frontend/src/data/soulVersionManager.js` | 可选 | 50% | 简化或移除 |

---

## 5. 开发计划（更新）

### Phase 1: 核心迁移（预计3-4天）

- [ ] 创建Skill项目骨架
- [ ] 迁移19种讨论模式配置
- [ ] 迁移35个Soul预设
- [ ] 迁移共享常量
- [ ] 实现基础CLI交互
- [ ] 实现Markdown导出

### Phase 2: 引擎重构（预计3-4天）

- [ ] 重构DebateEngine（移除WebSocket）
- [ ] 实现FlowExecutor（执行flow配置）
- [ ] 实现AI调用接口（适配外部Agent）
- [ ] 实现流式输出/整段输出
- [ ] 实现讨论状态管理

### Phase 3: 功能完善（预计2-3天）

- [ ] 实现意图澄清流程
- [ ] 实现角色配置系统
- [ ] 实现输出深度控制
- [ ] 实现Word (.docx)导出
- [ ] 实现HTML导出

### Phase 4: 可选功能（预计2-3天）

- [ ] 实现PRD文档分析（如果保留）
- [ ] 实现Soul版本管理（如果保留）
- [ ] 实现回溯验证
- [ ] 实现承诺清单

### Phase 5: 测试与文档（预计1-2天）

- [ ] 编写测试用例
- [ ] 集成测试
- [ ] 编写使用文档
- [ ] 编写Skill定义

---

## 6. 下一步行动

**等待用户确认以下5个关键问题：**

1. **API集成方式**：方式A/B/C？
2. **自动化程度**：全自动/半自动/全手动？
3. **PRD文档分析**：保留/简化/移除？
4. **Soul版本管理**：保留完整/简化/移除？
5. **实时显示**：流式输出/整段输出/进度指示？

**确认后立即开始开发！**

---

**方案版本**: v2.0
**基于代码版本**: taolun-web最新代码（2026-05-10）
**编写者**: Kimi-K2.6 (Trae IDE)
