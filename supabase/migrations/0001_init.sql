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
