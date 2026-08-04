-- Phase 5: the booking state machine in Postgres, atomic slot holds and
-- confirmations, anonymous booking, reference lookup, and the shared IP
-- rate-limit primitive (Phase 6 uses the same RPC).
--
-- Why SECURITY DEFINER where the phase sketch said INVOKER:
--   * hold_slot / confirm_booking / lookup / rate-limit RPCs: anonymous
--     patients drive all of these (Path A and B booking never require an
--     account), yet RLS grants anon nothing but SELECT on open slots. An
--     INVOKER function would fail on the first UPDATE. These functions run as
--     the owner (postgres), enforce their own strict guards, and bypass RLS —
--     the RLS story for the underlying tables is unchanged.
--   * transition_appointment stays SECURITY INVOKER exactly as specified:
--     RLS decides *who* may touch a row; the function adds *what* is legal.
-- The state machine is mirrored in lib/booking.ts, which route handlers call
-- for friendly errors BEFORE the RPC; the SQL copy is the backstop so a
-- client cannot RPC around it (RLS alone cannot express transition legality).

-- ── 1. Transition legality (SQL mirror of lib/booking.ts TRANSITIONS) ──────
create or replace function public._booking_transition_allowed(
  p_from appointment_status,
  p_to   appointment_status,
  p_actor user_role
) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return case p_from
    when 'requested' then case p_to
      when 'assigned'             then p_actor = 'admin'
      when 'cancelled_by_patient' then p_actor in ('patient','admin')
      when 'cancelled_by_admin'   then p_actor = 'admin'
      else false end
    when 'assigned' then case p_to
      when 'confirmed'            then p_actor in ('dentist','admin')
      when 'requested'            then p_actor = 'admin'
      when 'cancelled_by_patient' then p_actor in ('patient','admin')
      when 'cancelled_by_dentist' then p_actor in ('dentist','admin')
      when 'cancelled_by_admin'   then p_actor = 'admin'
      else false end
    when 'confirmed' then case p_to
      when 'confirmed'            then p_actor in ('patient','dentist','admin')
      when 'completed'            then p_actor in ('dentist','admin')
      when 'no_show'              then p_actor in ('dentist','admin')
      when 'cancelled_by_patient' then p_actor in ('patient','admin')
      when 'cancelled_by_dentist' then p_actor in ('dentist','admin')
      when 'cancelled_by_admin'   then p_actor = 'admin'
      else false end
    when 'no_show' then p_to = 'confirmed' and p_actor = 'admin'
    when 'cancelled_by_patient' then p_to = 'requested' and p_actor = 'admin'
    when 'cancelled_by_dentist' then p_to = 'requested' and p_actor = 'admin'
    when 'cancelled_by_admin'   then p_to = 'requested' and p_actor = 'admin'
    else false
  end;
end; $$;

-- ── 2. transition_appointment — INVOKER, one transaction, one event row ────
-- The only place any status change is written. RLS (caller's rights) decides
-- who may touch the row; the legality table decides what change is legal.
create or replace function public.transition_appointment(
  p_appointment_id uuid,
  p_to appointment_status,
  p_reason text default null
) returns public.appointments
language plpgsql security invoker as $$
declare
  v_app       public.appointments;
  v_from      appointment_status;
  v_actor     uuid := auth.uid();
  v_role      user_role;
begin
  if v_actor is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  select role into v_role from public.profiles where id = v_actor;
  if v_role is null then
    raise exception 'NO_PROFILE';
  end if;

  select * into v_app from public.appointments
    where id = p_appointment_id for update;
  if v_app is null then
    raise exception 'APPOINTMENT_NOT_FOUND';
  end if;
  v_from := v_app.status;

  if not public._booking_transition_allowed(v_from, p_to, v_role) then
    raise exception 'ILLEGAL_TRANSITION'
      using detail = format('%s -> %s', v_from, p_to);
  end if;

  -- Patients may only change (reschedule or cancel) a confirmed appointment
  -- 24 hours or more before it starts. Dentists and admins may always.
  if v_role = 'patient' and v_from = 'confirmed'
     and v_app.scheduled_for is not null
     and v_app.scheduled_for < now() + interval '24 hours' then
    raise exception 'RESCHEDULE_TOO_LATE';
  end if;

  update public.appointments
     set status = p_to,
         cancelled_reason = case
           when p_to in ('cancelled_by_patient','cancelled_by_dentist','cancelled_by_admin')
           then coalesce(p_reason, cancelled_reason)
           else cancelled_reason end
   where id = p_appointment_id
   returning * into v_app;

  insert into public.appointment_events
    (appointment_id, from_status, to_status, actor_id, actor_role, reason)
  values (p_appointment_id, v_from, p_to, v_actor, v_role, p_reason);

  return v_app;
end; $$;

revoke execute on function public.transition_appointment(uuid, appointment_status, text) from public;
grant  execute on function public.transition_appointment(uuid, appointment_status, text) to authenticated;

-- ── 3. hold_slot — the 10-minute hold, row-lock first, DEFINER so anon works ──
create or replace function public.hold_slot(p_slot_id uuid)
returns public.availability_slots
language plpgsql security definer set search_path = public as $$
declare
  s public.availability_slots;
begin
  select * into s from public.availability_slots
    where id = p_slot_id for update;          -- row lock: the whole point

  if s is null then raise exception 'SLOT_NOT_FOUND'; end if;

  if s.status = 'held' and s.held_until > now() then
    raise exception 'SLOT_HELD';
  end if;

  if s.status = 'booked' or s.booked_count >= s.capacity then
    raise exception 'SLOT_TAKEN';
  end if;

  update public.availability_slots
     set status = 'held', held_until = now() + interval '10 minutes'
   where id = p_slot_id
   returning * into s;
  return s;
end; $$;

revoke execute on function public.hold_slot(uuid) from public;
grant  execute on function public.hold_slot(uuid) to anon, authenticated;

-- ── 4. Patient identity: resolve or create (booking must never depend on ────
--    the mailer; the appointment saves even if no magic link is delivered).
--    Mirrors the hardened seed insert shape (token columns '' + identities).
create or replace function public._booking_ensure_patient(
  p_email text,
  p_full_name text,
  p_phone text,
  p_age_band age_band,
  p_locality text,
  p_pincode text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid;
  v_email text;
begin
  -- Bookings must never depend on having an email (Phase 5 §5.4). Without
  -- one, key the identity on the phone so the row can still be tracked and
  -- later claimed by signing in with a real address.
  v_email := lower(nullif(trim(p_email), ''));
  if v_email is null then
    v_email := 'pat-' || regexp_replace(p_phone, '\D', '', 'g') || '@patients.smileplease.invalid';
  end if;

  select id into v_uid from auth.users
    where email = v_email order by created_at desc limit 1;

  if v_uid is null then
    insert into auth.users
      (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       confirmation_token, recovery_token, email_change, email_change_token_new,
       raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values
      ('00000000-0000-0000-0000-000000000000', gen_random_uuid(),
       'authenticated', 'authenticated', v_email, '', now(), '', '', '', '',
       '{"provider":"email","providers":["email"]}',
       jsonb_build_object('full_name', p_full_name), now(), now())
    returning id into v_uid;

    insert into auth.identities
      (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values
      (gen_random_uuid(), v_uid, v_email,
       jsonb_build_object('sub', v_uid::text, 'email', v_email,
                          'email_verified', false, 'phone_verified', false),
       'email', now(), now(), now());
    -- handle_new_user trigger has already created the profile + patients row.
  end if;

  update public.profiles
     set full_name = p_full_name, phone = p_phone, email = v_email
   where id = v_uid;

  insert into public.patients (profile_id, age_band, locality, pincode)
  values (v_uid, p_age_band, p_locality, p_pincode)
  on conflict (profile_id) do update
    set age_band = excluded.age_band,
        locality  = excluded.locality,
        pincode   = excluded.pincode;

  return v_uid;
end; $$;

-- ── 5. Path A: patient request, admin assigns later ─────────────────────────
create or replace function public.create_booking_request(
  p_email text,
  p_full_name text,
  p_phone text,
  p_age_band age_band,
  p_reason_category reason_category,
  p_patient_note text default null,
  p_preferred_locality text default null,
  p_preferred_window jsonb default null,
  p_consent_updates boolean default false
) returns public.appointments
language plpgsql security definer set search_path = public as $$
declare
  v_patient uuid;
  v_app public.appointments;
  v_actor uuid := auth.uid();
  v_role user_role;
begin
  v_patient := public._booking_ensure_patient(
    p_email, p_full_name, p_phone, p_age_band, p_preferred_locality, null);

  insert into public.appointments
    (patient_id, source, status, reason_category, patient_note,
     preferred_locality, preferred_window)
  values
    (v_patient, 'patient_request', 'requested', p_reason_category, p_patient_note,
     p_preferred_locality, p_preferred_window)
  returning * into v_app;

  insert into public.consents (subject_type, subject_id, purpose, notice_version, method, ip_hash)
  values ('profile', v_patient, 'booking', 'v1 — 2026-08-04', 'web_form', null)
  on conflict do nothing;

  if p_consent_updates then
    insert into public.consents (subject_type, subject_id, purpose, notice_version, method, ip_hash)
    values ('profile', v_patient, 'awareness_updates', 'v1 — 2026-08-04', 'web_form', null)
    on conflict do nothing;
  end if;

  select role into v_role from public.profiles where id = v_actor;
  insert into public.appointment_events
    (appointment_id, from_status, to_status, actor_id, actor_role, reason)
  values (v_app.id, null, 'requested',
          v_actor, coalesce(v_role, 'patient'), 'Care request submitted');

  return v_app;
end; $$;

revoke execute on function public.create_booking_request(text, text, text, age_band, reason_category, text, text, jsonb, boolean) from public;
grant  execute on function public.create_booking_request(text, text, text, age_band, reason_category, text, text, jsonb, boolean) to anon, authenticated;

-- ── 6. Path B: confirm a held slot → booked, one transaction ────────────────
create or replace function public.confirm_booking(
  p_slot_id uuid,
  p_email text,
  p_full_name text,
  p_phone text,
  p_age_band age_band,
  p_locality text,
  p_pincode text,
  p_reason_category reason_category,
  p_patient_note text default null,
  p_consent_updates boolean default false,
  p_reschedule_appointment_id uuid default null
) returns public.appointments
language plpgsql security definer set search_path = public as $$
declare
  s         public.availability_slots;
  v_patient uuid;
  v_app     public.appointments;
  v_old     public.appointments;
  v_actor   uuid := auth.uid();
  v_role    user_role;
  v_now     timestamptz := now();
begin
  if p_reschedule_appointment_id is not null then
    select * into v_old from public.appointments
      where id = p_reschedule_appointment_id for update;
    -- Row IS NULL / IS NOT NULL require ALL fields null/non-null; test the key.
    if v_old.id is null then raise exception 'APPOINTMENT_NOT_FOUND'; end if;
    -- The 24-hour rule applies to rescheduling a confirmed appointment.
    if v_old.status = 'confirmed' and v_old.scheduled_for is not null
       and v_old.scheduled_for < v_now + interval '24 hours' then
      raise exception 'RESCHEDULE_TOO_LATE';
    end if;
    if v_old.status not in ('confirmed','assigned','requested') then
      raise exception 'ILLEGAL_TRANSITION' using detail = 'reschedule from ' || v_old.status;
    end if;
  end if;

  v_patient := public._booking_ensure_patient(
    p_email, p_full_name, p_phone, p_age_band, p_locality, p_pincode);

  -- The row lock + capacity check is the race close: whoever commits first
  -- books the slot; the second sees booked_count >= capacity.
  select * into s from public.availability_slots
    where id = p_slot_id for update;
  if s is null then raise exception 'SLOT_NOT_FOUND'; end if;
  if s.status = 'booked' or s.booked_count >= s.capacity then
    raise exception 'SLOT_TAKEN';
  end if;
  if s.status = 'blocked' then
    raise exception 'SLOT_TAKEN';
  end if;

  update public.availability_slots
     set status = 'booked', booked_count = booked_count + 1, held_until = null
   where id = p_slot_id;

  insert into public.appointments
    (patient_id, dentist_id, slot_id, source, status, reason_category,
     patient_note, scheduled_for)
  values
    (v_patient, s.dentist_id, s.id, 'self_booked', 'confirmed', p_reason_category,
     p_patient_note, s.starts_at)
  returning * into v_app;

  insert into public.consents (subject_type, subject_id, purpose, notice_version, method, ip_hash)
  values ('profile', v_patient, 'booking', 'v1 — 2026-08-04', 'web_form', null)
  on conflict do nothing;

  if p_consent_updates then
    insert into public.consents (subject_type, subject_id, purpose, notice_version, method, ip_hash)
    values ('profile', v_patient, 'awareness_updates', 'v1 — 2026-08-04', 'web_form', null)
    on conflict do nothing;
  end if;

  select role into v_role from public.profiles where id = v_actor;
  insert into public.appointment_events
    (appointment_id, from_status, to_status, actor_id, actor_role, reason)
  values (v_app.id, null, 'confirmed',
          v_actor, coalesce(v_role, 'patient'), 'Slot booked');

  -- Reschedule: move the old appointment onto the new slot and free the old one.
  if v_old.id is not null then
    if v_old.slot_id is distinct from s.id then
      if v_old.slot_id is not null then
        update public.availability_slots
           set booked_count = greatest(booked_count - 1, 0),
               status = case when booked_count - 1 <= 0 then 'open' else status end
         where id = v_old.slot_id;
      end if;
    end if;
    update public.appointments
       set slot_id = s.id, scheduled_for = s.starts_at
     where id = v_old.id;
    insert into public.appointment_events
      (appointment_id, from_status, to_status, actor_id, actor_role, reason)
    values (v_old.id, 'confirmed', 'confirmed',
            v_actor, coalesce(v_role, 'patient'),
            'Rescheduled to ' || to_char(s.starts_at at time zone 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI'));
  end if;

  return v_app;
end; $$;

revoke execute on function public.confirm_booking(uuid, text, text, text, age_band, text, text, reason_category, text, boolean, uuid) from public;
grant  execute on function public.confirm_booking(uuid, text, text, text, age_band, text, text, reason_category, text, boolean, uuid) to anon, authenticated;

-- ── 7. Reference lookup: code + phone, safe fields only ─────────────────────
-- One generic "not found" for wrong code OR wrong phone. Never clinical_note.
create or replace function public.lookup_appointment(p_ref text, p_phone text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_app_id      uuid;
  v_status      appointment_status;
  v_scheduled   timestamptz;
  v_cancelled   text;
  v_dentist     text;
  v_locality    text;
  v_events      jsonb;
begin
  select a.id, a.status, a.scheduled_for, a.cancelled_reason,
         coalesce(d.display_name, d.locality, 'A Smile Please dentist'),
         d.locality
    into v_app_id, v_status, v_scheduled, v_cancelled, v_dentist, v_locality
    from public.appointments a
    left join public.dentists d on d.profile_id = a.dentist_id
    left join public.profiles p on p.id = a.patient_id
   where a.reference_code = upper(trim(p_ref))
     and p.phone = p_phone;

  if v_app_id is null then
    return jsonb_build_object('found', false);
  end if;

  select jsonb_agg(
           jsonb_build_object('status', e.to_status, 'at', e.created_at,
                              'by', e.actor_role, 'reason', e.reason)
           order by e.created_at)
    into v_events
    from public.appointment_events e
   where e.appointment_id = v_app_id;

  return jsonb_build_object(
    'found', true,
    'status', v_status,
    'scheduled_for', v_scheduled,
    'dentist', v_dentist,
    'locality', v_locality,
    'cancelled_reason', v_cancelled,
    'events', coalesce(v_events, '[]'::jsonb)
  );
end; $$;

revoke execute on function public.lookup_appointment(text, text) from public;
grant  execute on function public.lookup_appointment(text, text) to anon, authenticated;

-- ── 7b. Slot details for the confirm page ───────────────────────────────────
-- Anonymous visitors cannot SELECT a slot once it turns 'held' (the anon
-- policy only exposes open slots), yet the /care/book page needs to show what
-- was picked. Returns public fields only — same information public_slots
-- exposes — plus the dentist's public directory name/locality.
create or replace function public.get_slot_details(p_slot_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s public.availability_slots;
  d record;
begin
  select * into s from public.availability_slots where id = p_slot_id;
  if s is null then raise exception 'SLOT_NOT_FOUND'; end if;
  select display_name, locality, specialties into d
    from public.dentists where profile_id = s.dentist_id;
  return jsonb_build_object(
    'slot_id', s.id, 'starts_at', s.starts_at, 'ends_at', s.ends_at,
    'location_type', s.location_type, 'camp_name', s.camp_name,
    'dentist_name', coalesce(d.display_name, 'A Smile Please dentist'),
    'dentist_locality', d.locality,
    'specialties', coalesce(d.specialties, array[]::text[])
  );
end; $$;

revoke execute on function public.get_slot_details(uuid) from public;
grant  execute on function public.get_slot_details(uuid) to anon, authenticated;

-- ── 8. IP rate limiter (Master §9.6; phases 5 and 6 forms) ──────────────────
-- The app stores sha256(ip + salt), never the raw IP. Window is p_window
-- seconds; count is stored per fixed bucket.
create or replace function public.check_rate_limit(
  p_key text,
  p_limit int,
  p_window_seconds int
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_bucket bigint;
  v_key    text;
  v_count  int;
begin
  v_bucket := floor(extract(epoch from now()) / p_window_seconds)::bigint;
  v_key    := p_key || ':' || v_bucket;

  insert into public.rate_limits (key, window_at, count)
  values (v_key, to_timestamp(v_bucket * p_window_seconds), 1)
  on conflict (key, window_at) do update
    set count = public.rate_limits.count + 1
  returning count into v_count;

  delete from public.rate_limits
   where window_at < now() - make_interval(secs => p_window_seconds * 2);

  return v_count <= p_limit;
end; $$;

revoke execute on function public.check_rate_limit(text, int, int) from public;
grant  execute on function public.check_rate_limit(text, int, int) to anon, authenticated;
