-- ============================================================
-- Erpixa — Supabase Database Schema v3 (multi-tenant SaaS)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
--
-- Design:
--   * Every business row belongs to exactly one organization.
--   * Row Level Security restricts all access to members of that
--     organization — enforced in the database, not the client.
--   * Soft deletes via deleted_at; the client filters them out and
--     hard deletes are disallowed for business tables.
--   * No seed data: new organizations start empty.
-- ============================================================

-- ── 0. Cleanup (Drop existing tables to ensure a clean slate for v3) ─────────
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.manufacturing_orders CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.project_tasks CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.sales_orders CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ── 0.5. Extensions ──────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. Profiles (one per auth user, global — not org-scoped) ────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email        TEXT NOT NULL,
  full_name    TEXT NOT NULL DEFAULT '',
  avatar_url   TEXT,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sign_in TIMESTAMPTZ
);

-- Auto-create profile row when a new auth user is created (email or OAuth)
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

-- ── 2. Organizations (tenants) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  business_type     TEXT NOT NULL DEFAULT 'custom',
  industry          TEXT NOT NULL DEFAULT '',
  country           TEXT NOT NULL DEFAULT '',
  currency          TEXT NOT NULL DEFAULT 'USD',
  timezone          TEXT NOT NULL DEFAULT 'UTC',
  fiscal_year_start INTEGER NOT NULL DEFAULT 1 CHECK (fiscal_year_start BETWEEN 1 AND 12),
  business_size     TEXT NOT NULL DEFAULT '1-10',
  tax_scheme        TEXT NOT NULL DEFAULT 'none' CHECK (tax_scheme IN ('none', 'gst', 'vat')),
  tax_id            TEXT NOT NULL DEFAULT '',
  logo_url          TEXT,
  address           TEXT NOT NULL DEFAULT '',
  business_email    TEXT NOT NULL DEFAULT '',
  phone             TEXT NOT NULL DEFAULT '',
  enabled_modules   TEXT[] NOT NULL DEFAULT '{}',
  created_by        UUID NOT NULL REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);

-- ── 3. Membership helpers (SECURITY DEFINER so RLS policies can use them
--       without recursing into organization_members' own policies) ───────────
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.org_role(org_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.organization_members
  WHERE organization_id = org_id AND user_id = auth.uid();
$$;

-- True when the caller shares at least one organization with target_user.
CREATE OR REPLACE FUNCTION public.shares_org(target_user UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members me
    JOIN public.organization_members them ON me.organization_id = them.organization_id
    WHERE me.user_id = auth.uid() AND them.user_id = target_user
  );
$$;

-- True when the caller is an owner/admin of an organization target_user belongs to.
CREATE OR REPLACE FUNCTION public.is_admin_over(target_user UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members me
    JOIN public.organization_members them ON me.organization_id = them.organization_id
    WHERE me.user_id = auth.uid()
      AND me.role IN ('owner', 'admin')
      AND them.user_id = target_user
  );
$$;

-- Atomic org creation: inserts the organization and its owner membership in
-- one transaction, avoiding the RLS chicken-and-egg between the two tables.
CREATE OR REPLACE FUNCTION public.create_organization(
  org_name          TEXT,
  org_business_type TEXT DEFAULT 'custom',
  org_industry      TEXT DEFAULT '',
  org_country       TEXT DEFAULT '',
  org_currency      TEXT DEFAULT 'USD',
  org_timezone      TEXT DEFAULT 'UTC',
  org_fiscal_start  INTEGER DEFAULT 1,
  org_business_size TEXT DEFAULT '1-10',
  org_tax_scheme    TEXT DEFAULT 'none',
  org_tax_id        TEXT DEFAULT '',
  org_logo_url      TEXT DEFAULT NULL,
  org_address       TEXT DEFAULT '',
  org_email         TEXT DEFAULT '',
  org_phone         TEXT DEFAULT '',
  org_modules       TEXT[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF org_name IS NULL OR length(trim(org_name)) = 0 THEN
    RAISE EXCEPTION 'Organization name is required';
  END IF;

  INSERT INTO public.organizations (
    name, business_type, industry, country, currency, timezone,
    fiscal_year_start, business_size, tax_scheme, tax_id, logo_url,
    address, business_email, phone, enabled_modules, created_by
  ) VALUES (
    trim(org_name), org_business_type, org_industry, org_country, org_currency, org_timezone,
    org_fiscal_start, org_business_size, org_tax_scheme, org_tax_id, org_logo_url,
    org_address, org_email, org_phone, org_modules, auth.uid()
  )
  RETURNING id INTO new_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'owner');

  RETURN new_org_id;
END;
$$;

-- ── 4. updated_at maintenance ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── 5. Business tables (all org-scoped, soft-deletable, audited) ─────────────

CREATE TABLE IF NOT EXISTS public.customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL DEFAULT '',
  phone           TEXT NOT NULL DEFAULT '',
  address         TEXT NOT NULL DEFAULT '',
  notes           TEXT NOT NULL DEFAULT '',
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL DEFAULT '',
  phone           TEXT NOT NULL DEFAULT '',
  address         TEXT NOT NULL DEFAULT '',
  notes           TEXT NOT NULL DEFAULT '',
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  partner         TEXT NOT NULL DEFAULT '',
  stage           TEXT NOT NULL DEFAULT 'new'
                    CHECK (stage IN ('new', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  probability     INTEGER NOT NULL DEFAULT 10 CHECK (probability BETWEEN 0 AND 100),
  revenue         NUMERIC NOT NULL DEFAULT 0,
  owner_name      TEXT NOT NULL DEFAULT '',
  priority        INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 3),
  tag             TEXT NOT NULL DEFAULT 'Cold',
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.sales_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  number          TEXT NOT NULL DEFAULT '',
  customer        TEXT NOT NULL,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  total           NUMERIC NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Confirmed', 'Invoiced', 'Done', 'Cancelled')),
  salesperson     TEXT NOT NULL DEFAULT '',
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT '',
  sku             TEXT NOT NULL DEFAULT '',
  qty             INTEGER NOT NULL DEFAULT 0,
  reorder_level   INTEGER NOT NULL DEFAULT 10,
  price           NUMERIC NOT NULL DEFAULT 0,
  cost            NUMERIC NOT NULL DEFAULT 0,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  number          TEXT NOT NULL DEFAULT '',
  customer        TEXT NOT NULL,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  due             DATE,
  amount          NUMERIC NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Posted', 'Cancelled')),
  payment         TEXT NOT NULL DEFAULT 'Unpaid' CHECK (payment IN ('Paid', 'Unpaid', 'Overdue')),
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.employees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT '',
  dept            TEXT NOT NULL DEFAULT '',
  email           TEXT NOT NULL DEFAULT '',
  phone           TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Terminated')),
  join_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  client          TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'In Progress', 'On Hold', 'Completed')),
  progress        INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  due_date        DATE,
  team            TEXT[] NOT NULL DEFAULT '{}',
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.project_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  stage           TEXT NOT NULL DEFAULT 'To Do' CHECK (stage IN ('To Do', 'In Progress', 'Done')),
  assignee        TEXT NOT NULL DEFAULT '',
  priority        TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  due             DATE,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  customer        TEXT NOT NULL DEFAULT '',
  priority        TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status          TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
  assignee        TEXT NOT NULL DEFAULT '',
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.manufacturing_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product         TEXT NOT NULL,
  qty             INTEGER NOT NULL DEFAULT 0,
  bom             TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'In Progress', 'Done', 'Cancelled')),
  scheduled       DATE,
  workcenter      TEXT NOT NULL DEFAULT '',
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  channel         TEXT NOT NULL DEFAULT 'Email' CHECK (channel IN ('Email', 'Social', 'Ads', 'SMS', 'Event', 'Other')),
  status          TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Paused', 'Completed')),
  budget          NUMERIC NOT NULL DEFAULT 0,
  spent           NUMERIC NOT NULL DEFAULT 0,
  leads_generated INTEGER NOT NULL DEFAULT 0,
  start_date      DATE,
  end_date        DATE,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL DEFAULT 'info',
  text            TEXT NOT NULL,
  unread          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_customers_org      ON public.customers(organization_id)            WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_suppliers_org      ON public.suppliers(organization_id)            WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_org          ON public.leads(organization_id)                WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sales_orders_org   ON public.sales_orders(organization_id)         WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_org       ON public.products(organization_id)             WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_org       ON public.invoices(organization_id)             WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_org      ON public.employees(organization_id)            WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_org       ON public.projects(organization_id)             WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_project_tasks_org  ON public.project_tasks(organization_id)        WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_project_tasks_proj ON public.project_tasks(project_id)             WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_org        ON public.tickets(organization_id)              WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mfg_orders_org     ON public.manufacturing_orders(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_org      ON public.campaigns(organization_id)            WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_org  ON public.notifications(organization_id, created_at DESC);

-- ── 7. updated_at triggers ────────────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'organizations', 'customers', 'suppliers', 'leads',
    'sales_orders', 'products', 'invoices', 'employees', 'projects',
    'project_tasks', 'tickets', 'manufacturing_orders', 'campaigns'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END $$;

-- ============================================================
-- ROW LEVEL SECURITY — everything is organization-scoped
-- ============================================================

ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;

-- Drop any pre-v3 policies (from the old shared-data schema)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Profiles: users read/edit their own profile; teammates in the same org can
-- read each other (for the members roster); owners/admins can update a
-- teammate's row (e.g. suspend). No one can change a profile's id.
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_select_org" ON public.profiles
  FOR SELECT TO authenticated USING (public.shares_org(id));
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin_over(id)) WITH CHECK (public.is_admin_over(id));

-- Organizations: members read; owner/admin update; creation via create_organization()
CREATE POLICY "orgs_select_member" ON public.organizations
  FOR SELECT TO authenticated USING (public.is_org_member(id));
CREATE POLICY "orgs_update_admin" ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.org_role(id) IN ('owner', 'admin'))
  WITH CHECK (public.org_role(id) IN ('owner', 'admin'));

-- Organization members: members can list their org's roster;
-- owner/admin manage membership (add/change/remove) but cannot remove the owner.
CREATE POLICY "org_members_select" ON public.organization_members
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "org_members_insert_admin" ON public.organization_members
  FOR INSERT TO authenticated WITH CHECK (public.org_role(organization_id) IN ('owner', 'admin'));
CREATE POLICY "org_members_update_admin" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (public.org_role(organization_id) IN ('owner', 'admin') AND role <> 'owner')
  WITH CHECK (public.org_role(organization_id) IN ('owner', 'admin') AND role <> 'owner');
CREATE POLICY "org_members_delete" ON public.organization_members
  FOR DELETE TO authenticated
  USING (
    role <> 'owner'
    AND (public.org_role(organization_id) IN ('owner', 'admin') OR user_id = auth.uid())
  );

-- Business tables: full CRUD for org members, always scoped to the member's org.
-- Hard DELETE is intentionally not granted — the app soft-deletes via deleted_at.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers', 'suppliers', 'leads', 'sales_orders', 'products', 'invoices',
    'employees', 'projects', 'project_tasks', 'tickets', 'manufacturing_orders',
    'campaigns'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
       USING (public.is_org_member(organization_id))', t || '_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated
       WITH CHECK (public.is_org_member(organization_id))', t || '_insert', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated
       USING (public.is_org_member(organization_id))
       WITH CHECK (public.is_org_member(organization_id))', t || '_update', t);
  END LOOP;
END $$;

-- Notifications: org members read; personal notifications only for their user;
-- mark-as-read updates allowed for the same scope.
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) AND (user_id IS NULL OR user_id = auth.uid()));
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id) AND (user_id IS NULL OR user_id = auth.uid()))
  WITH CHECK (public.is_org_member(organization_id) AND (user_id IS NULL OR user_id = auth.uid()));
