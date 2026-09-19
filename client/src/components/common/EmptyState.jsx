import React from 'react';
import Button from './Button';

const EmptyState = ({ 
  icon = '📝', 
  title = 'No data found', 
  description = 'There is nothing to show here yet.', 
  actionLabel, 
  onAction 
}) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    textAlign: 'center',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px dashed var(--border-strong)',
    color: 'var(--text-secondary)',
    height: '100%',
    minHeight: '200px'
  };

  const iconStyle = {
    fontSize: '3rem',
    marginBottom: '1rem',
    opacity: 0.8
  };

  const titleStyle = {
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
    fontSize: '1.25rem',
    fontWeight: '600'
  };

  const descStyle = {
    marginBottom: actionLabel ? '1.5rem' : '0',
    maxWidth: '400px'
  };

  return (
    <div style={containerStyle}>
      <div style={iconStyle}>{icon}</div>
      <h3 style={titleStyle}>{title}</h3>
      <p style={descStyle}>{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
};

export default EmptyState;
