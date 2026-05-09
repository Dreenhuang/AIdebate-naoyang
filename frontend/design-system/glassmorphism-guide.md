# 🎨 脑痒网站 - 清透色彩设计系统使用指南

## 🌟 设计系统概览

### 系统名称
**Glassmorphism 清透色彩系统 v2.0**

### 核心理念
- ✨ **轻盈通透**: 毛玻璃效果营造层次感
- 🎨 **四色和谐**: 奶油黄+蜜桃橙+天空蓝+薰衣草紫
- ♿ **无障碍优先**: WCAG 2.1 AA 标准合规
- 📱 **响应式设计**: 完美适配各种设备屏幕

---

## 🎨 品牌色板

### 四色主色调

| 色彩 | 名称 | HEX值 | CSS变量 | Tailwind类 | 用途场景 |
|-----|------|-------|---------|-----------|---------|
| 🟡 | 奶油黄 | `#FCFEC4` | `--color-cream` | `bg-brand-cream` | 主色调、温暖元素、高亮背景 |
| 🟠 | 蜜桃橙 | `#FFD9B5` | `--color-peach` | `bg-brand-peach` | 辅助色、交互提示、友好元素 |
| 🔵 | 天空蓝 | `#C5F3FD` | `--color-sky` | `bg-brand-sky` | 信息展示、信任元素、冷静区域 |
| 🟣 | 薰衣草紫 | `#C4C5FF` | `--color-lavender` | `bg-brand-lavender` | 强调重点、创意灵感、品牌识别 |

---

## 💎 毛玻璃组件库 (Glassmorphism)

### 基础用法

#### 1️⃣ 毛玻璃卡片 (最常用)

```jsx
{/* 基础毛玻璃卡片 */}
<div className="glass p-6">
  <h2 className="text-text-primary text-xl font-bold">标题</h2>
  <p className="text-text-secondary mt-2">内容文本</p>
</div>

{/* 彩色毛玻璃变体 */}
<div className="glass-cream p-4">奶油黄玻璃</div>
<div className="glass-peach p-4">蜜桃橙玻璃</div>
<div className="glass-sky p-4">天空蓝玻璃</div>
<div className="glass-lavender p-4">薰衣草紫玻璃</div>

{/* 强毛玻璃 (更高透明度) */}
<div className="glass-strong p-8">
  <h1>重要内容区域</h1>
</div>
```

#### 2️⃣ 毛玻璃导航栏

```jsx
<header className="glass-nav h-16 px-6 flex items-center justify-between">
  <img src="/brain-itch-logo.svg" alt="Logo" className="w-10 h-10" />
  <nav>
    <a href="#" className="text-text-primary hover:text-brand-lavender">首页</a>
    <a href="#" className="text-text-primary hover:text-brand-lavender ml-4">关于</a>
  </nav>
</header>
```

#### 3️⃣ 毛玻璃按钮

```jsx
{/* 基础玻璃按钮 */}
<button className="btn-glass focus-ring">
  普通按钮
</button>

{/* 主要操作按钮 (渐变+玻璃) */}
<button className="btn-glass-primary focus-ring">
  开始辩论
</button>

{/* 带图标的按钮 */}
<button className="btn-glass flex items-center gap-2 focus-ring">
  <Volume2 className="w-4 h-4" />
  开启音效
</button>
```

#### 4️⃣ 毛玻璃输入框

```jsx
<input 
  type="text" 
  className="input-glass w-full focus-ring"
  placeholder="请输入讨论话题..."
/>

<textarea 
  className="input-glass w-full h-32 resize-none focus-ring"
  placeholder="详细描述..."
/>
```

#### 5️⃣ 毛玻璃徽章/标签

```jsx
<div className="flex gap-2">
  <span className="badge-glass badge-cream">主持人</span>
  <span className="badge-glass badge-sky">提案者</span>
  <span className="badge-glass badge-peach">审查者</span>
  <span className="badge-glass badge-lavender">创意官</span>
</div>
```

#### 6️⃣ 毛玻璃模态框

```jsx
<div className="modal-glass p-8 max-w-md mx-auto">
  <h2 className="text-2xl font-bold text-text-primary mb-4">确认操作</h2>
  <p className="text-text-secondary mb-6">您确定要开始新辩论吗？</p>
  
  <div className="flex gap-3 justify-end">
    <button className="btn-glass focus-ring">取消</button>
    <button className="btn-glass-primary focus-ring">确认开始</button>
  </div>
</div>
```

---

## 🎭 动画与微交互

### 内置动画类

```jsx
{/* 浮动动画 (适合 Logo、装饰元素) */}
<img src="/logo.svg" className="animate-float" />

{/* 微光加载效果 */}
<div className="animate-shimmer bg-bg-glass h-20 rounded-glass" />

{/* 脉冲发光 (强调重要元素) */}
<div className="animate-pulse-glass bg-brand-lavender/30 p-4 rounded-glass">
  ⭐ 重要通知
</div>

{/* 入场动画 */}
<div className="animate-slide-up">
  新出现的内容
</div>
```

### 文本渐变效果

```jsx
<h1 className="text-gradient text-4xl font-bold">
  脑痒 - 让思考更愉悦
</h1>

<h2 className="text-gradient-warm text-2xl">
  温暖的欢迎语
</h2>
```

### 背景装饰

```jsx
<section className="bg-decoration decoration-cream relative p-12">
  {/* 右上角会有柔和的奶油黄色光晕 */}
  <h2>内容区域</h2>
</section>

<div className="bg-decoration decoration-sky relative p-8">
  {/* 左下角会有天空蓝色光晕 */}
</div>
```

---

## 📱 响应式断点

### 移动端优化

```css
/* 当屏幕宽度 ≤ 768px 时自动应用 */
@media (max-width: 768px) {
  :root {
    --glass-blur: 12px;        /* 减少模糊以提升性能 */
  }
  
  .glass, .glass-strong, .modal-glass {
    border-radius: 12px;       /* 更小的圆角 */
  }
  
  .btn-glass {
    padding: 8px 16px;         /* 更紧凑的按钮 */
  }
}
```

### 使用建议

```jsx
<div className="
  glass 
  p-4           /* 手机: 小内边距 */
  md:p-8        /* 平板: 中等内边距 */
  lg:p-12       /* 桌面: 大内边距 */
">
  响应式内容
</div>
```

---

## ♿ 无障碍最佳实践

### 必须遵守的规则

#### 1️⃣ 所有交互元素添加焦点指示器

```jsx
✅ 正确做法:
<button className="btn-glass focus-ring">点击我</button>
<a href="#" className="focus-ring">链接</a>
<input className="input-glass focus-ring" />

❌ 错误做法:
<button className="btn-glass">缺少焦点环</button>
```

#### 2️⃣ 文本颜色规范

```jsx
✅ 正确 - 使用语义化颜色变量:
<h1 className="text-text-primary">主标题 (对比度 > 12:1)</h1>
<p className="text-text-secondary">正文 (对比度 > 7:1)</p>
<small className="text-text-muted">辅助信息 (对比度 > 4.5:1)</small>

❌ 错误 - 避免自定义低对比度颜色:
<h1 style={{ color: '#AAA' }}>太浅了，看不清!</h1>
```

#### 3️⃣ 触摸目标尺寸

```jsx
✅ 正确 - 最小 44x44px:
<button className="btn-glass min-h-[44px] min-w-[44px]">
  <Icon className="w-5 h-5" />
</button>

❌ 错误 - 太小的点击区域:
<button className="p-1">
  <Icon className="w-3 h-3" />  {/* 只有 12x12px，太难点击! */}
</button>
```

#### 4️⃣ 颜色不能作为唯一信息传达方式

```jsx
✅ 正确 - 颜色 + 图标 + 文本:
<span className="badge-glass badge-success flex items-center gap-1">
  <CheckCircle className="w-4 h-4" />
  操作成功
</span>

❌ 错误 - 仅依赖颜色:
<span className="text-green-500">成功</span>  {/* 色盲用户无法区分 */}
```

---

## 🎨 典型页面布局示例

### 首页 Hero 区域

```jsx
<section className="min-h-screen bg-decoration decoration-cream flex items-center justify-center relative overflow-hidden">
  <div className="max-w-4xl mx-auto px-6 text-center">
    {/* Logo */}
    <img 
      src="/brain-itch-logo.svg" 
      alt="脑痒Logo" 
      className="w-32 h-32 mx-auto mb-8 animate-float"
    />
    
    {/* 主标题 */}
    <h1 className="text-gradient text-5xl md:text-7xl font-bold mb-6">
      脑痒是长脑子的前兆
    </h1>
    
    {/* 副标题 */}
    <p className="text-text-secondary text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
      通过AI驱动的多角色辩论，让您的思维更加清晰、决策更加明智
    </p>
    
    {/* CTA 按钮 */}
    <div className="flex gap-4 justify-center flex-wrap">
      <button className="btn-glass-primary px-8 py-4 text-lg focus-ring">
        立即体验
      </button>
      <button className="btn-glass px-8 py-4 text-lg focus-ring">
        了解更多
      </button>
    </div>
  </div>
  
  {/* 背景装饰光晕 */}
  <div className="absolute top-20 right-20 w-96 h-96 bg-brand-lavender/20 rounded-full blur-3xl"></div>
  <div className="absolute bottom-20 left-20 w-96 h-96 bg-brand-sky/20 rounded-full blur-3xl"></div>
</section>
```

### 功能卡片区

```jsx
<section className="py-20 px-6">
  <div className="max-w-6xl mx-auto">
    <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
      核心功能
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 卡片 1 */}
      <div className="glass p-6 hover:scale-105 transition-transform">
        <div className="w-14 h-14 glass-cream rounded-2xl flex items-center justify-center mb-4">
          <Users className="w-7 h-7 text-yellow-700" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">多角色辩论</h3>
        <p className="text-text-secondary">
          创建多个AI角色从不同角度分析问题，获得全方位的洞察
        </p>
      </div>
      
      {/* 卡片 2 */}
      <div className="glass p-6 hover:scale-105 transition-transform">
        <div className="w-14 h-14 glass-sky rounded-2xl flex items-center justify-center mb-4">
          <Brain className="w-7 h-7 text-cyan-700" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">智能共识</h3>
        <p className="text-text-secondary">
          AI自动综合各方观点，提炼出平衡、可执行的结论
        </p>
      </div>
      
      {/* 卡片 3 */}
      <div className="glass p-6 hover:scale-105 transition-transform">
        <div className="w-14 h-14 glass-lavender rounded-2xl flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7 text-purple-700" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">知识沉淀</h3>
        <p className="text-text-secondary">
          将讨论过程和结果保存为结构化文档，方便回顾与分享
        </p>
      </div>
    </div>
  </div>
</section>
```

### 表单区域

```jsx
<div className="max-w-2xl mx-auto">
  <div className="glass-strong p-8">
    <h2 className="text-2xl font-bold text-text-primary mb-6">开始新辩论</h2>
    
    <form className="space-y-6">
      {/* 话题输入 */}
      <div>
        <label className="block text-text-secondary font-medium mb-2">
          讨论话题
        </label>
        <input 
          type="text"
          className="input-glass w-full focus-ring"
          placeholder="例如：是否应该实施四天工作制？"
        />
      </div>
      
      {/* 角色配置 */}
      <div>
        <label className="block text-text-secondary font-medium mb-2">
          参与角色
        </label>
        <div className="flex flex-wrap gap-2">
          <span className="badge-glass badge-cream cursor-pointer hover:scale-105">
            经济学家 ✓
          </span>
          <span className="badge-glass badge-sky cursor-pointer hover:scale-105">
            心理学家
          </span>
          <span className="badge-glass badge-lavender cursor-pointer hover:scale-105">
            技术专家
          </span>
        </div>
      </div>
      
      {/* 提交按钮 */}
      <button type="submit" className="btn-glass-primary w-full py-4 text-lg focus-ring">
        🚀 启动辩论
      </button>
    </form>
  </div>
</div>
```

---

## 🔧 自定义与扩展

### 添加新颜色

```css
/* 在 index.css 的 :root 中添加 */
:root {
  /* ...existing colors... */
  
  --color-mint: #A7F3D0;  /* 薄荷绿 */
  --color-rose: #FECDD3;  /* 玫瑰粉 */
}

/* 在 tailwind.config.js 中注册 */
colors: {
  'brand-mint': '#A7F3D0',
  'brand-rose': '#FECDD3',
}
```

### 创建自定义毛玻璃样式

```css
/* 在 index.css 的 @layer components 中添加 */
@layer components {
  .glass-custom {
    background: rgba(167, 243, 208, 0.3);  /* 薄荷绿半透明 */
    backdrop-filter: blur(16px);
    border: 1px solid rgba(167, 243, 208, 0.4);
    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.15);
    border-radius: 16px;
  }
}
```

### 深色模式定制

```css
.dark {
  /* 覆盖特定变量的深色模式值 */
  --color-cream: #FEF9C3;   /* 加深奶油黄 */
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);  /* 加强阴影 */
}
```

---

## ⚡ 性能优化建议

### 1. 毛玻璃性能注意事项

```jsx
❌ 避免 - 大面积毛玻璃:
<div className="glass fixed inset-0">全屏背景</div>

✅ 推荐 - 局部使用:
<header className="glass-nav">仅导航栏</header>
<main className="bg-bg-primary">主内容区用纯色</main>
```

### 2. 动画性能优化

```jsx
/* 只对 transform 和 opacity 属性做动画（GPU加速） */
.glass {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  /* ❌ 避免: transition: background 0.3s (触发重绘) */
}
```

### 3. 图片优化

```jsx
/* Logo 使用 SVG (矢量，任意缩放) */
<img src="/brain-itch-logo.svg" alt="Logo" className="w-16 h-16" />

/* 背景装饰使用 CSS 渐变 (无需图片请求) */
<div style={{ background: 'radial-gradient(circle, rgba(196,197,255,0.3), transparent)' }} />
```

---

## 🐛 常见问题排查

### Q1: 毛玻璃效果不显示？

**可能原因**:
- 浏览器不支持 `backdrop-filter`
- 元素没有设置半透明背景

**解决方案**:
```css
/* 添加 webkit 前缀兼容 Safari */
.glass {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);  /* 必须! */
  background: rgba(255, 255, 255, 0.65); /* 不能用不透明背景 */
}
```

### Q2: 文字在毛玻璃上看不清？

**解决方案**:
```jsx
/* 方法1: 使用强毛玻璃 */
<div className="glass-strong">
  <p className="text-text-primary">高对比度文本</p>
</div>

/* 方法2: 添加文字阴影增强可读性 */
<p className="text-text-primary drop-shadow-md">
  带阴影的文本
</p>
```

### Q3: 移动端毛玻璃卡顿？

**解决方案**:
```css
@media (max-width: 768px) {
  :root {
    --glass-blur: 12px;  /* 降低模糊半径 */
  }
  
  /* 减少同时存在的毛玻璃元素数量 */
  .mobile-no-glass {
    backdrop-filter: none;
    background: var(--bg-card);
  }
}
```

---

## 📚 相关资源

- **WCAG 无障碍报告**: [./WCAG-accessibility-report.md](./WCAG-accessibility-report.md)
- **配色方案详情**: [./color-palettes.md](./color-palettes.md)
- **Logo 设计说明**: [./logo-designs.md](./logo-designs.md)
- **交互式预览**: [./index.html](./index.html) (在浏览器中打开查看效果)

---

## 🔄 版本更新日志

### v2.0 (2026-05-09)
- ✅ 全新清透四色配色方案
- ✅ 完整毛玻璃组件库
- ✅ WCAG 2.1 AA 合规性验证
- ✅ 可爱挠头小人 SVG Logo
- ✅ 响应式优化
- ✅ 动画与微交互系统

### v1.0 (2026-05-08)
- 初始版本发布
- 基础颜色变量定义
- 传统卡片样式

---

*最后更新: 2026-05-09 14:35:00*  
*维护团队: UI Designer Agent*  
*反馈邮箱: design@example.com*
