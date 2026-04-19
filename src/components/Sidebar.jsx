import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Grid, LayoutDashboard, LogOut, Mic, Phone, ShieldCheck, Settings } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './Sidebar.css';

const Sidebar = () => {
  const { signOut, user, isAdmin } = useAppContext();

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <span className="font-heading logo-text">Belliq</span>
      </div>

      <div className="sidebar-nav">
        <div className="nav-section">
          <p className="nav-label">Algemeen</p>
          <NavLink to="/dashboard" end className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <LayoutDashboard size={20} />
            <span>Overzicht</span>
          </NavLink>
          <NavLink to="/dashboard/catalog" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <Grid size={20} />
            <span>Apps</span>
          </NavLink>
        </div>

        <div className="nav-section">
          <p className="nav-label">AI Assistent</p>
          <NavLink to="/setup-wizard" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <Phone size={20} />
            <span>Setup wizard</span>
          </NavLink>
          <NavLink to="/dashboard/call-studio" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <Mic size={20} />
            <span>Call Studio</span>
          </NavLink>
        </div>

        <div className="nav-section">
          <p className="nav-label">Instellingen</p>
          <NavLink
            to="/dashboard/knowledge-base"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <BookOpen size={20} />
            <span>Kennisbank</span>
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <Settings size={20} />
            <span>Account</span>
          </NavLink>
        </div>

        {isAdmin && (
          <div className="nav-section">
            <p className="nav-label">Admin</p>
            <NavLink to="/dashboard/admin" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <ShieldCheck size={20} />
              <span>Admin Console</span>
            </NavLink>
          </div>
        )}
      </div>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {user && (
          <div
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--glass-border)',
              marginBottom: '0.25rem',
              paddingTop: '1rem'
            }}
          >
            {user.email}
            {isAdmin ? ' · admin' : ''}
          </div>
        )}
        <button className="nav-item logout-btn" style={{ justifyContent: 'flex-start' }} onClick={signOut}>
          <LogOut size={20} />
          <span>Uitloggen</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
