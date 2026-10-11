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
