# Production availability audit — 14 September 2026

## Finding

The dentist directory is correctly reading the privacy-safe `public_dentists` and `public_slots` views. The empty availability shown in production is real data state, not a client filter, timezone conversion, schema mismatch, or RLS failure.

At 16:45 UTC on 14 September 2026, a read-only production query found:

- four active, public dentists;
- zero public slots in the next 14 days;
- the latest stored slots ended between 12 and 17 August 2026;
- two additional development dentists remained private and had only historical slots.

## Cause

`supabase/seed.sql` creates a rolling two-week sample only when the seed is run. The product intentionally expects dentists or administrators to publish future availability through the existing availability tools; there is no recurring synthetic slot generator. Generating new production appointments automatically would misrepresent clinicians' real schedules.

## Corrective action

The directory now treats this as an honest zero-availability state: it says “No times posted for the next 14 days,” removes the dead-end **See times** action, and keeps the supported **Request care** matching route prominent. No production appointments were fabricated or mutated.

Operationally, future times must be entered by a dentist or administrator through the existing authenticated availability flow. The public query and booking security boundary remain unchanged.
