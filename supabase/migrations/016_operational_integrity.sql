-- Operational mutations that must serialize with booking state transitions.

-- A day remains blocked even when there were no slots to update. Only the
-- trusted RPC writes markers; ordinary clients cannot inspect or remove them.
create table public.availability_day_blocks (
  dentist_id uuid not null references public.dentists(profile_id) on delete cascade,
  local_date date not null,
  created_at timestamptz not null default now(),
  primary key (dentist_id, local_date)
);
alter table public.availability_day_blocks enable row level security;
revoke all on public.availability_day_blocks from public, anon, authenticated;

-- All writers use the same key before checking the marker. In existing
-- booking/admin flows this trigger can run after a row lock; the block RPC
-- must therefore use NOWAIT for row locks after taking the advisory lock.
create function public.lock_availability_day(p_dentist_id uuid, p_date date)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(
    hashtextextended('availability-day:' || p_dentist_id::text || ':' || p_date::text, 0)
  );
end;
$$;
revoke execute on function public.lock_availability_day(uuid, date) from public, anon, authenticated;

create function public.guard_blocked_appointment_day()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.dentist_id is not null and new.scheduled_for is not null
     and new.status in ('assigned', 'confirmed') then
    perform public.lock_availability_day(new.dentist_id, (new.scheduled_for at time zone 'Asia/Kolkata')::date);
    if exists (
      select 1 from public.availability_day_blocks
       where dentist_id = new.dentist_id
         and local_date = (new.scheduled_for at time zone 'Asia/Kolkata')::date
    ) then
      raise exception 'DAY_BLOCKED';
    end if;
  end if;
  return new;
end;
$$;
create trigger t_appointments_blocked_day
  before insert or update on public.appointments
  for each row execute function public.guard_blocked_appointment_day();
revoke execute on function public.guard_blocked_appointment_day() from public, anon, authenticated;

create function public.guard_blocked_slot_day()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('open', 'held', 'booked') then
    perform public.lock_availability_day(new.dentist_id, (new.starts_at at time zone 'Asia/Kolkata')::date);
    if exists (
      select 1 from public.availability_day_blocks
       where dentist_id = new.dentist_id
         and local_date = (new.starts_at at time zone 'Asia/Kolkata')::date
    ) then
      raise exception 'DAY_BLOCKED';
    end if;
  end if;
  return new;
end;
$$;
create trigger t_slots_blocked_day
  before insert or update on public.availability_slots
  for each row execute function public.guard_blocked_slot_day();
revoke execute on function public.guard_blocked_slot_day() from public, anon, authenticated;

create or replace function public.block_availability_day(
  p_dentist_id uuid,
  p_date date
) returns integer
language plpgsql security definer set search_path = public, auth as $$
declare
  v_actor uuid := auth.uid();
  v_role user_role;
  v_start timestamptz := p_date::timestamp at time zone 'Asia/Kolkata';
  v_end timestamptz := (p_date + 1)::timestamp at time zone 'Asia/Kolkata';
  v_count integer;
begin
  if v_actor is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_dentist_id is null or p_date is null then raise exception 'INVALID_DATE'; end if;
  select role into v_role from public.profiles where id = v_actor;
  if v_role = 'dentist' and p_dentist_id <> v_actor then raise exception 'FORBIDDEN'; end if;
  if v_role is distinct from 'dentist' and v_role is distinct from 'admin' then raise exception 'FORBIDDEN'; end if;

  perform public.lock_availability_day(p_dentist_id, p_date);

  -- Lock appointments before slots. Reschedules lock their appointment before
  -- their replacement slot too, so this ordering avoids an inverse-lock
  -- deadlock. This also catches admin-created appointments, which can have no
  -- slot_id but still occupy a dentist's day.
  begin
    perform 1
      from public.appointments
     where dentist_id = p_dentist_id
       and scheduled_for >= v_start
       and scheduled_for < v_end
       and status in ('assigned', 'confirmed')
     order by id
     for update nowait;
  exception when lock_not_available then
    raise exception 'DAY_BUSY';
  end;

  -- These are the same rows hold_slot and confirm_booking lock. A booking
  -- transition therefore either completes before this check (and blocks the
  -- day) or sees the blocked status after it.
  begin
    perform 1
      from public.availability_slots
     where dentist_id = p_dentist_id
       and starts_at >= v_start
       and starts_at < v_end
     order by id
     for update nowait;
  exception when lock_not_available then
    -- Booking can lock a selected slot before its prior reschedule slot.
    -- Refusing instead of waiting removes that inverse-lock deadlock path.
    raise exception 'DAY_BUSY';
  end;

  if exists (
    select 1 from public.appointments
     where dentist_id = p_dentist_id
       and scheduled_for >= v_start
       and scheduled_for < v_end
       and status in ('assigned', 'confirmed')
  ) then
    raise exception 'DAY_HAS_SCHEDULED_APPOINTMENT';
  end if;
  if exists (
    select 1 from public.availability_slots
     where dentist_id = p_dentist_id
       and starts_at >= v_start
       and starts_at < v_end
       and status = 'held'
       and held_until > now()
  ) then
    raise exception 'DAY_HAS_ACTIVE_HOLD';
  end if;
  if exists (
    select 1 from public.availability_slots
     where dentist_id = p_dentist_id
       and starts_at >= v_start
       and starts_at < v_end
       and status = 'booked'
  ) then
    raise exception 'DAY_HAS_BOOKED_SLOT';
  end if;

  update public.availability_slots
     set status = 'blocked', held_until = null, hold_owner = null
   where dentist_id = p_dentist_id
     and starts_at >= v_start
     and starts_at < v_end
     and (status = 'open' or (status = 'held' and held_until <= now()));
  get diagnostics v_count = row_count;
  insert into public.availability_day_blocks (dentist_id, local_date)
  values (p_dentist_id, p_date)
  on conflict (dentist_id, local_date) do nothing;
  return v_count;
end;
$$;
revoke execute on function public.block_availability_day(uuid, date) from public;
grant execute on function public.block_availability_day(uuid, date) to authenticated;

-- A patient profile is one logical record across profiles and patients. Keep
-- both writes in one authenticated transaction so a later failure rolls back
-- the earlier name/phone update as well.
create or replace function public.update_patient_profile(
  p_full_name text,
  p_phone text,
  p_locality text,
  p_age_band age_band
) returns void
language plpgsql security definer set search_path = public, auth as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'UNAUTHENTICATED'; end if;
  if not exists (select 1 from public.profiles where id = v_actor and role = 'patient') then
    raise exception 'FORBIDDEN';
  end if;

  update public.profiles
     set full_name = p_full_name,
         phone = p_phone
   where id = v_actor;

  insert into public.patients (profile_id, age_band, locality)
  values (v_actor, p_age_band, p_locality)
  on conflict (profile_id) do update
    set age_band = excluded.age_band,
        locality = excluded.locality;
end;
$$;
revoke execute on function public.update_patient_profile(text, text, text, age_band) from public;
grant execute on function public.update_patient_profile(text, text, text, age_band) to authenticated;

-- SMTP has no distributed transaction with Postgres. Claims are safe to
-- reclaim before a send starts; once SMTP may have seen a message, a worker
-- death is recorded as uncertain and is deliberately never auto-retried.
create table public.appointment_reminders (
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  kind text not null check (kind = 'reminder_24h'),
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'claimed', 'sending', 'sent', 'failed', 'uncertain')),
  attempts integer not null default 0 check (attempts >= 0),
  claim_token uuid,
  claimed_at timestamptz,
  claim_expires_at timestamptz,
  sending_expires_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (appointment_id, kind, scheduled_for)
);
alter table public.appointment_reminders enable row level security;
create trigger t_appointment_reminders_updated before update on public.appointment_reminders
  for each row execute function public.touch_updated_at();

create or replace function public.claim_appointment_reminder(
  p_appointment_id uuid,
  p_kind text,
  p_due_start timestamptz,
  p_due_end timestamptz
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_token uuid;
  v_scheduled_for timestamptz;
begin
  -- Lock and read the current occurrence, rather than trusting the cron's
  -- earlier list. A reschedule gets a fresh reminder key for its new time.
  select a.scheduled_for
    into v_scheduled_for
    from public.appointments a
   where a.id = p_appointment_id
     and a.status = 'confirmed'
   for update of a;
  if v_scheduled_for is null
     or v_scheduled_for < p_due_start
     or v_scheduled_for >= p_due_end then
    return null;
  end if;
  insert into public.appointment_reminders (appointment_id, kind, scheduled_for)
  values (p_appointment_id, p_kind, v_scheduled_for)
  on conflict (appointment_id, kind, scheduled_for) do nothing;

  update public.appointment_reminders
     set status = 'claimed',
         attempts = attempts + 1,
         claim_token = gen_random_uuid(),
         claimed_at = clock_timestamp(),
         claim_expires_at = clock_timestamp() + interval '2 minutes',
         sending_expires_at = null,
         last_error = null
   where appointment_id = p_appointment_id
     and kind = p_kind
     and scheduled_for = v_scheduled_for
     and sent_at is null
     and (status in ('pending', 'failed') or (status = 'claimed' and claim_expires_at < clock_timestamp()))
  returning claim_token into v_token;
  if v_token is null then return null; end if;
  return jsonb_build_object(
    'claim_token', v_token,
    'scheduled_for', v_scheduled_for
  );
end;
$$;

-- This is the last database operation before SMTP. It validates the current
-- occurrence and snapshots the only reminder details we render. The active
-- sending lease lets the appointment trigger reject a competing cancellation
-- or reschedule until this bounded SMTP attempt concludes.
create or replace function public.begin_appointment_reminder_send(
  p_appointment_id uuid,
  p_kind text,
  p_scheduled_for timestamptz,
  p_claim_token uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_email text;
  v_dentist text;
  v_locality text;
begin
  select p.email, coalesce(d.display_name, 'a Smile Please dentist'), d.locality
    into v_email, v_dentist, v_locality
    from public.appointments a
    join public.profiles p on p.id = a.patient_id
    left join public.dentists d on d.profile_id = a.dentist_id
   where a.id = p_appointment_id
     and a.status = 'confirmed'
     and a.scheduled_for = p_scheduled_for
   for update of a;
  if v_email is null then return null; end if;

  update public.appointment_reminders
     set status = 'sending',
         claim_expires_at = null,
         -- The Vercel reminder route is capped at 240 seconds. This lease
         -- remains active past the end of any live invocation.
         sending_expires_at = clock_timestamp() + interval '5 minutes'
   where appointment_id = p_appointment_id
     and kind = p_kind
     and scheduled_for = p_scheduled_for
     and status = 'claimed'
     and claim_token = p_claim_token
     and claim_expires_at >= clock_timestamp();
  if not found then return null; end if;
  return jsonb_build_object('email', v_email, 'dentist', v_dentist, 'locality', v_locality);
end;
$$;

create or replace function public.complete_appointment_reminder(
  p_appointment_id uuid,
  p_kind text,
  p_scheduled_for timestamptz,
  p_claim_token uuid,
  p_sent boolean,
  p_error text default null,
  p_retryable boolean default false
) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.appointment_reminders
     set status = case when p_sent then 'sent' when p_retryable then 'failed' else 'uncertain' end,
         sent_at = case when p_sent then now() else null end,
         last_error = case when p_sent then null else left(coalesce(p_error, 'send-failed'), 300) end,
         claim_token = null,
         claim_expires_at = null,
         sending_expires_at = null
   where appointment_id = p_appointment_id
     and kind = p_kind
     and scheduled_for = p_scheduled_for
     and status = 'sending'
     and claim_token = p_claim_token;
end;
$$;

create or replace function public.guard_appointment_reminder_delivery()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.status, new.scheduled_for, new.dentist_id, new.patient_id)
       is distinct from (old.status, old.scheduled_for, old.dentist_id, old.patient_id)
     and exists (
       select 1 from public.appointment_reminders r
        where r.appointment_id = old.id
          and r.status = 'sending'
          and r.sending_expires_at > clock_timestamp()
     ) then
    raise exception 'REMINDER_DELIVERY_IN_PROGRESS' using errcode = '55P03';
  end if;
  return new;
end;
$$;
create trigger t_appointments_reminder_delivery_guard
  before update on public.appointments
  for each row execute function public.guard_appointment_reminder_delivery();

revoke execute on function public.claim_appointment_reminder(uuid, text, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.begin_appointment_reminder_send(uuid, text, timestamptz, uuid) from public, anon, authenticated;
revoke execute on function public.complete_appointment_reminder(uuid, text, timestamptz, uuid, boolean, text, boolean) from public, anon, authenticated;
grant execute on function public.claim_appointment_reminder(uuid, text, timestamptz, timestamptz) to service_role;
grant execute on function public.begin_appointment_reminder_send(uuid, text, timestamptz, uuid) to service_role;
grant execute on function public.complete_appointment_reminder(uuid, text, timestamptz, uuid, boolean, text, boolean) to service_role;
