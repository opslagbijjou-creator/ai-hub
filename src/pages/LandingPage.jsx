import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicFooter from '../components/PublicFooter';
import PublicHeader from '../components/PublicHeader';
import './Belliq.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const scrollToFeatures = () => {
    const section = document.getElementById('features-grid');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  return (
    <div className="belliq-page bg-surface text-on-surface font-body selection:bg-primary-fixed selection:text-on-primary-fixed">
      <PublicHeader active="features" headerVariant="features" />

      <main className="belliq-main overflow-hidden">
        <section className="max-w-7xl mx-auto px-6 mb-24">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                De toekomst van klantcontact
              </div>
              <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface mb-8 leading-[1.1]">
                Breng <span className="text-primary italic">rust</span> in je communicatie.
              </h1>
              <p className="text-on-surface-variant text-lg md:text-xl max-w-xl leading-relaxed mb-10">
                Belliq automatiseert je klantenservice met de precisie van menselijk inzicht en de snelheid van AI.
                Focus op je groei, terwijl wij de gesprekken voeren.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <button
                  onClick={scrollToFeatures}
                  className="bg-indigo-700 text-white px-8 py-4 rounded-lg font-semibold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-500/30"
                >
                  Bekijk alle features
                </button>
                <button
                  onClick={() => navigate('/contact')}
                  className="bg-surface-container-high text-on-surface px-8 py-4 rounded-lg font-semibold hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Vraag demo aan
                </button>
              </div>
            </div>

            <div className="flex-1 relative">
              <div className="w-full aspect-square rounded-xl overflow-hidden shadow-2xl shadow-indigo-500/10">
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD24FauVOFkROOF_unAbjHa_SOoc0NF7Zabi-07cr0Iov37vPSzpVJSpOdWRRSbtmKbCovngSHF_2OXYYPKeHPfjdA0pJ2sncdN07EUaTTepWwRq-ny7G5dBbmiqwclr-zKWT3ZuBSQstKPl4A6Qos_U2jNquxJyJtvHTao7MJhwCn1gqGLAZv9rlb9KGxXKJPAoT3q1Ehnr2B3WHI5So5hwbPzbJQ73Gku24s0pQUYNuZP6MzzwGBXEULSj3uQtkefn0xZHMY3gtc"
                  alt="Moderne abstracte visual van AI-datastromen"
                />
              </div>

              <div className="absolute -bottom-6 -left-6 glass-card p-6 rounded-lg shadow-2xl max-w-xs border border-white/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-white">graphic_eq</span>
                  </div>
                  <div>
                    <div className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">AI Active Listening</div>
                    <div className="text-sm font-semibold">98.4% Nauwkeurigheid</div>
                  </div>
                </div>
                <div className="flex items-end gap-1 h-8">
                  <div className="w-1 bg-primary/20 h-4 rounded-full"></div>
                  <div className="w-1 bg-primary/40 h-6 rounded-full"></div>
                  <div className="w-1 bg-primary h-8 rounded-full"></div>
                  <div className="w-1 bg-primary/60 h-5 rounded-full"></div>
                  <div className="w-1 bg-primary/30 h-3 rounded-full"></div>
                  <div className="w-1 bg-primary/50 h-7 rounded-full"></div>
                  <div className="w-1 bg-primary h-4 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features-grid" className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8 bg-surface-container-lowest rounded-lg p-10 group hover:bg-white transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 text-primary">
                  <span className="material-symbols-outlined text-3xl">nights_stay</span>
                </div>
                <h3 className="font-headline text-3xl font-bold mb-4">Altijd Wakker</h3>
                <p className="text-on-surface-variant text-lg max-w-md leading-relaxed">
                  Terwijl jij slaapt, blijft Belliq actief. Onze 24/7 bereikbaarheid zorgt ervoor dat geen enkele
                  klantvraag onbeantwoord blijft, ongeacht de tijdzone.
                </p>
              </div>
              <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-10 group-hover:opacity-20 transition-opacity">
                <img
                  className="w-full h-full object-cover object-left-top"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDg4Qg_lTI7zfiz_6gq0eFTsh0Cb_i5WANOUdb_-28KPw58Cya0Yz-8k9ulvBd-0jQ3k_zvomFX_Vx8WzRqPH4wd-6knv_Mk6aLL81SSlYsKos2CUOgcAcvcRGQomkyk_vukRWEuZE8hU-ydY1dX9_jbb1bHZhWW5HANjCHxOeK78ZYUrE69xgoZSudbYo3cLkNo4rU-IYhm67Js0WBhzEpT5nN0-LuGI9STynfFkYUGE51pPkND1pexhYXLk7197ksmqK0S3cpt-k"
                  alt="Code in nachtomgeving"
                />
              </div>
            </div>

            <div className="md:col-span-4 bg-surface-container-low rounded-lg p-10 flex flex-col items-start shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-secondary-container rounded-2xl flex items-center justify-center mb-8 text-on-secondary-container">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <h3 className="font-headline text-2xl font-bold mb-4">Sentiment Analyse</h3>
              <p className="text-on-surface-variant leading-relaxed mb-8">
                Begrijp niet alleen de woorden, maar ook de emotie. Onze AI detecteert frustratie of vreugde en past
                de toonhoogte en reactie direct aan.
              </p>
              <div className="mt-auto w-full pt-6 border-t border-outline-variant/30">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span>Positief</span>
                  <span className="text-primary">82%</span>
                </div>
                <div className="w-full bg-outline-variant/20 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-primary h-full w-[82%]"></div>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 bg-surface-container-low rounded-lg p-10 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-8 text-indigo-700">
                <span className="material-symbols-outlined">sync_alt</span>
              </div>
              <h3 className="font-headline text-2xl font-bold mb-4">Commerce Sync</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Directe koppeling met Shopify en Magento. Belliq kan bestelstatus opvragen, retouren verwerken en
                voorraad checken zonder menselijke tussenkomst.
              </p>
              <div className="flex gap-4 mt-8 opacity-40">
                <span className="font-black text-xl tracking-tighter">Shopify</span>
                <span className="font-black text-xl tracking-tighter">Magento</span>
              </div>
            </div>

            <div className="md:col-span-8 bg-surface-container-lowest rounded-lg p-10 group hover:bg-white transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col md:flex-row gap-10">
              <div className="flex-1">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 text-primary">
                  <span className="material-symbols-outlined text-3xl">public</span>
                </div>
                <h3 className="font-headline text-3xl font-bold mb-4">Wereldwijde Dialecten</h3>
                <p className="text-on-surface-variant text-lg leading-relaxed">
                  Van Limburgs tot Vlaams, en van Londen tot Tokio. Onze AI herkent en spreekt honderden lokale
                  dialecten en accenten, zodat elke klant zich thuis voelt.
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                  <img
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDARfPek2v8UbF201CvJBBjRVC1Ch_SGnzotWU1XuSmgKAH33MWBXpr_ZRUZbUHJUz2BjgYHnZnQnNv79ELdioHcbzpoCq3wKIAHeQF1T0BzU_H0HVvXNhvBiEWlTEZkMPO3Iaf_7ZOFY_jJY_HyhqipGOQdu_K2Q0K5WFBzMz8Rik5g9ODq5mapR5YkEEm1pfBEn6Ci6Qf3CkaOxpJLKN11v2Epyi2VLtaIC26u32m8-zWyF4SeGFA4oEBMit-ZZ90RCgPd66nXC8"
                    alt="Wereldkaart netwerk"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-20 text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
          <div className="max-w-3xl mx-auto">
            <h2 className="font-headline text-4xl md:text-5xl font-bold mb-8">Klaar voor echte rust?</h2>
            <p className="text-on-surface-variant text-xl mb-12">
              Ontdek hoe Belliq de druk op je team verlaagt en de tevredenheid van je klanten verhoogt. Geen gedoe,
              alleen resultaat.
            </p>
            <div className="inline-flex glass-card p-2 rounded-2xl shadow-xl">
              <button
                onClick={() => navigate('/login')}
                className="bg-indigo-700 text-white px-10 py-5 rounded-xl font-bold hover:scale-[1.05] transition-transform shadow-lg shadow-indigo-500/20"
              >
                Start je gratis proefperiode
              </button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter variant="features" />
    </div>
  );
};

export default LandingPage;
