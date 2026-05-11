# 🧠 脑痒 - PRD辩论系统

> 脑痒是长脑子的前兆 - 多AI深度讨论系统

## 📋 项目简介

**脑痒**是一款专业的PRD辩论系统，支持多种讨论模式、AI角色预设、流式输出、实时状态显示、阶段共识生成和报告导出功能。

### 核心特性

- 🎯 **19种讨论模式** - 从一对一问答到多AI协同，满足各类场景
- 👥 **AI角色预设** - 37种预设人格，覆盖主持人、提案者、审查者等角色
- ⚡ **流式输出** - 实时展示AI思考过程，无需等待
- 📊 **阶段共识** - 自动生成各阶段讨论总结和核心承诺
- 📄 **多种导出格式** - 支持 .docx、.md 等格式
- 🎉 **完成提醒** - 浏览器通知 + 动画效果 + 下载弹窗

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- Bun >= 1.0.0 (推荐)
- npm >= 9.0.0

### 安装步骤

```bash
# 1. 安装后端依赖
cd backend
npm install

# 2. 安装前端依赖
cd ../frontend
npm install
# 或使用 bun
bun install

# 3. 配置API密钥
# 在 backend 目录创建 .env 文件：
DEEPSEEK_API_KEY=your_api_key_here
MINIMAX_API_KEY=your_api_key_here

# 4. 启动后端服务
cd backend
node src/index.js

# 5. 启动前端服务 (新终端)
cd frontend
bun run dev
# 或
npm run dev
```

### 访问地址

- 前端界面: http://localhost:9529/
- 后端API: http://localhost:9528/

---

## 🎯 使用指南

### 1. 选择讨论模式

系统支持19种讨论模式，分为6大类：

| 类别 | 模式数量 | 说明 |
|------|---------|------|
| 一对一双向商量 | 3种 | 自由对话、追问链式、互补补充 |
| 多人圆桌合议 | 5种 | 圆桌研讨、轮值发言、分维度拆解等 |
| 正式对抗辩论 | 4种 | 标准辩论、三角制衡、反驳评审等 |
| 决策辅助 | 2种 | 提问防御、提案表决 |
| 头脑风暴 | 2种 | 创意风暴、思想接龙 |
| 多AI协同 | 3种 | 主从补充、并行生成、角色模拟 |

### 2. 配置AI角色

- **Soul预设**: 每个角色可选择预设人格（逻辑严谨型、创新激进型、风险意识型等）
- **随机Soul**: 一键随机分配角色人格
- **自定义**: 支持手动编辑角色名称、描述和模型

### 3. 设置输出深度

| 深度级别 | 字数范围 | 适用场景 |
|---------|---------|---------|
| 简短讨论 | 150-500字/轮 | 快速头脑风暴 |
| 深入讨论 | 500-1000字/轮 | 平衡深度与效率 ⭐推荐 |
| 详细研究 | 1000-2000字/轮 | 专业分析场景 |

### 4. 开始讨论

1. 输入讨论话题
2. 配置角色和模式
3. 点击"开始讨论"
4. 实时观看AI辩论过程
5. 讨论完成后自动弹出下载提示

---

## 📁 项目结构

```
taolun-web/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── constants/         # 常量定义
│   │   ├── routes/            # API路由
│   │   ├── services/          # 核心服务
│   │   │   ├── debateEngine.js # 辩论引擎
│   │   │   ├── exportService.js # 导出服务
│   │   │   └── documentAnalyzer.js # 文档分析
│   │   └── websocket/          # WebSocket处理
│   └── package.json
│
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── components/         # React组件
│   │   │   ├── ConfigPanel.jsx      # 配置面板
│   │   │   ├── MessageStream.jsx    # 消息流
│   │   │   ├── ConsensusPanel.jsx     # 共识面板
│   │   │   ├── DownloadCompleteDialog.jsx # 下载弹窗
│   │   │   └── ...
│   │   ├── stores/            # 状态管理 (Zustand)
│   │   ├── hooks/             # 自定义Hooks
│   │   ├── data/              # 数据配置
│   │   │   ├── discussionModes.js    # 19种讨论模式
│   │   │   └── soulPresets.js       # 37种角色预设
│   │   └── themes/            # 主题系统
│   └── package.json
│
└── docs/                      # 开发文档
```

---

## 🔧 技术栈

### 后端

- **Express.js** - Web框架
- **WebSocket** - 实时通信
- **DeepSeek API** - LLM调用
- **docx** - Word文档生成
- **CORS** - 跨域支持

### 前端

- **React 18** - UI框架
- **Vite** - 构建工具
- **Zustand** - 状态管理
- **TailwindCSS** - 样式框架
- **Lucide** - 图标库

---

## 📖 API接口

### 辩论相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/debate/start` | POST | 开始新辩论 |
| `/api/debate/stop` | POST | 停止辩论 |
| `/api/debate/reset` | POST | 重置辩论 |

### 导出相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/exports/docx` | POST | 导出Word文档 |
| `/api/exports/markdown` | POST | 导出Markdown |
| `/api/exports/list` | GET | 获取导出列表 |

### Soul预设

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/souls/list` | GET | 获取预设列表 |
| `/api/souls/create` | POST | 创建预设 |
| `/api/souls/update` | POST | 更新预设 |
| `/api/souls/delete` | POST | 删除预设 |

---

## 🎨 配置选项

### 讨论模式配置示例

```javascript
// 19种模式任选其一
const mode = 'standard-debate'; // 标准正反方辩论赛制

// 配置输出深度
const depth = 'normal'; // 深入讨论 (500-1000字/轮)

// 配置角色
const roles = [
  { name: '主持人', roleType: 'host', soulPresetId: 'host-neutral' },
  { name: '正方', roleType: 'proposer', soulPresetId: 'proposer-theoretical' },
  { name: '反方', roleType: 'reviewer', soulPresetId: 'reviewer-detailed' },
];
```

---

## 🔐 环境变量

### 后端 (.env)

```bash
# API配置
DEEPSEEK_API_KEY=your_deepseek_api_key
MINIMAX_API_KEY=your_minimax_api_key

# 服务配置
PORT=9528
NODE_ENV=development

# 前端 (.env.production)
VITE_API_URL=http://localhost:9528
VITE_WS_URL=ws://localhost:9528
```

---

## 📝 开发指南

### 添加新讨论模式

1. 在 `frontend/src/data/discussionModes.js` 中添加模式定义
2. 配置 `defaultRoles` 数组定义角色
3. 如需特殊流程，配置 `flow` 数组

### 添加新Soul预设

1. 在 `frontend/src/data/soulPresets.js` 中添加预设
2. 配置 `name`, `description`, `difficulty`, `soul` 字段
3. 选择合适的 `roleType` (host/proposer/reviewer等)

### 自定义主题

1. 在 `frontend/src/themes/` 下创建新主题
2. 配置 `tokens.css` 定义设计变量
3. 在 `ThemeSelector.jsx` 中注册新主题

---

## 🐛 调试指南

### 常见问题

**Q: 导出功能无响应？**
A: 检查后端是否正常运行，查看浏览器控制台错误信息

**Q: 流式输出中断？**
A: 检查网络连接，确认API配额充足

**Q: 角色预设无法加载？**
A: 确认soulPresets.js数据文件格式正确

### 日志查看

- 前端: 浏览器控制台 (F12)
- 后端: 终端输出
- WebSocket: 标记为 `[WebSocket]` 的日志

---

## 🚢 部署

### Docker部署

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 9528
CMD ["node", "src/index.js"]
```

### Nginx配置

参考 `deploy/nao-nginx.conf` 文件

---

## 📄 许可证

本项目仅供学习和研究使用。

---

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

---

## 📞 联系方式

- 作者: Boss Team
- 邮箱: support@example.com

---

**版本**: V3.0.0  
**更新日期**: 2026-05-11  
**状态**: ✅ 上线版本
