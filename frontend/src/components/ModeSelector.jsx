/**
 * PRD辩论系统 - 讨论模式选择器组件
 */
import { useState } from 'react';
import { useModeStore } from '../stores/modeStore';
import { DISCUSSION_MODES, OUTPUT_DEPTH, getModeCategories } from '../data/discussionModes';
import { getSoulsByRoleType } from '../data/soulPresets';
import { ChevronDown, ChevronRight, Shuffle, Edit3, Plus, Minus, Check, X, Settings, Zap, Users, Target, Lightbulb, Bot } from 'lucide-react';

const CATEGORY_ICONS = {
  '一对一双向商量': '💬',
  '多人圆桌合议': '👥',
  '正式对抗辩论': '⚔️',
  '结构化议事决策': '📊',
  '头脑风暴共创': '💡',
  '多AI专属协同': '🤖',
};

const CATEGORY_DESCRIPTIONS = {
  '一对一双向商量': '两人简单交换想法，适合快速讨论',
  '多人圆桌合议': '多人参与，全面覆盖，适合复杂议题',
  '正式对抗辩论': '有立场、有攻防，适合方案评审',
  '结构化议事决策': '高效落地，适合决策和投票',
  '头脑风暴共创': '发散创意，适合收集想法',
  '多AI专属协同': 'AI分工协作，适合全面分析',
};

export default function ModeSelector() {
  const {
    currentMode,
    outputDepth,
    configuredRoles,
    setMode,
    setOutputDepth,
    updateRole,
    randomizeRoles,
    addOptionalRole,
    removeRole,
  } = useModeStore();

  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showRolePanel, setShowRolePanel] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);

  const categories = getModeCategories();

  const handleModeSelect = (modeId) => {
    setMode(modeId);
    setExpandedCategory(null);
  };

  const getSoulOptions = (roleType) => {
    return getSoulsByRoleType(roleType) || [];
  };

  return (
    <div className="h-full flex flex-col">
      {/* 模式选择区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-brand-5" />
          选择讨论模式
        </h3>

        {/* 六大类别 */}
        <div className="space-y-3">
          {Object.entries(categories).map(([categoryName, modes]) => (
            <div key={categoryName} className="border border-border-primary rounded-xl overflow-hidden">
              {/* 类别标题 */}
              <button
                onClick={() => setExpandedCategory(expandedCategory === categoryName ? null : categoryName)}
                className="w-full px-4 py-3 flex items-center justify-between bg-bg-tertiary hover:bg-bg-tertiary/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{CATEGORY_ICONS[categoryName]}</span>
                  <div className="text-left">
                    <div className="font-medium text-text-primary">{categoryName}</div>
                    <div className="text-xs text-text-muted">{modes.length}种模式</div>
                  </div>
                </div>
                {expandedCategory === categoryName ? (
                  <ChevronDown className="w-5 h-5 text-text-muted" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                )}
              </button>

              {/* 展开的模式列表 */}
              {expandedCategory === categoryName && (
                <div className="bg-bg-secondary">
                  {modes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => handleModeSelect(mode.id)}
                      className={`w-full px-4 py-3 flex items-center justify-between hover:bg-bg-tertiary/50 transition-colors ${
                        currentMode?.id === mode.id ? 'bg-brand-primary/10 border-l-2 border-brand-primary' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{mode.icon}</span>
                        <div className="text-left">
                          <div className="font-medium text-text-primary">{mode.name}</div>
                          <div className="text-xs text-text-muted">{mode.description}</div>
                        </div>
                      </div>
                      {currentMode?.id === mode.id && <Check className="w-5 h-5 text-brand-5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 角色配置区域 */}
      <div className="border-t border-border-primary">
        <button
          onClick={() => setShowRolePanel(!showRolePanel)}
          className="w-full px-4 py-3 flex items-center justify-between bg-bg-tertiary hover:bg-bg-tertiary/80 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-5" />
            <span className="font-medium text-text-primary">角色配置</span>
            <span className="text-xs text-text-muted">({configuredRoles.length}/{currentMode?.maxRoles || 8})</span>
          </div>
          {showRolePanel ? (
            <ChevronDown className="w-5 h-5 text-text-muted" />
          ) : (
            <ChevronRight className="w-5 h-5 text-text-muted" />
          )}
        </button>

        {showRolePanel && (
          <div className="p-4 bg-bg-secondary max-h-64 overflow-y-auto">
            {/* 角色列表 */}
            <div className="space-y-3 mb-4">
              {configuredRoles.map((role, index) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-text-primary">{role.label}</div>
                    <div className="text-xs text-text-muted">
                      {role.soul?.name || role.customSoul ? (
                        <span className="text-brand-5">{role.soul?.name || '自定义'}</span>
                      ) : (
                        <span className="text-warning-5">未配置</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* 随机按钮 */}
                    <button
                      onClick={() => {
                        const options = getSoulOptions(role.roleType);
                        if (options.length > 0) {
                          const random = options[Math.floor(Math.random() * options.length)];
                          updateRole(role.id, { soul: random, customSoul: null });
                        }
                      }}
                      className="p-2 hover:bg-bg-primary rounded-lg transition-colors"
                      title="随机角色"
                    >
                      <Shuffle className="w-4 h-4 text-text-muted" />
                    </button>

                    {/* 角色选择下拉 */}
                    <select
                      value={role.soul?.id || ''}
                      onChange={(e) => {
                        const soulId = e.target.value;
                        if (soulId === 'custom') {
                          setEditingRoleId(role.id);
                        } else {
                          const soul = getSoulsByRoleType(role.roleType)?.find((s) => s.id === soulId);
                          updateRole(role.id, { soul, customSoul: null });
                        }
                      }}
                      className="px-2 py-1 text-sm bg-bg-primary border border-border-primary rounded-lg"
                    >
                      <option value="">选择角色...</option>
                      {getSoulOptions(role.roleType).map((soul) => (
                        <option key={soul.id} value={soul.id}>
                          {soul.name}
                        </option>
                      ))}
                      <option value="custom">+ 自定义</option>
                    </select>

                    {/* 移除按钮（如果不是必需角色） */}
                    {configuredRoles.length > (currentMode?.minRoles || 1) && (
                      <button
                        onClick={() => removeRole(role.id)}
                        className="p-2 hover:bg-error-5/10 rounded-lg transition-colors"
                      >
                        <Minus className="w-4 h-4 text-error-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 添加角色按钮 */}
            {configuredRoles.length < (currentMode?.maxRoles || 8) && (
              <button
                onClick={() => {
                  // 简单循环添加角色类型
                  const roleTypes = ['proposer', 'reviewer', 'supplementer', 'summarizer', 'brainstormer'];
                  const nextType = roleTypes[configuredRoles.length % roleTypes.length];
                  addOptionalRole(nextType);
                }}
                className="w-full py-2 border border-dashed border-border-primary rounded-lg text-text-muted hover:text-brand-5 hover:border-brand-5 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加角色
              </button>
            )}
          </div>
        )}
      </div>

      {/* 输出深度选择 */}
      <div className="border-t border-border-primary px-4 py-3 bg-bg-secondary">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-brand-5" />
          <span className="font-medium text-text-primary">输出深度</span>
        </div>
        <div className="space-y-2">
          {Object.entries(OUTPUT_DEPTH).map(([key, config]) => (
            <label
              key={key}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                outputDepth === key ? 'bg-brand-primary/10 border border-brand-primary' : 'hover:bg-bg-tertiary'
              }`}
            >
              <input
                type="radio"
                name="outputDepth"
                value={key}
                checked={outputDepth === key}
                onChange={() => setOutputDepth(key)}
                className="w-4 h-4 text-brand-5"
              />
              <div className="flex-1">
                <div className="font-medium text-text-primary text-sm">{config.name}</div>
                <div className="text-xs text-text-muted">
                  {config.charRange} - {config.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 自定义角色编辑弹窗 */}
      {editingRoleId && (
        <CustomRoleEditor
          roleId={editingRoleId}
          onClose={() => setEditingRoleId(null)}
          onSave={(soulText) => {
            updateRole(editingRoleId, { customSoul: soulText, soul: null });
            setEditingRoleId(null);
          }}
        />
      )}
    </div>
  );
}

// 自定义角色编辑器
function CustomRoleEditor({ roleId, onClose, onSave }) {
  const [text, setText] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-primary rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">自定义角色Soul</h3>
          <button onClick={onClose} className="p-2 hover:bg-bg-tertiary rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入自定义的角色设定..."
          className="w-full h-40 px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary resize-none focus:outline-none focus:border-brand-5"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-muted hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onSave(text)}
            className="px-4 py-2 bg-brand-5 text-white rounded-lg hover:bg-brand-5/90 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

export { ModeSelector };