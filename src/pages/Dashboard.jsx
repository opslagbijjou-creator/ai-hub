import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import './Dashboard.css';
import { Activity, Database, Users, Phone, Settings, X, UploadCloud, BookOpen } from 'lucide-react';
import WhatsAppAgent from './WhatsAppAgent';

const KnowledgeBase = () => {
  const { knowledgeBase, setKnowledgeBase } = useAppContext();
  const [urlInput, setUrlInput] = React.useState('');

  const handleAddUrl = () => {
    if(urlInput && !knowledgeBase.urls.includes(urlInput)) {
      setKnowledgeBase({...knowledgeBase, urls: [...knowledgeBase.urls, urlInput]});
      setUrlInput('');
    }
  };

  const handleRemoveUrl = (url) => {
    setKnowledgeBase({...knowledgeBase, urls: knowledgeBase.urls.filter(u => u !== url)});
  };

  return (
    <div className="dashboard-knowledge animate-fade-in" style={{ padding: '2rem' }}>
      <div className="dashboard-header">
        <h1 className="font-heading">Knowledge Base</h1>
        <p className="text-muted">Train je AI door documenten te uploaden of je website op te geven. Zo kan de AI alle vragen van je klanten foutloos beantwoorden.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
         <div className="glass-panel" style={{ padding: '2rem' }}>
           <h3 style={{ marginBottom: '0.5rem' }}>Website Scrapen</h3>
           <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Voer je website URL in. Wij lezen automatisch al je prijzen, diensten en FAQ in.</p>
           
           <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
             <input 
               type="text" 
               placeholder="https://www.jouwwebsite.nl"
               value={urlInput}
               onChange={(e) => setUrlInput(e.target.value)}
               style={{ flex: 1, padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px' }}
             />
             <button className="btn-primary" onClick={handleAddUrl}>Toevoegen</button>
           </div>

           <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
             {knowledgeBase.urls.map(url => (
               <li key={url} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-hover)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></div>
                   <span>{url}</span>
                 </div>
                 <button style={{ color: '#EF4444' }} onClick={() => handleRemoveUrl(url)}><X size={16}/></button>
               </li>
             ))}
             {knowledgeBase.urls.length === 0 && (
               <p className="text-muted" style={{ fontSize: '0.85rem' }}>Nog geen websites toegevoegd.</p>
             )}
           </ul>
         </div>

         <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--glass-border)', textAlign: 'center' }}>
            <UploadCloud size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>Upload PDF of Document</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem', maxWidth: '300px' }}>Sleep bestanden hierheen of klik om te bladeren. Ondersteunt PDF, DOCX, TXT.</p>
            <button className="btn-secondary">Bladeren...</button>
         </div>
      </div>
    </div>
  );
};

const Overview = () => {
  const { assistantConfig, setAssistantConfig } = useAppContext();
  const [showSettings, setShowSettings] = useState(false);

  const handleSaveSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Geen actieve sessie');
      }

      const response = await fetch('http://localhost:3001/api/assistant/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(assistantConfig)
      });
      if(response.ok) {
        console.log('Successfully saved to backend');
      }
    } catch (error) {
      console.error('Failed to save to backend:', error);
    }
    setShowSettings(false);
  };

  return (
    <div className="dashboard-overview animate-fade-in" style={{ position: 'relative' }}>
      <div className="dashboard-header">
        <h1 className="font-heading">Welcome back{assistantConfig ? `, ${assistantConfig.companyName}` : ''}</h1>
        <p className="text-muted">Here's what's happening with your AI integrations today.</p>
      </div>

      {assistantConfig && (
        <div className="active-assistant-banner glass-panel mb-4" style={{ padding: '2rem', marginBottom: '2rem', borderLeft: '4px solid var(--primary)', background: 'rgba(139, 92, 246, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
               <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={28} color="white" />
               </div>
               <div>
                 <h2 className="font-heading" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Active Call Assistant</h2>
                 <p className="text-muted">Answering calls for <strong>{assistantConfig.companyName}</strong> using voice: {assistantConfig.voice}</p>
               </div>
            </div>
            <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: 'var(--primary)' }}>{assistantConfig.phoneNumber}</div>
               <button 
                 className="btn-secondary" 
                 style={{ marginTop: '0.5rem', padding: '6px 12px', fontSize: '0.85rem' }}
                 onClick={() => setShowSettings(true)}
               >
                 <Settings size={14}/> Settings
               </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Settings Modal */}
      {showSettings && assistantConfig && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: '500px', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setShowSettings(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'white' }}>
              <X size={24} />
            </button>
            <h2 className="font-heading" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Assistant Settings</h2>
            
            <div className="form-group" style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Business Name</label>
              <input 
                type="text" 
                value={assistantConfig.companyName}
                onChange={(e) => setAssistantConfig({...assistantConfig, companyName: e.target.value})}
                style={{ padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px' }}
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Phone Number (Twilio)</label>
              <input 
                type="text" 
                disabled 
                value={assistantConfig.phoneNumber}
                style={{ padding: '10px', background: 'var(--bg-surface-hover)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', borderRadius: '8px' }}
              />
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>Change number via Twilio console.</small>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Webhook URL (For Twilio Config)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                 <input 
                   type="text" 
                   readOnly 
                   value="https://api.ai-hub.dev/webhook/v1/call"
                   style={{ flex: 1, padding: '10px', background: 'var(--bg-surface-hover)', border: '1px solid var(--glass-border)', color: 'var(--primary)', borderRadius: '8px', fontSize: '0.85rem' }}
                 />
                 <button className="btn-secondary" style={{ padding: '0 15px' }}>Copy</button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Base Prompt / AI Instructions</label>
              <textarea 
                rows="4" 
                defaultValue="You are a helpful receptionist for this business. Keep answers short and friendly."
                style={{ padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', fontFamily: 'inherit' }}
              />
            </div>

            <button className="btn-primary w-full" style={{ width: '100%' }} onClick={handleSaveSettings}>Save Changes</button>
          </div>
        </div>
      )}
      
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--primary)' }}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total API Calls</p>
            <h2 className="stat-value">{assistantConfig ? '12' : '0'}</h2>
            <p className="stat-trend positive">{assistantConfig ? '+12 today' : 'No activity'}</p>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(0, 229, 255, 0.2)', color: 'var(--secondary)' }}>
            <Database size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Active Models</p>
            <h2 className="stat-value">{assistantConfig ? '1' : '0'}</h2>
            <p className="stat-trend">{assistantConfig ? 'Call Assistant' : 'None installed'}</p>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Tokens Used</p>
            <h2 className="stat-value">{assistantConfig ? '4,250' : '0'}</h2>
            <p className="stat-trend">{assistantConfig ? '~$0.04 estimated cost' : '$0.00'}</p>
          </div>
        </div>
      </div>

      <div className="chart-section glass-panel">
        <h3>Usage Over Time</h3>
        <div className="mock-chart-large">
          <div className="bar" style={{height: '10%'}}></div>
          <div className="bar" style={{height: '20%'}}></div>
          <div className="bar" style={{height: '15%'}}></div>
          <div className="bar" style={{height: '30%'}}></div>
          <div className="bar" style={{height: '25%'}}></div>
          <div className="bar" style={{height: assistantConfig ? '80%' : '10%'}}></div>
          <div className="bar" style={{height: assistantConfig ? '95%' : '0%'}}></div>
        </div>
      </div>
    </div>
  );
};

const Catalog = () => {
  const navigate = useNavigate();
  return (
    <div className="dashboard-catalog animate-fade-in">
      <div className="dashboard-header">
        <h1 className="font-heading">AI App Store</h1>
        <p className="text-muted">Discover and integrate new AI capabilities into your business.</p>
      </div>
      <div className="catalog-grid">
        <div className="app-card glass-panel" style={{borderColor: 'var(--primary)', boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)'}}>
          <div className="app-header">
             <div className="app-icon" style={{background: 'linear-gradient(135deg, #8B5CF6, #00E5FF)'}}>📞</div>
             <div className="app-badge">Hot</div>
          </div>
          <h3>AI Call Assistant</h3>
          <p className="text-muted">A hyper-realistic voice agent that answers calls, books appointments, and sounds perfectly human.</p>
          <button className="btn-primary" style={{width: '100%', marginTop: '1rem'}} onClick={() => navigate('/setup-wizard')}>Configure Assistant</button>
        </div>
        
        <div className="app-card glass-panel" style={{borderColor: 'var(--secondary)', boxShadow: '0 0 20px rgba(0, 229, 255, 0.2)'}}>
          <div className="app-header">
             <div className="app-icon" style={{background: 'linear-gradient(135deg, #25D366, #128C7E)'}}>💬</div>
             <div className="app-badge" style={{background: '#25D366'}}>Nieuw</div>
          </div>
          <h3>AI Personal Assistant</h3>
          <p className="text-muted">Laat een AI je WhatsApp, Gmail en Agenda beheren. Geef taken en hij voert ze uit als een echte assistent.</p>
          <button className="btn-primary" style={{width: '100%', marginTop: '1rem', background: 'linear-gradient(135deg, #25D366, #128C7E)'}} onClick={() => navigate('/dashboard/whatsapp')}>Test Integratie</button>
        </div>
        
        <div className="app-card glass-panel">
          <div className="app-header">
             <div className="app-icon" style={{background: 'linear-gradient(135deg, #43e97b, #38f9d7)'}}>📈</div>
          </div>
          <h3>Sales Predictor AI</h3>
          <p className="text-muted">Analyze your CRM data to predict which leads will convert with 94% accuracy.</p>
          <button className="btn-secondary" style={{width: '100%', marginTop: '1rem'}}>Install</button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-content">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/whatsapp" element={<WhatsAppAgent />} />
          <Route path="*" element={<Overview />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
