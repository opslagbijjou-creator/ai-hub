import {
  DEFAULT_SUPABASE_URL,
  hasSupabaseConfig,
  resolvedSupabaseUrl,
  supabaseConfigMessage
} from './supabase';

const rawSupabaseUrl = (resolvedSupabaseUrl || '').trim().replace(/\/$/, '');

const browserHost = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalhost = browserHost === 'localhost' || browserHost === '127.0.0.1';

const supabaseFunctionBase = rawSupabaseUrl ? `${rawSupabaseUrl}/functions/v1/call-api` : '';
const defaultSupabaseFunctionBase = String(DEFAULT_SUPABASE_URL || '').trim().replace(/\/$/, '')
  ? `${String(DEFAULT_SUPABASE_URL || '').trim().replace(/\/$/, '')}/functions/v1/call-api`
  : '';
const localhostApiBase = isLocalhost ? 'http://localhost:3001' : '';
const resolvedApiBase = supabaseFunctionBase || localhostApiBase || '';
const usingSupabaseFunctions = Boolean(supabaseFunctionBase) && resolvedApiBase === supabaseFunctionBase;

export const API_BASE = resolvedApiBase;
export const hasApiBaseConfig = Boolean(API_BASE);
export const apiConfigMessage =
  hasSupabaseConfig
    ? 'API configuratie ontbreekt. Deploy Supabase function `call-api` of gebruik alleen de legacy localhost API voor lokaal werk.'
    : supabaseConfigMessage;

if (!hasApiBaseConfig && typeof window !== 'undefined') {
  console.error(apiConfigMessage);
}

const normalizeApiPath = (path, functionsBase) => {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path;
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (functionsBase && normalizedPath.startsWith('/api/')) {
    normalizedPath = normalizedPath.slice(4) || '/';
  }
  return normalizedPath;
};

const buildApiUrl = (base, path, functionsBase) => {
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${normalizeApiPath(path, functionsBase)}`;
};

const getHost = (value) => {
  try {
    return new URL(value).host;
  } catch {
    return '';
  }
};

export const apiUrl = (path) => {
  if (!API_BASE) return normalizeApiPath(path, usingSupabaseFunctions);
  return buildApiUrl(API_BASE, path, usingSupabaseFunctions);
};

export const apiFetch = async (path, options = {}) => {
  const primaryUrl = apiUrl(path);
  const fallbackUrl = defaultSupabaseFunctionBase
    ? buildApiUrl(defaultSupabaseFunctionBase, path, true)
    : '';
  const method = String(options?.method || 'GET').toUpperCase();
  const canRetryDifferentHost =
    Boolean(fallbackUrl) &&
    fallbackUrl !== primaryUrl &&
    getHost(fallbackUrl) &&
    getHost(fallbackUrl) !== getHost(primaryUrl);

  if (!primaryUrl && !fallbackUrl) {
    throw new Error(apiConfigMessage);
  }

  try {
    const response = await fetch(primaryUrl || fallbackUrl, options);
    if (canRetryDifferentHost && (method === 'GET' || method === 'HEAD') && [404, 405].includes(response.status)) {
      return fetch(fallbackUrl, options);
    }
    return response;
  } catch (error) {
    if (!canRetryDifferentHost) {
      throw error;
    }
    return fetch(fallbackUrl, options);
  }
};
