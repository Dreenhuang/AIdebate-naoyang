/**
 * V11.0 消息流显示组件 - 修复空状态问题
 * 核心修复：当有消息时始终显示消息列表，不再显示"等待讨论开始"
 */
import { useEffect, useState, useRef } from 'react';
import { MessageSquare, Columns2, Clock, Swords, Mic } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';
import StreamMessage from './StreamMessage';

export default function MessageStream() {
  const { messages, debateStatus, isStreaming } = useDebateStore();
  const [viewMode, setViewMode] = useState('timeline');
  const scrollRef = useRef(null);

  // 自动滚动到底部（当有新消息或流式状态变化时）
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* 头部工具栏 */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">消息流</h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            ({messages.length} 条)
          </span>
          {isStreaming && (
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full animate-pulse">
              生成中...
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button 
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'timeline'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock size={14} className="inline mr-1"/>时间线
          </button>
          <button 
            onClick={() => setViewMode('comparison')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'comparison'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Columns2 size={14} className="inline mr-1"/>对比
          </button>
        </div>
      </div>

      {/* 消息列表区域 - V11.0 优化渲染逻辑 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* 优先级1：正在生成内容时，顶部显示加载动画 */}
        {isStreaming && (
          <StreamMessage />
        )}
        
        {/* 优先级2：有消息时，显示消息列表（无论是否在生成） */}
        {messages.length > 0 && (
          <>
            {viewMode === 'timeline' ? (
              <TimelineView messages={messages} />
            ) : viewMode === 'comparison' ? (
              <ComparisonView messages={messages} />
            ) : (
              <TimelineView messages={messages} />
            )}
          </>
        )}
        
        {/* 优先级3：没有消息且不在生成中，根据状态显示对应提示 */}
        {messages.length === 0 && !isStreaming && (
          debateStatus === 'idle' ? <EmptyState /> : <AILoadingIndicator />
        )}
      </div>
    </div>
  );
}

// ===== 空状态组件 =====
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
      <MessageSquare className="w-20 h-20 mb-4 opacity-30"/>
      <p className="text-xl mb-2 font-medium">等待讨论开始</p>
      <p className="text-sm opacity-70">配置参数后点击"开始讨论"</p>
    </div>
  );
}

// ===== AI加载指示器 =====
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
    const timer = setTimeout(() => setStatusIndex(prev => prev + 1), 2000);
    return () => clearTimeout(timer);
  }, [statusIndex]);

  return (
    <div className="flex flex-col items-center justify-center h-[400px]">
      <div className="mb-8">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
      <p className="text-lg font-semibold text-gray-900 mb-2">AI 正在准备...</p>
      <p className="text-sm text-gray-600">{statuses[statusIndex]}</p>
    </div>
  );
}

// ===== 时间线视图 (V12.0 优化版) =====
function TimelineView({ messages }) {
  const scrollRef = useRef(null);
  const consensusList = useDebateStore((state) => state.consensus);
  const phases = useDebateStore((state) => state.phases);

  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!messages || messages.length === 0) {
    return null;
  }

  // 安全获取 timelineItems，确保返回数组
  let timelineItems = [];
  try {
    timelineItems = buildTimelineItems(messages, phases) || [];
  } catch (e) {
    console.warn('[TimelineView] buildTimelineItems 出错:', e);
    timelineItems = [];
  }

  return (
    <div ref={scrollRef} className="relative">
      {/* V12.0 优化：增强图例 - 添加统计信息 */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-lg px-4 py-3">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
            <span className="text-xs text-gray-600 font-medium">正方 / 提案方</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-200" />
            <span className="text-xs text-gray-600 font-medium">主持人</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-200" />
            <span className="text-xs text-gray-600 font-medium">反方 / 审查方</span>
          </div>
        </div>
        {/* 统计信息 */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="bg-white px-2 py-1 rounded-md border border-gray-200">
            📝 {messages.length} 条消息
          </span>
          {Array.isArray(phases) && phases.length > 0 && (
            <span className="bg-white px-2 py-1 rounded-md border border-gray-200">
              🎯 {phases.length} 个阶段
            </span>
          )}
        </div>
      </div>

      {/* Timeline - V12.0: 增强视觉层次 */}
      <div className="relative pl-4">
        {/* Central timeline line - 渐变色效果 */}
        <div className="absolute left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-purple-400 to-emerald-400 rounded-full opacity-40 -translate-x-1/2 z-0" />

        {Array.isArray(timelineItems) && timelineItems.map((item, index) => {
          if (item.type === 'phase-marker') {
            return <PhaseMarker key={`phase-${index}`} item={item} />;
          }
          if (item.type === 'round-marker') {
            return <RoundMarker key={`round-${index}`} item={item} />;
          }
          return <TimelineMessageCard key={`msg-${index}`} item={item} index={index} />;
        })}
      </div>

      {/* Consensus summary - V12.0: 增强总结卡片 */}
      {Array.isArray(consensusList) && consensusList.length > 0 && (
        <div className="mt-8 relative pl-4">
          <div className="absolute left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-teal-400 rounded-full opacity-50 -translate-x-1/2 z-0" />
          <div className="relative z-10 flex justify-center mb-4">
            <div className="px-5 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full text-sm font-bold shadow-lg shadow-green-200 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0 1 1 0 002zm3 5a1 1 0 11-2 0 1 1 0 012z"/></svg>
              讨论总结
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{consensusList.length}个阶段</span>
            </div>
          </div>
          <div className="p-5 bg-gradient-to-br from-green-50 via-white to-teal-50 border-2 border-green-200 rounded-xl shadow-sm">
            {consensusList.map((item, idx) => (
              <div key={idx} className={`mb-4 p-4 bg-white rounded-xl shadow-sm border border-green-100 hover:border-green-300 transition-all last:mb-0 ${idx > 0 ? 'mt-3' : ''}`}>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-50">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="font-semibold text-sm text-gray-900">{item.phaseName || `阶段${idx + 1}共识`}</div>
                  <div className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    第{idx + 1}阶段
                  </div>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {item.summary || item.content || '（暂无摘要）'}
                </div>
                {Array.isArray(item.commitments) && item.commitments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-50">
                    <div className="text-xs text-green-700 font-semibold mb-2 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      核心承诺 ({item.commitments.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {item.commitments.map((c, ci) => (
                        <div key={ci} className="text-xs text-gray-600 ml-3 bg-green-50/50 px-2 py-1.5 rounded-md border border-green-100">
                          • {c.text || c.content || c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PhaseMarker({ item }) {
  return (
    <div className="relative z-10 flex justify-center my-7">
      <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white rounded-full shadow-xl shadow-blue-200/50 transform hover:scale-[1.02] transition-transform">
        <Swords size={18} />
        <span className="text-sm font-bold tracking-wide">{item.label}</span>
      </div>
    </div>
  );
}

function RoundMarker({ item }) {
  return (
    <div className="relative z-10 flex justify-center my-4">
      <div className="flex items-center gap-2.5 px-4 py-1.5 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-full shadow-lg text-xs font-semibold">
        <span className="w-6 h-6 rounded-full bg-white text-gray-700 flex items-center justify-center font-bold text-xs shadow-inner">
          {item.round}
        </span>
        <span>第 {item.round} 轮</span>
      </div>
    </div>
  );
}

function TimelineMessageCard({ item, index }) {
  const { msg, side, roleConfig } = item;

  if (side === 'center') {
    return (
      <div className="relative z-10 flex justify-center my-4">
        <div className="absolute left-4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-100 z-20 animate-pulse" />
        <div className="w-[90%] max-w-2xl">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-md shadow-blue-100/30 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-blue-100">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center shadow-md">
                <Mic size={16} />
              </div>
              <div>
                <span className="font-bold text-sm text-blue-900">{msg.roleName || getRoleLabel(msg.role)}</span>
                <span className="inline-flex items-center gap-1 ml-2 text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">
                  主持人引导
                </span>
              </div>
              {msg.timestamp && (
                <span className="ml-auto text-xs text-blue-400 bg-blue-50 px-2 py-1 rounded">{formatTime(msg.timestamp)}</span>
              )}
            </div>
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {msg.content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isLeft = side === 'left';

  return (
    <div className={`relative z-10 flex my-4 ${isLeft ? 'justify-start' : 'justify-end'}`}>
      {/* Timeline dot - 增强动画效果 */}
      <div className={`absolute left-4 top-7 -translate-x-1/2 w-4 h-4 rounded-full ${roleConfig.dotColor} ring-4 ${roleConfig.ringColor} z-20 shadow-md`} />

      {/* Connector line */}
      <div className={`absolute top-11 ${isLeft ? 'left-4 right-auto' : 'right-4 left-auto'} w-[calc(50%-28px)] h-0.5 ${roleConfig.lineColor} z-10`} />

      {/* Message card - 增强视觉层次 */}
      <div className={`w-[calc(50%-36px)] max-w-xl ${isLeft ? 'mr-auto' : 'ml-auto'}`}>
        <div className={`${roleConfig.cardBg} ${roleConfig.cardBorder} rounded-2xl p-5 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5`}>
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-black/5">
            <div className={`w-9 h-9 rounded-xl ${roleConfig.iconBg} ${roleConfig.iconText} flex items-center justify-center text-sm font-bold shadow-md`}>
              {roleConfig.iconChar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm ${roleConfig.nameColor}`}>{msg.roleName || getRoleLabel(msg.role)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${roleConfig.badgeBg} ${roleConfig.badgeText} font-medium`}>
                  {roleConfig.sideLabel}
                </span>
              </div>
            </div>
            {msg.timestamp && (
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded flex-shrink-0">{formatTime(msg.timestamp)}</span>
            )}
          </div>
          {/* V12.0: 内容区域增强可读性 */}
          <div className="text-sm text-gray-800 whitespace-pre-wrap leading-loose">
            {msg.content}
          </div>
          {/* 字数统计 */}
          {msg.content && (
            <div className="mt-3 pt-2 border-t border-black/5 flex justify-between text-xs text-gray-400">
              <span>{msg.content.length} 字</span>
              <span>第{msg.round || '?'}轮</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComparisonView({ messages }) {
  const rounds = groupByRound(messages);

  if (!Array.isArray(rounds) || rounds.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">暂无对比内容</div>
    );
  }

  return (
    <div className="space-y-6">
      {rounds.map((round, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                  {round.round + 1}
                </span>
                <p className="font-semibold text-sm text-gray-900">
                  第 {round.round + 1} 轮辩论
                </p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {round.proposer ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                      提
                    </span>
                    <span className="font-semibold text-sm text-gray-900">提案者</span>
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">
                    {round.proposer.content}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <p className="text-gray-400 text-sm italic">等待提案者发言...</p>
                </div>
              )}

              {round.reviewer ? (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                      审
                    </span>
                    <span className="font-semibold text-sm text-gray-900">审查者</span>
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">
                    {round.reviewer.content}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <p className="text-gray-400 text-sm italic">等待审查者发言...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function buildTimelineItems(messages, phases) {
  const items = [];
  let lastPhase = -1;
  let lastRound = -1;

  messages.forEach((msg) => {
    const role = normalizeRole(msg.role);
    const phase = msg.phase ?? 0;
    const round = msg.round ?? 0;

    if (role === 'system') {
      items.push({
        type: 'message',
        msg,
        side: 'center',
        roleConfig: getHostRoleConfig(),
      });
      return;
    }

    if (phase !== lastPhase && phase > 0) {
      const phaseInfo = phases?.[phase];
      items.push({
        type: 'phase-marker',
        label: phaseInfo?.name || `阶段 ${phase + 1}`,
        phase,
      });
      lastPhase = phase;
      lastRound = -1;
    }

    if (round !== lastRound) {
      items.push({
        type: 'round-marker',
        round,
        phase,
      });
      lastRound = round;
    }

    const side = getRoleSide(role);
    const roleConfig = getRoleTimelineConfig(role);

    items.push({
      type: 'message',
      msg,
      side,
      roleConfig,
    });

    return items;
  });
}

function getRoleSide(role) {
  const proRoles = [
    'proposer', 'pro-side', 'pros-side', 'presenter', 'ideator',
    'brainstormer', 'initiator', 'participant-a', 'main-ai',
    'dimension-1', 'dimension-2', 'ai', 'asker',
  ];
  const centerRoles = ['host', 'moderator', 'system', 'summarizer', 'judge', 'neutral'];
  const conRoles = [
    'reviewer', 'con-side', 'cons-side', 'critic', 'critic-logic',
    'critic-detail', 'critic-risk', 'questioner', 'supplementer',
    'participant-b', 'sub-ai', 'answerer', 'chainer',
    'dimension-3', 'expert-risk',
  ];

  if (centerRoles.includes(role)) return 'center';
  if (conRoles.includes(role)) return 'right';
  return 'left';
}

function getRoleTimelineConfig(role) {
  const configs = {
    proposer: {
      sideLabel: '正方',
      iconChar: '提',
      iconBg: 'bg-emerald-500',
      iconText: 'text-white',
      nameColor: 'text-emerald-800',
      cardBg: 'bg-emerald-50',
      cardBorder: 'border border-emerald-200',
      dotColor: 'bg-emerald-500',
      ringColor: 'ring-emerald-100',
      lineColor: 'bg-emerald-200',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-700',
    },
    reviewer: {
      sideLabel: '反方',
      iconChar: '审',
      iconBg: 'bg-orange-500',
      iconText: 'text-white',
      nameColor: 'text-orange-800',
      cardBg: 'bg-orange-50',
      cardBorder: 'border border-orange-200',
      dotColor: 'bg-orange-500',
      ringColor: 'ring-orange-100',
      lineColor: 'bg-orange-200',
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-700',
    },
    host: getHostRoleConfig(),
    moderator: getHostRoleConfig(),
  };

  return configs[role] || getDefaultRoleConfig(role);
}

function getHostRoleConfig() {
  return {
    sideLabel: '主持人',
    iconChar: '主',
    iconBg: 'bg-blue-500',
    iconText: 'text-white',
    nameColor: 'text-blue-800',
    cardBg: 'bg-blue-50',
    cardBorder: 'border border-blue-200',
    dotColor: 'bg-blue-500',
    ringColor: 'ring-blue-100',
    lineColor: 'bg-blue-200',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
  };
}

function getDefaultRoleConfig(role) {
  const isProLike = ['ideator', 'brainstormer', 'initiator', 'participant-a', 'main-ai', 'ai', 'asker'].includes(role);
  if (isProLike) {
    return {
      sideLabel: '发言方',
      iconChar: (role || '?')[0].toUpperCase(),
      iconBg: 'bg-emerald-500',
      iconText: 'text-white',
      nameColor: 'text-emerald-800',
      cardBg: 'bg-emerald-50',
      cardBorder: 'border border-emerald-200',
      dotColor: 'bg-emerald-500',
      ringColor: 'ring-emerald-100',
      lineColor: 'bg-emerald-200',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-700',
    };
  }
  return {
    sideLabel: '参与方',
    iconChar: (role || '?')[0].toUpperCase(),
    iconBg: 'bg-gray-500',
    iconText: 'text-white',
    nameColor: 'text-gray-800',
    cardBg: 'bg-gray-50',
    cardBorder: 'border border-gray-200',
    dotColor: 'bg-gray-500',
    ringColor: 'ring-gray-100',
    lineColor: 'bg-gray-200',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-700',
  };
}

function normalizeRole(role) {
  if (!role || typeof role !== 'string') return 'unknown';
  const map = {
    'proposer': 'proposer',
    'reviewer': 'reviewer',
    'host': 'host',
    'moderator': 'host',
    'system': 'system',
    'pro-side': 'pro-side',
    'con-side': 'con-side',
    '提案者': 'proposer',
    '审查者': 'reviewer',
    '主持人': 'host',
    '系统': 'system',
    '正方': 'pro-side',
    '反方': 'con-side',
  };
  const lowerRole = role.toLowerCase().trim();
  return map[lowerRole] || lowerRole;
}

function getRoleLabel(role) {
  const labels = {
    proposer: '提案者',
    reviewer: '审查者',
    host: '主持人',
    system: '系统',
    'pro-side': '正方',
    'con-side': '反方',
  };
  return labels[role] || role;
}

function formatTime(ts) {
  return ts ? new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';
}

function groupByRound(messages) {
  const rounds = [];
  let current = null;

  messages.forEach(m => {
    if (m.role === 'system' || normalizeRole(m.role) === 'system') return;

    const r = m.round ?? 0;
    if (!current || current.round !== r) {
      if (current) rounds.push(current);
      current = { round: r, phase: m.phase, proposer: null, reviewer: null };
    }

    const role = normalizeRole(m.role);
    if (role === 'proposer' || role === 'pro-side') current.proposer = m;
    else if (role === 'reviewer' || role === 'con-side') current.reviewer = m;
  });

  if (current) rounds.push(current);
  return rounds;
}
