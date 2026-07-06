import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  crmLeads,
  salesOrders as mockSalesOrders,
  products as inventoryProducts,
  invoices as accountingInvoices,
  employees as hrEmployees,
  projects as projectsData,
  projectTasks as mockProjectTasks,
  manufacturingOrders as mockMfgOrders,
  tickets as helpdeskTickets
} from '../data/mockData';

export interface DataState {
  leads: any[];
  salesOrders: any[];
  products: any[];
  invoices: any[];
  employees: any[];
  projects: any[];
  projectTasks: any[];
  manufacturingOrders: any[];
  tickets: any[];
  loading: boolean;
  fetchData: () => Promise<void>;
  // Generic CRUD actions we can wire up later
  addRecord: (table: string, record: any) => Promise<any>;
  updateRecord: (table: string, id: string, record: any) => Promise<any>;
  deleteRecord: (table: string, id: string) => Promise<any>;
}

const isSupabaseConfigured = () =>
  !!import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder') && !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_');

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

  fetchData: async () => {
    // Timeout fallback — app works even if backend is unreachable
    const timeout = new Promise<void>((resolve) =>
      setTimeout(() => { set({ loading: false }); resolve(); }, 3000)
    );

    const doFetch = async () => {
      try {
        if (!isSupabaseConfigured()) {
          // Fallback to local mock data immediately in Demo Mode
          throw new Error('Demo mode');
        }

        const [
          { data: leadsRes, error: e1 },
          { data: salesOrdersRes, error: e2 },
          { data: productsRes, error: e3 },
          { data: invoicesRes, error: e4 },
          { data: employeesRes, error: e5 },
          { data: projectsRes, error: e6 },
          { data: ticketsRes, error: e7 },
          { data: mfgRes, error: e8 }
        ] = await Promise.all([
          supabase.from('leads').select('*'),
          supabase.from('sales_orders').select('*'),
          supabase.from('products').select('*'),
          supabase.from('invoices').select('*'),
          supabase.from('employees').select('*'),
          supabase.from('projects').select('*'),
          supabase.from('tickets').select('*'),
          supabase.from('manufacturing_orders').select('*')
        ]);

        // If Supabase queries fail (e.g. table doesn't exist yet), throw to trigger fallback
        if (e1 || e2 || e3 || e4 || e5 || e6 || e7 || e8) {
          throw new Error('Supabase schema not fully setup yet');
        }

        set({
          leads: Array.isArray(leadsRes) ? leadsRes : [],
          salesOrders: Array.isArray(salesOrdersRes) ? salesOrdersRes : [],
          products: Array.isArray(productsRes) ? productsRes : [],
          invoices: Array.isArray(invoicesRes) ? invoicesRes : [],
          employees: Array.isArray(employeesRes) ? employeesRes : [],
          projects: Array.isArray(projectsRes) ? projectsRes : [],
          projectTasks: mockProjectTasks, // Supabase doesn't have projectTasks yet
          manufacturingOrders: Array.isArray(mfgRes) ? mfgRes : [],
          tickets: Array.isArray(ticketsRes) ? ticketsRes : [],
          loading: false
        });
      } catch (error) {
        console.warn('Backend unavailable, running with local mock data:', error);
        set({
          leads: crmLeads,
          salesOrders: mockSalesOrders,
          products: inventoryProducts,
          invoices: accountingInvoices,
          employees: hrEmployees,
          projects: projectsData,
          projectTasks: mockProjectTasks,
          manufacturingOrders: mockMfgOrders,
          tickets: helpdeskTickets,
          loading: false
        });
      }
    };
    await Promise.race([doFetch(), timeout]);
  },

  addRecord: async (table, record) => {
    if (!isSupabaseConfigured()) return { id: Date.now().toString(), ...record }; // Mock return
    const { data, error } = await supabase.from(table).insert(record).select().single();
    if (error) throw error;
    get().fetchData(); // Refresh all
    return data;
  },

  updateRecord: async (table, id, record) => {
    if (!isSupabaseConfigured()) return { id, ...record };
    const { data, error } = await supabase.from(table).update(record).eq('id', id).select().single();
    if (error) throw error;
    get().fetchData();
    return data;
  },

  deleteRecord: async (table, id) => {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    get().fetchData();
  }
}));
