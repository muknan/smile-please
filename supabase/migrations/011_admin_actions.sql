-- Phase 7 — admin. One atomic server-side action for every booking action the
-- admin can take: assign, reassign, reschedule, cancel, complete, no-show.
-- It routes every status change through the same transition guard as the rest
-- of the app (_booking_transition_allowed) and writes one appointment_events
-- row with the admin's reason in the SAME transaction. Assign/reschedule may
-- also move the appointment onto a new slot atomically (freeing the old slot
-- and booking the new one under a row lock) so a double-booking is impossible.

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
  if v_role is null then raise exception 'NO_PROFILE'; end if;
  if v_role <> 'admin' then raise exception 'FORBIDDEN'; end if;

  select * into v_app from public.appointments
    where id = p_appointment_id for update;
  if v_app.id is null then raise exception 'APPOINTMENT_NOT_FOUND'; end if;
  v_from   := v_app.status;
  v_old_slot := v_app.slot_id;

  if not public._booking_transition_allowed(v_from, p_to, 'admin') then
    raise exception 'ILLEGAL_TRANSITION' using detail = format('%s -> %s', v_from, p_to);
  end if;

  -- Time / slot change: free the old slot, book the new one under a row lock.
  if p_new_scheduled_for is not null then
    if v_old_slot is not null and v_old_slot is distinct from p_new_slot_id then
      update public.availability_slots
         set status      = case when status = 'booked' then 'open' else status end,
             booked_count = greatest(booked_count - 1, 0),
             held_until   = null
       where id = v_old_slot;
    end if;
    if p_new_slot_id is not null then
      select * into v_slot from public.availability_slots
        where id = p_new_slot_id for update;
      if v_slot.id is null then raise exception 'SLOT_NOT_FOUND'; end if;
      if v_slot.status in ('booked', 'blocked') or v_slot.booked_count >= v_slot.capacity then
        raise exception 'SLOT_TAKEN';
      end if;
      update public.availability_slots
         set status = 'booked', booked_count = booked_count + 1, held_until = null
       where id = p_new_slot_id;
    end if;
  end if;

  update public.appointments
     set status           = p_to,
         dentist_id       = coalesce(p_new_dentist_id, dentist_id),
         slot_id          = coalesce(p_new_slot_id, slot_id),
         scheduled_for    = coalesce(p_new_scheduled_for, scheduled_for),
         cancelled_reason = case
           when p_to in ('cancelled_by_patient','cancelled_by_dentist','cancelled_by_admin')
           then p_reason
           else cancelled_reason end
   where id = p_appointment_id
   returning * into v_app;

  insert into public.appointment_events
    (appointment_id, from_status, to_status, actor_id, actor_role, reason)
  values (p_appointment_id, v_from, p_to, v_actor, 'admin', p_reason);

  return v_app;
end; $$;

revoke execute on function public.admin_appointment_action(uuid, appointment_status, text, uuid, uuid, timestamptz) from public;
grant  execute on function public.admin_appointment_action(uuid, appointment_status, text, uuid, uuid, timestamptz) to authenticated;
