-- Booking mutations are callable only by the trusted server boundary. The
-- server action validates the session and hold capability before using the
-- service role client.

revoke execute on function public.hold_slot(uuid) from public, anon, authenticated;
grant execute on function public.hold_slot(uuid) to service_role;
grant execute on function public.check_rate_limit(text, int, int) to service_role;
revoke execute on function public.check_rate_limit(text, int, int) from public, anon, authenticated;

-- Contact intake is validated and rate-limited by the server action. Remove
-- the legacy browser-callable paths so requests cannot bypass that boundary.
revoke execute on function public.submit_contact(submission_type,text,text,text,text,text,text,text,partnership_type,text,text,text) from public, anon, authenticated;
grant execute on function public.submit_contact(submission_type,text,text,text,text,text,text,text,partnership_type,text,text,text) to service_role;
drop policy if exists "anyone submits" on public.contact_submissions;

-- A hold is valid only for a future, publicly bookable slot owned by an active
-- dentist. Expired holds may be reclaimed; blocked and booked slots may not.
create or replace function public.hold_slot(p_slot_id uuid)
returns public.availability_slots
language plpgsql security definer set search_path = public as $$
declare
  s public.availability_slots;
begin
  select slot.* into s
    from public.availability_slots slot
    join public.dentists dentist on dentist.profile_id = slot.dentist_id
   where slot.id = p_slot_id
     and slot.starts_at > now()
     and dentist.status = 'active'
     and dentist.is_public
   for update of slot;

  if s.id is null then raise exception 'SLOT_NOT_FOUND'; end if;
  if s.status = 'held' and s.held_until > now() then raise exception 'SLOT_HELD'; end if;
  if s.status in ('booked', 'blocked') or s.booked_count >= s.capacity then
    raise exception 'SLOT_TAKEN';
  end if;

  update public.availability_slots
     set status = 'held', held_until = now() + interval '10 minutes'
   where id = p_slot_id
   returning * into s;
  return s;
end; $$;

-- Called only after the server verifies the browser's signed capability for
-- the old slot, allowing a person to change their selected time cleanly.
create or replace function public.release_slot_hold(p_slot_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare released boolean;
begin
  update public.availability_slots
     set status = 'open', held_until = null
   where id = p_slot_id and status = 'held'
   returning true into released;
  return coalesce(released, false);
end; $$;
revoke execute on function public.release_slot_hold(uuid) from public, anon, authenticated;
grant execute on function public.release_slot_hold(uuid) to service_role;

drop function if exists public._booking_ensure_patient(text, text, text, age_band, text, text);
revoke execute on function public.create_booking_request(text, text, text, age_band, reason_category, text, text, jsonb, boolean) from public, anon, authenticated;
revoke execute on function public.confirm_booking(uuid, text, text, text, age_band, text, text, reason_category, text, boolean, uuid) from public, anon, authenticated;

create or replace function public._booking_ensure_patient(
  p_email text, p_full_name text, p_phone text, p_age_band age_band,
  p_locality text, p_pincode text, p_actor_id uuid default null
) returns uuid language plpgsql security definer set search_path = public, auth as $$
declare
  v_uid uuid;
  v_email text := lower(nullif(trim(p_email), ''));
  v_existing_email text;
  v_role user_role;
begin
  if v_email is null then
    v_email := 'pat-' || regexp_replace(p_phone, '\D', '', 'g') || '@patients.smileplease.invalid';
  end if;
  select id, email into v_uid, v_existing_email from auth.users where lower(email) = v_email order by created_at desc limit 1;

  if v_uid is not null then
    -- A guest supplied address is an account identifier, never an account
    -- lookup/update primitive. Only its authenticated patient may reuse it.
    if p_actor_id is null or v_uid <> p_actor_id then raise exception 'EMAIL_IN_USE'; end if;
    select role into v_role from public.profiles where id = p_actor_id;
    if v_role is distinct from 'patient' then raise exception 'FORBIDDEN'; end if;
    if lower(coalesce(v_existing_email, '')) <> v_email then raise exception 'EMAIL_IN_USE'; end if;
  else
    if p_actor_id is not null then raise exception 'PROFILE_NOT_FOUND'; end if;
    insert into auth.users
      (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       confirmation_token, recovery_token, email_change, email_change_token_new,
       raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', v_email, '', now(), '', '', '', '',
      '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_full_name), now(), now())
    returning id into v_uid;
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_uid, v_email, jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', false, 'phone_verified', false), 'email', now(), now(), now());
  end if;

  -- Existing rows are updated only after the ownership check above.
  update public.profiles set full_name = p_full_name, phone = p_phone, email = v_email where id = v_uid;
  insert into public.patients (profile_id, age_band, locality, pincode) values (v_uid, p_age_band, p_locality, p_pincode)
    on conflict (profile_id) do update set age_band = excluded.age_band, locality = excluded.locality, pincode = excluded.pincode;
  return v_uid;
end; $$;
revoke execute on function public._booking_ensure_patient(text,text,text,age_band,text,text,uuid) from public, anon, authenticated;
grant execute on function public._booking_ensure_patient(text,text,text,age_band,text,text,uuid) to service_role;

drop function if exists public.create_booking_request(text, text, text, age_band, reason_category, text, text, jsonb, boolean);
create function public.create_booking_request(
  p_email text, p_full_name text, p_phone text, p_age_band age_band,
  p_reason_category reason_category, p_patient_note text default null,
  p_preferred_locality text default null, p_preferred_window jsonb default null,
  p_consent_updates boolean default false, p_actor_id uuid default null
) returns public.appointments language plpgsql security definer set search_path = public, auth as $$
declare v_patient uuid; v_app public.appointments; v_actor_role user_role;
begin
  v_patient := public._booking_ensure_patient(p_email,p_full_name,p_phone,p_age_band,p_preferred_locality,null,p_actor_id);
  insert into public.appointments (patient_id,source,status,reason_category,patient_note,preferred_locality,preferred_window)
    values (v_patient,'patient_request','requested',p_reason_category,p_patient_note,p_preferred_locality,p_preferred_window) returning * into v_app;
  insert into public.consents (subject_type,subject_id,purpose,notice_version,method,ip_hash) values ('profile',v_patient,'booking','v1 — 2026-08-04','web_form',null) on conflict do nothing;
  if p_consent_updates then insert into public.consents (subject_type,subject_id,purpose,notice_version,method,ip_hash) values ('profile',v_patient,'awareness_updates','v1 — 2026-08-04','web_form',null) on conflict do nothing; end if;
  select role into v_actor_role from public.profiles where id = p_actor_id;
  insert into public.appointment_events (appointment_id,from_status,to_status,actor_id,actor_role,reason) values (v_app.id,null,'requested',p_actor_id,coalesce(v_actor_role,'patient'),'Care request submitted');
  return v_app;
end; $$;
revoke execute on function public.create_booking_request(text,text,text,age_band,reason_category,text,text,jsonb,boolean,uuid) from public, anon, authenticated;
grant execute on function public.create_booking_request(text,text,text,age_band,reason_category,text,text,jsonb,boolean,uuid) to service_role;

drop function if exists public.confirm_booking(uuid,text,text,text,age_band,text,text,reason_category,text,boolean,uuid);
create function public.confirm_booking(
  p_slot_id uuid,p_email text,p_full_name text,p_phone text,p_age_band age_band,
  p_locality text,p_pincode text,p_reason_category reason_category,p_patient_note text default null,
  p_consent_updates boolean default false,p_reschedule_appointment_id uuid default null,p_actor_id uuid default null
) returns public.appointments language plpgsql security definer set search_path = public, auth as $$
declare s public.availability_slots; v_patient uuid; v_app public.appointments; v_old public.appointments; v_role user_role;
begin
  if p_reschedule_appointment_id is not null then
    if p_actor_id is null then raise exception 'UNAUTHENTICATED'; end if;
    select * into v_old from public.appointments where id=p_reschedule_appointment_id for update;
    if v_old.id is null then raise exception 'APPOINTMENT_NOT_FOUND'; end if;
    select role into v_role from public.profiles where id=p_actor_id;
    if v_role is distinct from 'patient' or v_old.patient_id <> p_actor_id then raise exception 'FORBIDDEN'; end if;
    if v_old.status='confirmed' and v_old.scheduled_for is not null and v_old.scheduled_for < now()+interval '24 hours' then raise exception 'RESCHEDULE_TOO_LATE'; end if;
    if v_old.status not in ('confirmed','assigned','requested') then raise exception 'ILLEGAL_TRANSITION'; end if;
  end if;
  v_patient := public._booking_ensure_patient(p_email,p_full_name,p_phone,p_age_band,p_locality,p_pincode,p_actor_id);
  if v_old.id is not null and v_patient <> v_old.patient_id then raise exception 'FORBIDDEN'; end if;
  select slot.* into s
    from public.availability_slots slot
    join public.dentists dentist on dentist.profile_id = slot.dentist_id
   where slot.id = p_slot_id
     and slot.starts_at > now()
     and dentist.status = 'active'
     and dentist.is_public
   for update of slot;
  if s.id is null then raise exception 'SLOT_NOT_FOUND'; end if;
  if s.status <> 'held' or s.held_until is null or s.held_until <= now()
     or s.booked_count >= s.capacity then raise exception 'SLOT_TAKEN'; end if;
  update public.availability_slots set status='booked',booked_count=booked_count+1,held_until=null where id=s.id;
  if v_old.id is not null then
    if v_old.slot_id is not null and v_old.slot_id <> s.id then update public.availability_slots set booked_count=greatest(booked_count-1,0),status=case when booked_count-1 <= 0 then 'open' else status end,held_until=null where id=v_old.slot_id; end if;
    update public.appointments set slot_id=s.id,dentist_id=s.dentist_id,scheduled_for=s.starts_at,reason_category=p_reason_category,patient_note=p_patient_note where id=v_old.id returning * into v_app;
    insert into public.appointment_events (appointment_id,from_status,to_status,actor_id,actor_role,reason) values (v_app.id,v_old.status,v_old.status,p_actor_id,'patient','Rescheduled');
  else
    insert into public.appointments (patient_id,dentist_id,slot_id,source,status,reason_category,patient_note,scheduled_for) values (v_patient,s.dentist_id,s.id,'self_booked','confirmed',p_reason_category,p_patient_note,s.starts_at) returning * into v_app;
    insert into public.appointment_events (appointment_id,from_status,to_status,actor_id,actor_role,reason) values (v_app.id,null,'confirmed',p_actor_id,'patient','Slot booked');
  end if;
  insert into public.consents (subject_type,subject_id,purpose,notice_version,method,ip_hash) values ('profile',v_patient,'booking','v1 — 2026-08-04','web_form',null) on conflict do nothing;
  if p_consent_updates then insert into public.consents (subject_type,subject_id,purpose,notice_version,method,ip_hash) values ('profile',v_patient,'awareness_updates','v1 — 2026-08-04','web_form',null) on conflict do nothing; end if;
  return v_app;
end; $$;
revoke execute on function public.confirm_booking(uuid,text,text,text,age_band,text,text,reason_category,text,boolean,uuid,uuid) from public, anon, authenticated;
grant execute on function public.confirm_booking(uuid,text,text,text,age_band,text,text,reason_category,text,boolean,uuid,uuid) to service_role;

-- Admin cancellation and rescheduling must update appointment state and slot
-- capacity together. This replaces the Phase 12 implementation, which left a
-- cancelled appointment's slot booked.
create or replace function public.admin_appointment_action(
  p_appointment_id uuid,
  p_to appointment_status,
  p_reason text,
  p_new_dentist_id uuid default null,
  p_new_slot_id uuid default null,
  p_new_scheduled_for timestamptz default null
) returns public.appointments
language plpgsql security invoker as $$
declare
  v_app public.appointments;
  v_from appointment_status;
  v_actor uuid := auth.uid();
  v_role user_role;
  v_slot public.availability_slots;
  v_old_slot uuid;
  v_is_cancel boolean;
begin
  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'REASON_REQUIRED' using errcode = '22023';
  end if;
  if v_actor is null then raise exception 'UNAUTHENTICATED'; end if;
  select role into v_role from public.profiles where id = v_actor;
  if v_role is distinct from 'admin' then raise exception 'FORBIDDEN'; end if;

  select * into v_app from public.appointments where id = p_appointment_id for update;
  if v_app.id is null then raise exception 'APPOINTMENT_NOT_FOUND'; end if;
  v_from := v_app.status;
  v_old_slot := v_app.slot_id;
  v_is_cancel := p_to in ('cancelled_by_patient','cancelled_by_dentist','cancelled_by_admin');

  if not public._booking_transition_allowed(v_from, p_to, 'admin')
     and not (v_from = 'assigned' and p_to = 'assigned' and p_new_dentist_id is not null) then
    raise exception 'ILLEGAL_TRANSITION' using detail = format('%s -> %s', v_from, p_to);
  end if;
  if v_is_cancel and (p_new_dentist_id is not null or p_new_slot_id is not null or p_new_scheduled_for is not null) then
    raise exception 'INVALID_CANCELLATION';
  end if;
  if p_new_slot_id is not null and p_new_scheduled_for is null then
    raise exception 'SCHEDULE_REQUIRED';
  end if;
  if p_new_dentist_id is not null and not exists (
    select 1 from public.dentists where profile_id = p_new_dentist_id and status = 'active'
  ) then
    raise exception 'DENTIST_NOT_AVAILABLE';
  end if;

  if v_is_cancel and v_old_slot is not null then
    update public.availability_slots
       set booked_count = greatest(booked_count - 1, 0),
           status = case when greatest(booked_count - 1, 0) = 0 then 'open' else status end,
           held_until = null
     where id = v_old_slot;
  elsif p_new_scheduled_for is not null and p_new_slot_id is not null
        and v_old_slot is distinct from p_new_slot_id then
    if v_old_slot is not null then
      update public.availability_slots
         set booked_count = greatest(booked_count - 1, 0),
             status = case when greatest(booked_count - 1, 0) = 0 then 'open' else status end,
             held_until = null
       where id = v_old_slot;
    end if;
    select slot.* into v_slot
      from public.availability_slots slot
      join public.dentists dentist on dentist.profile_id = slot.dentist_id
     where slot.id = p_new_slot_id
       and slot.starts_at > now()
       and dentist.status = 'active'
     for update of slot;
    if v_slot.id is null then raise exception 'SLOT_NOT_FOUND'; end if;
    if v_slot.dentist_id is distinct from coalesce(p_new_dentist_id, v_app.dentist_id)
       or v_slot.status in ('booked', 'blocked')
       or v_slot.booked_count >= v_slot.capacity then
      raise exception 'SLOT_TAKEN';
    end if;
    update public.availability_slots
       set status = 'booked', booked_count = booked_count + 1, held_until = null
     where id = p_new_slot_id;
  end if;

  update public.appointments
     set status = p_to,
         dentist_id = coalesce(p_new_dentist_id, dentist_id),
         slot_id = coalesce(p_new_slot_id, slot_id),
         scheduled_for = coalesce(p_new_scheduled_for, scheduled_for),
         cancelled_reason = case when v_is_cancel then p_reason else cancelled_reason end
   where id = p_appointment_id
   returning * into v_app;

  insert into public.appointment_events
    (appointment_id, from_status, to_status, actor_id, actor_role, reason)
  values (p_appointment_id, v_from, p_to, v_actor, 'admin', p_reason);
  return v_app;
end; $$;
revoke execute on function public.admin_appointment_action(uuid,appointment_status,text,uuid,uuid,timestamptz) from public, anon;
grant execute on function public.admin_appointment_action(uuid,appointment_status,text,uuid,uuid,timestamptz) to authenticated;

-- Cancellation must return capacity in the same transaction as the state change.
create or replace function public.transition_appointment(p_appointment_id uuid,p_to appointment_status,p_reason text default null)
returns public.appointments language plpgsql security definer set search_path=public as $$
declare a public.appointments; old appointment_status; actor uuid:=auth.uid(); role user_role;
begin
  if actor is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into a from public.appointments where id=p_appointment_id for update; if a.id is null then raise exception 'APPOINTMENT_NOT_FOUND'; end if;
  select p.role into role from public.profiles p where p.id=actor;
  if role is null or (role='patient' and a.patient_id<>actor) or (role='dentist' and a.dentist_id<>actor) then raise exception 'FORBIDDEN'; end if;
  old:=a.status; if not public._booking_transition_allowed(old,p_to,role) then raise exception 'ILLEGAL_TRANSITION'; end if;
  if role='patient' and old='confirmed' and a.scheduled_for is not null and a.scheduled_for < now()+interval '24 hours' then raise exception 'RESCHEDULE_TOO_LATE'; end if;
  update public.appointments set status=p_to,cancelled_reason=case when p_to in ('cancelled_by_patient','cancelled_by_dentist','cancelled_by_admin') then coalesce(p_reason,cancelled_reason) else cancelled_reason end where id=a.id returning * into a;
  if p_to in ('cancelled_by_patient','cancelled_by_dentist','cancelled_by_admin') and a.slot_id is not null then update public.availability_slots set booked_count=greatest(booked_count-1,0),status=case when booked_count-1 <= 0 then 'open' else status end,held_until=null where id=a.slot_id; end if;
  insert into public.appointment_events(appointment_id,from_status,to_status,actor_id,actor_role,reason) values(a.id,old,p_to,actor,role,p_reason); return a;
end; $$;
revoke execute on function public.transition_appointment(uuid,appointment_status,text) from public; grant execute on function public.transition_appointment(uuid,appointment_status,text) to authenticated;

-- Clinical notes are staff-only, and consent withdrawal is one atomic action.
drop policy if exists "staff reads clinical notes" on public.clinical_notes;
create policy "staff reads clinical notes" on public.clinical_notes for select to authenticated using (public.is_admin() or exists(select 1 from public.appointments a where a.id=appointment_id and a.dentist_id=auth.uid() and public.is_dentist()));
drop function if exists public.withdraw_booking_consent();
create function public.withdraw_booking_consent(p_purpose consent_purpose)
returns void
language plpgsql security definer set search_path=public, auth as $$
declare
  v_actor uuid := auth.uid();
  v_role user_role;
  v_appointment public.appointments;
begin
  if v_actor is null then raise exception 'UNAUTHENTICATED'; end if;

  select role into v_role from public.profiles where id = v_actor;
  if v_role is distinct from 'patient' then raise exception 'FORBIDDEN'; end if;
  if p_purpose is null or p_purpose not in ('booking', 'awareness_updates') then
    raise exception 'INVALID_CONSENT_PURPOSE';
  end if;

  -- Booking withdrawal revokes only booking consent. It also cancels every
  -- active appointment owned by this patient, returns each slot's capacity,
  -- and writes its event in this same transaction. Do not route through
  -- transition_appointment: withdrawal must not be blocked by its 24-hour
  -- patient cancellation window.
  if p_purpose = 'booking' then
    for v_appointment in
      select * from public.appointments
       where patient_id = v_actor
         and status in ('requested', 'assigned', 'confirmed')
       order by id
       for update
    loop
      update public.appointments
         set status = 'cancelled_by_patient',
             cancelled_reason = 'Consent withdrawn'
       where id = v_appointment.id;

      if v_appointment.slot_id is not null then
        update public.availability_slots
           set booked_count = greatest(booked_count - 1, 0),
               status = case when booked_count - 1 <= 0 then 'open' else status end,
               held_until = null
         where id = v_appointment.slot_id;
      end if;

      insert into public.appointment_events
        (appointment_id, from_status, to_status, actor_id, actor_role, reason)
      values
        (v_appointment.id, v_appointment.status, 'cancelled_by_patient',
         v_actor, 'patient', 'Consent withdrawn');
    end loop;
  end if;

  update public.consents
     set withdrawn_at = coalesce(withdrawn_at, now())
   where subject_type = 'profile'
     and subject_id = v_actor
     and purpose = p_purpose;
end;
$$;
revoke execute on function public.withdraw_booking_consent(consent_purpose) from public;
grant execute on function public.withdraw_booking_consent(consent_purpose) to authenticated;
