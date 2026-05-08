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
