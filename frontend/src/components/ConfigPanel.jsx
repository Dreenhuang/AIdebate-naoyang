import { Play, Square, RotateCcw, Plus, Target, Settings } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';
import RoleCard from './RoleCard';

export default function ConfigPanel({ onStart, onStop, onReset }) {
  const { config, updateConfig, addRole, debateStatus } = useDebateStore();

  return (
    <div className="w-[320px] bg-bg-secondary border-r border-border-primary flex flex-col h-full">
      <div className="p-4 border-b border-border-primary">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-brand-primary" />
          <h2 className="font-semibold">配置面板</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 话题输入 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-text-muted" />
            <label className="text-sm font-medium">讨论话题</label>
          </div>
          <textarea
            value={config.topic}
            onChange={(e) => updateConfig({ topic: e.target.value })}
            className="w-full bg-bg-tertiary border border-border-primary rounded-lg px-3 py-2 text-sm focus:border-border-focus focus:outline-none resize-none"
            rows={3}
            placeholder="输入讨论话题，例如：AI会取代人类的工作吗？"
          />
        </div>

        {/* 角色配置 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">角色配置 ({config.roles.length}/5)</span>
            {config.roles.length < 5 && (
              <button
                onClick={addRole}
                className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-primary/80 transition-colors"
              >
                <Plus className="w-3 h-3" />
                添加角色
              </button>
            )}
          </div>
          <div className="space-y-2">
            {config.roles.map((role, index) => (
              <RoleCard key={role.id} role={role} index={index} />
            ))}
          </div>
        </div>

        {/* 轮数设置 */}
        <div>
          <label className="text-sm font-medium mb-2 block">每阶段轮数: {config.roundsPerPhase}</label>
          <input
            type="range"
            min={1}
            max={10}
            value={config.roundsPerPhase}
            onChange={(e) => updateConfig({ roundsPerPhase: parseInt(e.target.value) })}
            className="w-full accent-brand-primary"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        {/* 阶段设置 */}
        <div>
          <label className="text-sm font-medium mb-2 block">总阶段数: {config.totalPhases}</label>
          <input
            type="range"
            min={1}
            max={5}
            value={config.totalPhases}
            onChange={(e) => updateConfig({ totalPhases: parseInt(e.target.value) })}
            className="w-full accent-brand-primary"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>1</span>
            <span>5</span>
          </div>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="p-4 border-t border-border-primary space-y-2">
        {debateStatus === 'running' ? (
          <button
            onClick={onStop}
            className="w-full flex items-center justify-center gap-2 bg-error hover:bg-error/90 text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            <Square className="w-4 h-4" />
            停止辩论
          </button>
        ) : (
          <button
            onClick={onStart}
            disabled={!config.topic || debateStatus === 'completed'}
            className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            开始辩论
          </button>
        )}
        
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 bg-bg-tertiary hover:bg-bg-hover border border-border-primary text-text-secondary py-2 rounded-lg text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </button>
      </div>
    </div>
  );
}
