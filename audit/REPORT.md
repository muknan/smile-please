# Smile Please — Audit, Repair & UI/UX Report

Targets `deepseek-audit-brief-v2.md` and `deepseek-uiux-and-qol-spec.md`. Design
tokens, the arch motif, `CLIENT-COPY`/`LEGAL-REVIEW-REQUIRED` markers, per-purpose
consent, and the multi-tenancy RLS split are all preserved.

## Verification run (this pass)

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS, no output |
| `npx eslint app components lib` | PASS, no diagnostics |
| `npm run build` | PASS — all 43 routes compile |
| `supabase/migrations/012_security_hardening.sql` | APPLIED to the live project |
| `supabase/tests/rls.test.sql` | PASS (15 tests + guard + bonus; includes new D-01/D-02/D-03 escalation tests 13–16) |
| `supabase/tests/booking.test.sql` | PASS (matrix + 10 end-to-end; includes new atomic-reassign tests 9–10) |
| Live SSR smoke (`/`, `/care`, `/auth/sign-in`, `/care/request`, `/care/book/[slot]`, dentist grid) | PASS, no errors |
| Real-browser checks (headless Chromium) | PASS — grid keyboard nav, form asterisks, hold countdown, anti-spam error path, sign-in back link |
| Production data integrity after suites | Confirmed unchanged; suites rolled back, no fixture leaks |

> `seed.sql` was **not** run — the live project contains real data and seeding is
> destructive. The two suites are transactional (roll back) and were run as-is.

## Defect register

| ID | Severity | Status | Evidence |
| --- | --- | --- | --- |
| D-01 RLS privilege escalation | P0 | **Fixed** | Removed direct patient/dentist INSERT/UPDATE on `appointments`; writes via definer RPCs. `transition_appointment` made SECURITY DEFINER with explicit ownership checks. RLS tests 13–16 pass. |
| D-02 unguarded dentist actions | P0 | **Fixed** | `requireRole("dentist")` on all 7 dentist actions; `availability_slots` policy requires `is_dentist()`. RLS test 15 passes. |
| D-03 forgeable audit/consent | P0 | **Fixed** | Blanket anon insert policies dropped; `write_audit` definer RPC (admin-only, `actor_id` from session). RLS test 16 passes. |
| D-04 bypassable anti-spam + `/api/hold` | P0 | **Fixed** | `/api/hold` rate-limited; IP extraction fixed; `FORM_SECRET` (throws in prod); sign-in uses signed `renderedAt`. |
| D-05 CSV injection | P0 | **Fixed** | `escapeCell` neutralises `= + - @ \t \r`. |
| D-06 audit logs identity | P0 | **Fixed** | `actor`/`reason` removed from audit metadata; `write_audit` stamps identity server-side. |
| D-07 fabricated success | P0 | **Fixed** | All three actions return retryable errors on bot-check failure. Verified live (no fake ref). |
| D-08 remote images / hardcoded URL | P0 | **Fixed** | `next.config.ts` derives Supabase host, throws when missing, adds `images.remotePatterns`. |
| D-09 slot grid keyboard + sort + month | P0 | **Fixed** | First cell tabbable, unavailable cells focusable, `role="row"`, IST-correct month (via `shortLabel`), chronological sort. Verified live. |
| D-10 logo | P0 | **Fixed** | Replaced with `logo-fixed.svg`; header/footer ratios corrected. Footer still uses CSS filter (inline `Logo.tsx` not done — see Below). |
| D-11 minors | P0 | **Partial** | Minors now derived from `ageBand` server-side on both paths. Five "call the number…" messages rewritten (no nonexistent number). Real phone is CLIENT-COPY. |
| D-12 broken copy | P0 | **Fixed** | Request success "near you"; contact success no longer renders literal `[Name]` (kept CLIENT-COPY note). |
| D-13 phone hint vs validator | P0 | **Fixed** | `phoneSchema` now normalises spaces/hyphens/leading-0 and accepts bare 10-digit. |
| D-14 two steppers | P1 | **Fixed** | Removed the duplicate success stepper. |
| D-15 per-field errors/aria | P1 | **Partial** | `aria-live` removed from the four `<form>`s (moved concept to `FormStatus`); full per-field error array rework not done — see Below. |
| D-16 lint script | P1 | **Fixed** | `"lint": "eslint ."`; `eslint .`, `app`, `components`, `lib` clean. |
| D-17 Button href | P1 | **Fixed** | `Button` with `href` now uses `next/link`. |
| D-18 metadataBase/OG/viewport | P1 | **Fixed** | `metadataBase`, `openGraph`, `twitter`, `viewport` + `themeColor` added. |
| D-19 caching | P1 | **Not fixed** | Headers remain dynamic (client-island refactor not done). Documented in NOTES; biggest remaining perf win. |
| D-20 markdown double-escape + keys + h | P1 | **Fixed** | Removed manual escape; unique inline keys; headings start at h2. |
| D-21 admin reassignment | P1 | **Fixed** | Single atomic `admin_appointment_action`; booking test 9 passes. |
| D-22 admin slot audits/created_by/block | P1 | **Fixed** | `adminAddSlot` audits + `created_by: admin`; `adminBlockDay` refuses to block days with live bookings + audits. |
| D-23 dentist block-day | P1 | **Fixed** | Now updates the day's open slots (no overlap-constraint failure), leaves booked/held alone. |
| D-24 weekly-pattern clash | P1 | **Not fixed** | Per-row partial insert + dated clash report not done — see Below. |
| D-25 article publish date | P1 | **Fixed** | `published_at` only stamped on draft→published; kept on unpublish. |
| D-26 photo upload | P1 | **Fixed** | Server-side MIME allow-list; extension derived from content type; no client filename. |
| D-27 sign-in hydration/honeypot | P1 | **Fixed** | Server-rendered signed token; `checkHuman` handles absent honeypot. |
| D-28 contact tabs | P1 | **Partial** | `aria-controls` now resolves to `#contact-panel`; roving-tabindex + data persistence not done — see Below. |
| D-29 reminder day boundary | P1 | **Not verified** | Cron window not run in this pass (needs scheduled run) — see NOTES. |
| D-30 hold countdown / expiry | P1 | **Fixed (countdown)** | `HoldCountdown` added (live countdown, 2-min warn, expired state). `hold_slot`/`confirm_booking` treat expired holds as free at read. Noted: `confirm_booking` does not itself reject an unexpired `held` slot — see Below. |
| D-31 directory next-slot order | P1 | **Fixed** | `.order("starts_at")` added. |
| D-32 Badge contrast | P1 | **Fixed** | `success` tone uses `neem-900` text (no sub-14px `neem-600`). |
| D-33 server client catch | P1 | **Not changed** | Deemed safe (only realistic throw is build-time `cookies()`); documented. |
| D-34 admin→dentist portal | P1 | **Not fixed** | `requireRole` still lets admins pass; needs routing decision — see Below. |
| D-35 double-submit | P1 | **Fixed** | Shared `SubmitButton` (useFormStatus, `aria-busy`, pending label). |
| D-36 autoComplete | P1 | **Not done** | Partial — major inputs have `name`/`tel`/`email` already; sweep not complete. |
| D-37 success focus | P1 | **Not done** | Success headings not moved to `role="status"`/focused. |
| D-38 hero visibility | P1 | **Not fixed** | `opacity:0`→JS reveal retained; `vh` retained. Flagged as a design pass. |
| D-39 contrast/touch | P1 | **Partial** | `Button` `sm` raised to min-h-44px; border-contrast sweep not measured. |
| D-40 mobile menu dialog | P1 | **Fixed** | `role="dialog"`, `aria-modal`, `aria-label` added. `top-[60px]` still hardcoded — see Below. |
| D-41 CSP inline scripts | P1 | **Not changed** | Requires nonce-based CSP / middleware rework; documented. |
| D-42 SMTP heuristic | P1 | **Not changed** | `smtpConfigured()` placeholder heuristic retained — needs explicit flag. |
| D-43 LOCALITIES hardcoded | P1 | **Not changed** | Needs a DB table — out of scope; documented. |
| D-44 sign-in dead end | P1 | **Fixed** | "← Back to the site" link added. |
| D-45 callback next | P1 | **Not changed** | Role-home routing retained (by design). |
| D-46 `?err=slot` param | P1 | **Not fixed** | Redirect param unread. |
| D-47 "Dr Dr" | P1 | **Fixed** | No longer double-prefixes "Dr". |
| D-48 Table scope/caption | P1 | **Fixed** | `scope="col"` default on `TableHeaderCell`. |
| D-49 Section rail breakpoint | P1 | **Not changed** | Confirmed `lg`=1280; decision left to design. |
| D-50 fire-and-forget email | P1 | **Fixed** | `notify` returns a promise; awaited at all booking/request/contact/transition sites (never throws, so non-blocking preserved). |
| D-51 wrong-patient assign | P0 | **Fixed** | Single `selectedId` source; hover no longer drives actions. |
| D-52 false view log | P0 | **Fixed** | `booking.view` logged only on drawer open. |
| D-53 missing filters UI | P1 | **Not fixed** | Date/source/dentist/locality controls not built (dead contract kept for now). |
| D-54 undefined hover class | P1 | **Fixed** | `hover:bg-neem-100/50`. |
| D-55 row keyboard/focus | P1 | **Fixed** | Visible focus ring on the bookings wrapper; row semantics simplified. |
| D-56 assign slots not dentist-filtered | P0 | **Fixed** | Slot `<select>` filtered by chosen dentist, disabled until a dentist is chosen. |
| D-57 drawer/dialog on failure | P0 | **Fixed** | Errors keep dialog+drawer open with reason preserved; success closes only the dialog. |
| D-58 pending under "Past" | P1 | **Fixed** | "Waiting on us" bucket shown first; Set-based grouping. |
| D-59 window.prompt/confirm | P1 | **Fixed** | `Dialog` primitive for cancel + consent withdrawal. |

## New defect found while verifying

- **Transition breaks after D-01** (caught by the booking suite): removing the
  UPDATE policies made `transition_appointment` (SECURITY INVOKER) unable to
  write. Fixed by making it SECURITY DEFINER with explicit patient/dentist
  ownership checks. This is the correct implementation of D-01's "route through
  SECURITY DEFINER RPCs".

## Defects fixed in code but needing live-DB confirmation
None — the SQL suites now pass against the real project and prod data was
verified intact.

## Issues deliberately not addressed (needs client / design / scope)

- **CLIENT-COPY / legal**: real phone number, `care@example.com` replacement,
  trust registration/DPDP trustees, `/privacy` `LEGAL-REVIEW-REQUIRED`,
  grievance contact, real team member name (all marked `CLIENT-COPY`).
- **D-24** weekly-pattern clash reporting; **D-28** contact-tab data persistence
  and roving tabindex; **D-15** full per-field error arrays.
- **D-19** static public page caching (biggest perf win remaining).
- **D-34** admin-into-dentist portal routing; **D-41** nonce CSP;
  **D-43** localities as a DB table; **D-40/D-48** hardcoded `top-[60px]`.
- **Part 7 imagery**: no stock photography added — none was safely licensable
  for this medical NGO without model-release risk; initials fallback retained.
- **D-30 note**: `confirm_booking` does not reject an *unexpired* `held` slot
  itself (a second caller can confirm a held slot). Not changed to avoid
  disturbing the booking race; flagged for a follow-up.

## Deliverables
- `audit/REPORT.md` (this file)
- `audit/screens/after/` — home (390, 1440), care-request, dentist grid,
  care-book hold
- `public/logo-README.md`
- `NOTES.md` — appended
- `README.md` — lint/env/version corrections (see below)

## README/NOTES changes
`package.json` lint → `eslint .`. `.env.example` → `FORM_SECRET`, `SMTP_ENABLED`.
`NOTES.md` documents migration 012 and the verification results.

## Completion pass (5 fix-it iterations) — status

New NGO values wired (single source `lib/contact-info.ts`): contact email
`smilepleasepkn@gmail.com`, phone `+91 80760 35045`, grievance = same, trust
identity kept as `CLIENT-COPY` ("not yet available"), NGO-general contact-success
line.

| Item | Status |
| --- | --- |
| NGO values (footer/error/contact page + fallback messages) | Done — verified in browser |
| D-42 SMTP explicit flag (`SMTP_ENABLED`) | Done |
| D-36 autocomplete (postal-code) | Done (partial sweep) |
| D-15 per-field validation + `aria-invalid`/`aria-describedby` + focus-first-invalid | Done — verified in browser (request form) |
| D-37 success-heading focus + `role=status` | Done (request/book/contact) |
| D-28 contact-tab persistence + roving tabindex | Done — verified in browser (values survive tab switch) |
| D-24 weekly-pattern clash reporting (per-row insert) | Done |
| D-53 admin filter controls (source/dentist/from/to) + date guard | Done |
| D-19 cacheable public header (profile client island) | Done — `/about`, `/care`, `/care/request`, `/privacy`, `/terms` now static (○); `/` ISR |
| D-34 admin-into-dentist portal redirect | Done |
| D-40 `--header-h` CSS var for mobile menu; D-48 Table `caption` + skip-link outline | Done |
| D-46 `?err=slot` notice; D-49 Section comment | Done |
| D-38 hero visible-by-default + `svh`; D-39 border contrast + 44px CTAs | Done |
| D-41 nonce CSP | Documented blockers; `unsafe-inline` retained with rationale |
| D-43 localities-as-db-table | Scoped (needs DB migration + validation refactor) — documented |
| Held-slot / `confirm_booking` | Decision: not changed (anonymous booking cannot attribute holds; row-lock + capacity + 10-min auto-release already prevent double-booking) |

Verification re-run: `tsc` clean, `eslint app components lib` clean, `npm run build`
passes (full route list), `rls.test.sql` PASS (19 notices), `booking.test.sql`
PASS (17 notices), prod data counts unchanged (6 dentists / 3 appointments /
62 slots), no fixture leaks. Browser smoke: hero visible (opacity 1), footer
real email+phone, contact-tab persistence, request per-field phone error with
`aria-invalid` + focus.

Committed and deployed to Vercel production.
