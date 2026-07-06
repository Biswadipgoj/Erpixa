-- ============================================================
-- Erpixa — Supabase Database Schema v2
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. Profiles ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      TEXT NOT NULL,
  full_name  TEXT DEFAULT '',
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  company    TEXT DEFAULT 'Erpixa',
  avatar_url TEXT,
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_sign_in TIMESTAMPTZ
);

-- Auto-create profile row when a new auth user is created (e.g. via Google OAuth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. CRM Leads ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name        TEXT NOT NULL,
  partner     TEXT NOT NULL,
  stage       TEXT NOT NULL DEFAULT 's1',
  probability INTEGER DEFAULT 10,
  revenue     NUMERIC DEFAULT 0,
  "user"      TEXT,
  priority    INTEGER DEFAULT 1,
  tag         TEXT,
  created     DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Sales Orders ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  customer    TEXT NOT NULL,
  date        DATE DEFAULT CURRENT_DATE,
  total       NUMERIC DEFAULT 0,
  status      TEXT DEFAULT 'Draft',
  salesperson TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Products / Inventory ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name       TEXT NOT NULL,
  category   TEXT,
  qty        INTEGER DEFAULT 0,
  price      NUMERIC DEFAULT 0,
  status     TEXT DEFAULT 'In Stock',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Invoices ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  customer   TEXT NOT NULL,
  date       DATE DEFAULT CURRENT_DATE,
  due        DATE,
  amount     NUMERIC DEFAULT 0,
  status     TEXT DEFAULT 'Draft',
  payment    TEXT DEFAULT 'Unpaid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. Employees ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employees (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name       TEXT NOT NULL,
  role       TEXT,
  dept       TEXT,
  email      TEXT,
  phone      TEXT,
  status     TEXT DEFAULT 'Active',
  join_date  DATE DEFAULT CURRENT_DATE,
  initials   TEXT,
  color      TEXT DEFAULT '#4F46E5',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. Projects ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name       TEXT NOT NULL,
  client     TEXT,
  status     TEXT DEFAULT 'Planning',
  progress   INTEGER DEFAULT 0,
  due_date   DATE,
  team       TEXT[],
  tasks      INTEGER DEFAULT 0,
  done       INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. Tickets (Helpdesk) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tickets (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title      TEXT NOT NULL,
  customer   TEXT,
  priority   TEXT DEFAULT 'Medium',
  status     TEXT DEFAULT 'Open',
  assignee   TEXT,
  created    DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 9. Manufacturing Orders ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.manufacturing_orders (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  product    TEXT NOT NULL,
  qty        INTEGER DEFAULT 0,
  bom        TEXT,
  status     TEXT DEFAULT 'Planned',
  scheduled  DATE,
  workcenter TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturing_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts on re-run
DO $$ BEGIN
  -- profiles
  DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  -- leads
  DROP POLICY IF EXISTS "Auth users can read leads" ON public.leads;
  DROP POLICY IF EXISTS "Auth users can write leads" ON public.leads;
  -- sales_orders
  DROP POLICY IF EXISTS "Auth users can read orders" ON public.sales_orders;
  DROP POLICY IF EXISTS "Auth users can write orders" ON public.sales_orders;
  -- products
  DROP POLICY IF EXISTS "Auth users can read products" ON public.products;
  DROP POLICY IF EXISTS "Auth users can write products" ON public.products;
  -- invoices
  DROP POLICY IF EXISTS "Auth users can read invoices" ON public.invoices;
  DROP POLICY IF EXISTS "Auth users can write invoices" ON public.invoices;
  -- employees
  DROP POLICY IF EXISTS "Auth users can read employees" ON public.employees;
  DROP POLICY IF EXISTS "Auth users can write employees" ON public.employees;
  -- projects
  DROP POLICY IF EXISTS "Auth users can read projects" ON public.projects;
  DROP POLICY IF EXISTS "Auth users can write projects" ON public.projects;
  -- tickets
  DROP POLICY IF EXISTS "Auth users can read tickets" ON public.tickets;
  DROP POLICY IF EXISTS "Auth users can write tickets" ON public.tickets;
  -- manufacturing_orders
  DROP POLICY IF EXISTS "Auth users can read mfg" ON public.manufacturing_orders;
  DROP POLICY IF EXISTS "Auth users can write mfg" ON public.manufacturing_orders;
END $$;

-- Profiles
CREATE POLICY "Profiles viewable by authenticated"  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile"         ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Business tables: any authenticated user can read + write (full CRUD)
CREATE POLICY "leads_select"  ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "leads_insert"  ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "leads_update"  ON public.leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "leads_delete"  ON public.leads FOR DELETE TO authenticated USING (true);

CREATE POLICY "orders_select" ON public.sales_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "orders_insert" ON public.sales_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "orders_update" ON public.sales_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "orders_delete" ON public.sales_orders FOR DELETE TO authenticated USING (true);

CREATE POLICY "products_select" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_insert" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "products_update" ON public.products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "products_delete" ON public.products FOR DELETE TO authenticated USING (true);

CREATE POLICY "invoices_select" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE TO authenticated USING (true);

CREATE POLICY "employees_select" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "employees_insert" ON public.employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "employees_update" ON public.employees FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "employees_delete" ON public.employees FOR DELETE TO authenticated USING (true);

CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "projects_delete" ON public.projects FOR DELETE TO authenticated USING (true);

CREATE POLICY "tickets_select" ON public.tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "tickets_insert" ON public.tickets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tickets_update" ON public.tickets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tickets_delete" ON public.tickets FOR DELETE TO authenticated USING (true);

CREATE POLICY "mfg_select" ON public.manufacturing_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "mfg_insert" ON public.manufacturing_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "mfg_update" ON public.manufacturing_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mfg_delete" ON public.manufacturing_orders FOR DELETE TO authenticated USING (true);

-- ============================================================
-- SEED DATA (only inserts if tables are empty)
-- ============================================================

INSERT INTO public.leads (id, name, partner, stage, probability, revenue, "user", priority, tag, created)
SELECT * FROM (VALUES
  ('l1', 'Tech Refresh — Acme Corp',       'Acme Corp',    's1', 10,  45000,  'AJ', 2, 'Cold', '2026-06-28'::date),
  ('l2', 'ERP Implementation — Nexus Ltd', 'Nexus Ltd',    's2', 35, 120000,  'SM', 3, 'Hot',  '2026-07-01'::date),
  ('l3', 'Cloud Migration',                'Bluewave Inc', 's2', 40,  78000,  'PK', 2, 'Warm', '2026-07-02'::date),
  ('l4', 'Annual Support Contract',        'Delta Systems','s3', 65,  36000,  'AJ', 1, 'Warm', '2026-06-30'::date),
  ('l5', 'Module Expansion — HR',          'Helix Corp',   's3', 70,  54000,  'SM', 3, 'Hot',  '2026-07-03'::date),
  ('l6', 'API Integration Package',        'Vortex Tech',  's4', 100, 22000,  'AJ', 2, 'Won',  '2026-06-25'::date),
  ('l7', 'Inventory Rollout',              'Glotech SA',   's1', 15,  89000,  'PK', 1, 'Cold', '2026-07-04'::date)
) AS v(id, name, partner, stage, probability, revenue, "user", priority, tag, created)
WHERE NOT EXISTS (SELECT 1 FROM public.leads LIMIT 1);

INSERT INTO public.sales_orders (id, customer, date, total, status, salesperson)
SELECT * FROM (VALUES
  ('SO001', 'Nexus Ltd',    '2026-07-01'::date, 120000, 'Confirmed', 'Alex Johnson'),
  ('SO002', 'Acme Corp',    '2026-07-02'::date,  45000, 'Draft',     'Sara Miles'),
  ('SO003', 'Bluewave Inc', '2026-07-03'::date,  78000, 'Invoiced',  'Paul Kim'),
  ('SO004', 'Delta Systems','2026-07-03'::date,  36000, 'Confirmed', 'Alex Johnson'),
  ('SO005', 'Helix Corp',   '2026-07-04'::date,  54000, 'Draft',     'Sara Miles'),
  ('SO006', 'Vortex Tech',  '2026-06-25'::date,  22000, 'Done',      'Alex Johnson')
) AS v(id, customer, date, total, status, salesperson)
WHERE NOT EXISTS (SELECT 1 FROM public.sales_orders LIMIT 1);

INSERT INTO public.products (id, name, category, qty, price, status)
SELECT * FROM (VALUES
  ('p1', 'Laptop Pro X1',       'Electronics', 142, 1299, 'In Stock'),
  ('p2', 'Wireless Headset Z',  'Electronics',  23,  189, 'Low Stock'),
  ('p3', 'Office Chair Ergo',   'Furniture',    57,  349, 'In Stock'),
  ('p4', 'Standing Desk Pro',   'Furniture',     8,  799, 'Low Stock'),
  ('p5', 'USB-C Hub 7-Port',    'Accessories', 214,   49, 'In Stock'),
  ('p6', '4K Monitor 27"',      'Electronics',   0,  649, 'Out of Stock'),
  ('p7', 'Mechanical Keyboard', 'Accessories',  81,  159, 'In Stock')
) AS v(id, name, category, qty, price, status)
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1);

INSERT INTO public.invoices (id, customer, date, due, amount, status, payment)
SELECT * FROM (VALUES
  ('INV-001', 'Nexus Ltd',    '2026-07-01'::date, '2026-07-31'::date, 120000, 'Posted', 'Unpaid'),
  ('INV-002', 'Acme Corp',    '2026-06-28'::date, '2026-07-28'::date,  45000, 'Posted', 'Paid'),
  ('INV-003', 'Bluewave Inc', '2026-07-03'::date, '2026-08-02'::date,  78000, 'Draft',  'Unpaid'),
  ('INV-004', 'Delta Systems','2026-06-20'::date, '2026-07-20'::date,  36000, 'Posted', 'Overdue'),
  ('INV-005', 'Helix Corp',   '2026-07-04'::date, '2026-08-04'::date,  54000, 'Draft',  'Unpaid')
) AS v(id, customer, date, due, amount, status, payment)
WHERE NOT EXISTS (SELECT 1 FROM public.invoices LIMIT 1);

INSERT INTO public.employees (id, name, role, dept, email, phone, status, join_date, initials, color)
SELECT * FROM (VALUES
  ('e1', 'Alex Johnson', 'Sales Manager',    'Sales',    'alex@erpixa.com',    '+1-555-0101', 'Active', '2024-01-15'::date, 'AJ', '#4F46E5'),
  ('e2', 'Sara Miles',   'HR Director',      'HR',       'sara@erpixa.com',    '+1-555-0102', 'Active', '2024-02-01'::date, 'SM', '#7C3AED'),
  ('e3', 'Paul Kim',     'Lead Engineer',    'Tech',     'paul@erpixa.com',    '+1-555-0103', 'Active', '2023-11-10'::date, 'PK', '#059669'),
  ('e4', 'Diana Lee',    'Product Manager',  'Product',  'diana@erpixa.com',   '+1-555-0104', 'Active', '2024-03-20'::date, 'DL', '#DC2626'),
  ('e5', 'Marcus Grant', 'Support Lead',     'Helpdesk', 'marcus@erpixa.com',  '+1-555-0105', 'Active', '2024-04-05'::date, 'MG', '#D97706')
) AS v(id, name, role, dept, email, phone, status, join_date, initials, color)
WHERE NOT EXISTS (SELECT 1 FROM public.employees LIMIT 1);

INSERT INTO public.projects (id, name, client, status, progress, due_date, team, tasks, done)
SELECT * FROM (VALUES
  ('pr1', 'ERP Rollout Phase 1',   'Nexus Ltd',    'In Progress', 65, '2026-08-31'::date, ARRAY['AJ','PK','DL'], 12, 8),
  ('pr2', 'Cloud Migration',       'Bluewave Inc', 'In Progress', 40, '2026-09-15'::date, ARRAY['PK','SM'],       8, 3),
  ('pr3', 'HR Portal Redesign',    'Helix Corp',   'Planning',    10, '2026-10-01'::date, ARRAY['SM','DL'],       6, 1),
  ('pr4', 'Support Desk Upgrade',  'Delta Systems','Completed',  100, '2026-06-30'::date, ARRAY['MG','AJ'],      10, 10)
) AS v(id, name, client, status, progress, due_date, team, tasks, done)
WHERE NOT EXISTS (SELECT 1 FROM public.projects LIMIT 1);

INSERT INTO public.tickets (id, title, customer, priority, status, assignee, created)
SELECT * FROM (VALUES
  ('TK-001', 'Cannot login after password reset',      'Acme Corp',    'Urgent', 'Open',        'AJ', '2026-07-05'::date),
  ('TK-002', 'Invoice PDF not generating correctly',   'Nexus Ltd',    'High',   'In Progress', 'DL', '2026-07-04'::date),
  ('TK-003', 'Stock levels not syncing',               'Bluewave Inc', 'Medium', 'In Progress', 'PK', '2026-07-04'::date),
  ('TK-004', 'Feature request: bulk import employees', 'Helix Corp',   'Low',    'Open',        'MG', '2026-07-03'::date),
  ('TK-005', 'Email notifications not sending',        'Delta Systems','High',   'Resolved',    'AJ', '2026-07-02'::date)
) AS v(id, title, customer, priority, status, assignee, created)
WHERE NOT EXISTS (SELECT 1 FROM public.tickets LIMIT 1);

INSERT INTO public.manufacturing_orders (id, product, qty, bom, status, scheduled, workcenter)
SELECT * FROM (VALUES
  ('MO-001', 'Laptop Pro X1',       50, 'BOM-LP-001', 'In Progress', '2026-07-20'::date, 'Assembly Line A'),
  ('MO-002', 'Wireless Headset Z',  200, 'BOM-WH-002', 'Planned',    '2026-08-01'::date, 'Assembly Line B'),
  ('MO-003', 'USB-C Hub 7-Port',    500, 'BOM-UH-003', 'Planned',    '2026-07-25'::date, 'Assembly Line A')
) AS v(id, product, qty, bom, status, scheduled, workcenter)
WHERE NOT EXISTS (SELECT 1 FROM public.manufacturing_orders LIMIT 1);

-- ── Make yourself an admin ───────────────────────────────────────────────────
-- Run this separately AFTER signing in for the first time:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL_HERE';
