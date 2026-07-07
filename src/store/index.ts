import { create } from 'zustand';
import { supabase, isSupabaseConfigured, type UserProfile } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { AppNotification, Organization, OrganizationInput, OrgRole } from '../types';

// ── Auth + Organization Store ───────────────────────────────────
interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  session: Session | null;
  supabaseUser: User | null;
  loading: boolean;
  /** Set when the user arrives via a password-recovery email link. */
  passwordRecovery: boolean;
  /** The user's organization (tenant). Null until onboarding completes. */
  organization: Organization | null;
  /** The user's role within their organization. */
  orgRole: OrgRole | null;
  /** True while the membership lookup after sign-in is still running. */
  orgLoading: boolean;
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error?: string; message?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  updateProfile: (fields: Partial<Pick<UserProfile, 'full_name' | 'avatar_url'>>) => Promise<{ error?: string }>;
  createOrganization: (input: OrganizationInput) => Promise<{ error?: string }>;
  updateOrganization: (fields: Partial<OrganizationInput>) => Promise<{ error?: string }>;
  refreshOrganization: () => Promise<void>;
  signOut: () => Promise<void>;
}

function buildProfile(user: User, dbProfile?: Partial<UserProfile> | null): UserProfile {
  return {
    id: user.id,
    email: user.email || '',
    full_name: dbProfile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
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

/** Loads the user's organization membership; returns null when not onboarded yet. */
async function fetchMembership(userId: string): Promise<{ organization: Organization; role: OrgRole } | null> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('role, organizations(*)')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (error || !data?.organizations) return null;
  const org = data.organizations as unknown as Organization;
  if ((org as { deleted_at?: string | null }).deleted_at) return null;
  return { organization: org, role: data.role as OrgRole };
}

/** Applies a session to the store; signs suspended accounts out immediately. */
async function applySession(
  session: Session,
  set: (state: Partial<AuthState>) => void
): Promise<void> {
  const profile = await fetchProfile(session.user.id);
  if (profile?.status === 'suspended') {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, user: null, session: null, supabaseUser: null, loading: false, organization: null, orgRole: null, orgLoading: false });
    useUIStore.getState().addToast({ message: 'This account has been suspended. Contact your administrator.', type: 'danger' });
    return;
  }
  set({
    isAuthenticated: true,
    session,
    supabaseUser: session.user,
    user: buildProfile(session.user, profile),
    loading: false,
    orgLoading: true,
  });
  const membership = await fetchMembership(session.user.id);
  set({
    organization: membership?.organization ?? null,
    orgRole: membership?.role ?? null,
    orgLoading: false,
  });
  if (membership) {
    useCurrencyStore.getState().setCurrencyByCode(membership.organization.currency);
    useNotificationStore.getState().fetchNotifications();
  }
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
  organization: null,
  orgRole: null,
  orgLoading: false,

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
        supabase.auth.onAuthStateChange((event, newSession) => {
          if (event === 'PASSWORD_RECOVERY') {
            set({ passwordRecovery: true });
          }
          if (event === 'SIGNED_OUT') {
            set({ isAuthenticated: false, user: null, session: null, supabaseUser: null, loading: false, organization: null, orgRole: null, orgLoading: false });
            return;
          }
          if (event === 'TOKEN_REFRESHED' && newSession) {
            // Session token rotated — keep the session fresh without refetching
            // profile and membership.
            set({ session: newSession, supabaseUser: newSession.user });
            return;
          }
          if (newSession?.user) {
            const current = get();
            // Ignore no-op events for the already-applied user (e.g. focus refetch)
            if (current.isAuthenticated && current.supabaseUser?.id === newSession.user.id) {
              set({ session: newSession });
              return;
            }
            // Defer async work out of the auth callback per supabase-js guidance.
            setTimeout(() => { applySession(newSession, set); }, 0);
          } else {
            set({ isAuthenticated: false, user: null, session: null, supabaseUser: null, loading: false, organization: null, orgRole: null, orgLoading: false });
          }
        });
      }
    } catch {
      set({ loading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  },

  signUpWithEmail: async (email, password, fullName) => {
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
    // redirectTo must point to /auth/callback so the OAuth code lands on the
    // dedicated handler that calls exchangeCodeForSession().
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) return { error: error.message };
    return {};
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // /auth/callback handles the code exchange; the PASSWORD_RECOVERY event
      // then routes the user to the reset-password screen.
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) return { error: error.message };
    return { message: 'If an account exists for that email, a reset link is on its way.' };
  },

  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    set({ passwordRecovery: false });
    return {};
  },

  updateProfile: async (fields) => {
    const current = get().user;
    if (!current) return { error: 'Not signed in.' };
    const { error } = await supabase.from('profiles').update(fields).eq('id', current.id);
    if (error) return { error: error.message };
    set({ user: { ...current, ...fields } });
    return {};
  },

  createOrganization: async (input) => {
    const { data, error } = await supabase.rpc('create_organization', {
      org_name: input.name,
      org_business_type: input.business_type,
      org_industry: input.industry,
      org_country: input.country,
      org_currency: input.currency,
      org_timezone: input.timezone,
      org_fiscal_start: input.fiscal_year_start,
      org_business_size: input.business_size,
      org_tax_scheme: input.tax_scheme,
      org_tax_id: input.tax_id,
      org_logo_url: input.logo_url,
      org_address: input.address,
      org_email: input.business_email,
      org_phone: input.phone,
      org_modules: input.enabled_modules,
    });
    if (error) return { error: error.message };
    const { data: org, error: fetchError } = await supabase
      .from('organizations').select('*').eq('id', data as string).single();
    if (fetchError) return { error: fetchError.message };
    set({ organization: org as Organization, orgRole: 'owner' });
    useCurrencyStore.getState().setCurrencyByCode((org as Organization).currency);
    return {};
  },

  updateOrganization: async (fields) => {
    const org = get().organization;
    if (!org) return { error: 'No organization loaded.' };
    const { data, error } = await supabase
      .from('organizations').update(fields).eq('id', org.id).select().single();
    if (error) return { error: error.message };
    set({ organization: data as Organization });
    if (fields.currency) useCurrencyStore.getState().setCurrencyByCode(fields.currency);
    return {};
  },

  refreshOrganization: async () => {
    const userId = get().supabaseUser?.id;
    if (!userId) return;
    const membership = await fetchMembership(userId);
    set({ organization: membership?.organization ?? null, orgRole: membership?.role ?? null });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      isAuthenticated: false, user: null, session: null, supabaseUser: null,
      passwordRecovery: false, organization: null, orgRole: null, orgLoading: false,
    });
    useNotificationStore.setState({ items: [] });
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

interface CurrencyState {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  setCurrencyByCode: (code: string) => void;
  convert: (usdAmount: number) => number;
  format: (usdAmount: number, compact?: boolean) => string;
  formatMoney: (usdAmount: number, compact?: boolean) => string;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currency: CURRENCIES[0],
  setCurrency: (c) => set({ currency: c }),
  setCurrencyByCode: (code) => {
    const found = CURRENCIES.find((c) => c.code === code);
    if (found) set({ currency: found });
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

// ── Notification Store (DB-backed, org-scoped) ──────────────────
interface NotificationState {
  items: AppNotification[];
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
}

interface NotificationRow {
  id: string;
  type: string;
  text: string;
  unread: boolean;
  created_at: string;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  loading: false,

  fetchNotifications: async () => {
    const org = useAuthStore.getState().organization;
    if (!org) return;
    set({ loading: true });
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, text, unread, created_at')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) {
      set({ loading: false });
      return;
    }
    set({
      items: ((data ?? []) as NotificationRow[]).map((n) => ({
        id: n.id, type: n.type, text: n.text, unread: n.unread, time: timeAgo(n.created_at),
      })),
      loading: false,
    });
  },

  markAllRead: async () => {
    const org = useAuthStore.getState().organization;
    if (!org) return;
    set((s) => ({ items: s.items.map((n) => ({ ...n, unread: false })) }));
    await supabase.from('notifications').update({ unread: false })
      .eq('organization_id', org.id).eq('unread', true);
  },

  markRead: async (id) => {
    set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, unread: false } : n)) }));
    await supabase.from('notifications').update({ unread: false }).eq('id', id);
  },
}));

/** Fire-and-forget helper used by the data store to log org activity. */
export async function pushNotification(type: string, text: string): Promise<void> {
  const org = useAuthStore.getState().organization;
  if (!org) return;
  const { data } = await supabase
    .from('notifications')
    .insert({ organization_id: org.id, type, text })
    .select('id, type, text, unread, created_at')
    .single();
  if (data) {
    const row = data as NotificationRow;
    useNotificationStore.setState((s) => ({
      items: [{ id: row.id, type: row.type, text: row.text, unread: row.unread, time: timeAgo(row.created_at) }, ...s.items].slice(0, 30),
    }));
  }
}
