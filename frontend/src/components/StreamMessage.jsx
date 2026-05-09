import { useEffect, useRef } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useDebateStore } from '../stores/debateStore';

/**
 * 🔥 V2.2 新增：流式输出显示组件
 * 实现逐字/逐块实时显示 AI 回复
 */
export default function StreamMessage() {
  const { isStreaming, streamContent, canCancel, cancelRequest } = useDebateStore();
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

        {/* 取消按钮 */}
        {canCancel && (
          <button
            onClick={cancelRequest}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all hover:scale-105 active:scale-95"
            title="取消当前生成"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            取消
          </button>
        )}
      </div>

      {/* 流式内容区域 */}
      <div
        ref={contentRef}
        className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed max-h-[400px] overflow-y-auto pr-2"
        style={{ minHeight: '60px' }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {streamContent}
        </ReactMarkdown>

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
