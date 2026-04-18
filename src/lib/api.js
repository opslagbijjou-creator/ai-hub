import { hasSupabaseConfig, supabaseConfigMessage } from './supabase';

const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');

const isLocalhost = typeof window !== 'undefined'
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const supabaseFunctionBase = rawSupabaseUrl ? `${rawSupabaseUrl}/functions/v1/call-api` : '';
const usingSupabaseFunctions = !rawApiBase && Boolean(supabaseFunctionBase);

export const API_BASE = rawApiBase || supabaseFunctionBase || (isLocalhost ? 'http://localhost:3001' : '');
export const hasApiBaseConfig = Boolean(API_BASE);
export const apiConfigMessage =
  hasSupabaseConfig
    ? 'API configuratie ontbreekt. Zet VITE_API_BASE_URL of deploy Supabase function `call-api`.'
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
