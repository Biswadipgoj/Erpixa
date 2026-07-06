import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore, useAuthStore } from '../../store';

const MODULES = [
  { id: 'dashboard',    path: '/',              label: 'Dashboard',     icon: '📊', color: '#7C3AED' },
  { id: 'crm',          path: '/crm',           label: 'CRM',           icon: '🎯', color: '#4F46E5' },
  { id: 'sales',        path: '/sales',         label: 'Sales',         icon: '💼', color: '#059669' },
  { id: 'inventory',    path: '/inventory',     label: 'Inventory',     icon: '📦', color: '#D97706' },
  { id: 'accounting',   path: '/accounting',    label: 'Accounting',    icon: '🧾', color: '#2563EB' },
  { id: 'hr',           path: '/hr',            label: 'Human Resources', icon: '👥', color: '#DB2777' },
  { id: 'projects',     path: '/projects',      label: 'Projects',      icon: '📋', color: '#7C3AED' },
  { id: 'manufacturing',path: '/manufacturing', label: 'Manufacturing', icon: '🏭', color: '#DC2626' },
  { id: 'helpdesk',     path: '/helpdesk',      label: 'Helpdesk',      icon: '🎫', color: '#0D9488', badge: '3' },
  { id: 'website',      path: '/website',       label: 'Website',       icon: '🌐', color: '#EA580C' },
  { id: 'marketing',    path: '/marketing',     label: 'Marketing',     icon: '📣', color: '#9333EA' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, setCurrentModule } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path: string, label: string) => {
    navigate(path);
    setCurrentModule(label);
  };

  return (
    <nav className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <span style={{ fontSize: '1.1rem' }}>✨</span>
        </div>
        {!sidebarCollapsed && (
          <div className="sidebar-wordmark">
            Buis <span>AI</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="sidebar-nav">
        <div className="sidebar-section-label">MAIN MENU</div>
        {MODULES.slice(0, 5).map(m => {
          const isActive = location.pathname === m.path;
          return (
            <div
              key={m.id}
              className={`nav-item${isActive ? ' active' : ''}`}
              onClick={() => handleNav(m.path, m.label)}
              title={sidebarCollapsed ? m.label : undefined}
            >
              <span className="nav-icon" style={{
                fontSize: '1.05rem',
                filter: isActive ? 'brightness(1.2)' : undefined,
              }}>{m.icon}</span>
              {!sidebarCollapsed && <span style={{ flex: 1 }}>{m.label}</span>}
              {!sidebarCollapsed && m.badge && (
                <span className="nav-badge">{m.badge}</span>
              )}
            </div>
          );
        })}

        <div className="sidebar-section-label">OPERATIONS</div>
        {MODULES.slice(5).map(m => {
          const isActive = location.pathname === m.path;
          return (
            <div
              key={m.id}
              className={`nav-item${isActive ? ' active' : ''}`}
              onClick={() => handleNav(m.path, m.label)}
              title={sidebarCollapsed ? m.label : undefined}
            >
              <span className="nav-icon">{m.icon}</span>
              {!sidebarCollapsed && <span style={{ flex: 1 }}>{m.label}</span>}
              {!sidebarCollapsed && m.badge && (
                <span className="nav-badge">{m.badge}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom: User + Settings */}
      <div className="sidebar-bottom">
        <div
          className={`nav-item${location.pathname === '/settings' ? ' active' : ''}`}
          onClick={() => handleNav('/settings', 'Settings')}
          title={sidebarCollapsed ? 'Settings' : undefined}
        >
          <span className="nav-icon">⚙️</span>
          {!sidebarCollapsed && <span style={{ flex: 1 }}>Settings</span>}
        </div>

        {/* Admin link — only for admins */}
        {user?.role === 'admin' && (
          <div
            className={`nav-item${location.pathname === '/admin' ? ' active' : ''}`}
            onClick={() => handleNav('/admin', 'Admin')}
            title={sidebarCollapsed ? 'Admin Panel' : undefined}
            style={{ background: location.pathname === '/admin' ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.3))' : undefined }}
          >
            <span className="nav-icon">🛡️</span>
            {!sidebarCollapsed && <span style={{ flex: 1, color: '#A78BFA' }}>Admin Panel</span>}
          </div>
        )}

        {!sidebarCollapsed && user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: 12,
            padding: '10px 12px', background: 'rgba(255,255,255,0.10)', borderRadius: 12,
          }}>
            <div style={{
              width: 34, height: 34, background: 'linear-gradient(135deg,#F59E0B,#EC4899)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              {user.email.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {(user as any).full_name || (user as any).name || 'Admin'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
              {user?.role && (
                <div style={{ fontSize: '0.65rem', color: 'rgba(167,139,250,0.9)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {user.role === 'admin' ? '👑' : user.role === 'manager' ? '🎯' : '👤'} {user.role}
                </div>
              )}
            </div>
            <button
              onClick={logout}
              title="Logout"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.50)', cursor: 'pointer', fontSize: '0.875rem', padding: 4, borderRadius: 6, transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.50)')}
            >
              ⇥
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button className="sidebar-toggle" onClick={toggleSidebar} title={sidebarCollapsed ? 'Expand' : 'Collapse'}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          {sidebarCollapsed
            ? <path d="m9 18 6-6-6-6" />
            : <path d="m15 18-6-6 6-6" />}
        </svg>
      </button>
    </nav>
  );
}

/* ─── App Switcher ─────────────────────────────────────────────── */
export function AppSwitcher() {
  const { appSwitcherOpen, setAppSwitcherOpen } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!appSwitcherOpen) return null;

  const GRAD_MAP: Record<string, string> = {
    '/':              'linear-gradient(135deg,#7C3AED,#4F46E5)',
    '/crm':           'linear-gradient(135deg,#4F46E5,#7C3AED)',
    '/sales':         'linear-gradient(135deg,#059669,#06B6D4)',
    '/inventory':     'linear-gradient(135deg,#D97706,#DC2626)',
    '/accounting':    'linear-gradient(135deg,#2563EB,#6366F1)',
    '/hr':            'linear-gradient(135deg,#DB2777,#9333EA)',
    '/projects':      'linear-gradient(135deg,#7C3AED,#2563EB)',
    '/manufacturing': 'linear-gradient(135deg,#DC2626,#EA580C)',
    '/helpdesk':      'linear-gradient(135deg,#0D9488,#06B6D4)',
    '/website':       'linear-gradient(135deg,#EA580C,#F59E0B)',
    '/marketing':     'linear-gradient(135deg,#9333EA,#DB2777)',
    '/settings':      'linear-gradient(135deg,#475569,#334155)',
  };

  return (
    <div className="app-switcher-overlay" onClick={() => setAppSwitcherOpen(false)}>
      <div className="app-switcher" onClick={e => e.stopPropagation()}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              Buis AI Modules
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Navigate to any module</div>
          </div>
          <button onClick={() => setAppSwitcherOpen(false)} style={{ background: 'var(--bg-subtle)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>✕ Close</button>
        </div>
        <div className="app-grid">
          {MODULES.map(m => (
            <div
              key={m.id}
              className={`app-item${location.pathname === m.path ? ' active-app' : ''}`}
              onClick={() => { navigate(m.path); setAppSwitcherOpen(false); }}
              style={{
                background: location.pathname === m.path ? (GRAD_MAP[m.path] + '18') : undefined,
                borderColor: location.pathname === m.path ? m.color + '44' : undefined,
              }}
            >
              <div className="app-item-icon" style={{ background: GRAD_MAP[m.path] }}>
                <span style={{ filter: 'brightness(2)' }}>{m.icon}</span>
              </div>
              <div className="app-item-name">{m.label}</div>
            </div>
          ))}
          <div
            className="app-item"
            onClick={() => { navigate('/settings'); setAppSwitcherOpen(false); }}
          >
            <div className="app-item-icon" style={{ background: GRAD_MAP['/settings'] }}>
              <span style={{ filter: 'brightness(2)' }}>⚙️</span>
            </div>
            <div className="app-item-name">Settings</div>
          </div>
        </div>
      </div>
    </div>
  );
}
