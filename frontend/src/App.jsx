import { useEffect, useState } from 'react';
import Header from './components/Header';
import ConfigPanel from './components/ConfigPanel';
import MessageStream from './components/MessageStream';
import StatusBar from './components/StatusBar';
import FileManager from './components/FileManager';
import SoulManager from './components/SoulManager';
import DebatePhaseIndicator from './components/DebatePhaseIndicator';
import DebateStatusBar from './components/DebateStatusBar'; // 🔥 新增：辩论进行时的紧凑状态栏
import ConsensusPanel from './components/ConsensusPanel';
import ExportButton from './components/ExportButton';
import ErrorBoundary from './components/ErrorBoundary'; // 🔥 V2.2 新增
import { useTheme } from './hooks/useTheme';
import { useSound } from './hooks/useSound';
import { ThemeToggle } from './components/ThemeToggle';
import { Celebration } from './components/Celebration';
import { ReconnectToast } from './components/ReconnectToast';
import { useWebSocket } from './hooks/useWebSocket';
import { useDebateStore } from './stores/debateStore';
import OfflineIndicator from './components/OfflineIndicator'; // 🔥 V2.2 新增
import { PanelLeft, PanelRight, PanelBottom, Minimize2, Maximize2, Layout, Eye, EyeOff } from 'lucide-react';

function App() {
  const { send, cancelRequest, manualReconnect, reconnectState, maxAttempts } = useWebSocket(); // 🔥 V2.2 新增 cancelRequest
  const { reset, debateStatus, sidebarCollapsed, toggleSidebar, soundEnabled, wsConnected, wsReconnecting, canCancel } = useDebateStore(); // 🔥 V2.2 新增 canCancel
  const { theme, setTheme } = useTheme();
  const { playSoftDing, playCompletion } = useSound();
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevStatus, setPrevStatus] = useState('idle');

  // 三面板状态管理 - 默认可见
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [bottomPanelVisible, setBottomPanelVisible] = useState(true);
  const [isDebating, setIsDebating] = useState(false);

  /**
   * 开始辩论 - 自动隐藏所有面板进入沉浸模式
   */
  const handleStart = () => {
    const { config } = useDebateStore.getState();

    // 验证配置有效性
    if (!config.topic) {
      alert('请先输入讨论话题！');
      return;
    }

    if (config.roles.length < 2) {
      alert('请至少配置2个角色！');
      return;
    }

    // 发送开始消息到后端
    send('debate:start', config);

    if (soundEnabled) playSoftDing();

    // 标记辩论状态
    setIsDebating(true);

    // ⭐ 关键：立即隐藏左、右、下三面板
    console.log('[App] 辩论开始，隐藏所有面板');
    setLeftPanelVisible(false);
    setRightPanelVisible(false);
    setBottomPanelVisible(false);
  };

  /**
   * 停止辩论 - 恢复所有面板
   */
  const handleStop = () => {
    send('debate:stop');
    setIsDebating(false);
    restoreAllPanels();
  };

  /**
   * 🔥 V2.2 新增：取消当前生成（不停止整个辩论）
   */
  const handleCancel = () => {
    cancelRequest();
  };

  /**
   * 重置辩论 - 恢复所有面板
   */
  const handleReset = () => {
    reset();
    send('debate:reset');
    setIsDebating(false);
    restoreAllPanels();
  };

  // 监听辩论状态变化
  useEffect(() => {
    console.log(`[App] debateStatus 变化: ${prevStatus} → ${debateStatus}`);

    if (prevStatus === 'running' && debateStatus === 'completed') {
      setShowCelebration(true);
      if (soundEnabled) playCompletion();
      setIsDebating(false);

      // 辩论完成后自动恢复所有面板
      setTimeout(() => {
        restoreAllPanels();
      }, 500); // 稍微延迟让用户看到完成状态
    }
    setPrevStatus(debateStatus);
  }, [debateStatus, soundEnabled, playCompletion, prevStatus]);

  // 监听 WebSocket 连接状态，自动同步面板显示
  useEffect(() => {
    if (debateStatus === 'running' && !isDebating) {
      // 如果检测到辩论正在运行但本地状态未更新，强制同步
      setIsDebating(true);
      hideAllPanels();
    }
  }, [debateStatus]);

  /**
   * 切换左侧面板
   */
  const toggleLeftPanel = () => {
    setLeftPanelVisible(!leftPanelVisible);
  };

  /**
   * 切换右侧面板
   */
  const toggleRightPanel = () => {
    setRightPanelVisible(!rightPanelVisible);
  };

  /**
   * 切换底部面板
   */
  const toggleBottomPanel = () => {
    setBottomPanelVisible(!bottomPanelVisible);
  };

  /**
   * 恢复所有面板显示
   */
  const restoreAllPanels = () => {
    console.log('[App] 恢复所有面板显示');
    setLeftPanelVisible(true);
    setRightPanelVisible(true);
    setBottomPanelVisible(true);
  };

  /**
   * 隐藏所有面板（全屏沉浸模式）
   */
  const hideAllPanels = () => {
    console.log('[App] 隐藏所有面板');
    setLeftPanelVisible(false);
    setRightPanelVisible(false);
    setBottomPanelVisible(false);
  };

  // 计算是否有任何面板被隐藏
  const anyPanelHidden = !leftPanelVisible || !rightPanelVisible || !bottomPanelVisible;

  return (
    <div className="h-screen flex flex-col bg-bg-primary transition-colors duration-300">
      <Celebration show={showCelebration} onComplete={() => setShowCelebration(false)} />

      {/* 🔥 V2.2 新增：离线状态指示器 */}
      <OfflineIndicator />

      <ReconnectToast
        isReconnecting={reconnectState.isReconnecting}
        attemptCount={reconnectState.attemptCount}
        nextRetryIn={reconnectState.nextRetryIn}
        isMaxAttemptsReached={reconnectState.isMaxAttemptsReached}
        onManualReconnect={manualReconnect}
        maxAttempts={maxAttempts}
      />

      {/* 顶部导航 */}
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* ===== 左侧配置面板 ===== */}
        <div className={`flex-shrink-0 border-r border-border-primary bg-bg-secondary transition-all duration-300 ease-in-out overflow-hidden ${
          leftPanelVisible ? 'w-[320px]' : 'w-0 border-none'
        }`}>
          <ConfigPanel
            onStart={handleStart}
            onStop={handleStop}
            onReset={handleReset}
          />
        </div>

        {/* ===== 中间主内容区 ===== */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* 面板控制工具栏 - 浮动在右上角 */}
          <div className={`absolute top-3 right-3 z-20 flex items-center gap-1 bg-bg-secondary/95 backdrop-blur-md rounded-xl px-2 py-1.5 shadow-lg border border-border-primary transition-all duration-300 ${
            anyPanelHidden ? 'opacity-100 translate-y-0' : 'opacity-60 hover:opacity-100'
          }`}>
            {/* 左侧面板按钮 */}
            <button
              onClick={toggleLeftPanel}
              className={`p-2 rounded-lg transition-all duration-200 ${
                leftPanelVisible
                  ? 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'
                  : 'text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20'
              }`}
              title={leftPanelVisible ? "隐藏配置面板" : "显示配置面板"}
            >
              <PanelLeft size={16} />
            </button>

            {/* 右侧面板按钮 */}
            <button
              onClick={toggleRightPanel}
              className={`p-2 rounded-lg transition-all duration-200 ${
                rightPanelVisible
                  ? 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'
                  : 'text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20'
              }`}
              title={rightPanelVisible ? "隐藏共识面板" : "显示共识面板"}
            >
              <PanelRight size={16} />
            </button>

            {/* 底部面板按钮 */}
            <button
              onClick={toggleBottomPanel}
              className={`p-2 rounded-lg transition-all duration-200 ${
                bottomPanelVisible
                  ? 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'
                  : 'text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20'
              }`}
              title={bottomPanelVisible ? "隐藏底部面板" : "显示底部面板"}
            >
              <PanelBottom size={16} />
            </button>

            {/* 分隔线 */}
            <div className="w-px h-5 bg-border-primary mx-1"></div>

            {/* 全屏模式切换 */}
            {anyPanelHidden ? (
              <button
                onClick={restoreAllPanels}
                className="p-2 rounded-lg text-brand-primary hover:bg-brand-primary/10 transition-all duration-200"
                title="显示所有面板"
              >
                <Maximize2 size={16} />
              </button>
            ) : (
              <button
                onClick={hideAllPanels}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all duration-200"
                title="全屏模式（隐藏所有面板）"
              >
                <Minimize2 size={16} />
              </button>
            )}

            {/* 辩论中状态指示器 */}
            {isDebating && (
              <>
                <div className="w-px h-5 bg-border-primary mx-1"></div>
                {/* 🔥 V2.2 新增：取消按钮 */}
                {canCancel && (
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all hover:scale-105 active:scale-95"
                    title="取消当前生成"
                  >
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                    取消生成
                  </button>
                )}
                <span className="flex items-center gap-1.5 text-xs text-brand-primary font-semibold animate-pulse px-2 py-1 bg-brand-primary/10 rounded-full">
                  <Layout size={12} />
                  全屏中
                </span>
              </>
            )}
          </div>

          <DebatePhaseIndicator />

          <div className="flex-1 flex min-h-0">
            {/* 消息流区域 - 添加错误边界保护 */}
            <div className="flex-1 min-w-0 overflow-y-auto">
              <ErrorBoundary
                fallback={({ error, resetError }) => (
                  <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-xl">
                    <h3 className="text-red-600 font-bold mb-2">⚠️ 消息显示出错</h3>
                    <p className="text-red-500 text-sm mb-3">这通常是因为 AI 回复包含无法处理的格式。</p>
                    <button
                      onClick={resetError}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                    >
                      重试显示
                    </button>
                  </div>
                )}
              >
                <MessageStream />
              </ErrorBoundary>
            </div>

            {/* 右侧共识面板 */}
            <div className={`flex-shrink-0 border-l border-border-primary bg-bg-secondary transition-all duration-300 ease-in-out overflow-hidden ${
              rightPanelVisible ? 'w-[280px]' : 'w-0 border-none'
            }`}>
              <div className="h-full overflow-y-auto p-4 space-y-4">
                <ConsensusPanel />
              </div>
            </div>
          </div>

          {/* 底部面板 - 可折叠 */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 ${
            bottomPanelVisible ? 'max-h-[180px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <StatusBar />
            <FileManager />
          </div>

          {/* 🔥 辩论进行时的紧凑状态栏 - 显示在底部当详细面板被隐藏时 */}
          {isDebating && !bottomPanelVisible && (
            <DebateStatusBar />
          )}

          {/* 导出按钮栏 */}
          <div className="border-t border-border-primary px-4 py-2 flex items-center justify-between bg-bg-secondary flex-shrink-0">
            <span className="text-xs text-text-muted">辩论报告</span>
            <ExportButton />
          </div>
        </div>
      </div>

      {/* Soul管理弹窗 */}
      <SoulManager />
    </div>
  );
}

export default App;