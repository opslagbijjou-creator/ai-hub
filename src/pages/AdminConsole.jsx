import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Link2,
  PlayCircle,
  RefreshCcw,
  ShieldCheck,
  Store,
  UserRound
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { apiUrl } from '../lib/api';
import { useAppContext } from '../context/AppContext';

const SummaryCard = ({ icon, label, value, tone = 'default' }) => (
  <div className={`glass-panel admin-summary-card tone-${tone}`}>
    <div className="admin-summary-icon">{icon}</div>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  </div>
);

const PROVIDER_LABELS = {
  shopify: 'Shopify',
  prestashop: 'PrestaShop',
  woocommerce: 'WooCommerce'
};

const createEmptyIntegrationForm = () => ({
  assistantId: '',
  integrationId: '',
  provider: 'shopify',
  storeUrl: '',
  contactEmail: '',
  setupNotes: '',
  adminNotes: '',
  accessToken: '',
  apiKey: '',
  apiSecret: ''
});

const AdminConsole = () => {
  const { isAdmin } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [overview, setOverview] = useState(null);
  const [actioningId, setActioningId] = useState('');
  const [editingIntegrationKey, setEditingIntegrationKey] = useState('');
  const [integrationForm, setIntegrationForm] = useState(createEmptyIntegrationForm());

  const authFetch = useCallback(async (path, options = {}) => {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Geen actieve sessie. Log opnieuw in.');
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

  const loadOverview = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authFetch('/api/admin/overview');
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Kon adminoverzicht niet laden.');
      }

      setOverview(payload);
    } catch (loadError) {
      setError(loadError?.message || 'Kon adminoverzicht niet laden.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, isAdmin]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const approveAndActivate = async (assistant) => {
    setActioningId(assistant.assistantId);
    setNotice('');
    setError('');

    try {
      const response = await authFetch('/api/admin/approve-payment', {
        method: 'POST',
        body: JSON.stringify({
          assistantId: assistant.assistantId,
          invoiceId: assistant.latestInvoice?.id,
          runNow: true
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Betaling goedkeuren mislukt.');
      }

      setNotice(`Betaling goedgekeurd voor ${assistant.companyName}. Provisioning status: ${payload?.provisioningResult?.status || 'gestart'}.`);
      await loadOverview();
    } catch (actionError) {
      setError(actionError?.message || 'Actie mislukt.');
    } finally {
      setActioningId('');
    }
  };

  const rerunProvisioning = async (assistant) => {
    setActioningId(assistant.assistantId);
    setNotice('');
    setError('');

    try {
      const response = await authFetch('/api/admin/provision-run', {
        method: 'POST',
        body: JSON.stringify({
          assistantId: assistant.assistantId,
          jobId: assistant.latestProvisioningJob?.id
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Provisioning opnieuw starten mislukt.');
      }

      setNotice(`Provisioning opnieuw gestart voor ${assistant.companyName}. Resultaat: ${payload?.result?.status || 'gestart'}.`);
      await loadOverview();
    } catch (actionError) {
      setError(actionError?.message || 'Provisioning opnieuw starten mislukt.');
    } finally {
      setActioningId('');
    }
  };

  const openIntegrationSetup = (assistant, integration) => {
    setEditingIntegrationKey(`${assistant.assistantId}:${integration.provider}`);
    setIntegrationForm({
      assistantId: assistant.assistantId,
      integrationId: integration.id || '',
      provider: integration.provider || 'shopify',
      storeUrl: integration.storeUrl || '',
      contactEmail: integration.contactEmail || assistant.contactEmail || '',
      setupNotes: integration.setupNotes || '',
      adminNotes: '',
      accessToken: '',
      apiKey: '',
      apiSecret: ''
    });
  };

  const closeIntegrationSetup = () => {
    setEditingIntegrationKey('');
    setIntegrationForm(createEmptyIntegrationForm());
  };

  const completeIntegrationSetup = async () => {
    if (!integrationForm.assistantId || !integrationForm.provider || !integrationForm.storeUrl) {
      setError('Assistant, provider en store URL zijn verplicht voor admin shop setup.');
      return;
    }

    setActioningId(editingIntegrationKey);
    setNotice('');
    setError('');

    try {
      const response = await authFetch('/api/admin/integrations/complete', {
        method: 'POST',
        body: JSON.stringify(integrationForm)
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Shopkoppeling afronden mislukt.');
      }

      setNotice(`${PROVIDER_LABELS[integrationForm.provider] || integrationForm.provider} is nu live gekoppeld.`);
      closeIntegrationSetup();
      await loadOverview();
    } catch (actionError) {
      setError(actionError?.message || 'Shopkoppeling afronden mislukt.');
    } finally {
      setActioningId('');
    }
  };

  const assistants = overview?.assistants || [];
  const summary = overview?.summary;

  const providerSummary = useMemo(() => {
    const breakdown = summary?.providerBreakdown || {};
    const entries = Object.entries(breakdown);
    if (!entries.length) return 'Nog geen actieve shopkoppelingen';
    return entries.map(([provider, count]) => `${provider}: ${count}`).join(' • ');
  }, [summary]);

  if (!isAdmin) {
    return (
      <div className="dashboard-overview animate-fade-in">
        <div className="glass-panel admin-empty-state">
          <ShieldCheck size={28} color="var(--primary)" />
          <h2>Geen admintoegang</h2>
          <p className="text-muted">Dit gedeelte is alleen zichtbaar voor het admin-account dat aan deze SaaS is gekoppeld.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-overview animate-fade-in">
      <div className="dashboard-header admin-header-tight">
        <h1 className="font-heading">Admin Console</h1>
        <p className="text-muted">Beheer betalingen, provisioning en livegang vanuit één overzicht.</p>
      </div>

      <div className="admin-toolbar-row">
        <div className="glass-panel admin-toolbar-note">
          <ShieldCheck size={16} /> Alleen jouw admin UID mag deze acties uitvoeren.
        </div>
        <button className="btn-secondary" onClick={loadOverview} disabled={loading || Boolean(actioningId)}>
          <RefreshCcw size={15} /> Vernieuw overzicht
        </button>
      </div>

      {error && (
        <div className="glass-panel admin-feedback admin-feedback-error">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {notice && (
        <div className="glass-panel admin-feedback admin-feedback-success">
          <CheckCircle2 size={16} /> {notice}
        </div>
      )}

      <div className="admin-summary-grid">
        <SummaryCard icon={<UserRound size={20} />} label="Assistenten" value={summary?.totalAssistants || 0} />
        <SummaryCard icon={<CreditCard size={20} />} label="Wachten op betaling" value={summary?.awaitingPayment || 0} tone="warm" />
        <SummaryCard icon={<PlayCircle size={20} />} label="Provisioning nodig" value={summary?.needsProvisioning || 0} tone="soft" />
        <SummaryCard icon={<Link2 size={20} />} label="Shop setup open" value={summary?.pendingShopRequests || 0} tone="warm" />
        <SummaryCard icon={<Store size={20} />} label="Live assistenten" value={summary?.liveAssistants || 0} tone="success" />
      </div>

      <div className="glass-panel admin-provider-strip">
        <strong>Shopkoppelingen</strong>
        <span>{providerSummary}</span>
      </div>

      <div className="admin-customer-list">
        {loading ? (
          <div className="glass-panel admin-empty-state">
            <RefreshCcw size={18} className="spin" />
            <p className="text-muted">Adminoverzicht laden...</p>
          </div>
        ) : assistants.length === 0 ? (
          <div className="glass-panel admin-empty-state">
            <ShieldCheck size={26} color="var(--primary)" />
            <p className="text-muted">Nog geen assistenten gevonden in het platform.</p>
          </div>
        ) : (
          assistants.map((assistant) => {
            const isBusy = actioningId === assistant.assistantId;
            const canApprove = assistant.latestInvoice?.status === 'invoice_sent';
            const canRerun =
              assistant.billingStatus === 'paid_approved' ||
              ['queued', 'failed', 'needs_number_reselect'].includes(assistant.latestProvisioningJob?.status || '');

            return (
              <article key={assistant.assistantId} className="glass-panel admin-customer-card">
                <div className="admin-customer-top">
                  <div>
                    <h3>{assistant.companyName}</h3>
                    <p className="text-muted">
                      {assistant.contactEmail || assistant.payerName || assistant.userId}
                    </p>
                  </div>

                  <div className="admin-chip-row">
                    <span className={`admin-chip state-${assistant.liveStatus}`}>Live: {assistant.liveStatus}</span>
                    <span className={`admin-chip state-${assistant.billingStatus}`}>Billing: {assistant.billingStatus}</span>
                    <span className="admin-chip neutral">Plan: {assistant.plan?.name || 'Launch'}</span>
                  </div>
                </div>

                <div className="admin-meta-grid">
                  <div>
                    <span>Nummer</span>
                    <strong>{assistant.number?.e164 || '-'}</strong>
                  </div>
                  <div>
                    <span>Stem</span>
                    <strong>{assistant.voice?.displayName || '-'}</strong>
                  </div>
                  <div>
                    <span>Factuur</span>
                    <strong>{assistant.latestInvoice?.invoiceNumber || 'Nog geen'}</strong>
                  </div>
                  <div>
                    <span>Provisioning</span>
                    <strong>{assistant.latestProvisioningJob?.status || 'Nog niet gestart'}</strong>
                  </div>
                  <div>
                    <span>Shops</span>
                    <strong>{assistant.connectedProviders?.length ? assistant.connectedProviders.join(', ') : 'Geen'}</strong>
                  </div>
                  <div>
                    <span>Gebruik deze maand</span>
                    <strong>{assistant.usage?.minutesUsed || 0} min • {assistant.usage?.tasksUsed || 0} tasks</strong>
                  </div>
                </div>

                {assistant.integrations?.length > 0 && (
                  <div className="admin-integrations-list">
                    {assistant.integrations.map((integration) => {
                      const isPendingSetup = ['pending_setup', 'error'].includes(integration.status);
                      const isEditing =
                        editingIntegrationKey === `${assistant.assistantId}:${integration.provider}`;

                      return (
                        <div key={`${assistant.assistantId}-${integration.provider}`} className="glass-panel admin-integration-card">
                          <div className="admin-customer-top" style={{ marginBottom: '0.6rem' }}>
                            <div>
                              <h4>{PROVIDER_LABELS[integration.provider] || integration.provider}</h4>
                              <p className="text-muted">{integration.storeUrl}</p>
                            </div>

                            <div className="admin-chip-row">
                              <span className={`admin-chip state-${integration.status}`}>{integration.status}</span>
                              <span className="admin-chip neutral">{integration.setupMode || 'self_service'}</span>
                            </div>
                          </div>

                          {integration.contactEmail && (
                            <p className="text-muted">Contact: {integration.contactEmail}</p>
                          )}
                          {integration.setupNotes && (
                            <p className="text-muted">Notitie: {integration.setupNotes}</p>
                          )}

                          {isPendingSetup && (
                            <div className="admin-action-buttons" style={{ marginTop: '0.75rem' }}>
                              <button
                                className="btn-secondary"
                                onClick={() => openIntegrationSetup(assistant, integration)}
                                disabled={Boolean(actioningId)}
                              >
                                <Link2 size={14} /> Koppeling afronden
                              </button>
                            </div>
                          )}

                          {isEditing && (
                            <div className="admin-integration-form">
                              <label>
                                Store URL
                                <input
                                  type="text"
                                  className="glass-input"
                                  value={integrationForm.storeUrl}
                                  onChange={(event) =>
                                    setIntegrationForm((prev) => ({ ...prev, storeUrl: event.target.value }))}
                                />
                              </label>

                              {integrationForm.provider === 'shopify' && (
                                <label>
                                  Shopify Access Token
                                  <input
                                    type="password"
                                    className="glass-input"
                                    value={integrationForm.accessToken}
                                    onChange={(event) =>
                                      setIntegrationForm((prev) => ({ ...prev, accessToken: event.target.value }))}
                                  />
                                </label>
                              )}

                              {integrationForm.provider === 'prestashop' && (
                                <label>
                                  PrestaShop API Key
                                  <input
                                    type="password"
                                    className="glass-input"
                                    value={integrationForm.apiKey}
                                    onChange={(event) =>
                                      setIntegrationForm((prev) => ({ ...prev, apiKey: event.target.value }))}
                                  />
                                </label>
                              )}

                              {integrationForm.provider === 'woocommerce' && (
                                <>
                                  <label>
                                    WooCommerce Consumer Key
                                    <input
                                      type="password"
                                      className="glass-input"
                                      value={integrationForm.apiKey}
                                      onChange={(event) =>
                                        setIntegrationForm((prev) => ({ ...prev, apiKey: event.target.value }))}
                                    />
                                  </label>
                                  <label>
                                    WooCommerce Consumer Secret
                                    <input
                                      type="password"
                                      className="glass-input"
                                      value={integrationForm.apiSecret}
                                      onChange={(event) =>
                                        setIntegrationForm((prev) => ({ ...prev, apiSecret: event.target.value }))}
                                    />
                                  </label>
                                </>
                              )}

                              <label>
                                Admin notitie
                                <textarea
                                  className="glass-input admin-inline-textarea"
                                  value={integrationForm.adminNotes}
                                  onChange={(event) =>
                                    setIntegrationForm((prev) => ({ ...prev, adminNotes: event.target.value }))}
                                />
                              </label>

                              <div className="admin-action-buttons">
                                <button className="btn-primary" onClick={completeIntegrationSetup} disabled={Boolean(actioningId)}>
                                  <CheckCircle2 size={14} /> {actioningId ? 'Bezig...' : 'Opslaan en activeren'}
                                </button>
                                <button className="btn-secondary" onClick={closeIntegrationSetup} disabled={Boolean(actioningId)}>
                                  Sluiten
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {assistant.latestProvisioningJob?.errorMessage && (
                  <div className="glass-panel admin-inline-warning">
                    <AlertTriangle size={15} /> {assistant.latestProvisioningJob.errorMessage}
                  </div>
                )}

                <div className="admin-action-row">
                  <div className="admin-action-copy text-muted">
                    {canApprove
                      ? 'Factuur staat nog op invoice_sent. Na goedkeuren wordt provisioning direct gestart.'
                      : canRerun
                        ? 'Provisioning kan opnieuw gestart worden vanuit deze adminconsole.'
                        : 'Geen directe adminactie nodig op dit moment.'}
                  </div>

                  <div className="admin-action-buttons">
                    {canApprove && (
                      <button className="btn-primary" onClick={() => approveAndActivate(assistant)} disabled={isBusy}>
                        <CreditCard size={15} /> {isBusy ? 'Bezig...' : 'Betaald + activeer'}
                      </button>
                    )}

                    {canRerun && (
                      <button className="btn-secondary" onClick={() => rerunProvisioning(assistant)} disabled={isBusy}>
                        <PlayCircle size={15} /> {isBusy ? 'Bezig...' : 'Retry provisioning'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminConsole;
