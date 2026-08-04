create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  role                user_role not null default 'patient',
  full_name           text not null,
  phone               text,
  email               text,
  is_minor            boolean not null default false,
  guardian_profile_id uuid references public.profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint phone_e164 check (phone is null or phone ~ '^\+91[6-9][0-9]{9}$'),
  constraint minor_needs_guardian check (not is_minor or guardian_profile_id is not null)
);

create table public.patients (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  age_band   age_band,
  locality   text,
  pincode    text,
  constraint pincode_format check (pincode is null or pincode ~ '^[1-9][0-9]{5}$')
);

create table public.dentists (
  profile_id           uuid primary key references public.profiles(id) on delete cascade,
  slug                 text unique not null,
  display_name         text not null,
  dci_registration_no  text,
  dci_verified_at      timestamptz,
  clinic_name          text,
  address_line         text,
  locality             text not null,
  city                 text not null default 'New Delhi',
  pincode              text,
  geo_lat              numeric(9,6),
  geo_lng              numeric(9,6),
  specialties          text[] not null default '{}',
  languages            text[] not null default '{}',
  bio                  text,
  photo_path           text,
  status               dentist_status not null default 'pending',
  is_public            boolean not null default false,
  approved_by          uuid references public.profiles(id),
  approved_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index on public.dentists (status, is_public);
create index on public.dentists (locality);

create trigger t_profiles_updated before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger t_dentists_updated before update on public.dentists
  for each row execute function public.touch_updated_at();

-- Auto-create a profile on signup. Every signup creates a `patient`.
-- Role escalation to `dentist` or `admin` happens only via admin action or
-- direct SQL — do not change this.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New user'),
    new.email,
    'patient'
  );
  insert into public.patients (profile_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
