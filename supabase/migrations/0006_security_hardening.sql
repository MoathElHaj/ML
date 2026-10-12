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
