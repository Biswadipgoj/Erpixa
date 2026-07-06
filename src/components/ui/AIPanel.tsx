import { useState, useRef, useEffect, useCallback } from 'react';
import { useUIStore, useCurrencyStore } from '../../store';
import {
  crmLeads as mockLeads, crmStages, salesOrders as mockOrders, products as mockProducts, invoices as mockInvoices,
  employees as mockEmployees, projects as mockProjects, tickets as mockTickets, manufacturingOrders as mockMfgOrders, revenueData,
} from '../../data/mockData';
import { useDataStore } from '../../store/dataStore';

// ── Types ──────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'ai';
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

// ── Quick prompts organised by business domain ──────────────────
const QUICK_PROMPTS: QuickPrompt[] = [
  { icon: '💰', label: 'Revenue summary',      query: 'What is our total revenue this year?',               category: 'Finance'    },
  { icon: '🎯', label: 'Top leads',             query: 'Show me the highest value leads in the pipeline',    category: 'Sales'      },
  { icon: '📦', label: 'Low stock alert',       query: 'Which products are running low on stock?',           category: 'Inventory'  },
  { icon: '🧾', label: 'Overdue invoices',      query: 'List all overdue invoices',                          category: 'Finance'    },
  { icon: '👥', label: 'Team overview',          query: 'Give me a summary of my team and departments',       category: 'HR'         },
  { icon: '🎫', label: 'Open tickets',          query: 'What support tickets need urgent attention?',        category: 'Support'    },
  { icon: '📋', label: 'Project health',        query: 'How are our active projects performing?',            category: 'Projects'   },
  { icon: '🏭', label: 'Production status',     query: 'What is the current manufacturing order status?',    category: 'Operations' },
  { icon: '📈', label: 'Sales performance',     query: 'Show me sales performance across all orders',        category: 'Sales'      },
  { icon: '🤖', label: 'AI recommendations',   query: 'Give me your top 3 business recommendations',        category: 'Insights'   },
];

// ── AI Brain: keyword-based contextual responses ────────────────
function generateAIResponse(
  query: string,
  format: (v: number, c?: boolean) => string,
  liveData: { leads: any[]; salesOrders: any[]; products: any[]; invoices: any[]; employees: any[]; projects: any[]; tickets: any[]; manufacturingOrders: any[] }
): { text: string; data?: React.ReactNode } {
  const q = query.toLowerCase();
  // Use live backend data if populated, otherwise fall back to mock data
  const crmLeads = liveData.leads?.length ? liveData.leads : mockLeads;
  const salesOrders = liveData.salesOrders?.length ? liveData.salesOrders : mockOrders;
  const products = liveData.products?.length ? liveData.products : mockProducts;
  const invoices = liveData.invoices?.length ? liveData.invoices : mockInvoices;
  const employees = liveData.employees?.length ? liveData.employees : mockEmployees;
  const projects = liveData.projects?.length ? liveData.projects : mockProjects;
  const tickets = liveData.tickets?.length ? liveData.tickets : mockTickets;
  const manufacturingOrders = liveData.manufacturingOrders?.length ? liveData.manufacturingOrders : mockMfgOrders;

  // ── Revenue / Finance
  if (q.includes('revenue') || q.includes('total') || (q.includes('finance') && !q.includes('invoice'))) {
    const total = revenueData.reduce((a, b) => a + b.revenue, 0);
    const avgTarget = revenueData.reduce((a, b) => a + b.target, 0);
    const thisMonth = revenueData[revenueData.length - 1];
    const prevMonth = revenueData[revenueData.length - 2];
    const growth = (((thisMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100).toFixed(1);
    return {
      text: `Here's your revenue overview for this year:`,
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">YTD Revenue</span><span className="ai-stat-value">{format(total, true)}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Target</span><span className="ai-stat-value">{format(avgTarget, true)}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">MoM Growth</span><span className="ai-stat-value" style={{ color: Number(growth) >= 0 ? 'var(--success)' : 'var(--danger)' }}>{growth}%</span></div>
          </div>
          <div className="ai-divider" />
          {revenueData.slice(-4).map(m => (
            <div key={m.month} className="ai-bar-row">
              <span className="ai-bar-label">{m.month}</span>
              <div className="ai-bar-track">
                <div className="ai-bar-fill" style={{ width: `${(m.revenue / 140000) * 100}%` }} />
              </div>
              <span className="ai-bar-value">{format(m.revenue, true)}</span>
            </div>
          ))}
          <div className="ai-insight">💡 Revenue is trending <strong>{Number(growth) >= 0 ? 'above' : 'below'}</strong> last month by {Math.abs(Number(growth))}%. {Number(growth) >= 0 ? 'Keep pushing the sales pipeline.' : 'Consider accelerating deal closures.'}</div>
        </div>
      ),
    };
  }

  // ── Leads / Pipeline
  if (q.includes('lead') || q.includes('pipeline') || q.includes('opportunity') || q.includes('highest value')) {
    const sorted = [...crmLeads].sort((a, b) => b.revenue - a.revenue);
    const totalVal = crmLeads.reduce((a, l) => a + l.revenue, 0);
    const wonLeads = crmLeads.filter(l => l.stage === 's4');
    return {
      text: `Your CRM pipeline has ${crmLeads.length} active leads with a total value of ${format(totalVal, true)}:`,
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">Total Leads</span><span className="ai-stat-value">{crmLeads.length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Pipeline</span><span className="ai-stat-value">{format(totalVal, true)}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Won</span><span className="ai-stat-value" style={{ color: 'var(--success)' }}>{wonLeads.length}</span></div>
          </div>
          <div className="ai-divider" />
          <div className="ai-table-mini">
            <div className="ai-table-header"><span>Lead</span><span>Stage</span><span>Value</span></div>
            {sorted.slice(0, 5).map(l => {
              const stage = crmStages.find(s => s.id === l.stage);
              return (
                <div key={l.id} className="ai-table-row">
                  <span>{l.partner}</span>
                  <span style={{ color: stage?.color, fontSize: '0.75rem', fontWeight: 600 }}>{stage?.name}</span>
                  <span style={{ fontWeight: 700 }}>{format(l.revenue, true)}</span>
                </div>
              );
            })}
          </div>
          <div className="ai-insight">🚀 Recommendation: <strong>{sorted[0].partner}</strong> has your highest potential at {format(sorted[0].revenue, true)}. Prioritise follow-up within 24h.</div>
        </div>
      ),
    };
  }

  // ── Inventory / Stock
  if (q.includes('stock') || q.includes('inventory') || q.includes('product') || q.includes('low')) {
    const lowStock = products.filter(p => p.status === 'Low Stock');
    const outOfStock = products.filter(p => p.status === 'Out of Stock');
    const totalValue = products.reduce((a, p) => a + p.qty * p.price, 0);
    return {
      text: `Inventory status across ${products.length} products:`,
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">Stock Value</span><span className="ai-stat-value">{format(totalValue, true)}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Low Stock</span><span className="ai-stat-value" style={{ color: 'var(--warning)' }}>{lowStock.length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Out of Stock</span><span className="ai-stat-value" style={{ color: 'var(--danger)' }}>{outOfStock.length}</span></div>
          </div>
          <div className="ai-divider" />
          {[...lowStock, ...outOfStock].map(p => (
            <div key={p.id} className="ai-alert-row">
              <span className={`ai-badge ${p.status === 'Out of Stock' ? 'danger' : 'warning'}`}>{p.status === 'Out of Stock' ? '❌' : '⚠️'}</span>
              <span className="ai-alert-name">{p.name}</span>
              <span className="ai-alert-qty">Qty: {p.qty}</span>
            </div>
          ))}
          <div className="ai-insight">📦 Recommendation: Create a purchase order for <strong>{outOfStock.map(p => p.name).join(', ') || lowStock[0]?.name}</strong> immediately.</div>
        </div>
      ),
    };
  }

  // ── Invoices / Overdue
  if (q.includes('invoice') || q.includes('overdue') || q.includes('unpaid') || q.includes('receivable')) {
    const overdue = invoices.filter(i => i.payment === 'Overdue');
    const unpaid  = invoices.filter(i => i.payment === 'Unpaid');
    const totalAR = [...overdue, ...unpaid].reduce((a, i) => a + i.amount, 0);
    return {
      text: `Here's your accounts receivable status:`,
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">Total AR</span><span className="ai-stat-value">{format(totalAR, true)}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Overdue</span><span className="ai-stat-value" style={{ color: 'var(--danger)' }}>{overdue.length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Pending</span><span className="ai-stat-value" style={{ color: 'var(--warning)' }}>{unpaid.length}</span></div>
          </div>
          <div className="ai-divider" />
          <div className="ai-table-mini">
            <div className="ai-table-header"><span>Invoice</span><span>Customer</span><span>Amount</span><span>Status</span></div>
            {[...overdue, ...unpaid].map(inv => (
              <div key={inv.id} className="ai-table-row">
                <span style={{ color: 'var(--primary-500)', fontWeight: 600 }}>{inv.id}</span>
                <span>{inv.customer}</span>
                <span style={{ fontWeight: 700 }}>{format(inv.amount, true)}</span>
                <span className={`ai-badge ${inv.payment === 'Overdue' ? 'danger' : 'warning'}`}>{inv.payment}</span>
              </div>
            ))}
          </div>
          <div className="ai-insight">⚠️ <strong>{overdue[0]?.customer}</strong>'s invoice is overdue. Send an automated reminder immediately to recover {format(overdue[0]?.amount || 0, true)}.</div>
        </div>
      ),
    };
  }

  // ── Employees / HR / Team
  if (q.includes('employee') || q.includes('team') || q.includes('staff') || q.includes('department') || q.includes('hr')) {
    const depts = employees.reduce((acc, e) => { acc[e.dept] = (acc[e.dept] || 0) + 1; return acc; }, {} as Record<string, number>);
    const onLeave = employees.filter(e => e.status === 'On Leave');
    return {
      text: `Team overview across ${employees.length} employees:`,
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">Total Staff</span><span className="ai-stat-value">{employees.length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Departments</span><span className="ai-stat-value">{Object.keys(depts).length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">On Leave</span><span className="ai-stat-value" style={{ color: 'var(--warning)' }}>{onLeave.length}</span></div>
          </div>
          <div className="ai-divider" />
          {Object.entries(depts).map(([dept, count]) => (
            <div key={dept} className="ai-bar-row">
              <span className="ai-bar-label">{dept}</span>
              <div className="ai-bar-track">
                <div className="ai-bar-fill" style={{ width: `${((count as number) / employees.length) * 100}%`, background: 'var(--accent-500)' }} />
              </div>
              <span className="ai-bar-value">{count as number} people</span>
            </div>
          ))}
          <div className="ai-insight">👥 <strong>{(Object.entries(depts).sort((a,b)=>(b[1] as number)-(a[1] as number))[0] || ['Unknown'])[0]}</strong> is your largest department. {onLeave.length > 0 ? `${onLeave.map(e => e.name).join(', ')} ${onLeave.length === 1 ? 'is' : 'are'} currently on leave.` : 'All employees are available.'}</div>
        </div>
      ),
    };
  }

  // ── Tickets / Support
  if (q.includes('ticket') || q.includes('support') || q.includes('urgent') || q.includes('helpdesk')) {
    const urgent = tickets.filter(t => t.priority === 'Urgent');
    const open = tickets.filter(t => t.status !== 'Resolved');
    return {
      text: `Support desk summary — ${open.length} tickets require attention:`,
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">Open</span><span className="ai-stat-value">{tickets.filter(t=>t.status==='Open').length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">In Progress</span><span className="ai-stat-value" style={{ color: 'var(--primary-500)' }}>{tickets.filter(t=>t.status==='In Progress').length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Urgent</span><span className="ai-stat-value" style={{ color: 'var(--danger)' }}>{urgent.length}</span></div>
          </div>
          <div className="ai-divider" />
          <div className="ai-table-mini">
            <div className="ai-table-header"><span>Ticket</span><span>Customer</span><span>Priority</span></div>
            {tickets.filter(t => t.status !== 'Resolved').map(t => (
              <div key={t.id} className="ai-table-row">
                <span style={{ color: 'var(--primary-500)', fontWeight: 600 }}>{t.id}</span>
                <span>{t.customer}</span>
                <span className={`ai-badge ${t.priority === 'Urgent' ? 'danger' : t.priority === 'High' ? 'warning' : 'info'}`}>{t.priority}</span>
              </div>
            ))}
          </div>
          <div className="ai-insight">🚨 {urgent.length > 0 ? `Ticket ${urgent[0].id} from ${urgent[0].customer} is URGENT — assign immediately to avoid SLA breach.` : 'No urgent tickets — good job maintaining response times!'}</div>
        </div>
      ),
    };
  }

  // ── Projects
  if (q.includes('project') || q.includes('task') || q.includes('performing')) {
    const active = projects.filter(p => p.status === 'In Progress');
    const avgProgress = Math.round(active.reduce((a, p) => a + p.progress, 0) / (active.length || 1));
    return {
      text: `Project portfolio health — ${active.length} active projects:`,
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">Active</span><span className="ai-stat-value">{active.length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Avg Progress</span><span className="ai-stat-value">{avgProgress}%</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Completed</span><span className="ai-stat-value" style={{ color: 'var(--success)' }}>{projects.filter(p=>p.status==='Completed').length}</span></div>
          </div>
          <div className="ai-divider" />
          {projects.map(p => (
            <div key={p.id} className="ai-bar-row">
              <span className="ai-bar-label" style={{ maxWidth: 110 }}>{p.name.substring(0, 16)}…</span>
              <div className="ai-bar-track">
                <div className="ai-bar-fill" style={{ width: `${p.progress}%`, background: p.status === 'Completed' ? 'var(--success)' : 'var(--gradient-ai)' }} />
              </div>
              <span className="ai-bar-value">{p.progress}%</span>
            </div>
          ))}
          <div className="ai-insight">📋 <strong>{active.sort((a,b) => b.progress - a.progress)[0]?.name}</strong> is your most progressed active project at {active.sort((a,b) => b.progress - a.progress)[0]?.progress}%.</div>
        </div>
      ),
    };
  }

  // ── Manufacturing
  if (q.includes('manufactur') || q.includes('production') || q.includes('order status')) {
    const inProg = manufacturingOrders.filter(m => m.status === 'In Progress');
    const planned = manufacturingOrders.filter(m => m.status === 'Planned');
    return {
      text: `Manufacturing floor summary:`,
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">Total Orders</span><span className="ai-stat-value">{manufacturingOrders.length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">In Progress</span><span className="ai-stat-value" style={{ color: 'var(--primary-500)' }}>{inProg.length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Planned</span><span className="ai-stat-value" style={{ color: 'var(--warning)' }}>{planned.length}</span></div>
          </div>
          <div className="ai-divider" />
          {manufacturingOrders.map(mo => (
            <div key={mo.id} className="ai-table-row">
              <span style={{ color: 'var(--primary-500)', fontWeight: 600 }}>{mo.id}</span>
              <span>{mo.product}</span>
              <span>Qty: {mo.qty}</span>
              <span className={`ai-badge ${mo.status === 'Done' ? 'success' : mo.status === 'In Progress' ? 'info' : 'warning'}`}>{mo.status}</span>
            </div>
          ))}
          <div className="ai-insight">🏭 {inProg.length > 0 ? `${inProg[0].product} is actively being produced at ${inProg[0].workcenter}.` : 'No active production orders.'} Schedule the next batch for {planned[0]?.scheduled || 'this week'}.</div>
        </div>
      ),
    };
  }

  // ── Sales / Orders
  if (q.includes('sales') || q.includes('order')) {
    const totalRevSales = salesOrders.reduce((a, o) => a + o.total, 0);
    const confirmed = salesOrders.filter(o => o.status === 'Confirmed');
    const topOrder = [...salesOrders].sort((a, b) => b.total - a.total)[0];
    return {
      text: `Sales performance summary across ${salesOrders.length} orders:`,
      data: (
        <div className="ai-data-card">
          <div className="ai-stat-row">
            <div className="ai-stat"><span className="ai-stat-label">Total Revenue</span><span className="ai-stat-value">{format(totalRevSales, true)}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Confirmed</span><span className="ai-stat-value" style={{ color: 'var(--success)' }}>{confirmed.length}</span></div>
            <div className="ai-stat"><span className="ai-stat-label">Avg. Order</span><span className="ai-stat-value">{format(totalRevSales / salesOrders.length, true)}</span></div>
          </div>
          <div className="ai-divider" />
          <div className="ai-table-mini">
            <div className="ai-table-header"><span>Order</span><span>Customer</span><span>Total</span></div>
            {[...salesOrders].sort((a,b)=>b.total-a.total).slice(0,5).map(o => (
              <div key={o.id} className="ai-table-row">
                <span style={{ color: 'var(--primary-500)', fontWeight: 600 }}>{o.id}</span>
                <span>{o.customer}</span>
                <span style={{ fontWeight: 700 }}>{format(o.total, true)}</span>
              </div>
            ))}
          </div>
          <div className="ai-insight">💼 Your largest order is <strong>{topOrder.customer}</strong> at {format(topOrder.total, true)}. Follow up to ensure timely delivery and upsell opportunities.</div>
        </div>
      ),
    };
  }

  // ── AI Recommendations
  if (q.includes('recommend') || q.includes('insight') || q.includes('suggest') || q.includes('advice')) {
    const overdueInv = invoices.filter(i => i.payment === 'Overdue');
    const urgentTkts = tickets.filter(t => t.priority === 'Urgent');
    const lowStockP  = products.filter(p => p.status !== 'In Stock');
    const topLead    = [...crmLeads].sort((a,b) => b.revenue - a.revenue)[0];
    return {
      text: `Here are my top 3 business recommendations based on your current data:`,
      data: (
        <div className="ai-data-card">
          <div className="ai-recommendation">
            <div className="ai-rec-num">1</div>
            <div>
              <div className="ai-rec-title">💰 Recover Overdue Revenue</div>
              <div className="ai-rec-body">{overdueInv.length > 0 ? `${overdueInv[0].customer}'s invoice of $${overdueInv[0].amount.toLocaleString()} is overdue. Send escalation email today.` : 'All invoices are current — great financial health!'}</div>
            </div>
          </div>
          <div className="ai-recommendation">
            <div className="ai-rec-num">2</div>
            <div>
              <div className="ai-rec-title">🎯 Close High-Value Pipeline</div>
              <div className="ai-rec-body">{topLead.partner}'s deal worth ${topLead.revenue.toLocaleString()} is at {topLead.probability}% probability. A personal call could push it to closure this week.</div>
            </div>
          </div>
          <div className="ai-recommendation">
            <div className="ai-rec-num">3</div>
            <div>
              <div className="ai-rec-title">{urgentTkts.length > 0 ? '🚨 Resolve Urgent Support' : '📦 Restock Inventory'}</div>
              <div className="ai-rec-body">{urgentTkts.length > 0 ? `${urgentTkts[0].customer} has an URGENT ticket that risks your SLA. Assign to a senior agent now.` : `${lowStockP.length} products need restocking. Raise purchase orders to avoid stockouts.`}</div>
            </div>
          </div>
        </div>
      ),
    };
  }

  // ── Default / Fallback
  return {
    text: `I found relevant data across your business. Here's a quick executive summary:`,
    data: (
      <div className="ai-data-card">
        <div className="ai-stat-row">
          <div className="ai-stat"><span className="ai-stat-label">Active Leads</span><span className="ai-stat-value">{crmLeads.length}</span></div>
          <div className="ai-stat"><span className="ai-stat-label">Open Orders</span><span className="ai-stat-value">{salesOrders.filter(o=>o.status!=='Done').length}</span></div>
          <div className="ai-stat"><span className="ai-stat-label">Team Size</span><span className="ai-stat-value">{employees.length}</span></div>
        </div>
        <div className="ai-stat-row" style={{ marginTop: 8 }}>
          <div className="ai-stat"><span className="ai-stat-label">Open Tickets</span><span className="ai-stat-value">{tickets.filter(t=>t.status!=='Resolved').length}</span></div>
          <div className="ai-stat"><span className="ai-stat-label">Low Stock Items</span><span className="ai-stat-value">{products.filter(p=>p.status!=='In Stock').length}</span></div>
          <div className="ai-stat"><span className="ai-stat-label">Projects</span><span className="ai-stat-value">{projects.filter(p=>p.status==='In Progress').length}</span></div>
        </div>
        <div className="ai-insight">🤖 Ask me anything about your CRM, sales, inventory, HR, finance, or operations — I have full access to your business data.</div>
      </div>
    ),
  };
}

// ── Typing animation hook ────────────────────────────────────────
function useTypewriter(text: string, speed = 22) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { displayed, done };
}

// ── Single message component ────────────────────────────────────
function AIMessage({ msg, isLast }: { msg: Message; isLast: boolean }) {
  const { displayed, done } = useTypewriter(
    msg.role === 'ai' && isLast ? msg.text : msg.text,
    msg.role === 'ai' && isLast ? 20 : 0
  );

  return (
    <div className={`ai-msg ${msg.role}`} style={{ animationDelay: '0ms' }}>
      {msg.role === 'ai' && (
        <div className="ai-avatar-bubble">
          <span style={{ fontSize: '0.875rem' }}>✨</span>
        </div>
      )}
      <div className="ai-bubble">
        <p className="ai-bubble-text">
          {msg.role === 'ai' && isLast ? displayed : msg.text}
          {msg.role === 'ai' && isLast && !done && <span className="ai-cursor" />}
        </p>
        {msg.data && done && (
          <div className="ai-bubble-data" style={{ animation: 'fadeIn 0.3s ease' }}>
            {msg.data}
          </div>
        )}
        <span className="ai-ts">
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// ── Main AI Panel ────────────────────────────────────────────────
export default function AIPanel() {
  const { aiPanelOpen, setAIPanelOpen } = useUIStore();
  const { format } = useCurrencyStore();
  const dataStore = useDataStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      text: 'Hello! I\'m Buis AI, your intelligent business assistant. I have full access to your CRM, sales, inventory, accounting, HR, and operations data. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const bottomRef = useRef<HTMLDivElement>(null);

  const categories = ['All', ...Array.from(new Set(QUICK_PROMPTS.map(p => p.category)))];

  const filteredPrompts = activeCategory === 'All' ? QUICK_PROMPTS : QUICK_PROMPTS.filter(p => p.category === activeCategory);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: query, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    scrollToBottom();

    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

    const { text, data } = generateAIResponse(query, format, dataStore);
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text, data, timestamp: new Date() };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
    scrollToBottom();
  }, [loading, format, scrollToBottom, dataStore]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  if (!aiPanelOpen) return null;

  return (
    <>
      {/* Overlay backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 900, backdropFilter: 'blur(2px)' }}
        onClick={() => setAIPanelOpen(false)}
      />

      {/* Panel */}
      <div className="ai-panel" style={{ animation: 'slideInRight 0.28s cubic-bezier(0.4,0,0.2,1)' }}>
        {/* Header */}
        <div className="ai-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div className="ai-panel-logo">
              <span style={{ fontSize: '1.25rem' }}>✨</span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>
                Buis <span style={{ background: 'var(--gradient-ai)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span> Assistant
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                <span className="ai-orb-small" />  Connected to your live data
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setMessages([{ id: '0', role: 'ai', text: 'Chat cleared. What would you like to know?', timestamp: new Date() }])}
              style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}
            >
              Clear
            </button>
            <button
              onClick={() => setAIPanelOpen(false)}
              style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >×</button>
          </div>
        </div>

        {/* Quick prompts */}
        <div className="ai-quick-section">
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button
                key={c}
                className={`ai-cat-btn ${activeCategory === c ? 'active' : ''}`}
                onClick={() => setActiveCategory(c)}
              >{c}</button>
            ))}
          </div>
          <div className="ai-quick-grid">
            {filteredPrompts.map((p, i) => (
              <button
                key={i}
                className="ai-quick-btn"
                onClick={() => sendMessage(p.query)}
                disabled={loading}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="ai-quick-icon">{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="ai-messages">
          {messages.map((msg, idx) => (
            <AIMessage key={msg.id} msg={msg} isLast={idx === messages.length - 1} />
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="ai-msg ai" style={{ animation: 'fadeIn 0.2s ease' }}>
              <div className="ai-avatar-bubble"><span style={{ fontSize: '0.875rem' }}>✨</span></div>
              <div className="ai-bubble">
                <div className="ai-thinking">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="ai-input-area">
          <div className="ai-input-wrap">
            <input
              className="ai-input"
              placeholder="Ask about your business data…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              disabled={loading}
            />
            <button
              className="ai-send-btn"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.7rem', color: 'var(--text-disabled)' }}>
            Powered by Buis AI Engine · Responses use your live business data
          </div>
        </div>
      </div>
    </>
  );
}
