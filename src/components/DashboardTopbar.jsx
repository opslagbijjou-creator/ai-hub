import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import './DashboardTopbar.css';

const DashboardTopbar = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const avatarLetter = (user?.email || 'A').trim().charAt(0).toUpperCase();

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar-search">
        <span className="material-symbols-outlined">search</span>
        <input type="text" placeholder="Search integrations..." aria-label="Zoeken" />
      </div>

      <div className="dashboard-topbar-actions">
        <button className="topbar-icon-btn" type="button" aria-label="Meldingen">
          <span className="material-symbols-outlined">notifications</span>
          <span className="topbar-dot" />
        </button>

        <button className="topbar-icon-btn" type="button" aria-label="Help">
          <span className="material-symbols-outlined">help_outline</span>
        </button>

        <button
          className="topbar-live-btn"
          type="button"
          onClick={() => navigate('/dashboard/call-studio')}
        >
          Live Studio
        </button>

        <div className="topbar-user">
          <div className="topbar-avatar">{avatarLetter}</div>
        </div>
      </div>
    </header>
  );
};

export default DashboardTopbar;

