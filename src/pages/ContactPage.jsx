import React, { useState } from 'react';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import './Belliq.css';

const CONTACT_EMAIL = 'hallo@belliq.ai';

const initialForm = {
  name: '',
  email: '',
  subject: 'Algemene vraag',
  message: ''
};

const ContactPage = () => {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');

  const onChange = (key) => (event) => {
    setForm((prev) => ({
      ...prev,
      [key]: event.target.value
    }));
  };

  const onSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus('Vul naam, email en bericht in.');
      return;
    }

    const subject = `[Website] ${form.subject}`;
    const body = [
      `Naam: ${form.name}`,
      `Email: ${form.email}`,
      `Onderwerp: ${form.subject}`,
      '',
      'Bericht:',
      form.message
    ].join('\n');

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus('Je mail-app is geopend.');
  };

  const handleNewsletter = () => {
    if (!newsletterEmail.trim()) {
      setNewsletterStatus('Vul eerst een e-mailadres in.');
      return;
    }

    const subject = 'Nieuwsbrief aanmelding';
    const body = `Aanmelding nieuwsbrief vanaf website: ${newsletterEmail}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setNewsletterStatus('Je mail-app is geopend voor inschrijving.');
  };

  return (
    <div className="belliq-page bg-surface selection:bg-primary-fixed-dim">
      <PublicHeader active="resources" headerVariant="resources" />

      <main className="belliq-main pb-24">
        <section className="max-w-7xl mx-auto px-6 text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface mb-6 leading-tight">
            Laten we <span className="text-primary italic">praten</span>.
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Vragen over onze AI-oplossingen? We staan klaar om je te helpen met een rustige, doordachte aanpak.
          </p>
        </section>

        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-lg p-10 shadow-sm border border-outline-variant/10">
            <h2 className="text-2xl font-bold mb-8 tracking-tight">Stuur ons een bericht</h2>
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1">Naam</label>
                  <input
                    className="w-full bg-surface-container-low border-none rounded-lg px-6 py-4 focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-surface-dim"
                    placeholder="Jouw naam"
                    type="text"
                    value={form.name}
                    onChange={onChange('name')}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1">Email</label>
                  <input
                    className="w-full bg-surface-container-low border-none rounded-lg px-6 py-4 focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-surface-dim"
                    placeholder="naam@bedrijf.nl"
                    type="email"
                    value={form.email}
                    onChange={onChange('email')}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1">Onderwerp</label>
                <select
                  className="w-full bg-surface-container-low border-none rounded-lg px-6 py-4 focus:ring-2 focus:ring-primary/40 transition-all text-on-surface-variant"
                  value={form.subject}
                  onChange={onChange('subject')}
                >
                  <option>Algemene vraag</option>
                  <option>Technische support</option>
                  <option>Sales &amp; Partnerships</option>
                  <option>Anders</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1">Bericht</label>
                <textarea
                  className="w-full bg-surface-container-low border-none rounded-lg px-6 py-4 focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-surface-dim"
                  placeholder="Hoe kunnen we je helpen?"
                  rows="5"
                  value={form.message}
                  onChange={onChange('message')}
                ></textarea>
              </div>

              <button className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-5 rounded-lg font-bold text-lg hover:scale-[1.01] transition-all active:scale-[0.98] shadow-lg shadow-primary/20">
                Verstuur Bericht
              </button>

              {status ? <p className="text-sm text-on-surface-variant">{status}</p> : null}
            </form>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="bg-surface-container-low rounded-lg p-8 group overflow-hidden relative">
              <div className="flex items-start justify-between mb-12">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Hoofdkantoor</p>
                  <h3 className="text-2xl font-bold text-on-surface leading-tight">
                    Herengracht 450
                    <br />
                    1017 CA Amsterdam
                  </h3>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded-full shadow-sm">
                  <span className="material-symbols-outlined text-primary">location_on</span>
                </div>
              </div>

              <div className="relative h-48 rounded-lg overflow-hidden bg-surface-dim mb-6">
                <img
                  className="w-full h-full object-cover grayscale opacity-50 contrast-125"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5PeenrCKYk0dAIy1aw3JuXIpACIjoSum5GySk2BJYE_uoDsdAdu4nnAN_xq-u7m6NIbPx3wyeYD4wTvlBQH2ZrdgIYb8uidAe2REkJ_ddRo8ticzdtKfgvm3gO9Ma5kJPtzvqbis5ox6ga6VIs8OPtvr8V1VEujPYi0H440Gcrv7I9Kzedwn6ucVEcHhmaCZ3atO5EkmgHP3QmHSLOoJreuQtQh28PG2kSe1vWrtVIbXDLaCACWuxIfmvTN1gBN3B2TD9bmKKRp8"
                  alt="Amsterdam kaart"
                />
                <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_rgba(53,37,205,0.8)]"></div>
                  </div>
                </div>
              </div>

              <a
                href="https://maps.google.com/?q=Herengracht+450,+1017+CA+Amsterdam"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm font-bold text-primary group-hover:gap-2 transition-all"
              >
                Open in Google Maps <span className="material-symbols-outlined text-sm ml-1">arrow_outward</span>
              </a>
            </div>

            <div className="bg-surface-container-lowest rounded-lg p-8 border border-outline-variant/10 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                    <span className="material-symbols-outlined text-xl">mail</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-on-surface-variant">Email ons</p>
                    <p className="font-bold text-on-surface">{CONTACT_EMAIL}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                    <span className="material-symbols-outlined text-xl">chat_bubble</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-on-surface-variant">Live Support</p>
                    <p className="font-bold text-on-surface">Ma-Vr, 09:00 - 18:00</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-6 border border-outline-variant/10 hover:shadow-md transition-shadow">
                <span className="material-symbols-outlined text-primary mb-3">help</span>
                <p className="font-bold text-sm">Helpcentrum</p>
                <p className="text-xs text-on-surface-variant mt-1">Vind antwoorden in onze gidsen.</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-outline-variant/10 hover:shadow-md transition-shadow">
                <span className="material-symbols-outlined text-primary mb-3">integration_instructions</span>
                <p className="font-bold text-sm">Docs</p>
                <p className="text-xs text-on-surface-variant mt-1">API &amp; integratie documentatie.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 mt-32">
          <div className="bg-on-primary-fixed rounded-lg p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/10 blur-[80px] rounded-full -ml-32 -mb-32"></div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 relative z-10">Blijf op de hoogte</h2>
            <p className="text-on-primary-container text-lg mb-10 max-w-xl mx-auto relative z-10">
              Ontvang maandelijks onze visie op de toekomst van AI, zonder de ruis.
            </p>
            <div className="max-w-md mx-auto flex flex-col md:flex-row gap-4 relative z-10">
              <input
                className="flex-grow bg-white/10 border-white/20 text-white rounded-lg px-6 py-4 focus:ring-2 focus:ring-primary placeholder:text-white/40 backdrop-blur-sm"
                placeholder="jouw@email.nl"
                type="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
              />
              <button
                onClick={handleNewsletter}
                className="bg-white text-on-primary-fixed px-8 py-4 rounded-lg font-bold hover:scale-105 transition-transform active:scale-95"
              >
                Inschrijven
              </button>
            </div>
            {newsletterStatus ? <p className="text-white/90 text-sm mt-4 relative z-10">{newsletterStatus}</p> : null}
          </div>
        </section>
      </main>

      <PublicFooter variant="resources" />
    </div>
  );
};

export default ContactPage;
