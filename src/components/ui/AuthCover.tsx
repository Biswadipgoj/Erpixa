import Logo from './Logo';
import { stagger } from '../../lib/motion';

// Illustrative entries for the decorative ledger on the sign-in cover.
const ROWS = [
  { doc: 'INV-2041', who: 'Northwind Traders', amt: '$4,280', stamp: 'paid' },
  { doc: 'SO-1187', who: 'Acme Retail Co.', amt: '$12,600', stamp: 'paid' },
  { doc: 'INV-2042', who: 'Sharma Electronics', amt: '$1,150', stamp: 'unpaid' },
  { doc: 'INV-2039', who: 'Lumen Studio', amt: '$860', stamp: 'overdue' },
];

const MODULE_NAMES = ['CRM', 'Sales', 'Inventory', 'Accounting', 'Human resources', 'Projects', 'Manufacturing', 'Helpdesk', 'Marketing'];

const HEADLINE: { word: string; accent?: boolean }[] = [
  { word: 'The' }, { word: 'whole' }, { word: 'business,' }, { word: 'in' }, { word: 'one', accent: true }, { word: 'ledger.', accent: true },
];

/** The dark "book cover" half of the auth screens, with a ledger that writes itself. */
export default function AuthCover({ compact }: { compact?: boolean }) {
  return (
    <aside className={`auth-cover${compact ? ' compact' : ''}`}>
      <div className="auth-brand">
        <Logo size={36} animate />
        <span className="auth-brand-name">Erpixa</span>
      </div>

      {!compact && (
        <div className="ledger-card" aria-hidden="true">
          <div className="ledger-card-head">
            <span>This week’s ledger</span>
            <span className="ledger-live"><i />Live</span>
          </div>
          <div className="ledger-rows">
            {ROWS.map((r, i) => (
              <div key={r.doc} className="ledger-row" style={stagger(i)}>
                <span className="docno">{r.doc}</span>
                <span className="who">{r.who}</span>
                <span className="amt">{r.amt}</span>
                <span className={`stamp ${r.stamp}`} style={stagger(i)}>{r.stamp}</span>
              </div>
            ))}
          </div>
          <svg className="ledger-spark" viewBox="0 0 440 44" preserveAspectRatio="none" width="100%">
            <path className="a" d="M0 36 C40 34 60 28 100 30 S160 18 200 22 S270 10 310 14 S390 4 440 6 V44 H0 Z" />
            <path className="l" pathLength={1} d="M0 36 C40 34 60 28 100 30 S160 18 200 22 S270 10 310 14 S390 4 440 6" />
          </svg>
          <div className="ledger-total">
            <span className="ledger-total-label">Collected</span>
            <span className="ledger-total-value">$16,880</span>
          </div>
        </div>
      )}

      <h2 className="auth-headline" aria-label="The whole business, in one ledger.">
        {HEADLINE.map((h, i) => (
          <span key={h.word}>
            <span className="w" aria-hidden="true">
              <span style={stagger(i)}>{h.accent ? <em>{h.word}</em> : h.word}</span>
            </span>{' '}
          </span>
        ))}
      </h2>
      <p className="auth-lede">
        Leads, orders, stock, invoices, people and production — in one workspace
        that switches on only the modules your kind of business needs.
      </p>

      {!compact && (
        <div className="auth-foot" aria-hidden="true">
          <div className="marquee">
            {[...MODULE_NAMES, ...MODULE_NAMES].map((m, i) => <span key={`${m}-${i}`}>{m}</span>)}
          </div>
        </div>
      )}
    </aside>
  );
}
