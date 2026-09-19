import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dash', icon: '📊' },
    { path: '/expenses', label: 'Expenses', icon: '💸' },
    { path: '/categories', label: 'Categories', icon: '📁' },
    { path: '/calendar', label: 'Calendar', icon: '📅' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const navStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'var(--bg-secondary)',
    borderTop: '1px solid var(--border-light)',
    display: 'flex',
    justifyContent: 'space-around',
    padding: '0.4rem 0.5rem',
    zIndex: 100,
    paddingBottom: 'calc(0.4rem + env(safe-area-inset-bottom))',
    boxShadow: 'var(--shadow-lg)',
  };

  const linkStyle = (isActive) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.15rem',
    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
    fontSize: '0.6875rem',
    fontWeight: isActive ? '700' : '500',
    textDecoration: 'none',
    flex: '1',
    padding: '0.3rem 0.25rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
    transition: 'all 0.18s ease',
  });

  return (
    <nav style={navStyle} className="bottom-nav-mobile">
      {navItems.map(item => (
        <Link 
          key={item.path} 
          to={item.path} 
          style={linkStyle(location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)))}
        >
          <span style={{ fontSize: '1.05rem' }}>{item.icon}</span>
          <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
        </Link>
      ))}
      
      <style>{`
        @media (min-width: 769px) {
          .bottom-nav-mobile {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
};

export default BottomNav;

