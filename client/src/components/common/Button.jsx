import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  className = '',
  style = {},
  ...props
}) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: '600',
    letterSpacing: '-0.01em',
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.65 : 1,
    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'none',
    width: fullWidth ? '100%' : 'auto',
    whiteSpace: 'nowrap',
    boxShadow: variant === 'primary' ? 'var(--shadow-sm)' : 'none',
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--primary)',
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-light)',
    },
    danger: {
      backgroundColor: 'var(--danger)',
      color: '#ffffff',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--primary)',
      border: '1px solid var(--primary)',
    },
  };

  const sizes = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.8125rem' },
    md: { padding: '0.55rem 1.15rem', fontSize: '0.875rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '0.95rem' },
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...baseStyle,
        ...variants[variant],
        ...sizes[size],
        ...style,
      }}
      className={`btn-modern btn-${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

