import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  crmLeads,
  salesOrders as mockSalesOrders,
  products as mockProducts,
  invoices as mockInvoices,
  employees as mockEmployees,
  projects as mockProjects,
  projectTasks as mockProjectTasks,
  manufacturingOrders as mockMfgOrders,
  tickets as mockTickets,
} from '../data/mockData';
import type {
  Lead, SalesOrder, Product, Invoice, Employee, Project,
  ProjectTask, ManufacturingOrder, Ticket,
} from '../types';

export type TableName =
  | 'leads' | 'sales_orders' | 'products' | 'invoices'
  | 'employees' | 'projects' | 'tickets' | 'manufacturing_orders';

/** Maps a Supabase table to its slice of local state. */
const TABLE_TO_KEY: Record<TableName, keyof DataSlices> = {
  leads: 'leads',
  sales_orders: 'salesOrders',
  products: 'products',
  invoices: 'invoices',
  employees: 'employees',
  projects: 'projects',
  tickets: 'tickets',
  manufacturing_orders: 'manufacturingOrders',
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
}

export interface DataState extends DataSlices {
  loading: boolean;
  /** Non-null when Supabase is configured but data fetch failed. */
  error: string | null;
  /** True only when !isSupabaseConfigured — UI can show "Demo Mode" badge. */
  isDemo: boolean;
  fetchData: () => Promise<void>;
  addRecord: (table: TableName, record: Record<string, unknown>) => Promise<void>;
  updateRecord: (table: TableName, id: string, record: Record<string, unknown>) => Promise<void>;
  deleteRecord: (table: TableName, id: string) => Promise<void>;
}

type Row = Record<string, unknown>;

// Postgres columns are snake_case; the UI model is camelCase.
const normalizeProject = (row: Row): Project => ({
  ...(row as unknown as Project),
  dueDate: (row.due_date ?? row.dueDate ?? '') as string,
  team: (row.team ?? []) as string[],
});

const normalizeEmployee = (row: Row): Employee => ({
  ...(row as unknown as Employee),
  joinDate: (row.join_date ?? row.joinDate ?? '') as string,
});

const MOCK_DATA: DataSlices = {
  leads: crmLeads,
  salesOrders: mockSalesOrders,
  products: mockProducts,
  invoices: mockInvoices,
  employees: mockEmployees,
  projects: mockProjects,
  projectTasks: mockProjectTasks,
  manufacturingOrders: mockMfgOrders,
  tickets: mockTickets,
};

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
};

export const useDataStore = create<DataState>((set, get) => ({
  ...EMPTY_DATA,
  loading: true,
  error: null,
  isDemo: false,

  fetchData: async () => {
    // ── Demo mode: no backend configured ────────────────────────────────────
    if (!isSupabaseConfigured) {
      console.info('[DataStore] Supabase not configured — loading demo data.');
      set({ ...MOCK_DATA, loading: false, error: null, isDemo: true });
      return;
    }

    set({ loading: true, error: null, isDemo: false });
    console.info('[DataStore] Fetching live data from Supabase…');

    // Safety valve: never leave the app stuck on the loading screen.
    const timeoutHandle = setTimeout(() => {
      set({ loading: false, error: 'Data fetch timed out after 8 seconds.' });
    }, 8000);

    try {
      const [
        leadsRes, ordersRes, productsRes, invoicesRes,
        employeesRes, projectsRes, ticketsRes, mfgRes,
      ] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('sales_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('name', { ascending: true }),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('employees').select('*').order('name', { ascending: true }),
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('tickets').select('*').order('created_at', { ascending: false }),
        supabase.from('manufacturing_orders').select('*').order('created_at', { ascending: false }),
      ]);

      clearTimeout(timeoutHandle);

      // Surface the first error from any table query
      const results = [leadsRes, ordersRes, productsRes, invoicesRes, employeesRes, projectsRes, ticketsRes, mfgRes];
      const firstError = results.find((r) => r.error)?.error;

      if (firstError) {
        console.error('[DataStore] Supabase query error:', firstError);
        set({
          ...EMPTY_DATA,
          loading: false,
          error: `Database error (${firstError.code ?? 'unknown'}): ${firstError.message}`,
          isDemo: false,
        });
        return;
      }

      const data: DataSlices = {
        leads:               (leadsRes.data     ?? []) as Lead[],
        salesOrders:         (ordersRes.data    ?? []) as SalesOrder[],
        products:            (productsRes.data  ?? []) as Product[],
        invoices:            (invoicesRes.data  ?? []) as Invoice[],
        employees:           ((employeesRes.data ?? []) as Row[]).map(normalizeEmployee),
        projects:            ((projectsRes.data  ?? []) as Row[]).map(normalizeProject),
        projectTasks:        mockProjectTasks, // tasks live in Supabase not yet — keep local
        manufacturingOrders: (mfgRes.data       ?? []) as ManufacturingOrder[],
        tickets:             (ticketsRes.data    ?? []) as Ticket[],
      };

      console.info('[DataStore] Live data loaded:', {
        leads: data.leads.length,
        salesOrders: data.salesOrders.length,
        products: data.products.length,
        invoices: data.invoices.length,
        employees: data.employees.length,
        projects: data.projects.length,
        tickets: data.tickets.length,
        manufacturingOrders: data.manufacturingOrders.length,
      });

      set({ ...data, loading: false, error: null, isDemo: false });

    } catch (err) {
      clearTimeout(timeoutHandle);
      const message = err instanceof Error ? err.message : String(err);
      console.error('[DataStore] Fetch failed:', message);
      set({
        ...EMPTY_DATA,
        loading: false,
        error: message,
        isDemo: false,
      });
    }
  },

  addRecord: async (table, record) => {
    if (!isSupabaseConfigured) {
      const key = TABLE_TO_KEY[table];
      const withId = { id: `local-${Date.now()}`, ...record };
      set((s) => ({ [key]: [withId, ...(s[key] as unknown as Row[])] } as Partial<DataState>));
      return;
    }
    const { error } = await supabase.from(table).insert(record);
    if (error) throw new Error(error.message);
    await get().fetchData();
  },

  updateRecord: async (table, id, record) => {
    const key = TABLE_TO_KEY[table];
    if (!isSupabaseConfigured) {
      set((s) => ({
        [key]: (s[key] as unknown as Row[]).map((r) => (r.id === id ? { ...r, ...record } : r)),
      } as Partial<DataState>));
      return;
    }
    const { error } = await supabase.from(table).update(record).eq('id', id);
    if (error) throw new Error(error.message);
    await get().fetchData();
  },

  deleteRecord: async (table, id) => {
    const key = TABLE_TO_KEY[table];
    if (!isSupabaseConfigured) {
      set((s) => ({
        [key]: (s[key] as unknown as Row[]).filter((r) => r.id !== id),
      } as Partial<DataState>));
      return;
    }
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw new Error(error.message);
    await get().fetchData();
  },
}));
