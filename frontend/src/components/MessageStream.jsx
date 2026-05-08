import { useEffect, useRef } from 'react';
import { MessageSquare, Play } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';
import MessageBubble from './MessageBubble';

export default function MessageStream() {
  const { messages, debateStatus, config } = useDebateStore();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col bg-bg-primary">
      {/* 消息流头部 */}
      <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-primary" />
          <h2 className="font-semibold">消息流</h2>
          <span className="text-xs text-text-muted">({messages.length} 条消息)</span>
        </div>
      </div>

      {/* 消息列表 */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg mb-2">等待辩论开始</p>
            <p className="text-sm">配置辩论参数后点击"开始辩论"</p>
            {config.topic && (
              <div className="mt-4 p-3 bg-bg-tertiary rounded-lg border border-border-primary max-w-md">
                <p className="text-sm text-text-secondary">当前话题:</p>
                <p className="text-sm text-text-primary mt-1">{config.topic}</p>
              </div>
            )}
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))
        )}
      </div>
    </div>
  );
}
