import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore, useAuthStore } from '../../store';
import { useDataStore } from '../../store/dataStore';
import { MODULES, MODULE_GROUPS, type ModuleDef } from '../../lib/modules';
import { stagger, useDismiss, usePresence } from '../../lib/motion';
import Icon from '../ui/Icon';
import Logo from '../ui/Logo';
import { initialsOf } from '../../lib/format';

/** Modules visible for the current organization (dashboard is always first). */
function useEnabledModules(): ModuleDef[] {
  const organization = useAuthStore((s) => s.organization);
  return useMemo(() => {
    const enabled = new Set(organization?.enabled_modules ?? []);
    return MODULES.filter((m) => m.id === 'dashboard' || enabled.has(m.id));
  }, [organization?.enabled_modules]);
}

interface NavEntry { key: string; path: string; label: string; icon: string; badge?: string }

export function Sidebar() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setCurrentModule = useUIStore((s) => s.setCurrentModule);
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const { user, organization, orgRole, signOut } = useAuthStore();
  const openTickets = useDataStore((s) => s.tickets.filter((t) => t.status !== 'Resolved').length);
  const navigate = useNavigate();
  const location = useLocation();
  const modules = useEnabledModules();
  const isAdmin = orgRole === 'owner' || orgRole === 'admin';

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileNavOpen(false); }, [location.pathname, setMobileNavOpen]);

  // "[" toggles the sidebar, like most pro tools — ignored while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== '[' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
      toggleSidebar();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [toggleSidebar]);

  const sections: { title: string; items: NavEntry[] }[] = MODULE_GROUPS.map((g) => ({
    title: g,
    items: modules.filter((m) => m.group === g).map((m) => ({
      key: m.id, path: m.path, label: m.label, icon: m.icon,
      badge: m.id === 'helpdesk' && openTickets > 0 ? String(openTickets) : undefined,
    })),
  })).filter((s) => s.items.length > 0);
  sections.push({
    title: 'Workspace',
    items: [
      { key: 'settings', path: '/settings', label: 'Settings', icon: 'settings' },
      ...(isAdmin ? [{ key: 'admin', path: '/admin', label: 'Team & access', icon: 'admin' }] : []),
    ],
  });

  // The ribbon indicator glides to whichever item matches the route.
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ y: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = listRef.current?.querySelector<HTMLElement>('.nav-item.active');
      setIndicator(el ? { y: el.offsetTop, h: el.offsetHeight } : null);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (listRef.current) ro.observe(listRef.current);
    return () => ro.disconnect();
  }, [location.pathname, sidebarCollapsed, modules.length, isAdmin]);

  const go = (entry: NavEntry) => {
    navigate(entry.path);
    setCurrentModule(entry.label);
  };

  const initials = user ? initialsOf(user.full_name, user.email) : '?';
  let navIndex = 0;

  return (
    <>
      {mobileNavOpen && <div className="sidebar-scrim" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />}
      <nav
        className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}${mobileNavOpen ? ' open' : ''}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-brand">
          {organization?.logo_url ? (
            <img src={organization.logo_url} alt="" width={32} height={32} style={{ borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <Logo size={32} animate />
          )}
          <div className="sidebar-brand-text">
            <div className="sidebar-wordmark">Erpixa</div>
            {organization && <div className="sidebar-org truncate">{organization.name}</div>}
          </div>
        </div>

        <div className="sidebar-nav">
          <div className="nav-list" ref={listRef}>
            <span
              className="nav-indicator"
              aria-hidden="true"
              style={{
                transform: `translateY(${indicator?.y ?? 0}px)`,
                height: indicator?.h ?? 38,
                opacity: indicator ? 1 : 0,
              }}
            />
            {sections.map((section) => (
              <div key={section.title} role="group" aria-label={section.title} style={{ display: 'contents' }}>
                <div className="nav-group-label" aria-hidden="true">{section.title}</div>
                {section.items.map((entry) => {
                  const isActive = location.pathname === entry.path;
                  const order = navIndex++;
                  return (
                    <button
                      key={entry.key}
                      type="button"
                      className={`nav-item${isActive ? ' active' : ''}`}
                      onClick={() => go(entry)}
                      title={sidebarCollapsed ? entry.label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      style={stagger(order)}
                    >
                      <span className="nav-icon"><Icon name={entry.icon} size={18} /></span>
                      <span className="nav-label">{entry.label}</span>
                      {entry.badge && <span className="nav-badge" aria-label={`${entry.badge} open`}>{entry.badge}</span>}
                      {entry.badge && <span className="nav-dot" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-foot">
          <button
            type="button"
            className="nav-item sidebar-collapse"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={`${sidebarCollapsed ? 'Expand' : 'Collapse'} sidebar  [`}
          >
            <span className="nav-icon"><Icon name="chevrons-left" size={18} /></span>
            <span className="nav-label">Collapse</span>
            <kbd className="nav-label" style={{ flex: 'none', background: 'transparent', color: 'var(--cover-ink-2)', borderColor: 'var(--cover-rule)' }}>[</kbd>
          </button>

          {user && (
            <div className="sidebar-user" title={sidebarCollapsed ? `${user.full_name} · ${orgRole ?? ''}` : undefined}>
              <span className="avatar avatar-md filled avatar-ring" style={{ background: 'var(--cover-3)', color: 'var(--cover-ink)' }} aria-hidden="true">
                {user.avatar_url ? <img src={user.avatar_url} alt="" /> : initials}
              </span>
              <div className="sidebar-user-meta">
                <div className="sidebar-user-name truncate">{user.full_name}</div>
                <div className="sidebar-user-role truncate">{orgRole ?? user.email}</div>
              </div>
              <button type="button" onClick={signOut} title="Sign out" aria-label="Sign out" className="sidebar-signout">
                <Icon name="logout" size={16} />
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

/* ─── App Switcher ─────────────────────────────────────────────── */
export function AppSwitcher() {
  const appSwitcherOpen = useUIStore((s) => s.appSwitcherOpen);
  const setAppSwitcherOpen = useUIStore((s) => s.setAppSwitcherOpen);
  const setCurrentModule = useUIStore((s) => s.setCurrentModule);
  const navigate = useNavigate();
  const location = useLocation();
  const modules = useEnabledModules();
  const panelRef = useRef<HTMLDivElement>(null);
  const { mounted, closing } = usePresence(appSwitcherOpen, 180);
  useDismiss(panelRef, appSwitcherOpen, () => setAppSwitcherOpen(false));

  if (!mounted) return null;

  const go = (path: string, label: string) => {
    navigate(path);
    setCurrentModule(label);
    setAppSwitcherOpen(false);
  };

  const items = [...modules.map((m) => ({ path: m.path, label: m.label, icon: m.icon })), { path: '/settings', label: 'Settings', icon: 'settings' }];

  return (
    <div className={`switcher-backdrop${closing ? ' is-closing' : ''}`} role="presentation">
      <div ref={panelRef} className="switcher" role="dialog" aria-modal="true" aria-labelledby="switcher-title">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 id="switcher-title" style={{ fontSize: 'var(--t-xl)' }}>Jump to a module</h2>
            <p style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-3)', marginTop: 2 }}>Everything enabled for this workspace.</p>
          </div>
          <button type="button" onClick={() => setAppSwitcherOpen(false)} className="icon-btn" aria-label="Close module switcher">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="switcher-grid">
          {items.map((m, i) => (
            <button
              key={m.path}
              type="button"
              className={`switcher-item${location.pathname === m.path ? ' current' : ''}`}
              onClick={() => go(m.path, m.label)}
              style={stagger(i)}
            >
              <span className="switcher-icon"><Icon name={m.icon} size={22} /></span>
              <span className="switcher-name">{m.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
