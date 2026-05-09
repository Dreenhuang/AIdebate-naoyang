import React from 'react';

export function XHSHeader({
  title = 'DebateAI System',
  subtitle = 'AI-Powered Debate Platform',
  onThemeToggle,
  isXiaohongshuTheme = false,
  status = 'ready', // ready | running | completed
  className = '',
  style = {},
}) {
  const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #FFE4E6',
    boxShadow: '0 1px 3px rgba(255, 107, 157, 0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    fontFamily: "'Noto Sans SC', 'PingFang SC', sans-serif",
  };

  const statusColors = {
    ready: { bg: '#ECFDF5', text: '#10B981', dot: '#10B981' },
    running: { bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B' },
    completed: { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  };

  const currentStatus = statusColors[status] || statusColors.ready;

  return (
    <header
      className={`xhs-header ${className}`}
      style={{ ...baseStyles, ...style }}
      role="banner"
    >
      {/* 左侧：Logo + 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Logo图标 */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8E9B 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: '#FFFFFF',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(255, 107, 157, 0.25)',
          }}
        >
          💬
        </div>

        {/* 标题组 */}
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '700',
              color: '#881337',
              lineHeight: '1.3',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '12px',
              color: '#FB7185',
              fontWeight: '500',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
            }}
          >
            {subtitle}
          </p>
        </div>
      </div>

      {/* 右侧：操作按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* 状态指示器 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: currentStatus.bg,
            fontSize: '13px',
            fontWeight: '600',
            color: currentStatus.text,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: currentStatus.dot,
              animation: status === 'running' ? 'pulse 2s infinite' : 'none',
            }}
          />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>

        {/* 主题切换按钮 */}
        {onThemeToggle && (
          <button
            onClick={onThemeToggle}
            className="xhs-header__theme-toggle"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '9999px',
              border: isXiaohongshuTheme ? 'none' : '1px solid #FFE4E6',
              background: isXiaohongshuTheme
                ? 'linear-gradient(135deg, #FF6B9D 0%, #FF8E9B 100%)'
                : '#FFF5F7',
              color: isXiaohongshuTheme ? '#FFFFFF' : '#FF6B9D',
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 250ms ease-out',
              boxShadow: isXiaohongshuTheme
                ? '0 4px 12px rgba(255, 107, 157, 0.3)'
                : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isXiaohongshuTheme) {
                e.currentTarget.style.background = '#FFE4E6';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isXiaohongshuTheme) {
                e.currentTarget.style.background = '#FFF5F7';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
            aria-label={`Switch to ${isXiaohongshuTheme ? 'default' : 'xiaohongshu'} theme`}
          >
            {isXiaohongshuTheme ? '🎀 Default Theme' : '🌸 XHS Theme'}
          </button>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @media (max-width: 768px) {
          .xhs-header {
            padding: 12px 16px !important;
          }
          .xhs-header h1 {
            font-size: 16px !important;
          }
          .xhs-header p {
            display: none;
          }
          .xhs-header__theme-toggle span {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
