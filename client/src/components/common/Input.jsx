import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  helperText,
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    width: fullWidth ? '100%' : 'auto',
    marginBottom: '1rem',
  };

  const labelStyle = {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    letterSpacing: '-0.01em',
  };

  const inputStyle = {
    padding: '0.55rem 0.85rem',
    fontSize: '0.9375rem',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${error ? 'var(--danger)' : 'var(--border-light)'}`,
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
  };

  const errorStyle = {
    fontSize: '0.75rem',
    fontWeight: '500',
    color: 'var(--danger)',
    marginTop: '0.15rem',
  };

  const helperStyle = {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.15rem',
  };

  return (
    <div style={containerStyle} className={className}>
      {label && <label style={labelStyle}>{label}</label>}
      {type === 'select' ? (
        <select ref={ref} style={{...inputStyle, ...props.style}} {...props}>
          {props.children}
        </select>
      ) : (
        <input ref={ref} type={type} style={{...inputStyle, ...props.style}} {...props} />
      )}
      {error && <span style={errorStyle}>{error}</span>}
      {helperText && !error && <span style={helperStyle}>{helperText}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

