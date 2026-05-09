import { User, Bot } from 'lucide-react';

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

  const renderMarkdownAsText = (content) => {
    if (!content) return '';
    return content
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
      .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^[-*+]\s+/gm, '• ')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/>\s+/g, '')
      .replace(/\n{3,}/g, '\n\n');
  };

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

        <div className="bg-gray-2/60 backdrop-blur-sm rounded-large p-4 border border-gray-3/50 shadow-1 text-sm leading-relaxed whitespace-pre-wrap text-gray-9">
          {renderMarkdownAsText(content)}
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
