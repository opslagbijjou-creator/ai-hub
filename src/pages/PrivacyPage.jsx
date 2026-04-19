import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import { policyConfig } from '../lib/policy';
import './Belliq.css';

const privacySections = [
  {
    title: 'Verwerkingsverantwoordelijke',
    items: [
      `${policyConfig.legalEntity}.`,
      `Adres: ${policyConfig.registeredAddress.join(', ')}.`,
      `Privacy en AVG-verzoeken: ${policyConfig.privacyEmail}.`,
      `Algemene support: ${policyConfig.supportEmail}.`
    ]
  },
  {
    title: 'Welke gegevens we verwerken',
    items: [
      'Accountgegevens zoals naam, e-mailadres, gebruikers-ID en sessie-informatie.',
      'Assistentconfiguratie zoals bedrijfsinformatie, scripts, FAQ, gekozen stem en nummer.',
      'Webtestdata zoals input, assistentantwoorden, transcriptfragmenten en latency.',
      'Live call data zoals call metadata, call SID, transcripten en usage-registratie.',
      'Koppelaanvragen voor shops: provider, store URL, contact e-mail en setupnotities.'
    ]
  },
  {
    title: 'Doelen en grondslagen',
    items: [
      'Uitvoering van de dienst: om je AI-assistent te configureren, leveren en ondersteunen.',
      'Gerechtvaardigd belang: voor beveiliging, misbruikpreventie, logging en kwaliteitscontrole.',
      'Wettelijke verplichting: voor fiscale administratie en facturatiebewaring.',
      'Toestemming of eigen informatieplicht aan bellers: wanneer jouw proces call recording of transcriptie extra toelichting vereist.'
    ]
  },
  {
    title: 'Rechten van betrokkenen',
    items: [
      `Je kunt inzage, correctie, verwijdering, dataportabiliteit of beperking aanvragen via ${policyConfig.dsarEmail}.`,
      'We kunnen extra verificatie vragen om misbruik van privacyverzoeken te voorkomen.',
      'Als een verzoek over live beldata gaat, verwachten we dat jij ook controleert of jouw eigen informatieplicht richting bellers klopt.',
      'Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.'
    ]
  }
];

const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="belliq-page bg-surface text-on-surface">
      <PublicHeader active="resources" />

      <main className="belliq-main pb-24">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16 text-center">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest mb-5">
            Privacy
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-headline mb-5">
            Privacy, bewaartermijnen
            <span className="text-primary"> en call-data</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-3xl mx-auto leading-relaxed">
            Deze pagina beschrijft welke persoonsgegevens Belliq verwerkt, waarom we dat doen, hoe lang we gegevens bewaren en welke leveranciers daarbij betrokken zijn.
          </p>
          <p className="text-sm text-slate-500 mt-4">Laatst bijgewerkt: {policyConfig.lastUpdated}</p>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-16 sm:mb-20">
          {privacySections.map((section) => (
            <article key={section.title} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-bold font-headline mb-4">{section.title}</h2>
              <ul className="space-y-3">
                {section.items.map((item) => (
                  <li key={item} className="text-slate-600 leading-relaxed flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16 sm:mb-20">
          <article className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm lg:col-span-2">
            <h2 className="text-2xl font-bold font-headline mb-4">Bewaartermijnen</h2>
            <div className="space-y-4">
              {policyConfig.retentionSchedule.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/80">
                  <span className="text-slate-700">{item.label}</span>
                  <strong className="text-slate-900">{item.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-bold font-headline mb-4">Call en transcriptie</h2>
            <p className="text-slate-600 leading-relaxed mb-4">{policyConfig.callDisclosure}</p>
            <p className="text-slate-600 leading-relaxed">
              Webtest-audio wordt alleen tijdelijk aan de client geleverd en niet persistent opgeslagen als blob in de app-database.
            </p>
          </article>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16 sm:mb-20">
          <article className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-2xl font-bold font-headline mb-4">Subprocessors</h2>
            <div className="space-y-4">
              {policyConfig.subprocessors.map((vendor) => (
                <div key={vendor.name} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <strong className="block text-slate-900">{vendor.name}</strong>
                  <p className="text-slate-600 mt-2">{vendor.purpose}</p>
                  <p className="text-slate-500 text-sm mt-1">{vendor.location}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl bg-indigo-600 text-white p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-headline mb-4">Doorgifte buiten de EER</h2>
            <p className="text-indigo-100 leading-relaxed mb-6">{policyConfig.transferMechanism}</p>
            <div className="rounded-2xl bg-white/10 p-5">
              <h3 className="font-semibold mb-3">Nog te bevestigen voor launch</h3>
              <ul className="space-y-2 text-indigo-100">
                {policyConfig.launchNotice.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => navigate('/compliance')}
                className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-semibold hover:brightness-95 transition"
              >
                Bekijk compliance
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-400 transition"
              >
                Contact over privacy
              </button>
            </div>
          </article>
        </section>
      </main>

      <PublicFooter variant="resources" />
    </div>
  );
};

export default PrivacyPage;
