import React from 'react';
import { Ban, CircleDollarSign, FileText, Wrench } from 'lucide-react';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import './LandingPage.css';

const termsCards = [
  {
    icon: FileText,
    title: 'Dienst in het kort',
    items: [
      'Het platform helpt bedrijven een AI telefoonassistent te configureren, testen en later live te activeren.',
      'De browser-test is bedoeld om kwaliteit te valideren voordat echte telefonie start.',
      'Live telefonie en externe koppelingen kunnen extra leveranciers en voorwaarden met zich meebrengen.'
    ]
  },
  {
    icon: CircleDollarSign,
    title: 'Facturatie en activatie',
    items: [
      'Betaalde pakketten starten bij live activatie van nummer en telefonieflow.',
      'Extra minuten en AI-taken worden volgens het gekozen pakket afgerekend.',
      'Prijzen en inbegrepen usage horen zichtbaar te zijn in dashboard en offerteflow.'
    ]
  },
  {
    icon: Wrench,
    title: 'Verantwoordelijkheden van de klant',
    items: [
      'De klant blijft verantwoordelijk voor de juistheid van bedrijfsinformatie, openingsuren en routingregels.',
      'De klant moet zelf nagaan of scripts, opnames en workflows juridisch passen bij de eigen sector.',
      'De klant beheert wie toegang heeft tot dashboard, integraties en gespreksdata.'
    ]
  },
  {
    icon: Ban,
    title: 'Niet toegestaan',
    items: [
      'Gebruik voor misleiding, onrechtmatige telemarketing of verboden automatische besluitvorming.',
      'Verwerking van data zonder passende grondslag, kennisgeving of contractuele basis.',
      'Inzet op manieren die strijdig zijn met telecom-, privacy- of consumentenwetgeving.'
    ]
  }
];

const TermsPage = () => {
  return (
    <div className="landing-container marketing-page">
      <div className="marketing-grid"></div>
      <PublicHeader active="privacy" />

      <section className="pricing-hero info-hero">
        <span className="section-eyebrow centered">Voorwaarden</span>
        <h1>Heldere commerciële uitgangspunten voor je AI bel-assistent</h1>
        <p>
          Dit is een praktische productpagina voor de grote lijnen. Voor productie hoort hier nog een formele overeenkomst of SaaS-contract bij dat aansluit op jouw bedrijf.
        </p>
      </section>

      <section className="legal-grid">
        {termsCards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.title} className="glass-panel legal-card">
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

      <section className="cta-panel glass-panel legal-note">
        <div>
          <span className="section-eyebrow">Belangrijk</span>
          <h2>Maak voor livegebruik nog een formele set contractdocumenten</h2>
          <p className="panel-copy">
            Denk aan algemene voorwaarden, een verwerkersovereenkomst, een subprocessor-bijlage en duidelijke afspraken over support, beschikbaarheid en incidentrespons. Dan sluit je commerciële laag beter aan op de techniek die nu staat.
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default TermsPage;
