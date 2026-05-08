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
