-- Seed data for local and staging environments. No fake impact statistics —
-- everything here is realistic placeholder data unless it is a person or
-- clinic placeholder.
--
-- Runs after all migrations. People are created via auth.users so the
-- on_auth_user_created trigger builds profiles the same way real signups do.

-- ── People: 1 admin, 4 dentists, 3 patients ────────────────────────────────
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'den.seelampur@example.com', 'x',
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Farah Khan"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'den.shahdara@example.com', 'x',
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Vikram Malhotra"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'den.trilokpuri@example.com', 'x',
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Amandeep Kaur"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000004',
   'authenticated', 'authenticated', 'den.karolbagh@example.com', 'x',
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Rohit Verma"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000101',
   'authenticated', 'authenticated', 'pat.seelampur@example.com', 'x',
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sana Ansari"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000102',
   'authenticated', 'authenticated', 'pat.shahdara@example.com', 'x',
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ravi Kumar"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000103',
   'authenticated', 'authenticated', 'pat.trilokpuri@example.com', 'x',
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Meena Devi"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000900',
   'authenticated', 'authenticated', 'admin@smile-please.example', 'x',
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Aisha Verma"}', now(), now());

-- The trigger made every new user a patient. Dentists get their role moved,
-- their stray patients rows removed, and their dentist record inserted.
update public.profiles
set role = 'dentist',
    phone = case id
      when '10000000-0000-0000-0000-000000000001' then '+919876500001'
      when '10000000-0000-0000-0000-000000000002' then '+919876500002'
      when '10000000-0000-0000-0000-000000000003' then '+919876500003'
      when '10000000-0000-0000-0000-000000000004' then '+919876500004'
    end
where id in (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000004'
);

delete from public.patients
where profile_id in (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000004'
);

-- The admin is created via SQL only — there is no admin signup route anywhere
-- (Master §2). The trigger made this user a patient first; move the role and
-- drop the stray patients row.
update public.profiles
set role = 'admin'
where id = '10000000-0000-0000-0000-000000000900';

delete from public.patients
where profile_id = '10000000-0000-0000-0000-000000000900';

update public.profiles
set phone = case id
  when '10000000-0000-0000-0000-000000000101' then '+919812345601'
  when '10000000-0000-0000-0000-000000000102' then '+919812345602'
  when '10000000-0000-0000-0000-000000000103' then '+919812345603'
end
where id in (
  '10000000-0000-0000-0000-000000000101',
  '10000000-0000-0000-0000-000000000102',
  '10000000-0000-0000-0000-000000000103'
);

-- The signup trigger already created each patient's `patients` row (bare,
-- with no details) — fill them in rather than inserting again.
update public.patients
set age_band = (case profile_id
      when '10000000-0000-0000-0000-000000000101' then '18_39'
      when '10000000-0000-0000-0000-000000000102' then '40_59'
      when '10000000-0000-0000-0000-000000000103' then '60_plus'
    end)::age_band,
    locality = case profile_id
      when '10000000-0000-0000-0000-000000000101' then 'Seelampur'
      when '10000000-0000-0000-0000-000000000102' then 'Shahdara'
      when '10000000-0000-0000-0000-000000000103' then 'Trilokpuri'
    end,
    pincode = case profile_id
      when '10000000-0000-0000-0000-000000000101' then '110053'
      when '10000000-0000-0000-0000-000000000102' then '110032'
      when '10000000-0000-0000-0000-000000000103' then '110091'
    end
where profile_id in (
  '10000000-0000-0000-0000-000000000101',
  '10000000-0000-0000-0000-000000000102',
  '10000000-0000-0000-0000-000000000103'
);

-- ── Dentists ───────────────────────────────────────────────────────────────
insert into public.dentists
  (profile_id, slug, display_name, dci_registration_no, dci_verified_at,
   clinic_name, address_line, locality, city, pincode,
   specialties, languages, bio, status, is_public, approved_at)
values
  ('10000000-0000-0000-0000-000000000001', 'farah-khan-seelampur', 'Dr. Farah Khan',
   'DCI-DEL-48213', now() - interval '40 days',
   'Meher Dental Clinic', 'Shop 12, Chatta Lal Miya, Main Bazaar', 'Seelampur', 'New Delhi', '110053',
   array['General dentistry','Paediatric care'], array['Hindi','English'],
   'Farah has treated families around Seelampur station for over a decade. She keeps appointments unhurried and explains every step before she starts, so children and nervous adults know what is coming.',
   'active', true, now() - interval '38 days'),
  ('10000000-0000-0000-0000-000000000002', 'vikram-malhotra-shahdara', 'Dr. Vikram Malhotra',
   'DCI-DEL-39102', now() - interval '60 days',
   'Malhotra Dental Care', 'First floor, 44, East Azad Nagar', 'Shahdara', 'New Delhi', '110032',
   array['General dentistry','Extractions'], array['Hindi','English'],
   'Vikram runs a busy clinic near Azad Nagar metro and reserves a fixed number of free slots every week. He is calm with people in pain and honest about what can wait and what cannot.',
   'active', true, now() - interval '55 days'),
  ('10000000-0000-0000-0000-000000000003', 'amandeep-kaur-trilokpuri', 'Dr. Amandeep Kaur',
   'DCI-DEL-51087', now() - interval '25 days',
   'Kaur Dental Clinic', 'Plot 8, Block 21, Trilokpuri', 'Trilokpuri', 'New Delhi', '110091',
   array['General dentistry','Gum care','Preventive care'], array['Hindi','English','Punjabi'],
   'Amandeep grew up in East Delhi and works mostly on prevention — cleanings, fillings before they turn into root canals, and teaching families how to brush properly. She speaks fluent Punjabi, Hindi and English.',
   'active', true, now() - interval '22 days'),
  ('10000000-0000-0000-0000-000000000004', 'rohit-verma-karol-bagh', 'Dr. Rohit Verma',
   'DCI-DEL-33764', now() - interval '70 days',
   'Verma Dental Centre', '18/4, WEA, Karol Bagh', 'Karol Bagh', 'New Delhi', '110005',
   array['General dentistry','Children','Restorative care'], array['Hindi','English'],
   'Rohit has run free Saturday camps in West Delhi schools for years and brings the same care to his clinic. He is patient with children and precise with timid adults.',
   'active', true, now() - interval '65 days');

-- ── Availability slots ─────────────────────────────────────────────────────
-- 60 slots: 4 dentists x 15, weekdays only, over the next 14 days (Kolkata
-- calendar). Each dentist gets about two to three weekdays; one session per
-- day (morning 10:00-13:00 or evening 16:00-19:00 IST), 30 minutes each.
-- Pure date arithmetic — no overlaps possible, and slots_no_overlap would
-- reject the seed loudly if there were.
with ist_today as (
  select (now() at time zone 'Asia/Kolkata')::date as today
),
weekdays as (
  select day::date as day, extract(isodow from day::date)::int as dow,
         row_number() over (order by day) - 1 as rank
  from ist_today t
  cross join lateral generate_series(t.today, t.today + 13, interval '1 day') as day
  where extract(isodow from day::date) < 6
),
dn as (
  select profile_id, slug, row_number() over (order by locality, slug) as rn
  from public.dentists
),
dentist_days as (
  select dn.profile_id, dn.slug, w.day, w.rank
  from dn
  join weekdays w on (w.rank % 4) = (dn.rn % 4)
),
slots as (
  select dd.profile_id as dentist_id,
         (dd.day + time '10:00' + (n * interval '30 minutes'))
           at time zone 'Asia/Kolkata' as starts_at,
         (dd.day + time '10:00' + ((n + 1) * interval '30 minutes'))
           at time zone 'Asia/Kolkata' as ends_at
  from dentist_days dd
  cross join lateral generate_series(0, 5) as n
  where (dd.rank + 
         (select rn from dn where dn.profile_id = dd.profile_id)) % 2 = 0
  union all
  select dd.profile_id as dentist_id,
         (dd.day + time '16:00' + (n * interval '30 minutes'))
           at time zone 'Asia/Kolkata' as starts_at,
         (dd.day + time '16:00' + ((n + 1) * interval '30 minutes'))
           at time zone 'Asia/Kolkata' as ends_at
  from dentist_days dd
  cross join lateral generate_series(0, 5) as n
  where (dd.rank + 
         (select rn from dn where dn.profile_id = dd.profile_id)) % 2 = 1
)
insert into public.availability_slots (dentist_id, starts_at, ends_at, created_by)
select dentist_id, starts_at, ends_at, dentist_id
from slots;

-- ── Appointments ───────────────────────────────────────────────────────────
-- Patient 1: requested, no slot yet.
insert into public.appointments
  (patient_id, source, status, reason_category, patient_note, preferred_locality, created_at)
values (
  '10000000-0000-0000-0000-000000000101', 'patient_request', 'requested',
  'pain', 'Pain in the lower right side for about a month, worse when eating.',
  'Seelampur', now() - interval '3 days'
);

-- Patient 2: assigned to a slot with Dr. Malhotra (Shahdara).
with target_slot as (
  select s.id, s.starts_at
  from public.availability_slots s
  where s.dentist_id = '10000000-0000-0000-0000-000000000002'
  order by s.starts_at limit 1
)
insert into public.appointments
  (patient_id, dentist_id, slot_id, source, status, reason_category,
   patient_note, scheduled_for, created_at)
select
  '10000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000002',
  t.id, 'self_booked', 'assigned', 'checkup',
  'Haven''t had a check-up in years, just want everything looked at.',
  t.starts_at, now() - interval '2 days'
from target_slot t;

-- Patient 3: confirmed on a slot with Dr. Kaur (Trilokpuri).
with target_slot as (
  select s.id, s.starts_at
  from public.availability_slots s
  where s.dentist_id = '10000000-0000-0000-0000-000000000003'
  order by s.starts_at limit 1
)
insert into public.appointments
  (patient_id, dentist_id, slot_id, source, status, reason_category,
   patient_note, scheduled_for, created_at)
select
  '10000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000003',
  t.id, 'self_booked', 'confirmed', 'cleaning',
  'Wants a cleaning and advice about dentures.', t.starts_at, now() - interval '1 day'
from target_slot t;

-- Mark the two assigned/confirmed slots as taken.
update public.availability_slots
set booked_count = 1
where id in (select slot_id from public.appointments where slot_id is not null);

-- ── Contact submissions ────────────────────────────────────────────────────
insert into public.contact_submissions
  (type, name, email, phone, organization_name, dci_registration_no,
   partnership_type, message, status, source_page, created_at)
values
  ('patient', 'Rekha Sharma', null, '+919876543210', null, null, null,
   'My mother is 72 and her denture is hurting her. Can you arrange a check-up near Shahdara? We can come any weekday morning.',
   'new', '/contact', now() - interval '5 days'),
  ('patient', 'Imran Qureshi', 'imran.q@example.com', '+919650011223', null, null, null,
   'My son is 6 and refuses to open his mouth for any dentist. Is there a dentist who is good with children? We live in Seelampur.',
   'in_review', '/contact', now() - interval '2 days'),
  ('dentist', 'Dr. Neha Batra', 'neha.batra@example.com', null, 'Batra Dental Studio',
   'DCI-DEL-55210', null,
   'I have a two-chair clinic in Karol Bagh with free capacity on Tuesday afternoons. Happy to host Smile Please sessions or see referred patients.',
   'contacted', '/contact', now() - interval '4 days'),
  ('dentist', 'Dr. Suresh Rao', null, '+919810022334', 'Rao Dental Clinic', null, null,
   'New clinic in Nand Nagri, just opened. I would like to join the free-care network. How does onboarding work?',
   'new', '/care', now() - interval '1 day'),
  ('organization', 'Anita Chawla', 'anita@seelampurcentre.example', '+919811122233',
   'Seelampur Community Centre', null, 'camp_host',
   'We run an evening study centre for 80 children in Seelampur. Could Smile Please run a dental awareness session and a basic check-up camp here once a month?',
   'resolved', '/contact', now() - interval '6 days');

-- ── Articles ───────────────────────────────────────────────────────────────
insert into public.articles
  (slug, title, excerpt, body_md, category, status, published_at, created_at)
values
  ('how-to-brush-properly', 'How to brush so it actually works',
   'Most people brush every day and still get cavities. The problem is usually not how often — it is how.',
   '## How to brush so it actually works

Brushing is a habit almost everyone has and almost everyone does too quickly. If you are reading this and brushing for under two minutes, fix that first. Two minutes feels long. Set a timer for two weeks and it stops feeling long.

### The angle matters

Hold the brush at 45 degrees against the gum line, not flat against the teeth. The bristles should reach the small pocket where the tooth meets the gum — that is where plaque hides and where cavities and gum disease start. Angle the bristles up for the upper teeth and down for the lower teeth.

### Small circles, not sawing

Move the brush in small circular motions, a few teeth at a time. Do not scrub back and forth like you are cleaning a floor. Scrubbing wears the enamel away at the gum line, and damaged enamel does not grow back. Ten gentle circles per spot beats thirty harsh strokes.

### You are missing the back

The backs of the last molars are the most missed surface in the mouth. Tilt the brush vertically to reach them, and give the inside of your front teeth the same attention you give the outside. Do not forget the tongue — a few gentle strokes keep your breath fresher and remove bacteria.

### The two-minute split

Divide your mouth into four quarters and give each quarter thirty seconds: top right, top left, bottom right, bottom left. If you always start at the same corner and follow the same order, the habit builds itself.

### When and how often

Twice a day — once after breakfast and once before bed — with a soft brush and toothpaste with fluoride. Change the brush when the bristles splay, about every three months, and after a cold or flu.

Two minutes, twice a day, soft brush, 45 degrees. That is the whole lesson, and it is the same advice we give every patient who walks in.',
   'Prevention', 'published', now() - interval '9 days', now() - interval '10 days'),

  ('gums-bleeding-when-brushing', 'Gums that bleed when you brush: what is happening',
   'Blood in the sink is common, and it is usually a warning, not a crisis. Here is what it means and when to worry.',
   '## Gums that bleed when you brush: what is happening

Seeing pink in the sink is unnerving, but it is one of the most common things dentists hear about. The short version: bleeding gums usually mean inflammation, and inflammation almost always means plaque has been sitting at the gum line. The good news is that the fix is gentle and it works.

### What is actually happening

Plaque is a thin, sticky film of bacteria that forms on teeth within hours of brushing. Left in place, it irritates the gums, and irritated gums swell, redden, and bleed easily. This early stage is called gingivitis, and it is reversible.

### What not to do

Two common mistakes make it worse.

Do not brush harder. Brush with a firm but soft touch; pressing harder makes your gums bleed more and scrubs away enamel at the gum line. The bleeding is not because you are not scrubbing enough — it is because plaque sits right at the gum line.

Do not stop brushing the sore spot. The area needs cleaning, not rest. What it does not need is harsh scrubbing — soft pressure, correct angle.

### What to do instead

Brush twice a day with a soft brush, using small circular motions at the gum line, exactly as described in our brushing article. Floss once a day — the string must slide gently below the gum line, never snap down onto it. Within a week or two, healthy gums stop bleeding. It is one of the most satisfying fixes in dentistry because you can feel it working.

### When to see a dentist

Bleeding that lasts longer than two weeks of correct brushing and flossing, gums that pull away from the teeth, loose teeth, or pain when chewing deserve a professional look. The dentist will check for tartar below the gum line — brushing cannot remove it once it hardens. A cleaning appointment fixes that.

### About the blood itself

A little blood during brushing is not an emergency. A mouthful of blood, bleeding that will not stop, or bleeding with swelling that grows over a day or two: get help the same day. Smile Please clinics see gum problems at every appointment, and a check-up is the right first step.',
   'Gum health', 'published', now() - interval '7 days', now() - interval '8 days'),

  ('children-first-dental-visit', 'Your child''s first dental visit: what to expect',
   'The first visit does not have to be scary. Do it early, keep it boring, and let the dentist do the talking.',
   '## Your child''s first dental visit: what to expect

Most parents bring a child to the dentist for the first time only when something hurts. That is the hardest possible time to start. Bring them early, when nothing is wrong, and the dentist becomes a normal part of life — like a haircut, not like a hospital.

### When to come

The rule of thumb is: the first visit by the first birthday, or within six months of the first tooth, whichever comes first. If your child is older and has never been, do not wait for a problem — come now. A check-up with no pain is the whole point.

### What happens

A first visit is short and boring on purpose. The dentist counts the teeth, looks gently at the gums and the bite, and answers your questions. There is no drilling, no filling, nothing sharp near the mouth. Most children sit on a parent''s lap. If the child is upset, the dentist stops and tries again in a few minutes — or on another day. That is normal and encouraged.

### How to prepare at home

Talk about the visit in plain words the day before: "A friendly doctor will count your teeth and we will go home." Do not build it up with treats, do not use words like pain, needle, or drill, and do not threaten a clinic visit as punishment. If you are nervous, breathe — children read your face before they listen to your words.

### What the dentist is looking for

Early decay (especially from bottles and sweet drinks at night), the way jaws are growing, and habits like thumb-sucking that may need gentle attention later. Finding these at three or four means fixing them with a conversation instead of a procedure.

### The habit that matters most

From the first tooth, wipe or brush it twice a day. From age two, use a pea-sized amount of fluoride toothpaste and teach the child to spit. Sugar in the bottle at night is the single biggest cause of decay in young children — water only, once teeth exist.

Keep the visit routine. Twice a year, no drama, and dentistry becomes something your child expects, not fears.',
   'Children', 'published', now() - interval '5 days', now() - interval '6 days'),

  ('what-happens-at-a-camp', 'What happens at a Smile Please camp',
   'A camp is a free dental clinic that sets up in a school, community centre or gurdwara for a day. Here is what actually happens.',
   '## What happens at a Smile Please camp

A camp is a free dental clinic that sets up wherever people already gather: a school hall, a community centre, a gurdwara, a local club. By the evening it is gone. In one day we see hundreds of people who would not otherwise reach a dentist, and we leave the community with the same tools it needs to keep going.

### Before the camp

We work with a local host — the school principal or the centre manager — to pick a date and spread the word. The host chooses the space; we bring the equipment: portable chairs, lights, sterilization, instruments, and supplies. Everything fits in a few cars.

### When you arrive

You register with your name, your locality, and your age band. No street address, no documents needed. You wait your turn, and while you wait, a volunteer talks through brushing and warning signs in plain language. Tea is served. It is meant to feel like a community event, because it is one.

### At the chair

The dentist does a full check-up: teeth, gums, and anything that looks unusual. Most people get advice — a better brushing technique, flossing, a note about a filling that can wait. Some get treatment on the spot: scaling, fillings, fluoride, an extraction when a tooth is beyond saving. Every procedure is explained before it starts, and the dentist stops the moment you ask.

### A problem we cannot fix here

Some things need a clinic and more time: root canals, dentures, deeper surgery. When that happens, the dentist writes a referral with a name and a phone number — and Smile Please clinics offer free or near-free follow-up for the patients who need it. Nobody is handed a problem and sent away.

### After the camp

We count, we report, and we empty the bins. The host keeps a set of posters, and children leave with a toothbrush and paste plus a card that says when to visit a dentist next.

Camps run because clinics, schools, and individuals reach out to us. If you want one in your neighbourhood, write to us — you do not need to be a dentist to host one.',
   'Camps', 'published', now() - interval '3 days', now() - interval '4 days');
