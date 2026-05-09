import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const roleColors = {
  '主持人': 'bg-role-host',
  '提案者': 'bg-role-proposer',
  '审查者': 'bg-role-reviewer',
  'system': 'bg-role-system',
};

const roleIcons = {
  '主持人': User,
  '提案者': Bot,
  '审查者': Bot,
  'system': User,
};

export default function MessageBubble({ message }) {
  const { role, content, phase, round, timestamp } = message;
  const isSystem = role === 'system';

  const colorClass = roleColors[role] || 'bg-brand-primary';
  const Icon = roleIcons[role] || User;

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="text-small text-gray-7 bg-gray-2 px-4 py-2 rounded-full border border-gray-3">
          {content}
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-5 animate-in slide-in-from-bottom-2 duration-200">
      <div className={`w-9 h-9 ${colorClass} rounded-full flex items-center justify-center flex-shrink-0 shadow-1`}>
        <Icon className="w-4.5 h-4.5 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="text-body font-semibold text-gray-9">{role}</span>
          <span className="text-small text-gray-6 opacity-70">
            {timestamp ? new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
          </span>
        </div>

        <div className="bg-gray-2/60 backdrop-blur-sm rounded-large p-4 border border-gray-3/50 shadow-1
          prose prose-sm dark:prose-invert max-w-none
          prose-headings:text-gray-9
          prose-headings:font-semibold
          prose-h1:text-lg prose-h1:mb-3 prose-h1:mt-0 prose-h1:pb-2 prose-h1:border-b
          prose-h2:text-base prose-h2:mt-5 prose-h2:mb-2.5 prose-h2:text-brand-5/90
          prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-gray-7
          prose-p:text-gray-9 prose-p:leading-relaxed prose-p:my-2.5
          prose-p:not(:last-child):mb-3
          prose-strong:text-brand-5 prose-strong:font-semibold
          prose-em:text-gray-7
          prose-code:text-gray-9 prose-code:bg-gray-2/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs
          prose-pre:bg-gray-2 prose-pre:border prose-pre:border-gray-3 prose-pre:rounded-lg prose-pre:p-4 prose-pre:my-4
          prose-li:text-gray-9 prose-li:my-1 prose-li:leading-relaxed
          prose-ul:my-3 prose-ul:pl-5
          prose-ol:my-3 prose-ol:pl-5
          prose-blockquote:border-l-3 prose-blockquote:border-brand-5/40 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:my-3 prose-blockquote:text-gray-7 prose-blockquote:italic
          [&_a]:text-brand-5 [&_a]:no-underline hover:[&_a]:underline [&_a]:transition-colors
          [&_hr]:my-6 [&_hr]:border-gray-3

          [&_table]:w-full [&_table]:my-4 [&_table]:border-collapse
          [&_thead]:bg-gray-2/80 [&_thead]:border-b-2 [&_thead]:border-gray-3
          [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:text-gray-9 [&_th]:uppercase [&_th]:tracking-wider
          [&_tbody_tr]:border-b [&_tbody_tr]:border-gray-3/50 [&_tbody_tr]:hover:bg-gray-2/30 [&_tbody_tr]:transition-colors
          [&_td]:px-3 [&_td]:py-2.5 [&_td]:text-sm [&_td]:text-gray-9
          [&_tr:last-child_td]:border-b-0
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>

        {(phase !== undefined || round !== undefined) && (
          <div className="flex gap-2 mt-2.5 pt-2 border-t border-gray-3/30">
            {phase !== undefined && (
              <span className="tag tag-primary">
                阶段 {phase}
              </span>
            )}
            {round !== undefined && (
              <span className="tag tag-secondary">
                轮次 {round}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
