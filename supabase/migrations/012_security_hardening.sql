-- Security hardening: direct appointment writes and forged audit/consent rows
-- are not allowed. Booking/state changes go through the existing RPCs.

drop policy if exists "patient creates own appointment" on public.appointments;
drop policy if exists "patient cancels own appointment" on public.appointments;
drop policy if exists "dentist updates assigned appointments" on public.appointments;
drop policy if exists "dentist manages own slots" on public.availability_slots;
drop policy if exists "insert consent" on public.consents;
drop policy if exists "insert audit" on public.audit_log;

create policy "dentist manages own slots" on public.availability_slots
  for all to authenticated
  using (dentist_id = auth.uid() and public.is_dentist())
  with check (dentist_id = auth.uid() and public.is_dentist());

create or replace function public.write_audit(
  p_action text,
  p_entity text,
  p_entity_id uuid default null,
  p_metadata jsonb default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'FORBIDDEN';
  end if;
  insert into public.audit_log (actor_id, action, entity, entity_id, metadata)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_metadata);
end; $$;

revoke execute on function public.write_audit(text, text, uuid, jsonb) from public;
grant execute on function public.write_audit(text, text, uuid, jsonb) to authenticated;

-- Reassignment is a single locked operation. The existing transition matrix
-- remains unchanged for normal transitions; this admin-only RPC allows the
-- explicit assigned -> assigned reassignment case.
create or replace function public.admin_appointment_action(
  p_appointment_id    uuid,
  p_to                appointment_status,
  p_reason            text,
  p_new_dentist_id    uuid default null,
  p_new_slot_id       uuid default null,
  p_new_scheduled_for timestamptz default null
) returns public.appointments
language plpgsql security invoker as $$
declare
  v_app        public.appointments;
  v_from       appointment_status;
  v_actor      uuid := auth.uid();
  v_role       user_role;
  v_slot       public.availability_slots;
  v_old_slot   uuid;
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

  if not public._booking_transition_allowed(v_from, p_to, 'admin')
     and not (v_from = 'assigned' and p_to = 'assigned' and p_new_dentist_id is not null) then
    raise exception 'ILLEGAL_TRANSITION' using detail = format('%s -> %s', v_from, p_to);
  end if;

  if p_new_dentist_id is not null and not exists (
    select 1 from public.dentists where profile_id = p_new_dentist_id and status = 'active'
  ) then
    raise exception 'DENTIST_NOT_AVAILABLE';
  end if;

  if p_new_scheduled_for is not null then
    if v_old_slot is not null and v_old_slot is distinct from p_new_slot_id then
      update public.availability_slots
         set status = case when status = 'booked' then 'open' else status end,
             booked_count = greatest(booked_count - 1, 0), held_until = null
       where id = v_old_slot;
    end if;
    if p_new_slot_id is not null then
      select * into v_slot from public.availability_slots where id = p_new_slot_id for update;
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
  end if;

  update public.appointments
     set status = p_to,
         dentist_id = coalesce(p_new_dentist_id, dentist_id),
         slot_id = coalesce(p_new_slot_id, slot_id),
         scheduled_for = coalesce(p_new_scheduled_for, scheduled_for),
         cancelled_reason = case
           when p_to in ('cancelled_by_patient','cancelled_by_dentist','cancelled_by_admin') then p_reason
           else cancelled_reason end
   where id = p_appointment_id
   returning * into v_app;

  insert into public.appointment_events
    (appointment_id, from_status, to_status, actor_id, actor_role, reason)
  values (p_appointment_id, v_from, p_to, v_actor, 'admin', p_reason);
  return v_app;
end; $$;

revoke execute on function public.admin_appointment_action(uuid, appointment_status, text, uuid, uuid, timestamptz) from public;
grant execute on function public.admin_appointment_action(uuid, appointment_status, text, uuid, uuid, timestamptz) to authenticated;

-- transition_appointment must be SECURITY DEFINER: D-01 removed the direct
-- UPDATE policies, so an INVOKER function can no longer write appointments.
-- As a definer it bypasses RLS, so it enforces row ownership itself (a patient
-- only their own rows, a dentist only their assigned appointments) before the
-- state-machine and 24-hour checks.
create or replace function public.transition_appointment(
  p_appointment_id uuid,
  p_to appointment_status,
  p_reason text default null
) returns public.appointments
language plpgsql security definer set search_path = public as $$
declare
  v_app  public.appointments;
  v_from appointment_status;
  v_actor uuid := auth.uid();
  v_role user_role;
begin
  if v_actor is null then raise exception 'UNAUTHENTICATED'; end if;

  select role into v_role from public.profiles where id = v_actor;
  if v_role is null then raise exception 'NO_PROFILE'; end if;

  select * into v_app from public.appointments
    where id = p_appointment_id for update;
  if v_app is null then raise exception 'APPOINTMENT_NOT_FOUND'; end if;

  -- Ownership (replaces what RLS used to provide for the INVOKER variant).
  if v_role = 'patient' and v_app.patient_id <> v_actor then
    raise exception 'FORBIDDEN';
  end if;
  if v_role = 'dentist' and v_app.dentist_id <> v_actor then
    raise exception 'FORBIDDEN';
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
