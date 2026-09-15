-- A signed browser owner is established by /api/hold before this trusted RPC
-- is invoked. Keeping the owner on the row makes replacement and confirmation
-- one browser-scoped transaction instead of two independent requests.
alter table public.availability_slots add column if not exists hold_owner uuid;
comment on column public.availability_slots.hold_owner is
  'Signed browser hold owner; set only while a slot is held.';

-- Holds created by the previous release have no owner identity and therefore
-- cannot be confirmed safely after this migration. Reopen only those brief,
-- unconfirmed reservations so affected browsers can immediately select again
-- instead of leaving inventory stranded until the old lease expires.
update public.availability_slots
   set status = 'open', held_until = null, hold_owner = null
 where status = 'held' and hold_owner is null;

create function public.hold_slot(p_slot_id uuid, p_hold_owner uuid default null)
returns public.availability_slots
language plpgsql security definer set search_path = public as $$
declare
  s public.availability_slots;
  v_owner uuid := coalesce(p_hold_owner, '00000000-0000-0000-0000-000000000001'::uuid);
begin
  -- Serializes all selections from one browser, including concurrent clicks.
  perform pg_advisory_xact_lock(hashtextextended(v_owner::text, 0));

  select slot.* into s
    from public.availability_slots slot
    join public.dentists dentist on dentist.profile_id = slot.dentist_id
   where slot.id = p_slot_id
     and slot.starts_at > now()
     and dentist.status = 'active'
     and dentist.is_public
   for update of slot;

  if s.id is null then raise exception 'SLOT_NOT_FOUND'; end if;
  if s.status = 'held' and s.held_until > now() and s.hold_owner is distinct from v_owner then
    raise exception 'SLOT_HELD';
  end if;
  if s.status in ('booked', 'blocked') or s.booked_count >= s.capacity then
    raise exception 'SLOT_TAKEN';
  end if;

  -- This runs under the owner lock, so a second browser request cannot leave
  -- the first selected slot stranded after both requests have passed checks.
  update public.availability_slots
     set status = 'open', held_until = null, hold_owner = null
   where hold_owner = v_owner
     and status = 'held'
     and id <> p_slot_id;

  update public.availability_slots
     set status = 'held', held_until = now() + interval '10 minutes', hold_owner = v_owner
   where id = p_slot_id
   returning * into s;
  return s;
end; $$;
revoke execute on function public.hold_slot(uuid,uuid) from public, anon, authenticated;
grant execute on function public.hold_slot(uuid,uuid) to service_role;
drop function public.hold_slot(uuid);

create function public.release_slot_hold(p_slot_id uuid, p_hold_owner uuid default null)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  released boolean;
  v_owner uuid := coalesce(p_hold_owner, '00000000-0000-0000-0000-000000000001'::uuid);
begin
  update public.availability_slots
     set status = 'open', held_until = null, hold_owner = null
   where id = p_slot_id
     and status = 'held'
     and (hold_owner = v_owner or (p_hold_owner is null and hold_owner is null))
   returning true into released;
  return coalesce(released, false);
end; $$;
revoke execute on function public.release_slot_hold(uuid,uuid) from public, anon, authenticated;
grant execute on function public.release_slot_hold(uuid,uuid) to service_role;
drop function public.release_slot_hold(uuid);

drop function public.confirm_booking(uuid,text,text,text,age_band,text,text,reason_category,text,boolean,uuid,uuid);
create function public.confirm_booking(
  p_slot_id uuid,p_email text,p_full_name text,p_phone text,p_age_band age_band,
  p_locality text,p_pincode text,p_reason_category reason_category,p_patient_note text default null,
  p_consent_updates boolean default false,p_reschedule_appointment_id uuid default null,p_actor_id uuid default null,
  p_hold_owner uuid default null
) returns public.appointments language plpgsql security definer set search_path = public, auth as $$
declare s public.availability_slots; v_patient uuid; v_app public.appointments; v_old public.appointments; v_role user_role;
  v_owner uuid := coalesce(p_hold_owner, '00000000-0000-0000-0000-000000000001'::uuid);
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
  select slot.* into s from public.availability_slots slot join public.dentists dentist on dentist.profile_id = slot.dentist_id
   where slot.id = p_slot_id and slot.starts_at > now() and dentist.status = 'active' and dentist.is_public for update of slot;
  if s.id is null then raise exception 'SLOT_NOT_FOUND'; end if;
  if s.status <> 'held' or s.held_until is null or s.held_until <= now() or s.hold_owner is distinct from v_owner or s.booked_count >= s.capacity then raise exception 'SLOT_TAKEN'; end if;
  update public.availability_slots set status='booked',booked_count=booked_count+1,held_until=null,hold_owner=null where id=s.id;
  if v_old.id is not null then
    if v_old.slot_id is not null and v_old.slot_id <> s.id then update public.availability_slots set booked_count=greatest(booked_count-1,0),status=case when booked_count-1 <= 0 then 'open' else status end,held_until=null,hold_owner=null where id=v_old.slot_id; end if;
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
revoke execute on function public.confirm_booking(uuid,text,text,text,age_band,text,text,reason_category,text,boolean,uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.confirm_booking(uuid,text,text,text,age_band,text,text,reason_category,text,boolean,uuid,uuid,uuid) to service_role;
