-- Security and atomic-consent regression checks for 013_booking_security.sql.
-- Run after migrations as postgres; this file rolls back all fixtures.
begin;

do $$
begin
  if has_function_privilege('anon', 'public.hold_slot(uuid)', 'EXECUTE') then raise exception 'SECURITY TEST FAILED: anon can execute hold_slot'; end if;
  if has_function_privilege('authenticated', 'public.confirm_booking(uuid,text,text,text,age_band,text,text,reason_category,text,boolean,uuid,uuid)', 'EXECUTE') then raise exception 'SECURITY TEST FAILED: authenticated can execute confirm_booking'; end if;
  if not has_function_privilege('service_role', 'public.confirm_booking(uuid,text,text,text,age_band,text,text,reason_category,text,boolean,uuid,uuid)', 'EXECUTE') then raise exception 'SECURITY TEST FAILED: service_role cannot execute confirm_booking'; end if;
  if has_function_privilege('anon', 'public.release_slot_hold(uuid)', 'EXECUTE') or not has_function_privilege('service_role', 'public.release_slot_hold(uuid)', 'EXECUTE') then raise exception 'SECURITY TEST FAILED: release_slot_hold grants are unsafe'; end if;
  if has_function_privilege('anon', 'public.submit_contact(submission_type,text,text,text,text,text,text,text,partnership_type,text,text,text)', 'EXECUTE') then raise exception 'SECURITY TEST FAILED: anon can execute submit_contact'; end if;
  if has_function_privilege('authenticated', 'public.submit_contact(submission_type,text,text,text,text,text,text,text,partnership_type,text,text,text)', 'EXECUTE') then raise exception 'SECURITY TEST FAILED: authenticated can execute submit_contact'; end if;
  if not has_function_privilege('service_role', 'public.submit_contact(submission_type,text,text,text,text,text,text,text,partnership_type,text,text,text)', 'EXECUTE') then raise exception 'SECURITY TEST FAILED: service_role cannot execute submit_contact'; end if;
  if not has_function_privilege('authenticated', 'public.withdraw_booking_consent(consent_purpose)', 'EXECUTE') then raise exception 'SECURITY TEST FAILED: consent withdrawal RPC unavailable'; end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='clinical_notes' and policyname='staff reads clinical notes') then raise exception 'SECURITY TEST FAILED: clinical_notes staff policy missing'; end if;
end $$;

-- Browser roles cannot bypass the contact server action with a direct insert.
set local role anon;
do $$
begin
  begin
    insert into public.contact_submissions (type,name,email,message)
    values ('patient','Bypass attempt','bypass@test.local','Must be denied');
    raise exception 'SECURITY TEST FAILED: anon direct contact insert succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
set local role postgres;

-- Signup creates patient profiles for the two test subjects.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000','40000000-0000-0000-0000-0000000000a1','authenticated','authenticated','withdraw-owner@test.local','','{}','{"full_name":"Consent Owner"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','40000000-0000-0000-0000-0000000000a2','authenticated','authenticated','withdraw-other@test.local','','{}','{"full_name":"Other Patient"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','40000000-0000-0000-0000-0000000000d1','authenticated','authenticated','withdraw-dentist@test.local','','{}','{"full_name":"Withdrawal Dentist"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','40000000-0000-0000-0000-0000000000d2','authenticated','authenticated','paused-dentist@test.local','','{}','{"full_name":"Paused Dentist"}',now(),now()),
  ('00000000-0000-0000-0000-000000000000','40000000-0000-0000-0000-0000000000ad','authenticated','authenticated','cancel-admin@test.local','','{}','{"full_name":"Cancel Admin"}',now(),now());
update public.profiles set role='dentist' where id in ('40000000-0000-0000-0000-0000000000d1','40000000-0000-0000-0000-0000000000d2');
update public.profiles set role='admin' where id='40000000-0000-0000-0000-0000000000ad';
insert into public.dentists (profile_id,slug,display_name,locality,status,is_public) values ('40000000-0000-0000-0000-0000000000d1','withdraw-test-dentist','Withdrawal Test Dentist','Delhi','active',true);
insert into public.dentists (profile_id,slug,display_name,locality,status,is_public) values ('40000000-0000-0000-0000-0000000000d2','paused-test-dentist','Paused Test Dentist','Delhi','paused',false);
insert into public.availability_slots (id,dentist_id,starts_at,ends_at,created_by,booked_count,status) values
  ('40000000-0000-0000-0000-000000000101','40000000-0000-0000-0000-0000000000d1',now()+interval '48 hours',now()+interval '48 hours 30 minutes','40000000-0000-0000-0000-0000000000d1',1,'booked'),
  ('40000000-0000-0000-0000-000000000102','40000000-0000-0000-0000-0000000000d1',now()+interval '49 hours',now()+interval '49 hours 30 minutes','40000000-0000-0000-0000-0000000000d1',1,'booked'),
  ('40000000-0000-0000-0000-000000000103','40000000-0000-0000-0000-0000000000d1',now()+interval '50 hours',now()+interval '50 hours 30 minutes','40000000-0000-0000-0000-0000000000d1',0,'blocked'),
  ('40000000-0000-0000-0000-000000000104','40000000-0000-0000-0000-0000000000d1',now()+interval '51 hours',now()+interval '51 hours 30 minutes','40000000-0000-0000-0000-0000000000d1',0,'open'),
  ('40000000-0000-0000-0000-000000000105','40000000-0000-0000-0000-0000000000d1',now()-interval '2 hours',now()-interval '90 minutes','40000000-0000-0000-0000-0000000000d1',0,'open'),
  ('40000000-0000-0000-0000-000000000106','40000000-0000-0000-0000-0000000000d2',now()+interval '52 hours',now()+interval '52 hours 30 minutes','40000000-0000-0000-0000-0000000000d2',0,'open'),
  ('40000000-0000-0000-0000-000000000107','40000000-0000-0000-0000-0000000000d1',now()+interval '53 hours',now()+interval '53 hours 30 minutes','40000000-0000-0000-0000-0000000000d1',1,'booked');
insert into public.appointments (id,patient_id,dentist_id,slot_id,source,status,reason_category,scheduled_for) values
  ('40000000-0000-0000-0000-000000000201','40000000-0000-0000-0000-0000000000a1','40000000-0000-0000-0000-0000000000d1','40000000-0000-0000-0000-000000000101','self_booked','confirmed','checkup',now()+interval '48 hours'),
  ('40000000-0000-0000-0000-000000000202','40000000-0000-0000-0000-0000000000a1','40000000-0000-0000-0000-0000000000d1','40000000-0000-0000-0000-000000000102','self_booked','confirmed','checkup',now()+interval '49 hours'),
  ('40000000-0000-0000-0000-000000000203','40000000-0000-0000-0000-0000000000a2','40000000-0000-0000-0000-0000000000d1','40000000-0000-0000-0000-000000000107','self_booked','confirmed','checkup',now()+interval '53 hours');
insert into public.consents (subject_type,subject_id,purpose,notice_version) values
  ('profile','40000000-0000-0000-0000-0000000000a1','booking','test'),
  ('profile','40000000-0000-0000-0000-0000000000a1','awareness_updates','test'),
  ('profile','40000000-0000-0000-0000-0000000000a2','booking','test');

-- Only a future slot from an active public dentist can be held, and a live
-- hold is mandatory when the trusted boundary confirms a booking.
set local role service_role;
do $$
declare denied boolean;
begin
  denied := false;
  begin perform public.hold_slot('40000000-0000-0000-0000-000000000103');
  exception when others then if SQLERRM like '%SLOT_TAKEN%' then denied := true; else raise; end if; end;
  if not denied then raise exception 'SECURITY TEST FAILED: blocked slot could be held'; end if;

  denied := false;
  begin perform public.hold_slot('40000000-0000-0000-0000-000000000105');
  exception when others then if SQLERRM like '%SLOT_NOT_FOUND%' then denied := true; else raise; end if; end;
  if not denied then raise exception 'SECURITY TEST FAILED: past slot could be held'; end if;

  denied := false;
  begin perform public.hold_slot('40000000-0000-0000-0000-000000000106');
  exception when others then if SQLERRM like '%SLOT_NOT_FOUND%' then denied := true; else raise; end if; end;
  if not denied then raise exception 'SECURITY TEST FAILED: paused private dentist slot could be held'; end if;

  denied := false;
  begin
    perform public.confirm_booking(
      '40000000-0000-0000-0000-000000000104','no-hold@test.local','No Hold','+919000000104',
      '18_39','Delhi','110001','checkup',null,false,null,null);
  exception when others then if SQLERRM like '%SLOT_TAKEN%' then denied := true; else raise; end if; end;
  if not denied then raise exception 'SECURITY TEST FAILED: unheld slot could be confirmed'; end if;

end $$;
set local role postgres;

update public.availability_slots set status='held', held_until=now()-interval '1 second'
 where id='40000000-0000-0000-0000-000000000104';
set local role service_role;
do $$
declare denied boolean := false;
begin
  begin
    perform public.confirm_booking(
      '40000000-0000-0000-0000-000000000104','expired-hold@test.local','Expired Hold','+919000000105',
      '18_39','Delhi','110001','checkup',null,false,null,null);
  exception when others then if SQLERRM like '%SLOT_TAKEN%' then denied := true; else raise; end if; end;
  if not denied then raise exception 'SECURITY TEST FAILED: expired hold could be confirmed'; end if;
  if not public.release_slot_hold('40000000-0000-0000-0000-000000000104') then
    raise exception 'SECURITY TEST FAILED: trusted release did not clear the expired hold';
  end if;
  perform public.hold_slot('40000000-0000-0000-0000-000000000104');
end $$;
set local role postgres;

-- Revalidate eligibility at confirmation time, not just when the hold began.
update public.dentists set is_public=false where profile_id='40000000-0000-0000-0000-0000000000d1';
set local role service_role;
do $$
declare denied boolean := false;
begin
  begin
    perform public.confirm_booking(
      '40000000-0000-0000-0000-000000000104','private-after-hold@test.local','Private After Hold','+919000000106',
      '18_39','Delhi','110001','checkup',null,false,null,null);
  exception when others then if SQLERRM like '%SLOT_NOT_FOUND%' then denied := true; else raise; end if; end;
  if not denied then raise exception 'SECURITY TEST FAILED: slot remained confirmable after dentist became private'; end if;
end $$;
set local role postgres;
update public.dentists set is_public=true where profile_id='40000000-0000-0000-0000-0000000000d1';
set local role service_role;
select public.release_slot_hold('40000000-0000-0000-0000-000000000104');
set local role postgres;
do $$ begin
  if not exists (select 1 from public.availability_slots where id='40000000-0000-0000-0000-000000000104' and status='open' and held_until is null) then
    raise exception 'SECURITY TEST FAILED: superseded hold remained stranded';
  end if;
end $$;

-- Admin cancellation releases the booked slot and records the transition in
-- the same transaction.
set local role authenticated;
set local request.jwt.claims = '{"sub":"40000000-0000-0000-0000-0000000000ad"}';
select public.admin_appointment_action(
  '40000000-0000-0000-0000-000000000203','cancelled_by_admin','Security regression');
set local role postgres;
do $$
begin
  if (select status from public.appointments where id='40000000-0000-0000-0000-000000000203') <> 'cancelled_by_admin' then
    raise exception 'SECURITY TEST FAILED: admin cancellation did not update appointment';
  end if;
  if not exists (select 1 from public.availability_slots where id='40000000-0000-0000-0000-000000000107' and status='open' and booked_count=0) then
    raise exception 'SECURITY TEST FAILED: admin cancellation did not release slot';
  end if;
  if not exists (select 1 from public.appointment_events where appointment_id='40000000-0000-0000-0000-000000000203' and from_status='confirmed' and to_status='cancelled_by_admin' and actor_role='admin') then
    raise exception 'SECURITY TEST FAILED: admin cancellation event missing';
  end if;
end $$;

-- An injected second-event failure proves the RPC cannot partly commit.
create function pg_temp.fail_second_consent_event() returns trigger language plpgsql as $$
begin
  if new.reason='Consent withdrawn' and (select count(*) from public.appointment_events where reason='Consent withdrawn') >= 1 then raise exception 'TEST_INJECTED_FAILURE'; end if;
  return new;
end; $$;
create trigger fail_second_consent_event before insert on public.appointment_events for each row execute function pg_temp.fail_second_consent_event();
set local role authenticated;
set local request.jwt.claims = '{"sub":"40000000-0000-0000-0000-0000000000a1"}';
do $$
declare failed boolean := false;
begin
  begin perform public.withdraw_booking_consent('booking'); exception when others then if SQLERRM like '%TEST_INJECTED_FAILURE%' then failed:=true; else raise; end if; end;
  if not failed then raise exception 'SECURITY TEST FAILED: injected withdrawal failure did not propagate'; end if;
  if (select count(*) from public.appointments where id in ('40000000-0000-0000-0000-000000000201','40000000-0000-0000-0000-000000000202') and status='confirmed') <> 2 then raise exception 'SECURITY TEST FAILED: failed withdrawal partially cancelled appointments'; end if;
  if (select count(*) from public.availability_slots where id in ('40000000-0000-0000-0000-000000000101','40000000-0000-0000-0000-000000000102') and booked_count=1 and status='booked') <> 2 then raise exception 'SECURITY TEST FAILED: failed withdrawal partially released capacity'; end if;
  if (select withdrawn_at from public.consents where subject_id='40000000-0000-0000-0000-0000000000a1' and purpose='booking') is not null then raise exception 'SECURITY TEST FAILED: failed withdrawal changed booking consent'; end if;
end $$;
set local role postgres;
drop trigger fail_second_consent_event on public.appointment_events;

-- Updates withdrawal is purpose-isolated: appointments and booking consent stay intact.
set local role authenticated;
set local request.jwt.claims = '{"sub":"40000000-0000-0000-0000-0000000000a1"}';
select public.withdraw_booking_consent('awareness_updates');
set local role postgres;
do $$ begin
  if (select withdrawn_at from public.consents where subject_id='40000000-0000-0000-0000-0000000000a1' and purpose='awareness_updates') is null then raise exception 'SECURITY TEST FAILED: updates consent was not withdrawn'; end if;
  if (select withdrawn_at from public.consents where subject_id='40000000-0000-0000-0000-0000000000a1' and purpose='booking') is not null or (select count(*) from public.appointments where patient_id='40000000-0000-0000-0000-0000000000a1' and status='confirmed') <> 2 then raise exception 'SECURITY TEST FAILED: updates withdrawal affected booking data'; end if;
end $$;

-- Booking withdrawal cancels only owner appointments, writes events, and frees capacity.
set local role authenticated;
set local request.jwt.claims = '{"sub":"40000000-0000-0000-0000-0000000000a1"}';
select public.withdraw_booking_consent('booking');
set local role postgres;
do $$ begin
  if (select withdrawn_at from public.consents where subject_id='40000000-0000-0000-0000-0000000000a1' and purpose='booking') is null then raise exception 'SECURITY TEST FAILED: booking consent was not withdrawn'; end if;
  if (select count(*) from public.appointments where patient_id='40000000-0000-0000-0000-0000000000a1' and status='cancelled_by_patient') <> 2 then raise exception 'SECURITY TEST FAILED: booking withdrawal did not cancel every active appointment'; end if;
  if (select count(*) from public.appointment_events where appointment_id in ('40000000-0000-0000-0000-000000000201','40000000-0000-0000-0000-000000000202') and from_status='confirmed' and to_status='cancelled_by_patient' and actor_id='40000000-0000-0000-0000-0000000000a1' and reason='Consent withdrawn') <> 2 then raise exception 'SECURITY TEST FAILED: booking withdrawal events missing'; end if;
  if (select count(*) from public.availability_slots where id in ('40000000-0000-0000-0000-000000000101','40000000-0000-0000-0000-000000000102') and booked_count=0 and status='open') <> 2 then raise exception 'SECURITY TEST FAILED: booking withdrawal did not release capacity'; end if;
end $$;

-- Another patient cannot alter the owner's consent; non-patients and anonymous callers reject.
set local role authenticated;
set local request.jwt.claims = '{"sub":"40000000-0000-0000-0000-0000000000a2"}';
select public.withdraw_booking_consent('booking');
set local role postgres;
do $$
declare denied boolean := false;
begin
  if (select withdrawn_at from public.consents where subject_id='40000000-0000-0000-0000-0000000000a1' and purpose='booking') is null then raise exception 'SECURITY TEST FAILED: another patient changed owner consent'; end if;
  set local role authenticated; set local request.jwt.claims = '{"sub":"40000000-0000-0000-0000-0000000000d1"}';
  begin perform public.withdraw_booking_consent('booking'); exception when others then if SQLERRM like '%FORBIDDEN%' then denied:=true; else raise; end if; end;
  if not denied then raise exception 'SECURITY TEST FAILED: dentist could withdraw patient consent'; end if;
end $$;
set local role authenticated;
set local request.jwt.claims = '{"sub":null}';
do $$ begin
  begin perform public.withdraw_booking_consent('booking'); raise exception 'SECURITY TEST FAILED: anonymous withdrawal succeeded'; exception when others then if SQLERRM not like '%UNAUTHENTICATED%' then raise; end if; end;
end $$;

rollback;
