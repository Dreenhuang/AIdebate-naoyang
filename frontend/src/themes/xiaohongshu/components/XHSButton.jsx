import React from 'react';

export function XHSButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  style = {},
}) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: size === 'sm' ? '8px 16px' : (size === 'lg' ? '14px 28px' : '10px 20px'),
    borderRadius: '9999px',
    fontFamily: "'Noto Sans SC', 'PingFang SC', sans-serif",
    fontSize: size === 'sm' ? '0.75rem' : (size === 'lg' ? '1rem' : '0.875rem'),
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 250ms ease-out',
    border: 'none',
    outline: 'none',
    opacity: disabled ? 0.5 : 1,
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8E9B 100%)',
      color: '#FFFFFF',
      boxShadow: '0 4px 12px rgba(255, 107, 157, 0.3)',
    },
    secondary: {
      background: '#FFF5F7',
      color: '#FF6B9D',
      border: '1px solid #FFE4E6',
    },
    ghost: {
      background: 'transparent',
      color: '#FB7185',
    },
  };

  return (
    <button
      className={`xhs-button xhs-button--${variant} ${className}`}
      style={{
        ...baseStyles,
        ...variants[variant],
        ...style
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
