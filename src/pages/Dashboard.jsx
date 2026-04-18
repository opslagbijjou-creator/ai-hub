import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  CreditCard,
  Database,
  Phone,
  PhoneCall,
  RefreshCcw,
  Settings,
  UploadCloud,
  Users,
  X
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { apiUrl } from '../lib/api';
import CallStudio from './CallStudio';
import './Dashboard.css';

const StatusPill = ({ label, value }) => (
  <div
    className="glass-panel"
    style={{
      padding: '0.45rem 0.75rem',
      display: 'inline-flex',
      gap: '0.4rem',
      alignItems: 'center',
      borderRadius: '999px'
    }}
  >
    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{label}</span>
    <strong style={{ fontSize: '0.82rem' }}>{value || '-'}</strong>
  </div>
);

const KnowledgeBase = () => {
  const { knowledgeBase, setKnowledgeBase } = useAppContext();
  const [urlInput, setUrlInput] = useState('');

  const handleAddUrl = () => {
    const cleaned = urlInput.trim();
    if (!cleaned || knowledgeBase.urls.includes(cleaned)) return;
    setKnowledgeBase({ ...knowledgeBase, urls: [...knowledgeBase.urls, cleaned] });
    setUrlInput('');
  };

  const handleRemoveUrl = (url) => {
    setKnowledgeBase({
      ...knowledgeBase,
      urls: knowledgeBase.urls.filter((entry) => entry !== url)
    });
  };

  return (
    <div className="dashboard-knowledge animate-fade-in" style={{ padding: '2rem' }}>
      <div className="dashboard-header">
        <h1 className="font-heading">Knowledge Base</h1>
        <p className="text-muted">
          Voeg websites en documenten toe zodat je telefoon-assistent de juiste bedrijfsinformatie gebruikt.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Website bronnen</h3>
          <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
            Deze bronnen gebruik je als context voor antwoorden tijdens calls.
          </p>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="https://www.jouwwebsite.nl"
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              style={{
                flex: 1,
                padding: '10px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-main)',
                borderRadius: '8px'
              }}
            />
            <button className="btn-primary" onClick={handleAddUrl}>
              Toevoegen
            </button>
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {knowledgeBase.urls.map((url) => (
              <li
                key={url}
                className="glass-panel"
                style={{
                  padding: '0.75rem 0.9rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-surface-hover)'
                }}
              >
                <span>{url}</span>
                <button style={{ color: '#ef4444' }} onClick={() => handleRemoveUrl(url)}>
                  <X size={16} />
                </button>
              </li>
            ))}
            {knowledgeBase.urls.length === 0 && <p className="text-muted">Nog geen URL's toegevoegd.</p>}
          </ul>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            border: '2px dashed var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}
        >
          <UploadCloud size={50} color="var(--primary)" style={{ marginBottom: '0.8rem' }} />
          <h3>Document upload</h3>
          <p className="text-muted" style={{ marginTop: '0.6rem', marginBottom: '1rem' }}>
            Upload van PDF/DOCX volgt in de volgende iteratie. URL bronnen werken nu al.
          </p>
          <button className="btn-secondary">Binnenkort beschikbaar</button>
        </div>
      </div>
    </div>
  );
};

const Overview = () => {
  const navigate = useNavigate();
  const { assistantConfig, setAssistantConfig } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assistantState, setAssistantState] = useState(null);
  const [usageSummary, setUsageSummary] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState({
    companyName: '',
    openingHours: '',
    pricing: '',
    goals: '',
    toneOfVoice: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceNotice, setInvoiceNotice] = useState('');

  const authFetch = useCallback(async (path, options = {}) => {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Geen actieve sessie.');
    }

    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${session.access_token}`
    };

    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(apiUrl(path), {
      ...options,
      headers
    });
  }, []);

  const hydrateContextFromState = useCallback(
    (statePayload) => {
      const profile = statePayload?.profile || {};
      const voice = statePayload?.voice || {};
      const number = statePayload?.number || {};
      const assistant = statePayload?.assistant || {};

      if (!assistant?.id && !profile?.company_name) return;

      setAssistantConfig({
        companyName: profile?.company_name || assistant?.display_name || 'Mijn Bedrijf',
        voice: voice?.display_name || 'Niet gekozen',
        voiceKey: voice?.voice_key || null,
        phoneNumber: number?.e164 || 'Nog niet gekozen',
        assistantId: assistant?.id,
        liveStatus: assistant?.live_status,
        billingStatus: assistant?.billing_status
      });
    },
    [setAssistantConfig]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [stateRes, usageRes] = await Promise.all([
        authFetch('/api/assistant/state'),
        authFetch('/api/usage/summary')
      ]);

      const statePayload = await stateRes.json();
      const usagePayload = await usageRes.json();

      if (!stateRes.ok) throw new Error(statePayload?.error || 'Kon assistant state niet laden.');
      if (!usageRes.ok) throw new Error(usagePayload?.error || 'Kon usage niet laden.');

      setAssistantState(statePayload);
      setUsageSummary(usagePayload);
      hydrateContextFromState(statePayload);

      setSettingsDraft({
        companyName: statePayload?.profile?.company_name || statePayload?.assistant?.display_name || '',
        openingHours: statePayload?.profile?.opening_hours || '',
        pricing: statePayload?.profile?.pricing || '',
        goals: statePayload?.profile?.goals || '',
        toneOfVoice: statePayload?.profile?.tone_of_voice || 'vriendelijk en professioneel'
      });
    } catch (loadError) {
      setError(loadError?.message || 'Kon dashboardgegevens niet laden.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, hydrateContextFromState]);

  const saveSettings = async () => {
    setSaveLoading(true);
    setError('');

    try {
      const response = await authFetch('/api/onboarding/save', {
        method: 'POST',
        body: JSON.stringify({
          companyName: settingsDraft.companyName,
          openingHours: settingsDraft.openingHours,
          pricing: settingsDraft.pricing,
          goals: settingsDraft.goals,
          toneOfVoice: settingsDraft.toneOfVoice,
          voiceKey: assistantState?.voice?.voice_key,
          numberE164: assistantState?.number?.e164,
          planKey: assistantState?.assistant?.desired_plan || 'plan_150'
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Instellingen opslaan mislukt.');
      }

      setShowSettings(false);
      await loadData();
    } catch (saveError) {
      setError(saveError?.message || 'Opslaan mislukt.');
    } finally {
      setSaveLoading(false);
    }
  };

  const requestInvoice = async () => {
    setInvoiceLoading(true);
    setInvoiceNotice('');

    try {
      const response = await authFetch('/api/invoice/request', {
        method: 'POST',
        body: JSON.stringify({
          planKey: assistantState?.assistant?.desired_plan || 'plan_150'
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Factuuraanvraag mislukt.');
      }

      setInvoiceNotice(`Factuur ${payload?.invoice?.invoice_number || ''} staat op ${payload?.invoice?.status}.`);
      await loadData();
    } catch (invoiceError) {
      setInvoiceNotice(invoiceError?.message || 'Kon factuur niet aanvragen.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const usage = usageSummary?.usage;

  const stats = useMemo(
    () => [
      {
        label: 'Minutes Used',
        value: usage ? `${usage.minutesUsed}` : '0',
        trend: usage ? `${usage.includedMinutes} inbegrepen` : 'Geen data',
        icon: <PhoneCall size={22} />,
        iconStyle: { background: 'rgba(139, 92, 246, 0.2)', color: 'var(--primary)' }
      },
      {
        label: 'Tasks Used',
        value: usage ? `${usage.tasksUsed}` : '0',
        trend: usage ? `${usage.includedTasks} inbegrepen` : 'Geen data',
        icon: <Activity size={22} />,
        iconStyle: { background: 'rgba(0, 229, 255, 0.2)', color: 'var(--secondary)' }
      },
      {
        label: 'Expected Invoice',
        value: usage ? `€${usage.expectedInvoiceEur}` : '€0',
        trend: usage ? `Overage €${usage.overageEstimateEur}` : 'Geen data',
        icon: <CreditCard size={22} />,
        iconStyle: { background: 'rgba(16, 185, 129, 0.2)', color: '#10B981' }
      }
    ],
    [usage]
  );

  return (
    <div className="dashboard-overview animate-fade-in" style={{ position: 'relative' }}>
      <div className="dashboard-header" style={{ marginBottom: '1.2rem' }}>
        <h1 className="font-heading">
          Welcome back{assistantConfig?.companyName ? `, ${assistantConfig.companyName}` : ''}
        </h1>
        <p className="text-muted">Call-only dashboard. WhatsApp is volledig uit scope gehaald.</p>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <StatusPill label="Live" value={assistantState?.assistant?.live_status || 'not_live'} />
        <StatusPill label="Billing" value={assistantState?.assistant?.billing_status || 'none'} />
        <StatusPill label="Plan" value={assistantState?.plan?.name || 'Starter'} />
        <button className="btn-secondary" onClick={loadData} disabled={loading}>
          <RefreshCcw size={16} /> Vernieuw
        </button>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '0.8rem', marginBottom: '1rem', borderColor: 'rgba(239,68,68,0.45)' }}>
          {error}
        </div>
      )}

      {invoiceNotice && (
        <div className="glass-panel" style={{ padding: '0.8rem', marginBottom: '1rem', borderColor: 'rgba(16,185,129,0.45)' }}>
          {invoiceNotice}
        </div>
      )}

      <div
        className="active-assistant-banner glass-panel"
        style={{
          padding: '1.25rem',
          marginBottom: '1.5rem',
          borderLeft: '4px solid var(--primary)',
          background: 'rgba(139, 92, 246, 0.06)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <Phone size={24} color="white" />
            </div>
            <div>
              <h2 className="font-heading" style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>
                AI Bel-Assistent
              </h2>
              <p className="text-muted" style={{ margin: 0 }}>
                Nummer: <strong>{assistantState?.number?.e164 || assistantConfig?.phoneNumber || 'Nog niet gekozen'}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => setShowSettings(true)}>
              <Settings size={15} /> Instellingen
            </button>
            <button className="btn-secondary" onClick={() => navigate('/dashboard/call-studio')}>
              <PhoneCall size={15} /> Web Test
            </button>
            <button className="btn-primary" onClick={requestInvoice} disabled={invoiceLoading || loading}>
              <CreditCard size={15} /> {invoiceLoading ? 'Bezig...' : 'Factuur Aanvragen'}
            </button>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card glass-panel">
            <div className="stat-icon" style={stat.iconStyle}>
              {stat.icon}
            </div>
            <div className="stat-info" style={{ gap: '0.35rem' }}>
              <p className="stat-label">{stat.label}</p>
              <h2 className="stat-value">{stat.value}</h2>
              <p className="stat-trend">{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="chart-section glass-panel" style={{ marginBottom: 0 }}>
        <h3 style={{ marginBottom: '0.85rem' }}>Provisioning flow</h3>
        <p className="text-muted" style={{ marginBottom: '1rem' }}>
          invoice_sent -&gt; paid_approved -&gt; provisioning -&gt; live
        </p>
        <div className="mock-chart-large" style={{ height: '140px' }}>
          <div className="bar" style={{ height: assistantState?.latestInvoice ? '80%' : '10%' }}></div>
          <div className="bar" style={{ height: assistantState?.assistant?.billing_status === 'paid_approved' ? '85%' : '15%' }}></div>
          <div
            className="bar"
            style={{
              height:
                assistantState?.latestProvisioningJob?.status === 'processing' ||
                assistantState?.latestProvisioningJob?.status === 'success'
                  ? '90%'
                  : '20%'
            }}
          ></div>
          <div className="bar" style={{ height: assistantState?.assistant?.live_status === 'live' ? '100%' : '25%' }}></div>
        </div>
      </div>

      {showSettings && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.62)',
            backdropFilter: 'blur(4px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100
          }}
        >
          <div className="glass-panel" style={{ width: 'min(620px, 92vw)', padding: '1.5rem', position: 'relative' }}>
            <button
              onClick={() => setShowSettings(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-main)' }}
            >
              <X size={20} />
            </button>

            <h2 className="font-heading" style={{ marginBottom: '1rem' }}>
              Assistent instellingen
            </h2>

            {[
              { id: 'companyName', label: 'Bedrijfsnaam' },
              { id: 'openingHours', label: 'Openingstijden' },
              { id: 'pricing', label: 'Prijzen / Tarieven' },
              { id: 'goals', label: 'Doel van gesprek' },
              { id: 'toneOfVoice', label: 'Tone of voice' }
            ].map((field) => (
              <div key={field.id} className="form-group" style={{ marginTop: '0.8rem' }}>
                <label>{field.label}</label>
                <input
                  type="text"
                  className="glass-input"
                  value={settingsDraft[field.id] || ''}
                  onChange={(event) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      [field.id]: event.target.value
                    }))
                  }
                />
              </div>
            ))}

            <button className="btn-primary" style={{ marginTop: '1rem', width: '100%' }} onClick={saveSettings} disabled={saveLoading}>
              {saveLoading ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Catalog = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-catalog animate-fade-in">
      <div className="dashboard-header">
        <h1 className="font-heading">AI App Store</h1>
        <p className="text-muted">Call-only modules voor onboarding, testen en livegang.</p>
      </div>

      <div className="catalog-grid">
        <div className="app-card glass-panel" style={{ borderColor: 'var(--primary)', boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)' }}>
          <div className="app-header">
            <div className="app-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6, #00E5FF)' }}>
              📞
            </div>
            <div className="app-badge">Actief</div>
          </div>
          <h3>AI Bel-Assistent</h3>
          <p className="text-muted">
            Onboarding, web call test met animatiestates, usage tracking en provisioning na betaling.
          </p>
          <button className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => navigate('/setup-wizard')}>
            Setup wizard
          </button>
        </div>

        <div className="app-card glass-panel" style={{ borderColor: 'var(--secondary)', boxShadow: '0 0 20px rgba(0, 229, 255, 0.18)' }}>
          <div className="app-header">
            <div className="app-icon" style={{ background: 'linear-gradient(135deg, #0EA5E9, #22D3EE)' }}>
              🧪
            </div>
            <div className="app-badge" style={{ background: '#0EA5E9' }}>
              MVP 2.0
            </div>
          </div>
          <h3>Call Studio</h3>
          <p className="text-muted">Praat direct via browsermicrofoon met je AI en volg realtime states.</p>
          <button className="btn-secondary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => navigate('/dashboard/call-studio')}>
            Open Studio
          </button>
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
          <Route path="/call-studio" element={<CallStudio />} />
          <Route path="*" element={<Overview />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
