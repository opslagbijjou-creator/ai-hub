import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import './Belliq.css';

const complianceCards = [
  {
    title: 'Wat al ingebouwd is',
    items: [
      'Toegang per gebruiker en tenant-scheiding via Supabase RLS.',
      'Server-side verwerking voor gevoelige sleutels en integraties.',
      'Scheiding tussen web-test en live telefonie.',
      'Heldere statusflow van draft naar live activatie.'
    ]
  },
  {
    title: 'Wat je voor livegang moet afvinken',
    items: [
      'Privacytekst en informatieplicht volledig updaten.',
      'Verwerkersovereenkomsten met leveranciers vastleggen.',
      'Beleid voor opnames, transcriptie en bewaartermijnen bepalen.',
      'Interne rollen en toegangsrechten controleren.'
    ]
  },
  {
    title: 'Wanneer extra aandacht nodig is',
    items: [
      'Als je structureel gesprekken opneemt of lang bewaart.',
      'Bij verwerking van gevoelige persoonsgegevens.',
      'Als AI invloed heeft op belangrijke klantbeslissingen.',
      'Bij internationale datastromen buiten de EER.'
    ]
  },
  {
    title: 'Praktische governance',
    items: [
      'Gebruik auditlogs voor wijzigingen in assistent en integraties.',
      'Plan periodieke controles op scripts en antwoordkwaliteit.',
      'Bouw een incidentflow voor datalekken en storingen.',
      'Documenteer wie waarvoor verantwoordelijk is.'
    ]
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
            Veilig live gaan,
            <span className="text-primary"> met heldere checks</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-3xl mx-auto leading-relaxed">
            Hieronder zie je in 1 oogopslag wat al goed staat in het platform en wat je nog moet afronden voordat je
            productie draait met echte telefoongesprekken.
          </p>
          <p className="text-sm text-slate-500 mt-4">Laatst bijgewerkt: 19 april 2026</p>
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

        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 sm:mb-20">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-bold font-headline mb-4">Officiële bronnen</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              Gebruik deze bronnen bij je interne controle en juridische review.
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
            <h2 className="text-2xl sm:text-3xl font-bold font-headline mb-4">Eindcheck voor launch</h2>
            <p className="text-indigo-100 leading-relaxed mb-6 max-w-3xl">
              Zie deze pagina als operationele checklist. Voor finale compliance adviseren we altijd een korte review
              door een privacyprofessional of jurist.
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
