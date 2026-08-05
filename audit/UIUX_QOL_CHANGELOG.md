# UI/UX & Quality-of-Life Changes — Changelog

Covers the `deepseek-uiux-and-qol-spec.md` issues. All changes are presentation /
QoL only — no backend, schema, RLS, auth, booking-logic, or audit-flagged
security behaviour was touched. Design tokens, the arch motif and
`CLIENT-COPY` values are preserved.

## Verification run (this pass)

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS, no output |
| `npx eslint app components lib` | PASS, no diagnostics |
| `npm run build` | PASS — all routes compile (incl. `error.tsx` client boundary) |
| Homepage full-page geometry @1440 / 1024 / 390 | PASS — section tops == previous section bottoms, zero overlap; only the hero retains `snap-start` |
| Live browser smoke | `/about`, `/contact`, `/auth/sign-in`, `/learn`, `/learn/[slug]`, `/care/dentists`, `/care/dentists/[slug]`, `/care/request` — PASS |
| Article title dedup | PASS — `/learn/what-happens-at-a-camp` H1 not repeated in body H2s |
| SlotGrid affordance | PASS — right-edge fade + Earlier/Later day buttons present on dentist grid |

## Change register

| ID | Issue | Status | Evidence |
| --- | --- | --- | --- |
| Q-01 | Homepage scroll-snap overlap | **Fixed** | `app/(public)/page.tsx` — dropped `snap-start` from the four non-hero `Section`s and the closing CTA `<section>`; the hero (`min-h-[100svh]`) is the only snap point. Sections now sit in normal document flow, so scroll-snap can no longer latch mid-way and double-expose neighbouring sections on a full-page render. Verified clean section boundaries at 1440/1024/390, mouse-wheel + PageDown. |
| Q-02 | Auth pages: no branding + dead end | **Fixed** | `app/auth/sign-in/SignInForm.tsx` — added a logo-only `AuthHeader` (links `/`) to both the sign-in and "Check your email" states; added "← Back to the site" to the success state; rephrased the fake-action "…then try again" line to "Check the spam folder first — or use a different address below". |
| Q-03 | Generic error page bare | **Fixed** | `app/error.tsx` — wrapped with `SiteHeader`/`SiteFooter`, matching `app/not-found.tsx` and `404`/`403`. Since `error.tsx` is a client component, the two site-chrome components (no server-only APIs) are imported and bundled on the client; build confirms the boundary. |
| Q-04 | Orphaned last grid row | **Fixed** | `app/(public)/learn/page.tsx`, `app/(public)/care/dentists/page.tsx` — replaced the fixed `md:grid-cols-2 lg:grid-cols-3` grid with a `flex flex-wrap justify-center gap-6` container of fixed-width wrappers (`md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]`), so a partial last row is centered instead of lonely flush-left. Card components untouched. |
| Q-05 | SlotGrid: no "more days" cue + bio→heading gap | **Fixed** | `components/booking/SlotGrid.tsx` — added a right-edge `mineral-50` gradient fade (visible only while more content is scrollable) plus "Earlier days"/"Later days" buttons that advance the scroller by ~one day column, with prev/next disabled state. `app/(public)/care/dentists/[slug]/page.tsx` — tightened the "Pick a time" section top gap (`pt-24`→`pt-16`) to match the site's default Section rhythm. |
| Q-06 | Request form = one long scroll | **Fixed** | `app/(public)/care/request/RequestForm.tsx` — grouped fields into visually separated blocks with light `text-label` section headers ("About you", "What's wrong", "Where & when"), consent kept in its own bordered block after a divider. Field order, names, required-ness and validation untouched. |
| Q-07 | Book form feels like a second full application | **Fixed** | `app/(public)/care/book/[slotId]/BookForm.tsx` — grouped "About you" / "What's wrong" the same way as Q-06, tightened field gaps, and added a one-line explanation for the reasons ("Just so the dentist can prepare for your visit"). `app/(public)/care/book/[slotId]/page.tsx` — wrapped `<HoldCountdown />` in `<div className="max-w-[65ch]">` so it matches the reading column. |
| Q-08 | Native checkboxes/radios look unstyled | **Fixed** | `app/globals.css` — added a shared `.choice-control` class (consistent `h-5 w-5`, `accent-neem-600`, `cursor-pointer`, explicit `:focus-visible` ring matching the global style). Applied across `ConsentBlock.tsx`, `RequestForm.tsx`, `BookForm.tsx`, `ContactForm.tsx`, `AvailabilityForms.tsx`, `care/dentists/page.tsx`; labels got `cursor-pointer` for a generous click target. |
| Q-09 | /contact repeats footer contact details | **Fixed** | `app/(public)/contact/page.tsx` — removed the duplicated registered-address/email/phone block (footer already covers these) and kept only the grievance/escalation contact, with a short "Complaints and data requests" intro. Unused imports pruned. |
| Q-10 | Account first-run state | **Fixed** | `app/(patient)/account/page.tsx` — greeting now falls back to "Hello, there" when the stored name is empty or the seed default "New user". `AccountClient.tsx` — "Full name" renders as a real placeholder (not a filled value) plus a one-line "Add your details…" prompt for seeded profiles; each consent purpose now shows a short description and links ("grant it when you book a check-up", privacy notice) instead of a bare "Not granted". |
| Q-11 | /about shows raw placeholders | **Fixed** | `app/(public)/about/page.tsx` — removed the unfinished "The people behind it" section (heading + empty-state card); rephrased "Organisation details" from literal template brackets to "Registration details — the trust deed number, registered address and grievance contact — will be published here once finalised.", matching the footer's tone. Dead `orgDetails` const removed. |
| Q-12 | Article body duplicates the page title | **Fixed** | `supabase/seed.sql` — removed the leading `## <title>` first line from all four seed `body_md` values. `lib/markdown.tsx` — `renderMarkdown(md, skipTitle?)` now drops the very first `h2` when its text matches the title case-insensitively (defensive for future articles). `app/(public)/learn/[slug]/page.tsx` passes `data.title`. |
| Q-13 | Minor DRY / consistency | **Fixed** | `app/(public)/care/status/StatusLookup.tsx` — hand-rolled submit button replaced with the shared `SubmitButton` (used by BookForm/RequestForm); unused `pending` removed. Wheeled page `h1`s across `app/admin/{page,articles,bookings,dentists,exports,inbox}/page.tsx` to `text-display-l` for one heading language (inner dense data-item labels in the boards left as utility typography). |

## Issues deliberately left unchanged
- Inner admin panel/dialog headings (reference codes, dialog titles) kept as dense
  utility type — page headings, not marketing display; did not want to make staff
  tooling read like public copy.
- `CLIENT-COPY` values (phone/email/trust registration) untouched; where a value is
  not yet finalised it is phrased as "to be published once finalised" rather than a
  fabricated value.
