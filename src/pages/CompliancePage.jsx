import React from 'react';
import { BadgeCheck, ClipboardList, FileCheck2, Shield, Siren, Sparkles } from 'lucide-react';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import './LandingPage.css';

const builtInCards = [
  {
    icon: Shield,
    title: 'Wat al in het product zit',
    items: [
      'Supabase Auth en Row Level Security per tenant.',
      'Publieke privacy-, compliance- en voorwaardenpagina’s.',
      'Server-side afhandeling via Supabase Edge Functions.',
      'Duidelijke scheiding tussen browser-test en live telefonie.'
    ]
  },
  {
    icon: ClipboardList,
    title: 'Wat jij voor livegang nog moet regelen',
    items: [
      'Je eigen privacyverklaring en verwerkingsregister afronden.',
      'Verwerkersovereenkomsten en subprocessor-overzicht vastleggen.',
      'Caller notice bepalen voor opname en transcriptie van gesprekken.',
      'Telemarketing alleen inzetten waar toestemming of klantrelatie dat toestaat.'
    ]
  },
  {
    icon: Siren,
    title: 'Wanneer extra opletten',
    items: [
      'Bij grootschalige monitoring of structurele gespreksopnames.',
      'Als je gevoelige persoonsgegevens verwerkt of analyseert.',
      'Als je AI gebruikt voor geautomatiseerde besluiten met grote gevolgen.',
      'Als je buiten de EER verwerkt zonder transfers goed te documenteren.'
    ]
  }
];

const sourceLinks = [
  {
    label: 'Autoriteit Persoonsgegevens: recht op informatie en eisen aan privacyverklaring',
    href: 'https://www.autoriteitpersoonsgegevens.nl/nl/zelf-doen/gebruik-uw-privacyrechten/recht-op-informatie'
  },
  {
    label: 'Autoriteit Persoonsgegevens: verantwoordingsplicht',
    href: 'https://autoriteitpersoonsgegevens.nl/themas/basis-avg/avg-algemeen/verantwoordingsplicht'
  },
  {
    label: 'Autoriteit Persoonsgegevens: DPIA',
    href: 'https://autoriteitpersoonsgegevens.nl/themas/basis-avg/praktisch-avg/data-protection-impact-assessment-dpia'
  },
  {
    label: 'Europese Commissie: wanneer een DPIA nodig is',
    href: 'https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/obligations/when-data-protection-impact-assessment-dpia-required_en'
  },
  {
    label: 'Europese Commissie: accountability onder de GDPR',
    href: 'https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/obligations/how-can-i-demonstrate-my-organisation-compliant-gdpr_en'
  },
  {
    label: 'Rijksoverheid: regels voor telefonische verkoop',
    href: 'https://www.rijksoverheid.nl/onderwerpen/bescherming-van-consumenten/regels-voor-telefonische-verkoop'
  },
  {
    label: 'ACM ConsuWijzer: regels voor telefoongesprek opnemen',
    href: 'https://consument.acm.nl/telefonische-verkoop/overeenkomst-geldig/regels-telefoongesprek-opnemen-en-opname-beluisteren'
  },
  {
    label: 'Autoriteit Persoonsgegevens: AI-verordening',
    href: 'https://autoriteitpersoonsgegevens.nl/themas/algoritmes-ai/ai-verordening'
  },
  {
    label: 'EDPB: transparency guidelines onder de GDPR',
    href: 'https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/transparency_en'
  }
];

const CompliancePage = () => {
  return (
    <div className="landing-container marketing-page">
      <div className="marketing-grid"></div>
      <PublicHeader active="privacy" />

      <section className="pricing-hero info-hero">
        <span className="section-eyebrow centered">Compliance</span>
        <h1>Een nuchtere AVG- en AI-basis, zonder te doen alsof alles automatisch geregeld is</h1>
        <p>
          We hebben de productkant al rustiger en veiliger ingericht. Voor een echte commerciële launch blijven privacybeleid, contracten en governance nog steeds jouw verantwoordelijkheid.
        </p>
      </section>

      <section className="legal-grid">
        {builtInCards.map((card) => {
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
          <span className="section-eyebrow">Mijn advies voor launch</span>
          <h2>Zie dit als een goede basis, niet als een juridisch eindstation</h2>
          <p className="panel-copy">
            Op basis van de openbare officiële bronnen hierboven hoort dit product in ieder geval privacytransparantie, verantwoordingsdocumentatie, verwerkersafspraken en een DPIA-check serieus mee te nemen. Zeker zodra je structureel calls verwerkt of opnames bewaart.
          </p>
          <ul className="check-list compact">
            <li>
              <BadgeCheck size={16} /> Laat een jurist of privacyprofessional je publieke teksten en DPA nog nalopen.
            </li>
            <li>
              <FileCheck2 size={16} /> Houd een actueel verwerkingsregister en subprocessor-overzicht bij.
            </li>
            <li>
              <Sparkles size={16} /> Maak duidelijk dat bellers met een AI-assistent spreken en wat er met hun gegevens gebeurt.
            </li>
          </ul>
        </div>
      </section>

      <section className="sources-panel glass-panel">
        <h2>Officiële bronnen die hierbij horen</h2>
        <ul>
          {sourceLinks.map((source) => (
            <li key={source.href}>
              <span>{source.label}</span>
              <a href={source.href} target="_blank" rel="noreferrer">
                Open bron
              </a>
            </li>
          ))}
        </ul>
      </section>

      <PublicFooter />
    </div>
  );
};

export default CompliancePage;
