-- Run once in Supabase SQL Editor for the Shilpon project.
create table if not exists public.store_catalog (
  kind text not null check (kind in ('product', 'category', 'settings', 'assets')),
  record_id text not null,
  sort_order integer not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (kind, record_id)
);

create table if not exists public.store_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.store_catalog enable row level security;
alter table public.store_admins enable row level security;
revoke all on public.store_admins from anon, authenticated;
-- Allow policies to verify only the current user's admin row.
grant select on public.store_admins to authenticated;
drop policy if exists "Admins can read own allowlist entry" on public.store_admins;
create policy "Admins can read own allowlist entry" on public.store_admins
  for select to authenticated using (user_id = (select auth.uid()));
grant select on public.store_catalog to anon, authenticated;
grant insert, update, delete on public.store_catalog to authenticated;

drop policy if exists "Public can read catalog" on public.store_catalog;
create policy "Public can read catalog" on public.store_catalog
  for select to anon, authenticated using (true);

drop policy if exists "Listed admins manage catalog" on public.store_catalog;
create policy "Listed admins manage catalog" on public.store_catalog
  for all to authenticated
  using (exists (select 1 from public.store_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.store_admins a where a.user_id = (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-assets', 'store-assets', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm'])
on conflict (id) do update set public = true, file_size_limit = 10485760;

drop policy if exists "Public reads store assets" on storage.objects;
create policy "Public reads store assets" on storage.objects
  for select to anon, authenticated using (bucket_id = 'store-assets');

drop policy if exists "Listed admins add store assets" on storage.objects;
create policy "Listed admins add store assets" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'store-assets' and exists (select 1 from public.store_admins a where a.user_id = (select auth.uid()))
  );

drop policy if exists "Listed admins update store assets" on storage.objects;
create policy "Listed admins update store assets" on storage.objects
  for update to authenticated using (
    bucket_id = 'store-assets' and exists (select 1 from public.store_admins a where a.user_id = (select auth.uid()))
  ) with check (
    bucket_id = 'store-assets' and exists (select 1 from public.store_admins a where a.user_id = (select auth.uid()))
  );

drop policy if exists "Listed admins delete store assets" on storage.objects;
create policy "Listed admins delete store assets" on storage.objects
  for delete to authenticated using (
    bucket_id = 'store-assets' and exists (select 1 from public.store_admins a where a.user_id = (select auth.uid()))
  );

-- Keep already-open storefront tabs in sync after an admin edits the catalog.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'store_catalog'
  ) then
    alter publication supabase_realtime add table public.store_catalog;
  end if;
end $$;

-- After creating the owner in Supabase Auth, authorize only that account:
-- insert into public.store_admins (user_id)
-- select id from auth.users where email = 'YOUR_ADMIN_EMAIL';

