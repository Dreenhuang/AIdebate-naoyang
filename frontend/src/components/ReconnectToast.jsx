import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export function ReconnectToast({
  isReconnecting,
  attemptCount,
  nextRetryIn,
  isMaxAttemptsReached,
  onManualReconnect,
  maxAttempts,
}) {
  if (isMaxAttemptsReached) {
    return (
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
        <div className="bg-warning/10 border border-warning/30 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-warning">
              连接失败
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              已尝试 {attemptCount} 次，仍无法连接服务器
            </p>
          </div>
          <button
            onClick={onManualReconnect}
            className="ml-2 px-3 py-1.5 text-xs font-medium bg-warning text-white rounded-md hover:bg-warning/90 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            手动重连
          </button>
        </div>
      </div>
    );
  }

  if (isReconnecting) {
    return (
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
        <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-brand-primary animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-brand-primary">
              正在重新连接...
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              第 {attemptCount}/{maxAttempts} 次尝试 · {nextRetryIn}秒后重试
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function ConnectionStatus({ isConnected, isReconnecting }) {
  if (isConnected) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
        <Wifi className="w-4 h-4 text-success" />
        <span className="text-xs text-success">已连接</span>
      </div>
    );
  }

  if (isReconnecting) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
        <RefreshCw className="w-4 h-4 text-warning animate-spin" />
        <span className="text-xs text-warning">重连中</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 bg-error rounded-full" />
      <WifiOff className="w-4 h-4 text-error" />
      <span className="text-xs text-error">未连接</span>
    </div>
  );
}
