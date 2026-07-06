const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'db.json');

// ── Middleware ──────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── DB helpers ─────────────────────────────────────────────────
function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function nextId(collection) {
  if (!collection.length) return '1';
  const nums = collection.map(i => parseInt(i.id) || 0);
  return String(Math.max(...nums) + 1);
}

// ── Generic CRUD factory ────────────────────────────────────────
function crud(router, resource) {
  // GET all
  router.get(`/api/${resource}`, (req, res) => {
    const db = readDB();
    res.json(db[resource] || []);
  });

  // GET one
  router.get(`/api/${resource}/:id`, (req, res) => {
    const db = readDB();
    const item = (db[resource] || []).find(i => i.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });

  // POST create
  router.post(`/api/${resource}`, (req, res) => {
    const db = readDB();
    const collection = db[resource] || [];
    const item = { id: nextId(collection), ...req.body, createdAt: new Date().toISOString() };
    collection.push(item);
    db[resource] = collection;
    writeDB(db);
    res.status(201).json(item);
  });

  // PUT update
  router.put(`/api/${resource}/:id`, (req, res) => {
    const db = readDB();
    const collection = db[resource] || [];
    const idx = collection.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    collection[idx] = { ...collection[idx], ...req.body, id: req.params.id };
    db[resource] = collection;
    writeDB(db);
    res.json(collection[idx]);
  });

  // PATCH partial update
  router.patch(`/api/${resource}/:id`, (req, res) => {
    const db = readDB();
    const collection = db[resource] || [];
    const idx = collection.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    collection[idx] = { ...collection[idx], ...req.body };
    db[resource] = collection;
    writeDB(db);
    res.json(collection[idx]);
  });

  // DELETE
  router.delete(`/api/${resource}/:id`, (req, res) => {
    const db = readDB();
    const collection = db[resource] || [];
    const idx = collection.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const deleted = collection.splice(idx, 1)[0];
    db[resource] = collection;
    writeDB(db);
    res.json(deleted);
  });
}

// ── Register all routes ─────────────────────────────────────────
// CRM
crud(app, 'leads');
app.get('/api/crm/leads',         (req, res) => { const db = readDB(); res.json(db.leads || []); });
app.post('/api/crm/leads',        (req, res) => { app.handle({ ...req, url: '/api/leads', method: 'POST' }, res); });

// Sales
crud(app, 'salesOrders');
app.get('/api/sales/orders',      (req, res) => { const db = readDB(); res.json(db.salesOrders || []); });

// Inventory
crud(app, 'products');
app.get('/api/inventory/products',(req, res) => { const db = readDB(); res.json(db.products || []); });

// Accounting
crud(app, 'invoices');
app.get('/api/accounting/invoices',(req, res) => { const db = readDB(); res.json(db.invoices || []); });

// HR
crud(app, 'employees');
app.get('/api/hr/employees',      (req, res) => { const db = readDB(); res.json(db.employees || []); });

// Projects
crud(app, 'projects');
app.get('/api/projects',          (req, res) => { const db = readDB(); res.json(db.projects || []); });
crud(app, 'projectTasks');
app.get('/api/projects/tasks',    (req, res) => { const db = readDB(); res.json(db.projectTasks || []); });

// Manufacturing
crud(app, 'manufacturingOrders');
app.get('/api/manufacturing/orders', (req, res) => { const db = readDB(); res.json(db.manufacturingOrders || []); });

// Helpdesk
crud(app, 'tickets');
app.get('/api/helpdesk/tickets',  (req, res) => { const db = readDB(); res.json(db.tickets || []); });

// Notifications + Revenue
app.get('/api/notifications',     (req, res) => { const db = readDB(); res.json(db.notifications || []); });
app.get('/api/revenue',           (req, res) => { const db = readDB(); res.json(db.revenueData || []); });

// ── Dashboard stats ─────────────────────────────────────────────
app.get('/api/dashboard/stats', (req, res) => {
  const db = readDB();
  const leads = db.leads || [];
  const salesOrders = db.salesOrders || [];
  const products = db.products || [];
  const invoices = db.invoices || [];
  const employees = db.employees || [];
  const tickets = db.tickets || [];
  const projects = db.projects || [];

  res.json({
    totalRevenue: salesOrders.reduce((a, o) => a + (o.total || 0), 0),
    openLeads: leads.length,
    pipelineValue: leads.reduce((a, l) => a + (l.revenue || 0), 0),
    activeEmployees: employees.filter(e => e.status === 'Active').length,
    lowStockItems: products.filter(p => p.status !== 'In Stock').length,
    overdueInvoices: invoices.filter(i => i.payment === 'Overdue').length,
    openTickets: tickets.filter(t => t.status !== 'Resolved').length,
    activeProjects: projects.filter(p => p.status === 'In Progress').length,
  });
});

// ── Health check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'Buis AI API running' });
});

// ── 404 handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

app.listen(PORT, () => {
  console.log(`\n✅ Buis AI Backend running at http://localhost:${PORT}`);
  console.log(`📂 Database: db.json (no setup required)`);
  console.log(`🌐 Health:   http://localhost:${PORT}/api/health\n`);
});
