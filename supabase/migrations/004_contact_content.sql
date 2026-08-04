create table public.contact_submissions (
  id                      uuid primary key default gen_random_uuid(),
  reference_code          text unique not null default public.gen_submission_ref(),
  type                    submission_type not null,
  name                    text not null,
  email                   text,
  phone                   text,
  organization_name       text,
  dci_registration_no     text,
  partnership_type        partnership_type,
  message                 text not null,
  status                  submission_status not null default 'new',
  assigned_to             uuid references public.profiles(id),
  admin_notes             text,
  converted_to_profile_id uuid references public.profiles(id),
  source_page             text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint contactable check (email is not null or phone is not null)
);

create index on public.contact_submissions (status, created_at desc);
create index on public.contact_submissions (type, status);

create trigger t_submissions_updated before update on public.contact_submissions
  for each row execute function public.touch_updated_at();

create table public.articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  excerpt      text,
  body_md      text not null,
  cover_path   text,
  category     text not null default 'Prevention',
  status       article_status not null default 'draft',
  published_at timestamptz,
  author_id    uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index on public.articles (status, published_at desc);

create trigger t_articles_updated before update on public.articles
  for each row execute function public.touch_updated_at();

-- Consent is per PURPOSE and versioned. A single global checkbox is not
-- acceptable. Withdrawal must be as easy as granting.
create table public.consents (
  id             uuid primary key default gen_random_uuid(),
  subject_type   text not null check (subject_type in ('profile','submission')),
  subject_id     uuid not null,
  purpose        consent_purpose not null,
  notice_version text not null,
  granted_at     timestamptz not null default now(),
  withdrawn_at   timestamptz,
  method         text not null default 'web_form',
  ip_hash        text
);

create index on public.consents (subject_type, subject_id);

-- Retained 12 months. Every admin READ of patient data is logged, not just writes.
create table public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references public.profiles(id),
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  metadata   jsonb,
  ip_hash    text,
  created_at timestamptz not null default now()
);

create index on public.audit_log (created_at desc);
create index on public.audit_log (actor_id, created_at desc);

-- Simple IP-based rate limiting for public forms. No paid service needed.
create table public.rate_limits (
  key        text not null,
  window_at  timestamptz not null,
  count      int not null default 1,
  primary key (key, window_at)
);
