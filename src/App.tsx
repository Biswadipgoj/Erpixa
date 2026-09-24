import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { Sidebar, AppSwitcher } from './components/Layout/Sidebar';
import TopNav from './components/Layout/TopNav';
import { ToastContainer } from './components/ui/Toast';
import AIPanel from './components/ui/AIPanel';
import Logo from './components/ui/Logo';
import { useAuthStore, useUIStore, applyTheme } from './store';
import { useDataStore } from './store/dataStore';
import { isSupabaseConfigured } from './lib/supabase';
import { MODULES } from './lib/modules';
import { useInteractionEffects } from './lib/motion';
import Icon from './components/ui/Icon';

// Shell pages — always in the critical path, loaded eagerly.
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import OnboardingPage from './pages/OnboardingPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Module pages — code-split so each workspace only downloads what it opens.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CRMPage = lazy(() => import('./pages/CRMPage'));
const SalesPage = lazy(() => import('./pages/SalesPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const AccountingPage = lazy(() => import('./pages/AccountingPage'));
const HRPage = lazy(() => import('./pages/HRPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ManufacturingPage = lazy(() => import('./pages/ManufacturingPage'));
const HelpdeskPage = lazy(() => import('./pages/HelpdeskPage'));
const MarketingPage = lazy(() => import('./pages/MarketingPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

const PAGE_BY_MODULE: Record<string, React.ReactElement> = {
  crm: <CRMPage />,
  sales: <SalesPage />,
  inventory: <InventoryPage />,
  accounting: <AccountingPage />,
  hr: <HRPage />,
  projects: <ProjectsPage />,
  manufacturing: <ManufacturingPage />,
  helpdesk: <HelpdeskPage />,
  marketing: <MarketingPage />,
};

// ── Full-screen states ───────────────────────────────────────────────────────

function SplashScreen({ subtitle }: { subtitle: string }) {
  return (
    <div className="center-screen" role="status" aria-live="polite">
      <div className="splash">
        <Logo size={56} loop />
        <div className="splash-title">Opening the books</div>
        <div className="splash-sub">{subtitle}</div>
        <div className="splash-bar" aria-hidden="true" />
      </div>
    </div>
  );
}

/** Rendered when Supabase environment variables are missing — no demo fallback. */
function SetupRequiredScreen() {
  return (
    <div className="center-screen">
      <div className="card center-card">
        <Logo size={44} variant="paper" animate />
        <h1 style={{ fontSize: 'var(--t-2xl)', marginTop: 18 }}>Connect Erpixa to Supabase</h1>
        <p style={{ marginTop: 10 }}>
          Erpixa keeps your business data in a Supabase project. Set these environment
          variables and restart — locally in <code>.env</code>, or in your hosting
          provider&rsquo;s project settings:
        </p>
        <pre style={{ margin: '16px 0', padding: '14px 16px', background: 'var(--cover)', color: 'var(--cover-ink)', borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 'var(--t-sm)', overflowX: 'auto', lineHeight: 1.7 }}>
{`VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY`}
        </pre>
        <p style={{ fontSize: 'var(--t-sm)' }}>
          Then run <code>supabase/schema.sql</code> in the Supabase Dashboard → SQL Editor
          to create the tables. Full steps are in <code>SETUP_GUIDE.md</code>.
        </p>
      </div>
    </div>
  );
}

// ── DB error banner ──────────────────────────────────────────────────────────
function DbErrorBanner({ error, onRetry }: { error: string; onRetry: () => void }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  const lower = error.toLowerCase();
  const isSchemaError = lower.includes('does not exist') || lower.includes('42p01') || lower.includes('relation');
  return (
    <div className="banner" role="alert">
      <span className="banner-icon"><Icon name="alert" size={18} /></span>
      <div className="banner-text">
        <strong>We couldn’t load your data.</strong> {error}
        {isSchemaError && (
          <> The database tables may be out of date — run <code>supabase/schema.sql</code> in your Supabase Dashboard → SQL Editor.</>
        )}
      </div>
      <button type="button" className="btn btn-sm btn-secondary" onClick={onRetry}>Retry</button>
      <button type="button" className="icon-btn sm" onClick={() => setOpen(false)} aria-label="Dismiss"><Icon name="close" size={15} /></button>
    </div>
  );
}

/** Skeleton of a module page while its code downloads. */
function PageLoading() {
  return (
    <div aria-busy="true" aria-label="Loading page">
      <div className="skeleton" style={{ width: 120, height: 14, marginBottom: 14 }} />
      <div className="skeleton" style={{ width: 280, height: 34, marginBottom: 10 }} />
      <div className="skeleton" style={{ width: 360, maxWidth: '80%', height: 16, marginBottom: 32 }} />
      <div className="stats" style={{ marginBottom: 20 }}>
        {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 118, borderRadius: 12 }} />)}
      </div>
      <div className="skeleton" style={{ height: 320, borderRadius: 12 }} />
    </div>
  );
}

// ── Authenticated app layout with module-gated routes ────────────────────────
function AppLayout() {
  const organization = useAuthStore((s) => s.organization);
  const enabled = new Set(organization?.enabled_modules ?? []);
  const location = useLocation();

  return (
    <div className="app-layout">
      <a href="#main" className="skip-link">Skip to content</a>
      <Sidebar />
      <AppSwitcher />
      <div className="main-content">
        <TopNav />
        <main className="page-body" id="main">
          {/* Keyed by route so each page plays its entrance on navigation. */}
          <div className="page-inner" key={location.pathname}>
            <Suspense fallback={<PageLoading />}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                {MODULES.filter((m) => m.id !== 'dashboard' && enabled.has(m.id)).map((m) => (
                  <Route key={m.id} path={m.path} element={PAGE_BY_MODULE[m.id]} />
                ))}
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
      <AIPanel />
    </div>
  );
}

/**
 * AppShell — mounted for every route EXCEPT /auth/callback.
 * Owns the auth → onboarding → workspace state machine:
 *   1. Supabase not configured  → setup instructions
 *   2. Session restoring        → splash
 *   3. Signed out               → login
 *   4. Password-recovery link   → reset password
 *   5. No organization yet      → onboarding wizard
 *   6. Ready                    → the ERP
 */
function AppShell() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initialize = useAuthStore((s) => s.initialize);
  const authLoading = useAuthStore((s) => s.loading);
  const passwordRecovery = useAuthStore((s) => s.passwordRecovery);
  const organization = useAuthStore((s) => s.organization);
  const orgLoading = useAuthStore((s) => s.orgLoading);
  const fetchData = useDataStore((s) => s.fetchData);
  const resetData = useDataStore((s) => s.reset);
  const dataLoading = useDataStore((s) => s.loading);
  const dataError = useDataStore((s) => s.error);
  const theme = useUIStore((s) => s.theme);

  useInteractionEffects();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const orgId = organization?.id;
  useEffect(() => {
    if (isAuthenticated && orgId) {
      fetchData();
    } else {
      resetData();
    }
  }, [isAuthenticated, orgId, fetchData, resetData]);

  let content: React.ReactElement;
  if (!isSupabaseConfigured) content = <SetupRequiredScreen />;
  else if (authLoading) content = <SplashScreen subtitle="Connecting to your business data" />;
  else if (!isAuthenticated) content = <LoginPage />;
  else if (passwordRecovery) content = <ResetPasswordPage />;
  else if (orgLoading) content = <SplashScreen subtitle="Loading your workspace" />;
  else if (!organization) content = <OnboardingPage />;
  else if (dataLoading) content = <SplashScreen subtitle="Fetching your live figures" />;
  else {
    content = (
      <>
        {dataError && <DbErrorBanner error={dataError} onRetry={fetchData} />}
        <AppLayout />
      </>
    );
  }

  return (
    <>
      {content}
      <ToastContainer />
    </>
  );
}

/**
 * App — root component.
 *
 * /auth/callback is handled as a dedicated Route so React Router manages
 * the transition reactively and initialize() never races with the PKCE
 * code exchange.
 */
export default function App() {
  return (
    <Routes>
      {/* OAuth callback — must be isolated so initialize() never races with the exchange */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      {/* Everything else goes through AppShell which owns the auth state */}
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
}
