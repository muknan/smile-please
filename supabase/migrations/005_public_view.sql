-- This view is the ONLY way unauthenticated visitors read dentist data.
-- The `dentists` table itself grants nothing to `anon`.
create view public.public_dentists as
select
  d.slug,
  d.display_name,
  d.locality,
  d.city,
  d.specialties,
  d.languages,
  d.bio,
  d.photo_path
from public.dentists d
where d.status = 'active' and d.is_public = true;

-- Runs with the owner's rights so it can read past RLS on dentists.
-- This is intentional: the view's WHERE clause and column list ARE the policy.
alter view public.public_dentists set (security_invoker = off);

revoke all on public.public_dentists from anon, authenticated;
grant select on public.public_dentists to anon, authenticated;

-- Do not add `phone`, `email`, `address_line`, `dci_registration_no`, or
-- `geo_lat/lng` to this view. If a feature seems to need them, it doesn't.

-- Bookable slots: only open, future, non-full slots of active public dentists.
create view public.public_slots as
select s.id, s.dentist_id, d.slug as dentist_slug,
       s.starts_at, s.ends_at, s.location_type, s.camp_name,
       (s.capacity - s.booked_count) as remaining
from public.availability_slots s
join public.dentists d on d.profile_id = s.dentist_id
where d.status = 'active' and d.is_public = true
  and s.status = 'open'
  and s.starts_at > now()
  and s.booked_count < s.capacity;

alter view public.public_slots set (security_invoker = off);
revoke all on public.public_slots from anon, authenticated;
grant select on public.public_slots to anon, authenticated;
