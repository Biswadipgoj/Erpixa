import { useState } from 'react';

export default function WebsitePage() {
  const [activeTab, setActiveTab] = useState('pages');

  return (
    <div className="fade-in">
      <div className="page-hero" style={{ '--hero-grad': 'var(--grad-website)' } as React.CSSProperties}>
        <div>
          <h1 className="page-hero-title">Website Builder</h1>
          <div className="page-hero-sub">Manage your public storefront, pages, and blog posts.</div>
        </div>
        <div className="page-hero-actions">
          <button className="btn btn-white">
            <span style={{ color: 'var(--orange-600)' }}>+ New Page</span>
          </button>
        </div>
      </div>

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-orange stagger-1">
          <div className="kpi-label">Total Views</div>
          <div className="kpi-value">12.4K</div>
          <div className="kpi-change">This month</div>
          <div className="kpi-icon">👁️</div>
        </div>
        <div className="card kpi-card kpi-rose stagger-2">
          <div className="kpi-label">Bounce Rate</div>
          <div className="kpi-value">42%</div>
          <div className="kpi-change">-5% vs last month</div>
          <div className="kpi-icon">📉</div>
        </div>
        <div className="card kpi-card kpi-amber stagger-3">
          <div className="kpi-label">Active Pages</div>
          <div className="kpi-value">18</div>
          <div className="kpi-change">Published online</div>
          <div className="kpi-icon">📄</div>
        </div>
      </div>

      <div className="card">
        <div className="tabs" style={{ padding: '0 var(--s5)', background: 'var(--bg-subtle)', borderBottom: '1.5px solid var(--border)', borderRadius: 'var(--r-xl) var(--r-xl) 0 0' }}>
          <div className={`tab ${activeTab === 'pages' ? 'active' : ''}`} onClick={() => setActiveTab('pages')}>Pages</div>
          <div className={`tab ${activeTab === 'blog' ? 'active' : ''}`} onClick={() => setActiveTab('blog')}>Blog</div>
          <div className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</div>
        </div>
        
        <div className="card-body">
          {activeTab === 'pages' && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ '--th-grad': 'var(--grad-website)' } as React.CSSProperties}>Page Title</th>
                    <th style={{ '--th-grad': 'var(--grad-website)' } as React.CSSProperties}>URL Path</th>
                    <th style={{ '--th-grad': 'var(--grad-website)' } as React.CSSProperties}>Status</th>
                    <th style={{ '--th-grad': 'var(--grad-website)' } as React.CSSProperties}>Last Edited</th>
                    <th style={{ '--th-grad': 'var(--grad-website)' } as React.CSSProperties}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-semibold">Home</td>
                    <td className="text-muted">/</td>
                    <td><span className="badge badge-success">Published</span></td>
                    <td>2 days ago</td>
                    <td><button className="btn btn-sm btn-ghost">Edit</button></td>
                  </tr>
                  <tr>
                    <td className="font-semibold">About Us</td>
                    <td className="text-muted">/about</td>
                    <td><span className="badge badge-success">Published</span></td>
                    <td>5 days ago</td>
                    <td><button className="btn btn-sm btn-ghost">Edit</button></td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Services</td>
                    <td className="text-muted">/services</td>
                    <td><span className="badge badge-soft-primary">Draft</span></td>
                    <td>Today</td>
                    <td><button className="btn btn-sm btn-ghost">Edit</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {activeTab !== 'pages' && (
            <div className="empty-state">
              <div className="empty-state-icon">🚧</div>
              <div className="empty-state-title">Under Construction</div>
              <div className="text-muted">This section is being built. Check back soon!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
