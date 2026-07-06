import { useState } from 'react';
import { useDataStore } from '../store/dataStore';

export default function ManufacturingPage() {
  const manufacturingOrders = useDataStore((s) => s.manufacturingOrders);
  const [search, setSearch] = useState('');

  const filteredOrders = manufacturingOrders.filter(mo => 
    mo.product.toLowerCase().includes(search.toLowerCase()) ||
    mo.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-hero" style={{ '--hero-grad': 'var(--grad-mfg)' } as React.CSSProperties}>
        <div>
          <h1 className="page-hero-title">Manufacturing</h1>
          <div className="page-hero-sub">Plan, execute, and track production orders.</div>
        </div>
        <div className="page-hero-actions">
          <button className="btn btn-white">
            <span style={{ color: 'var(--red-600)' }}>+ Manufacturing Order</span>
          </button>
        </div>
      </div>

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-amber stagger-1">
          <div className="kpi-label">Active Orders</div>
          <div className="kpi-value">{manufacturingOrders.filter(m => m.status === 'In Progress').length}</div>
          <div className="kpi-change">Currently producing</div>
          <div className="kpi-icon">🏭</div>
        </div>
        <div className="card kpi-card kpi-teal stagger-2">
          <div className="kpi-label">Units Produced</div>
          <div className="kpi-value">80</div>
          <div className="kpi-change">This week</div>
          <div className="kpi-icon">📦</div>
        </div>
        <div className="card kpi-card kpi-rose stagger-3">
          <div className="kpi-label">Workcenter Load</div>
          <div className="kpi-value">72%</div>
          <div className="kpi-change">Assembly A</div>
          <div className="kpi-icon">⚙️</div>
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
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ '--th-grad': 'var(--grad-mfg)' } as React.CSSProperties}>Reference</th>
                <th style={{ '--th-grad': 'var(--grad-mfg)' } as React.CSSProperties}>Product</th>
                <th style={{ '--th-grad': 'var(--grad-mfg)' } as React.CSSProperties}>Quantity</th>
                <th style={{ '--th-grad': 'var(--grad-mfg)' } as React.CSSProperties}>Scheduled</th>
                <th style={{ '--th-grad': 'var(--grad-mfg)' } as React.CSSProperties}>Workcenter</th>
                <th style={{ '--th-grad': 'var(--grad-mfg)' } as React.CSSProperties}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(mo => (
                <tr key={mo.id}>
                  <td className="font-bold text-primary-color">{mo.id}</td>
                  <td className="font-semibold">{mo.product}</td>
                  <td><span className="font-bold">{mo.qty}</span> Units</td>
                  <td>{mo.scheduled}</td>
                  <td>{mo.workcenter}</td>
                  <td>
                    <span className={`badge ${
                      mo.status === 'Done' ? 'badge-success' : 
                      mo.status === 'In Progress' ? 'badge-primary' : 
                      'badge-neutral'
                    }`}>
                      {mo.status}
                    </span>
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
