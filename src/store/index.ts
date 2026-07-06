import { create } from 'zustand';
import { supabase, type UserProfile } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { crmLeads as mockLeads, crmStages as mockStages } from '../data/mockData';

// ── Auth Store ──────────────────────────────────────────────────
interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  session: Session | null;
  supabaseUser: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  logout: () => void;
  // legacy compat
  login: (email: string, password: string) => boolean;
}

function buildProfile(user: User, dbProfile?: Partial<UserProfile> | null): UserProfile {
  return {
    id: user.id,
    email: user.email || '',
    full_name: dbProfile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    role: dbProfile?.role || 'user',
    company: dbProfile?.company || 'Buis AI Corp',
    avatar_url: dbProfile?.avatar_url || user.user_metadata?.avatar_url,
    status: dbProfile?.status || 'active',
    created_at: dbProfile?.created_at || user.created_at,
    last_sign_in: user.last_sign_in_at,
  };
}

const isSupabaseConfigured = () =>
  !!import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder') && !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_');

// Helper to auto-detect timezone and set currency to INR for India
function autoDetectCurrency() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') {
      const inr = CURRENCIES.find(c => c.code === 'INR');
      if (inr) useCurrencyStore.getState().setCurrency(inr);
    }
  } catch (e) {
    console.warn('Could not auto-detect timezone', e);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  session: null,
  supabaseUser: null,
  loading: true,

  initialize: async () => {
    set({ loading: true });
    if (!isSupabaseConfigured()) {
      set({ loading: false });
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        set({ isAuthenticated: true, session, supabaseUser: session.user, user: buildProfile(session.user, profile), loading: false });
        autoDetectCurrency();
      } else {
        set({ isAuthenticated: false, user: null, session: null, loading: false });
      }
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          set({ isAuthenticated: true, session, supabaseUser: session.user, user: buildProfile(session.user, profile), loading: false });
          autoDetectCurrency();
        } else {
          set({ isAuthenticated: false, user: null, session: null, supabaseUser: null, loading: false });
        }
      });
    } catch {
      set({ loading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    if (!isSupabaseConfigured()) {
      // Demo mode fallback
      if (email && password) {
        const demoUser: UserProfile = {
          id: 'demo', email, full_name: 'Demo Admin', role: 'admin',
          company: 'Buis AI Corp', status: 'active', created_at: new Date().toISOString(),
        };
        set({ isAuthenticated: true, user: demoUser, loading: false });
        autoDetectCurrency();
        return {};
      }
      return { error: 'Enter any email and password to continue.' };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  },

  signInWithGoogle: async () => {
    if (!isSupabaseConfigured()) return { error: 'Supabase not configured yet.' };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) return { error: error.message };
    return {};
  },

  signOut: async () => {
    if (isSupabaseConfigured()) await supabase.auth.signOut();
    set({ isAuthenticated: false, user: null, session: null, supabaseUser: null });
  },

  logout: () => { get().signOut(); },
  login: (email, password) => {
    get().signInWithEmail(email, password).then(r => {
      if (r.error) console.warn(r.error);
    });
    return true; // optimistic for legacy compat
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
  { code: 'USD', name: 'US Dollar',         symbol: '$',   rate: 1,       flag: '🇺🇸' },
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

interface CurrencyState {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  convert: (usdAmount: number) => number;
  format: (usdAmount: number, compact?: boolean) => string;
  formatMoney: (usdAmount: number, compact?: boolean) => string;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currency: CURRENCIES[0],
  setCurrency: (c) => set({ currency: c }),
  convert: (usdAmount) => usdAmount * get().currency.rate,
  format: (usdAmount, compact = false) => {
    const { currency, convert } = get();
    const value = convert(usdAmount);
    if (compact) {
      if (value >= 10_000_000) return `${currency.symbol}${(value / 10_000_000).toFixed(1)}Cr`;
      if (value >= 100_000)    return `${currency.symbol}${(value / 100_000).toFixed(1)}L`;
      if (value >= 1_000_000)  return `${currency.symbol}${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000)      return `${currency.symbol}${(value / 1000).toFixed(0)}K`;
      return `${currency.symbol}${value.toFixed(0)}`;
    }
    return `${currency.symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  },
  formatMoney: (usdAmount, compact = false) => get().format(usdAmount, compact),
}));

// ── UI Store ────────────────────────────────────────────────────
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

interface UIState {
  sidebarCollapsed: boolean;
  appSwitcherOpen: boolean;
  notifPanelOpen: boolean;
  aiPanelOpen: boolean;
  currentModule: string;
  toasts: Toast[];
  toggleSidebar: () => void;
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
  appSwitcherOpen: false,
  notifPanelOpen: false,
  aiPanelOpen: false,
  currentModule: 'Dashboard',
  toasts: [],
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
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

// ── CRM Store ───────────────────────────────────────────────────
interface CRMState {
  leads: typeof mockLeads;
  stages: typeof mockStages;
  moveLead: (leadId: string, stageId: string) => void;
}

export const useCRMStore = create<CRMState>((set) => ({
  leads: mockLeads,
  stages: mockStages,
  moveLead: (leadId, stageId) =>
    set((s) => ({ leads: s.leads.map((l) => (l.id === leadId ? { ...l, stage: stageId } : l)) })),
}));
