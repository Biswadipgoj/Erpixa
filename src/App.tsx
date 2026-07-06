import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar, AppSwitcher } from './components/Layout/Sidebar';
import TopNav from './components/Layout/TopNav';
import { ToastContainer } from './components/ui/Toast';
import AIPanel from './components/ui/AIPanel';
import { useAuthStore } from './store';
import { useDataStore } from './store/dataStore';
import { useEffect } from 'react';

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

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initialize = useAuthStore((s) => s.initialize);
  const fetchData = useDataStore((s) => s.fetchData);
  const loading = useDataStore((s) => s.loading);
  const authLoading = useAuthStore((s) => s.loading);

  useEffect(() => {
    // Initialize Supabase auth session
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // /auth/callback must ALWAYS be accessible regardless of auth state.
  // It handles the OAuth code exchange before any session exists.
  if (typeof window !== 'undefined' && window.location.pathname === '/auth/callback') {
    return <AuthCallbackPage />;
  }

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
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Connecting to your business data</div>
      </div>
    );
  }

  return isAuthenticated ? <AppLayout /> : <LoginPage />;
}
