// Shared domain types used by the data store, mock data, and pages.

export interface Lead {
  id: string;
  name: string;
  partner: string;
  stage: string;
  probability: number;
  revenue: number;
  user: string;
  priority: number;
  tag: 'Hot' | 'Warm' | 'Cold' | 'Won' | string;
  created: string;
}

export interface CRMStage {
  id: string;
  name: string;
  probability: number;
  color: string;
}

export interface SalesOrder {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: 'Draft' | 'Confirmed' | 'Invoiced' | 'Done' | string;
  salesperson: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  qty: number;
  price: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | string;
}

export interface Invoice {
  id: string;
  customer: string;
  date: string;
  due: string;
  amount: number;
  status: 'Draft' | 'Posted' | string;
  payment: 'Paid' | 'Unpaid' | 'Overdue' | string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  dept: string;
  email: string;
  phone: string;
  status: 'Active' | 'On Leave' | string;
  joinDate: string;
  initials: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: 'Planning' | 'In Progress' | 'Completed' | string;
  progress: number;
  dueDate: string;
  team: string[];
  tasks: number;
  done: number;
}

export interface ProjectTask {
  id: string;
  title: string;
  project: string;
  stage: 'To Do' | 'In Progress' | 'Done' | string;
  assignee: string;
  priority: 'Low' | 'Medium' | 'High' | string;
  due: string;
}

export interface ManufacturingOrder {
  id: string;
  product: string;
  qty: number;
  bom: string;
  status: 'Planned' | 'In Progress' | 'Done' | string;
  scheduled: string;
  workcenter: string;
}

export interface Ticket {
  id: string;
  title: string;
  customer: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | string;
  status: 'Open' | 'In Progress' | 'Resolved' | string;
  assignee: string;
  created: string;
}

export interface RevenuePoint {
  month: string;
  revenue: number;
  target: number;
}

export interface AppNotification {
  id: string;
  type: 'lead' | 'invoice' | 'task' | 'ticket' | 'leave' | string;
  text: string;
  time: string;
  unread: boolean;
}
