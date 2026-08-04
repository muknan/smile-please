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

## Database setup (Supabase)

1. Create a free Supabase project at supabase.com. Region: **Southeast Asia
   (Singapore)** — closest to Delhi. No paid services are used anywhere.
2. From Project Settings → API, copy the Project URL, the `anon` public key and
   the `service_role` secret key into `.env.local` (see the variables below).
   Never commit `.env.local`.
3. Install and link the Supabase CLI:

   ```bash
   npm i -g supabase
   supabase login
   supabase link --project-ref <your-project-ref>
   ```

4. Apply the migrations and load the seed data:

   ```bash
   supabase db push        # applies supabase/migrations/*.sql in order
   psql "$DATABASE_URL" -f supabase/seed.sql   # or paste seed.sql in the SQL editor
   ```

   `supabase db reset` (local Docker) also applies migrations and seed in one
   go if you run the stack locally.

5. Verify the security invariants with the adversarial RLS test:

   ```bash
   psql "$DATABASE_URL" -f supabase/tests/rls.test.sql
   ```

   It runs in a single transaction and rolls back, so the database is left
   untouched. A failing assertion aborts with a message — fix the policy,
   never the test.

### Creating the admin account

There is no admin signup route — admin accounts are created manually via SQL:

```sql
-- 1. The human signs up normally at /auth/sign-in with the admin email.
-- 2. Then run, replacing the email:
update public.profiles set role = 'admin' where email = 'admin@example.com';
delete from public.patients where profile_id = (
  select id from public.profiles where email = 'admin@example.com'
);
```

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
