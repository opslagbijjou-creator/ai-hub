import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import './Belliq.css';

const PricingPage = () => {
  const navigate = useNavigate();

  const selectPlan = (planKey) => {
    localStorage.setItem('selected_plan_key', planKey);
    navigate('/login');
  };

  return (
    <div className="belliq-page bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <PublicHeader active="pricing" headerVariant="pricing" />

      <main className="belliq-main pb-24">
        <section className="max-w-7xl mx-auto px-6 mb-20 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest mb-6">
            Prijzen die meeschalen
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface mb-6">
            Kies je niveau van <span className="text-primary">Intelligentie.</span>
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto font-medium leading-relaxed">
            Van ambitieuze startups tot wereldwijde ondernemingen. Vind het plan dat de groei van jouw organisatie
            versnelt met onze etherische AI-oplossingen.
          </p>
        </section>

        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          <div className="group p-8 rounded-lg bg-surface-container-lowest border border-outline-variant/15 flex flex-col hover:scale-[1.02] transition-all duration-300">
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">Startup</h3>
              <p className="text-on-surface-variant text-sm">
                Perfect voor individuen en kleine projecten die de kracht van Belliq willen verkennen.
              </p>
            </div>
            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">€0</span>
                <span className="text-on-surface-variant font-medium">/mo</span>
              </div>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                1.000 AI interacties per maand
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                Basis data visualisatie
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                Community support
              </li>
            </ul>
            <button
              onClick={() => selectPlan('plan_150')}
              className="w-full py-4 rounded-lg bg-surface-container-high text-on-surface font-bold text-sm transition-all hover:bg-surface-container-highest"
            >
              Start Gratis
            </button>
          </div>

          <div className="group p-8 rounded-lg bg-white relative flex flex-col scale-105 shadow-2xl shadow-indigo-500/10 border-2 border-primary/20 hover:scale-[1.07] transition-all duration-300 z-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-4 py-1 rounded-full text-xs font-bold tracking-wider">
              AANBEVOLEN
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">Professional</h3>
              <p className="text-on-surface-variant text-sm">
                Geavanceerde tools voor professionals en groeiende teams die serieuze impact willen maken.
              </p>
            </div>
            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">€49</span>
                <span className="text-on-surface-variant font-medium">/mo</span>
              </div>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                Onbeperkte AI interacties
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                Predictive Analytics dashboard
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                Priority E-mail support
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                Custom API integraties
              </li>
            </ul>
            <button
              onClick={() => selectPlan('plan_275')}
              className="w-full py-4 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all hover:brightness-110"
            >
              Kies Professional
            </button>
          </div>

          <div className="group p-8 rounded-lg bg-surface-container-lowest border border-outline-variant/15 flex flex-col hover:scale-[1.02] transition-all duration-300">
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">Enterprise</h3>
              <p className="text-on-surface-variant text-sm">
                Op maat gemaakte oplossingen voor organisaties met complexe behoeften en hoge volumes.
              </p>
            </div>
            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">Maatwerk</span>
              </div>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                Dedicated Account Manager
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                On-premise deployment opties
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                SLA garanties (99.9%)
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                Geavanceerde Security Suite
              </li>
            </ul>
            <button
              onClick={() => navigate('/contact')}
              className="w-full py-4 rounded-lg bg-inverse-surface text-inverse-on-surface font-bold text-sm transition-all hover:opacity-90"
            >
              Neem Contact Op
            </button>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Vergelijk Functies</h2>
            <p className="text-on-surface-variant">Een diepere duik in wat elk plan te bieden heeft.</p>
          </div>
          <div className="bg-surface-container-low rounded-lg p-1 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-lowest">
                    <th className="p-6 text-sm font-bold border-b border-outline-variant/10">Functie</th>
                    <th className="p-6 text-sm font-bold border-b border-outline-variant/10">Startup</th>
                    <th className="p-6 text-sm font-bold border-b border-outline-variant/10">Professional</th>
                    <th className="p-6 text-sm font-bold border-b border-outline-variant/10">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  <tr className="hover:bg-surface-container-highest transition-colors">
                    <td className="p-6 border-b border-outline-variant/10">AI Modellen</td>
                    <td className="p-6 border-b border-outline-variant/10 text-on-surface-variant">Lichtgewicht</td>
                    <td className="p-6 border-b border-outline-variant/10">Full Suite</td>
                    <td className="p-6 border-b border-outline-variant/10">Custom Trained</td>
                  </tr>
                  <tr className="hover:bg-surface-container-highest transition-colors">
                    <td className="p-6 border-b border-outline-variant/10">API Toegang</td>
                    <td className="p-6 border-b border-outline-variant/10">
                      <span className="material-symbols-outlined text-error/40">close</span>
                    </td>
                    <td className="p-6 border-b border-outline-variant/10 text-primary">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check
                      </span>
                    </td>
                    <td className="p-6 border-b border-outline-variant/10 text-primary">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-highest transition-colors">
                    <td className="p-6 border-b border-outline-variant/10">Team Collaboratie</td>
                    <td className="p-6 border-b border-outline-variant/10 text-on-surface-variant">1 User</td>
                    <td className="p-6 border-b border-outline-variant/10">Tot 10 Users</td>
                    <td className="p-6 border-b border-outline-variant/10">Onbeperkt</td>
                  </tr>
                  <tr className="hover:bg-surface-container-highest transition-colors">
                    <td className="p-6 border-b border-outline-variant/10">Data Retentie</td>
                    <td className="p-6 border-b border-outline-variant/10 text-on-surface-variant">30 Dagen</td>
                    <td className="p-6 border-b border-outline-variant/10">1 Jaar</td>
                    <td className="p-6 border-b border-outline-variant/10">Onbeperkt</td>
                  </tr>
                  <tr className="hover:bg-surface-container-highest transition-colors">
                    <td className="p-6 border-b border-outline-variant/10">Support Respons</td>
                    <td className="p-6 border-b border-outline-variant/10 text-on-surface-variant">48u</td>
                    <td className="p-6 border-b border-outline-variant/10">12u</td>
                    <td className="p-6 border-b border-outline-variant/10">Instant</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Veelgestelde vragen</h2>
            <p className="text-on-surface-variant">Alles wat je moet weten over onze diensten en betalingen.</p>
          </div>
          <div className="space-y-4">
            <div className="p-6 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer group">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-on-surface">Kan ik op elk moment annuleren?</h4>
                <span className="material-symbols-outlined text-primary group-hover:rotate-180 transition-transform">expand_more</span>
              </div>
              <div className="mt-4 text-sm text-on-surface-variant font-medium leading-relaxed">
                Ja, je kunt je abonnement op elk moment opzeggen via je dashboard. Je behoudt toegang tot de betaalde
                functies tot het einde van je huidige factureringscyclus.
              </div>
            </div>

            <div className="p-6 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer group">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-on-surface">Bieden jullie korting voor jaarlijkse betaling?</h4>
                <span className="material-symbols-outlined text-primary group-hover:rotate-180 transition-transform">expand_more</span>
              </div>
              <div className="mt-4 text-sm text-on-surface-variant font-medium leading-relaxed">
                Absoluut. Als je kiest voor een jaarlijkse betaling, ontvang je twee maanden gratis. Dat is een
                besparing van ongeveer 17% op je jaarlijkse kosten.
              </div>
            </div>

            <div className="p-6 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer group">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-on-surface">Zijn mijn data en privacy veilig?</h4>
                <span className="material-symbols-outlined text-primary group-hover:rotate-180 transition-transform">expand_more</span>
              </div>
              <div className="mt-4 text-sm text-on-surface-variant font-medium leading-relaxed">
                Privacy staat bij ons centraal. We zijn volledig GDPR-compliant en gebruiken end-to-end encryptie voor
                alle data-opslag en transport. Je data wordt nooit gebruikt om onze publieke modellen te trainen.
              </div>
            </div>

            <div className="p-6 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer group">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-on-surface">Wat gebeurt er als ik mijn limiet overschrijd?</h4>
                <span className="material-symbols-outlined text-primary group-hover:rotate-180 transition-transform">expand_more</span>
              </div>
              <div className="mt-4 text-sm text-on-surface-variant font-medium leading-relaxed">
                We sturen je een melding wanneer je 80% en 100% van je maandelijkse limiet hebt bereikt. Op het Startup
                plan wordt de service gepauzeerd; op het Professional plan kun je kiezen voor flexibele top-ups.
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 mt-32">
          <div className="relative overflow-hidden rounded-xl bg-primary-fixed p-12 md:p-20 flex flex-col items-center text-center">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-[120px]"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-container rounded-full blur-[120px]"></div>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-on-primary-fixed mb-6 relative z-10">
              Klaar om de toekomst te versnellen?
            </h2>
            <p className="text-on-primary-fixed-variant text-lg mb-10 max-w-xl relative z-10">
              Word lid van duizenden innovatieve bedrijven die Belliq gebruiken om hun workflow te transformeren.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
              <button
                onClick={() => navigate('/login')}
                className="bg-primary text-on-primary px-10 py-4 rounded-lg font-bold text-lg hover:scale-[1.05] transition-transform duration-300"
              >
                Nu aan de slag
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="bg-surface-container-lowest text-on-surface px-10 py-4 rounded-lg font-bold text-lg hover:bg-surface-container-low transition-colors"
              >
                Plan een demo
              </button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter variant="pricing" />
    </div>
  );
};

export default PricingPage;
