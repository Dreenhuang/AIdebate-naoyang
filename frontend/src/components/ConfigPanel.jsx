import { Play, Square, RotateCcw, Plus, Target, Settings, Wifi, WifiOff, Shuffle, Sparkles, ChevronLeft } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';
import RoleCard from './RoleCard';
import DocumentUpload from './DocumentUpload';

export default function ConfigPanel({ onStart, onStop, onReset }) {
  const { config, updateConfig, addRole, debateStatus, wsConnected, wsReconnecting, randomizeAllSouls, sidebarCollapsed, toggleSidebar, uploadedDoc } = useDebateStore();

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
            <span className="text-body font-medium text-gray-9">角色配置 ({config.roles.length}/5)</span>
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
              {config.roles.length < 5 && (
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
