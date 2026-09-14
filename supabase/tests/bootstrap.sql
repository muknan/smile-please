-- Minimal Supabase compatibility layer for the local migration/RLS harness.
-- This is deliberately not a production auth schema. It only supplies the
-- objects that the application's migrations and SQL tests need.

create schema if not exists auth;
create schema if not exists storage;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin;
  end if;
end
$$;

-- The test connection starts as the cluster superuser, then uses SET ROLE to
-- reproduce PostgREST requests. Membership is confined to this disposable
-- cluster and lets the tests return to postgres for fixture setup checks.
-- Keep simulated API roles independent from the superuser. Tests that need
-- trusted mutation access use service_role explicitly.

create table if not exists auth.users (
  instance_id uuid,
  id uuid primary key,
  aud varchar(255),
  role varchar(255),
  email varchar(255),
  encrypted_password varchar(255),
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  confirmation_token varchar(255) not null default '',
  confirmation_sent_at timestamptz,
  recovery_token varchar(255) not null default '',
  recovery_sent_at timestamptz,
  email_change_token_new varchar(255) not null default '',
  email_change varchar(255) not null default '',
  email_change_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamptz,
  updated_at timestamptz,
  phone text,
  phone_confirmed_at timestamptz,
  confirmed_at timestamptz generated always as (coalesce(email_confirmed_at, phone_confirmed_at)) stored,
  is_sso_user boolean not null default false,
  deleted_at timestamptz
);

create table if not exists auth.identities (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id text not null,
  identity_data jsonb not null,
  provider text not null,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
);

create or replace function auth.uid()
returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
$$;

create or replace function auth.role()
returns text
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'role', ''),
    current_user
  )
$$;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  owner uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  public boolean not null default false,
  avif_autodetection boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null references storage.buckets(id) on delete cascade,
  name text not null,
  owner uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_accessed_at timestamptz default now(),
  metadata jsonb,
  path_tokens text[] generated always as (string_to_array(name, '/')) stored,
  version text,
  unique (bucket_id, name)
);

grant usage on schema auth, storage to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema auth, storage to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;

-- Migrations create their tables as postgres. Default privileges make those
-- tables usable after SET ROLE while leaving RLS as the authorization gate.
alter default privileges for role postgres in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant execute on functions to anon, authenticated, service_role;
alter default privileges for role postgres in schema auth
  grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema storage
  grant all on tables to anon, authenticated, service_role;
