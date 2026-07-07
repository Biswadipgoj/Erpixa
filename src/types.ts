// Shared domain types used by the stores and pages.
// Database rows are snake_case; the data store normalizes them into these
// camelCase UI models (see store/dataStore.ts).

export type OrgRole = 'owner' | 'admin' | 'manager' | 'member';

export interface Organization {
  id: string;
  name: string;
  business_type: string;
  industry: string;
  country: string;
  currency: string;
  timezone: string;
  fiscal_year_start: number;
  business_size: string;
  tax_scheme: 'none' | 'gst' | 'vat';
  tax_id: string;
  logo_url?: string | null;
  address: string;
  business_email: string;
  phone: string;
  enabled_modules: string[];
  created_at: string;
}

export interface OrganizationInput {
  name: string;
  business_type: string;
  industry: string;
  country: string;
  currency: string;
  timezone: string;
  fiscal_year_start: number;
  business_size: string;
  tax_scheme: 'none' | 'gst' | 'vat';
  tax_id: string;
  logo_url: string | null;
  address: string;
  business_email: string;
  phone: string;
  enabled_modules: string[];
}

export interface OrgMember {
  user_id: string;
  role: OrgRole;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  joined_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
}

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
  number: string;
  customer: string;
  date: string;
  total: number;
  status: 'Draft' | 'Confirmed' | 'Invoiced' | 'Done' | 'Cancelled' | string;
  salesperson: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  qty: number;
  reorderLevel: number;
  price: number;
  cost: number;
  /** Derived from qty vs reorderLevel — not stored in the database. */
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface Invoice {
  id: string;
  number: string;
  customer: string;
  date: string;
  due: string;
  amount: number;
  status: 'Draft' | 'Posted' | 'Cancelled' | string;
  payment: 'Paid' | 'Unpaid' | 'Overdue' | string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  dept: string;
  email: string;
  phone: string;
  status: 'Active' | 'On Leave' | 'Terminated' | string;
  joinDate: string;
  /** Derived from name — not stored in the database. */
  initials: string;
  /** Derived from name — not stored in the database. */
  color: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | string;
  progress: number;
  dueDate: string;
  team: string[];
  /** Derived counts from project_tasks — not stored in the database. */
  tasks: number;
  done: number;
}

export interface ProjectTask {
  id: string;
  projectId: string | null;
  title: string;
  /** Display name of the parent project, resolved by the data store. */
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
  status: 'Planned' | 'In Progress' | 'Done' | 'Cancelled' | string;
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

export interface Campaign {
  id: string;
  name: string;
  channel: 'Email' | 'Social' | 'Ads' | 'SMS' | 'Event' | 'Other' | string;
  status: 'Draft' | 'Active' | 'Paused' | 'Completed' | string;
  budget: number;
  spent: number;
  leadsGenerated: number;
  startDate: string;
  endDate: string;
}

export interface AppNotification {
  id: string;
  type: 'lead' | 'invoice' | 'task' | 'ticket' | 'info' | string;
  text: string;
  time: string;
  unread: boolean;
}
