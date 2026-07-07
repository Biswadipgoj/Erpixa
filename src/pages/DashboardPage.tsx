import { useCurrencyStore, useNotificationStore } from '../store';
import { useDataStore } from '../store/dataStore';

export default function DashboardPage() {
  const formatMoney = useCurrencyStore((s) => s.formatMoney);
  const salesOrders = useDataStore((s) => s.salesOrders);
  const notifications = useNotificationStore((s) => s.items);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const employees = useDataStore((s) => s.employees);
  const leads = useDataStore((s) => s.leads);
  const tickets = useDataStore((s) => s.tickets);

  const totalRevenue = salesOrders.reduce((acc, so) => acc + (Number(so.total) || 0), 0);
  const openDealsValue = leads.filter(l => l.stage !== 'Won').reduce((acc, l) => acc + (Number(l.revenue) || 0), 0);
  const activeTickets = tickets.filter(t => t.status === 'Open').length;

  return (
    <div className="fade-in">
      {/* Aurora Page Hero */}
      <div className="page-hero" style={{ '--hero-grad': 'var(--grad-aurora)' } as React.CSSProperties}>
        <div>
          <h1 className="page-hero-title">Overview Dashboard</h1>
          <div className="page-hero-sub">Welcome back. Here's what's happening today.</div>
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
          <div className="kpi-value">{formatMoney(totalRevenue)}</div>
          <div className="kpi-change">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>
            </svg>
            This month
          </div>
          <div className="kpi-icon">💰</div>
        </div>

        <div className="card kpi-card kpi-emerald stagger-2">
          <div className="kpi-label">Team Members</div>
          <div className="kpi-value">{employees.length}</div>
          <div className="kpi-change">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 12h14"/>
            </svg>
            Active Directory
          </div>
          <div className="kpi-icon">👥</div>
        </div>

        <div className="card kpi-card kpi-amber stagger-3">
          <div className="kpi-label">Open Deals</div>
          <div className="kpi-value">{formatMoney(openDealsValue)}</div>
          <div className="kpi-change">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 12h14"/>
            </svg>
            Pipeline Value
          </div>
          <div className="kpi-icon">🤝</div>
        </div>

        <div className="card kpi-card kpi-blue stagger-4">
          <div className="kpi-label">Open Tickets</div>
          <div className="kpi-value">{activeTickets}</div>
          <div className="kpi-change">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="m19 12-7 7-7-7"/><path d="M12 5v14"/>
            </svg>
            Needs attention
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
            {salesOrders.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No recent sales. <a href="/sales" style={{ color: 'var(--accent)' }}>Create your first sale</a>.
              </div>
            ) : (
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
            )}
          </div>
        </div>

        <div className="card card-hover">
          <div className="card-header">
            <h3 className="card-title">Latest Notifications</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => markAllRead()}>Mark Read</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No new notifications.
              </div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`} style={{ padding: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div className="font-semibold" style={{ color: n.unread ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {n.text}
                    </div>
                    <div className="text-xs text-muted mt-3">{n.time}</div>
                  </div>
                  {n.unread && <div className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
