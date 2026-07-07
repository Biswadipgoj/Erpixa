import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sidebar, AppSwitcher } from './components/Layout/Sidebar';
import TopNav from './components/Layout/TopNav';
import { ToastContainer } from './components/ui/Toast';
import AIPanel from './components/ui/AIPanel';
import { useAuthStore } from './store';
import { useDataStore } from './store/dataStore';
import { isSupabaseConfigured } from './lib/supabase';
import { MODULES } from './lib/modules';

// Pages
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import OnboardingPage from './pages/OnboardingPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CRMPage from './pages/CRMPage';
import SalesPage from './pages/SalesPage';
import InventoryPage from './pages/InventoryPage';
import AccountingPage from './pages/AccountingPage';
import HRPage from './pages/HRPage';
import ProjectsPage from './pages/ProjectsPage';
import ManufacturingPage from './pages/ManufacturingPage';
import HelpdeskPage from './pages/HelpdeskPage';
import MarketingPage from './pages/MarketingPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';

// Domain-Specific Pages
import POSPage from './pages/POSPage';
import KitchenPage from './pages/KitchenPage';
import TablesPage from './pages/TablesPage';
import MenuPage from './pages/MenuPage';
import DeliveryPage from './pages/DeliveryPage';
import ReservationsPage from './pages/ReservationsPage';
import BOMPage from './pages/BOMPage';
import MRPPage from './pages/MRPPage';
import FactoryPage from './pages/FactoryPage';
import MachinesPage from './pages/MachinesPage';
import PurchasePage from './pages/PurchasePage';
import WarehousePage from './pages/WarehousePage';
import ClientsPage from './pages/ClientsPage';
import DocumentsPage from './pages/DocumentsPage';

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
  
  pos: <POSPage />,
  kitchen: <KitchenPage />,
  tables: <TablesPage />,
  menu: <MenuPage />,
  delivery: <DeliveryPage />,
  reservations: <ReservationsPage />,
  
  bom: <BOMPage />,
  mrp: <MRPPage />,
  factory: <FactoryPage />,
  machines: <MachinesPage />,
  purchase: <PurchasePage />,
  warehouse: <WarehousePage />,
  
  clients: <ClientsPage />,
  documents: <DocumentsPage />,
};

// ── Full-screen states ───────────────────────────────────────────────────────

function SplashScreen({ subtitle }: { subtitle: string }) {
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', color: 'var(--text-primary)', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--grad-ai)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: 'var(--shadow-ai)', animation: 'spin 1.5s linear infinite' }}>✨</div>
      <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem' }}>Loading Erpixa…</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{subtitle}</div>
    </div>
  );
}

/** Rendered when Supabase environment variables are missing — no demo fallback. */
function SetupRequiredScreen() {
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 24 }}>
      <div className="card" style={{ maxWidth: 560, padding: 32 }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }} aria-hidden="true">🔌</div>
        <h1 style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0 }}>
          Connect Erpixa to Supabase
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 12 }}>
          Erpixa needs a Supabase project to store your business data. Set these
          environment variables and restart (locally in <code>.env</code>, or in your
          hosting provider&rsquo;s project settings):
        </p>
        <pre style={{ background: 'var(--bg-subtle)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '14px 16px', fontSize: '0.8rem', overflowX: 'auto' }}>
{`VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY`}
        </pre>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Then run <code>supabase/schema.sql</code> in the Supabase Dashboard → SQL Editor
          to create the tables. Full instructions are in <code>SETUP_GUIDE.md</code>.
        </p>
      </div>
    </div>
  );
}

// ── DB error banner ──────────────────────────────────────────────────────────
function DbErrorBanner({ error, onRetry }: { error: string; onRetry: () => void }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  const isSchemaError = error.toLowerCase().includes('does not exist') ||
    error.toLowerCase().includes('42p01') ||
    error.toLowerCase().includes('relation');
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #7C2D12, #991B1B)',
      borderBottom: '1px solid rgba(239,68,68,0.5)',
      padding: '10px 20px', display: 'flex', alignItems: 'center',
      gap: 12, fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: '#FEE2E2',
    }}>
      <span style={{ fontSize: '1rem' }} aria-hidden="true">⚠️</span>
      <span style={{ flex: 1, lineHeight: 1.5 }}>
        <strong>Database error:</strong> {error}
        {isSchemaError && (
          <> — The database tables may be out of date. Run <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: 4 }}>supabase/schema.sql</code> in your <strong>Supabase Dashboard → SQL Editor</strong>.</>
        )}
      </span>
      <button
        onClick={onRetry}
        style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, color: '#fff', padding: '4px 12px', cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
      >↻ Retry</button>
      <button
        onClick={() => setOpen(false)}
        aria-label="Dismiss"
        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 4px' }}
      >✕</button>
    </div>
  );
}

// ── Authenticated app layout with module-gated routes ────────────────────────
function AppLayout() {
  const organization = useAuthStore((s) => s.organization);
  const enabled = new Set(organization?.enabled_modules ?? []);

  return (
    <div className="app-layout">
      <Sidebar />
      <AppSwitcher />
      <div className="main-content">
        <TopNav />
        <main className="page-body">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            {MODULES.filter((m) => m.id !== 'dashboard' && enabled.has(m.id)).map((m) => (
              <Route key={m.id} path={m.path} element={PAGE_BY_MODULE[m.id]} />
            ))}
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
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
  else if (dataLoading) content = <SplashScreen subtitle="Fetching your live data" />;
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
