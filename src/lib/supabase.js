import { createClient } from '@supabase/supabase-js';

// Deze waarden haal je op uit je Supabase Dashboard:
// 1. Ga naar https://supabase.com en maak een gratis account
// 2. Maak een nieuw project aan
// 3. Ga naar Settings > API
// 4. Kopieer de "Project URL" en "anon public" key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
