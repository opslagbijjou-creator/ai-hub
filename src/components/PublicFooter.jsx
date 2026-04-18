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
            <p>Call-first AI assistenten voor bedrijven die eerst willen testen en daarna pas live willen gaan.</p>
          </div>
        </div>

        <div className="site-footer-groups">
          <div className="site-footer-group">
            <span>Product</span>
            <button onClick={() => navigate('/')}>Home</button>
            <button onClick={() => navigate('/info')}>Werking</button>
            <button onClick={() => navigate('/pricing')}>Prijzen</button>
            <button onClick={() => navigate('/login')}>Dashboard</button>
          </div>

          <div className="site-footer-group">
            <span>Vertrouwen</span>
            <button onClick={() => navigate('/privacy')}>Privacy</button>
            <button onClick={() => navigate('/compliance')}>Compliance</button>
            <button onClick={() => navigate('/terms')}>Voorwaarden</button>
          </div>
        </div>

        <div className="site-footer-cta">
          <button className="btn-primary" onClick={() => navigate('/login')}>
            Gratis starten <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {year} AI Hub Voice</span>
        <span>Bouwen en browser-testen eerst. Abonnement start pas bij live activatie.</span>
      </div>
    </footer>
  );
};

export default PublicFooter;
