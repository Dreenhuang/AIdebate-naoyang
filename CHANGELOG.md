# 📋 更新日志 (CHANGELOG)

## [V3.0.0] - 2026-05-11 - 上线版本

### 🎉 新增功能

#### 1. 讨论总结卡片和阶段共识优化 (P1)
- **后端**: 新增 `generateSimpleConsensusSummary()` 函数，自动生成有意义的共识摘要
  - 统计参与角色数、消息数
  - 区分正反方观点数量
  - 提取核心承诺和主要观点
- **后端**: 新增 `generateRoleSummaries()` 函数，为每轮每角色生成独立摘要
- **前端**: ConsensusPanel 组件重构
  - 显示**所有阶段共识**而非只显示最新一个
  - 可折叠的阶段列表设计
  - 显示各角色发言统计（消息数、总字数）
  - 显示各阶段核心承诺列表

#### 2. 状态栏实时更新修复 (P2)
- **Store**: 新增 `setPhases()` action 设置辩论阶段
- **WebSocket**: 修复 `debate:started` 事件，正确设置 phases 数组
- **组件**: StatusBar 和 DebateStatusBar 现在能实时显示实际辩论进度

#### 3. 导出.docx功能增强 (P3)
- **后端**: body大小限制从 50MB 提升到 500MB
- **前端**: DownloadCompleteDialog 完全重构
  - 使用 `useDebateStore.getState()` 直接获取最新数据
  - 添加详细调试日志
  - 更好的错误处理和提示
  - 支持 .docx 和 .md 两种格式导出

#### 4. 讨论完成多重提醒机制 (P4)
- **App.jsx**: 添加浏览器 Notification API 集成
  - 自动请求通知权限
  - 讨论完成时发送系统通知
  - 通知内容："🎉 讨论已完成！辩论已顺利完成，点击下载完整报告。"

#### 5. 讨论结束弹出下载窗口 (P5)
- **新建组件**: `DownloadCompleteDialog.jsx`
  - 🎨 美观的讨论完成弹窗设计
  - 📊 显示讨论统计（话题、轮次、消息数、共识数）
  - 💾 一键下载 .docx 报告按钮
  - 📝 同时支持下载 Markdown 格式
  - 🎭 遮罩层 + 居中弹窗动画
  - ⏰ "稍后再说"延迟选项

---

### 🔧 功能修复

#### 1. TimelineView 崩溃问题
- **文件**: `MessageStream.jsx`
- **问题**: `buildTimelineItems()` 返回 undefined 导致 `.map()` 崩溃
- **修复**: 
  - 添加 `try-catch` 错误处理
  - 添加 `Array.isArray()` 空值保护
  - 确保所有数组操作前进行类型检查

#### 2. actorType.toLowerCase 错误
- **文件**: `debateEngine.js`
- **问题**: `actorType` 和 `roleType` 参数可能是 undefined 或非字符串
- **修复**:
  - 使用 `typeof actorType === 'string'` 进行类型检查
  - 使用 `String(actorType || '')` 安全转换
  - 修复 `executeSpecificActor()` 和 `getRole()` 函数

#### 3. 讨论模式角色Soul配置
- **文件**: `discussionModes.js`
- **问题**: 19个讨论模式使用了大量 soulPresets 不支持的 roleType
- **修复**:
  - 新增 `ROLE_TYPE_MAP` 角色类型映射系统
  - 新增 `MODE_DEFAULT_SOULS` 默认Soul配置
  - 修复 `getMappedRoleType()` 辅助函数

---

### ✨ 优化改进

#### 1. Header副标题对齐
- **文件**: `Header.jsx`
- **修改**: 
  - 副标题文字改为"脑痒痒是长脑子的前兆"
  - 使用 `items-end` 实现下端对齐
  - 网站名称字体升级为 `text-h3`

#### 2. 输出深度规范调整
- **文件**: `discussionModes.js`
- **修改**:
  - 简短讨论: 50-150字 → **150-500字/轮**
  - 深入讨论: 200-500字 → **500-1000字/轮**
  - 详细研究: 800-2000字 → **1000-2000字/轮**

#### 3. Soul预设功能
- **文件**: `RoleCard.jsx`, `ConfigPanel.jsx`, `debateStore.js`
- **优化**:
  - 所有 `.map()` 调用添加 `Array.isArray()` 检查
  - `preset.name` 和 `preset.description` 添加默认值
  - `preset.tags` 添加空值保护
  - 角色切换时正确应用推荐默认Soul

---

### 📦 依赖更新

| 包名 | 版本 | 说明 |
|------|------|------|
| express | ^4.18.x | 后端框架 |
| docx | ^8.x | Word文档生成 |
| zustand | ^4.x | 状态管理 |
| tailwindcss | ^3.x | 样式框架 |
| vite | ^6.x | 构建工具 |

---

### 🗂️ 文件变更统计

| 类型 | 数量 |
|------|------|
| 新增文件 | 1 |
| 修改文件 | 12 |
| 删除文件 | 0 |

#### 新增文件
- `frontend/src/components/DownloadCompleteDialog.jsx` - 讨论完成下载弹窗组件

#### 修改文件
- `backend/src/index.js` - body大小限制提升
- `backend/src/services/debateEngine.js` - 类型安全修复、新增摘要生成函数
- `frontend/src/components/Header.jsx` - 副标题文字和对齐
- `frontend/src/components/ConsensusPanel.jsx` - 显示所有阶段共识
- `frontend/src/components/MessageStream.jsx` - TimelineView空值保护
- `frontend/src/components/RoleCard.jsx` - Soul选择空值保护
- `frontend/src/components/DebateStatusBar.jsx` - 状态栏实时更新
- `frontend/src/components/ExportButton.jsx` - 添加调试日志
- `frontend/src/components/Celebration.jsx` - 完成庆祝效果
- `frontend/src/App.jsx` - 集成通知和下载弹窗
- `frontend/src/hooks/useWebSocket.js` - phases数据处理
- `frontend/src/stores/debateStore.js` - 新增setPhases action
- `frontend/src/data/discussionModes.js` - 角色映射、默认Soul、输出深度调整

---

### 🚀 性能优化

1. **请求体大小**: 50MB → 500MB (10倍提升)
2. **数组操作**: 所有 `.map()` 添加空值检查，避免崩溃
3. **状态同步**: WebSocket消息正确同步phases数组

---

### 🔒 安全改进

1. **类型安全**: 所有 `toLowerCase()` 调用添加类型检查
2. **空值保护**: 组件属性访问添加默认值
3. **错误边界**: TimelineView 添加 try-catch 保护

---

### 📝 文档更新

1. **新增 README.md** - 完整项目文档
   - 项目简介和特性
   - 快速开始指南
   - 使用说明
   - 项目结构
   - API接口文档
   - 部署指南

---

## [V2.2] - 2026-05-10

### 新增
- 流式输出功能
- 取消按钮
- 离线模式支持

### 修复
- 各种UI显示问题

---

## [V2.0] - 2026-05-09

### 新增
- 19种讨论模式
- 37种Soul预设
- 阶段共识生成

---

**注意**: 本次更新为上线版本，包含所有必要的功能和修复，可直接部署到生产环境。
