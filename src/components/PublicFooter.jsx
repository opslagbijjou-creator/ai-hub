import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PublicFooter = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateTo = (path) => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      return;
    }

    navigate(path);
  };

  return (
    <footer className="w-full py-12 mt-auto bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-200 h-[1px] w-full mb-8"></div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <button onClick={() => navigateTo('/')} className="text-lg font-black text-slate-900">
            Belliq
          </button>

          <div className="flex flex-wrap justify-center gap-8 font-['Inter'] text-xs tracking-wide uppercase font-medium">
            <button
              className="text-slate-500 hover:text-slate-900 transition-colors hover:underline decoration-indigo-500 underline-offset-4"
              onClick={() => navigateTo('/privacy')}
            >
              Privacy
            </button>
            <button
              className="text-slate-500 hover:text-slate-900 transition-colors hover:underline decoration-indigo-500 underline-offset-4"
              onClick={() => navigateTo('/terms')}
            >
              Voorwaarden
            </button>
            <button
              className="text-slate-500 hover:text-slate-900 transition-colors hover:underline decoration-indigo-500 underline-offset-4"
              onClick={() => navigateTo('/compliance')}
            >
              Beveiliging
            </button>
            <button
              className="text-slate-500 hover:text-slate-900 transition-colors hover:underline decoration-indigo-500 underline-offset-4"
              onClick={() => navigateTo('/contact')}
            >
              Status
            </button>
          </div>

          <p className="text-xs text-slate-500 text-center">© 2025 Belliq. Alle rechten voorbehouden.</p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
