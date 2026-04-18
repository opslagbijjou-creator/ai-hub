import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Clock3,
  Headset,
  Mic,
  PhoneCall,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { PRICING_PLANS } from '../lib/pricing';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const growthPlan = PRICING_PLANS.find((plan) => plan.key === 'plan_275') || PRICING_PLANS[1];

  return (
    <div className="landing-container">
      <div className="marketing-grid"></div>

      <nav className="landing-nav glass-panel">
        <button className="nav-logo" onClick={() => navigate('/')}>
          <div className="logo-chip">
            <Headset size={19} />
          </div>
          <span className="font-heading">AI Hub Voice</span>
        </button>

        <div className="nav-links">
          <button onClick={() => navigate('/info')}>Info</button>
          <button onClick={() => navigate('/pricing')}>Pricing</button>
          <button onClick={() => navigate('/login')}>Dashboard</button>
        </div>

        <div className="nav-actions">
          <button className="btn-secondary" onClick={() => navigate('/login')}>
            Inloggen
          </button>
          <button className="btn-primary" onClick={() => navigate('/setup-wizard')}>
            Start setup <ArrowRight size={17} />
          </button>
        </div>
      </nav>

      <main className="hero-section">
        <section className="hero-content animate-fade-in">
          <div className="badge glass-panel">
            <Sparkles size={14} /> Call-only SaaS • binnen minuten te testen
          </div>

          <h1 className="hero-title">
            Bouw een <span className="text-gradient">AI Bel-Assistent</span> die echt klinkt als jouw team.
          </h1>

          <p className="hero-subtitle">
            Klanten bellen, jouw AI neemt op, stelt slimme vragen en registreert alles. Eerst testen op de website,
            daarna pas live op je nummer na betaling en provisioning.
          </p>

          <div className="hero-cta">
            <button className="btn-primary btn-large" onClick={() => navigate('/setup-wizard')}>
              Assistent bouwen <ArrowRight size={19} />
            </button>
            <button className="btn-secondary btn-large" onClick={() => navigate('/pricing')}>
              Bekijk prijzen
            </button>
          </div>

          <div className="hero-pill-row">
            <div className="hero-pill glass-panel">
              <PhoneCall size={15} /> Web test met microfoon
            </div>
            <div className="hero-pill glass-panel">
              <BrainCircuit size={15} /> Live AI states in UI
            </div>
            <div className="hero-pill glass-panel">
              <BadgeCheck size={15} /> Duidelijke pakketten en overage
            </div>
          </div>
        </section>

        <section className="hero-visual animate-float">
          <div className="abstract-shape shape-1"></div>
          <div className="abstract-shape shape-2"></div>

          <div className="dashboard-preview glass-panel">
            <div className="preview-header">
              <div className="dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="preview-title">Call Studio • realtime</div>
            </div>

            <div className="preview-body stack">
              <div className="mock-card status-card">
                <div className="status-avatar">
                  <Mic size={20} />
                </div>
                <div>
                  <h4>Listening</h4>
                  <p>AI luistert naar de vraag van de klant</p>
                </div>
                <div className="pulse-dot"></div>
              </div>

              <div className="mock-card timeline-card">
                <h4>Gespreksflow</h4>
                <ol>
                  <li>
                    <strong>Thinking</strong>
                    <span>Prompt + bedrijfsdata wordt verwerkt</span>
                  </li>
                  <li>
                    <strong>Speaking</strong>
                    <span>Antwoord wordt uitgesproken met gekozen stem</span>
                  </li>
                  <li>
                    <strong>Logged</strong>
                    <span>Minuten + tasks gaan naar usage dashboard</span>
                  </li>
                </ol>
              </div>

              <div className="mock-card pricing-teaser">
                <p className="text-muted">Vanaf</p>
                <h3>€{PRICING_PLANS[0].monthlyPriceEur}/mnd</h3>
                <small>{growthPlan.includedMinutes} min in {growthPlan.name}</small>
              </div>
            </div>
          </div>
        </section>
      </main>

      <section className="features-section" id="voordelen">
        <div className="feature-card glass-panel">
          <div className="icon-wrapper">
            <Clock3 size={22} color="var(--primary)" />
          </div>
          <h3>24/7 bereikbaar</h3>
          <p>Geen gemiste oproepen meer. De assistent handelt standaardvragen en intake direct af.</p>
        </div>

        <div className="feature-card glass-panel">
          <div className="icon-wrapper">
            <BadgeCheck size={22} color="var(--secondary)" />
          </div>
          <h3>Pas live na betaling</h3>
          <p>Eerst web-test in je SaaS. Nummer gaat pas live na invoice approval en provisioning.</p>
        </div>

        <div className="feature-card glass-panel">
          <div className="icon-wrapper">
            <ShieldCheck size={22} color="#22c55e" />
          </div>
          <h3>Transparante kosten</h3>
          <p>Per pakket zie je inbegrepen minuten en duidelijke kosten voor extra minuten.</p>
        </div>
      </section>

      <section className="proof-section glass-panel" id="hoe-het-werkt">
        <div className="proof-copy">
          <h2>Van onboarding naar live telefoonnummer in 4 stappen</h2>
          <p>
            Je klantflow blijft simpel: bedrijfsinfo invullen, stem kiezen, webgesprek testen, factuur aanvragen.
            Daarna zet admin op betaald en provisioning maakt alles live.
          </p>
          <div className="proof-cta-row">
            <button className="btn-primary" onClick={() => navigate('/info')}>
              Bekijk volledige flow <ArrowRight size={16} />
            </button>
            <button className="btn-secondary" onClick={() => navigate('/pricing')}>
              Bekijk pakketten
            </button>
          </div>
        </div>

        <div className="proof-grid">
          <div>
            <h3>01</h3>
            <p>Wizard + prompt setup</p>
          </div>
          <div>
            <h3>02</h3>
            <p>Web call test</p>
          </div>
          <div>
            <h3>03</h3>
            <p>Invoice & approval</p>
          </div>
          <div>
            <h3>04</h3>
            <p>Provisioning naar live</p>
          </div>
        </div>
      </section>

      <footer className="marketing-footer">
        <p>AI Hub Voice • NL-first AI bel-assistent platform</p>
        <div>
          <button onClick={() => navigate('/info')}>Info</button>
          <button onClick={() => navigate('/pricing')}>Pricing</button>
          <button onClick={() => navigate('/login')}>Login</button>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
