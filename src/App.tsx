import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar, AppSwitcher } from './components/Layout/Sidebar';
import TopNav from './components/Layout/TopNav';
import { ToastContainer } from './components/ui/Toast';
import AIPanel from './components/ui/AIPanel';
import { useAuthStore } from './store';
import { useDataStore } from './store/dataStore';
import { useEffect, useState } from 'react';

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
      <span style={{ fontSize: '1rem' }}>⚠️</span>
      <span style={{ flex: 1, lineHeight: 1.5 }}>
        <strong>Database error:</strong> {error}
        {isSchemaError && (
          <> — The database tables may not exist yet. Run <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: 4 }}>supabase/schema.sql</code> in your <strong>Supabase Dashboard → SQL Editor</strong>.</>
        )}
      </span>
      <button
        onClick={onRetry}
        style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, color: '#fff', padding: '4px 12px', cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
      >↻ Retry</button>
      <button
        onClick={() => setOpen(false)}
        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 4px' }}
      >✕</button>
    </div>
  );
}

function DemoModeBadge() {
  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 9000,
      background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
      borderRadius: 20, padding: '6px 14px',
      fontSize: '0.72rem', fontFamily: 'Inter, sans-serif',
      color: '#fff', fontWeight: 600, letterSpacing: '0.02em',
      boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
      pointerEvents: 'none',
    }}>
      🎭 Demo Mode — Connect Supabase to use live data
    </div>
  );
}

// Pages
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
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

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <AppSwitcher />
      <div className="main-content">
        <TopNav />
        <main className="page-body">
          <Routes>
            <Route path="/"              element={<DashboardPage />} />
            <Route path="/crm"           element={<CRMPage />} />
            <Route path="/sales"         element={<SalesPage />} />
            <Route path="/inventory"     element={<InventoryPage />} />
            <Route path="/accounting"    element={<AccountingPage />} />
            <Route path="/hr"            element={<HRPage />} />
            <Route path="/projects"      element={<ProjectsPage />} />
            <Route path="/manufacturing" element={<ManufacturingPage />} />
            <Route path="/helpdesk"      element={<HelpdeskPage />} />
            <Route path="/marketing"     element={<MarketingPage />} />
            <Route path="/settings"      element={<SettingsPage />} />
            <Route path="/admin"         element={<AdminPage />} />
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <ToastContainer />
      <AIPanel />
    </div>
  );
}

/**
 * AppShell — mounted for every route EXCEPT /auth/callback.
 * Runs initialize() to restore any existing Supabase session.
 */
function AppShell() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initialize = useAuthStore((s) => s.initialize);
  const fetchData = useDataStore((s) => s.fetchData);
  const loading = useDataStore((s) => s.loading);
  const authLoading = useAuthStore((s) => s.loading);
  const dataError = useDataStore((s) => s.error);
  const isDemo = useDataStore((s) => s.isDemo);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', color: 'var(--text-primary)', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--grad-ai)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: 'var(--shadow-ai)', animation: 'spin 1.5s linear infinite' }}>✨</div>
        <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem' }}>Loading Erpixa…</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Connecting to your business data</div>
      </div>
    );
  }

  if (isAuthenticated && loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', color: 'var(--text-primary)', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--grad-ai)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: 'var(--shadow-ai)', animation: 'spin 1.5s linear infinite' }}>✨</div>
        <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem' }}>Loading Erpixa…</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fetching your live data</div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return (
    <>
      {dataError && <DbErrorBanner error={dataError} onRetry={fetchData} />}
      {isDemo && <DemoModeBadge />}
      <AppLayout />
    </>
  );
}


/**
 * App — root component.
 *
 * /auth/callback is handled as a dedicated Route so React Router manages
 * the transition reactively. When AuthCallbackPage calls
 * window.location.replace('/') after a successful exchange, the browser
 * does a clean navigation, AppShell mounts, initialize() finds the new
 * session in localStorage, and the real user data loads.
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
