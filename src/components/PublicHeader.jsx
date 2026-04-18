import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Headset } from 'lucide-react';

const PublicHeader = ({ active = 'home' }) => {
  const navigate = useNavigate();

  const navItems = [
    { key: 'info', label: 'Info', path: '/info' },
    { key: 'pricing', label: 'Pricing', path: '/pricing' },
    { key: 'dashboard', label: 'Dashboard', path: '/login' }
  ];

  return (
    <div className="public-header-wrap">
      <nav className="landing-nav glass-panel">
        <button className="nav-logo" onClick={() => navigate('/')}>
          <div className="logo-chip">
            <Headset size={19} />
          </div>
          <span className="font-heading">AI Hub Voice</span>
        </button>

        <div className="nav-links">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={active === item.key ? 'active-link' : ''}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="nav-actions">
          <button className="btn-secondary" onClick={() => navigate('/login')}>
            Inloggen
          </button>
          <button className="btn-primary" onClick={() => navigate('/setup-wizard')}>
            Start setup <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      <div className="mobile-nav-links glass-panel">
        <button className={active === 'home' ? 'active-link' : ''} onClick={() => navigate('/')}>
          Home
        </button>
        <button className={active === 'info' ? 'active-link' : ''} onClick={() => navigate('/info')}>
          Info
        </button>
        <button className={active === 'pricing' ? 'active-link' : ''} onClick={() => navigate('/pricing')}>
          Pricing
        </button>
        <button className={active === 'dashboard' ? 'active-link' : ''} onClick={() => navigate('/login')}>
          Dashboard
        </button>
      </div>
    </div>
  );
};

export default PublicHeader;
