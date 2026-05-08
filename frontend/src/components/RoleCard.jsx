import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';

export default function RoleCard({ role, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const { updateRole, removeRole } = useDebateStore();

  const roleColors = ['role-host', 'role-proposer', 'role-reviewer'];
  const colorClass = roleColors[index % roleColors.length];

  return (
    <div className="bg-bg-tertiary rounded-lg border border-border-primary overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-bg-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full bg-${colorClass}`} />
          <span className="text-sm font-medium">{role.name || `角色${index + 1}`}</span>
        </div>
        <div className="flex items-center gap-2">
          {index >= 3 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeRole(role.id);
              }}
              className="p-1 hover:bg-error/20 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4 text-error" />
            </button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      
      {expanded && (
        <div className="p-3 pt-0 space-y-3">
          <div>
            <label className="text-xs text-text-muted mb-1 block">角色名称</label>
            <input
              type="text"
              value={role.name}
              onChange={(e) => updateRole(role.id, { name: e.target.value })}
              className="w-full bg-bg-primary border border-border-primary rounded px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
              placeholder="输入角色名称"
            />
          </div>
          
          <div>
            <label className="text-xs text-text-muted mb-1 block">AI模型</label>
            <select
              value={role.model}
              onChange={(e) => updateRole(role.id, { model: e.target.value })}
              className="w-full bg-bg-primary border border-border-primary rounded px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
            >
              <option value="deepseek-v4-flash">DeepSeek V4 Flash</option>
              <option value="minimax">MiniMax</option>
            </select>
          </div>
          
          <div>
            <label className="text-xs text-text-muted mb-1 block">Soul (性格描述)</label>
            <textarea
              value={role.soul}
              onChange={(e) => updateRole(role.id, { soul: e.target.value })}
              className="w-full bg-bg-primary border border-border-primary rounded px-3 py-2 text-sm focus:border-border-focus focus:outline-none resize-none"
              rows={2}
              placeholder="描述角色的性格和行为方式..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
