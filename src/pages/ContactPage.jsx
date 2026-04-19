import React from 'react';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import { policyConfig } from '../lib/policy';
import './Belliq.css';

const contactCards = [
  {
    title: 'Support',
    description: 'Voor productvragen, onboarding en operationele hulp.',
    value: policyConfig.supportEmail,
    cta: `mailto:${policyConfig.supportEmail}`,
    ctaLabel: 'Mail support'
  },
  {
    title: 'Privacy en DSAR',
    description: 'Voor inzage-, correctie-, verwijderings- of bezwaarverzoeken.',
    value: policyConfig.dsarEmail,
    cta: `mailto:${policyConfig.dsarEmail}`,
    ctaLabel: 'Mail privacy'
  },
  {
    title: 'Security incident',
    description: 'Voor vermoedens van misbruik, datalekken of ongeautoriseerde toegang.',
    value: policyConfig.securityEmail,
    cta: `mailto:${policyConfig.securityEmail}`,
    ctaLabel: 'Meld incident'
  }
];

const ContactPage = () => {
  return (
    <div className="belliq-page bg-surface selection:bg-primary-fixed-dim">
      <PublicHeader active="resources" />

      <main className="belliq-main pb-24">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 text-center mb-16 sm:mb-20">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface mb-6 leading-tight font-headline">
            Direct contact,
            <span className="text-primary italic"> zonder nep-formulier</span>
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-3xl mx-auto font-medium">
            Deze pagina verstuurt geen verborgen form submits. Voor support, privacy en security gebruik je de directe contactkanalen hieronder.
          </p>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 sm:mb-20">
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-lg p-6 sm:p-10 shadow-sm border border-outline-variant/10">
            <h2 className="text-2xl font-bold mb-6 tracking-tight font-headline">Contactkanalen</h2>
            <div className="space-y-5">
              {contactCards.map((card) => (
                <div key={card.title} className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">{card.title}</p>
                  <h3 className="text-xl font-bold text-on-surface mb-2">{card.value}</h3>
                  <p className="text-on-surface-variant mb-4">{card.description}</p>
                  <a
                    href={card.cta}
                    className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:brightness-95 transition"
                  >
                    {card.ctaLabel}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="bg-surface-container-low rounded-lg p-8 group overflow-hidden relative">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Correspondentieadres</p>
              <h3 className="text-2xl font-bold text-on-surface leading-tight font-headline mb-4">
                {policyConfig.legalEntity}
              </h3>
              <div className="text-on-surface-variant leading-relaxed space-y-1">
                {policyConfig.registeredAddress.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-white/70 border border-outline-variant/20 p-4 text-sm text-on-surface-variant">
                Bevestig vóór publieke launch nog de definitieve juridische entiteit en eventuele registratiedetails op deze pagina.
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-lg p-8 border border-outline-variant/10 flex flex-col gap-6">
              <div>
                <p className="text-xs font-medium text-on-surface-variant mb-2">Responsvenster</p>
                <p className="font-bold text-on-surface">Ma-Vr, 09:00 - 18:00</p>
              </div>
              <div>
                <p className="text-xs font-medium text-on-surface-variant mb-2">Belangrijk</p>
                <p className="text-on-surface-variant">
                  Gebruik voor privacyverzoeken altijd {policyConfig.dsarEmail} en voor securitymeldingen {policyConfig.securityEmail}, zodat het juiste proces direct start.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default ContactPage;
