import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CreditCard,
  Moon,
  Network,
  Shield,
  Sun,
  Workflow,
  Wrench
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './LandingPage.css';

const InfoPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useAppContext();

  return (
    <div className="landing-container marketing-page">
      <div className="marketing-grid"></div>

      <nav className="landing-nav glass-panel">
        <button className="nav-logo" onClick={() => navigate('/')}>
          <span className="font-heading">AI Hub Voice</span>
        </button>

        <div className="nav-links">
          <button className="active-link" onClick={() => navigate('/info')}>
            Info
          </button>
          <button onClick={() => navigate('/pricing')}>Pricing</button>
          <button onClick={() => navigate('/login')}>Dashboard</button>
        </div>

        <div className="nav-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'dark-mode' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="btn-primary" onClick={() => navigate('/setup-wizard')}>
            Start setup <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      <section className="pricing-hero info-hero">
        <h1>Info: zo werkt jouw AI bel-assistent platform</h1>
        <p>
          Deze omgeving is gebouwd als call-only MVP: web test eerst, telefoon pas live na payment approval en
          provisioning.
        </p>
      </section>

      <section className="info-grid">
        <article className="glass-panel info-card">
          <h3>
            <Workflow size={18} /> End-to-end flow
          </h3>
          <ol>
            <li>Gebruiker kiest stem, nummer en bedrijfscontext in wizard.</li>
            <li>Web call test draait direct in browser met live states.</li>
            <li>Factuur wordt aangevraagd en admin keurt betaling goed.</li>
            <li>Provisioning koppelt nummer + webhook en zet assistent live.</li>
          </ol>
        </article>

        <article className="glass-panel info-card">
          <h3>
            <Network size={18} /> Architectuur
          </h3>
          <ul>
            <li>Frontend: React + Vite</li>
            <li>Backend: lichte Express API laag</li>
            <li>Database: Supabase (RLS per tenant)</li>
            <li>Telephony: Twilio</li>
            <li>AI/spraak: OpenAI + ElevenLabs</li>
          </ul>
        </article>

        <article className="glass-panel info-card">
          <h3>
            <CreditCard size={18} /> Billing model
          </h3>
          <ul>
            <li>Invoice status flow: invoice_sent → paid_approved → live</li>
            <li>Inbegrepen minuten + tasks per pakket</li>
            <li>Overage apart afgerekend per minuut en per task</li>
            <li>Usage dashboard toont verwachte maandfactuur</li>
          </ul>
        </article>

        <article className="glass-panel info-card">
          <h3>
            <Shield size={18} /> Veiligheid & data
          </h3>
          <ul>
            <li>Supabase Auth + token-based API requests</li>
            <li>Per gebruiker gescheiden records via RLS</li>
            <li>Call sessions en usage worden gelogd voor auditing</li>
            <li>Geen WhatsApp meer in productscope</li>
          </ul>
        </article>

        <article className="glass-panel info-card wide">
          <h3>
            <Wrench size={18} /> Wat je vandaag al kunt
          </h3>
          <p>
            Je kunt nu volledige onboarding doen, stemmen en nummers kiezen, een realistisch webgesprek voeren,
            factuur aanvragen, en de provisioningstatus volgen in dashboard/call studio. Zodra admin betaling op
            <strong> paid_approved</strong> zet, wordt nummer live gekoppeld.
          </p>
          <div className="info-cta-row">
            <button className="btn-primary" onClick={() => navigate('/pricing')}>
              Bekijk pricing
            </button>
            <button className="btn-secondary" onClick={() => navigate('/setup-wizard')}>
              Start wizard
            </button>
          </div>
        </article>
      </section>

      <footer className="marketing-footer">
        <p>Wil je de complete flow testen met jouw bedrijfsdata?</p>
        <button className="btn-primary" onClick={() => navigate('/setup-wizard')}>
          Open setup wizard <ArrowRight size={16} />
        </button>
      </footer>
    </div>
  );
};

export default InfoPage;
