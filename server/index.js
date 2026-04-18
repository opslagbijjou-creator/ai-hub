import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { Client, LocalAuth } = pkg;

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function buildSupabaseClient(apiKey, accessToken = null) {
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
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? buildSupabaseClient(SUPABASE_SERVICE_ROLE_KEY)
  : null;

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
});

const PORT = process.env.PORT || 3001;
const WWEBJS_DATA_PATH = path.join(__dirname, '.wwebjs_auth');
const LEGACY_WWEBJS_SESSION_DIR = path.join(WWEBJS_DATA_PATH, 'session');
const MAX_CHAT_HISTORY = 20;

const DEFAULT_AI_SETTINGS = {
  targetAudience: 'all',
  knowledge: 'Wij zijn een behulpzaam bedrijf.',
  calendarConnected: false
};

const WA_CONNECTIONS_TABLE = 'wa_connections';
const WA_CHATS_TABLE = 'wa_chats';
const WA_MESSAGES_TABLE = 'wa_messages';
const dbSyncWarningsShown = new Set();
const CHATS_CACHE_TTL_MS = 7000;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '⚠️ SUPABASE_SERVICE_ROLE_KEY ontbreekt; DB sync draait via user token tijdens requests. Voor background WhatsApp sync (zonder open dashboard) voeg SERVICE_ROLE toe.'
  );
}

const SYSTEM_PROMPT = `Je bent een proactieve AI Executive Assistant. Je bent geïntegreerd in de smartphone van de gebruiker (WhatsApp, Gmail, Apple/Google Calendar).
Als de gebruiker je vraagt om een bericht te sturen (bijv. naar Willem over 10:00 uur), schrijf dan een vloeiende, beleefde, menselijke tekst en reageer in deze vorm:

"✅ WhatsApp bericht succesvol verstuurd naar Willem:
_[Het bericht dat je hebt geschreven]_"

Als ze vragen om een meeting te plannen, doe alsof je in hun agenda hebt gekeken en plan het in.
Gedraag je alsof je daadwerkelijk toegang hebt tot hun contacten en acties kunt uitvoeren. Spreek Nederlands.`;

const WA_BOT_PROMPT = `Je bent de persoonlijke AI Assistent van de gebruiker. Je reageert momenteel DIRECT via WhatsApp.
Je praat nu rechtstreeks met de gebruiker via hun eigen WhatsApp account, of je beantwoordt vragen van hun klanten.
Jouw antwoord wordt automatisch direct teruggestuurd naar de persoon met wie je chat.
Je hoeft NIET te zeggen "stuur dit bericht naar...". Je praat direct met de persoon. Geef direct het antwoord of de reactie die nodig is.
Houd antwoorden kort, menselijk en direct zoals een echt WhatsApp gesprek.
Gebruik emoji's waar gepast. Spreek Nederlands tenzij iemand je in een andere taal schrijft.
Wees behulpzaam, warm en professioneel.`;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const userStates = new Map();

function parsePositiveInt(value, defaultValue, maxValue) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return defaultValue;
  return Math.min(parsed, maxValue);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error) {
  return error?.message || String(error || '');
}

function isTransientContextError(error) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('execution context was destroyed') ||
    message.includes('cannot find context with specified id') ||
    message.includes('target closed') ||
    message.includes('session closed') ||
    message.includes('protocol error')
  );
}

async function withTransientRetry(task, { retries = 3, baseDelayMs = 350, label = 'task' } = {}) {
  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (!isTransientContextError(error) || attempt >= retries) {
        throw error;
      }
      const waitMs = baseDelayMs * attempt;
      console.warn(
        `⚠️ Tijdelijke WhatsApp context-fout bij ${label} (poging ${attempt}/${retries}):`,
        getErrorMessage(error)
      );
      await sleep(waitMs);
    }
  }
  throw lastError;
}

function sanitizeClientId(userId) {
  return String(userId || 'anonymous').replace(/[^A-Za-z0-9_-]/g, '_');
}

function sessionDirForClientId(clientId) {
  return path.join(WWEBJS_DATA_PATH, `session-${clientId}`);
}

function normalizeAiSettingsRow(row = {}) {
  return {
    targetAudience:
      row.targetAudience ??
      row.target_audience ??
      row.targetaudience ??
      DEFAULT_AI_SETTINGS.targetAudience,
    knowledge: row.knowledge ?? DEFAULT_AI_SETTINGS.knowledge,
    calendarConnected:
      row.calendarConnected ??
      row.calendar_connected ??
      row.calendarconnected ??
      DEFAULT_AI_SETTINGS.calendarConnected
  };
}

function getDbClient(accessToken = null) {
  if (supabaseAdmin) return supabaseAdmin;
  if (accessToken && SUPABASE_ANON_KEY) {
    return buildSupabaseClient(SUPABASE_ANON_KEY, accessToken);
  }
  return supabaseAuth;
}

function getStateDbClient(state) {
  if (supabaseAdmin) return supabaseAdmin;
  if (state?.lastAccessToken) return getDbClient(state.lastAccessToken);
  return null;
}

function warnDbSyncOnce(key, error) {
  if (dbSyncWarningsShown.has(key)) return;
  dbSyncWarningsShown.add(key);
  console.warn(`⚠️ DB sync waarschuwing (${key}):`, getErrorMessage(error));
}

function mergeMessagesIntoCache(state, chatId, messages) {
  if (!Array.isArray(messages) || messages.length === 0) return;

  const previous = state.messagesCache.get(chatId) || [];
  const byId = new Map(previous.map((msg) => [msg.id, msg]));
  for (const msg of messages) {
    if (!msg?.id) continue;
    byId.set(msg.id, msg);
  }

  const merged = Array.from(byId.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  const trimmed = merged.length > 5000 ? merged.slice(merged.length - 5000) : merged;
  state.messagesCache.set(chatId, trimmed);
}

async function persistWhatsappConnectionSnapshot(state, dbClient, { force = false } = {}) {
  try {
    const client = dbClient || getStateDbClient(state);
    if (!client) return;

    const nowMs = Date.now();
    const nowIso = new Date().toISOString();
    const signature = `${Boolean(state.isConnected)}|${state.client?.info?.wid?._serialized || ''}|${
      state.lastInitError || ''
    }`;

    if (!force) {
      const sameSignature = state.lastConnectionPersistSignature === signature;
      const justPersisted = nowMs - (state.lastConnectionPersistAt || 0) < 15000;
      if (sameSignature && justPersisted) return;
    }

    const payload = {
      user_id: state.userId,
      client_id: state.clientId,
      connected: Boolean(state.isConnected),
      my_number: state.client?.info?.wid?._serialized || null,
      last_error: state.lastInitError || null,
      last_seen_at: nowIso,
      updated_at: nowIso
    };

    if (state.isConnected) {
      payload.last_connected_at = nowIso;
    }

    const { error } = await client
      .from(WA_CONNECTIONS_TABLE)
      .upsert(payload, { onConflict: 'user_id' });

    if (error) throw error;
    state.lastConnectionPersistAt = nowMs;
    state.lastConnectionPersistSignature = signature;
  } catch (error) {
    warnDbSyncOnce('wa_connections', error);
  }
}

async function persistChatsForUser(dbClient, userId, chats = []) {
  if (!Array.isArray(chats) || chats.length === 0) return;

  try {
    const nowIso = new Date().toISOString();
    const rows = chats
      .filter((chat) => chat?.id)
      .map((chat) => ({
        user_id: userId,
        chat_id: chat.id,
        name: chat.name || null,
        phone_number: chat.phoneNumber || null,
        avatar: chat.avatar || null,
        is_group: Boolean(chat.isGroup),
        unread_count: Number.parseInt(chat.unreadCount, 10) || 0,
        timestamp: Number.parseInt(chat.timestamp, 10) || 0,
        updated_at: nowIso
      }));

    if (rows.length === 0) return;

    const { error } = await dbClient
      .from(WA_CHATS_TABLE)
      .upsert(rows, { onConflict: 'user_id,chat_id' });

    if (error) throw error;
  } catch (error) {
    warnDbSyncOnce('wa_chats_write', error);
  }
}

async function readCachedChatsForUser(dbClient, userId, limit = 2000) {
  try {
    let query = dbClient
      .from(WA_CHATS_TABLE)
      .select('chat_id,name,phone_number,avatar,is_group,unread_count,timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (Number.isFinite(limit) && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.chat_id,
      name: row.name || row.phone_number || 'Onbekend contact',
      unreadCount: row.unread_count || 0,
      timestamp: row.timestamp || 0,
      isGroup: Boolean(row.is_group),
      avatar: row.avatar || null,
      phoneNumber: row.phone_number || null
    }));
  } catch (error) {
    warnDbSyncOnce('wa_chats_read', error);
    return [];
  }
}

async function persistMessagesForUser(dbClient, userId, chatId, messages = []) {
  if (!Array.isArray(messages) || messages.length === 0) return;

  try {
    const nowIso = new Date().toISOString();
    const rows = messages
      .filter((msg) => msg?.id)
      .map((msg) => ({
        user_id: userId,
        chat_id: chatId,
        message_id: msg.id,
        body: msg.body || '',
        from_me: Boolean(msg.fromMe),
        timestamp: Number.parseInt(msg.timestamp, 10) || 0,
        type: msg.type || 'chat',
        author: msg.author || null,
        updated_at: nowIso
      }));

    if (rows.length === 0) return;

    const { error } = await dbClient
      .from(WA_MESSAGES_TABLE)
      .upsert(rows, { onConflict: 'user_id,chat_id,message_id' });

    if (error) throw error;
  } catch (error) {
    warnDbSyncOnce('wa_messages_write', error);
  }
}

async function readCachedMessagesForUser(dbClient, userId, chatId, limit = 1200) {
  try {
    let query = dbClient
      .from(WA_MESSAGES_TABLE)
      .select('message_id,body,from_me,timestamp,type,author')
      .eq('user_id', userId)
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: false });

    if (Number.isFinite(limit) && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || [])
      .map((row) => ({
        id: row.message_id,
        body: row.body || '',
        fromMe: Boolean(row.from_me),
        timestamp: row.timestamp || 0,
        type: row.type || 'chat',
        author: row.author || null
      }))
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  } catch (error) {
    warnDbSyncOnce('wa_messages_read', error);
    return [];
  }
}

async function readAiSettingsForUser(dbClient, userId) {
  const defaults = { ...DEFAULT_AI_SETTINGS };

  // Nieuwe aanbevolen schema: user_id PK + snake_case kolommen
  try {
    const { data, error } = await dbClient
      .from('ai_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      return normalizeAiSettingsRow(data);
    }

    if (!error && !data) {
      const { error: insertError } = await dbClient
        .from('ai_settings')
        .upsert(
          {
            user_id: userId,
            target_audience: defaults.targetAudience,
            knowledge: defaults.knowledge,
            calendar_connected: defaults.calendarConnected,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      if (!insertError) return defaults;
    }
  } catch (error) {
    console.warn('⚠️ User settings schema fallback actief:', error.message);
  }

  // Legacy fallback: globale id=1 rij met niet-standaard kolomnamen
  try {
    const { data, error } = await dbClient
      .from('ai_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (!error && data) {
      return normalizeAiSettingsRow(data);
    }
  } catch (error) {
    console.warn('⚠️ Legacy ai_settings fallback faalde:', error.message);
  }

  return defaults;
}

async function saveAiSettingsForUser(dbClient, userId, payload = {}) {
  const merged = {
    ...DEFAULT_AI_SETTINGS,
    ...normalizeAiSettingsRow(payload)
  };

  // Probeer nieuw per-user schema eerst
  try {
    const { error } = await dbClient
      .from('ai_settings')
      .upsert(
        {
          user_id: userId,
          target_audience: merged.targetAudience,
          knowledge: merged.knowledge,
          calendar_connected: merged.calendarConnected,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );

    if (!error) return merged;
  } catch (error) {
    console.warn('⚠️ Save user_id schema fallback:', error.message);
  }

  // Fallback 1: legacy lowercase kolommen
  try {
    const { error } = await dbClient
      .from('ai_settings')
      .upsert({
        id: 1,
        targetaudience: merged.targetAudience,
        knowledge: merged.knowledge,
        calendarconnected: merged.calendarConnected,
        updated_at: new Date().toISOString()
      });

    if (!error) return merged;
  } catch (error) {
    console.warn('⚠️ Save legacy lowercase fallback:', error.message);
  }

  // Fallback 2: snake_case globale kolommen
  try {
    const { error } = await dbClient
      .from('ai_settings')
      .upsert({
        id: 1,
        target_audience: merged.targetAudience,
        knowledge: merged.knowledge,
        calendar_connected: merged.calendarConnected,
        updated_at: new Date().toISOString()
      });

    if (!error) return merged;
  } catch (error) {
    console.warn('⚠️ Save legacy snake_case fallback:', error.message);
  }

  return merged;
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Niet ingelogd (token ontbreekt).' });
  }

  try {
    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Ongeldige of verlopen sessie.' });
    }

    req.user = data.user;
    req.accessToken = token;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Authenticatie mislukt.' });
  }
}

function cleanupSessionArtifacts(sessionDir) {
  const lockArtifacts = [
    'SingletonLock',
    'SingletonSocket',
    'SingletonCookie',
    'DevToolsActivePort',
    'RunningChromeVersion'
  ];

  for (const file of lockArtifacts) {
    try {
      fs.rmSync(path.join(sessionDir, file), { force: true, recursive: true });
      console.log(`🧹 Opgeruimd (${path.basename(sessionDir)}): ${file}`);
    } catch {
      // negeer
    }
  }
}

function killStaleWhatsappBrowserProcessesForSession(sessionDir) {
  try {
    const output = execSync('ps -axo pid=,command=', { encoding: 'utf8' });
    const lines = output.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (!trimmed.includes(sessionDir)) continue;
      if (!trimmed.toLowerCase().includes('chrome')) continue;

      const pidToken = trimmed.split(/\s+/, 1)[0];
      const pid = Number.parseInt(pidToken, 10);
      if (!Number.isFinite(pid) || pid <= 0 || pid === process.pid) continue;

      try {
        process.kill(pid, 'SIGKILL');
        console.log(`🧹 Gestopte stale browser process (${path.basename(sessionDir)}): ${pid}`);
      } catch {
        // negeer
      }
    }
  } catch (error) {
    console.warn('⚠️ Kon stale browser processen niet inspecteren:', error.message);
  }
}

function createWhatsappClient(clientId) {
  return new Client({
    authStrategy: new LocalAuth({ clientId, dataPath: WWEBJS_DATA_PATH }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });
}

async function safeReply(msg, text, contextLabel = 'reply') {
  try {
    await msg.reply(text);
  } catch (error) {
    console.error(`❌ Kon ${contextLabel} niet versturen:`, error.message);
  }
}

async function fetchMessagesWithFallback(chat, requestedLimit) {
  const candidateLimits = [
    requestedLimit,
    Math.min(requestedLimit, 1500),
    Math.min(requestedLimit, 800),
    Math.min(requestedLimit, 300)
  ].filter((value, index, arr) => Number.isFinite(value) && value > 0 && arr.indexOf(value) === index);

  let lastError = null;
  for (const limit of candidateLimits) {
    try {
      const fetched = await chat.fetchMessages({ limit });
      if (Array.isArray(fetched)) return fetched;
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ fetchMessages poging met limit=${limit} faalde:`, error.message);
    }
  }

  if (lastError) throw lastError;
  return [];
}

async function maybeTriggerHistorySync(state, chatId, { force = false } = {}) {
  const now = Date.now();
  const previous = state.historySyncRequestedAt.get(chatId) || 0;
  if (!force && now - previous < 60000) {
    return false;
  }

  state.historySyncRequestedAt.set(chatId, now);
  try {
    const triggered = await state.client.syncHistory(chatId);
    if (triggered) {
      console.log(`📚 History sync aangevraagd voor user=${state.userId} chat=${chatId}`);
    }
    return triggered;
  } catch (error) {
    console.warn(`⚠️ History sync mislukt user=${state.userId} chat=${chatId}:`, error.message);
    return false;
  }
}

function getHistory(state, chatId) {
  if (!state.chatHistories.has(chatId)) {
    state.chatHistories.set(chatId, []);
  }
  return state.chatHistories.get(chatId);
}

async function ensureUserSettingsLoaded(state, { force = false, accessToken = null } = {}) {
  if (!state.settingsLoaded || force) {
    const dbClient = getDbClient(accessToken || state.lastAccessToken || null);
    state.settings = await readAiSettingsForUser(dbClient, state.userId);
    state.settingsLoaded = true;
  }
  return state.settings;
}

function attachWhatsappHandlers(state) {
  const { client } = state;

  client.on('qr', async (qr) => {
    console.log(`📱 QR ontvangen voor user ${state.userId}`);
    try {
      state.qrCodeData = await qrcode.toDataURL(qr);
      state.isConnected = false;
      state.isAuthenticated = false;
      state.lastInitError = null;
      await persistWhatsappConnectionSnapshot(state, null, { force: true });
    } catch (error) {
      console.error('Fout bij QR generatie:', error.message);
    }
  });

  client.on('authenticated', async () => {
    console.log(`🔐 WhatsApp authenticated voor user ${state.userId}`);
    state.isAuthenticated = true;
    state.lastInitError = null;
    state.qrCodeData = null;
    await persistWhatsappConnectionSnapshot(state, null, { force: true });
  });

  client.on('ready', async () => {
    console.log(`✅ WhatsApp verbonden voor user ${state.userId}`);
    state.isConnected = true;
    state.isAuthenticated = true;
    state.qrCodeData = null;
    state.lastInitError = null;
    state.transientStateCheckFailures = 0;
    await persistWhatsappConnectionSnapshot(state, null, { force: true });
  });

  client.on('disconnected', async (reason) => {
    console.log(`❌ WhatsApp disconnected voor user ${state.userId}:`, reason || 'unknown');
    state.isConnected = false;
    state.isAuthenticated = false;
    state.qrCodeData = null;
    state.lastInitError = reason || 'WhatsApp disconnected.';
    state.transientStateCheckFailures = 0;
    await persistWhatsappConnectionSnapshot(state, null, { force: true });
  });

  client.on('auth_failure', async (message) => {
    console.error(`❌ WhatsApp auth_failure voor user ${state.userId}:`, message);
    state.isConnected = false;
    state.isAuthenticated = false;
    state.qrCodeData = null;
    state.lastInitError = message || 'WhatsApp auth failure.';
    state.transientStateCheckFailures = 0;
    await persistWhatsappConnectionSnapshot(state, null, { force: true });
  });

  client.on('message_create', async (msg) => {
    try {
      if (!state.client.info?.wid?._serialized) return;
      if (msg.from === 'status@broadcast') return;
      if (msg.from.includes('@g.us') || msg.to.includes('@g.us')) return;

      const myNumber = state.client.info.wid._serialized;
      const isSelfChat = msg.to === myNumber && msg.from === myNumber;

      if (msg.fromMe && !isSelfChat) return;
      if (state.botMessages.has(msg.body)) return;

      const chatId = msg.from === myNumber ? msg.to : msg.from;
      const dbClient = getStateDbClient(state);
      const incomingMessage = {
        id: msg?.id?._serialized || `${chatId}-${msg.timestamp || Date.now()}-incoming`,
        body: msg.body || '',
        fromMe: Boolean(msg.fromMe),
        timestamp: msg.timestamp || Math.floor(Date.now() / 1000),
        type: msg.type || 'chat',
        author: msg.author || null
      };
      mergeMessagesIntoCache(state, chatId, [incomingMessage]);
      if (dbClient) {
        await persistMessagesForUser(dbClient, state.userId, chatId, [incomingMessage]);
      }

      const settings = await ensureUserSettingsLoaded(state);
      const chatHistory = getHistory(state, chatId);

      if (!isSelfChat && settings.targetAudience !== 'all') {
        const hasHistory = chatHistory.length > 0;
        if (settings.targetAudience === 'new' && hasHistory) return;
        if (settings.targetAudience === 'none') return;
      }

      chatHistory.push({ role: 'user', content: msg.body || '' });
      if (chatHistory.length > MAX_CHAT_HISTORY) {
        chatHistory.splice(0, chatHistory.length - MAX_CHAT_HISTORY);
      }

      const finalPrompt = `${WA_BOT_PROMPT}\n\nBedrijfskennis & Instructies van de Eigenaar:\n${settings.knowledge}`;

      const tools = isSelfChat
        ? [
            {
              type: 'function',
              function: {
                name: 'send_whatsapp_message',
                description: 'Stuur een WhatsApp bericht naar een specifiek telefoonnummer namens de gebruiker.',
                parameters: {
                  type: 'object',
                  properties: {
                    phoneNumber: {
                      type: 'string',
                      description: 'Het telefoonnummer inclusief landcode (bijv. +31612345678)'
                    },
                    message: {
                      type: 'string',
                      description: 'Het bericht om te versturen'
                    }
                  },
                  required: ['phoneNumber', 'message']
                }
              }
            }
          ]
        : undefined;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: finalPrompt }, ...chatHistory],
        tools,
        tool_choice: tools ? 'auto' : undefined
      });

      const responseMessage = completion.choices[0].message;

      if (responseMessage.tool_calls) {
        for (const toolCall of responseMessage.tool_calls) {
          if (toolCall.function.name !== 'send_whatsapp_message') continue;

          const args = JSON.parse(toolCall.function.arguments);
          const cleanNumber = String(args.phoneNumber || '').replace(/[^0-9]/g, '');
          const targetChatId = `${cleanNumber}@c.us`;

          try {
            await state.client.sendMessage(targetChatId, args.message || '');
            const forwardedMessage = {
              id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              body: args.message || '',
              fromMe: true,
              timestamp: Math.floor(Date.now() / 1000),
              type: 'chat',
              author: null
            };
            mergeMessagesIntoCache(state, targetChatId, [forwardedMessage]);
            if (dbClient) {
              await persistMessagesForUser(dbClient, state.userId, targetChatId, [forwardedMessage]);
            }
            chatHistory.push({
              role: 'assistant',
              content: `[SYSTEEM: Bericht succesvol verstuurd naar ${args.phoneNumber}]`
            });
            await state.client.sendMessage(
              myNumber,
              `✅ Ik heb het volgende bericht verstuurd naar ${args.phoneNumber}:\n\n"${args.message}"`
            );
          } catch {
            await state.client.sendMessage(
              myNumber,
              `❌ Het is niet gelukt om het bericht naar ${args.phoneNumber} te sturen.`
            );
          }
        }
      } else if (responseMessage.content) {
        const reply = responseMessage.content;
        chatHistory.push({ role: 'assistant', content: reply });

        state.botMessages.add(reply);
        if (state.botMessages.size > 1000) {
          state.botMessages.clear();
        }

        if (isSelfChat) {
          await state.client.sendMessage(myNumber, reply);
        } else {
          await safeReply(msg, reply, 'AI-antwoord');
        }

        const replyMessage = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          body: reply,
          fromMe: true,
          timestamp: Math.floor(Date.now() / 1000),
          type: 'chat',
          author: null
        };
        mergeMessagesIntoCache(state, chatId, [replyMessage]);
        if (dbClient) {
          await persistMessagesForUser(dbClient, state.userId, chatId, [replyMessage]);
        }
      }
    } catch (error) {
      console.error(`❌ Auto-reply fout voor user ${state.userId}:`, error.message);
      await safeReply(
        msg,
        'Sorry, ik kan je bericht even niet verwerken. Probeer het later opnieuw! 🙏',
        'fallback'
      );
    }
  });
}

function getOrCreateUserState(userId) {
  if (userStates.has(userId)) {
    return userStates.get(userId);
  }

  const clientId = sanitizeClientId(userId);
  const sessionDir = sessionDirForClientId(clientId);

  // Ruim oude single-session artifacts op (van pre multi-user implementatie)
  killStaleWhatsappBrowserProcessesForSession(LEGACY_WWEBJS_SESSION_DIR);
  cleanupSessionArtifacts(LEGACY_WWEBJS_SESSION_DIR);
  fs.mkdirSync(sessionDir, { recursive: true });
  killStaleWhatsappBrowserProcessesForSession(sessionDir);
  cleanupSessionArtifacts(sessionDir);

  const state = {
    userId,
    clientId,
    sessionDir,
    client: createWhatsappClient(clientId),
    qrCodeData: null,
    isConnected: false,
    isAuthenticated: false,
    isInitializing: false,
    lastInitAttemptAt: 0,
    lastInitError: null,
    transientStateCheckFailures: 0,
    lastConnectionPersistAt: 0,
    lastConnectionPersistSignature: null,
    lastAccessToken: null,
    settingsLoaded: false,
    settings: { ...DEFAULT_AI_SETTINGS },
    chatsCache: [],
    chatsCacheAt: 0,
    historySyncRequestedAt: new Map(),
    messagesCache: new Map(),
    chatHistories: new Map(),
    botMessages: new Set()
  };

  attachWhatsappHandlers(state);
  userStates.set(userId, state);
  return state;
}

async function initializeUserWhatsapp(userId, { attempt = 1, accessToken = null } = {}) {
  const state = getOrCreateUserState(userId);

  if (state.isConnected || state.isInitializing) return;

  if (accessToken) {
    state.lastAccessToken = accessToken;
  }

  state.isInitializing = true;
  state.lastInitAttemptAt = Date.now();
  state.lastInitError = null;

  try {
    killStaleWhatsappBrowserProcessesForSession(LEGACY_WWEBJS_SESSION_DIR);
    cleanupSessionArtifacts(LEGACY_WWEBJS_SESSION_DIR);
    killStaleWhatsappBrowserProcessesForSession(state.sessionDir);
    cleanupSessionArtifacts(state.sessionDir);
    await ensureUserSettingsLoaded(state, { accessToken: accessToken || state.lastAccessToken });
    await state.client.initialize();
    state.isInitializing = false;
  } catch (error) {
    const message = error?.message || String(error);
    console.error(`WhatsApp Init Error user=${userId} poging=${attempt}:`, message);

    state.isConnected = false;
    state.isAuthenticated = false;
    state.qrCodeData = null;
    state.isInitializing = false;
    state.lastInitError = message;
    await persistWhatsappConnectionSnapshot(state, null, { force: true });

    const shouldRetry =
      message.includes('browser is already running') ||
      message.includes('Target closed') ||
      message.includes('Session closed') ||
      message.includes('Execution context was destroyed');

    if (attempt < 5 && shouldRetry) {
      killStaleWhatsappBrowserProcessesForSession(state.sessionDir);
      cleanupSessionArtifacts(state.sessionDir);
      const retryDelayMs = Math.min(1500 * attempt, 8000);
      setTimeout(() => {
        initializeUserWhatsapp(userId, {
          attempt: attempt + 1,
          accessToken: accessToken || state.lastAccessToken
        });
      }, retryDelayMs);
    }
  }
}

async function resetUserWhatsappState(userId, { clearAuthDir = true, reinitialize = true } = {}) {
  const state = getOrCreateUserState(userId);

  state.isConnected = false;
  state.isAuthenticated = false;
  state.qrCodeData = null;
  state.isInitializing = false;
  state.lastInitError = null;

  try {
    await state.client.logout();
  } catch {
    // logout kan mislukken als sessie al weg is
  }

  try {
    await state.client.destroy();
  } catch {
    // destroy kan mislukken bij al gesloten browser
  }

  if (clearAuthDir) {
    try {
      fs.rmSync(state.sessionDir, { recursive: true, force: true });
    } catch {
      // negeer
    }
  }

  killStaleWhatsappBrowserProcessesForSession(state.sessionDir);
  cleanupSessionArtifacts(state.sessionDir);

  state.chatHistories.clear();
  state.historySyncRequestedAt.clear();
  state.chatsCache = [];
  state.chatsCacheAt = 0;
  state.messagesCache.clear();
  state.botMessages.clear();
  state.client = createWhatsappClient(state.clientId);
  attachWhatsappHandlers(state);
  await persistWhatsappConnectionSnapshot(state, null, { force: true });

  if (reinitialize) {
    setTimeout(() => {
      initializeUserWhatsapp(userId, { accessToken: state.lastAccessToken });
    }, 800);
  }
}

// --- Settings Endpoints (per user) ---
app.get('/api/settings', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const dbClient = getDbClient(req.accessToken);
  const settings = await readAiSettingsForUser(dbClient, userId);

  const state = getOrCreateUserState(userId);
  state.settings = settings;
  state.settingsLoaded = true;
  state.lastAccessToken = req.accessToken;

  res.json(settings);
});

app.post('/api/settings', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const dbClient = getDbClient(req.accessToken);
  const saved = await saveAiSettingsForUser(dbClient, userId, req.body || {});

  const state = getOrCreateUserState(userId);
  state.settings = saved;
  state.settingsLoaded = true;
  state.lastAccessToken = req.accessToken;

  res.json({ success: true, settings: saved });
});

// --- AI Chat Endpoint ---
app.post('/api/chat', requireAuth, async (req, res) => {
  const { messages = [] } = req.body || {};

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]
    });

    res.json({ content: completion.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- WhatsApp Endpoints (per user) ---
app.get('/api/whatsapp/status', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const state = getOrCreateUserState(userId);
  state.lastAccessToken = req.accessToken;
  const dbClient = getDbClient(req.accessToken);

  // Init on-demand wanneer user pagina opent
  if (
    !state.isConnected &&
    !state.qrCodeData &&
    !state.isInitializing &&
    Date.now() - state.lastInitAttemptAt > 8000
  ) {
    initializeUserWhatsapp(userId, { accessToken: req.accessToken });
  }

  if (state.isConnected) {
    try {
      const currentState = await withTransientRetry(() => state.client.getState(), {
        retries: 2,
        baseDelayMs: 250,
        label: 'getState'
      });
      if (currentState !== 'CONNECTED') {
        state.isConnected = false;
        state.qrCodeData = null;
        state.transientStateCheckFailures = 0;
      } else {
        state.transientStateCheckFailures = 0;
      }
    } catch (error) {
      if (isTransientContextError(error)) {
        state.transientStateCheckFailures += 1;
        console.warn(
          `⚠️ Tijdelijke getState fout user=${userId} (${state.transientStateCheckFailures}x):`,
          getErrorMessage(error)
        );

        // Geef WhatsApp Web de kans om te herstellen voordat we de sessie als disconnected markeren.
        if (state.transientStateCheckFailures >= 5) {
          state.isConnected = false;
          state.qrCodeData = null;
          state.lastInitError =
            'WhatsApp synchroniseert nog. Probeer over een paar seconden opnieuw.';
          state.transientStateCheckFailures = 0;
        }
      } else {
        state.isConnected = false;
        state.qrCodeData = null;
      }
    }
  }

  await persistWhatsappConnectionSnapshot(state, dbClient);

  let phase = 'idle';
  if (state.isConnected) phase = 'connected';
  else if (state.qrCodeData) phase = 'awaiting_scan';
  else if (state.isAuthenticated) phase = 'finalizing';
  else if (state.isInitializing) phase = 'initializing';

  res.json({
    connected: state.isConnected,
    authenticated: state.isAuthenticated,
    phase,
    qrCode: state.qrCodeData,
    myNumber: state.client?.info?.wid?._serialized || null,
    initializing: state.isInitializing,
    lastError: state.isConnected ? null : state.lastInitError || null
  });
});

app.get('/api/whatsapp/chats', requireAuth, async (req, res) => {
  const state = getOrCreateUserState(req.user.id);
  state.lastAccessToken = req.accessToken;
  const dbClient = getDbClient(req.accessToken);

  const includeAllChats =
    String(req.query.all || '').toLowerCase() === 'true' ||
    String(req.query.limit || '').toLowerCase() === 'all';
  const preferFast = String(req.query.fast || 'true').toLowerCase() !== 'false';
  const preferCache = String(req.query.cacheFirst || 'true').toLowerCase() !== 'false';
  const limit = includeAllChats ? null : parsePositiveInt(req.query.limit, 2000, 10000);
  const cacheLimit = Number.isFinite(limit) ? limit : 10000;

  if (
    preferCache &&
    Array.isArray(state.chatsCache) &&
    state.chatsCache.length > 0 &&
    Date.now() - state.chatsCacheAt < CHATS_CACHE_TTL_MS
  ) {
    return res.json(state.chatsCache);
  }

  if (!state.isConnected) {
    if (Array.isArray(state.chatsCache) && state.chatsCache.length > 0) {
      return res.json(state.chatsCache);
    }
    const cachedChats = await readCachedChatsForUser(dbClient, req.user.id, cacheLimit);
    return res.json(cachedChats);
  }

  try {
    const standardChats = await withTransientRetry(() => state.client.getChats(), {
      retries: 3,
      baseDelayMs: 250,
      label: 'getChats'
    });
    let filteredChats = standardChats
      .filter((chat) => {
        const chatId = chat?.id?._serialized || '';
        return chatId !== 'status@broadcast';
      })
      .sort((a, b) => {
        const bTs = b?.timestamp || b?.lastMessage?.timestamp || 0;
        const aTs = a?.timestamp || a?.lastMessage?.timestamp || 0;
        return bTs - aTs;
      });

    if (Number.isFinite(limit)) {
      filteredChats = filteredChats.slice(0, limit);
    }

    const cachedChats = preferFast
      ? []
      : await readCachedChatsForUser(dbClient, req.user.id, cacheLimit);
    const cachedById = new Map(cachedChats.map((chat) => [chat.id, chat]));

    const mappedChats = await Promise.all(
      filteredChats.map(async (chat, index) => {
        const cached = cachedById.get(chat.id._serialized);
        let avatar = null;
        let contactName = null;
        let phoneNumber = chat?.id?.user || cached?.phoneNumber || null;

        const shouldEnrichProfile = !preferFast && index < 40;

        if (shouldEnrichProfile) {
          try {
            const contact = await chat.getContact();
            if (contact) {
              contactName = contact.pushname || contact.name || contact.shortName || null;
              phoneNumber = contact.number || phoneNumber;
              avatar = await contact.getProfilePicUrl().catch(() => null);
            }
          } catch {
            // contact kan ontbreken door privacy settings
          }
        }

        return {
          id: chat.id._serialized,
          name: chat.name || contactName || cached?.name || phoneNumber || 'Onbekend contact',
          unreadCount: chat.unreadCount || 0,
          timestamp: chat.timestamp || chat?.lastMessage?.timestamp || 0,
          isGroup: Boolean(chat.isGroup),
          avatar: avatar || cached?.avatar || null,
          phoneNumber: phoneNumber || chat?.id?.user || null
        };
      })
    );

    state.chatsCache = mappedChats;
    state.chatsCacheAt = Date.now();
    await persistChatsForUser(dbClient, req.user.id, mappedChats);

    res.json(mappedChats);
  } catch (error) {
    console.error('Fout bij ophalen chats:', error.message);
    if (Array.isArray(state.chatsCache) && state.chatsCache.length > 0) {
      return res.json(state.chatsCache);
    }
    const cachedChats = await readCachedChatsForUser(dbClient, req.user.id, cacheLimit);
    if (cachedChats.length > 0) {
      return res.json(cachedChats);
    }
    res.status(500).json({ error: 'Kon chats niet laden.' });
  }
});

app.get('/api/whatsapp/chat/:chatId/messages', requireAuth, async (req, res) => {
  const state = getOrCreateUserState(req.user.id);
  state.lastAccessToken = req.accessToken;
  const dbClient = getDbClient(req.accessToken);

  const chatId = decodeURIComponent(req.params.chatId || '');
  const shouldSyncHistory = String(req.query.sync || 'true').toLowerCase() !== 'false';
  const forceSyncHistory = String(req.query.forceSync || '').toLowerCase() === 'true';
  const includeAllMessages =
    String(req.query.all || '').toLowerCase() === 'true' ||
    String(req.query.limit || '').toLowerCase() === 'all';
  const messageLimit = includeAllMessages ? 3000 : parsePositiveInt(req.query.limit, 600, 3000);

  if (!state.isConnected) {
    const cachedFromDb = await readCachedMessagesForUser(dbClient, req.user.id, chatId, messageLimit);
    if (cachedFromDb.length > 0) {
      mergeMessagesIntoCache(state, chatId, cachedFromDb);
    }
    return res.json(cachedFromDb);
  }

  try {
    const chat = await withTransientRetry(() => state.client.getChatById(chatId), {
      retries: 3,
      baseDelayMs: 250,
      label: 'getChatById'
    });
    if (!chat) {
      return res.status(404).json({ error: 'Chat niet gevonden.' });
    }

    if (shouldSyncHistory) {
      await maybeTriggerHistorySync(state, chatId, { force: forceSyncHistory });
    }

    const loadMessagesForChat = async () => {
      const liveChat = await state.client.getChatById(chatId);
      if (!liveChat) return [];
      return fetchMessagesWithFallback(liveChat, messageLimit);
    };

    let fetchedMessages = await withTransientRetry(loadMessagesForChat, {
      retries: 3,
      baseDelayMs: 300,
      label: 'fetchMessages'
    });

    // Na history sync kan data asynchroon binnenkomen; korte retries helpen oude berichten zichtbaar maken.
    if (shouldSyncHistory) {
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        await sleep(700);
        try {
          const retriedMessages = await withTransientRetry(loadMessagesForChat, {
            retries: 2,
            baseDelayMs: 250,
            label: 'fetchMessages-retry'
          });
          if (retriedMessages.length > fetchedMessages.length) {
            fetchedMessages = retriedMessages;
          }
        } catch (error) {
          if (!isTransientContextError(error)) {
            throw error;
          }
        }
      }
    }

    const messages = fetchedMessages
      .map((msg, index) => ({
        id: msg?.id?._serialized || `${chatId}-${msg.timestamp}-${index}`,
        body: msg.body || '',
        fromMe: Boolean(msg.fromMe),
        timestamp: msg.timestamp || 0,
        type: msg.type || 'chat',
        author: msg.author || null
      }))
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    mergeMessagesIntoCache(state, chatId, messages);
    await persistMessagesForUser(dbClient, req.user.id, chatId, messages);
    res.json(messages);
  } catch (error) {
    console.error('Fout bij ophalen berichten:', getErrorMessage(error));

    const cached = state.messagesCache.get(chatId);
    const cachedFromDb = await readCachedMessagesForUser(dbClient, req.user.id, chatId, messageLimit);
    if (cachedFromDb.length > 0) {
      mergeMessagesIntoCache(state, chatId, cachedFromDb);
      return res.json(cachedFromDb);
    }

    if (isTransientContextError(error)) {
      if (Array.isArray(cached) && cached.length > 0) {
        return res.json(cached);
      }
      return res.status(503).json({
        error: 'WhatsApp synchroniseert nog. Probeer over een paar seconden opnieuw.'
      });
    }

    res.status(500).json({ error: 'Kon berichten niet laden.' });
  }
});

app.post('/api/whatsapp/send', requireAuth, async (req, res) => {
  const state = getOrCreateUserState(req.user.id);
  state.lastAccessToken = req.accessToken;
  const dbClient = getDbClient(req.accessToken);
  const { phoneNumber, message, chatId } = req.body || {};

  if (!state.isConnected) {
    return res.status(400).json({ error: 'WhatsApp is niet verbonden.' });
  }

  try {
    let targetChatId = chatId;

    if (!targetChatId && phoneNumber) {
      const cleanNumber = String(phoneNumber).replace(/[^0-9]/g, '');
      targetChatId = `${cleanNumber}@c.us`;
    }

    if (!targetChatId) {
      return res.status(400).json({ error: 'chatId of phoneNumber is verplicht.' });
    }

    await state.client.sendMessage(targetChatId, message || '');
    const outgoingMessage = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      body: message || '',
      fromMe: true,
      timestamp: Math.floor(Date.now() / 1000),
      type: 'chat',
      author: null
    };
    mergeMessagesIntoCache(state, targetChatId, [outgoingMessage]);
    await persistMessagesForUser(dbClient, req.user.id, targetChatId, [outgoingMessage]);
    res.json({ success: true, message: 'Bericht verstuurd' });
  } catch (error) {
    console.error('Fout sturen WhatsApp bericht:', error.message);
    res.status(500).json({ error: 'Kon bericht niet versturen.' });
  }
});

app.post('/api/whatsapp/disconnect', requireAuth, async (req, res) => {
  try {
    const state = getOrCreateUserState(req.user.id);
    state.lastAccessToken = req.accessToken;
    await resetUserWhatsappState(req.user.id, {
      clearAuthDir: true,
      reinitialize: true
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Fout bij verbreken verbinding:', error.message);
    res.status(500).json({ error: 'Kon verbinding niet verbreken.' });
  }
});

app.post('/api/whatsapp/relink', requireAuth, async (req, res) => {
  try {
    const state = getOrCreateUserState(req.user.id);
    state.lastAccessToken = req.accessToken;
    await resetUserWhatsappState(req.user.id, {
      clearAuthDir: true,
      reinitialize: true
    });

    res.json({ success: true, message: 'Nieuwe QR generatie gestart.' });
  } catch (error) {
    console.error('Fout bij forceren nieuwe QR:', error.message);
    res.status(500).json({ error: 'Kon nieuwe QR niet forceren.' });
  }
});

app.get('/api/debug-store', requireAuth, async (req, res) => {
  try {
    const state = getOrCreateUserState(req.user.id);
    state.lastAccessToken = req.accessToken;
    const data = await state.client.pupPage.evaluate(() => Object.keys(window.Store || {}));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/assistant/config', requireAuth, (req, res) => {
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log('\n=================================================');
  console.log(`🚀 AI Hub Backend draait op: http://localhost:${PORT}`);
  console.log('=================================================\n');
});
