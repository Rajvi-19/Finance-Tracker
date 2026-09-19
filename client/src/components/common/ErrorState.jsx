import React from 'react';
import Button from './Button';

const ErrorState = ({ 
  title = 'Something went wrong', 
  message = 'An error occurred while loading this data.', 
  onRetry 
}) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    textAlign: 'center',
    backgroundColor: 'var(--danger-bg)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--danger)',
    color: 'var(--danger)',
  };

  const iconStyle = {
    fontSize: '3rem',
    marginBottom: '1rem',
  };

  const titleStyle = {
    marginBottom: '0.5rem',
    fontSize: '1.25rem',
    fontWeight: '600'
  };

  const descStyle = {
    marginBottom: onRetry ? '1.5rem' : '0',
    color: 'var(--text-secondary)'
  };

  return (
    <div style={containerStyle}>
      <div style={iconStyle}>⚠️</div>
      <h3 style={titleStyle}>{title}</h3>
      <p style={descStyle}>{message}</p>
      {onRetry && (
        <Button variant="danger" onClick={onRetry}>Try Again</Button>
      )}
    </div>
  );
};

export default ErrorState;
