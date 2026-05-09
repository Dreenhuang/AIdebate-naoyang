import React from 'react';

export function XHSCard({
  children,
  variant = 'default',
  hoverable = true,
  onClick,
  className = '',
  style = {},
}) {
  const baseStyles = {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 250ms ease-out',
    border: '1px solid transparent',
    cursor: hoverable ? 'pointer' : 'default',
  };

  const variants = {
    default: {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    },
    elevated: {
      boxShadow: '0 10px 15px rgba(255, 107, 157, 0.1)',
    },
    outlined: {
      border: '1px solid #FFE4E6',
      boxShadow: 'none',
    },
  };

  return (
    <div
      className={`xhs-card xhs-card--${variant} ${className}`}
      style={{
        ...baseStyles,
        ...variants[variant],
        ...style
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
