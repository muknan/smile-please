# Build notes

Judgement calls, non-standard choices, and things that need a human decision. Format:
`- [phase N] <what happened> — <what you did>`

- [phase 1] logo.svg is a placeholder — client will supply the real asset.
- [phase 1] Master §4 lists `Table` and `Card` under `components/ui/` but Phase 1 Task 1.7 specifies only six primitives — added minimal token-styled `Card` and `Table` shells to match the master directory shape without building ahead.
- [phase 1] Phase 1 Task 1.2 specifies `postcss.config.js` (CommonJS); the template generated `postcss.config.mjs` — removed the `.mjs` and added the `.js` with `tailwindcss` + `autoprefixer` as specified.
- [phase 1] Required-field asterisk in `Field` uses `marigold-500` for visibility — Task 1.7 did not specify a colour.
- [phase 1] `--no-turbopack` accepted by create-next-app@15.1.6 without issue — template installs Tailwind v3 (no v4 downgrade needed); `npm ls tailwindcss` = 3.4.17.
- [phase 2] Storage policies (Task 2.7) were given as prose, not SQL — I wrote `007_storage.sql`: public read on the two public buckets, admin-everything, and dentist-owned insert/update/delete on `dentist-photos` via `is_dentist()` + storage `owner`.
- [phase 2] Seed availability: the phase asks for ~60 slots over 14 days with both sessions — I generate exactly 60 (4 dentists × 15) with `generate_series`; each dentist gets 2–3 weekdays, one 3-hour session per day (morning or evening, alternating), 30-minute slots. Pure date arithmetic, no overlap possible; `slots_no_overlap` would reject it loudly otherwise.
- [phase 2] This machine has no psql, no Docker, no `pg` — `supabase db reset` (local) is impossible here. Plan: push migrations with the CLI, run `seed.sql` and `rls.test.sql` against the hosted project via a scratch Node `pg` runner outside the repo (dev tooling, not a project dependency). Docker-based `db reset` can still be done by the human on their own machine.
- [phase 2] Seed and RLS test create people via `auth.users` inserts so the `on_auth_user_created` trigger builds profiles the same way real signups do; the signup trigger makes everyone a `patient` first, so the seed moves dentists to `dentist` role and removes their stray `patients` rows.
- [phase 2] The RLS test file also includes a bonus positive control (admin reads all profiles/submissions) beyond the 12 required assertions.
- [phase 2] The project uses the new-format Supabase keys (`sb_publishable_...` for anon, `sb_secret_...` for service role) — verified both authenticate (404 on /rest/v1, not 401). They are wired into `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`.
- [phase 2] `supabase login` has NOT been run on this machine, so no CLI token — using `supabase db push --db-url` and `supabase gen types --db-url` with the direct Postgres connection string instead of `link` for this phase. (Link can come later once the human runs `supabase login`.)
- [phase 2] No psql/Docker here — `seed.sql` and `rls.test.sql` run through a scratch Node `pg` runner at `%TEMP%/supa-run/` (outside the repo; project dependencies untouched). `db reset` (local Docker) can still be done by the human on their own machine.
- [phase 2] RLS adversarial test: all 12 assertions + the guard (RLS on all public tables) + admin positive control PASS on the hosted project (2026-08-04). Recorded in `supabase/tests/rls.test.sql` notices; full output kept at `%TEMP%/supa-run/`.
- [phase 2] Migration 001 fix: the phase's SQL helpers were `language sql`, which validates the body at CREATE time — impossible before `profiles` exists (migration 002). Converted `is_admin()`/`is_dentist()` to `language plpgsql` (lazy body validation, identical semantics). First `db push` attempt failed exactly there; DB rolled back cleanly.
- [phase 2] Seed fix: the signup trigger already inserts a bare `patients` row for every user, so the seed's explicit patient insert collided — changed to an `UPDATE` on the trigger-created rows (with `::age_band` cast, since `SET` expressions don't get target-type coercion). Also fixed two SQL string escapes (`Haven''t`, `child''s`) and a double-quoted title that parsed as an identifier.
- [phase 2] RLS test fix: `X + time '10:00' at time zone 'Asia/Kolkata'` parses as `X + (time at time zone)` (timetz, no `+` operator) — parenthesised the whole date-plus-time expression so `at time zone` applies last.
- [phase 2] Seed verified on hosted project: 4 dentists, exactly 60 slots (constraint `slots_no_overlap` held), 3 appointments, 5 submissions, 4 published articles, 0 drafts.
- [phase 2] `types/db.ts` is hand-written in the canonical generator shape because `supabase gen types` needs Docker (`LegacyContainerRuntimeNotFoundError`) / CLI login on this machine. Every table, column, enum value, and FK was cross-checked against the live schema via `information_schema`/`pg_constraint` (no guessing). When the human runs `supabase login`, regenerate with `supabase gen types typescript --linked > types/db.ts` to confirm zero drift.
- [phase 3] **HUMAN STEP (Task 3.1) — NOT DONE YET, required for sign-in to work.** In the Supabase dashboard: Authentication → Providers: enable Email, disable "Confirm password", enable "Magic Link", all other providers off; URL Configuration: Site URL `http://localhost:3000`, Redirect URLs must include `http://localhost:3000/auth/callback`; Sessions: JWT expiry `604800`; SMTP: custom SMTP with the Brevo credentials. **`.env.local` SMTP_* values are still placeholders — magic links will not be deliverable until Brevo is provisioned and SMTP_USER/SMTP_PASS/MAIL_FROM are real.** Confirm by striking this note when done.
- [phase 3] Master §9.6 public-form protections (honeypot `website`, 3s min fill, 5 submissions/IP/hour) can't run client-side, so the sign-in form goes through a server action (`app/auth/actions.ts`) that enforces all three before calling `signInWithOtp` — the phase text said a bare client call, master wins on conflict. Rate-limit state lives in Postgres (`migration 008`, RPC `record_signin_attempt`, RLS on, reachable only via the function).
- [phase 3] Added `admin@smile-please.example` (Aisha Verma, id …0900) to `seed.sql` via SQL only per master §2 — there is no admin signup route. Seeded accounts for the DoD checks: `den.seelampur@example.com` (dentist), `pat.seelampur@example.com` (patient), `admin@smile-please.example` (admin).
- [phase 3] Role homes `/admin`, `/dentist`, `/account` got minimal pages so sign-in landings are not 404s; the actual portals are later phases.
- [phase 3] Task 3.7 header split: `SiteHeader` is now a server component reading the profile; nav + mobile menu live in `components/site/HeaderNav.tsx` (client); shared POST sign-out in `components/site/SignOutForm.tsx`.
- [phase 3] Guard split per Task 3.3/3.5: middleware only does the coarse unauthenticated redirect (and refreshes cookies); roles are checked in layouts against the database. Admin 8-hour session cap lives in `app/admin/layout.tsx` using `last_sign_in_at` since Supabase JWT expiry is global.
- [phase 3] Post-implementation verification (2026-08-04) found sign-in dead end-to-end; root-caused and fixed with direct DB access (2026-08-04):
  - **FIXED (commit 0a12d96)** `app/auth/actions.ts` passed a raw string to the zod object schema `signInSchema` (`safeParse(str)` → "Expected object, received string" on every submit). Now `safeParse({ email: … })`.
  - **FIXED (applied live + recorded in migration history)** migration 008 (`signin_attempts` + `record_signin_attempt`) was never pushed to the hosted project (`PGRST202`/`PGRST205` live). Applied via direct connection; history row inserted so a future `supabase db push` won't re-run it. RPC returns `true` live.
  - **FIXED (live data repair)** GoTrue v2.195 500s ("Database error finding/loading user") on every seeded `auth.users` lookup. Root cause: the seed's raw-SQL inserts left the string-token columns `confirmation_token`/`recovery_token`/`email_change`/`email_change_token_new` NULL; GoTrue scans them as plain Go strings, so any row hit crashed the query (API-created users always write `''` — that's why they worked). Repaired live: NULL → `''` for the 7 seeded users.
  - **FIXED (live data repair)** seeded users had no `auth.identities` rows (raw-SQL inserts bypassed them); backfilled 7 email identities (idempotent SQL). Also set identity `last_sign_in_at` where NULL.
  - **FIXED (admin account)** `admin@smile-please.example` (Aisha Verma) existed only in `seed.sql`, never in the live DB — created via the GoTrue admin API (real write path) and promoted to `admin` role per master §2 (stray `patients` row removed). All 8 profiles/roles verified.
  - **FIXED (commit pending) `app/auth/callback/route.ts`** used `exchangeCodeForSession`, which this auth-js version implements as a **PKCE auth-code exchange** (`POST /token?grant_type=pkce` + stored code-verifier). This app sends OTPs server-side with no PKCE challenge, and admin links are plain tokens — there is no flow_state, so every real sign-in landed on `link_expired`. Switched to `verifyOtp({ token_hash, type: "magiclink" })` (proven against GoTrue v2.195).
  - **FIXED (seed hardening)** `supabase/seed.sql` now forces the four token columns to `''` and inserts `auth.identities` after the `auth.users` insert, so a fresh `supabase db reset` no longer reproduces either bug.
  - **VERIFIED E2E (via `admin/generate_link` + app callback)**: patient → `/account`; dentist → `/dentist`; admin → `/admin`; patient/dentist hitting `/admin` → `/403`; signed-out `/dentist` → sign-in; session survives server restart (signed-in header state renders).
  - **KNOWN LIMITATION**: GoTrue's email validation blocks `example.com` for OTP **sending** (seeded accounts can't receive links — also undeliverable anyway). The app loop is proven via `generate_link` (same token store the emailed link uses). To test real email delivery, swap a seeded email to a real inbox and complete Task 3.1 first.
  - **PENDING — Task 3.1 human step still not done**: Supabase dashboard SMTP (custom Brevo mailer), Site URL/Redirect URLs, and the sessions note. Magic link delivery is not reliable until this is confirmed; `.env.local` `SMTP_USER`/`SMTP_PASS` remain placeholders (these are for the app's own later mail, not the Supabase mailer).
  - **PENDING — rotate the DB password**: it was shared in plaintext (chat) to run the repairs; regenerate it in the dashboard once convenient.

## Phase 4 — Public site
- [phase 4] Hero is type-led by design; swap in a real camp photograph inside ArchFrame when the client supplies one — no layout change required.
- [phase 4] LEGAL-REVIEW-REQUIRED: the `/privacy` notice must be reviewed by an Indian practitioner before real patient data is collected (marker in file too).
- [phase 4] CLIENT-COPY marker locations: `app/(public)/about/page.tsx` (founder story ×3 paragraphs, team profiles block, registration number/address/grievance contact), `app/(public)/privacy/page.tsx` (registered address, grievance contact). Footer still carries `care@example.com` + "Registered trust details to be supplied" — same data as privacy/about, update both when the trust supplies real details.
- [phase 4] lucide-react 0.474.0 has no `Tooth` icon (barrel export missing) — drew a custom molar and a neem-sprig inline SVG in the landing page instead (spec asked for custom icons here anyway).
- [phase 4] Markdown renderer lives in `lib/markdown.tsx` — no dependency, escapes HTML before parsing, returns React elements (no dangerouslySetInnerHTML). Handles #/##/###, paragraphs, `-` lists, **bold**, *italic*, [links] (http/https/mailto only).
- [phase 4] `next/og` on Windows crashes in Next 15.1.6: bundled @vercel/og resolves its fonts with `fileURLToPath(join(import.meta.url, "../x"))`, and path.join mangles `file:///C:...` into `file:\C:...` (ERR_INVALID_URL → /og 500s). Fixed with `scripts/patch-og-font.mjs` (postinstall): rewrites to `new URL("./x", import.meta.url)` — correct on every platform, no-op on Linux/Vercel. Also: the bundled parser reads plain OpenType only, so the OG font is a static TTF (`public/fonts/fraunces-latin-600.ttf`, from google-webfonts-helper, 36 KB) — woff2 is rejected with "Unsupported OpenType signature wOF2".
- [phase 4] `lib/supabase/server.ts` now falls back to a stateless anon client when `cookies()` throws (generateStaticParams runs outside a request scope at build time and needs a client without cookies).
- [phase 4] SectionMarker label colour changed neem-600 → ink-950: 13px labels in neem-600 would violate Master §6 ("neem-600 never below 14px").
- [phase 5] minors are blocked at the form; verifiable parental consent flow is required before real patient data — see plan §7.4.
- [phase 6] Added nodemailer@6.9.16 + @types/nodemailer@6.4.17 — the only new dependency this phase (spec §6.3).
- [phase 6] SMTP is still placeholder (Brevo not provisioned). Verified the required behaviour with it UNCONFIGURED: every send is a silent no-op and never blocks a booking; a real transport failure writes audit_log (action email_failed, recipient stored as SHA-256, never the address). When the human provisions Brevo and fills SMTP_USER/SMTP_PASS, test real delivery and check the spam folder (acceptance item).
- [phase 6] No SMS in v1 — TRAI DLT registration is a paid gate (~₹5,900 per operator) before a single message sends. v2 upgrade path only.
- [phase 6] If real spam appears, the free upgrade path is Cloudflare Turnstile (spec §6.2) — not built now.
- [phase 6] contact_submissions gained clinic_area + availability (migration 010) for the dentist tab — the Phase 2 DDL had no structured home for those two fields.
- [phase 6] WhatsApp button reads NEXT_PUBLIC_WHATSAPP_NUMBER; hidden entirely when unset (acceptance item). .env.example documents it; .env.local carries a placeholder for testing.
- [phase 6] The 24h reminder cron + digest scheduling are Phase 8; the reminder template and the admin-digest endpoint already exist and are CRON_SECRET-guarded.
- [phase 7] Admin booking actions route through a new `admin_appointment_action` (migration 011): one atomic SQL function for assign / reassign / reschedule / cancel / complete / no-show. It reuses `_booking_transition_allowed` as the backstop, requires a one-line reason, and writes the event row in the same transaction. Assign/reschedule may also move the appointment onto a new slot under a row lock (frees the old slot, books the new one) so a double-booking is impossible. Tested: assign, reschedule, illegal transition rejected, empty reason rejected, non-admin FORBIDDEN.
- [phase 7] The live DB has NO profile for the seed `admin@smile-please.example` (id -0900); the real admin row is `f2e550fc-...-0e9bc881`. Phase 7 SQL tests simulate that real id. Confirm the seed creates the admin profile on a fresh environment.
- [phase 7] Interactive admin UI could not be browser-driven this session — signing in as admin needs the magic-link mailer, which is Phase 8. Verified instead: `npm run build`, anon redirect on every /admin route (307 to /auth/sign-in; authenticated non-admin gets /403 via requireRole), the DB-level admin RPC, convert-to-dentist mechanics (service-role createUser + role flip + pending dentists row + cleanup), CSV escaping, and the grep constraints below.
- [phase 7] Grep-checked: zero arches and zero Fraunces/`text-display-*` under `/admin`; `marigold-500` appears only on needs-attention indicators (nav/inbox unread badges, triage dot) — the "Convert to dentist" action uses `neem-900`, not the accent.
- [phase 7] Every export route writes an `audit_log` row (export.bookings/submissions/consents/audit) and the bookings export excludes clinical notes unless explicitly requested. Download delivery is verified in Phase 8 once an admin session exists.
- [phase 7] Access logging (§7.8): `lib/audit.ts` records booking.view, submission.view, booking.action, submission.update, submission.convert, dentist.*, article.*, export.*, role.change — entity ids only, never the data.
- [phase 8.1] Security sweep results (recorded 2026-08-04):
  - `SERVICE_ROLE` in app/components: NONE (only `lib/supabase/admin.ts`, which is server-only and correct).
  - `console.log` in app/lib/components: NONE.
  - `dangerouslySetInnerHTML`: only the landing page's static schema.org JSON-LD (constant data, no user input); the article renderer never uses it.
  - `getSession()` in server code: NONE (all auth reads via `auth.getUser()`).
  - `npm audit --omit=dev`: fixed all app-level findings. `@supabase/auth-js` overridden to 2.112.0 (clears the path-routing advisory); nodemailer bumped 6.x -> 9.0.4 (all 6.x had high-severity SMTP advisories; API surface used by `lib/email.ts` is unchanged, build + routes verified); `@supabase/supabase-js` PINNED to 2.48.1 (2.112 has a TypeScript inference regression at `supabase.from(...)` call sites — reverting it fixed the build). Remaining: 2 high + 1 critical, all shipped inside `next` 15.1.6 (postcss; sharp/libvips CVE-2026; and next's own advisories). Fix is a BREAKING next -> 16.3.0 upgrade that would invalidate the OG-font patch and the phased work — deliberately deferred and tracked. Client to approve before any upgrade.
  - RLS: all public tables have RLS enabled (0 tables off). Re-ran the Phase 2 adversarial assertions against the CURRENT schema: all 12 + the guard + the admin bonus PASS (no drift after Phases 5-7).
  - Added security headers in `next.config.ts` (HSTS, X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, Content-Security-Policy). CSP allows self + Supabase URL + inline styles + inline scripts (Next 15 bootstrap requires `'unsafe-inline'` for scripts — noted tradeoff). Verified the app renders fully under the CSP (no blocked scripts/styles).

---

- [phase 8.3 done] Repository: https://github.com/muknan/smile-please (private). Branch main. Only `.env.example` committed; `.env.local` gitignored.
- [phase 8.4 done] Deployed to Vercel. Production URL: https://smile-please-delta.vercel.app (project mukul-nandas-projects/smile-please; also aliases smile-please-mukul-nandas-projects.vercel.app and smile-please-muknan-mukul-nandas-projects.vercel.app). The clean alias smile-please.vercel.app is owned by an unrelated create-react-app project on this account, not ours.
- [phase 8.5/8.6] Vercel production env vars set (12 vars; secrets piped, never in transcripts). GitHub vars/secrets set: SITE_URL, CRON_SECRET, SUPABASE_DB_URL, BACKUP_PASSPHRASE. Cron + backup workflows committed but not yet fired once.
- [phase 8.2] Sentry not yet installed; a free account + SENTRY_DSN is still a human step before first deploy (PII-scrub beforeSend, sendDefaultPii false).

## Needs a decision from the client

These are deliberately left as placeholders or deferred choices the client must
resolve before going live. None block local development; some block launch.

- **Real content (CLIENT-COPY markers).** The `/about` founder story and trust-register
  details, the privacy address + grievance contact, the contact page's named human and
  registered address, and the WhatsApp number all carry `CLIENT-COPY` markers and need
  real details.
- **Rotate the database password.** The live Supabase `postgres` password was exposed
  in plaintext during development (session tool output) and seed `auth.users` password
  hashes are `'x'`. **Rotate before any production deploy** and move the value out of
  plaintext tooling.
- **Provision SMTP (Brevo).** `.env.local` SMTP_* are placeholders. Until real
  credentials are set, no email actually sends — which also blocks interactive
  sign-in, dentist/admin-portal browser testing, and the confirmation/reminder emails
  on the acceptance checklists.
- **Sentry (Phase 8 §8.2).** Creating the free Sentry account and setting `SENTRY_DSN`
  is a human step. Install `@sentry/nextjs`, configure `beforeSend` to scrub phone,
  email, patient_note, clinical_note, full_name and message, and set
  `sendDefaultPii: false` BEFORE the first deploy.
- **Next.js upgrade (approved risk).** 3 npm audit findings (2 high, 1 critical) remain,
  all shipped inside Next 15.1.6. The only fix is a breaking Next 16.3.0 upgrade.
  Approve before upgrading — it will re-require the OG-font patch and QA of every phase.
- **Vercel Hobby commercial limit.** No Donate button may appear while on the Hobby
  plan; if donations are wanted, move to Vercel Pro (~₹1,910/mo), Cloudflare Workers
  (free, commercial-friendly), or keep donations external. In README.
- **SMS (v2).** Not in v1 — TRAI DLT registration is a paid gate (~₹5,900 per
  operator). v2 upgrade path only.
- **Admin seed inconsistency.** The seed's `admin@smile-please.example` (
  `...000900`) has no profile row on the live DB; the real admin is `f2e550fc...881`.
  On a fresh environment, confirm the seed creates the admin profile.
- **Deployment + hosting.** Requires the human's `gh auth login`, `vercel login`, repo
  creation (private), Vercel env vars for all three environments, and auth redirect URL
  updates. See README "Deployment".
- **Backups.** The free Supabase tier has no backups. The weekly GH Actions dump
  (`.github/workflows/backup.yml`) needs `SUPABASE_DB_URL` + `BACKUP_PASSPHRASE` repo
  secrets and a one-time restore drill into a scratch project.
- [phase 8.1 follow-up] Vercel refused to deploy Next 15.1.6 ("Vulnerable version of Next.js detected"), forcing the Next upgrade that was previously deferred as approved-risk. Upgraded next -> 16.3.0 (React 19 kept; Node >=20.9, have 24). The Windows OG-font patch became a clean no-op (Next 16 fixed the path bug) and /og still renders a valid PNG. npm audit for next/postcss/sharp is now clear. Full local rebuild + route smoke test green; deployed to Vercel.
