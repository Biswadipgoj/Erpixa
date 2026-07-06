import { useState } from 'react';

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState('campaigns');

  return (
    <div className="fade-in">
      <div className="page-hero" style={{ '--hero-grad': 'var(--grad-marketing)' } as React.CSSProperties}>
        <div>
          <h1 className="page-hero-title">Marketing Automation</h1>
          <div className="page-hero-sub">Design, send, and track campaigns to grow your business.</div>
        </div>
        <div className="page-hero-actions">
          <button className="btn btn-white">
            <span style={{ color: 'var(--pink-600)' }}>+ Create Campaign</span>
          </button>
        </div>
      </div>

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-pink stagger-1">
          <div className="kpi-label">Active Campaigns</div>
          <div className="kpi-value">4</div>
          <div className="kpi-change">2 ending this week</div>
          <div className="kpi-icon">📢</div>
        </div>
        <div className="card kpi-card kpi-purple stagger-2" style={{ background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)', boxShadow: '0 8px 24px rgba(147,51,234,0.40)' }}>
          <div className="kpi-label">Total Reach</div>
          <div className="kpi-value">45.2K</div>
          <div className="kpi-change">+12% vs last month</div>
          <div className="kpi-icon">👥</div>
        </div>
        <div className="card kpi-card kpi-blue stagger-3">
          <div className="kpi-label">Avg. Conversion</div>
          <div className="kpi-value">3.8%</div>
          <div className="kpi-change">Industry avg: 2.1%</div>
          <div className="kpi-icon">📈</div>
        </div>
      </div>

      <div className="card">
        <div className="tabs" style={{ padding: '0 var(--s5)', background: 'var(--bg-subtle)', borderBottom: '1.5px solid var(--border)', borderRadius: 'var(--r-xl) var(--r-xl) 0 0' }}>
          <div className={`tab ${activeTab === 'campaigns' ? 'active' : ''}`} onClick={() => setActiveTab('campaigns')}>Campaigns</div>
          <div className={`tab ${activeTab === 'mailing' ? 'active' : ''}`} onClick={() => setActiveTab('mailing')}>Mailing Lists</div>
          <div className={`tab ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>Templates</div>
        </div>
        
        <div className="card-body">
          {activeTab === 'campaigns' && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ '--th-grad': 'var(--grad-marketing)' } as React.CSSProperties}>Campaign Name</th>
                    <th style={{ '--th-grad': 'var(--grad-marketing)' } as React.CSSProperties}>Status</th>
                    <th style={{ '--th-grad': 'var(--grad-marketing)' } as React.CSSProperties}>Sent</th>
                    <th style={{ '--th-grad': 'var(--grad-marketing)' } as React.CSSProperties}>Opened</th>
                    <th style={{ '--th-grad': 'var(--grad-marketing)' } as React.CSSProperties}>Clicked</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-semibold">Summer Promo 2026</td>
                    <td><span className="badge badge-success">Active</span></td>
                    <td>12,450</td>
                    <td>42%</td>
                    <td>8.5%</td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Newsletter - July</td>
                    <td><span className="badge badge-soft-primary">Draft</span></td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                  </tr>
                  <tr>
                    <td className="font-semibold">Q2 Feature Update</td>
                    <td><span className="badge badge-neutral">Completed</span></td>
                    <td>8,920</td>
                    <td>54%</td>
                    <td>12.1%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {activeTab !== 'campaigns' && (
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
