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
