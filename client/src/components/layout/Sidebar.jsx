import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/expenses', label: 'Expenses', icon: '💸' },
    { path: '/categories', label: 'Categories', icon: '📁' },
    { path: '/calendar', label: 'Calendar', icon: '📅' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const sidebarStyle = {
    width: '260px',
    height: '100vh',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-light)',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    zIndex: 20,
  };

  const headerStyle = {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid var(--border-light)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  };

  const logoBadgeStyle = {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    boxShadow: 'var(--shadow-sm)',
  };

  const navStyle = {
    flex: 1,
    padding: '1.25rem 0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  };

  const linkStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.65rem 1rem',
    borderRadius: 'var(--radius-md)',
    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
    fontWeight: isActive ? '700' : '500',
    fontSize: '0.9125rem',
    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    textDecoration: 'none',
  });

  const footerStyle = {
    padding: '1rem 1.25rem',
    borderTop: '1px solid var(--border-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'var(--bg-secondary)',
  };

  const userStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: 0,
  };

  const avatarStyle = {
    width: '34px',
    height: '34px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.875rem',
    flexShrink: 0,
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <div style={sidebarStyle} className="sidebar-desktop" role="navigation" aria-label="Main navigation">
      <div style={headerStyle}>
        <div style={logoBadgeStyle}>💳</div>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>FinanceTracker</h1>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal Edition</span>
        </div>
      </div>
      
      <nav style={navStyle}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              style={linkStyle(isActive)}
              className={isActive ? 'nav-item-active' : 'nav-item-idle'}
            >
              <span style={{ fontSize: '1.1rem', opacity: isActive ? 1 : 0.85 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={footerStyle}>
        <div style={userStyle}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="User" style={avatarStyle} />
          ) : (
            <div style={avatarStyle}>{getInitials(user?.fullName || user?.email)}</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.fullName || 'User'}
            </span>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email || ''}
            </span>
          </div>
        </div>
        <button 
          onClick={logout}
          style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-light)', 
            background: 'var(--bg-tertiary)', 
            cursor: 'pointer', 
            color: 'var(--text-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            transition: 'all 0.15s ease'
          }}
          title="Log Out"
          aria-label="Log Out"
        >
          🚪
        </button>
      </div>
      
      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop {
            display: none !important;
          }
        }
        .nav-item-idle:hover {
          background-color: var(--bg-tertiary) !important;
          color: var(--text-primary) !important;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;

