import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import './Belliq.css';

const privacyCards = [
  {
    title: 'Welke gegevens we verwerken',
    items: [
      'Accountgegevens zoals naam, e-mail en gebruikers-ID.',
      'Assistentinstellingen zoals bedrijfsinformatie, openingstijden, stem en script.',
      'Gespreksinformatie zoals testgesprekken, call metadata en usage-registratie.',
      'Optionele webshop-context als je Shopify, WooCommerce of PrestaShop koppelt.'
    ]
  },
  {
    title: 'Waarom we dit verwerken',
    items: [
      'Om jouw AI-assistent te kunnen configureren en laten werken zoals jij wilt.',
      'Om kwaliteit, stabiliteit en support van het platform te verbeteren.',
      'Om gebruik en facturatie correct te tonen in dashboard en abonnement.',
      'Om beveiliging en fraudepreventie technisch te kunnen uitvoeren.'
    ]
  },
  {
    title: 'Hoe we beveiligen',
    items: [
      'Tenant-isolatie met Supabase Auth en Row Level Security.',
      'Server-side verwerking voor gevoelige sleutels en integratietokens.',
      'Gescheiden toegang per gebruiker, workspace en assistent.',
      'Continu verbeteren van logging, bewaartermijnen en toegangscontrole.'
    ]
  },
  {
    title: 'Jouw rechten',
    items: [
      'Inzage, correctie en verwijdering van persoonsgegevens waar van toepassing.',
      'Export en opschoning van assistentdata op accountniveau.',
      'Afschakelen van integraties en beperken van datagebruik in instellingen.',
      'Contact opnemen bij vragen over privacy of gegevensverwerking.'
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
            Privacy duidelijk en
            <span className="text-primary"> begrijpelijk</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-3xl mx-auto leading-relaxed">
            We houden je privacypagina kort, helder en praktisch. Zo weet elke klant meteen welke gegevens nodig zijn,
            waarom dat zo is en welke controle je zelf houdt.
          </p>
          <p className="text-sm text-slate-500 mt-4">Laatst bijgewerkt: 19 april 2026</p>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-16 sm:mb-20">
          {privacyCards.map((card) => (
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
          <div className="rounded-2xl bg-indigo-600 text-white p-8 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-headline mb-4">Belangrijk voor live belverkeer</h2>
            <p className="text-indigo-100 leading-relaxed mb-6 max-w-3xl">
              Als je live telefonie gebruikt, maak dan expliciet in je privacytekst duidelijk of gesprekken worden
              opgenomen of getranscribeerd, wat het doel is en hoe lang gegevens bewaard blijven.
            </p>
            <div className="flex flex-wrap gap-3">
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
                Neem contact op
              </button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default PrivacyPage;
