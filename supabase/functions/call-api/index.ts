import { createClient } from "npm:@supabase/supabase-js@2";
import OpenAI from "npm:openai@4";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const SUPABASE_URL = String(Deno.env.get("SUPABASE_URL") || "").trim();
const SUPABASE_ANON_KEY = String(Deno.env.get("SUPABASE_ANON_KEY") || "").trim();
const SUPABASE_SERVICE_ROLE_KEY = String(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();

const OPENAI_API_KEY = String(Deno.env.get("OPENAI_API_KEY") || "").trim();
const OPENAI_MODEL = String(Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini").trim();
const ELEVENLABS_API_KEY = String(Deno.env.get("ELEVENLABS_API_KEY") || "").trim();
const ELEVENLABS_MODEL_ID = String(Deno.env.get("ELEVENLABS_MODEL_ID") || "eleven_flash_v2_5").trim();
const TWILIO_ACCOUNT_SID = String(Deno.env.get("TWILIO_ACCOUNT_SID") || "").trim();
const TWILIO_AUTH_TOKEN = String(Deno.env.get("TWILIO_AUTH_TOKEN") || "").trim();
const ADMIN_APPROVAL_KEY = String(Deno.env.get("ADMIN_APPROVAL_KEY") || "").trim();
const ALLOW_SIMULATED_PROVISIONING =
  String(Deno.env.get("ALLOW_SIMULATED_PROVISIONING") || "true").toLowerCase() !== "false";

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const VOICE_OPTIONS = [
  {
    key: "jessica_nl",
    name: "Jessica (Female)",
    provider: "elevenlabs",
    externalVoiceId: "cgSgspJ2msm6clMCkdW9",
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/cgSgspJ2msm6clMCkdW9/56a97bf8-b69b-448f-846c-c3a11683d45a.mp3",
    twilioVoice: "alice",
  },
  {
    key: "eric_nl",
    name: "Eric (Male)",
    provider: "elevenlabs",
    externalVoiceId: "cjVigY5qzO86Huf0OWal",
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/cjVigY5qzO86Huf0OWal/d098fda0-6456-4030-b3d8-63aa048c9070.mp3",
    twilioVoice: "alice",
  },
  {
    key: "lotte_nl",
    name: "Lotte (Professional)",
    provider: "elevenlabs",
    externalVoiceId: "EXAVITQu4vr4xnSDxMaL",
    previewUrl:
      "https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/5f713f17-8f41-4f5b-a0f2-ea0b2f9be8f5.mp3",
    twilioVoice: "alice",
  },
];

const DEFAULT_NUMBERS = [
  { e164: "+31208081234", label: "Amsterdam, NL", countryCode: "NL", source: "catalog" },
  { e164: "+31103456789", label: "Rotterdam, NL", countryCode: "NL", source: "catalog" },
  { e164: "+31859990000", label: "National, NL", countryCode: "NL", source: "catalog" },
];

const PLAN_CATALOG: Record<string, {
  key: string;
  name: string;
  monthlyPriceEur: number;
  includedMinutes: number;
  includedTasks: number;
  overageMinuteEur: number;
  overageTaskEur: number;
}> = {
  plan_150: {
    key: "plan_150",
    name: "Launch",
    monthlyPriceEur: 299,
    includedMinutes: 180,
    includedTasks: 450,
    overageMinuteEur: 1.15,
    overageTaskEur: 0.08,
  },
  plan_275: {
    key: "plan_275",
    name: "Growth",
    monthlyPriceEur: 499,
    includedMinutes: 420,
    includedTasks: 1100,
    overageMinuteEur: 1.05,
    overageTaskEur: 0.07,
  },
  plan_500: {
    key: "plan_500",
    name: "Scale",
    monthlyPriceEur: 799,
    includedMinutes: 900,
    includedTasks: 2500,
    overageMinuteEur: 0.95,
    overageTaskEur: 0.06,
  },
  plan_850: {
    key: "plan_850",
    name: "Enterprise",
    monthlyPriceEur: 1199,
    includedMinutes: 1600,
    includedTasks: 4500,
    overageMinuteEur: 0.85,
    overageTaskEur: 0.05,
  },
};

const DEFAULT_PLAN = PLAN_CATALOG.plan_150;
const COST_ASSUMPTIONS = {
  fixedMonthlyCostEur: 35,
  minuteVendorCostEur: 0.12,
  taskVendorCostEur: 0.01,
  corpTaxRate: 0.19,
};

function nowIso() {
  return new Date().toISOString();
}

function normalizePlanKey(value: unknown) {
  if (!value) return DEFAULT_PLAN.key;
  const key = String(value).trim().toLowerCase();
  return PLAN_CATALOG[key] ? key : DEFAULT_PLAN.key;
}

function getPlanConfig(planKey: unknown) {
  return PLAN_CATALOG[normalizePlanKey(planKey)] || DEFAULT_PLAN;
}

function estimatePlanMetrics(plan: {
  monthlyPriceEur: number;
  includedMinutes: number;
  includedTasks: number;
}) {
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
    netMarginPct: Number((Math.max(netMargin, 0) * 100).toFixed(1)),
  };
}

function safeText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizePhoneNumber(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withPlus = raw.startsWith("+") ? raw : `+${raw}`;
  return withPlus.replace(/(?!^)\+/g, "").replace(/[^+\d]/g, "");
}

function normalizeArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry || "").trim())
      .filter(Boolean)
      .slice(0, 100);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,]/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, 100);
  }

  return [];
}

function isMissingTableError(error: any) {
  const message = String(error?.message || "").toLowerCase();
  return error?.code === "42P01" || message.includes("does not exist") || message.includes("schema cache");
}

function migrationError() {
  return "Database schema ontbreekt. Run server/sql/call_assistant_migration.sql in Supabase SQL Editor.";
}

function assertSupabaseReady() {
  if (!SUPABASE_URL || (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error("Supabase configuratie ontbreekt. Zet project env vars in Edge Functions.");
  }
}

function createDbClient(apiKey: string, accessToken: string | null = null) {
  return createClient(SUPABASE_URL, apiKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}

function getDbClient(accessToken: string | null = null) {
  assertSupabaseReady();

  if (SUPABASE_SERVICE_ROLE_KEY) {
    return createDbClient(SUPABASE_SERVICE_ROLE_KEY);
  }

  if (!SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_ANON_KEY ontbreekt.");
  }

  return createDbClient(SUPABASE_ANON_KEY, accessToken);
}

function getAuthClient() {
  if (SUPABASE_ANON_KEY) return createDbClient(SUPABASE_ANON_KEY);
  if (SUPABASE_SERVICE_ROLE_KEY) return createDbClient(SUPABASE_SERVICE_ROLE_KEY);
  throw new Error("Supabase auth client ontbreekt.");
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorJson(message: string, status = 500) {
  return json({ error: message }, status);
}

function getRoutePath(req: Request) {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const fnIndex = parts.indexOf("call-api");
  const rest = fnIndex >= 0 ? parts.slice(fnIndex + 1) : parts;
  let normalized = `/${rest.join("/")}`.replace(/\/+$/, "") || "/";
  if (normalized.startsWith("/api/")) {
    normalized = normalized.slice(4) || "/";
  }
  return normalized;
}

async function parseBody(req: Request) {
  try {
    const type = String(req.headers.get("content-type") || "");
    if (type.includes("application/json")) return await req.json();
    if (type.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      return Object.fromEntries(params.entries());
    }
    return {};
  } catch {
    return {};
  }
}

async function requireUser(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return { error: errorJson("Niet ingelogd (token ontbreekt).", 401), user: null, token: "" };
  }

  try {
    const authClient = getAuthClient();
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data?.user) {
      return { error: errorJson("Ongeldige of verlopen sessie.", 401), user: null, token: "" };
    }

    return { error: null, user: data.user, token };
  } catch (err: any) {
    return { error: errorJson(err?.message || "Authenticatie mislukt.", 401), user: null, token: "" };
  }
}

function isAdminRequest(req: Request) {
  const providedKey = String(req.headers.get("x-admin-key") || "").trim();
  return Boolean(ADMIN_APPROVAL_KEY && providedKey && providedKey === ADMIN_APPROVAL_KEY);
}

function onboardingFromPayload(payload: Record<string, unknown> = {}) {
  return {
    companyName: safeText(payload.companyName, "Mijn Bedrijf"),
    businessType: safeText(payload.businessType),
    services: normalizeArray(payload.services),
    pricing: safeText(payload.pricing),
    openingHours: safeText(payload.openingHours),
    toneOfVoice: safeText(payload.toneOfVoice, "professioneel en vriendelijk"),
    goals: safeText(payload.goals),
    greeting: safeText(payload.greeting),
    knowledge: safeText(payload.knowledge),
    voiceKey: safeText(payload.voiceKey, VOICE_OPTIONS[0].key),
    numberE164: normalizePhoneNumber(payload.numberE164 || payload.phoneNumber),
    numberLabel: safeText(payload.numberLabel),
    planKey: normalizePlanKey(payload.planKey),
  };
}

function getVoiceOption(voiceKey: string) {
  return VOICE_OPTIONS.find((voice) => voice.key === voiceKey) || VOICE_OPTIONS[0];
}

function buildAssistantPrompt(
  { profile = {}, assistant = {}, voice = {}, number = {} }: Record<string, any>,
) {
  const services = Array.isArray(profile.services) ? profile.services : [];
  const servicesText = services.length > 0 ? services.join(", ") : "niet gespecificeerd";
  const openingHours = profile.opening_hours || profile.openingHours || "onbekend";
  const pricing = profile.pricing || "niet ingevuld";
  const goals = profile.goals || "beantwoord vragen en help met opvolging";
  const tone = profile.tone_of_voice || profile.toneOfVoice || "vriendelijk en duidelijk";
  const company = profile.company_name || assistant.display_name || "dit bedrijf";
  const selectedNumber = number.e164 || "nog niet live";

  return [
    "Je bent een Nederlandse AI telefoon-assistent voor inkomende klantgesprekken.",
    `Bedrijf: ${company}`,
    `Diensten: ${servicesText}`,
    `Prijzen: ${pricing}`,
    `Openingstijden: ${openingHours}`,
    `Doel van gesprek: ${goals}`,
    `Tone of voice: ${tone}`,
    `Gekozen stem: ${voice.display_name || "standaard stem"}`,
    `Gekozen nummer: ${selectedNumber}`,
    "Regels:",
    "- Geef korte, natuurlijke antwoorden.",
    "- Stel 1 vervolgvraag als informatie ontbreekt.",
    "- Bevestig belangrijke details hardop (naam, datum, tijd).",
    "- Bij vragen over orderstatus: vraag ordernummer + e-mailadres en gebruik de gekoppelde webshop-integratie.",
    "- Als iets onbekend is, zeg dat eerlijk en bied een terugbelnotitie aan.",
    "- Spreek standaard Nederlands, tenzij de beller duidelijk een andere taal gebruikt.",
  ].join("\n");
}

function fallbackAssistantReply(input: string, companyName: string) {
  if (!input) {
    return `Goedemiddag, je spreekt met de digitale assistent van ${companyName}. Waar kan ik je mee helpen?`;
  }

  return `Dank voor je vraag. Ik help je graag verder. Kun je iets meer details geven zodat ik direct de juiste info voor ${companyName} kan geven?`;
}

async function ensureAssistant(dbClient: any, userId: string) {
  const { data, error } = await dbClient.from("assistants").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (data) return data;

  const payload = {
    user_id: userId,
    status: "draft",
    live_status: "not_live",
    billing_status: "none",
    desired_plan: DEFAULT_PLAN.key,
    display_name: null,
    prompt: null,
    language: "nl-NL",
    currency: "EUR",
    updated_at: nowIso(),
  };

  const { data: inserted, error: insertError } = await dbClient
    .from("assistants")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (insertError) throw insertError;
  return inserted;
}

async function fetchProfile(dbClient: any, assistantId: string) {
  const { data, error } = await dbClient.from("assistant_profiles").select("*").eq("assistant_id", assistantId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function fetchSelectedVoice(dbClient: any, assistantId: string) {
  const { data, error } = await dbClient.from("assistant_voices")
    .select("*")
    .eq("assistant_id", assistantId)
    .eq("selected", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function fetchSelectedNumber(dbClient: any, assistantId: string) {
  const { data, error } = await dbClient.from("assistant_numbers")
    .select("*")
    .eq("assistant_id", assistantId)
    .eq("selected", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function upsertUsage(dbClient: any, payload: Record<string, unknown>) {
  try {
    const { error } = await dbClient.from("usage_ledger").insert(payload);
    if (error) throw error;
  } catch (error) {
    if (!isMissingTableError(error)) {
      console.warn("Usage ledger write waarschuwing:", (error as any)?.message || error);
    }
  }
}

async function createWebCallAudio(text: string, voice: Record<string, any>) {
  if (!ELEVENLABS_API_KEY) return null;

  const voiceId = voice?.external_voice_id || voice?.externalVoiceId || getVoiceOption(voice?.voice_key).externalVoiceId;
  if (!voiceId) return null;

  const clippedText = String(text || "").slice(0, 450);
  if (!clippedText) return null;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        model_id: ELEVENLABS_MODEL_ID,
        text: clippedText,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
          style: 0.25,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const reason = await response.text();
      console.warn("ElevenLabs TTS waarschuwing:", reason);
      return null;
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    return `data:audio/mpeg;base64,${base64}`;
  } catch (error) {
    console.warn("ElevenLabs TTS fout:", (error as any)?.message || error);
    return null;
  }
}

async function generateReply(params: {
  systemPrompt: string;
  history: Array<{ role: string; content: string }>;
  userText: string;
  fallbackCompanyName: string;
}) {
  const { systemPrompt, history, userText, fallbackCompanyName } = params;

  if (!openai) {
    return fallbackAssistantReply(userText, fallbackCompanyName);
  }

  try {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    for (const item of history.slice(-12)) {
      if (item.role === "user" || item.role === "assistant") {
        messages.push({ role: item.role, content: String(item.content || "") });
      }
    }

    messages.push({ role: "user", content: userText });

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.45,
      messages,
    });

    const text = completion.choices?.[0]?.message?.content?.trim();
    return text || fallbackAssistantReply(userText, fallbackCompanyName);
  } catch (error) {
    console.warn("OpenAI generate waarschuwing:", (error as any)?.message || error);
    return fallbackAssistantReply(userText, fallbackCompanyName);
  }
}

async function fetchTwilioOwnedNumbers() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return [];

  try {
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json?PageSize=40`,
      { headers: { Authorization: `Basic ${auth}` } },
    );
    if (!response.ok) return [];
    const payload = await response.json();
    const rows = Array.isArray(payload?.incoming_phone_numbers) ? payload.incoming_phone_numbers : [];
    return rows.map((row: any) => ({
      e164: normalizePhoneNumber(row.phone_number),
      label: row.friendly_name || row.phone_number,
      countryCode: row.iso_country || "NL",
      source: "twilio_owned",
      twilioPhoneSid: row.sid || null,
    }));
  } catch {
    return [];
  }
}

function normalizeProvider(value: unknown) {
  const provider = String(value || "").trim().toLowerCase();
  if (["shopify", "prestashop", "woocommerce"].includes(provider)) return provider;
  return "";
}

function normalizeStoreUrl(value: unknown) {
  const raw = safeText(value);
  if (!raw) return "";

  let normalized = raw;
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  try {
    const url = new URL(normalized);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

function normalizeOrderReference(value: unknown) {
  return safeText(value).replace(/^#/, "");
}

function sanitizeIntegration(integration: Record<string, any>) {
  return {
    id: integration.id,
    provider: integration.provider,
    status: integration.status,
    storeUrl: integration.store_url,
    hasAccessToken: Boolean(integration.access_token),
    hasApiKey: Boolean(integration.api_key),
    lastSyncAt: integration.last_sync_at || null,
    updatedAt: integration.updated_at || null,
  };
}

async function fetchIntegrationsForAssistant(dbClient: any, assistantId: string) {
  const { data, error } = await dbClient
    .from("commerce_integrations")
    .select("*")
    .eq("assistant_id", assistantId)
    .order("provider", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function fetchConnectedIntegration(
  dbClient: any,
  assistantId: string,
  provider: string,
) {
  const { data, error } = await dbClient
    .from("commerce_integrations")
    .select("*")
    .eq("assistant_id", assistantId)
    .eq("provider", provider)
    .eq("status", "connected")
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

function formatLookupResult(result: Record<string, any>) {
  return {
    found: true,
    provider: result.provider,
    orderReference: result.orderReference,
    status: result.status || "Onbekend",
    paymentStatus: result.paymentStatus || null,
    customerEmail: result.customerEmail || null,
    totalAmount: result.totalAmount || null,
    currency: result.currency || null,
    source: result.source || null,
    raw: result.raw || null,
  };
}

async function lookupShopifyOrderStatus(integration: Record<string, any>, params: Record<string, any>) {
  const storeUrl = normalizeStoreUrl(integration.store_url || integration.storeUrl);
  const accessToken = safeText(integration.access_token || integration.accessToken);
  const orderReference = normalizeOrderReference(params.orderReference || params.orderNumber || params.reference);
  const email = safeText(params.email).toLowerCase();

  if (!storeUrl || !accessToken || !orderReference) {
    return { found: false, error: "Shopify configuratie of orderreferentie ontbreekt." };
  }

  const graphqlQuery = `
    query OrderLookup($query: String!) {
      orders(first: 1, query: $query, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            name
            createdAt
            displayFulfillmentStatus
            displayFinancialStatus
            customer {
              email
            }
            currentTotalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;

  const baseOrderRef = orderReference.startsWith("#") ? orderReference : `#${orderReference}`;
  const candidateQueries = [
    `${email ? `email:${email} ` : ""}name:${baseOrderRef}`,
    `${email ? `email:${email} ` : ""}name:${orderReference}`,
  ];

  for (const searchQuery of candidateQueries) {
    const response = await fetch(`${storeUrl}/admin/api/2024-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { query: searchQuery.trim() },
      }),
    });

    if (!response.ok) {
      const reason = await response.text();
      return { found: false, error: `Shopify request mislukt: ${reason.slice(0, 180)}` };
    }

    const payload = await response.json();
    const edges = payload?.data?.orders?.edges || [];
    if (!Array.isArray(edges) || edges.length === 0) {
      continue;
    }

    const node = edges[0]?.node;
    if (!node) continue;

    return formatLookupResult({
      provider: "shopify",
      orderReference: node.name || baseOrderRef,
      status: node.displayFulfillmentStatus || "Onbekend",
      paymentStatus: node.displayFinancialStatus || null,
      customerEmail: node?.customer?.email || email || null,
      totalAmount: node?.currentTotalPriceSet?.shopMoney?.amount || null,
      currency: node?.currentTotalPriceSet?.shopMoney?.currencyCode || null,
      source: storeUrl,
      raw: node,
    });
  }

  return { found: false, notFound: true, provider: "shopify", orderReference: baseOrderRef };
}

async function lookupPrestashopOrderStatus(integration: Record<string, any>, params: Record<string, any>) {
  const storeUrl = normalizeStoreUrl(integration.store_url || integration.storeUrl);
  const apiKey = safeText(integration.api_key || integration.apiKey);
  const orderReference = normalizeOrderReference(params.orderReference || params.orderNumber || params.reference);

  if (!storeUrl || !apiKey || !orderReference) {
    return { found: false, error: "PrestaShop configuratie of orderreferentie ontbreekt." };
  }

  const basic = btoa(`${apiKey}:`);
  const url =
    `${storeUrl}/api/orders?output_format=JSON&display=full&filter[reference]=` +
    encodeURIComponent(`[${orderReference}]`);

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${basic}`,
    },
  });

  if (!response.ok) {
    const reason = await response.text();
    return { found: false, error: `PrestaShop request mislukt: ${reason.slice(0, 180)}` };
  }

  const payload = await response.json();
  const rawOrders = payload?.orders;
  const orders = Array.isArray(rawOrders)
    ? rawOrders
    : (rawOrders && typeof rawOrders === "object" ? Object.values(rawOrders) : []);

  if (!orders?.length) {
    return { found: false, notFound: true, provider: "prestashop", orderReference };
  }

  const order = orders[0] as Record<string, any>;

  return formatLookupResult({
    provider: "prestashop",
    orderReference: order.reference || orderReference,
    status: order.current_state || order.current_state_name || "Onbekend",
    paymentStatus: order.payment || null,
    customerEmail: null,
    totalAmount: order.total_paid || order.total_paid_tax_incl || null,
    currency: order.id_currency || null,
    source: storeUrl,
    raw: order,
  });
}

async function lookupOrderStatus(
  dbClient: any,
  assistantId: string,
  params: Record<string, any>,
) {
  const provider = normalizeProvider(params.provider);
  const orderReference = normalizeOrderReference(params.orderReference || params.orderNumber || params.reference);
  const email = safeText(params.email).toLowerCase();

  if (!orderReference) {
    return { found: false, error: "orderReference is verplicht." };
  }

  const integrations = provider
    ? [await fetchConnectedIntegration(dbClient, assistantId, provider)].filter(Boolean)
    : (await fetchIntegrationsForAssistant(dbClient, assistantId)).filter((entry: any) => entry.status === "connected");

  if (!integrations.length) {
    return {
      found: false,
      error: provider
        ? `Geen actieve ${provider} koppeling gevonden.`
        : "Geen actieve webshop koppeling gevonden.",
    };
  }

  let lastError = "";
  for (const integration of integrations) {
    const currentProvider = normalizeProvider(integration.provider);
    if (!currentProvider) continue;

    try {
      if (currentProvider === "shopify") {
        const result = await lookupShopifyOrderStatus(integration, { orderReference, email });
        if (result.found || result.notFound) return result;
        lastError = result.error || lastError;
      } else if (currentProvider === "prestashop") {
        const result = await lookupPrestashopOrderStatus(integration, { orderReference, email });
        if (result.found || result.notFound) return result;
        lastError = result.error || lastError;
      } else {
        lastError = `Provider ${currentProvider} wordt nog niet ondersteund voor orderstatus lookup.`;
      }
    } catch (error) {
      lastError = (error as any)?.message || "Order lookup fout.";
    }
  }

  if (lastError) {
    return { found: false, error: lastError };
  }

  return { found: false, notFound: true, orderReference };
}

function detectOrderLookupIntent(text: string) {
  const normalized = safeText(text);
  if (!normalized) return null;

  const mentionsOrder = /\b(bestelling|order|tracking|pakket|levering|status)\b/i.test(normalized);
  if (!mentionsOrder) return null;

  const emailMatch = normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const hashRef = normalized.match(/#([A-Za-z0-9_-]{3,})/);
  const namedRef = normalized.match(/\b(order|bestelling)(nummer|nr|id)?[:\s-]*([A-Za-z0-9_-]{4,})/i);

  const orderReference = hashRef?.[1] || namedRef?.[3] || "";
  if (!orderReference) return null;

  const providerMatch = normalized.match(/\b(shopify|prestashop|woocommerce)\b/i);

  return {
    orderReference,
    email: emailMatch?.[0] || "",
    provider: providerMatch?.[1] ? providerMatch[1].toLowerCase() : "",
  };
}

function buildOrderStatusReply(result: Record<string, any>) {
  if (!result?.found) {
    if (result?.notFound) {
      return `Ik kon bestelling ${result.orderReference || ""} nog niet vinden in de gekoppelde shop. Controleer ordernummer en e-mailadres en probeer opnieuw.`;
    }
    return result?.error || "Ik kon de orderstatus nu niet ophalen.";
  }

  const parts = [
    `Ik heb bestelling ${result.orderReference} gevonden via ${String(result.provider || "").toUpperCase()}.`,
    `Status: ${result.status || "Onbekend"}.`,
  ];

  if (result.paymentStatus) {
    parts.push(`Betaling: ${result.paymentStatus}.`);
  }

  if (result.totalAmount) {
    const currencySuffix = result.currency ? ` ${result.currency}` : "";
    parts.push(`Totaal: ${result.totalAmount}${currencySuffix}.`);
  }

  return parts.join(" ");
}

async function runProvisioningJob(params: { dbClient: any; jobId: string }) {
  const { dbClient, jobId } = params;

  const { data: job, error: jobError } = await dbClient.from("provisioning_jobs").select("*").eq("id", jobId).single();
  if (jobError) throw jobError;

  if (job.status === "success") {
    return { status: "success", reused: true, job };
  }

  const startedAt = nowIso();
  await dbClient.from("provisioning_jobs").update({ status: "processing", started_at: startedAt, updated_at: startedAt }).eq("id", jobId);

  const { data: assistant, error: assistantError } = await dbClient
    .from("assistants")
    .select("*")
    .eq("id", job.assistant_id)
    .single();
  if (assistantError) throw assistantError;

  if (!["paid_approved", "active", "live"].includes(assistant.billing_status)) {
    const failedAt = nowIso();
    await dbClient.from("provisioning_jobs").update({
      status: "failed",
      error_message: "Klant is nog niet op paid_approved gezet.",
      completed_at: failedAt,
      updated_at: failedAt,
    }).eq("id", jobId);
    return { status: "failed", reason: "not_paid_approved" };
  }

  const selectedVoice = await fetchSelectedVoice(dbClient, assistant.id);
  const selectedNumber = await fetchSelectedNumber(dbClient, assistant.id);
  if (!selectedVoice || !selectedNumber) {
    const failedAt = nowIso();
    await dbClient.from("provisioning_jobs").update({
      status: "failed",
      error_message: "Voice of nummer ontbreekt.",
      completed_at: failedAt,
      updated_at: failedAt,
    }).eq("id", jobId);
    return { status: "failed", reason: "missing_voice_or_number" };
  }

  if (!ALLOW_SIMULATED_PROVISIONING) {
    const failedAt = nowIso();
    await dbClient.from("provisioning_jobs").update({
      status: "failed",
      error_message: "Simulated provisioning staat uit in instellingen.",
      completed_at: failedAt,
      updated_at: failedAt,
    }).eq("id", jobId);
    return { status: "failed", reason: "simulation_disabled" };
  }

  const completedAt = nowIso();
  await dbClient.from("assistant_numbers").update({
    status: "simulated_live",
    linked_at: completedAt,
    updated_at: completedAt,
  }).eq("id", selectedNumber.id);

  await dbClient.from("assistants").update({
    status: "live",
    live_status: "live",
    billing_status: "active",
    live_at: completedAt,
    updated_at: completedAt,
  }).eq("id", assistant.id);

  const plan = getPlanConfig(assistant.desired_plan);
  await dbClient.from("subscription_state").upsert(
    {
      assistant_id: assistant.id,
      user_id: assistant.user_id,
      plan_key: plan.key,
      status: "active",
      included_minutes: plan.includedMinutes,
      included_tasks: plan.includedTasks,
      current_period_start: completedAt,
      current_period_end: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: completedAt,
    },
    { onConflict: "assistant_id" },
  );

  await dbClient.from("provisioning_jobs").update({
    status: "success",
    error_message: null,
    completed_at: completedAt,
    updated_at: completedAt,
    result: {
      mode: "simulated",
      number: selectedNumber.e164,
    },
  }).eq("id", jobId);

  await upsertUsage(dbClient, {
    assistant_id: assistant.id,
    user_id: assistant.user_id,
    usage_type: "provisioning",
    quantity: 1,
    unit: "job",
    amount_eur: 0,
    metadata: { mode: "simulated" },
    occurred_at: completedAt,
  });

  return {
    status: "success",
    mode: "simulated",
    assistantId: assistant.id,
    number: selectedNumber.e164,
  };
}

function dbErrorToResponse(error: any) {
  if (isMissingTableError(error)) {
    return errorJson(migrationError(), 500);
  }
  return errorJson(error?.message || "Database fout.", 500);
}

async function handleOnboardingSave(
  req: Request,
  user: any,
  accessToken: string,
  overridePayload: Record<string, unknown> | null = null,
) {
  try {
    const dbClient = getDbClient(accessToken);
    const assistant = await ensureAssistant(dbClient, user.id);
    const body = await parseBody(req) as Record<string, unknown>;
    const payload = onboardingFromPayload(overridePayload || body || {});
    const selectedVoiceOption = getVoiceOption(payload.voiceKey);

    const profilePayload = {
      assistant_id: assistant.id,
      user_id: user.id,
      company_name: payload.companyName,
      business_type: payload.businessType,
      services: payload.services,
      pricing: payload.pricing,
      opening_hours: payload.openingHours,
      tone_of_voice: payload.toneOfVoice,
      goals: payload.goals,
      greeting: payload.greeting,
      knowledge: payload.knowledge,
      updated_at: nowIso(),
    };

    const { error: profileError } = await dbClient
      .from("assistant_profiles")
      .upsert(profilePayload, { onConflict: "assistant_id" });
    if (profileError) throw profileError;

    await dbClient.from("assistant_voices").update({ selected: false, updated_at: nowIso() }).eq("assistant_id", assistant.id);
    const { error: voiceError } = await dbClient.from("assistant_voices").upsert(
      {
        assistant_id: assistant.id,
        user_id: user.id,
        voice_key: selectedVoiceOption.key,
        display_name: selectedVoiceOption.name,
        provider: selectedVoiceOption.provider,
        external_voice_id: selectedVoiceOption.externalVoiceId,
        preview_url: selectedVoiceOption.previewUrl,
        twilio_voice: selectedVoiceOption.twilioVoice,
        selected: true,
        status: "selected",
        updated_at: nowIso(),
      },
      { onConflict: "assistant_id,voice_key" },
    );
    if (voiceError) throw voiceError;

    if (payload.numberE164) {
      await dbClient.from("assistant_numbers").update({ selected: false, updated_at: nowIso() }).eq("assistant_id", assistant.id);
      const numberLabel = payload.numberLabel || payload.numberE164;
      const { error: numberError } = await dbClient.from("assistant_numbers").upsert(
        {
          assistant_id: assistant.id,
          user_id: user.id,
          e164: payload.numberE164,
          display_label: numberLabel,
          selected: true,
          status: "reserved",
          source: "wizard",
          updated_at: nowIso(),
        },
        { onConflict: "assistant_id,e164" },
      );
      if (numberError) throw numberError;
    }

    const profile = await fetchProfile(dbClient, assistant.id);
    const selectedVoice = await fetchSelectedVoice(dbClient, assistant.id);
    const selectedNumber = await fetchSelectedNumber(dbClient, assistant.id);
    const prompt = buildAssistantPrompt({ profile, assistant, voice: selectedVoice, number: selectedNumber });

    const { data: updatedAssistant, error: assistantUpdateError } = await dbClient.from("assistants").update({
      display_name: payload.companyName,
      desired_plan: payload.planKey,
      prompt,
      status: "configured",
      updated_at: nowIso(),
    }).eq("id", assistant.id).select("*").single();
    if (assistantUpdateError) throw assistantUpdateError;

    await upsertUsage(dbClient, {
      assistant_id: assistant.id,
      user_id: user.id,
      usage_type: "onboarding_save",
      quantity: 1,
      unit: "event",
      amount_eur: 0,
      metadata: { step: "wizard" },
      occurred_at: nowIso(),
    });

    return json({
      success: true,
      assistant: updatedAssistant,
      profile,
      voice: selectedVoice,
      number: selectedNumber,
      prompt,
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleAssistantState(user: any, accessToken: string) {
  try {
    const dbClient = getDbClient(accessToken);
    const assistant = await ensureAssistant(dbClient, user.id);
    const profile = await fetchProfile(dbClient, assistant.id);
    const voice = await fetchSelectedVoice(dbClient, assistant.id);
    const number = await fetchSelectedNumber(dbClient, assistant.id);
    const integrationsRaw = await fetchIntegrationsForAssistant(dbClient, assistant.id);
    const integrations = integrationsRaw.map((entry: Record<string, any>) => sanitizeIntegration(entry));

    const { data: invoice } = await dbClient
      .from("invoices")
      .select("*")
      .eq("assistant_id", assistant.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: provisioningJob } = await dbClient
      .from("provisioning_jobs")
      .select("*")
      .eq("assistant_id", assistant.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: subscription } = await dbClient
      .from("subscription_state")
      .select("*")
      .eq("assistant_id", assistant.id)
      .maybeSingle();

    const selectedPlan = getPlanConfig(subscription?.plan_key || assistant.desired_plan);

    return json({
      assistant,
      profile,
      voice,
      number,
      latestInvoice: invoice || null,
      latestProvisioningJob: provisioningJob || null,
      subscription: subscription || null,
      integrations,
      plan: {
        ...selectedPlan,
        metrics: estimatePlanMetrics(selectedPlan),
      },
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleWebCallTurn(req: Request, user: any, accessToken: string) {
  try {
    const dbClient = getDbClient(accessToken);
    const assistant = await ensureAssistant(dbClient, user.id);
    const body = await parseBody(req) as Record<string, unknown>;
    const inputText = safeText(body?.inputText || body?.text);

    if (!inputText) return errorJson("inputText is verplicht.", 400);

    let sessionId = safeText(body?.sessionId);
    let session: any = null;

    if (sessionId) {
      const { data, error } = await dbClient
        .from("web_test_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      session = data || null;
    }

    if (!session) {
      const { data: created, error: createError } = await dbClient
        .from("web_test_sessions")
        .insert({
          assistant_id: assistant.id,
          user_id: user.id,
          status: "active",
          started_at: nowIso(),
          updated_at: nowIso(),
        })
        .select("*")
        .single();
      if (createError) throw createError;
      session = created;
      sessionId = created.id;
    }

    const { data: existingTurns, error: turnsError } = await dbClient
      .from("web_test_turns")
      .select("*")
      .eq("session_id", sessionId)
      .order("turn_index", { ascending: true });
    if (turnsError) throw turnsError;

    const history = (existingTurns || []).map((turn: any) => ({
      role: turn.role,
      content: turn.output_text || turn.input_text || "",
    }));

    const profile = await fetchProfile(dbClient, assistant.id);
    const selectedVoice = await fetchSelectedVoice(dbClient, assistant.id);
    const selectedNumber = await fetchSelectedNumber(dbClient, assistant.id);
    const systemPrompt =
      assistant.prompt || buildAssistantPrompt({ profile, assistant, voice: selectedVoice, number: selectedNumber });

    const started = Date.now();
    const orderIntent = detectOrderLookupIntent(inputText);
    let orderLookupResult: Record<string, any> | null = null;

    if (orderIntent) {
      orderLookupResult = await lookupOrderStatus(dbClient, assistant.id, orderIntent);
    }

    const assistantText = orderLookupResult
      ? buildOrderStatusReply(orderLookupResult)
      : await generateReply({
        systemPrompt,
        history,
        userText: inputText,
        fallbackCompanyName: profile?.company_name || assistant.display_name || "jouw bedrijf",
      });
    const latencyMs = Date.now() - started;
    const audioDataUrl = await createWebCallAudio(assistantText, selectedVoice || {});

    const currentIndex = (existingTurns || []).length;
    const turnRows = [
      {
        session_id: sessionId,
        assistant_id: assistant.id,
        user_id: user.id,
        turn_index: currentIndex + 1,
        role: "user",
        input_text: inputText,
        output_text: null,
        latency_ms: 0,
        debug_steps: { state: "listening" },
        created_at: nowIso(),
      },
      {
        session_id: sessionId,
        assistant_id: assistant.id,
        user_id: user.id,
        turn_index: currentIndex + 2,
        role: "assistant",
        input_text: null,
        output_text: assistantText,
        latency_ms: latencyMs,
        audio_data_url: audioDataUrl,
        debug_steps: {
          phases: ["listening", "thinking", "speaking"],
          model: orderLookupResult ? "commerce_lookup" : openai ? OPENAI_MODEL : "fallback",
          commerceLookup: orderLookupResult
            ? {
              attempted: true,
              found: Boolean(orderLookupResult.found),
              provider: orderLookupResult.provider || null,
            }
            : null,
        },
        created_at: nowIso(),
      },
    ];

    const { error: writeTurnError } = await dbClient.from("web_test_turns").insert(turnRows);
    if (writeTurnError) throw writeTurnError;

    await dbClient.from("web_test_sessions").update({ updated_at: nowIso(), status: "active" }).eq("id", sessionId);

    await upsertUsage(dbClient, {
      assistant_id: assistant.id,
      user_id: user.id,
      usage_type: "web_test_task",
      quantity: 1,
      unit: "task",
      amount_eur: 0,
      metadata: { latencyMs, sessionId },
      occurred_at: nowIso(),
    });

    return json({
      success: true,
      sessionId,
      state: "speaking",
      assistantText,
      audioDataUrl,
      latencyMs,
      debugPhases: [
        { key: "listening", label: "Luisteren", done: true },
        { key: "thinking", label: "AI denkt na", done: true },
        { key: "speaking", label: "AI spreekt", done: true },
      ],
      commerceLookup: orderLookupResult || null,
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleInvoiceRequest(req: Request, user: any, accessToken: string) {
  try {
    const dbClient = getDbClient(accessToken);
    const assistant = await ensureAssistant(dbClient, user.id);
    const body = await parseBody(req) as Record<string, unknown>;

    const plan = getPlanConfig(body?.planKey || assistant.desired_plan);
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 100000)}`;

    const { data: billingAccount, error: billingError } = await dbClient.from("billing_accounts").upsert(
      {
        user_id: user.id,
        email: user.email || null,
        payer_name: safeText(body?.payerName || user.user_metadata?.full_name || ""),
        status: "active",
        updated_at: nowIso(),
      },
      { onConflict: "user_id" },
    ).select("*").single();
    if (billingError) throw billingError;

    const { data: invoice, error: invoiceError } = await dbClient.from("invoices").insert({
      assistant_id: assistant.id,
      user_id: user.id,
      billing_account_id: billingAccount.id,
      invoice_number: invoiceNumber,
      status: "invoice_sent",
      plan_key: plan.key,
      amount_eur: plan.monthlyPriceEur,
      currency: "EUR",
      due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: safeText(body?.notes),
      updated_at: nowIso(),
    }).select("*").single();
    if (invoiceError) throw invoiceError;

    await dbClient.from("assistants").update({
      billing_status: "invoice_sent",
      desired_plan: plan.key,
      status: "awaiting_payment",
      updated_at: nowIso(),
    }).eq("id", assistant.id);

    await dbClient.from("subscription_state").upsert(
      {
        assistant_id: assistant.id,
        user_id: user.id,
        plan_key: plan.key,
        status: "pending_payment",
        included_minutes: plan.includedMinutes,
        included_tasks: plan.includedTasks,
        updated_at: nowIso(),
      },
      { onConflict: "assistant_id" },
    );

    await upsertUsage(dbClient, {
      assistant_id: assistant.id,
      user_id: user.id,
      usage_type: "invoice_request",
      quantity: 1,
      unit: "event",
      amount_eur: 0,
      metadata: { invoiceNumber, plan: plan.key },
      occurred_at: nowIso(),
    });

    return json({
      success: true,
      invoice,
      nextStep: "Wacht op admin payment approval: paid_approved.",
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleAdminApprove(req: Request) {
  if (!isAdminRequest(req)) {
    return errorJson("Admin key ontbreekt of is ongeldig.", 401);
  }

  try {
    const dbClient = getDbClient(null);
    const body = await parseBody(req) as Record<string, unknown>;
    const invoiceId = safeText(body?.invoiceId);
    const userId = safeText(body?.userId);
    const assistantId = safeText(body?.assistantId);

    let invoice: any = null;

    if (invoiceId) {
      const { data, error } = await dbClient.from("invoices").select("*").eq("id", invoiceId).maybeSingle();
      if (error) throw error;
      invoice = data;
    } else if (assistantId) {
      const { data, error } = await dbClient
        .from("invoices")
        .select("*")
        .eq("assistant_id", assistantId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      invoice = data;
    } else if (userId) {
      const { data, error } = await dbClient
        .from("invoices")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      invoice = data;
    }

    if (!invoice) return errorJson("Geen invoice gevonden voor deze aanvraag.", 404);

    const approvedAt = nowIso();
    const { data: updatedInvoice, error: invoiceUpdateError } = await dbClient.from("invoices").update({
      status: "paid_approved",
      paid_at: approvedAt,
      updated_at: approvedAt,
    }).eq("id", invoice.id).select("*").single();
    if (invoiceUpdateError) throw invoiceUpdateError;

    const { data: assistant, error: assistantUpdateError } = await dbClient.from("assistants").update({
      billing_status: "paid_approved",
      status: "provisioning_pending",
      desired_plan: updatedInvoice.plan_key,
      updated_at: approvedAt,
    }).eq("id", updatedInvoice.assistant_id).select("*").single();
    if (assistantUpdateError) throw assistantUpdateError;

    const { data: provisioningJob, error: provisioningError } = await dbClient.from("provisioning_jobs").insert({
      assistant_id: assistant.id,
      user_id: assistant.user_id,
      status: "queued",
      trigger: "admin_payment_approval",
      attempt_count: 0,
      payload: { invoiceId: updatedInvoice.id },
      created_at: approvedAt,
      updated_at: approvedAt,
    }).select("*").single();
    if (provisioningError) throw provisioningError;

    const shouldRunNow = body?.runNow !== false;
    let provisioningResult: any = { status: "queued" };
    if (shouldRunNow) {
      provisioningResult = await runProvisioningJob({ dbClient, jobId: provisioningJob.id });
    }

    return json({
      success: true,
      invoice: updatedInvoice,
      assistant,
      provisioningJobId: provisioningJob.id,
      provisioningResult,
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleProvisionRun(user: any, accessToken: string) {
  try {
    const dbClient = getDbClient(accessToken);
    const assistant = await ensureAssistant(dbClient, user.id);

    const { data: job, error: jobError } = await dbClient.from("provisioning_jobs").select("*").eq("assistant_id", assistant.id).in(
      "status",
      ["queued", "failed", "needs_number_reselect"],
    ).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (jobError) throw jobError;
    if (!job) return errorJson("Geen provisioning job gevonden voor deze gebruiker.", 404);

    const result = await runProvisioningJob({ dbClient, jobId: job.id });
    return json({ success: true, jobId: job.id, result });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleUsageSummary(user: any, accessToken: string) {
  try {
    const dbClient = getDbClient(accessToken);
    const assistant = await ensureAssistant(dbClient, user.id);
    const plan = getPlanConfig(assistant.desired_plan);

    const periodStart = new Date();
    periodStart.setUTCDate(1);
    periodStart.setUTCHours(0, 0, 0, 0);

    const { data: usageRows, error: usageError } = await dbClient
      .from("usage_ledger")
      .select("usage_type,quantity,amount_eur,occurred_at")
      .eq("assistant_id", assistant.id)
      .gte("occurred_at", periodStart.toISOString());
    if (usageError) throw usageError;

    let minutesUsed = 0;
    let tasksUsed = 0;
    let variableCosts = 0;

    for (const row of usageRows || []) {
      const type = String(row.usage_type || "");
      const quantity = Number(row.quantity || 0);
      const amount = Number(row.amount_eur || 0);

      if (type === "call_minutes") minutesUsed += quantity;
      if (type === "web_test_task" || type === "call_task") tasksUsed += quantity;
      variableCosts += amount;
    }

    const overageMinutes = Math.max(0, minutesUsed - plan.includedMinutes);
    const overageTasks = Math.max(0, tasksUsed - plan.includedTasks);
    const overageEstimate =
      overageMinutes * Number(plan.overageMinuteEur || 0) + overageTasks * Number(plan.overageTaskEur || 0);
    const planMetrics = estimatePlanMetrics(plan);

    return json({
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
        estimatedNetMarginPct: planMetrics.netMarginPct,
      },
      periodStart: periodStart.toISOString(),
      generatedAt: nowIso(),
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleIntegrationList(user: any, accessToken: string) {
  try {
    const dbClient = getDbClient(accessToken);
    const assistant = await ensureAssistant(dbClient, user.id);
    const rows = await fetchIntegrationsForAssistant(dbClient, assistant.id);
    return json({
      success: true,
      integrations: rows.map((entry: Record<string, any>) => sanitizeIntegration(entry)),
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleIntegrationConnect(req: Request, user: any, accessToken: string) {
  try {
    const dbClient = getDbClient(accessToken);
    const assistant = await ensureAssistant(dbClient, user.id);
    const body = await parseBody(req) as Record<string, unknown>;

    const provider = normalizeProvider(body.provider);
    const storeUrl = normalizeStoreUrl(body.storeUrl || body.store_url);
    const accessTokenValue = safeText(body.accessToken || body.access_token);
    const apiKey = safeText(body.apiKey || body.api_key);
    const apiSecret = safeText(body.apiSecret || body.api_secret);
    const webhookSecret = safeText(body.webhookSecret || body.webhook_secret);

    if (!provider) {
      return errorJson("provider is verplicht (shopify, prestashop, woocommerce).", 400);
    }
    if (!storeUrl) {
      return errorJson("storeUrl is verplicht.", 400);
    }

    if (provider === "shopify" && !accessTokenValue) {
      return errorJson("Voor Shopify is accessToken verplicht.", 400);
    }
    if (provider === "prestashop" && !apiKey) {
      return errorJson("Voor PrestaShop is apiKey verplicht.", 400);
    }

    const { data: saved, error } = await dbClient
      .from("commerce_integrations")
      .upsert(
        {
          assistant_id: assistant.id,
          user_id: user.id,
          provider,
          status: "connected",
          store_url: storeUrl,
          access_token: accessTokenValue || null,
          api_key: apiKey || null,
          api_secret: apiSecret || null,
          webhook_secret: webhookSecret || null,
          metadata: {},
          updated_at: nowIso(),
        },
        { onConflict: "assistant_id,provider" },
      )
      .select("*")
      .single();

    if (error) throw error;

    return json({
      success: true,
      integration: sanitizeIntegration(saved),
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleIntegrationDisconnect(req: Request, user: any, accessToken: string) {
  try {
    const dbClient = getDbClient(accessToken);
    const assistant = await ensureAssistant(dbClient, user.id);
    const body = await parseBody(req) as Record<string, unknown>;
    const provider = normalizeProvider(body.provider);

    if (!provider) {
      return errorJson("provider is verplicht.", 400);
    }

    const { data: row, error } = await dbClient
      .from("commerce_integrations")
      .update({
        status: "disconnected",
        updated_at: nowIso(),
      })
      .eq("assistant_id", assistant.id)
      .eq("provider", provider)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!row) {
      return errorJson(`Geen ${provider} koppeling gevonden om los te koppelen.`, 404);
    }

    return json({
      success: true,
      integration: sanitizeIntegration(row),
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleIntegrationOrderStatus(req: Request, user: any, accessToken: string) {
  try {
    const dbClient = getDbClient(accessToken);
    const assistant = await ensureAssistant(dbClient, user.id);
    const body = await parseBody(req) as Record<string, unknown>;

    const lookup = await lookupOrderStatus(dbClient, assistant.id, {
      provider: body.provider,
      orderReference: body.orderReference || body.orderNumber || body.reference,
      email: body.email,
    });

    if (lookup.error) {
      return errorJson(lookup.error, 400);
    }

    if (!lookup.found) {
      return json({
        success: true,
        found: false,
        orderReference: lookup.orderReference || null,
        message: `Geen bestelling gevonden voor ${lookup.orderReference || "de opgegeven referentie"}.`,
      });
    }

    await upsertUsage(dbClient, {
      assistant_id: assistant.id,
      user_id: user.id,
      usage_type: "order_status_lookup",
      quantity: 1,
      unit: "event",
      amount_eur: 0,
      metadata: {
        provider: lookup.provider,
        orderReference: lookup.orderReference,
      },
      occurred_at: nowIso(),
    });

    return json({
      success: true,
      found: true,
      order: lookup,
      assistantText: buildOrderStatusReply(lookup),
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const method = req.method.toUpperCase();
    const path = getRoutePath(req);

    if (method === "GET" && path === "/health") {
      return json({
        ok: true,
        service: "ai-hub-call-api-edge",
        now: nowIso(),
        features: {
          openai: Boolean(openai),
          elevenlabs: Boolean(ELEVENLABS_API_KEY),
          twilio: Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN),
          supabaseServiceRole: Boolean(SUPABASE_SERVICE_ROLE_KEY),
          mode: "supabase-only",
        },
      });
    }

    if (method === "GET" && path === "/voices/options") {
      return json(VOICE_OPTIONS);
    }

    if (method === "GET" && path === "/pricing/plans") {
      const plans = Object.values(PLAN_CATALOG).map((plan) => ({
        ...plan,
        metrics: estimatePlanMetrics(plan),
      }));
      return json({ plans, assumptions: COST_ASSUMPTIONS });
    }

    if (method === "GET" && path === "/numbers/options") {
      const auth = await requireUser(req);
      if (auth.error) return auth.error;
      const owned = await fetchTwilioOwnedNumbers();
      return json(owned.length > 0 ? owned : DEFAULT_NUMBERS);
    }

    if (method === "GET" && path === "/assistant/state") {
      const auth = await requireUser(req);
      if (auth.error) return auth.error;
      return await handleAssistantState(auth.user, auth.token);
    }

    if (method === "GET" && path === "/integrations/list") {
      const auth = await requireUser(req);
      if (auth.error) return auth.error;
      return await handleIntegrationList(auth.user, auth.token);
    }

    if (method === "POST" && path === "/onboarding/save") {
      const auth = await requireUser(req);
      if (auth.error) return auth.error;
      return await handleOnboardingSave(req, auth.user, auth.token, null);
    }

    if (method === "POST" && path === "/assistant/config") {
      const auth = await requireUser(req);
      if (auth.error) return auth.error;
      const body = await parseBody(req) as Record<string, unknown>;
      const legacyPayload = {
        ...body,
        companyName: body?.companyName,
        voiceKey: body?.voiceKey || body?.voice || VOICE_OPTIONS[0].key,
        numberE164: body?.numberE164 || body?.phoneNumber,
      };
      return await handleOnboardingSave(req, auth.user, auth.token, legacyPayload);
    }

    if (method === "POST" && path === "/webcall/turn") {
      const auth = await requireUser(req);
      if (auth.error) return auth.error;
      return await handleWebCallTurn(req, auth.user, auth.token);
    }

    if (method === "POST" && path === "/invoice/request") {
      const auth = await requireUser(req);
      if (auth.error) return auth.error;
      return await handleInvoiceRequest(req, auth.user, auth.token);
    }

    if (method === "POST" && path === "/integrations/connect") {
      const auth = await requireUser(req);
      if (auth.error) return auth.error;
      return await handleIntegrationConnect(req, auth.user, auth.token);
    }

    if (method === "POST" && path === "/integrations/disconnect") {
      const auth = await requireUser(req);
      if (auth.error) return auth.error;
      return await handleIntegrationDisconnect(req, auth.user, auth.token);
    }

    if (method === "POST" && path === "/integrations/order-status") {
      const auth = await requireUser(req);
      if (auth.error) return auth.error;
      return await handleIntegrationOrderStatus(req, auth.user, auth.token);
    }

    if (method === "POST" && path === "/admin/approve-payment") {
      return await handleAdminApprove(req);
    }

    if (method === "POST" && path === "/provision/run") {
      const auth = await requireUser(req);
      if (auth.error) return auth.error;
      return await handleProvisionRun(auth.user, auth.token);
    }

    if ((method === "GET" || method === "POST") && path === "/usage/summary") {
      const auth = await requireUser(req);
      if (auth.error) return auth.error;
      return await handleUsageSummary(auth.user, auth.token);
    }

    return errorJson(`Route niet gevonden: ${method} ${path}`, 404);
  } catch (error: any) {
    return errorJson(error?.message || "Onbekende fout in call-api edge function.", 500);
  }
});
