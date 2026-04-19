import React from 'react';
import { useNavigate } from 'react-router-dom';

const PublicFooter = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="belliq-footer">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-slate-200 h-[1px] w-full mb-8"></div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Belliq logo" className="w-6 h-6" />
            <span className="text-lg font-black text-slate-900">Belliq</span>
          </button>

          <div className="flex flex-wrap justify-center gap-8 font-['Inter'] text-xs tracking-wide uppercase font-medium">
            <button
              className="text-slate-500 hover:text-slate-900 transition-colors hover:underline decoration-indigo-500 underline-offset-4"
              onClick={() => navigate('/privacy')}
            >
              Privacy
            </button>
            <button
              className="text-slate-500 hover:text-slate-900 transition-colors hover:underline decoration-indigo-500 underline-offset-4"
              onClick={() => navigate('/terms')}
            >
              Voorwaarden
            </button>
            <button
              className="text-slate-500 hover:text-slate-900 transition-colors hover:underline decoration-indigo-500 underline-offset-4"
              onClick={() => navigate('/compliance')}
            >
              Beveiliging
            </button>
            <button
              className="text-slate-500 hover:text-slate-900 transition-colors hover:underline decoration-indigo-500 underline-offset-4"
              onClick={() => navigate('/contact')}
            >
              Status
            </button>
          </div>

          <p className="text-xs text-slate-500">© {year} Belliq. Alle rechten voorbehouden.</p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
