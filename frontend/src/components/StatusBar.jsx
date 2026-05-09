import { BarChart3, CheckCircle, AlertTriangle, Activity, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';

export default function StatusBar() {
  const {
    debateStatus,
    currentPhase,
    currentRound,
    totalPhases,
    totalRounds,
    commitments,
    wsConnected,
    wsReconnecting,
  } = useDebateStore();

  const statusConfig = {
    idle: { color: 'text-gray-7', bg: 'bg-gray-7', label: '空闲' },
    running: { color: 'text-success-5', bg: 'bg-success-5', label: '进行中' },
    completed: { color: 'text-brand-5', bg: 'bg-brand-5', label: '已完成' },
    paused: { color: 'text-warning-5', bg: 'bg-warning-5', label: '已暂停' },
  };

  const status = statusConfig[debateStatus] || statusConfig.idle;

  return (
    <div className="h-[80px] bg-gray-1 border-t border-gray-3 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-5" />
          <div>
            <p className="text-small text-gray-7">阶段进度</p>
            <p className="text-body font-semibold">
              {currentPhase} / {totalPhases}
            </p>
          </div>
        </div>
        
        <div className="w-24 h-1.5 bg-gray-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-5 rounded-full transition-all duration-300"
            style={{ width: `${(currentPhase / totalPhases) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-brand-5" />
        <div>
          <p className="text-small text-gray-7">当前轮次</p>
          <p className="text-body font-semibold">
            {currentRound} / {totalRounds}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-success-5" />
        <div>
          <p className="text-small text-gray-7">承诺</p>
          <p className="text-h3 font-bold text-success-5">{commitments.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-warning-5" />
        <div>
          <p className="text-small text-gray-7">回溯验证</p>
          <p className="text-body font-semibold text-warning-5">待检查</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 ${status.bg} rounded-full animate-pulse`} />
        <span className={`text-body font-medium ${status.color}`}>{status.label}</span>
      </div>

      <div className="flex items-center gap-2">
        {wsConnected ? (
          <>
            <div className="w-2 h-2 bg-success-5 rounded-full animate-pulse" />
            <Wifi className="w-4 h-4 text-success-5" />
            <span className="text-small text-success-5">已连接</span>
          </>
        ) : wsReconnecting ? (
          <>
            <div className="w-2 h-2 bg-warning-5 rounded-full animate-pulse" />
            <RefreshCw className="w-4 h-4 text-warning-5 animate-spin" />
            <span className="text-small text-warning-5">重连中</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-error-5 rounded-full" />
            <WifiOff className="w-4 h-4 text-error-5" />
            <span className="text-small text-error-5">未连接</span>
          </>
        )}
      </div>
    </div>
  );
}
