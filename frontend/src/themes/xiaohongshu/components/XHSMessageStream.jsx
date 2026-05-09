import React, { useRef, useEffect } from 'react';

export function XHSMessageStream({
  messages = [],
  onScrollToEnd,
  isLoading = false,
  className = '',
  style = {},
}) {
  const containerRef = useRef(null);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const roleStyles = {
    proposer: {
      bubbleBg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      bubbleBorder: '1px solid #BFDBFE',
      textColor: '#1E40AF',
      align: 'flex-start',
      avatar: '👨‍💼',
      label: '提案者',
      labelBg: '#DBEAFE',
      labelColor: '#1E40AF',
    },
    reviewer: {
      bubbleBg: 'linear-gradient(135deg, #FFF5F7 0%, #FFE4E6 100%)',
      bubbleBorder: '1px solid #FECDD3',
      textColor: '#881337',
      align: 'flex-end',
      avatar: '🔍',
      label: '审查者',
      labelBg: '#FECDD3',
      labelColor: '#881337',
    },
    system: {
      bubbleBg: '#F9FAFB',
      bubbleBorder: '1px solid #E5E7EB',
      textColor: '#6B7280',
      align: 'center',
      avatar: '⚙️',
      label: '系统',
      labelBg: '#E5E7EB',
      labelColor: '#374151',
    },
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      ref={containerRef}
      className={`xhs-message-stream ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        overflowY: 'auto',
        maxHeight: '600px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #FFE4E6',
        boxShadow: '0 4px 12px rgba(255, 107, 157, 0.08)',
        ...style,
      }}
      role="log"
      aria-label="Debate message stream"
    >
      {/* 空状态提示 */}
      {messages.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#FB7185',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: '500' }}>
            No messages yet. Start a debate to see the conversation here.
          </p>
        </div>
      )}

      {/* 消息列表 */}
      {messages.map((msg, index) => {
        const role = msg.role || 'system';
        const styles = roleStyles[role] || roleStyles.system;

        return (
          <div
            key={msg.id || index}
            className="xhs-message-stream__item"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: styles.align,
              gap: '8px',
              animation: `fadeInUp 300ms ease-out ${index * 50}ms both`,
            }}
          >
            {/* 消息头部：角色 + 时间 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                fontWeight: '600',
                opacity: 0.8,
              }}
            >
              <span>{styles.avatar}</span>
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  backgroundColor: styles.labelBg,
                  color: styles.labelColor,
                  fontSize: '11px',
                }}
              >
                {styles.label}
              </span>
              {msg.timestamp && (
                <span style={{ color: '#FCA5A5', fontSize: '11px' }}>
                  {formatTime(msg.timestamp)}
                </span>
              )}
            </div>

            {/* 消息气泡 */}
            <div
              className="xhs-message-stream__bubble"
              style={{
                maxWidth: role === 'system' ? '90%' : '75%',
                padding: '14px 18px',
                borderRadius: role === 'system' ? '12px' : '16px',
                background: styles.bubbleBg,
                border: styles.bubbleBorder,
                color: styles.textColor,
                fontSize: '14px',
                lineHeight: '1.6',
                wordBreak: 'break-word',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              {typeof msg.content === 'string'
                ? msg.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < msg.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))
                : msg.content}
            </div>
          </div>
        );
      })}

      {/* 加载指示器 */}
      {isLoading && (
        <div
          className="xhs-message-stream__loading"
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '16px',
            gap: '6px',
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#FF6B9D',
                animation: `bounce 1.4s infinite ease-in-out both`,
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* 滚动到底部按钮 */}
      {onScrollToEnd && (
        <button
          onClick={() => {
            scrollToBottom();
            onScrollToEnd();
          }}
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8E9B 100%)',
            color: '#FFFFFF',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255, 107, 157, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            transition: 'transform 200ms ease-out',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          aria-label="Scroll to bottom"
        >
          ↓
        </button>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        .xhs-message-stream::-webkit-scrollbar {
          width: 6px;
        }

        .xhs-message-stream::-webkit-scrollbar-track {
          background: #FFF5F7;
          border-radius: 3px;
        }

        .xhs-message-stream::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #FFB6C1 0%, #FF6B9D 100%);
          border-radius: 3px;
        }

        .xhs-message-stream::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #FF8E9B 0%, #E85D8F 100%);
        }

        @media (max-width: 767px) {
          .xhs-message-stream {
            padding: 12px !important;
            maxHeight: 400px !important;
          }

          .xhs-message-stream__bubble {
            max-width: 85% !important;
            font-size: 13px !important;
            padding: 10px 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
