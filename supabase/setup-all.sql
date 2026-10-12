-- Bariq: full database setup for a new Supabase project (migrations 0001–0006 + seed).
-- Paste this whole file into Supabase → SQL Editor → Run. Safe to run more than once.

-- ========== supabase/migrations/0001_init.sql ==========
-- Bariq website: schema, security policies and storage.
-- Run once in the Supabase SQL editor (or `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admins read own row" on public.admins;
create policy "admins read own row" on public.admins
  for select to authenticated using (user_id = auth.uid());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 120),
  summary text not null default '',
  description text not null default '',
  icon text not null default 'sparkles',
  image_url text,
  features text[] not null default '{}',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Portfolio projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 160),
  client text,
  service_id uuid references public.services (id) on delete set null,
  summary text not null default '',
  description text not null default '',
  cover_url text,
  link_url text,
  tags text[] not null default '{}',
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_service_idx on public.projects (service_id);

-- ---------------------------------------------------------------------------
-- Blog posts
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 200),
  excerpt text not null default '',
  content text not null default '',
  cover_url text,
  category text,
  author_name text not null default 'فريق بريق',
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_published_idx on public.posts (is_published, published_at desc);

-- ---------------------------------------------------------------------------
-- Consultation bookings
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.consultation_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null check (char_length(phone) between 6 and 30),
  email text check (email is null or char_length(email) <= 200),
  company text check (company is null or char_length(company) <= 160),
  service_slug text,
  channel text not null default 'online' check (channel in ('online', 'phone', 'office')),
  scheduled_date date not null,
  scheduled_time time not null,
  message text check (message is null or char_length(message) <= 2000),
  status public.consultation_status not null default 'pending',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One active booking per slot.
create unique index if not exists consultations_active_slot_uniq
  on public.consultations (scheduled_date, scheduled_time)
  where status in ('pending', 'confirmed');

create index if not exists consultations_date_idx on public.consultations (scheduled_date, scheduled_time);

-- Lets the public booking form grey out taken slots without exposing anyone's details.
create or replace function public.booked_slots(p_date date)
returns setof time
language sql
stable
security definer
set search_path = public
as $$
  select scheduled_time from public.consultations
  where scheduled_date = p_date and status in ('pending', 'confirmed');
$$;

grant execute on function public.booked_slots(date) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Contact messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text check (email is null or char_length(email) <= 200),
  phone text check (phone is null or char_length(phone) <= 30),
  subject text check (subject is null or char_length(subject) <= 200),
  body text not null check (char_length(body) between 5 and 4000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
drop trigger if exists services_updated_at on public.services;
create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();
drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at before update on public.posts
  for each row execute function public.set_updated_at();
drop trigger if exists consultations_updated_at on public.consultations;
create trigger consultations_updated_at before update on public.consultations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.services enable row level security;
alter table public.projects enable row level security;
alter table public.posts enable row level security;
alter table public.consultations enable row level security;
alter table public.messages enable row level security;

-- Public content: everyone reads published rows, admins do everything.
drop policy if exists "services public read" on public.services;
create policy "services public read" on public.services
  for select to anon, authenticated using (is_published or public.is_admin());
drop policy if exists "services admin write" on public.services;
create policy "services admin write" on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "projects public read" on public.projects;
create policy "projects public read" on public.projects
  for select to anon, authenticated using (is_published or public.is_admin());
drop policy if exists "projects admin write" on public.projects;
create policy "projects admin write" on public.projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "posts public read" on public.posts;
create policy "posts public read" on public.posts
  for select to anon, authenticated using (is_published or public.is_admin());
drop policy if exists "posts admin write" on public.posts;
create policy "posts admin write" on public.posts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Visitors may create bookings and messages, never read them.
drop policy if exists "consultations public insert" on public.consultations;
create policy "consultations public insert" on public.consultations
  for insert to anon, authenticated
  with check (status = 'pending' and admin_notes is null and scheduled_date >= current_date);
drop policy if exists "consultations admin read" on public.consultations;
create policy "consultations admin read" on public.consultations
  for select to authenticated using (public.is_admin());
drop policy if exists "consultations admin update" on public.consultations;
create policy "consultations admin update" on public.consultations
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "consultations admin delete" on public.consultations;
create policy "consultations admin delete" on public.consultations
  for delete to authenticated using (public.is_admin());

drop policy if exists "messages public insert" on public.messages;
create policy "messages public insert" on public.messages
  for insert to anon, authenticated with check (is_read = false);
drop policy if exists "messages admin read" on public.messages;
create policy "messages admin read" on public.messages
  for select to authenticated using (public.is_admin());
drop policy if exists "messages admin update" on public.messages;
create policy "messages admin update" on public.messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "messages admin delete" on public.messages;
create policy "messages admin delete" on public.messages
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: public "media" bucket for covers and images, admin-only writes
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');
drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- ========== supabase/migrations/0002_english_content.sql ==========
-- English versions of site content. Arabic stays the primary (required) language;
-- English columns are optional and the site falls back to Arabic when they're empty.

alter table public.services
  add column if not exists title_en text,
  add column if not exists summary_en text,
  add column if not exists description_en text,
  add column if not exists features_en text[] not null default '{}';

alter table public.projects
  add column if not exists title_en text,
  add column if not exists summary_en text,
  add column if not exists description_en text,
  add column if not exists tags_en text[] not null default '{}';

alter table public.posts
  add column if not exists title_en text,
  add column if not exists excerpt_en text,
  add column if not exists content_en text,
  add column if not exists category_en text;

-- English copy for the four core services (only fills empty fields).
update public.services set
  title_en = coalesce(title_en, 'Digital Marketing'),
  summary_en = coalesce(summary_en, 'Well-planned campaigns on social media and search engines that turn followers into customers.'),
  description_en = coalesce(description_en, 'We build a complete digital marketing strategy for your brand, starting with your audience and competitors. Then we run your accounts and ad campaigns and measure results continuously, so every rial you spend turns into real growth.'),
  features_en = case when cardinality(features_en) = 0 then array['Social media account management', 'Paid ads on Meta, Google, TikTok and Snapchat', 'Search engine optimization (SEO)', 'Content creation and monthly performance reports'] else features_en end
where slug = 'digital-marketing';

update public.services set
  title_en = coalesce(title_en, 'Graphic Design'),
  summary_en = coalesce(summary_en, 'Brand identities and designs that catch the eye and stay memorable.'),
  description_en = coalesce(description_en, 'We design a visual identity that expresses who you are, from the logo down to the smallest detail, and turn your messages into clear, attractive designs for every channel: from social posts to print and presentations.'),
  features_en = case when cardinality(features_en) = 0 then array['Logo and brand identity design', 'Social media designs', 'Print and presentations', 'Motion graphics and short videos'] else features_en end
where slug = 'graphic-design';

update public.services set
  title_en = coalesce(title_en, 'Web Development'),
  summary_en = coalesce(summary_en, 'Fast, secure websites and online stores designed to turn visitors into customers.'),
  description_en = coalesce(description_en, 'We build company websites, online stores and custom systems with modern technology: responsive on every screen, fast to load, thoughtfully designed, and with a dashboard that makes managing your content easy.'),
  features_en = case when cardinality(features_en) = 0 then array['Company and brochure websites', 'Online stores and payment gateways', 'Dashboards and custom systems', 'Speed and user-experience optimization'] else features_en end
where slug = 'web-development';

update public.services set
  title_en = coalesce(title_en, 'Mobile App Development'),
  summary_en = coalesce(summary_en, 'iOS and Android apps with a smooth experience that puts your services in your customers'' pockets.'),
  description_en = coalesce(description_en, 'We design and build native and cross-platform mobile apps, from shaping the idea and designing the interface to publishing on the app stores and ongoing support, fully connected to your systems and payment gateways.'),
  features_en = case when cardinality(features_en) = 0 then array['iOS and Android apps', 'UI/UX design', 'System and payment integrations', 'App store publishing and support'] else features_en end
where slug = 'mobile-development';

-- ========== supabase/migrations/0003_meta_ads.sql ==========
-- Meta (Facebook/Instagram) ads: the connected business assets and AI-drafted campaigns.
-- Admin-only: visitors and non-admin accounts cannot read or write these tables.
-- The dashboard only ever reads the access token in server code.

create table if not exists public.meta_connection (
  id smallint primary key default 1 check (id = 1), -- single row
  access_token text not null,
  token_expires_at timestamptz,
  fb_user_id text,
  fb_user_name text,
  ad_account_id text,          -- "act_123..."
  ad_account_name text,
  ad_account_currency text,
  page_id text,
  page_name text,
  whatsapp_number text,        -- digits only, the number linked to the Page
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  service_slug text,
  brief jsonb not null default '{}',     -- what the admin asked for
  plan jsonb not null default '{}',      -- the AI draft, edited by the admin
  image_url text,
  daily_budget numeric(12, 2) not null check (daily_budget > 0),
  duration_days integer not null check (duration_days between 1 and 90),
  status text not null default 'draft' check (status in ('draft', 'created', 'failed')),
  meta_campaign_id text,
  meta_adset_id text,
  meta_creative_id text,
  meta_ad_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ad_campaigns_created_idx on public.ad_campaigns (created_at desc);

drop trigger if exists meta_connection_updated_at on public.meta_connection;
create trigger meta_connection_updated_at before update on public.meta_connection
  for each row execute function public.set_updated_at();
drop trigger if exists ad_campaigns_updated_at on public.ad_campaigns;
create trigger ad_campaigns_updated_at before update on public.ad_campaigns
  for each row execute function public.set_updated_at();

alter table public.meta_connection enable row level security;
alter table public.ad_campaigns enable row level security;

drop policy if exists "meta connection admin" on public.meta_connection;
create policy "meta connection admin" on public.meta_connection
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ad campaigns admin" on public.ad_campaigns;
create policy "ad campaigns admin" on public.ad_campaigns
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ========== supabase/migrations/0004_settings_pricing_email.sql ==========
-- Dashboard-managed settings, pricing packages, booking automation, email log and SEO fields.

-- ---------------------------------------------------------------------------
-- Settings
--   site_settings:    non-secret values the public site reads (booking rules, tracking IDs).
--   private_settings: secrets only the server reads (SMTP credentials). Admin-only.
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key check (key ~ '^[a-z_]+$'),
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.private_settings (
  key text primary key check (key ~ '^[a-z_]+$'),
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
alter table public.private_settings enable row level security;

drop policy if exists "site settings public read" on public.site_settings;
create policy "site settings public read" on public.site_settings
  for select to anon, authenticated using (true);
drop policy if exists "site settings admin write" on public.site_settings;
create policy "site settings admin write" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "private settings admin" on public.private_settings;
create policy "private settings admin" on public.private_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();
drop trigger if exists private_settings_updated_at on public.private_settings;
create trigger private_settings_updated_at before update on public.private_settings
  for each row execute function public.set_updated_at();

insert into public.site_settings (key, value) values
  ('booking', '{"working_days":[0,1,2,3,4],"slots":["10:00","11:00","12:00","13:00","14:00","16:00","17:00","18:00"],"days_ahead":21,"duration_minutes":30,"time_zone":"Asia/Muscat","auto_confirm":false,"reminders":true}'),
  ('tracking', '{"gtm_id":"","ga4_id":"","google_ads_id":"","google_ads_lead_label":"","meta_pixel_id":""}')
on conflict (key) do nothing;

insert into public.private_settings (key, value) values
  ('email', '{"enabled":false,"host":"","port":587,"secure":false,"user":"","password":"","from_name":"Bariq | بريق","from_email":"","notify_to":[],"notify_bookings":true,"notify_messages":true,"client_confirmations":true}')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Days with no bookings (holidays, leave). Public can read so the form hides them.
-- ---------------------------------------------------------------------------
create table if not exists public.blocked_dates (
  day date primary key,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.blocked_dates enable row level security;
drop policy if exists "blocked dates public read" on public.blocked_dates;
create policy "blocked dates public read" on public.blocked_dates
  for select to anon, authenticated using (true);
drop policy if exists "blocked dates admin write" on public.blocked_dates;
create policy "blocked dates admin write" on public.blocked_dates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Pricing packages (bilingual)
-- ---------------------------------------------------------------------------
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  name_en text,
  price numeric(10, 2) not null check (price >= 0),
  currency text not null default 'OMR',
  period text not null default 'month' check (period in ('month', 'year', 'once')),
  tagline text not null default '',
  tagline_en text,
  features text[] not null default '{}',
  features_en text[] not null default '{}',
  cta text,
  cta_en text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.packages enable row level security;
drop policy if exists "packages public read" on public.packages;
create policy "packages public read" on public.packages
  for select to anon, authenticated using (is_published or public.is_admin());
drop policy if exists "packages admin write" on public.packages;
create policy "packages admin write" on public.packages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop trigger if exists packages_updated_at on public.packages;
create trigger packages_updated_at before update on public.packages
  for each row execute function public.set_updated_at();

insert into public.packages (name, name_en, price, tagline, tagline_en, features, features_en, cta, cta_en, is_featured, sort_order)
select * from (values
  ('باقة البداية', 'Starter Package', 250::numeric,
   'مثالية للمشاريع الجديدة التي تريد حضوراً رقمياً احترافياً', 'Ideal for new businesses that want a professional online presence',
   array['إعداد استراتيجية تسويقية','إعداد خطة تسويق','إدارة منصات التواصل (ميتا + تيك توك + سناب شات + تويتر)','نشر 10 منشورات شهرياً','تصميم 3 فيديوهات ريلز','خطة نمو للحساب'],
   array['Marketing strategy','Marketing plan','Social media management (Meta + TikTok + Snapchat + X)','10 posts per month','3 Reels videos','Account growth plan'],
   'اختر باقة البداية', 'Choose Starter', false, 1),
  ('الباقة الاحترافية', 'Professional Package', 350::numeric,
   'الأكثر طلباً للشركات المتوسطة', 'The most popular choice for mid-sized companies',
   array['إعداد استراتيجية تسويقية','إعداد خطة تسويق','تصميم 5 فيديوهات ريلز','نشر 15 منشوراً شهرياً','خطة نمو متقدمة','تقارير شهرية'],
   array['Marketing strategy','Marketing plan','5 Reels videos','15 posts per month','Advanced growth plan','Monthly reports'],
   'اختر الباقة الاحترافية', 'Choose Professional', true, 2),
  ('الباقة المتقدمة', 'Advanced Package', 450::numeric,
   'للأعمال التي تريد نتائج قوية ومبيعات أعلى', 'For businesses that want strong results and higher sales',
   array['إعداد استراتيجية تسويقية','إعداد خطة تسويق','تصميم 7 فيديوهات ريلز','نشر 20 منشوراً شهرياً','خطة نمو متقدمة','تقارير شهرية'],
   array['Marketing strategy','Marketing plan','7 Reels videos','20 posts per month','Advanced growth plan','Monthly reports'],
   'اختر الباقة المتقدمة', 'Choose Advanced', false, 3)
) as v(name, name_en, price, tagline, tagline_en, features, features_en, cta, cta_en, is_featured, sort_order)
where not exists (select 1 from public.packages);

-- ---------------------------------------------------------------------------
-- Email log (written by the server with the service role; admins read it)
-- ---------------------------------------------------------------------------
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null,                       -- booking_admin, booking_client, booking_confirmed, reminder, message_admin, test
  to_email text not null,
  subject text not null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  error text,
  related_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists email_log_created_idx on public.email_log (created_at desc);
alter table public.email_log enable row level security;
drop policy if exists "email log admin read" on public.email_log;
create policy "email log admin read" on public.email_log
  for select to authenticated using (public.is_admin());
drop policy if exists "email log admin delete" on public.email_log;
create policy "email log admin delete" on public.email_log
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Booking automation + language of the person who wrote in
-- ---------------------------------------------------------------------------
alter table public.consultations
  add column if not exists lang text not null default 'ar' check (lang in ('ar', 'en')),
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists reminder_sent_at timestamptz;

alter table public.messages
  add column if not exists lang text not null default 'ar' check (lang in ('ar', 'en'));

-- ---------------------------------------------------------------------------
-- SEO fields
-- ---------------------------------------------------------------------------
alter table public.posts
  add column if not exists meta_title text,
  add column if not exists meta_title_en text,
  add column if not exists meta_description text,
  add column if not exists meta_description_en text;

alter table public.services
  add column if not exists content text not null default '',
  add column if not exists content_en text,
  add column if not exists meta_title text,
  add column if not exists meta_title_en text,
  add column if not exists meta_description text,
  add column if not exists meta_description_en text;

-- ========== supabase/migrations/0005_team_tasks_clients.sql ==========
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

-- ========== supabase/migrations/0006_security_hardening.sql ==========
-- Security hardening after the full audit. Safe to run more than once.

-- ---------------------------------------------------------------------------
-- 1. Functions visitors never need to call directly
-- ---------------------------------------------------------------------------
revoke execute on function public.consultation_to_contact() from public, anon, authenticated;
revoke execute on function public.message_to_contact() from public, anon, authenticated;
revoke execute on function public.normalize_phone(text) from public, anon;
revoke execute on function public.lead_source(jsonb, text) from public, anon;

-- ---------------------------------------------------------------------------
-- 2. Public forms: keep tracking data small and internal fields untouched
--    (the website validates too, but these rules also hold for direct API calls)
-- ---------------------------------------------------------------------------
do $$ begin
  alter table public.consultations add constraint consultations_utm_small check (jsonb_typeof(utm) = 'object' and pg_column_size(utm) <= 4096);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.messages add constraint messages_utm_small check (jsonb_typeof(utm) = 'object' and pg_column_size(utm) <= 4096);
exception when duplicate_object then null; end $$;

drop policy if exists "consultations public insert" on public.consultations;
create policy "consultations public insert" on public.consultations
  for insert to anon, authenticated
  with check (
    status = 'pending'
    and admin_notes is null
    and confirmation_sent_at is null
    and reminder_sent_at is null
    and scheduled_date >= current_date
    and scheduled_date <= current_date + 180
  );

-- ---------------------------------------------------------------------------
-- 3. Anti-spam limits for the public forms (apply to every insert path)
-- ---------------------------------------------------------------------------
create or replace function public.guard_consultation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.consultations
      where public.normalize_phone(phone) = public.normalize_phone(new.phone)
        and status in ('pending', 'confirmed') and scheduled_date >= current_date) >= 3 then
    raise exception 'too_many_bookings' using errcode = 'P0001';
  end if;
  if (select count(*) from public.consultations where created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'booking_rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create or replace function public.guard_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.messages
      where created_at > now() - interval '10 minutes'
        and ((new.email is not null and lower(email) = lower(new.email))
          or (new.phone is not null and public.normalize_phone(phone) = public.normalize_phone(new.phone)))) >= 3 then
    raise exception 'too_many_messages' using errcode = 'P0001';
  end if;
  if (select count(*) from public.messages where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'message_rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_consultation() from public, anon, authenticated;
revoke execute on function public.guard_message() from public, anon, authenticated;

-- Triggers run in name order: the guard ("…_a_guard") runs before the client record is created ("…_contact").
drop trigger if exists consultations_a_guard on public.consultations;
create trigger consultations_a_guard before insert on public.consultations
  for each row execute function public.guard_consultation();
drop trigger if exists messages_a_guard on public.messages;
create trigger messages_a_guard before insert on public.messages
  for each row execute function public.guard_message();

-- ---------------------------------------------------------------------------
-- 4. Days off: visitors may see which days are closed, not the private reason
-- ---------------------------------------------------------------------------
revoke select on public.blocked_dates from anon;
grant select (day) on public.blocked_dates to anon;

-- ---------------------------------------------------------------------------
-- 5. Media bucket: files stay public by URL, but nobody can list the whole bucket
-- ---------------------------------------------------------------------------
drop policy if exists "media public read" on storage.objects;
drop policy if exists "media team read" on storage.objects;
create policy "media team read" on storage.objects
  for select to authenticated using (bucket_id = 'media' and public.is_admin());

-- ========== supabase/seed.sql ==========
-- Bariq's four core services (Arabic + English). Run after the migrations; safe to run more than once.
insert into public.services (slug, title, summary, description, icon, image_url, features, sort_order, title_en, summary_en, description_en, features_en)
values
  (
    'digital-marketing',
    'التسويق الرقمي',
    'حملات مدروسة على منصات التواصل ومحركات البحث تحوّل المتابعين إلى عملاء.',
    'نبني لعلامتك استراتيجية تسويق رقمي متكاملة تبدأ بفهم جمهورك ومنافسيك، ثم ندير حساباتك وحملاتك الإعلانية ونقيس النتائج باستمرار حتى يتحول كل ريال تنفقه إلى نمو حقيقي.',
    'megaphone',
    '/images/service-marketing.jpg',
    array['إدارة حسابات التواصل الاجتماعي', 'الإعلانات الممولة على Meta وGoogle وTikTok وSnapchat', 'تحسين الظهور في محركات البحث SEO', 'صناعة المحتوى وتقارير أداء شهرية'],
    1,
    'Digital Marketing',
    'Well-planned campaigns on social media and search engines that turn followers into customers.',
    'We build a complete digital marketing strategy for your brand, starting with your audience and competitors. Then we run your accounts and ad campaigns and measure results continuously, so every rial you spend turns into real growth.',
    array['Social media account management', 'Paid ads on Meta, Google, TikTok and Snapchat', 'Search engine optimization (SEO)', 'Content creation and monthly performance reports']
  ),
  (
    'graphic-design',
    'تصميم الجرافيك',
    'هويات بصرية وتصاميم تلفت الانتباه وتبقى في الذاكرة.',
    'نصمم هوية بصرية تعبّر عن شخصيتك من الشعار حتى أصغر تفصيلة، ونحوّل رسائلك إلى تصاميم واضحة وجذابة لكل منصة: من منشورات التواصل إلى المطبوعات والعروض التقديمية.',
    'palette',
    '/images/service-design.jpg',
    array['تصميم الشعارات والهويات البصرية', 'تصاميم منصات التواصل الاجتماعي', 'المطبوعات والعروض التقديمية', 'الموشن جرافيك والفيديو القصير'],
    2,
    'Graphic Design',
    'Brand identities and designs that catch the eye and stay memorable.',
    'We design a visual identity that expresses who you are, from the logo down to the smallest detail, and turn your messages into clear, attractive designs for every channel: from social posts to print and presentations.',
    array['Logo and brand identity design', 'Social media designs', 'Print and presentations', 'Motion graphics and short videos']
  ),
  (
    'web-development',
    'تطوير المواقع',
    'مواقع ومتاجر سريعة وآمنة، مصممة لتحويل الزوار إلى عملاء.',
    'نطوّر مواقع تعريفية ومتاجر إلكترونية وأنظمة مخصصة بأحدث التقنيات، بتصميم متجاوب مع كل الشاشات وسرعة تحميل عالية وتجربة استخدام مدروسة، مع لوحة تحكم تديرون منها المحتوى بسهولة.',
    'monitor-smartphone',
    '/images/service-web.jpg',
    array['مواقع الشركات والمواقع التعريفية', 'المتاجر الإلكترونية وبوابات الدفع', 'لوحات التحكم والأنظمة المخصصة', 'تحسين السرعة وتجربة المستخدم'],
    3,
    'Web Development',
    'Fast, secure websites and online stores designed to turn visitors into customers.',
    'We build company websites, online stores and custom systems with modern technology: responsive on every screen, fast to load, thoughtfully designed, and with a dashboard that makes managing your content easy.',
    array['Company and brochure websites', 'Online stores and payment gateways', 'Dashboards and custom systems', 'Speed and user-experience optimization']
  ),
  (
    'mobile-development',
    'تطوير تطبيقات الموبايل',
    'تطبيقات iOS وAndroid بتجربة سلسة تضع خدماتك في جيب عملائك.',
    'نصمم ونطوّر تطبيقات جوال أصلية ومتعددة المنصات، من دراسة الفكرة وتصميم الواجهات حتى النشر على المتاجر والدعم المستمر، مع ربط كامل بأنظمتك وبوابات الدفع.',
    'smartphone',
    '/images/service-mobile.jpg',
    array['تطبيقات iOS وAndroid', 'تصميم واجهات وتجربة المستخدم UI/UX', 'الربط مع الأنظمة وبوابات الدفع', 'النشر على المتاجر والدعم الفني'],
    4,
    'Mobile App Development',
    'iOS and Android apps with a smooth experience that puts your services in your customers'' pockets.',
    'We design and build native and cross-platform mobile apps, from shaping the idea and designing the interface to publishing on the app stores and ongoing support, fully connected to your systems and payment gateways.',
    array['iOS and Android apps', 'UI/UX design', 'System and payment integrations', 'App store publishing and support']
  )
on conflict (slug) do nothing;
