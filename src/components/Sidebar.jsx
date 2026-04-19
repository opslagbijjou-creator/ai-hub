import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './Sidebar.css';

const Sidebar = () => {
  const { signOut, user, isAdmin } = useAppContext();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
    { to: '/dashboard/call-studio', label: 'Call Studio', icon: 'call' },
    { to: '/dashboard/knowledge-base', label: 'Knowledge Base', icon: 'menu_book' },
    { to: '/setup-wizard', label: 'Setup Wizard', icon: 'auto_fix' },
    { to: '/dashboard/integrations', label: 'Integrations', icon: 'shopping_cart' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <span className="material-symbols-outlined">cloud_done</span>
        </div>
        <div>
          <span className="font-heading logo-text">Belliq</span>
          <p className="sidebar-subtitle">AI Call Intelligence</p>
        </div>
      </div>

      <div className="sidebar-nav">
        <div className="nav-section">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={Boolean(item.end)}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {isAdmin && (
          <div className="nav-section">
            <p className="nav-label">Admin</p>
            <NavLink to="/dashboard/admin" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
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
        <button className="nav-item logout-btn" style={{ justifyContent: 'flex-start' }} onClick={signOut} type="button">
          <LogOut size={20} />
          <span>Uitloggen</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
