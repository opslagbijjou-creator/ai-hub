import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  ChevronRight,
  Loader2,
  Mic,
  Phone,
  Play,
  ReceiptText,
  RefreshCcw,
  User
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { apiUrl } from '../lib/api';
import { useAppContext } from '../context/AppContext';
import { PRICING_PLANS, getPlanByKey } from '../lib/pricing';
import WebCallPanel from '../components/WebCallPanel';
import './Wizard.css';

const FALLBACK_VOICES = [
  {
    key: 'jessica_nl',
    name: 'Jessica (Female)',
    previewUrl:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/cgSgspJ2msm6clMCkdW9/56a97bf8-b69b-448f-846c-c3a11683d45a.mp3'
  },
  {
    key: 'eric_nl',
    name: 'Eric (Male)',
    previewUrl:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/cjVigY5qzO86Huf0OWal/d098fda0-6456-4030-b3d8-63aa048c9070.mp3'
  }
];

const FALLBACK_NUMBERS = [
  { e164: '+31208081234', label: 'Amsterdam, NL' },
  { e164: '+31103456789', label: 'Rotterdam, NL' },
  { e164: '+31859990000', label: 'National, NL' }
];

const Wizard = () => {
  const navigate = useNavigate();
  const { setAssistantConfig, apiConfigured, apiConfigMessage } = useAppContext();

  const [step, setStep] = useState(1);
  const [voices, setVoices] = useState(FALLBACK_VOICES);
  const [numbers, setNumbers] = useState(FALLBACK_NUMBERS);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [assistantState, setAssistantState] = useState(null);

  const [formData, setFormData] = useState({
    companyName: '',
    businessType: '',
    services: '',
    pricing: '',
    openingHours: 'Ma-Vr 09:00 - 17:00',
    goals: 'Beantwoord vragen en plan afspraken in.',
    toneOfVoice: 'vriendelijk en professioneel',
    greeting: '',
    knowledge: '',
    voiceKey: FALLBACK_VOICES[0].key,
    numberE164: FALLBACK_NUMBERS[0].e164,
    planKey: 'plan_275'
  });

  const playAudio = (url, event) => {
    event.stopPropagation();
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(() => {});
  };

  const authFetch = useCallback(async (path, options = {}) => {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Geen actieve sessie gevonden. Log opnieuw in.');
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

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    setSaveError('');

    try {
      const [voiceRes, numberRes] = await Promise.all([
        fetch(apiUrl('/api/voices/options')),
        authFetch('/api/numbers/options')
      ]);

      const voicePayload = await voiceRes.json().catch(() => []);
      const numberPayload = await numberRes.json().catch(() => []);

      const voiceList = Array.isArray(voicePayload) && voicePayload.length > 0 ? voicePayload : FALLBACK_VOICES;
      const numberList =
        Array.isArray(numberPayload) && numberPayload.length > 0 ? numberPayload : FALLBACK_NUMBERS;

      setVoices(voiceList);
      setNumbers(numberList);

      setFormData((prev) => {
        const validVoice = voiceList.some((voice) => voice.key === prev.voiceKey);
        const validNumber = numberList.some((number) => number.e164 === prev.numberE164);

        return {
          ...prev,
          voiceKey: validVoice ? prev.voiceKey : voiceList[0].key,
          numberE164: validNumber ? prev.numberE164 : numberList[0].e164
        };
      });
    } catch (error) {
      console.warn('Opties fallback:', error?.message || error);
      setVoices(FALLBACK_VOICES);
      setNumbers(FALLBACK_NUMBERS);
    } finally {
      setLoadingOptions(false);
    }
  }, [authFetch]);

  const refreshAssistantState = useCallback(async () => {
    try {
      const response = await authFetch('/api/assistant/state');
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Kon assistant status niet laden.');
      }
      setAssistantState(payload);
      if (payload?.assistant) {
        setAssistantConfig({
          companyName:
            payload?.profile?.company_name || payload?.assistant?.display_name || formData.companyName || 'Mijn Bedrijf',
          voice: payload?.voice?.display_name || 'Niet gekozen',
          voiceKey: payload?.voice?.voice_key || formData.voiceKey,
          phoneNumber: payload?.number?.e164 || formData.numberE164,
          assistantId: payload?.assistant?.id,
          liveStatus: payload?.assistant?.live_status,
          billingStatus: payload?.assistant?.billing_status
        });
      }
    } catch (error) {
      console.warn(error?.message || error);
    }
  }, [authFetch, formData.companyName, formData.numberE164, formData.voiceKey, setAssistantConfig]);

  const saveOnboarding = useCallback(async () => {
    setSaveLoading(true);
    setSaveError('');

    try {
      const response = await authFetch('/api/onboarding/save', {
        method: 'POST',
        body: JSON.stringify({
          companyName: formData.companyName,
          businessType: formData.businessType,
          services: formData.services,
          pricing: formData.pricing,
          openingHours: formData.openingHours,
          goals: formData.goals,
          toneOfVoice: formData.toneOfVoice,
          greeting: formData.greeting,
          knowledge: formData.knowledge,
          voiceKey: formData.voiceKey,
          numberE164: formData.numberE164,
          numberLabel: numbers.find((item) => item.e164 === formData.numberE164)?.label || formData.numberE164,
          planKey: formData.planKey
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Opslaan onboarding mislukt.');
      }

      setAssistantConfig({
        companyName: payload?.profile?.company_name || formData.companyName,
        voice: payload?.voice?.display_name || voices.find((voice) => voice.key === formData.voiceKey)?.name,
        voiceKey: payload?.voice?.voice_key || formData.voiceKey,
        phoneNumber: payload?.number?.e164 || formData.numberE164,
        assistantId: payload?.assistant?.id,
        liveStatus: payload?.assistant?.live_status,
        billingStatus: payload?.assistant?.billing_status
      });

      await refreshAssistantState();
      return true;
    } catch (error) {
      setSaveError(error?.message || 'Kon onboarding niet opslaan.');
      return false;
    } finally {
      setSaveLoading(false);
    }
  }, [authFetch, formData, numbers, refreshAssistantState, setAssistantConfig, voices]);

  const requestInvoice = useCallback(async () => {
    setInvoiceLoading(true);
    setInvoiceStatus('');

    try {
      const response = await authFetch('/api/invoice/request', {
        method: 'POST',
        body: JSON.stringify({
          planKey: formData.planKey
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Factuur aanvragen mislukt.');
      }

      setInvoiceStatus(
        `Factuur ${payload?.invoice?.invoice_number || ''} staat op status ${payload?.invoice?.status || 'invoice_sent'}.`
      );
      await refreshAssistantState();
    } catch (error) {
      setInvoiceStatus(error?.message || 'Kon factuur niet aanvragen.');
    } finally {
      setInvoiceLoading(false);
    }
  }, [authFetch, formData.planKey, refreshAssistantState]);

  const nextStep = async () => {
    if (step < 3) {
      setStep((prev) => prev + 1);
      return;
    }

    if (step === 3) {
      const ok = await saveOnboarding();
      if (ok) {
        setStep(4);
      }
    }
  };

  useEffect(() => {
    loadOptions();
    refreshAssistantState();
  }, [loadOptions, refreshAssistantState]);

  const selectedVoice = voices.find((voice) => voice.key === formData.voiceKey) || voices[0];
  const selectedPlan = getPlanByKey(formData.planKey);

  const assistantGreeting =
    formData.greeting ||
    `Goedemiddag, je spreekt met de AI assistent van ${formData.companyName || 'ons bedrijf'}. Waarmee kan ik helpen?`;

  return (
    <div className="wizard-container animate-fade-in">
      <div className="wizard-sidebar glass-panel">
        <div className="wizard-logo">
          <Phone className="text-gradient" size={28} />
          <h2>AI Hub Voice</h2>
        </div>

        <ul className="wizard-steps">
          <li className={step >= 1 ? 'active' : ''}>
            <div className="step-circle">{step > 1 ? <CheckCircle size={16} /> : '1'}</div>
            <span>Bedrijfsinfo</span>
          </li>
          <li className={step >= 2 ? 'active' : ''}>
            <div className="step-circle">{step > 2 ? <CheckCircle size={16} /> : '2'}</div>
            <span>Stem</span>
          </li>
          <li className={step >= 3 ? 'active' : ''}>
            <div className="step-circle">{step > 3 ? <CheckCircle size={16} /> : '3'}</div>
            <span>Nummer + Plan</span>
          </li>
          <li className={step >= 4 ? 'active' : ''}>
            <div className="step-circle">4</div>
            <span>Test + Activatie</span>
          </li>
        </ul>

        <div className="wizard-side-note">
          <h4>Rustige flow voor je klant</h4>
          <p className="text-muted">
            De klant vult vooral bedrijfsinfo, stem en voorkeuren in. Webshop API’s en technische koppelingen kun jij later vanuit admin afronden.
          </p>
          <div className="wizard-side-points">
            <span>1. Bedrijf en tone of voice</span>
            <span>2. Stem en nummer kiezen</span>
            <span>3. Browser-test draaien</span>
            <span>4. Pas na goedkeuring live</span>
          </div>
        </div>
      </div>

      <div className="wizard-main">
        {!apiConfigured && (
          <div className="glass-panel" style={{ padding: '0.8rem', marginBottom: '1rem', borderColor: 'rgba(245,158,11,0.45)' }}>
            {apiConfigMessage}
          </div>
        )}

        {step === 1 && (
          <div className="step-content animate-fade-in">
            <h1>Geef je assistent de juiste bedrijfscontext</h1>
            <p className="text-muted">Hoe duidelijker je basis, hoe natuurlijker de assistent straks antwoordt in web test en live telefonie.</p>

            <div className="form-group">
              <label>Bedrijfsnaam</label>
              <input
                type="text"
                className="glass-input"
                value={formData.companyName}
                onChange={(event) => setFormData((prev) => ({ ...prev, companyName: event.target.value }))}
                placeholder="Bijv. Jansen Dental Care"
              />
            </div>

            <div className="form-group">
              <label>Type bedrijf</label>
              <input
                type="text"
                className="glass-input"
                value={formData.businessType}
                onChange={(event) => setFormData((prev) => ({ ...prev, businessType: event.target.value }))}
                placeholder="Bijv. Tandartspraktijk"
              />
            </div>

            <div className="form-group">
              <label>Diensten (komma of enter gescheiden)</label>
              <textarea
                rows="3"
                className="glass-input"
                value={formData.services}
                onChange={(event) => setFormData((prev) => ({ ...prev, services: event.target.value }))}
                placeholder="Controle, spoedafspraak, gebitsreiniging"
              />
            </div>

            <div className="form-group">
              <label>Prijzen of tariefindicatie</label>
              <textarea
                rows="2"
                className="glass-input"
                value={formData.pricing}
                onChange={(event) => setFormData((prev) => ({ ...prev, pricing: event.target.value }))}
                placeholder="Bijv. Intake vanaf €45"
              />
            </div>

            <div className="form-group">
              <label>Openingstijden</label>
              <input
                type="text"
                className="glass-input"
                value={formData.openingHours}
                onChange={(event) => setFormData((prev) => ({ ...prev, openingHours: event.target.value }))}
              />
            </div>

            <button className="btn-primary mt-auto" onClick={nextStep}>
              Verder <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="step-content animate-fade-in">
            <h1>Kies de stem die bij je bedrijf past</h1>
            <p className="text-muted">Deze stem gebruik je in de browser-test en later ook in de live telefoonflow.</p>

            {loadingOptions ? (
              <div className="glass-panel" style={{ padding: '1rem', marginTop: '1.5rem' }}>
                <Loader2 size={18} className="spin" /> Stemmen laden...
              </div>
            ) : (
              <div className="selection-grid">
                {voices.map((voice, index) => (
                  <div
                    key={voice.key}
                    className={`selection-card ${formData.voiceKey === voice.key ? 'active' : ''} glass-panel`}
                    onClick={() => setFormData((prev) => ({ ...prev, voiceKey: voice.key }))}
                  >
                    <User
                      size={30}
                      color={formData.voiceKey === voice.key ? 'var(--primary)' : index % 2 === 0 ? 'var(--primary)' : 'var(--secondary)'}
                    />
                    <h3>{voice.name}</h3>
                    <p>{voice.provider || 'voice profile'}</p>
                    <button className="btn-secondary small mt-2" onClick={(event) => playAudio(voice.previewUrl, event)}>
                      <Play size={14} /> Luister
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="form-group mt-4">
              <label>Welkomstzin</label>
              <input
                type="text"
                className="glass-input"
                value={formData.greeting}
                onChange={(event) => setFormData((prev) => ({ ...prev, greeting: event.target.value }))}
                placeholder={`Goedemiddag, je spreekt met ${formData.companyName || 'ons bedrijf'}. Hoe kan ik helpen?`}
              />
            </div>

            <div className="form-group">
              <label>Tone of voice</label>
              <input
                type="text"
                className="glass-input"
                value={formData.toneOfVoice}
                onChange={(event) => setFormData((prev) => ({ ...prev, toneOfVoice: event.target.value }))}
                placeholder="professioneel, vriendelijk, direct"
              />
            </div>

            <button className="btn-primary mt-auto" onClick={nextStep}>
              Verder <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="step-content animate-fade-in">
            <h1>Kies nummer en pakket</h1>
            <p className="text-muted">Je kiest nu alvast je nummer en pakket. Betalen en live activeren gebeurt pas wanneer jij daar klaar voor bent. Shopkoppelingen kun je daarna rustig vanuit het dashboard laten regelen.</p>

            {loadingOptions ? (
              <div className="glass-panel" style={{ padding: '1rem', marginTop: '1.5rem' }}>
                <Loader2 size={18} className="spin" /> Nummers laden...
              </div>
            ) : (
              <div className="number-list">
                {numbers.map((number) => (
                  <div
                    key={number.e164}
                    className={`number-row glass-panel ${formData.numberE164 === number.e164 ? 'active' : ''}`}
                    onClick={() => setFormData((prev) => ({ ...prev, numberE164: number.e164 }))}
                  >
                    <span className="phone-number">{number.e164}</span>
                    <span className="location">{number.label || number.source || 'Nummer'}</span>
                    {formData.numberE164 === number.e164 ? <CheckCircle color="var(--primary)" /> : <span>Select</span>}
                  </div>
                ))}
              </div>
            )}

            <div className="form-group mt-4">
              <label>Pakket</label>
              <div className="selection-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {PRICING_PLANS.map((plan) => (
                  <div
                    key={plan.key}
                    className={`selection-card ${formData.planKey === plan.key ? 'active' : ''} glass-panel`}
                    onClick={() => setFormData((prev) => ({ ...prev, planKey: plan.key }))}
                  >
                    <h3>{plan.name}</h3>
                    <p style={{ marginBottom: '0.2rem' }}>€{plan.monthlyPriceEur} / mnd</p>
                    <small className="text-muted">
                      {plan.includedMinutes} min + {plan.includedTasks} tasks
                    </small>
                    <small className="text-muted">
                      Overage €{plan.overageMinuteEur.toFixed(2)}/min
                    </small>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-primary mt-auto" onClick={nextStep} disabled={saveLoading}>
              {saveLoading ? <Loader2 size={18} className="spin" /> : 'Opslaan + Verder'}
              {!saveLoading && <ChevronRight size={18} />}
            </button>

            {saveError && (
              <div className="glass-panel" style={{ marginTop: '1rem', padding: '0.85rem', borderColor: 'rgba(239,68,68,0.45)' }}>
                {saveError}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="step-content animate-fade-in" style={{ maxWidth: '980px' }}>
            <h1>Test je assistent live op de website</h1>
            <p className="text-muted">
              Je kunt nu echt praten met je AI via microfoon. De telefoonlijn blijft <strong>not live</strong> totdat betaling is goedgekeurd en provisioning is uitgevoerd.
            </p>

            <div className="wizard-summary-strip">
              <div className="wizard-summary-card">
                <strong>Test eerst</strong>
                <p className="text-muted">Hoor hoe je assistent klinkt en stuur de briefing bij waar nodig.</p>
              </div>
              <div className="wizard-summary-card">
                <strong>Shop later koppelen</strong>
                <p className="text-muted">In het dashboard kun je een Shopify, PrestaShop of WooCommerce setup aanvragen zonder API-gedoe voor de klant.</p>
              </div>
              <div className="wizard-summary-card">
                <strong>Pas daarna live</strong>
                <p className="text-muted">Na factuur en admin approval wordt het gekozen nummer echt live gezet.</p>
              </div>
            </div>

            <div className="glass-panel" style={{ marginTop: '1rem', padding: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={refreshAssistantState}>
                <RefreshCcw size={16} /> Status verversen
              </button>

              <button className="btn-primary" onClick={requestInvoice} disabled={invoiceLoading}>
                <ReceiptText size={16} /> {invoiceLoading ? 'Factuur aanvragen...' : 'Factuur aanvragen'}
              </button>

              <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Live status: <strong style={{ color: 'var(--text-main)' }}>{assistantState?.assistant?.live_status || 'not_live'}</strong>
              </div>
            </div>

            {invoiceStatus && (
              <div className="glass-panel" style={{ marginTop: '1rem', padding: '0.85rem', borderColor: 'rgba(16,185,129,0.45)' }}>
                {invoiceStatus}
              </div>
            )}

            <div className="glass-panel" style={{ marginTop: '1rem', padding: '0.95rem' }}>
              <h3 style={{ marginBottom: '0.35rem' }}>Geselecteerd pakket</h3>
              <p className="text-muted" style={{ margin: 0 }}>
                {selectedPlan.name}: €{selectedPlan.monthlyPriceEur}/mnd, {selectedPlan.includedMinutes} minuten
                inbegrepen, overage €{selectedPlan.overageMinuteEur.toFixed(2)}/min.
              </p>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <WebCallPanel
                title="Browser Call Simulator"
                subtitle="States schakelen live tussen Listening, Thinking, Speaking en Idle."
                initialAssistantMessage={assistantGreeting}
                companyName={formData.companyName || selectedVoice?.name || 'AI assistent'}
              />
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={() => navigate('/dashboard/call-studio')}>
                <Mic size={16} /> Open Call Studio
              </button>
              <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                Naar dashboard <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wizard;
