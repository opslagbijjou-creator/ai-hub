import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Link2,
  Mail,
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
import AdminConsole from './AdminConsole';
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

const PROVIDER_LABELS = {
  shopify: 'Shopify',
  prestashop: 'PrestaShop',
  woocommerce: 'WooCommerce'
};

const INTEGRATION_STATUS_LABELS = {
  connected: 'Live gekoppeld',
  pending_setup: 'Wij koppelen dit voor je',
  disconnected: 'Losgekoppeld',
  error: 'Actie nodig'
};

const SetupStepCard = ({ title, description, done, tone = 'default' }) => (
  <div className={`setup-step-card ${done ? 'is-done' : ''} tone-${tone}`}>
    <div className="setup-step-icon">
      <CheckCircle2 size={18} />
    </div>
    <div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="setup-detail-row">
    <span>{label}</span>
    <strong>{value || '-'}</strong>
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
  const { assistantConfig, setAssistantConfig, apiConfigured, apiConfigMessage, isAdmin } = useAppContext();

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
    mode: 'concierge',
    storeUrl: '',
    contactEmail: '',
    setupNotes: '',
    accessToken: '',
    apiKey: '',
    apiSecret: ''
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
        storeUrl: integrationDraft.storeUrl,
        mode: integrationDraft.mode,
        contactEmail: integrationDraft.contactEmail,
        setupNotes: integrationDraft.setupNotes
      };

      if (integrationDraft.mode === 'self_service' && integrationDraft.provider === 'shopify') {
        payload.accessToken = integrationDraft.accessToken;
      }

      if (integrationDraft.mode === 'self_service' && integrationDraft.provider === 'prestashop') {
        payload.apiKey = integrationDraft.apiKey;
      }

      if (integrationDraft.mode === 'self_service' && integrationDraft.provider === 'woocommerce') {
        payload.apiKey = integrationDraft.apiKey;
        payload.apiSecret = integrationDraft.apiSecret;
      }

      const response = await authFetch('/api/integrations/connect', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Koppeling opslaan mislukt.');
      }

      setIntegrationNotice(
        data?.mode === 'concierge'
          ? `${PROVIDER_LABELS[integrationDraft.provider] || integrationDraft.provider} staat klaar. Wij koppelen dit voor je op de achtergrond.`
          : `${PROVIDER_LABELS[integrationDraft.provider] || integrationDraft.provider} is direct gekoppeld.`
      );
      setIntegrationDraft((prev) => ({
        ...prev,
        storeUrl: '',
        contactEmail: prev.contactEmail,
        setupNotes: '',
        accessToken: '',
        apiKey: '',
        apiSecret: ''
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

  const commerceSectionRef = useRef(null);
  const usage = usageSummary?.usage;
  const connectedIntegrations = integrations.filter((entry) => entry.status === 'connected');
  const pendingIntegrations = integrations.filter((entry) => entry.status === 'pending_setup');
  const companyName =
    assistantState?.profile?.company_name || assistantState?.assistant?.display_name || assistantConfig?.companyName || 'je bedrijf';
  const identityName = assistantState?.identity?.name || assistantState?.assistant?.display_name || companyName;
  const identityAvatar = assistantState?.identity?.avatar?.imageUrl || null;
  const wizardChecklist = Array.isArray(assistantState?.wizard?.checklist) ? assistantState.wizard.checklist : [];
  const wizardStep = Number(assistantState?.wizard?.step || 1);
  const wizardCompletedCount =
    Number(assistantState?.wizard?.completedCount) ||
    wizardChecklist.filter((entry) => entry.done).length;
  const hasBusinessProfile = Boolean(
    assistantState?.profile?.company_name &&
      (assistantState?.profile?.goals || assistantState?.profile?.opening_hours || assistantState?.profile?.pricing)
  );
  const hasVoiceAndNumber = Boolean(assistantState?.voice?.voice_key && assistantState?.number?.e164);
  const hasCommerceFlow = Boolean(connectedIntegrations.length || pendingIntegrations.length);
  const isInvoiceRequested = ['invoice_sent', 'paid_approved', 'active', 'past_due'].includes(
    assistantState?.latestInvoice?.status || assistantState?.assistant?.billing_status || ''
  );
  const isLive = assistantState?.assistant?.live_status === 'live';
  const fallbackSetupSteps = [
    {
      title: 'Bedrijfsbriefing',
      description: hasBusinessProfile
        ? 'Je assistent heeft genoeg context over je bedrijf.'
        : 'Voeg bedrijfsnaam, openingstijden en doelen toe.',
      done: hasBusinessProfile,
      tone: 'soft'
    },
    {
      title: 'Stem en nummer',
      description: hasVoiceAndNumber
        ? 'Stem en voorkeursnummer zijn gekozen.'
        : 'Kies de stem en het nummer dat live moet gaan.',
      done: hasVoiceAndNumber,
      tone: 'warm'
    },
    {
      title: 'Kennis en webshop',
      description: connectedIntegrations.length
        ? 'Je webshop is gekoppeld voor orderstatus.'
        : pendingIntegrations.length
          ? 'Wij zijn je shopkoppeling op de achtergrond aan het afronden.'
          : 'Koppel je shop of laat ons dit voor je regelen.',
      done: hasCommerceFlow,
      tone: 'success'
    },
    {
      title: 'Test en livegang',
      description: isLive
        ? 'Je assistent staat live op het gekozen nummer.'
        : isInvoiceRequested
          ? 'Betaling of provisioning loopt. Je kunt intussen blijven testen.'
          : 'Test in de browser en vraag daarna activatie aan.',
      done: isLive,
      tone: 'default'
    }
  ];
  const setupSteps = wizardChecklist.length
    ? wizardChecklist.map((entry, index) => ({
      title: entry.label,
      description: entry.description || `Stap ${index + 1} in setup flow`,
      done: Boolean(entry.done),
      tone: entry.done ? 'success' : 'default'
    }))
    : fallbackSetupSteps;
  const completedSteps = wizardChecklist.length ? wizardCompletedCount : setupSteps.filter((step) => step.done).length;
  const integrationButtonDisabled =
    integrationSaving ||
    !integrationDraft.storeUrl.trim() ||
    (integrationDraft.mode === 'self_service' &&
      ((integrationDraft.provider === 'shopify' && !integrationDraft.accessToken.trim()) ||
        (integrationDraft.provider === 'prestashop' && !integrationDraft.apiKey.trim()) ||
        (integrationDraft.provider === 'woocommerce' &&
          (!integrationDraft.apiKey.trim() || !integrationDraft.apiSecret.trim()))));

  const nextAction = useMemo(() => {
    if (!hasBusinessProfile || !hasVoiceAndNumber) {
      return {
        eyebrow: 'Aanbevolen volgende stap',
        title: 'Maak eerst je basis compleet',
        description: 'Werk je briefing, stem en nummer af in de setup wizard zodat de assistent goed klinkt en de juiste antwoorden geeft.',
        cta: 'Ga naar setup wizard',
        actionKey: 'wizard'
      };
    }

    if (!hasCommerceFlow) {
      return {
        eyebrow: 'Volgende stap',
        title: 'Koppel je webshop zonder technisch gedoe',
        description: 'Je klant hoeft alleen het platform en de shop-URL te kiezen. Jij rondt de technische koppeling later af in admin.',
        cta: 'Open shop setup',
        actionKey: 'commerce'
      };
    }

    if (!isInvoiceRequested) {
      return {
        eyebrow: 'Bijna live',
        title: 'Test je assistent en vraag activatie aan',
        description: 'Voer nog een webtest uit en vraag daarna de factuur aan. Na goedkeuring kan het nummer live.',
        cta: 'Vraag activatie aan',
        actionKey: 'invoice'
      };
    }

    if (!isLive) {
      return {
        eyebrow: 'Provisioning bezig',
        title: 'Je livegang is in voorbereiding',
        description: 'Je aanvraag staat klaar. Gebruik de webtest om scripts te finetunen terwijl provisioning of admin approval loopt.',
        cta: 'Open Call Studio',
        actionKey: 'studio'
      };
    }

    return {
      eyebrow: 'Live',
      title: 'Je assistent staat nu live',
      description: 'Gebruik de studio en het dashboard om gesprekken, usage en shopvragen te blijven verbeteren.',
      cta: 'Open Call Studio',
      actionKey: 'studio'
    };
  }, [hasBusinessProfile, hasCommerceFlow, hasVoiceAndNumber, isInvoiceRequested, isLive]);

  const stats = useMemo(
    () => [
      {
        label: 'Belminuten',
        value: usage ? `${usage.minutesUsed}` : '0',
        trend: usage ? `${usage.includedMinutes} inbegrepen` : 'Geen data',
        icon: <PhoneCall size={22} />,
        iconStyle: { background: 'color-mix(in srgb, var(--primary) 20%, transparent)', color: 'var(--primary)' }
      },
      {
        label: 'Taken',
        value: usage ? `${usage.tasksUsed}` : '0',
        trend: usage ? `${usage.includedTasks} inbegrepen` : 'Geen data',
        icon: <Activity size={22} />,
        iconStyle: {
          background: 'color-mix(in srgb, var(--secondary) 22%, transparent)',
          color: 'var(--secondary)'
        }
      },
      {
        label: 'Verwachte factuur',
        value: usage ? `€${usage.expectedInvoiceEur}` : '€0',
        trend: usage ? `Overage €${usage.overageEstimateEur}` : 'Geen data',
        icon: <CreditCard size={22} />,
        iconStyle: { background: 'rgba(16, 185, 129, 0.2)', color: '#10B981' }
      }
    ],
    [usage]
  );

  return (
    <div className="dashboard-overview dashboard-shell animate-fade-in" style={{ position: 'relative' }}>
      <div className="dashboard-header dashboard-header-tight">
        <span className="dashboard-eyebrow">Setup Hub</span>
        <h1 className="font-heading">Bouw {companyName} als één rustige flow</h1>
        <p className="text-muted">
          Geen losse blokken of technisch gedoe. Je klanten vullen alleen in wat de assistent moet weten, en koppelingen kunnen wij later voor ze afronden.
          {isAdmin ? ' Je adminconsole staat ook voor je klaar in het menu.' : ''}
        </p>
      </div>

      <section className="glass-panel dashboard-setup-strip">
        <div className="dashboard-setup-strip-main">
          <div className="dashboard-identity-pill">
            {identityAvatar ? (
              <img src={identityAvatar} alt={identityName} className="dashboard-avatar" />
            ) : (
              <div className="dashboard-avatar fallback">{identityName?.slice(0, 1) || 'A'}</div>
            )}
            <div>
              <strong>{identityName}</strong>
              <small>
                Stap {wizardStep} van {setupSteps.length} · {completedSteps} klaar
              </small>
            </div>
          </div>

          <div className="setup-strip-meta">
            <div>
              <span>Stem</span>
              <strong>{assistantState?.voice?.display_name || 'Nog niet gekozen'}</strong>
            </div>
            <div>
              <span>Nummer</span>
              <strong>{assistantState?.number?.e164 || 'Nog niet gekozen'}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{assistantState?.assistant?.live_status || 'not_live'}</strong>
            </div>
          </div>
        </div>

        <div className="dashboard-setup-strip-steps">
          {setupSteps.map((step, index) => (
            <div key={step.title} className={`setup-strip-step ${step.done ? 'done' : ''} ${wizardStep === index + 1 ? 'active' : ''}`}>
              <span>{index + 1}</span>
              <p>{step.title}</p>
            </div>
          ))}
        </div>
      </section>

      {!apiConfigured && (
        <div className="glass-panel setup-feedback setup-feedback-warn">
          {apiConfigMessage}
        </div>
      )}

      {error && (
        <div className="glass-panel setup-feedback setup-feedback-error">
          {error}
        </div>
      )}

      {invoiceNotice && (
        <div className="glass-panel setup-feedback setup-feedback-success">
          {invoiceNotice}
        </div>
      )}

      <section className="glass-panel setup-hero-card">
        <div className="setup-hero-main">
          <span className="dashboard-eyebrow">AI telefoonassistent</span>
          <h2>{companyName} wordt stap voor stap live gezet</h2>
          <p className="text-muted">
            Je workflow is nu ingericht als: briefing, stem en nummer kiezen, shop of kennis koppelen, webtest draaien en daarna live gaan.
          </p>

          <div className="setup-pill-row">
            <StatusPill label="Live" value={assistantState?.assistant?.live_status || 'not_live'} />
            <StatusPill label="Billing" value={assistantState?.assistant?.billing_status || 'none'} />
            <StatusPill label="Plan" value={assistantState?.plan?.name || 'Launch'} />
            <StatusPill label="Nummer" value={assistantState?.number?.e164 || 'Nog niet gekozen'} />
          </div>

          <div className="assistant-actions">
            <button className="btn-secondary" onClick={loadData} disabled={loading}>
              <RefreshCcw size={16} /> Vernieuw
            </button>
            <button className="btn-secondary" onClick={() => setShowSettings(true)}>
              <Settings size={15} /> Bedrijfsinfo aanpassen
            </button>
            <button className="btn-secondary" onClick={() => navigate('/dashboard/call-studio')}>
              <PhoneCall size={15} /> Webtest openen
            </button>
            <button className="btn-primary" onClick={requestInvoice} disabled={invoiceLoading || loading}>
              <CreditCard size={15} /> {invoiceLoading ? 'Bezig...' : 'Activatie aanvragen'}
            </button>
          </div>
        </div>

        <div className="setup-hero-aside">
          <div className="setup-hero-progress">
            <span>Setup voortgang</span>
            <strong>
              {completedSteps}/{setupSteps.length} klaar
            </strong>
          </div>
          <p className="text-muted">
            {completedSteps < 2
              ? 'Vul eerst je briefing en basisinstellingen in.'
              : completedSteps < setupSteps.length
                ? 'Je bent dichtbij. Rond je koppelingen en livegang af.'
                : 'Alles staat goed. Je kunt nu vooral finetunen en volgen.'}
          </p>
          <div className="setup-micro-stats">
            <div>
              <span>Stem</span>
              <strong>{assistantState?.voice?.display_name || 'Nog niet gekozen'}</strong>
            </div>
            <div>
              <span>Shop status</span>
              <strong>
                {connectedIntegrations.length
                  ? `${connectedIntegrations.length} live`
                  : pendingIntegrations.length
                    ? `${pendingIntegrations.length} in behandeling`
                    : 'Nog niet gestart'}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="setup-top-grid">
        <div className="glass-panel setup-journey-panel">
          <div className="setup-section-header">
            <div>
              <h3><ClipboardList size={18} /> Setup flow</h3>
              <p className="text-muted">Iedere fase heeft één duidelijke bedoeling en één logische vervolgstap.</p>
            </div>
          </div>

          <div className="setup-step-grid">
            {setupSteps.map((step) => (
              <SetupStepCard
                key={step.title}
                title={step.title}
                description={step.description}
                done={step.done}
                tone={step.tone}
              />
            ))}
          </div>
        </div>

        <div className="glass-panel setup-next-panel">
          <span className="dashboard-eyebrow">{nextAction.eyebrow}</span>
          <h3>{nextAction.title}</h3>
          <p className="text-muted">{nextAction.description}</p>
          <button
            className="btn-primary"
            onClick={() => {
              if (nextAction.actionKey === 'wizard') navigate('/setup-wizard');
              if (nextAction.actionKey === 'commerce') {
                commerceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
              if (nextAction.actionKey === 'invoice') requestInvoice();
              if (nextAction.actionKey === 'studio') navigate('/dashboard/call-studio');
            }}
            disabled={invoiceLoading || loading}
          >
            {nextAction.cta} <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <div className="stats-grid setup-stats-grid">
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

      <section className="setup-summary-grid">
        <div className="glass-panel summary-panel">
          <div className="setup-section-header">
            <div>
              <h3><BookOpen size={18} /> Bedrijfsbriefing</h3>
              <p className="text-muted">Dit is de context waar je assistent tijdens gesprekken op leunt.</p>
            </div>
            <button className="btn-secondary" onClick={() => setShowSettings(true)}>
              <Settings size={14} /> Wijzigen
            </button>
          </div>

          <div className="setup-detail-list">
            <DetailRow label="Bedrijfsnaam" value={assistantState?.profile?.company_name || 'Nog niet ingevuld'} />
            <DetailRow label="Doel van gesprek" value={assistantState?.profile?.goals || 'Nog niet ingevuld'} />
            <DetailRow label="Openingstijden" value={assistantState?.profile?.opening_hours || 'Nog niet ingevuld'} />
            <DetailRow label="Prijzen" value={assistantState?.profile?.pricing || 'Nog niet ingevuld'} />
            <DetailRow label="Stem" value={assistantState?.voice?.display_name || 'Nog niet gekozen'} />
            <DetailRow label="Nummer" value={assistantState?.number?.e164 || 'Nog niet gekozen'} />
          </div>
        </div>

        <div className="glass-panel summary-panel launch-panel">
          <div className="setup-section-header">
            <div>
              <h3><Bot size={18} /> Test en livegang</h3>
              <p className="text-muted">Zo beweegt je assistent van webtest naar echt telefoonnummer.</p>
            </div>
          </div>

          <div className="launch-flow-list">
            <div className={`launch-flow-item ${assistantState?.latestInvoice ? 'is-active' : ''}`}>
              <span>1</span>
              <div>
                <strong>Activatie aanvragen</strong>
                <p>{assistantState?.latestInvoice?.status || 'Nog geen aanvraag verstuurd'}</p>
              </div>
            </div>
            <div className={`launch-flow-item ${assistantState?.assistant?.billing_status === 'paid_approved' ? 'is-active' : ''}`}>
              <span>2</span>
              <div>
                <strong>Betaalgoedkeuring</strong>
                <p>{assistantState?.assistant?.billing_status || 'Wacht op goedkeuring'}</p>
              </div>
            </div>
            <div className={`launch-flow-item ${assistantState?.latestProvisioningJob?.status ? 'is-active' : ''}`}>
              <span>3</span>
              <div>
                <strong>Provisioning</strong>
                <p>{assistantState?.latestProvisioningJob?.status || 'Nog niet gestart'}</p>
              </div>
            </div>
            <div className={`launch-flow-item ${isLive ? 'is-active' : ''}`}>
              <span>4</span>
              <div>
                <strong>Live op nummer</strong>
                <p>{assistantState?.assistant?.live_status || 'not_live'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={commerceSectionRef} className="glass-panel commerce-hub">
        <div className="setup-section-header">
          <div>
            <h3><ShoppingCart size={18} /> Webshop en orderstatus</h3>
            <p className="text-muted">
              Klanten hoeven geen technische stappen te doen. Kies hoe de koppeling geregeld wordt en laat de rest op de achtergrond afronden.
            </p>
          </div>
        </div>

        {integrationNotice && (
          <div className="glass-panel commerce-inline-notice">
            {integrationNotice}
          </div>
        )}

        <div className="commerce-flow-grid">
          <div className="commerce-request-card">
            <div className="commerce-mode-switch">
              <button
                className={`commerce-mode-pill ${integrationDraft.mode === 'concierge' ? 'active' : ''}`}
                onClick={() =>
                  setIntegrationDraft((prev) => ({
                    ...prev,
                    mode: 'concierge',
                    accessToken: '',
                    apiKey: '',
                    apiSecret: ''
                  }))}
              >
                Wij regelen dit
              </button>
              <button
                className={`commerce-mode-pill ${integrationDraft.mode === 'self_service' ? 'active' : ''}`}
                onClick={() =>
                  setIntegrationDraft((prev) => ({
                    ...prev,
                    mode: 'self_service'
                  }))}
              >
                Ik koppel het zelf
              </button>
            </div>

              <div className="commerce-helper-card">
                <strong>
                  {integrationDraft.mode === 'concierge'
                    ? 'Rustige flow voor niet-technische klanten'
                    : 'Expertmodus voor directe koppeling'}
                </strong>
                <p className="text-muted">
                  {integrationDraft.mode === 'concierge'
                    ? 'Je klant kiest alleen platform, shop-URL en een korte notitie. Jij of admin rondt de koppeling daarna af.'
                    : 'Gebruik dit alleen als je de benodigde webshop-inloggegevens al hebt.'}
                </p>
              </div>

            <div className="commerce-form-grid">
              <label>
                Platform
                <select
                  className="glass-input"
                  value={integrationDraft.provider}
                  onChange={(event) =>
                    setIntegrationDraft((prev) => ({
                      ...prev,
                      provider: event.target.value,
                      accessToken: '',
                      apiKey: '',
                      apiSecret: ''
                    }))}
                >
                  <option value="shopify">Shopify</option>
                  <option value="prestashop">PrestaShop</option>
                  <option value="woocommerce">WooCommerce</option>
                </select>
              </label>

              <label>
                Shop URL
                <input
                  type="text"
                  className="glass-input"
                  placeholder="https://jouwshop.nl"
                  value={integrationDraft.storeUrl}
                  onChange={(event) =>
                    setIntegrationDraft((prev) => ({
                      ...prev,
                      storeUrl: event.target.value
                    }))}
                />
              </label>

              {integrationDraft.mode === 'concierge' && (
                <>
                  <label>
                    Contact e-mail
                    <div className="input-with-icon">
                      <Mail size={16} />
                      <input
                        type="email"
                        className="glass-input"
                        placeholder="mail@bedrijf.nl"
                        value={integrationDraft.contactEmail}
                        onChange={(event) =>
                          setIntegrationDraft((prev) => ({
                            ...prev,
                            contactEmail: event.target.value
                          }))}
                      />
                    </div>
                  </label>

                  <label>
                    Korte notitie voor setup
                    <textarea
                      className="glass-input glass-textarea"
                      placeholder="Bijv. wij willen vooral orderstatus en verzendinformatie kunnen beantwoorden."
                      value={integrationDraft.setupNotes}
                      onChange={(event) =>
                        setIntegrationDraft((prev) => ({
                          ...prev,
                          setupNotes: event.target.value
                        }))}
                    />
                  </label>
                </>
              )}

              {integrationDraft.mode === 'self_service' && integrationDraft.provider === 'shopify' && (
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

              {integrationDraft.mode === 'self_service' && integrationDraft.provider === 'prestashop' && (
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

              {integrationDraft.mode === 'self_service' && integrationDraft.provider === 'woocommerce' && (
                <>
                  <label>
                    WooCommerce Consumer Key
                    <input
                      type="password"
                      className="glass-input"
                      placeholder="ck_..."
                      value={integrationDraft.apiKey}
                      onChange={(event) =>
                        setIntegrationDraft((prev) => ({
                          ...prev,
                          apiKey: event.target.value
                        }))}
                    />
                  </label>

                  <label>
                    WooCommerce Consumer Secret
                    <input
                      type="password"
                      className="glass-input"
                      placeholder="cs_..."
                      value={integrationDraft.apiSecret}
                      onChange={(event) =>
                        setIntegrationDraft((prev) => ({
                          ...prev,
                          apiSecret: event.target.value
                        }))}
                    />
                  </label>
                </>
              )}
            </div>

            <button
              className="btn-primary"
              disabled={integrationButtonDisabled}
              onClick={connectIntegration}
            >
              <PlugZap size={15} />
              {integrationSaving
                ? 'Bezig...'
                : integrationDraft.mode === 'concierge'
                  ? 'Vraag koppeling aan'
                  : 'Koppel direct'}
            </button>
          </div>

          <div className="commerce-status-column">
            <div className="commerce-status-group">
              <h4>In behandeling</h4>
              {pendingIntegrations.length === 0 && (
                <p className="text-muted">Nog geen concierge-verzoeken open.</p>
              )}

              {pendingIntegrations.map((integration) => (
                <div key={integration.id} className="glass-panel commerce-state-card pending">
                  <div className="commerce-state-top">
                    <strong>{PROVIDER_LABELS[integration.provider] || integration.provider}</strong>
                    <span>{INTEGRATION_STATUS_LABELS[integration.status] || integration.status}</span>
                  </div>
                  <p className="text-muted">{integration.storeUrl}</p>
                  {integration.contactEmail && <p className="text-muted">Contact: {integration.contactEmail}</p>}
                  {integration.setupNotes && <p className="text-muted">Notitie: {integration.setupNotes}</p>}
                </div>
              ))}
            </div>

            <div className="commerce-status-group">
              <h4>Actieve koppelingen</h4>
              {connectedIntegrations.length === 0 && (
                <p className="text-muted">Nog geen actieve webshop koppeling.</p>
              )}

              {connectedIntegrations.map((integration) => (
                <div key={integration.id} className="glass-panel commerce-state-card connected">
                  <div className="commerce-state-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Link2 size={15} />
                      <strong>{PROVIDER_LABELS[integration.provider] || integration.provider}</strong>
                    </div>
                    <span>{INTEGRATION_STATUS_LABELS[integration.status] || integration.status}</span>
                  </div>
                  <p className="text-muted">{integration.storeUrl}</p>
                  <button
                    className="btn-secondary"
                    onClick={() => disconnectIntegration(integration.provider)}
                    disabled={integrationSaving}
                  >
                    <Unplug size={14} /> Loskoppelen
                  </button>
                </div>
              ))}
            </div>

            <div className="glass-panel commerce-lookup-box">
              <h4 style={{ marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <PackageSearch size={16} /> Orderstatus test
              </h4>
              <p className="text-muted" style={{ marginBottom: '0.75rem' }}>
                Test hoe de assistent straks een ordervraag oppakt. Dit werkt zodra minimaal één koppeling live staat.
              </p>

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
                  <option value="woocommerce">WooCommerce</option>
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
                disabled={orderLookupLoading || !orderLookupDraft.orderReference.trim() || connectedIntegrations.length === 0}
              >
                <RefreshCcw size={14} /> {orderLookupLoading ? 'Zoeken...' : 'Check orderstatus'}
              </button>

              {connectedIntegrations.length === 0 && (
                <p className="text-muted commerce-empty-note">Deze test wordt actief zodra een shop live is gekoppeld.</p>
              )}

              {orderLookupResult && (
                <div className="glass-panel commerce-lookup-result">
                  {orderLookupResult?.found ? (
                    <p>
                      <strong>{orderLookupResult?.order?.orderReference}</strong> - {orderLookupResult?.order?.status}
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
      </section>

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
          <Route path="/admin" element={<AdminConsole />} />
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
