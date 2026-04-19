import React from 'react';
import { useNavigate } from 'react-router-dom';

const PublicHeader = ({ active = 'features' }) => {
  const navigate = useNavigate();

  const links = [
    { key: 'features', label: 'Functies', path: '/' },
    { key: 'how', label: 'Hoe het werkt', path: '/info' },
    { key: 'pricing', label: 'Prijzen', path: '/pricing' },
    { key: 'resources', label: 'Resources', path: '/contact' }
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-[#f7f9fb]/60 backdrop-blur-xl shadow-sm shadow-indigo-500/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex justify-between items-center gap-3">
        <button className="flex items-center gap-3" onClick={() => navigate('/')}>
          <img src="/favicon.svg" alt="Belliq logo" className="w-7 h-7 sm:w-8 sm:h-8" />
          <div className="text-xl sm:text-2xl font-bold tracking-tighter text-indigo-700">Belliq</div>
        </button>

        <nav className="hidden md:flex items-center gap-8 font-headline font-semibold tracking-tight text-sm">
          {links.map((link) => (
            <button
              key={link.key}
              onClick={() => navigate(link.path)}
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

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button className="material-symbols-outlined text-slate-600 hover:text-indigo-600 transition-colors text-[20px] sm:text-[24px]">
            language
          </button>
          <button
            onClick={() => navigate('/login')}
            className="bg-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-semibold hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
          >
            <span className="hidden sm:inline">Aan de slag</span>
            <span className="sm:hidden">Start</span>
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-b from-slate-200/50 to-transparent h-[1px]"></div>

      <div className="md:hidden max-w-7xl mx-auto px-4 sm:px-6 pb-3 flex flex-wrap items-center justify-center gap-2">
        {links.map((link) => (
          <button
            key={link.key}
            onClick={() => navigate(link.path)}
            className={`text-xs whitespace-nowrap px-3 py-1.5 rounded-full border transition-colors ${
              active === link.key
                ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </header>
  );
};

export default PublicHeader;
