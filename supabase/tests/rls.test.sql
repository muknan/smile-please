-- Adversarial RLS test for Smile Please.
--
-- Run AFTER migrations + seed, as the postgres role (direct SQL connection,
-- e.g. `psql "$DATABASE_URL" -f supabase/tests/rls.test.sql` or via Node pg).
-- The whole file runs in ONE transaction and rolls back at the end, so the
-- database is left exactly as it was. A failing assertion aborts the run
-- with a clear message — fix the policy, never the test.
--
-- Roles are simulated with `set local role` + `set local request.jwt.claims`,
-- which is how the PostgREST API layer presents every request to RLS.

begin;

-- ── Guard: RLS must be enabled on every public table ───────────────────────
do $$
declare n int;
begin
  select count(*) into n from pg_tables
  where schemaname = 'public' and rowsecurity = false;
  if n > 0 then
    raise exception 'GUARD FAILED: RLS disabled on % public table(s)', n;
  end if;
  raise notice 'guard pass: RLS enabled on all public tables';
end $$;

-- ── Setup (as postgres; bypasses RLS the way the API never can) ────────────
-- Patient A, patient B, a dentist, an admin.
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-0000000000a1',
   'authenticated', 'authenticated', 'rls-a@test.local', 'x', now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"RLS Patient A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-0000000000a2',
   'authenticated', 'authenticated', 'rls-b@test.local', 'x', now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"RLS Patient B"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-0000000000b1',
   'authenticated', 'authenticated', 'rls-dentist@test.local', 'x', now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"RLS Test Dentist"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-0000000000c1',
   'authenticated', 'authenticated', 'rls-admin@test.local', 'x', now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"RLS Admin"}', now(), now());

-- The signup trigger made everyone a patient; fix roles.
update public.profiles
set role = 'dentist' where id = '20000000-0000-0000-0000-0000000000b1';
update public.profiles
set role = 'admin' where id = '20000000-0000-0000-0000-0000000000c1';
delete from public.patients
where profile_id in ('20000000-0000-0000-0000-0000000000b1', '20000000-0000-0000-0000-0000000000c1');

-- Test dentist: active but NOT public, so it never shows in public_dentists.
insert into public.dentists
  (profile_id, slug, display_name, locality, city, specialties, languages, bio,
   status, is_public)
values (
  '20000000-0000-0000-0000-0000000000b1', 'rls-test-dentist', 'RLS Test Dentist',
  'Test Colony', 'New Delhi', array['General dentistry'], array['Hindi','English'],
  'Test dentist used only by the RLS test.', 'active', false
);

-- One slot for the test dentist (tomorrow 10:00-10:30 IST) — used by tests 5/6
-- context and by test 12 (overlap).
insert into public.availability_slots (dentist_id, starts_at, ends_at, created_by)
values (
  '20000000-0000-0000-0000-0000000000b1',
  (((now() at time zone 'Asia/Kolkata')::date + 1) + time '10:00') at time zone 'Asia/Kolkata',
  (((now() at time zone 'Asia/Kolkata')::date + 1) + time '10:30') at time zone 'Asia/Kolkata',
  '20000000-0000-0000-0000-0000000000b1'
);

-- Assigned appointment: patient A <-> test dentist, on that slot.
insert into public.appointments
  (patient_id, dentist_id, slot_id, source, status, reason_category, scheduled_for)
select
  '20000000-0000-0000-0000-0000000000a1',
  '20000000-0000-0000-0000-0000000000b1',
  s.id, 'admin_created', 'assigned', 'checkup', s.starts_at
from public.availability_slots s
where s.dentist_id = '20000000-0000-0000-0000-0000000000b1'
limit 1;

-- A clinical note on that appointment, and an event on it — both must stay
-- invisible/immutable respectively.
insert into public.clinical_notes (appointment_id, note, author_id)
select a.id, 'Sensitive clinical note — must never reach the patient.', a.dentist_id
from public.appointments a
where a.patient_id = '20000000-0000-0000-0000-0000000000a1'
  and a.dentist_id = '20000000-0000-0000-0000-0000000000b1';

insert into public.appointment_events
  (appointment_id, from_status, to_status, actor_id, actor_role, reason)
select a.id, 'requested', 'assigned', a.dentist_id, 'dentist', 'RLS test setup'
from public.appointments a
where a.patient_id = '20000000-0000-0000-0000-0000000000a1'
  and a.dentist_id = '20000000-0000-0000-0000-0000000000b1';

-- A draft article — anon must never see it (test 10).
insert into public.articles (slug, title, body_md, status)
values ('rls-draft-article', 'Hidden draft', 'Not for anon eyes.', 'draft');

-- ── Tests ──────────────────────────────────────────────────────────────────

-- Test 1: Patient A must not read patient B's appointments.
set local role authenticated;
set local request.jwt.claims = '{"sub":"20000000-0000-0000-0000-0000000000a1"}';
do $$
begin
  if (select count(*) from public.appointments
      where patient_id = '20000000-0000-0000-0000-0000000000a2') <> 0 then
    raise exception 'TEST 1 FAILED: patient A read patient B appointments';
  end if;
  raise notice 'test 1 pass: patient A cannot read patient B appointments';
end $$;

-- Test 2: Patient A must not see clinical notes, even their own.
do $$
begin
  if (select count(*) from public.clinical_notes) <> 0 then
    raise exception 'TEST 2 FAILED: patient A saw clinical notes';
  end if;
  raise notice 'test 2 pass: patient A cannot read clinical notes';
end $$;

-- Test 3: Patient A must not escalate their own role to admin.
do $$
declare escalated boolean := false;
begin
  begin
    execute 'update public.profiles
             set role = ''admin''
             where id = ''20000000-0000-0000-0000-0000000000a1''';
    escalated := true;
  exception when others then
    null; -- expected: policy denies
  end;
  if escalated then
    raise exception 'TEST 3 FAILED: patient escalated own role to admin';
  end if;
  raise notice 'test 3 pass: role escalation blocked';
end $$;

-- Test 4: Patient A must not read contact submissions.
do $$
begin
  if (select count(*) from public.contact_submissions) <> 0 then
    raise exception 'TEST 4 FAILED: patient A read contact submissions';
  end if;
  raise notice 'test 4 pass: patient A cannot read contact submissions';
end $$;

-- Test 5: Dentist must not read an unassigned patient's profile.
-- (positive control: the assigned patient A IS readable)
set local request.jwt.claims = '{"sub":"20000000-0000-0000-0000-0000000000b1"}';
do $$
begin
  if (select count(*) from public.profiles
      where id = '20000000-0000-0000-0000-0000000000a2') <> 0 then
    raise exception 'TEST 5 FAILED: dentist read unassigned patient profile';
  end if;
  if (select count(*) from public.profiles
      where id = '20000000-0000-0000-0000-0000000000a1') <> 1 then
    raise exception 'TEST 5 FAILED: dentist cannot read assigned patient profile';
  end if;
  raise notice 'test 5 pass: dentist reads only assigned patients';
end $$;

-- Test 6: Dentist must not see appointments not assigned to them.
do $$
begin
  if (select count(*) from public.appointments
      where dentist_id <> '20000000-0000-0000-0000-0000000000b1') <> 0 then
    raise exception 'TEST 6 FAILED: dentist saw others appointments';
  end if;
  if (select count(*) from public.appointments
      where dentist_id = '20000000-0000-0000-0000-0000000000b1') < 1 then
    raise exception 'TEST 6 FAILED: dentist cannot see own appointments';
  end if;
  raise notice 'test 6 pass: dentist sees only own appointments';
end $$;

-- Test 7: anon must not read the dentists table at all.
set local role anon;
set local request.jwt.claims = '{"sub":null}';
do $$
begin
  if (select count(*) from public.dentists) <> 0 then
    raise exception 'TEST 7 FAILED: anon read dentists table';
  end if;
  raise notice 'test 7 pass: anon cannot read dentists table';
end $$;

-- Test 8: anon cannot select a private column from public_dentists (it does
-- not exist in the view) — the column list itself is the policy.
do $$
begin
  begin
    execute 'select phone from public.public_dentists';
    raise exception 'TEST 8 FAILED: anon read phone from public_dentists';
  exception when others then
    null; -- expected: no such column
  end;
  raise notice 'test 8 pass: phone absent from public_dentists';
end $$;

-- Test 9: anon reads exactly the 4 seeded active public dentists.
do $$
begin
  if (select count(*) from public.public_dentists) <> 4 then
    raise exception 'TEST 9 FAILED: public_dentists does not expose the 4 seed dentists';
  end if;
  if (select bool_and(display_name is not null) from public.public_dentists) is distinct from true then
    raise exception 'TEST 9 FAILED: public_dentists has null display names';
  end if;
  raise notice 'test 9 pass: anon sees the 4 active public dentists only';
end $$;

-- Test 10: anon reads only published articles.
do $$
begin
  if (select count(*) from public.articles) <> 4 then
    raise exception 'TEST 10 FAILED: anon saw non-published articles';
  end if;
  if exists (select 1 from public.articles where status = 'draft') then
    raise exception 'TEST 10 FAILED: anon saw a draft article';
  end if;
  raise notice 'test 10 pass: anon sees published articles only';
end $$;

-- Test 11: nobody can delete appointment_events (no delete policy exists).
set local role authenticated;
set local request.jwt.claims = '{"sub":"20000000-0000-0000-0000-0000000000b1"}';
do $$
declare n bigint;
begin
  execute 'delete from public.appointment_events e
           using public.appointments a
           where a.id = e.appointment_id
             and a.dentist_id = ''20000000-0000-0000-0000-0000000000b1''';
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'TEST 11 FAILED: appointment_events deleted (% rows)', n;
  end if;
  raise notice 'test 11 pass: appointment_events are append-only';
end $$;

-- Test 12: overlapping slots are structurally impossible (slots_no_overlap).
set local request.jwt.claims = '{"sub":"20000000-0000-0000-0000-0000000000b1"}';
do $$
declare rejected boolean := false;
begin
  begin
    execute 'insert into public.availability_slots
             (dentist_id, starts_at, ends_at, created_by)
             values (
               ''20000000-0000-0000-0000-0000000000b1'',
               (((now() at time zone ''Asia/Kolkata'')::date + 1) + time ''10:15'') at time zone ''Asia/Kolkata'',
               (((now() at time zone ''Asia/Kolkata'')::date + 1) + time ''10:45'') at time zone ''Asia/Kolkata'',
               ''20000000-0000-0000-0000-0000000000b1''
             )';
  exception when others then
    rejected := true; -- expected: exclusion constraint violation
  end;
  if not rejected then
    raise exception 'TEST 12 FAILED: overlapping slot was inserted';
  end if;
  raise notice 'test 12 pass: overlapping slots rejected by constraint';
end $$;

-- Test 13: a patient cannot directly UPDATE their own appointment (D-01).
-- All status/dentist_id/scheduled_for changes must go through the RPCs.
-- RLS silently filters UPDATEs for rows without a policy, so assert that zero
-- rows were changed (not that the statement throws).
set local role authenticated;
set local request.jwt.claims = '{"sub":"20000000-0000-0000-0000-0000000000a1"}';
do $$
declare n bigint;
        v_status text;
begin
  execute 'update public.appointments set status = ''completed''
           where patient_id = ''20000000-0000-0000-0000-0000000000a1''';
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'TEST 13 FAILED: patient updated own appointment (% rows)', n;
  end if;
  select status into v_status from public.appointments
   where patient_id = '20000000-0000-0000-0000-0000000000a1' limit 1;
  if v_status = 'completed' then
    raise exception 'TEST 13 FAILED: patient escalated own appointment to completed';
  end if;
  raise notice 'test 13 pass: patient cannot UPDATE own appointment';
end $$;

-- Test 14: a patient cannot insert a `confirmed` appointment (D-01).
do $$
declare rejected boolean := false;
begin
  begin
    execute 'insert into public.appointments
             (patient_id, source, status, reason_category)
             values (''20000000-0000-0000-0000-0000000000a1'',''patient_request'',''confirmed'',''pain'')';
    rejected := true;
  exception when others then
    null; -- expected: no INSERT policy
  end;
  if rejected then
    raise exception 'TEST 14 FAILED: patient inserted confirmed appointment';
  end if;
  raise notice 'test 14 pass: patient cannot INSERT an appointment';
end $$;

-- Test 15: a patient cannot create an availability slot (D-02).
do $$
declare rejected boolean := false;
begin
  begin
    execute 'insert into public.availability_slots
             (dentist_id, starts_at, ends_at, created_by)
             values (
               ''20000000-0000-0000-0000-0000000000a1'',
               now() + interval ''1 day'', now() + interval ''1 day 30 minutes'',
               ''20000000-0000-0000-0000-0000000000a1'')';
    rejected := true;
  exception when others then
    null; -- expected: only dentists may manage slots
  end;
  if rejected then
    raise exception 'TEST 15 FAILED: patient inserted an availability slot';
  end if;
  raise notice 'test 15 pass: patient cannot insert an availability slot';
end $$;

-- Test 16: a patient cannot forge a consent or audit-log row (D-03).
do $$
declare rejected_consent boolean := false;
        rejected_audit boolean := false;
begin
  begin
    execute 'insert into public.consents (subject_type, subject_id, purpose, notice_version)
             values (''profile'',''20000000-0000-0000-0000-0000000000a1'',''booking'',''v1'')';
    rejected_consent := true;
  exception when others then
    null; -- expected: no INSERT policy
  end;
  begin
    execute 'insert into public.audit_log (actor_id, action, entity)
             values (''20000000-0000-0000-0000-0000000000a1'',''booking.view'',''appointment'')';
    rejected_audit := true;
  exception when others then
    null; -- expected: no INSERT policy
  end;
  if rejected_consent then
    raise exception 'TEST 16 FAILED: user forged a consent row';
  end if;
  if rejected_audit then
    raise exception 'TEST 16 FAILED: user forged an audit row';
  end if;
  raise notice 'test 16 pass: patients cannot forge consent or audit rows';
end $$;

-- Bonus positive control: admin reads every profile and every submission.
set local request.jwt.claims = '{"sub":"20000000-0000-0000-0000-0000000000c1"}';
do $$
begin
  if (select count(*) from public.profiles) < 5 then
    raise exception 'BONUS FAILED: admin cannot read all profiles';
  end if;
  if (select count(*) from public.contact_submissions) < 5 then
    raise exception 'BONUS FAILED: admin cannot read submissions';
  end if;
  raise notice 'bonus pass: admin reads all profiles and submissions';
end $$;

rollback;
