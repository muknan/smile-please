begin;

-- The block RPC locks the same slot rows as hold/confirm: active holds and
-- bookings reject; expired holds become blocked with ordinary open slots.
do $$
declare
  v_dentist uuid := '10000000-0000-0000-0000-000000000001';
  v_date date := (now() at time zone 'Asia/Kolkata')::date + 20;
  v_start timestamptz := (((now() at time zone 'Asia/Kolkata')::date + 20) + time '10:00') at time zone 'Asia/Kolkata';
  v_open uuid := '60000000-0000-0000-0000-000000000001';
  v_hold uuid := '60000000-0000-0000-0000-000000000002';
  v_expired uuid := '60000000-0000-0000-0000-000000000003';
  v_booked uuid := '60000000-0000-0000-0000-000000000004';
  v_rejected boolean := false;
begin
  insert into public.availability_slots (id, dentist_id, starts_at, ends_at, created_by, status)
  values
    (v_open, v_dentist, v_start, v_start + interval '30 minutes', v_dentist, 'open'),
    (v_hold, v_dentist, v_start + interval '1 hour', v_start + interval '90 minutes', v_dentist, 'held'),
    (v_expired, v_dentist, v_start + interval '2 hours', v_start + interval '150 minutes', v_dentist, 'held'),
    (v_booked, v_dentist, v_start + interval '3 hours', v_start + interval '210 minutes', v_dentist, 'booked');
  update public.availability_slots set held_until = now() + interval '10 minutes', hold_owner = '60000000-0000-0000-0000-000000000099' where id = v_hold;
  update public.availability_slots set held_until = now() - interval '1 second' where id = v_expired;

end;
$$;

set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000001"}';
do $$
begin
  perform public.block_availability_day('10000000-0000-0000-0000-000000000001', (now() at time zone 'Asia/Kolkata')::date + 20);
  raise exception 'OPERATIONAL TEST FAILED: active hold did not reject a block';
exception when others then
  if SQLERRM not like '%DAY_HAS_ACTIVE_HOLD%' then raise; end if;
end;
$$;
set local role postgres;

update public.availability_slots set status = 'open', held_until = null, hold_owner = null
where id = '60000000-0000-0000-0000-000000000002';
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000001"}';
do $$
begin
  perform public.block_availability_day('10000000-0000-0000-0000-000000000001', (now() at time zone 'Asia/Kolkata')::date + 20);
  raise exception 'OPERATIONAL TEST FAILED: booked slot did not reject a block';
exception when others then
  if SQLERRM not like '%DAY_HAS_BOOKED_SLOT%' then raise; end if;
end;
$$;
set local role postgres;

update public.availability_slots set status = 'open', booked_count = 0
where id = '60000000-0000-0000-0000-000000000004';
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000001"}';
select public.block_availability_day('10000000-0000-0000-0000-000000000001', (now() at time zone 'Asia/Kolkata')::date + 20);
set local role postgres;
do $$
begin
  if exists (select 1 from public.availability_slots where id between '60000000-0000-0000-0000-000000000001' and '60000000-0000-0000-0000-000000000004' and status <> 'blocked') then
    raise exception 'OPERATIONAL TEST FAILED: block did not block open or expired-hold slots';
  end if;
  if not exists (select 1 from public.availability_day_blocks where dentist_id = '10000000-0000-0000-0000-000000000001' and local_date = (now() at time zone 'Asia/Kolkata')::date + 20) then
    raise exception 'OPERATIONAL TEST FAILED: block marker was not saved';
  end if;
end;
$$;

-- The marker also protects a day with no slots, including slotless admin
-- assignments and slots created after the block call has returned.
insert into public.appointments (id, reference_code, patient_id, source, status, reason_category)
values ('60000000-0000-0000-0000-000000000020', 'SP-BLOCK-ASSIGN', '10000000-0000-0000-0000-000000000101', 'patient_request', 'requested', 'checkup');
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000001"}';
do $$
begin
  if public.block_availability_day('10000000-0000-0000-0000-000000000001', (now() at time zone 'Asia/Kolkata')::date + 21) <> 0 then
    raise exception 'OPERATIONAL TEST FAILED: empty day block changed slots';
  end if;
end;
$$;
set local role postgres;
do $$
declare
  v_start timestamptz := (((now() at time zone 'Asia/Kolkata')::date + 21) + time '10:00') at time zone 'Asia/Kolkata';
begin
  begin
    insert into public.availability_slots (dentist_id, starts_at, ends_at, created_by)
    values ('10000000-0000-0000-0000-000000000001', v_start, v_start + interval '30 minutes', '10000000-0000-0000-0000-000000000001');
    raise exception 'OPERATIONAL TEST FAILED: later slot was accepted';
  exception when others then
    if SQLERRM not like '%DAY_BLOCKED%' then raise; end if;
  end;
  begin
    update public.appointments set dentist_id = '10000000-0000-0000-0000-000000000001',
      scheduled_for = v_start, status = 'assigned'
    where id = '60000000-0000-0000-0000-000000000020';
    raise exception 'OPERATIONAL TEST FAILED: slotless assignment was accepted';
  exception when others then
    if SQLERRM not like '%DAY_BLOCKED%' then raise; end if;
  end;
end;
$$;
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000900"}';
do $$
declare
  v_start timestamptz := (((now() at time zone 'Asia/Kolkata')::date + 21) + time '11:00') at time zone 'Asia/Kolkata';
begin
  begin
    perform public.admin_appointment_action('60000000-0000-0000-0000-000000000020', 'assigned',
      'Test assignment', '10000000-0000-0000-0000-000000000001', null, v_start);
    raise exception 'OPERATIONAL TEST FAILED: admin assignment was accepted';
  exception when others then
    if SQLERRM not like '%DAY_BLOCKED%' then raise; end if;
  end;
end;
$$;
set local role postgres;
do $$
begin
  if (select status from public.appointments where id = '60000000-0000-0000-0000-000000000020') <> 'requested' then
    raise exception 'OPERATIONAL TEST FAILED: rejected assignment changed appointment';
  end if;
end;
$$;

-- A scheduled appointment with no slot still prevents creation of a marker.
insert into public.appointments (id, reference_code, patient_id, dentist_id, source, status, reason_category, scheduled_for)
values ('60000000-0000-0000-0000-000000000021', 'SP-BLOCK-OCCUPIED',
  '10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000001',
  'admin_created', 'assigned', 'checkup',
  (((now() at time zone 'Asia/Kolkata')::date + 22) + time '10:00') at time zone 'Asia/Kolkata');
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000001"}';
do $$
begin
  begin
    perform public.block_availability_day('10000000-0000-0000-0000-000000000001', (now() at time zone 'Asia/Kolkata')::date + 22);
    raise exception 'OPERATIONAL TEST FAILED: scheduled slotless appointment did not reject block';
  exception when others then
    if SQLERRM not like '%DAY_HAS_SCHEDULED_APPOINTMENT%' then raise; end if;
  end;
end;
$$;
set local role postgres;
do $$
begin
  if exists (select 1 from public.availability_day_blocks where dentist_id = '10000000-0000-0000-0000-000000000001' and local_date = (now() at time zone 'Asia/Kolkata')::date + 22) then
    raise exception 'OPERATIONAL TEST FAILED: rejected block left marker';
  end if;
end;
$$;

-- A failure during the second part of profile update rolls back the profile
-- row too, rather than reporting an error after a partial save.
create function pg_temp.fail_patient_profile_update() returns trigger language plpgsql as $fn$
begin raise exception 'TEST_INJECTED_PROFILE_FAILURE'; end;
$fn$;
create trigger fail_patient_profile_update before update on public.patients
  for each row execute function pg_temp.fail_patient_profile_update();

set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-0000-0000-000000000101"}';
do $$
declare
  v_failed boolean := false;
begin
  begin
    perform public.update_patient_profile('Changed name', '+919812345601', 'Changed locality', '18_39');
  exception when others then
    if SQLERRM like '%TEST_INJECTED_PROFILE_FAILURE%' then v_failed := true; else raise; end if;
  end;
  if not v_failed then raise exception 'OPERATIONAL TEST FAILED: injected patient write failure did not propagate'; end if;
end;
$$;
set local role postgres;
do $$
begin
  if (select full_name from public.profiles where id = '10000000-0000-0000-0000-000000000101') = 'Changed name' then
    raise exception 'OPERATIONAL TEST FAILED: profile update partially committed';
  end if;
end;
$$;
drop trigger fail_patient_profile_update on public.patients;

-- Reminder claims are idempotent after send, retry explicit failures, and do
-- not let an old claim overwrite a newer worker's result.
do $$
declare
  v_appointment uuid := '60000000-0000-0000-0000-000000000101';
  v_patient uuid := '10000000-0000-0000-0000-000000000101';
begin
  insert into public.appointments (id, reference_code, patient_id, source, status, reason_category, scheduled_for)
  values (v_appointment, 'SP-REMINDER-TEST', v_patient, 'admin_created', 'confirmed', 'checkup', now() + interval '1 day');
  insert into public.appointments (id, reference_code, patient_id, source, status, reason_category, scheduled_for)
  values ('60000000-0000-0000-0000-000000000102', 'SP-REMINDER-RETRY', v_patient, 'admin_created', 'confirmed', 'checkup', now() + interval '1 day');
  insert into public.appointments (id, reference_code, patient_id, source, status, reason_category, scheduled_for)
  values ('60000000-0000-0000-0000-000000000103', 'SP-REMINDER-UNCERTAIN', v_patient, 'admin_created', 'confirmed', 'checkup', now() + interval '1 day');

end;
$$;
set local role service_role;
do $$
declare
  v_appointment uuid := '60000000-0000-0000-0000-000000000101';
  v_claim jsonb;
  v_token uuid;
  v_scheduled timestamptz;
  v_snapshot jsonb;
begin
  v_claim := public.claim_appointment_reminder(v_appointment, 'reminder_24h', now() - interval '1 hour', now() + interval '2 days');
  v_token := (v_claim->>'claim_token')::uuid;
  v_scheduled := (v_claim->>'scheduled_for')::timestamptz;
  if v_token is null then raise exception 'OPERATIONAL TEST FAILED: first reminder claim was not granted'; end if;
  v_snapshot := public.begin_appointment_reminder_send(v_appointment, 'reminder_24h', v_scheduled, v_token);
  if v_snapshot is null or v_snapshot->>'email' is null or v_snapshot->>'dentist' is null then
    raise exception 'OPERATIONAL TEST FAILED: reminder send snapshot was not returned';
  end if;
  perform public.complete_appointment_reminder(v_appointment, 'reminder_24h', v_scheduled, v_token, true);
  if public.claim_appointment_reminder(v_appointment, 'reminder_24h', now() - interval '1 hour', now() + interval '2 days') is not null then
    raise exception 'OPERATIONAL TEST FAILED: sent reminder was claimed again';
  end if;

end;
$$;
set local role postgres;

update public.appointments set scheduled_for = scheduled_for + interval '1 hour'
where id = '60000000-0000-0000-0000-000000000101';
do $$
begin
  if (select count(*) from public.appointment_reminders where appointment_id = '60000000-0000-0000-0000-000000000101' and status = 'sent') <> 1 then
    raise exception 'OPERATIONAL TEST FAILED: reschedule overwrote the sent reminder occurrence';
  end if;
end;
$$;
set local role service_role;
do $$
declare
  v_claim jsonb;
  v_token uuid;
  v_scheduled timestamptz;
  v_retry jsonb;
  v_retry_token uuid;
  v_retry_scheduled timestamptz;
  v_snapshot jsonb;
begin
  v_claim := public.claim_appointment_reminder('60000000-0000-0000-0000-000000000101', 'reminder_24h', now() - interval '1 hour', now() + interval '2 days');
  if v_claim is null then raise exception 'OPERATIONAL TEST FAILED: rescheduled appointment did not get a new reminder claim'; end if;
  if public.begin_appointment_reminder_send('60000000-0000-0000-0000-000000000101', 'reminder_24h',
      (v_claim->>'scheduled_for')::timestamptz, (v_claim->>'claim_token')::uuid) is null then
    raise exception 'OPERATIONAL TEST FAILED: rescheduled reminder could not begin sending';
  end if;

  v_claim := public.claim_appointment_reminder('60000000-0000-0000-0000-000000000102', 'reminder_24h', now() - interval '1 hour', now() + interval '2 days');
  v_token := (v_claim->>'claim_token')::uuid;
  v_scheduled := (v_claim->>'scheduled_for')::timestamptz;
  v_snapshot := public.begin_appointment_reminder_send('60000000-0000-0000-0000-000000000102', 'reminder_24h', v_scheduled, v_token);
  if v_snapshot is null then raise exception 'OPERATIONAL TEST FAILED: failed reminder could not begin sending'; end if;
  perform public.complete_appointment_reminder('60000000-0000-0000-0000-000000000102', 'reminder_24h', v_scheduled, v_token, false, 'smtp-not-configured', true);
  v_retry := public.claim_appointment_reminder('60000000-0000-0000-0000-000000000102', 'reminder_24h', now() - interval '1 hour', now() + interval '2 days');
  v_retry_token := (v_retry->>'claim_token')::uuid;
  v_retry_scheduled := (v_retry->>'scheduled_for')::timestamptz;
  if v_retry_token is null or v_retry_token = v_token then raise exception 'OPERATIONAL TEST FAILED: failed reminder was not retried with a fresh claim'; end if;
  if public.begin_appointment_reminder_send('60000000-0000-0000-0000-000000000102', 'reminder_24h', v_retry_scheduled, v_token) is not null then
    raise exception 'OPERATIONAL TEST FAILED: stale reminder claim began sending';
  end if;
  if public.begin_appointment_reminder_send('60000000-0000-0000-0000-000000000102', 'reminder_24h', v_retry_scheduled, v_retry_token) is null then
    raise exception 'OPERATIONAL TEST FAILED: retry could not begin sending';
  end if;
  perform public.complete_appointment_reminder('60000000-0000-0000-0000-000000000102', 'reminder_24h', v_retry_scheduled, v_token, true);

  v_claim := public.claim_appointment_reminder('60000000-0000-0000-0000-000000000103', 'reminder_24h', now() - interval '1 hour', now() + interval '2 days');
  v_token := (v_claim->>'claim_token')::uuid;
  v_scheduled := (v_claim->>'scheduled_for')::timestamptz;
  if public.begin_appointment_reminder_send('60000000-0000-0000-0000-000000000103', 'reminder_24h', v_scheduled, v_token) is null then
    raise exception 'OPERATIONAL TEST FAILED: uncertain reminder could not begin sending';
  end if;
  perform public.complete_appointment_reminder('60000000-0000-0000-0000-000000000103', 'reminder_24h', v_scheduled, v_token, false, 'transport-failed');
  if public.claim_appointment_reminder('60000000-0000-0000-0000-000000000103', 'reminder_24h', now() - interval '1 hour', now() + interval '2 days') is not null then
    raise exception 'OPERATIONAL TEST FAILED: uncertain transport failure was automatically retried';
  end if;
end;
$$;
set local role postgres;
do $$
begin
  if (select count(*) from public.appointment_reminders where appointment_id = '60000000-0000-0000-0000-000000000101') <> 2 then
    raise exception 'OPERATIONAL TEST FAILED: rescheduled appointment did not persist a distinct reminder occurrence';
  end if;
  if (select status from public.appointment_reminders where appointment_id = '60000000-0000-0000-0000-000000000102') <> 'sending' then
    raise exception 'OPERATIONAL TEST FAILED: failed reminder retry state was not persisted';
  end if;
  if (select status from public.appointment_reminders where appointment_id = '60000000-0000-0000-0000-000000000103') <> 'uncertain' then
    raise exception 'OPERATIONAL TEST FAILED: ambiguous transport failure was not left uncertain';
  end if;
end;
$$;

rollback;
