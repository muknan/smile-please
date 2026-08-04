# Smile Please

Smile Please is an NGO in New Delhi, India providing free dental care to underserved
communities and running dental health awareness campaigns. This repository is its website:
a public presence, a self-booking care flow for patients, a portal for dentists, and an
admin dashboard — built on Next.js, Tailwind CSS, and Supabase (Postgres).

## Stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3.4, Supabase (auth, Postgres
with Row Level Security), Zod, date-fns, lucide-react. All services are on permanent free
tiers.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and keys plus
   the SMTP settings for booking notifications.

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key — safe for the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — server-only, never in the browser |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL, used in links in emails |
| `SMTP_HOST` / `SMTP_PORT` | SMTP relay host and port |
| `SMTP_USER` / `SMTP_PASS` | SMTP login and key |
| `MAIL_FROM` | From address for outgoing mail |
| `ADMIN_NOTIFY_EMAIL` | Inbox for admin notifications (new submissions, etc.) |
| `CRON_SECRET` | Shared secret that guards scheduled jobs |

## Scripts

- `npm run dev` — development server
- `npm run build` — production build (must pass before every commit)
- `npm run start` — serve the production build
- `npm run lint` — ESLint

## Repository layout

- `app/` — routes, grouped into public, patient, dentist, admin, and auth areas
- `components/` — UI primitives, site shell, booking flow, admin widgets
- `lib/` — Supabase clients, auth helpers, validation schemas, booking state machine, formatting
- `supabase/migrations/` — numbered SQL migrations (schema + RLS policies)
- `types/db.ts` — generated database types
