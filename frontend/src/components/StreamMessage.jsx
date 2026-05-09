import { useEffect, useRef } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';
import { useWebSocket } from '../hooks/useWebSocket';

/**
 * 🔥 V2.2 修复版：流式输出显示组件
 * 1. 添加错误边界防止 Markdown 解析错误导致白屏
 * 2. 优化渲染逻辑，确保消息正确显示
 */
export default function StreamMessage() {
  const { isStreaming, streamContent, canCancel, cancelStream } = useDebateStore();
  const { cancelRequest } = useWebSocket();
  const contentRef = useRef(null);
  const cursorRef = useRef(null);

  // 自动滚动到底部
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamContent]);

  // 光标闪烁动画
  useEffect(() => {
    if (isStreaming && cursorRef.current) {
      const interval = setInterval(() => {
        if (cursorRef.current) {
          cursorRef.current.style.opacity = cursorRef.current.style.opacity === '0' ? '1' : '0';
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isStreaming]);

  if (!isStreaming || !streamContent) return null;

  // 🔥 简化版：直接显示为纯文本（最安全的方式）
  // 避免 ReactMarkdown 解析错误导致崩溃
  const renderContent = (content) => {
    if (!content) return null;

    // 如果内容太长（AI 回复通常较长），直接显示为纯文本
    if (content.length > 500) {
      // 将 Markdown 链接转换为可读文本
      const text = content
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')  // 链接
        .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')    // 粗体斜体
        .replace(/`([^`]+)`/g, '$1')                      // 行内代码
        .replace(/\$\$([^$]+)\$\$/g, '[$1]')              // LaTeX 公式 $$...$$
        .replace(/\$([^$\n]+)\$/g, '[$1]')                // LaTeX 公式 $...$
        .replace(/^#{1,6}\s+/gm, '')                       // 标题标记
        .replace(/^[-*+]\s+/gm, '• ')                     // 列表标记
        .replace(/^\d+\.\s+/gm, '')                       // 数字列表
        .replace(/>\s+/g, '')                             // 引用
        .replace(/\n{3,}/g, '\n\n');                      // 压缩多余空行

      return (
        <div className="whitespace-pre-wrap leading-relaxed">
          {text}
        </div>
      );
    }

    // 短内容也不使用 ReactMarkdown，直接显示
    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    );
  };

  return (
    <div className="mx-4 my-4 p-5 rounded-2xl bg-gradient-to-br from-brand-primary/10 via-purple-500/5 to-transparent border-l-4 border-brand-primary shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Sparkles className="w-5 h-5 text-brand-primary" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
          <span className="text-sm font-bold text-brand-primary">AI 正在生成...</span>
          <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full">
            {streamContent.length} 字符
          </span>
        </div>

        {/* 取消按钮 - 修复：通过 WebSocket 发送取消请求 */}
        {canCancel && (
          <button
            onClick={() => {
              console.log('[StreamMessage] 发送取消请求...');
              cancelRequest(); // 通过 WebSocket 发送取消
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all hover:scale-105 active:scale-95"
            title="取消当前生成"
          >
            <X size={12} />
            取消生成
          </button>
        )}
      </div>

      {/* 流式内容区域 - 直接显示纯文本 */}
      <div
        ref={contentRef}
        className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed max-h-[400px] overflow-y-auto pr-2"
        style={{ minHeight: '60px' }}
      >
        {renderContent(streamContent)}

        {/* 打字光标效果 */}
        <span
          ref={cursorRef}
          className="inline-block w-0.5 h-4 bg-brand-primary ml-0.5 align-middle"
          style={{ opacity: 1 }}
        />
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-text-muted">实时生成中</span>
        </div>

        <div className="flex items-center gap-2">
          {/* 波浪动画指示器 */}
          <div className="flex items-end gap-0.5 h-3">
            {[0.6, 1, 0.8, 1.2, 0.7].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-brand-primary/60 rounded-full animate-bounce"
                style={{
                  height: `${h * 8}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 简化版流式指示器（用于紧凑场景）
 */
export function StreamIndicator() {
  const { isStreaming, streamContent } = useDebateStore();

  if (!isStreaming) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-brand-primary/10 rounded-lg border border-brand-primary/30">
      <Loader2 className="w-4 h-4 text-brand-primary animate-spin" />
      <span className="text-xs text-brand-primary font-medium">
        正在生成... ({streamContent.length} 字符)
      </span>
      <span className="flex items-end gap-0.5 h-2 ml-auto">
        {[0.6, 1, 0.8].map((h, i) => (
          <div
            key={i}
            className="w-0.5 bg-brand-primary rounded-full animate-bounce"
            style={{
              height: `${h * 6}px`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </span>
    </div>
  );
}
