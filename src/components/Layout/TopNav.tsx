import { useState, useRef, useEffect, useMemo, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUIStore, useAuthStore, useNotificationStore } from '../../store';
import { useDataStore } from '../../store/dataStore';
import { MODULES } from '../../lib/modules';
import { initialsOf } from '../../lib/format';
import { useResolvedTheme } from '../../lib/theme';
import { stagger, useDismiss, usePresence, useReducedMotion } from '../../lib/motion';
import CurrencySelector from '../ui/CurrencySelector';
import Icon from '../ui/Icon';

const NOTIF_ICONS: Record<string, string> = {
  lead: 'crm', invoice: 'accounting', task: 'check', ticket: 'helpdesk', info: 'bell',
};

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

interface SearchHit {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  path: string;
  module: string;
}

/** Searches the loaded org data across every module the org has enabled. */
function useGlobalSearch(query: string): SearchHit[] {
  const { leads, salesOrders, products, invoices, employees, projects, tickets, customers, suppliers } = useDataStore();
  const organization = useAuthStore((s) => s.organization);

  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const enabled = new Set(organization?.enabled_modules ?? []);
    const hits: SearchHit[] = [];
    const push = (moduleId: string, hit: Omit<SearchHit, 'module'>) => {
      if (enabled.has(moduleId)) hits.push({ ...hit, module: moduleId });
    };

    for (const l of leads) {
      if (l.name.toLowerCase().includes(q) || l.partner.toLowerCase().includes(q)) {
        push('crm', { id: l.id, label: l.name, sublabel: l.partner || 'Lead', icon: 'crm', path: '/crm' });
      }
    }
    for (const o of salesOrders) {
      if (o.customer.toLowerCase().includes(q) || o.number.toLowerCase().includes(q)) {
        push('sales', { id: o.id, label: o.number || o.customer, sublabel: o.customer, icon: 'sales', path: '/sales' });
      }
    }
    for (const c of customers) {
      if (c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) {
        push('sales', { id: c.id, label: c.name, sublabel: c.email || 'Customer', icon: 'user', path: '/sales' });
      }
    }
    for (const p of products) {
      if (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) {
        push('inventory', { id: p.id, label: p.name, sublabel: p.category || p.sku || 'Product', icon: 'inventory', path: '/inventory' });
      }
    }
    for (const s of suppliers) {
      if (s.name.toLowerCase().includes(q)) {
        push('inventory', { id: s.id, label: s.name, sublabel: 'Supplier', icon: 'truck', path: '/inventory' });
      }
    }
    for (const i of invoices) {
      if (i.customer.toLowerCase().includes(q) || i.number.toLowerCase().includes(q)) {
        push('accounting', { id: i.id, label: i.number || i.customer, sublabel: i.customer, icon: 'accounting', path: '/accounting' });
      }
    }
    for (const e of employees) {
      if (e.name.toLowerCase().includes(q) || e.dept.toLowerCase().includes(q)) {
        push('hr', { id: e.id, label: e.name, sublabel: e.role || e.dept || 'Employee', icon: 'hr', path: '/hr' });
      }
    }
    for (const p of projects) {
      if (p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q)) {
        push('projects', { id: p.id, label: p.name, sublabel: p.client || 'Project', icon: 'projects', path: '/projects' });
      }
    }
    for (const t of tickets) {
      if (t.title.toLowerCase().includes(q) || t.customer.toLowerCase().includes(q)) {
        push('helpdesk', { id: t.id, label: t.title, sublabel: t.customer || 'Ticket', icon: 'helpdesk', path: '/helpdesk' });
      }
    }
    return hits.slice(0, 8);
  }, [query, leads, salesOrders, products, invoices, employees, projects, tickets, customers, suppliers, organization?.enabled_modules]);
}

/** Wraps the matched part of `text` in <mark>. */
function highlight(text: string, query: string): ReactNode {
  const q = query.trim();
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (at < 0) return text;
  return <>{text.slice(0, at)}<mark>{text.slice(at, at + q.length)}</mark>{text.slice(at + q.length)}</>;
}

function CommandSearch() {
  const navigate = useNavigate();
  const setCurrentModule = useUIStore((s) => s.setCurrentModule);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useGlobalSearch(query);
  const showPanel = open && query.trim().length >= 2;
  const { mounted, closing } = usePresence(showPanel, 140);
  useDismiss(wrapRef, open, () => setOpen(false));

  // ⌘K / Ctrl+K or "/" jumps to search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]');
      if ((e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const openHit = (hit: SearchHit) => {
    navigate(hit.path);
    setCurrentModule(MODULES.find((m) => m.path === hit.path)?.label ?? 'Dashboard');
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); openHit(results[active]); }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  const activeId = results[active] ? `hit-${results[active].module}-${results[active].id}` : undefined;

  return (
    <div ref={wrapRef} className="search">
      <div className="search-field">
        <Icon name="search" size={16} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search…"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="search-results"
          aria-activedescendant={showPanel ? activeId : undefined}
          aria-autocomplete="list"
          aria-label="Search leads, orders, products, invoices and more"
        />
        <span className="search-kbd" aria-hidden="true"><kbd>{isMac ? '⌘' : 'Ctrl'}</kbd><kbd>K</kbd></span>
      </div>
      {mounted && (
        <div className={`pop origin-left search-results${closing ? ' is-closing' : ''}`}>
          <div id="search-results" role="listbox" aria-label="Search results">
            {results.length === 0 ? (
              <div className="search-empty">Nothing matches “{query.trim()}” in this workspace.</div>
            ) : results.map((hit, i) => (
              <button
                key={`${hit.module}-${hit.id}`}
                id={`hit-${hit.module}-${hit.id}`}
                type="button"
                role="option"
                aria-selected={i === active}
                className="search-hit menu-item"
                style={stagger(i)}
                onMouseEnter={() => setActive(i)}
                onClick={() => openHit(hit)}
              >
                <span className="search-hit-icon" aria-hidden="true"><Icon name={hit.icon} size={16} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="truncate" style={{ display: 'block', fontWeight: 500 }}>{highlight(hit.label, query)}</span>
                  <span className="truncate" style={{ display: 'block', fontSize: 'var(--t-xs)', color: 'var(--ink-3)' }}>{highlight(hit.sublabel, query)}</span>
                </span>
                <span className="search-hit-go" aria-hidden="true"><Icon name="corner-down-left" size={15} /></span>
              </button>
            ))}
          </div>
          {results.length > 0 && (
            <div className="search-foot" aria-hidden="true">
              <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
              <span><kbd>↵</kbd> open</span>
              <span><kbd>esc</kbd> close</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const resolved = useResolvedTheme(theme);
  const reduced = useReducedMotion();

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = resolved === 'dark' ? 'light' : 'dark';
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    if (!doc.startViewTransition || reduced) { setTheme(next); return; }
    // Ink spreads from the button: a circular reveal of the new theme.
    const x = e.clientX || window.innerWidth - 40;
    const y = e.clientY || 30;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const t = doc.startViewTransition(() => { flushSync(() => setTheme(next)); });
    t.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 620, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => { /* transition skipped */ });
  };

  return (
    <button
      type="button"
      className="icon-btn theme-toggle"
      data-mode={resolved}
      onClick={toggle}
      aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} theme`}
      title={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} theme`}
    >
      <Icon name="sun" size={18} className="ico-sun" />
      <Icon name="moon" size={17} className="ico-moon" />
    </button>
  );
}

function Notifications() {
  const notifPanelOpen = useUIStore((s) => s.notifPanelOpen);
  const setNotifPanelOpen = useUIStore((s) => s.setNotifPanelOpen);
  const notifications = useNotificationStore((s) => s.items);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const markRead = useNotificationStore((s) => s.markRead);
  const ref = useRef<HTMLDivElement>(null);
  const { mounted, closing } = usePresence(notifPanelOpen, 140);
  useDismiss(ref, notifPanelOpen, () => setNotifPanelOpen(false));
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="icon-btn bell"
        onClick={() => setNotifPanelOpen(!notifPanelOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={notifPanelOpen}
        title="Notifications"
      >
        <Icon name="bell" size={18} />
        {unreadCount > 0 && <span key={unreadCount} className="count-badge" aria-hidden="true">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {mounted && (
        <div className={`pop${closing ? ' is-closing' : ''}`} style={{ right: 0, top: 'calc(100% + 8px)', width: 360, maxWidth: 'calc(100vw - 24px)' }}>
          <div className="pop-head">
            <span className="pop-title">Notifications</span>
            {unreadCount > 0 && <span className="badge badge-accent badge-live">{unreadCount} new</span>}
          </div>
          {notifications.length === 0 ? (
            <div className="empty compact">
              <div className="empty-title">You’re all caught up</div>
              <p className="empty-msg">New leads, invoices and tickets will show up here as they happen.</p>
            </div>
          ) : (
            <div className="notif-list">
              {notifications.map((n, i) => (
                <button
                  key={n.id}
                  type="button"
                  className={`notif-item${n.unread ? ' unread' : ''}`}
                  style={stagger(i, 8)}
                  onClick={() => { if (n.unread) markRead(n.id); }}
                  title={n.unread ? 'Mark as read' : undefined}
                >
                  <span className="notif-icon" aria-hidden="true"><Icon name={NOTIF_ICONS[n.type] || 'bell'} size={15} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="notif-text" style={{ display: 'block' }}>{n.text}</span>
                    <span className="notif-time" style={{ display: 'block' }}>{n.time}</span>
                  </span>
                  {n.unread && <span className="unread-dot" aria-label="Unread" />}
                </button>
              ))}
            </div>
          )}
          {notifications.length > 0 && (
            <div className="pop-foot">
              <button type="button" className="btn btn-sm btn-ghost" onClick={markAllRead} disabled={unreadCount === 0}>
                <Icon name="check" size={14} /> Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, organization, orgRole, signOut } = useAuthStore();
  const setCurrentModule = useUIStore((s) => s.setCurrentModule);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { mounted, closing } = usePresence(open, 140);
  useDismiss(ref, open, () => setOpen(false));
  const initials = initialsOf(user?.full_name ?? '', user?.email ?? '');

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="icon-btn"
        style={{ padding: 0 }}
        title={user?.full_name}
      >
        <span className="avatar avatar-sm filled" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
          {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : initials}
        </span>
      </button>
      {mounted && (
        <div className={`pop${closing ? ' is-closing' : ''}`} style={{ right: 0, top: 'calc(100% + 8px)', width: 248 }} role="menu">
          <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--rule)' }}>
            <div className="truncate" style={{ fontWeight: 600 }}>{user?.full_name}</div>
            <div className="truncate" style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-3)' }}>{user?.email}</div>
            {organization && (
              <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="badge no-dot">{organization.name}</span>
                {orgRole && <span className="badge badge-accent no-dot" style={{ textTransform: 'capitalize' }}>{orgRole}</span>}
              </div>
            )}
          </div>
          <div className="menu">
            <button type="button" role="menuitem" className="menu-item" style={stagger(0)} onClick={() => { setOpen(false); navigate('/settings'); setCurrentModule('Settings'); }}>
              <Icon name="settings" size={16} /> Profile &amp; settings
            </button>
            <button type="button" role="menuitem" className="menu-item danger" style={stagger(1)} onClick={signOut}>
              <Icon name="logout" size={16} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** The page's name, derived from the route so it never drifts from the URL. */
function useCurrentTitle(): string {
  const { pathname } = useLocation();
  if (pathname === '/settings') return 'Settings';
  if (pathname === '/admin') return 'Team & access';
  return MODULES.find((m) => m.path === pathname)?.label ?? 'Dashboard';
}

export default function TopNav() {
  const appSwitcherOpen = useUIStore((s) => s.appSwitcherOpen);
  const setAppSwitcherOpen = useUIStore((s) => s.setAppSwitcherOpen);
  const aiPanelOpen = useUIStore((s) => s.aiPanelOpen);
  const setAIPanelOpen = useUIStore((s) => s.setAIPanelOpen);
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const organization = useAuthStore((s) => s.organization);
  const title = useCurrentTitle();

  return (
    <header className="topnav">
      <button
        type="button"
        className="icon-btn mobile-only"
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        aria-label="Open navigation menu"
        aria-expanded={mobileNavOpen}
      >
        <Icon name="menu" size={19} />
      </button>
      <button
        type="button"
        className="icon-btn hide-sm"
        onClick={() => setAppSwitcherOpen(!appSwitcherOpen)}
        aria-label="Switch module"
        aria-expanded={appSwitcherOpen}
        title="Switch module"
      >
        <Icon name="grid" size={17} />
      </button>

      <nav className="crumbs hide-sm" aria-label="Breadcrumb">
        <span className="crumb-org truncate">{organization?.name ?? 'Erpixa'}</span>
        <span className="crumb-sep" aria-hidden="true">/</span>
        <span className="crumb-here" aria-current="page"><span key={title}>{title}</span></span>
      </nav>

      <CommandSearch />

      <div className="topnav-actions">
        <div className="hide-sm"><CurrencySelector /></div>
        <ThemeToggle />
        <Notifications />
        <button
          type="button"
          onClick={() => setAIPanelOpen(!aiPanelOpen)}
          className="btn btn-sm btn-soft"
          aria-expanded={aiPanelOpen}
          title="Answers from your live data"
        >
          <Icon name="spark" size={15} />
          <span className="hide-sm">Insights</span>
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
