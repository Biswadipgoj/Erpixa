import { useCurrencyStore } from '../store';
import { notifications } from '../data/mockData';
import { useDataStore } from '../store/dataStore';

export default function DashboardPage() {
  const formatMoney = useCurrencyStore((s) => s.formatMoney);
  const salesOrders = useDataStore((s) => s.salesOrders);

  return (
    <div className="fade-in">
      {/* Aurora Page Hero */}
      <div className="page-hero" style={{ '--hero-grad': 'var(--grad-aurora)' } as React.CSSProperties}>
        <div>
          <h1 className="page-hero-title">Overview Dashboard</h1>
          <div className="page-hero-sub">Welcome back, Alex. Here's what's happening today.</div>
        </div>
        <div className="page-hero-actions">
          <button className="btn btn-outline">Download Report</button>
          <button className="btn btn-white">
            <span style={{ color: 'var(--violet-600)' }}>+ New Goal</span>
          </button>
        </div>
      </div>

      {/* Colorful KPIs */}
      <div className="grid-4 mb-6">
        <div className="card kpi-card kpi-violet stagger-1">
          <div className="kpi-label">Total Revenue</div>
          <div className="kpi-value">{formatMoney(691000)}</div>
          <div className="kpi-change">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>
            </svg>
            12% vs last month
          </div>
          <div className="kpi-icon">💰</div>
        </div>

        <div className="card kpi-card kpi-emerald stagger-2">
          <div className="kpi-label">Active Users</div>
          <div className="kpi-value">2,405</div>
          <div className="kpi-change">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>
            </svg>
            18% vs last month
          </div>
          <div className="kpi-icon">👥</div>
        </div>

        <div className="card kpi-card kpi-amber stagger-3">
          <div className="kpi-label">Open Deals</div>
          <div className="kpi-value">{formatMoney(320000)}</div>
          <div className="kpi-change">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="m19 12-7 7-7-7"/><path d="M12 5v14"/>
            </svg>
            4% vs last month
          </div>
          <div className="kpi-icon">🤝</div>
        </div>

        <div className="card kpi-card kpi-blue stagger-4">
          <div className="kpi-label">Support Tickets</div>
          <div className="kpi-value">42</div>
          <div className="kpi-change">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 12h14"/>
            </svg>
            Unchanged
          </div>
          <div className="kpi-icon">🎫</div>
        </div>
      </div>

      <div className="grid-2 gap-4">
        <div className="card card-hover">
          <div className="card-header">
            <h3 className="card-title">Recent Sales</h3>
            <button className="btn btn-sm btn-ghost">View All</button>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {salesOrders.slice(0, 4).map((so) => (
                  <tr key={so.id}>
                    <td className="font-semibold text-primary-color">{so.id}</td>
                    <td>{so.customer}</td>
                    <td className="font-bold">{formatMoney(so.total)}</td>
                    <td>
                      <span className={`badge ${so.status === 'Confirmed' || so.status === 'Done' ? 'badge-soft-success' : 'badge-soft-primary'}`}>
                        {so.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card card-hover">
          <div className="card-header">
            <h3 className="card-title">Latest Notifications</h3>
            <button className="btn btn-sm btn-ghost">Mark Read</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {notifications.slice(0, 5).map((n) => (
              <div key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`} style={{ padding: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div className="font-semibold" style={{ color: n.unread ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {n.text}
                  </div>
                  <div className="text-xs text-muted mt-3">{n.time}</div>
                </div>
                {n.unread && <div className="notif-dot" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
