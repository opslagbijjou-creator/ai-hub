import { createClient } from "npm:@supabase/supabase-js@2";
import OpenAI from "npm:openai@4";

const SUPABASE_URL = String(Deno.env.get("SUPABASE_URL") || "").trim();
const SUPABASE_ANON_KEY = String(Deno.env.get("SUPABASE_ANON_KEY") || "").trim();
const SUPABASE_SERVICE_ROLE_KEY = String(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();

const OPENAI_API_KEY = String(Deno.env.get("OPENAI_API_KEY") || "").trim();
const OPENAI_MODEL = String(Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini").trim();
const ELEVENLABS_API_KEY = String(Deno.env.get("ELEVENLABS_API_KEY") || "").trim();
const ELEVENLABS_MODEL_ID = String(Deno.env.get("ELEVENLABS_MODEL_ID") || "eleven_flash_v2_5").trim();
const TWILIO_ACCOUNT_SID = String(Deno.env.get("TWILIO_ACCOUNT_SID") || "").trim();
const TWILIO_AUTH_TOKEN = String(Deno.env.get("TWILIO_AUTH_TOKEN") || "").trim();
const ADMIN_USER_IDS = Array.from(
  new Set(
    String(Deno.env.get("ADMIN_USER_IDS") || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  ),
);
const CONFIGURED_ALLOWED_ORIGINS = Array.from(
  new Set(
    String(Deno.env.get("ALLOWED_ORIGINS") || "")
      .split(",")
      .map((entry) => entry.trim().replace(/\/$/, ""))
      .filter(Boolean),
  ),
);
const ALLOW_SIMULATED_PROVISIONING =
  String(Deno.env.get("ALLOW_SIMULATED_PROVISIONING") || "true").toLowerCase() !== "false";
const COMMERCE_LOOKUP_ENABLED = false;

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

const AVATAR_OPTIONS = [
  { key: "avatar_01", label: "Robin", imageUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=Robin" },
  { key: "avatar_02", label: "Sophie", imageUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=Sophie" },
  { key: "avatar_03", label: "Mila", imageUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=Mila" },
  { key: "avatar_04", label: "Daan", imageUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=Daan" },
  { key: "avatar_05", label: "Noah", imageUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=Noah" },
  { key: "avatar_06", label: "Emma", imageUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=Emma" },
  { key: "avatar_07", label: "Yara", imageUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=Yara" },
  { key: "avatar_08", label: "Liam", imageUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=Liam" },
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

type WebsiteFaqHint = {
  question: string;
  answer: string;
};

type WebsiteSnapshot = {
  requestedUrl: string;
  finalUrl: string;
  title: string;
  description: string;
  headings: string[];
  textSnippet: string;
  faqHints: WebsiteFaqHint[];
  knowledgeSummary: string;
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

function hasKey(payload: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(payload, key);
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

function normalizeBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "ja", "aan", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "nee", "uit", "off"].includes(normalized)) return false;
  }
  return fallback;
}

function normalizeStep(value: unknown, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(5, Math.max(1, Math.round(parsed)));
}

function normalizeAvailabilityMode(value: unknown, fallback = "always") {
  const mode = safeText(value, fallback).toLowerCase();
  return mode === "custom_hours" ? "custom_hours" : "always";
}

function normalizeAvailabilitySchedule(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;

  if (typeof value === "string") {
    const parsed = value.trim();
    if (!parsed) return {};
    try {
      const decoded = JSON.parse(parsed);
      if (decoded && typeof decoded === "object" && !Array.isArray(decoded)) return decoded;
    } catch {
      return {};
    }
  }

  return {};
}

function normalizeWebsiteUrl(value: unknown) {
  const raw = safeText(value);
  if (!raw) return "";

  try {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function isPrivateHostname(hostname: string) {
  const host = safeText(hostname).toLowerCase();
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "0.0.0.0" || host === "::1") return true;

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const octets = host.split(".").map((part) => Number(part));
    if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return true;

    if (
      octets[0] === 10 ||
      octets[0] === 127 ||
      octets[0] === 0 ||
      (octets[0] === 169 && octets[1] === 254) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168)
    ) {
      return true;
    }
  }

  if (host.includes(":")) {
    return host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:");
  }

  return false;
}

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function htmlToText(input: string) {
  return decodeHtmlEntities(
    String(input || "")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values: string[], limit = 6) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const text = safeText(value).replace(/\s+/g, " ").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= limit) break;
  }

  return result;
}

function extractMetaContent(html: string, selector: string) {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${selector}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${selector}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+property=["']${selector}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${selector}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return htmlToText(match[1]);
  }

  return "";
}

function extractHtmlMatches(html: string, pattern: RegExp, limit = 6) {
  return uniqueStrings(
    Array.from(html.matchAll(pattern))
      .map((match) => htmlToText(match[1] || ""))
      .filter(Boolean),
    limit,
  );
}

function buildWebsiteSnapshotFromHtml(html: string, requestedUrl: string, finalUrl: string): WebsiteSnapshot | null {
  const title = htmlToText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  const description = extractMetaContent(html, "description") || extractMetaContent(html, "og:description");
  const headings = extractHtmlMatches(html, /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi, 6);
  const textContent = htmlToText(html).slice(0, 8000);
  const sentences = uniqueStrings(
    textContent
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= 35 && sentence.length <= 240),
    5,
  );
  const questionLines = uniqueStrings(
    [...headings, ...sentences].filter((line) =>
      line.includes("?") || /^(hoe|wat|waar|wanneer|welke|wie|kan|kunnen|is|zijn)\b/i.test(line)
    ),
    3,
  );

  const faqHints = questionLines.map((question) => ({
    question: question.endsWith("?") ? question : `${question}?`,
    answer: "Beantwoord dit kort en concreet op basis van de website-informatie.",
  }));

  const knowledgeSummary = [
    title ? `Website titel: ${title}` : "",
    description ? `Meta beschrijving: ${description}` : "",
    headings.length ? `Belangrijkste secties: ${headings.join(" | ")}` : "",
    sentences.length ? `Samenvatting website-inhoud: ${sentences.slice(0, 3).join(" ")}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!knowledgeSummary && !textContent) return null;

  return {
    requestedUrl,
    finalUrl,
    title,
    description,
    headings,
    textSnippet: textContent.slice(0, 1800),
    faqHints,
    knowledgeSummary,
  };
}

async function fetchWebsiteSnapshot(rawUrl: unknown): Promise<WebsiteSnapshot | null> {
  const requestedUrl = normalizeWebsiteUrl(rawUrl);
  if (!requestedUrl) return null;

  try {
    const hostname = new URL(requestedUrl).hostname;
    if (isPrivateHostname(hostname)) return null;
  } catch {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(requestedUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) return null;

    const contentType = safeText(response.headers.get("content-type")).toLowerCase();
    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      return null;
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (Number.isFinite(contentLength) && contentLength > 1_000_000) return null;

    const html = (await response.text()).slice(0, 200_000);
    return buildWebsiteSnapshotFromHtml(html, requestedUrl, response.url || requestedUrl);
  } catch (error) {
    const message = (error as any)?.message || error;
    console.warn("Website snapshot waarschuwing:", message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function tryParseJsonObject(raw: unknown) {
  const text = safeText(raw);
  if (!text) return null;

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const attempts = [cleaned];
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    attempts.push(cleaned.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function normalizeTemplates(value: unknown) {
  if (!value) return [];
  const rows = Array.isArray(value) ? value : [];
  return rows
    .map((row, index) => {
      const item = row && typeof row === "object" ? row as Record<string, unknown> : {};
      const title = safeText(item?.title || item?.name || `Template ${index + 1}`);
      const trigger = safeText(item?.trigger || item?.when || item?.condition);
      const text = safeText(item?.text || item?.message || item?.content);
      if (!text) return null;
      return { title, trigger, text };
    })
    .filter(Boolean)
    .slice(0, 20);
}

function normalizeFaqItems(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry, index) => {
      const item = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
      const question = safeText(item?.question);
      const answer = safeText(item?.answer);
      if (!question || !answer) return null;
      return {
        question,
        answer,
        position: Number(item?.position || index + 1) || index + 1,
        isActive: normalizeBoolean(item?.is_active ?? item?.isActive, true),
      };
    })
    .filter(Boolean)
    .slice(0, 50);
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

function assertServiceRoleAvailable() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is nodig voor adminacties.");
  }
}

function getAllowedOrigins() {
  return Array.from(
    new Set([
      ...CONFIGURED_ALLOWED_ORIGINS,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:4173",
      "http://127.0.0.1:4173",
    ]),
  );
}

function resolveAllowedOrigin(req: Request) {
  const origin = String(req.headers.get("origin") || "").trim().replace(/\/$/, "");
  if (!origin) return "";
  return getAllowedOrigins().includes(origin) ? origin : "";
}

function buildResponseHeaders(req: Request) {
  const url = new URL(req.url);
  const allowedOrigin = resolveAllowedOrigin(req);
  const headers = new Headers({
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  });

  if (allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.set("Vary", "Origin");
  }

  if (url.protocol === "https:") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  return headers;
}

function withResponseHeaders(req: Request, response: Response) {
  const merged = buildResponseHeaders(req);
  response.headers.forEach((value, key) => {
    merged.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: merged,
  });
}

function createDbClient(apiKey: string, accessToken: string | null = null) {
  return createClient(SUPABASE_URL, apiKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}

function getUserDbClient(accessToken: string) {
  assertSupabaseReady();
  if (!SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_ANON_KEY ontbreekt.");
  }
  if (!accessToken) {
    throw new Error("Bearer token ontbreekt voor user database client.");
  }
  return createDbClient(SUPABASE_ANON_KEY, accessToken);
}

function getServiceDbClient() {
  assertSupabaseReady();
  assertServiceRoleAvailable();
  return createDbClient(SUPABASE_SERVICE_ROLE_KEY);
}

function getAuthClient() {
  if (SUPABASE_ANON_KEY) return createDbClient(SUPABASE_ANON_KEY);
  if (SUPABASE_SERVICE_ROLE_KEY) return createDbClient(SUPABASE_SERVICE_ROLE_KEY);
  throw new Error("Supabase auth client ontbreekt.");
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
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

function isBootstrapAdminUserId(userId: unknown) {
  const id = safeText(userId);
  return Boolean(id && ADMIN_USER_IDS.includes(id));
}

async function hasAdminAccess(userId: unknown) {
  const id = safeText(userId);
  if (!id) return false;
  if (isBootstrapAdminUserId(id)) return true;
  if (!SUPABASE_SERVICE_ROLE_KEY) return false;

  try {
    const serviceClient = getServiceDbClient();
    const { data, error } = await serviceClient
      .from("admin_users")
      .select("user_id, role, active")
      .eq("user_id", id)
      .eq("active", true)
      .maybeSingle();
    if (error && !isMissingTableError(error)) throw error;
    return Boolean(data?.user_id);
  } catch (error) {
    if (!isMissingTableError(error)) {
      console.warn("Admin lookup waarschuwing:", (error as any)?.message || error);
    }
    return false;
  }
}

async function requireAdminAccess(req: Request) {
  const auth = await requireUser(req);
  if (!auth.error && auth.user && await hasAdminAccess(auth.user.id)) {
    return {
      error: null,
      user: auth.user,
      token: auth.token,
      mode: isBootstrapAdminUserId(auth.user.id) ? "bootstrap" as const : "role" as const,
    };
  }

  return { error: errorJson("Geen admintoegang.", 403), user: null, token: "", mode: "none" as const };
}

function onboardingFromPayload(
  payload: Record<string, unknown> = {},
  options: { partial?: boolean } = {},
) {
  const partial = Boolean(options.partial);
  const getText = (keys: string[], fallback = "") => {
    for (const key of keys) {
      if (hasKey(payload, key)) return safeText(payload[key]);
    }
    return partial ? undefined : fallback;
  };
  const getBool = (keys: string[], fallback?: boolean) => {
    for (const key of keys) {
      if (hasKey(payload, key)) return normalizeBoolean(payload[key], fallback);
    }
    return partial ? undefined : fallback;
  };

  const servicesValue = hasKey(payload, "services")
    ? normalizeArray(payload.services)
    : undefined;

  const faqItems = hasKey(payload, "faqItems")
    ? normalizeFaqItems(payload.faqItems)
    : partial
      ? undefined
      : [];

  const smsTemplates = hasKey(payload, "smsTemplates")
    ? normalizeTemplates(payload.smsTemplates)
    : partial
      ? undefined
      : [];

  const whatsappTemplates = hasKey(payload, "whatsappTemplates")
    ? normalizeTemplates(payload.whatsappTemplates)
    : partial
      ? undefined
      : [];

  return {
    assistantName: getText(["assistantName", "displayName", "name"], undefined),
    avatarKey: getText(["avatarKey"], undefined),
    companyName: getText(["companyName", "businessName"], undefined),
    businessType: getText(["businessType"], undefined),
    services: servicesValue,
    pricing: getText(["pricing"], undefined),
    openingHours: getText(["openingHours"], undefined),
    toneOfVoice: getText(["toneOfVoice"], undefined),
    primaryGoal: getText(["primaryGoal", "goals"], undefined),
    goals: getText(["goals", "primaryGoal"], undefined),
    greeting: getText(["greeting"], undefined),
    knowledge: getText(["knowledge"], undefined),
    websiteUrl: hasKey(payload, "websiteUrl") || hasKey(payload, "website")
      ? normalizeWebsiteUrl(payload.websiteUrl ?? payload.website)
      : partial
        ? undefined
        : "",
    secondaryLanguage: getText(["secondaryLanguage"], undefined),
    roleDescription: getText(["roleDescription"], undefined),
    handoffRules: getText(["handoffRules"], undefined),
    voiceKey: getText(["voiceKey"], undefined),
    numberE164: hasKey(payload, "numberE164") || hasKey(payload, "phoneNumber")
      ? normalizePhoneNumber(payload.numberE164 || payload.phoneNumber)
      : undefined,
    numberLabel: getText(["numberLabel"], undefined),
    planKey: hasKey(payload, "planKey") ? normalizePlanKey(payload.planKey) : undefined,
    smsEnabled: getBool(["smsEnabled"], undefined),
    whatsappEnabled: getBool(["whatsappEnabled"], undefined),
    callEnabled: getBool(["callEnabled"], undefined),
    smsTemplates,
    whatsappTemplates,
    availabilityMode: hasKey(payload, "availabilityMode")
      ? normalizeAvailabilityMode(payload.availabilityMode)
      : undefined,
    availabilitySchedule: hasKey(payload, "availabilitySchedule")
      ? normalizeAvailabilitySchedule(payload.availabilitySchedule)
      : undefined,
    faqItems,
    setupStep: hasKey(payload, "setupStep") ? normalizeStep(payload.setupStep, 1) : undefined,
    setupCompleted: hasKey(payload, "setupCompleted")
      ? normalizeBoolean(payload.setupCompleted, false)
      : undefined,
  };
}

function getVoiceOption(voiceKey: string) {
  return VOICE_OPTIONS.find((voice) => voice.key === voiceKey) || VOICE_OPTIONS[0];
}

function buildAssistantPrompt(
  {
    profile = {},
    assistant = {},
    voice = {},
    number = {},
    channelSettings = {},
    faqs = [],
  }: Record<string, any>,
) {
  const safeProfile = profile && typeof profile === "object" ? profile : {};
  const safeAssistant = assistant && typeof assistant === "object" ? assistant : {};
  const safeVoice = voice && typeof voice === "object" ? voice : {};
  const safeNumber = number && typeof number === "object" ? number : {};

  const services = Array.isArray(safeProfile.services) ? safeProfile.services : [];
  const servicesText = services.length > 0 ? services.join(", ") : "niet gespecificeerd";
  const openingHours = safeProfile.opening_hours || safeProfile.openingHours || "onbekend";
  const pricing = safeProfile.pricing || "niet ingevuld";
  const goals = safeProfile.goals || "beantwoord vragen en help met opvolging";
  const tone = safeProfile.tone_of_voice || safeProfile.toneOfVoice || "vriendelijk en duidelijk";
  const company = safeProfile.company_name || safeAssistant.display_name || "dit bedrijf";
  const selectedNumber = safeNumber.e164 || "nog niet live";
  const websiteUrl = safeProfile.website_url || "niet ingevuld";
  const knowledgeSummary = safeText(safeProfile.knowledge || "nog geen extra kennisbron ingesteld").slice(0, 1800);
  const roleDescription = safeProfile.role_description || "servicegerichte receptioniste";
  const handoffRules = safeProfile.handoff_rules || "stuur door bij spoed of complexe cases";
  const faqPreview = Array.isArray(faqs) && faqs.length > 0
    ? faqs
      .slice(0, 5)
      .map((entry: Record<string, any>, index: number) => `${index + 1}. ${entry.question}: ${entry.answer}`)
      .join(" | ")
    : "nog geen FAQ ingesteld";
  const availabilityMode = channelSettings?.availability_mode === "custom_hours"
    ? "alleen binnen opgegeven tijden"
    : "altijd beschikbaar";

  return [
    "Je bent een Nederlandse AI telefoon-assistent voor inkomende klantgesprekken.",
    `Bedrijf: ${company}`,
    `Website: ${websiteUrl}`,
    `Diensten: ${servicesText}`,
    `Prijzen: ${pricing}`,
    `Openingstijden: ${openingHours}`,
    `Doel van gesprek: ${goals}`,
    `Rol: ${roleDescription}`,
    `Doorstuurregels: ${handoffRules}`,
    `Tone of voice: ${tone}`,
    `Gekozen stem: ${safeVoice.display_name || "standaard stem"}`,
    `Gekozen nummer: ${selectedNumber}`,
    `Beschikbaarheid: ${availabilityMode}`,
    `Website- en kenniscontext: ${knowledgeSummary}`,
    `FAQ context: ${faqPreview}`,
    "Regels:",
    "- Geef korte, natuurlijke antwoorden.",
    "- Stel 1 vervolgvraag als informatie ontbreekt.",
    "- Bevestig belangrijke details hardop (naam, datum, tijd).",
    "- Gebruik eerst de website-, kennis- en FAQ-context als waarheid. Verzin geen details die niet in de context staan.",
    "- Bij vragen over orderstatus: leg uit dat secure webshop lookup tijdelijk via het supportteam loopt en noteer een terugbelverzoek als nodig.",
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

async function fetchFaqEntries(dbClient: any, assistantId: string) {
  const { data, error } = await dbClient
    .from("assistant_faq_entries")
    .select("*")
    .eq("assistant_id", assistantId)
    .eq("is_active", true)
    .order("position", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function fetchChannelSettings(dbClient: any, assistantId: string) {
  const { data, error } = await dbClient
    .from("assistant_channel_settings")
    .select("*")
    .eq("assistant_id", assistantId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

function getAvatarOption(key: unknown) {
  const avatarKey = safeText(key);
  return AVATAR_OPTIONS.find((entry) => entry.key === avatarKey) || AVATAR_OPTIONS[0];
}

function buildWizardChecklist(params: {
  assistant: Record<string, any>;
  profile: Record<string, any> | null;
  voice: Record<string, any> | null;
  faqs: Array<Record<string, any>>;
  channelSettings: Record<string, any> | null;
}) {
  const { assistant, profile, voice, faqs, channelSettings } = params;

  const identityDone = Boolean(assistant?.display_name && assistant?.avatar_key);
  const websiteDone = Boolean(safeText(profile?.website_url) && safeText(profile?.goals || profile?.primary_goal));
  const voiceDone = Boolean(voice?.voice_key);
  const faqDoneCount = Array.isArray(faqs)
    ? faqs.filter((entry) => safeText(entry?.question) && safeText(entry?.answer)).length
    : 0;
  const instructionsDone = Boolean(
    safeText(profile?.role_description) && safeText(profile?.handoff_rules) && faqDoneCount > 0,
  );
  const availabilitySchedule = channelSettings?.availability_schedule &&
      typeof channelSettings.availability_schedule === "object" &&
      !Array.isArray(channelSettings.availability_schedule)
    ? Object.values(channelSettings.availability_schedule)
    : [];
  const hasActiveSchedule = availabilitySchedule.some((slot: any) =>
    slot &&
    typeof slot === "object" &&
    slot.enabled !== false &&
    safeText(slot.start) &&
    safeText(slot.end)
  );
  const availabilityDone = Boolean(
    channelSettings?.availability_mode === "always" ||
      (channelSettings?.availability_mode === "custom_hours" && hasActiveSchedule),
  );

  const checklist = [
    {
      key: "identiteit",
      label: "Identiteit",
      done: identityDone,
      description: identityDone ? "Naam en avatar zijn gekozen." : "Kies naam en avatar.",
    },
    {
      key: "website",
      label: "Website",
      done: websiteDone,
      description: websiteDone
        ? safeText(profile?.knowledge)
          ? "Website en hoofddoel zijn ingevuld en geanalyseerd."
          : "Website en hoofddoel zijn ingevuld."
        : "Vul website en hulpdoel in.",
    },
    {
      key: "stem",
      label: "Stem",
      done: voiceDone,
      description: voiceDone ? "Stem is gekozen." : "Kies een stem.",
    },
    {
      key: "instructies",
      label: "Instructies",
      done: instructionsDone,
      description: instructionsDone
        ? `Rol, handoff en ${faqDoneCount} FAQ${faqDoneCount === 1 ? "" : "'s"} zijn ingesteld.`
        : "Voeg rolregels en FAQ toe.",
    },
    {
      key: "bereikbaarheid",
      label: "Bereikbaarheid",
      done: availabilityDone,
      description: availabilityDone
        ? "Beschikbaarheid staat goed."
        : "Kies beschikbaarheid en tijden.",
    },
  ];

  const fallbackStep = checklist.findIndex((entry) => !entry.done) + 1 || 5;
  const completedCount = checklist.filter((entry) => entry.done).length;
  const completed = completedCount === checklist.length;
  const savedStep = normalizeStep(assistant?.setup_step, fallbackStep || 1);
  const resolvedStep = completed ? checklist.length : Math.min(savedStep, fallbackStep || savedStep);

  return {
    step: resolvedStep,
    completed,
    completedCount,
    totalSteps: checklist.length,
    checklist,
  };
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

function getFunctionBaseUrl(req: Request) {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const fnIndex = parts.indexOf("call-api");
  const baseParts = fnIndex >= 0 ? parts.slice(0, fnIndex + 1) : parts;
  return `${url.protocol}//${url.host}/${baseParts.join("/")}`.replace(/\/$/, "");
}

function getTwilioAuthHeader() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return "";
  return `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`;
}

async function twilioApiRequest(path: string, options: { method?: string; body?: URLSearchParams } = {}) {
  const authHeader = getTwilioAuthHeader();
  if (!authHeader) throw new Error("Twilio credentials ontbreken.");

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}${path}`,
    {
      method: options.method || "GET",
      headers: {
        Authorization: authHeader,
        ...(options.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      body: options.body?.toString(),
    },
  );

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(`Twilio request mislukt: ${reason.slice(0, 240)}`);
  }

  return response.json();
}

async function findOwnedTwilioNumberSid(targetE164: string) {
  if (!targetE164 || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
  const numbers = await fetchTwilioOwnedNumbers();
  const normalizedTarget = normalizePhoneNumber(targetE164);
  const match = numbers.find((row: Record<string, any>) => normalizePhoneNumber(row.e164) === normalizedTarget);
  return match?.twilioPhoneSid || null;
}

async function configureTwilioNumber(phoneSid: string, baseUrl: string) {
  if (!phoneSid) return;
  const body = new URLSearchParams({
    VoiceMethod: "POST",
    VoiceUrl: `${baseUrl}/twilio/voice`,
    StatusCallback: `${baseUrl}/twilio/status`,
    StatusCallbackMethod: "POST",
  });
  await twilioApiRequest(`/IncomingPhoneNumbers/${encodeURIComponent(phoneSid)}.json`, {
    method: "POST",
    body,
  });
}

async function parseTwilioFormRequest(req: Request) {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);
  return {
    rawBody,
    params,
    body: Object.fromEntries(params.entries()),
  };
}

function toBase64(bytes: ArrayBuffer) {
  let binary = "";
  const view = new Uint8Array(bytes);
  for (let index = 0; index < view.length; index += 1) {
    binary += String.fromCharCode(view[index]);
  }
  return btoa(binary);
}

async function computeTwilioSignature(url: string, params: URLSearchParams) {
  const sortedEntries = Array.from(params.entries()).sort(([leftKey, leftValue], [rightKey, rightValue]) => {
    if (leftKey === rightKey) return leftValue.localeCompare(rightValue);
    return leftKey.localeCompare(rightKey);
  });

  let payload = url;
  for (const [key, value] of sortedEntries) {
    payload += `${key}${value}`;
  }

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(TWILIO_AUTH_TOKEN),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(payload));
  return toBase64(signature);
}

function safeCompare(left: string, right: string) {
  const a = String(left || "");
  const b = String(right || "");
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

async function isValidTwilioSignature(req: Request, params: URLSearchParams) {
  if (!TWILIO_AUTH_TOKEN) return false;
  const expected = await computeTwilioSignature(req.url, params);
  const received = String(req.headers.get("x-twilio-signature") || "").trim();
  return safeCompare(expected, received);
}

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildTwimlResponse(parts: string[]) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${parts.join("")}</Response>`, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

function twimlSay(text: string, voice = "alice") {
  return `<Say language="nl-NL" voice="${escapeXml(voice)}">${escapeXml(text)}</Say>`;
}

function twimlGather(action: string, inner: string, voice = "alice") {
  return (
    `<Gather input="speech" speechTimeout="auto" language="nl-NL" method="POST" action="${escapeXml(action)}">` +
    `${inner || twimlSay("Ik luister.", voice)}` +
    "</Gather>"
  );
}

function twimlRedirect(url: string) {
  return `<Redirect method="POST">${escapeXml(url)}</Redirect>`;
}

function twimlHangup() {
  return "<Hangup/>";
}

function normalizeProvider(value: unknown) {
  const provider = String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  const canonicalMap: Record<string, string> = {
    magento2: "magento",
    "magento-2": "magento",
    "magento_2": "magento",
    bigcommerce: "bigcommerce",
    "big-commerce": "bigcommerce",
    stripebilling: "stripe",
    "stripe-billing": "stripe",
  };
  const normalized = canonicalMap[provider] || provider;

  if (["shopify", "prestashop", "woocommerce", "magento", "bigcommerce", "stripe"].includes(normalized)) {
    return normalized;
  }
  return "";
}

function supportsSelfServiceIntegration(provider: string) {
  void provider;
  return false;
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
    if (url.protocol !== "https:") return "";
    if (!url.hostname || isPrivateHostname(url.hostname)) return "";
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

function normalizeOrderReference(value: unknown) {
  return safeText(value).replace(/^#/, "");
}

function sanitizeIntegration(integration: Record<string, any>) {
  const metadata =
    integration?.metadata && typeof integration.metadata === "object" && !Array.isArray(integration.metadata)
      ? integration.metadata
      : {};

  return {
    id: integration.id,
    provider: integration.provider,
    status: integration.status,
    storeUrl: integration.store_url,
    lastSyncAt: integration.last_sync_at || null,
    updatedAt: integration.updated_at || null,
    setupMode: safeText(metadata.setupMode, "concierge"),
    setupNotes: safeText(metadata.setupNotes),
    contactEmail: safeText(metadata.contactEmail),
    requestedAt: safeText(metadata.requestedAt || integration.created_at),
    completedAt: safeText(metadata.completedAt),
    managedBy: safeText(metadata.managedBy),
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

async function lookupWooCommerceOrderStatus(integration: Record<string, any>, params: Record<string, any>) {
  const storeUrl = normalizeStoreUrl(integration.store_url || integration.storeUrl);
  const consumerKey = safeText(integration.api_key || integration.apiKey);
  const consumerSecret = safeText(integration.api_secret || integration.apiSecret);
  const orderReference = normalizeOrderReference(params.orderReference || params.orderNumber || params.reference);
  const email = safeText(params.email).toLowerCase();

  if (!storeUrl || !consumerKey || !consumerSecret || !orderReference) {
    return { found: false, error: "WooCommerce configuratie of orderreferentie ontbreekt." };
  }

  const authQuery = `consumer_key=${encodeURIComponent(consumerKey)}&consumer_secret=${encodeURIComponent(consumerSecret)}`;

  const mapOrder = (order: Record<string, any>) =>
    formatLookupResult({
      provider: "woocommerce",
      orderReference: String(order.number || order.id || orderReference),
      status: order.status || "Onbekend",
      paymentStatus: order.payment_method_title || null,
      customerEmail: order?.billing?.email || email || null,
      totalAmount: order.total || null,
      currency: order.currency || null,
      source: storeUrl,
      raw: order,
    });

  if (/^\d+$/.test(orderReference)) {
    const directResponse = await fetch(`${storeUrl}/wp-json/wc/v3/orders/${orderReference}?${authQuery}`);
    if (directResponse.ok) {
      const directOrder = await directResponse.json();
      if (!email || safeText(directOrder?.billing?.email).toLowerCase() === email) {
        return mapOrder(directOrder);
      }
    }
  }

  const searchResponse = await fetch(
    `${storeUrl}/wp-json/wc/v3/orders?search=${encodeURIComponent(orderReference)}&per_page=15&${authQuery}`,
  );

  if (!searchResponse.ok) {
    const reason = await searchResponse.text();
    return { found: false, error: `WooCommerce request mislukt: ${reason.slice(0, 180)}` };
  }

  const orders = await searchResponse.json();
  if (!Array.isArray(orders) || !orders.length) {
    return { found: false, notFound: true, provider: "woocommerce", orderReference };
  }

  const match = orders.find((order: Record<string, any>) => {
    const matchesReference =
      String(order?.number || "").replace(/^#/, "") === orderReference ||
      String(order?.id || "") === orderReference;
    const matchesEmail = !email || safeText(order?.billing?.email).toLowerCase() === email;
    return matchesReference && matchesEmail;
  }) || orders.find((order: Record<string, any>) => !email || safeText(order?.billing?.email).toLowerCase() === email);

  if (!match) {
    return { found: false, notFound: true, provider: "woocommerce", orderReference };
  }

  return mapOrder(match);
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
        const result: any = await lookupShopifyOrderStatus(integration, { orderReference, email });
        if (result.found || result.notFound) return result;
        lastError = result.error || lastError;
      } else if (currentProvider === "prestashop") {
        const result: any = await lookupPrestashopOrderStatus(integration, { orderReference, email });
        if (result.found || result.notFound) return result;
        lastError = result.error || lastError;
      } else if (currentProvider === "woocommerce") {
        const result: any = await lookupWooCommerceOrderStatus(integration, { orderReference, email });
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

  const providerMatch = normalized.match(/\b(shopify|prestashop|woocommerce|magento|bigcommerce|stripe)\b/i);

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

async function runProvisioningJob(params: { dbClient: any; jobId: string; baseUrl: string }) {
  const { dbClient, jobId, baseUrl } = params;

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

  let phoneSid = selectedNumber.twilio_phone_sid || null;
  let provisioningMode = "simulated";

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    if (!phoneSid && selectedNumber?.e164) {
      phoneSid = await findOwnedTwilioNumberSid(selectedNumber.e164);
    }

    if (!phoneSid) {
      const needsAt = nowIso();
      await dbClient.from("assistant_numbers").update({
        status: "needs_number_reselect",
        updated_at: needsAt,
      }).eq("id", selectedNumber.id);

      await dbClient.from("assistants").update({
        live_status: "needs_number_reselect",
        status: "needs_number_reselect",
        updated_at: needsAt,
      }).eq("id", assistant.id);

      await dbClient.from("provisioning_jobs").update({
        status: "needs_number_reselect",
        error_message: "Gekozen nummer is niet gevonden in Twilio account.",
        completed_at: needsAt,
        updated_at: needsAt,
      }).eq("id", jobId);

      return { status: "needs_number_reselect" };
    }

    await configureTwilioNumber(phoneSid, baseUrl);
    provisioningMode = "twilio_live";
  } else if (!ALLOW_SIMULATED_PROVISIONING) {
    const failedAt = nowIso();
    await dbClient.from("provisioning_jobs").update({
      status: "failed",
      error_message: "Twilio credentials ontbreken en simulatie staat uit.",
      completed_at: failedAt,
      updated_at: failedAt,
    }).eq("id", jobId);
    return { status: "failed", reason: "twilio_missing" };
  }

  const completedAt = nowIso();
  await dbClient.from("assistant_numbers").update({
    twilio_phone_sid: phoneSid,
    status: provisioningMode === "twilio_live" ? "live" : "simulated_live",
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
      mode: provisioningMode,
      number: selectedNumber?.e164 || null,
      phoneSid,
    },
  }).eq("id", jobId);

  await upsertUsage(dbClient, {
    assistant_id: assistant.id,
    user_id: assistant.user_id,
    usage_type: "provisioning",
    quantity: 1,
    unit: "job",
    amount_eur: 0,
    metadata: { mode: provisioningMode },
    occurred_at: completedAt,
  });

  return {
    status: "success",
    mode: provisioningMode,
    phoneSid,
    assistantId: assistant.id,
    number: selectedNumber?.e164 || null,
  };
}

function dbErrorToResponse(error: any) {
  if (isMissingTableError(error)) {
    return errorJson(migrationError(), 500);
  }
  return errorJson(error?.message || "Database fout.", 500);
}

function pickLatestBy<T extends Record<string, any>>(rows: T[], keyField: string, dateField = "updated_at") {
  const map = new Map<string, T>();

  for (const row of rows || []) {
    const key = safeText(row?.[keyField]);
    if (!key) continue;

    const previous = map.get(key);
    const rowDate = new Date(String(row?.[dateField] || row?.created_at || 0)).getTime();
    const previousDate = previous ? new Date(String(previous?.[dateField] || previous?.created_at || 0)).getTime() : 0;

    if (!previous || rowDate >= previousDate) {
      map.set(key, row);
    }
  }

  return map;
}

async function handleAdminOverview(req: Request) {
  const admin = await requireAdminAccess(req);
  if (admin.error) return admin.error;

  try {
    assertServiceRoleAvailable();
    const dbClient = getServiceDbClient();

    const { data: assistants, error: assistantsError } = await dbClient
      .from("assistants")
      .select("*")
      .order("updated_at", { ascending: false });
    if (assistantsError) throw assistantsError;

    const assistantRows = assistants || [];
    if (!assistantRows.length) {
      return json({
        success: true,
        summary: {
          totalAssistants: 0,
          liveAssistants: 0,
          awaitingPayment: 0,
          needsProvisioning: 0,
          connectedShops: 0,
          pendingShopRequests: 0,
          providerBreakdown: {},
        },
        assistants: [],
      });
    }

    const assistantIds = assistantRows.map((entry: Record<string, any>) => entry.id);
    const userIds = Array.from(new Set(assistantRows.map((entry: Record<string, any>) => entry.user_id).filter(Boolean)));

    const periodStart = new Date();
    periodStart.setUTCDate(1);
    periodStart.setUTCHours(0, 0, 0, 0);

    const [
      profilesResult,
      numbersResult,
      voicesResult,
      invoicesResult,
      provisioningResult,
      subscriptionsResult,
      integrationsResult,
      billingAccountsResult,
      usageResult,
    ] = await Promise.all([
      dbClient.from("assistant_profiles").select("*").in("assistant_id", assistantIds),
      dbClient.from("assistant_numbers").select("*").in("assistant_id", assistantIds).eq("selected", true),
      dbClient.from("assistant_voices").select("*").in("assistant_id", assistantIds).eq("selected", true),
      dbClient.from("invoices").select("*").in("assistant_id", assistantIds).order("created_at", { ascending: false }),
      dbClient.from("provisioning_jobs").select("*").in("assistant_id", assistantIds).order("created_at", { ascending: false }),
      dbClient.from("subscription_state").select("*").in("assistant_id", assistantIds),
      dbClient.from("commerce_integrations").select("*").in("assistant_id", assistantIds).order("updated_at", { ascending: false }),
      dbClient.from("billing_accounts").select("*").in("user_id", userIds),
      dbClient
        .from("usage_ledger")
        .select("assistant_id,usage_type,quantity,occurred_at")
        .in("assistant_id", assistantIds)
        .gte("occurred_at", periodStart.toISOString()),
    ]);

    const relationError = [
      profilesResult.error,
      numbersResult.error,
      voicesResult.error,
      invoicesResult.error,
      provisioningResult.error,
      subscriptionsResult.error,
      integrationsResult.error,
      billingAccountsResult.error,
      usageResult.error,
    ].find(Boolean);
    if (relationError) throw relationError;

    const profileMap = new Map(
      (profilesResult.data || []).map((entry: Record<string, any>) => [entry.assistant_id, entry]),
    );
    const selectedNumberMap = pickLatestBy(numbersResult.data || [], "assistant_id", "updated_at");
    const selectedVoiceMap = pickLatestBy(voicesResult.data || [], "assistant_id", "updated_at");
    const latestInvoiceMap = pickLatestBy(invoicesResult.data || [], "assistant_id", "created_at");
    const latestProvisioningMap = pickLatestBy(provisioningResult.data || [], "assistant_id", "created_at");
    const subscriptionMap = new Map(
      (subscriptionsResult.data || []).map((entry: Record<string, any>) => [entry.assistant_id, entry]),
    );
    const billingAccountMap = new Map(
      (billingAccountsResult.data || []).map((entry: Record<string, any>) => [entry.user_id, entry]),
    );

    const integrationsByAssistant = new Map<string, Record<string, any>[]>();
    for (const integration of integrationsResult.data || []) {
      const key = safeText(integration.assistant_id);
      if (!key) continue;
      if (!integrationsByAssistant.has(key)) integrationsByAssistant.set(key, []);
      integrationsByAssistant.get(key)!.push(integration);
    }

    const usageByAssistant = new Map<string, { minutesUsed: number; tasksUsed: number }>();
    for (const row of usageResult.data || []) {
      const key = safeText(row.assistant_id);
      if (!key) continue;
      const current = usageByAssistant.get(key) || { minutesUsed: 0, tasksUsed: 0 };
      const quantity = Number(row.quantity || 0);
      const usageType = safeText(row.usage_type);

      if (usageType === "call_minutes") current.minutesUsed += quantity;
      if (usageType === "web_test_task" || usageType === "call_task") current.tasksUsed += quantity;

      usageByAssistant.set(key, current);
    }

    const providerBreakdown: Record<string, number> = {};
    const items = assistantRows.map((assistant: Record<string, any>) => {
      const profile = profileMap.get(assistant.id) || null;
      const selectedNumber = selectedNumberMap.get(assistant.id) || null;
      const selectedVoice = selectedVoiceMap.get(assistant.id) || null;
      const latestInvoice = latestInvoiceMap.get(assistant.id) || null;
      const latestProvisioningJob = latestProvisioningMap.get(assistant.id) || null;
      const subscription = subscriptionMap.get(assistant.id) || null;
      const billingAccount = billingAccountMap.get(assistant.user_id) || null;
      const integrations = (integrationsByAssistant.get(assistant.id) || []).map((entry) => sanitizeIntegration(entry));
      const connectedProviders = integrations
        .filter((entry: Record<string, any>) => entry.status === "connected")
        .map((entry: Record<string, any>) => entry.provider);
      const usage = usageByAssistant.get(assistant.id) || { minutesUsed: 0, tasksUsed: 0 };

      for (const provider of connectedProviders) {
        providerBreakdown[provider] = (providerBreakdown[provider] || 0) + 1;
      }

      const plan = getPlanConfig(subscription?.plan_key || assistant.desired_plan);
      const invoiceStatus = latestInvoice?.status || assistant.billing_status || "none";
      const provisioningStatus = latestProvisioningJob?.status || null;
      const needsAction =
        invoiceStatus === "invoice_sent" ||
        ["queued", "failed", "needs_number_reselect"].includes(String(provisioningStatus || "")) ||
        assistant.billing_status === "paid_approved";

      return {
        assistantId: assistant.id,
        userId: assistant.user_id,
        companyName: profile?.company_name || assistant.display_name || "Onbekend bedrijf",
        businessType: profile?.business_type || null,
        contactEmail: billingAccount?.email || null,
        payerName: billingAccount?.payer_name || null,
        assistantStatus: assistant.status,
        liveStatus: assistant.live_status,
        billingStatus: assistant.billing_status,
        plan: {
          key: plan.key,
          name: plan.name,
          monthlyPriceEur: plan.monthlyPriceEur,
        },
        number: selectedNumber
          ? {
            e164: selectedNumber?.e164 || null,
            label: selectedNumber?.display_label || selectedNumber?.e164 || null,
            status: selectedNumber.status,
          }
          : null,
        voice: selectedVoice
          ? {
            key: selectedVoice.voice_key,
            displayName: selectedVoice.display_name,
          }
          : null,
        latestInvoice: latestInvoice
          ? {
            id: latestInvoice.id,
            invoiceNumber: latestInvoice.invoice_number,
            status: latestInvoice.status,
            amountEur: Number(latestInvoice.amount_eur || 0),
            planKey: latestInvoice.plan_key,
            dueAt: latestInvoice.due_at,
            paidAt: latestInvoice.paid_at,
            createdAt: latestInvoice.created_at,
          }
          : null,
        latestProvisioningJob: latestProvisioningJob
          ? {
            id: latestProvisioningJob.id,
            status: latestProvisioningJob.status,
            trigger: latestProvisioningJob.trigger,
            errorMessage: latestProvisioningJob.error_message || null,
            updatedAt: latestProvisioningJob.updated_at,
            completedAt: latestProvisioningJob.completed_at,
          }
          : null,
        connectedProviders,
        integrations,
        usage,
        updatedAt: assistant.updated_at,
        needsAction,
      };
    });

    const summary = {
      totalAssistants: items.length,
      liveAssistants: items.filter((entry) => entry.liveStatus === "live").length,
      awaitingPayment: items.filter((entry) => entry.latestInvoice?.status === "invoice_sent").length,
      needsProvisioning: items.filter((entry) =>
        entry.billingStatus === "paid_approved" ||
        ["queued", "failed", "needs_number_reselect"].includes(String(entry.latestProvisioningJob?.status || ""))
      ).length,
      connectedShops: items.filter((entry) => entry.connectedProviders.length > 0).length,
      pendingShopRequests: items.filter((entry) =>
        entry.integrations.some((integration: Record<string, any>) => integration.status === "pending_setup")
      ).length,
      providerBreakdown,
    };

    return json({
      success: true,
      admin: {
        userId: admin.user?.id || null,
        mode: admin.mode,
      },
      summary,
      assistants: items,
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleAdminProvisionRun(req: Request) {
  const admin = await requireAdminAccess(req);
  if (admin.error) return admin.error;

  try {
    assertServiceRoleAvailable();
    const dbClient = getServiceDbClient();
    const body = await parseBody(req) as Record<string, unknown>;
    const assistantId = safeText(body?.assistantId);
    const jobId = safeText(body?.jobId);

    if (!assistantId && !jobId) {
      return errorJson("assistantId of jobId is verplicht.", 400);
    }

    let targetJobId = jobId;

    if (!targetJobId && assistantId) {
      const { data: latestJob, error: latestJobError } = await dbClient
        .from("provisioning_jobs")
        .select("*")
        .eq("assistant_id", assistantId)
        .in("status", ["queued", "failed", "needs_number_reselect"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestJobError) throw latestJobError;

      if (latestJob?.id) {
        targetJobId = latestJob.id;
      } else {
        const { data: assistant, error: assistantError } = await dbClient
          .from("assistants")
          .select("*")
          .eq("id", assistantId)
          .maybeSingle();
        if (assistantError) throw assistantError;
        if (!assistant) return errorJson("Geen assistant gevonden.", 404);

        const createdAt = nowIso();
        const { data: createdJob, error: createJobError } = await dbClient
          .from("provisioning_jobs")
          .insert({
            assistant_id: assistant.id,
            user_id: assistant.user_id,
            status: "queued",
            trigger: "admin_manual_retry",
            attempt_count: 0,
            payload: { source: "admin_console" },
            created_at: createdAt,
            updated_at: createdAt,
          })
          .select("*")
          .single();
        if (createJobError) throw createJobError;
        targetJobId = createdJob.id;
      }
    }

    if (!targetJobId) return errorJson("Kon geen provisioning job bepalen.", 404);

    const result = await runProvisioningJob({ dbClient, jobId: targetJobId, baseUrl: getFunctionBaseUrl(req) });
    return json({
      success: true,
      jobId: targetJobId,
      result,
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function composeAssistantState(dbClient: any, userId: string) {
  const assistant = await ensureAssistant(dbClient, userId);
  const profile = await fetchProfile(dbClient, assistant.id);
  const voice = await fetchSelectedVoice(dbClient, assistant.id);
  const number = await fetchSelectedNumber(dbClient, assistant.id);
  const faqItems = await fetchFaqEntries(dbClient, assistant.id);
  const channelSettings = await fetchChannelSettings(dbClient, assistant.id);
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
  const wizard = buildWizardChecklist({
    assistant,
    profile,
    voice,
    faqs: faqItems,
    channelSettings,
  });
  const avatar = getAvatarOption(assistant?.avatar_key);
  const isAdmin = await hasAdminAccess(userId);

  return {
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
    identity: {
      name: assistant?.display_name || profile?.company_name || "Mijn assistent",
      avatarKey: assistant?.avatar_key || avatar.key,
      avatar,
    },
    channels: {
      callEnabled: channelSettings?.call_enabled ?? true,
      smsEnabled: channelSettings?.sms_enabled ?? false,
      whatsappEnabled: channelSettings?.whatsapp_enabled ?? false,
      smsTemplates: channelSettings?.sms_templates || [],
      whatsappTemplates: channelSettings?.whatsapp_templates || [],
      availabilityMode: channelSettings?.availability_mode || "always",
      availabilitySchedule: channelSettings?.availability_schedule || {},
    },
    viewer: {
      userId,
      isAdmin,
    },
    faqItems,
    wizard,
  };
}

async function handleOnboardingSave(
  req: Request,
  user: any,
  accessToken: string,
  overridePayload: Record<string, unknown> | null = null,
  mode: "full" | "partial" = "full",
) {
  try {
    const dbClient = getUserDbClient(accessToken);
    const assistant = await ensureAssistant(dbClient, user.id);
    const body = await parseBody(req) as Record<string, unknown>;
    const rawPayload = (overridePayload || body || {}) as Record<string, unknown>;
    const payload = onboardingFromPayload(rawPayload, { partial: mode === "partial" });

    const existingProfile = await fetchProfile(dbClient, assistant.id);
    const existingVoice = await fetchSelectedVoice(dbClient, assistant.id);
    const existingNumber = await fetchSelectedNumber(dbClient, assistant.id);
    const existingChannelSettings = await fetchChannelSettings(dbClient, assistant.id);

    const companyName = payload.companyName !== undefined
      ? payload.companyName
      : safeText(existingProfile?.company_name || assistant.display_name, "Mijn Bedrijf");
    const assistantName = payload.assistantName !== undefined
      ? payload.assistantName
      : safeText(assistant.display_name, companyName);
    const avatar = getAvatarOption(payload.avatarKey || assistant.avatar_key || "avatar_01");

    const profilePayload = {
      assistant_id: assistant.id,
      user_id: user.id,
      company_name: companyName,
      business_type: payload.businessType !== undefined ? payload.businessType : (existingProfile?.business_type || null),
      services: payload.services !== undefined ? payload.services : (existingProfile?.services || []),
      pricing: payload.pricing !== undefined ? payload.pricing : (existingProfile?.pricing || null),
      opening_hours: payload.openingHours !== undefined ? payload.openingHours : (existingProfile?.opening_hours || null),
      tone_of_voice: payload.toneOfVoice !== undefined
        ? payload.toneOfVoice
        : (existingProfile?.tone_of_voice || "professioneel en vriendelijk"),
      goals: payload.goals !== undefined
        ? payload.goals
        : (payload.primaryGoal !== undefined ? payload.primaryGoal : (existingProfile?.goals || null)),
      greeting: payload.greeting !== undefined ? payload.greeting : (existingProfile?.greeting || null),
      knowledge: payload.knowledge !== undefined ? payload.knowledge : (existingProfile?.knowledge || null),
      website_url: payload.websiteUrl !== undefined ? payload.websiteUrl : (existingProfile?.website_url || null),
      secondary_language: payload.secondaryLanguage !== undefined
        ? payload.secondaryLanguage
        : (existingProfile?.secondary_language || null),
      role_description: payload.roleDescription !== undefined
        ? payload.roleDescription
        : (existingProfile?.role_description || null),
      handoff_rules: payload.handoffRules !== undefined
        ? payload.handoffRules
        : (existingProfile?.handoff_rules || null),
      updated_at: nowIso(),
    };

    const { error: profileError } = await dbClient
      .from("assistant_profiles")
      .upsert(profilePayload, { onConflict: "assistant_id" });
    if (profileError) throw profileError;

    const resolvedVoiceKey = payload.voiceKey || existingVoice?.voice_key || VOICE_OPTIONS[0].key;
    if (resolvedVoiceKey) {
      const selectedVoiceOption = getVoiceOption(resolvedVoiceKey);
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
    }

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
          status: existingNumber?.status === "live" ? "live" : "reserved",
          source: "wizard",
          updated_at: nowIso(),
        },
        { onConflict: "assistant_id,e164" },
      );
      if (numberError) throw numberError;
    }

    const channelPayload = {
      assistant_id: assistant.id,
      user_id: user.id,
      call_enabled: payload.callEnabled !== undefined ? payload.callEnabled : (existingChannelSettings?.call_enabled ?? true),
      sms_enabled: payload.smsEnabled !== undefined ? payload.smsEnabled : (existingChannelSettings?.sms_enabled ?? false),
      whatsapp_enabled: payload.whatsappEnabled !== undefined
        ? payload.whatsappEnabled
        : (existingChannelSettings?.whatsapp_enabled ?? false),
      sms_templates: hasKey(rawPayload, "smsTemplates")
        ? payload.smsTemplates || []
        : (existingChannelSettings?.sms_templates || []),
      whatsapp_templates: hasKey(rawPayload, "whatsappTemplates")
        ? payload.whatsappTemplates || []
        : (existingChannelSettings?.whatsapp_templates || []),
      availability_mode: payload.availabilityMode !== undefined
        ? payload.availabilityMode
        : (existingChannelSettings?.availability_mode || "always"),
      availability_schedule: payload.availabilitySchedule !== undefined
        ? payload.availabilitySchedule
        : (existingChannelSettings?.availability_schedule || {}),
      updated_at: nowIso(),
    };

    const { error: channelError } = await dbClient
      .from("assistant_channel_settings")
      .upsert(channelPayload, { onConflict: "assistant_id" });
    if (channelError) throw channelError;

    if (hasKey(rawPayload, "faqItems")) {
      const faqItems = payload.faqItems || [];
      const { error: deleteFaqError } = await dbClient
        .from("assistant_faq_entries")
        .delete()
        .eq("assistant_id", assistant.id);
      if (deleteFaqError) throw deleteFaqError;

      if (faqItems.length > 0) {
        const rows = faqItems.map((entry: any, index: number) => ({
          assistant_id: assistant.id,
          user_id: user.id,
          question: safeText(entry.question),
          answer: safeText(entry.answer),
          position: Number(entry.position || index + 1),
          is_active: normalizeBoolean(entry.isActive, true),
          updated_at: nowIso(),
        }));
        const { error: faqInsertError } = await dbClient.from("assistant_faq_entries").insert(rows);
        if (faqInsertError) throw faqInsertError;
      }
    }

    let profile = await fetchProfile(dbClient, assistant.id);
    const selectedVoice = await fetchSelectedVoice(dbClient, assistant.id);
    const selectedNumber = await fetchSelectedNumber(dbClient, assistant.id);
    const channelSettings = await fetchChannelSettings(dbClient, assistant.id);
    const faqItems = await fetchFaqEntries(dbClient, assistant.id);
    const planKey = payload.planKey || assistant.desired_plan || DEFAULT_PLAN.key;
    const setupStep = payload.setupStep !== undefined ? payload.setupStep : normalizeStep(assistant.setup_step, 1);
    let setupCompleted = payload.setupCompleted !== undefined
      ? payload.setupCompleted
      : Boolean(assistant.setup_completed);

    const shouldRefreshWebsiteKnowledge = Boolean(
      safeText(profile?.website_url) &&
      payload.knowledge === undefined &&
      (payload.websiteUrl !== undefined || !safeText(profile?.knowledge)),
    );

    if (shouldRefreshWebsiteKnowledge) {
      const websiteSnapshot = await fetchWebsiteSnapshot(profile?.website_url);
      if (websiteSnapshot?.knowledgeSummary && websiteSnapshot.knowledgeSummary !== safeText(profile?.knowledge)) {
        const { error: knowledgeError } = await dbClient
          .from("assistant_profiles")
          .update({
            knowledge: websiteSnapshot.knowledgeSummary,
            updated_at: nowIso(),
          })
          .eq("assistant_id", assistant.id);
        if (knowledgeError) throw knowledgeError;
        profile = await fetchProfile(dbClient, assistant.id);
      }
    }

    const assistantDraft = {
      ...assistant,
      display_name: assistantName || companyName,
      avatar_key: avatar.key,
      desired_plan: planKey,
      setup_step: setupStep,
      setup_completed: setupCompleted,
    };
    const wizardSnapshot = buildWizardChecklist({
      assistant: assistantDraft,
      profile,
      voice: selectedVoice,
      faqs: faqItems,
      channelSettings,
    });
    const resolvedSetupStep = wizardSnapshot.step;
    setupCompleted = wizardSnapshot.completed;

    const prompt = buildAssistantPrompt({
      profile,
      assistant: assistantDraft,
      voice: selectedVoice,
      number: selectedNumber,
      channelSettings,
      faqs: faqItems,
    });

    const { data: updatedAssistant, error: assistantUpdateError } = await dbClient.from("assistants").update({
      display_name: assistantName || companyName,
      avatar_key: avatar.key,
      desired_plan: planKey,
      prompt,
      status: "configured",
      setup_step: resolvedSetupStep,
      setup_completed: setupCompleted,
      updated_at: nowIso(),
    }).eq("id", assistant.id).select("*").single();
    if (assistantUpdateError) throw assistantUpdateError;

    await upsertUsage(dbClient, {
      assistant_id: assistant.id,
      user_id: user.id,
      usage_type: mode === "partial" ? "onboarding_step_save" : "onboarding_save",
      quantity: 1,
      unit: "event",
      amount_eur: 0,
      metadata: { setupStep: resolvedSetupStep },
      occurred_at: nowIso(),
    });

    const state = await composeAssistantState(dbClient, user.id);
    return json({
      success: true,
      mode,
      prompt,
      ...state,
      assistant: updatedAssistant,
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleOnboardingStepSave(req: Request, user: any, accessToken: string) {
  return handleOnboardingSave(req, user, accessToken, null, "partial");
}

async function handleOnboardingProgress(user: any, accessToken: string) {
  try {
    const dbClient = getUserDbClient(accessToken);
    const state = await composeAssistantState(dbClient, user.id);
    return json({
      success: true,
      wizard: state.wizard,
      identity: state.identity,
      channels: state.channels,
      faqItems: state.faqItems,
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleOnboardingAiSuggest(req: Request, user: any, accessToken: string) {
  try {
    const dbClient = getUserDbClient(accessToken);
    const assistant = await ensureAssistant(dbClient, user.id);
    const body = await parseBody(req) as Record<string, unknown>;
    const step = safeText(body.step, "identiteit").toLowerCase();
    const profile = await fetchProfile(dbClient, assistant.id);

    const companyName = safeText(body.companyName || profile?.company_name || assistant.display_name, "Mijn Bedrijf");
    const assistantName = safeText(body.assistantName || assistant.display_name, companyName);
    const businessType = safeText(body.businessType || profile?.business_type, "dienstverlener");
    const primaryGoal = safeText(body.primaryGoal || profile?.goals, "vragen beantwoorden en terugbelverzoeken noteren");
    const websiteUrl = normalizeWebsiteUrl(body.websiteUrl || profile?.website_url);
    const websiteSnapshot = websiteUrl ? await fetchWebsiteSnapshot(websiteUrl) : null;
    const websiteSummary = safeText(profile?.knowledge || websiteSnapshot?.knowledgeSummary);

    const fallbackSuggestions: Record<string, unknown> = {
      assistantNameSuggestions: [
        `${companyName} Assistent`,
        `${assistantName || companyName} Support`,
        `${companyName} Telefoniste`,
      ],
      roleDescription: `Je bent de vriendelijke telefonische assistent van ${companyName}. Je helpt bellers snel, duidelijk en rustig${websiteSnapshot?.description ? `, met kennis van de website-inhoud: ${websiteSnapshot.description}` : "."}`,
      handoffRules:
        "Bij spoed, klachten of onduidelijkheid verbind je direct door of noteer je een terugbelverzoek met naam en telefoonnummer.",
      primaryGoal,
      faqItems: websiteSnapshot?.faqHints?.length
        ? websiteSnapshot.faqHints
        : [
          {
            question: `Wat doet ${companyName}?`,
            answer: `${companyName} is actief als ${businessType}. We helpen klanten met duidelijke informatie en snelle opvolging.`,
          },
          {
            question: "Hoe snel krijg ik reactie?",
            answer: "Je krijgt zo snel mogelijk reactie van het team, meestal binnen één werkdag.",
          },
        ],
      smsTemplates: [
        {
          title: "Bevestiging",
          trigger: "Na telefoongesprek",
          text: `Bedankt voor je gesprek met ${companyName}. We komen zo snel mogelijk bij je terug.`,
        },
      ],
      knowledge: websiteSummary,
      websiteSummary,
    };

    let suggestions = fallbackSuggestions;

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          temperature: 0.35,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: [
                "Geef alleen geldig JSON terug zonder markdown.",
                "Je maakt onboarding suggesties in het Nederlands voor een AI telefoonassistent.",
                "Baseer je antwoorden alleen op de aangeleverde context en website-samenvatting.",
                "Verzin geen prijzen, openingstijden of beleid dat niet expliciet uit de context volgt.",
                "Verwachte JSON keys: assistantNameSuggestions (array), roleDescription (string), handoffRules (string), primaryGoal (string), faqItems (array), smsTemplates (array), knowledge (string).",
              ].join(" "),
            },
            {
              role: "user",
              content: JSON.stringify({
                step,
                companyName,
                assistantName,
                businessType,
                primaryGoal,
                websiteUrl,
                websiteSummary,
                websiteTitle: websiteSnapshot?.title || "",
                websiteDescription: websiteSnapshot?.description || "",
                websiteHeadings: websiteSnapshot?.headings || [],
                websiteSnippet: websiteSnapshot?.textSnippet || "",
              }),
            },
          ],
        });
        const raw = completion.choices?.[0]?.message?.content || "";
        const parsed = tryParseJsonObject(raw);
        if (parsed && typeof parsed === "object") {
          suggestions = {
            ...fallbackSuggestions,
            ...parsed,
          };
        }
      } catch {
        suggestions = fallbackSuggestions;
      }
    }

    return json({
      success: true,
      step,
      suggestions,
      websiteInsights: websiteSnapshot
        ? {
          requestedUrl: websiteSnapshot.requestedUrl,
          finalUrl: websiteSnapshot.finalUrl,
          title: websiteSnapshot.title,
          description: websiteSnapshot.description,
          headings: websiteSnapshot.headings,
        }
        : null,
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleAssistantState(user: any, accessToken: string) {
  try {
    const dbClient = getUserDbClient(accessToken);
    const state = await composeAssistantState(dbClient, user.id);
    return json(state);
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleActivationStartTrial(req: Request, user: any, accessToken: string) {
  try {
    const dbClient = getUserDbClient(accessToken);
    const assistant = await ensureAssistant(dbClient, user.id);
    const body = await parseBody(req) as Record<string, unknown>;
    const plan = getPlanConfig(body?.planKey || assistant.desired_plan);
    const startedAt = nowIso();
    const invoiceNumber =
      `TRIAL-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 100000)}`;

    const { data: billingAccount, error: billingError } = await dbClient.from("billing_accounts").upsert(
      {
        user_id: user.id,
        email: user.email || null,
        payer_name: safeText(body?.payerName || user.user_metadata?.full_name || ""),
        status: "active",
        updated_at: startedAt,
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
      amount_eur: 0,
      currency: "EUR",
      due_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      notes: "trial_fallback_pending_manual_approval",
      updated_at: startedAt,
    }).select("*").single();
    if (invoiceError) throw invoiceError;

    const { error: assistantError } = await dbClient.from("assistants").update({
      billing_status: "invoice_sent",
      desired_plan: plan.key,
      status: "awaiting_payment",
      live_status: "not_live",
      updated_at: startedAt,
    }).eq("id", assistant.id);
    if (assistantError) throw assistantError;

    const { error: subscriptionError } = await dbClient.from("subscription_state").upsert(
      {
        assistant_id: assistant.id,
        user_id: user.id,
        plan_key: plan.key,
        status: "pending_payment",
        included_minutes: plan.includedMinutes,
        included_tasks: plan.includedTasks,
        updated_at: startedAt,
      },
      { onConflict: "assistant_id" },
    );
    if (subscriptionError) throw subscriptionError;

    await upsertUsage(dbClient, {
      assistant_id: assistant.id,
      user_id: user.id,
      usage_type: "trial_start",
      quantity: 1,
      unit: "event",
      amount_eur: 0,
      metadata: { planKey: plan.key, mode: "fallback" },
      occurred_at: startedAt,
    });

    const state = await composeAssistantState(dbClient, user.id);
    return json({
      success: true,
      mode: "trial_fallback",
      invoice,
      message: "Proefperiode intent is opgeslagen. Je assistent blijft not_live tot betaalgoedkeuring.",
      ...state,
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleWebCallTurn(req: Request, user: any, accessToken: string) {
  try {
    const dbClient = getUserDbClient(accessToken);
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
    const assistantText = await generateReply({
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
        audio_data_url: null,
        debug_steps: {
          phases: ["listening", "thinking", "speaking"],
          model: openai ? OPENAI_MODEL : "fallback",
          commerceLookup: COMMERCE_LOOKUP_ENABLED ? { attempted: true } : null,
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
      commerceLookup: COMMERCE_LOOKUP_ENABLED
        ? { enabled: true }
        : {
          enabled: false,
          message: "Secure commerce lookup is tijdelijk uitgeschakeld in productie.",
        },
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleInvoiceRequest(req: Request, user: any, accessToken: string) {
  try {
    const dbClient = getUserDbClient(accessToken);
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
  const admin = await requireAdminAccess(req);
  if (admin.error) return admin.error;

  try {
    assertServiceRoleAvailable();
    const dbClient = getServiceDbClient();
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
      provisioningResult = await runProvisioningJob({
        dbClient,
        jobId: provisioningJob.id,
        baseUrl: getFunctionBaseUrl(req),
      });
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

async function handleProvisionRun(req: Request, user: any, accessToken: string) {
  try {
    const userDbClient = getUserDbClient(accessToken);
    const serviceDbClient = getServiceDbClient();
    const assistant = await ensureAssistant(userDbClient, user.id);

    const { data: job, error: jobError } = await userDbClient.from("provisioning_jobs").select("*").eq("assistant_id", assistant.id).in(
      "status",
      ["queued", "failed", "needs_number_reselect"],
    ).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (jobError) throw jobError;
    if (!job) return errorJson("Geen provisioning job gevonden voor deze gebruiker.", 404);

    const result = await runProvisioningJob({
      dbClient: serviceDbClient,
      jobId: job.id,
      baseUrl: getFunctionBaseUrl(req),
    });
    return json({ success: true, jobId: job.id, result });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleUsageSummary(user: any, accessToken: string) {
  try {
    const dbClient = getUserDbClient(accessToken);
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
    const dbClient = getUserDbClient(accessToken);
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
    const dbClient = getUserDbClient(accessToken);
    const assistant = await ensureAssistant(dbClient, user.id);
    const body = await parseBody(req) as Record<string, unknown>;

    const provider = normalizeProvider(body.provider);
    const storeUrl = normalizeStoreUrl(body.storeUrl || body.store_url);
    const containsCredentials = [
      "accessToken",
      "access_token",
      "apiKey",
      "api_key",
      "apiSecret",
      "api_secret",
      "webhookSecret",
      "webhook_secret",
    ].some((field) => hasKey(body, field));
    const contactEmail = safeText(body.contactEmail || body.contact_email || user?.email);
    const setupNotes = safeText(body.setupNotes || body.notes || body.note);

    if (!provider) {
      return errorJson("provider is verplicht (shopify, prestashop, woocommerce, magento, bigcommerce, stripe).", 400);
    }
    if (!storeUrl) {
      return errorJson("storeUrl is verplicht en moet een publieke https-URL zijn.", 400);
    }
    if (containsCredentials) {
      return errorJson(
        "Credentials mogen niet meer via /integrations/connect worden ingestuurd. Gebruik alleen provider, storeUrl, contactEmail en setupNotes.",
        400,
      );
    }

    const metadata = {
      setupMode: "concierge",
      contactEmail,
      setupNotes,
      requestedAt: nowIso(),
      managedBy: "admin_after_request",
    };

    const { data: saved, error } = await dbClient
      .from("commerce_integrations")
      .upsert(
        {
          assistant_id: assistant.id,
          user_id: user.id,
          provider,
          status: "pending_setup",
          store_url: storeUrl,
          access_token: null,
          api_key: null,
          api_secret: null,
          webhook_secret: null,
          metadata,
          last_sync_at: null,
          updated_at: nowIso(),
        },
        { onConflict: "assistant_id,provider" },
      )
      .select("*")
      .single();

    if (error) throw error;

    return json({
      success: true,
      mode: "concierge",
      integration: sanitizeIntegration(saved),
    });
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function handleIntegrationDisconnect(req: Request, user: any, accessToken: string) {
  try {
    const dbClient = getUserDbClient(accessToken);
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
        access_token: null,
        api_key: null,
        api_secret: null,
        webhook_secret: null,
        last_sync_at: null,
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

async function handleAdminIntegrationComplete(req: Request) {
  const admin = await requireAdminAccess(req);
  if (admin.error) return admin.error;

  try {
    assertServiceRoleAvailable();
    const dbClient = getServiceDbClient();
    const body = await parseBody(req) as Record<string, unknown>;

    const integrationId = safeText(body.integrationId);
    const assistantId = safeText(body.assistantId);
    const provider = normalizeProvider(body.provider);
    const storeUrl = normalizeStoreUrl(body.storeUrl || body.store_url);
    const contactEmail = safeText(body.contactEmail || body.contact_email);
    const setupNotes = safeText(body.setupNotes || body.notes);
    const adminNotes = safeText(body.adminNotes || body.admin_notes);
    const containsCredentials = [
      "accessToken",
      "access_token",
      "apiKey",
      "api_key",
      "apiSecret",
      "api_secret",
      "webhookSecret",
      "webhook_secret",
    ].some((field) => hasKey(body, field));

    let existingIntegration: Record<string, any> | null = null;

    if (integrationId) {
      const { data, error } = await dbClient.from("commerce_integrations").select("*").eq("id", integrationId).maybeSingle();
      if (error) throw error;
      existingIntegration = data || null;
    } else if (assistantId && provider) {
      const { data, error } = await dbClient
        .from("commerce_integrations")
        .select("*")
        .eq("assistant_id", assistantId)
        .eq("provider", provider)
        .maybeSingle();
      if (error) throw error;
      existingIntegration = data || null;
    }

    const resolvedAssistantId = safeText(existingIntegration?.assistant_id || assistantId);
    const resolvedProvider = normalizeProvider(existingIntegration?.provider || provider);
    const resolvedStoreUrl = normalizeStoreUrl(existingIntegration?.store_url || storeUrl);

    if (!resolvedAssistantId || !resolvedProvider || !resolvedStoreUrl) {
      return errorJson("assistantId, provider en storeUrl zijn verplicht voor admin shop setup.", 400);
    }
    if (containsCredentials) {
      return errorJson(
        "Admin shop setup bewaart geen plaintext credentials meer. Rond de setup metadata-only af en beheer secrets buiten de app-database.",
        400,
      );
    }

    const { data: assistant, error: assistantError } = await dbClient
      .from("assistants")
      .select("*")
      .eq("id", resolvedAssistantId)
      .maybeSingle();
    if (assistantError) throw assistantError;
    if (!assistant) return errorJson("Geen assistant gevonden voor deze koppeling.", 404);

    const previousMetadata =
      existingIntegration?.metadata &&
      typeof existingIntegration.metadata === "object" &&
      !Array.isArray(existingIntegration.metadata)
        ? existingIntegration.metadata
        : {};

    const metadata = {
      ...previousMetadata,
      setupMode: "concierge",
      contactEmail: contactEmail || previousMetadata.contactEmail || null,
      setupNotes: setupNotes || previousMetadata.setupNotes || null,
      adminNotes: adminNotes || previousMetadata.adminNotes || null,
      requestedAt: previousMetadata.requestedAt || existingIntegration?.created_at || nowIso(),
      completedAt: nowIso(),
      managedBy: "admin",
    };

    const { data: saved, error } = await dbClient
      .from("commerce_integrations")
      .upsert(
        {
          id: existingIntegration?.id || undefined,
          assistant_id: assistant.id,
          user_id: assistant.user_id,
          provider: resolvedProvider,
          status: "connected",
          store_url: resolvedStoreUrl,
          access_token: null,
          api_key: null,
          api_secret: null,
          webhook_secret: null,
          metadata,
          last_sync_at: null,
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

async function handleIntegrationOrderStatus(req: Request, user: any, accessToken: string) {
  try {
    void req;
    void user;
    void accessToken;
    return json({
      success: false,
      code: "feature_unavailable",
      message:
        "Secure commerce lookup is tijdelijk uitgeschakeld. Dien alleen een koppelaanvraag in; live orderstatus lookup volgt in fase 2 met encrypted secret management.",
    }, 503);
  } catch (error) {
    return dbErrorToResponse(error);
  }
}

async function authenticateTwilioWebhook(req: Request) {
  if (!TWILIO_AUTH_TOKEN) {
    return {
      error: new Response("Twilio auth token ontbreekt.", { status: 503 }),
      body: null,
    };
  }

  const parsed = await parseTwilioFormRequest(req);
  const valid = await isValidTwilioSignature(req, parsed.params);
  if (!valid) {
    return {
      error: new Response("Forbidden", { status: 403 }),
      body: null,
    };
  }

  return {
    error: null,
    body: parsed.body,
  };
}

async function handleTwilioVoice(req: Request) {
  const auth = await authenticateTwilioWebhook(req);
  if (auth.error) return auth.error;

  try {
    const dbClient = getServiceDbClient();
    const body = auth.body || {};
    const to = normalizePhoneNumber(body.To);
    const from = normalizePhoneNumber(body.From);
    const callSid = safeText(body.CallSid);

    if (!callSid || !to) {
      return buildTwimlResponse([
        twimlSay("Ongeldige call gegevens ontvangen."),
        twimlHangup(),
      ]);
    }

    const { data: numberRow, error: numberError } = await dbClient
      .from("assistant_numbers")
      .select("*")
      .eq("e164", to)
      .eq("selected", true)
      .maybeSingle();
    if (numberError) throw numberError;

    if (!numberRow) {
      return buildTwimlResponse([
        twimlSay("Dit nummer is nog niet actief."),
        twimlHangup(),
      ]);
    }

    const { data: assistant, error: assistantError } = await dbClient
      .from("assistants")
      .select("*")
      .eq("id", numberRow.assistant_id)
      .single();
    if (assistantError) throw assistantError;

    const profile = await fetchProfile(dbClient, assistant.id);
    const greeting =
      profile?.greeting ||
      `Goedemiddag, je spreekt met de AI assistent van ${profile?.company_name || assistant.display_name || "ons bedrijf"}. Waarmee kan ik helpen?`;

    await dbClient.from("call_sessions").upsert(
      {
        assistant_id: assistant.id,
        user_id: assistant.user_id,
        call_sid: callSid,
        from_number: from,
        to_number: to,
        status: "in_progress",
        started_at: nowIso(),
        updated_at: nowIso(),
      },
      { onConflict: "call_sid" },
    );

    const turnUrl = `${getFunctionBaseUrl(req)}/twilio/turn?callSid=${encodeURIComponent(callSid)}`;
    return buildTwimlResponse([
      twimlSay(greeting),
      twimlGather(turnUrl, twimlSay("Ik luister.")),
      twimlRedirect(turnUrl),
    ]);
  } catch (error) {
    console.error("Twilio /voice fout:", error);
    return buildTwimlResponse([
      twimlSay("Er is een fout opgetreden. Probeer later opnieuw."),
      twimlHangup(),
    ]);
  }
}

async function handleTwilioTurn(req: Request) {
  const auth = await authenticateTwilioWebhook(req);
  if (auth.error) return auth.error;

  try {
    const dbClient = getServiceDbClient();
    const body = auth.body || {};
    const url = new URL(req.url);
    const callSid = safeText(url.searchParams.get("callSid") || body.CallSid);
    const speech = safeText(body.SpeechResult);

    const { data: callSession, error: sessionError } = await dbClient
      .from("call_sessions")
      .select("*")
      .eq("call_sid", callSid)
      .maybeSingle();
    if (sessionError) throw sessionError;

    if (!callSession) {
      return buildTwimlResponse([
        twimlSay("Sessie niet gevonden."),
        twimlHangup(),
      ]);
    }

    const { data: assistant, error: assistantError } = await dbClient
      .from("assistants")
      .select("*")
      .eq("id", callSession.assistant_id)
      .single();
    if (assistantError) throw assistantError;

    const profile = await fetchProfile(dbClient, assistant.id);
    const selectedVoice = await fetchSelectedVoice(dbClient, assistant.id);
    const selectedNumber = await fetchSelectedNumber(dbClient, assistant.id);

    const { data: turns, error: turnsError } = await dbClient
      .from("call_turns")
      .select("*")
      .eq("call_session_id", callSession.id)
      .order("turn_index", { ascending: true });
    if (turnsError) throw turnsError;

    const turnHistory = (turns || []).map((turn: Record<string, any>) => ({
      role: turn.role,
      content: turn.response_text || turn.transcript || "",
    }));

    const userText = speech || "Stilte";
    const systemPrompt =
      assistant.prompt || buildAssistantPrompt({ profile, assistant, voice: selectedVoice, number: selectedNumber });
    const answer = speech
      ? await generateReply({
        systemPrompt,
        history: turnHistory,
        userText,
        fallbackCompanyName: profile?.company_name || assistant.display_name || "ons bedrijf",
      })
      : "Ik heb je niet goed verstaan. Kun je je vraag herhalen?";

    const turnBaseIndex = (turns || []).length;
    await dbClient.from("call_turns").insert([
      {
        call_session_id: callSession.id,
        assistant_id: assistant.id,
        user_id: assistant.user_id,
        turn_index: turnBaseIndex + 1,
        role: "user",
        transcript: userText,
        response_text: null,
        created_at: nowIso(),
      },
      {
        call_session_id: callSession.id,
        assistant_id: assistant.id,
        user_id: assistant.user_id,
        turn_index: turnBaseIndex + 2,
        role: "assistant",
        transcript: null,
        response_text: answer,
        created_at: nowIso(),
      },
    ]);

    await dbClient.from("call_sessions").update({ updated_at: nowIso() }).eq("id", callSession.id);

    await upsertUsage(dbClient, {
      assistant_id: assistant.id,
      user_id: assistant.user_id,
      usage_type: "call_task",
      quantity: 1,
      unit: "task",
      amount_eur: 0,
      metadata: { callSid },
      occurred_at: nowIso(),
    });

    const shouldEnd = /\b(doei|tot ziens|hang op|bedankt dat was alles)\b/i.test(userText);
    const voiceName = selectedVoice?.twilio_voice || "alice";
    const turnUrl = `${getFunctionBaseUrl(req)}/twilio/turn?callSid=${encodeURIComponent(callSid)}`;

    if (shouldEnd) {
      await dbClient
        .from("call_sessions")
        .update({ status: "completed", ended_at: nowIso(), updated_at: nowIso() })
        .eq("id", callSession.id);

      return buildTwimlResponse([
        twimlSay(answer, voiceName),
        twimlSay("Fijn gesprek. Tot ziens.", voiceName),
        twimlHangup(),
      ]);
    }

    return buildTwimlResponse([
      twimlSay(answer, voiceName),
      twimlGather(turnUrl, twimlSay("Waarmee kan ik nog meer helpen?", voiceName), voiceName),
      twimlRedirect(turnUrl),
    ]);
  } catch (error) {
    console.error("Twilio /turn fout:", error);
    return buildTwimlResponse([
      twimlSay("Er ging iets mis tijdens het gesprek."),
      twimlHangup(),
    ]);
  }
}

async function handleTwilioStatus(req: Request) {
  const auth = await authenticateTwilioWebhook(req);
  if (auth.error) return auth.error;

  try {
    const dbClient = getServiceDbClient();
    const body = auth.body || {};
    const callSid = safeText(body.CallSid);
    const callStatus = safeText(body.CallStatus, "unknown");
    const duration = Number.parseInt(String(body.CallDuration || "0"), 10) || 0;

    if (!callSid) {
      return json({ ok: true, ignored: true });
    }

    const endedAt = nowIso();
    const terminalStatuses = ["completed", "canceled", "failed", "busy", "no-answer"];

    const { data: callSession, error: sessionError } = await dbClient
      .from("call_sessions")
      .select("*")
      .eq("call_sid", callSid)
      .maybeSingle();
    if (sessionError) throw sessionError;

    if (callSession) {
      await dbClient
        .from("call_sessions")
        .update({
          status: callStatus,
          duration_seconds: duration,
          ended_at: terminalStatuses.includes(callStatus) ? endedAt : null,
          updated_at: endedAt,
        })
        .eq("id", callSession.id);

      if (duration > 0 && terminalStatuses.includes(callStatus) && Number(callSession.duration_seconds || 0) !== duration) {
        const billedMinutes = Math.ceil(duration / 60);
        await upsertUsage(dbClient, {
          assistant_id: callSession.assistant_id,
          user_id: callSession.user_id,
          usage_type: "call_minutes",
          quantity: billedMinutes,
          unit: "minute",
          amount_eur: billedMinutes * 0.2,
          metadata: {
            callSid,
            durationSeconds: duration,
          },
          occurred_at: endedAt,
        });
      }
    }

    return json({ ok: true });
  } catch (error) {
    console.error("Twilio /status fout:", error);
    return errorJson((error as any)?.message || "Status update mislukt.", 500);
  }
}

Deno.serve(async (req) => {
  try {
    const response = await (async () => {
      if (req.method === "OPTIONS") {
        return new Response("ok", { status: 204 });
      }

      const method = req.method.toUpperCase();
      const path = getRoutePath(req);

      if (method === "GET" && path === "/health") {
        return json({
          ok: true,
          now: nowIso(),
        });
      }

      if (method === "GET" && path === "/voices/options") {
        return json(VOICE_OPTIONS);
      }

      if (method === "GET" && path === "/avatars/options") {
        return json(AVATAR_OPTIONS);
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

      if (method === "POST" && path === "/onboarding/step-save") {
        const auth = await requireUser(req);
        if (auth.error) return auth.error;
        return await handleOnboardingStepSave(req, auth.user, auth.token);
      }

      if (method === "GET" && path === "/onboarding/progress") {
        const auth = await requireUser(req);
        if (auth.error) return auth.error;
        return await handleOnboardingProgress(auth.user, auth.token);
      }

      if (method === "POST" && path === "/onboarding/ai-suggest") {
        const auth = await requireUser(req);
        if (auth.error) return auth.error;
        return await handleOnboardingAiSuggest(req, auth.user, auth.token);
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

      if (method === "POST" && path === "/activation/start-trial") {
        const auth = await requireUser(req);
        if (auth.error) return auth.error;
        return await handleActivationStartTrial(req, auth.user, auth.token);
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

      if (method === "POST" && path === "/twilio/voice") {
        return await handleTwilioVoice(req);
      }

      if (method === "POST" && path === "/twilio/turn") {
        return await handleTwilioTurn(req);
      }

      if (method === "POST" && path === "/twilio/status") {
        return await handleTwilioStatus(req);
      }

      if (method === "GET" && path === "/admin/overview") {
        return await handleAdminOverview(req);
      }

      if (method === "POST" && path === "/admin/approve-payment") {
        return await handleAdminApprove(req);
      }

      if (method === "POST" && path === "/admin/integrations/complete") {
        return await handleAdminIntegrationComplete(req);
      }

      if (method === "POST" && (path === "/admin/provision-run" || path === "/admin/provision/run")) {
        return await handleAdminProvisionRun(req);
      }

      if (method === "POST" && path === "/provision/run") {
        const auth = await requireUser(req);
        if (auth.error) return auth.error;
        return await handleProvisionRun(req, auth.user, auth.token);
      }

      if ((method === "GET" || method === "POST") && path === "/usage/summary") {
        const auth = await requireUser(req);
        if (auth.error) return auth.error;
        return await handleUsageSummary(auth.user, auth.token);
      }

      return errorJson(`Route niet gevonden: ${method} ${path}`, 404);
    })();

    return withResponseHeaders(req, response);
  } catch (error: any) {
    return withResponseHeaders(
      req,
      errorJson(error?.message || "Onbekende fout in call-api edge function.", 500),
    );
  }
});
