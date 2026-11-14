import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://kltufmxoxxepetmjzxgq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_QJu09tSQYPS3npD4UFP0nQ_JCAoY4N3';

function normalizeBaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return DEFAULT_SUPABASE_URL;
  return rawUrl.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

const supabaseUrl = normalizeBaseUrl(
  import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
);

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY
).trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export { supabaseUrl };
