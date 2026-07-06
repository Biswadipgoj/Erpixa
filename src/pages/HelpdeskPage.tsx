import { useState } from 'react';
import { useDataStore } from '../store/dataStore';

export default function HelpdeskPage() {
  const tickets = useDataStore((s) => s.tickets);
  const [search, setSearch] = useState('');

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.customer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-hero" style={{ '--hero-grad': 'var(--grad-helpdesk)' } as React.CSSProperties}>
        <div>
          <h1 className="page-hero-title">Helpdesk</h1>
          <div className="page-hero-sub">Resolve customer issues and manage support tickets.</div>
        </div>
        <div className="page-hero-actions">
          <button className="btn btn-white">
            <span style={{ color: 'var(--teal-600)' }}>+ New Ticket</span>
          </button>
        </div>
      </div>

      <div className="grid-3 mb-6">
        <div className="card kpi-card kpi-teal stagger-1">
          <div className="kpi-label">Open Tickets</div>
          <div className="kpi-value">{tickets.filter(t => t.status !== 'Resolved').length}</div>
          <div className="kpi-change">Needs attention</div>
          <div className="kpi-icon">🎫</div>
        </div>
        <div className="card kpi-card kpi-rose stagger-2">
          <div className="kpi-label">Urgent Issues</div>
          <div className="kpi-value">{tickets.filter(t => t.priority === 'Urgent').length}</div>
          <div className="kpi-change">Immediate action required</div>
          <div className="kpi-icon">🚨</div>
        </div>
        <div className="card kpi-card kpi-emerald stagger-3">
          <div className="kpi-label">Avg. Resolution</div>
          <div className="kpi-value">2.4h</div>
          <div className="kpi-change">-15m vs last week</div>
          <div className="kpi-icon">⏱️</div>
        </div>
      </div>

      <div className="card card-hover">
        <div className="card-header">
          <div style={{ display: 'flex', gap: 12, flex: 1 }}>
            <input 
              className="tinput" 
              placeholder="Search tickets..." 
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
                <th style={{ '--th-grad': 'var(--grad-helpdesk)' } as React.CSSProperties}>Ticket ID</th>
                <th style={{ '--th-grad': 'var(--grad-helpdesk)' } as React.CSSProperties}>Subject</th>
                <th style={{ '--th-grad': 'var(--grad-helpdesk)' } as React.CSSProperties}>Customer</th>
                <th style={{ '--th-grad': 'var(--grad-helpdesk)' } as React.CSSProperties}>Priority</th>
                <th style={{ '--th-grad': 'var(--grad-helpdesk)' } as React.CSSProperties}>Status</th>
                <th style={{ '--th-grad': 'var(--grad-helpdesk)' } as React.CSSProperties}>Assignee</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map(t => (
                <tr key={t.id}>
                  <td className="font-bold text-primary-color">{t.id}</td>
                  <td className="font-semibold">{t.title}</td>
                  <td>{t.customer}</td>
                  <td>
                    <span className={`badge ${
                      t.priority === 'Urgent' ? 'badge-danger' : 
                      t.priority === 'High' ? 'badge-warning' : 
                      t.priority === 'Medium' ? 'badge-info' : 
                      'badge-neutral'
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      t.status === 'Resolved' ? 'badge-success' : 
                      t.status === 'In Progress' ? 'badge-soft-primary' : 
                      'badge-neutral'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <div className="avatar avatar-sm" style={{ background: 'var(--grad-ai)', color: '#fff' }}>
                      {t.assignee}
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
