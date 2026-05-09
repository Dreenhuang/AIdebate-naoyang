import { ChevronRight, ChevronLeft, Volume2, VolumeX } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';
import { useTheme } from '../hooks/useTheme';
import { ThemeToggle } from './ThemeToggle';

export default function Header() {
  const { wsConnected, wsReconnecting, sidebarCollapsed, toggleSidebar, soundEnabled, setSoundEnabled } = useDebateStore();
  const { theme, setTheme } = useTheme();

  return (
    <header className="header">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="btn-text focus-ring"
          title={sidebarCollapsed ? '展开配置面板' : '收起配置面板'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <img src="/logo-512.png" alt="脑痒Logo" className="w-8 h-8" />
        <h1 className="text-h4 font-semibold text-text-primary">脑痒</h1>
        <span className="text-small text-text-secondary hidden sm:inline">脑痒是长脑子的前兆</span>
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeToggle theme={theme} setTheme={setTheme} />
        
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`btn-text focus-ring ${
            soundEnabled ? 'text-brand-5' : 'text-text-secondary'
          }`}
          title={soundEnabled ? '关闭音效' : '开启音效'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {wsReconnecting ? (
          <>
            <span className="status-dot status-warning" />
            <span className="text-small text-warning-5 hidden sm:inline">重连中...</span>
          </>
        ) : wsConnected ? (
          <>
            <span className="status-dot status-success" />
            <span className="text-small text-success-5 hidden sm:inline">已连接</span>
          </>
        ) : (
          <>
            <span className="status-dot status-error" />
            <span className="text-small text-error-5 hidden sm:inline">已断开</span>
          </>
        )}
      </div>
    </header>
  );
}
