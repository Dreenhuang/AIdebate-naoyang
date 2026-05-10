import { useEffect, useState, useRef } from 'react';
import {
  MessageSquare, Play, Columns2, List, Loader2, Brain, Sparkles,
  Download, FileText, CheckCircle, AlertCircle,
  Palette, Layers, GitBranch, ChevronDown, Zap, X, Expand,
  User, MessageCircle, Quote, Mic, ClipboardCheck, ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useDebateStore } from '../stores/debateStore';
import { useModeStore } from '../stores/modeStore';
import StreamMessage from './StreamMessage'; // 🔥 V2.2 新增
import { getDisplayComponent } from './DisplayStyles';

export default function MessageStream() {
  const { messages, debateStatus, config, isStreaming } = useDebateStore(); // 🔥 V2.2 新增 isStreaming
  const { currentMode } = useModeStore();
  const scrollRef = useRef(null);
  const [viewMode, setViewMode] = useState('timeline');
  const [cardStyle, setCardStyle] = useState('glass'); // 'glass' | 'classic' | 'minimal'

  // 根据当前模式获取显示组件
  const DisplayComponent = currentMode?.displayStyle ? getDisplayComponent(currentMode.displayStyle) : null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 🔥 修复：确保流式输出时正确显示，同时显示之前已保存的消息
  // 仅在非流式且辩论运行中、且消息为空时显示加载状态
  const showLoading = !isStreaming && debateStatus === 'running' && messages.length === 0;

  return (
    <div className="flex-1 flex flex-col bg-bg-primary h-full">
      {/* 头部工具栏 */}
      <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between flex-shrink-0 bg-bg-secondary/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-primary" />
          <h2 className="font-semibold text-text-primary">消息流</h2>
          <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full">({messages.length} 条)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* 视图模式切换 */}
          <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-0.5">
            <button onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'timeline'
                  ? 'bg-brand-5 text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}>
              <List size={14} className="inline mr-1"/>时间线
            </button>
            <button onClick={() => setViewMode('comparison')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'comparison'
                  ? 'bg-brand-5 text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}>
              <Columns2 size={14} className="inline mr-1"/>对比
            </button>
          </div>

          {/* 卡片风格切换 */}
          <div className="hidden md:flex items-center gap-1 bg-bg-tertiary rounded-lg p-0.5 ml-2">
            <button onClick={() => setCardStyle('glass')}
              className={`p-1.5 rounded-md transition-all ${cardStyle === 'glass' ? 'bg-purple-500/20 text-purple-400 shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
              title="玻璃态风格">
              <Palette size={14}/>
            </button>
            <button onClick={() => setCardStyle('classic')}
              className={`p-1.5 rounded-md transition-all ${cardStyle === 'classic' ? 'bg-blue-500/20 text-blue-400 shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
              title="经典卡片">
              <Layers size={14}/>
            </button>
            <button onClick={() => setCardStyle('minimal')}
              className={`p-1.5 rounded-md transition-all ${cardStyle === 'minimal' ? 'bg-green-500/20 text-green-400 shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
              title="极简线条">
              <GitBranch size={14}/>
            </button>
          </div>

          {/* 导出按钮 */}
          <ExportButtonInline messages={messages} config={config} />

          {debateStatus === 'running' && !showLoading && (
            <span className="flex items-center gap-1.5 text-xs text-brand-primary animate-pulse ml-2">
              <Play size={12}/> 辩论中
            </span>
          )}
        </div>
      </div>

      {/* 消息列表区域 - 改为左右布局：左侧30%流式输出，右侧70%卡片列表 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 左侧区域：流式输出 (30%) - 仅在流式输出时显示 */}
        <div className={`border-r border-border-primary overflow-y-auto bg-bg-primary transition-all duration-300 ${isStreaming ? 'w-[30%]' : 'w-0 border-none'}`}>
          {isStreaming && (
            <div className="p-4">
              {/* 🔥 V2.2 新增：流式输出显示 */}
              <StreamMessage />
            </div>
          )}
        </div>

        {/* 右侧区域：卡片列表 (70%) - 根据流式状态自适应宽度 */}
        <div ref={scrollRef} className={`overflow-y-auto p-4 relative transition-all duration-300 ${isStreaming ? 'w-[70%]' : 'w-full'}`}>
          {messages.length === 0 && debateStatus === 'idle' ? (
            <EmptyState config={config} />
          ) : (
            <>
              {/* 🔥 显示模式切换：如果模式配置了专用显示样式，显示样式切换器 */}
              {DisplayComponent && currentMode?.displayStyle !== 'default' && (
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-xs text-text-muted">显示模式:</span>
                  <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-0.5">
                    <button onClick={() => setViewMode('styled')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        viewMode === 'styled'
                          ? 'bg-brand-5 text-white shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}>
                      {currentMode?.icon} {currentMode?.name}
                    </button>
                    <button onClick={() => setViewMode('timeline')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        viewMode === 'timeline' || viewMode === 'comparison'
                          ? 'bg-gray-3 text-text-primary'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}>
                      默认视图
                    </button>
                  </div>
                </div>
              )}

              {/* 🔥 修复：根据状态显示加载指示器或消息列表 */}
              {showLoading || (messages.length === 0 && debateStatus === 'running') ? (
                <AILoadingIndicator />
              ) : viewMode === 'styled' && DisplayComponent ? (
                <DisplayComponent messages={messages} currentMode={currentMode} />
              ) : viewMode === 'timeline' ? (
                <TimelineView messages={messages} cardStyle={cardStyle} />
              ) : viewMode === 'comparison' ? (
                <ComparisonView messages={messages} cardStyle={cardStyle} />
              ) : (
                <TimelineView messages={messages} cardStyle={cardStyle} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== 空状态组件 =====
function EmptyState({ config }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-text-muted py-20">
      <MessageSquare className="w-16 h-16 mb-4 opacity-30"/>
      <p className="text-lg mb-2 font-medium">等待辩论开始</p>
      <p className="text-sm opacity-70">配置辩论参数后点击"开始辩论"</p>
      {config.topic && (
        <div className="mt-6 p-4 bg-bg-tertiary rounded-xl border border-border-primary max-w-md backdrop-blur-sm">
          <p className="text-sm text-text-secondary font-medium mb-2">当前话题:</p>
          <p className="text-sm text-text-primary leading-relaxed">{config.topic}</p>
        </div>
      )}
    </div>
  );
}

// ===== AI加载动效组件 =====
function AILoadingIndicator() {
  const [statusIndex, setStatusIndex] = useState(0);
  const statuses = [
    "正在分析话题核心...",
    "构建论证框架...",
    "调用深度思考模型...",
    "生成回复内容...",
    "即将完成..."
  ];

  useEffect(() => {
    if (statusIndex >= statuses.length - 1) return;
    const timer = setTimeout(() => setStatusIndex(prev => (prev + 1) % statuses.length), 2000);
    return () => clearTimeout(timer);
  }, [statusIndex]);

  return (
    <div className="flex flex-col items-center justify-center h-full py-20 animate-in fade-in duration-300">
      {/* 转圈动画 */}
      <div className="relative mb-8">
        <Loader2 className="w-12 h-12 text-brand-5 animate-spin" strokeWidth={2}/>
      </div>
      
      {/* 文字 */}
      <p className="text-base font-semibold text-gray-9 mb-2">AI 正在思考...</p>
      <p className="text-sm text-gray-6">{statuses[statusIndex]}</p>
      
      {/* 进度条 */}
      <div className="flex items-center gap-2 mt-6">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-brand-5/40"
            style={{animation: `dot 1.2s ease-in-out ${i*0.15}s infinite`}}/>
        ))}
      </div>
      <style>{`@keyframes dot{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1;background:#FF2442}}`}</style>
    </div>
  );
}

// ===== 总结卡片组件的 Markdown 渲染配置 =====
const summaryMarkdownComponents = {
  p: ({ children }) => <p className="text-sm text-gray-7 leading-relaxed mb-2">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-gray-8">{children}</strong>,
  ul: ({ children }) => <ul className="list-disc list-outside ml-5 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside ml-5 mb-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="text-sm text-gray-7 leading-relaxed">{children}</li>,
};

// ===== 时间线视图 - 重构版本：中央时间线 + 交替卡片布局 =====
function TimelineView({ messages, cardStyle }) {
  const [expandedCard, setExpandedCard] = useState(null);
  const scrollRef = useRef(null);
  // 🔥 BUG-005 FIX: 获取 consensus 数据用于显示总结卡片
  const consensusList = useDebateStore((state) => state.consensus);

  // 自动滚动到最新消息
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 按照时间顺序处理消息
  const timelineMessages = messages.map((msg, index) => ({
    ...msg,
    timelineIndex: index,
  }));

  if (timelineMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-muted py-20">
        <MessageSquare className="w-16 h-16 mb-4 opacity-30"/>
        <p className="text-lg mb-2 font-medium">等待辩论开始</p>
        <p className="text-sm opacity-70">配置辩论参数后点击"开始辩论"</p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="relative w-full py-6 px-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      {/* 中央时间线轨道 - 桌面端居中，移动端靠左 */}
      <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-brand-primary via-purple-500 to-gray-300 md:-translate-x-1/2 opacity-40"/>

      {/* 时间线节点列表 */}
      <div className="space-y-6 relative z-10 max-w-4xl mx-auto">
        {timelineMessages.map((item, index) => {
          const nr = normalizeRole(item.role);

          // 系统消息居中显示
          if (nr === 'system') {
            return (
              <div key={index} className="flex justify-center">
                <div className="relative">
                  <span className="text-xs text-text-muted bg-gradient-to-r from-bg-tertiary to-bg-secondary px-5 py-2 rounded-full border border-border-primary/50 shadow-sm font-medium">
                    {item.content}
                  </span>
                  {/* 节点圆点 */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gray-400 ring-2 ring-bg-primary"/>
                </div>
              </div>
            );
          }

          // 根据角色决定卡片位置
          const isModerator = nr === 'host';
          const isProposer = nr === 'proposer';
          const isReviewer = nr === 'reviewer';

          // 桌面端：主持人居中，提案者左侧，审查者右侧
          // 移动端：全部左对齐
          const isLeft = isProposer;
          const isRight = isReviewer;
          const isCenter = isModerator;

          return (
            <TimelineNodeCard
              key={index}
              message={item}
              role={nr}
              index={index}
              isLeft={isLeft}
              isRight={isRight}
              isCenter={isCenter}
              isExpanded={expandedCard === index}
              onToggle={() => setExpandedCard(expandedCard === index ? null : index)}
            />
          );
        })}
      </div>

      {/* 🔥 BUG-005 FIX: 显示总结卡片 */}
      {consensusList && consensusList.length > 0 && (
        <div className="mt-8 max-w-4xl mx-auto animate-fade-in">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck size={22} className="text-green-6" />
              <h3 className="font-bold text-lg text-green-8">讨论总结</h3>
              <ArrowRight size={18} className="text-green-5" />
            </div>
            {consensusList.map((item, idx) => (
              <div key={idx} className="mb-3 p-4 bg-white/90 rounded-lg shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-green-100 text-green-7 rounded-full flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="text-base font-semibold text-gray-8 mb-2">{item.title}</div>
                    <div className="text-sm text-gray-6 whitespace-pre-wrap">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={summaryMarkdownComponents}>
                        {item.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 展开详情弹窗 */}
      {expandedCard !== null && timelineMessages[expandedCard] && (
        <DebateCardModal
          message={timelineMessages[expandedCard]}
          role={normalizeRole(timelineMessages[expandedCard].role)}
          onClose={() => setExpandedCard(null)}
        />
      )}
    </div>
  );
}

// ===== 时间线节点卡片 =====
function TimelineNodeCard({ message, role, index, isLeft, isRight, isCenter, isExpanded, onToggle }) {
  const cfg = getRoleConfig(role);
  const content = message.content || '';
  const parsed = parseDebateContent(content);

  // 根据角色选择颜色
  const colors = {
    proposer: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-500',
      accent: 'bg-emerald-500',
      text: 'text-emerald-600',
      icon: 'bg-emerald-100',
    },
    reviewer: {
      bg: 'bg-orange-50',
      border: 'border-orange-500',
      accent: 'bg-orange-500',
      text: 'text-orange-600',
      icon: 'bg-orange-100',
    },
    host: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      accent: 'bg-blue-500',
      text: 'text-blue-600',
      icon: 'bg-blue-100',
    },
  };
  const color = colors[role] || colors.host;

  return (
    <div className={`relative flex items-start ${
      isCenter ? 'justify-center' : isLeft ? 'justify-start' : 'justify-end'
    }`}>
      {/* 桌面端：根据角色调整左边距实现交替效果 */}
      <div className={`hidden md:block w-[calc(50%-40px)] ${isRight ? 'md:order-3' : ''} ${isLeft ? 'md:order-1' : ''} ${isCenter ? 'md:w-[calc(33%-32px)]' : ''}`} />

      {/* 节点圆点 - 始终居中（相对于时间线） */}
      <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 border-bg-primary shadow-md z-20 ${
        role === 'proposer' ? 'bg-emerald-500' :
        role === 'reviewer' ? 'bg-orange-500' :
        'bg-blue-500'
      }`}>
        {index % 3 === 0 && (
          <Zap size={8} className="text-white absolute inset-0 m-auto" strokeWidth={2}/>
        )}
      </div>

      {/* 卡片主体 - 移动端始终全宽，桌面端根据位置 */}
      <div className={`w-full md:w-[calc(50%-40px)] ${
        isCenter ? 'md:w-[calc(33%-32px)] order-2' : isRight ? 'md:order-1' : 'order-2'
      }`}>
        <div className={`rounded-xl border-t-4 ${color.border} shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden max-h-[280px] relative ${
          isCenter ? 'border-l-4 bg-blue-50' : isLeft ? 'border-l-4 bg-emerald-50' : 'border-r-4 bg-orange-50'
        }`}
           style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
           onClick={onToggle}>
          {/* 内容区域（带渐变遮罩） */}
          <div className="p-4">
            {/* 卡片顶部 - 角色信息 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color.icon} ${color.text}`}>
                  {role === 'proposer' ? <User size={16}/> :
                   role === 'reviewer' ? <MessageCircle size={16}/> :
                   <Mic size={16}/>}
                </div>
                <div>
                  <p className="font-semibold text-sm text-text-primary">{cfg.label}</p>
                  <p className="text-xs text-text-muted">{cfg.subtitle}</p>
                </div>
              </div>
              {message.timestamp && (
                <span className="text-xs text-text-muted bg-white/60 px-2 py-0.5 rounded-full">
                  {formatTime(message.timestamp)}
                </span>
              )}
            </div>

            {/* 核心观点（带左边框的突出显示） */}
            {parsed.corePoint && (
              <div className={`p-3 rounded-lg mb-3 border-l-4 ${color.accent} bg-white/80`}>
                <p className="font-semibold text-sm text-text-primary leading-relaxed">
                  {parsed.corePoint}
                </p>
              </div>
            )}

            {/* 主要内容要点（带序号） */}
            {parsed.points.length > 0 && (
              <div className="space-y-2">
                {parsed.points.slice(0, 3).map((point, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${color.icon} ${color.text}`}>
                      {i + 1}
                    </span>
                    <span className="text-text-secondary leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 渐变遮罩 - 使用半透明遮罩而非透明 */}
          <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"/>

          {/* 卡片底部 - 查看详情按钮 */}
          <div className="absolute bottom-2 left-0 w-full flex justify-center z-10">
            <button className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/90 ${color.text} hover:opacity-80 transition-opacity shadow-sm`}>
              <Expand size={12}/>
              点击查看
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== 辩论卡片弹窗（查看完整内容）- 优化版 =====
function DebateCardModal({ message, role, onClose }) {
  const cfg = getRoleConfig(role);
  const content = message.content || '';
  const parsed = parseDebateContent(content);

  // 根据角色选择颜色 - 使用高对比度不透明配色
  const colors = {
    proposer: {
      bg: 'bg-white',
      border: 'border-emerald-500',
      accent: 'bg-emerald-500',
      headerBg: 'bg-emerald-50',
      corePointBg: 'bg-emerald-50',
      icon: 'bg-emerald-100',
      iconText: 'text-emerald-600'
    },
    reviewer: {
      bg: 'bg-white',
      border: 'border-orange-500',
      accent: 'bg-orange-500',
      headerBg: 'bg-orange-50',
      corePointBg: 'bg-orange-50',
      icon: 'bg-orange-100',
      iconText: 'text-orange-600'
    },
    host: {
      bg: 'bg-white',
      border: 'border-blue-500',
      accent: 'bg-blue-500',
      headerBg: 'bg-blue-50',
      corePointBg: 'bg-blue-50',
      icon: 'bg-blue-100',
      iconText: 'text-blue-600'
    },
  };
  const color = colors[role] || colors.host;

  // Markdown渲染的自定义样式
  const markdownComponents = {
    h1: ({ children }) => <h1 className="text-xl font-bold text-[#1a1a1a] mt-6 mb-3 leading-tight">{children}</h1>,
    h2: ({ children }) => <h2 className="text-lg font-bold text-[#1a1a1a] mt-5 mb-3 leading-tight">{children}</h2>,
    h3: ({ children }) => <h3 className="text-base font-semibold text-[#1a1a1a] mt-4 mb-2 leading-snug">{children}</h3>,
    h4: ({ children }) => <h4 className="text-sm font-semibold text-[#333333] mt-3 mb-2 leading-snug">{children}</h4>,
    p: ({ children }) => <p className="text-[15px] text-[#333333] leading-relaxed mb-3">{children}</p>,
    strong: ({ children }) => <strong className="font-bold text-[#1a1a1a]">{children}</strong>,
    em: ({ children }) => <em className="italic text-[#444444]">{children}</em>,
    ul: ({ children }) => <ul className="list-disc list-outside ml-5 mb-3 space-y-1.5">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-outside ml-5 mb-3 space-y-1.5">{children}</ol>,
    li: ({ children }) => <li className="text-[15px] text-[#333333] leading-relaxed pl-1">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 py-2 my-3 bg-gray-50 rounded-r-lg">
        {children}
      </blockquote>
    ),
    code: ({ inline, children }) =>
      inline ? (
        <code className="px-1.5 py-0.5 bg-gray-100 text-[#d63384] rounded text-sm font-mono">{children}</code>
      ) : (
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-3 text-sm">
          <code>{children}</code>
        </pre>
      ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-4 rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
    tbody: ({ children }) => <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>,
    th: ({ children }) => (
      <th className="px-4 py-3 text-left text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-sm text-[#333333]">{children}</td>
    ),
    hr: () => <hr className="my-6 border-t-2 border-gray-200" />,
    a: ({ href, children }) => (
      <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>

      {/* 弹窗主体 - 不透明背景 + 高对比度 */}
      <div className={`relative ${color.bg} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-300 border-t-4 ${color.border}`}
           onClick={(e) => e.stopPropagation()}
           style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        {/* 弹窗头部 - 不透明背景 */}
        <div className={`px-6 py-5 border-b border-gray-200 flex items-center justify-between ${color.headerBg}`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.icon} shadow-sm`}>
              {role === 'proposer' ? <User size={20} className={color.iconText}/> :
               role === 'reviewer' ? <MessageCircle size={20} className={color.iconText}/> :
               <Mic size={20} className={color.iconText}/>}
            </div>
            <div>
              <p className="font-bold text-[#1a1a1a] text-lg">{cfg.label}</p>
              <p className="text-sm text-[#666666] mt-0.5">{cfg.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-gray-100 border border-gray-200 flex items-center justify-center transition-all shadow-sm hover:shadow-md">
            <X size={18} className="#666666"/>
          </button>
        </div>

        {/* 弹窗内容区 - 优化滚动和排版 */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {/* 核心观点 - 高对比度显示 */}
          {parsed.corePoint && (
            <div className={`p-5 rounded-xl mb-5 border-l-4 ${color.accent} ${color.corePointBg} shadow-sm`}>
              <p className="font-bold text-[16px] text-[#1a1a1a] leading-relaxed">
                {parsed.corePoint}
              </p>
            </div>
          )}

          {/* Markdown内容渲染 - 完整支持GFM语法 */}
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {content}
            </ReactMarkdown>
          </div>
        </div>

        {/* 弹窗底部 - 固定位置 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end flex-shrink-0">
          <button onClick={onClose}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${color.accent} text-white hover:opacity-90 active:scale-95 shadow-md hover:shadow-lg`}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== 内容解析工具函数 =====
function parseDebateContent(content) {
  if (!content || typeof content !== 'string') {
    return { corePoint: '', points: [], raw: '' };
  }

  let corePoint = '';
  let points = [];
  const lines = content.split('\n');
  let foundCorePoint = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 跳过空行
    if (!line) continue;

    // 核心观点通常在开头，带有关键词
    if (!foundCorePoint && (line.includes('核心') || line.includes('主要') || line.includes('观点') || line.includes('论点'))) {
      // 提取核心观点内容
      const afterColon = line.split(/[：:]/).slice(1).join(':').trim();
      if (afterColon) {
        corePoint = afterColon;
        foundCorePoint = true;
        continue;
      }
    }

    // 收集要点（数字列表或项目符号）
    const numberedMatch = line.match(/^(\d+)[.、\s]+(.+)/);
    if (numberedMatch) {
      points.push(numberedMatch[2]);
      continue;
    }

    const bulletMatch = line.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      points.push(bulletMatch[1]);
      continue;
    }

    // 如果还没找到核心观点，且内容比较短（40字以内），可能是核心观点
    if (!foundCorePoint && line.length > 10 && line.length < 60 && !line.includes('。')) {
      corePoint = line;
      foundCorePoint = true;
    } else if (!foundCorePoint && line.length < 100) {
      // 取第一句话作为核心观点
      corePoint = line.replace(/^[#*>]+/, '').trim();
      foundCorePoint = true;
    }
  }

  // 如果没有找到核心观点，取第一段
  if (!corePoint && lines.length > 0) {
    const firstNonEmpty = lines.find(l => l.trim().length > 10);
    if (firstNonEmpty) {
      corePoint = firstNonEmpty.trim().replace(/^[#*>]+/, '').slice(0, 80);
    }
  }

  return { corePoint, points, raw: content };
}

// ===== 时间线节点圆点 =====
function TimelineNode({ index, isPair }) {
  return (
    <>
      <div className={`absolute left-[26px] top-7 w-4 h-4 -translate-x-1/2 rounded-full ${
        isPair ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 ring-4 ring-emerald-100 shadow-lg shadow-emerald-200/50'
         : 'bg-gradient-to-r from-brand-primary to-purple-500 ring-4 ring-brand-primary/20'
      } z-10 group-hover:scale-125 transition-transform duration-300 cursor-pointer`}>
        {isPair && <Zap size={8} className="text-white absolute inset-0 m-auto" strokeWidth={2}/>}
      </div>
      {/* 连接线到节点 */}
      <div className={`absolute left-[28px] top-11 w-[18px] h-[calc(100%-36px)] ${
        index % 2 === 0 ? 'border-l-2 border-dashed border-brand-primary/20' : 'border-l-2 border-dashed border-purple-300/20'
      }`}/>
    </>
  );
}

// ===== 连接线组件 =====
function ConnectionLine() {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center px-2 py-6">
      <div className="flex flex-col items-center gap-1.5">
        <ArrowLeftRight size={22} className="text-brand-primary/60 animate-pulse"/>
        <span className="text-[10px] text-text-muted font-bold tracking-widest writing-vertical-rl rotate-180">VS</span>
        <div className="w-8 h-[1px] bg-gradient-to-b from-brand-primary/40 to-transparent"/>
      </div>
    </div>
  );
}

// ===== 错落卡片组件（支持3种视觉风格）=====
function StaggeredCard({ role, message, side, style, index }) {
  const cfg = getRoleConfig(role);

  switch(style) {
    case 'glass':   return <GlassCard {...{role,message,side,cfg,index}}/>;
    case 'classic': return <ClassicCard {...{role,message,side,cfg,index}}/>;
    case 'minimal': return <MinimalCard {...{role,message,side,cfg,index}}/>;
    default: return <GlassCard {...{role,message,side,cfg,index}}/>;
  }
}

// ===== 风格1：玻璃态毛玻璃卡片 =====
function GlassCard({ role, message, side, cfg, index }) {
  return (
    <div className={`group relative rounded-2xl overflow-hidden backdrop-blur-xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
      side==='left'
        ? `bg-gradient-to-br from-${cfg.color}/10 via-${cfg.color}/5 to-transparent border-l-4 border-${cfg.color}`
        : `bg-gradient-to-bl from-${cfg.color}/10 via-${cfg.color}/5 to-transparent border-r-4 border-${cfg.color}`
    }`}>
      {/* 顶部光晕装饰 */}
      <div className={`absolute top-0 ${side==='left'?'left':'right'}-0 w-24 h-24 bg-${cfg.color}/20 rounded-full blur-3xl -z-0 group-hover:bg-${cfg.color}/30 transition-all duration-500`}/>
      
      <div className="p-5">
        {/* 头部 */}
        <div className={`flex items-center gap-2 mb-3 pb-3 border-b border-white/10`}>
          <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-${cfg.color} to-${cfg.color}/80 text-white rounded-full shadow-lg shadow-${cfg.color}/30`}>
            {cfg.label}
          </span>
          {message.timestamp && <span className="ml-auto text-xs text-text-muted/80">{formatTime(message.timestamp)}</span>}
        </div>

        {/* 内容 */}
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
          <RenderContent content={message.content}/>
        </div>

        {/* 底部标签 */}
        {(message.phase!==undefined||message.round!==undefined) && (
          <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
            {message.phase!==undefined&&<span className="text-xs bg-white/10 text-text-secondary px-2 py-1 rounded-full">阶段{message.phase}</span>}
            {message.round!==undefined&&<span className="text-xs bg-white/10 text-text-secondary px-2 py-1 rounded-full">轮次{message.round}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== 风格2：经典立体卡片 =====
function ClassicCard({ role, message, side, cfg, index }) {
  const shadows = {
    proposer: 'shadow-emerald-200/50 hover:shadow-emerald-300',
    reviewer: 'shadow-orange-200/50 hover:shadow-orange-300',
    host: 'shadow-blue-200/50 hover:shadow-blue-300',
  };

  return (
    <div className={`group relative rounded-xl overflow-hidden bg-bg-tertiary border border-border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${shadows[cfg.key]||''}`}>
      {/* 顶部彩色条 */}
      <div className={`h-1.5 bg-gradient-to-r from-${cfg.color} via-${cfg.color}/70 to-transparent`}/>
      
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-lg bg-${cfg.color}/15 flex items-center justify-center`}>{cfg.icon}</div>
          <span className="text-sm font-bold text-text-primary">{cfg.label}</span>
          {message.timestamp && <span className="ml-auto text-xs text-text-muted">{formatTime(message.timestamp)}</span>}
        </div>
        
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
          <RenderContent content={message.content}/>
        </div>

        {(message.phase!==undefined||message.round!==undefined) && (
          <div className="flex gap-2 mt-3 pt-2 border-t border-border-primary/30">
            {message.phase!==undefined&&<span className="text-xs text-text-muted bg-bg-secondary px-2 py-0.5 rounded">阶段{message.phase}</span>}
            {message.round!==undefined&&<span className="text-xs text-text-muted bg-bg-secondary px-2 py-0.5 rounded">轮次{message.round}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== 风格3：极简线条卡片 =====
function MinimalCard({ role, message, side, cfg, index }) {
  return (
    <div className={`group relative pl-6 py-4 border-l-2 border-${cfg.color}/40 hover:border-${cfg.color} hover:bg-${cfg.color}/5 transition-all duration-200 rounded-r-lg`}>
      {/* 左侧竖线装饰 */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-${cfg.color} to-${cfg.color}/20 rounded-l`}/>
      
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-bold uppercase tracking-wider text-${cfg.color}`}>{cfg.label.replace(/[💡🔍🎙️]/g,'').trim()}</span>
        {message.timestamp && <span className="text-xs text-text-muted ml-2">{formatTime(message.timestamp)}</span>}
        {(message.phase!==undefined||message.round!==undefined) && (
          <span className="ml-auto text-xs text-text-muted">R{message.round+1}P{message.phase+1}</span>
        )}
      </div>
      
      <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
        <RenderContent content={message.content}/>
      </div>
    </div>
  );
}

// ===== 角色配置获取 =====
function getRoleConfig(role) {
  const configs = {
    proposer: { label:'提案者', subtitle:'支持方观点', color:'emerald', icon:<LightbulbIcon/>, key:'proposer' },
    reviewer:{ label:'审查者', subtitle:'质疑方观点', color:'orange', icon:<SearchIcon/>, key:'reviewer' },
    host:     { label:'主持人', subtitle:'中立引导', color:'blue', icon:<MicIcon/>, key:'host' },
  };
  return configs[role] || configs.host;
}

function LightbulbIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6M10 22h4M12 2a7 7 0 017 7v0a7 7 0 01-7 7H5a7 7 0 01-7-7V9a7 7 0 017-7z"/></svg>; }
function SearchIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>; }
function MicIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="21"/></svg>; }
function ArrowLeftRight() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16V4m0 0L3 8l4 4m10 0v12m0 0l4-4-4-4"/></svg>; }

// ===== 内容渲染器 - 修复：直接显示纯文本，避免 ReactMarkdown 崩溃 =====
function RenderContent({ content }) {
  // 🔥 防御性检查：确保 content 是有效的字符串
  if (!content || typeof content !== 'string') {
    return <p className="text-text-muted italic">（无内容）</p>;
  }

  try {
    // 🔥 简化版：直接显示纯文本，避免 ReactMarkdown 解析错误
    // 将 Markdown 链接转换为可读文本
    const text = content
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')  // 链接
      .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')    // 粗体斜体
      .replace(/`([^`]+)`/g, '$1')                      // 行内代码
      .replace(/\$\$([^$]+)\$\$/g, '[$1]')              // LaTeX 公式 $$...$$
      .replace(/\$([^$\n]+)\$/g, '[$1]')                // LaTeX 公式 $...$
      .replace(/^#{1,6}\s+/gm, '')                       // 标题标记
      .replace(/^[-*+]\s+/gm, '• ')                     // 列表标记
      .replace(/^\d+\.\s+/gm, '')                       // 数字列表
      .replace(/>\s+/g, '')                             // 引用
      .replace(/\n{3,}/g, '\n\n');                      // 压缩多余空行

    return <div className="whitespace-pre-wrap leading-relaxed">{text}</div>;
  } catch (error) {
    // 🔥 如果处理失败，直接显示原始内容
    console.error('[RenderContent] Error processing content:', error);
    return <div className="whitespace-pre-wrap leading-relaxed">{String(content)}</div>;
  }
}

// ===== 角色名称标准化 =====
function normalizeRole(role) {
  // 🔥 防御性检查：确保 role 是有效的字符串
  if (!role || typeof role !== 'string') {
    return 'unknown';
  }
  const map = {
    'proposer': 'proposer',
    'reviewer': 'reviewer',
    'host': 'host',
    'moderator': 'host',
    'system': 'system',
    '提案者': 'proposer',
    '审查者': 'reviewer',
    '主持人': 'host',
    '系统': 'system'
  };
  const lowerRole = role.toLowerCase().trim();
  return map[lowerRole] || lowerRole;
}

function isRoleMessage(msg){return['proposer','reviewer','host'].includes(normalizeRole(msg.role));}

function formatTime(ts){return ts?new Date(ts).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}):'';}

// ===== 兜底消息组件 =====
function FallbackMessage({ message, cardStyle }) {
  const nr=normalizeRole(message.role);
  return <StaggeredCard role={nr} message={message} side='left' style={cardStyle||'glass'} index={0}/>;
}

// ===== 对比视图（优化版）=====
function ComparisonView({ messages, cardStyle }) {
  const rounds = groupByRound(messages);
  if (rounds.length === 0) {
    return <div className="text-center text-text-muted py-10">暂无对比内容</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {rounds.map((round, i) => (
        <div key={i} className="bg-surface-container-lowest rounded-2xl border border-border-primary overflow-hidden shadow-sm">
          {/* 轮次头部 */}
          <div className="px-5 py-4 bg-gradient-to-r from-bg-component to-transparent border-b border-border-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary font-bold text-lg flex items-center justify-center shadow-sm">
                  {round.round + 1}
                </span>
                <div className="text-left">
                  <p className="font-semibold text-text-primary text-base">第 {round.round + 1} 轮辩论</p>
                  {round.phase !== undefined && (
                    <span className="text-xs text-text-muted bg-bg-component px-2 py-0.5 rounded-full mt-0.5 inline-block">
                      {getPhaseName(round.phase)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-xs font-medium rounded-full">
                  💡 提案者
                </span>
                <span className="px-3 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                  🔍 审查者
                </span>
              </div>
            </div>
          </div>

          {/* 对比内容区 */}
          <div className="p-5">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_48px_1fr] gap-4">
              {/* 提案者卡片 */}
              {round.proposer ? (
                <ComparisonCard role="proposer" message={round.proposer} index={i} />
              ) : (
                <div className="bg-emerald-50/50 rounded-xl p-6 text-center border border-emerald-100">
                  <p className="text-emerald-400 text-sm italic">等待提案者发言...</p>
                </div>
              )}

              {/* VS 分隔线 */}
              <div className="hidden lg:flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-orange-400 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">VS</span>
                </div>
                <div className="w-0.5 h-full bg-gradient-to-b from-emerald-300 via-gray-300 to-orange-300 my-2" />
              </div>

              {/* 审查者卡片 */}
              {round.reviewer ? (
                <ComparisonCard role="reviewer" message={round.reviewer} index={i} />
              ) : (
                <div className="bg-orange-50/50 rounded-xl p-6 text-center border border-orange-100">
                  <p className="text-orange-400 text-sm italic">等待审查者发言...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      <ConsensusSummary messages={messages} />
    </div>
  );
}

// ===== 对比视图卡片组件 =====
function ComparisonCard({ role, message, index }) {
  const parsed = parseDebateContent(message.content || '');

  const colors = {
    proposer: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-400',
      accent: 'bg-emerald-500',
      text: 'text-emerald-600',
      icon: 'bg-emerald-100',
      label: '提案者',
    },
    reviewer: {
      bg: 'bg-orange-50',
      border: 'border-orange-400',
      accent: 'bg-orange-500',
      text: 'text-orange-600',
      icon: 'bg-orange-100',
      label: '审查者',
    },
  };
  const color = colors[role];

  return (
    <div className={`rounded-xl border-t-4 ${color.border} bg-surface-container-lowest shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden`}>
      {/* 卡片头部 */}
      <div className={`px-4 py-3 border-b border-border-primary ${color.bg}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.icon} ${color.text}`}>
            {role === 'proposer' ? <User size={14} /> : <MessageCircle size={14} />}
          </div>
          <span className="font-semibold text-sm text-text-primary">{color.label}</span>
          {message.timestamp && (
            <span className="ml-auto text-xs text-text-muted">
              {formatTime(message.timestamp)}
            </span>
          )}
        </div>
      </div>

      {/* 卡片内容 */}
      <div className="p-4">
        {/* 核心观点 */}
        {parsed.corePoint && (
          <div className={`p-3 rounded-lg mb-3 border-l-4 ${color.accent} ${color.bg}`}>
            <p className="font-semibold text-sm text-text-primary leading-relaxed">
              {parsed.corePoint}
            </p>
          </div>
        )}

        {/* 要点列表 */}
        {parsed.points.length > 0 && (
          <div className="space-y-2">
            {parsed.points.slice(0, 3).map((point, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${color.icon} ${color.text}`}>
                  {i + 1}
                </span>
                <span className="text-text-secondary leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function groupByRound(messages){
  const rounds=[];let current=null;
  messages.forEach(m=>{if(m.role==='system')return;const r=m.round??0;if(!current||current.round!==r){if(current)rounds.push(current);current={round:r,phase:m.phase,proposer:null,reviewer:null};}
    if(m.role==='proposer'||normalizeRole(m.role)==='proposer')current.proposer=m;
    else if(m.role==='reviewer'||normalizeRole(m.role)==='reviewer')current.reviewer=m;
  });
  if(current)rounds.push(current);return rounds;
}

function getPhaseName(p){const n={0:'需求洞察',1:'方案设计',2:'实现规划',3:'验证确认'};return n[p]||`阶段${p+1}`;}

function ConsensusSummary({messages}){
  const points=(messages.map(m=>m.content).join(' ').match(/#{1,3}\s+(.+)/g)||[]).map(h=>h.replace(/^#{1,3}\s+/,'').trim()).filter(h=>h.length>2&&h.length<20).slice(0,5);
  return(
    <div className="mt-8 p-6 bg-gradient-to-r from-brand-primary/5 via-purple-500/5 to-pink-500/5 rounded-2xl border border-brand-primary/20">
      <h3 className="flex items-center gap-2 font-bold text-text-primary mb-4"><span>📊</span>辩论总体摘要</h3>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <SummaryCard title="交锋轮数" value={`${messages.filter(m=>!m.role.includes('system')).length}轮`} color="brand-primary"/>
        <SummaryCard title="涉及阶段" value={`${[...new Set(messages.map(m=>m.phase))].length}个`} color="purple-500"/>
        <SummaryCard title="总消息数" value={`${messages.length}条`} color="pink-500"/>
      </div>
      {points.length>0&&(<div className="pt-4 border-t border-white/20"><p className="text-xs text-text-muted mb-2 font-medium">主要议题</p><div className="flex flex-wrap gap-2">{points.map((p,i)=><span key={i} className="px-3 py-1.5 text-xs bg-white/80 backdrop-blur-sm rounded-full text-text-primary shadow-sm">#{p}</span>)}</div></div>)}
    </div>
  );
}
function SummaryCard({title,value,color}){return(<div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center shadow-sm"><p className="text-xs text-text-muted mb-1">{title}</p><p className={`text-xl font-bold text-${color}`}>{value}</p></div>);}

// ===== 内联导出按钮 =====
function ExportButtonInline({ messages, config }) {
  const [exporting, setExporting]=useState(false);
  const [toast,setToast]=useState(null);

  const handleExport=async()=>{
    if(messages.length===0){setToast({type:'error',msg:'暂无可导出的内容'});setTimeout(()=>setToast(null),3000);return;}
    setExporting(true);
    try{
      const content=generateMarkdownReport(messages,config);
      downloadFile(content,`${new Date().toISOString().slice(0,10).replace(/-/g,'')}_${config.topic?.slice(0,20)||'辩论报告'}.md`,'text/markdown');
      setToast({type:'success',msg:'导出成功！'});
    }catch(e){
      console.error('[Export]',e);
      setToast({type:'error',msg:`导出失败:${e.message}`});
    }
    setExporting(false);
    setTimeout(()=>setToast(null),4000);
  };

  return(
    <div className="relative">
      <button onClick={handleExport} disabled={exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 shadow-md transition-all">
        <Download size={13}/>{exporting?'导出中...':'导出'}
      </button>
      {toast&&(
        <div className={`absolute top-full right-0 mt-2 px-3 py-2 rounded-lg shadow-lg text-xs font-medium whitespace-nowrap z-50 animate-in slide-in-from-top-2 duration-200 ${
          toast.type==='success'?'bg-emerald-500 text-white':'bg-red-500 text-white'
        }`}>
          {toast.type==='success'?<CheckCircle size={14} className="inline mr-1"/>:<AlertCircle size={14} className="inline mr-1"/>}{toast.msg}
        </div>
      )}
    </div>
  );
}

// ===== Markdown报告生成 =====
function generateMarkdownReport(messages,config){
  const date=new Date().toLocaleString('zh-CN');
  const roles=[...new Set(messages.filter(m=>!m.role.includes('system')).map(m=>m.role))];
  const lines=[
    `# 辩论报告`,
    ``,
    `**主题**: ${config.topic||'未指定话题'}`,
    `**日期**: ${date}`,
    `**参与角色**: ${roles.join(', ')}`,
    `**总消息数**: ${messages.length} 条`,
    ``,
    `---`,
    ``,
    `## 📋 讨论记录`,
    ``,
  ];
  
  let currentPhase=-1,currentRound=-1;
  messages.forEach((msg,i)=>{
    const nr=normalizeRole(msg.role);
    if(nr==='system'){
      lines.push(`### ${msg.content}`,``);return;
    }
    
    // 阶段/轮次分隔
    if(msg.phase!==undefined&&msg.phase!==currentPhase){
      currentPhase=msg.phase;
      lines.push(`---`,``,`## ${getPhaseName(msg.phase)}`,``);
    }
    if(msg.round!==undefined&&msg.round!==currentRound){
      currentRound=msg.round;
      lines.push(`### 第${msg.round+1}轮`,``);
    }
    
    lines.push(`#### ${nr==='proposer'?'💡 提案者':nr==='reviewer'?'🔍 审查者':'🎙️ 主持人'}`);
    lines.push(``);
    lines.push(msg.content.split('\n').map(l=>{
      if(!l.trim())return '';
      if(l.startsWith('#'))return l;
      if(l.startsWith('- ')||l.startsWith('* '))return l;
      return l;
    }).join('\n'));
    lines.push(``);
  });

  // 结论部分
  lines.push(`---`,``,`## ✅ 总结`,``,`本报告由 PRD Debate Dashboard 自动生成。`);

  return lines.join('\n');
}

// ===== 文件下载工具 =====
function downloadFile(content,filename,mimeType){
  const blob=new Blob([content],{type:mimeType});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}