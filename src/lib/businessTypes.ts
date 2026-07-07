// Business-type system: each type maps to the set of ERP modules that make
// sense for that kind of business. Selected during onboarding; the resulting
// module list is stored on the organization and drives navigation + routing.
// 'dashboard' is always enabled and never listed here.

export interface BusinessTypeDef {
  id: string;
  label: string;
  icon: string;
  /** Module ids (see lib/modules.ts) enabled by default for this business type. */
  modules: string[];
}

const CORE = ['sales', 'accounting'];

export const BUSINESS_TYPES: BusinessTypeDef[] = [
  { id: 'retail',           label: 'Retail Store',      icon: '🏪', modules: [...CORE, 'crm', 'inventory', 'hr', 'marketing', 'pos'] },
  { id: 'restaurant',       label: 'Restaurant',        icon: '🍽️', modules: [...CORE, 'inventory', 'hr', 'helpdesk', 'marketing', 'pos', 'kitchen', 'tables', 'menu', 'delivery', 'reservations'] },
  { id: 'cafe',             label: 'Cafe',              icon: '☕', modules: [...CORE, 'inventory', 'hr', 'marketing', 'pos', 'tables', 'menu'] },
  { id: 'manufacturing',    label: 'Manufacturing',     icon: '🏭', modules: [...CORE, 'crm', 'inventory', 'hr', 'projects', 'manufacturing', 'bom', 'mrp', 'factory', 'machines', 'purchase', 'warehouse'] },
  { id: 'wholesale',        label: 'Wholesale',         icon: '📦', modules: [...CORE, 'crm', 'inventory', 'hr', 'warehouse', 'purchase'] },
  { id: 'distributor',      label: 'Distributor',       icon: '🚚', modules: [...CORE, 'crm', 'inventory', 'hr', 'helpdesk', 'warehouse'] },
  { id: 'medical_store',    label: 'Medical Store',     icon: '💊', modules: [...CORE, 'inventory', 'hr', 'pos'] },
  { id: 'electronics_shop', label: 'Electronics Shop',  icon: '🔌', modules: [...CORE, 'crm', 'inventory', 'hr', 'helpdesk', 'marketing', 'pos'] },
  { id: 'clothing_store',   label: 'Clothing Store',    icon: '👗', modules: [...CORE, 'inventory', 'hr', 'marketing', 'pos'] },
  { id: 'jewellery',        label: 'Jewellery',         icon: '💎', modules: [...CORE, 'crm', 'inventory', 'hr', 'pos'] },
  { id: 'construction',     label: 'Construction',      icon: '🏗️', modules: [...CORE, 'crm', 'projects', 'inventory', 'hr', 'purchase'] },
  { id: 'freelancer',       label: 'Freelancer',        icon: '💻', modules: ['sales', 'accounting', 'crm', 'projects', 'marketing', 'clients', 'documents'] },
  { id: 'consultancy',      label: 'Consultancy',       icon: '📊', modules: [...CORE, 'crm', 'projects', 'hr', 'clients', 'documents'] },
  { id: 'agency',           label: 'Agency',            icon: '🎨', modules: [...CORE, 'crm', 'projects', 'hr', 'marketing', 'clients', 'documents'] },
  { id: 'salon',            label: 'Salon',             icon: '💇', modules: [...CORE, 'inventory', 'hr', 'marketing', 'pos', 'reservations'] },
  { id: 'gym',              label: 'Gym',               icon: '🏋️', modules: [...CORE, 'crm', 'hr', 'marketing', 'helpdesk', 'pos'] },
  { id: 'school',           label: 'School',            icon: '🎓', modules: ['accounting', 'hr', 'projects', 'helpdesk', 'documents'] },
  { id: 'hospital',         label: 'Hospital',          icon: '🏥', modules: ['accounting', 'hr', 'inventory', 'helpdesk', 'projects', 'documents'] },
  { id: 'clinic',           label: 'Clinic',            icon: '🩺', modules: ['accounting', 'hr', 'inventory', 'helpdesk', 'reservations'] },
  { id: 'warehouse',        label: 'Warehouse',         icon: '🏬', modules: [...CORE, 'inventory', 'hr', 'helpdesk', 'warehouse'] },
  { id: 'automobile',       label: 'Automobile',        icon: '🚗', modules: [...CORE, 'crm', 'inventory', 'hr', 'helpdesk', 'purchase'] },
  { id: 'service_business', label: 'Service Business',  icon: '🛠️', modules: [...CORE, 'crm', 'hr', 'helpdesk', 'projects', 'clients'] },
  { id: 'repair_shop',      label: 'Repair Shop',       icon: '🔧', modules: [...CORE, 'inventory', 'helpdesk', 'pos'] },
  { id: 'ecommerce',        label: 'E-commerce',        icon: '🛒', modules: [...CORE, 'crm', 'inventory', 'marketing', 'helpdesk', 'delivery'] },
  { id: 'agriculture',      label: 'Agriculture',       icon: '🌾', modules: [...CORE, 'inventory', 'hr', 'warehouse'] },
  { id: 'pharmacy',         label: 'Pharmacy',          icon: '⚕️', modules: [...CORE, 'inventory', 'hr', 'pos'] },
  { id: 'logistics',        label: 'Logistics',         icon: '✈️', modules: [...CORE, 'inventory', 'hr', 'projects', 'helpdesk', 'delivery', 'warehouse'] },
  { id: 'hotel',            label: 'Hotel',             icon: '🏨', modules: [...CORE, 'crm', 'hr', 'helpdesk', 'marketing', 'reservations', 'kitchen'] },
  { id: 'real_estate',      label: 'Real Estate',       icon: '🏠', modules: [...CORE, 'crm', 'projects', 'marketing', 'documents', 'clients'] },
  { id: 'custom',           label: 'Custom Business',   icon: '⚙️', modules: [...CORE, 'crm', 'inventory', 'hr', 'projects', 'manufacturing', 'helpdesk', 'marketing', 'pos', 'clients', 'documents'] },
];

export function businessTypeById(id: string): BusinessTypeDef {
  return BUSINESS_TYPES.find((t) => t.id === id) ?? BUSINESS_TYPES[BUSINESS_TYPES.length - 1];
}

export const BUSINESS_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'] as const;

export const TAX_SCHEMES = [
  { id: 'none', label: 'No GST / VAT' },
  { id: 'gst',  label: 'GST' },
  { id: 'vat',  label: 'VAT' },
] as const;

export const FISCAL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Common countries for the onboarding dropdown (extendable free-text fallback). */
export const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Australia', 'Canada', 'Germany',
  'France', 'Japan', 'Singapore', 'United Arab Emirates', 'Saudi Arabia',
  'Brazil', 'Mexico', 'South Korea', 'Netherlands', 'Spain', 'Italy',
  'Switzerland', 'Sweden', 'Norway', 'Denmark', 'New Zealand', 'South Africa',
  'Indonesia', 'Malaysia', 'Thailand', 'Vietnam', 'Philippines', 'Bangladesh',
  'Pakistan', 'Nigeria', 'Kenya', 'Egypt', 'Other',
];

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function listTimezones(): string[] {
  try {
    const zones = Intl.supportedValuesOf('timeZone');
    if (zones.length > 0) return zones;
  } catch { /* older runtimes — fall through */ }
  return ['UTC', 'Asia/Kolkata', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Singapore', 'Asia/Dubai', 'Australia/Sydney', 'Asia/Tokyo'];
}
