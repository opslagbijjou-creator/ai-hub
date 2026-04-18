import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CreditCard,
  Database,
  Mic,
  Network,
  Shield,
  ShoppingBag,
  Workflow,
  Wrench
} from 'lucide-react';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import './LandingPage.css';

const cards = [
  {
    icon: Workflow,
    title: 'Productflow',
    items: [
      'Bedrijfscontext, kennis en tone of voice invullen in de wizard.',
      'Voice en gewenst nummer kiezen zonder direct live te gaan.',
      'Gesprekken realistisch testen in de browser met microfoon.',
      'Pas na goedkeuring het nummer en abonnement activeren.'
    ]
  },
  {
    icon: Network,
    title: 'Architectuur',
    items: [
      'Frontend: React + Vite.',
      'Serverless laag: Supabase Edge Functions.',
      'Database en auth: Supabase met RLS per gebruiker.',
      'Telefonie en spraak: Twilio, OpenAI en ElevenLabs.'
    ]
  },
  {
    icon: CreditCard,
    title: 'Facturatie en activatie',
    items: [
      'Bouwen en browser-testen kunnen vooraf plaatsvinden.',
      'Facturatie start pas zodra je live activeert.',
      'Overage voor minuten en AI-taken blijft zichtbaar in je dashboard.',
      'Bij een nummerprobleem kun je eerst herselecteren in plaats van blind live gaan.'
    ]
  },
  {
    icon: Shield,
    title: 'Privacy-basis',
    items: [
      'Per gebruiker gescheiden data via Row Level Security.',
      'Auth-tokens voor beveiligde requests vanuit de app.',
      'Duidelijke scheiding tussen browser-test en echte telefonie.',
      'Publieke privacy-, compliance- en voorwaardenpagina’s voor transparantie.'
    ]
  },
  {
    icon: ShoppingBag,
    title: 'Integraties',
    items: [
      'Shopify, PrestaShop en WooCommerce kunnen orderstatus en servicevragen ondersteunen.',
      'Integraties zijn per bedrijf gekoppeld aan de eigen assistent.',
      'Je bepaalt zelf welke bedrijfscontext en systemen actief zijn.',
      'Complexere koppelingen kunnen later per branche worden uitgebreid.'
    ]
  },
  {
    icon: Database,
    title: 'Data en inzicht',
    items: [
      'Configuratie, promptdata en usage blijven per tenant beschikbaar.',
      'Web tests en live calls kunnen afzonderlijk worden gelogd.',
      'Bedrijfsprofiel, gekozen stem en nummer blijven centraal beheersbaar.',
      'Het dashboard vormt het uitgangspunt voor doorontwikkeling en rapportage.'
    ]
  }
];

const InfoPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container marketing-page">
      <div className="marketing-grid"></div>
      <PublicHeader active="info" />

      <section className="pricing-hero info-hero">
        <span className="section-eyebrow centered">Zo werkt het</span>
        <h1>Van eerste prompt tot live telefoonnummer, zonder onnodige tussenlagen</h1>
        <p>
          De opzet is bewust simpel gehouden: eerst browser-test, dan pas activatie. Daardoor kun je sneller bouwen en rustiger lanceren.
        </p>
      </section>

      <section className="info-grid">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.title} className="glass-panel info-card">
              <h3>
                <Icon size={18} /> {card.title}
              </h3>
              <ul>
                {card.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="cta-panel glass-panel info-band">
        <div>
          <span className="section-eyebrow">Wat je vandaag al kunt</span>
          <h2>Je kunt al een complete call-first ervaring neerzetten</h2>
          <p className="panel-copy">
            Onboarding, stemkeuze, nummerselectie, browsergesprekken, usage-inzicht en orderstatus-koppelingen zitten al in de richting van een verkoopbare MVP.
          </p>
          <ul className="check-list compact">
            <li>
              <Mic size={16} /> Web call test met duidelijke states in de UI.
            </li>
            <li>
              <Wrench size={16} /> Instelbaar profiel voor diensten, prijzen en openingsuren.
            </li>
            <li>
              <Shield size={16} /> Heldere basis voor privacy, DPA en launch-checklists.
            </li>
          </ul>
        </div>

        <div className="cta-panel-actions">
          <button className="btn-primary" onClick={() => navigate('/pricing')}>
            Bekijk pakketten <ArrowRight size={16} />
          </button>
          <button className="btn-secondary" onClick={() => navigate('/login')}>
            Gratis starten
          </button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default InfoPage;
