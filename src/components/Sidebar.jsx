import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Grid, BookOpen, Settings, Bot, LogOut, Sun, Moon, MessageSquare, Phone } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './Sidebar.css';

const Sidebar = () => {
  const { theme, toggleTheme, signOut, user } = useAppContext();

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <Bot className="text-gradient" size={28} />
        <span className="font-heading logo-text">AI Hub</span>
      </div>
      
      <div className="sidebar-nav">
        <div className="nav-section">
          <p className="nav-label">Main</p>
          <NavLink to="/dashboard" end className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </NavLink>
          <NavLink to="/dashboard/catalog" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Grid size={20} />
            <span>App Store</span>
          </NavLink>
        </div>
        
        <div className="nav-section">
          <p className="nav-label">AI Assistants</p>
          <NavLink to="/dashboard/whatsapp" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <MessageSquare size={20} />
            <span>WhatsApp Agent</span>
          </NavLink>
          <NavLink to="/setup-wizard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Phone size={20} />
            <span>Call Assistant</span>
          </NavLink>
        </div>

        <div className="nav-section">
          <p className="nav-label">Training & Config</p>
          <NavLink to="/dashboard/knowledge-base" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <BookOpen size={20} />
            <span>Knowledge Base</span>
          </NavLink>
          <NavLink to="/dashboard/settings" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Settings size={20} />
            <span>Account Settings</span>
          </NavLink>
        </div>
      </div>

      <div className="sidebar-footer" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
        {user && (
          <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', marginBottom: '0.25rem', paddingTop: '1rem' }}>
            {user.email}
          </div>
        )}
        <button className="nav-item" onClick={toggleTheme} style={{justifyContent: 'flex-start'}}>
          {theme === 'dark-mode' ? <Sun size={20} /> : <Moon size={20} />}
          <span>{theme === 'dark-mode' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button className="nav-item logout-btn" style={{justifyContent: 'flex-start'}} onClick={signOut}>
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
