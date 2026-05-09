# 多AI讨论技能 - 原理分析报告

> **报告版本**: v2.0.0  
> **分析日期**: 2024年  
> **分析范围**: taolun-web 全栈架构

---

## 目录

1. [技能概述](#1-技能概述)
2. [整体架构](#2-整体架构)
3. [核心模块详解](#3-核心模块详解)
4. [关键算法与逻辑](#4-关键算法与逻辑)
5. [触发机制与交互流程](#5-触发机制与交互流程)
6. [功能优化方案](#6-功能优化方案)
7. [创新用途扩展](#7-创新用途扩展)
8. [代码修改建议](#8-代码修改建议)

---

## 1. 技能概述

### 1.1 核心定位

"多AI讨论"技能是一个基于PRD辩论框架的智能讨论系统，通过多角色AI协同，实现深度讨论和PRD文档评审。

**核心价值**：
- 多角色AI协同讨论
- 实时可视化辩论进度
- 灵活的Soul灵魂设定
- 完整的文档分析能力

### 1.2 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端框架 | React 18 + Vite | 现代化前端开发框架 |
| UI样式 | TailwindCSS | 原子化CSS框架 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 后端框架 | Express.js | Node.js Web框架 |
| 实时通信 | WebSocket (ws) | 双向实时通信 |
| AI模型 | DeepSeek V4 Flash / MiniMax | 多模型支持 |

---

## 2. 整体架构

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端 (React)                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Header   │  │ConfigPanel│  │MessageStrm│  │ StatusBar│     │
│  │ 连接状态  │  │角色配置  │  │消息流    │  │进度跟踪  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              SoulManager (Soul预设管理系统)                │   │
│  │         8套预设 × 3角色 = 24个Soul模板                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    useWebSocket Hook                      │   │
│  │              自动重连 / 消息订阅 / 状态同步               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │ WebSocket                            │
└───────────────────────────┼───────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        后端 (Node.js)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ HTTP Server   │  │WebSocket Server│ │  File Upload │       │
│  │  (Express)    │  │    (ws)       │  │ (Multer)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    DebateService                          │   │
│  │  • 辩论状态管理  • 消息广播  • 阶段控制  • Soul管理      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               DocumentAnalyzer                            │   │
│  │  • PRD特征识别  • 专家推荐  • 配置生成                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
taolun-web/
├── frontend/                          # 前端应用
│   ├── src/
│   │   ├── components/               # React组件
│   │   │   ├── Header.jsx           # 连接状态显示
│   │   │   ├── ConfigPanel.jsx      # 配置面板
│   │   │   ├── RoleCard.jsx         # 角色卡片
│   │   │   ├── MessageStream.jsx    # 消息流
│   │   │   ├── MessageBubble.jsx    # 消息气泡
│   │   │   ├── StatusBar.jsx        # 状态栏
│   │   │   ├── FileManager.jsx      # 文件管理
│   │   │   └── SoulManager.jsx      # Soul管理
│   │   ├── hooks/
│   │   │   └── useWebSocket.js      # WebSocket Hook
│   │   ├── stores/
│   │   │   └── debateStore.js       # Zustand状态管理
│   │   ├── data/
│   │   │   └── soulPresets.js        # Soul预设数据
│   │   ├── App.jsx                  # 主应用
│   │   └── main.jsx                  # 入口
│   └── package.json
│
├── backend/                          # 后端应用
│   ├── src/
│   │   ├── routes/                   # API路由
│   │   │   ├── debate.js            # 辩论状态API
│   │   │   ├── files.js             # 文件管理API
│   │   │   ├── documents.js         # 文档分析API
│   │   │   └── souls.js             # Soul管理API
│   │   ├── services/                 # 业务逻辑
│   │   │   ├── debateService.js     # 辩论服务
│   │   │   └── documentAnalyzer.js   # 文档分析引擎
│   │   ├── websocket/
│   │   │   └── handler.js            # WebSocket处理器
│   │   └── index.js                  # 入口
│   └── package.json
│
└── deploy/                           # 部署配置
    ├── nginx-config.conf
    └── deploy.sh
```

---

## 3. 核心模块详解

### 3.1 前端模块

#### 3.1.1 DebateStore (状态管理)

**文件位置**: `frontend/src/stores/debateStore.js`

**核心功能**:
- 辩论状态管理（idle/running/completed/paused）
- 消息列表管理
- 角色配置管理
- Soul预设管理
- WebSocket连接状态

**关键状态**:
```javascript
{
  wsConnected: boolean,          // WebSocket连接状态
  debateStatus: 'idle',         // 辩论状态
  currentPhase: 0,              // 当前阶段
  currentRound: 0,              // 当前轮次
  messages: [],                 // 消息列表
  commitments: [],               // 承诺列表
  config: {                     // 辩论配置
    topic: '',                 // 话题
    roles: [],                 // 角色列表
    roundsPerPhase: 5,          // 每阶段轮数
    totalPhases: 5              // 总阶段数
  }
}
```

#### 3.1.2 useWebSocket (实时通信Hook)

**文件位置**: `frontend/src/hooks/useWebSocket.js`

**核心功能**:
- WebSocket连接管理
- 自动重连机制（最多5次，间隔3秒）
- 消息订阅与分发
- 状态同步

**重连算法**:
```javascript
const RECONNECT_DELAY = 3000;  // 重连间隔
const MAX_RECONNECT = 5;        // 最大重连次数

// 指数退避重连策略
setTimeout(() => {
  reconnectCount++;
  connect();
}, RECONNECT_DELAY * Math.min(reconnectCount, 3));
```

#### 3.1.3 SoulManager (Soul管理系统)

**文件位置**: `frontend/src/components/SoulManager.jsx`

**核心功能**:
- Soul预设查看
- 自定义Soul创建/编辑/删除
- 角色类型分组
- 难度等级标识

**数据结构**:
```javascript
{
  id: 'host-socratic',          // 唯一标识
  name: '苏格拉底式引导者',       // 显示名称
  description: '通过提问引导...', // 简短描述
  soul: '你是一位苏格拉底式...',  // 完整Soul内容
  tags: ['提问引导', '哲学思维'], // 标签
  difficulty: 'advanced'         // 难度等级
}
```

### 3.2 后端模块

#### 3.2.1 DocumentAnalyzer (文档分析引擎)

**文件位置**: `backend/src/services/documentAnalyzer.js`

**核心功能**:
1. **PRD特征识别** - 通过关键词权重分析识别PRD文档
2. **专家推荐** - 根据文档内容推荐合适的专家角色
3. **配置生成** - 自动生成辩论配置

**PRD特征识别算法**:
```javascript
// 特征权重评分
const FEATURE_WEIGHTS = {
  high: 3,    // 高权重特征：需求文档、PRD等
  medium: 1,   // 中权重特征：功能、模块等
  low: 0.5    // 低权重特征：设计、开发等
};

// 结构特征检测
const STRUCTURE_PATTERNS = [
  /第[一二三四五六七八九十]+章/,  // 章节结构
  /^\d+\.\d+[\s、]/m,           // 编号结构
  /需求编号/,                     // PRD特有标记
  /验收标准/,                     // PRD必需项
];
```

**专家角色匹配算法**:
```javascript
function recommendExperts(analysis, content) {
  // 计算每个专家的匹配分数
  PRD_EXPERT_ROLES.forEach(expert => {
    let matchScore = 0;
    expert.triggers.forEach(trigger => {
      if (content.includes(trigger)) {
        matchScore += 2;
      }
    });
    // 匹配分数 >= 2 时推荐该专家
  });
}
```

#### 3.2.2 DebateService (辩论服务)

**文件位置**: `backend/src/services/debateService.js`

**核心功能**:
1. 辩论生命周期管理
2. 消息队列管理
3. 阶段/轮次控制
4. 状态持久化
5. Soul预设CRUD

**辩论状态机**:
```
         ┌─────────┐
         │  idle   │ ←──────────────┐
         └────┬────┘                 │
              │ start                │
              ▼                      │
    ┌─────────────────┐              │
    │    running      │              │
    └────────┬────────┘              │
             │ stop                  │
             ▼                      │
    ┌─────────────────┐              │
    │   completed     │──────────────┘
    └─────────────────┘   reset
```

#### 3.2.3 WebSocketHandler (实时通信处理器)

**文件位置**: `backend/src/websocket/handler.js`

**核心功能**:
- 客户端连接管理
- 消息路由
- 广播通信
- 状态同步

**消息协议**:
```javascript
// 客户端 → 服务端
{ type: 'debate:start', payload: { config } }
{ type: 'debate:stop' }
{ type: 'debate:reset' }

// 服务端 → 客户端
{ type: 'system:connected', payload: { timestamp } }
{ type: 'debate:started', payload: { timestamp } }
{ type: 'debate:phase', payload: 1 }
{ type: 'debate:round', payload: 1 }
{ type: 'debate:message', payload: { role, content, phase, round } }
{ type: 'debate:completed', payload: { timestamp } }
```

---

## 4. 关键算法与逻辑

### 4.1 Soul随机分配算法

**文件位置**: `frontend/src/stores/debateStore.js`

```javascript
function getRandomSoulPreset(roleType) {
  const presets = soulPresets[roleType] || [];
  if (presets.length === 0) return null;
  
  // 均匀随机选择
  const index = Math.floor(Math.random() * presets.length);
  return presets[index];
}

// 应用到所有角色
function randomizeAllSouls() {
  set(state => ({
    config: {
      ...state.config,
      roles: state.config.roles.map(r => {
        const randomPreset = getRandomSoulPreset(r.roleType || 'host');
        return randomPreset
          ? { ...r, soul: randomPreset.soul, soulPresetId: randomPreset.id, name: randomPreset.name }
          : r;
      })
    }
  }));
}
```

### 4.2 PRD文档类型识别算法

**文件位置**: `backend/src/services/documentAnalyzer.js`

```javascript
function analyzeDocument(fileName, content) {
  let score = 0;
  const detectedFeatures = [];
  
  // 高权重特征检测
  PRD_FEATURES_CN.high.forEach(keyword => {
    if (content.includes(keyword)) {
      score += 3;  // 权重3
      detectedFeatures.push(keyword);
    }
  });
  
  // 中权重特征检测
  PRD_FEATURES_CN.medium.forEach(keyword => {
    if (content.includes(keyword)) {
      score += 1;  // 权重1
      detectedFeatures.push(keyword);
    }
  });
  
  // 结构特征检测
  PRD_STRUCTURE_PATTERNS.forEach(pattern => {
    if (pattern.test(content)) {
      score += 2;  // 权重2
    }
  });
  
  // 文件名加权
  if (fileName.includes('prd') || fileName.includes('需求')) {
    score += 5;  // 文件名包含关键词，加权5
  }
  
  // 归一化置信度
  const confidence = Math.min(score / (maxPossibleScore * 0.4), 0.98);
  
  return {
    type: confidence >= 0.2 ? 'prd' : 'general',
    confidence,
    score,
    features: detectedFeatures.slice(0, 10),
  };
}
```

### 4.3 WebSocket自动重连算法

**文件位置**: `frontend/src/hooks/useWebSocket.js`

```javascript
// 重连状态机
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT = 5;

function attemptReconnect() {
  if (reconnectCount.current >= MAX_RECONNECT) {
    console.log('[WebSocket] Max reconnect attempts reached');
    return;
  }
  
  reconnectCount.current++;
  setWsReconnecting(true);
  
  // 使用定时器延迟重连
  reconnectTimer.current = setTimeout(() => {
    connect();
  }, RECONNECT_DELAY);
}

// 连接状态检测
ws.onclose = () => {
  setWsConnected(false);
  attemptReconnect();
};

ws.onerror = (error) => {
  console.error('[WebSocket] Error:', error);
  // 触发重连
  attemptReconnect();
};
```

---

## 5. 触发机制与交互流程

### 5.1 启动流程

```
用户双击启动器
      │
      ▼
┌─────────────────────────────────┐
│ 1. 端口检测与清理               │
│    netstat → taskkill           │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 2. 启动后端服务 (端口9528)       │
│    node src/index.js            │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 3. 启动前端服务 (端口9516)       │
│    npm run dev                  │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 4. 打开浏览器                    │
│    http://localhost:9516        │
└─────────────────────────────────┘
```

### 5.2 辩论交互流程

```
用户输入话题 → 配置角色 → 点击"开始辩论"
      │
      ▼
┌─────────────────────────────────┐
│ WebSocket发送: debate:start     │
│ { type: 'debate:start',         │
│   payload: { topic, roles, ... }│
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 后端处理:                       │
│ 1. DebateService.startDebate() │
│ 2. 初始化辩论状态               │
│ 3. 广播: debate:started        │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 模拟辩论循环:                   │
│ 每2秒生成一条消息               │
│ 按阶段/轮次推进                │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ WebSocket推送: debate:message   │
│ { type: 'debate:message',      │
│   payload: { role, content,    │
│              phase, round } }  │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 前端处理:                       │
│ useDebateStore.addMessage()     │
│ → 更新UI消息列表                │
│ → 滚动到底部                   │
└─────────────────────────────────┘
```

### 5.3 Soul预设选择流程

```
用户展开角色卡片
      │
      ▼
┌─────────────────────────────────┐
│ 点击"选择预设"                  │
│ → 显示Soul预设列表              │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 用户选择预设                     │
│ → applySoulPreset(roleId, preset)│
│ → 更新角色的soul和name          │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 状态同步:                       │
│ → role.soul 更新               │
│ → role.soulPresetId 更新       │
│ → role.name 更新（可选）       │
└─────────────────────────────────┘
```

---

## 6. 功能优化方案

### 6.1 方案一：流式输出优化

**问题**: 当前消息是整体推送，用户等待时间长

**解决方案**: 实现SSE (Server-Sent Events) 流式输出

```javascript
// 后端实现
app.get('/api/stream/:debateId', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // 流式发送AI响应片段
  aiStream.on('chunk', (chunk) => {
    res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
  });
  
  aiStream.on('end', () => {
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  });
});

// 前端实现
const eventSource = new EventSource(`/api/stream/${debateId}`);
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'chunk') {
    appendChunk(data.content);
  } else if (data.type === 'done') {
    eventSource.close();
  }
};
```

**预期效果**: 首字节时间 < 500ms，显著提升用户体验

### 6.2 方案二：辩论历史回放

**问题**: 无法回看历史辩论，经验难以积累

**解决方案**: 实现辩论录制与回放系统

```javascript
// 录制服务
class DebateRecorder {
  constructor() {
    this.sessions = new Map();
  }
  
  startRecording(debateId) {
    this.sessions.set(debateId, {
      startTime: Date.now(),
      messages: [],
      config: null,
    });
  }
  
  recordMessage(debateId, message) {
    const session = this.sessions.get(debateId);
    session.messages.push({
      ...message,
      offset: Date.now() - session.startTime,
    });
  }
  
  async saveRecording(debateId) {
    const session = this.sessions.get(debateId);
    await fs.writeFile(
      `recordings/${debateId}.json`,
      JSON.stringify(session, null, 2)
    );
  }
  
  // 回放功能
  async playback(debateId, speed = 1) {
    const session = await this.loadRecording(debateId);
    for (const msg of session.messages) {
      await sleep(msg.offset / speed);
      emitMessage(msg);
    }
  }
}
```

**功能点**:
- 辩论自动录制
- 时间轴回放控制
- 关键节点标记
- 分享回放链接

### 6.3 方案三：智能摘要生成

**问题**: 辩论结果缺乏结构化总结

**解决方案**: 辩论结束后自动生成多维度摘要

```javascript
async function generateDebateSummary(debateId) {
  const debate = await debateService.getDebate(debateId);
  
  // 调用AI生成摘要
  const summaryPrompt = `
    请分析以下辩论内容，生成结构化摘要：
    
    话题：${debate.config.topic}
    参与角色：${debate.roles.map(r => r.name).join(', ')}
    消息数量：${debate.messages.length}
    
    消息内容：
    ${debate.messages.map(m => `[${m.role}]: ${m.content}`).join('\n')}
    
    请生成：
    1. 核心观点汇总（各方立场）
    2. 主要分歧点
    3. 共识与结论
    4. 待解决问题
    5. 建议的后续行动
  `;
  
  const response = await callAI(summaryPrompt);
  return parseSummaryResponse(response);
}
```

---

## 7. 创新用途扩展

### 7.1 产品需求评审自动化

**场景**: 产品经理撰写PRD后，自动邀请AI专家团队评审

**配置**:
```javascript
{
  topic: '新版用户中心PRD评审',
  roles: [
    { name: '产品经理专家', model: 'deepseek-v4-flash', soul: '...' },
    { name: 'UI/UX设计专家', model: 'minimax', soul: '...' },
    { name: '技术架构专家', model: 'deepseek-v4-flash', soul: '...' },
    { name: '测试专家', model: 'deepseek-v4-flash', soul: '...' },
    { name: '项目管理专家', model: 'deepseek-v4-flash', soul: '...' },
  ],
  document: prdContent
}
```

**流程**:
1. 上传PRD文档
2. 系统自动识别文档类型
3. 推荐合适的专家角色
4. 一键启动多角色评审
5. 生成评审报告

### 7.2 代码审查讨论

**场景**: 团队成员对代码方案有分歧，邀请AI主持讨论

**配置**:
```javascript
{
  topic: '微服务拆分方案评审',
  roles: [
    { name: '系统架构师', soul: '强调可扩展性和技术债务' },
    { name: '运维工程师', soul: '关注部署复杂度和运维成本' },
    { name: '安全专家', soul: '审查安全风险和合规要求' },
  ],
  context: codeDiffContent
}
```

### 7.3 商业决策辩论

**场景**: 管理层对战略方向有不同意见，AI协助理性辩论

**配置**:
```javascript
{
  topic: '是否进入东南亚市场',
  roles: [
    { name: '战略顾问', soul: '激进扩张派' },
    { name: '风险控制官', soul: '稳健保守派' },
    { name: '财务分析师', soul: '数据驱动派' },
  ],
  constraint: {
    budget: 5000000,
    timeline: '12个月',
    riskAppetite: '中等'
  }
}
```

### 7.4 法律案例辩论

**场景**: 律师准备诉讼策略，AI模拟法庭辩论

**配置**:
```javascript
{
  topic: '知识产权侵权案件策略',
  roles: [
    { name: '主诉律师', soul: '攻击型策略' },
    { name: '被告代理', soul: '防守型策略' },
    { name: '法官角色', soul: '中立质疑型' },
  ],
  evidence: caseEvidence
}
```

### 7.5 教育场景应用

**场景**: 学生辩论文史哲话题，AI担任裁判和导师

**配置**:
```javascript
{
  topic: '人工智能是否会取代艺术家',
  roles: [
    { name: '正方辩手', soul: '技术乐观主义' },
    { name: '反方辩手', soul: '人文关怀主义' },
    { name: '裁判导师', soul: '启发式引导' },
  ],
  academicLevel: '高中',
  scoringCriteria: ['逻辑性', '证据充分性', '表达清晰度']
}
```

---

## 8. 代码修改建议

### 8.1 添加流式输出支持

**修改文件**: `backend/src/services/debateService.js`

```javascript
// 添加流式输出方法
async startStreamingDebate(config, ws) {
  this.debateState = {
    status: 'running',
    currentPhase: 1,
    currentRound: 1,
    config,
    messages: [],
  };

  // 通知开始
  ws.send(JSON.stringify({ type: 'debate:started' }));

  // 流式生成每条消息
  for (const role of config.roles) {
    const stream = await this.callAIModel(role, config.topic);
    
    let content = '';
    for await (const chunk of stream) {
      content += chunk;
      // 实时推送每个chunk
      ws.send(JSON.stringify({
        type: 'debate:chunk',
        payload: { role: role.name, content: chunk }
      }));
    }
    
    // 消息完成
    this.addMessage({ role: role.name, content });
    ws.send(JSON.stringify({
      type: 'debate:message',
      payload: { role: role.name, content }
    }));
  }
}
```

### 8.2 添加辩论录制功能

**修改文件**: `backend/src/services/debateService.js`

```javascript
class DebateService {
  constructor() {
    // ... 现有代码 ...
    this.recorder = new DebateRecorder();
  }
  
  async startDebate(config) {
    // 开始录制
    this.recorder.startRecording(this.generateDebateId());
    // ... 现有逻辑 ...
  }
  
  addMessage(message) {
    // 录制消息
    this.recorder.recordMessage(this.currentDebateId, message);
    // ... 现有逻辑 ...
  }
  
  async saveDebate() {
    // 保存录制
    await this.recorder.saveRecording(this.currentDebateId);
  }
}
```

### 8.3 添加WebSocket心跳检测

**修改文件**: `backend/src/websocket/handler.js`

```javascript
class WebSocketHandler {
  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      // 现有连接逻辑...
      
      // 添加心跳
      ws.isAlive = true;
      ws.on('pong', () => { ws.isAlive = true; });
    });
    
    // 心跳检测interval
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }
  
  // 清理心跳
  close() {
    clearInterval(this.heartbeatInterval);
  }
}
```

### 8.4 添加Redis缓存支持

**修改文件**: `backend/src/services/debateService.js`

```javascript
const Redis = require('ioredis');

// 添加Redis缓存
class DebateService {
  constructor() {
    // ... 现有代码 ...
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  async cacheState() {
    const key = `debate:${this.currentDebateId}`;
    await this.redis.setex(key, 3600, JSON.stringify(this.debateState));
  }
  
  async loadCachedState(debateId) {
    const key = `debate:${debateId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  // 定期缓存
  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      if (this.debateState.status === 'running') {
        this.cacheState();
      }
    }, 60000); // 每分钟自动保存
  }
}
```

---

## 附录

### A. API接口清单

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| GET | /api/debate/state | 获取辩论状态 |
| GET | /api/debate/messages | 获取消息列表 |
| GET | /api/debate/commitments | 获取承诺列表 |
| GET | /api/souls | 获取所有自定义Soul |
| GET | /api/souls/:roleType | 按角色类型获取Soul |
| POST | /api/souls/:roleType | 添加自定义Soul |
| PUT | /api/souls/:roleType/:soulId | 更新Soul |
| DELETE | /api/souls/:roleType/:soulId | 删除Soul |
| GET | /api/files/list | 获取文件列表 |
| GET | /api/files/download | 下载文件 |

### B. WebSocket消息类型

| 类型 | 方向 | 说明 |
|------|------|------|
| system:connected | 服务端→客户端 | 连接成功 |
| debate:started | 服务端→客户端 | 辩论开始 |
| debate:phase | 服务端→客户端 | 阶段更新 |
| debate:round | 服务端→客户端 | 轮次更新 |
| debate:message | 服务端→客户端 | 新消息 |
| debate:commitment | 服务端→客户端 | 承诺更新 |
| debate:completed | 服务端→客户端 | 辩论完成 |
| debate:start | 客户端→服务端 | 开始辩论 |
| debate:stop | 客户端→服务端 | 停止辩论 |
| debate:reset | 客户端→服务端 | 重置辩论 |

### C. Soul预设统计

| 角色类型 | 预设数量 | 难度分布 |
|---------|---------|---------|
| 主持人 (Host) | 8 | 入门1 / 中级2 / 高级3 / 专家2 |
| 提案者 (Proposer) | 8 | 入门1 / 中级3 / 高级3 / 专家1 |
| 审查者 (Reviewer) | 8 | 入门1 / 中级3 / 高级2 / 专家2 |
| **总计** | **24** | - |

---

**报告编制**: AI Assistant  
**最后更新**: 2024年  
**文档版本**: v2.0.0
