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
  error: string | null;
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

export const useDataStore = create<DataState>((set, get) => ({
  leads: [],
  salesOrders: [],
  products: [],
  invoices: [],
  employees: [],
  projects: [],
  projectTasks: [],
  manufacturingOrders: [],
  tickets: [],
  loading: true,
  error: null,

  fetchData: async () => {
    // Safety valve: never leave the app stuck on the loading screen.
    const timeout = new Promise<void>((resolve) =>
      setTimeout(() => { set({ loading: false }); resolve(); }, 5000)
    );

    const doFetch = async () => {
      if (!isSupabaseConfigured) {
        set({ ...MOCK_DATA, loading: false, error: null });
        return;
      }
      try {
        const [leadsRes, ordersRes, productsRes, invoicesRes, employeesRes, projectsRes, ticketsRes, mfgRes] =
          await Promise.all([
            supabase.from('leads').select('*'),
            supabase.from('sales_orders').select('*'),
            supabase.from('products').select('*'),
            supabase.from('invoices').select('*'),
            supabase.from('employees').select('*'),
            supabase.from('projects').select('*'),
            supabase.from('tickets').select('*'),
            supabase.from('manufacturing_orders').select('*'),
          ]);

        const results = [leadsRes, ordersRes, productsRes, invoicesRes, employeesRes, projectsRes, ticketsRes, mfgRes];
        const firstError = results.find((r) => r.error)?.error;
        if (firstError) throw new Error(firstError.message);

        set({
          leads: (leadsRes.data ?? []) as Lead[],
          salesOrders: (ordersRes.data ?? []) as SalesOrder[],
          products: (productsRes.data ?? []) as Product[],
          invoices: (invoicesRes.data ?? []) as Invoice[],
          employees: ((employeesRes.data ?? []) as Row[]).map(normalizeEmployee),
          projects: ((projectsRes.data ?? []) as Row[]).map(normalizeProject),
          projectTasks: mockProjectTasks, // project tasks are not persisted yet
          manufacturingOrders: (mfgRes.data ?? []) as ManufacturingOrder[],
          tickets: (ticketsRes.data ?? []) as Ticket[],
          loading: false,
          error: null,
        });
      } catch (err) {
        // Backend unreachable or schema missing — degrade to the local demo dataset.
        const message = err instanceof Error ? err.message : 'Unknown error';
        set({ ...MOCK_DATA, loading: false, error: message });
      }
    };
    await Promise.race([doFetch(), timeout]);
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
