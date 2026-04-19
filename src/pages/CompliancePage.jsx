import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import { policyConfig } from '../lib/policy';
import './Belliq.css';

const complianceCards = [
  {
    title: 'Technische safeguards',
    items: [
      'Supabase Auth en Row Level Security voor tenant-isolatie op gebruikersdata.',
      'Server-side admincontrole via `admin_users` in plaats van client-side UID-trust.',
      'Twilio-webhooks alleen na `X-Twilio-Signature` validatie voordat data wordt vertrouwd.',
      'Beperkte CORS, security headers en Supabase-only productie-API.'
    ]
  },
  {
    title: 'Data minimalisatie',
    items: [
      'Geen plaintext integratie-secrets meer in `commerce_integrations`.',
      'Geen self-service credential flow in de frontend of adminconsole.',
      'Geen persistente opslag van TTS `audio_data_url` blobs in webtestdata.',
      'Live orderstatus lookup tijdelijk uitgeschakeld totdat veilig secretbeheer beschikbaar is.'
    ]
  },
  {
    title: 'Operations',
    items: [
      'Runbooks voor secret-rotatie, admin onboarding/offboarding en webhook key-rotatie.',
      'Retention schema voor transcripten, metadata, auditlogs en billingdata.',
      'Incident-escalatie voor datalekken en beveiligingsproblemen.',
      'Netlify deploy headers voor CSP, HSTS en browser hardening.'
    ]
  },
  {
    title: 'Nog af te vinken',
    items: policyConfig.launchNotice
  }
];

const officialSources = [
  {
    label: 'Autoriteit Persoonsgegevens: recht op informatie',
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
    label: 'Rijksoverheid: regels voor telefonische verkoop',
    href: 'https://www.rijksoverheid.nl/onderwerpen/bescherming-van-consumenten/regels-voor-telefonische-verkoop'
  }
];

const CompliancePage = () => {
  const navigate = useNavigate();

  return (
    <div className="belliq-page bg-surface text-on-surface">
      <PublicHeader active="resources" />

      <main className="belliq-main pb-24">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16 text-center">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest mb-5">
            Beveiliging en compliance
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-headline mb-5">
            Productie hardening,
            <span className="text-primary"> governance en launch checks</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-3xl mx-auto leading-relaxed">
            Hieronder staat welke technische en operationele maatregelen nu in het platform zitten, welke bewaartermijnen gelden en welke aandachtspunten nog bevestigd moeten worden voor publieke productie.
          </p>
          <p className="text-sm text-slate-500 mt-4">Laatst bijgewerkt: {policyConfig.lastUpdated}</p>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-16 sm:mb-20">
          {complianceCards.map((card) => (
            <article key={card.title} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-bold font-headline mb-4">{card.title}</h2>
              <ul className="space-y-3">
                {card.items.map((item) => (
                  <li key={item} className="text-slate-600 leading-relaxed flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16 sm:mb-20">
          <article className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-bold font-headline mb-4">Bewaartermijnen</h2>
            <div className="space-y-4">
              {policyConfig.retentionSchedule.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <span className="text-slate-700">{item.label}</span>
                  <strong className="text-slate-900">{item.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-bold font-headline mb-4">Incidentproces</h2>
            <ul className="space-y-3 text-slate-600 leading-relaxed">
              <li>• Stop eerst de bron: key intrekken, admin blokkeren of deploy fixen.</li>
              <li>• Verzamel minimale forensische data: timestamps, user IDs, call SIDs en relevante logs.</li>
              <li>• Meld privacy-incidenten intern via {policyConfig.privacyEmail} en security-issues via {policyConfig.securityEmail}.</li>
              <li>• Beoordeel meldplicht aan klanten en toezichthouders op basis van AVG-impact.</li>
            </ul>
            <p className="text-slate-500 mt-4 text-sm">
              Het operationele runbook staat in `docs/security-operations.md`.
            </p>
          </article>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 sm:mb-20">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-bold font-headline mb-4">Officiële bronnen</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              Gebruik deze bronnen voor juridische review, DPIA-checks en interne governance.
            </p>
            <ul className="space-y-3">
              {officialSources.map((source) => (
                <li key={source.href} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                  <span className="text-slate-700">{source.label}</span>
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition"
                  >
                    Open bron
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl bg-indigo-600 text-white p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-headline mb-4">Launch check</h2>
            <p className="text-indigo-100 leading-relaxed mb-6 max-w-3xl">
              Zie deze pagina als minimumset voor productie. Voor definitieve livegang hoort daar nog een laatste check op juridische entiteit, contracten en sectorspecifieke verplichtingen bij.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/terms')}
                className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-semibold hover:brightness-95 transition"
              >
                Bekijk voorwaarden
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-400 transition"
              >
                Compliance hulp
              </button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default CompliancePage;
