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
