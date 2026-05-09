import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';
import { offlineManager } from '../utils/offlineManager';

/**
 * 🔥 V2.2 新增：离线状态指示器
 * 显示当前网络状态和待处理操作数量
 */
export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueLength, setQueueLength] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineManager.subscribe((event) => {
      switch (event.type) {
        case 'online':
          setIsOnline(true);
          break;
        case 'offline':
          setIsOnline(false);
          break;
        case 'queue_updated':
        case 'retry_complete':
          setQueueLength(event.queueLength || event.remainingCount || 0);
          break;
      }
    });

    // 初始状态
    const status = offlineManager.getStatus();
    setIsOnline(status.isOnline);
    setQueueLength(status.queueLength);

    return unsubscribe;
  }, []);

  /**
   * 手动重试队列中的操作
   */
  const handleRetry = async () => {
    if (retrying || queueLength === 0) return;

    setRetrying(true);
    try {
      await offlineManager.retryQueue();
    } finally {
      setRetrying(false);
    }
  };

  /**
   * 清空队列
   */
  const handleClear = () => {
    if (window.confirm('确定要清空所有缓存的操作吗？')) {
      offlineManager.clearQueue();
      setQueueLength(0);
    }
  };

  // 在线时不显示（或显示简化版）
  if (isOnline && queueLength === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ${
      isOnline ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
    } backdrop-blur-md rounded-xl border px-4 py-3 shadow-lg max-w-sm`}>
      {/* 主内容 */}
      <div className="flex items-center gap-3">
        {/* 状态图标 */}
        <div className={`p-2 rounded-lg ${
          isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
        </div>

        {/* 文字信息 */}
        <div className="flex-1">
          <p className={`text-sm font-medium ${
            isOnline ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {isOnline ? '网络已恢复' : '离线模式'}
          </p>
          {!isOnline && (
            <p className="text-xs text-text-muted mt-0.5">
              操作将自动缓存，恢复后重试
            </p>
          )}
          {queueLength > 0 && (
            <p className="text-xs text-yellow-400 mt-0.5 flex items-center gap-1">
              <AlertCircle size={12} />
              {queueLength} 个操作等待处理
            </p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {queueLength > 0 && isOnline && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="p-2 rounded-lg bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/30 disabled:opacity-50 transition-all"
              title="立即重试"
            >
              <RefreshCw size={16} className={retrying ? 'animate-spin' : ''} />
            </button>
          )}

          {queueLength > 0 && (
            <button
              onClick={() => setShowDetail(!showDetail)}
              className="p-2 rounded-lg bg-bg-tertiary text-text-muted hover:text-text-primary transition-all"
              title="查看详情"
            >
              <span className="text-xs font-bold">{queueLength}</span>
            </button>
          )}
        </div>
      </div>

      {/* 展开的详情面板 */}
      {showDetail && queueLength > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>待处理操作</span>
            <button
              onClick={handleClear}
              className="text-red-400 hover:text-red-300"
            >
              清空全部
            </button>
          </div>

          <div className="max-h-32 overflow-y-auto space-y-1">
            {offlineManager.getStatus().queue.slice(-5).map((op, i) => (
              <div
                key={op.id || i}
                className="flex items-center justify-between p-2 bg-bg-secondary/50 rounded text-xs"
              >
                <span className="text-text-secondary">{op.type}</span>
                <span className="text-text-muted">
                  重试{op.retries || 0}次 · {new Date(op.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {queueLength > 5 && (
              <p className="text-center text-xs text-text-muted py-1">
                ...还有 {queueLength - 5} 条
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 简化版离线徽章（用于 Header 等紧凑场景）
 */
export function OfflineBadge() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const unsubscribe = offlineManager.subscribe((event) => {
      if (event.type === 'online') setIsOffline(false);
      if (event.type === 'offline') setIsOffline(true);
    });
    return unsubscribe;
  }, []);

  if (!isOffline) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 text-red-400 rounded-full animate-pulse">
      <WifiOff size={12} />
      <span className="text-xs font-medium">离线</span>
    </div>
  );
}
