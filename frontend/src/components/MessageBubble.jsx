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

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs text-text-muted bg-bg-tertiary px-3 py-1 rounded-full">
          {content}
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4 animate-in slide-in-from-bottom-2 duration-150">
      <div className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-text-primary">{role}</span>
          <span className="text-xs text-text-muted">
            {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
          </span>
        </div>
        
        <div className="bg-bg-tertiary rounded-lg p-3 border border-border-primary">
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>
        
        {(phase !== undefined || round !== undefined) && (
          <div className="flex gap-2 mt-1">
            {phase !== undefined && (
              <span className="text-xs bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded">
                阶段 {phase}
              </span>
            )}
            {round !== undefined && (
              <span className="text-xs bg-brand-secondary/20 text-brand-secondary px-2 py-0.5 rounded">
                轮次 {round}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
