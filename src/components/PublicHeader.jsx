import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PublicHeader = ({ active = 'features', headerVariant }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { key: 'features', label: 'Functies', path: '/' },
    { key: 'how', label: 'Hoe het werkt', path: '/info' },
    { key: 'pricing', label: 'Prijzen', path: '/pricing' },
    { key: 'resources', label: 'Resources', path: '/contact' }
  ];

  const variant = headerVariant || active;

  const variantConfig = useMemo(
    () => ({
      features: {
        headerClass: 'fixed top-0 w-full z-50 bg-[#f7f9fb]/60 backdrop-blur-xl shadow-sm shadow-indigo-500/5',
        containerClass: 'max-w-7xl mx-auto px-6 h-20 flex justify-between items-center',
        navClass: 'hidden md:flex items-center gap-8 font-headline font-semibold tracking-tight text-sm',
        activeLinkClass: 'text-indigo-700 font-bold border-b-2 border-indigo-600 pb-1',
        inactiveLinkClass: 'text-slate-600 hover:text-indigo-600 transition-colors',
        rightClass: 'flex items-center gap-4',
        languageClass: 'material-symbols-outlined text-slate-600 hover:text-indigo-600 transition-colors',
        ctaClass:
          'bg-indigo-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-indigo-500/20',
        dividerClass: 'bg-gradient-to-b from-slate-200/50 to-transparent h-[1px]',
        ctaLabel: 'Aan de slag'
      },
      how: {
        headerClass:
          'fixed top-0 w-full z-50 bg-[#f7f9fb]/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm shadow-indigo-500/5',
        containerClass: 'flex justify-between items-center max-w-7xl mx-auto px-6 h-20',
        navClass: 'hidden md:flex gap-8 items-center',
        activeLinkClass:
          "text-indigo-700 dark:text-indigo-300 font-bold border-b-2 border-indigo-600 pb-1 font-['Manrope'] tracking-tight text-sm",
        inactiveLinkClass:
          "text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors font-['Manrope'] font-semibold tracking-tight text-sm",
        rightClass: 'flex items-center gap-4',
        languageClass:
          'material-symbols-outlined text-on-surface-variant cursor-pointer hover:scale-[1.02] transition-transform duration-200',
        ctaClass:
          'bg-gradient-to-r from-primary to-primary-container text-white px-6 py-2.5 rounded-md font-semibold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-indigo-500/20',
        dividerClass: 'bg-gradient-to-b from-slate-200/50 to-transparent dark:from-slate-800/50 h-[1px]',
        ctaLabel: 'Aan de slag'
      },
      pricing: {
        headerClass:
          'fixed top-0 w-full z-50 bg-[#f7f9fb]/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm shadow-indigo-500/5',
        containerClass: 'flex justify-between items-center max-w-7xl mx-auto px-6 h-20',
        navClass: "hidden md:flex gap-8 items-center font-['Manrope'] font-semibold tracking-tight text-sm",
        activeLinkClass: 'text-indigo-700 dark:text-indigo-300 font-bold border-b-2 border-indigo-600 pb-1',
        inactiveLinkClass: 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors',
        rightClass: 'flex items-center gap-4',
        languageClass: 'material-symbols-outlined text-slate-600 cursor-pointer active:scale-95 transition-all',
        ctaClass:
          'bg-primary text-on-primary px-6 py-2.5 rounded-lg font-semibold text-sm hover:scale-[1.02] transition-transform duration-200 cursor-pointer active:scale-95',
        dividerClass: 'bg-gradient-to-b from-slate-200/50 to-transparent dark:from-slate-800/50 h-[1px]',
        ctaLabel: 'Aan de slag'
      },
      resources: {
        headerClass: 'fixed top-0 w-full z-50 bg-[#f7f9fb]/60 backdrop-blur-xl shadow-sm shadow-indigo-500/5',
        containerClass: 'flex justify-between items-center max-w-7xl mx-auto px-6 h-20',
        navClass: "hidden md:flex items-center space-x-8 font-['Manrope'] font-semibold tracking-tight text-sm",
        activeLinkClass: 'text-indigo-700 font-bold border-b-2 border-indigo-600 pb-1 cursor-pointer active:scale-95 transition-all',
        inactiveLinkClass:
          'text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer active:scale-95 transition-all',
        rightClass: 'flex items-center space-x-4',
        languageClass:
          'material-symbols-outlined text-slate-600 cursor-pointer hover:scale-[1.02] transition-transform duration-200',
        ctaClass:
          'bg-primary-container text-white px-5 py-2.5 rounded-full font-bold text-sm hover:scale-[1.02] transition-transform duration-200 active:scale-95',
        dividerClass: 'bg-gradient-to-b from-slate-200/50 to-transparent h-[1px]',
        ctaLabel: 'Aan de slag'
      }
    }),
    []
  );

  const config = variantConfig[variant] || variantConfig.features;

  const navigateTo = (path) => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      return;
    }

    navigate(path);
  };

  return (
    <header className={config.headerClass}>
      <div className={config.containerClass}>
        <button className="text-2xl font-bold tracking-tighter text-indigo-700" onClick={() => navigateTo('/')}>
          Belliq
        </button>

        <nav className={config.navClass}>
          {links.map((link) => (
            <button
              key={link.key}
              onClick={() => navigateTo(link.path)}
              className={active === link.key ? config.activeLinkClass : config.inactiveLinkClass}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className={config.rightClass}>
          <button type="button" aria-label="Taal" className={config.languageClass}>
            language
          </button>
          <button onClick={() => navigateTo('/login')} className={config.ctaClass}>
            {config.ctaLabel}
          </button>
        </div>
      </div>

      <div className={config.dividerClass}></div>
    </header>
  );
};

export default PublicHeader;
