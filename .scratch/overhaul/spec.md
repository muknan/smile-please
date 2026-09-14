# Smile Please overhaul
Status: ready-for-agent

## Problem Statement
The public site feels generic and unfinished. Booking has security and consistency defects; operational workflows are unreliable. Organisations lack a clear collaboration path.

## Solution
A warm, credible public identity and clear paths into free care, volunteering and partnerships, backed by atomic, authorized booking operations and verifiable operations.

## User Stories
1. As a patient, I can understand the mission and find care on a phone.
2. As a patient, I can ask the team for help or select an available time.
3. As a patient, I receive useful validation and recover from network failures.
4. As a patient, only my verified identity can change my existing account.
5. As a patient, my time is held while I complete booking and expiry is explicit.
6. As a patient, rescheduling preserves my appointment reference and frees the old time.
7. As a patient, cancellation and consent withdrawal report the actual outcome.
8. As a dentist, I can only access assigned care and edit appropriate clinical records.
9. As an admin, I verify registration before activating a dentist.
10. As an admin, my inquiry notes are saved reliably.
11. As an organisation, I understand possible contributions without implied commitments.
12. As an organisation, I submit a purposeful inquiry and receive a saved reference.
13. As a keyboard user, I can operate navigation, forms, menus and dialogs.
14. As a visitor, I see truthful content and useful loading, empty and failure states.
15. As an operator, scheduled jobs run only at their intended frequency and backups are recoverable.

## Implementation Decisions
Retain the framework and database. Strengthen transactional booking at its existing RPC interface, separate trusted server intake from browser reads, retain RLS. Use a simple smile identity and warm editorial composition with explicitly illustrative artwork. Provide a dedicated partnerships page and reuse the existing inbox. No payments or invented testimonials, founder history, or service guarantees.

## Testing Decisions
Test behavior at database RPCs under actual roles, browser form/navigation interfaces, and validation schemas. Use synthetic fixtures only. Capture and inspect 1440×900 and 390×844 renders. Run lint, typecheck, production build, security suites and independent engineering/product review before publication. Production verification is mandatory.

## Out of Scope
Payments, a full identity-schema rewrite, unsolicited real emails, and destructive production changes.

## Further Notes
No production migration until inspected and locally validated. No commit/push until final acceptance; use commit-pusher then.
