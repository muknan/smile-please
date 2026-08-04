create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

create type user_role        as enum ('patient','dentist','admin');
create type dentist_status   as enum ('pending','active','paused','rejected');
create type slot_status      as enum ('open','held','booked','blocked');
create type location_type    as enum ('clinic','camp');
create type appointment_source as enum ('self_booked','patient_request','admin_created');
create type appointment_status as enum (
  'requested','assigned','confirmed','completed','no_show',
  'cancelled_by_patient','cancelled_by_dentist','cancelled_by_admin'
);
create type reason_category  as enum ('pain','bleeding_gums','cleaning','checkup','child','other');
create type age_band         as enum ('under_12','12_17','18_39','40_59','60_plus');
create type submission_type  as enum ('patient','dentist','organization');
create type submission_status as enum ('new','in_review','contacted','resolved','spam');
create type partnership_type as enum ('funding','venue','camp_host','supplies','other');
create type article_status   as enum ('draft','published');
create type consent_purpose  as enum ('booking','contact','reminders','awareness_updates');

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- Reference codes
create sequence if not exists appointment_ref_seq start 1000;
create sequence if not exists submission_ref_seq  start 1000;

create or replace function public.gen_appointment_ref()
returns text language sql volatile as $$
  select 'SP-' || to_char(now() at time zone 'Asia/Kolkata','YYYY')
      || '-' || lpad(nextval('appointment_ref_seq')::text, 4, '0');
$$;

create or replace function public.gen_submission_ref()
returns text language sql volatile as $$
  select 'SP-C-' || to_char(now() at time zone 'Asia/Kolkata','YYYY')
      || '-' || lpad(nextval('submission_ref_seq')::text, 4, '0');
$$;

-- Authorisation helpers. SECURITY DEFINER on purpose: it prevents infinite
-- recursion when RLS policies on `profiles` need to read `profiles`.
-- Do not remove `security definer` or `set search_path`.
-- plpgsql (not sql) on purpose: plpgsql bodies are validated lazily, so these
-- can be created in migration 001 before public.profiles exists in 002.
create or replace function public.is_admin()
returns boolean
language plpgsql stable security definer set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$;

create or replace function public.is_dentist()
returns boolean
language plpgsql stable security definer set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'dentist'
  );
end;
$$;

revoke execute on function public.is_admin()   from public;
revoke execute on function public.is_dentist() from public;
grant  execute on function public.is_admin()   to authenticated;
grant  execute on function public.is_dentist() to authenticated;
