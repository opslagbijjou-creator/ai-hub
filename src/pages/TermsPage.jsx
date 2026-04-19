import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import './Belliq.css';

const termsCards = [
  {
    title: 'Wat je krijgt',
    items: [
      'Onboarding wizard om je AI telefoonassistent eenvoudig in te stellen.',
      'Web-testomgeving om gesprekken te testen voordat je live gaat.',
      'Dashboard voor instellingen, usage en status van je assistent.',
      'Optionele integraties voor webshop- en servicecontext.'
    ]
  },
  {
    title: 'Wanneer facturatie start',
    items: [
      'Je abonnement start pas bij live activatie van je assistent.',
      'Zolang je alleen test in webmodus, blijft echte telefonie uit.',
      'Overgebruik van minuten of AI-taken wordt zichtbaar getoond.',
      'Wijzigingen in pakket of capaciteit zijn via dashboard of support mogelijk.'
    ]
  },
  {
    title: 'Wat jij beheert',
    items: [
      'Juistheid van bedrijfsinfo, openingstijden en doorverwijsregels.',
      'Toegang van teamleden tot je account en integraties.',
      'Inhoud van scripts, FAQ en eventuele geautomatiseerde antwoorden.',
      'Toepassing van wet- en regelgeving in jouw sector of land.'
    ]
  },
  {
    title: 'Wat niet is toegestaan',
    items: [
      'Misleiding of verboden telemarketing.',
      'Gebruik zonder geldige privacygrondslag of vereiste kennisgeving.',
      'Inzet voor onrechtmatige of schadelijke geautomatiseerde besluitvorming.',
      'Gebruik in strijd met toepasselijke telecom- of consumentenregels.'
    ]
  }
];

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="belliq-page bg-surface text-on-surface">
      <PublicHeader active="resources" />

      <main className="belliq-main pb-24">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16 text-center">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest mb-5">
            Voorwaarden
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-headline mb-5">
            Duidelijke afspraken,
            <span className="text-primary"> zonder kleine lettertjesgevoel</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-3xl mx-auto leading-relaxed">
            Deze pagina geeft de kern van onze voorwaarden in normale taal. Zo weet je precies waar je aan toe bent
            voordat je live gaat met je AI-assistent.
          </p>
          <p className="text-sm text-slate-500 mt-4">Laatst bijgewerkt: 19 april 2026</p>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-16 sm:mb-20">
          {termsCards.map((card) => (
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

        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl bg-slate-900 text-white p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-headline mb-4">Wil je dit als formeel contract?</h2>
            <p className="text-slate-300 leading-relaxed mb-6 max-w-3xl">
              Voor productie adviseren we altijd een volledige juridische set: algemene voorwaarden,
              verwerkersovereenkomst, subprocessor-overzicht en SLA-afspraken.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/contact')}
                className="bg-white text-slate-900 px-6 py-3 rounded-xl font-semibold hover:brightness-95 transition"
              >
                Contract hulp aanvragen
              </button>
              <button
                onClick={() => navigate('/privacy')}
                className="bg-slate-800 text-white border border-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-700 transition"
              >
                Bekijk privacy
              </button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default TermsPage;
