import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PublicHeader = ({ active = 'features' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { key: 'features', label: 'Functies', path: '/' },
    { key: 'how', label: 'Hoe het werkt', path: '/info' },
    { key: 'pricing', label: 'Prijzen', path: '/pricing' },
    { key: 'resources', label: 'Resources', path: '/contact' }
  ];

  const navigateTo = (path) => {
    setMobileMenuOpen(false);

    if (location.pathname === path) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      return;
    }

    navigate(path);
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#f7f9fb]/60 backdrop-blur-xl shadow-sm shadow-indigo-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex justify-between items-center">
          <button className="text-2xl font-bold tracking-tighter text-indigo-700" onClick={() => navigateTo('/')}>
            Belliq
          </button>

          <nav className="hidden md:flex items-center gap-8 font-headline font-semibold tracking-tight text-sm">
            {links.map((link) => (
              <button
                key={link.key}
                onClick={() => navigateTo(link.path)}
                className={
                  active === link.key
                    ? 'text-indigo-700 font-bold border-b-2 border-indigo-600 pb-1'
                    : 'text-slate-600 hover:text-indigo-600 transition-colors'
                }
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              aria-label="Taal"
              className="material-symbols-outlined text-slate-600 hover:text-indigo-600 transition-colors"
            >
              language
            </button>
            <button
              onClick={() => navigateTo('/login')}
              className="bg-indigo-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
            >
              Aan de slag
            </button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => navigateTo('/login')}
              className="bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg shadow-indigo-500/20"
            >
              Start
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Menu sluiten' : 'Menu openen'}
              className="h-10 w-10 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm grid place-items-center"
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
        <div className="bg-gradient-to-b from-slate-200/50 to-transparent h-[1px]"></div>
      </header>

      <div
        className={`md:hidden fixed inset-0 z-[70] transition-all duration-300 ${
          mobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <button
          type="button"
          aria-label="Sluit menu overlay"
          onClick={() => setMobileMenuOpen(false)}
          className={`absolute inset-0 bg-slate-900/35 backdrop-blur-[2px] transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <aside
          className={`absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white/95 backdrop-blur-xl border-l border-slate-200 shadow-2xl transition-transform duration-300 ease-out ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="px-5 pt-5 pb-4 border-b border-slate-200/80">
            <div className="flex items-center justify-between">
              <button className="text-lg font-bold text-indigo-700" onClick={() => navigateTo('/')}>
                Belliq
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 grid place-items-center"
                aria-label="Sluit menu"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            {links.map((link) => (
              <button
                key={link.key}
                onClick={() => navigateTo(link.path)}
                className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 text-left transition-all ${
                  active === link.key
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="font-semibold">{link.label}</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-slate-200/80">
            <button
              onClick={() => navigateTo('/login')}
              className="w-full bg-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20"
            >
              Aan de slag
            </button>
          </div>
        </aside>
      </div>
    </>
  );
};

export default PublicHeader;
