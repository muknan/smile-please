-- Phase 6 — contact system and email.
-- Adds the two dentist-tab fields the Phase 2 DDL did not anticipate:
-- "Clinic area" and "When you're free", kept structured so admin triage
-- (Phase 7) can filter and sort them instead of parsing free text.
-- Plus submit_contact: the public /contact form saves through this DEFINER
-- function because anon deliberately has NO select on contact_submissions
-- (Phase 2 RLS) — "insert ... returning" would violate the (missing) select
-- policy. The function inserts the row AND the purpose='contact' consent row
-- in one call, and returns the row so the page can show the reference code.

alter table public.contact_submissions
  add column clinic_area text,
  add column availability text;

comment on column public.contact_submissions.clinic_area is
  'Dentist enquiries: the area of Delhi the volunteer can practise in.';
comment on column public.contact_submissions.availability is
  'Dentist enquiries: when the volunteer is free (free text).';

create or replace function public.submit_contact(
  p_type           submission_type,
  p_name           text,
  p_phone          text,
  p_email          text,
  p_organization_name text,
  p_dci_registration_no text,
  p_clinic_area    text,
  p_availability   text,
  p_partnership_type partnership_type,
  p_message        text,
  p_source_page    text default '/contact',
  p_ip_hash        text default null
) returns public.contact_submissions
language plpgsql security definer set search_path = public as $$
declare
  v_row public.contact_submissions;
begin
  if p_type in ('patient', 'dentist') and coalesce(p_phone, '') = '' and coalesce(p_email, '') = '' then
    raise exception 'CONTACTABLE' using errcode = '23514';
  end if;

  insert into public.contact_submissions
    (type, name, phone, email, organization_name, dci_registration_no,
     clinic_area, availability, partnership_type, message, source_page)
  values
    (p_type, p_name, nullif(p_phone, ''), nullif(p_email, ''),
     nullif(p_organization_name, ''), nullif(p_dci_registration_no, ''),
     nullif(p_clinic_area, ''), nullif(p_availability, ''),
     p_partnership_type, p_message,
     coalesce(nullif(p_source_page, ''), '/contact'))
  returning * into v_row;

  insert into public.consents
    (subject_type, subject_id, purpose, notice_version, method, ip_hash)
  values
    ('submission', v_row.id, 'contact', 'v1 — 2026-08-04', 'web_form', p_ip_hash)
  on conflict do nothing;

  return v_row;
end; $$;

revoke execute on function public.submit_contact(submission_type, text, text, text, text, text, text, text, partnership_type, text, text, text) from public;
grant  execute on function public.submit_contact(submission_type, text, text, text, text, text, text, text, partnership_type, text, text, text) to anon, authenticated;
