-- Enable RLS on every table first. A table with RLS disabled is a data breach.
alter table public.profiles            enable row level security;
alter table public.patients            enable row level security;
alter table public.dentists            enable row level security;
alter table public.availability_slots  enable row level security;
alter table public.appointments        enable row level security;
alter table public.clinical_notes      enable row level security;
alter table public.appointment_events  enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.articles            enable row level security;
alter table public.consents            enable row level security;
alter table public.audit_log           enable row level security;
alter table public.rate_limits         enable row level security;

-- profiles
create policy "own profile read" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "own profile update" on public.profiles
  for update to authenticated using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles p where p.id = auth.uid()));

create policy "admin reads all profiles" on public.profiles
  for select to authenticated using (public.is_admin());

create policy "admin writes profiles" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- A dentist may read a patient's profile ONLY for an appointment assigned to them.
create policy "dentist reads assigned patient" on public.profiles
  for select to authenticated using (
    exists (
      select 1 from public.appointments a
      where a.patient_id = public.profiles.id
        and a.dentist_id = auth.uid()
        and a.status in ('assigned','confirmed','completed','no_show')
    )
  );

-- The `own profile update` policy's with check clause blocks a patient from
-- setting their own role to `admin`. Do not simplify it away.

-- patients
create policy "own patient row" on public.patients
  for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "admin all patients" on public.patients
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "dentist reads assigned patient row" on public.patients
  for select to authenticated using (
    exists (select 1 from public.appointments a
            where a.patient_id = public.patients.profile_id
              and a.dentist_id = auth.uid()
              and a.status in ('assigned','confirmed','completed','no_show'))
  );

-- dentists — no `anon` policy. Anonymous visitors reach dentist data only
-- through public_dentists.
create policy "dentist own row" on public.dentists
  for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "admin all dentists" on public.dentists
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "authenticated reads active dentists" on public.dentists
  for select to authenticated using (status = 'active' and is_public = true);

-- availability_slots
create policy "anyone reads open future slots" on public.availability_slots
  for select to anon, authenticated
  using (status = 'open' and starts_at > now());

create policy "dentist manages own slots" on public.availability_slots
  for all to authenticated
  using (dentist_id = auth.uid()) with check (dentist_id = auth.uid());

create policy "admin manages all slots" on public.availability_slots
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "patient reads own booked slot" on public.availability_slots
  for select to authenticated using (
    exists (select 1 from public.appointments a
            where a.slot_id = public.availability_slots.id and a.patient_id = auth.uid())
  );

-- appointments
create policy "patient own appointments" on public.appointments
  for select to authenticated using (patient_id = auth.uid());

create policy "patient creates own appointment" on public.appointments
  for insert to authenticated with check (patient_id = auth.uid() and status in ('requested','confirmed'));

create policy "patient cancels own appointment" on public.appointments
  for update to authenticated
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

create policy "dentist sees assigned appointments" on public.appointments
  for select to authenticated using (dentist_id = auth.uid());

create policy "dentist updates assigned appointments" on public.appointments
  for update to authenticated using (dentist_id = auth.uid()) with check (dentist_id = auth.uid());

create policy "admin all appointments" on public.appointments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Status-transition legality is enforced server-side in lib/booking.ts
-- (Phase 5), not in RLS. RLS answers *who may touch this row*; the state
-- machine answers *what change is legal*.

-- clinical_notes — patients are absent from this policy set entirely.
create policy "dentist manages own clinical notes" on public.clinical_notes
  for all to authenticated
  using (exists (select 1 from public.appointments a
                 where a.id = clinical_notes.appointment_id and a.dentist_id = auth.uid()))
  with check (exists (select 1 from public.appointments a
                 where a.id = clinical_notes.appointment_id and a.dentist_id = auth.uid()));

create policy "admin all clinical notes" on public.clinical_notes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- appointment_events — readable by anyone who can read the appointment;
-- insert by authenticated; never update or delete.
create policy "read events for visible appointments" on public.appointment_events
  for select to authenticated using (
    exists (select 1 from public.appointments a
            where a.id = appointment_events.appointment_id
              and (a.patient_id = auth.uid() or a.dentist_id = auth.uid() or public.is_admin()))
  );
create policy "insert events" on public.appointment_events
  for insert to authenticated with check (actor_id = auth.uid());
-- No update or delete policy exists, so both are impossible. That is deliberate.

-- contact_submissions
create policy "anyone submits" on public.contact_submissions
  for insert to anon, authenticated with check (true);
create policy "admin reads submissions" on public.contact_submissions
  for select to authenticated using (public.is_admin());
create policy "admin updates submissions" on public.contact_submissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
-- There is no select policy for `anon`. A submitter cannot read submissions
-- back, including their own.

-- articles
create policy "anyone reads published" on public.articles
  for select to anon, authenticated using (status = 'published');
create policy "admin all articles" on public.articles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- consents / audit_log / rate_limits
create policy "own consents read" on public.consents
  for select to authenticated using (subject_type = 'profile' and subject_id = auth.uid());
create policy "insert consent" on public.consents
  for insert to anon, authenticated with check (true);
create policy "own consent withdraw" on public.consents
  for update to authenticated
  using (subject_type = 'profile' and subject_id = auth.uid())
  with check (subject_type = 'profile' and subject_id = auth.uid());
create policy "admin all consents" on public.consents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin reads audit" on public.audit_log
  for select to authenticated using (public.is_admin());
create policy "insert audit" on public.audit_log
  for insert to anon, authenticated with check (true);
-- audit_log has no update or delete policy. rate_limits gets no policy at all
-- — it is touched only by the service role.
