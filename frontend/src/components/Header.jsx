import { ChevronRight, ChevronLeft, Volume2, VolumeX, Palette, Sparkles } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';
import { useTheme } from '../hooks/useTheme';
import { ThemeSelector } from './ThemeSelector';
import { useState } from 'react';

export default function Header() {
  const { wsConnected, wsReconnecting, sidebarCollapsed, toggleSidebar, soundEnabled, setSoundEnabled } = useDebateStore();
  const { theme, currentTheme, toggleTheme, themes } = useTheme();
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // 计算目标主题（用于切换提示）
  const targetTheme = theme === 'tech-blue' ? themes.xiaohongshu : themes['tech-blue'];

  return (
    <header className="header">
      {/* 左侧：Logo 和标题 */}
      <div className="flex items-end gap-3">
        <img src="/logo-512.png" alt="脑痒痒Logo" className="w-8 h-8 align-bottom" />
        <h1 className="text-h3 font-semibold text-text-primary">脑痒痒</h1>
        <span className="text-sm text-text-secondary hidden sm:inline align-bottom">脑痒痒是长脑子的前兆</span>
      </div>
      
      {/* 右侧：功能按钮区域 */}
      <div className="flex items-center gap-3 ml-auto">
        {/* 风格切换按钮 */}
        <button
          onClick={() => setShowThemeSelector(true)}
          className="btn-text focus-ring flex items-center gap-2 px-3 py-2 rounded-medium hover:bg-bg-component transition-colors duration-fast"
          title="选择风格"
        >
          <Palette className="w-4 h-4 text-text-secondary" />
          <span className="text-small text-text-secondary hidden md:inline">{currentTheme?.label || '风格'}</span>
        </button>
        
        {/* 快速切换按钮 - 显示目标主题 */}
        <button
          onClick={toggleTheme}
          className="btn-text focus-ring flex items-center gap-2 px-3 py-2 rounded-medium hover:bg-bg-component transition-colors duration-fast"
          title={`切换到${targetTheme.label}风格`}
        >
          <span className="text-base">{targetTheme.icon}</span>
          <span className="text-small text-text-secondary hidden md:inline">切换{targetTheme.label}</span>
        </button>

        {/* 音效开关 */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`btn-text focus-ring ${
            soundEnabled ? 'text-brand-5' : 'text-text-secondary'
          }`}
          title={soundEnabled ? '关闭音效' : '开启音效'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* 连接状态 */}
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

      {/* 风格选择面板 */}
      <ThemeSelector 
        isOpen={showThemeSelector} 
        onClose={() => setShowThemeSelector(false)} 
      />
    </header>
  );
}
