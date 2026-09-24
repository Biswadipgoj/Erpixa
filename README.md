# Erpixa

A multi-tenant ERP for small and mid-sized businesses. One workspace covers CRM,
sales, inventory, accounting, HR, projects, manufacturing, helpdesk, and
marketing — and onboarding turns on only the modules that fit the business type,
so a consultancy and a manufacturer each get a workspace shaped for them.

Every business record belongs to exactly one organization and is isolated by
Postgres row-level security, so no tenant can ever read another's data.

## Stack

- **React 19 + TypeScript + Vite**
- **Zustand** for state
- **Supabase** (Postgres, Auth, RLS) for the backend — no custom server

## Design

The interface borrows from a bound account book: a dark cover-spine holds
navigation, the working area is faintly ruled paper, figures sit in tabular
columns, and totals carry the accountant's double rule.

- **Tokens** live at the top of `src/index.css` — palette (paper, ink, one petrol
  accent, status colours), type scale, radii, spacing and motion. Light is the
  default; dark is defined for both the OS setting and an explicit choice.
- **Type:** Bricolage Grotesque for display, Geist for UI text, Geist Mono for
  document numbers.
- **Motion** is CSS-first (`src/lib/motion.ts` adds count-ups, exit transitions,
  the button ink ripple and card spotlight). Everything collapses under
  `prefers-reduced-motion`.

## Getting started

```bash
npm install
cp .env.example .env      # then fill in your Supabase URL + anon key
npm run dev
```

You need a Supabase project with the schema applied. Full instructions —
including database setup, Google sign-in, and deployment — are in
[`SETUP_GUIDE.md`](SETUP_GUIDE.md).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run oxlint |

## Project layout

```
src/
  components/   Layout (sidebar, top nav) and shared UI (Icon, Logo, Stat, RecordModal, crud, Toast, RevenueChart)
  lib/          modules, business types, CRM stages, record field defs, Supabase client, motion + theme helpers
  pages/        one page per module + auth/onboarding/settings/admin
  store/        Zustand stores — auth/org, currency, UI, notifications, and business data
  types.ts      shared domain models
supabase/
  schema.sql    tables, indexes, RLS policies, and the create_organization function
```
