import { create } from 'zustand';
import { supabase, isSupabaseConfigured, type UserProfile } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { notifications as seedNotifications } from '../data/mockData';
import type { AppNotification } from '../types';

// ── Auth Store ──────────────────────────────────────────────────
interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  session: Session | null;
  supabaseUser: User | null;
  loading: boolean;
  /** Set when the user arrives via a password-recovery email link. */
  passwordRecovery: boolean;
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error?: string; message?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  updateProfile: (fields: Partial<Pick<UserProfile, 'full_name' | 'company'>>) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

function buildProfile(user: User, dbProfile?: Partial<UserProfile> | null): UserProfile {
  return {
    id: user.id,
    email: user.email || '',
    full_name: dbProfile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    role: dbProfile?.role || 'user',
    company: dbProfile?.company || 'Erpixa',
    avatar_url: dbProfile?.avatar_url || user.user_metadata?.avatar_url,
    status: dbProfile?.status || 'active',
    created_at: dbProfile?.created_at || user.created_at,
    last_sign_in: user.last_sign_in_at,
  };
}

async function fetchProfile(userId: string): Promise<Partial<UserProfile> | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data;
}

/** Applies a session to the store; signs suspended accounts out immediately. */
async function applySession(
  session: Session,
  set: (state: Partial<AuthState>) => void
): Promise<void> {
  const profile = await fetchProfile(session.user.id);
  if (profile?.status === 'suspended') {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, user: null, session: null, supabaseUser: null, loading: false });
    useUIStore.getState().addToast({ message: 'This account has been suspended. Contact your administrator.', type: 'danger' });
    return;
  }
  set({
    isAuthenticated: true,
    session,
    supabaseUser: session.user,
    user: buildProfile(session.user, profile),
    loading: false,
  });
  autoDetectCurrency();
}

// Guards against duplicate onAuthStateChange subscriptions
// (React StrictMode mounts effects twice in development).
let authListenerBound = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  session: null,
  supabaseUser: null,
  loading: true,
  passwordRecovery: false,

  initialize: async () => {
    if (!isSupabaseConfigured) {
      set({ loading: false });
      return;
    }
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await applySession(session, set);
      } else {
        set({ isAuthenticated: false, user: null, session: null, loading: false });
      }
      if (!authListenerBound) {
        authListenerBound = true;
        supabase.auth.onAuthStateChange((event, session) => {
          console.log('[Auth] onAuthStateChange:', event, session?.user?.email ?? null);
          if (event === 'PASSWORD_RECOVERY') {
            set({ passwordRecovery: true });
          }
          if (event === 'SIGNED_OUT') {
            set({ isAuthenticated: false, user: null, session: null, supabaseUser: null, loading: false });
            return;
          }
          if (session?.user) {
            // Defer async work out of the auth callback per supabase-js guidance.
            setTimeout(() => { applySession(session, set); }, 0);
          } else {
            set({ isAuthenticated: false, user: null, session: null, supabaseUser: null, loading: false });
          }
        });
      }
    } catch {
      set({ loading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    if (!isSupabaseConfigured) {
      // Demo Mode — no backend; any credentials open a local sandbox session.
      if (email && password) {
        const demoUser: UserProfile = {
          id: 'demo', email, full_name: 'Demo Admin', role: 'admin',
          company: 'Erpixa', status: 'active', created_at: new Date().toISOString(),
        };
        set({ isAuthenticated: true, user: demoUser, loading: false });
        autoDetectCurrency();
        return {};
      }
      return { error: 'Enter any email and password to explore the demo.' };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  },

  signUpWithEmail: async (email, password, fullName) => {
    if (!isSupabaseConfigured) {
      return { error: 'Sign-up requires a connected backend. Use any credentials on the sign-in tab to explore the demo.' };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        // Point email confirmation link back to /auth/callback so the session
        // is properly established via code exchange, not implicit flow.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { error: error.message };
    if (!data.session) {
      return { message: 'Check your inbox — we sent you a verification link to activate your account.' };
    }
    return {};
  },

  signInWithGoogle: async () => {
    if (!isSupabaseConfigured) return { error: 'Google sign-in requires a connected backend.' };
    // redirectTo must point to /auth/callback so the OAuth code lands on the
    // dedicated handler that calls exchangeCodeForSession(). Using window.location.origin
    // (i.e. the root '/') causes a race with the LoginPage render and breaks PKCE exchange.
    const callbackUrl = `${window.location.origin}/auth/callback`;
    console.log('[Auth] Google OAuth redirectTo:', callbackUrl);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    });
    if (error) return { error: error.message };
    return {};
  },

  resetPassword: async (email) => {
    if (!isSupabaseConfigured) {
      return { error: 'Password reset requires a connected backend.' };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // /auth/callback handles the code exchange; it reads the type=recovery param
      // and the auth store's PASSWORD_RECOVERY event updates state accordingly.
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) return { error: error.message };
    return { message: 'If an account exists for that email, a reset link is on its way.' };
  },

  updatePassword: async (password) => {
    if (!isSupabaseConfigured) {
      return { error: 'Password changes require a connected backend.' };
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    set({ passwordRecovery: false });
    return {};
  },

  updateProfile: async (fields) => {
    const current = get().user;
    if (!current) return { error: 'Not signed in.' };
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('profiles').update(fields).eq('id', current.id);
      if (error) return { error: error.message };
    }
    set({ user: { ...current, ...fields } });
    return {};
  },

  signOut: async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    set({ isAuthenticated: false, user: null, session: null, supabaseUser: null, passwordRecovery: false });
  },
}));

// ── Currency Store ──────────────────────────────────────────────
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  flag: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar',          symbol: '$',   rate: 1,       flag: '🇺🇸' },
  { code: 'INR', name: 'Indian Rupee',       symbol: '₹',   rate: 83.52,   flag: '🇮🇳' },
  { code: 'EUR', name: 'Euro',               symbol: '€',   rate: 0.92,    flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound',      symbol: '£',   rate: 0.79,    flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen',       symbol: '¥',   rate: 149.8,   flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar',  symbol: 'A$',  rate: 1.54,    flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar',    symbol: 'C$',  rate: 1.36,    flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc',        symbol: 'Fr',  rate: 0.89,    flag: '🇨🇭' },
  { code: 'SGD', name: 'Singapore Dollar',   symbol: 'S$',  rate: 1.35,    flag: '🇸🇬' },
  { code: 'AED', name: 'UAE Dirham',         symbol: 'د.إ', rate: 3.67,    flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal',        symbol: '﷼',   rate: 3.75,    flag: '🇸🇦' },
  { code: 'BRL', name: 'Brazilian Real',     symbol: 'R$',  rate: 4.97,    flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso',       symbol: 'MX$', rate: 17.12,   flag: '🇲🇽' },
  { code: 'KRW', name: 'South Korean Won',   symbol: '₩',   rate: 1323.5,  flag: '🇰🇷' },
  { code: 'HKD', name: 'Hong Kong Dollar',   symbol: 'HK$', rate: 7.82,    flag: '🇭🇰' },
  { code: 'SEK', name: 'Swedish Krona',      symbol: 'kr',  rate: 10.41,   flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone',    symbol: 'kr',  rate: 10.55,   flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone',       symbol: 'kr',  rate: 6.88,    flag: '🇩🇰' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', rate: 1.63,    flag: '🇳🇿' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R',   rate: 18.63,   flag: '🇿🇦' },
];

const CURRENCY_STORAGE_KEY = 'erpixa.currency';

function loadSavedCurrency(): Currency {
  try {
    const code = localStorage.getItem(CURRENCY_STORAGE_KEY);
    const saved = CURRENCIES.find((c) => c.code === code);
    if (saved) return saved;
  } catch { /* storage unavailable (private mode) — fall through */ }
  return CURRENCIES[0];
}

interface CurrencyState {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  convert: (usdAmount: number) => number;
  format: (usdAmount: number, compact?: boolean) => string;
  formatMoney: (usdAmount: number, compact?: boolean) => string;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currency: loadSavedCurrency(),
  setCurrency: (c) => {
    set({ currency: c });
    try { localStorage.setItem(CURRENCY_STORAGE_KEY, c.code); } catch { /* ignore */ }
  },
  convert: (usdAmount) => usdAmount * get().currency.rate,
  format: (usdAmount, compact = false) => {
    const { currency, convert } = get();
    const value = convert(usdAmount);
    if (compact) {
      // INR conventionally reads in lakh/crore; everything else in K/M/B.
      if (currency.code === 'INR') {
        if (value >= 10_000_000) return `${currency.symbol}${(value / 10_000_000).toFixed(1)}Cr`;
        if (value >= 100_000)    return `${currency.symbol}${(value / 100_000).toFixed(1)}L`;
      } else {
        if (value >= 1_000_000_000) return `${currency.symbol}${(value / 1_000_000_000).toFixed(1)}B`;
        if (value >= 1_000_000)     return `${currency.symbol}${(value / 1_000_000).toFixed(1)}M`;
      }
      if (value >= 1_000) return `${currency.symbol}${(value / 1000).toFixed(0)}K`;
      return `${currency.symbol}${value.toFixed(0)}`;
    }
    return `${currency.symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  },
  formatMoney: (usdAmount, compact = false) => get().format(usdAmount, compact),
}));

/** Defaults the currency to INR for users in an Indian timezone (unless they chose one). */
function autoDetectCurrency() {
  try {
    if (localStorage.getItem(CURRENCY_STORAGE_KEY)) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') {
      const inr = CURRENCIES.find((c) => c.code === 'INR');
      if (inr) useCurrencyStore.setState({ currency: inr });
    }
  } catch { /* timezone unavailable — keep default */ }
}

// ── UI Store ────────────────────────────────────────────────────
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

interface UIState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  appSwitcherOpen: boolean;
  notifPanelOpen: boolean;
  aiPanelOpen: boolean;
  currentModule: string;
  toasts: Toast[];
  toggleSidebar: () => void;
  setMobileNavOpen: (v: boolean) => void;
  setAppSwitcherOpen: (v: boolean) => void;
  setNotifPanelOpen: (v: boolean) => void;
  setAIPanelOpen: (v: boolean) => void;
  setCurrentModule: (m: string) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

let toastId = 0;
export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  appSwitcherOpen: false,
  notifPanelOpen: false,
  aiPanelOpen: false,
  currentModule: 'Dashboard',
  toasts: [],
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileNavOpen: (v) => set({ mobileNavOpen: v }),
  setAppSwitcherOpen: (v) => set({ appSwitcherOpen: v, notifPanelOpen: false, aiPanelOpen: false }),
  setNotifPanelOpen: (v) => set({ notifPanelOpen: v, aiPanelOpen: false }),
  setAIPanelOpen: (v) => set({ aiPanelOpen: v, notifPanelOpen: false }),
  setCurrentModule: (m) => set({ currentModule: m }),
  addToast: (toast) => {
    const id = String(++toastId);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3500);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// ── Notification Store ──────────────────────────────────────────
interface NotificationState {
  items: AppNotification[];
  markAllRead: () => void;
  markRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: seedNotifications,
  markAllRead: () => set((s) => ({ items: s.items.map((n) => ({ ...n, unread: false })) })),
  markRead: (id) => set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, unread: false } : n)) })),
}));
