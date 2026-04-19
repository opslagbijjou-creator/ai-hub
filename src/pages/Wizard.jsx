import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  Globe,
  Loader2,
  Mic,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { apiUrl } from '../lib/api';
import { useAppContext } from '../context/AppContext';
import { getPlanByKey } from '../lib/pricing';
import WebCallPanel from '../components/WebCallPanel';
import './Wizard.css';

const STEP_LABELS = [
  'Identiteit',
  'Website',
  'Stem',
  'Instructies',
  'Bereikbaarheid'
];

const FALLBACK_AVATARS = [
  { key: 'avatar_01', label: 'Robin', imageUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Robin' },
  { key: 'avatar_02', label: 'Sophie', imageUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Sophie' },
  { key: 'avatar_03', label: 'Mila', imageUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Mila' },
  { key: 'avatar_04', label: 'Daan', imageUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Daan' },
  { key: 'avatar_05', label: 'Noah', imageUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Noah' },
  { key: 'avatar_06', label: 'Emma', imageUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Emma' },
  { key: 'avatar_07', label: 'Yara', imageUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Yara' },
  { key: 'avatar_08', label: 'Liam', imageUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Liam' }
];

const FALLBACK_VOICES = [
  {
    key: 'jessica_nl',
    name: 'Jessica',
    provider: 'elevenlabs',
    previewUrl:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/cgSgspJ2msm6clMCkdW9/56a97bf8-b69b-448f-846c-c3a11683d45a.mp3'
  },
  {
    key: 'eric_nl',
    name: 'Eric',
    provider: 'elevenlabs',
    previewUrl:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/cjVigY5qzO86Huf0OWal/d098fda0-6456-4030-b3d8-63aa048c9070.mp3'
  },
  {
    key: 'lotte_nl',
    name: 'Lotte',
    provider: 'elevenlabs',
    previewUrl:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/5f713f17-8f41-4f5b-a0f2-ea0b2f9be8f5.mp3'
  }
];

const DEFAULT_SCHEDULE = {
  maandag: { enabled: true, start: '09:00', end: '17:00' },
  dinsdag: { enabled: true, start: '09:00', end: '17:00' },
  woensdag: { enabled: true, start: '09:00', end: '17:00' },
  donderdag: { enabled: true, start: '09:00', end: '17:00' },
  vrijdag: { enabled: true, start: '09:00', end: '17:00' },
  zaterdag: { enabled: false, start: '10:00', end: '15:00' },
  zondag: { enabled: false, start: '10:00', end: '15:00' }
};

const DEFAULT_SMS_TEMPLATE = {
  title: 'Bevestiging',
  trigger: 'Na gesprek',
  text: 'Bedankt voor je telefoontje. We nemen snel contact met je op.'
};

const DEFAULT_WHATSAPP_TEMPLATE = {
  title: 'Samenvatting',
  trigger: 'Bij terugbelverzoek',
  text: 'Dankjewel voor je bericht. We hebben je verzoek ontvangen en komen erop terug.'
};

const DEFAULT_FAQ = {
  question: 'Wat zijn jullie openingstijden?',
  answer: 'Wij zijn op werkdagen bereikbaar tussen 09:00 en 17:00.'
};

const parseAssistantNameFromUrl = (url, fallback = 'Mijn assistent') => {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsed.hostname.replace('www.', '');
    const [first] = host.split('.');
    if (!first) return fallback;
    return first.charAt(0).toUpperCase() + first.slice(1);
  } catch {
    return fallback;
  }
};

const normalizeSchedule = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_SCHEDULE;
  return Object.entries(DEFAULT_SCHEDULE).reduce((acc, [day, defaults]) => {
    const source = value[day] || {};
    acc[day] = {
      enabled: typeof source.enabled === 'boolean' ? source.enabled : defaults.enabled,
      start: typeof source.start === 'string' ? source.start : defaults.start,
      end: typeof source.end === 'string' ? source.end : defaults.end
    };
    return acc;
  }, {});
};

const hasAtLeastOneFaq = (faqItems) => faqItems.some((item) => item.question.trim() && item.answer.trim());

const getVoiceSubtitle = (voice) => {
  if (voice?.description) return voice.description;

  const accent = voice?.labels?.accent || voice?.labels?.language || '';
  const gender = voice?.labels?.gender || '';
  return [accent, gender].filter(Boolean).join(' • ') || 'Nederlandse ElevenLabs-stem';
};

const Wizard = () => {
  const navigate = useNavigate();
  const { setAssistantConfig, setIsAdmin, apiConfigured, apiConfigMessage } = useAppContext();

  const [currentStep, setCurrentStep] = useState(1);
  const [wizardStage, setWizardStage] = useState('form');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialMessage, setTrialMessage] = useState('');
  const [voices, setVoices] = useState(FALLBACK_VOICES);
  const [avatars, setAvatars] = useState(FALLBACK_AVATARS);
  const [assistantState, setAssistantState] = useState(null);
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false);

  const [form, setForm] = useState({
    assistantName: 'Mijn assistent',
    companyName: 'Mijn Bedrijf',
    avatarKey: 'avatar_01',
    websiteUrl: '',
    primaryGoal: '',
    secondaryLanguage: '',
    smsEnabled: false,
    whatsappEnabled: false,
    smsTemplates: [DEFAULT_SMS_TEMPLATE],
    whatsappTemplates: [DEFAULT_WHATSAPP_TEMPLATE],
    voiceKey: FALLBACK_VOICES[0].key,
    greeting: '',
    toneOfVoice: 'vriendelijk en professioneel',
    roleDescription: '',
    handoffRules: '',
    intakeFields: ['Naam', 'Telefoonnummer', 'Vraag of probleem'],
    faqItems: [DEFAULT_FAQ],
    availabilityMode: 'always',
    availabilitySchedule: DEFAULT_SCHEDULE,
    numberE164: '',
    planKey: 'plan_275'
  });

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

  const refreshState = useCallback(async () => {
    const response = await authFetch('/api/assistant/state');
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || 'Kon assistant status niet laden.');
    }

    setIsAdmin(Boolean(payload?.viewer?.isAdmin));
    setAssistantState(payload);

    setAssistantConfig({
      companyName: payload?.profile?.company_name || payload?.assistant?.display_name || form.companyName,
      voice: payload?.voice?.display_name || 'Niet gekozen',
      voiceKey: payload?.voice?.voice_key || form.voiceKey,
      phoneNumber: payload?.number?.e164 || form.numberE164 || 'Nog niet gekozen',
      assistantId: payload?.assistant?.id,
      liveStatus: payload?.assistant?.live_status,
      billingStatus: payload?.assistant?.billing_status
    });

    return payload;
  }, [authFetch, form.companyName, form.numberE164, form.voiceKey, setAssistantConfig, setIsAdmin]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setSaveError('');

    try {
      const [voiceRes, avatarRes, statePayload] = await Promise.all([
        fetch(apiUrl('/api/voices/options')),
        fetch(apiUrl('/api/avatars/options')),
        refreshState()
      ]);

      const voiceData = await voiceRes.json().catch(() => []);
      const avatarData = await avatarRes.json().catch(() => []);

      const voiceList = Array.isArray(voiceData) && voiceData.length ? voiceData : FALLBACK_VOICES;
      const avatarList = Array.isArray(avatarData) && avatarData.length ? avatarData : FALLBACK_AVATARS;
      setVoices(voiceList);
      setAvatars(avatarList);

      const profile = statePayload?.profile || {};
      const channels = statePayload?.channels || {};
      const wizard = statePayload?.wizard || {};
      const faqItems = Array.isArray(statePayload?.faqItems) ? statePayload.faqItems : [];

      const initialWebsite = profile?.website_url || '';
      const inferredAssistantName =
        statePayload?.identity?.name ||
        statePayload?.assistant?.display_name ||
        (initialWebsite ? parseAssistantNameFromUrl(initialWebsite, 'Mijn assistent') : 'Mijn assistent');

      setForm((prev) => ({
        ...prev,
        assistantName: inferredAssistantName,
        companyName: profile?.company_name || statePayload?.assistant?.display_name || inferredAssistantName,
        avatarKey: statePayload?.identity?.avatarKey || statePayload?.assistant?.avatar_key || avatarList[0].key,
        websiteUrl: initialWebsite,
        primaryGoal: profile?.goals || '',
        secondaryLanguage: profile?.secondary_language || '',
        smsEnabled: Boolean(channels?.smsEnabled),
        whatsappEnabled: Boolean(channels?.whatsappEnabled),
        smsTemplates:
          Array.isArray(channels?.smsTemplates) && channels.smsTemplates.length
            ? channels.smsTemplates
            : [DEFAULT_SMS_TEMPLATE],
        whatsappTemplates:
          Array.isArray(channels?.whatsappTemplates) && channels.whatsappTemplates.length
            ? channels.whatsappTemplates
            : [DEFAULT_WHATSAPP_TEMPLATE],
        voiceKey: statePayload?.voice?.voice_key || voiceList[0].key,
        greeting: profile?.greeting || '',
        toneOfVoice: profile?.tone_of_voice || 'vriendelijk en professioneel',
        roleDescription: profile?.role_description || '',
        handoffRules: profile?.handoff_rules || '',
        faqItems: faqItems.length
          ? faqItems.map((item) => ({ question: item.question || '', answer: item.answer || '' }))
          : [DEFAULT_FAQ],
        availabilityMode: channels?.availabilityMode || 'always',
        availabilitySchedule: normalizeSchedule(channels?.availabilitySchedule),
        numberE164: statePayload?.number?.e164 || '',
        planKey: statePayload?.assistant?.desired_plan || 'plan_275'
      }));

      if (wizard?.completed) {
        setWizardStage('ready');
      }

      setCurrentStep(Math.min(5, Math.max(1, Number(wizard?.step || 1))));
    } catch (error) {
      setSaveError(error?.message || 'Kon setup data niet laden.');
    } finally {
      setLoading(false);
    }
  }, [refreshState]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const selectedAvatar = useMemo(() => {
    return avatars.find((avatar) => avatar.key === form.avatarKey) || avatars[0];
  }, [avatars, form.avatarKey]);

  const selectedPlan = getPlanByKey(form.planKey);

  const validationByStep = useMemo(() => {
    const hasSchedule = Object.values(form.availabilitySchedule || {}).some(
      (slot) => slot.enabled && slot.start && slot.end
    );

    return {
      1: Boolean(form.assistantName.trim() && form.avatarKey),
      2: Boolean(form.websiteUrl.trim() && form.primaryGoal.trim()),
      3: Boolean(form.voiceKey),
      4: Boolean(form.roleDescription.trim() && form.handoffRules.trim() && hasAtLeastOneFaq(form.faqItems)),
      5: Boolean(form.availabilityMode === 'always' || hasSchedule)
    };
  }, [form]);

  const setupChecklist = useMemo(() => {
    return [
      { key: 'identiteit', label: 'Identiteit', done: validationByStep[1] },
      { key: 'website', label: 'Website', done: validationByStep[2] },
      { key: 'stem', label: 'Stem', done: validationByStep[3] },
      { key: 'instructies', label: 'Instructies', done: validationByStep[4] },
      { key: 'bereikbaarheid', label: 'Bereikbaarheid', done: validationByStep[5] }
    ];
  }, [validationByStep]);

  const buildPayload = useCallback(
    (overrides = {}) => ({
      assistantName: form.assistantName,
      companyName: form.companyName || form.assistantName,
      avatarKey: form.avatarKey,
      websiteUrl: form.websiteUrl,
      primaryGoal: form.primaryGoal,
      goals: form.primaryGoal,
      secondaryLanguage: form.secondaryLanguage,
      smsEnabled: form.smsEnabled,
      whatsappEnabled: form.whatsappEnabled,
      callEnabled: true,
      smsTemplates: form.smsTemplates,
      whatsappTemplates: form.whatsappTemplates,
      voiceKey: form.voiceKey,
      greeting:
        form.greeting ||
        `Hoi! Je spreekt met ${form.assistantName} van ${form.companyName || 'ons team'}. Waarmee kan ik helpen?`,
      toneOfVoice: form.toneOfVoice,
      roleDescription: form.roleDescription,
      handoffRules: form.handoffRules,
      faqItems: form.faqItems,
      availabilityMode: form.availabilityMode,
      availabilitySchedule: form.availabilitySchedule,
      numberE164: form.numberE164,
      planKey: form.planKey,
      ...overrides
    }),
    [form]
  );

  const saveStep = useCallback(
    async (step, options = {}) => {
      setSaving(true);
      setSaveError('');

      try {
        const requestBody = JSON.stringify(
          buildPayload({
            setupStep: step,
            setupCompleted: Boolean(options.setupCompleted)
          })
        );

        let response = await authFetch('/api/onboarding/step-save', {
          method: 'POST',
          body: requestBody
        });

        let payload = await response.json().catch(() => ({}));
        if (!response.ok && response.status === 404) {
          response = await authFetch('/api/onboarding/save', {
            method: 'POST',
            body: requestBody
          });
          payload = await response.json().catch(() => ({}));
        }

        if (!response.ok) {
          throw new Error(payload?.error || 'Opslaan van stap mislukt.');
        }

        setAssistantState(payload);
        setAssistantConfig({
          companyName: payload?.profile?.company_name || form.companyName,
          voice: payload?.voice?.display_name || voices.find((voice) => voice.key === form.voiceKey)?.name || 'Niet gekozen',
          voiceKey: payload?.voice?.voice_key || form.voiceKey,
          phoneNumber: payload?.number?.e164 || form.numberE164,
          assistantId: payload?.assistant?.id,
          liveStatus: payload?.assistant?.live_status,
          billingStatus: payload?.assistant?.billing_status
        });

        return payload;
      } catch (error) {
        setSaveError(error?.message || 'Opslaan mislukt.');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [authFetch, buildPayload, form.companyName, form.numberE164, form.voiceKey, setAssistantConfig, voices]
  );

  const handleAiSuggest = async () => {
    setAiSuggestLoading(true);
    setSaveError('');

    try {
      const response = await authFetch('/api/onboarding/ai-suggest', {
        method: 'POST',
        body: JSON.stringify({
          step: STEP_LABELS[currentStep - 1],
          companyName: form.companyName,
          assistantName: form.assistantName,
          businessType: assistantState?.profile?.business_type || '',
          primaryGoal: form.primaryGoal,
          websiteUrl: form.websiteUrl
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'AI suggestie kon niet worden geladen.');

      const suggestions = payload?.suggestions || {};
      setForm((prev) => ({
        ...prev,
        assistantName:
          suggestions?.assistantNameSuggestions?.[0] || prev.assistantName,
        roleDescription: suggestions?.roleDescription || prev.roleDescription,
        handoffRules: suggestions?.handoffRules || prev.handoffRules,
        primaryGoal: suggestions?.primaryGoal || prev.primaryGoal,
        faqItems:
          Array.isArray(suggestions?.faqItems) && suggestions.faqItems.length
            ? suggestions.faqItems
            : prev.faqItems,
        smsTemplates:
          Array.isArray(suggestions?.smsTemplates) && suggestions.smsTemplates.length
            ? suggestions.smsTemplates
            : prev.smsTemplates
      }));
    } catch (error) {
      setSaveError(error?.message || 'AI suggestie mislukt.');
    } finally {
      setAiSuggestLoading(false);
    }
  };

  const handleNext = async () => {
    if (!validationByStep[currentStep]) return;

    if (currentStep < 5) {
      const result = await saveStep(currentStep, { setupCompleted: false });
      if (result) setCurrentStep((prev) => prev + 1);
      return;
    }

    const result = await saveStep(5, { setupCompleted: true });
    if (!result) return;

    setWizardStage('preparing');

    setTimeout(() => {
      setWizardStage('ready');
      setCurrentStep(5);
    }, 2000);
  };

  const handleBack = () => {
    setSaveError('');
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const updateTemplate = (type, index, field, value) => {
    setForm((prev) => {
      const key = type === 'sms' ? 'smsTemplates' : 'whatsappTemplates';
      const next = [...prev[key]];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, [key]: next };
    });
  };

  const addTemplate = (type) => {
    setForm((prev) => {
      const key = type === 'sms' ? 'smsTemplates' : 'whatsappTemplates';
      const template = type === 'sms' ? DEFAULT_SMS_TEMPLATE : DEFAULT_WHATSAPP_TEMPLATE;
      return { ...prev, [key]: [...prev[key], template] };
    });
  };

  const removeTemplate = (type, index) => {
    setForm((prev) => {
      const key = type === 'sms' ? 'smsTemplates' : 'whatsappTemplates';
      const next = prev[key].filter((_, templateIndex) => templateIndex !== index);
      return { ...prev, [key]: next.length ? next : [type === 'sms' ? DEFAULT_SMS_TEMPLATE : DEFAULT_WHATSAPP_TEMPLATE] };
    });
  };

  const updateFaq = (index, field, value) => {
    setForm((prev) => {
      const next = [...prev.faqItems];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, faqItems: next };
    });
  };

  const addFaq = () => {
    setForm((prev) => ({
      ...prev,
      faqItems: [...prev.faqItems, { question: '', answer: '' }]
    }));
  };

  const removeFaq = (index) => {
    setForm((prev) => {
      const next = prev.faqItems.filter((_, faqIndex) => faqIndex !== index);
      return { ...prev, faqItems: next.length ? next : [DEFAULT_FAQ] };
    });
  };

  const toggleIntakeField = (fieldName) => {
    setForm((prev) => {
      const exists = prev.intakeFields.includes(fieldName);
      if (exists) {
        const filtered = prev.intakeFields.filter((entry) => entry !== fieldName);
        return { ...prev, intakeFields: filtered.length ? filtered : prev.intakeFields };
      }
      return { ...prev, intakeFields: [...prev.intakeFields, fieldName] };
    });
  };

  const updateSchedule = (day, field, value) => {
    setForm((prev) => ({
      ...prev,
      availabilitySchedule: {
        ...prev.availabilitySchedule,
        [day]: {
          ...prev.availabilitySchedule[day],
          [field]: value
        }
      }
    }));
  };

  const startTrialFallback = async () => {
    setTrialLoading(true);
    setTrialMessage('');

    try {
      const response = await authFetch('/api/activation/start-trial', {
        method: 'POST',
        body: JSON.stringify({
          planKey: form.planKey
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Trial intent opslaan mislukt.');
      }

      setTrialMessage('Proefperiode-aanvraag staat klaar. Je assistent blijft voorlopig in testmodus tot betaalgoedkeuring.');
      setAssistantState(payload);
    } catch (error) {
      setTrialMessage(error?.message || 'Kon proefperiode niet starten.');
    } finally {
      setTrialLoading(false);
    }
  };

  const playVoice = (previewUrl) => {
    if (!previewUrl) return;
    const audio = new Audio(previewUrl);
    audio.play().catch(() => {});
  };

  const renderStepContent = () => {
    if (loading) {
      return (
        <div className="wizard-v2-loading">
          <Loader2 size={22} className="spin" />
          <p>Setup laden...</p>
        </div>
      );
    }

    if (wizardStage === 'preparing') {
      return (
        <div className="wizard-v2-preparing">
          <img src={selectedAvatar?.imageUrl} alt={selectedAvatar?.label} className="assistant-avatar-large" />
          <h2>{form.assistantName} wordt klaargemaakt</h2>
          <p>We maken alles klaar zodat je direct kunt testen.</p>
          <div className="wizard-progress-line">
            <span />
          </div>
          <small>Je assistent wordt klaargezet...</small>
        </div>
      );
    }

    if (wizardStage === 'ready') {
      return (
        <div className="wizard-v2-ready">
          <img src={selectedAvatar?.imageUrl} alt={selectedAvatar?.label} className="assistant-avatar-large" />
          <h2>{form.assistantName} is klaar</h2>
          <p>Test direct het gesprek in de browser en activeer daarna je live flow.</p>

          <div className="wizard-ready-panel">
            <WebCallPanel
              title="Testgesprek"
              subtitle="Spreek met je assistent alsof je een echte beller bent."
              initialAssistantMessage={
                form.greeting ||
                `Hoi! Je spreekt met ${form.assistantName} van ${form.companyName || 'ons team'}. Waarmee kan ik je helpen?`
              }
              companyName={form.companyName || form.assistantName}
            />
          </div>

          <div className="wizard-ready-actions">
            <button className="btn-secondary" onClick={() => setWizardStage('form')}>
              Setup aanpassen
            </button>
            <button className="btn-primary" onClick={startTrialFallback} disabled={trialLoading}>
              {trialLoading ? 'Proefperiode starten...' : 'Start trial fallback'}
            </button>
            <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
              Naar dashboard
            </button>
          </div>

          {trialMessage && <div className="wizard-feedback">{trialMessage}</div>}
        </div>
      );
    }

    if (currentStep === 1) {
      return (
        <div className="wizard-step-body">
          <div className="step-title-row">
            <span className="step-index">1</span>
            <div>
              <h2>Geef je virtuele assistent een naam</h2>
              <p>Zo herkent een beller direct wie er opneemt.</p>
            </div>
          </div>

          <label className="wizard-field">
            <span>Naam van je assistent</span>
            <input
              type="text"
              className="wizard-input"
              value={form.assistantName}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  assistantName: event.target.value,
                  companyName: prev.companyName || event.target.value
                }))
              }
              placeholder="Bijv. Robin, Sophie, of je bedrijfsnaam"
            />
          </label>

          <div className="wizard-field">
            <span>Kies een avatar</span>
            <div className="avatar-grid">
              {avatars.map((avatar) => (
                <button
                  key={avatar.key}
                  type="button"
                  className={`avatar-choice ${form.avatarKey === avatar.key ? 'active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, avatarKey: avatar.key }))}
                >
                  <img src={avatar.imageUrl} alt={avatar.label} />
                  <small>{avatar.label}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="wizard-step-body">
          <div className="step-title-row">
            <span className="step-index">2</span>
            <div>
              <h2>Snelle setup met je website</h2>
              <p>Vertel waar je assistent vooral bij helpt.</p>
            </div>
          </div>

          <label className="wizard-field">
            <span>Website</span>
            <div className="icon-input">
              <Globe size={16} />
              <input
                type="text"
                className="wizard-input"
                value={form.websiteUrl}
                onChange={(event) => {
                  const nextUrl = event.target.value;
                  setForm((prev) => ({
                    ...prev,
                    websiteUrl: nextUrl,
                    companyName:
                      prev.companyName && prev.companyName !== 'Mijn Bedrijf'
                        ? prev.companyName
                        : parseAssistantNameFromUrl(nextUrl, prev.companyName),
                    assistantName:
                      prev.assistantName && prev.assistantName !== 'Mijn assistent'
                        ? prev.assistantName
                        : parseAssistantNameFromUrl(nextUrl, prev.assistantName)
                  }));
                }}
                placeholder="www.jouwbedrijf.nl"
              />
            </div>
          </label>

          <label className="wizard-field">
            <span>Waar moet je assistent vooral bij helpen?</span>
            <textarea
              rows="4"
              className="wizard-input"
              value={form.primaryGoal}
              onChange={(event) => setForm((prev) => ({ ...prev, primaryGoal: event.target.value }))}
              placeholder="Bijv. vragen beantwoorden, terugbelverzoeken noteren, afspraken plannen"
            />
          </label>

          <div className="wizard-channel-card">
            <div className="channel-head">
              <strong>SMS versturen</strong>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={form.smsEnabled}
                  onChange={(event) => setForm((prev) => ({ ...prev, smsEnabled: event.target.checked }))}
                />
                <span />
              </label>
            </div>
            <p>Korte bevestiging na gesprek of terugbelverzoek.</p>

            {form.smsEnabled && (
              <div className="template-list">
                {form.smsTemplates.map((template, index) => (
                  <div key={`sms-${index}`} className="template-card">
                    <input
                      className="wizard-input"
                      value={template.title || ''}
                      placeholder="Titel"
                      onChange={(event) => updateTemplate('sms', index, 'title', event.target.value)}
                    />
                    <input
                      className="wizard-input"
                      value={template.trigger || ''}
                      placeholder="Wanneer stuur je dit?"
                      onChange={(event) => updateTemplate('sms', index, 'trigger', event.target.value)}
                    />
                    <textarea
                      rows="2"
                      className="wizard-input"
                      value={template.text || ''}
                      placeholder="Berichttekst"
                      onChange={(event) => updateTemplate('sms', index, 'text', event.target.value)}
                    />
                    <button className="text-link" type="button" onClick={() => removeTemplate('sms', index)}>
                      Verwijderen
                    </button>
                  </div>
                ))}
                <button className="btn-secondary" type="button" onClick={() => addTemplate('sms')}>
                  SMS toevoegen
                </button>
              </div>
            )}
          </div>

          <div className="wizard-channel-card">
            <div className="channel-head">
              <strong>WhatsApp follow-up</strong>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={form.whatsappEnabled}
                  onChange={(event) => setForm((prev) => ({ ...prev, whatsappEnabled: event.target.checked }))}
                />
                <span />
              </label>
            </div>
            <p>Basis-instelling: template opslaan (nog geen volledige inbox-automatisering).</p>

            {form.whatsappEnabled && (
              <div className="template-list">
                {form.whatsappTemplates.map((template, index) => (
                  <div key={`wa-${index}`} className="template-card">
                    <input
                      className="wizard-input"
                      value={template.title || ''}
                      placeholder="Titel"
                      onChange={(event) => updateTemplate('wa', index, 'title', event.target.value)}
                    />
                    <input
                      className="wizard-input"
                      value={template.trigger || ''}
                      placeholder="Wanneer stuur je dit?"
                      onChange={(event) => updateTemplate('wa', index, 'trigger', event.target.value)}
                    />
                    <textarea
                      rows="2"
                      className="wizard-input"
                      value={template.text || ''}
                      placeholder="Berichttekst"
                      onChange={(event) => updateTemplate('wa', index, 'text', event.target.value)}
                    />
                    <button className="text-link" type="button" onClick={() => removeTemplate('wa', index)}>
                      Verwijderen
                    </button>
                  </div>
                ))}
                <button className="btn-secondary" type="button" onClick={() => addTemplate('wa')}>
                  WhatsApp template toevoegen
                </button>
              </div>
            )}
          </div>

          <label className="wizard-field">
            <span>Tweede taal (optioneel)</span>
            <select
              className="wizard-input"
              value={form.secondaryLanguage}
              onChange={(event) => setForm((prev) => ({ ...prev, secondaryLanguage: event.target.value }))}
            >
              <option value="">Geen tweede taal</option>
              <option value="Engels">Engels</option>
              <option value="Duits">Duits</option>
              <option value="Frans">Frans</option>
            </select>
          </label>
        </div>
      );
    }

    if (currentStep === 3) {
      const recommendedVoices = voices.slice(0, 2);
      const moreVoices = voices.slice(2);

      return (
        <div className="wizard-step-body">
          <div className="step-title-row">
            <span className="step-index">3</span>
            <div>
              <h2>Kies een stem</h2>
              <p>Klik op beluisteren om een voorbeeld te horen.</p>
            </div>
          </div>

          <div className="voice-block">
            <small>AANBEVOLEN NEDERLANDSE STEMMEN</small>
            {recommendedVoices.map((voice) => (
              <button
                key={voice.key}
                type="button"
                className={`voice-row ${form.voiceKey === voice.key ? 'active' : ''}`}
                onClick={() => setForm((prev) => ({ ...prev, voiceKey: voice.key }))}
              >
                <div>
                  <strong>{voice.name}</strong>
                  <p>{getVoiceSubtitle(voice)}</p>
                </div>
                <div className="voice-actions">
                  <span className="voice-play" onClick={(event) => {
                    event.stopPropagation();
                    playVoice(voice.previewUrl);
                  }}>
                    <Mic size={14} /> Beluisteren
                  </span>
                  {form.voiceKey === voice.key && <span className="selected-pill">Geselecteerd</span>}
                </div>
              </button>
            ))}
          </div>

          {moreVoices.length > 0 && (
            <div className="voice-block">
              <small>MEER NEDERLANDSE STEMMEN</small>
              {moreVoices.map((voice) => (
                <button
                  key={voice.key}
                  type="button"
                  className={`voice-row ${form.voiceKey === voice.key ? 'active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, voiceKey: voice.key }))}
                >
                  <div>
                    <strong>{voice.name}</strong>
                    <p>{getVoiceSubtitle(voice)}</p>
                  </div>
                  <span className="voice-play" onClick={(event) => {
                    event.stopPropagation();
                    playVoice(voice.previewUrl);
                  }}>
                    <Mic size={14} /> Beluisteren
                  </span>
                </button>
              ))}
            </div>
          )}

          <label className="wizard-field">
            <span>Welkomstzin</span>
            <input
              type="text"
              className="wizard-input"
              value={form.greeting}
              onChange={(event) => setForm((prev) => ({ ...prev, greeting: event.target.value }))}
              placeholder={`Hoi! Je spreekt met ${form.assistantName} van ${form.companyName || 'ons team'}.`}
            />
          </label>

          <label className="wizard-field">
            <span>Praatstijl</span>
            <input
              type="text"
              className="wizard-input"
              value={form.toneOfVoice}
              onChange={(event) => setForm((prev) => ({ ...prev, toneOfVoice: event.target.value }))}
              placeholder="Bijv. professioneel, vriendelijk en kort"
            />
          </label>
        </div>
      );
    }

    return (
      <div className="wizard-step-body">
        <div className="step-title-row">
          <span className="step-index">{currentStep}</span>
          <div>
            <h2>{currentStep === 4 ? 'Instructies instellen' : 'Bereikbaarheid instellen'}</h2>
            <p>
              {currentStep === 4
                ? 'Bepaal hoe je assistent reageert en wat hij moet doorsturen.'
                : 'Bepaal wanneer je assistent gesprekken aanneemt.'}
            </p>
          </div>
        </div>

        {currentStep === 4 ? (
          <>
            <label className="wizard-field">
              <span>Rol van je assistent</span>
              <textarea
                rows="4"
                className="wizard-input"
                value={form.roleDescription}
                onChange={(event) => setForm((prev) => ({ ...prev, roleDescription: event.target.value }))}
                placeholder="Bijv. Je bent de vriendelijke telefonische assistent die eerst rustig luistert en dan duidelijk antwoord geeft."
              />
            </label>

            <label className="wizard-field">
              <span>Wanneer moet je assistent doorsturen?</span>
              <textarea
                rows="3"
                className="wizard-input"
                value={form.handoffRules}
                onChange={(event) => setForm((prev) => ({ ...prev, handoffRules: event.target.value }))}
                placeholder="Bijv. Spoed, klacht, of wanneer iemand direct een collega wil spreken."
              />
            </label>

            <div className="wizard-field">
              <span>Welke gegevens moet je assistent altijd opvragen?</span>
              <div className="intake-field-grid">
                {['Naam', 'Telefoonnummer', 'E-mail', 'Bedrijfsnaam', 'Vraag of probleem', 'Gewenste terugbeltijd'].map(
                  (fieldName) => (
                    <label key={fieldName} className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={form.intakeFields.includes(fieldName)}
                        onChange={() => toggleIntakeField(fieldName)}
                      />
                      <span>{fieldName}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            <div className="wizard-field">
              <span>Veelgestelde vragen</span>
              {form.faqItems.map((faq, index) => (
                <div key={`faq-${index}`} className="faq-card">
                  <input
                    className="wizard-input"
                    value={faq.question}
                    placeholder={`FAQ #${index + 1} vraag`}
                    onChange={(event) => updateFaq(index, 'question', event.target.value)}
                  />
                  <textarea
                    rows="2"
                    className="wizard-input"
                    value={faq.answer}
                    placeholder="Antwoord"
                    onChange={(event) => updateFaq(index, 'answer', event.target.value)}
                  />
                  <button className="text-link" type="button" onClick={() => removeFaq(index)}>
                    Verwijderen
                  </button>
                </div>
              ))}
              <button className="btn-secondary" type="button" onClick={addFaq}>
                FAQ toevoegen
              </button>
            </div>

            <button className="btn-secondary" type="button" onClick={handleAiSuggest} disabled={aiSuggestLoading}>
              <Sparkles size={16} /> {aiSuggestLoading ? 'AI denkt mee...' : 'AI suggestie'}
            </button>
          </>
        ) : (
          <>
            <div className="availability-choice-grid">
              <button
                type="button"
                className={`availability-card ${form.availabilityMode === 'always' ? 'active' : ''}`}
                onClick={() => setForm((prev) => ({ ...prev, availabilityMode: 'always' }))}
              >
                <strong>Altijd beschikbaar</strong>
                <p>Bellers worden direct geholpen.</p>
              </button>
              <button
                type="button"
                className={`availability-card ${form.availabilityMode === 'custom_hours' ? 'active' : ''}`}
                onClick={() => setForm((prev) => ({ ...prev, availabilityMode: 'custom_hours' }))}
              >
                <strong>Alleen op tijden</strong>
                <p>Je bepaalt per dag wanneer de assistent opneemt.</p>
              </button>
            </div>

            {form.availabilityMode === 'custom_hours' && (
              <div className="schedule-grid">
                {Object.entries(form.availabilitySchedule).map(([day, slot]) => (
                  <div key={day} className="schedule-row">
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={slot.enabled}
                        onChange={(event) => updateSchedule(day, 'enabled', event.target.checked)}
                      />
                      <span>{day}</span>
                    </label>
                    <input
                      type="time"
                      className="wizard-input"
                      value={slot.start}
                      onChange={(event) => updateSchedule(day, 'start', event.target.value)}
                      disabled={!slot.enabled}
                    />
                    <input
                      type="time"
                      className="wizard-input"
                      value={slot.end}
                      onChange={(event) => updateSchedule(day, 'end', event.target.value)}
                      disabled={!slot.enabled}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="wizard-plan-card">
              <strong>Gekozen pakket: {selectedPlan.name}</strong>
              <p>
                €{selectedPlan.monthlyPriceEur}/maand · {selectedPlan.includedMinutes} minuten inbegrepen ·
                overage €{selectedPlan.overageMinuteEur.toFixed(2)}/min
              </p>
            </div>
          </>
        )}
      </div>
    );
  };

  const completedSteps = setupChecklist.filter((item) => item.done).length;

  return (
    <div className="wizard-v2-page animate-fade-in">
      <div className="wizard-v2-overlay" />

      {!apiConfigured && <div className="wizard-alert-top">{apiConfigMessage}</div>}
      {saveError && <div className="wizard-alert-top wizard-alert-error">{saveError}</div>}

      <div className="wizard-v2-modal">
        {wizardStage === 'form' && (
          <>
            <div className="wizard-v2-progress-head">
              <div>
                <small>Stap {currentStep} van 5</small>
                <div className="progress-segments">
                  {STEP_LABELS.map((_, index) => (
                    <span key={index} className={index + 1 <= currentStep ? 'filled' : ''} />
                  ))}
                </div>
              </div>
              <strong>{STEP_LABELS[currentStep - 1]}</strong>
            </div>

            <div className="wizard-v2-content">{renderStepContent()}</div>

            <div className="wizard-v2-footer">
              <button className="btn-secondary" onClick={handleBack} disabled={currentStep === 1 || saving}>
                <ChevronLeft size={16} /> Terug
              </button>
              <button className="btn-primary" onClick={handleNext} disabled={!validationByStep[currentStep] || saving}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="spin" /> Opslaan...
                  </>
                ) : currentStep === 5 ? (
                  <>
                    Afronden en direct testen <ChevronRight size={16} />
                  </>
                ) : (
                  <>
                    Volgende <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {wizardStage !== 'form' && <div className="wizard-v2-content wizard-stage-full">{renderStepContent()}</div>}
      </div>

      <aside className="wizard-floating-setup">
        <div className="setup-widget-head">
          <div>
            <strong>Setup</strong>
            <small>
              {completedSteps} / {setupChecklist.length} stappen
            </small>
          </div>
          <Bot size={16} />
        </div>

        <div className="setup-widget-list">
          {setupChecklist.map((item, index) => (
            <button
              key={item.key}
              type="button"
              className={`setup-widget-item ${item.done ? 'done' : ''} ${currentStep === index + 1 ? 'active' : ''}`}
              onClick={() => setCurrentStep(index + 1)}
            >
              <span className="dot">{item.done ? <Check size={12} /> : index + 1}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {assistantState?.assistant?.live_status === 'live' ? (
          <div className="setup-live-pill">Je assistent staat live</div>
        ) : (
          <div className="setup-live-pill muted">Nog in testmodus</div>
        )}
      </aside>
    </div>
  );
};

export default Wizard;
