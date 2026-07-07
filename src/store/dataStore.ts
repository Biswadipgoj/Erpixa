import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore, pushNotification } from './index';
import type {
  Lead, SalesOrder, Product, Invoice, Employee, Project,
  ProjectTask, ManufacturingOrder, Ticket, Customer, Supplier, Campaign,
} from '../types';

export type TableName =
  | 'leads' | 'sales_orders' | 'products' | 'invoices'
  | 'employees' | 'projects' | 'project_tasks' | 'tickets'
  | 'manufacturing_orders' | 'customers' | 'suppliers' | 'campaigns';

/** Maps a Supabase table to its slice of local state. */
const TABLE_TO_KEY: Record<TableName, keyof DataSlices> = {
  leads: 'leads',
  sales_orders: 'salesOrders',
  products: 'products',
  invoices: 'invoices',
  employees: 'employees',
  projects: 'projects',
  project_tasks: 'projectTasks',
  tickets: 'tickets',
  manufacturing_orders: 'manufacturingOrders',
  customers: 'customers',
  suppliers: 'suppliers',
  campaigns: 'campaigns',
};

interface DataSlices {
  leads: Lead[];
  salesOrders: SalesOrder[];
  products: Product[];
  invoices: Invoice[];
  employees: Employee[];
  projects: Project[];
  projectTasks: ProjectTask[];
  manufacturingOrders: ManufacturingOrder[];
  tickets: Ticket[];
  customers: Customer[];
  suppliers: Supplier[];
  campaigns: Campaign[];
}

export interface DataState extends DataSlices {
  loading: boolean;
  /** Non-null when the data fetch failed; the UI shows a retry banner. */
  error: string | null;
  fetchData: () => Promise<void>;
  addRecord: (table: TableName, record: Record<string, unknown>) => Promise<void>;
  updateRecord: (table: TableName, id: string, record: Record<string, unknown>) => Promise<void>;
  deleteRecord: (table: TableName, id: string) => Promise<void>;
  reset: () => void;
}

type Row = Record<string, unknown>;

// ── Normalizers: Postgres snake_case rows → camelCase UI models ─────────────

const str = (v: unknown): string => (v == null ? '' : String(v));
const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0) || 0);

const AVATAR_COLORS = ['#4F46E5', '#7C3AED', '#059669', '#DC2626', '#D97706', '#DB2777', '#0D9488', '#2563EB'];

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?';
}

function colorOf(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const dateOnly = (v: unknown): string => str(v).slice(0, 10);

const normalizeLead = (row: Row): Lead => ({
  id: str(row.id),
  name: str(row.name),
  partner: str(row.partner),
  stage: str(row.stage),
  probability: num(row.probability),
  revenue: num(row.revenue),
  user: str(row.owner_name),
  priority: num(row.priority),
  tag: str(row.tag),
  created: dateOnly(row.created_at),
});

const normalizeSalesOrder = (row: Row): SalesOrder => ({
  id: str(row.id),
  number: str(row.number),
  customer: str(row.customer),
  date: dateOnly(row.date),
  total: num(row.total),
  status: str(row.status),
  salesperson: str(row.salesperson),
});

const productStatus = (qty: number, reorderLevel: number): Product['status'] =>
  qty <= 0 ? 'Out of Stock' : qty <= reorderLevel ? 'Low Stock' : 'In Stock';

const normalizeProduct = (row: Row): Product => {
  const qty = num(row.qty);
  const reorderLevel = num(row.reorder_level);
  return {
    id: str(row.id),
    name: str(row.name),
    category: str(row.category),
    sku: str(row.sku),
    qty,
    reorderLevel,
    price: num(row.price),
    cost: num(row.cost),
    status: productStatus(qty, reorderLevel),
  };
};

const normalizeInvoice = (row: Row): Invoice => ({
  id: str(row.id),
  number: str(row.number),
  customer: str(row.customer),
  date: dateOnly(row.date),
  due: dateOnly(row.due),
  amount: num(row.amount),
  status: str(row.status),
  payment: str(row.payment),
});

const normalizeEmployee = (row: Row): Employee => {
  const name = str(row.name);
  return {
    id: str(row.id),
    name,
    role: str(row.role),
    dept: str(row.dept),
    email: str(row.email),
    phone: str(row.phone),
    status: str(row.status),
    joinDate: dateOnly(row.join_date),
    initials: initialsOf(name),
    color: colorOf(name),
  };
};

const normalizeProject = (row: Row): Project => ({
  id: str(row.id),
  name: str(row.name),
  client: str(row.client),
  status: str(row.status),
  progress: num(row.progress),
  dueDate: dateOnly(row.due_date),
  team: Array.isArray(row.team) ? (row.team as string[]) : [],
  tasks: 0, // filled in by attachTaskCounts
  done: 0,
});

const normalizeTask = (row: Row): ProjectTask => ({
  id: str(row.id),
  projectId: row.project_id == null ? null : str(row.project_id),
  title: str(row.title),
  project: '', // resolved against the projects slice below
  stage: str(row.stage),
  assignee: str(row.assignee),
  priority: str(row.priority),
  due: dateOnly(row.due),
});

const normalizeMfgOrder = (row: Row): ManufacturingOrder => ({
  id: str(row.id),
  product: str(row.product),
  qty: num(row.qty),
  bom: str(row.bom),
  status: str(row.status),
  scheduled: dateOnly(row.scheduled),
  workcenter: str(row.workcenter),
});

const normalizeTicket = (row: Row): Ticket => ({
  id: str(row.id),
  title: str(row.title),
  customer: str(row.customer),
  priority: str(row.priority),
  status: str(row.status),
  assignee: str(row.assignee),
  created: dateOnly(row.created_at),
});

const normalizeParty = (row: Row): Customer => ({
  id: str(row.id),
  name: str(row.name),
  email: str(row.email),
  phone: str(row.phone),
  address: str(row.address),
  notes: str(row.notes),
  createdAt: dateOnly(row.created_at),
});

const normalizeCampaign = (row: Row): Campaign => ({
  id: str(row.id),
  name: str(row.name),
  channel: str(row.channel),
  status: str(row.status),
  budget: num(row.budget),
  spent: num(row.spent),
  leadsGenerated: num(row.leads_generated),
  startDate: dateOnly(row.start_date),
  endDate: dateOnly(row.end_date),
});

const NORMALIZERS: Record<TableName, (row: Row) => DataSlices[keyof DataSlices][number]> = {
  leads: normalizeLead,
  sales_orders: normalizeSalesOrder,
  products: normalizeProduct,
  invoices: normalizeInvoice,
  employees: normalizeEmployee,
  projects: normalizeProject,
  project_tasks: normalizeTask,
  tickets: normalizeTicket,
  manufacturing_orders: normalizeMfgOrder,
  customers: normalizeParty,
  suppliers: normalizeParty as (row: Row) => Supplier,
  campaigns: normalizeCampaign,
};

/** Derives per-project task counts and resolves task → project display names. */
function linkProjectsAndTasks(projects: Project[], tasks: ProjectTask[]): { projects: Project[]; tasks: ProjectTask[] } {
  const nameById = new Map(projects.map((p) => [p.id, p.name]));
  const linkedTasks = tasks.map((t) => ({
    ...t,
    project: (t.projectId && nameById.get(t.projectId)) || t.project || '',
  }));
  const counts = new Map<string, { tasks: number; done: number }>();
  for (const t of linkedTasks) {
    if (!t.projectId) continue;
    const c = counts.get(t.projectId) ?? { tasks: 0, done: 0 };
    c.tasks += 1;
    if (t.stage === 'Done') c.done += 1;
    counts.set(t.projectId, c);
  }
  const linkedProjects = projects.map((p) => {
    const c = counts.get(p.id);
    return c ? { ...p, tasks: c.tasks, done: c.done } : p;
  });
  return { projects: linkedProjects, tasks: linkedTasks };
}

const EMPTY_DATA: DataSlices = {
  leads: [],
  salesOrders: [],
  products: [],
  invoices: [],
  employees: [],
  projects: [],
  projectTasks: [],
  manufacturingOrders: [],
  tickets: [],
  customers: [],
  suppliers: [],
  campaigns: [],
};

/** Human-readable labels for activity notifications. */
const RECORD_LABELS: Record<TableName, { label: string; type: string; nameField: string }> = {
  leads:                { label: 'lead',                type: 'lead',    nameField: 'name' },
  sales_orders:         { label: 'sales order',         type: 'invoice', nameField: 'customer' },
  products:             { label: 'product',             type: 'info',    nameField: 'name' },
  invoices:             { label: 'invoice',             type: 'invoice', nameField: 'customer' },
  employees:            { label: 'employee',            type: 'info',    nameField: 'name' },
  projects:             { label: 'project',             type: 'task',    nameField: 'name' },
  project_tasks:        { label: 'task',                type: 'task',    nameField: 'title' },
  tickets:              { label: 'ticket',              type: 'ticket',  nameField: 'title' },
  manufacturing_orders: { label: 'manufacturing order', type: 'info',    nameField: 'product' },
  customers:            { label: 'customer',            type: 'info',    nameField: 'name' },
  suppliers:            { label: 'supplier',            type: 'info',    nameField: 'name' },
  campaigns:            { label: 'campaign',            type: 'info',    nameField: 'name' },
};

function requireOrg(): { orgId: string; userId: string } {
  const { organization, supabaseUser } = useAuthStore.getState();
  if (!organization || !supabaseUser) {
    throw new Error('No organization loaded — complete onboarding first.');
  }
  return { orgId: organization.id, userId: supabaseUser.id };
}

export const useDataStore = create<DataState>((set, get) => ({
  ...EMPTY_DATA,
  loading: true,
  error: null,

  fetchData: async () => {
    let orgId: string;
    try {
      ({ orgId } = requireOrg());
    } catch {
      set({ ...EMPTY_DATA, loading: false, error: null });
      return;
    }

    set({ loading: true, error: null });

    const scoped = (table: TableName) =>
      supabase.from(table).select('*')
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    try {
      const tables: TableName[] = [
        'leads', 'sales_orders', 'products', 'invoices', 'employees',
        'projects', 'project_tasks', 'tickets', 'manufacturing_orders',
        'customers', 'suppliers', 'campaigns',
      ];
      const results = await Promise.all(tables.map((t) => scoped(t)));

      const failed = results
        .map((r, i) => (r.error ? `${tables[i]}: ${r.error.message}` : null))
        .filter(Boolean);
      if (failed.length > 0) {
        set({
          loading: false,
          error: `Database error — ${failed[0]}${failed.length > 1 ? ` (and ${failed.length - 1} more)` : ''}`,
        });
        return;
      }

      const byTable = Object.fromEntries(tables.map((t, i) => [t, (results[i].data ?? []) as Row[]]));

      const rawProjects = byTable.projects.map(normalizeProject);
      const rawTasks = byTable.project_tasks.map(normalizeTask);
      const { projects, tasks } = linkProjectsAndTasks(rawProjects, rawTasks);

      set({
        leads:               byTable.leads.map(normalizeLead),
        salesOrders:         byTable.sales_orders.map(normalizeSalesOrder),
        products:            byTable.products.map(normalizeProduct),
        invoices:            byTable.invoices.map(normalizeInvoice),
        employees:           byTable.employees.map(normalizeEmployee),
        projects,
        projectTasks:        tasks,
        manufacturingOrders: byTable.manufacturing_orders.map(normalizeMfgOrder),
        tickets:             byTable.tickets.map(normalizeTicket),
        customers:           byTable.customers.map(normalizeParty),
        suppliers:           byTable.suppliers.map(normalizeParty),
        campaigns:           byTable.campaigns.map(normalizeCampaign),
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ loading: false, error: message });
    }
  },

  addRecord: async (table, record) => {
    const { orgId, userId } = requireOrg();
    const { data, error } = await supabase
      .from(table)
      .insert({ ...record, organization_id: orgId, created_by: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const key = TABLE_TO_KEY[table];
    const normalized = NORMALIZERS[table](data as Row);
    set((s) => ({ [key]: [normalized, ...(s[key] as unknown[])] } as Partial<DataState>));
    if (table === 'projects' || table === 'project_tasks') relinkProjects(set, get);

    const meta = RECORD_LABELS[table];
    const displayName = str((data as Row)[meta.nameField]);
    void pushNotification(meta.type, `New ${meta.label}${displayName ? ` — ${displayName}` : ''}`);
  },

  updateRecord: async (table, id, record) => {
    const { orgId } = requireOrg();
    const { data, error } = await supabase
      .from(table)
      .update(record)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();
    if (error) throw new Error(error.message);

    const key = TABLE_TO_KEY[table];
    const normalized = NORMALIZERS[table](data as Row);
    set((s) => ({
      [key]: (s[key] as { id: string }[]).map((r) => (r.id === id ? normalized : r)),
    } as Partial<DataState>));
    if (table === 'projects' || table === 'project_tasks') relinkProjects(set, get);
  },

  deleteRecord: async (table, id) => {
    const { orgId } = requireOrg();
    // Soft delete: the schema intentionally grants no hard-DELETE policy.
    const { error } = await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', orgId);
    if (error) throw new Error(error.message);

    const key = TABLE_TO_KEY[table];
    set((s) => ({
      [key]: (s[key] as { id: string }[]).filter((r) => r.id !== id),
    } as Partial<DataState>));
    if (table === 'projects' || table === 'project_tasks') relinkProjects(set, get);
  },

  reset: () => set({ ...EMPTY_DATA, loading: true, error: null }),
}));

/** Recomputes project task counts + task display names after any project/task mutation. */
function relinkProjects(
  set: (partial: Partial<DataState>) => void,
  get: () => DataState
): void {
  const { projects, tasks } = linkProjectsAndTasks(get().projects, get().projectTasks);
  set({ projects, projectTasks: tasks });
}

/** Generates a human-friendly document number, e.g. INV-260707-4821. */
export function generateDocNumber(prefix: string): string {
  const now = new Date();
  const datePart = [
    String(now.getFullYear()).slice(-2),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `${prefix}-${datePart}-${rand}`;
}
