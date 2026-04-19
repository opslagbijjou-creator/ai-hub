import { hasSupabaseConfig, resolvedSupabaseUrl, supabaseConfigMessage } from './supabase';

const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
const rawSupabaseUrl = (resolvedSupabaseUrl || '').trim().replace(/\/$/, '');

const browserHost = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalhost = browserHost === 'localhost' || browserHost === '127.0.0.1';

const supabaseFunctionBase = rawSupabaseUrl ? `${rawSupabaseUrl}/functions/v1/call-api` : '';
const localhostApiBase = isLocalhost ? 'http://localhost:3001' : '';
const resolvedApiBase = rawApiBase || localhostApiBase || supabaseFunctionBase || '';
const usingSupabaseFunctions = Boolean(supabaseFunctionBase) && resolvedApiBase === supabaseFunctionBase;

export const API_BASE = resolvedApiBase;
export const hasApiBaseConfig = Boolean(API_BASE);
export const apiConfigMessage =
  hasSupabaseConfig
    ? 'API configuratie ontbreekt. Deploy Supabase function `call-api` of zet VITE_API_BASE_URL naar een eigen API.'
    : supabaseConfigMessage;

if (!hasApiBaseConfig && typeof window !== 'undefined') {
  console.error(apiConfigMessage);
}

export const apiUrl = (path) => {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path;
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (usingSupabaseFunctions && normalizedPath.startsWith('/api/')) {
    normalizedPath = normalizedPath.slice(4) || '/';
  }
  return `${API_BASE}${normalizedPath}`;
};
