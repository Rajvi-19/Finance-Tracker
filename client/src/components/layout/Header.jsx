import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const Header = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Create page title from path
  let title = 'Dashboard';
  const path = location.pathname.split('/')[1];
  if (path) {
    title = path.charAt(0).toUpperCase() + path.slice(1);
  }

  const headerStyle = {
    padding: '0.85rem 1.5rem',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-light)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 15,
    gap: '1rem',
  };

  const titleStyle = {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
    margin: 0,
    flex: 1,
    minWidth: 0,
  };

  const mobileLogoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: '800',
    color: 'var(--primary)',
    fontSize: '1.05rem',
  };

  return (
    <header style={headerStyle}>
      <div className="mobile-logo-only" style={{ display: 'none' }}>
        <div style={mobileLogoStyle}>
          <span>💳</span> FinanceTracker
        </div>
      </div>
      <h2 style={titleStyle} className="desktop-title-only">{title}</h2>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }} className="desktop-greeting-only">
          Hello, <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{user?.fullName?.split(' ')[0] || 'User'}</strong>
        </span>
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-light)', 
            background: 'var(--bg-tertiary)', 
            color: 'var(--text-primary)', 
            cursor: 'pointer', 
            fontSize: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-title-only, .desktop-greeting-only {
            display: none !important;
          }
          .mobile-logo-only {
            display: block !important;
          }
          header {
            padding: 0.65rem 1rem !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;

