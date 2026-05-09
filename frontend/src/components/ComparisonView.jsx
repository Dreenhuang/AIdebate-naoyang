import { useState } from 'react';
import { ArrowLeftRight, ChevronDown, ChevronUp, Lightbulb, Search } from 'lucide-react';

/**
 * 方案二：观点对比卡片式布局
 * 核心特点：
 * - 左右并列显示提案者/审查者观点
 * - 中间对比箭头连接关联内容
 * - 底部共识摘要
 * - 适合快速浏览和对比分析
 */
export default function ComparisonView({ messages }) {
  const [expandedRound, setExpandedRound] = useState(null);

  // 按轮次分组消息
  const rounds = groupMessagesByRound(messages);

  if (rounds.length === 0) {
    return (
      <div className="text-center text-text-muted py-10">
        <p>暂无对比内容</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {rounds.map((round, index) => {
        const isExpanded = expandedRound === index;
        return (
          <ComparisonRound
            key={index}
            round={round}
            roundIndex={index}
            isExpanded={isExpanded}
            onToggle={() => setExpandedRound(isExpanded ? null : index)}
          />
        );
      })}

      {/* 总体共识摘要 */}
      <ConsensusSummary messages={messages} />
    </div>
  );
}

/**
 * 将消息按轮次分组
 */
function groupMessagesByRound(messages) {
  const rounds = [];
  let currentRound = null;

  messages.forEach(msg => {
    if (msg.role === 'system') return;

    const msgRound = msg.round ?? 0;

    // 如果是新轮次或第一个轮次
    if (!currentRound || currentRound.round !== msgRound) {
      if (currentRound) rounds.push(currentRound);
      currentRound = { round: msgRound, phase: msg.phase, proposer: null, reviewer: null };
    }

    if (msg.role === '提案者') {
      currentRound.proposer = msg;
    } else if (msg.role === '审查者') {
      currentRound.reviewer = msg;
    }
  });

  if (currentRound) rounds.push(currentRound);

  return rounds;
}

/**
 * 单轮对比组件
 */
function ComparisonRound({ round, roundIndex, isExpanded, onToggle }) {
  const hasBoth = round.proposer && round.reviewer;

  return (
    <div className={`bg-bg-secondary/50 rounded-xl border border-border-primary overflow-hidden transition-all ${
      isExpanded ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
    }`}>
      {/* 轮次头部 - 可点击展开/折叠 */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-bg-hover/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* 轮次标识 */}
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-sm">
            {round.round + 1}
          </span>

          <div className="text-left">
            <h3 className="font-semibold text-text-primary text-sm">第{round.round + 1}轮辩论</h3>
            {(round.phase !== undefined) && (
              <span className="text-xs text-text-muted">{getPhaseName(round.phase)}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 快速预览标签 */}
          {hasBoth && (
            <>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs bg-proposer/10 text-proposer rounded-full">
                <Lightbulb size={12} /> 提案
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs bg-reviewer/10 text-reviewer rounded-full">
                <Search size={12} /> 审查
              </span>
            </>
          )}

          {/* 展开/折叠图标 */}
          {isExpanded ? (
            <ChevronUp size={18} className="text-text-muted" />
          ) : (
            <ChevronDown size={18} className="text-text-muted" />
          )}
        </div>
      </button>

      {/* 展开的内容区域 */}
      {isExpanded && (
        <div className="px-5 pb-5">
          {hasBoth ? (
            /* ===== 双方对比视图 ===== */
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-0 items-stretch mt-2">
              {/* 提案者卡片（左侧） */}
              <ComparisonCard
                role="proposer"
                message={round.proposer}
                side="left"
              />

              {/* 中央对比分隔线 */}
              <div className="hidden lg:flex flex-col items-center justify-center px-3 py-8">
                <div className="flex flex-col items-center gap-2">
                  <ArrowLeftRight size={20} className="text-brand-primary animate-pulse" />
                  <span className="text-xs text-text-muted writing-mode-vertical-rl rotate-180">VS</span>
                </div>
              </div>

              {/* 审查者卡片（右侧） */}
              <ComparisonCard
                role="reviewer"
                message={round.reviewer}
                side="right"
              />
            </div>
          ) : (
            /* ===== 单方视图（只有一方有消息）===== */
            <div className="mt-2">
              <ComparisonCard
                role={round.proposer ? 'proposer' : 'reviewer'}
                message={round.proposer || round.reviewer}
                side="full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 对比卡片组件
 */
function ComparisonCard({ role, message, side }) {
  const config = {
    proposer: {
      icon: Lightbulb,
      label: '💡 提案者',
      color: 'proposer',
      borderColor: 'border-l-proposer',
      bgColor: 'bg-proposer/5',
      headerBg: 'bg-proposer/10',
    },
    reviewer: {
      icon: Search,
      label: '🔍 审查者',
      color: 'reviewer',
      borderColor: 'border-r-reviewer',
      bgColor: 'bg-reviewer/5',
      headerBg: 'bg-reviewer/10',
    },
  };

  const cfg = config[role];
  const Icon = cfg.icon;

  return (
    <div className={`${cfg.bgColor} ${side === 'left' ? `rounded-l-xl ${cfg.borderColor} border-l-4` : ''} ${
      side === 'right' ? `rounded-r-xl ${cfg.borderColor} border-r-4` : ''
    } rounded-xl p-4 flex flex-col min-h-[120px]`}>
      {/* 卡片头部 */}
      <div className={`${cfg.headerBg} rounded-lg px-3 py-2 mb-3 flex items-center gap-2`}>
        <Icon size={14} className={`text-${cfg.color}`} />
        <span className={`text-xs font-semibold text-${cfg.color}`}>{cfg.label}</span>
        {message?.timestamp && (
          <span className="ml-auto text-xs text-text-muted">
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* 内容区域 - 控制行宽 */}
      <div className="flex-1 prose prose-sm dark:prose-invert max-w-none overflow-y-auto custom-scrollbar">
        {message ? (
          <ComparisonContent content={message.content} />
        ) : (
          <p className="text-text-muted text-sm italic">暂无内容</p>
        )}
      </div>

      {/* 关键点提取（如果有） */}
      {message && (
        <KeyPointsPreview content={message.content} role={role} />
      )}
    </div>
  );
}

/**
 * 对比内容渲染器
 */
function ComparisonContent({ content }) {
  // 提取前3个要点用于预览
  const lines = content.split('\n').filter(l => l.trim());
  const previewLines = lines.slice(0, 5); // 只显示前5行

  return (
    <div className="space-y-1.5">
      {previewLines.map((line, i) => {
        // 处理标题
        if (line.startsWith('# ')) {
          return (
            <h4 key={i} className="text-sm font-bold text-text-primary mt-2 first:mt-0 leading-snug">
              {line.replace(/^#+\s*/, '')}
            </h4>
          );
        }

        // 处理加粗
        if (line.startsWith('**') && line.includes('**')) {
          return (
            <p key={i} className="text-sm leading-relaxed">
              {renderInlineFormat(line)}
            </p>
          );
        }

        // 处理列表项
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\./.test(line.trim())) {
          return (
            <li key={i} className="text-sm text-text-secondary ml-4 list-disc leading-relaxed">
              {renderInlineFormat(line.replace(/^[-*\d.]\s*/, ''))}
            </li>
          );
        }

        // 普通段落
        if (line.trim()) {
          return (
            <p key={i} className="text-sm text-text-primary leading-relaxed my-1">
              {renderInlineFormat(line)}
            </p>
          );
        }

        return null;
      })}
      {lines.length > 5 && (
        <p className="text-xs text-text-muted italic mt-2">... 还有 {lines.length - 5} 行内容</p>
      )}
    </div>
  );
}

/**
 * 内联格式渲染
 */
function renderInlineFormat(text) {
  // 简单的加粗处理
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="text-brand-primary font-medium">{part}</strong> : part
  );
}

/**
 * 关键点预览提取
 */
function KeyPointsPreview({ content, role }) {
  // 提取包含"关键"、"核心"、"问题"、"矛盾"等关键词的句子
  const keywords = ['关键', '核心', '致命', '矛盾', '问题', '优势', '风险'];
  const lines = content.split('\n').filter(l => l.trim() && l.length > 10);
  const keyPoints = lines.filter(l => keywords.some(k => l.includes(k))).slice(0, 2);

  if (keyPoints.length === 0) return null;

  return (
    <div className={`mt-3 pt-3 border-t border-border-primary/30 ${
      role === 'proposer' ? 'border-proposer/20' : 'border-reviewer/20'
    }`}>
      <p className="text-xs text-text-muted mb-1 font-medium">📌 关键要点</p>
      <ul className="space-y-1">
        {keyPoints.map((point, i) => (
          <li key={i} className="text-xs text-text-secondary truncate">
            {point.length > 60 ? point.substring(0, 60) + '...' : point}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 阶段名称映射
 */
function getPhaseName(phase) {
  const names = {
    0: '需求洞察',
    1: '方案设计',
    2: '实现规划',
    3: '验证确认',
  };
  return names[phase] || `阶段${phase + 1}`;
}

/**
 * 共识摘要组件
 */
function ConsensusSummary({ messages }) {
  // 从所有消息中提取高频词汇作为"共识"
  const allContent = messages.map(m => m.content).join(' ');
  const points = extractMainPoints(allContent).slice(0, 3);

  return (
    <div className="mt-8 p-5 bg-gradient-to-r from-brand-primary/5 via-purple-500/5 to-pink-500/5 rounded-xl border border-brand-primary/20">
      <h3 className="flex items-center gap-2 font-bold text-text-primary mb-3">
        <span className="text-lg">📊</span>
        辩论总体摘要
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="讨论焦点"
          value={messages.filter(m => m.role === '提案者').length + '轮交锋'}
          color="brand-primary"
        />
        <SummaryCard
          title="涉及阶段"
          value={[...new Set(messages.map(m => m.phase))].length + '个阶段'}
          color="purple-500"
        />
        <SummaryCard
          title="总消息数"
          value={messages.length + '条'}
          color="pink-500"
        />
      </div>

      {points.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs text-text-muted mb-2 font-medium">🔑 主要议题</p>
          <div className="flex flex-wrap gap-2">
            {points.map((point, i) => (
              <span key={i} className="px-3 py-1.5 text-xs bg-white/80 backdrop-blur-sm rounded-full text-text-primary shadow-sm">
                #{point}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 摘要卡片
 */
function SummaryCard({ title, value, color }) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center shadow-sm">
      <p className="text-xs text-text-muted mb-1">{title}</p>
      <p className={`text-lg font-bold text-${color}`}>{value}</p>
    </div>
  );
}

/**
 * 简单的关键词提取（实际项目应使用NLP）
 */
function extractMainPoints(content) {
  // 匹配 ## 或 ### 开头的标题
  const headings = content.match(/#{1,3}\s+(.+)/g) || [];
  return headings
    .map(h => h.replace(/^#{1,3}\s+/, '').trim())
    .filter(h => h.length > 2 && h.length < 20)
    .slice(0, 5);
}