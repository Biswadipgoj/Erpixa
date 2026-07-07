import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const isPlaceholder = (value?: string) =>
  !value || value.includes('placeholder') || value.includes('YOUR_');

/**
 * True when real Supabase credentials are present. When false the app renders
 * a setup screen (App.tsx) — there is no demo mode and no mock data.
 */
export const isSupabaseConfigured = !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey);

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl! : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey! : 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      // Disabled so Supabase's internal _initialize() does NOT silently attempt
      // the PKCE exchange. AuthCallbackPage handles the exchange manually with
      // full error capture. Enabling this causes a race where the auto-exchange
      // consumes the one-time code before we can surface a real error message.
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  }
);

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  status: 'active' | 'suspended';
  created_at: string;
  last_sign_in?: string;
}
