import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  CreditCard,
  Link2,
  PackageSearch,
  Phone,
  PhoneCall,
  PlugZap,
  RefreshCcw,
  Settings,
  ShoppingCart,
  Unplug,
  UploadCloud,
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
    <div className="dashboard-knowledge animate-fade-in">
      <div className="dashboard-header">
        <h1 className="font-heading">Knowledge Base</h1>
        <p className="text-muted">
          Voeg websites en documenten toe zodat je telefoon-assistent de juiste bedrijfsinformatie gebruikt.
        </p>
      </div>

      <div className="kb-grid">
        <div className="glass-panel kb-card">
          <h3 style={{ marginBottom: '0.5rem' }}>Website bronnen</h3>
          <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
            Deze bronnen gebruik je als context voor antwoorden tijdens calls.
          </p>

          <div className="kb-input-row">
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

          <ul className="kb-list">
            {knowledgeBase.urls.map((url) => (
              <li
                key={url}
                className="glass-panel kb-list-item"
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

        <div className="glass-panel kb-upload-panel">
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
  const { assistantConfig, setAssistantConfig, apiConfigured, apiConfigMessage } = useAppContext();

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
  const [integrations, setIntegrations] = useState([]);
  const [integrationDraft, setIntegrationDraft] = useState({
    provider: 'shopify',
    storeUrl: '',
    accessToken: '',
    apiKey: ''
  });
  const [integrationSaving, setIntegrationSaving] = useState(false);
  const [integrationNotice, setIntegrationNotice] = useState('');
  const [orderLookupDraft, setOrderLookupDraft] = useState({
    provider: '',
    orderReference: '',
    email: ''
  });
  const [orderLookupLoading, setOrderLookupLoading] = useState(false);
  const [orderLookupResult, setOrderLookupResult] = useState(null);

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
      setIntegrations(Array.isArray(statePayload?.integrations) ? statePayload.integrations : []);
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

  const connectIntegration = async () => {
    setIntegrationSaving(true);
    setIntegrationNotice('');

    try {
      const payload = {
        provider: integrationDraft.provider,
        storeUrl: integrationDraft.storeUrl
      };

      if (integrationDraft.provider === 'shopify') {
        payload.accessToken = integrationDraft.accessToken;
      }

      if (integrationDraft.provider === 'prestashop') {
        payload.apiKey = integrationDraft.apiKey;
      }

      const response = await authFetch('/api/integrations/connect', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Koppeling opslaan mislukt.');
      }

      setIntegrationNotice(`${integrationDraft.provider} is gekoppeld.`);
      setIntegrationDraft((prev) => ({
        ...prev,
        accessToken: '',
        apiKey: ''
      }));
      await loadData();
    } catch (connectError) {
      setIntegrationNotice(connectError?.message || 'Kon webshop koppeling niet opslaan.');
    } finally {
      setIntegrationSaving(false);
    }
  };

  const disconnectIntegration = async (provider) => {
    setIntegrationSaving(true);
    setIntegrationNotice('');

    try {
      const response = await authFetch('/api/integrations/disconnect', {
        method: 'POST',
        body: JSON.stringify({ provider })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Loskoppelen mislukt.');
      }

      setIntegrationNotice(`${provider} is losgekoppeld.`);
      await loadData();
    } catch (disconnectError) {
      setIntegrationNotice(disconnectError?.message || 'Kon koppeling niet loskoppelen.');
    } finally {
      setIntegrationSaving(false);
    }
  };

  const testOrderLookup = async () => {
    setOrderLookupLoading(true);
    setOrderLookupResult(null);
    setIntegrationNotice('');

    try {
      const response = await authFetch('/api/integrations/order-status', {
        method: 'POST',
        body: JSON.stringify({
          provider: orderLookupDraft.provider || undefined,
          orderReference: orderLookupDraft.orderReference,
          email: orderLookupDraft.email
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Orderstatus ophalen mislukt.');
      }

      setOrderLookupResult(data);
    } catch (lookupError) {
      setOrderLookupResult({
        success: false,
        message: lookupError?.message || 'Orderstatus ophalen mislukt.'
      });
    } finally {
      setOrderLookupLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const usage = usageSummary?.usage;
  const connectedIntegrations = integrations.filter((entry) => entry.status === 'connected');

  const stats = useMemo(
    () => [
      {
        label: 'Minutes Used',
        value: usage ? `${usage.minutesUsed}` : '0',
        trend: usage ? `${usage.includedMinutes} inbegrepen` : 'Geen data',
        icon: <PhoneCall size={22} />,
        iconStyle: { background: 'color-mix(in srgb, var(--primary) 20%, transparent)', color: 'var(--primary)' }
      },
      {
        label: 'Tasks Used',
        value: usage ? `${usage.tasksUsed}` : '0',
        trend: usage ? `${usage.includedTasks} inbegrepen` : 'Geen data',
        icon: <Activity size={22} />,
        iconStyle: {
          background: 'color-mix(in srgb, var(--secondary) 22%, transparent)',
          color: 'var(--secondary)'
        }
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

      {!apiConfigured && (
        <div className="glass-panel" style={{ padding: '0.8rem', marginBottom: '1rem', borderColor: 'rgba(245,158,11,0.45)' }}>
          {apiConfigMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <StatusPill label="Live" value={assistantState?.assistant?.live_status || 'not_live'} />
        <StatusPill label="Billing" value={assistantState?.assistant?.billing_status || 'none'} />
        <StatusPill label="Plan" value={assistantState?.plan?.name || 'Launch'} />
        <StatusPill
          label="Overage"
          value={`€${Number(assistantState?.plan?.overageMinuteEur || 0).toFixed(2)}/min`}
        />
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
          background: 'color-mix(in srgb, var(--primary) 8%, transparent)'
        }}
      >
        <div className="assistant-banner-row">
          <div className="assistant-banner-main">
            <div className="assistant-avatar">
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

          <div className="assistant-actions">
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

      <div className="glass-panel commerce-panel">
        <div className="commerce-panel-header">
          <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <ShoppingCart size={18} /> Webshop koppelingen
          </h3>
          <p className="text-muted">
            Koppel je shop zodat de assistent orderstatus kan ophalen tijdens gesprekken.
          </p>
        </div>

        {integrationNotice && (
          <div className="glass-panel" style={{ padding: '0.7rem 0.8rem', marginBottom: '0.85rem' }}>
            {integrationNotice}
          </div>
        )}

        <div className="commerce-grid">
          <div className="commerce-connect">
            <label>
              Provider
              <select
                className="glass-input"
                value={integrationDraft.provider}
                onChange={(event) =>
                  setIntegrationDraft((prev) => ({
                    ...prev,
                    provider: event.target.value
                  }))}
              >
                <option value="shopify">Shopify</option>
                <option value="prestashop">PrestaShop</option>
              </select>
            </label>

            <label>
              Store URL
              <input
                type="text"
                className="glass-input"
                placeholder="https://jouwshop.myshopify.com"
                value={integrationDraft.storeUrl}
                onChange={(event) =>
                  setIntegrationDraft((prev) => ({
                    ...prev,
                    storeUrl: event.target.value
                  }))}
              />
            </label>

            {integrationDraft.provider === 'shopify' && (
              <label>
                Shopify Admin Access Token
                <input
                  type="password"
                  className="glass-input"
                  placeholder="shpat_..."
                  value={integrationDraft.accessToken}
                  onChange={(event) =>
                    setIntegrationDraft((prev) => ({
                      ...prev,
                      accessToken: event.target.value
                    }))}
                />
              </label>
            )}

            {integrationDraft.provider === 'prestashop' && (
              <label>
                PrestaShop API Key
                <input
                  type="password"
                  className="glass-input"
                  placeholder="API sleutel"
                  value={integrationDraft.apiKey}
                  onChange={(event) =>
                    setIntegrationDraft((prev) => ({
                      ...prev,
                      apiKey: event.target.value
                    }))}
                />
              </label>
            )}

            <button
              className="btn-primary"
              disabled={integrationSaving || !integrationDraft.storeUrl.trim()}
              onClick={connectIntegration}
            >
              <PlugZap size={15} />
              {integrationSaving ? 'Opslaan...' : 'Koppeling opslaan'}
            </button>
          </div>

          <div className="commerce-status">
            <h4 style={{ marginBottom: '0.55rem' }}>Actieve koppelingen</h4>

            {connectedIntegrations.length === 0 && (
              <p className="text-muted">Nog geen actieve webshop koppeling.</p>
            )}

            {connectedIntegrations.map((integration) => (
              <div key={integration.id} className="glass-panel commerce-integration-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Link2 size={15} />
                  <strong>{String(integration.provider || '').toUpperCase()}</strong>
                </div>
                <span className="text-muted">{integration.storeUrl}</span>
                <button
                  className="btn-secondary"
                  onClick={() => disconnectIntegration(integration.provider)}
                  disabled={integrationSaving}
                >
                  <Unplug size={14} /> Loskoppelen
                </button>
              </div>
            ))}

            <div className="glass-panel commerce-lookup-box">
              <h4 style={{ marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <PackageSearch size={16} /> Orderstatus test
              </h4>

              <div className="commerce-lookup-fields">
                <select
                  className="glass-input"
                  value={orderLookupDraft.provider}
                  onChange={(event) =>
                    setOrderLookupDraft((prev) => ({ ...prev, provider: event.target.value }))}
                >
                  <option value="">Auto (eerste actieve)</option>
                  <option value="shopify">Shopify</option>
                  <option value="prestashop">PrestaShop</option>
                </select>

                <input
                  type="text"
                  className="glass-input"
                  placeholder="Ordernummer (bijv. #1001)"
                  value={orderLookupDraft.orderReference}
                  onChange={(event) =>
                    setOrderLookupDraft((prev) => ({ ...prev, orderReference: event.target.value }))}
                />

                <input
                  type="email"
                  className="glass-input"
                  placeholder="Klant e-mail (optioneel)"
                  value={orderLookupDraft.email}
                  onChange={(event) =>
                    setOrderLookupDraft((prev) => ({ ...prev, email: event.target.value }))}
                />
              </div>

              <button
                className="btn-secondary"
                onClick={testOrderLookup}
                disabled={orderLookupLoading || !orderLookupDraft.orderReference.trim()}
              >
                <RefreshCcw size={14} /> {orderLookupLoading ? 'Zoeken...' : 'Check orderstatus'}
              </button>

              {orderLookupResult && (
                <div className="glass-panel commerce-lookup-result">
                  {orderLookupResult?.found ? (
                    <p>
                      <strong>{orderLookupResult?.order?.orderReference}</strong> -
                      {' '}
                      {orderLookupResult?.order?.status}
                      {orderLookupResult?.order?.paymentStatus
                        ? ` (betaling: ${orderLookupResult.order.paymentStatus})`
                        : ''}
                    </p>
                  ) : (
                    <p>{orderLookupResult?.message || 'Geen order gevonden.'}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
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
        <div className="modal-overlay">
          <div className="glass-panel settings-modal">
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
        <div
          className="app-card glass-panel"
          style={{
            borderColor: 'var(--primary)',
            boxShadow: '0 0 20px color-mix(in srgb, var(--primary) 24%, transparent)'
          }}
        >
          <div className="app-header">
            <div className="app-icon" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
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

        <div
          className="app-card glass-panel"
          style={{
            borderColor: 'var(--secondary)',
            boxShadow: '0 0 20px color-mix(in srgb, var(--secondary) 22%, transparent)'
          }}
        >
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
