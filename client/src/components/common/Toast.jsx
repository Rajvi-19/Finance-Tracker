import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const containerStyle = {
    position: 'fixed',
    bottom: '1rem',
    right: '1rem',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    pointerEvents: 'none',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={containerStyle}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const types = {
    success: { bg: 'var(--success)', icon: '✅' },
    error: { bg: 'var(--danger)', icon: '❌' },
    info: { bg: 'var(--primary)', icon: 'ℹ️' },
    warning: { bg: 'var(--warning)', icon: '⚠️' },
  };

  const style = {
    backgroundColor: types[toast.type].bg,
    color: '#fff',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-md)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    pointerEvents: 'auto',
    animation: 'slideIn 0.3s ease forwards',
    maxWidth: '350px',
  };

  return (
    <div style={style}>
      <style>
        {`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>
      <span>{types[toast.type].icon}</span>
      <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{toast.message}</span>
      <button 
        onClick={onRemove}
        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7 }}
      >
        &times;
      </button>
    </div>
  );
};

export const useToast = () => useContext(ToastContext);
