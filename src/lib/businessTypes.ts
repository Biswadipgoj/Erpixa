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
const ALL = ['crm', 'sales', 'inventory', 'accounting', 'hr', 'projects', 'manufacturing', 'helpdesk', 'marketing'];

export const BUSINESS_TYPES: BusinessTypeDef[] = [
  { id: 'retail',           label: 'Retail Store',      icon: 'store',        modules: [...CORE, 'crm', 'inventory', 'hr', 'marketing'] },
  { id: 'restaurant',       label: 'Restaurant',        icon: 'restaurant',   modules: [...CORE, 'inventory', 'hr', 'helpdesk', 'marketing'] },
  { id: 'cafe',             label: 'Cafe',              icon: 'cafe',         modules: [...CORE, 'inventory', 'hr', 'marketing'] },
  { id: 'manufacturing',    label: 'Manufacturing',     icon: 'factory',      modules: [...CORE, 'crm', 'inventory', 'hr', 'projects', 'manufacturing'] },
  { id: 'wholesale',        label: 'Wholesale',         icon: 'box',          modules: [...CORE, 'crm', 'inventory', 'hr'] },
  { id: 'distributor',      label: 'Distributor',       icon: 'truck',        modules: [...CORE, 'crm', 'inventory', 'hr', 'helpdesk'] },
  { id: 'medical_store',    label: 'Medical Store',     icon: 'pill',         modules: [...CORE, 'inventory', 'hr'] },
  { id: 'electronics_shop', label: 'Electronics Shop',  icon: 'plug',         modules: [...CORE, 'crm', 'inventory', 'hr', 'helpdesk', 'marketing'] },
  { id: 'clothing_store',   label: 'Clothing Store',    icon: 'shirt',        modules: [...CORE, 'inventory', 'hr', 'marketing'] },
  { id: 'jewellery',        label: 'Jewellery',         icon: 'gem',          modules: [...CORE, 'crm', 'inventory', 'hr'] },
  { id: 'construction',     label: 'Construction',      icon: 'crane',        modules: [...CORE, 'crm', 'projects', 'inventory', 'hr'] },
  { id: 'freelancer',       label: 'Freelancer',        icon: 'laptop',       modules: ['sales', 'accounting', 'crm', 'projects', 'marketing'] },
  { id: 'consultancy',      label: 'Consultancy',       icon: 'chart',        modules: [...CORE, 'crm', 'projects', 'hr'] },
  { id: 'agency',           label: 'Agency',            icon: 'palette',      modules: [...CORE, 'crm', 'projects', 'hr', 'marketing'] },
  { id: 'salon',            label: 'Salon',             icon: 'scissors',     modules: [...CORE, 'inventory', 'hr', 'marketing'] },
  { id: 'gym',              label: 'Gym',               icon: 'dumbbell',     modules: [...CORE, 'crm', 'hr', 'marketing', 'helpdesk'] },
  { id: 'school',           label: 'School',            icon: 'graduation',   modules: ['accounting', 'hr', 'projects', 'helpdesk'] },
  { id: 'hospital',         label: 'Hospital',          icon: 'hospital',     modules: ['accounting', 'hr', 'inventory', 'helpdesk', 'projects'] },
  { id: 'clinic',           label: 'Clinic',            icon: 'stethoscope',  modules: ['accounting', 'hr', 'inventory', 'helpdesk'] },
  { id: 'warehouse',        label: 'Warehouse',         icon: 'warehouse',    modules: [...CORE, 'inventory', 'hr', 'helpdesk'] },
  { id: 'automobile',       label: 'Automobile',        icon: 'car',          modules: [...CORE, 'crm', 'inventory', 'hr', 'helpdesk'] },
  { id: 'service_business', label: 'Service Business',  icon: 'wrench',       modules: [...CORE, 'crm', 'hr', 'helpdesk', 'projects'] },
  { id: 'repair_shop',      label: 'Repair Shop',       icon: 'tool',         modules: [...CORE, 'inventory', 'helpdesk'] },
  { id: 'ecommerce',        label: 'E-commerce',        icon: 'cart',         modules: [...CORE, 'crm', 'inventory', 'marketing', 'helpdesk'] },
  { id: 'agriculture',      label: 'Agriculture',       icon: 'wheat',        modules: [...CORE, 'inventory', 'hr'] },
  { id: 'pharmacy',         label: 'Pharmacy',          icon: 'pill',         modules: [...CORE, 'inventory', 'hr'] },
  { id: 'logistics',        label: 'Logistics',         icon: 'plane',        modules: [...CORE, 'inventory', 'hr', 'projects', 'helpdesk'] },
  { id: 'hotel',            label: 'Hotel',             icon: 'hotel',        modules: [...CORE, 'crm', 'hr', 'helpdesk', 'marketing'] },
  { id: 'real_estate',      label: 'Real Estate',       icon: 'home',         modules: [...CORE, 'crm', 'projects', 'marketing'] },
  { id: 'custom',           label: 'Custom Business',   icon: 'settings',     modules: [...ALL] },
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
