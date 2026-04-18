import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Headset } from 'lucide-react';

const PublicFooter = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer glass-panel">
      <div className="site-footer-top">
        <div className="site-footer-brand">
          <div className="site-footer-logo">
            <Headset size={16} />
          </div>
          <div>
            <h4>AI Hub Voice</h4>
            <p>Call-only AI bel-assistent platform voor bedrijven.</p>
          </div>
        </div>

        <div className="site-footer-links">
          <button onClick={() => navigate('/')}>Home</button>
          <button onClick={() => navigate('/info')}>Info</button>
          <button onClick={() => navigate('/pricing')}>Pricing</button>
          <button onClick={() => navigate('/login')}>Dashboard</button>
        </div>

        <div className="site-footer-cta">
          <button className="btn-primary" onClick={() => navigate('/setup-wizard')}>
            Start setup <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {year} AI Hub Voice</span>
        <span>NL-first • Web test eerst, live call na approval</span>
      </div>
    </footer>
  );
};

export default PublicFooter;
