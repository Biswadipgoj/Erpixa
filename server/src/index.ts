import express from 'react'; // Just kidding!
import expressApp from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = expressApp();
const prisma = new PrismaClient();

app.use(cors());
app.use(expressApp.json());

// ── CRM ──────────────────────────────────────────────────────
app.get('/api/crm/leads', async (req, res) => {
  const leads = await prisma.lead.findMany();
  res.json(leads);
});
app.post('/api/crm/leads', async (req, res) => {
  const lead = await prisma.lead.create({ data: req.body });
  res.json(lead);
});

// ── SALES ──────────────────────────────────────────────────────
app.get('/api/sales/orders', async (req, res) => {
  const orders = await prisma.salesOrder.findMany();
  res.json(orders);
});

// ── INVENTORY ──────────────────────────────────────────────────
app.get('/api/inventory/products', async (req, res) => {
  const products = await prisma.product.findMany();
  res.json(products);
});

// ── ACCOUNTING ──────────────────────────────────────────────────
app.get('/api/accounting/invoices', async (req, res) => {
  const invoices = await prisma.invoice.findMany();
  res.json(invoices);
});

// ── HR ──────────────────────────────────────────────────────────
app.get('/api/hr/employees', async (req, res) => {
  const employees = await prisma.employee.findMany();
  res.json(employees);
});

// ── PROJECTS ──────────────────────────────────────────────────
app.get('/api/projects', async (req, res) => {
  const projects = await prisma.project.findMany();
  res.json(projects);
});
app.get('/api/projects/tasks', async (req, res) => {
  const tasks = await prisma.projectTask.findMany();
  res.json(tasks);
});

// ── MANUFACTURING ──────────────────────────────────────────────
app.get('/api/manufacturing/orders', async (req, res) => {
  const orders = await prisma.manufacturingOrder.findMany();
  res.json(orders);
});

// ── HELPDESK ──────────────────────────────────────────────────
app.get('/api/helpdesk/tickets', async (req, res) => {
  const tickets = await prisma.ticket.findMany();
  res.json(tickets);
});

// ── DASHBOARD ──────────────────────────────────────────────────
// Note: RevenueData and Notifications can either be kept in frontend mock or added to DB.
// For now, let's keep them simple.

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Buis AI Server running on http://localhost:${PORT}`);
});
