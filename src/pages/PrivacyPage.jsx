import React from 'react';
import { Database, FileText, LockKeyhole, Scale } from 'lucide-react';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import './LandingPage.css';

const privacyCards = [
  {
    icon: Database,
    title: 'Welke data dit product verwerkt',
    items: [
      'Accountgegevens zoals naam, e-mail en gebruikers-ID.',
      'Assistentconfiguratie zoals bedrijfsinformatie, openingstijden, prompt en gekozen stem.',
      'Gespreksdata zoals web tests, live call metadata, transcripts en usage-registratie.',
      'Optionele integratiegegevens voor gekoppelde shopsystemen en serviceprocessen.'
    ]
  },
  {
    icon: Scale,
    title: 'Rolverdeling onder de AVG',
    items: [
      'Voor klantdata in gesprekken ben jij in de meeste gevallen verwerkingsverantwoordelijke.',
      'Het platform functioneert dan doorgaans als verwerker namens jouw bedrijf.',
      'Voor eigen account-, facturatie- en beveiligingsdata is het platform zelf verwerkingsverantwoordelijke.',
      'Laat deze rolverdeling altijd aansluiten op je contracten, privacyverklaring en DPA.'
    ]
  },
  {
    icon: LockKeyhole,
    title: 'Beveiligingsbasis',
    items: [
      'Supabase Auth voor toegang en tenant-isolatie via Row Level Security.',
      'Edge Functions voor server-side logica zodat gevoelige sleutels niet in de browser staan.',
      'Gescheiden resources per gebruiker en per assistent.',
      'Ruimte om aanvullende bewaartermijnen, logging en exportprocedures vast te leggen voor productie.'
    ]
  },
  {
    icon: FileText,
    title: 'Subverwerkers en infrastructuur',
    items: [
      'Supabase voor auth, database en serverless functies.',
      'OpenAI voor transcriptie en antwoordgeneratie.',
      'ElevenLabs voor spraakweergave.',
      'Twilio alleen wanneer je echte telefonie activeert.'
    ]
  }
];

const PrivacyPage = () => {
  return (
    <div className="landing-container marketing-page">
      <div className="marketing-grid"></div>
      <PublicHeader active="privacy" />

      <section className="pricing-hero info-hero">
        <span className="section-eyebrow centered">Privacy</span>
        <h1>Heldere privacybasis voor een AI telefoonassistent</h1>
        <p>
          Dit overzicht helpt je om het product transparant te presenteren. Het vervangt geen juridisch advies, maar zet wel de juiste basis voor een professionele launch.
        </p>
      </section>

      <section className="legal-grid">
        {privacyCards.map((card) => {
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
          <span className="section-eyebrow">Belangrijke launch-opmerking</span>
          <h2>Bij live calls moet je extra duidelijk zijn over opname, transcriptie en bewaartermijnen</h2>
          <p className="panel-copy">
            Zodra je echte telefonie activeert, is het verstandig om in je openingsscript en privacyverklaring duidelijk te maken of gesprekken worden opgenomen of getranscribeerd, waarom dat gebeurt en hoe lang die data wordt bewaard.
          </p>
          <ul className="check-list compact">
            <li>Zet in je privacyverklaring de doelen, grondslag, ontvangers en bewaartermijn helder uiteen.</li>
            <li>Leg met leveranciers verwerkersafspraken en subprocessorinformatie vast.</li>
            <li>Maak per datastroom duidelijk of die nodig is voor service, training, support of facturatie.</li>
          </ul>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default PrivacyPage;
