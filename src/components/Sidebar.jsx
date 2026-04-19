import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './Sidebar.css';

const Sidebar = ({ mobileOpen = false, onClose = () => {} }) => {
  const { signOut, user, isAdmin } = useAppContext();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
    { to: '/setup-wizard', label: 'Setup Wizard', icon: 'auto_fix' }
  ];

  const handleSignOut = () => {
    onClose();
    signOut();
  };

  return (
    <>
      <button
        className={`sidebar-mobile-backdrop ${mobileOpen ? 'is-visible' : ''}`}
        type="button"
        aria-label="Sluit menu"
        onClick={onClose}
      />

      <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo-icon">
              <span className="material-symbols-outlined">cloud_done</span>
            </div>
            <div>
              <span className="font-heading logo-text">Belliq</span>
              <p className="sidebar-subtitle">AI Call Intelligence</p>
            </div>
          </div>

          <button className="sidebar-mobile-close" type="button" aria-label="Sluit zijmenu" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="sidebar-nav">
          <div className="nav-section">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={Boolean(item.end)}
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                onClick={onClose}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {isAdmin && (
            <div className="nav-section">
              <p className="nav-label">Admin</p>
              <NavLink
                to="/dashboard/admin"
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                onClick={onClose}
              >
                <span className="material-symbols-outlined">shield</span>
                <span>Admin Console</span>
              </NavLink>
            </div>
          )}
        </div>

        <div className="sidebar-upgrade">
          <p className="upgrade-title">Upgrade to Pro</p>
          <p className="upgrade-copy">Unlock advanced AI voice models and unlimited calls.</p>
          <button className="upgrade-btn" type="button">Upgrade</button>
        </div>

        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              {user.email}
              {isAdmin ? ' · admin' : ''}
            </div>
          )}
          <button className="nav-item logout-btn" style={{ justifyContent: 'flex-start' }} onClick={handleSignOut} type="button">
            <LogOut size={20} />
            <span>Uitloggen</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
