import { createClient } from '@supabase/supabase-js';

// Deze waarden haal je op uit je Supabase Dashboard:
// 1. Ga naar https://supabase.com en maak een gratis account
// 2. Maak een nieuw project aan
// 3. Ga naar Settings > API
// 4. Kopieer de "Project URL" en "anon public" key

const defaultSupabaseUrl = 'https://xsmpmorgtcbzjbnmjzvn.supabase.co';
const defaultSupabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzbXBtb3JndGNiempibm1qenZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTkwNDQsImV4cCI6MjA5MjAzNTA0NH0.CXXvDFTqNSZ1tRDrq698PLuq5UAWByT6wcEJ5AWplUs';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || defaultSupabaseUrl || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || defaultSupabaseAnonKey || '').trim();

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseConfigMessage =
  'Supabase configuratie ontbreekt. Zet VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY in je frontend environment variables.';

const createConfigError = () => new Error(supabaseConfigMessage);
const noopUnsubscribe = () => {};

const disabledAuthClient = {
  getSession: async () => ({ data: { session: null }, error: createConfigError() }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: noopUnsubscribe } } }),
  signInWithPassword: async () => ({ data: null, error: createConfigError() }),
  signUp: async () => ({ data: null, error: createConfigError() }),
  resend: async () => ({ data: null, error: createConfigError() }),
  signInWithOAuth: async () => ({ data: null, error: createConfigError() }),
  signOut: async () => ({ error: null })
};

if (!hasSupabaseConfig) {
  console.error(supabaseConfigMessage);
}

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : { auth: disabledAuthClient };
