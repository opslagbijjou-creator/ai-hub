import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import './Belliq.css';

const InfoPage = () => {
  const navigate = useNavigate();

  return (
    <div className="belliq-page bg-surface text-on-surface">
      <PublicHeader active="how" />

      <main className="belliq-main">
        <section className="max-w-7xl mx-auto px-6 mb-24">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
              <span className="bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 inline-block">
                Proces
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-tight mb-8 font-headline">
                Van data naar <span className="text-primary">intelligente</span> dialoog.
              </h1>
              <p className="text-lg text-on-surface-variant leading-relaxed mb-10 max-w-xl">
                Belliq transformeert jouw bedrijfsdocumentatie in een kalme, alwetende AI-assistent. Volg deze vier
                stappen om jouw klantinteractie te automatiseren.
              </p>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-primary text-white px-8 py-4 rounded-lg font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  Start nu
                </button>
                <button
                  onClick={() => navigate('/pricing')}
                  className="bg-surface-container-high text-on-surface px-8 py-4 rounded-lg font-bold hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Bekijk demo
                </button>
              </div>
            </div>

            <div className="md:w-1/2 relative">
              <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-secondary-container/30 rounded-full blur-3xl"></div>
              <div className="relative glass-card rounded-lg p-2 shadow-2xl border border-white/20">
                <img
                  className="rounded-lg w-full h-[400px] object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeRGZHXiKCRbf0XN6ulPC0xQ9DPp4DrYTopg0zelWAQD-YGQvitAcR9dCWA9hg0Tdaah9u642pAXzasJOPHdU4rbmbYvHYd2ND5T38_cCep_1Py402YOECxQyw3G3IB2seGEChoD9mFiMj1Vh9Q1EWGDedH7xi9HHahtYL-NrzUN42T-tN1oeJntyp39r9K2nJwm1mOfRqeYsbxqHue5Lfrs51uncc_merPdNeE4y6a54_JUzqpmcGYWLBRummF_kyvC1sgX2eqKs"
                  alt="AI workflow visual"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 bg-surface-container-lowest rounded-lg p-10 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <div className="w-14 h-14 bg-primary-fixed text-primary rounded-xl flex items-center justify-center mb-8">
                  <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 font-headline">1. Bedrijfscontext uploaden</h3>
                <p className="text-on-surface-variant text-lg leading-relaxed mb-8 max-w-md">
                  Sleep PDF&apos;s, handleidingen of URL&apos;s naar ons platform. Onze AI analyseert de data en creert een
                  semantisch kennisnetwerk specifiek voor jouw merk.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <div className="bg-surface-container-low px-4 py-2 rounded-full text-sm font-medium text-secondary">PDF</div>
                  <div className="bg-surface-container-low px-4 py-2 rounded-full text-sm font-medium text-secondary">
                    Knowledge Base
                  </div>
                  <div className="bg-surface-container-low px-4 py-2 rounded-full text-sm font-medium text-secondary">
                    Website URL
                  </div>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-1/2 translate-y-12 translate-x-12 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  dataset
                </span>
              </div>
            </div>

            <div className="md:col-span-5 bg-primary text-white rounded-lg p-10 shadow-xl shadow-primary/10 relative overflow-hidden">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-3xl">terminal</span>
              </div>
              <h3 className="text-3xl font-bold mb-4 font-headline">2. Gesprek testen</h3>
              <p className="text-primary-fixed text-lg leading-relaxed mb-8">
                Gebruik de ingebouwde sandbox om de antwoorden van de AI te valideren. Verfijn de tone-of-voice in
                real-time voordat je live gaat.
              </p>
              <div className="bg-white/10 backdrop-blur-md rounded-md p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-error"></div>
                  <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                  <div className="w-2 h-2 rounded-full bg-primary-fixed"></div>
                </div>
                <div className="text-xs font-mono opacity-80">Testing "Voice_Profile_01"... Success.</div>
              </div>
            </div>

            <div className="md:col-span-5 bg-surface-container-low rounded-lg p-10 relative overflow-hidden">
              <div className="w-14 h-14 bg-on-surface text-surface rounded-xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-3xl">bolt</span>
              </div>
              <h3 className="text-3xl font-bold mb-4 text-on-surface font-headline">3. Live activeren</h3>
              <p className="text-on-surface-variant text-lg leading-relaxed mb-8">
                Integreer met een simpele setupflow in je dashboard of laat ons team je koppeling afronden zonder
                technische stappen.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm font-semibold">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  Shopify, WooCommerce en PrestaShop
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  Prompt, voice en kanaalinstellingen in 1 flow
                </div>
              </div>
            </div>

            <div className="md:col-span-7 bg-surface-container-highest rounded-lg p-10 relative overflow-hidden group">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1">
                  <div className="w-14 h-14 bg-tertiary-fixed text-tertiary rounded-xl flex items-center justify-center mb-8">
                    <span className="material-symbols-outlined text-3xl">monitoring</span>
                  </div>
                  <h3 className="text-3xl font-bold mb-4 font-headline">4. Bijsturen via dashboard</h3>
                  <p className="text-on-surface-variant text-lg leading-relaxed">
                    Analyseer gesprekslogs en optimaliseer de AI op basis van werkelijke klantvragen. Geen blind
                    vliegen, maar data-gedreven service.
                  </p>
                </div>
                <div className="flex-1 w-full bg-surface-container-lowest rounded-lg p-4 shadow-lg border border-outline-variant/30 transform group-hover:scale-105 transition-transform">
                  <div className="h-2 w-24 bg-surface-container-high rounded mb-4"></div>
                  <div className="flex items-end gap-1 h-24 mb-4">
                    <div className="flex-1 bg-primary/40 rounded-t h-1/2"></div>
                    <div className="flex-1 bg-primary/60 rounded-t h-2/3"></div>
                    <div className="flex-1 bg-primary rounded-t h-full"></div>
                    <div className="flex-1 bg-primary/50 rounded-t h-3/4"></div>
                    <div className="flex-1 bg-primary/80 rounded-t h-4/5"></div>
                  </div>
                  <div className="text-[10px] uppercase font-bold text-outline">Engagement rate: 94.2%</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 font-headline">De Belliq Architectuur</h2>
              <p className="text-on-surface-variant text-lg">
                Een naadloze verbinding tussen jouw kennis en de eindgebruiker.
              </p>
            </div>
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="flex flex-col items-center gap-4 group">
                <div className="w-32 h-32 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-xl border-4 border-primary/5 group-hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-4xl text-primary">database</span>
                </div>
                <span className="font-bold text-sm">Input Bronnen</span>
              </div>

              <div className="hidden md:block flex-1 h-[2px] bg-gradient-to-r from-primary/20 via-primary to-primary/20 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase">
                  Processing
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 relative">
                <div className="absolute -inset-8 bg-primary/5 rounded-full animate-pulse"></div>
                <div className="w-40 h-40 rounded-full bg-primary flex items-center justify-center shadow-2xl relative z-10">
                  <span className="material-symbols-outlined text-6xl text-white">psychology</span>
                </div>
                <span className="font-black text-primary text-lg">Belliq Core</span>
              </div>

              <div className="hidden md:block flex-1 h-[2px] bg-gradient-to-r from-primary/20 via-primary to-primary/20 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase">
                  Delivery
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 group">
                <div className="w-32 h-32 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-xl border-4 border-primary/5 group-hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-4xl text-primary">chat_bubble</span>
                </div>
                <span className="font-bold text-sm">Gebruikers Ervaring</span>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-32 text-center">
          <div className="bg-on-primary-fixed-variant rounded-lg p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <span className="material-symbols-outlined text-[300px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                rocket_launch
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8 relative z-10 leading-tight font-headline">
              Klaar om je klantenservice
              <br />
              naar het volgende niveau te tillen?
            </h2>
            <div className="flex flex-col md:flex-row justify-center gap-6 relative z-10">
              <button
                onClick={() => navigate('/login')}
                className="bg-primary-fixed text-on-primary-fixed px-10 py-5 rounded-lg font-black text-lg hover:scale-105 transition-transform"
              >
                Start gratis trial
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="bg-transparent border-2 border-white/20 text-white px-10 py-5 rounded-lg font-black text-lg hover:bg-white/10 transition-colors"
              >
                Plan een demo
              </button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default InfoPage;
