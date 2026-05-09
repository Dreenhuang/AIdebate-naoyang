# PRD Debate Dashboard (taolun-web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个基于 prd-debate 核心逻辑的实时可视化 Web Dashboard，支持辩论配置、实时监控、文件管理，并部署至 taolun.renrenup.cn

**Architecture:** 
- 前端: React 18 + Vite + TailwindCSS (深色主题)
- 后端: Node.js + Express + WebSocket (ws)
- 通信: WebSocket 实时同步 + REST API 文件操作
- 部署: Nginx 反向代理 + PM2 进程管理

**Tech Stack:** React, Vite, TailwindCSS, Node.js, Express, ws, Lucide React

---

## 项目结构

```
taolun-web/
├── frontend/              # React前端
│   ├── src/
│   │   ├── components/    # 组件
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ConfigPanel.jsx
│   │   │   ├── MessageStream.jsx
│   │   │   ├── StatusBar.jsx
│   │   │   ├── FileManager.jsx
│   │   │   ├── RoleCard.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   └── ConnectionStatus.jsx
│   │   ├── hooks/         # 自定义Hooks
│   │   │   ├── useWebSocket.js
│   │   │   └── useDebateState.js
│   │   ├── stores/        # 状态管理 (Zustand)
│   │   │   └── debateStore.js
│   │   ├── utils/         # 工具函数
│   │   │   └── api.js
│   │   ├── App.jsx        # 主应用
│   │   ├── main.jsx       # 入口
│   │   └── index.css      # 全局样式
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── backend/               # Node.js后端
│   ├── src/
│   │   ├── routes/        # API路由
│   │   │   ├── debate.js
│   │   │   └── files.js
│   │   ├── services/      # 业务逻辑
│   │   │   ├── debateService.js
│   │   │   └── fileService.js
│   │   ├── websocket/     # WebSocket处理
│   │   │   └── handler.js
│   │   └── index.js       # 入口
│   └── package.json
├── deploy/                # 部署脚本
│   ├── nginx-config.conf
│   ├── deploy.sh
│   └── setup-server.sh
├── .env                   # 环境变量
└── README.md
```

---

## Phase 1: 项目初始化 (预计 15 分钟)

### Task 1.1: 创建项目目录结构
**Files:**
- Create: `taolun-web/frontend/src/components/`
- Create: `taolun-web/frontend/src/hooks/`
- Create: `taolun-web/frontend/src/stores/`
- Create: `taolun-web/frontend/src/utils/`
- Create: `taolun-web/backend/src/routes/`
- Create: `taolun-web/backend/src/services/`
- Create: `taolun-web/backend/src/websocket/`
- Create: `taolun-web/deploy/`

- [ ] **Step 1: 创建所有目录**
```bash
mkdir -p taolun-web/{frontend/src/{components,hooks,stores,utils},backend/src/{routes,services,websocket},deploy}
```

- [ ] **Step 2: 验证目录结构**
```bash
tree taolun-web -L 3
```
Expected: 所有目录已创建

- [ ] **Step 3: Commit**
```bash
git add .
git commit -m "chore: initialize project structure"
```

### Task 1.2: 初始化前端项目
**Files:**
- Create: `taolun-web/frontend/package.json`
- Create: `taolun-web/frontend/vite.config.js`
- Create: `taolun-web/frontend/tailwind.config.js`
- Create: `taolun-web/frontend/index.html`
- Create: `taolun-web/frontend/postcss.config.js`

- [ ] **Step 1: 创建 package.json**
```json
{
  "name": "taolun-web-frontend",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 9529 --host",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.460.0",
    "zustand": "^5.0.1",
    "react-markdown": "^9.0.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "vite": "^6.0.1"
  }
}
```

- [ ] **Step 2: 创建 vite.config.js**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 9529,
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://localhost:9528',
      '/ws': {
        target: 'ws://localhost:9528',
        ws: true
      }
    }
  }
})
```

- [ ] **Step 3: 创建 tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0F1117',
        'bg-secondary': '#1A1D24',
        'bg-tertiary': '#252830',
        'bg-hover': '#2A2E3A',
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
        'brand-primary': '#3B82F6',
        'brand-secondary': '#10B981',
        'brand-accent': '#F59E0B',
        'success': '#10B981',
        'warning': '#F59E0B',
        'error': '#EF4444',
        'info': '#3B82F6',
        'processing': '#8B5CF6',
        'role-host': '#3B82F6',
        'role-proposer': '#10B981',
        'role-reviewer': '#F97316',
        'role-system': '#6B7280',
        'border-primary': '#2A2E3A',
        'border-focus': '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: 创建 postcss.config.js**
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: 创建 index.html**
```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Taolun - PRD Debate Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: 安装依赖**
```bash
cd taolun-web/frontend && npm install
```

- [ ] **Step 7: Commit**
```bash
git add .
git commit -m "chore: initialize frontend project with React + Vite + Tailwind"
```

### Task 1.3: 初始化后端项目
**Files:**
- Create: `taolun-web/backend/package.json`
- Create: `taolun-web/backend/src/index.js`

- [ ] **Step 1: 创建 package.json**
```json
{
  "name": "taolun-web-backend",
  "version": "2.0.0",
  "description": "PRD Debate Dashboard Backend",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node src/index.js"
  },
  "dependencies": {
    "express": "^4.21.1",
    "ws": "^8.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "js-yaml": "^4.1.0",
    "archiver": "^6.0.2"
  }
}
```

- [ ] **Step 2: 创建基础后端入口**
```javascript
const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 9528;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`[Server] Backend running on port ${PORT}`);
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected');
  
  ws.on('message', (data) => {
    console.log('[WebSocket] Received:', data.toString());
  });
  
  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
  });
});

console.log('[WebSocket] Server initialized');
```

- [ ] **Step 3: 安装依赖**
```bash
cd taolun-web/backend && npm install
```

- [ ] **Step 4: 测试后端启动**
```bash
node src/index.js
```
Expected: `[Server] Backend running on port 9528`

- [ ] **Step 5: Commit**
```bash
git add .
git commit -m "chore: initialize backend project with Express + WebSocket"
```

---

## Phase 2: 前端核心功能 (预计 45 分钟)

### Task 2.1: 创建全局样式和入口
**Files:**
- Create: `taolun-web/frontend/src/index.css`
- Create: `taolun-web/frontend/src/main.jsx`

- [ ] **Step 1: 创建 index.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-bg-primary text-text-primary font-sans;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  ::-webkit-scrollbar-track {
    background: #1A1D24;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #3B82F6;
    border-radius: 3px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #60A5FA;
  }
}
```

- [ ] **Step 2: 创建 main.jsx**
```javascript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: Commit**
```bash
git add .
git commit -m "feat: add global styles and entry point"
```

### Task 2.2: 创建状态管理 Store
**Files:**
- Create: `taolun-web/frontend/src/stores/debateStore.js`

- [ ] **Step 1: 创建 Zustand store**
```javascript
import { create } from 'zustand';

export const useDebateStore = create((set, get) => ({
  // 连接状态
  wsConnected: false,
  wsReconnecting: false,
  reconnectCount: 0,
  
  // 辩论状态
  debateStatus: 'idle',
  currentPhase: 0,
  currentRound: 0,
  totalPhases: 5,
  totalRounds: 5,
  
  // 数据
  messages: [],
  commitments: [],
  files: [],
  
  // 配置
  config: {
    topic: '',
    roles: [
      { id: 1, name: '主持人', model: 'deepseek-v4-flash', soul: '专业、理性、善于引导讨论' },
      { id: 2, name: '提案者', model: 'deepseek-v4-flash', soul: '积极、创新、善于提出方案' },
      { id: 3, name: '审查者', model: 'deepseek-v4-flash', soul: '严谨、批判、善于发现问题' },
    ],
    roundsPerPhase: 5,
    totalPhases: 5,
  },
  
  // Actions
  setWsConnected: (connected) => set({ wsConnected: connected }),
  setWsReconnecting: (reconnecting) => set({ wsReconnecting: reconnecting }),
  
  setDebateStatus: (status) => set({ debateStatus: status }),
  setPhase: (phase) => set({ currentPhase: phase }),
  setRound: (round) => set({ currentRound: round }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  setMessages: (messages) => set({ messages }),
  
  addCommitment: (commitment) => set((state) => ({
    commitments: [...state.commitments, commitment]
  })),
  
  setFiles: (files) => set({ files }),
  
  updateConfig: (config) => set((state) => ({
    config: { ...state.config, ...config }
  })),
  
  updateRole: (roleId, updates) => set((state) => ({
    config: {
      ...state.config,
      roles: state.config.roles.map(r => 
        r.id === roleId ? { ...r, ...updates } : r
      )
    }
  })),
  
  addRole: () => set((state) => ({
    config: {
      ...state.config,
      roles: [
        ...state.config.roles,
        {
          id: Date.now(),
          name: `角色${state.config.roles.length + 1}`,
          model: 'deepseek-v4-flash',
          soul: ''
        }
      ]
    }
  })),
  
  removeRole: (roleId) => set((state) => ({
    config: {
      ...state.config,
      roles: state.config.roles.filter(r => r.id !== roleId)
    }
  })),
  
  reset: () => set({
    debateStatus: 'idle',
    currentPhase: 0,
    currentRound: 0,
    messages: [],
    commitments: [],
  }),
}));
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "feat: add Zustand state management store"
```

### Task 2.3: 创建 WebSocket Hook
**Files:**
- Create: `taolun-web/frontend/src/hooks/useWebSocket.js`

- [ ] **Step 1: 创建 useWebSocket hook**
```javascript
import { useEffect, useRef, useCallback } from 'react';
import { useDebateStore } from '../stores/debateStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:9528';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT = 5;

export function useWebSocket() {
  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectCount = useRef(0);
  
  const { 
    setWsConnected, 
    setWsReconnecting,
    addMessage,
    setDebateStatus,
    setPhase,
    setRound,
    addCommitment,
  } = useDebateStore();

  const connect = useCallback(() => {
    console.log('[WebSocket] Connecting...');
    
    try {
      ws.current = new WebSocket(WS_URL);
      
      ws.current.onopen = () => {
        console.log('[WebSocket] Connected');
        setWsConnected(true);
        setWsReconnecting(false);
        reconnectCount.current = 0;
      };
      
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('[WebSocket] Parse error:', error);
        }
      };
      
      ws.current.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setWsConnected(false);
        attemptReconnect();
      };
      
      ws.current.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      attemptReconnect();
    }
  }, []);

  const attemptReconnect = useCallback(() => {
    if (reconnectCount.current >= MAX_RECONNECT) {
      console.log('[WebSocket] Max reconnect attempts reached');
      return;
    }
    
    reconnectCount.current++;
    setWsReconnecting(true);
    
    console.log(`[WebSocket] Reconnecting in ${RECONNECT_DELAY}ms (attempt ${reconnectCount.current})`);
    
    reconnectTimer.current = setTimeout(() => {
      connect();
    }, RECONNECT_DELAY);
  }, [connect]);

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'debate:started':
        setDebateStatus('running');
        break;
      case 'debate:stopped':
        setDebateStatus('idle');
        break;
      case 'debate:phase':
        setPhase(data.payload);
        break;
      case 'debate:round':
        setRound(data.payload);
        break;
      case 'debate:message':
        addMessage(data.payload);
        break;
      case 'debate:commitment':
        addCommitment(data.payload);
        break;
      case 'debate:complete':
        setDebateStatus('completed');
        break;
      case 'system:connected':
        console.log('[WebSocket] System connected');
        break;
      default:
        console.log('[WebSocket] Unknown message type:', data.type);
    }
  }, [addMessage, addCommitment, setDebateStatus, setPhase, setRound]);

  const send = useCallback((type, payload) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('[WebSocket] Not connected');
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return { send };
}
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "feat: add WebSocket hook with auto-reconnect"
```

### Task 2.4: 创建 Header 组件
**Files:**
- Create: `taolun-web/frontend/src/components/Header.jsx`

- [ ] **Step 1: 创建 Header 组件**
```javascript
import { Zap } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';

export default function Header() {
  const { wsConnected, wsReconnecting } = useDebateStore();

  return (
    <header className="h-[60px] bg-bg-secondary border-b border-border-primary flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-lg font-semibold text-text-primary">taolun</h1>
        <span className="text-xs text-text-muted">PRD Debate Dashboard</span>
      </div>
      
      <div className="flex items-center gap-2">
        {wsReconnecting ? (
          <>
            <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
            <span className="text-sm text-warning">重连中...</span>
          </>
        ) : wsConnected ? (
          <>
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-sm text-success">已连接</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-error rounded-full" />
            <span className="text-sm text-error">已断开</span>
          </>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "feat: add Header component with connection status"
```

### Task 2.5: 创建 ConfigPanel 组件
**Files:**
- Create: `taolun-web/frontend/src/components/ConfigPanel.jsx`
- Create: `taolun-web/frontend/src/components/RoleCard.jsx`

- [ ] **Step 1: 创建 RoleCard 组件**
```javascript
import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';

export default function RoleCard({ role, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const { updateRole, removeRole } = useDebateStore();

  const roleColors = ['role-host', 'role-proposer', 'role-reviewer'];
  const colorClass = roleColors[index % roleColors.length];

  return (
    <div className="bg-bg-tertiary rounded-lg border border-border-primary overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-bg-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full bg-${colorClass}`} />
          <span className="text-sm font-medium">{role.name || `角色${index + 1}`}</span>
        </div>
        <div className="flex items-center gap-2">
          {index >= 3 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeRole(role.id);
              }}
              className="p-1 hover:bg-error/20 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4 text-error" />
            </button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      
      {expanded && (
        <div className="p-3 pt-0 space-y-3">
          <div>
            <label className="text-xs text-text-muted mb-1 block">角色名称</label>
            <input
              type="text"
              value={role.name}
              onChange={(e) => updateRole(role.id, { name: e.target.value })}
              className="w-full bg-bg-primary border border-border-primary rounded px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
              placeholder="输入角色名称"
            />
          </div>
          
          <div>
            <label className="text-xs text-text-muted mb-1 block">AI模型</label>
            <select
              value={role.model}
              onChange={(e) => updateRole(role.id, { model: e.target.value })}
              className="w-full bg-bg-primary border border-border-primary rounded px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
            >
              <option value="deepseek-v4-flash">DeepSeek V4 Flash</option>
              <option value="minimax">MiniMax</option>
            </select>
          </div>
          
          <div>
            <label className="text-xs text-text-muted mb-1 block">Soul (性格描述)</label>
            <textarea
              value={role.soul}
              onChange={(e) => updateRole(role.id, { soul: e.target.value })}
              className="w-full bg-bg-primary border border-border-primary rounded px-3 py-2 text-sm focus:border-border-focus focus:outline-none resize-none"
              rows={2}
              placeholder="描述角色的性格和行为方式..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 创建 ConfigPanel 组件**
```javascript
import { Play, Square, RotateCcw, Plus, Target, Settings } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';
import RoleCard from './RoleCard';

export default function ConfigPanel({ onStart, onStop, onReset }) {
  const { config, updateConfig, addRole, debateStatus } = useDebateStore();

  return (
    <div className="w-[320px] bg-bg-secondary border-r border-border-primary flex flex-col h-full">
      <div className="p-4 border-b border-border-primary">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-brand-primary" />
          <h2 className="font-semibold">配置面板</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 话题输入 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-text-muted" />
            <label className="text-sm font-medium">讨论话题</label>
          </div>
          <textarea
            value={config.topic}
            onChange={(e) => updateConfig({ topic: e.target.value })}
            className="w-full bg-bg-tertiary border border-border-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none resize-none"
            rows={3}
            placeholder="输入讨论话题，例如：AI会取代人类的工作吗？"
          />
        </div>

        {/* 角色配置 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">角色配置 ({config.roles.length}/5)</span>
            {config.roles.length < 5 && (
              <button
                onClick={addRole}
                className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-primary/80 transition-colors"
              >
                <Plus className="w-3 h-3" />
                添加角色
              </button>
            )}
          </div>
          <div className="space-y-2">
            {config.roles.map((role, index) => (
              <RoleCard key={role.id} role={role} index={index} />
            ))}
          </div>
        </div>

        {/* 轮数设置 */}
        <div>
          <label className="text-sm font-medium mb-2 block">每阶段轮数: {config.roundsPerPhase}</label>
          <input
            type="range"
            min={1}
            max={10}
            value={config.roundsPerPhase}
            onChange={(e) => updateConfig({ roundsPerPhase: parseInt(e.target.value) })}
            className="w-full accent-brand-primary"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        {/* 阶段设置 */}
        <div>
          <label className="text-sm font-medium mb-2 block">总阶段数: {config.totalPhases}</label>
          <input
            type="range"
            min={1}
            max={5}
            value={config.totalPhases}
            onChange={(e) => updateConfig({ totalPhases: parseInt(e.target.value) })}
            className="w-full accent-brand-primary"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>1</span>
            <span>5</span>
          </div>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="p-4 border-t border-border-primary space-y-2">
        {debateStatus === 'running' ? (
          <button
            onClick={onStop}
            className="w-full flex items-center justify-center gap-2 bg-error hover:bg-error/90 text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            <Square className="w-4 h-4" />
            停止辩论
          </button>
        ) : (
          <button
            onClick={onStart}
            disabled={!config.topic || debateStatus === 'completed'}
            className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            开始辩论
          </button>
        )}
        
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 bg-bg-tertiary hover:bg-bg-hover border border-border-primary text-text-secondary py-2 rounded-lg text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add .
git commit -m "feat: add ConfigPanel and RoleCard components"
```

### Task 2.6: 创建 MessageStream 组件
**Files:**
- Create: `taolun-web/frontend/src/components/MessageBubble.jsx`
- Create: `taolun-web/frontend/src/components/MessageStream.jsx`

- [ ] **Step 1: 创建 MessageBubble 组件**
```javascript
import { User, Bot } from 'lucide-react';

const roleColors = {
  '主持人': 'bg-role-host',
  '提案者': 'bg-role-proposer',
  '审查者': 'bg-role-reviewer',
  'system': 'bg-role-system',
};

const roleIcons = {
  '主持人': User,
  '提案者': Bot,
  '审查者': Bot,
  'system': User,
};

export default function MessageBubble({ message }) {
  const { role, content, phase, round, timestamp } = message;
  const isSystem = role === 'system';
  
  const colorClass = roleColors[role] || 'bg-brand-primary';
  const Icon = roleIcons[role] || User;

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs text-text-muted bg-bg-tertiary px-3 py-1 rounded-full">
          {content}
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4 animate-in slide-in-from-bottom-2 duration-150">
      <div className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-text-primary">{role}</span>
          <span className="text-xs text-text-muted">
            {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
          </span>
        </div>
        
        <div className="bg-bg-tertiary rounded-lg p-3 border border-border-primary">
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>
        
        {(phase !== undefined || round !== undefined) && (
          <div className="flex gap-2 mt-1">
            {phase !== undefined && (
              <span className="text-xs bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded">
                阶段 {phase}
              </span>
            )}
            {round !== undefined && (
              <span className="text-xs bg-brand-secondary/20 text-brand-secondary px-2 py-0.5 rounded">
                轮次 {round}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 创建 MessageStream 组件**
```javascript
import { useEffect, useRef } from 'react';
import { MessageSquare, Play } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';
import MessageBubble from './MessageBubble';

export default function MessageStream() {
  const { messages, debateStatus, config } = useDebateStore();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col bg-bg-primary">
      {/* 消息流头部 */}
      <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-primary" />
          <h2 className="font-semibold">消息流</h2>
          <span className="text-xs text-text-muted">({messages.length} 条消息)</span>
        </div>
      </div>

      {/* 消息列表 */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg mb-2">等待辩论开始</p>
            <p className="text-sm">配置辩论参数后点击"开始辩论"</p>
            {config.topic && (
              <div className="mt-4 p-3 bg-bg-tertiary rounded-lg border border-border-primary max-w-md">
                <p className="text-sm text-text-secondary">当前话题:</p>
                <p className="text-sm text-text-primary mt-1">{config.topic}</p>
              </div>
            )}
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add .
git commit -m "feat: add MessageStream and MessageBubble components"
```

### Task 2.7: 创建 StatusBar 组件
**Files:**
- Create: `taolun-web/frontend/src/components/StatusBar.jsx`

- [ ] **Step 1: 创建 StatusBar 组件**
```javascript
import { BarChart3, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';

export default function StatusBar() {
  const { 
    debateStatus, 
    currentPhase, 
    currentRound, 
    totalPhases, 
    totalRounds, 
    commitments 
  } = useDebateStore();

  const statusConfig = {
    idle: { color: 'text-text-muted', bg: 'bg-text-muted', label: '空闲' },
    running: { color: 'text-success', bg: 'bg-success', label: '进行中' },
    completed: { color: 'text-brand-primary', bg: 'bg-brand-primary', label: '已完成' },
    paused: { color: 'text-warning', bg: 'bg-warning', label: '已暂停' },
  };

  const status = statusConfig[debateStatus] || statusConfig.idle;

  return (
    <div className="h-[80px] bg-bg-secondary border-t border-border-primary px-6 flex items-center justify-between">
      {/* 阶段进度 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-primary" />
          <div>
            <p className="text-xs text-text-muted">阶段进度</p>
            <p className="text-sm font-semibold">
              {currentPhase} / {totalPhases}
            </p>
          </div>
        </div>
        
        {/* 进度条 */}
        <div className="w-24 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-primary rounded-full transition-all duration-300"
            style={{ width: `${(currentPhase / totalPhases) * 100}%` }}
          />
        </div>
      </div>

      {/* 轮次 */}
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-brand-secondary" />
        <div>
          <p className="text-xs text-text-muted">当前轮次</p>
          <p className="text-sm font-semibold">
            {currentRound} / {totalRounds}
          </p>
        </div>
      </div>

      {/* 承诺计数 */}
      <div className="flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-success" />
        <div>
          <p className="text-xs text-text-muted">承诺</p>
          <p className="text-2xl font-bold text-success">{commitments.length}</p>
        </div>
      </div>

      {/* 回溯状态 */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <div>
          <p className="text-xs text-text-muted">回溯验证</p>
          <p className="text-sm font-semibold text-warning">待检查</p>
        </div>
      </div>

      {/* 整体状态 */}
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 ${status.bg} rounded-full animate-pulse`} />
        <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "feat: add StatusBar component with phase/round/commitment display"
```

### Task 2.8: 创建 FileManager 组件
**Files:**
- Create: `taolun-web/frontend/src/components/FileManager.jsx`

- [ ] **Step 1: 创建 FileManager 组件**
```javascript
import { useState } from 'react';
import { Folder, FileText, Download, Eye, CheckSquare, Square, X } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';

export default function FileManager() {
  const { files } = useDebateStore();
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [previewFile, setPreviewFile] = useState(null);

  const toggleSelection = (filename) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filename)) {
      newSelected.delete(filename);
    } else {
      newSelected.add(filename);
    }
    setSelectedFiles(newSelected);
  };

  const selectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.name)));
    }
  };

  const downloadSelected = () => {
    const selected = files.filter(f => selectedFiles.has(f.name));
    console.log('Download selected:', selected);
    // TODO: Implement actual download
  };

  const downloadAll = () => {
    console.log('Download all:', files);
    // TODO: Implement actual download
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="h-[200px] bg-bg-secondary border-t border-border-primary flex flex-col">
      {/* 头部 */}
      <div className="px-4 py-2 border-b border-border-primary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-brand-primary" />
          <span className="text-sm font-medium">文件列表 ({files.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {selectedFiles.size > 0 && (
            <button
              onClick={downloadSelected}
              className="flex items-center gap-1 text-xs bg-brand-primary hover:bg-brand-primary/90 text-white px-3 py-1.5 rounded transition-colors"
            >
              <Download className="w-3 h-3" />
              批量下载 ({selectedFiles.size})
            </button>
          )}
          <button
            onClick={downloadAll}
            className="flex items-center gap-1 text-xs bg-bg-tertiary hover:bg-bg-hover border border-border-primary text-text-secondary px-3 py-1.5 rounded transition-colors"
          >
            <Download className="w-3 h-3" />
            全部下载
          </button>
        </div>
      </div>

      {/* 文件列表 */}
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted">
            <p className="text-sm">暂无文件，请先完成辩论</p>
          </div>
        ) : (
          <div className="divide-y divide-border-primary">
            {/* 全选 */}
            <div className="px-4 py-2 flex items-center gap-2 hover:bg-bg-hover transition-colors">
              <button onClick={selectAll} className="flex items-center gap-2">
                {selectedFiles.size === files.length ? (
                  <CheckSquare className="w-4 h-4 text-brand-primary" />
                ) : (
                  <Square className="w-4 h-4 text-text-muted" />
                )}
                <span className="text-xs text-text-muted">全选</span>
              </button>
            </div>
            
            {files.map((file) => (
              <div
                key={file.name}
                className={`px-4 py-2 flex items-center justify-between hover:bg-bg-hover transition-colors ${
                  selectedFiles.has(file.name) ? 'bg-bg-hover border-l-2 border-l-brand-primary' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleSelection(file.name)}>
                    {selectedFiles.has(file.name) ? (
                      <CheckSquare className="w-4 h-4 text-brand-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-text-muted" />
                    )}
                  </button>
                  <FileText className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm text-text-primary">{file.name}</span>
                  <span className="text-xs text-text-muted">{formatSize(file.size)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewFile(file)}
                    className="p-1.5 hover:bg-bg-tertiary rounded transition-colors"
                    title="预览"
                  >
                    <Eye className="w-4 h-4 text-text-secondary" />
                  </button>
                  <button
                    className="p-1.5 hover:bg-bg-tertiary rounded transition-colors"
                    title="下载"
                  >
                    <Download className="w-4 h-4 text-text-secondary" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 预览弹窗 */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary rounded-lg w-[800px] h-[600px] flex flex-col">
            <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-primary" />
                <span className="font-medium">{previewFile.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 text-xs bg-brand-primary hover:bg-brand-primary/90 text-white px-3 py-1.5 rounded transition-colors">
                  <Download className="w-3 h-3" />
                  下载
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 hover:bg-bg-tertiary rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-sm text-text-primary whitespace-pre-wrap">
                {previewFile.content || '文件内容加载中...'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "feat: add FileManager with select/download/preview"
```

### Task 2.9: 创建 App 主组件
**Files:**
- Create: `taolun-web/frontend/src/App.jsx`

- [ ] **Step 1: 创建 App 组件**
```javascript
import Header from './components/Header';
import ConfigPanel from './components/ConfigPanel';
import MessageStream from './components/MessageStream';
import StatusBar from './components/StatusBar';
import FileManager from './components/FileManager';
import { useWebSocket } from './hooks/useWebSocket';
import { useDebateStore } from './stores/debateStore';

function App() {
  const { send } = useWebSocket();
  const { reset } = useDebateStore();

  const handleStart = () => {
    const { config } = useDebateStore.getState();
    send('debate:start', config);
  };

  const handleStop = () => {
    send('debate:stop');
  };

  const handleReset = () => {
    reset();
    send('debate:reset');
  };

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <ConfigPanel 
          onStart={handleStart}
          onStop={handleStop}
          onReset={handleReset}
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          <MessageStream />
          <StatusBar />
          <FileManager />
        </div>
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 2: 测试前端启动**
```bash
cd taolun-web/frontend && npm run dev
```
Expected: Vite dev server running on port 9529

- [ ] **Step 3: Commit**
```bash
git add .
git commit -m "feat: add App component with layout integration"
```

---

## Phase 3: 后端核心功能 (预计 30 分钟)

### Task 3.1: 完善 WebSocket 处理
**Files:**
- Create: `taolun-web/backend/src/websocket/handler.js`

- [ ] **Step 1: 创建 WebSocket handler**
```javascript
const debateService = require('../services/debateService');

class WebSocketHandler {
  constructor(wss) {
    this.wss = wss;
    this.clients = new Set();
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('[WebSocket] Client connected');
      this.clients.add(ws);

      // Send initial connection message
      this.sendToClient(ws, 'system:connected', { timestamp: new Date().toISOString() });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('[WebSocket] Message parse error:', error);
        }
      });

      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('[WebSocket] Client error:', error);
        this.clients.delete(ws);
      });
    });
  }

  handleMessage(ws, message) {
    const { type, payload } = message;
    console.log(`[WebSocket] Received: ${type}`, payload);

    switch (type) {
      case 'debate:start':
        this.handleDebateStart(payload);
        break;
      case 'debate:stop':
        this.handleDebateStop();
        break;
      case 'debate:reset':
        this.handleDebateReset();
        break;
      default:
        console.log(`[WebSocket] Unknown message type: ${type}`);
    }
  }

  async handleDebateStart(config) {
    try {
      await debateService.startDebate(config);
      this.broadcast('debate:started', { timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('[Debate] Start error:', error);
      this.broadcast('debate:error', { message: error.message });
    }
  }

  handleDebateStop() {
    debateService.stopDebate();
    this.broadcast('debate:stopped', { timestamp: new Date().toISOString() });
  }

  handleDebateReset() {
    debateService.resetDebate();
    this.broadcast('debate:reset', { timestamp: new Date().toISOString() });
  }

  sendToClient(ws, type, payload) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify({ type, payload }));
    }
  }

  broadcast(type, payload) {
    const message = JSON.stringify({ type, payload });
    this.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  }
}

module.exports = WebSocketHandler;
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "feat: add WebSocket handler with debate control"
```

### Task 3.2: 创建 Debate Service
**Files:**
- Create: `taolun-web/backend/src/services/debateService.js`

- [ ] **Step 1: 创建 debate service**
```javascript
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

class DebateService {
  constructor() {
    this.debateState = {
      status: 'idle',
      currentPhase: 0,
      currentRound: 0,
      totalPhases: 5,
      totalRounds: 5,
      commitments: [],
      messages: [],
      config: null,
    };
    this.debateDir = path.join(process.cwd(), '..', '..', 'debates');
  }

  async startDebate(config) {
    console.log('[Debate] Starting debate with config:', config);
    
    this.debateState = {
      ...this.debateState,
      status: 'running',
      currentPhase: 1,
      currentRound: 1,
      totalPhases: config.totalPhases || 5,
      totalRounds: config.roundsPerPhase || 5,
      config,
      messages: [],
      commitments: [],
    };

    // Add system message
    this.addMessage({
      role: 'system',
      content: `辩论开始: ${config.topic}`,
      timestamp: new Date().toISOString(),
    });

    // Simulate debate progression (in real implementation, this would call AI APIs)
    this.simulateDebate();
  }

  stopDebate() {
    console.log('[Debate] Stopping debate');
    this.debateState.status = 'idle';
    
    this.addMessage({
      role: 'system',
      content: '辩论已停止',
      timestamp: new Date().toISOString(),
    });
  }

  resetDebate() {
    console.log('[Debate] Resetting debate');
    this.debateState = {
      status: 'idle',
      currentPhase: 0,
      currentRound: 0,
      totalPhases: 5,
      totalRounds: 5,
      commitments: [],
      messages: [],
      config: null,
    };
  }

  addMessage(message) {
    this.debateState.messages.push(message);
  }

  async loadDebateState(slug) {
    try {
      const statePath = path.join(this.debateDir, slug, '.debate-state');
      const content = await fs.readFile(statePath, 'utf8');
      return yaml.load(content);
    } catch (error) {
      console.error('[Debate] Load state error:', error);
      return null;
    }
  }

  getState() {
    return { ...this.debateState };
  }

  // Simulation for testing (remove in production)
  simulateDebate() {
    const roles = this.debateState.config?.roles || [];
    let messageCount = 0;
    
    const interval = setInterval(() => {
      if (this.debateState.status !== 'running') {
        clearInterval(interval);
        return;
      }

      const role = roles[messageCount % roles.length];
      if (role) {
        this.addMessage({
          role: role.name,
          content: `这是${role.name}的第${messageCount + 1}条消息。正在讨论话题：${this.debateState.config.topic}`,
          phase: this.debateState.currentPhase,
          round: this.debateState.currentRound,
          timestamp: new Date().toISOString(),
        });

        // Update phase/round
        messageCount++;
        if (messageCount % 3 === 0) {
          this.debateState.currentRound++;
          if (this.debateState.currentRound > this.debateState.totalRounds) {
            this.debateState.currentPhase++;
            this.debateState.currentRound = 1;
            
            if (this.debateState.currentPhase > this.debateState.totalPhases) {
              this.debateState.status = 'completed';
              this.addMessage({
                role: 'system',
                content: '辩论已完成！',
                timestamp: new Date().toISOString(),
              });
              clearInterval(interval);
            }
          }
        }
      }
    }, 2000);
  }
}

module.exports = new DebateService();
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "feat: add DebateService with state management"
```

### Task 3.3: 创建 API Routes
**Files:**
- Create: `taolun-web/backend/src/routes/debate.js`
- Create: `taolun-web/backend/src/routes/files.js`

- [ ] **Step 1: 创建 debate routes**
```javascript
const express = require('express');
const router = express.Router();
const debateService = require('../services/debateService');

// Get debate state
router.get('/state', (req, res) => {
  res.json(debateService.getState());
});

// Get messages
router.get('/messages', (req, res) => {
  const state = debateService.getState();
  res.json(state.messages);
});

// Get commitments
router.get('/commitments', (req, res) => {
  const state = debateService.getState();
  res.json(state.commitments);
});

module.exports = router;
```

- [ ] **Step 2: 创建 file routes**
```javascript
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');

const debatesDir = path.join(process.cwd(), '..', '..', 'debates');

// List files
router.get('/list', async (req, res) => {
  try {
    // For demo, return mock files
    const files = [
      { name: 'debate-framework.md', size: 2048, content: '# Debate Framework\n\nThis is the debate framework...' },
      { name: 'consensus.md', size: 1024, content: '# Consensus\n\nConsensus reached...' },
      { name: 'prd.md', size: 4096, content: '# PRD Document\n\nProduct Requirements Document...' },
    ];
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download files
router.get('/download', async (req, res) => {
  try {
    const files = req.query.files?.split(',') || [];
    
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files specified' });
    }

    if (files.length === 1) {
      // Single file download
      const filePath = path.join(debatesDir, files[0]);
      res.download(filePath);
    } else {
      // Multiple files - create zip
      const archive = archiver('zip');
      res.attachment('debate-files.zip');
      archive.pipe(res);
      
      for (const file of files) {
        const filePath = path.join(debatesDir, file);
        archive.file(filePath, { name: file });
      }
      
      await archive.finalize();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 3: 更新后端入口**
```javascript
const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const debateRoutes = require('./routes/debate');
const fileRoutes = require('./routes/files');
const WebSocketHandler = require('./websocket/handler');

const app = express();
const PORT = process.env.PORT || 9528;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/debate', debateRoutes);
app.use('/api/files', fileRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`[Server] Backend running on port ${PORT}`);
});

// WebSocket server
const wss = new WebSocketServer({ server });
const wsHandler = new WebSocketHandler(wss);

console.log('[WebSocket] Server initialized');

// Export for testing
module.exports = { app, server, wss };
```

- [ ] **Step 4: 测试后端**
```bash
cd taolun-web/backend && node src/index.js
```
Expected: Backend running on port 9528

- [ ] **Step 5: Commit**
```bash
git add .
git commit -m "feat: add API routes for debate and files"
```

---

## Phase 4: 部署配置 (预计 20 分钟)

### Task 4.1: 创建部署脚本
**Files:**
- Create: `taolun-web/deploy/nginx-config.conf`
- Create: `taolun-web/deploy/deploy.sh`

- [ ] **Step 1: 创建 Nginx 配置**
```nginx
upstream backend {
    server 127.0.0.1:9528;
    keepalive 32;
}

server {
    listen 80;
    server_name taolun.renrenup.cn;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name taolun.renrenup.cn;

    ssl_certificate /etc/nginx/ssl/taolun.renrenup.cn.crt;
    ssl_certificate_key /etc/nginx/ssl/taolun.renrenup.cn.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        root /www/wwwroot/taolun.renrenup.cn/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }
}
```

- [ ] **Step 2: 创建部署脚本**
```bash
#!/bin/bash
set -e

DOMAIN="taolun.renrenup.cn"
DEPLOY_DIR="/www/wwwroot/${DOMAIN}"

echo "[Deploy] Starting deployment for ${DOMAIN}..."

# Build frontend
echo "[Deploy] Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Create deploy directory
mkdir -p ${DEPLOY_DIR}

# Copy frontend
cp -r frontend/dist ${DEPLOY_DIR}/frontend

# Copy backend
cp -r backend ${DEPLOY_DIR}/backend
cp .env ${DEPLOY_DIR}/backend/

# Install backend dependencies
cd ${DEPLOY_DIR}/backend
npm install --production

# Setup PM2
cat > ${DEPLOY_DIR}/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'taolun-backend',
    script: './backend/src/index.js',
    cwd: '${DEPLOY_DIR}',
    instances: 1,
    env: { NODE_ENV: 'production', PORT: 9528 },
    log_file: '${DEPLOY_DIR}/logs/backend.log',
    max_memory_restart: '500M',
    autorestart: true
  }]
};
EOF

mkdir -p ${DEPLOY_DIR}/logs
pm2 start ${DEPLOY_DIR}/ecosystem.config.js
pm2 save

echo "[Deploy] Deployment completed!"
```

- [ ] **Step 3: Commit**
```bash
git add .
git commit -m "chore: add deployment scripts and nginx config"
```

### Task 4.2: 创建环境变量文件
**Files:**
- Create: `taolun-web/.env`
- Create: `taolun-web/frontend/.env.production`

- [ ] **Step 1: 创建根目录 .env**
```
# Server Configuration
PORT=9528
NODE_ENV=production

# Domain
DOMAIN=taolun.renrenup.cn

# API Keys (replace with actual keys)
DEEPSEEK_API_KEY=your-deepseek-key
MINIMAX_API_KEY=your-minimax-key
```

- [ ] **Step 2: 创建前端生产环境变量**
```
VITE_API_URL=/api
VITE_WS_URL=wss://taolun.renrenup.cn/ws
VITE_DOMAIN=taolun.renrenup.cn
```

- [ ] **Step 3: Commit**
```bash
git add .
git commit -m "chore: add environment configuration"
```

---

## Phase 5: 一键启动器 (预计 15 分钟)

### Task 5.1: 创建 Windows 启动器
**Files:**
- Create: `taolun-web/start.bat`

- [ ] **Step 1: 创建 start.bat**
```batch
@echo off
chcp 65001 >nul
title Taolun - PRD Debate Dashboard

echo ==========================================
echo   Taolun - PRD Debate Dashboard
echo ==========================================
echo.

REM Check and kill processes on ports 9529 and 9528
echo [1/4] Checking ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9529') do (
    echo Killing process on port 9529 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9528') do (
    echo Killing process on port 9528 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

REM Start backend
echo [2/4] Starting backend server...
start "Backend" cmd /k "cd backend && node src/index.js"
timeout /t 3 /nobreak >nul

REM Start frontend
echo [3/4] Starting frontend server...
start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 5 /nobreak >nul

REM Open browser
echo [4/4] Opening browser...
start http://localhost:9529

echo.
echo ==========================================
echo   All services started!
echo   Frontend: http://localhost:9529
echo   Backend: http://localhost:9528
echo ==========================================

pause
```

- [ ] **Step 2: 创建桌面快捷方式脚本**
```powershell
# 创建桌面快捷方式
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\多AI讨论.lnk")
$Shortcut.TargetPath = "%~dp0start.bat"
$Shortcut.WorkingDirectory = "%~dp0"
$Shortcut.IconLocation = "%SystemRoot%\System32\SHELL32.dll, 14"
$Shortcut.Description = "启动多AI讨论系统"
$Shortcut.Save()

Write-Host "桌面快捷方式已创建: 多AI讨论"
```

- [ ] **Step 3: Commit**
```bash
git add .
git commit -m "feat: add Windows launcher and desktop shortcut"
```

---

## Phase 6: Git 仓库创建 (预计 15 分钟)

### Task 6.1: GitHub 仓库
**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: 创建 .gitignore**
```
node_modules/
dist/
build/
.env
*.log
.DS_Store
```

- [ ] **Step 2: 初始化 Git 并推送**
```bash
cd taolun-web
git init
git remote add origin https://github.com/Dreenhuang/prd-debate-dashboard.git
git add .
git commit -m "feat: initial commit - PRD Debate Dashboard v2.0"
git branch -M main
git push -u origin main
```

### Task 6.2: Gitee 仓库
- [ ] **Step 1: 添加 Gitee 远程**
```bash
git remote add gitee https://gitee.com/woshiboss666/prd-debate-dashboard.git
git push -u gitee main
```

---

## 验证清单

### 功能验证
- [ ] 前端页面正常显示
- [ ] WebSocket 连接成功
- [ ] 配置面板可正常操作
- [ ] 消息流实时更新
- [ ] 状态栏显示正确
- [ ] 文件管理功能正常

### 代码质量验证
- [ ] 无 ESLint 错误
- [ ] 无 TypeScript 类型错误
- [ ] 代码格式统一

### 部署验证
- [ ] 生产构建成功
- [ ] Nginx 配置正确
- [ ] SSL 证书配置

---

**计划完成！**

执行选项：
1. **Subagent-Driven (推荐)** - 我调度子代理逐任务执行
2. **Inline Execution** - 在当前会话中逐任务执行

请选择执行方式开始开发。
