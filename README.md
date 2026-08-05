# Smile Please

Smile Please is an NGO in New Delhi, India providing free dental care to underserved
communities and running dental health awareness campaigns. This repository is its website:
a public presence, a self-booking care flow for patients, a portal for dentists, and an
admin dashboard — built on Next.js, Tailwind CSS, and Supabase (Postgres).

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 3.4, Supabase (auth, Postgres
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
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp deep-link number (digits with country code); leave empty to hide the /contact WhatsApp button |
| `SENTRY_DSN` | Sentry project DSN (error tracking); app still runs without it |

## Deployment

Hosted on **Vercel (Hobby)** with **Supabase (free)** and scheduled jobs on **GitHub
Actions** (Vercel Hobby cron is limited to once a day — not enough for hold release).

> ### ⚠️ Commercial-use warning (read this)
>
> The **Vercel Hobby plan is restricted to non-commercial use**, and Vercel's definition
> of commercial *explicitly includes accepting donations*. A prototype with no payment
> flow is fine. The moment a **Donate** button appears, options are: upgrade to **Vercel
> Pro** ($20/month, ~₹1,910), move to **Cloudflare Workers**' free tier (permits
> commercial use), or keep donations entirely off-site.

Security hardening is applied in `next.config.ts` (HSTS, `nosniff`, `X-Frame-Options:
DENY`, `Referrer-Policy`, `Permissions-Policy`, and a Content-Security-Policy allowing
`self`, the Supabase URL, and inline styles/scripts for Next 15's bootstrap). The
`npm audit --omit=dev` finding set is tracked in `NOTES.md` (the remaining `next`-bound
advisories need a breaking Next 16 upgrade — approve before upgrading).

### Vercel

```bash
npm i -g vercel && vercel login
vercel link        # create the project, name: smile-please
# set env vars for ALL three environments (production, preview, development):
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_SITE_URL production
vercel env add SMTP_HOST production
vercel env add SMTP_PORT production
vercel env add SMTP_USER production
vercel env add SMTP_PASS production
vercel env add MAIL_FROM production
vercel env add ADMIN_NOTIFY_EMAIL production
vercel env add CRON_SECRET production
vercel env add NEXT_PUBLIC_WHATSAPP_NUMBER production
vercel env add SENTRY_DSN production
vercel --prod
```

After the first deploy, fix the auth redirect URLs in the Supabase dashboard →
Authentication → URL Configuration: Site URL → `https://smile-please.vercel.app`, and
Redirect URLs → `https://smile-please.vercel.app/auth/callback` plus
`https://*-<your-vercel-scope>.vercel.app/auth/callback` for previews. Update
`NEXT_PUBLIC_SITE_URL` to the production URL and redeploy.

### Scheduled jobs (GitHub Actions)

Repository secrets/vars to set once: `SITE_URL` (var), `CRON_SECRET` (secret),
`SUPABASE_DB_URL` (secret, session pooler connection string), `BACKUP_PASSPHRASE`
(secret). Two workflows: `.github/workflows/cron.yml` (hold release every 15 min,
reminders daily, admin digest daily, keep-alive to stop the free Supabase tier
pausing) and `.github/workflows/backup.yml` (weekly encrypted `pg_dump` artifact).

**The free Supabase tier has no built-in backups.** The weekly dump is mandatory; after
the first backup, restore it into a scratch project once to prove it works.

### Branch protection

Single-developer repo, so branch protection is intentionally not configured (it would
just be friction). If the client later adds a second developer, turn on "Require pull
request reviews" and "Require status checks to pass" for `main`.

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
