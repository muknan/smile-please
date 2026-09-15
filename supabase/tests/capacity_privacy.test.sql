-- Regression coverage for migration 015's single-patient capacity and the
-- anonymous, patient-safe appointment timeline.
begin;

-- The schema must reject any future attempt to make a slot multi-patient.
do $$
declare
  v_constraint text;
  v_rejected boolean := false;
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.availability_slots'::regclass
       and conname = 'availability_slots_capacity_one'
       and contype = 'c'
  ) then
    raise exception 'CAPACITY TEST FAILED: single-patient capacity constraint is missing';
  end if;

  begin
    insert into public.availability_slots
      (dentist_id, starts_at, ends_at, capacity, created_by)
    values
      ('10000000-0000-0000-0000-000000000001', now() + interval '20 days',
       now() + interval '20 days 30 minutes', 2,
       '10000000-0000-0000-0000-000000000001');
    raise exception 'CAPACITY TEST FAILED: capacity=2 was accepted';
  exception when check_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint <> 'availability_slots_capacity_one' then
      raise exception 'CAPACITY TEST FAILED: wrong constraint rejected capacity=2 (%)', v_constraint;
    end if;
    v_rejected := true;
  end;

  if not v_rejected or exists (
    select 1 from public.availability_slots
     where capacity <> 1 or booked_count not between 0 and 1
  ) then
    raise exception 'CAPACITY TEST FAILED: single-patient slot invariant is not preserved';
  end if;
end;
$$;

-- Event audit details must never cross the anonymous lookup boundary, while
-- the patient-facing cancellation explanation remains deliberately available.
insert into public.appointments
  (id, reference_code, patient_id, source, status, reason_category, cancelled_reason)
values
  ('50000000-0000-0000-0000-000000000001', 'SP-PRIVACY-TEST',
   '10000000-0000-0000-0000-000000000101', 'admin_created',
   'cancelled_by_admin', 'checkup', 'Clinic closed due to maintenance.');

insert into public.appointment_events
  (appointment_id, from_status, to_status, actor_id, actor_role, reason)
values
  ('50000000-0000-0000-0000-000000000001', 'confirmed', 'cancelled_by_admin',
   '10000000-0000-0000-0000-000000000900', 'admin',
   'Internal staff note: clinician reassignment was considered.');

set local role anon;
do $$
declare
  v_lookup jsonb;
  v_event jsonb;
begin
  if not has_function_privilege('anon', 'public.lookup_appointment(text,text)', 'EXECUTE') then
    raise exception 'LOOKUP PRIVACY TEST FAILED: anon lost lookup access';
  end if;

  v_lookup := public.lookup_appointment('SP-PRIVACY-TEST', '+919812345601');
  v_event := v_lookup->'events'->0;
  if v_lookup->>'found' <> 'true'
     or v_lookup->>'cancelled_reason' <> 'Clinic closed due to maintenance.' then
    raise exception 'LOOKUP PRIVACY TEST FAILED: patient-safe lookup data changed (%)', v_lookup::text;
  end if;
  if v_event is null
     or jsonb_typeof(v_event) <> 'object'
     or (select count(*) from jsonb_object_keys(v_event)) <> 2
     or not v_event ? 'status'
     or not v_event ? 'at'
     or v_event ?| array['by', 'reason', 'actor_id', 'actor_role'] then
    raise exception 'LOOKUP PRIVACY TEST FAILED: event leaked audit details (%)', v_event::text;
  end if;
end;
$$;

rollback;
