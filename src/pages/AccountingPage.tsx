import { useState } from 'react';
import { useCurrencyStore } from '../store';
import { useDataStore } from '../store/dataStore';

export default function AccountingPage() {
  const formatMoney = useCurrencyStore((s) => s.formatMoney);
  const invoices = useDataStore((s) => s.invoices);
  const [search, setSearch] = useState('');

  const filteredInvoices = invoices.filter(inv => 
    inv.customer.toLowerCase().includes(search.toLowerCase()) || 
    inv.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-hero" style={{ '--hero-grad': 'var(--grad-finance)' } as React.CSSProperties}>
        <div>
          <h1 className="page-hero-title">Accounting</h1>
          <div className="page-hero-sub">Manage invoices, bills, and track your financial health.</div>
        </div>
        <div className="page-hero-actions">
          <button className="btn btn-white">
            <span style={{ color: 'var(--blue-600)' }}>+ New Invoice</span>
          </button>
        </div>
      </div>

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-blue stagger-1">
          <div className="kpi-label">Total Outstanding</div>
          <div className="kpi-value">{formatMoney(252000)}</div>
          <div className="kpi-change">Across 14 invoices</div>
          <div className="kpi-icon">💰</div>
        </div>
        <div className="card kpi-card kpi-emerald stagger-2">
          <div className="kpi-label">Paid This Month</div>
          <div className="kpi-value">{formatMoney(89500)}</div>
          <div className="kpi-change">+15% vs last month</div>
          <div className="kpi-icon">✅</div>
        </div>
        <div className="card kpi-card kpi-rose stagger-3">
          <div className="kpi-label">Overdue</div>
          <div className="kpi-value">{formatMoney(36000)}</div>
          <div className="kpi-change">Needs immediate action</div>
          <div className="kpi-icon">⚠️</div>
        </div>
      </div>

      <div className="card card-hover">
        <div className="card-header">
          <div style={{ display: 'flex', gap: 12, flex: 1 }}>
            <input 
              className="tinput" 
              placeholder="Search invoices..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 300 }}
            />
            <select className="tinput select" style={{ maxWidth: 150 }}>
              <option>All Invoices</option>
              <option>Paid</option>
              <option>Unpaid</option>
              <option>Overdue</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ '--th-grad': 'var(--grad-finance)' } as React.CSSProperties}>Invoice #</th>
                <th style={{ '--th-grad': 'var(--grad-finance)' } as React.CSSProperties}>Date</th>
                <th style={{ '--th-grad': 'var(--grad-finance)' } as React.CSSProperties}>Customer</th>
                <th style={{ '--th-grad': 'var(--grad-finance)' } as React.CSSProperties}>Due Date</th>
                <th style={{ '--th-grad': 'var(--grad-finance)' } as React.CSSProperties}>Amount</th>
                <th style={{ '--th-grad': 'var(--grad-finance)' } as React.CSSProperties}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => (
                <tr key={inv.id}>
                  <td className="font-bold text-primary-color">{inv.id}</td>
                  <td>{inv.date}</td>
                  <td className="font-semibold">{inv.customer}</td>
                  <td>{inv.due}</td>
                  <td className="font-bold">{formatMoney(inv.amount)}</td>
                  <td>
                    <div className="flex gap-2">
                      <span className={`badge ${inv.status === 'Posted' ? 'badge-soft-primary' : 'badge-neutral'}`}>
                        {inv.status}
                      </span>
                      {inv.payment === 'Paid' && <span className="badge badge-success">Paid</span>}
                      {inv.payment === 'Overdue' && <span className="badge badge-danger">Overdue</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
