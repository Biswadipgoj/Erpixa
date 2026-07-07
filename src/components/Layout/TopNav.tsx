import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore, useAuthStore, useNotificationStore } from '../../store';
import { useDataStore } from '../../store/dataStore';
import CurrencySelector from '../ui/CurrencySelector';

const NOTIF_ICONS: Record<string, string> = {
  lead: '🎯', invoice: '🧾', task: '✅', ticket: '🎫', info: '🔔',
};

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
        push('crm', { id: l.id, label: l.name, sublabel: l.partner, icon: '🎯', path: '/crm' });
      }
    }
    for (const o of salesOrders) {
      if (o.customer.toLowerCase().includes(q) || o.number.toLowerCase().includes(q)) {
        push('sales', { id: o.id, label: o.number || o.customer, sublabel: o.customer, icon: '💼', path: '/sales' });
      }
    }
    for (const c of customers) {
      if (c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) {
        push('sales', { id: c.id, label: c.name, sublabel: c.email || 'Customer', icon: '👤', path: '/sales' });
      }
    }
    for (const p of products) {
      if (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) {
        push('inventory', { id: p.id, label: p.name, sublabel: p.category || p.sku, icon: '📦', path: '/inventory' });
      }
    }
    for (const s of suppliers) {
      if (s.name.toLowerCase().includes(q)) {
        push('inventory', { id: s.id, label: s.name, sublabel: 'Supplier', icon: '🚚', path: '/inventory' });
      }
    }
    for (const i of invoices) {
      if (i.customer.toLowerCase().includes(q) || i.number.toLowerCase().includes(q)) {
        push('accounting', { id: i.id, label: i.number || i.customer, sublabel: i.customer, icon: '🧾', path: '/accounting' });
      }
    }
    for (const e of employees) {
      if (e.name.toLowerCase().includes(q) || e.dept.toLowerCase().includes(q)) {
        push('hr', { id: e.id, label: e.name, sublabel: e.role || e.dept, icon: '👥', path: '/hr' });
      }
    }
    for (const p of projects) {
      if (p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q)) {
        push('projects', { id: p.id, label: p.name, sublabel: p.client, icon: '📋', path: '/projects' });
      }
    }
    for (const t of tickets) {
      if (t.title.toLowerCase().includes(q) || t.customer.toLowerCase().includes(q)) {
        push('helpdesk', { id: t.id, label: t.title, sublabel: t.customer, icon: '🎫', path: '/helpdesk' });
      }
    }
    return hits.slice(0, 8);
  }, [query, leads, salesOrders, products, invoices, employees, projects, tickets, customers, suppliers, organization?.enabled_modules]);
}

export default function TopNav() {
  const { currentModule, appSwitcherOpen, setAppSwitcherOpen, notifPanelOpen, setNotifPanelOpen, aiPanelOpen, setAIPanelOpen, setCurrentModule, setMobileNavOpen, mobileNavOpen } = useUIStore();
  const { user, organization, signOut } = useAuthStore();
  const notifications = useNotificationStore((s) => s.items);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const markRead = useNotificationStore((s) => s.markRead);
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const results = useGlobalSearch(search);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) setNotifPanelOpen(false);
      if (searchRef.current && !searchRef.current.contains(target)) setSearchFocused(false);
      if (userRef.current && !userRef.current.contains(target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setNotifPanelOpen]);

  const initials = (user?.full_name ?? '')
    .split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
    || (user?.email ?? '?').substring(0, 2).toUpperCase();

  const openHit = (hit: SearchHit) => {
    navigate(hit.path);
    setSearch('');
    setSearchFocused(false);
  };

  return (
    <header className="topnav">
      {/* Mobile nav + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="topnav-icon-btn mobile-only"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          title="Menu"
          aria-label="Open navigation menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <button
          onClick={() => setAppSwitcherOpen(!appSwitcherOpen)}
          style={{
            width: 36, height: 36, background: 'var(--bg-subtle)', border: '1.5px solid var(--border)',
            borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'var(--transition)',
          }}
          title="Switch Module"
          aria-label="Switch module"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </button>
        <div>
          <div className="truncate" style={{ fontSize: '0.75rem', color: 'var(--text-disabled)', fontWeight: 500, maxWidth: 160 }}>
            {organization?.name ?? 'Erpixa'}
          </div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1 }}>
            {currentModule}
          </div>
        </div>
      </div>

      {/* Global search */}
      <div ref={searchRef} className="topnav-search" style={{ marginLeft: 16, position: 'relative' }}>
        <svg className="topnav-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          className="input"
          style={{ paddingLeft: 34, background: 'var(--bg-subtle)', height: 34, width: '100%' }}
          placeholder="Search leads, orders, products, invoices…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          role="combobox"
          aria-expanded={searchFocused && results.length > 0}
          aria-label="Global search"
        />
        {searchFocused && search.trim().length >= 2 && (
          <div
            className="notif-panel"
            style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 600, maxHeight: 320, overflowY: 'auto' }}
            role="listbox"
          >
            {results.length === 0 ? (
              <div style={{ padding: '18px 16px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                No matches for “{search.trim()}”
              </div>
            ) : results.map((hit) => (
              <button
                key={`${hit.module}-${hit.id}`}
                type="button"
                className="notif-item"
                role="option"
                aria-selected="false"
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => openHit(hit)}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }} aria-hidden="true">
                  {hit.icon}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div className="truncate" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{hit.label}</div>
                  <div className="truncate" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{hit.sublabel}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="topnav-actions">
        <CurrencySelector />

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="topnav-icon-btn"
            onClick={() => setNotifPanelOpen(!notifPanelOpen)}
            title="Notifications"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            style={notifPanelOpen ? { background: 'var(--bg-subtle)', color: 'var(--violet-600)' } : undefined}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span className="topnav-notif-dot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, fontSize: '0.55rem', fontWeight: 800, top: 4, right: 4 }}>
                {unreadCount}
              </span>
            )}
          </button>

          {notifPanelOpen && (
            <div className="notif-panel" style={{ top: 'calc(100% + 8px)', right: 0, position: 'absolute', zIndex: 600 }}>
              <div style={{
                padding: '12px 16px', borderBottom: '1.5px solid var(--border)',
                background: 'var(--grad-ai)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, color: '#fff', fontSize: '0.9375rem' }}>
                  Notifications
                </span>
                <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 99 }}>
                  {unreadCount} new
                </span>
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  🔔 No notifications yet.<br />Activity in your workspace will show up here.
                </div>
              ) : notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`notif-item${n.unread ? ' unread' : ''}`}
                  onClick={() => { if (n.unread) markRead(n.id); }}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: n.unread ? 'pointer' : 'default' }}
                  title={n.unread ? 'Mark as read' : undefined}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: n.unread ? 'var(--grad-ai)' : 'var(--bg-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                  }} aria-hidden="true">
                    {NOTIF_ICONS[n.type] || '🔔'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: n.unread ? 700 : 500, color: 'var(--text-primary)' }}>{n.text}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.time}</div>
                  </div>
                  {n.unread && <div className="notif-dot" />}
                </button>
              ))}
              {notifications.length > 0 && (
                <div style={{ padding: '10px 16px', borderTop: '1.5px solid var(--border)', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={markAllRead}
                    disabled={unreadCount === 0}
                    style={{ fontSize: '0.8125rem', fontWeight: 700, color: unreadCount === 0 ? 'var(--text-disabled)' : 'var(--violet-600)', background: 'none', border: 'none', cursor: unreadCount === 0 ? 'default' : 'pointer' }}
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Button */}
        <button
          onClick={() => setAIPanelOpen(!aiPanelOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', height: 36,
            background: aiPanelOpen ? 'var(--violet-700)' : 'var(--grad-ai)',
            border: 'none', borderRadius: 'var(--r-full)', cursor: 'pointer',
            color: '#fff', fontWeight: 700, fontSize: '0.8125rem', fontFamily: "'Inter',sans-serif",
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)', transition: 'var(--transition)',
          }}
          title="Ask Erpixa AI"
        >
          <span style={{ fontSize: '0.9rem' }} aria-hidden="true">✨</span>
          <span>Ask AI</span>
        </button>

        {/* User menu */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="Account menu"
            aria-expanded={userMenuOpen}
            style={{
              width: 34, height: 34, background: 'var(--grad-ai)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 800, color: '#fff', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(124,58,237,0.35)', flexShrink: 0,
              border: '2px solid white', transition: 'var(--transition)', padding: 0,
            }}
            title={user?.full_name}
          >
            {initials}
          </button>
          {userMenuOpen && (
            <div className="notif-panel" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 600, width: 220 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1.5px solid var(--border)' }}>
                <div className="truncate" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user?.full_name}</div>
                <div className="truncate" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
              <button
                type="button"
                className="notif-item"
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => { setUserMenuOpen(false); navigate('/settings'); setCurrentModule('Settings'); }}
              >
                <span aria-hidden="true">⚙️</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Profile &amp; settings</span>
              </button>
              <button
                type="button"
                className="notif-item"
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={signOut}
              >
                <span aria-hidden="true">🚪</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger)' }}>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
