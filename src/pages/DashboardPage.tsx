import { useNavigate } from 'react-router-dom';
import { useCurrencyStore, useNotificationStore, useAuthStore } from '../store';
import { useDataStore } from '../store/dataStore';
import Icon from '../components/ui/Icon';
import { EmptyState } from '../components/ui/crud';

export default function DashboardPage() {
  const navigate = useNavigate();
  const formatMoney = useCurrencyStore((s) => s.formatMoney);
  const organization = useAuthStore((s) => s.organization);
  const salesOrders = useDataStore((s) => s.salesOrders);
  const employees = useDataStore((s) => s.employees);
  const leads = useDataStore((s) => s.leads);
  const tickets = useDataStore((s) => s.tickets);
  const notifications = useNotificationStore((s) => s.items);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const totalRevenue = salesOrders.reduce((acc, so) => acc + (Number(so.total) || 0), 0);
  const openDealsValue = leads.filter((l) => l.stage !== 'won' && l.stage !== 'lost').reduce((acc, l) => acc + (Number(l.revenue) || 0), 0);
  const activeTickets = tickets.filter((t) => t.status !== 'Resolved').length;

  const kpis = [
    { label: 'Total Revenue', value: formatMoney(totalRevenue), caption: 'All sales orders', icon: 'sales', cls: 'kpi-aurora' },
    { label: 'Team Members', value: String(employees.length), caption: 'On your team', icon: 'hr', cls: 'kpi-emerald' },
    { label: 'Open Pipeline', value: formatMoney(openDealsValue), caption: 'Active deal value', icon: 'crm', cls: 'kpi-amber' },
    { label: 'Open Tickets', value: String(activeTickets), caption: 'Awaiting resolution', icon: 'helpdesk', cls: 'kpi-blue' },
  ];

  return (
    <div className="fade-in">
      <div className="page-hero">
        <div>
          <h1 className="page-hero-title">{organization?.name ?? 'Dashboard'}</h1>
          <div className="page-hero-sub">A live overview of your business.</div>
        </div>
      </div>

      <div className="grid-4 mb-6">
        {kpis.map((k, i) => (
          <div key={k.label} className={`card kpi-card ${k.cls} stagger-${i + 1}`}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-change">{k.caption}</div>
            <div className="kpi-icon"><Icon name={k.icon} size={18} /></div>
          </div>
        ))}
      </div>

      <div className="grid-2 gap-4">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Sales</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => navigate('/sales')}>View all</button>
          </div>
          {salesOrders.length === 0 ? (
            <EmptyState compact icon="sales" title="No sales yet" message="Your recent orders will appear here." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {salesOrders.slice(0, 5).map((so) => (
                    <tr key={so.id}>
                      <td className="font-semibold text-primary-color">{so.number || so.id.slice(0, 8)}</td>
                      <td>{so.customer}</td>
                      <td className="font-semibold">{formatMoney(so.total)}</td>
                      <td>
                        <span className={`badge ${so.status === 'Confirmed' || so.status === 'Done' ? 'badge-success' : 'badge-neutral'}`}>
                          {so.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
            <button className="btn btn-sm btn-ghost" onClick={() => markAllRead()} disabled={!notifications.some((n) => n.unread)}>
              Mark read
            </button>
          </div>
          {notifications.length === 0 ? (
            <EmptyState compact icon="bell" title="Nothing yet" message="Activity in your workspace will show up here." />
          ) : (
            <div style={{ padding: 0 }}>
              {notifications.slice(0, 6).map((n) => (
                <div key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`}>
                  <div style={{ flex: 1 }}>
                    <div className="font-medium" style={{ color: n.unread ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{n.text}</div>
                    <div className="text-xs text-muted mt-2">{n.time}</div>
                  </div>
                  {n.unread && <div className="notif-dot" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
