// Single source of truth for the app's navigable modules.
// `icon` is a key into the shared <Icon> set (components/ui/Icon.tsx), not an emoji.
// `group` decides which sidebar section a module sits in; order here is nav order.
export type ModuleGroup = 'Overview' | 'Sell' | 'Operate' | 'Finance & people';

export interface ModuleDef {
  id: string;
  path: string;
  label: string;
  icon: string;
  group: ModuleGroup;
  /** One-line description used as the page subtitle and in the switcher. */
  blurb: string;
}

export const MODULE_GROUPS: ModuleGroup[] = ['Overview', 'Sell', 'Operate', 'Finance & people'];

export const MODULES: ModuleDef[] = [
  { id: 'dashboard',     path: '/',              label: 'Dashboard',       icon: 'dashboard',     group: 'Overview',         blurb: 'Where the business stands today.' },
  { id: 'crm',           path: '/crm',           label: 'CRM',             icon: 'crm',           group: 'Sell',             blurb: 'Leads and opportunities, stage by stage.' },
  { id: 'sales',         path: '/sales',         label: 'Sales',           icon: 'sales',         group: 'Sell',             blurb: 'Quotations and confirmed customer orders.' },
  { id: 'marketing',     path: '/marketing',     label: 'Marketing',       icon: 'marketing',     group: 'Sell',             blurb: 'Campaign spend against the leads it brings in.' },
  { id: 'inventory',     path: '/inventory',     label: 'Inventory',       icon: 'inventory',     group: 'Operate',          blurb: 'Stock on hand, valuations and reorder points.' },
  { id: 'manufacturing', path: '/manufacturing', label: 'Manufacturing',   icon: 'manufacturing', group: 'Operate',          blurb: 'Production orders from plan to done.' },
  { id: 'projects',      path: '/projects',      label: 'Projects',        icon: 'projects',      group: 'Operate',          blurb: 'Deliverables, deadlines and team progress.' },
  { id: 'helpdesk',      path: '/helpdesk',      label: 'Helpdesk',        icon: 'helpdesk',      group: 'Operate',          blurb: 'Customer issues, by priority and owner.' },
  { id: 'accounting',    path: '/accounting',    label: 'Accounting',      icon: 'accounting',    group: 'Finance & people', blurb: 'Invoices, receivables and what’s overdue.' },
  { id: 'hr',            path: '/hr',            label: 'Human Resources', icon: 'hr',            group: 'Finance & people', blurb: 'Your team directory and headcount.' },
];

export const moduleById = (id: string): ModuleDef => MODULES.find((m) => m.id === id) ?? MODULES[0];
