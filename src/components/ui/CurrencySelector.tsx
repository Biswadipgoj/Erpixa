import { useRef, useState } from 'react';
import { useCurrencyStore, CURRENCIES } from '../../store';
import { stagger, useDismiss, usePresence } from '../../lib/motion';
import Icon from './Icon';

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrencyStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const { mounted, closing } = usePresence(open, 140);
  useDismiss(ref, open, () => setOpen(false));

  const q = search.toLowerCase();
  const filtered = CURRENCIES.filter((c) =>
    c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.symbol.includes(search));

  const handleSelect = (c: typeof CURRENCIES[0]) => {
    setCurrency(c);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="currency-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Display currency: ${currency.code}`}
      >
        <span className="currency-flag" aria-hidden="true">{currency.flag}</span>
        <span>{currency.code}</span>
        <Icon name="chevron-down" size={13} className="chev" />
      </button>

      {mounted && (
        <div className={`pop currency-pop${closing ? ' is-closing' : ''}`}>
          <div className="currency-search">
            <div className="input-affix">
              <span className="affix-icon"><Icon name="search" size={14} /></span>
              <input
                autoFocus
                className="tinput"
                style={{ height: 34 }}
                placeholder="Search currencies…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search currencies"
              />
            </div>
          </div>
          <div className="currency-list" role="listbox" aria-label="Currencies">
            {filtered.map((c, i) => {
              const active = c.code === currency.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className="currency-item menu-item"
                  style={stagger(i, 10)}
                  onClick={() => handleSelect(c)}
                >
                  <span className="currency-flag" aria-hidden="true">{c.flag}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="currency-code">{c.code}</span>
                    <span className="currency-name">{c.name}</span>
                    <span className="currency-rate" style={{ display: 'block' }}>1 USD = {c.rate.toFixed(c.rate < 10 ? 2 : 0)} {c.code}</span>
                  </span>
                  <span className="currency-sym">{c.symbol}</span>
                  {active && <Icon name="check" size={15} strokeWidth={2.2} style={{ color: 'var(--accent-ink)' }} />}
                </button>
              );
            })}
            {filtered.length === 0 && <div className="search-empty">No currencies match “{search}”.</div>}
          </div>
          <div className="currency-foot">Indicative rates · amounts are stored in USD</div>
        </div>
      )}
    </div>
  );
}
