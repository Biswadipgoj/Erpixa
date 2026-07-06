// Demo dataset used when Supabase is not configured (Demo Mode).
import type {
  Lead, CRMStage, SalesOrder, Product, Invoice, Employee,
  Project, ProjectTask, ManufacturingOrder, Ticket, RevenuePoint, AppNotification,
} from '../types';

// ── CRM ──────────────────────────────────────────────────────
export const crmStages: CRMStage[] = [
  { id: 's1', name: 'New',         probability: 10,  color: '#6B7280' },
  { id: 's2', name: 'Qualified',   probability: 30,  color: '#3B82F6' },
  { id: 's3', name: 'Proposition', probability: 60,  color: '#F59E0B' },
  { id: 's4', name: 'Won',         probability: 100, color: '#22C55E' },
];

export const crmLeads: Lead[] = [
  { id: 'l1', name: 'Tech Refresh — Acme Corp', partner: 'Acme Corp', stage: 's1', probability: 10, revenue: 45000, user: 'AJ', priority: 2, tag: 'Cold', created: '2026-06-28' },
  { id: 'l2', name: 'ERP Implementation — Nexus Ltd', partner: 'Nexus Ltd', stage: 's2', probability: 35, revenue: 120000, user: 'SM', priority: 3, tag: 'Hot', created: '2026-07-01' },
  { id: 'l3', name: 'Cloud Migration', partner: 'Bluewave Inc', stage: 's2', probability: 40, revenue: 78000, user: 'PK', priority: 2, tag: 'Warm', created: '2026-07-02' },
  { id: 'l4', name: 'Annual Support Contract', partner: 'Delta Systems', stage: 's3', probability: 65, revenue: 36000, user: 'AJ', priority: 1, tag: 'Warm', created: '2026-06-30' },
  { id: 'l5', name: 'Module Expansion — HR', partner: 'Helix Corp', stage: 's3', probability: 70, revenue: 54000, user: 'SM', priority: 3, tag: 'Hot', created: '2026-07-03' },
  { id: 'l6', name: 'API Integration Package', partner: 'Vortex Tech', stage: 's4', probability: 100, revenue: 22000, user: 'AJ', priority: 2, tag: 'Won', created: '2026-06-25' },
  { id: 'l7', name: 'Inventory Rollout', partner: 'Glotech SA', stage: 's1', probability: 15, revenue: 89000, user: 'PK', priority: 1, tag: 'Cold', created: '2026-07-04' },
];

// ── SALES ──────────────────────────────────────────────────────
export const salesOrders: SalesOrder[] = [
  { id: 'SO001', customer: 'Nexus Ltd',    date: '2026-07-01', total: 120000, status: 'Confirmed', salesperson: 'Alex Johnson' },
  { id: 'SO002', customer: 'Acme Corp',    date: '2026-07-02', total:  45000, status: 'Draft',     salesperson: 'Sara Miles' },
  { id: 'SO003', customer: 'Bluewave Inc', date: '2026-07-03', total:  78000, status: 'Invoiced',  salesperson: 'Paul Kim' },
  { id: 'SO004', customer: 'Delta Systems',date: '2026-07-03', total:  36000, status: 'Confirmed', salesperson: 'Alex Johnson' },
  { id: 'SO005', customer: 'Helix Corp',   date: '2026-07-04', total:  54000, status: 'Draft',     salesperson: 'Sara Miles' },
  { id: 'SO006', customer: 'Vortex Tech',  date: '2026-06-25', total:  22000, status: 'Done',      salesperson: 'Alex Johnson' },
];

// ── INVENTORY ──────────────────────────────────────────────────
export const products: Product[] = [
  { id: 'p1', name: 'Laptop Pro X1',        category: 'Electronics', qty: 142, price: 1299, status: 'In Stock' },
  { id: 'p2', name: 'Wireless Headset Z',   category: 'Electronics', qty:  23, price:  189, status: 'Low Stock' },
  { id: 'p3', name: 'Office Chair Ergo',    category: 'Furniture',   qty:  57, price:  349, status: 'In Stock' },
  { id: 'p4', name: 'Standing Desk Pro',    category: 'Furniture',   qty:   8, price:  799, status: 'Low Stock' },
  { id: 'p5', name: 'USB-C Hub 7-Port',     category: 'Accessories', qty: 214, price:   49, status: 'In Stock' },
  { id: 'p6', name: '4K Monitor 27"',       category: 'Electronics', qty:   0, price:  649, status: 'Out of Stock' },
  { id: 'p7', name: 'Mechanical Keyboard',  category: 'Accessories', qty:  81, price:  159, status: 'In Stock' },
];

// ── ACCOUNTING ──────────────────────────────────────────────────
export const invoices: Invoice[] = [
  { id: 'INV-001', customer: 'Nexus Ltd',    date: '2026-07-01', due: '2026-07-31', amount: 120000, status: 'Posted', payment: 'Unpaid' },
  { id: 'INV-002', customer: 'Acme Corp',    date: '2026-06-28', due: '2026-07-28', amount:  45000, status: 'Posted', payment: 'Paid' },
  { id: 'INV-003', customer: 'Bluewave Inc', date: '2026-07-03', due: '2026-08-02', amount:  78000, status: 'Draft',  payment: 'Unpaid' },
  { id: 'INV-004', customer: 'Delta Systems',date: '2026-06-20', due: '2026-07-20', amount:  36000, status: 'Posted', payment: 'Overdue' },
  { id: 'INV-005', customer: 'Helix Corp',   date: '2026-07-04', due: '2026-08-04', amount:  54000, status: 'Draft',  payment: 'Unpaid' },
];

// ── HR ──────────────────────────────────────────────────────────
export const employees: Employee[] = [
  { id: 'e1', name: 'Alex Johnson',   role: 'CTO',              dept: 'Engineering', email: 'alex@erpixa.com',  phone: '+1 555-0101', status: 'Active', joinDate: '2022-03-01', initials: 'AJ', color: '#4F46E5' },
  { id: 'e2', name: 'Sara Miles',     role: 'Head of Sales',    dept: 'Sales',       email: 'sara@erpixa.com',  phone: '+1 555-0102', status: 'Active', joinDate: '2022-06-15', initials: 'SM', color: '#0EA5E9' },
  { id: 'e3', name: 'Paul Kim',       role: 'Senior Dev',       dept: 'Engineering', email: 'paul@erpixa.com',  phone: '+1 555-0103', status: 'Active', joinDate: '2023-01-10', initials: 'PK', color: '#22C55E' },
  { id: 'e4', name: 'Maria Garcia',   role: 'HR Manager',       dept: 'HR',          email: 'maria@erpixa.com', phone: '+1 555-0104', status: 'Active', joinDate: '2022-09-01', initials: 'MG', color: '#F59E0B' },
  { id: 'e5', name: 'David Lee',      role: 'Finance Lead',     dept: 'Finance',     email: 'david@erpixa.com', phone: '+1 555-0105', status: 'Active', joinDate: '2023-04-15', initials: 'DL', color: '#EF4444' },
  { id: 'e6', name: 'Emma Wilson',    role: 'Designer',         dept: 'Product',     email: 'emma@erpixa.com',  phone: '+1 555-0106', status: 'Active', joinDate: '2023-07-01', initials: 'EW', color: '#8B5CF6' },
  { id: 'e7', name: 'James Brown',    role: 'Marketing Lead',   dept: 'Marketing',   email: 'james@erpixa.com', phone: '+1 555-0107', status: 'On Leave', joinDate: '2022-11-15', initials: 'JB', color: '#EC4899' },
];

// ── PROJECTS ──────────────────────────────────────────────────
export const projects: Project[] = [
  { id: 'proj1', name: 'Erpixa Platform v2',  client: 'Internal',   status: 'In Progress', progress: 72,  dueDate: '2026-09-01', team: ['AJ','PK','EW'], tasks: 34, done: 24 },
  { id: 'proj2', name: 'Nexus ERP Rollout',   client: 'Nexus Ltd',  status: 'In Progress', progress: 45,  dueDate: '2026-08-15', team: ['SM','PK'],      tasks: 21, done: 9  },
  { id: 'proj3', name: 'Mobile App Design',   client: 'Helix Corp', status: 'Planning',    progress: 15,  dueDate: '2026-10-01', team: ['EW','JB'],      tasks: 12, done: 2  },
  { id: 'proj4', name: 'Cloud Migration',     client: 'Bluewave',   status: 'Completed',   progress: 100, dueDate: '2026-06-30', team: ['AJ','PK'],      tasks: 28, done: 28 },
];

export const projectTasks: ProjectTask[] = [
  { id: 't1', title: 'Design token system',          project: 'proj1', stage: 'Done',        assignee: 'EW', priority: 'High',   due: '2026-07-10' },
  { id: 't2', title: 'CRM kanban drag-and-drop',     project: 'proj1', stage: 'In Progress', assignee: 'PK', priority: 'High',   due: '2026-07-12' },
  { id: 't3', title: 'Accounting reconciliation UI', project: 'proj1', stage: 'In Progress', assignee: 'AJ', priority: 'Medium', due: '2026-07-15' },
  { id: 't4', title: 'Mobile responsive layout',     project: 'proj1', stage: 'To Do',       assignee: 'EW', priority: 'Medium', due: '2026-07-20' },
  { id: 't5', title: 'Requirements gathering',       project: 'proj2', stage: 'Done',        assignee: 'SM', priority: 'High',   due: '2026-07-05' },
  { id: 't6', title: 'Data migration script',        project: 'proj2', stage: 'In Progress', assignee: 'PK', priority: 'High',   due: '2026-07-18' },
  { id: 't7', title: 'Wireframes — Home screen',     project: 'proj3', stage: 'Done',        assignee: 'EW', priority: 'Low',    due: '2026-07-08' },
  { id: 't8', title: 'Component library',            project: 'proj1', stage: 'To Do',       assignee: 'AJ', priority: 'Low',    due: '2026-07-25' },
];

// ── MANUFACTURING ──────────────────────────────────────────────
export const manufacturingOrders: ManufacturingOrder[] = [
  { id: 'MO-001', product: 'Laptop Pro X1',       qty: 50,  bom: 'BoM-L-001', status: 'In Progress', scheduled: '2026-07-10', workcenter: 'Assembly A' },
  { id: 'MO-002', product: 'USB-C Hub 7-Port',    qty: 200, bom: 'BoM-U-001', status: 'Planned',     scheduled: '2026-07-14', workcenter: 'Assembly B' },
  { id: 'MO-003', product: 'Mechanical Keyboard', qty: 80,  bom: 'BoM-K-001', status: 'Done',        scheduled: '2026-07-05', workcenter: 'Assembly A' },
];

// ── HELPDESK ──────────────────────────────────────────────────
export const tickets: Ticket[] = [
  { id: 'TK-001', title: 'Cannot login after password reset',     customer: 'Acme Corp',     priority: 'Urgent', status: 'Open',        assignee: 'AJ', created: '2026-07-05' },
  { id: 'TK-002', title: 'Invoice PDF not generating correctly',  customer: 'Nexus Ltd',     priority: 'High',   status: 'In Progress', assignee: 'DL', created: '2026-07-04' },
  { id: 'TK-003', title: 'Stock levels not syncing',              customer: 'Bluewave Inc',  priority: 'Medium', status: 'In Progress', assignee: 'PK', created: '2026-07-04' },
  { id: 'TK-004', title: 'Feature request: bulk import employees',customer: 'Helix Corp',    priority: 'Low',    status: 'Open',        assignee: 'MG', created: '2026-07-03' },
  { id: 'TK-005', title: 'Email notifications not sending',       customer: 'Delta Systems', priority: 'High',   status: 'Resolved',    assignee: 'AJ', created: '2026-07-02' },
];

// ── DASHBOARD ──────────────────────────────────────────────────
export const revenueData: RevenuePoint[] = [
  { month: 'Jan', revenue: 82000,  target: 90000 },
  { month: 'Feb', revenue: 94000,  target: 90000 },
  { month: 'Mar', revenue: 88000,  target: 95000 },
  { month: 'Apr', revenue: 105000, target: 95000 },
  { month: 'May', revenue: 112000, target: 105000 },
  { month: 'Jun', revenue: 128000, target: 110000 },
  { month: 'Jul', revenue: 119000, target: 120000 },
];

export const notifications: AppNotification[] = [
  { id: 'n1', type: 'lead',    text: 'New lead from Acme Corp',      time: '5m ago', unread: true },
  { id: 'n2', type: 'invoice', text: 'Invoice INV-004 is overdue',   time: '1h ago', unread: true },
  { id: 'n3', type: 'task',    text: 'Task assigned: CRM kanban',    time: '2h ago', unread: true },
  { id: 'n4', type: 'ticket',  text: 'TK-001 escalated to Urgent',   time: '3h ago', unread: false },
  { id: 'n5', type: 'leave',   text: 'James Brown — leave approved', time: '1d ago', unread: false },
];
