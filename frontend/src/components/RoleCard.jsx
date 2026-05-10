import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Sparkles, Edit3, Shuffle } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';
import { getSoulsByRoleType } from '../data/soulPresets';

export default function RoleCard({ role, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const [showSoulSelector, setShowSoulSelector] = useState(false);
  const { updateRole, removeRole, applySoulPreset, setSoulManagerOpen, setEditingRoleId } = useDebateStore();

  const roleColors = ['role-host', 'role-proposer', 'role-reviewer'];
  const colorClass = roleColors[index % roleColors.length];

  const soulPresets = getSoulsByRoleType(role.roleType || 'host');

  const handleSelectPreset = (preset) => {
    applySoulPreset(role.id, preset);
    setShowSoulSelector(false);
  };

  const handleOpenSoulManager = () => {
    setEditingRoleId(role.id);
    setSoulManagerOpen(true);
  };

  return (
    <div className="bg-gray-2 rounded-lg border border-gray-3 overflow-hidden">
      <div
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded(!expanded); }}
        role="button"
        tabIndex={0}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-3 transition-colors focus-ring cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full bg-${colorClass}`} />
          <div className="text-left">
            <span className="text-body font-medium block">{role.name || `角色${index + 1}`}</span>
            {role.soulPresetId && (
              <span className="text-small text-gray-6">已应用预设: {role.soulPresetId}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {index >= 3 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeRole(role.id);
              }}
              className="p-1 hover:bg-error-1 rounded transition-colors focus-ring"
            >
              <Trash2 className="w-4 h-4 text-error-5" />
            </button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <div className="p-3 pt-0 space-y-3">
          <div>
            <label className="text-small text-gray-7 mb-1 block">角色名称</label>
            <input
              type="text"
              value={role.name}
              onChange={(e) => updateRole(role.id, { name: e.target.value })}
              className="input input-sm"
              placeholder="输入角色名称"
            />
          </div>

          <div>
            <label className="text-small text-gray-7 mb-1 block">AI模型</label>
            <select
              value={role.model}
              onChange={(e) => updateRole(role.id, { model: e.target.value })}
              className="input input-sm"
            >
              <option value="deepseek-v4-flash">DeepSeek V4 Flash</option>
              <option value="minimax">MiniMax</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-small text-gray-7">Soul 预设</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSoulSelector(!showSoulSelector)}
                  className="text-small text-brand-5 hover:text-brand-6 transition-colors focus-ring flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  {showSoulSelector ? '收起' : '选择预设'}
                </button>
                <button
                  onClick={handleOpenSoulManager}
                  className="text-small text-gray-7 hover:text-gray-9 transition-colors focus-ring flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  管理
                </button>
              </div>
            </div>

            {showSoulSelector && (
              <div className="bg-gray-1 rounded-md border border-gray-3 max-h-48 overflow-y-auto">
                {soulPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-2 transition-colors border-b border-gray-3 last:border-0 ${
                      role.soulPresetId === preset.id ? 'bg-brand-1 border-l-2 border-l-brand-5' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-body font-medium">{preset.name}</span>
                      <span className={`text-extra px-1.5 py-0.5 rounded-small ${
                        preset.difficulty === 'expert' ? 'bg-error-1 text-error-5' :
                        preset.difficulty === 'advanced' ? 'bg-warning-1 text-warning-5' :
                        'bg-success-1 text-success-5'
                      }`}>
                        {preset.difficulty === 'expert' ? '专家' :
                         preset.difficulty === 'advanced' ? '高级' : '中级'}
                      </span>
                    </div>
                    <p className="text-small text-gray-6 mt-0.5">{preset.description}</p>
                    <div className="flex gap-1 mt-1">
                      {preset.tags.map((tag, i) => (
                        <span key={i} className="text-extra bg-gray-2 text-gray-7 px-1.5 py-0.5 rounded-small">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-small text-gray-7 mb-1 block">Soul (性格描述)</label>
            <textarea
              value={role.soul}
              onChange={(e) => updateRole(role.id, { soul: e.target.value, soulPresetId: null })}
              className="input input-sm"
              rows={4}
              placeholder="描述角色的性格和行为方式..."
            />
            <p className="text-small text-gray-6 mt-1">
              {role.soulPresetId ? '已应用预设，可直接修改自定义' : '自定义Soul'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
