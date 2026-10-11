-- Team members with roles and per-section permissions, daily tasks, and the clients (CRM) pipeline
-- fed by website forms, WhatsApp and ad campaigns. Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Team: roles and permissions
-- ---------------------------------------------------------------------------
-- owner / admin: everything (including managing users). member: only the sections in `permissions`.
-- Sections: bookings, messages, clients, tasks, content, pricing, marketing, settings.
alter table public.admins
  add column if not exists email text,
  add column if not exists full_name text check (full_name is null or char_length(full_name) <= 120),
  add column if not exists role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  add column if not exists permissions text[] not null default '{}',
  add column if not exists is_active boolean not null default true,
  add column if not exists dashboard_lang text not null default 'ar' check (dashboard_lang in ('ar', 'en')),
  add column if not exists last_sign_in_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

-- Accounts that existed before roles were added as owners (default above); new members start with no sections.
alter table public.admins alter column role set default 'member';
update public.admins a set email = u.email from auth.users u where u.id = a.user_id and a.email is null;

drop trigger if exists admins_updated_at on public.admins;
create trigger admins_updated_at before update on public.admins
  for each row execute function public.set_updated_at();

-- An active team member (any role). Public "published or staff" read rules keep using this.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid() and is_active);
$$;

-- Owner or admin: may manage users and everything else.
create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid() and is_active and role in ('owner', 'admin'));
$$;

-- May the signed-in user work in this dashboard section?
create or replace function public.can(p_section text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where user_id = auth.uid() and is_active and (role in ('owner', 'admin') or p_section = any (permissions))
  );
$$;

grant execute on function public.is_manager() to anon, authenticated;
grant execute on function public.can(text) to anon, authenticated;

-- Team members see each other (names for assignment); changes go through the server (service role).
drop policy if exists "admins read own row" on public.admins;
drop policy if exists "team read" on public.admins;
create policy "team read" on public.admins
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- Per-section write rules on existing tables -------------------------------------------------
drop policy if exists "services admin write" on public.services;
create policy "services admin write" on public.services
  for all to authenticated using (public.can('content')) with check (public.can('content'));
drop policy if exists "projects admin write" on public.projects;
create policy "projects admin write" on public.projects
  for all to authenticated using (public.can('content')) with check (public.can('content'));
drop policy if exists "posts admin write" on public.posts;
create policy "posts admin write" on public.posts
  for all to authenticated using (public.can('content')) with check (public.can('content'));

drop policy if exists "consultations admin read" on public.consultations;
create policy "consultations admin read" on public.consultations
  for select to authenticated using (public.can('bookings') or public.can('clients'));
drop policy if exists "consultations admin update" on public.consultations;
create policy "consultations admin update" on public.consultations
  for update to authenticated using (public.can('bookings')) with check (public.can('bookings'));
drop policy if exists "consultations admin delete" on public.consultations;
create policy "consultations admin delete" on public.consultations
  for delete to authenticated using (public.can('bookings'));

drop policy if exists "messages admin read" on public.messages;
create policy "messages admin read" on public.messages
  for select to authenticated using (public.can('messages') or public.can('clients'));
drop policy if exists "messages admin update" on public.messages;
create policy "messages admin update" on public.messages
  for update to authenticated using (public.can('messages')) with check (public.can('messages'));
drop policy if exists "messages admin delete" on public.messages;
create policy "messages admin delete" on public.messages
  for delete to authenticated using (public.can('messages'));

drop policy if exists "site settings admin write" on public.site_settings;
create policy "site settings admin write" on public.site_settings
  for all to authenticated using (public.can('settings')) with check (public.can('settings'));
drop policy if exists "private settings admin" on public.private_settings;
create policy "private settings admin" on public.private_settings
  for all to authenticated using (public.can('settings')) with check (public.can('settings'));
drop policy if exists "blocked dates admin write" on public.blocked_dates;
create policy "blocked dates admin write" on public.blocked_dates
  for all to authenticated using (public.can('settings') or public.can('bookings')) with check (public.can('settings') or public.can('bookings'));
drop policy if exists "packages admin write" on public.packages;
create policy "packages admin write" on public.packages
  for all to authenticated using (public.can('pricing')) with check (public.can('pricing'));
drop policy if exists "email log admin read" on public.email_log;
create policy "email log admin read" on public.email_log
  for select to authenticated using (public.can('settings'));
drop policy if exists "email log admin delete" on public.email_log;
create policy "email log admin delete" on public.email_log
  for delete to authenticated using (public.can('settings'));

drop policy if exists "meta connection admin" on public.meta_connection;
create policy "meta connection admin" on public.meta_connection
  for all to authenticated using (public.can('marketing')) with check (public.can('marketing'));
drop policy if exists "ad campaigns admin" on public.ad_campaigns;
create policy "ad campaigns admin" on public.ad_campaigns
  for all to authenticated using (public.can('marketing')) with check (public.can('marketing'));

-- ---------------------------------------------------------------------------
-- Clients (CRM)
-- ---------------------------------------------------------------------------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text check (phone is null or char_length(phone) <= 30),
  phone_norm text,                     -- digits only, with country code
  wa_id text,                          -- WhatsApp id (usually = phone_norm)
  email text check (email is null or char_length(email) <= 200),
  company text check (company is null or char_length(company) <= 160),
  source text not null default 'manual'
    check (source in ('website', 'booking', 'contact_form', 'whatsapp', 'meta_ads', 'meta_lead_form', 'google_ads', 'instagram', 'referral', 'manual', 'other')),
  campaign text check (campaign is null or char_length(campaign) <= 200),
  utm jsonb not null default '{}',     -- utm_*, gclid, fbclid, ad ids, landing page
  stage text not null default 'new' check (stage in ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  value numeric(12, 2) check (value is null or value >= 0),
  service_slug text,
  tags text[] not null default '{}',
  notes text check (notes is null or char_length(notes) <= 4000),
  assignee_id uuid references public.admins (user_id) on delete set null,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists contacts_phone_uniq on public.contacts (phone_norm) where phone_norm is not null;
create unique index if not exists contacts_wa_uniq on public.contacts (wa_id) where wa_id is not null;
create index if not exists contacts_email_idx on public.contacts (lower(email));
create index if not exists contacts_stage_idx on public.contacts (stage, last_activity_at desc);
create index if not exists contacts_activity_idx on public.contacts (last_activity_at desc);

create table if not exists public.contact_activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  kind text not null
    check (kind in ('note', 'call', 'whatsapp_in', 'whatsapp_out', 'email', 'meeting', 'booking', 'message', 'lead', 'stage', 'task')),
  body text check (body is null or char_length(body) <= 4000),
  meta jsonb not null default '{}',
  external_id text,                    -- WhatsApp message id, Meta lead id… (dedupes webhook retries)
  author_id uuid references public.admins (user_id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists contact_activities_external_uniq on public.contact_activities (external_id) where external_id is not null;
create index if not exists contact_activities_contact_idx on public.contact_activities (contact_id, created_at desc);

drop trigger if exists contacts_updated_at on public.contacts;
create trigger contacts_updated_at before update on public.contacts
  for each row execute function public.set_updated_at();

alter table public.contacts enable row level security;
alter table public.contact_activities enable row level security;
drop policy if exists "contacts team" on public.contacts;
create policy "contacts team" on public.contacts
  for all to authenticated using (public.can('clients')) with check (public.can('clients'));
drop policy if exists "contact activities team" on public.contact_activities;
create policy "contact activities team" on public.contact_activities
  for all to authenticated using (public.can('clients')) with check (public.can('clients'));

-- Website leads remember which campaign brought them.
alter table public.consultations
  add column if not exists contact_id uuid references public.contacts (id) on delete set null,
  add column if not exists utm jsonb not null default '{}';
alter table public.messages
  add column if not exists contact_id uuid references public.contacts (id) on delete set null,
  add column if not exists utm jsonb not null default '{}';

alter table public.meta_connection
  add column if not exists leads_synced_at timestamptz;

-- Digits only with the country code; 8-digit numbers are treated as Omani.
create or replace function public.normalize_phone(p text)
returns text
language sql
immutable
as $$
  select case
    when d is null or d = '' then null
    when length(d) = 8 then '968' || d
    else d
  end
  from (select regexp_replace(regexp_replace(coalesce(p, ''), '\D', '', 'g'), '^00', '') as d) s;
$$;

-- Where a lead came from, judged by its tracking parameters.
create or replace function public.lead_source(p_utm jsonb, p_fallback text)
returns text
language sql
immutable
as $$
  select case
    when p_utm ? 'ctwa_clid' or p_utm ? 'ad_id' and p_fallback = 'whatsapp' then 'meta_ads'
    when p_utm ? 'gclid' or p_utm ? 'gbraid' or p_utm ? 'wbraid' or lower(coalesce(p_utm ->> 'utm_source', '')) in ('google', 'googleads', 'adwords') then 'google_ads'
    when p_utm ? 'fbclid' or lower(coalesce(p_utm ->> 'utm_source', '')) in ('facebook', 'fb', 'instagram', 'ig', 'meta') then 'meta_ads'
    else p_fallback
  end;
$$;

-- One entry point for every lead: finds the client by WhatsApp id, phone or email (or creates one),
-- fills missing details, logs the activity and, when enabled, opens a follow-up task.
create or replace function public.ingest_lead(
  p_name text,
  p_phone text,
  p_email text,
  p_company text,
  p_source text,
  p_utm jsonb,
  p_service text,
  p_kind text,
  p_body text,
  p_external_id text default null,
  p_wa_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_phone text := public.normalize_phone(p_phone);
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_utm jsonb := coalesce(p_utm, '{}');
  v_source text := public.lead_source(coalesce(p_utm, '{}'), p_source);
  v_campaign text := coalesce(v_utm ->> 'campaign_name', v_utm ->> 'utm_campaign', v_utm ->> 'headline');
  v_new boolean := false;
  v_auto boolean;
begin
  if p_external_id is not null then
    select contact_id into v_id from public.contact_activities where external_id = p_external_id;
    if found then return v_id; end if;
  end if;

  select id into v_id from public.contacts
  where (p_wa_id is not null and wa_id = p_wa_id)
     or (v_phone is not null and phone_norm = v_phone)
     or (v_email is not null and lower(email) = v_email)
  order by (p_wa_id is not null and wa_id = p_wa_id) desc, (phone_norm = v_phone) desc nulls last
  limit 1;

  if v_id is null then
    insert into public.contacts (full_name, phone, phone_norm, wa_id, email, company, source, campaign, utm, service_slug)
    values (
      left(coalesce(nullif(trim(p_name), ''), p_phone, v_email, 'عميل'), 120),
      left(p_phone, 30), v_phone, p_wa_id, left(v_email, 200), left(nullif(trim(coalesce(p_company, '')), ''), 160),
      v_source, left(v_campaign, 200), v_utm, p_service
    )
    returning id into v_id;
    v_new := true;
  else
    update public.contacts set
      full_name = case when full_name ~ '^[0-9+ ]+$' and nullif(trim(p_name), '') is not null then left(trim(p_name), 120) else full_name end,
      phone = coalesce(phone, left(p_phone, 30)),
      phone_norm = coalesce(phone_norm, v_phone),
      wa_id = coalesce(wa_id, p_wa_id),
      email = coalesce(email, left(v_email, 200)),
      company = coalesce(company, left(nullif(trim(coalesce(p_company, '')), ''), 160)),
      service_slug = coalesce(service_slug, p_service),
      campaign = coalesce(campaign, left(v_campaign, 200)),
      utm = case when utm = '{}'::jsonb then v_utm else utm end,
      stage = case when stage = 'lost' then 'new' else stage end,
      last_activity_at = now()
    where id = v_id;
  end if;

  insert into public.contact_activities (contact_id, kind, body, meta, external_id)
  values (v_id, p_kind, left(p_body, 4000), v_utm, p_external_id)
  on conflict do nothing;

  select coalesce((value ->> 'auto_followup')::boolean, true) into v_auto from public.site_settings where key = 'crm';
  if v_new and coalesce(v_auto, true) then
    insert into public.tasks (title, due_date, priority, contact_id, source)
    values (left('تواصل مع ' || coalesce(nullif(trim(p_name), ''), p_phone, 'العميل الجديد'), 200), (now() at time zone 'Asia/Muscat')::date, 'high', v_id, 'auto');
  end if;

  return v_id;
end;
$$;

revoke all on function public.ingest_lead(text, text, text, text, text, jsonb, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.ingest_lead(text, text, text, text, text, jsonb, text, text, text, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  notes text check (notes is null or char_length(notes) <= 4000),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  due_date date,
  due_time time,
  recurrence text not null default 'none' check (recurrence in ('none', 'daily', 'weekdays', 'weekly', 'monthly')),
  assignee_id uuid references public.admins (user_id) on delete set null,
  created_by uuid references public.admins (user_id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  consultation_id uuid references public.consultations (id) on delete set null,
  source text not null default 'manual' check (source in ('manual', 'auto')),
  position double precision not null default extract(epoch from now()),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_due_idx on public.tasks (status, due_date, due_time);
create index if not exists tasks_assignee_idx on public.tasks (assignee_id, status);

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;
-- Everyone on the team sees and works on their own tasks; the "tasks" permission manages all of them.
drop policy if exists "tasks team" on public.tasks;
create policy "tasks team" on public.tasks
  for all to authenticated
  using (public.can('tasks') or (public.is_admin() and (assignee_id = auth.uid() or created_by = auth.uid())))
  with check (public.can('tasks') or (public.is_admin() and (assignee_id = auth.uid() or created_by = auth.uid())));

-- ---------------------------------------------------------------------------
-- Website forms become clients automatically (works for every insert path).
-- ---------------------------------------------------------------------------
create or replace function public.consultation_to_contact()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.contact_id := public.ingest_lead(
    new.full_name, new.phone, new.email, new.company, 'booking', new.utm, new.service_slug, 'booking',
    'حجز استشارة: ' || to_char(new.scheduled_date, 'YYYY-MM-DD') || ' ' || to_char(new.scheduled_time, 'HH24:MI')
      || coalesce(E'\n' || new.message, ''),
    'consultation:' || new.id
  );
  return new;
end;
$$;

drop trigger if exists consultations_contact on public.consultations;
create trigger consultations_contact before insert on public.consultations
  for each row execute function public.consultation_to_contact();

create or replace function public.message_to_contact()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.contact_id := public.ingest_lead(
    new.full_name, new.phone, new.email, null, 'contact_form', new.utm, null, 'message',
    coalesce(new.subject || E'\n', '') || new.body,
    'message:' || new.id
  );
  return new;
end;
$$;

drop trigger if exists messages_contact on public.messages;
create trigger messages_contact before insert on public.messages
  for each row execute function public.message_to_contact();

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------
insert into public.site_settings (key, value) values ('crm', '{"auto_followup": true}')
on conflict (key) do nothing;

-- WhatsApp Cloud API (server-only): phone_number_id, access_token, verify_token, app_secret.
insert into public.private_settings (key, value)
values ('whatsapp', jsonb_build_object('phone_number_id', '', 'business_account_id', '', 'access_token', '', 'app_secret', '', 'verify_token', replace(gen_random_uuid()::text, '-', '')))
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Backfill: existing bookings and messages become clients (no follow-up tasks for old leads).
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  v_auto jsonb;
begin
  select value into v_auto from public.site_settings where key = 'crm';
  update public.site_settings set value = value || '{"auto_followup": false}' where key = 'crm';

  for r in select * from public.consultations where contact_id is null order by created_at loop
    update public.consultations set contact_id = public.ingest_lead(
      r.full_name, r.phone, r.email, r.company, 'booking', r.utm, r.service_slug, 'booking',
      'حجز استشارة: ' || to_char(r.scheduled_date, 'YYYY-MM-DD') || ' ' || to_char(r.scheduled_time, 'HH24:MI'),
      'consultation:' || r.id
    ) where id = r.id;
  end loop;
  for r in select * from public.messages where contact_id is null order by created_at loop
    update public.messages set contact_id = public.ingest_lead(
      r.full_name, r.phone, r.email, null, 'contact_form', r.utm, null, 'message',
      coalesce(r.subject || E'\n', '') || r.body, 'message:' || r.id
    ) where id = r.id;
  end loop;

  update public.site_settings set value = v_auto where key = 'crm';
end $$;

-- Each team member picks their dashboard language without being able to touch their role.
create or replace function public.set_dashboard_lang(p_lang text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.admins set dashboard_lang = p_lang where user_id = auth.uid() and p_lang in ('ar', 'en');
$$;
revoke all on function public.set_dashboard_lang(text) from public, anon;
grant execute on function public.set_dashboard_lang(text) to authenticated;
