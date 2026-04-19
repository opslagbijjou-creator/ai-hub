import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PublicFooter = ({ variant = 'features' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateTo = (path) => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      return;
    }

    navigate(path);
  };

  const configMap = useMemo(
    () => ({
      features: {
        wrapperClass: 'w-full py-12 mt-auto bg-slate-50 border-t border-slate-200',
        outerDividerClass: '',
        innerClass: 'max-w-7xl mx-auto px-6',
        innerDividerClass: 'bg-slate-200 h-[1px] w-full mb-8',
        contentClass: 'flex flex-col md:flex-row justify-between items-center gap-6',
        brandClass: 'text-lg font-black text-slate-900',
        linksClass: "flex flex-wrap justify-center gap-8 font-['Inter'] text-xs tracking-wide uppercase font-medium",
        linkClass:
          'text-slate-500 hover:text-slate-900 transition-colors hover:underline decoration-indigo-500 underline-offset-4',
        copyClass: 'text-xs text-slate-500'
      },
      how: {
        wrapperClass: 'w-full py-12 mt-auto bg-slate-50 dark:bg-slate-950',
        outerDividerClass: 'bg-slate-200 dark:bg-slate-800 h-[1px] w-full mb-8',
        innerClass: 'max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6',
        innerDividerClass: '',
        contentClass: '',
        brandClass: 'text-lg font-black text-slate-900 dark:text-white',
        linksClass: 'flex gap-8',
        linkClass:
          "font-['Inter'] text-xs tracking-wide uppercase font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors hover:underline decoration-indigo-500 underline-offset-4",
        copyClass: "text-slate-500 font-['Inter'] text-xs tracking-wide uppercase font-medium"
      },
      pricing: {
        wrapperClass: 'w-full py-12 mt-auto bg-slate-50 dark:bg-slate-950',
        outerDividerClass: '',
        innerClass: 'max-w-7xl mx-auto px-6',
        innerDividerClass: 'bg-slate-200 dark:bg-slate-800 h-[1px] w-full mb-8',
        contentClass: 'flex flex-col md:flex-row justify-between items-center gap-6',
        brandClass: 'text-lg font-black text-slate-900 dark:text-white',
        linksClass: "flex flex-wrap justify-center gap-6 font-['Inter'] text-xs tracking-wide uppercase font-medium",
        linkClass:
          'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors hover:underline decoration-indigo-500 underline-offset-4',
        copyClass: 'text-slate-500 text-[10px] uppercase tracking-widest font-bold'
      },
      resources: {
        wrapperClass: 'w-full py-12 mt-auto bg-slate-50',
        outerDividerClass: '',
        innerClass: 'max-w-7xl mx-auto px-6',
        innerDividerClass: 'bg-slate-200 h-[1px] w-full mb-8',
        contentClass: 'flex flex-col md:flex-row justify-between items-center gap-6',
        brandClass: 'text-lg font-black text-slate-900',
        linksClass: 'flex gap-8',
        linkClass:
          "font-['Inter'] text-xs tracking-wide uppercase font-medium text-slate-500 hover:text-slate-900 transition-colors hover:underline decoration-indigo-500 underline-offset-4",
        copyClass: "font-['Inter'] text-xs tracking-wide uppercase font-medium text-slate-500"
      }
    }),
    []
  );

  const config = configMap[variant] || configMap.features;

  const links = [
    { label: 'Privacy', path: '/privacy' },
    { label: 'Voorwaarden', path: '/terms' },
    { label: 'Beveiliging', path: '/compliance' },
    { label: 'Status', path: '/contact' }
  ];

  if (variant === 'how') {
    return (
      <footer className={config.wrapperClass}>
        <div className={config.outerDividerClass}></div>
        <div className={config.innerClass}>
          <button onClick={() => navigateTo('/')} className={config.brandClass}>
            Belliq
          </button>

          <nav className={config.linksClass}>
            {links.map((link) => (
              <button key={link.label} className={config.linkClass} onClick={() => navigateTo(link.path)}>
                {link.label}
              </button>
            ))}
          </nav>

          <div className={config.copyClass}>© 2024 Belliq. Alle rechten voorbehouden.</div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={config.wrapperClass}>
      <div className={config.innerClass}>
        <div className={config.innerDividerClass}></div>
        <div className={config.contentClass}>
          <button onClick={() => navigateTo('/')} className={config.brandClass}>
            Belliq
          </button>

          <div className={config.linksClass}>
            {links.map((link) => (
              <button key={link.label} className={config.linkClass} onClick={() => navigateTo(link.path)}>
                {link.label}
              </button>
            ))}
          </div>

          <div className={config.copyClass}>© 2024 Belliq. Alle rechten voorbehouden.</div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
