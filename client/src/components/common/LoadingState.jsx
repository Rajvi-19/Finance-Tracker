import React from 'react';

const LoadingState = ({ message = 'Loading...', fullScreen = false }) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    height: fullScreen ? '100vh' : '100%',
    width: '100%',
    color: 'var(--text-muted)',
  };

  const spinnerStyle = {
    width: '40px',
    height: '40px',
    border: '4px solid var(--border-light)',
    borderTop: '4px solid var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={spinnerStyle} />
      <p style={{ fontWeight: 500 }}>{message}</p>
    </div>
  );
};

export default LoadingState;
