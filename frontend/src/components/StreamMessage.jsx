/**
 * 极简版：流式输出显示组件
 * V9.0 原则：程序可用性优先，不添加任何可能导致问题的动效
 */
import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';
import { useWebSocket } from '../hooks/useWebSocket';

export default function StreamMessage() {
  const { isStreaming, streamContent, canCancel } = useDebateStore();
  const { cancelRequest } = useWebSocket();
  const contentRef = useRef(null);

  // 自动滚动到底部
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamContent]);

  // 关键：只在非流式状态时隐藏
  if (!isStreaming) return null;

  // 安全获取内容长度
  const content = streamContent || '';

  return (
    <div className="p-4 border-l-4 border-blue-400 bg-gray-50">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-sm font-medium text-gray-700">AI 正在生成...</span>
          <span className="text-xs text-gray-400">({content.length} 字符)</span>
        </div>
        {canCancel && (
          <button
            onClick={() => cancelRequest()}
            className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
          >
            取消
          </button>
        )}
      </div>

      {/* 内容区域 */}
      <div
        ref={contentRef}
        className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto"
        style={{ minHeight: '40px' }}
      >
        {content.length > 0 ? content : (
          <span className="text-gray-400">等待 AI 响应...</span>
        )}
      </div>

      {/* 底部状态 */}
      <div className="mt-2 pt-2 border-t border-gray-200">
        <span className="text-xs text-gray-400">实时生成中</span>
      </div>
    </div>
  );
}
