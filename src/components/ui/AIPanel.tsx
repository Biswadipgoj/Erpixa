import { useState, useRef, useEffect, useCallback } from 'react';
import { useUIStore, useCurrencyStore } from '../../store';
import { useDataStore, type DataState } from '../../store/dataStore';
import { stageById } from '../../lib/crmStages';
import Icon from './Icon';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  data?: React.ReactNode;
  timestamp: Date;
}

interface QuickPrompt {
  icon: string;
  label: string;
  query: string;
  category: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  { icon: 'accounting',    label: 'Revenue summary',   query: 'What is our billed revenue?',                     category: 'Finance'    },
  { icon: 'crm',           label: 'Top leads',          query: 'Show me the highest value leads',                category: 'Sales'      },
  { icon: 'inventory',     label: 'Low stock',          query: 'Which products are running low on stock?',       category: 'Inventory'  },
  { icon: 'accounting',    label: 'Overdue invoices',   query: 'List all overdue invoices',                      category: 'Finance'    },
  { icon: 'hr',            label: 'Team overview',      query: 'Give me a summary of my team',                   category: 'HR'         },
  { icon: 'helpdesk',      label: 'Open tickets',       query: 'Which support tickets need attention?',          category: 'Support'    },
  { icon: 'projects',      label: 'Project health',     query: 'How are our active projects performing?',        category: 'Projects'   },
  { icon: 'manufacturing', label: 'Production status',  query: 'What is the manufacturing order status?',        category: 'Operations' },
  { icon: 'sales',         label: 'Sales performance',  query: 'Show me sales performance across orders',        category: 'Sales'      },
  { icon: 'spark',         label: 'Recommendations',    query: 'Give me your top business recommendations',      category: 'Insights'   },
];

type Fmt = (v: number, compact?: boolean) => string;

/**
 * Deterministic query engine over the org's live data. This is not a language
 * model — it maps a keyword query to a concrete, data-backed answer.
 */
function answerQuery(query: string, format: Fmt, data: DataState): { text: string; data?: React.ReactNode } {
  const q = query.toLowerCase();
  const { leads, salesOrders, products, invoices, employees, projects, tickets, manufacturingOrders } = data;

  if (q.includes('revenue') || q.includes('total') || (q.includes('finance') && !q.includes('invoice'))) {
    const billed = invoices.reduce((a, b) => a + b.amount, 0);
    const paid = invoices.filter((i) => i.payment === 'Paid').reduce((a, i) => a + i.amount, 0);
    const outstanding = billed - paid;
    return {
      text: 'Here’s your invoiced revenue so far:',
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">Billed</span><span className="ai-stat-value">{format(billed, true)}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Paid</span><span className="ai-stat-value" style={{ color: 'var(--success)' }}>{format(paid, true)}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Outstanding</span><span className="ai-stat-value" style={{ color: outstanding > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>{format(outstanding, true)}</span></div>
          </div>
          <div className="ai-insight">
            {invoices.length === 0
              ? 'No invoices yet — create one in Accounting to start tracking revenue.'
              : outstanding > 0
                ? <>You have <strong>{format(outstanding, true)}</strong> still to collect across {invoices.filter((i) => i.payment !== 'Paid').length} open invoices.</>
                : 'Every invoice is paid — your receivables are clear.'}
          </div>
        </div>
      ),
    };
  }

  if (q.includes('lead') || q.includes('pipeline') || q.includes('opportunity') || q.includes('highest value')) {
    const sorted = [...leads].sort((a, b) => b.revenue - a.revenue);
    const totalVal = leads.reduce((a, l) => a + l.revenue, 0);
    const won = leads.filter((l) => l.stage === 'won');
    return {
      text: `Your pipeline has ${leads.length} lead${leads.length === 1 ? '' : 's'} worth ${format(totalVal, true)}:`,
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">Leads</span><span className="ai-stat-value">{leads.length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Pipeline</span><span className="ai-stat-value">{format(totalVal, true)}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Won</span><span className="ai-stat-value" style={{ color: 'var(--success)' }}>{won.length}</span></div>
          </div>
          {sorted.length > 0 && (
            <div className="ai-table-mini">
              <div className="ai-table-header"><span>Lead</span><span>Stage</span><span>Value</span></div>
              {sorted.slice(0, 5).map((l) => {
                const stage = stageById(l.stage);
                return (
                  <div key={l.id} className="ai-table-row">
                    <span>{l.name || l.partner}</span>
                    <span style={{ color: stage?.color, fontSize: '0.75rem', fontWeight: 600 }}>{stage?.name ?? l.stage}</span>
                    <span style={{ fontWeight: 700 }}>{format(l.revenue, true)}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="ai-insight">
            {sorted.length > 0
              ? <><strong>{sorted[0].name || sorted[0].partner}</strong> is your highest-value lead at {format(sorted[0].revenue, true)} — worth prioritising.</>
              : 'Add leads in CRM to see pipeline insights here.'}
          </div>
        </div>
      ),
    };
  }

  if (q.includes('stock') || q.includes('inventory') || q.includes('product') || q.includes('low')) {
    const lowStock = products.filter((p) => p.status === 'Low Stock');
    const outOfStock = products.filter((p) => p.status === 'Out of Stock');
    const totalValue = products.reduce((a, p) => a + p.qty * p.cost, 0);
    const attention = [...outOfStock, ...lowStock];
    return {
      text: `Inventory status across ${products.length} product${products.length === 1 ? '' : 's'}:`,
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">Stock Value</span><span className="ai-stat-value">{format(totalValue, true)}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Low Stock</span><span className="ai-stat-value" style={{ color: 'var(--warning)' }}>{lowStock.length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Out of Stock</span><span className="ai-stat-value" style={{ color: 'var(--danger)' }}>{outOfStock.length}</span></div>
          </div>
          {attention.map((p) => (
            <div key={p.id} className="ai-alert-row">
              <span className={`ai-badge ${p.status === 'Out of Stock' ? 'danger' : 'warning'}`}>{p.status}</span>
              <span className="ai-alert-name">{p.name}</span>
              <span className="ai-alert-qty">Qty: {p.qty}</span>
            </div>
          ))}
          <div className="ai-insight">
            {attention.length > 0
              ? <>Reorder <strong>{attention.slice(0, 3).map((p) => p.name).join(', ')}</strong> to avoid stockouts.</>
              : products.length === 0 ? 'No products yet — add them in Inventory.' : 'All products are above their reorder level.'}
          </div>
        </div>
      ),
    };
  }

  if (q.includes('invoice') || q.includes('overdue') || q.includes('unpaid') || q.includes('receivable')) {
    const overdue = invoices.filter((i) => i.payment === 'Overdue');
    const unpaid = invoices.filter((i) => i.payment === 'Unpaid');
    const outstanding = [...overdue, ...unpaid];
    const totalAR = outstanding.reduce((a, i) => a + i.amount, 0);
    return {
      text: 'Your accounts-receivable status:',
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">Outstanding</span><span className="ai-stat-value">{format(totalAR, true)}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Overdue</span><span className="ai-stat-value" style={{ color: 'var(--danger)' }}>{overdue.length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Pending</span><span className="ai-stat-value" style={{ color: 'var(--warning)' }}>{unpaid.length}</span></div>
          </div>
          {outstanding.length > 0 && (
            <div className="ai-table-mini">
              <div className="ai-table-header"><span>Invoice</span><span>Customer</span><span>Amount</span></div>
              {outstanding.slice(0, 6).map((inv) => (
                <div key={inv.id} className="ai-table-row">
                  <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>{inv.number || inv.id.slice(0, 8)}</span>
                  <span>{inv.customer}</span>
                  <span style={{ fontWeight: 700 }}>{format(inv.amount, true)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="ai-insight">
            {overdue.length > 0
              ? <><strong>{overdue[0].customer}</strong>’s invoice is overdue — a reminder could recover {format(overdue[0].amount, true)}.</>
              : 'Nothing overdue right now.'}
          </div>
        </div>
      ),
    };
  }

  if (q.includes('employee') || q.includes('team') || q.includes('staff') || q.includes('department') || q.includes('hr')) {
    const depts = employees.reduce((acc, e) => { acc[e.dept || 'Unassigned'] = (acc[e.dept || 'Unassigned'] || 0) + 1; return acc; }, {} as Record<string, number>);
    const onLeave = employees.filter((e) => e.status === 'On Leave');
    const biggest = Object.entries(depts).sort((a, b) => b[1] - a[1])[0];
    return {
      text: `Team overview across ${employees.length} employee${employees.length === 1 ? '' : 's'}:`,
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">Staff</span><span className="ai-stat-value">{employees.length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Departments</span><span className="ai-stat-value">{Object.keys(depts).length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">On Leave</span><span className="ai-stat-value" style={{ color: 'var(--warning)' }}>{onLeave.length}</span></div>
          </div>
          {Object.entries(depts).map(([dept, count]) => (
            <div key={dept} className="ai-bar-row">
              <span className="ai-bar-label">{dept}</span>
              <div className="ai-bar-track"><div className="ai-bar-fill" style={{ width: `${(count / employees.length) * 100}%` }} /></div>
              <span className="ai-bar-value">{count}</span>
            </div>
          ))}
          <div className="ai-insight">
            {employees.length === 0
              ? 'No employees yet — add your team in HR.'
              : <><strong>{biggest?.[0]}</strong> is your largest department. {onLeave.length > 0 ? `${onLeave.length} on leave.` : 'Everyone is available.'}</>}
          </div>
        </div>
      ),
    };
  }

  if (q.includes('ticket') || q.includes('support') || q.includes('urgent') || q.includes('helpdesk')) {
    const urgent = tickets.filter((t) => t.priority === 'Urgent' && t.status !== 'Resolved');
    const open = tickets.filter((t) => t.status !== 'Resolved');
    return {
      text: `Support summary — ${open.length} open ticket${open.length === 1 ? '' : 's'}:`,
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">Open</span><span className="ai-stat-value">{tickets.filter((t) => t.status === 'Open').length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">In Progress</span><span className="ai-stat-value" style={{ color: 'var(--info)' }}>{tickets.filter((t) => t.status === 'In Progress').length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Urgent</span><span className="ai-stat-value" style={{ color: 'var(--danger)' }}>{urgent.length}</span></div>
          </div>
          {open.length > 0 && (
            <div className="ai-table-mini">
              <div className="ai-table-header"><span>Subject</span><span>Customer</span><span>Priority</span></div>
              {open.slice(0, 6).map((t) => (
                <div key={t.id} className="ai-table-row">
                  <span>{t.title}</span>
                  <span>{t.customer}</span>
                  <span className={`ai-badge ${t.priority === 'Urgent' ? 'danger' : t.priority === 'High' ? 'warning' : 'info'}`}>{t.priority}</span>
                </div>
              ))}
            </div>
          )}
          <div className="ai-insight">
            {urgent.length > 0
              ? <>Ticket from <strong>{urgent[0].customer}</strong> is urgent — assign it before it breaches SLA.</>
              : open.length === 0 ? 'No open tickets.' : 'No urgent tickets — response times look healthy.'}
          </div>
        </div>
      ),
    };
  }

  if (q.includes('project') || q.includes('task') || q.includes('performing')) {
    const active = projects.filter((p) => p.status === 'In Progress');
    const avgProgress = active.length ? Math.round(active.reduce((a, p) => a + p.progress, 0) / active.length) : 0;
    const mostProgressed = [...active].sort((a, b) => b.progress - a.progress)[0];
    return {
      text: `Project health — ${active.length} active:`,
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">Active</span><span className="ai-stat-value">{active.length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Avg Progress</span><span className="ai-stat-value">{avgProgress}%</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Completed</span><span className="ai-stat-value" style={{ color: 'var(--success)' }}>{projects.filter((p) => p.status === 'Completed').length}</span></div>
          </div>
          {active.map((p) => (
            <div key={p.id} className="ai-bar-row">
              <span className="ai-bar-label">{p.name}</span>
              <div className="ai-bar-track"><div className="ai-bar-fill" style={{ width: `${p.progress}%` }} /></div>
              <span className="ai-bar-value">{p.progress}%</span>
            </div>
          ))}
          <div className="ai-insight">
            {mostProgressed
              ? <><strong>{mostProgressed.name}</strong> is furthest along at {mostProgressed.progress}%.</>
              : projects.length === 0 ? 'No projects yet — create one in Projects.' : 'No active projects right now.'}
          </div>
        </div>
      ),
    };
  }

  if (q.includes('manufactur') || q.includes('production') || q.includes('order status')) {
    const inProg = manufacturingOrders.filter((m) => m.status === 'In Progress');
    const planned = manufacturingOrders.filter((m) => m.status === 'Planned');
    return {
      text: 'Manufacturing summary:',
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">Orders</span><span className="ai-stat-value">{manufacturingOrders.length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">In Progress</span><span className="ai-stat-value" style={{ color: 'var(--info)' }}>{inProg.length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Planned</span><span className="ai-stat-value" style={{ color: 'var(--warning)' }}>{planned.length}</span></div>
          </div>
          {manufacturingOrders.slice(0, 6).map((mo) => (
            <div key={mo.id} className="ai-table-row">
              <span>{mo.product}</span>
              <span>Qty {mo.qty}</span>
              <span className={`ai-badge ${mo.status === 'Done' ? 'success' : mo.status === 'In Progress' ? 'info' : 'warning'}`}>{mo.status}</span>
            </div>
          ))}
          <div className="ai-insight">
            {inProg.length > 0
              ? <><strong>{inProg[0].product}</strong> is in production{inProg[0].workcenter ? ` at ${inProg[0].workcenter}` : ''}.</>
              : manufacturingOrders.length === 0 ? 'No manufacturing orders yet.' : 'No orders currently in production.'}
          </div>
        </div>
      ),
    };
  }

  if (q.includes('sales') || q.includes('order')) {
    const totalRev = salesOrders.reduce((a, o) => a + o.total, 0);
    const confirmed = salesOrders.filter((o) => o.status === 'Confirmed');
    const avg = salesOrders.length ? totalRev / salesOrders.length : 0;
    const top = [...salesOrders].sort((a, b) => b.total - a.total);
    return {
      text: `Sales across ${salesOrders.length} order${salesOrders.length === 1 ? '' : 's'}:`,
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">Total</span><span className="ai-stat-value">{format(totalRev, true)}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Confirmed</span><span className="ai-stat-value" style={{ color: 'var(--success)' }}>{confirmed.length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Avg. Order</span><span className="ai-stat-value">{format(avg, true)}</span></div>
          </div>
          {top.length > 0 && (
            <div className="ai-table-mini">
              <div className="ai-table-header"><span>Order</span><span>Customer</span><span>Total</span></div>
              {top.slice(0, 5).map((o) => (
                <div key={o.id} className="ai-table-row">
                  <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>{o.number || o.id.slice(0, 8)}</span>
                  <span>{o.customer}</span>
                  <span style={{ fontWeight: 700 }}>{format(o.total, true)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="ai-insight">
            {top.length > 0
              ? <>Your largest order is <strong>{top[0].customer}</strong> at {format(top[0].total, true)}.</>
              : 'Create sales orders to start tracking performance.'}
          </div>
        </div>
      ),
    };
  }

  if (q.includes('recommend') || q.includes('insight') || q.includes('suggest') || q.includes('advice')) {
    const overdueInv = invoices.filter((i) => i.payment === 'Overdue');
    const urgentTkts = tickets.filter((t) => t.priority === 'Urgent' && t.status !== 'Resolved');
    const lowStockP = products.filter((p) => p.status !== 'In Stock');
    const topLead = [...leads].sort((a, b) => b.revenue - a.revenue)[0];
    return {
      text: 'Based on your current data, here’s where to focus:',
      data: (
        <div className="ai-data-card">
          <div className="ai-recommendation">
            <div className="ai-rec-num">1</div>
            <div>
              <div className="ai-rec-title">Recover outstanding revenue</div>
              <div className="ai-rec-body">{overdueInv.length > 0 ? `${overdueInv[0].customer}’s invoice of ${format(overdueInv[0].amount, true)} is overdue — follow up today.` : 'All invoices are current.'}</div>
            </div>
          </div>
          <div className="ai-recommendation">
            <div className="ai-rec-num">2</div>
            <div>
              <div className="ai-rec-title">Advance your best deal</div>
              <div className="ai-rec-body">{topLead ? `${topLead.name || topLead.partner} is worth ${format(topLead.revenue, true)} at ${topLead.probability}% — a call could move it forward.` : 'Add and qualify leads in CRM.'}</div>
            </div>
          </div>
          <div className="ai-recommendation">
            <div className="ai-rec-num">3</div>
            <div>
              <div className="ai-rec-title">{urgentTkts.length > 0 ? 'Resolve urgent support' : 'Restock inventory'}</div>
              <div className="ai-rec-body">{urgentTkts.length > 0 ? `${urgentTkts[0].customer} has an urgent ticket — assign it now.` : lowStockP.length > 0 ? `${lowStockP.length} product${lowStockP.length === 1 ? '' : 's'} need restocking.` : 'Inventory levels are healthy.'}</div>
            </div>
          </div>
        </div>
      ),
    };
  }

  return {
    text: 'Here’s a quick snapshot of your workspace:',
    data: (
      <div className="ai-data-card">
        <div className="ai-stat-row">
          <div className="ai-stat"><span className="ai-stat-label">Leads</span><span className="ai-stat-value">{leads.length}</span></div>
          <div className="ai-stat"><span className="ai-stat-label">Open Orders</span><span className="ai-stat-value">{salesOrders.filter((o) => o.status !== 'Done').length}</span></div>
          <div className="ai-stat"><span className="ai-stat-label">Team</span><span className="ai-stat-value">{employees.length}</span></div>
        </div>
        <div className="ai-stat-row">
          <div className="ai-stat"><span className="ai-stat-label">Open Tickets</span><span className="ai-stat-value">{tickets.filter((t) => t.status !== 'Resolved').length}</span></div>
          <div className="ai-stat"><span className="ai-stat-label">Low Stock</span><span className="ai-stat-value">{products.filter((p) => p.status !== 'In Stock').length}</span></div>
          <div className="ai-stat"><span className="ai-stat-label">Projects</span><span className="ai-stat-value">{projects.filter((p) => p.status === 'In Progress').length}</span></div>
        </div>
        <div className="ai-insight">Ask about your CRM, sales, inventory, finance, HR, or operations and I’ll pull the numbers from your live data.</div>
      </div>
    ),
  };
}

function AIMessage({ msg }: { msg: Message }) {
  return (
    <div className={`ai-msg ${msg.role === 'user' ? 'user' : ''}`}>
      {msg.role === 'assistant' && (
        <div className="ai-avatar-bubble"><Icon name="spark" size={16} /></div>
      )}
      <div className="ai-bubble">
        <p className="ai-bubble-text">{msg.text}</p>
        {msg.data && <div className="ai-bubble-data">{msg.data}</div>}
        <span className="ai-ts">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}

const welcome = (): Message => ({
  id: '0',
  role: 'assistant',
  text: 'Ask about your CRM, sales, inventory, finance, HR, or operations — I’ll pull the numbers straight from your live data.',
  timestamp: new Date(),
});

export default function AIPanel() {
  const { aiPanelOpen, setAIPanelOpen } = useUIStore();
  const format = useCurrencyStore((s) => s.format);
  const [messages, setMessages] = useState<Message[]>([welcome()]);
  const [input, setInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const bottomRef = useRef<HTMLDivElement>(null);

  const categories = ['All', ...Array.from(new Set(QUICK_PROMPTS.map((p) => p.category)))];
  const filteredPrompts = activeCategory === 'All' ? QUICK_PROMPTS : QUICK_PROMPTS.filter((p) => p.category === activeCategory);

  const send = useCallback((query: string) => {
    if (!query.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: query, timestamp: new Date() };
    const answer = answerQuery(query, format, useDataStore.getState());
    const reply: Message = { id: `${Date.now()}-a`, role: 'assistant', text: answer.text, data: answer.data, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg, reply]);
    setInput('');
  }, [format]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!aiPanelOpen) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 900 }} onClick={() => setAIPanelOpen(false)} />
      <div className="ai-panel">
        <div className="ai-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="ai-panel-logo"><Icon name="spark" size={18} /></div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.1, color: 'var(--text-primary)' }}>Insights</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Answers from your live data</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-sm btn-ghost" onClick={() => setMessages([welcome()])}>Clear</button>
            <button className="topnav-icon-btn" onClick={() => setAIPanelOpen(false)} aria-label="Close"><Icon name="close" size={18} /></button>
          </div>
        </div>

        <div className="ai-quick-section">
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <button key={c} className={`ai-cat-btn ${activeCategory === c ? 'active' : ''}`} onClick={() => setActiveCategory(c)}>{c}</button>
            ))}
          </div>
          <div className="ai-quick-grid">
            {filteredPrompts.map((p) => (
              <button key={p.label} className="ai-quick-btn" onClick={() => send(p.query)}>
                <span className="ai-quick-icon"><Icon name={p.icon} size={15} /></span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="ai-messages">
          {messages.map((msg) => <AIMessage key={msg.id} msg={msg} />)}
          <div ref={bottomRef} />
        </div>

        <div className="ai-input-area">
          <div className="ai-input-wrap">
            <input
              className="ai-input"
              placeholder="Ask about your business data…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            />
            <button className="ai-send-btn" onClick={() => send(input)} disabled={!input.trim()} aria-label="Send">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
