-- The booking UI and hold model reserve a slot for exactly one patient.  Do
-- not silently collapse a multi-booked slot: it needs manual remediation so
-- every existing booking can be accounted for before this invariant is added.
do $$
declare
  v_incompatible_count integer;
begin
  select count(*)
    into v_incompatible_count
    from public.availability_slots
   where booked_count > 1;

  if v_incompatible_count > 0 then
    raise exception
      'Cannot enforce single-patient slots: % availability_slots row(s) have booked_count > 1. Reconcile those bookings before applying migration 015.',
      v_incompatible_count;
  end if;
end;
$$;

-- Rows with zero or one booking can safely be normalized.  The existing
-- capacity_not_exceeded and booked_count >= 0 checks continue to guarantee
-- booked_count is either zero or one after the new capacity constraint.
update public.availability_slots
   set capacity = 1
 where capacity <> 1;

alter table public.availability_slots
  add constraint availability_slots_capacity_one check (capacity = 1);

-- Anonymous reference lookup is a patient-facing status timeline, not an
-- audit log.  Keep the deliberately public appointment cancellation reason at
-- the top level, but expose only a transition's status and timestamp per
-- event; actor identity, role, and event reason remain internal.
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
           jsonb_build_object('status', e.to_status, 'at', e.created_at)
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
end;
$$;

revoke execute on function public.lookup_appointment(text, text) from public;
grant  execute on function public.lookup_appointment(text, text) to anon, authenticated;
