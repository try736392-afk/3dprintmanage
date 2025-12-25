import { createClient, SupabaseClient } from '@supabase/supabase-js';

const LOCAL_URL_KEY = 'sb_local_url';
const LOCAL_KEY_KEY = 'sb_local_key';

let supabaseInstance: SupabaseClient | null = null;

const getUrlAndKey = () => {
  // Prioritize Local Storage (user manual input), then Env Vars
  const url = localStorage.getItem(LOCAL_URL_KEY) || process.env.SUPABASE_URL || '';
  const key = localStorage.getItem(LOCAL_KEY_KEY) || process.env.SUPABASE_KEY || '';
  return { url, key };
};

export const initializeSupabase = () => {
  const { url, key } = getUrlAndKey();
  
  if (!url || !key) {
    console.warn("Supabase credentials missing.");
    supabaseInstance = null;
    return null;
  }

  try {
    supabaseInstance = createClient(url, key);
    return supabaseInstance;
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    supabaseInstance = null;
    return null;
  }
};

// Initialize on load, but don't crash if it fails
initializeSupabase();

export const getSupabase = () => {
  if (!supabaseInstance) {
    return initializeSupabase();
  }
  return supabaseInstance;
};

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem(LOCAL_URL_KEY, url.trim());
  localStorage.setItem(LOCAL_KEY_KEY, key.trim());
  // Force re-initialization
  initializeSupabase();
};

export const isSupabaseConfigured = () => {
  const { url, key } = getUrlAndKey();
  return !!(url && key);
};

// Proxy export to allow importing 'supabase' but deferring access until needed
// This prevents crashes if imported but not used immediately, though we prefer using getSupabase()
export const supabase = new Proxy({} as SupabaseClient, {
    get: (_target, prop) => {
        const client = getSupabase();
        if (!client) {
            throw new Error("Database not configured. Please set Supabase URL and Key.");
        }
        return (client as any)[prop];
    }
});
