import React, { useEffect, useState } from 'react';
import { Phone, ReceiptText, RefreshCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { apiConfigMessage, apiUrl, hasApiBaseConfig } from '../lib/api';
import WebCallPanel from '../components/WebCallPanel';
import { useAppContext } from '../context/AppContext';

const CallStudio = () => {
  const { setIsAdmin } = useAppContext();
  const [assistantState, setAssistantState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceMessage, setInvoiceMessage] = useState('');
  const [error, setError] = useState('');

  const loadState = async () => {
    setLoading(true);
    setError('');

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Geen actieve sessie.');
      }

      const response = await fetch(apiUrl('/api/assistant/state'), {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Kon assistant state niet laden.');
      setIsAdmin(Boolean(payload?.viewer?.isAdmin));
      setAssistantState(payload);
    } catch (loadError) {
      setIsAdmin(false);
      setError(loadError?.message || 'Kon gegevens niet laden.');
    } finally {
      setLoading(false);
    }
  };

  const requestInvoice = async () => {
    setInvoiceLoading(true);
    setInvoiceMessage('');

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Geen actieve sessie.');
      }

      const planKey = assistantState?.assistant?.desired_plan || 'plan_150';

      const response = await fetch(apiUrl('/api/invoice/request'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ planKey })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Factuuraanvraag mislukt.');

      setInvoiceMessage(
        `Factuur aangemaakt: ${payload?.invoice?.invoice_number || 'onbekend'}. Status: ${payload?.invoice?.status || 'invoice_sent'}.`
      );
      await loadState();
    } catch (requestError) {
      setInvoiceMessage(requestError?.message || 'Kon geen factuur aanvragen.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  const companyName =
    assistantState?.profile?.company_name || assistantState?.assistant?.display_name || 'jouw bedrijf';

  const initialAssistantMessage =
    assistantState?.profile?.greeting ||
    `Goedemiddag, je spreekt met de AI assistent van ${companyName}. Waarmee kan ik je helpen?`;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="dashboard-header" style={{ marginBottom: '0.5rem' }}>
        <h1 className="font-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Phone size={28} /> Call Studio
        </h1>
        <p className="text-muted">
          Test je AI assistent live in de browser. Nummer gaat pas live nadat betaling is goedgekeurd en provisioning klaar is.
        </p>
      </div>

      {!hasApiBaseConfig && (
        <div className="glass-panel" style={{ padding: '0.75rem 0.9rem', borderColor: 'rgba(245,158,11,0.45)' }}>
          {apiConfigMessage}
        </div>
      )}

      <div className="glass-panel callstudio-toolbar">
        <button className="btn-secondary" onClick={loadState} disabled={loading}>
          <RefreshCcw size={16} /> Vernieuw status
        </button>

        <button
          className="btn-primary"
          onClick={requestInvoice}
          disabled={invoiceLoading || loading || !assistantState?.assistant || !hasApiBaseConfig}
        >
          <ReceiptText size={16} /> {invoiceLoading ? 'Factuur aanvragen...' : 'Factuur aanvragen'}
        </button>

        <div className="callstudio-status">
          Live status: <strong style={{ marginLeft: '0.35rem', color: 'var(--text-main)' }}>{assistantState?.assistant?.live_status || 'not_live'}</strong>
        </div>
      </div>

      {invoiceMessage && (
        <div className="glass-panel" style={{ padding: '0.75rem 0.9rem', borderColor: 'rgba(16,185,129,0.45)' }}>
          {invoiceMessage}
        </div>
      )}

      {error && (
        <div className="glass-panel" style={{ padding: '0.75rem 0.9rem', borderColor: 'rgba(239,68,68,0.45)' }}>
          {error}
        </div>
      )}

      <WebCallPanel
        title="Realistische Web Call"
        subtitle="Gebruik je microfoon of typ een bericht. Je ziet live states: Listening, Thinking, Speaking, Idle."
        initialAssistantMessage={initialAssistantMessage}
        companyName={companyName}
        disabled={!assistantState?.assistant || !hasApiBaseConfig}
      />
    </div>
  );
};

export default CallStudio;
