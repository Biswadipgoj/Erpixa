import { PrismaClient } from '@prisma/client';
import {
  crmLeads,
  salesOrders,
  products,
  invoices,
  employees,
  projects,
  projectTasks,
  manufacturingOrders,
  tickets
} from '../../src/data/mockData';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Leads
  for (const lead of crmLeads) {
    await prisma.lead.create({
      data: {
        id: lead.id,
        name: lead.name,
        partner: lead.partner,
        stage: lead.stage,
        probability: lead.probability,
        revenue: lead.revenue,
        user: lead.user,
        priority: lead.priority,
        tag: lead.tag,
        created: lead.created,
      },
    });
  }

  // Sales Orders
  for (const so of salesOrders) {
    await prisma.salesOrder.create({
      data: {
        id: so.id,
        customer: so.customer,
        date: so.date,
        total: so.total,
        status: so.status,
        salesperson: so.salesperson,
      },
    });
  }

  // Products
  for (const p of products) {
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        category: p.category,
        qty: p.qty,
        price: p.price,
        status: p.status,
      },
    });
  }

  // Invoices
  for (const inv of invoices) {
    await prisma.invoice.create({
      data: {
        id: inv.id,
        customer: inv.customer,
        date: inv.date,
        due: inv.due,
        amount: inv.amount,
        status: inv.status,
        payment: inv.payment,
      },
    });
  }

  // Employees
  for (const emp of employees) {
    await prisma.employee.create({
      data: {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        dept: emp.dept,
        email: emp.email,
        phone: emp.phone,
        status: emp.status,
        joinDate: emp.joinDate,
        initials: emp.initials,
        color: emp.color,
      },
    });
  }

  // Projects
  for (const proj of projects) {
    await prisma.project.create({
      data: {
        id: proj.id,
        name: proj.name,
        client: proj.client,
        status: proj.status,
        progress: proj.progress,
        dueDate: proj.dueDate,
        team: proj.team.join(','),
        tasks: proj.tasks,
        done: proj.done,
      },
    });
  }

  // Project Tasks
  for (const pt of projectTasks) {
    await prisma.projectTask.create({
      data: {
        id: pt.id,
        title: pt.title,
        project: pt.project,
        stage: pt.stage,
        assignee: pt.assignee,
        priority: pt.priority,
        due: pt.due,
      },
    });
  }

  // Manufacturing Orders
  for (const mo of manufacturingOrders) {
    await prisma.manufacturingOrder.create({
      data: {
        id: mo.id,
        product: mo.product,
        qty: mo.qty,
        bom: mo.bom,
        status: mo.status,
        scheduled: mo.scheduled,
        workcenter: mo.workcenter,
      },
    });
  }

  // Tickets
  for (const t of tickets) {
    await prisma.ticket.create({
      data: {
        id: t.id,
        title: t.title,
        customer: t.customer,
        priority: t.priority,
        status: t.status,
        assignee: t.assignee,
        created: t.created,
      },
    });
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
