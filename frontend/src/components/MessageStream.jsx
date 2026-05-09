import { useEffect, useState, useRef } from 'react';
import {
  MessageSquare, Play, Columns2, List, Loader2, Brain, Sparkles,
  Download, FileText, CheckCircle, AlertCircle,
  Palette, Layers, GitBranch, ChevronDown, Zap
} from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import StreamMessage from './StreamMessage'; // 🔥 V2.2 新增

export default function MessageStream() {
  const { messages, debateStatus, config, isStreaming } = useDebateStore(); // 🔥 V2.2 新增 isStreaming
  const scrollRef = useRef(null);
  const [viewMode, setViewMode] = useState('timeline');
  const [cardStyle, setCardStyle] = useState('glass'); // 'glass' | 'classic' | 'minimal'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const showLoading = debateStatus === 'running' && (
    messages.length === 0 ||
    (messages.length > 0 && !isRoleMessage(messages[messages.length - 1]))
  );

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
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'timeline' ? 'bg-brand-primary text-white shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>
              <List size={14} className="inline mr-1"/>时间线
            </button>
            <button onClick={() => setViewMode('comparison')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'comparison' ? 'bg-brand-primary text-white shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>
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

      {/* 消息列表区域 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 relative">
        {messages.length === 0 && debateStatus === 'idle' ? (
          <EmptyState config={config} />
        ) : (
          <>
            {/* 🔥 V2.2 新增：流式输出显示 */}
            <StreamMessage />

            {showLoading && !isStreaming ? (
              <AILoadingIndicator />
            ) : viewMode === 'timeline' ? (
              <TimelineView messages={messages} cardStyle={cardStyle} />
            ) : (
              <ComparisonView messages={messages} cardStyle={cardStyle} />
            )}
          </>
        )}
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

// ===== 时间线视图（含错落布局+脉络线）=====
function TimelineView({ messages, cardStyle }) {
  const pairedMessages = [];
  let tempPair = { proposer: null, reviewer: null };

  messages.forEach(msg => {
    const nr = normalizeRole(msg.role);
    if (nr === 'system') { pairedMessages.push({ type: 'system', message: msg }); return; }
    if (nr === 'proposer') {
      if (tempPair.proposer) pairedMessages.push({ type: 'single', ...tempPair });
      tempPair.proposer = msg;
    } else if (nr === 'reviewer') {
      tempPair.reviewer = msg;
      pairedMessages.push({ type: 'pair', ...tempPair });
      tempPair = { proposer: null, reviewer: null };
    }
  });
  if (tempPair.proposer || tempPair.reviewer) pairedMessages.push({ type: 'single', ...tempPair });

  if (pairedMessages.length === 0 && messages.length > 0) {
    return <div className="space-y-4 max-w-3xl mx-auto">{messages.map((m,i)=><FallbackMessage key={i} message={m} cardStyle={cardStyle}/>)}</div>;
  }

  return (
    <div className="relative max-w-4xl mx-auto py-2">
      {/* 中央脉络线 */}
      <div className="absolute left-[26px] top-4 bottom-4 w-[3px] bg-gradient-to-b from-brand-primary via-purple-500 to-transparent rounded-full opacity-60"/>

      {pairedMessages.map((item, index) => {
        if (item.type === 'system') {
          return (
            <div key={index} className="flex justify-center my-8 relative z-10">
              <span className="text-xs text-text-muted bg-gradient-to-r from-bg-tertiary to-bg-secondary px-5 py-2 rounded-full border border-border-primary/50 shadow-sm relative z-10 font-medium">
                {item.message.content}
              </span>
              {/* 系统消息节点圆点 */}
              <div className="absolute left-[26px] top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gray-400 ring-4 ring-bg-primary z-20"/>
            </div>
          );
        }

        // 错落效果：奇数索引左偏，偶数索引右偏
        const staggerOffset = index % 2 === 0 ? '' : 'md:translate-x-8';

        if (item.type === 'pair') {
          return (
            <div key={index} className={`relative mb-12 ${staggerOffset}`}>
              {/* 节点圆点 */}
              <TimelineNode index={index} isPair={true}/>
              {/* 轮次标签 */}
              {(item.proposer?.round !== undefined) && (
                <div className="absolute left-14 top-0 text-xs font-bold text-brand-primary/70 bg-brand-primary/10 px-2 py-1 rounded-full">
                  第{item.proposer.round + 1}轮
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 pl-14 pt-8">
                <StaggeredCard role="proposer" message={item.proposer} side="left" style={cardStyle} index={index}/>
                <ConnectionLine/>
                <StaggeredCard role="reviewer" message={item.reviewer} side="right" style={cardStyle} index={index}/>
              </div>
            </div>
          );
        }

        return (
          <div key={index} className={`relative mb-8 ${staggerOffset}`}>
            <TimelineNode index={index} isPair={false}/>
            <div className={`pl-14 pt-6 ${index % 2 === 0 ? '' : 'md:pl-16'}`}>
              <StaggeredCard role={normalizeRole(item.proposer||item.reviewer?.role)} message={item.proposer||item.reviewer}
                side={!!item.proposer?'left':'right'} style={cardStyle} index={index}/>
            </div>
          </div>
        );
      })}
    </div>
  );
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
    proposer: { label:'💡 提案者', color:'emerald', icon:<LightbulbIcon/>, key:'proposer' },
    reviewer:{ label:'🔍 审查者', color:'orange', icon:<SearchIcon/>, key:'reviewer' },
    host:     { label:'🎙️ 主持人', color:'blue', icon:<MicIcon/>, key:'host' },
  };
  return configs[role] || configs.host;
}

function LightbulbIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6M10 22h4M12 2a7 7 0 017 7v0a7 7 0 01-7 7H5a7 7 0 01-7-7V9a7 7 0 017-7z"/></svg>; }
function SearchIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>; }
function MicIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="21"/></svg>; }
function ArrowLeftRight() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16V4m0 0L3 8l4 4m10 0v12m0 0l4-4-4-4"/></svg>; }

// ===== 内容渲染器 =====
function RenderContent({ content }) {
  if (!content) return <p className="text-text-muted italic">（无内容）</p>;
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>;
}

// ===== 角色名称标准化 =====
function normalizeRole(role) {
  if(!role)return'unknown';
  const map={'proposer':'proposer','reviewer':'reviewer','host':'host','moderator':'host','system':'system','提案者':'proposer','审查者':'reviewer','主持人':'host','系统':'system'};
  return map[role.toLowerCase()]||role.toLowerCase();
}

function isRoleMessage(msg){return['proposer','reviewer','host'].includes(normalizeRole(msg.role));}

function formatTime(ts){return ts?new Date(ts).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}):'';}

// ===== 兜底消息组件 =====
function FallbackMessage({ message, cardStyle }) {
  const nr=normalizeRole(message.role);
  return <StaggeredCard role={nr} message={message} side='left' style={cardStyle||'glass'} index={0}/>;
}

// ===== 对比视图（简化版）=====
function ComparisonView({ messages, cardStyle }) {
  const rounds=groupByRound(messages);
  if(rounds.length===0)return<div className="text-center text-text-muted py-10">暂无对比内容</div>;

  return(
    <div className="max-w-5xl mx-auto space-y-6">
      {rounds.map((round,i)=>(
        <div key={i} className="bg-bg-secondary/50 rounded-xl border border-border-primary overflow-hidden">
          <button className="w-full px-5 py-3 flex items-center justify-between hover:bg-bg-hover/50">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-sm flex items-center justify-center">{round.round+1}</span>
              <div className="text-left"><p className="font-semibold text-text-primary text-sm">第{round.round+1}轮辩论</p>{round.phase!==undefined&&<span className="text-xs text-text-muted">{getPhaseName(round.phase)}</span>}</div>
            </div>
            <ChevronDown size={18} className="text-text-muted"/>
          </button>
          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 mt-2">
              {round.proposer?<StaggeredCard role="proposer" message={round.proposer} side="left" style={cardStyle} index={i}/>:<div className="bg-proposer/5 rounded-xl p-4 text-center text-text-muted text-sm italic">暂无提案</div>}
              <div className="hidden lg:flex flex-col items-center justify-center"><ArrowLeftRight size={20} className="text-brand-primary/50"/></div>
              {round.reviewer?<StaggeredCard role="reviewer" message={round.reviewer} side="right" style={cardStyle} index={i}/>:<div className="bg-reviewer/5 rounded-xl p-4 text-center text-text-muted text-sm italic">暂无审查</div>}
            </div>
          </div>
        </div>
      ))}
      <ConsensusSummary messages={messages}/>
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