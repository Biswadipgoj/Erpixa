-- ============================================================
-- Buis AI — Supabase Database Schema
-- Paste this entire file into: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  company TEXT DEFAULT 'Buis AI Corp',
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_sign_in TIMESTAMPTZ
);

-- 2. Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. CRM Leads
CREATE TABLE public.leads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  partner TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 's1',
  probability INTEGER DEFAULT 10,
  revenue NUMERIC DEFAULT 0,
  "user" TEXT,
  priority INTEGER DEFAULT 1,
  tag TEXT,
  created DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Sales Orders
CREATE TABLE public.sales_orders (
  id TEXT PRIMARY KEY,
  customer TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  salesperson TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Products / Inventory
CREATE TABLE public.products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  category TEXT,
  qty INTEGER DEFAULT 0,
  price NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'In Stock',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Invoices
CREATE TABLE public.invoices (
  id TEXT PRIMARY KEY,
  customer TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  due DATE,
  amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  payment TEXT DEFAULT 'Unpaid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Employees
CREATE TABLE public.employees (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  role TEXT,
  dept TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'Active',
  join_date DATE DEFAULT CURRENT_DATE,
  initials TEXT,
  color TEXT DEFAULT '#4F46E5',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Projects
CREATE TABLE public.projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  client TEXT,
  status TEXT DEFAULT 'Planning',
  progress INTEGER DEFAULT 0,
  due_date DATE,
  team TEXT[],
  tasks INTEGER DEFAULT 0,
  done INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tickets (Helpdesk)
CREATE TABLE public.tickets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  customer TEXT,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Open',
  assignee TEXT,
  created DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Manufacturing Orders
CREATE TABLE public.manufacturing_orders (
  id TEXT PRIMARY KEY,
  product TEXT NOT NULL,
  qty INTEGER DEFAULT 0,
  bom TEXT,
  status TEXT DEFAULT 'Planned',
  scheduled DATE,
  workcenter TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturing_orders ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own; admins can do anything
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Business data: any authenticated user can read/write
CREATE POLICY "Auth users can read leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can write leads" ON public.leads FOR ALL TO authenticated USING (true);

CREATE POLICY "Auth users can read orders" ON public.sales_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can write orders" ON public.sales_orders FOR ALL TO authenticated USING (true);

CREATE POLICY "Auth users can read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can write products" ON public.products FOR ALL TO authenticated USING (true);

CREATE POLICY "Auth users can read invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can write invoices" ON public.invoices FOR ALL TO authenticated USING (true);

CREATE POLICY "Auth users can read employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can write employees" ON public.employees FOR ALL TO authenticated USING (true);

CREATE POLICY "Auth users can read projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can write projects" ON public.projects FOR ALL TO authenticated USING (true);

CREATE POLICY "Auth users can read tickets" ON public.tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can write tickets" ON public.tickets FOR ALL TO authenticated USING (true);

CREATE POLICY "Auth users can read mfg" ON public.manufacturing_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can write mfg" ON public.manufacturing_orders FOR ALL TO authenticated USING (true);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO public.leads (id, name, partner, stage, probability, revenue, "user", priority, tag, created) VALUES
  ('l1', 'Tech Refresh — Acme Corp', 'Acme Corp', 's1', 10, 45000, 'AJ', 2, 'Cold', '2026-06-28'),
  ('l2', 'ERP Implementation — Nexus Ltd', 'Nexus Ltd', 's2', 35, 120000, 'SM', 3, 'Hot', '2026-07-01'),
  ('l3', 'Cloud Migration', 'Bluewave Inc', 's2', 40, 78000, 'PK', 2, 'Warm', '2026-07-02'),
  ('l4', 'Annual Support Contract', 'Delta Systems', 's3', 65, 36000, 'AJ', 1, 'Warm', '2026-06-30'),
  ('l5', 'Module Expansion — HR', 'Helix Corp', 's3', 70, 54000, 'SM', 3, 'Hot', '2026-07-03'),
  ('l6', 'API Integration Package', 'Vortex Tech', 's4', 100, 22000, 'AJ', 2, 'Won', '2026-06-25'),
  ('l7', 'Inventory Rollout', 'Glotech SA', 's1', 15, 89000, 'PK', 1, 'Cold', '2026-07-04');

INSERT INTO public.sales_orders (id, customer, date, total, status, salesperson) VALUES
  ('SO001', 'Nexus Ltd', '2026-07-01', 120000, 'Confirmed', 'Alex Johnson'),
  ('SO002', 'Acme Corp', '2026-07-02', 45000, 'Draft', 'Sara Miles'),
  ('SO003', 'Bluewave Inc', '2026-07-03', 78000, 'Invoiced', 'Paul Kim'),
  ('SO004', 'Delta Systems', '2026-07-03', 36000, 'Confirmed', 'Alex Johnson'),
  ('SO005', 'Helix Corp', '2026-07-04', 54000, 'Draft', 'Sara Miles'),
  ('SO006', 'Vortex Tech', '2026-06-25', 22000, 'Done', 'Alex Johnson');

INSERT INTO public.products (id, name, category, qty, price, status) VALUES
  ('p1', 'Laptop Pro X1', 'Electronics', 142, 1299, 'In Stock'),
  ('p2', 'Wireless Headset Z', 'Electronics', 23, 189, 'Low Stock'),
  ('p3', 'Office Chair Ergo', 'Furniture', 57, 349, 'In Stock'),
  ('p4', 'Standing Desk Pro', 'Furniture', 8, 799, 'Low Stock'),
  ('p5', 'USB-C Hub 7-Port', 'Accessories', 214, 49, 'In Stock'),
  ('p6', '4K Monitor 27"', 'Electronics', 0, 649, 'Out of Stock'),
  ('p7', 'Mechanical Keyboard', 'Accessories', 81, 159, 'In Stock');

INSERT INTO public.invoices (id, customer, date, due, amount, status, payment) VALUES
  ('INV-001', 'Nexus Ltd', '2026-07-01', '2026-07-31', 120000, 'Posted', 'Unpaid'),
  ('INV-002', 'Acme Corp', '2026-06-28', '2026-07-28', 45000, 'Posted', 'Paid'),
  ('INV-003', 'Bluewave Inc', '2026-07-03', '2026-08-02', 78000, 'Draft', 'Unpaid'),
  ('INV-004', 'Delta Systems', '2026-06-20', '2026-07-20', 36000, 'Posted', 'Overdue'),
  ('INV-005', 'Helix Corp', '2026-07-04', '2026-08-04', 54000, 'Draft', 'Unpaid');

INSERT INTO public.tickets (id, title, customer, priority, status, assignee, created) VALUES
  ('TK-001', 'Cannot login after password reset', 'Acme Corp', 'Urgent', 'Open', 'AJ', '2026-07-05'),
  ('TK-002', 'Invoice PDF not generating correctly', 'Nexus Ltd', 'High', 'In Progress', 'DL', '2026-07-04'),
  ('TK-003', 'Stock levels not syncing', 'Bluewave Inc', 'Medium', 'In Progress', 'PK', '2026-07-04'),
  ('TK-004', 'Feature request: bulk import employees', 'Helix Corp', 'Low', 'Open', 'MG', '2026-07-03'),
  ('TK-005', 'Email notifications not sending', 'Delta Systems', 'High', 'Resolved', 'AJ', '2026-07-02');

-- Make the first user who signs up an admin (run this AFTER first sign-up):
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL_HERE';
