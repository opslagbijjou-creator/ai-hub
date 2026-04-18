import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CalendarClock,
  Headphones,
  Mic,
  PhoneCall,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Workflow
} from 'lucide-react';
import { PRICING_PLANS } from '../lib/pricing';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import './LandingPage.css';

const featureCards = [
  {
    icon: PhoneCall,
    title: 'Nooit meer een eerste lijn missen',
    copy:
      'Laat de assistent opnemen, vragen structureren en alleen doorzetten wanneer een medewerker echt nodig is.'
  },
  {
    icon: BrainCircuit,
    title: 'Antwoorden op basis van jouw bedrijf',
    copy:
      'Openingsuren, diensten, prijzen en veelgestelde vragen vormen samen de basis voor een consistente gesprekservaring.'
  },
  {
    icon: ShoppingBag,
    title: 'Klaar voor e-commerce en servicevragen',
    copy:
      'Shopify en PrestaShop kunnen worden gekoppeld zodat de assistent ook orderstatus en veelvoorkomende supportvragen kan oppakken.'
  }
];

const workflowSteps = [
  {
    number: '01',
    title: 'Bedrijfscontext invullen',
    copy: 'Je kiest stem, tone of voice, openingsuren en de belangrijkste antwoorden die je assistent moet kennen.'
  },
  {
    number: '02',
    title: 'Gesprek testen in de browser',
    copy: 'Je praat direct met je assistent via microfoon en ziet live states zoals luisteren, nadenken en spreken.'
  },
  {
    number: '03',
    title: 'Pas daarna live activeren',
    copy: 'Facturatie en nummeractivatie starten pas wanneer je tevreden bent en je assistent echt op telefoon live wilt zetten.'
  },
  {
    number: '04',
    title: 'Bijsturen in je dashboard',
    copy: 'Na livegang pas je kennis, stem, openingstijden en gekoppelde kanalen gewoon weer aan vanuit je dashboard.'
  }
];

const audienceCards = [
  {
    icon: Headphones,
    title: 'Recepties en backoffice teams',
    copy: 'Voor teams die rust willen op de telefoonlijn en meer tijd willen voor de gesprekken die echt aandacht vragen.'
  },
  {
    icon: CalendarClock,
    title: 'Dienstverleners met veel intake',
    copy: 'Laat de assistent openingsvragen stellen, context verzamelen en gesprekken netjes voorstructureren.'
  },
  {
    icon: ShieldCheck,
    title: 'Bedrijven die beheerst willen livegaan',
    copy: 'Eerst testen, dan pas activeren. Geen rommelige implementatie, maar een rustige livegang met duidelijke controle.'
  }
];

const compliancePillars = [
  'Supabase Auth en RLS per gebruiker',
  'Publieke privacy- en compliance pagina’s',
  'Duidelijke scheiding tussen browser-test en live telefonie',
  'Ruimte voor verwerkersafspraken en subprocessor-transparantie'
];

const LandingPage = () => {
  const navigate = useNavigate();
  const launchPlan = PRICING_PLANS[0];
  const growthPlan = PRICING_PLANS.find((plan) => plan.key === 'plan_275') || PRICING_PLANS[1];

  return (
    <div className="landing-container marketing-page">
      <div className="marketing-grid"></div>
      <PublicHeader active="home" />

      <main className="hero-section">
        <section className="hero-content animate-fade-in">
          <div className="badge glass-panel">
            <Sparkles size={14} /> Gratis bouwen en testen, pas betalen bij livegang
          </div>

          <h1 className="hero-title">
            Een <span className="text-gradient">AI telefoonassistent</span> die rustig, duidelijk en direct inzetbaar voelt.
          </h1>

          <p className="hero-subtitle">
            Bouw eerst je assistent in de browser, laat hem echte gesprekken voeren en zet pas daarna een nummer live.
            Zo hou je grip op kwaliteit, kosten en privacy vanaf de eerste dag.
          </p>

          <div className="hero-cta">
            <button className="btn-primary btn-large" onClick={() => navigate('/login')}>
              Gratis starten <ArrowRight size={18} />
            </button>
            <button className="btn-secondary btn-large" onClick={() => navigate('/pricing')}>
              Bekijk pakketten
            </button>
          </div>

          <div className="hero-mini-grid">
            <div className="glass-panel hero-mini-card">
              <span className="hero-mini-label">Browser test</span>
              <strong>Echte spraak, zonder live nummer</strong>
            </div>
            <div className="glass-panel hero-mini-card">
              <span className="hero-mini-label">Startprijs</span>
              <strong>Vanaf €{launchPlan.monthlyPriceEur}/mnd na activatie</strong>
            </div>
            <div className="glass-panel hero-mini-card">
              <span className="hero-mini-label">Meest gekozen</span>
              <strong>{growthPlan.includedMinutes} minuten in {growthPlan.name}</strong>
            </div>
          </div>
        </section>

        <section className="hero-visual animate-float">
          <div className="dashboard-preview glass-panel">
            <div className="preview-header">
              <div className="dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="preview-title">Call Studio • web test</div>
            </div>

            <div className="preview-body stack">
              <div className="mock-card status-card">
                <div className="status-avatar">
                  <Mic size={18} />
                </div>
                <div>
                  <h4>Luisteren</h4>
                  <p>De assistent vangt de vraag op en zoekt passende context.</p>
                </div>
                <div className="pulse-dot"></div>
              </div>

              <div className="mock-card timeline-card">
                <h4>Wat er live gebeurt</h4>
                <ol>
                  <li>
                    <strong>Thinking</strong>
                    <span>Bedrijfskennis, openingsuren en regels worden gecombineerd.</span>
                  </li>
                  <li>
                    <strong>Speaking</strong>
                    <span>Je gekozen stem geeft een kort, bruikbaar en natuurlijk antwoord terug.</span>
                  </li>
                  <li>
                    <strong>Logged</strong>
                    <span>Transcript en usage zijn meteen zichtbaar in je eigen dashboard.</span>
                  </li>
                </ol>
              </div>

              <div className="mock-card transcript-card">
                <div className="transcript-row user">
                  <span className="transcript-author">Beller</span>
                  <p>“Hoe laat zijn jullie morgen open en kan ik mijn bestelling volgen?”</p>
                </div>
                <div className="transcript-row assistant">
                  <span className="transcript-author">AI assistent</span>
                  <p>“We zijn morgen vanaf 09:00 open. Als je je ordernummer geeft, kijk ik direct de status met je na.”</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <section className="trust-strip glass-panel">
        <div className="trust-chip">
          <BadgeCheck size={16} /> Eerst testen, dan activeren
        </div>
        <div className="trust-chip">
          <Workflow size={16} /> Heldere flow van onboarding naar livegang
        </div>
        <div className="trust-chip">
          <ShieldCheck size={16} /> AVG-basis en tenant-isolatie ingericht
        </div>
      </section>

      <section className="section-shell">
        <div className="section-header">
          <span className="section-eyebrow">Waarom teams hiervoor kiezen</span>
          <h2>Een rustiger alternatief voor drukke recepties en gemiste oproepen</h2>
          <p>
            Geen overvolle interface of ingewikkelde setup. Alleen de onderdelen die een AI telefoonassistent echt bruikbaar maken.
          </p>
        </div>

        <div className="feature-grid">
          {featureCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.title} className="feature-card glass-panel">
                <div className="icon-wrapper">
                  <Icon size={21} color="var(--primary)" />
                </div>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="proof-section glass-panel">
        <div className="proof-copy">
          <span className="section-eyebrow">Van idee naar live assistent</span>
          <h2>Je hoeft niet in één keer live te gaan om te weten of het werkt.</h2>
          <p>
            De hele flow is ingericht om eerst zekerheid te krijgen. Daardoor voelt het product betrouwbaarder voor jou en rustiger voor je klantteam.
          </p>
          <div className="proof-cta-row">
            <button className="btn-primary" onClick={() => navigate('/info')}>
              Bekijk de volledige werkwijze <ArrowRight size={16} />
            </button>
            <button className="btn-secondary" onClick={() => navigate('/compliance')}>
              Bekijk privacy & compliance
            </button>
          </div>
        </div>

        <div className="proof-grid">
          {workflowSteps.map((step) => (
            <div key={step.number}>
              <h3>{step.number}</h3>
              <strong>{step.title}</strong>
              <p>{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-shell audience-section">
        <div className="section-header align-left">
          <span className="section-eyebrow">Voor wie het werkt</span>
          <h2>Gebouwd voor bedrijven die bereikbaar willen zijn zonder extra chaos</h2>
          <p>
            Denk aan praktijken, dienstverleners, e-commerce teams en organisaties die veel standaardvragen via telefoon afvangen.
          </p>
        </div>

        <div className="audience-grid">
          {audienceCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.title} className="audience-card glass-panel">
                <div className="icon-wrapper subtle">
                  <Icon size={20} color="var(--secondary)" />
                </div>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="cta-panel glass-panel">
        <div>
          <span className="section-eyebrow">Vertrouwen en duidelijkheid</span>
          <h2>Niet alleen een demo, maar een basis die je verantwoord kunt uitbouwen</h2>
          <ul className="check-list compact">
            {compliancePillars.map((item) => (
              <li key={item}>
                <BadgeCheck size={16} /> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="cta-panel-actions">
          <button className="btn-primary" onClick={() => navigate('/privacy')}>
            Lees privacy-overzicht
          </button>
          <button className="btn-secondary" onClick={() => navigate('/terms')}>
            Bekijk voorwaarden
          </button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default LandingPage;
