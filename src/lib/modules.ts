// Single source of truth for the app's navigable modules.
export interface ModuleDef {
  id: string;
  path: string;
  label: string;
  icon: string;
  color: string;
  gradient: string;
}

export const MODULES: ModuleDef[] = [
  // Core Modules
  { id: 'dashboard',     path: '/',              label: 'Dashboard',       icon: '📊', color: '#7C3AED', gradient: 'linear-gradient(135deg,#7C3AED,#4F46E5)' },
  { id: 'crm',           path: '/crm',           label: 'CRM',             icon: '🎯', color: '#4F46E5', gradient: 'linear-gradient(135deg,#4F46E5,#7C3AED)' },
  { id: 'sales',         path: '/sales',         label: 'Sales',           icon: '💼', color: '#059669', gradient: 'linear-gradient(135deg,#059669,#06B6D4)' },
  { id: 'inventory',     path: '/inventory',     label: 'Inventory',       icon: '📦', color: '#D97706', gradient: 'linear-gradient(135deg,#D97706,#DC2626)' },
  { id: 'accounting',    path: '/accounting',    label: 'Accounting',      icon: '🧾', color: '#2563EB', gradient: 'linear-gradient(135deg,#2563EB,#6366F1)' },
  { id: 'hr',            path: '/hr',            label: 'Human Resources', icon: '👥', color: '#DB2777', gradient: 'linear-gradient(135deg,#DB2777,#9333EA)' },
  { id: 'projects',      path: '/projects',      label: 'Projects',        icon: '📋', color: '#7C3AED', gradient: 'linear-gradient(135deg,#7C3AED,#2563EB)' },
  { id: 'manufacturing', path: '/manufacturing', label: 'Manufacturing',   icon: '🏭', color: '#DC2626', gradient: 'linear-gradient(135deg,#DC2626,#EA580C)' },
  { id: 'helpdesk',      path: '/helpdesk',      label: 'Helpdesk',        icon: '🎫', color: '#0D9488', gradient: 'linear-gradient(135deg,#0D9488,#06B6D4)' },
  { id: 'marketing',     path: '/marketing',     label: 'Marketing',       icon: '📣', color: '#9333EA', gradient: 'linear-gradient(135deg,#9333EA,#DB2777)' },
  
  // Restaurant / Retail specific
  { id: 'pos',           path: '/pos',           label: 'POS System',      icon: '🛍️', color: '#059669', gradient: 'linear-gradient(135deg,#059669,#10B981)' },
  { id: 'kitchen',       path: '/kitchen',       label: 'Kitchen Display', icon: '🍳', color: '#DC2626', gradient: 'linear-gradient(135deg,#DC2626,#EF4444)' },
  { id: 'tables',        path: '/tables',        label: 'Table Management',icon: '🪑', color: '#D97706', gradient: 'linear-gradient(135deg,#D97706,#F59E0B)' },
  { id: 'menu',          path: '/menu',          label: 'Menu Management', icon: '📖', color: '#7C3AED', gradient: 'linear-gradient(135deg,#7C3AED,#8B5CF6)' },
  { id: 'delivery',      path: '/delivery',      label: 'Delivery Tracking',icon: '🛵', color: '#2563EB', gradient: 'linear-gradient(135deg,#2563EB,#3B82F6)' },
  { id: 'reservations',  path: '/reservations',  label: 'Reservations',    icon: '📅', color: '#DB2777', gradient: 'linear-gradient(135deg,#DB2777,#EC4899)' },

  // Manufacturing specific
  { id: 'bom',           path: '/bom',           label: 'Bill of Materials',icon: '📋', color: '#0D9488', gradient: 'linear-gradient(135deg,#0D9488,#14B8A6)' },
  { id: 'mrp',           path: '/mrp',           label: 'MRP Planning',    icon: '⚙️', color: '#2563EB', gradient: 'linear-gradient(135deg,#2563EB,#3B82F6)' },
  { id: 'factory',       path: '/factory',       label: 'Factory Layout',  icon: '🏗️', color: '#4F46E5', gradient: 'linear-gradient(135deg,#4F46E5,#6366F1)' },
  { id: 'machines',      path: '/machines',      label: 'Machine Mgt',     icon: '📠', color: '#DC2626', gradient: 'linear-gradient(135deg,#DC2626,#EF4444)' },
  { id: 'purchase',      path: '/purchase',      label: 'Purchase Orders', icon: '🛒', color: '#059669', gradient: 'linear-gradient(135deg,#059669,#10B981)' },
  { id: 'warehouse',     path: '/warehouse',     label: 'Warehouse',       icon: '🏬', color: '#D97706', gradient: 'linear-gradient(135deg,#D97706,#F59E0B)' },

  // Consultancy / Service specific
  { id: 'clients',       path: '/clients',       label: 'Client Portal',   icon: '🤝', color: '#7C3AED', gradient: 'linear-gradient(135deg,#7C3AED,#8B5CF6)' },
  { id: 'documents',     path: '/documents',     label: 'Document Center', icon: '📄', color: '#4F46E5', gradient: 'linear-gradient(135deg,#4F46E5,#6366F1)' },
];

export const SETTINGS_GRADIENT = 'linear-gradient(135deg,#475569,#334155)';
