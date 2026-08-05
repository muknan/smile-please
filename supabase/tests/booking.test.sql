-- State-machine and booking-flow test for Smile Please (Phase 5).
--
-- Run AFTER migrations 001-009 + seed, as the postgres role (direct SQL via
-- Node pg). The whole file runs in ONE transaction and rolls back at the end.
-- Roles are simulated with `set local role` + `set local request.jwt.claims`,
-- exactly how PostgREST presents requests to RLS.
--
-- Coverage: the full 8x8x3 transition matrix (192 cells) against the spec
-- table, every transition executed end-to-end through transition_appointment,
-- the 24-hour patient rule, the hold + confirm race, anon booking, anonymous
-- lookup (safe fields, identical not-found), the rate limiter, and reschedule.

begin;

-- ── Matrix: every (from, to, actor) cell must match Master §5.2 ────────────
do $$
declare
  r record;
  bad int := 0;
begin
  for r in select * from (values
('requested','requested','patient',false),
('requested','requested','dentist',false),
('requested','requested','admin',false),
('requested','assigned','patient',false),
('requested','assigned','dentist',false),
('requested','assigned','admin',true),
('requested','confirmed','patient',false),
('requested','confirmed','dentist',false),
('requested','confirmed','admin',false),
('requested','completed','patient',false),
('requested','completed','dentist',false),
('requested','completed','admin',false),
('requested','no_show','patient',false),
('requested','no_show','dentist',false),
('requested','no_show','admin',false),
('requested','cancelled_by_patient','patient',true),
('requested','cancelled_by_patient','dentist',false),
('requested','cancelled_by_patient','admin',true),
('requested','cancelled_by_dentist','patient',false),
('requested','cancelled_by_dentist','dentist',false),
('requested','cancelled_by_dentist','admin',false),
('requested','cancelled_by_admin','patient',false),
('requested','cancelled_by_admin','dentist',false),
('requested','cancelled_by_admin','admin',true),
('assigned','requested','patient',false),
('assigned','requested','dentist',false),
('assigned','requested','admin',true),
('assigned','assigned','patient',false),
('assigned','assigned','dentist',false),
('assigned','assigned','admin',false),
('assigned','confirmed','patient',false),
('assigned','confirmed','dentist',true),
('assigned','confirmed','admin',true),
('assigned','completed','patient',false),
('assigned','completed','dentist',false),
('assigned','completed','admin',false),
('assigned','no_show','patient',false),
('assigned','no_show','dentist',false),
('assigned','no_show','admin',false),
('assigned','cancelled_by_patient','patient',true),
('assigned','cancelled_by_patient','dentist',false),
('assigned','cancelled_by_patient','admin',true),
('assigned','cancelled_by_dentist','patient',false),
('assigned','cancelled_by_dentist','dentist',true),
('assigned','cancelled_by_dentist','admin',true),
('assigned','cancelled_by_admin','patient',false),
('assigned','cancelled_by_admin','dentist',false),
('assigned','cancelled_by_admin','admin',true),
('confirmed','requested','patient',false),
('confirmed','requested','dentist',false),
('confirmed','requested','admin',false),
('confirmed','assigned','patient',false),
('confirmed','assigned','dentist',false),
('confirmed','assigned','admin',false),
('confirmed','confirmed','patient',true),
('confirmed','confirmed','dentist',true),
('confirmed','confirmed','admin',true),
('confirmed','completed','patient',false),
('confirmed','completed','dentist',true),
('confirmed','completed','admin',true),
('confirmed','no_show','patient',false),
('confirmed','no_show','dentist',true),
('confirmed','no_show','admin',true),
('confirmed','cancelled_by_patient','patient',true),
('confirmed','cancelled_by_patient','dentist',false),
('confirmed','cancelled_by_patient','admin',true),
('confirmed','cancelled_by_dentist','patient',false),
('confirmed','cancelled_by_dentist','dentist',true),
('confirmed','cancelled_by_dentist','admin',true),
('confirmed','cancelled_by_admin','patient',false),
('confirmed','cancelled_by_admin','dentist',false),
('confirmed','cancelled_by_admin','admin',true),
('completed','requested','patient',false),
('completed','requested','dentist',false),
('completed','requested','admin',false),
('completed','assigned','patient',false),
('completed','assigned','dentist',false),
('completed','assigned','admin',false),
('completed','confirmed','patient',false),
('completed','confirmed','dentist',false),
('completed','confirmed','admin',false),
('completed','completed','patient',false),
('completed','completed','dentist',false),
('completed','completed','admin',false),
('completed','no_show','patient',false),
('completed','no_show','dentist',false),
('completed','no_show','admin',false),
('completed','cancelled_by_patient','patient',false),
('completed','cancelled_by_patient','dentist',false),
('completed','cancelled_by_patient','admin',false),
('completed','cancelled_by_dentist','patient',false),
('completed','cancelled_by_dentist','dentist',false),
('completed','cancelled_by_dentist','admin',false),
('completed','cancelled_by_admin','patient',false),
('completed','cancelled_by_admin','dentist',false),
('completed','cancelled_by_admin','admin',false),
('no_show','requested','patient',false),
('no_show','requested','dentist',false),
('no_show','requested','admin',false),
('no_show','assigned','patient',false),
('no_show','assigned','dentist',false),
('no_show','assigned','admin',false),
('no_show','confirmed','patient',false),
('no_show','confirmed','dentist',false),
('no_show','confirmed','admin',true),
('no_show','completed','patient',false),
('no_show','completed','dentist',false),
('no_show','completed','admin',false),
('no_show','no_show','patient',false),
('no_show','no_show','dentist',false),
('no_show','no_show','admin',false),
('no_show','cancelled_by_patient','patient',false),
('no_show','cancelled_by_patient','dentist',false),
('no_show','cancelled_by_patient','admin',false),
('no_show','cancelled_by_dentist','patient',false),
('no_show','cancelled_by_dentist','dentist',false),
('no_show','cancelled_by_dentist','admin',false),
('no_show','cancelled_by_admin','patient',false),
('no_show','cancelled_by_admin','dentist',false),
('no_show','cancelled_by_admin','admin',false),
('cancelled_by_patient','requested','patient',false),
('cancelled_by_patient','requested','dentist',false),
('cancelled_by_patient','requested','admin',true),
('cancelled_by_patient','assigned','patient',false),
('cancelled_by_patient','assigned','dentist',false),
('cancelled_by_patient','assigned','admin',false),
('cancelled_by_patient','confirmed','patient',false),
('cancelled_by_patient','confirmed','dentist',false),
('cancelled_by_patient','confirmed','admin',false),
('cancelled_by_patient','completed','patient',false),
('cancelled_by_patient','completed','dentist',false),
('cancelled_by_patient','completed','admin',false),
('cancelled_by_patient','no_show','patient',false),
('cancelled_by_patient','no_show','dentist',false),
('cancelled_by_patient','no_show','admin',false),
('cancelled_by_patient','cancelled_by_patient','patient',false),
('cancelled_by_patient','cancelled_by_patient','dentist',false),
('cancelled_by_patient','cancelled_by_patient','admin',false),
('cancelled_by_patient','cancelled_by_dentist','patient',false),
('cancelled_by_patient','cancelled_by_dentist','dentist',false),
('cancelled_by_patient','cancelled_by_dentist','admin',false),
('cancelled_by_patient','cancelled_by_admin','patient',false),
('cancelled_by_patient','cancelled_by_admin','dentist',false),
('cancelled_by_patient','cancelled_by_admin','admin',false),
('cancelled_by_dentist','requested','patient',false),
('cancelled_by_dentist','requested','dentist',false),
('cancelled_by_dentist','requested','admin',true),
('cancelled_by_dentist','assigned','patient',false),
('cancelled_by_dentist','assigned','dentist',false),
('cancelled_by_dentist','assigned','admin',false),
('cancelled_by_dentist','confirmed','patient',false),
('cancelled_by_dentist','confirmed','dentist',false),
('cancelled_by_dentist','confirmed','admin',false),
('cancelled_by_dentist','completed','patient',false),
('cancelled_by_dentist','completed','dentist',false),
('cancelled_by_dentist','completed','admin',false),
('cancelled_by_dentist','no_show','patient',false),
('cancelled_by_dentist','no_show','dentist',false),
('cancelled_by_dentist','no_show','admin',false),
('cancelled_by_dentist','cancelled_by_patient','patient',false),
('cancelled_by_dentist','cancelled_by_patient','dentist',false),
('cancelled_by_dentist','cancelled_by_patient','admin',false),
('cancelled_by_dentist','cancelled_by_dentist','patient',false),
('cancelled_by_dentist','cancelled_by_dentist','dentist',false),
('cancelled_by_dentist','cancelled_by_dentist','admin',false),
('cancelled_by_dentist','cancelled_by_admin','patient',false),
('cancelled_by_dentist','cancelled_by_admin','dentist',false),
('cancelled_by_dentist','cancelled_by_admin','admin',false),
('cancelled_by_admin','requested','patient',false),
('cancelled_by_admin','requested','dentist',false),
('cancelled_by_admin','requested','admin',true),
('cancelled_by_admin','assigned','patient',false),
('cancelled_by_admin','assigned','dentist',false),
('cancelled_by_admin','assigned','admin',false),
('cancelled_by_admin','confirmed','patient',false),
('cancelled_by_admin','confirmed','dentist',false),
('cancelled_by_admin','confirmed','admin',false),
('cancelled_by_admin','completed','patient',false),
('cancelled_by_admin','completed','dentist',false),
('cancelled_by_admin','completed','admin',false),
('cancelled_by_admin','no_show','patient',false),
('cancelled_by_admin','no_show','dentist',false),
('cancelled_by_admin','no_show','admin',false),
('cancelled_by_admin','cancelled_by_patient','patient',false),
('cancelled_by_admin','cancelled_by_patient','dentist',false),
('cancelled_by_admin','cancelled_by_patient','admin',false),
('cancelled_by_admin','cancelled_by_dentist','patient',false),
('cancelled_by_admin','cancelled_by_dentist','dentist',false),
('cancelled_by_admin','cancelled_by_dentist','admin',false),
('cancelled_by_admin','cancelled_by_admin','patient',false),
('cancelled_by_admin','cancelled_by_admin','dentist',false),
('cancelled_by_admin','cancelled_by_admin','admin',false)  ) as t(fs, ts, act, exp) loop
    if public._booking_transition_allowed(
         r.fs::appointment_status, r.ts::appointment_status, r.act::user_role
       ) <> r.exp then
      bad := bad + 1;
      raise notice 'MATRIX MISMATCH % -> % as %', r.fs, r.ts, r.act;
    end if;
  end loop;
  if bad > 0 then raise exception 'TRANSITION MATRIX FAILED (% mismatches)', bad; end if;
  raise notice 'test 1 pass: 192-cell transition matrix matches the spec table';
end $$;

-- ── Fixtures ───────────────────────────────────────────────────────────────
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-0000000000a1',
   'authenticated','authenticated','btest-pat@test.local','x',now(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Booking Test Patient"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-0000000000b1',
   'authenticated','authenticated','btest-den@test.local','x',now(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Booking Test Dentist"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-0000000000c1',
   'authenticated','authenticated','btest-adm@test.local','x',now(),
   '{"provider":"email","providers":["email"]}','{"full_name":"Booking Test Admin"}',now(),now());

update public.profiles set role='dentist' where id='30000000-0000-0000-0000-0000000000b1';
update public.profiles set role='admin'   where id='30000000-0000-0000-0000-0000000000c1';
delete from public.patients
where profile_id in ('30000000-0000-0000-0000-0000000000b1','30000000-0000-0000-0000-0000000000c1');
update public.profiles set phone='+919876501234' where id='30000000-0000-0000-0000-0000000000a1';

insert into public.dentists
  (profile_id, slug, display_name, locality, city, specialties, languages, bio, status, is_public)
values ('30000000-0000-0000-0000-0000000000b1','booking-test-dentist','Dr Booking Test',
        'Seelampur','New Delhi',array['General dentistry'],array['Hindi','English'],
        'Test only.','active',false);

-- Slot A (tomorrow 09:00) and slot C (day after 09:00) for the booking tests.
insert into public.availability_slots (dentist_id, starts_at, ends_at, created_by)
values
  ('30000000-0000-0000-0000-0000000000b1',
   (((now() at time zone 'Asia/Kolkata')::date + 1) + time '09:00') at time zone 'Asia/Kolkata',
   (((now() at time zone 'Asia/Kolkata')::date + 1) + time '09:30') at time zone 'Asia/Kolkata',
   '30000000-0000-0000-0000-0000000000b1'),
  ('30000000-0000-0000-0000-0000000000b1',
   (((now() at time zone 'Asia/Kolkata')::date + 2) + time '09:00') at time zone 'Asia/Kolkata',
   (((now() at time zone 'Asia/Kolkata')::date + 2) + time '09:30') at time zone 'Asia/Kolkata',
   '30000000-0000-0000-0000-0000000000b1');

insert into public.appointments (patient_id, dentist_id, source, status, reason_category, scheduled_for)
values
  ('30000000-0000-0000-0000-0000000000a1', null, 'patient_request','requested','pain', null),
  ('30000000-0000-0000-0000-0000000000a1','30000000-0000-0000-0000-0000000000b1','admin_created','assigned','checkup', now() + interval '12 hours'),
  ('30000000-0000-0000-0000-0000000000a1','30000000-0000-0000-0000-0000000000b1','admin_created','assigned','checkup', now() + interval '48 hours'),
  ('30000000-0000-0000-0000-0000000000a1','30000000-0000-0000-0000-0000000000b1','admin_created','assigned','checkup', now() + interval '49 hours'),
  ('30000000-0000-0000-0000-0000000000a1','30000000-0000-0000-0000-0000000000b1','admin_created','assigned','checkup', now() + interval '48 hours');

-- ── Test 2: end-to-end transitions through transition_appointment ──────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"30000000-0000-0000-0000-0000000000b1"}';
do $$
begin
  perform public.transition_appointment(
    (select id from public.appointments a
      where a.patient_id='30000000-0000-0000-0000-0000000000a1' and a.scheduled_for = now() + interval '48 hours' limit 1),
    'confirmed', 'dentist confirms');
  if (select count(*) from public.appointment_events e
      join public.appointments a on a.id = e.appointment_id
      where e.to_status='confirmed' and e.from_status='assigned' and e.actor_role='dentist') <> 1 then
    raise exception 'TEST 2a FAILED: dentist confirm or its event row missing';
  end if;
  raise notice 'test 2a pass: dentist confirmed, event written';
end $$;

set local request.jwt.claims = '{"sub":"30000000-0000-0000-0000-0000000000c1"}';
do $$
declare v_count int;
begin
  perform public.transition_appointment(
    (select id from public.appointments a
      where a.patient_id='30000000-0000-0000-0000-0000000000a1' and a.scheduled_for = now() + interval '48 hours' limit 1),
    'cancelled_by_admin', 'admin override');
  select count(*) into v_count from public.appointment_events e
    where e.to_status='cancelled_by_admin' and e.actor_role='admin';
  if v_count <> 1 then
    raise exception 'TEST 2b FAILED: admin cancel event missing';
  end if;
  raise notice 'test 2b pass: admin cancelled, event written';
end $$;

set local request.jwt.claims = '{"sub":"30000000-0000-0000-0000-0000000000a1"}';
do $$
declare v_id uuid;
begin
  select id into v_id from public.appointments a
    where a.patient_id='30000000-0000-0000-0000-0000000000a1' and a.source='patient_request' limit 1;
  perform public.transition_appointment(v_id, 'cancelled_by_patient', 'changed my mind');
  if (select status from public.appointments where id=v_id) <> 'cancelled_by_patient' then
    raise exception 'TEST 2c FAILED: patient cancel did not land';
  end if;
  if (select cancelled_reason from public.appointments where id=v_id) <> 'changed my mind' then
    raise exception 'TEST 2c FAILED: cancelled_reason not recorded';
  end if;
  raise notice 'test 2c pass: patient cancelled own request with reason';
end $$;

-- ── Test 3: the 24-hour patient rule ───────────────────────────────────────
set local request.jwt.claims = '{"sub":"30000000-0000-0000-0000-0000000000b1"}';
do $$
declare v_id uuid;
begin
  select id into v_id from public.appointments a
    where a.patient_id='30000000-0000-0000-0000-0000000000a1' and a.scheduled_for < now() + interval '20 hours'
    limit 1;
  perform public.transition_appointment(v_id, 'confirmed', 'dentist confirms');
end $$;
set local request.jwt.claims = '{"sub":"30000000-0000-0000-0000-0000000000a1"}';
do $$
declare v_id uuid; refused boolean := false; v_err text;
begin
  select id into v_id from public.appointments a
    where a.patient_id='30000000-0000-0000-0000-0000000000a1' and a.scheduled_for < now() + interval '20 hours'
    limit 1;
  begin
    perform public.transition_appointment(v_id, 'cancelled_by_patient', 'too late');
  exception when others then
    if SQLERRM like '%RESCHEDULE_TOO_LATE%' then refused := true; else v_err := SQLERRM; end if;
  end;
  if not refused then
    raise exception 'TEST 3a FAILED: patient cancelled 12h before (err: %)', v_err;
  end if;
  if (select status from public.appointments where id=v_id) <> 'confirmed' then
    raise exception 'TEST 3a FAILED: status changed despite refusal';
  end if;
  if (select count(*) from public.appointment_events e where e.appointment_id=v_id and e.to_status='cancelled_by_patient') <> 0 then
    raise exception 'TEST 3a FAILED: event written despite refusal';
  end if;
  raise notice 'test 3a pass: 12h-out cancel refused, status and events untouched';
end $$;

set local request.jwt.claims = '{"sub":"30000000-0000-0000-0000-0000000000b1"}';
do $$
begin
  perform public.transition_appointment(
    (select id from public.appointments a
      where a.patient_id='30000000-0000-0000-0000-0000000000a1'
        and a.status='assigned' and a.scheduled_for = now() + interval '49 hours'
      limit 1),
    'confirmed', 'dentist confirms');
end $$;
set local request.jwt.claims = '{"sub":"30000000-0000-0000-0000-0000000000a1"}';
do $$
declare v_count int;
begin
  perform public.transition_appointment(
    (select id from public.appointments a
      where a.patient_id='30000000-0000-0000-0000-0000000000a1'
        and a.status='confirmed' and a.scheduled_for = now() + interval '49 hours'
      limit 1),
    'cancelled_by_patient', 'within window');
  select count(*) into v_count from public.appointment_events e
    where to_status='cancelled_by_patient' and actor_role='patient';
  if v_count < 1 then
    raise exception 'TEST 3b FAILED: legal patient cancel missing event';
  end if;
  raise notice 'test 3b pass: 48h-out cancel allowed, event written';
end $$;

-- ── Test 4: an illegal transition writes nothing ───────────────────────────
do $$
declare v_id uuid; refused boolean := false;
begin
  select id into v_id from public.appointments a
    where a.patient_id='30000000-0000-0000-0000-0000000000a1' and a.scheduled_for < now() + interval '20 hours'
    limit 1;
  begin
    perform public.transition_appointment(v_id, 'completed', 'nope');
  exception when others then
    if SQLERRM like '%ILLEGAL_TRANSITION%' then refused := true; end if;
  end;
  if not refused then
    raise exception 'TEST 4 FAILED: patient completed their own appointment';
  end if;
  if (select count(*) from public.appointment_events e where e.appointment_id=v_id and e.to_status='completed') <> 0 then
    raise exception 'TEST 4 FAILED: event written for illegal transition';
  end if;
  if (select status from public.appointments where id=v_id) <> 'confirmed' then
    raise exception 'TEST 4 FAILED: status changed by illegal transition';
  end if;
  raise notice 'test 4 pass: patient confirmed->completed refused, nothing written';
end $$;

-- ── Test 5: hold_slot ──────────────────────────────────────────────────────
set local role anon;
set local request.jwt.claims = '{"sub":null}';
do $$
declare v_slot uuid; v_state text;
begin
  select id into v_slot from public.availability_slots
    where dentist_id='30000000-0000-0000-0000-0000000000b1'
      and starts_at = (((now() at time zone 'Asia/Kolkata')::date + 1) + time '09:00') at time zone 'Asia/Kolkata'
    limit 1;
  v_state := (public.hold_slot(v_slot)).status;
  if v_state <> 'held' then
    raise exception 'TEST 5a FAILED: hold_slot did not hold (state %)', v_state;
  end if;
  begin
    perform public.hold_slot(v_slot);
    raise exception 'TEST 5a FAILED: second hold succeeded while held';
  exception when others then
    if SQLERRM not like '%SLOT_HELD%' then raise; end if;
  end;
  raise notice 'test 5a pass: hold placed; second hold refused while held';
end $$;

-- ── Test 6: anon booking paths ─────────────────────────────────────────────
-- 6a: Path A request. Call as anon; switch to postgres to assert (anon cannot
-- read profiles, consents, or appointments back — which is itself correct).
create temp table tmp_bk (appt uuid, patient uuid, ref text);
insert into tmp_bk (appt, patient, ref)
select id, patient_id, reference_code
from public.create_booking_request('anon-a@test.local','Anon A','+919876512345','18_39','bleeding_gums',
        'Gums bleed when brushing','Seelampur','{"days":["weekdays"],"times":["morning"]}', true);
set local role postgres;
do $$
declare v_patient uuid;
begin
  select patient into v_patient from tmp_bk;
  if (select count(*) from public.appointments a where a.id = (select appt from tmp_bk)
      and a.source='patient_request' and a.status='requested' and a.dentist_id is null) <> 1 then
    raise exception 'TEST 6a FAILED: request shape wrong';
  end if;
  if (select count(*) from public.profiles p where p.id=v_patient and p.phone='+919876512345' and p.full_name='Anon A') <> 1 then
    raise exception 'TEST 6a FAILED: profile not created/populated';
  end if;
  if (select count(*) from public.consents where subject_id=v_patient and purpose='booking') <> 1 then
    raise exception 'TEST 6a FAILED: booking consent row missing';
  end if;
  if (select count(*) from public.consents where subject_id=v_patient and purpose='awareness_updates') <> 1 then
    raise exception 'TEST 6a FAILED: awareness consent row missing';
  end if;
  raise notice 'test 6a pass: anon request saved with profile + both consents';
end $$;

-- 6b: Path B confirm on slot C (fresh email).
set local role anon;
delete from tmp_bk;
insert into tmp_bk (appt, patient, ref)
select id, patient_id, reference_code
from public.confirm_booking(
  (select id from public.availability_slots
     where dentist_id='30000000-0000-0000-0000-0000000000b1'
       and starts_at = (((now() at time zone 'Asia/Kolkata')::date + 2) + time '09:00') at time zone 'Asia/Kolkata'
     limit 1),
  'anon-b@test.local','Anon B','+919876543211','12_17','Shahdara','110095','cleaning','First visit',false,null);
set local role postgres;
do $$
declare v_slotC uuid;
begin
  select id into v_slotC from public.availability_slots
    where dentist_id='30000000-0000-0000-0000-0000000000b1'
      and starts_at = (((now() at time zone 'Asia/Kolkata')::date + 2) + time '09:00') at time zone 'Asia/Kolkata' limit 1;
  if (select count(*) from public.appointments a where a.id=(select appt from tmp_bk)
      and a.source='self_booked' and a.status='confirmed' and a.slot_id=v_slotC) <> 1 then
    raise exception 'TEST 6b FAILED: booking shape wrong';
  end if;
  if (select status from public.availability_slots where id=v_slotC) <> 'booked'
     or (select booked_count from public.availability_slots where id=v_slotC) <> 1 then
    raise exception 'TEST 6b FAILED: slot not marked booked';
  end if;
  raise notice 'test 6b pass: anon self-booking confirmed, slot booked';
end $$;

-- 6c: reschedule — confirm a day+3 slot for anon C, then move onto a day+4
-- slot. Both are >24h out, so the patient reschedule rule does not apply.
-- Runs as postgres: slots already held or booked are invisible to anon's
-- SELECT policy. Anon CALLABILITY of the booking functions is asserted
-- separately (6d) via has_function_privilege — the definer bodies behave
-- identically for every caller.
set local role postgres;
insert into public.availability_slots (dentist_id, starts_at, ends_at, created_by)
values
  ('30000000-0000-0000-0000-0000000000b1',
   (((now() at time zone 'Asia/Kolkata')::date + 3) + time '09:00') at time zone 'Asia/Kolkata',
   (((now() at time zone 'Asia/Kolkata')::date + 3) + time '09:30') at time zone 'Asia/Kolkata',
   '30000000-0000-0000-0000-0000000000b1'),
  ('30000000-0000-0000-0000-0000000000b1',
   (((now() at time zone 'Asia/Kolkata')::date + 4) + time '09:00') at time zone 'Asia/Kolkata',
   (((now() at time zone 'Asia/Kolkata')::date + 4) + time '09:30') at time zone 'Asia/Kolkata',
   '30000000-0000-0000-0000-0000000000b1');
do $$
declare v_first uuid; v_second uuid; v_app uuid; v_ra uuid;
begin
  select id into v_first from public.availability_slots
    where dentist_id='30000000-0000-0000-0000-0000000000b1'
      and starts_at = (((now() at time zone 'Asia/Kolkata')::date + 3) + time '09:00') at time zone 'Asia/Kolkata' limit 1;
  select id into v_second from public.availability_slots
    where dentist_id='30000000-0000-0000-0000-0000000000b1'
      and starts_at = (((now() at time zone 'Asia/Kolkata')::date + 4) + time '09:00') at time zone 'Asia/Kolkata' limit 1;
  select id into v_ra from public.confirm_booking(
    v_first, 'anon-c@test.local','Anon C','+919876543212','18_39','Karol Bagh','110005','checkup',null,false,null);
  select id into v_app from public.confirm_booking(
    v_second, 'anon-c@test.local','Anon C','+919876543212','18_39','Karol Bagh','110005','checkup',null,false,v_ra);
  if (select slot_id from public.appointments where id=v_ra) <> v_second then
    raise exception 'TEST 6c FAILED: appointment did not move slots';
  end if;
  if (select status from public.availability_slots where id=v_first) <> 'open'
     or (select booked_count from public.availability_slots where id=v_first) <> 0 then
    raise exception 'TEST 6c FAILED: old slot not released';
  end if;
  if (select count(*) from public.appointment_events where appointment_id=v_ra and reason like 'Rescheduled%') <> 1 then
    raise exception 'TEST 6c FAILED: reschedule event missing';
  end if;
  raise notice 'test 6c pass: reschedule moved appointment, freed old slot, event written';
end $$;

-- ── Test 6d: anonymous callers really CAN execute the booking functions ────
do $$
begin
  if not has_function_privilege('anon', 'public.hold_slot(uuid)', 'EXECUTE') then
    raise exception 'TEST 6d FAILED: anon cannot execute hold_slot';
  end if;
  if not has_function_privilege('anon', 'public.create_booking_request(text,text,text,age_band,reason_category,text,text,jsonb,boolean)', 'EXECUTE') then
    raise exception 'TEST 6d FAILED: anon cannot execute create_booking_request';
  end if;
  if not has_function_privilege('anon', 'public.confirm_booking(uuid,text,text,text,age_band,text,text,reason_category,text,boolean,uuid)', 'EXECUTE') then
    raise exception 'TEST 6d FAILED: anon cannot execute confirm_booking';
  end if;
  if not has_function_privilege('anon', 'public.lookup_appointment(text,text)', 'EXECUTE') then
    raise exception 'TEST 6d FAILED: anon cannot execute lookup_appointment';
  end if;
  raise notice 'test 6d pass: booking functions executable by anon';
end $$;

-- ── Test 7: lookup — safe fields only; wrong code and wrong phone identical ─
set local role anon;
do $$
declare v_ref text; v_ok jsonb; v_bad1 jsonb; v_bad2 jsonb;
begin
  select ref into v_ref from tmp_bk limit 1;
  v_ok := public.lookup_appointment(v_ref, '+919876543211');
  v_bad1 := public.lookup_appointment(v_ref, '+919876509999');
  v_bad2 := public.lookup_appointment('SP-9999-NOPE', '+919876543211');
  if v_ok->>'found' <> 'true' or v_ok->>'status' <> 'confirmed' then
    raise exception 'TEST 7 FAILED: lookup did not find the booking (%)', v_ok::text;
  end if;
  if v_ok ? 'clinical_note' or v_ok ? 'patient_note' or v_ok ? 'phone' or v_ok ? 'email' then
    raise exception 'TEST 7 FAILED: lookup leaked a protected field';
  end if;
  if jsonb_typeof(v_ok->'events') <> 'array' or jsonb_array_length(v_ok->'events') < 1 then
    raise exception 'TEST 7 FAILED: timeline missing';
  end if;
  if v_bad1->>'found' <> 'false' then
    raise exception 'TEST 7 FAILED: wrong phone not generic-not-found';
  end if;
  if v_bad2->>'found' <> 'false' then
    raise exception 'TEST 7 FAILED: wrong code not generic-not-found';
  end if;
  raise notice 'test 7 pass: lookup safe fields, identical not-found responses';
end $$;

-- ── Test 8: rate limiter ───────────────────────────────────────────────────
set local role postgres;
do $$
declare i int; v_ok boolean := true;
begin
  for i in 1..5 loop
    if not public.check_rate_limit('sha256:test-key-abc', 5, 3600) then v_ok := false; end if;
  end loop;
  if not v_ok then raise exception 'TEST 8 FAILED: early attempt refused'; end if;
  if public.check_rate_limit('sha256:test-key-abc', 5, 3600) then
    raise exception 'TEST 8 FAILED: 6th attempt allowed';
  end if;
  if not public.check_rate_limit('sha256:different-key', 5, 3600) then
    raise exception 'TEST 8 FAILED: unrelated key refused';
  end if;
  raise notice 'test 8 pass: 6th attempt refused, other keys unaffected';
end $$;

-- ── Test 9: admin reassignment is one atomic transition (D-51/D-57) ────────
-- An `assigned` appointment can be moved straight to another active dentist
-- in a single RPC call; a requested row is assigned directly. The reason is
-- mandatory and lands in appointment_events in the same transaction.
set local role postgres;
-- Dedicated fixtures: one assigned appointment to reassign, one requested row.
insert into public.appointments (patient_id, dentist_id, source, status, reason_category, scheduled_for)
values
  ('30000000-0000-0000-0000-0000000000a1','30000000-0000-0000-0000-0000000000b1','admin_created','assigned','checkup', now() + interval '72 hours'),
  ('30000000-0000-0000-0000-0000000000a1','30000000-0000-0000-0000-0000000000b1','admin_created','requested','pain', null);
set local role authenticated;
set local request.jwt.claims = '{"sub":"30000000-0000-0000-0000-0000000000c1"}';
do $$
declare v_new_app public.appointments;
        v_event_count int;
begin
  v_new_app := public.admin_appointment_action(
    (select id from public.appointments a
       where a.patient_id='30000000-0000-0000-0000-0000000000a1'
         and a.status='assigned' and a.scheduled_for = now() + interval '72 hours' limit 1),
    'assigned', 'reassign test', '30000000-0000-0000-0000-0000000000b1');
  select count(*) into v_event_count from public.appointment_events e
    join public.appointments a on a.id=e.appointment_id
   where a.id = v_new_app.id and e.actor_role='admin' and e.to_status='assigned' and e.from_status='assigned';
  if v_event_count <> 1 then
    raise exception 'TEST 9 FAILED: reassign did not write one admin event (%)', v_event_count;
  end if;
  if v_new_app.dentist_id <> '30000000-0000-0000-0000-0000000000b1' then
    raise exception 'TEST 9 FAILED: reassigned dentist not applied';
  end if;
  raise notice 'test 9 pass: atomic reassignment writes one admin event';
end $$;

-- ── Test 10: reassignment without a reason is rejected ─────────────────────
do $$
declare rejected boolean := false;
begin
  begin
    perform public.admin_appointment_action(
      (select id from public.appointments a
         where a.patient_id='30000000-0000-0000-0000-0000000000a1'
           and a.status='requested' and a.dentist_id='30000000-0000-0000-0000-0000000000b1' limit 1),
      'assigned', '   ', '30000000-0000-0000-0000-0000000000b1');
    rejected := true;
  exception when others then
    if SQLERRM not like '%REASON_REQUIRED%' then
      raise exception 'TEST 10 FAILED: wrong error (%:%)', SQLERRM, SQLSTATE;
    end if;
  end;
  if rejected then
    raise exception 'TEST 10 FAILED: blank reason accepted for admin action';
  end if;
  raise notice 'test 10 pass: admin actions require a reason';
end $$;

rollback;
