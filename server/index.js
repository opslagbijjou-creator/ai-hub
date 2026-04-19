import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import OpenAI from 'openai';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '4mb' }));

const PORT = Number.parseInt(process.env.PORT || '3001', 10);

const {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY,
  OPENAI_MODEL = 'gpt-4o-mini',
  ELEVENLABS_API_KEY,
  ELEVENLABS_MODEL_ID = 'eleven_flash_v2_5',
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  PUBLIC_API_BASE_URL,
  ADMIN_APPROVAL_KEY,
  ALLOW_SIMULATED_PROVISIONING = 'true'
} = process.env;

const LEGACY_SERVER_ALLOW_PRODUCTION = String(process.env.ALLOW_LEGACY_SERVER_IN_PRODUCTION || '').toLowerCase() === 'true';
const LEGACY_SERVER_DISABLED_IN_PRODUCTION =
  process.env.NODE_ENV === 'production' && !LEGACY_SERVER_ALLOW_PRODUCTION;

const twilioClient =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

app.use((req, res, next) => {
  if (!LEGACY_SERVER_DISABLED_IN_PRODUCTION) {
    return next();
  }

  res.set('Cache-Control', 'no-store');
  if (req.path === '/api/health') {
    return res.status(410).json({
      ok: false,
      deprecated: true,
      backend: 'supabase-call-api'
    });
  }

  return res.status(410).json({
    error: 'Legacy Express backend is disabled in production. Use the Supabase call-api function.'
  });
});

function buildSupabaseClient(apiKey, accessToken = null) {
  if (!SUPABASE_URL || !apiKey) return null;
  return createClient(SUPABASE_URL, apiKey, {
    auth: { persistSession: false },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      : undefined
  });
}

const supabaseAuth = buildSupabaseClient(SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY);
const supabaseAdmin = buildSupabaseClient(SUPABASE_SERVICE_ROLE_KEY);
const allowSimulatedProvisioning = String(ALLOW_SIMULATED_PROVISIONING).toLowerCase() !== 'false';

const VOICE_OPTIONS = [
  {
    key: 'jessica_nl',
    name: 'Jessica (Female)',
    provider: 'elevenlabs',
    externalVoiceId: 'cgSgspJ2msm6clMCkdW9',
    previewUrl:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/cgSgspJ2msm6clMCkdW9/56a97bf8-b69b-448f-846c-c3a11683d45a.mp3',
    twilioVoice: 'alice'
  },
  {
    key: 'eric_nl',
    name: 'Eric (Male)',
    provider: 'elevenlabs',
    externalVoiceId: 'cjVigY5qzO86Huf0OWal',
    previewUrl:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/cjVigY5qzO86Huf0OWal/d098fda0-6456-4030-b3d8-63aa048c9070.mp3',
    twilioVoice: 'alice'
  },
  {
    key: 'lotte_nl',
    name: 'Lotte (Professional)',
    provider: 'elevenlabs',
    externalVoiceId: 'EXAVITQu4vr4xnSDxMaL',
    previewUrl:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/5f713f17-8f41-4f5b-a0f2-ea0b2f9be8f5.mp3',
    twilioVoice: 'alice'
  }
];

const LEGACY_VOICE_KEY_BY_ID = {
  cgSgspJ2msm6clMCkdW9: 'jessica_nl',
  cjVigY5qzO86Huf0OWal: 'eric_nl',
  EXAVITQu4vr4xnSDxMaL: 'lotte_nl'
};

const VOICE_OPTIONS_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedDutchVoiceOptions = [];
let cachedDutchVoiceOptionsAt = 0;

const DEFAULT_NUMBERS = [
  { e164: '+31208081234', label: 'Amsterdam, NL', countryCode: 'NL', source: 'catalog' },
  { e164: '+31103456789', label: 'Rotterdam, NL', countryCode: 'NL', source: 'catalog' },
  { e164: '+31859990000', label: 'National, NL', countryCode: 'NL', source: 'catalog' }
];

const PLAN_CATALOG = {
  plan_150: {
    key: 'plan_150',
    name: 'Launch',
    monthlyPriceEur: 299,
    includedMinutes: 180,
    includedTasks: 450,
    overageMinuteEur: 1.15,
    overageTaskEur: 0.08
  },
  plan_275: {
    key: 'plan_275',
    name: 'Growth',
    monthlyPriceEur: 499,
    includedMinutes: 420,
    includedTasks: 1100,
    overageMinuteEur: 1.05,
    overageTaskEur: 0.07
  },
  plan_500: {
    key: 'plan_500',
    name: 'Scale',
    monthlyPriceEur: 799,
    includedMinutes: 900,
    includedTasks: 2500,
    overageMinuteEur: 0.95,
    overageTaskEur: 0.06
  },
  plan_850: {
    key: 'plan_850',
    name: 'Enterprise',
    monthlyPriceEur: 1199,
    includedMinutes: 1600,
    includedTasks: 4500,
    overageMinuteEur: 0.85,
    overageTaskEur: 0.05
  }
};

const DEFAULT_PLAN = PLAN_CATALOG.plan_150;
const COST_ASSUMPTIONS = {
  fixedMonthlyCostEur: 35,
  minuteVendorCostEur: 0.12,
  taskVendorCostEur: 0.01,
  corpTaxRate: 0.19
};

function nowIso() {
  return new Date().toISOString();
}

function normalizePlanKey(value) {
  if (!value) return DEFAULT_PLAN.key;
  const key = String(value).trim().toLowerCase();
  return PLAN_CATALOG[key] ? key : DEFAULT_PLAN.key;
}

function getPlanConfig(planKey) {
  return PLAN_CATALOG[normalizePlanKey(planKey)] || DEFAULT_PLAN;
}

function estimatePlanMetrics(plan) {
  const minuteCosts = plan.includedMinutes * COST_ASSUMPTIONS.minuteVendorCostEur;
  const taskCosts = plan.includedTasks * COST_ASSUMPTIONS.taskVendorCostEur;
  const estimatedCogs = COST_ASSUMPTIONS.fixedMonthlyCostEur + minuteCosts + taskCosts;
  const preTaxProfit = plan.monthlyPriceEur - estimatedCogs;
  const preTaxMargin = plan.monthlyPriceEur > 0 ? preTaxProfit / plan.monthlyPriceEur : 0;
  const netProfit = preTaxProfit * (1 - COST_ASSUMPTIONS.corpTaxRate);
  const netMargin = plan.monthlyPriceEur > 0 ? netProfit / plan.monthlyPriceEur : 0;

  return {
    estimatedCogsEur: Number(Math.max(estimatedCogs, 0).toFixed(2)),
    preTaxMarginPct: Number((Math.max(preTaxMargin, 0) * 100).toFixed(1)),
    netMarginPct: Number((Math.max(netMargin, 0) * 100).toFixed(1))
  };
}

function normalizePhoneNumber(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const withPlus = raw.startsWith('+') ? raw : `+${raw}`;
  return withPlus.replace(/(?!^)\+/g, '').replace(/[^+\d]/g, '');
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry || '').trim())
      .filter(Boolean)
      .slice(0, 100);
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n,]/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, 100);
  }

  return [];
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'ja', 'aan', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'nee', 'uit', 'off'].includes(normalized)) return false;
  }
  return fallback;
}

function normalizeStep(value, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(5, Math.max(1, Math.round(parsed)));
}

function safeText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function isMissingTableError(error) {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42P01' || message.includes('does not exist') || message.includes('schema cache');
}

function migrationError() {
  return 'Database schema ontbreekt. Run server/sql/call_assistant_migration.sql in Supabase SQL Editor.';
}

function assertSupabaseReady() {
  if (!supabaseAuth) {
    throw new Error('Supabase configuratie ontbreekt op de server. Zet SUPABASE_URL en key env vars.');
  }
}

function getDbClient(accessToken = null) {
  if (supabaseAdmin) return supabaseAdmin;
  if (accessToken && SUPABASE_ANON_KEY) {
    return buildSupabaseClient(SUPABASE_ANON_KEY, accessToken);
  }
  return supabaseAuth;
}

function getServiceClient() {
  return supabaseAdmin || supabaseAuth;
}

function getBaseUrl(req) {
  const configured = String(PUBLIC_API_BASE_URL || '').trim().replace(/\/$/, '');
  if (configured) return configured;
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  return `${proto}://${req.get('host')}`;
}

function route(method, path, ...handlers) {
  app[method](path, ...handlers);
  if (path.startsWith('/api/')) {
    app[method](`/functions/v1/${path.slice(5)}`, ...handlers);
  }
}

function sendDbError(res, error) {
  if (isMissingTableError(error)) {
    return res.status(500).json({ error: migrationError() });
  }
  return res.status(500).json({ error: error?.message || 'Database fout.' });
}

async function requireAuth(req, res, next) {
  try {
    assertSupabaseReady();

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Niet ingelogd (token ontbreekt).' });
    }

    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Ongeldige of verlopen sessie.' });
    }

    req.user = data.user;
    req.accessToken = token;
    return next();
  } catch (error) {
    return res.status(401).json({ error: error?.message || 'Authenticatie mislukt.' });
  }
}

function isAdminRequest(req) {
  const providedKey = String(req.headers['x-admin-key'] || '').trim();
  const expectedKey = String(ADMIN_APPROVAL_KEY || '').trim();
  return Boolean(expectedKey && providedKey && providedKey === expectedKey);
}

function requireAdmin(req, res, next) {
  if (isAdminRequest(req)) return next();
  return res.status(401).json({ error: 'Admin key ontbreekt of is ongeldig.' });
}

function onboardingFromPayload(payload = {}) {
  const hasSetupStep = Object.prototype.hasOwnProperty.call(payload, 'setupStep');
  const hasSetupCompleted = Object.prototype.hasOwnProperty.call(payload, 'setupCompleted');

  return {
    companyName: safeText(payload.companyName, 'Mijn Bedrijf'),
    businessType: safeText(payload.businessType),
    services: normalizeArray(payload.services),
    pricing: safeText(payload.pricing),
    openingHours: safeText(payload.openingHours),
    toneOfVoice: safeText(payload.toneOfVoice, 'professioneel en vriendelijk'),
    goals: safeText(payload.goals),
    greeting: safeText(payload.greeting),
    knowledge: safeText(payload.knowledge),
    voiceKey: safeText(payload.voiceKey, VOICE_OPTIONS[0].key),
    numberE164: normalizePhoneNumber(payload.numberE164 || payload.phoneNumber),
    numberLabel: safeText(payload.numberLabel),
    planKey: normalizePlanKey(payload.planKey),
    setupStep: hasSetupStep ? normalizeStep(payload.setupStep, 1) : undefined,
    setupCompleted: hasSetupCompleted ? normalizeBoolean(payload.setupCompleted, false) : undefined
  };
}

function getVoiceOption(voiceKey) {
  return VOICE_OPTIONS.find((voice) => voice.key === voiceKey) || VOICE_OPTIONS[0];
}

function normalizeLookupText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function voiceMatchesDutchProfile(voice = {}) {
  const labelValues = voice?.labels && typeof voice.labels === 'object' ? Object.values(voice.labels) : [];
  const verifiedLanguageValues = Array.isArray(voice?.verified_languages)
    ? voice.verified_languages.flatMap((entry) => [entry?.language, entry?.locale, entry?.name])
    : [];

  const candidateValues = [...labelValues, ...verifiedLanguageValues, voice?.description, voice?.name]
    .map((entry) => normalizeLookupText(entry))
    .filter(Boolean);

  return candidateValues.some(
    (entry) =>
      entry === 'dutch' ||
      entry === 'nederlands' ||
      entry.startsWith('nl') ||
      entry.includes('dutch') ||
      entry.includes('nederlands') ||
      entry.includes('netherlands') ||
      entry.includes('nederland')
  );
}

function mergeVoiceOptions(primary, fallback) {
  const merged = new Map();

  for (const option of [...primary, ...fallback]) {
    if (!option?.key) continue;
    if (!merged.has(option.key)) {
      merged.set(option.key, option);
    }
  }

  return Array.from(merged.values()).sort((left, right) => {
    const previewScore = Number(Boolean(right?.previewUrl)) - Number(Boolean(left?.previewUrl));
    if (previewScore !== 0) return previewScore;
    return safeText(left?.name).localeCompare(safeText(right?.name), 'nl');
  });
}

function mapElevenLabsVoiceOption(voice = {}) {
  const voiceId = safeText(voice?.voice_id);
  const previewUrl = safeText(voice?.preview_url);
  const labels = voice?.labels && typeof voice.labels === 'object' ? voice.labels : {};
  const accent = safeText(labels?.accent || labels?.language || 'Nederlands');
  const gender = safeText(labels?.gender);
  const descriptor = [accent, gender].filter(Boolean).join(' • ');

  return {
    key: LEGACY_VOICE_KEY_BY_ID[voiceId] || `elevenlabs_${voiceId}`,
    name: safeText(voice?.name, 'Nederlandse stem'),
    provider: 'elevenlabs',
    externalVoiceId: voiceId,
    previewUrl: previewUrl || null,
    twilioVoice: 'alice',
    category: safeText(voice?.category || 'elevenlabs'),
    description: safeText(voice?.description || descriptor || 'Nederlandse ElevenLabs-stem'),
    labels
  };
}

async function fetchDutchElevenLabsVoiceOptions() {
  if (!ELEVENLABS_API_KEY) return [];

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    if (!response.ok) {
      const reason = await response.text();
      console.warn('ElevenLabs voices waarschuwing:', reason.slice(0, 240));
      return [];
    }

    const payload = await response.json();
    const voices = Array.isArray(payload?.voices) ? payload.voices : [];

    return voices
      .filter((voice) => voiceMatchesDutchProfile(voice))
      .map((voice) => mapElevenLabsVoiceOption(voice))
      .filter((voice) => Boolean(voice.externalVoiceId));
  } catch (error) {
    console.warn('ElevenLabs voices fout:', error?.message || error);
    return [];
  }
}

async function getAvailableVoiceOptions() {
  const cacheIsFresh =
    cachedDutchVoiceOptions.length > 0 && Date.now() - cachedDutchVoiceOptionsAt < VOICE_OPTIONS_CACHE_TTL_MS;

  if (cacheIsFresh) {
    return cachedDutchVoiceOptions;
  }

  const remoteVoices = await fetchDutchElevenLabsVoiceOptions();
  const resolvedVoices = remoteVoices.length ? mergeVoiceOptions(remoteVoices, VOICE_OPTIONS) : VOICE_OPTIONS;

  cachedDutchVoiceOptions = resolvedVoices;
  cachedDutchVoiceOptionsAt = Date.now();

  return resolvedVoices;
}

async function resolveVoiceOptionByKey(voiceKey) {
  const availableVoices = await getAvailableVoiceOptions();
  return availableVoices.find((voice) => voice.key === voiceKey) || getVoiceOption(voiceKey);
}

function buildAssistantPrompt({ profile = {}, assistant = {}, voice = {}, number = {} }) {
  const safeProfile = profile && typeof profile === 'object' ? profile : {};
  const safeAssistant = assistant && typeof assistant === 'object' ? assistant : {};
  const safeVoice = voice && typeof voice === 'object' ? voice : {};
  const safeNumber = number && typeof number === 'object' ? number : {};

  const services = Array.isArray(safeProfile.services) ? safeProfile.services : [];
  const servicesText = services.length > 0 ? services.join(', ') : 'niet gespecificeerd';
  const openingHours = safeProfile.opening_hours || safeProfile.openingHours || 'onbekend';
  const pricing = safeProfile.pricing || 'niet ingevuld';
  const goals = safeProfile.goals || 'beantwoord vragen en help met opvolging';
  const tone = safeProfile.tone_of_voice || safeProfile.toneOfVoice || 'vriendelijk en duidelijk';
  const company = safeProfile.company_name || safeAssistant.display_name || 'dit bedrijf';
  const selectedNumber = safeNumber.e164 || 'nog niet live';

  return [
    'Je bent een Nederlandse AI telefoon-assistent voor inkomende klantgesprekken.',
    `Bedrijf: ${company}`,
    `Diensten: ${servicesText}`,
    `Prijzen: ${pricing}`,
    `Openingstijden: ${openingHours}`,
    `Doel van gesprek: ${goals}`,
    `Tone of voice: ${tone}`,
    `Gekozen stem: ${safeVoice.display_name || 'standaard stem'}`,
    `Gekozen nummer: ${selectedNumber}`,
    'Regels:',
    '- Geef korte, natuurlijke antwoorden.',
    '- Stel 1 vervolgvraag als informatie ontbreekt.',
    '- Bevestig belangrijke details hardop (naam, datum, tijd).',
    '- Als iets onbekend is, zeg dat eerlijk en bied een terugbelnotitie aan.',
    '- Spreek standaard Nederlands, tenzij de beller duidelijk een andere taal gebruikt.'
  ].join('\n');
}

function fallbackAssistantReply(input, companyName) {
  if (!input) {
    return `Goedemiddag, je spreekt met de digitale assistent van ${companyName}. Waar kan ik je mee helpen?`;
  }

  return `Dank voor je vraag. Ik help je graag verder. Kun je iets meer details geven zodat ik direct de juiste info voor ${companyName} kan geven?`;
}

async function ensureAssistant(dbClient, userId) {
  const { data, error } = await dbClient.from('assistants').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (data) return data;

  const payload = {
    user_id: userId,
    status: 'draft',
    live_status: 'not_live',
    billing_status: 'none',
    desired_plan: DEFAULT_PLAN.key,
    display_name: null,
    prompt: null,
    language: 'nl-NL',
    currency: 'EUR',
    updated_at: nowIso()
  };

  const { data: inserted, error: insertError } = await dbClient
    .from('assistants')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (insertError) throw insertError;
  return inserted;
}

async function fetchSelectedVoice(dbClient, assistantId) {
  const { data, error } = await dbClient
    .from('assistant_voices')
    .select('*')
    .eq('assistant_id', assistantId)
    .eq('selected', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function fetchSelectedNumber(dbClient, assistantId) {
  const { data, error } = await dbClient
    .from('assistant_numbers')
    .select('*')
    .eq('assistant_id', assistantId)
    .eq('selected', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function fetchProfile(dbClient, assistantId) {
  const { data, error } = await dbClient
    .from('assistant_profiles')
    .select('*')
    .eq('assistant_id', assistantId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function upsertUsage(dbClient, payload) {
  try {
    const { error } = await dbClient.from('usage_ledger').insert(payload);
    if (error) throw error;
  } catch (error) {
    if (!isMissingTableError(error)) {
      console.warn('Usage ledger write waarschuwing:', error?.message || error);
    }
  }
}

async function createWebCallAudio(text, voice) {
  if (!ELEVENLABS_API_KEY) return null;

  const voiceId = voice?.external_voice_id || voice?.externalVoiceId || getVoiceOption(voice?.voice_key).externalVoiceId;
  if (!voiceId) return null;

  const clippedText = String(text || '').slice(0, 450);
  if (!clippedText) return null;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        model_id: ELEVENLABS_MODEL_ID,
        text: clippedText,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
          style: 0.25,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const reason = await response.text();
      console.warn('ElevenLabs TTS waarschuwing:', reason);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString('base64');
    return `data:audio/mpeg;base64,${base64}`;
  } catch (error) {
    console.warn('ElevenLabs TTS fout:', error?.message || error);
    return null;
  }
}

async function generateReply({ systemPrompt, history, userText, fallbackCompanyName }) {
  if (!openai) {
    return fallbackAssistantReply(userText, fallbackCompanyName);
  }

  try {
    const messages = [{ role: 'system', content: systemPrompt }];

    for (const item of history.slice(-12)) {
      if (item.role === 'user' || item.role === 'assistant') {
        messages.push({ role: item.role, content: String(item.content || '') });
      }
    }

    messages.push({ role: 'user', content: userText });

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.45,
      messages
    });

    const text = completion.choices?.[0]?.message?.content?.trim();
    return text || fallbackAssistantReply(userText, fallbackCompanyName);
  } catch (error) {
    console.warn('OpenAI generate waarschuwing:', error?.message || error);
    return fallbackAssistantReply(userText, fallbackCompanyName);
  }
}

async function configureTwilioNumber({ phoneSid, baseUrl }) {
  if (!twilioClient || !phoneSid) return;

  const voiceUrl = `${baseUrl}/api/twilio/voice`;
  const statusCallback = `${baseUrl}/api/twilio/status`;

  await twilioClient.incomingPhoneNumbers(phoneSid).update({
    voiceMethod: 'POST',
    voiceUrl,
    statusCallback,
    statusCallbackMethod: 'POST'
  });
}

async function findOwnedTwilioNumberSid(targetE164) {
  if (!twilioClient || !targetE164) return null;

  const incoming = await twilioClient.incomingPhoneNumbers.list({ limit: 100 });
  const normalizedTarget = normalizePhoneNumber(targetE164);

  const match = incoming.find((item) => normalizePhoneNumber(item.phoneNumber) === normalizedTarget);
  return match?.sid || null;
}

async function runProvisioningJob({ dbClient, jobId, baseUrl }) {
  const { data: job, error: jobError } = await dbClient
    .from('provisioning_jobs')
    .select('*')
    .eq('id', jobId)
    .single();
  if (jobError) throw jobError;

  if (job.status === 'success') {
    return { status: 'success', reused: true, job };
  }

  const startedAt = nowIso();
  await dbClient
    .from('provisioning_jobs')
    .update({ status: 'processing', started_at: startedAt, updated_at: startedAt })
    .eq('id', jobId);

  const { data: assistant, error: assistantError } = await dbClient
    .from('assistants')
    .select('*')
    .eq('id', job.assistant_id)
    .single();
  if (assistantError) throw assistantError;

  if (!['paid_approved', 'active', 'live'].includes(assistant.billing_status)) {
    const failedAt = nowIso();
    await dbClient
      .from('provisioning_jobs')
      .update({
        status: 'failed',
        error_message: 'Klant is nog niet op paid_approved gezet.',
        completed_at: failedAt,
        updated_at: failedAt
      })
      .eq('id', jobId);

    return { status: 'failed', reason: 'not_paid_approved' };
  }

  const selectedVoice = await fetchSelectedVoice(dbClient, assistant.id);
  const selectedNumber = await fetchSelectedNumber(dbClient, assistant.id);

  if (!selectedVoice || !selectedNumber) {
    const failedAt = nowIso();
    await dbClient
      .from('provisioning_jobs')
      .update({
        status: 'failed',
        error_message: 'Voice of nummer ontbreekt.',
        completed_at: failedAt,
        updated_at: failedAt
      })
      .eq('id', jobId);
    return { status: 'failed', reason: 'missing_voice_or_number' };
  }

  let phoneSid = selectedNumber.twilio_phone_sid || null;
  let provisioningMode = 'simulated';

  if (twilioClient) {
    if (!phoneSid && selectedNumber.e164) {
      phoneSid = await findOwnedTwilioNumberSid(selectedNumber.e164);
    }

    if (!phoneSid) {
      const needsAt = nowIso();
      await dbClient.from('assistant_numbers').update({ status: 'needs_number_reselect', updated_at: needsAt }).eq('id', selectedNumber.id);

      await dbClient
        .from('assistants')
        .update({ live_status: 'needs_number_reselect', status: 'needs_number_reselect', updated_at: needsAt })
        .eq('id', assistant.id);

      await dbClient
        .from('provisioning_jobs')
        .update({
          status: 'needs_number_reselect',
          error_message: 'Gekozen nummer is niet gevonden in Twilio account.',
          completed_at: needsAt,
          updated_at: needsAt
        })
        .eq('id', jobId);

      return { status: 'needs_number_reselect' };
    }

    await configureTwilioNumber({ phoneSid, baseUrl });
    provisioningMode = 'twilio_live';
  } else if (!allowSimulatedProvisioning) {
    const failedAt = nowIso();
    await dbClient
      .from('provisioning_jobs')
      .update({
        status: 'failed',
        error_message: 'Twilio credentials ontbreken en simulatie staat uit.',
        completed_at: failedAt,
        updated_at: failedAt
      })
      .eq('id', jobId);

    return { status: 'failed', reason: 'twilio_missing' };
  }

  const completedAt = nowIso();

  await dbClient
    .from('assistant_numbers')
    .update({
      twilio_phone_sid: phoneSid,
      status: provisioningMode === 'twilio_live' ? 'live' : 'simulated_live',
      linked_at: completedAt,
      updated_at: completedAt
    })
    .eq('id', selectedNumber.id);

  await dbClient
    .from('assistants')
    .update({
      status: 'live',
      live_status: 'live',
      billing_status: 'active',
      live_at: completedAt,
      updated_at: completedAt
    })
    .eq('id', assistant.id);

  const plan = getPlanConfig(assistant.desired_plan);

  await dbClient.from('subscription_state').upsert(
    {
      assistant_id: assistant.id,
      user_id: assistant.user_id,
      plan_key: plan.key,
      status: 'active',
      included_minutes: plan.includedMinutes,
      included_tasks: plan.includedTasks,
      current_period_start: completedAt,
      current_period_end: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: completedAt
    },
    { onConflict: 'assistant_id' }
  );

  await dbClient
    .from('provisioning_jobs')
    .update({
      status: 'success',
      error_message: null,
      completed_at: completedAt,
      updated_at: completedAt,
      result: {
        mode: provisioningMode,
        number: selectedNumber?.e164 || null,
        phoneSid
      }
    })
    .eq('id', jobId);

  await upsertUsage(dbClient, {
    assistant_id: assistant.id,
    user_id: assistant.user_id,
    usage_type: 'provisioning',
    quantity: 1,
    unit: 'job',
    amount_eur: 0,
    metadata: {
      mode: provisioningMode
    },
    occurred_at: completedAt
  });

  return {
    status: 'success',
    mode: provisioningMode,
    phoneSid,
    assistantId: assistant.id,
    number: selectedNumber?.e164 || null
  };
}

route('get', '/api/health', async (_req, res) => {
  res.json({
    ok: true,
    service: 'ai-hub-call-backend',
    uptimeSec: Math.round(process.uptime()),
    now: nowIso(),
    features: {
      openai: Boolean(openai),
      elevenlabs: Boolean(ELEVENLABS_API_KEY),
      twilio: Boolean(twilioClient),
      supabaseServiceRole: Boolean(supabaseAdmin)
    }
  });
});

route('get', '/api/voices/options', async (_req, res) => {
  res.json(await getAvailableVoiceOptions());
});

route('get', '/api/pricing/plans', (_req, res) => {
  const plans = Object.values(PLAN_CATALOG).map((plan) => ({
    ...plan,
    metrics: estimatePlanMetrics(plan)
  }));

  res.json({
    plans,
    assumptions: COST_ASSUMPTIONS
  });
});

route('get', '/api/numbers/options', requireAuth, async (req, res) => {
  try {
    const options = [];

    if (twilioClient) {
      const incoming = await twilioClient.incomingPhoneNumbers.list({ limit: 40 });
      for (const number of incoming) {
        options.push({
          e164: normalizePhoneNumber(number.phoneNumber),
          label: number.friendlyName || number.phoneNumber,
          countryCode: number.isoCountry || 'NL',
          source: 'twilio_owned',
          twilioPhoneSid: number.sid
        });
      }
    }

    if (options.length === 0) {
      res.json(DEFAULT_NUMBERS);
      return;
    }

    res.json(options);
  } catch (error) {
    console.warn('Numbers options fallback:', error?.message || error);
    res.json(DEFAULT_NUMBERS);
  }
});

route('get', '/api/assistant/state', requireAuth, async (req, res) => {
  try {
    const dbClient = getDbClient(req.accessToken);
    const assistant = await ensureAssistant(dbClient, req.user.id);
    const profile = await fetchProfile(dbClient, assistant.id);
    const voice = await fetchSelectedVoice(dbClient, assistant.id);
    const number = await fetchSelectedNumber(dbClient, assistant.id);

    const { data: invoice } = await dbClient
      .from('invoices')
      .select('*')
      .eq('assistant_id', assistant.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: provisioningJob } = await dbClient
      .from('provisioning_jobs')
      .select('*')
      .eq('assistant_id', assistant.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: subscription } = await dbClient
      .from('subscription_state')
      .select('*')
      .eq('assistant_id', assistant.id)
      .maybeSingle();

    const selectedPlan = getPlanConfig(subscription?.plan_key || assistant.desired_plan);
    const wizardStep = normalizeStep(assistant?.setup_step, 1);
    const wizardCompleted = normalizeBoolean(assistant?.setup_completed, false);
    const wizardChecklist = [
      { key: 'identiteit', label: 'Identiteit', done: wizardCompleted || wizardStep > 1 },
      { key: 'website', label: 'Website', done: wizardCompleted || wizardStep > 2 },
      { key: 'stem', label: 'Stem', done: wizardCompleted || wizardStep > 3 },
      { key: 'instructies', label: 'Instructies', done: wizardCompleted || wizardStep > 4 },
      { key: 'bereikbaarheid', label: 'Bereikbaarheid', done: wizardCompleted }
    ];
    const wizardCompletedCount = wizardChecklist.filter((entry) => entry.done).length;

    res.json({
      assistant,
      profile,
      voice,
      number,
      identity: {
        name: assistant?.display_name || profile?.company_name || 'Mijn assistent',
        avatarKey: assistant?.avatar_key || 'avatar_01',
        avatar: null
      },
      wizard: {
        step: wizardStep,
        completed: wizardCompleted,
        completedCount: wizardCompletedCount,
        checklist: wizardChecklist
      },
      latestInvoice: invoice || null,
      latestProvisioningJob: provisioningJob || null,
      subscription: subscription || null,
      plan: {
        ...selectedPlan,
        metrics: estimatePlanMetrics(selectedPlan)
      }
    });
  } catch (error) {
    sendDbError(res, error);
  }
});

async function handleOnboardingSave(req, res, overridePayload = null) {
  try {
    const dbClient = getDbClient(req.accessToken);
    const assistant = await ensureAssistant(dbClient, req.user.id);
    const payload = onboardingFromPayload(overridePayload || req.body || {});
    const selectedVoiceOption = await resolveVoiceOptionByKey(payload.voiceKey);

    const profilePayload = {
      assistant_id: assistant.id,
      user_id: req.user.id,
      company_name: payload.companyName,
      business_type: payload.businessType,
      services: payload.services,
      pricing: payload.pricing,
      opening_hours: payload.openingHours,
      tone_of_voice: payload.toneOfVoice,
      goals: payload.goals,
      greeting: payload.greeting,
      knowledge: payload.knowledge,
      updated_at: nowIso()
    };

    const { error: profileError } = await dbClient
      .from('assistant_profiles')
      .upsert(profilePayload, { onConflict: 'assistant_id' });
    if (profileError) throw profileError;

    await dbClient.from('assistant_voices').update({ selected: false, updated_at: nowIso() }).eq('assistant_id', assistant.id);

    const { error: voiceError } = await dbClient.from('assistant_voices').upsert(
      {
        assistant_id: assistant.id,
        user_id: req.user.id,
        voice_key: selectedVoiceOption.key,
        display_name: selectedVoiceOption.name,
        provider: selectedVoiceOption.provider,
        external_voice_id: selectedVoiceOption.externalVoiceId,
        preview_url: selectedVoiceOption.previewUrl,
        twilio_voice: selectedVoiceOption.twilioVoice,
        selected: true,
        status: 'selected',
        updated_at: nowIso()
      },
      { onConflict: 'assistant_id,voice_key' }
    );
    if (voiceError) throw voiceError;

    if (payload.numberE164) {
      await dbClient.from('assistant_numbers').update({ selected: false, updated_at: nowIso() }).eq('assistant_id', assistant.id);

      const numberLabel = payload.numberLabel || payload.numberE164;
      const { error: numberError } = await dbClient.from('assistant_numbers').upsert(
        {
          assistant_id: assistant.id,
          user_id: req.user.id,
          e164: payload.numberE164,
          display_label: numberLabel,
          selected: true,
          status: 'reserved',
          source: 'wizard',
          updated_at: nowIso()
        },
        { onConflict: 'assistant_id,e164' }
      );
      if (numberError) throw numberError;
    }

    const profile = await fetchProfile(dbClient, assistant.id);
    const selectedVoice = await fetchSelectedVoice(dbClient, assistant.id);
    const selectedNumber = await fetchSelectedNumber(dbClient, assistant.id);
    const prompt = buildAssistantPrompt({ profile, assistant, voice: selectedVoice, number: selectedNumber });
    const setupStep =
      payload.setupStep !== undefined
        ? payload.setupStep
        : normalizeStep(assistant?.setup_step, 1);
    const setupCompleted =
      payload.setupCompleted !== undefined
        ? payload.setupCompleted
        : normalizeBoolean(assistant?.setup_completed, false);

    const { data: updatedAssistant, error: assistantUpdateError } = await dbClient
      .from('assistants')
      .update({
        display_name: payload.companyName,
        desired_plan: payload.planKey,
        prompt,
        status: 'configured',
        setup_step: setupStep,
        setup_completed: setupCompleted,
        updated_at: nowIso()
      })
      .eq('id', assistant.id)
      .select('*')
      .single();

    if (assistantUpdateError) throw assistantUpdateError;

    await upsertUsage(dbClient, {
      assistant_id: assistant.id,
      user_id: req.user.id,
      usage_type: 'onboarding_save',
      quantity: 1,
      unit: 'event',
      amount_eur: 0,
      metadata: { step: 'wizard' },
      occurred_at: nowIso()
    });

    return res.json({
      success: true,
      assistant: updatedAssistant,
      profile,
      voice: selectedVoice,
      number: selectedNumber,
      prompt
    });
  } catch (error) {
    return sendDbError(res, error);
  }
}

route('post', '/api/onboarding/save', requireAuth, async (req, res) => {
  return handleOnboardingSave(req, res);
});

route('post', '/api/onboarding/step-save', requireAuth, async (req, res) => {
  return handleOnboardingSave(req, res);
});

route('post', '/api/assistant/config', requireAuth, async (req, res) => {
  const legacyPayload = {
    ...req.body,
    companyName: req.body?.companyName,
    voiceKey: req.body?.voiceKey || req.body?.voice || VOICE_OPTIONS[0].key,
    numberE164: req.body?.numberE164 || req.body?.phoneNumber
  };

  return handleOnboardingSave(req, res, legacyPayload);
});

route('post', '/api/webcall/turn', requireAuth, async (req, res) => {
  try {
    const dbClient = getDbClient(req.accessToken);
    const assistant = await ensureAssistant(dbClient, req.user.id);
    const inputText = safeText(req.body?.inputText || req.body?.text);

    if (!inputText) {
      return res.status(400).json({ error: 'inputText is verplicht.' });
    }

    let sessionId = safeText(req.body?.sessionId);
    let session = null;

    if (sessionId) {
      const { data, error } = await dbClient
        .from('web_test_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', req.user.id)
        .maybeSingle();
      if (error) throw error;
      session = data || null;
    }

    if (!session) {
      const { data: created, error: createError } = await dbClient
        .from('web_test_sessions')
        .insert({
          assistant_id: assistant.id,
          user_id: req.user.id,
          status: 'active',
          started_at: nowIso(),
          updated_at: nowIso()
        })
        .select('*')
        .single();

      if (createError) throw createError;
      session = created;
      sessionId = created.id;
    }

    const { data: existingTurns, error: turnsError } = await dbClient
      .from('web_test_turns')
      .select('*')
      .eq('session_id', sessionId)
      .order('turn_index', { ascending: true });
    if (turnsError) throw turnsError;

    const history = (existingTurns || []).map((turn) => ({
      role: turn.role,
      content: turn.output_text || turn.input_text || ''
    }));

    const profile = await fetchProfile(dbClient, assistant.id);
    const selectedVoice = await fetchSelectedVoice(dbClient, assistant.id);
    const selectedNumber = await fetchSelectedNumber(dbClient, assistant.id);

    const systemPrompt =
      assistant.prompt || buildAssistantPrompt({ profile, assistant, voice: selectedVoice, number: selectedNumber });

    const start = Date.now();
    const assistantText = await generateReply({
      systemPrompt,
      history,
      userText: inputText,
      fallbackCompanyName: profile?.company_name || assistant.display_name || 'jouw bedrijf'
    });

    const latencyMs = Date.now() - start;
    const audioDataUrl = await createWebCallAudio(assistantText, selectedVoice || {});

    const currentIndex = (existingTurns || []).length;

    const turnRows = [
      {
        session_id: sessionId,
        assistant_id: assistant.id,
        user_id: req.user.id,
        turn_index: currentIndex + 1,
        role: 'user',
        input_text: inputText,
        output_text: null,
        latency_ms: 0,
        debug_steps: { state: 'listening' },
        created_at: nowIso()
      },
      {
        session_id: sessionId,
        assistant_id: assistant.id,
        user_id: req.user.id,
        turn_index: currentIndex + 2,
        role: 'assistant',
        input_text: null,
        output_text: assistantText,
        latency_ms: latencyMs,
        audio_data_url: audioDataUrl,
        debug_steps: {
          phases: ['listening', 'thinking', 'speaking'],
          model: openai ? OPENAI_MODEL : 'fallback'
        },
        created_at: nowIso()
      }
    ];

    const { error: writeTurnError } = await dbClient.from('web_test_turns').insert(turnRows);
    if (writeTurnError) throw writeTurnError;

    await dbClient
      .from('web_test_sessions')
      .update({ updated_at: nowIso(), status: 'active' })
      .eq('id', sessionId);

    await upsertUsage(dbClient, {
      assistant_id: assistant.id,
      user_id: req.user.id,
      usage_type: 'web_test_task',
      quantity: 1,
      unit: 'task',
      amount_eur: 0,
      metadata: {
        latencyMs,
        sessionId
      },
      occurred_at: nowIso()
    });

    res.json({
      success: true,
      sessionId,
      state: 'speaking',
      assistantText,
      audioDataUrl,
      latencyMs,
      debugPhases: [
        { key: 'listening', label: 'Luisteren', done: true },
        { key: 'thinking', label: 'AI denkt na', done: true },
        { key: 'speaking', label: 'AI spreekt', done: true }
      ]
    });
  } catch (error) {
    sendDbError(res, error);
  }
});

route('post', '/api/invoice/request', requireAuth, async (req, res) => {
  try {
    const dbClient = getDbClient(req.accessToken);
    const assistant = await ensureAssistant(dbClient, req.user.id);

    const plan = getPlanConfig(req.body?.planKey || assistant.desired_plan);
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      Math.random() * 100000
    )}`;

    const { data: billingAccount, error: billingError } = await dbClient
      .from('billing_accounts')
      .upsert(
        {
          user_id: req.user.id,
          email: req.user.email || null,
          payer_name: safeText(req.body?.payerName || req.user.user_metadata?.full_name || ''),
          status: 'active',
          updated_at: nowIso()
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();
    if (billingError) throw billingError;

    const { data: invoice, error: invoiceError } = await dbClient
      .from('invoices')
      .insert({
        assistant_id: assistant.id,
        user_id: req.user.id,
        billing_account_id: billingAccount.id,
        invoice_number: invoiceNumber,
        status: 'invoice_sent',
        plan_key: plan.key,
        amount_eur: plan.monthlyPriceEur,
        currency: 'EUR',
        due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        notes: safeText(req.body?.notes),
        updated_at: nowIso()
      })
      .select('*')
      .single();
    if (invoiceError) throw invoiceError;

    await dbClient
      .from('assistants')
      .update({
        billing_status: 'invoice_sent',
        desired_plan: plan.key,
        status: 'awaiting_payment',
        updated_at: nowIso()
      })
      .eq('id', assistant.id);

    await dbClient.from('subscription_state').upsert(
      {
        assistant_id: assistant.id,
        user_id: req.user.id,
        plan_key: plan.key,
        status: 'pending_payment',
        included_minutes: plan.includedMinutes,
        included_tasks: plan.includedTasks,
        updated_at: nowIso()
      },
      { onConflict: 'assistant_id' }
    );

    await upsertUsage(dbClient, {
      assistant_id: assistant.id,
      user_id: req.user.id,
      usage_type: 'invoice_request',
      quantity: 1,
      unit: 'event',
      amount_eur: 0,
      metadata: {
        invoiceNumber,
        plan: plan.key
      },
      occurred_at: nowIso()
    });

    res.json({
      success: true,
      invoice,
      nextStep: 'Wacht op admin payment approval: paid_approved.'
    });
  } catch (error) {
    sendDbError(res, error);
  }
});

route('post', '/api/admin/approve-payment', requireAdmin, async (req, res) => {
  try {
    const dbClient = getServiceClient();
    if (!dbClient) {
      return res.status(500).json({ error: 'Supabase service client ontbreekt.' });
    }

    const invoiceId = safeText(req.body?.invoiceId);
    const userId = safeText(req.body?.userId);
    const assistantId = safeText(req.body?.assistantId);

    let invoice = null;

    if (invoiceId) {
      const { data, error } = await dbClient.from('invoices').select('*').eq('id', invoiceId).maybeSingle();
      if (error) throw error;
      invoice = data;
    } else if (assistantId) {
      const { data, error } = await dbClient
        .from('invoices')
        .select('*')
        .eq('assistant_id', assistantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      invoice = data;
    } else if (userId) {
      const { data, error } = await dbClient
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      invoice = data;
    }

    if (!invoice) {
      return res.status(404).json({ error: 'Geen invoice gevonden voor deze aanvraag.' });
    }

    const approvedAt = nowIso();

    const { data: updatedInvoice, error: invoiceUpdateError } = await dbClient
      .from('invoices')
      .update({ status: 'paid_approved', paid_at: approvedAt, updated_at: approvedAt })
      .eq('id', invoice.id)
      .select('*')
      .single();
    if (invoiceUpdateError) throw invoiceUpdateError;

    const { data: assistant, error: assistantUpdateError } = await dbClient
      .from('assistants')
      .update({
        billing_status: 'paid_approved',
        status: 'provisioning_pending',
        desired_plan: updatedInvoice.plan_key,
        updated_at: approvedAt
      })
      .eq('id', updatedInvoice.assistant_id)
      .select('*')
      .single();
    if (assistantUpdateError) throw assistantUpdateError;

    const { data: provisioningJob, error: provisioningError } = await dbClient
      .from('provisioning_jobs')
      .insert({
        assistant_id: assistant.id,
        user_id: assistant.user_id,
        status: 'queued',
        trigger: 'admin_payment_approval',
        attempt_count: 0,
        payload: {
          invoiceId: updatedInvoice.id
        },
        created_at: approvedAt,
        updated_at: approvedAt
      })
      .select('*')
      .single();
    if (provisioningError) throw provisioningError;

    const shouldRunNow = req.body?.runNow !== false;
    let provisioningResult = { status: 'queued' };

    if (shouldRunNow) {
      provisioningResult = await runProvisioningJob({
        dbClient,
        jobId: provisioningJob.id,
        baseUrl: getBaseUrl(req)
      });
    }

    res.json({
      success: true,
      invoice: updatedInvoice,
      assistant,
      provisioningJobId: provisioningJob.id,
      provisioningResult
    });
  } catch (error) {
    sendDbError(res, error);
  }
});

route('post', '/api/provision/run', requireAuth, async (req, res) => {
  try {
    const dbClient = getDbClient(req.accessToken);
    const assistant = await ensureAssistant(dbClient, req.user.id);

    const { data: job, error: jobError } = await dbClient
      .from('provisioning_jobs')
      .select('*')
      .eq('assistant_id', assistant.id)
      .in('status', ['queued', 'failed', 'needs_number_reselect'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (jobError) throw jobError;
    if (!job) {
      return res.status(404).json({ error: 'Geen provisioning job gevonden voor deze gebruiker.' });
    }

    const result = await runProvisioningJob({
      dbClient,
      jobId: job.id,
      baseUrl: getBaseUrl(req)
    });

    return res.json({ success: true, jobId: job.id, result });
  } catch (error) {
    return sendDbError(res, error);
  }
});

const handleAdminProvisionRun = async (req, res) => {
  try {
    const dbClient = getServiceClient();
    const jobId = safeText(req.body?.jobId);

    if (!jobId) {
      return res.status(400).json({ error: 'jobId is verplicht voor admin provision/run.' });
    }

    const result = await runProvisioningJob({
      dbClient,
      jobId,
      baseUrl: getBaseUrl(req)
    });

    return res.json({ success: true, jobId, result });
  } catch (error) {
    return sendDbError(res, error);
  }
};

route('post', '/api/admin/provision/run', requireAdmin, handleAdminProvisionRun);
route('post', '/api/admin/provision-run', requireAdmin, handleAdminProvisionRun);

route('get', '/api/usage/summary', requireAuth, async (req, res) => {
  try {
    const dbClient = getDbClient(req.accessToken);
    const assistant = await ensureAssistant(dbClient, req.user.id);

    const plan = getPlanConfig(assistant.desired_plan);

    const periodStart = new Date();
    periodStart.setUTCDate(1);
    periodStart.setUTCHours(0, 0, 0, 0);

    const { data: usageRows, error: usageError } = await dbClient
      .from('usage_ledger')
      .select('usage_type,quantity,amount_eur,occurred_at')
      .eq('assistant_id', assistant.id)
      .gte('occurred_at', periodStart.toISOString());
    if (usageError) throw usageError;

    let minutesUsed = 0;
    let tasksUsed = 0;
    let variableCosts = 0;

    for (const row of usageRows || []) {
      const type = String(row.usage_type || '');
      const quantity = Number(row.quantity || 0);
      const amount = Number(row.amount_eur || 0);

      if (type === 'call_minutes') minutesUsed += quantity;
      if (type === 'web_test_task' || type === 'call_task') tasksUsed += quantity;
      variableCosts += amount;
    }

    const overageMinutes = Math.max(0, minutesUsed - plan.includedMinutes);
    const overageTasks = Math.max(0, tasksUsed - plan.includedTasks);
    const overageEstimate =
      overageMinutes * Number(plan.overageMinuteEur || 0) + overageTasks * Number(plan.overageTaskEur || 0);
    const planMetrics = estimatePlanMetrics(plan);

    res.json({
      plan,
      usage: {
        minutesUsed,
        tasksUsed,
        includedMinutes: plan.includedMinutes,
        includedTasks: plan.includedTasks,
        overageMinutes,
        overageTasks,
        overageMinuteRateEur: Number(plan.overageMinuteEur || 0),
        overageTaskRateEur: Number(plan.overageTaskEur || 0),
        overageEstimateEur: Number(overageEstimate.toFixed(2)),
        variableCostsEur: Number(variableCosts.toFixed(2)),
        expectedInvoiceEur: Number((plan.monthlyPriceEur + overageEstimate).toFixed(2)),
        estimatedCogsEur: planMetrics.estimatedCogsEur,
        estimatedNetMarginPct: planMetrics.netMarginPct
      },
      periodStart: periodStart.toISOString(),
      generatedAt: nowIso()
    });
  } catch (error) {
    sendDbError(res, error);
  }
});

route('post', '/api/twilio/voice', async (req, res) => {
  try {
    const dbClient = getServiceClient();
    if (!dbClient) throw new Error('Supabase service client ontbreekt.');

    const to = normalizePhoneNumber(req.body?.To);
    const from = normalizePhoneNumber(req.body?.From);
    const callSid = safeText(req.body?.CallSid);

    const voiceResponse = new twilio.twiml.VoiceResponse();

    if (!callSid || !to) {
      voiceResponse.say({ language: 'nl-NL', voice: 'alice' }, 'Ongeldige call gegevens ontvangen.');
      voiceResponse.hangup();
      return res.type('text/xml').send(voiceResponse.toString());
    }

    const { data: numberRow, error: numberError } = await dbClient
      .from('assistant_numbers')
      .select('*')
      .eq('e164', to)
      .eq('selected', true)
      .maybeSingle();

    if (numberError) throw numberError;

    if (!numberRow) {
      voiceResponse.say({ language: 'nl-NL', voice: 'alice' }, 'Dit nummer is nog niet actief.');
      voiceResponse.hangup();
      return res.type('text/xml').send(voiceResponse.toString());
    }

    const { data: assistant, error: assistantError } = await dbClient
      .from('assistants')
      .select('*')
      .eq('id', numberRow.assistant_id)
      .single();
    if (assistantError) throw assistantError;

    const profile = await fetchProfile(dbClient, assistant.id);

    const greeting =
      profile?.greeting ||
      `Goedemiddag, je spreekt met de AI assistent van ${profile?.company_name || assistant.display_name || 'ons bedrijf'}. Waarmee kan ik helpen?`;

    await dbClient.from('call_sessions').upsert(
      {
        assistant_id: assistant.id,
        user_id: assistant.user_id,
        call_sid: callSid,
        from_number: from,
        to_number: to,
        status: 'in_progress',
        started_at: nowIso(),
        updated_at: nowIso()
      },
      { onConflict: 'call_sid' }
    );

    voiceResponse.say({ language: 'nl-NL', voice: 'alice' }, greeting);

    const gather = voiceResponse.gather({
      input: 'speech',
      speechTimeout: 'auto',
      language: 'nl-NL',
      method: 'POST',
      action: `${getBaseUrl(req)}/api/twilio/turn?callSid=${encodeURIComponent(callSid)}`
    });

    gather.say({ language: 'nl-NL', voice: 'alice' }, 'Ik luister.');

    voiceResponse.redirect({ method: 'POST' }, `${getBaseUrl(req)}/api/twilio/turn?callSid=${encodeURIComponent(callSid)}`);

    res.type('text/xml').send(voiceResponse.toString());
  } catch (error) {
    console.error('Twilio /voice fout:', error);
    const voiceResponse = new twilio.twiml.VoiceResponse();
    voiceResponse.say({ language: 'nl-NL', voice: 'alice' }, 'Er is een fout opgetreden. Probeer later opnieuw.');
    voiceResponse.hangup();
    res.type('text/xml').send(voiceResponse.toString());
  }
});

route('post', '/api/twilio/turn', async (req, res) => {
  try {
    const dbClient = getServiceClient();
    if (!dbClient) throw new Error('Supabase service client ontbreekt.');

    const callSid = safeText(req.query.callSid || req.body?.CallSid);
    const speech = safeText(req.body?.SpeechResult);
    const voiceResponse = new twilio.twiml.VoiceResponse();

    const { data: callSession, error: sessionError } = await dbClient
      .from('call_sessions')
      .select('*')
      .eq('call_sid', callSid)
      .maybeSingle();

    if (sessionError) throw sessionError;

    if (!callSession) {
      voiceResponse.say({ language: 'nl-NL', voice: 'alice' }, 'Sessie niet gevonden.');
      voiceResponse.hangup();
      return res.type('text/xml').send(voiceResponse.toString());
    }

    const { data: assistant, error: assistantError } = await dbClient
      .from('assistants')
      .select('*')
      .eq('id', callSession.assistant_id)
      .single();
    if (assistantError) throw assistantError;

    const profile = await fetchProfile(dbClient, assistant.id);
    const selectedVoice = await fetchSelectedVoice(dbClient, assistant.id);
    const selectedNumber = await fetchSelectedNumber(dbClient, assistant.id);

    const { data: turns, error: turnsError } = await dbClient
      .from('call_turns')
      .select('*')
      .eq('call_session_id', callSession.id)
      .order('turn_index', { ascending: true });
    if (turnsError) throw turnsError;

    const turnHistory = (turns || []).map((turn) => ({
      role: turn.role,
      content: turn.response_text || turn.transcript || ''
    }));

    const userText = speech || 'Stilte';

    const systemPrompt =
      assistant.prompt || buildAssistantPrompt({ profile, assistant, voice: selectedVoice, number: selectedNumber });

    const answer = speech
      ? await generateReply({
          systemPrompt,
          history: turnHistory,
          userText,
          fallbackCompanyName: profile?.company_name || assistant.display_name || 'ons bedrijf'
        })
      : 'Ik heb je niet goed verstaan. Kun je je vraag herhalen?';

    const turnBaseIndex = (turns || []).length;

    await dbClient.from('call_turns').insert([
      {
        call_session_id: callSession.id,
        assistant_id: assistant.id,
        user_id: assistant.user_id,
        turn_index: turnBaseIndex + 1,
        role: 'user',
        transcript: userText,
        response_text: null,
        created_at: nowIso()
      },
      {
        call_session_id: callSession.id,
        assistant_id: assistant.id,
        user_id: assistant.user_id,
        turn_index: turnBaseIndex + 2,
        role: 'assistant',
        transcript: null,
        response_text: answer,
        created_at: nowIso()
      }
    ]);

    await upsertUsage(dbClient, {
      assistant_id: assistant.id,
      user_id: assistant.user_id,
      usage_type: 'call_task',
      quantity: 1,
      unit: 'task',
      amount_eur: 0,
      metadata: {
        callSid
      },
      occurred_at: nowIso()
    });

    const shouldEnd = /\b(doei|tot ziens|hang op|bedankt dat was alles)\b/i.test(userText);

    voiceResponse.say({ language: 'nl-NL', voice: selectedVoice?.twilio_voice || 'alice' }, answer);

    if (shouldEnd) {
      voiceResponse.say({ language: 'nl-NL', voice: selectedVoice?.twilio_voice || 'alice' }, 'Fijn gesprek. Tot ziens.');
      voiceResponse.hangup();

      await dbClient
        .from('call_sessions')
        .update({ status: 'completed', ended_at: nowIso(), updated_at: nowIso() })
        .eq('id', callSession.id);
    } else {
      const gather = voiceResponse.gather({
        input: 'speech',
        speechTimeout: 'auto',
        language: 'nl-NL',
        method: 'POST',
        action: `${getBaseUrl(req)}/api/twilio/turn?callSid=${encodeURIComponent(callSid)}`
      });

      gather.say({ language: 'nl-NL', voice: selectedVoice?.twilio_voice || 'alice' }, 'Waarmee kan ik nog meer helpen?');
      voiceResponse.redirect({ method: 'POST' }, `${getBaseUrl(req)}/api/twilio/turn?callSid=${encodeURIComponent(callSid)}`);
    }

    res.type('text/xml').send(voiceResponse.toString());
  } catch (error) {
    console.error('Twilio /turn fout:', error);
    const voiceResponse = new twilio.twiml.VoiceResponse();
    voiceResponse.say({ language: 'nl-NL', voice: 'alice' }, 'Er ging iets mis tijdens het gesprek.');
    voiceResponse.hangup();
    res.type('text/xml').send(voiceResponse.toString());
  }
});

route('post', '/api/twilio/status', async (req, res) => {
  try {
    const dbClient = getServiceClient();
    if (!dbClient) throw new Error('Supabase service client ontbreekt.');

    const callSid = safeText(req.body?.CallSid);
    const callStatus = safeText(req.body?.CallStatus, 'unknown');
    const duration = Number.parseInt(req.body?.CallDuration || '0', 10) || 0;

    if (!callSid) {
      return res.json({ ok: true, ignored: true });
    }

    const endedAt = nowIso();

    const { data: callSession, error: sessionError } = await dbClient
      .from('call_sessions')
      .select('*')
      .eq('call_sid', callSid)
      .maybeSingle();

    if (sessionError) throw sessionError;

    if (callSession) {
      await dbClient
        .from('call_sessions')
        .update({
          status: callStatus,
          duration_seconds: duration,
          ended_at: ['completed', 'canceled', 'failed', 'busy', 'no-answer'].includes(callStatus)
            ? endedAt
            : null,
          updated_at: endedAt
        })
        .eq('id', callSession.id);

      if (duration > 0) {
        const billedMinutes = Math.ceil(duration / 60);
        await upsertUsage(dbClient, {
          assistant_id: callSession.assistant_id,
          user_id: callSession.user_id,
          usage_type: 'call_minutes',
          quantity: billedMinutes,
          unit: 'minute',
          amount_eur: billedMinutes * 0.2,
          metadata: {
            callSid,
            durationSeconds: duration
          },
          occurred_at: endedAt
        });
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Twilio /status fout:', error);
    res.status(500).json({ error: error?.message || 'Status update mislukt.' });
  }
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

app.listen(PORT, () => {
  console.log('=================================================');
  console.log(`AI Hub Call Backend draait op: http://localhost:${PORT}`);
  console.log('=================================================');
});
