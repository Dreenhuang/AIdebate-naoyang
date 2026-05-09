import React, { useState } from 'react';

export function XHSLayout({
  children,
  header,
  sidebar = null,
  rightPanel = null,
  showSidebar = true,
  showRightPanel = true,
  className = '',
  style = {},
}) {
  const [sidebarOpen, setSidebarOpen] = useState(showSidebar);
  const [rightPanelOpen, setRightPanelOpen] = useState(showRightPanel);

  const baseStyles = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#FFF5F7',
    fontFamily: "'Noto Sans SC', 'PingFang SC', sans-serif",
    color: '#881337',
  };

  return (
    <div
      className={`xhs-layout ${className}`}
      style={{ ...baseStyles, ...style }}
      role="application"
    >
      {/* Header区域 */}
      {header && (
        <div className="xhs-layout__header">
          {header}
        </div>
      )}

      {/* 主内容区：Grid布局 */}
      <div
        className="xhs-layout__body"
        style={{
          display: 'grid',
          gridTemplateColumns: sidebarOpen ? '260px 1fr' : '1fr',
          gridTemplateRows: '1fr',
          flex: 1,
          overflow: 'hidden',
          transition: 'grid-template-columns 300ms ease-out',
        }}
      >
        {/* 左侧边栏（可选） */}
        {sidebar && sidebarOpen && (
          <aside
            className="xhs-layout__sidebar"
            style={{
              backgroundColor: '#FFFFFF',
              borderRight: '1px solid #FFE4E6',
              padding: '20px',
              overflowY: 'auto',
              boxShadow: '2px 0 8px rgba(255, 107, 157, 0.04)',
            }}
            role="complementary"
            aria-label="Sidebar navigation"
          >
            {sidebar}
          </aside>
        )}

        {/* 中间主内容区 */}
        <main
          className="xhs-layout__main"
          style={{
            padding: '24px',
            overflowY: 'auto',
            backgroundColor: '#FFF5F7',
          }}
          role="main"
        >
          {children}
        </main>

        {/* 右侧面板（可选） */}
        {rightPanel && rightPanelOpen && (
          <aside
            className="xhs-layout__right-panel"
            style={{
              backgroundColor: '#FFFFFF',
              borderLeft: '1px solid #FFE4E6',
              padding: '20px',
              width: '320px',
              overflowY: 'auto',
              boxShadow: '-2px 0 8px rgba(255, 107, 157, 0.04)',
            }}
            role="complementary"
            aria-label="Additional information panel"
          >
            {rightPanel}
          </aside>
        )}
      </div>

      {/* 移动端：侧边栏切换按钮（仅在移动端显示） */}
      {(sidebar || rightPanel) && (
        <div
          className="xhs-layout__mobile-controls"
          style={{
            display: 'none',
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            gap: '12px',
            zIndex: 200,
          }}
        >
          {sidebar && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                padding: '10px 18px',
                borderRadius: '9999px',
                border: 'none',
                background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8E9B 100%)',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255, 107, 157, 0.3)',
              }}
              aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              ☰ {sidebarOpen ? 'Hide' : 'Show'} Menu
            </button>
          )}

          {rightPanel && (
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              style={{
                padding: '10px 18px',
                borderRadius: '9999px',
                border: '1px solid #FFE4E6',
                background: '#FFFFFF',
                color: '#FF6B9D',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
              aria-label={rightPanelOpen ? 'Hide panel' : 'Show panel'}
            >
              📋 {rightPanelOpen ? 'Hide' : 'Show'} Panel
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 1023px) {
          .xhs-layout__body {
            grid-template-columns: ${sidebarOpen ? '240px 1fr' : '1fr'} !important;
          }
          
          .xhs-layout__right-panel {
            display: none !important;
          }

          .xhs-layout__mobile-controls {
            display: flex !important;
          }
        }

        @media (max-width: 767px) {
          .xhs-layout__body {
            grid-template-columns: 1fr !important;
          }

          .xhs-layout__sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 280px;
            z-index: 300;
            transform: translateX(${sidebarOpen ? '0' : '-100%'});
            transition: transform 300ms ease-out;
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
          }

          .xhs-layout__main {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
