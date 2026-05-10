import { useState } from 'react';
import { Play, Square, RotateCcw, Plus, Target, Settings, Wifi, WifiOff, Shuffle, Sparkles, ChevronLeft, LayoutGrid, ChevronDown, Check } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';
import { useModeStore } from '../stores/modeStore';
import RoleCard from './RoleCard';
import DocumentUpload from './DocumentUpload';
import { DISCUSSION_MODES, OUTPUT_DEPTH, getModeCategories } from '../data/discussionModes';
import { getSoulsByRoleType, getRandomSoul } from '../data/soulPresets';

const CATEGORY_ICONS = {
  '一对一双向商量': '💬',
  '多人圆桌合议': '👥',
  '正式对抗辩论': '⚔️',
  '结构化议事决策': '📊',
  '头脑风暴共创': '💡',
  '多AI专属协同': '🤖',
};

export default function ConfigPanel({ onStart, onStop, onReset }) {
  const { config, updateConfig, addRole, debateStatus, wsConnected, wsReconnecting, randomizeAllSouls, sidebarCollapsed, toggleSidebar, uploadedDoc } = useDebateStore();
  const { currentMode, outputDepth, setMode, setOutputDepth } = useModeStore();

  const [showModeSelector, setShowModeSelector] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  const categories = getModeCategories();

  if (sidebarCollapsed) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-20 p-3 bg-gray-2 border border-gray-3 border-l-0 rounded-r-lg shadow-3 hover:shadow-4 transition-all text-gray-8 hover:text-brand-5 focus-ring"
        title="展开配置面板"
      >
        <Settings className="w-5 h-5" />
      </button>
    );
  }

  const handleModeSelect = (modeId) => {
    const mode = DISCUSSION_MODES[modeId];
    if (!mode) return;

    setMode(modeId);

    // 自动调整角色配置
    const defaultRoles = mode.defaultRoles || [];
    const newRoles = [];

    defaultRoles.forEach((roleConfig, index) => {
      const randomSoul = getRandomSoul(roleConfig.roleType);
      newRoles.push({
        id: Date.now() + index,
        name: roleConfig.label,
        roleType: roleConfig.roleType,
        soul: randomSoul?.soul || '',
        soulPresetId: randomSoul?.id || null,
        model: 'deepseek-v4-flash',
      });
    });

    // 更新配置
    updateConfig({ roles: newRoles });

    setShowModeSelector(false);
  };

  return (
    <div className="w-[320px] bg-gray-1 flex flex-col h-full border-r border-gray-3">
      {/* 顶部收起按钮 */}
      <div className="flex justify-end p-2">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-2 rounded-md transition-colors text-gray-6 focus-ring"
          title="收起配置面板"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 border-b border-gray-3">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-5" />
          <h2 className="text-h4 font-semibold text-gray-9">配置面板</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 模式选择区域 */}
        <div className="bg-gray-2 rounded-lg p-3 border border-gray-3">
          <div
            onClick={() => setShowModeSelector(!showModeSelector)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowModeSelector(!showModeSelector); }}
            role="button"
            tabIndex={0}
            className="w-full flex items-center justify-between cursor-pointer hover:bg-gray-3 transition-colors focus-ring"
          >
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-brand-5" />
              <span className="text-body font-medium text-gray-9">讨论模式</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-small text-brand-5">{currentMode?.icon}</span>
              <span className="text-small text-gray-7">{currentMode?.name}</span>
              {showModeSelector ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </div>
          </div>

          {showModeSelector && (
            <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
              {Object.entries(categories).map(([categoryName, modes]) => (
                <div key={categoryName} className="border border-gray-3 rounded-lg overflow-hidden">
                  <div
                    onClick={() => setExpandedCategory(expandedCategory === categoryName ? null : categoryName)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpandedCategory(expandedCategory === categoryName ? null : categoryName); }}
                    role="button"
                    tabIndex={0}
                    className="w-full px-3 py-2 flex items-center gap-2 bg-gray-3/50 hover:bg-gray-3 transition-colors cursor-pointer focus-ring"
                  >
                    <span>{CATEGORY_ICONS[categoryName]}</span>
                    <span className="text-small font-medium text-gray-9 flex-1 text-left">{categoryName}</span>
                    {expandedCategory === categoryName ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </div>

                  {expandedCategory === categoryName && (
                    <div className="bg-bg-secondary">
                      {modes.map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => handleModeSelect(mode.id)}
                          className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-3/50 transition-colors ${
                            currentMode?.id === mode.id ? 'bg-brand-primary/10' : ''
                          }`}
                        >
                          <span>{mode.icon}</span>
                          <div className="flex-1 text-left">
                            <div className="text-small font-medium text-gray-9">{mode.name}</div>
                            <div className="text-xs text-gray-6">{mode.description}</div>
                          </div>
                          {currentMode?.id === mode.id && <Check className="w-4 h-4 text-brand-5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 输出深度选择 */}
        <div className="bg-gray-2 rounded-lg p-3 border border-gray-3">
          <div className="text-small font-medium text-gray-9 mb-2">输出深度</div>
          <div className="space-y-1">
            {Object.entries(OUTPUT_DEPTH).map(([key, config]) => (
              <label
                key={key}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  outputDepth === key ? 'bg-brand-primary/10' : 'hover:bg-gray-3/50'
                }`}
              >
                <input
                  type="radio"
                  name="outputDepth"
                  value={key}
                  checked={outputDepth === key}
                  onChange={() => setOutputDepth(key)}
                  className="w-3.5 h-3.5 text-brand-5"
                />
                <div className="flex-1">
                  <div className="text-small text-gray-9">{config.name}</div>
                  <div className="text-xs text-gray-6">{config.charRange}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-gray-7" />
            <label className="text-body font-medium text-gray-9">讨论话题</label>
          </div>
          <textarea
            value={config.topic}
            onChange={(e) => updateConfig({ topic: e.target.value })}
            className="input"
            rows={3}
            placeholder="输入讨论话题,例如:AI会取代人类的工作吗?"
          />
        </div>

        <DocumentUpload />

        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-body font-medium text-gray-9">角色配置 ({config.roles.length}/8)</span>
            <div className="flex items-center gap-2">
              {config.roles.length >= 2 && (
                <button
                  onClick={randomizeAllSouls}
                  className="text-small text-success-5 hover:text-success-6 transition-colors focus-ring"
                  title="随机分配所有角色的Soul"
                >
                  <Shuffle className="w-3 h-3 inline mr-1" />
                  随机Soul
                </button>
              )}
              {config.roles.length < 8 && (
                <button
                  onClick={addRole}
                  className="text-small text-brand-5 hover:text-brand-6 transition-colors focus-ring"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  添加角色
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {config.roles.map((role, index) => (
              <RoleCard key={role.id} role={role} index={index} />
            ))}
          </div>
        </div>

        <div className="bg-gray-2 rounded-lg p-4 border border-gray-3">
          <label className="text-body font-medium text-gray-9 mb-3 block">
            每阶段轮数: <span className="text-brand-5 font-semibold">{config.roundsPerPhase}</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={config.roundsPerPhase}
            onChange={(e) => updateConfig({ roundsPerPhase: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-3 rounded-full appearance-none cursor-pointer accent-brand-5"
          />
          <div className="flex justify-between text-small text-gray-6 mt-2">
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        <div className="bg-gray-2 rounded-lg p-4 border border-gray-3">
          <label className="text-body font-medium text-gray-9 mb-3 block">
            总阶段数: <span className="text-brand-5 font-semibold">{config.totalPhases}</span>
          </label>
          <input
            type="range"
            min={1}
            max={5}
            value={config.totalPhases}
            onChange={(e) => updateConfig({ totalPhases: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-3 rounded-full appearance-none cursor-pointer accent-brand-5"
          />
          <div className="flex justify-between text-small text-gray-6 mt-2">
            <span>1</span>
            <span>5</span>
          </div>
        </div>
      </div>

      {!wsConnected && (
        <div className="px-4 py-3 bg-warning-1 border-t border-warning-5/20">
          <div className="flex items-center gap-2 text-small text-warning-5">
            <WifiOff className="w-3.5 h-3.5" />
            <span>
              {wsReconnecting ? '正在重新连接服务器...' : '服务器未连接，请检查后端服务是否启动'}
            </span>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-gray-3 space-y-2">
        {debateStatus === 'running' ? (
          <button
            onClick={onStop}
            className="btn btn-danger w-full"
          >
            <Square className="w-4 h-4" />
            停止辩论
          </button>
        ) : (
          <button
            onClick={onStart}
            disabled={!config.topic || debateStatus === 'completed' || !wsConnected}
            className="btn btn-primary w-full"
          >
            <Play className="w-4 h-4" />
            开始辩论
          </button>
        )}
        
        <button
          onClick={onReset}
          className="btn btn-secondary w-full"
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </button>
      </div>
    </div>
  );
}
