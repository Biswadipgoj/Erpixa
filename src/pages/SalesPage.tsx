import { useState } from 'react';
import { useCurrencyStore } from '../store';
import { useDataStore } from '../store/dataStore';

export default function SalesPage() {
  const formatMoney = useCurrencyStore((s) => s.formatMoney);
  const salesOrders = useDataStore((s) => s.salesOrders);
  const [search, setSearch] = useState('');

  const filteredOrders = salesOrders.filter(so => 
    so.customer.toLowerCase().includes(search.toLowerCase()) || 
    so.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-hero" style={{ '--hero-grad': 'var(--grad-sales)' } as React.CSSProperties}>
        <div>
          <h1 className="page-hero-title">Sales Orders</h1>
          <div className="page-hero-sub">Track and manage customer orders and quotations.</div>
        </div>
        <div className="page-hero-actions">
          <button className="btn btn-white">
            <span style={{ color: 'var(--emerald-600)' }}>+ New Quotation</span>
          </button>
        </div>
      </div>

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-emerald stagger-1">
          <div className="kpi-label">Confirmed Revenue</div>
          <div className="kpi-value">{formatMoney(156000)}</div>
          <div className="kpi-change">This month</div>
          <div className="kpi-icon">💰</div>
        </div>
        <div className="card kpi-card kpi-cyan stagger-2" style={{ background: 'linear-gradient(135deg, #0891B2 0%, #0284C7 100%)' }}>
          <div className="kpi-label">Open Quotations</div>
          <div className="kpi-value">{formatMoney(99000)}</div>
          <div className="kpi-change">Waiting for approval</div>
          <div className="kpi-icon">📄</div>
        </div>
        <div className="card kpi-card kpi-blue stagger-3">
          <div className="kpi-label">Orders to Invoice</div>
          <div className="kpi-value">3</div>
          <div className="kpi-change">Pending action</div>
          <div className="kpi-icon">🧾</div>
        </div>
      </div>

      <div className="card card-hover">
        <div className="card-header">
          <div style={{ display: 'flex', gap: 12, flex: 1 }}>
            <input 
              className="tinput" 
              placeholder="Search orders..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 300 }}
            />
            <select className="tinput select" style={{ maxWidth: 150 }}>
              <option>All Statuses</option>
              <option>Draft</option>
              <option>Confirmed</option>
              <option>Invoiced</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ '--th-grad': 'var(--grad-sales)' } as React.CSSProperties}>Order #</th>
                <th style={{ '--th-grad': 'var(--grad-sales)' } as React.CSSProperties}>Date</th>
                <th style={{ '--th-grad': 'var(--grad-sales)' } as React.CSSProperties}>Customer</th>
                <th style={{ '--th-grad': 'var(--grad-sales)' } as React.CSSProperties}>Salesperson</th>
                <th style={{ '--th-grad': 'var(--grad-sales)' } as React.CSSProperties}>Total</th>
                <th style={{ '--th-grad': 'var(--grad-sales)' } as React.CSSProperties}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(so => (
                <tr key={so.id}>
                  <td className="font-bold text-primary-color">{so.id}</td>
                  <td>{so.date}</td>
                  <td className="font-semibold">{so.customer}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar avatar-sm" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                        {so.salesperson.split(' ').map((n: string)=>n[0]).join('')}
                      </div>
                      {so.salesperson}
                    </div>
                  </td>
                  <td className="font-bold">{formatMoney(so.total)}</td>
                  <td>
                    <span className={`badge ${
                      so.status === 'Confirmed' ? 'badge-success' : 
                      so.status === 'Done' ? 'badge-info' : 
                      'badge-soft-primary'
                    }`}>
                      {so.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                    <div className="text-muted">No sales orders found matching "{search}"</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
