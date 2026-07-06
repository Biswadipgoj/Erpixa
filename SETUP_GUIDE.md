# 🚀 Buis AI — Complete Setup Guide
## Supabase + Google OAuth + Vercel Deployment

Follow these steps **in order**. Each step is self-contained.

---

## STEP 1 — Create Free Supabase Project

1. Go to **https://supabase.com** → Click **Start your project**
2. Sign in with GitHub (it's free)
3. Click **New Project**
4. Fill in:
   - **Name**: `buis-ai`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you (e.g., Singapore for India)
5. Click **Create new project** → wait ~2 minutes

---

## STEP 2 — Set Up Database Schema

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file: `d:\akd\buis-ai\supabase\schema.sql`
4. Copy the **entire contents** and paste into the SQL Editor
5. Click **Run** (▶️)
6. You should see: `Success. No rows returned`

---

## STEP 3 — Get Your API Keys

1. In Supabase dashboard, click **Settings** (gear icon) → **API**
2. You'll see two values:
   - **Project URL** — looks like `https://xyzxyzxyz.supabase.co`
   - **anon / public** key — a long string starting with `eyJ...`
3. Open the file `d:\akd\buis-ai\.env` in your editor
4. Replace the placeholders:
```
VITE_SUPABASE_URL=https://YOUR_ACTUAL_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJ...YOUR_ACTUAL_KEY
```

---

## STEP 4 — Enable Google OAuth

### Part A: Google Cloud Console
1. Go to **https://console.cloud.google.com**
2. Create a new project: **Buis AI**
3. Go to **APIs & Services** → **OAuth consent screen**
   - User Type: **External** → Create
   - App name: `Buis AI`
   - Support email: your email
   - Click Save and Continue through all steps
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `Buis AI Web`
   - Authorized redirect URIs: Add this URL:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
5. Click **Create** — copy both **Client ID** and **Client Secret**

### Part B: Add to Supabase
1. In Supabase → **Authentication** → **Providers** → **Google** → Toggle **Enable**
2. Paste your Client ID and Client Secret
3. Click **Save**

---

## STEP 5 — Create Your Admin Account

1. Run the app locally: `npm run dev` in `d:\akd\buis-ai`
2. Open **http://localhost:5174** and sign in with Google
3. In Supabase → **Table Editor** → **profiles**
4. Find your row and set `role` = `admin`
5. Refresh → you'll see the **Admin Panel** in the sidebar

---

## STEP 6 — Deploy to Vercel

### Push to GitHub first:
```bash
cd d:\akd\buis-ai
git init && git add . && git commit -m "Initial Buis AI"
```
Go to https://github.com/new, create `buis-ai` repo, and push.

### Deploy on Vercel:
1. Go to **https://vercel.com** → Add New Project → Select `buis-ai`
2. Add Environment Variables BEFORE deploying:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
3. Click **Deploy**

### Update OAuth redirect:
Add your Vercel URL to Google OAuth Authorized redirect URIs:
```
https://YOUR-APP.vercel.app/auth/callback
```
And in Supabase → Authentication → URL Configuration:
```
Site URL: https://YOUR-APP.vercel.app
Redirect URLs: https://YOUR-APP.vercel.app/auth/callback
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Demo Mode" warning in app | Set correct values in `.env` file |
| Google OAuth fails | Verify redirect URI matches exactly |
| Admin panel shows "Access Denied" | Set your role to `admin` in Supabase Table Editor |
| Vercel deploy fails | Check env vars are added in Vercel project settings |
