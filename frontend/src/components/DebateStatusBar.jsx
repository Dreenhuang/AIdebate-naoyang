import { useDebateStore } from '../stores/debateStore';
import { CheckCircle, Circle, Wifi, WifiOff, Loader2, X } from 'lucide-react';

export default function DebateStatusBar() {
  const {
    debateStatus,
    currentPhase,
    currentRound,
    totalPhases,
    totalRounds,
    phases,
    wsConnected,
    wsReconnecting,
  } = useDebateStore();

  const statusConfig = {
    idle: { color: 'bg-gray-400', label: '空闲' },
    running: { color: 'bg-emerald-500', label: '进行中' },
    completed: { color: 'bg-brand-500', label: '已完成' },
    paused: { color: 'bg-warning-500', label: '已暂停' },
  };
  const status = statusConfig[debateStatus] || statusConfig.idle;

  return (
    <div className="h-12 bg-gradient-to-r from-gray-1 via-gray-2 to-gray-1 border-t border-border-primary px-4 flex items-center justify-between flex-shrink-0">
      {/* 左侧：阶段和轮次 */}
      <div className="flex items-center gap-4">
        {/* 阶段指示器 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">阶段:</span>
          <div className="flex items-center gap-1">
            {phases.map((phase, index) => {
              const isCompleted = index < currentPhase;
              const isCurrent = index === currentPhase;
              return (
                <div
                  key={phase.id}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-600'
                      : isCurrent
                        ? 'bg-brand-100 text-brand-600 animate-pulse'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle size={10} />
                  ) : (
                    <Circle size={10} />
                  )}
                  <span className="hidden sm:inline">{phase.name}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 轮次指示 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">轮次:</span>
          <span className="text-sm font-semibold text-text-primary">
            {currentRound} / {totalRounds}
          </span>
        </div>
      </div>

      {/* 中间：辩论状态 */}
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 ${status.color} rounded-full animate-pulse`} />
        <span className="text-sm font-medium text-text-primary">{status.label}</span>

        {/* 实时生成指示 */}
        {debateStatus === 'running' && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-100 rounded-full">
            <Loader2 size={10} className="text-brand-600 animate-spin" />
            <span className="text-xs text-brand-600 font-medium">实时生成中</span>
          </div>
        )}
      </div>

      {/* 右侧：连接状态 */}
      <div className="flex items-center gap-2">
        {wsConnected ? (
          <>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <Wifi size={12} className="text-emerald-500" />
            <span className="text-xs text-emerald-600">已连接</span>
          </>
        ) : wsReconnecting ? (
          <>
            <div className="w-2 h-2 bg-warning-500 rounded-full animate-pulse" />
            <Loader2 size={12} className="text-warning-500 animate-spin" />
            <span className="text-xs text-warning-600">重连中</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <WifiOff size={12} className="text-red-500" />
            <span className="text-xs text-red-600">未连接</span>
          </>
        )}
      </div>
    </div>
  );
}
