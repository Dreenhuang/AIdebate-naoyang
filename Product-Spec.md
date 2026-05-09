# Product Spec - PRD Debate Dashboard (taolun-web)

## 项目信息
- **项目名称**: PRD Debate Dashboard (taolun-web)
- **版本**: v2.0
- **创建日期**: 2026-05-08
- **目标域名**: taolun.renrenup.cn

## 1. 产品定位

### 1.1 核心目标
为 PRD Debate (结构化产品辩论) 提供一个**实时可视化 Web Dashboard**，让用户能够：
- 直观监控辩论全过程（阶段、轮次、承诺、回溯验证）
- 自定义辩论配置（话题、角色、轮数、模型）
- 管理辩论产出文件（查看、下载、批量操作）
- 与后端 WebSocket 实时同步状态

### 1.2 目标用户
- 产品经理：使用 PRD Debate 进行产品需求辩论
- 技术负责人：参与技术方案讨论
- 团队成员：查看辩论进度和产出

## 2. 功能规格

### 2.1 核心功能模块

#### F1: 辩论配置面板
- **F1.1 话题设置**: 用户输入讨论话题（如"AI会取代人类工作吗？"）
- **F1.2 角色配置**: 
  - 设置角色数量（2-5个，默认3个）
  - 每个角色自定义名称、模型（deepseek-v4-flash/MiniMax）、soul（性格描述）
  - 默认角色：主持人(Proposer)、提案者(Reviewer)、审查者(Host)
- **F1.3 轮数设置**: 设置每阶段轮数（1-10轮，默认5轮）
- **F1.4 阶段设置**: 设置总阶段数（1-5阶段，默认5阶段）

#### F2: 实时辩论监控
- **F2.1 阶段进度条**: 可视化当前阶段/总阶段
- **F2.2 轮次指示器**: 显示当前轮次/总轮次
- **F2.3 消息流**: 实时显示各角色发言（带角色标识、阶段、轮次）
- **F2.4 承诺计数器**: 实时统计承诺数量
- **F2.5 回溯验证结果**: 显示各阶段回溯检查结果
- **F2.6 状态指示**: idle/running/completed/paused 状态显示

#### F3: 文件管理
- **F3.1 文件列表**: 显示辩论生成的文件（debate-framework.md, consensus.md, prd.md等）
- **F3.2 文件预览**: 点击文件可预览内容
- **F3.3 单文件下载**: 下载单个 .md 文件
- **F3.4 批量下载**: 多选文件打包为 zip 下载
- **F3.5 全部下载**: 一键下载所有文件
- **F3.6 多选复制**: 多选文件内容复制到剪贴板

#### F4: 控制面板
- **F4.1 开始辩论**: 启动辩论流程
- **F4.2 停止辩论**: 中断当前辩论
- **F4.3 暂停/恢复**: 暂停后继续
- **F4.4 重置**: 清空当前状态，重新开始

#### F5: WebSocket 连接管理
- **F5.1 连接状态**: 显示 WebSocket 连接状态（已连接/断开/重连中）
- **F5.2 自动重连**: 断线后自动重连
- **F5.3 心跳检测**: 定期发送心跳保活

### 2.2 AI能力需求

| AI能力 | 应用场景 | 优先级 |
|--------|---------|--------|
| 文本生成 | 各角色发言内容生成 | P0 |
| 流式输出 | 实时显示角色发言 | P0 |
| 结构化推理 | 回溯验证、承诺提取 | P1 |
| 文件生成 | PRD文档、共识文档生成 | P1 |

### 2.3 数据源

**主要数据源**: `.debate-state` 文件
- 文件位置: `debates/<slug>/.debate-state`
- 格式: YAML
- 包含字段: debate_name, current_phase, current_round, status, commitments, messages等

**辅助数据源**: WebSocket 实时推送
- 后端读取 `.debate-state` 并通过 WebSocket 广播状态变更
- 前端通过 WebSocket 接收实时更新

## 3. 用户流程

### 3.1 主流程：启动并监控辩论

```
[打开Dashboard] → [配置辩论参数] → [点击开始] → [实时监控辩论]
    ↓
[查看消息流] ← [查看承诺] ← [查看回溯结果]
    ↓
[辩论完成] → [下载产出文件]
```

### 3.2 文件管理流程

```
[辩论完成] → [查看文件列表] → [选择文件]
    ↓
[预览] / [下载] / [多选批量下载] / [复制内容]
```

### 3.3 配置流程

```
[打开配置面板] → [输入话题] → [设置角色数]
    ↓
[配置每个角色] → [设置轮数] → [保存配置]
```

## 4. 技术规格

### 4.1 技术栈
- **前端**: React 18 + Vite + TailwindCSS
- **后端**: Node.js + Express + WebSocket (ws)
- **通信**: WebSocket (实时) + REST API (文件操作)
- **部署**: Nginx 反向代理 + PM2 进程管理

### 4.2 端口分配
| 服务 | 端口 | 说明 |
|------|------|------|
| 前端开发服务器 | 9529 | Vite dev server |
| 后端 API | 9528 | Express + WebSocket |
| Nginx HTTP | 80 | 生产环境入口 |
| Nginx HTTPS | 443 | 生产环境安全入口 |

### 4.3 API 规范

**REST API**:
- `GET /api/health` - 健康检查
- `GET /api/debate/state` - 获取辩论状态
- `GET /api/debate/messages` - 获取消息列表
- `GET /api/debate/commitments` - 获取承诺列表
- `GET /api/files/list` - 获取文件列表
- `GET /api/files/download?files=a.md,b.md` - 下载文件

**WebSocket 消息**:
- `debate:start` - 开始辩论
- `debate:stop` - 停止辩论
- `debate:started` - 辩论已开始
- `debate:stopped` - 辩论已停止
- `debate:phase` - 阶段更新
- `debate:round` - 轮次更新
- `debate:message` - 新消息
- `debate:commitment` - 新承诺
- `debate:backtrack` - 回溯结果
- `debate:complete` - 辩论完成
- `system:connected` - 连接成功

## 5. 页面结构

### 5.1 页面列表

| 页面 | 路径 | 说明 |
|------|------|------|
| Dashboard | / | 主仪表盘，包含所有功能 |
| 配置面板 | /config | 辩论配置（弹窗或侧边栏） |

### 5.2 Dashboard 布局

```
┌─────────────────────────────────────────────────────────────┐
│  Header: 标题 + 连接状态指示器                                │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  配置面板     │           消息流区域                         │
│  - 话题输入   │           - 实时消息列表                      │
│  - 角色配置   │           - 角色标识/阶段/轮次                 │
│  - 轮数设置   │                                              │
│              │                                              │
├──────────────┤                                              │
│  控制按钮     │                                              │
│  - 开始       │                                              │
│  - 停止       │                                              │
│  - 重置       │                                              │
├──────────────┴──────────────────────────────────────────────┤
│  状态栏: 阶段进度 | 轮次 | 承诺数 | 回溯状态                   │
├─────────────────────────────────────────────────────────────┤
│  文件管理区域                                                │
│  - 文件列表 | 预览 | 下载 | 批量操作                          │
└─────────────────────────────────────────────────────────────┘
```

## 6. 状态管理

### 6.1 前端状态
```typescript
interface DashboardState {
  // 连接状态
  wsConnected: boolean;
  wsReconnecting: boolean;
  
  // 辩论状态
  debateStatus: 'idle' | 'running' | 'completed' | 'paused';
  currentPhase: number;
  currentRound: number;
  totalPhases: number;
  totalRounds: number;
  
  // 数据
  messages: Message[];
  commitments: Commitment[];
  files: FileItem[];
  
  // 配置
  config: DebateConfig | null;
}
```

### 6.2 后端状态
```typescript
interface DebateState {
  status: string;
  currentPhase: number;
  currentRound: number;
  totalPhases: number;
  totalRounds: number;
  commitments: Commitment[];
  messages: Message[];
  config: DebateConfig | null;
}
```

## 7. 非功能需求

### 7.1 性能
- 首屏加载 < 3s
- WebSocket 延迟 < 100ms
- 消息渲染流畅，无卡顿

### 7.2 兼容性
- Chrome 90+, Firefox 88+, Safari 14+
- 响应式布局，支持 1280x720 及以上分辨率

### 7.3 安全
- 生产环境强制 HTTPS
- WebSocket 使用 WSS
- API 请求防 CSRF

## 8. 部署需求

### 8.1 服务器配置
- 腾讯云服务器
- 域名: taolun.renrenup.cn
- SSL: Let's Encrypt 证书

### 8.2 部署方式
- 前端: 静态文件通过 Nginx 服务
- 后端: PM2 管理 Node.js 进程
- 自动化: 部署脚本一键部署

## 9. 项目结构

```
taolun-web/
├── frontend/              # React前端
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── hooks/         # 自定义Hooks
│   │   ├── stores/        # 状态管理
│   │   ├── utils/         # 工具函数
│   │   ├── App.jsx        # 主应用
│   │   └── main.jsx       # 入口
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/               # Node.js后端
│   ├── src/
│   │   ├── routes/        # API路由
│   │   ├── services/      # 业务逻辑
│   │   ├── websocket/     # WebSocket处理
│   │   └── index.js       # 入口
│   └── package.json
├── deploy/                # 部署脚本
│   ├── nginx-config.conf
│   ├── deploy.sh
│   └── ...
├── .env                   # 环境变量
└── README.md
```

## 10. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| WebSocket连接不稳定 | 高 | 实现自动重连机制 |
| 大量消息渲染卡顿 | 中 | 虚拟滚动、消息节流 |
| 文件下载超时 | 中 | 分片下载、进度提示 |
| 后端服务崩溃 | 高 | PM2自动重启、健康检查 |
