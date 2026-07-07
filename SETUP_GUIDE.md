# Erpixa — Setup Guide

Erpixa runs on [Supabase](https://supabase.com) (Postgres + Auth). This guide takes
you from an empty project to a deployed app. Follow the steps in order.

---

## 1. Create a Supabase project

1. Go to **https://supabase.com** and create a new project.
2. Pick a strong database password and the region closest to your users.
3. Wait for the project to finish provisioning (~2 minutes).

## 2. Create the database schema

1. In the Supabase dashboard open **SQL Editor → New query**.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
3. You should see `Success. No rows returned`. This creates every table, index,
   row-level-security policy, and the `create_organization` function. No seed
   data is inserted — new accounts start empty.

## 3. Add your API keys

1. In Supabase open **Project Settings → API**.
2. Copy the **Project URL** and the **anon / public** key.
3. Create a `.env` file in the project root (copy `.env.example`) and fill in:

   ```
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
   ```

   > The anon key is safe to expose in the browser — row-level security enforces
   > access. **Never** put the `service_role` key in a `VITE_` variable.

## 4. Run locally

```bash
npm install
npm run dev
```

Open the printed URL, create an account, and complete onboarding. Onboarding
collects your business name, type, and industry, then provisions your workspace
and enables the modules that fit your business.

## 5. Enable Google sign-in (optional)

**Google Cloud Console**
1. Create a project, then **APIs & Services → OAuth consent screen** (External).
2. **Credentials → Create Credentials → OAuth 2.0 Client ID** (Web application).
3. Add the authorized redirect URI:
   `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client Secret.

**Supabase**
1. **Authentication → Providers → Google → Enable**, paste the ID and secret.
2. **Authentication → URL Configuration** — add your app origin + `/auth/callback`
   to the Redirect URLs (e.g. `http://localhost:5173/auth/callback` for local dev).

## 6. Roles & the admin panel

The person who completes onboarding becomes the **owner** of that workspace and
sees **Team & access** in the sidebar automatically — there is no manual database
step. Owners and admins can change teammates' roles and suspend accounts there.
Roles are enforced by row-level security, not just the UI.

## 7. Deploy

1. Push the repo to GitHub and import it on your host (e.g. Vercel).
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables
   **before** the first deploy.
3. After deploying, add your production origin + `/auth/callback` to Supabase's
   Redirect URLs (and to Google's authorized URIs if you enabled Google sign-in).
   `vercel.json` already rewrites all routes to `index.html` for the SPA.

---

### Troubleshooting

| Symptom | Fix |
|---|---|
| "Connect Erpixa to Supabase" screen | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing or still placeholders. |
| Database-error banner mentioning a missing relation | Re-run `supabase/schema.sql` in the SQL Editor. |
| Google sign-in fails | Confirm the redirect URLs match exactly in both Google and Supabase. |
| "Access restricted" on the admin panel | Only owners/admins can open it; ask an owner to change your role. |
