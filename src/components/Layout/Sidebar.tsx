import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore, useAuthStore } from '../../store';
import { useDataStore } from '../../store/dataStore';
import { MODULES, SETTINGS_GRADIENT } from '../../lib/modules';

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, setCurrentModule, mobileNavOpen, setMobileNavOpen } = useUIStore();
  const { user, signOut } = useAuthStore();
  const openTickets = useDataStore((s) => s.tickets.filter((t) => t.status !== 'Resolved').length);
  const navigate = useNavigate();
  const location = useLocation();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileNavOpen(false); }, [location.pathname, setMobileNavOpen]);

  const handleNav = (path: string, label: string) => {
    navigate(path);
    setCurrentModule(label);
  };

  const renderItem = (m: (typeof MODULES)[number]) => {
    const isActive = location.pathname === m.path;
    const badge = m.id === 'helpdesk' && openTickets > 0 ? String(openTickets) : undefined;
    return (
      <button
        key={m.id}
        type="button"
        className={`nav-item${isActive ? ' active' : ''}`}
        onClick={() => handleNav(m.path, m.label)}
        title={sidebarCollapsed ? m.label : undefined}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className="nav-icon" aria-hidden="true">{m.icon}</span>
        {!sidebarCollapsed && <span style={{ flex: 1, textAlign: 'left' }}>{m.label}</span>}
        {!sidebarCollapsed && badge && <span className="nav-badge">{badge}</span>}
      </button>
    );
  };

  return (
    <>
      {mobileNavOpen && <div className="sidebar-scrim" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />}
      <nav
        className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}${mobileNavOpen ? ' open' : ''}`}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark" aria-hidden="true">
            <span style={{ fontSize: '1.1rem' }}>✨</span>
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-wordmark">
              Erp<span>ixa</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          {MODULES.slice(0, 5).map(renderItem)}

          <div className="sidebar-section-label">Operations</div>
          {MODULES.slice(5).map(renderItem)}
        </div>

        {/* Bottom: Settings + Admin + User */}
        <div className="sidebar-bottom">
          <button
            type="button"
            className={`nav-item${location.pathname === '/settings' ? ' active' : ''}`}
            onClick={() => handleNav('/settings', 'Settings')}
            title={sidebarCollapsed ? 'Settings' : undefined}
            aria-current={location.pathname === '/settings' ? 'page' : undefined}
          >
            <span className="nav-icon" aria-hidden="true">⚙️</span>
            {!sidebarCollapsed && <span style={{ flex: 1, textAlign: 'left' }}>Settings</span>}
          </button>

          {user?.role === 'admin' && (
            <button
              type="button"
              className={`nav-item${location.pathname === '/admin' ? ' active' : ''}`}
              onClick={() => handleNav('/admin', 'Admin')}
              title={sidebarCollapsed ? 'Admin Panel' : undefined}
              aria-current={location.pathname === '/admin' ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">🛡️</span>
              {!sidebarCollapsed && <span style={{ flex: 1, textAlign: 'left', color: '#C4B5FD' }}>Admin Panel</span>}
            </button>
          )}

          {!sidebarCollapsed && user && (
            <div className="sidebar-user-card">
              <div className="sidebar-user-avatar" aria-hidden="true">
                {user.email.substring(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div className="sidebar-user-name">{user.full_name}</div>
                <div className="sidebar-user-email">{user.email}</div>
                <div className="sidebar-user-role">{user.role}</div>
              </div>
              <button
                type="button"
                onClick={signOut}
                title="Sign out"
                aria-label="Sign out"
                className="sidebar-signout-btn"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            {sidebarCollapsed ? <path d="m9 18 6-6-6-6" /> : <path d="m15 18-6-6 6-6" />}
          </svg>
        </button>
      </nav>
    </>
  );
}

/* ─── App Switcher ─────────────────────────────────────────────── */
export function AppSwitcher() {
  const { appSwitcherOpen, setAppSwitcherOpen } = useUIStore();
  const setCurrentModule = useUIStore((s) => s.setCurrentModule);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!appSwitcherOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAppSwitcherOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [appSwitcherOpen, setAppSwitcherOpen]);

  if (!appSwitcherOpen) return null;

  const go = (path: string, label: string) => {
    navigate(path);
    setCurrentModule(label);
    setAppSwitcherOpen(false);
  };

  return (
    <div className="app-switcher-overlay" onClick={() => setAppSwitcherOpen(false)} role="presentation">
      <div className="app-switcher" role="dialog" aria-modal="true" aria-label="Module switcher" onClick={(e) => e.stopPropagation()}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              Erpixa Modules
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Navigate to any module</div>
          </div>
          <button
            type="button"
            onClick={() => setAppSwitcherOpen(false)}
            style={{ background: 'var(--bg-subtle)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            ✕ Close
          </button>
        </div>
        <div className="app-grid">
          {MODULES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`app-item${location.pathname === m.path ? ' active-app' : ''}`}
              onClick={() => go(m.path, m.label)}
              style={{ borderColor: location.pathname === m.path ? m.color + '44' : undefined }}
            >
              <div className="app-item-icon" style={{ background: m.gradient }} aria-hidden="true">
                <span style={{ filter: 'brightness(2)' }}>{m.icon}</span>
              </div>
              <div className="app-item-name">{m.label}</div>
            </button>
          ))}
          <button type="button" className="app-item" onClick={() => go('/settings', 'Settings')}>
            <div className="app-item-icon" style={{ background: SETTINGS_GRADIENT }} aria-hidden="true">
              <span style={{ filter: 'brightness(2)' }}>⚙️</span>
            </div>
            <div className="app-item-name">Settings</div>
          </button>
        </div>
      </div>
    </div>
  );
}
