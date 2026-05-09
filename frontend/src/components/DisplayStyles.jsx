/**
 * PRD辩论系统 - 显示样式组件
 * 根据讨论模式选择不同的显示布局
 */
import { useModeStore } from '../stores/modeStore';

// 气泡式显示（适合一对一商量类）
export function BubbleDisplay({ messages, currentMode }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {messages.map((msg, index) => {
        const isLeft = msg.roleType === 'participant-a' || msg.roleType === 'proposer' || msg.roleType === 'asker';
        return (
          <div
            key={index}
            className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                isLeft
                  ? 'bg-gray-2 text-gray-9 rounded-tl-none'
                  : 'bg-brand-5 text-white rounded-tr-none'
              }`}
            >
              <div className="text-xs font-medium mb-1 opacity-70">{msg.roleName || msg.role}</div>
              <div className="text-body">{msg.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 圆桌式显示（适合多人讨论类）
export function RoundTableDisplay({ messages, currentMode }) {
  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className="bg-gray-2 rounded-xl p-4 border border-gray-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-brand-5 text-white flex items-center justify-center text-sm font-bold">
                {msg.roleName?.[0] || msg.role?.[0] || '?'}
              </div>
              <div>
                <div className="font-medium text-gray-9">{msg.roleName || msg.role}</div>
                <div className="text-xs text-gray-6">{msg.phaseName || msg.phaseId}</div>
              </div>
            </div>
            <div className="text-body text-gray-8">{msg.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 对抗式显示（适合辩论类）
export function DebateDisplay({ messages, currentMode }) {
  const pros = messages.filter(m => m.roleType === 'pro-side' || m.roleType === 'proposer');
  const cons = messages.filter(m => m.roleType === 'con-side');
  const others = messages.filter(m => m.roleType !== 'pro-side' && m.roleType !== 'con-side' && m.roleType !== 'proposer');

  return (
    <div className="p-4">
      {/* 对抗区域 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* 正方 */}
        <div className="bg-emerald-5/10 rounded-xl p-4 border border-emerald-5/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-5 text-white flex items-center justify-center text-sm font-bold">
              正
            </div>
            <div className="font-semibold text-emerald-7">正方观点</div>
          </div>
          <div className="space-y-2">
            {pros.map((msg, i) => (
              <div key={i} className="text-body text-gray-8 bg-white/50 rounded-lg p-3">
                {msg.content}
              </div>
            ))}
            {pros.length === 0 && (
              <div className="text-body text-gray-6 italic">暂无正方发言</div>
            )}
          </div>
        </div>

        {/* 反方 */}
        <div className="bg-red-5/10 rounded-xl p-4 border border-red-5/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-red-5 text-white flex items-center justify-center text-sm font-bold">
              反
            </div>
            <div className="font-semibold text-red-7">反方观点</div>
          </div>
          <div className="space-y-2">
            {cons.map((msg, i) => (
              <div key={i} className="text-body text-gray-8 bg-white/50 rounded-lg p-3">
                {msg.content}
              </div>
            ))}
            {cons.length === 0 && (
              <div className="text-body text-gray-6 italic">暂无反方发言</div>
            )}
          </div>
        </div>
      </div>

      {/* 其他发言 */}
      {others.length > 0 && (
        <div className="bg-gray-2 rounded-xl p-4">
          <div className="font-medium text-gray-9 mb-3">其他讨论</div>
          <div className="space-y-2">
            {others.map((msg, i) => (
              <div key={i} className="text-body text-gray-8">
                <span className="font-medium text-brand-5">{msg.roleName || msg.role}:</span> {msg.content}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 流程步骤式显示（适合决策类）
export function StepDisplay({ messages, currentMode }) {
  return (
    <div className="p-4">
      {/* 流程指示 */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {currentMode?.flow?.map((step, i) => (
          <div key={i} className="flex items-center">
            <div className={`px-3 py-1.5 rounded-full text-small font-medium ${
              i === currentMode.flow.length - 1
                ? 'bg-brand-5 text-white'
                : 'bg-gray-2 text-gray-6'
            }`}>
              {step.label}
            </div>
            {i < currentMode.flow.length - 1 && (
              <div className="w-6 h-px bg-gray-3 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* 消息列表 */}
      <div className="space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className="bg-gray-2 rounded-xl p-4 border-l-4 border-brand-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-brand-5/10 text-brand-5 rounded text-xs font-medium">
                {msg.phaseName || `步骤 ${msg.phase}`}
              </span>
              <span className="font-medium text-gray-9">{msg.roleName || msg.role}</span>
            </div>
            <div className="text-body text-gray-8">{msg.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 卡片发散式显示（适合头脑风暴类）
export function CardDisplay({ messages, currentMode }) {
  return (
    <div className="p-4">
      {/* 创意收集区 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-brand-5/10 to-purple-5/10 rounded-xl p-4 border border-brand-5/20 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-brand-5 text-white flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <div className="font-medium text-gray-9 text-sm">{msg.roleName || msg.role}</div>
            </div>
            <div className="text-body text-gray-8">{msg.content}</div>
          </div>
        ))}
      </div>

      {/* 统计 */}
      <div className="flex items-center justify-center gap-4 text-sm text-gray-6">
        <span>共 {messages.length} 条创意</span>
        <span>|</span>
        <span>预计 5-8 条高分创意</span>
      </div>
    </div>
  );
}

// 中心辐射式显示（适合AI协同类）
export function HubSpokeDisplay({ messages, currentMode }) {
  const mainAI = messages.find(m => m.roleType === 'main-ai' || m.role === '主AI');
  const subAIs = messages.filter(m => m !== mainAI);

  return (
    <div className="p-4">
      {/* 主AI居中 */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-5 to-purple-5 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            🤖
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-5 text-white text-xs rounded-full">
            主AI
          </div>
        </div>
      </div>

      {/* 主AI内容 */}
      {mainAI && (
        <div className="bg-brand-5/10 rounded-xl p-4 mb-4 max-w-2xl mx-auto border border-brand-5/20">
          <div className="font-medium text-brand-7 mb-2">🤖 {mainAI.roleName || '主AI'}</div>
          <div className="text-body text-gray-8">{mainAI.content}</div>
        </div>
      )}

      {/* 副AI们 */}
      <div className="grid grid-cols-3 gap-4">
        {subAIs.map((msg, index) => (
          <div
            key={index}
            className="bg-gray-2 rounded-xl p-4 border border-gray-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-purple-5 text-white flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <div className="font-medium text-gray-9 text-sm">{msg.roleName || msg.role}</div>
            </div>
            <div className="text-body text-gray-8">{msg.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 默认显示（传统消息流）
export function DefaultDisplay({ messages, currentMode }) {
  return (
    <div className="space-y-4">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex ${msg.roleType === 'host' || msg.role === '主持人' ? 'justify-center' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] px-4 py-3 rounded-2xl ${
              msg.roleType === 'host' || msg.role === '主持人'
                ? 'bg-gray-2 text-gray-6 text-center text-sm'
                : msg.roleType === 'reviewer' || msg.roleType === 'critic'
                ? 'bg-warning-5/10 text-warning-7 rounded-tl-none'
                : 'bg-brand-5 text-white rounded-tl-none'
            }`}
          >
            <div className="text-xs font-medium mb-1 opacity-70">{msg.roleName || msg.role}</div>
            <div className="text-body">{msg.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 显示样式选择器
export function getDisplayComponent(displayStyle) {
  switch (displayStyle) {
    case 'bubble':
      return BubbleDisplay;
    case 'roundtable':
      return RoundTableDisplay;
    case 'debate':
      return DebateDisplay;
    case 'step':
      return StepDisplay;
    case 'card':
      return CardDisplay;
    case 'hub-spoke':
      return HubSpokeDisplay;
    default:
      return DefaultDisplay;
  }
}

export default {
  BubbleDisplay,
  RoundTableDisplay,
  DebateDisplay,
  StepDisplay,
  CardDisplay,
  HubSpokeDisplay,
  DefaultDisplay,
  getDisplayComponent,
};