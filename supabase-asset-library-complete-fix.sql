-- STAR VISUALS — Complete Asset Library Repair
-- Canonical Asset Library-only repair.
-- IMPORTANT: this does not modify, migrate, rename, delete, or reseed Editing Services.
-- Run in Supabase SQL Editor.

-- Run in Supabase SQL Editor.
-- This migration ONLY repairs the separate Asset Library.
-- It does not modify, migrate, rename, delete, or reseed Editing Services.

create extension if not exists pgcrypto;

do $$ begin
  create type public.asset_access_type as enum ('free', 'premium');
exception when duplicate_object then null; end $$;

create table if not exists public.asset_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null default 'Cinematic Reel Pack',
  thumbnail_url text,
  preview_url text,
  file_url text,
  external_download_url text,
  file_type text,
  file_size text,
  software text,
  access_type public.asset_access_type not null default 'free',
  price numeric(10,2) default 0,
  published boolean not null default true,
  downloads_count integer not null default 0,
  purchases_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.asset_library add column if not exists external_download_url text;

-- Refresh PostgREST schema cache so the new Asset Library column is immediately visible to the API.
notify pgrst, 'reload schema';
alter table public.asset_library alter column category set default 'Cinematic Reel Pack';

-- Keep legacy category values from the earlier Asset Library implementation from creating
-- service-like categories. Only known legacy categories are mapped to the new six packs.
update public.asset_library set category='Cinematic Reel Pack' where category='Layout Templates';
update public.asset_library set category='Premium Motion Pack' where category='After Effects Templates';
update public.asset_library set category='Thumbnail Formula Pack' where category='Thumbnail Templates';
update public.asset_library set category='Reel Transition Pack' where category='Transition Packs';
update public.asset_library set category='Cinematic LUT Pack' where category='LUTs / Color Presets';
update public.asset_library set category='Creator SFX Bundle' where category='SFX / Audio Packs';

alter table public.asset_library enable row level security;

drop policy if exists "assets_public_read" on public.asset_library;
create policy "assets_public_read" on public.asset_library
for select to anon, authenticated
using (published = true or public.is_admin());

drop policy if exists "assets_admin_insert" on public.asset_library;
create policy "assets_admin_insert" on public.asset_library
for insert to authenticated with check (public.is_admin());

drop policy if exists "assets_admin_update" on public.asset_library;
create policy "assets_admin_update" on public.asset_library
for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "assets_admin_delete" on public.asset_library;
create policy "assets_admin_delete" on public.asset_library
for delete to authenticated using (public.is_admin());

grant select on public.asset_library to anon, authenticated;
grant insert, update, delete on public.asset_library to authenticated;

insert into storage.buckets (id,name,public,file_size_limit)
values ('star-assets','star-assets',false,524288000)
on conflict (id) do update set public=false, file_size_limit=524288000;

drop policy if exists "star_assets_admin_insert" on storage.objects;
create policy "star_assets_admin_insert" on storage.objects
for insert to authenticated
with check (bucket_id='star-assets' and public.is_admin());

drop policy if exists "star_assets_admin_update" on storage.objects;
create policy "star_assets_admin_update" on storage.objects
for update to authenticated
using (bucket_id='star-assets' and public.is_admin())
with check (bucket_id='star-assets' and public.is_admin());

drop policy if exists "star_assets_admin_delete" on storage.objects;
create policy "star_assets_admin_delete" on storage.objects
for delete to authenticated
using (bucket_id='star-assets' and public.is_admin());

-- Existing public.service_packages and public.service_asset_links are intentionally untouched.
-- Asset Library code no longer reads/writes service_packages or service_asset_links.
