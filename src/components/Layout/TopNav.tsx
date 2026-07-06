import { useState, useRef, useEffect } from 'react';
import { useUIStore, useAuthStore } from '../../store';
import CurrencySelector from '../ui/CurrencySelector';
import { notifications } from '../../data/mockData';

export default function TopNav() {
  const { currentModule, appSwitcherOpen, setAppSwitcherOpen, notifPanelOpen, setNotifPanelOpen, aiPanelOpen, setAIPanelOpen } = useUIStore();
  const { logout } = useAuthStore();
  const [search, setSearch] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setNotifPanelOpen]);

  const NOTIF_ICONS: Record<string, string> = {
    lead: '🎯', invoice: '🧾', task: '✅', ticket: '🎫', leave: '🏖️',
  };

  return (
    <header className="topnav">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setAppSwitcherOpen(!appSwitcherOpen)}
          style={{
            width: 36, height: 36, background: 'var(--bg-subtle)', border: '1.5px solid var(--border)',
            borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'var(--transition)',
          }}
          onMouseEnter={e => {(e.currentTarget as HTMLElement).style.background = 'var(--grad-ai)'; (e.currentTarget as HTMLElement).style.border = 'none';}}
          onMouseLeave={e => {(e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'; (e.currentTarget as HTMLElement).style.border = '1.5px solid var(--border)';}}
          title="Switch Module"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </button>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-disabled)', fontWeight: 500 }}>Buis AI</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1 }}>
            {currentModule}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="topnav-search" style={{ marginLeft: 16 }}>
        <svg className="topnav-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          className="input"
          style={{ paddingLeft: 34, background: 'var(--bg-subtle)', height: 34, width: '100%' }}
          placeholder={`Search in ${currentModule}…`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="topnav-actions">
        {/* Currency Selector */}
        <CurrencySelector />

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="topnav-icon-btn"
            onClick={() => setNotifPanelOpen(!notifPanelOpen)}
            title="Notifications"
            style={notifPanelOpen ? { background: 'var(--bg-subtle)', color: 'var(--violet-600)' } : undefined}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              {notifications.map(n => (
                <div key={n.id} className={`notif-item${n.unread ? ' unread' : ''}`}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: n.unread ? 'var(--grad-ai)' : 'var(--bg-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                  }}>
                    {NOTIF_ICONS[n.type] || '🔔'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: n.unread ? 700 : 500, color: 'var(--text-primary)' }}>{n.text}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.time}</div>
                  </div>
                  {n.unread && <div className="notif-dot" />}
                </div>
              ))}
              <div style={{ padding: '10px 16px', borderTop: '1.5px solid var(--border)', textAlign: 'center' }}>
                <button style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--violet-600)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Mark all as read
                </button>
              </div>
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
          onMouseEnter={e => !aiPanelOpen && ((e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'translateY(0)')}
          title="Ask Buis AI"
        >
          <span style={{ fontSize: '0.9rem' }}>✨</span>
          <span>Ask AI</span>
        </button>

        {/* User Avatar */}
        <div
          style={{
            width: 34, height: 34, background: 'linear-gradient(135deg,#F59E0B,#EC4899)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 800, color: '#fff', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(245,158,11,0.35)', flexShrink: 0,
            border: '2px solid white', transition: 'var(--transition)',
          }}
          title="Profile"
          onClick={logout}
        >
          AJ
        </div>
      </div>
    </header>
  );
}
