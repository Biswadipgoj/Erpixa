import { useState } from 'react';
import { useCurrencyStore } from '../store';
import { useDataStore } from '../store/dataStore';

export default function InventoryPage() {
  const formatMoney = useCurrencyStore((s) => s.formatMoney);
  const products = useDataStore((s) => s.products);
  const [search, setSearch] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-hero" style={{ '--hero-grad': 'var(--grad-inventory)' } as React.CSSProperties}>
        <div>
          <h1 className="page-hero-title">Inventory Management</h1>
          <div className="page-hero-sub">Track stock levels, warehouses, and product variants.</div>
        </div>
        <div className="page-hero-actions">
          <button className="btn btn-white">
            <span style={{ color: 'var(--amber-600)' }}>+ New Product</span>
          </button>
        </div>
      </div>

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-amber stagger-1">
          <div className="kpi-label">Total Products</div>
          <div className="kpi-value">1,248</div>
          <div className="kpi-change">Across 4 categories</div>
          <div className="kpi-icon">📦</div>
        </div>
        <div className="card kpi-card kpi-rose stagger-2">
          <div className="kpi-label">Low Stock Alerts</div>
          <div className="kpi-value">12</div>
          <div className="kpi-change">Requires reordering</div>
          <div className="kpi-icon">⚠️</div>
        </div>
        <div className="card kpi-card kpi-emerald stagger-3">
          <div className="kpi-label">Inventory Value</div>
          <div className="kpi-value">{formatMoney(845000)}</div>
          <div className="kpi-change">Estimated valuation</div>
          <div className="kpi-icon">💎</div>
        </div>
      </div>

      <div className="card card-hover">
        <div className="card-header">
          <div style={{ display: 'flex', gap: 12, flex: 1 }}>
            <input 
              className="tinput" 
              placeholder="Search products..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 300 }}
            />
            <select className="tinput select" style={{ maxWidth: 150 }}>
              <option>All Categories</option>
              <option>Electronics</option>
              <option>Furniture</option>
              <option>Accessories</option>
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ '--th-grad': 'var(--grad-inventory)' } as React.CSSProperties}>Product Name</th>
                <th style={{ '--th-grad': 'var(--grad-inventory)' } as React.CSSProperties}>Category</th>
                <th style={{ '--th-grad': 'var(--grad-inventory)' } as React.CSSProperties}>On Hand</th>
                <th style={{ '--th-grad': 'var(--grad-inventory)' } as React.CSSProperties}>Price</th>
                <th style={{ '--th-grad': 'var(--grad-inventory)' } as React.CSSProperties}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.id}>
                  <td className="font-semibold">{p.name}</td>
                  <td>{p.category}</td>
                  <td className="font-bold">{p.qty} Units</td>
                  <td className="font-bold text-primary-color">{formatMoney(p.price)}</td>
                  <td>
                    <span className={`badge ${
                      p.status === 'In Stock' ? 'badge-success' : 
                      p.status === 'Out of Stock' ? 'badge-danger' : 
                      'badge-warning'
                    }`}>
                      {p.status}
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
