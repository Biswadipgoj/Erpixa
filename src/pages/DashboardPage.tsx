import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore, useAuthStore, useUIStore } from '../store';
import { useMoney } from '../lib/useMoney';
import { useDataStore } from '../store/dataStore';
import Icon from '../components/ui/Icon';
import { EmptyState, PageHeader, StatusBadge } from '../components/ui/crud';
import { CountUp, Stat, Stats } from '../components/ui/Stat';
import RevenueChart, { type ChartPoint } from '../components/ui/RevenueChart';
import { CRM_STAGES } from '../lib/crmStages';
import { MODULES } from '../lib/modules';
import { greeting, shortDate } from '../lib/format';
import { stagger } from '../lib/motion';

const NOTIF_ICONS: Record<string, string> = {
  lead: 'crm', invoice: 'accounting', task: 'check', ticket: 'helpdesk', info: 'bell',
};

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Revenue per calendar month for the last `count` months, oldest first. */
function monthlyRevenue(orders: { date: string; total: number; status: string }[], count: number): ChartPoint[] {
  const now = new Date();
  const buckets: ChartPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: monthKey(d), label: d.toLocaleDateString(undefined, { month: 'short' }), value: 0 });
  }
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const o of orders) {
    if (o.status === 'Cancelled' || !o.date) continue;
    const i = index.get(o.date.slice(0, 7));
    if (i !== undefined) buckets[i].value += Number(o.total) || 0;
  }
  return buckets;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const formatMoney = useMoney();
  const setAIPanelOpen = useUIStore((s) => s.setAIPanelOpen);
  const setCurrentModule = useUIStore((s) => s.setCurrentModule);
  const organization = useAuthStore((s) => s.organization);
  const user = useAuthStore((s) => s.user);
  const { salesOrders, employees, leads, tickets, invoices, products, projects } = useDataStore();
  const notifications = useNotificationStore((s) => s.items);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const [range, setRange] = useState<6 | 12>(6);

  const enabled = useMemo(() => new Set(organization?.enabled_modules ?? []), [organization?.enabled_modules]);
  const go = (path: string) => {
    navigate(path);
    setCurrentModule(MODULES.find((m) => m.path === path)?.label ?? 'Dashboard');
  };

  // ── Figures ───────────────────────────────────────────────────────────────
  const booked = salesOrders.filter((o) => o.status !== 'Cancelled');
  const revenue = booked.reduce((a, o) => a + (Number(o.total) || 0), 0);
  const series = useMemo(() => monthlyRevenue(salesOrders, range), [salesOrders, range]);
  const thisMonth = series[series.length - 1]?.value ?? 0;
  const lastMonth = series[series.length - 2]?.value ?? 0;
  const delta = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null;

  const openStages = CRM_STAGES.filter((s) => s.id !== 'won' && s.id !== 'lost');
  const pipeline = openStages.map((s) => {
    const inStage = leads.filter((l) => l.stage === s.id);
    return { ...s, count: inStage.length, value: inStage.reduce((a, l) => a + (Number(l.revenue) || 0), 0) };
  });
  const pipelineTotal = pipeline.reduce((a, s) => a + s.value, 0);

  const unpaid = invoices.filter((i) => i.payment !== 'Paid' && i.status !== 'Cancelled');
  const receivables = unpaid.reduce((a, i) => a + i.amount, 0);
  const overdue = invoices.filter((i) => i.payment === 'Overdue');
  const lowStock = products.filter((p) => p.status !== 'In Stock');
  const openTickets = tickets.filter((t) => t.status !== 'Resolved');
  const urgentTickets = openTickets.filter((t) => t.priority === 'Urgent' || t.priority === 'High');
  const drafts = salesOrders.filter((o) => o.status === 'Draft');
  const today = new Date().toISOString().slice(0, 10);
  const lateProjects = projects.filter((p) => p.status !== 'Completed' && p.dueDate && p.dueDate < today);

  const attention = [
    enabled.has('accounting') && overdue.length > 0 && { icon: 'receipt', tone: 'danger', label: 'Overdue invoices', sub: `${formatMoney(overdue.reduce((a, i) => a + i.amount, 0))} past due`, count: overdue.length, path: '/accounting' },
    enabled.has('helpdesk') && urgentTickets.length > 0 && { icon: 'helpdesk', tone: 'danger', label: 'High-priority tickets', sub: `${openTickets.length} open in total`, count: urgentTickets.length, path: '/helpdesk' },
    enabled.has('inventory') && lowStock.length > 0 && { icon: 'inventory', tone: 'warning', label: 'Low or out of stock', sub: 'Below reorder level', count: lowStock.length, path: '/inventory' },
    enabled.has('projects') && lateProjects.length > 0 && { icon: 'hourglass', tone: 'warning', label: 'Projects past due', sub: 'Not yet completed', count: lateProjects.length, path: '/projects' },
    enabled.has('sales') && drafts.length > 0 && { icon: 'sales', tone: 'info', label: 'Quotations to confirm', sub: `${formatMoney(drafts.reduce((a, o) => a + o.total, 0))} in drafts`, count: drafts.length, path: '/sales' },
  ].filter(Boolean) as { icon: string; tone: string; label: string; sub: string; count: number; path: string }[];

  const stats = [
    enabled.has('crm') && { label: 'Open pipeline', value: pipelineTotal, money: true, caption: <><strong>{pipeline.reduce((a, s) => a + s.count, 0)}</strong> deals in play</>, tone: 'accent' as const, icon: 'crm' },
    enabled.has('accounting') && { label: 'Receivables', value: receivables, money: true, caption: <><strong>{unpaid.length}</strong> unpaid invoice{unpaid.length === 1 ? '' : 's'}</>, tone: 'warning' as const, icon: 'accounting' },
    enabled.has('hr') && { label: 'Team', value: employees.length, money: false, caption: <><strong>{employees.filter((e) => e.status === 'Active').length}</strong> active today</>, tone: 'success' as const, icon: 'hr' },
    enabled.has('helpdesk') && { label: 'Open tickets', value: openTickets.length, money: false, caption: <><strong>{urgentTickets.length}</strong> high priority</>, tone: 'danger' as const, icon: 'helpdesk' },
    enabled.has('inventory') && { label: 'Stock value', value: products.reduce((a, p) => a + p.qty * p.cost, 0), money: true, caption: <><strong>{products.length}</strong> products tracked</>, tone: 'info' as const, icon: 'inventory' },
    enabled.has('projects') && { label: 'Active projects', value: projects.filter((p) => p.status === 'In Progress').length, money: false, caption: <><strong>{projects.length}</strong> in total</>, tone: 'accent' as const, icon: 'projects' },
  ].filter(Boolean).slice(0, 4) as { label: string; value: number; money: boolean; caption: React.ReactNode; tone: 'accent' | 'warning' | 'success' | 'danger' | 'info'; icon: string }[];

  const firstName = (user?.full_name ?? '').split(/\s+/)[0] || 'there';
  const dateLine = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="page">
      <PageHeader
        eyebrow={dateLine}
        icon="calendar"
        title={`${greeting()}, ${firstName}`}
        subtitle={<>Here’s where <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{organization?.name ?? 'your business'}</strong> stands today.</>}
      >
        <button type="button" className="btn btn-secondary" onClick={() => setAIPanelOpen(true)}>
          <Icon name="spark" size={15} /> Ask Insights
        </button>
        {enabled.has('sales') && (
          <button type="button" className="btn btn-primary btn-arrow" onClick={() => go('/sales')}>
            Record an order <Icon name="arrow-right" size={15} />
          </button>
        )}
      </PageHeader>

      <div className="dash">
        {/* The one bold move: revenue as an oversized figure on ruled paper. */}
        <section className="card hero-card span-8 stagger" style={stagger(0)} aria-labelledby="hero-label">
          <div className="hero-top">
            <div>
              <div id="hero-label" className="eyebrow">Revenue booked</div>
              <div className="hero-figure"><CountUp value={revenue} format={(v) => formatMoney(v)} duration={1400} /></div>
              <div className="hero-meta">
                <span><strong style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{booked.length}</strong> order{booked.length === 1 ? '' : 's'}, cancelled excluded</span>
                {delta !== null && (
                  <span className={`delta ${delta >= 0 ? 'up' : 'down'}`}>
                    <Icon name={delta >= 0 ? 'trend-up' : 'trend-down'} size={14} />
                    {delta >= 0 ? '+' : '−'}{Math.abs(delta).toFixed(0)}% vs last month
                  </span>
                )}
              </div>
            </div>
            <div className="range" role="group" aria-label="Chart range">
              {([6, 12] as const).map((r) => (
                <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)}>{r} months</button>
              ))}
            </div>
          </div>
          <RevenueChart
            key={range}
            points={series}
            format={(v) => formatMoney(v)}
            formatCompact={(v) => formatMoney(v, true)}
            caption={`Revenue booked per month, last ${range} months`}
          />
        </section>

        <section className="card span-4 stagger" style={stagger(1)} aria-labelledby="attn-title">
          <div className="card-head">
            <div>
              <h2 id="attn-title" className="card-title">Needs attention</h2>
              <div className="card-sub">Open items across your modules</div>
            </div>
            {attention.length > 0 && <span className="badge badge-danger badge-live">{attention.reduce((a, x) => a + x.count, 0)}</span>}
          </div>
          {attention.length === 0 ? (
            <div className="all-clear">
              <div className="all-clear-mark"><Icon name="check" size={24} strokeWidth={2.2} /></div>
              <div className="empty-title">All clear</div>
              <p className="empty-msg">Nothing overdue, low or waiting on you right now.</p>
            </div>
          ) : (
            <div className="attention">
              {attention.map((a, i) => (
                <button key={a.label} type="button" className="attn-item" style={stagger(i)} onClick={() => go(a.path)}>
                  <span className={`attn-icon ${a.tone}`} aria-hidden="true"><Icon name={a.icon} size={17} /></span>
                  <span style={{ minWidth: 0 }}>
                    <span className="attn-label" style={{ display: 'block' }}>{a.label}</span>
                    <span className="attn-sub" style={{ display: 'block' }}>{a.sub}</span>
                  </span>
                  <span className="attn-count"><CountUp value={a.count} delay={300 + i * 80} /></span>
                  <span className="attn-go" aria-hidden="true"><Icon name="chevron-right" size={16} /></span>
                </button>
              ))}
            </div>
          )}
        </section>

        {stats.length > 0 && (
          <div className="span-12">
            <Stats cols={Math.min(4, Math.max(2, stats.length))}>
              {stats.map((s, i) => (
                <Stat
                  key={s.label}
                  index={i + 2}
                  label={s.label}
                  value={s.value}
                  format={s.money ? (v) => formatMoney(v) : undefined}
                  caption={s.caption}
                  tone={s.tone}
                  icon={s.icon}
                />
              ))}
            </Stats>
          </div>
        )}

        {enabled.has('crm') && (
          <section className="card span-12 stagger" style={stagger(6)} aria-labelledby="pipe-title">
            <div className="card-head flush">
              <div>
                <h2 id="pipe-title" className="card-title">Pipeline by stage</h2>
                <div className="card-sub">Open opportunities, weighted by where they sit</div>
              </div>
              <button type="button" className="btn btn-sm btn-ghost btn-arrow" onClick={() => go('/crm')}>
                Open CRM <Icon name="arrow-right" size={14} />
              </button>
            </div>
            <div className="card-body" style={{ paddingTop: 12 }}>
              {pipelineTotal === 0 ? (
                <div className="empty-inline">No open deals yet — leads you add in CRM will stack up here by stage.</div>
              ) : (
                <>
                  <div className="pipeline-bar" role="img" aria-label={`Open pipeline of ${formatMoney(pipelineTotal)} split across ${pipeline.length} stages`}>
                    {pipeline.filter((s) => s.value > 0).map((s, i) => (
                      <span
                        key={s.id}
                        title={`${s.name}: ${formatMoney(s.value)} · ${s.count} deal${s.count === 1 ? '' : 's'}`}
                        style={{ ...stagger(i), flexGrow: s.value, background: s.color }}
                      />
                    ))}
                  </div>
                  <div className="legend">
                    {pipeline.map((s) => (
                      <div key={s.id} className="legend-item">
                        <span className="legend-swatch" style={{ background: s.color }} aria-hidden="true" />
                        <div>
                          <div className="legend-name">{s.name} · {s.probability}%</div>
                          <div className="legend-value">{formatMoney(s.value)}</div>
                          <div className="legend-count">{s.count} deal{s.count === 1 ? '' : 's'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {enabled.has('sales') && (
        <section className="card span-7 stagger" style={stagger(7)} aria-labelledby="recent-title">
          <div className="card-head">
            <div>
              <h2 id="recent-title" className="card-title">Recent orders</h2>
              <div className="card-sub">The latest five, newest first</div>
            </div>
            <button type="button" className="btn btn-sm btn-ghost btn-arrow" onClick={() => go('/sales')}>
              All orders <Icon name="arrow-right" size={14} />
            </button>
          </div>
          {salesOrders.length === 0 ? (
            <EmptyState compact icon="sales" title="No orders yet" message="Your newest sales orders will be listed here." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Order</th><th>Customer</th><th>Date</th><th className="num">Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {salesOrders.slice(0, 5).map((so, i) => (
                    <tr key={so.id} style={stagger(i)}>
                      <td><span className="docno">{so.number || so.id.slice(0, 8)}</span></td>
                      <td className="cell-main">{so.customer}</td>
                      <td className="muted">{shortDate(so.date)}</td>
                      <td className="num money">{formatMoney(so.total)}</td>
                      <td><StatusBadge status={so.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        )}

        <section className={`card ${enabled.has('sales') ? 'span-5' : 'span-12'} stagger`} style={stagger(8)} aria-labelledby="feed-title">
          <div className="card-head">
            <div>
              <h2 id="feed-title" className="card-title">Activity</h2>
              <div className="card-sub">What changed in your workspace</div>
            </div>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => markAllRead()} disabled={!notifications.some((n) => n.unread)}>
              <Icon name="check" size={14} /> Mark read
            </button>
          </div>
          {notifications.length === 0 ? (
            <EmptyState compact icon="bell" title="Quiet so far" message="New leads, invoices and tickets will appear here as they happen." />
          ) : (
            <div className="feed">
              {notifications.slice(0, 6).map((n, i) => (
                <div key={n.id} className={`feed-item${n.unread ? ' unread' : ''}`} style={stagger(i)}>
                  <span className="feed-node" aria-hidden="true"><Icon name={NOTIF_ICONS[n.type] || 'bell'} size={14} /></span>
                  <div style={{ minWidth: 0 }}>
                    <div className="feed-text">{n.text}</div>
                    <div className="feed-time">{n.time}{n.unread && <span className="sr-only"> (unread)</span>}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
