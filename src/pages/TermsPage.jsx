import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import { policyConfig } from '../lib/policy';
import './Belliq.css';

const termsCards = [
  {
    title: 'Dienstscope',
    items: [
      'Belliq levert een AI-telefoonassistent, webtestomgeving, dashboard en adminflow voor provisioning.',
      'Productie-API loopt via Supabase Edge Function `call-api`; legacy Express is geen ondersteund publiek productiecontract meer.',
      'Webshopkoppelingen starten metadata-only: provider, store URL, contact e-mail en setupnotities.',
      'Secure orderstatus lookup blijft uitgeschakeld totdat encrypted secret management fase 2 is afgerond.'
    ]
  },
  {
    title: 'Activatie en facturatie',
    items: [
      'Je abonnement start wanneer live activatie en provisioning van je assistent zijn goedgekeurd of voltooid.',
      'Webtests en configuratieflows kunnen vooraf plaatsvinden zonder live telefonie.',
      'Facturen, abonnementstoestand en usage worden zichtbaar gemaakt in het dashboard.',
      'Fiscale billingdata wordt bewaard volgens de bewaartermijn in ons privacybeleid.'
    ]
  },
  {
    title: 'Jouw verantwoordelijkheden',
    items: [
      'Je houdt bedrijfsinformatie, scripts, doorschakelregels en teamtoegang actueel.',
      'Je zorgt dat jouw use case voldoet aan toepasselijke telecom-, consumenten- en privacyregels.',
      'Je communiceert waar nodig zelf aan bellers dat transcriptie, opname of AI-assistentie wordt gebruikt.',
      'Je levert geen verboden of onrechtmatige content aan voor gebruik in de assistent.'
    ]
  },
  {
    title: 'Niet toegestaan',
    items: [
      'Misleiding, verboden telemarketing of verwerking zonder geldige rechtsgrond.',
      'Gebruik van admin- of API-routes buiten de bedoelde autorisaties.',
      'Opslaan of doorsturen van plaintext secrets via formulieren of app-database.',
      'Gebruik dat leidt tot onrechtmatige of schadelijke geautomatiseerde besluitvorming.'
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
            Heldere afspraken voor
            <span className="text-primary"> activatie en gebruik</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-3xl mx-auto leading-relaxed">
            Deze voorwaarden vatten samen hoe de productieflow van Belliq werkt, welke verantwoordelijkheden bij jou liggen en welke beveiligingskeuzes onderdeel zijn van het platform.
          </p>
          <p className="text-sm text-slate-500 mt-4">Laatst bijgewerkt: {policyConfig.lastUpdated}</p>
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
            <h2 className="text-2xl sm:text-3xl font-bold font-headline mb-4">Formele contractset voor productie</h2>
            <p className="text-slate-300 leading-relaxed mb-6 max-w-3xl">
              Voor productie raden we naast deze samenvatting een volledige set aan: algemene voorwaarden, verwerkersovereenkomst, subprocessor-overzicht, incidentafspraken en eventueel een SLA. Privacyvragen en contractverzoeken lopen via {policyConfig.supportEmail} of {policyConfig.privacyEmail}.
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
