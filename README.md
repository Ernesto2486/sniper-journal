# Apex Journal

Production-ready trading journal SaaS MVP built with:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres
- Recharts
- Vercel-ready structure

## What is included

- Email/password login and signup with Supabase
- Protected app routes for dashboard, trades, analytics, and calendar
- KPI dashboard with:
  - Total trades
  - Win rate
  - Net P/L
  - Average winner
  - Average loser
  - Profit factor
  - Expectancy
  - Max drawdown
- Recharts visualizations for:
  - Equity curve
  - Win/loss distribution
  - Performance by setup
  - Performance by day of week
- Full trade entry and edit flow
- Psychology tracking on every trade
- Trade history with filters
- Analytics page with weekly and daily performance
- Monthly calendar P/L view with weekly summary
- CSV export route
- Seed/demo data fallback when Supabase env vars are missing
- Stripe-ready subscription placeholder area in the app shell

## Project structure

```text
app/
  (app)/
    analytics/
    calendar/
    dashboard/
    trades/
  auth/confirm/
  login/
components/
lib/
supabase/
```

## Run locally

1. Install Node.js 20 or newer.
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env.local`.
4. Add your Supabase values:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

5. In Supabase SQL editor, run [supabase/schema.sql](/C:/Users/ernes/OneDrive/Documents/New%20project/supabase/schema.sql).
6. Optional: seed sample trades with [supabase/seed.sql](/C:/Users/ernes/OneDrive/Documents/New%20project/supabase/seed.sql) after replacing the placeholder `user_id`.
7. Start the app:

```bash
npm run dev
```

## Connect Supabase

1. Create a new Supabase project.
2. In `Authentication > Providers`, keep Email enabled.
3. In `Authentication > URL Configuration`, add:
   - `http://localhost:3000`
   - your future Vercel production domain
4. Copy the project URL and anon key into `.env.local`.
5. Run the schema SQL.
6. Create a user from the app UI, then optionally query `auth.users` and replace the placeholder id in `seed.sql` if you want starter trades.

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project into Vercel.
3. Add the same environment variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`
4. Set `NEXT_PUBLIC_SITE_URL` to your deployed app URL, for example `https://your-app.vercel.app`.
5. Redeploy after environment variables are added.
6. Add the deployed URL to Supabase Auth redirect settings.

## Notes

- If Supabase env vars are missing, the app runs in demo mode with realistic sample trades so the product can still be previewed.
- Screenshot handling is implemented as a `screenshot_url` field for MVP simplicity. If you want true uploads next, the clean extension point is Supabase Storage.
- Notes are stored as plain text and are compatible with markdown-style writing.
