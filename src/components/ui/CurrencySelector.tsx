import { useState, useRef, useEffect } from 'react';
import { useCurrencyStore, CURRENCIES } from '../../store';

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrencyStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = CURRENCIES.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.includes(search)
  );

  const handleSelect = (c: typeof CURRENCIES[0]) => {
    setCurrency(c);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          transition: 'var(--transition)',
          fontFamily: 'var(--font-body)',
          height: 32,
        }}
        title="Change currency"
      >
        <span style={{ fontSize: '1rem' }}>{currency.flag}</span>
        <span>{currency.code}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currency.symbol}</span>
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transition: 'transform 0.18s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          width: 280,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-2xl)',
          zIndex: 700,
          overflow: 'hidden',
          animation: 'slideDown 0.15s ease',
        }}>
          {/* Header */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: 8, color: 'var(--text-primary)' }}>
              Select Currency
            </div>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                autoFocus
                placeholder="Search currencies…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '5px 8px 5px 26px',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)', fontSize: '0.8125rem',
                  fontFamily: 'var(--font-body)', outline: 'none', color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {filtered.map(c => {
              const active = c.code === currency.code;
              return (
                <div
                  key={c.code}
                  onClick={() => handleSelect(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    background: active ? 'var(--primary-50)' : 'transparent',
                    borderLeft: active ? '3px solid var(--primary-500)' : '3px solid transparent',
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-subtle)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{c.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: active ? 700 : 500, color: active ? 'var(--primary-600)' : 'var(--text-primary)' }}>
                      {c.code}
                      <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6, fontSize: '0.8125rem' }}>{c.name}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      1 USD = {c.rate.toFixed(c.rate < 10 ? 2 : 0)} {c.code}
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, color: active ? 'var(--primary-500)' : 'var(--text-secondary)', fontSize: '0.875rem', fontFamily: 'var(--font-display)' }}>
                    {c.symbol}
                  </span>
                  {active && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No currencies found
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Indicative conversion rates · 20 currencies
          </div>
        </div>
      )}
    </div>
  );
}
