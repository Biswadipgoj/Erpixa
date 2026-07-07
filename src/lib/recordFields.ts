// Field definitions for the create/edit modals on each module page.
// `name` is the database column (rows are inserted with these keys), so this
// file is the contract between the UI forms and the Postgres schema.
import type { FieldDef } from '../components/ui/RecordModal';
import { CRM_STAGES } from './crmStages';

export const LEAD_FIELDS: FieldDef[] = [
  { name: 'name', label: 'Lead / deal name', type: 'text', required: true, placeholder: 'e.g. Website redesign' },
  { name: 'partner', label: 'Company / contact', type: 'text', placeholder: 'e.g. Acme Corp' },
  { name: 'stage', label: 'Stage', type: 'select', options: CRM_STAGES.map((s) => ({ value: s.id, label: s.name })) },
  { name: 'revenue', label: 'Expected revenue', type: 'number', min: 0, placeholder: '0' },
  { name: 'probability', label: 'Probability (%)', type: 'number', min: 0, defaultValue: '10' },
  { name: 'owner_name', label: 'Owner', type: 'text', placeholder: 'Assigned to' },
  { name: 'tag', label: 'Tag', type: 'select', options: ['Hot', 'Warm', 'Cold'] },
];

export const SALES_ORDER_FIELDS: FieldDef[] = [
  { name: 'customer', label: 'Customer', type: 'text', required: true, placeholder: 'Customer name' },
  { name: 'date', label: 'Order date', type: 'date' },
  { name: 'total', label: 'Order total', type: 'number', min: 0, placeholder: '0' },
  { name: 'salesperson', label: 'Salesperson', type: 'text', placeholder: 'Assigned to' },
  { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Confirmed', 'Invoiced', 'Done', 'Cancelled'] },
];

export const PRODUCT_FIELDS: FieldDef[] = [
  { name: 'name', label: 'Product name', type: 'text', required: true, placeholder: 'e.g. Wireless mouse' },
  { name: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Accessories' },
  { name: 'sku', label: 'SKU', type: 'text', placeholder: 'e.g. ACC-1042' },
  { name: 'qty', label: 'Quantity on hand', type: 'number', min: 0, defaultValue: '0' },
  { name: 'reorder_level', label: 'Reorder level', type: 'number', min: 0, defaultValue: '10' },
  { name: 'price', label: 'Sale price', type: 'number', min: 0, placeholder: '0' },
  { name: 'cost', label: 'Unit cost', type: 'number', min: 0, placeholder: '0' },
];

export const INVOICE_FIELDS: FieldDef[] = [
  { name: 'customer', label: 'Customer', type: 'text', required: true, placeholder: 'Customer name' },
  { name: 'date', label: 'Invoice date', type: 'date' },
  { name: 'due', label: 'Due date', type: 'date' },
  { name: 'amount', label: 'Amount', type: 'number', min: 0, placeholder: '0' },
  { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Posted', 'Cancelled'] },
  { name: 'payment', label: 'Payment', type: 'select', options: ['Unpaid', 'Paid', 'Overdue'] },
];

export const EMPLOYEE_FIELDS: FieldDef[] = [
  { name: 'name', label: 'Full name', type: 'text', required: true, placeholder: 'e.g. Priya Sharma' },
  { name: 'role', label: 'Job title', type: 'text', placeholder: 'e.g. Account Manager' },
  { name: 'dept', label: 'Department', type: 'text', placeholder: 'e.g. Sales' },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'name@company.com' },
  { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 555 000 0000' },
  { name: 'status', label: 'Status', type: 'select', options: ['Active', 'On Leave', 'Terminated'] },
  { name: 'join_date', label: 'Join date', type: 'date' },
];

export const PROJECT_FIELDS: FieldDef[] = [
  { name: 'name', label: 'Project name', type: 'text', required: true, placeholder: 'e.g. Mobile app launch' },
  { name: 'client', label: 'Client', type: 'text', placeholder: 'Client name' },
  { name: 'status', label: 'Status', type: 'select', options: ['Planning', 'In Progress', 'On Hold', 'Completed'] },
  { name: 'progress', label: 'Progress (%)', type: 'number', min: 0, defaultValue: '0' },
  { name: 'due_date', label: 'Due date', type: 'date' },
];

export const TICKET_FIELDS: FieldDef[] = [
  { name: 'title', label: 'Subject', type: 'text', required: true, placeholder: 'Short summary of the issue' },
  { name: 'customer', label: 'Customer', type: 'text', placeholder: 'Who reported it' },
  { name: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'] },
  { name: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Resolved'] },
  { name: 'assignee', label: 'Assignee', type: 'text', placeholder: 'Assigned to' },
];

export const MFG_ORDER_FIELDS: FieldDef[] = [
  { name: 'product', label: 'Product', type: 'text', required: true, placeholder: 'What is being produced' },
  { name: 'qty', label: 'Quantity', type: 'number', min: 0, defaultValue: '0' },
  { name: 'bom', label: 'Bill of materials', type: 'text', placeholder: 'BOM reference' },
  { name: 'workcenter', label: 'Workcenter', type: 'text', placeholder: 'e.g. Assembly A' },
  { name: 'scheduled', label: 'Scheduled date', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', options: ['Planned', 'In Progress', 'Done', 'Cancelled'] },
];

export const CAMPAIGN_FIELDS: FieldDef[] = [
  { name: 'name', label: 'Campaign name', type: 'text', required: true, placeholder: 'e.g. Spring launch' },
  { name: 'channel', label: 'Channel', type: 'select', options: ['Email', 'Social', 'Ads', 'SMS', 'Event', 'Other'] },
  { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Active', 'Paused', 'Completed'] },
  { name: 'budget', label: 'Budget', type: 'number', min: 0, placeholder: '0' },
  { name: 'spent', label: 'Spent', type: 'number', min: 0, placeholder: '0' },
  { name: 'leads_generated', label: 'Leads generated', type: 'number', min: 0, defaultValue: '0' },
  { name: 'start_date', label: 'Start date', type: 'date' },
  { name: 'end_date', label: 'End date', type: 'date' },
];
