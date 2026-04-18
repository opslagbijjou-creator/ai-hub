import { createClient } from '@supabase/supabase-js';

// Deze waarden haal je op uit je Supabase Dashboard:
// 1. Ga naar https://supabase.com en maak een gratis account
// 2. Maak een nieuw project aan
// 3. Ga naar Settings > API
// 4. Kopieer de "Project URL" en "anon public" key

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseConfigMessage =
  'Supabase configuratie ontbreekt. Zet VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY in je frontend environment variables.';

const createConfigError = () => new Error(supabaseConfigMessage);
const noopUnsubscribe = () => {};

const disabledAuthClient = {
  getSession: async () => ({ data: { session: null }, error: createConfigError() }),
  setSession: async () => ({ data: { session: null, user: null }, error: createConfigError() }),
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
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : { auth: disabledAuthClient };
