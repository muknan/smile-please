-- Phase 3: rate limiting for the magic-link sign-in form (Master §9.6 —
-- 5 submissions per IP per hour). Postgres is the rate-limit store (Master
-- RULE 0.3); the table is reachable only through the SECURITY DEFINER helper
-- below, never directly by anon.

create table public.signin_attempts (
  id         bigint generated always as identity primary key,
  ip         text not null,
  created_at timestamptz not null default now()
);

create index signin_attempts_ip_created_idx
  on public.signin_attempts (ip, created_at desc);

alter table public.signin_attempts enable row level security;

-- No RLS policies: anon cannot touch the table directly. The sign-in server
-- action goes through record_signin_attempt() instead. Expires rows older
-- than an hour, then returns true when the IP is under its 5-per-hour
-- budget (recording the attempt) and false when over it.
create or replace function public.record_signin_attempt(p_ip text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowed boolean;
begin
  delete from public.signin_attempts
  where created_at < now() - interval '1 hour';

  select not exists (
    select 1 from public.signin_attempts
    where ip = p_ip
    group by ip
    having count(*) >= 5
  ) into v_allowed;

  if v_allowed then
    insert into public.signin_attempts (ip) values (p_ip);
  end if;

  return v_allowed;
end;
$$;

revoke execute on function public.record_signin_attempt(text) from public;
grant execute on function public.record_signin_attempt(text) to anon, authenticated;
