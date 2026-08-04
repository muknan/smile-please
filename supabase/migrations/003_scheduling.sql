create table public.availability_slots (
  id            uuid primary key default gen_random_uuid(),
  dentist_id    uuid not null references public.dentists(profile_id) on delete cascade,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  capacity      int not null default 1 check (capacity > 0),
  booked_count  int not null default 0 check (booked_count >= 0),
  status        slot_status not null default 'open',
  held_until    timestamptz,
  location_type location_type not null default 'clinic',
  camp_name     text,
  created_by    uuid not null references public.profiles(id),
  created_at    timestamptz not null default now(),
  constraint ends_after_start check (ends_at > starts_at),
  constraint capacity_not_exceeded check (booked_count <= capacity)
);

-- This is what makes double-booking structurally impossible.
-- Do not remove it and do not try to enforce this in application code.
alter table public.availability_slots
  add constraint slots_no_overlap
  exclude using gist (
    dentist_id with =,
    tstzrange(starts_at, ends_at) with &&
  );

create index on public.availability_slots (dentist_id, starts_at);
create index on public.availability_slots (status, starts_at);

create table public.appointments (
  id                 uuid primary key default gen_random_uuid(),
  reference_code     text unique not null default public.gen_appointment_ref(),
  patient_id         uuid not null references public.profiles(id) on delete restrict,
  dentist_id         uuid references public.dentists(profile_id) on delete set null,
  slot_id            uuid references public.availability_slots(id) on delete set null,
  source             appointment_source not null,
  status             appointment_status not null default 'requested',
  reason_category    reason_category not null,
  patient_note       text,
  preferred_window   jsonb,
  preferred_locality text,
  scheduled_for      timestamptz,
  cancelled_reason   text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index on public.appointments (patient_id, created_at desc);
create index on public.appointments (dentist_id, scheduled_for);
create index on public.appointments (status, created_at desc);

create trigger t_appointments_updated before update on public.appointments
  for each row execute function public.touch_updated_at();

-- Clinical notes live in their OWN table so that "patients must never see
-- clinical notes" is enforceable by row-level security. RLS cannot restrict
-- columns; putting the note in a separate table makes it a row problem.
create table public.clinical_notes (
  appointment_id uuid primary key references public.appointments(id) on delete cascade,
  note           text not null,
  author_id      uuid not null references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger t_clinical_notes_updated before update on public.clinical_notes
  for each row execute function public.touch_updated_at();

-- Append-only audit trail. Serves the admin's "who changed this and why",
-- the patient's status timeline, and the compliance access log.
create table public.appointment_events (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  from_status    appointment_status,
  to_status      appointment_status not null,
  actor_id       uuid references public.profiles(id),
  actor_role     user_role,
  reason         text,
  created_at     timestamptz not null default now()
);

create index on public.appointment_events (appointment_id, created_at);
