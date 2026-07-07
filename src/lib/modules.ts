// Single source of truth for the app's navigable modules.
// `icon` is a key into the shared <Icon> set (components/ui/Icon.tsx), not an emoji.
export interface ModuleDef {
  id: string;
  path: string;
  label: string;
  icon: string;
  color: string;
}

export const MODULES: ModuleDef[] = [
  { id: 'dashboard',     path: '/',              label: 'Dashboard',       icon: 'dashboard',     color: '#4F46E5' },
  { id: 'crm',           path: '/crm',           label: 'CRM',             icon: 'crm',           color: '#4F46E5' },
  { id: 'sales',         path: '/sales',         label: 'Sales',           icon: 'sales',         color: '#0D9488' },
  { id: 'inventory',     path: '/inventory',     label: 'Inventory',       icon: 'inventory',     color: '#B45309' },
  { id: 'accounting',    path: '/accounting',    label: 'Accounting',      icon: 'accounting',    color: '#2563EB' },
  { id: 'hr',            path: '/hr',            label: 'Human Resources', icon: 'hr',            color: '#BE185D' },
  { id: 'projects',      path: '/projects',      label: 'Projects',        icon: 'projects',      color: '#6D28D9' },
  { id: 'manufacturing', path: '/manufacturing', label: 'Manufacturing',   icon: 'manufacturing', color: '#DC2626' },
  { id: 'helpdesk',      path: '/helpdesk',      label: 'Helpdesk',        icon: 'helpdesk',      color: '#0D9488' },
  { id: 'marketing',     path: '/marketing',     label: 'Marketing',       icon: 'marketing',     color: '#9333EA' },
];
