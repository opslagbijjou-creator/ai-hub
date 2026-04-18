import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, PhoneCall, Clock, CheckCircle, ChevronRight, Moon, Sun, UploadCloud } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useAppContext();

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="landing-nav glass-panel">
        <div className="nav-logo">
          <Bot className="text-gradient" size={32} />
          <span className="text-gradient font-heading">AI Hub</span>
        </div>
        <div className="nav-links">
          <a href="#hoe-het-werkt">Hoe het werkt</a>
          <a href="#voordelen">Voordelen</a>
          <a href="#prijzen">Prijzen</a>
        </div>
        <div className="nav-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'dark-mode' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="btn-secondary" onClick={() => navigate('/login')}>Inloggen</button>
          <button className="btn-primary" onClick={() => navigate('/login')}>
            Probeer 14 Dagen Gratis <ChevronRight size={18} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero-section">
        <div className="hero-content animate-fade-in">
          <div className="badge glass-panel">✨ Binnen 1 dag live & operationeel</div>
          <h1 className="hero-title">
            De AI-Telefoonassistent<br/> Voor <span className="text-gradient">Jouw Bedrijf</span>.
          </h1>
          <p className="hero-subtitle">
            Onze AI neemt 24/7 de telefoon op, beantwoordt vragen, plant afspraken en verbindt alleen door wanneer het écht nodig is. Geen gemiste omzet meer, geen overbelast team.
          </p>
          <div className="hero-cta">
            <button className="btn-primary btn-large" onClick={() => navigate('/setup-wizard')}>
              Maak Jouw Assistent <ChevronRight size={20} />
            </button>
            <button className="btn-secondary btn-large">
              Plan een Demo
            </button>
          </div>
        </div>
        
        <div className="hero-visual animate-float">
          <div className="abstract-shape shape-1"></div>
          <div className="abstract-shape shape-2"></div>
          <div className="dashboard-preview glass-panel">
             <div className="preview-header">
               <div className="dots"><span></span><span></span><span></span></div>
               <div className="preview-title">Live Call Status</div>
             </div>
             <div className="preview-body" style={{flexDirection: 'column', gap: '1rem'}}>
                <div className="mock-card" style={{height: 'auto', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
                   <div style={{background: 'var(--primary)', borderRadius: '50%', padding: '10px'}}><PhoneCall size={24} color="white"/></div>
                   <div>
                     <h4 style={{marginBottom: '4px'}}>Inkomend Gesprek</h4>
                     <p className="text-muted" style={{fontSize: '0.85rem'}}>+31 6 1234 5678</p>
                   </div>
                   <div style={{marginLeft: 'auto', color: '#10B981', fontWeight: 'bold', fontSize: '0.85rem'}}>Beantwoord door AI</div>
                </div>
                
                <div className="mock-card" style={{height: 'auto', padding: '1rem'}}>
                   <h4 style={{marginBottom: '0.5rem', color: 'var(--secondary)'}}>Transcriptie (Live)</h4>
                   <p style={{fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-muted)'}}>
                     "Goedemiddag, u spreekt met de virtuele assistent. Hoe kan ik u helpen?"<br/><br/>
                     <span style={{color: 'var(--text-main)'}}>"Hi, ik wil graag een afspraak maken voor morgen."</span>
                   </p>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="hoe-het-werkt" className="features-section">
        <div className="feature-card glass-panel">
          <div className="icon-wrapper"><PhoneCall size={24} color="var(--primary)" /></div>
          <h3>Neemt Direct Op</h3>
          <p>Klanten wachten niet meer. De AI antwoordt direct op basis van je website, FAQ en openingstijden.</p>
        </div>
        <div className="feature-card glass-panel">
          <div className="icon-wrapper"><UploadCloud size={24} color="var(--secondary)" /></div>
          <h3>Leert Je Bedrijf Kennen</h3>
          <p>Upload PDF's of geef je website op. De AI weet binnen enkele seconden alles over je diensten en prijzen.</p>
        </div>
        <div className="feature-card glass-panel">
          <div className="icon-wrapper"><Clock size={24} color="#10B981" /></div>
          <h3>24/7 Bereikbaar</h3>
          <p>Zelfs buiten kantooruren, in het weekend of tijdens feestdagen worden je klanten perfect geholpen.</p>
        </div>
      </section>

      {/* Stats/Proof Section */}
      <section className="proof-section" style={{ width: '100%', maxWidth: '1200px', margin: '4rem auto', textAlign: 'center' }}>
        <h2 className="font-heading" style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>Klanten krijgen sneller antwoord. Teams krijgen tijd terug.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
           <div>
             <h3 style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>85%</h3>
             <p className="text-muted">Van de vragen direct opgelost zonder medewerker</p>
           </div>
           <div>
             <h3 style={{ fontSize: '3rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>24/7</h3>
             <p className="text-muted">Bereikbaarheid buiten kantooruren en in weekends</p>
           </div>
           <div>
             <h3 style={{ fontSize: '3rem', color: '#10B981', marginBottom: '0.5rem' }}>100%</h3>
             <p className="text-muted">Van de gesprekken professioneel samengevat</p>
           </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
