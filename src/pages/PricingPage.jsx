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
      <PublicHeader active="pricing" />

      <main className="belliq-main pb-24">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-20 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest mb-6">
            Prijzen die meeschalen
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface mb-6 font-headline">
            Kies je niveau van <span className="text-primary">Intelligentie.</span>
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto font-medium leading-relaxed">
            Van ambitieuze startups tot wereldwijde ondernemingen. Vind het plan dat de groei van jouw organisatie
            versnelt met onze AI-oplossingen.
          </p>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          <div className="group p-8 rounded-lg bg-surface-container-lowest border border-outline-variant/15 flex flex-col hover:scale-[1.02] transition-all duration-300">
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2 font-headline">Starter</h3>
              <p className="text-on-surface-variant text-sm">
                Perfect voor startende teams die een AI telefoon-assistent willen testen en opbouwen.
              </p>
            </div>
            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">€299</span>
                <span className="text-on-surface-variant font-medium">/mo</span>
              </div>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                180 belminuten per maand
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                450 AI-taken inbegrepen
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                Browser testomgeving + onboarding wizard
              </li>
            </ul>
            <button
              onClick={() => selectPlan('plan_150')}
              className="w-full py-4 rounded-lg bg-surface-container-high text-on-surface font-bold text-sm transition-all hover:bg-surface-container-highest"
            >
              Selecteer Starter
            </button>
          </div>

          <div className="group p-8 rounded-lg bg-white relative flex flex-col scale-105 shadow-2xl shadow-indigo-500/10 border-2 border-primary/20 hover:scale-[1.07] transition-all duration-300 z-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-4 py-1 rounded-full text-xs font-bold tracking-wider">
              AANBEVOLEN
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2 font-headline">Growth</h3>
              <p className="text-on-surface-variant text-sm">
                Voor groeiende teams met meer volume en behoefte aan extra capaciteit.
              </p>
            </div>
            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">€499</span>
                <span className="text-on-surface-variant font-medium">/mo</span>
              </div>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                420 belminuten inbegrepen
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                1.100 AI-taken inbegrepen
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                Integraties + prioriteit support
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                Klaar voor live activatie na betaling
              </li>
            </ul>
            <button
              onClick={() => selectPlan('plan_275')}
              className="w-full py-4 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all hover:brightness-110"
            >
              Kies Growth
            </button>
          </div>

          <div className="group p-8 rounded-lg bg-surface-container-lowest border border-outline-variant/15 flex flex-col hover:scale-[1.02] transition-all duration-300">
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2 font-headline">Enterprise</h3>
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
                Dedicated account manager
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                SLA afspraken en hogere beschikbaarheid
              </li>
              <li className="flex items-center gap-3 text-sm text-on-surface">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                Complexe koppelingen en workflows
              </li>
            </ul>
            <button
              onClick={() => navigate('/contact')}
              className="w-full py-4 rounded-lg bg-inverse-surface text-inverse-on-surface font-bold text-sm transition-all hover:opacity-90"
            >
              Neem contact op
            </button>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4 font-headline">Vergelijk functies</h2>
            <p className="text-on-surface-variant">Een diepere duik in wat elk plan te bieden heeft.</p>
          </div>
          <div className="bg-surface-container-low rounded-lg p-1 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-lowest">
                    <th className="p-6 text-sm font-bold border-b border-outline-variant/10">Functie</th>
                    <th className="p-6 text-sm font-bold border-b border-outline-variant/10">Starter</th>
                    <th className="p-6 text-sm font-bold border-b border-outline-variant/10">Growth</th>
                    <th className="p-6 text-sm font-bold border-b border-outline-variant/10">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  <tr className="hover:bg-surface-container-highest transition-colors">
                    <td className="p-6 border-b border-outline-variant/10">AI Modellen</td>
                    <td className="p-6 border-b border-outline-variant/10 text-on-surface-variant">Standaard</td>
                    <td className="p-6 border-b border-outline-variant/10">Geavanceerd</td>
                    <td className="p-6 border-b border-outline-variant/10">Custom setup</td>
                  </tr>
                  <tr className="hover:bg-surface-container-highest transition-colors">
                    <td className="p-6 border-b border-outline-variant/10">Shop-integraties</td>
                    <td className="p-6 border-b border-outline-variant/10 text-on-surface-variant">Basis</td>
                    <td className="p-6 border-b border-outline-variant/10">Volledig</td>
                    <td className="p-6 border-b border-outline-variant/10">Volledig + maatwerk</td>
                  </tr>
                  <tr className="hover:bg-surface-container-highest transition-colors">
                    <td className="p-6 border-b border-outline-variant/10">Team samenwerking</td>
                    <td className="p-6 border-b border-outline-variant/10 text-on-surface-variant">1 gebruiker</td>
                    <td className="p-6 border-b border-outline-variant/10">Tot 10 gebruikers</td>
                    <td className="p-6 border-b border-outline-variant/10">Onbeperkt</td>
                  </tr>
                  <tr className="hover:bg-surface-container-highest transition-colors">
                    <td className="p-6 border-b border-outline-variant/10">Support respons</td>
                    <td className="p-6 border-b border-outline-variant/10 text-on-surface-variant">48 uur</td>
                    <td className="p-6 border-b border-outline-variant/10">12 uur</td>
                    <td className="p-6 border-b border-outline-variant/10">Direct</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4 font-headline">Veelgestelde vragen</h2>
            <p className="text-on-surface-variant">Alles wat je moet weten over onze diensten en betalingen.</p>
          </div>
          <div className="space-y-4">
            <div className="p-6 rounded-lg bg-surface-container-low">
              <h4 className="font-bold text-on-surface mb-3">Kan ik op elk moment annuleren?</h4>
              <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                Ja, je kunt je abonnement op elk moment opzeggen via je dashboard. Je behoudt toegang tot de betaalde
                functies tot het einde van je huidige factureringscyclus.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-surface-container-low">
              <h4 className="font-bold text-on-surface mb-3">Bieden jullie korting voor jaarlijkse betaling?</h4>
              <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                Ja. Bij jaarlijkse betaling geven we een gunstiger tarief in vergelijking met maandelijkse betaling.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-surface-container-low">
              <h4 className="font-bold text-on-surface mb-3">Zijn mijn data en privacy veilig?</h4>
              <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                Privacy staat centraal. We werken tenant-gescheiden met beveiligde opslag en rollen per account.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-xl bg-primary-fixed p-12 md:p-20 flex flex-col items-center text-center">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-[120px]"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-container rounded-full blur-[120px]"></div>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-on-primary-fixed mb-6 relative z-10 font-headline">
              Klaar om de toekomst te versnellen?
            </h2>
            <p className="text-on-primary-fixed-variant text-lg mb-10 max-w-xl relative z-10">
              Word lid van bedrijven die Belliq gebruiken om hun klantgesprekken slimmer en rustiger te maken.
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

      <PublicFooter />
    </div>
  );
};

export default PricingPage;
