-- STAR VISUALS — Asset Library V2 / secure storage + collections
-- Run AFTER the existing Star Visuals schema/asset migrations.
-- This migration is designed to be safe to run repeatedly.
--
-- IMPORTANT: this makes star-assets PRIVATE. New frontend downloads use short-lived
-- signed URLs. Public preview/thumbnail paths remain readable through Storage RLS.
-- Existing database records are preserved.

create extension if not exists pgcrypto;

-- ---------- Asset metadata ----------
alter table public.asset_library add column if not exists subcategory text;
alter table public.asset_library add column if not exists tags text[] not null default '{}';
alter table public.asset_library add column if not exists software_compatibility text[] not null default '{}';
alter table public.asset_library add column if not exists featured boolean not null default false;
alter table public.asset_library add column if not exists trending boolean not null default false;

create index if not exists asset_library_created_at_idx on public.asset_library(created_at desc);
create index if not exists asset_library_category_idx on public.asset_library(category);
create index if not exists asset_library_access_idx on public.asset_library(access_type);
create index if not exists asset_library_featured_idx on public.asset_library(featured) where featured = true;
create index if not exists asset_library_trending_idx on public.asset_library(trending) where trending = true;
create index if not exists asset_library_tags_gin_idx on public.asset_library using gin(tags);
create index if not exists asset_library_software_gin_idx on public.asset_library using gin(software_compatibility);

-- ---------- Collections ----------
create table if not exists public.asset_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  thumbnail_url text,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.asset_collections(id) on delete cascade,
  asset_id uuid not null references public.asset_library(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(collection_id, asset_id)
);

create index if not exists asset_collection_items_collection_idx
  on public.asset_collection_items(collection_id, sort_order);
create index if not exists asset_collection_items_asset_idx
  on public.asset_collection_items(asset_id);

alter table public.asset_collections enable row level security;
alter table public.asset_collection_items enable row level security;

drop policy if exists "asset_collections_public_read" on public.asset_collections;
create policy "asset_collections_public_read"
on public.asset_collections for select to anon, authenticated
using (published = true or public.is_admin());

drop policy if exists "asset_collections_admin_insert" on public.asset_collections;
create policy "asset_collections_admin_insert"
on public.asset_collections for insert to authenticated
with check (public.is_admin());
drop policy if exists "asset_collections_admin_update" on public.asset_collections;
create policy "asset_collections_admin_update"
on public.asset_collections for update to authenticated
using (public.is_admin()) with check (public.is_admin());
drop policy if exists "asset_collections_admin_delete" on public.asset_collections;
create policy "asset_collections_admin_delete"
on public.asset_collections for delete to authenticated
using (public.is_admin());

drop policy if exists "asset_collection_items_public_read" on public.asset_collection_items;
create policy "asset_collection_items_public_read"
on public.asset_collection_items for select to anon, authenticated
using (
  exists (
    select 1 from public.asset_collections c
    where c.id = collection_id and (c.published = true or public.is_admin())
  )
);

drop policy if exists "asset_collection_items_admin_insert" on public.asset_collection_items;
create policy "asset_collection_items_admin_insert"
on public.asset_collection_items for insert to authenticated
with check (public.is_admin());
drop policy if exists "asset_collection_items_admin_update" on public.asset_collection_items;
create policy "asset_collection_items_admin_update"
on public.asset_collection_items for update to authenticated
using (public.is_admin()) with check (public.is_admin());
drop policy if exists "asset_collection_items_admin_delete" on public.asset_collection_items;
create policy "asset_collection_items_admin_delete"
on public.asset_collection_items for delete to authenticated
using (public.is_admin());

grant select on public.asset_collections, public.asset_collection_items to anon, authenticated;
grant insert, update, delete on public.asset_collections, public.asset_collection_items to authenticated;

-- ---------- User favorites ----------
create table if not exists public.asset_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  asset_id uuid not null references public.asset_library(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, asset_id)
);

create index if not exists asset_favorites_user_idx
  on public.asset_favorites(user_id, created_at desc);

alter table public.asset_favorites enable row level security;

drop policy if exists "asset_favorites_select_own" on public.asset_favorites;
create policy "asset_favorites_select_own"
on public.asset_favorites for select to authenticated
using (user_id = auth.uid());
drop policy if exists "asset_favorites_insert_own" on public.asset_favorites;
create policy "asset_favorites_insert_own"
on public.asset_favorites for insert to authenticated
with check (user_id = auth.uid());
drop policy if exists "asset_favorites_delete_own" on public.asset_favorites;
create policy "asset_favorites_delete_own"
on public.asset_favorites for delete to authenticated
using (user_id = auth.uid());

grant select, insert, delete on public.asset_favorites to authenticated;

-- ---------- Download audit ----------
create table if not exists public.asset_downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  asset_id uuid not null references public.asset_library(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists asset_downloads_asset_idx
  on public.asset_downloads(asset_id, created_at desc);
create index if not exists asset_downloads_user_idx
  on public.asset_downloads(user_id, created_at desc);

alter table public.asset_downloads enable row level security;

drop policy if exists "asset_downloads_select_own_or_admin" on public.asset_downloads;
create policy "asset_downloads_select_own_or_admin"
on public.asset_downloads for select to authenticated
using (user_id = auth.uid() or public.is_admin());

grant select on public.asset_downloads to authenticated;

-- Users must never be able to grant themselves premium asset access.
drop policy if exists "user_assets_insert_own" on public.user_asset_access;
drop policy if exists "user_assets_update_own" on public.user_asset_access;
drop policy if exists "user_assets_admin_insert" on public.user_asset_access;
drop policy if exists "user_assets_admin_update" on public.user_asset_access;
drop policy if exists "user_assets_admin_delete" on public.user_asset_access;
create policy "user_assets_admin_insert" on public.user_asset_access
for insert to authenticated with check (public.is_admin());
create policy "user_assets_admin_update" on public.user_asset_access
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "user_assets_admin_delete" on public.user_asset_access
for delete to authenticated using (public.is_admin());
grant select on public.user_asset_access to authenticated;
grant insert, update, delete on public.user_asset_access to authenticated;

-- Clients cannot directly insert download rows or modify the counter.
revoke insert, update, delete on public.asset_downloads from anon, authenticated;
revoke update(downloads_count) on public.asset_library from anon, authenticated;

create or replace function public.record_asset_download(p_asset_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_asset public.asset_library%rowtype;
  v_user uuid := auth.uid();
  v_allowed boolean := false;
begin
  if v_user is null then
    -- Free assets may be downloaded anonymously; the audit row remains user_id NULL.
    select * into v_asset
    from public.asset_library
    where id = p_asset_id and published = true;
    v_allowed := found and v_asset.access_type = 'free';
  else
    select * into v_asset
    from public.asset_library
    where id = p_asset_id and published = true;

    if not found then
      return false;
    end if;

    if v_asset.access_type = 'free' then
      v_allowed := true;
    else
      select exists (
        select 1 from public.user_asset_access
        where user_id = v_user and asset_id = p_asset_id
          and status in ('available','purchased','downloaded')
      ) into v_allowed;
    end if;
  end if;

  if not v_allowed then
    return false;
  end if;

  insert into public.asset_downloads(user_id, asset_id) values (v_user, p_asset_id);
  update public.asset_library
    set downloads_count = coalesce(downloads_count,0) + 1,
        updated_at = now()
    where id = p_asset_id;

  return true;
end;
$$;

revoke all on function public.record_asset_download(uuid) from public;
grant execute on function public.record_asset_download(uuid) to anon, authenticated;

-- ---------- Categories ----------
create table if not exists public.asset_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  thumbnail_url text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.asset_categories enable row level security;
drop policy if exists "asset_categories_public_read" on public.asset_categories;
create policy "asset_categories_public_read"
on public.asset_categories for select to anon, authenticated
using (published = true or public.is_admin());
drop policy if exists "asset_categories_admin_insert" on public.asset_categories;
create policy "asset_categories_admin_insert"
on public.asset_categories for insert to authenticated with check (public.is_admin());
drop policy if exists "asset_categories_admin_update" on public.asset_categories;
create policy "asset_categories_admin_update"
on public.asset_categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "asset_categories_admin_delete" on public.asset_categories;
create policy "asset_categories_admin_delete"
on public.asset_categories for delete to authenticated using (public.is_admin());
grant select on public.asset_categories to anon, authenticated;
grant insert, update, delete on public.asset_categories to authenticated;

insert into public.asset_categories(name,description,thumbnail_url,sort_order,published)
values
('Templates','Editable project templates and creator-ready production systems.','assets/asset-pack/asset-library-cover.svg',10,true),
('LUTs','Cinematic colour grading LUTs for modern editing workflows.','assets/asset-pack/asset-library-cover.svg',20,true),
('Presets','Reusable editing presets for speed and consistency.','assets/asset-pack/asset-library-cover.svg',30,true),
('SFX','Impacts, whooshes, ambience and creator sound effects.','assets/asset-pack/asset-library-cover.svg',40,true),
('Music','Music beds and creator-friendly audio resources.','assets/asset-pack/asset-library-cover.svg',50,true),
('Overlays','Light leaks, textures, particles and visual overlays.','assets/asset-pack/asset-library-cover.svg',60,true),
('Transitions','Transitions for short-form, long-form and cinematic edits.','assets/asset-pack/asset-library-cover.svg',70,true),
('Graphics','Titles, icons, social graphics and creator visuals.','assets/asset-pack/asset-library-cover.svg',80,true),
('Fonts','Typography resources and font packs for design workflows.','assets/asset-pack/asset-library-cover.svg',90,true),
('3D','3D assets and production-ready elements.','assets/asset-pack/asset-library-cover.svg',100,true),
('Stock','Stock footage, images and supporting production assets.','assets/asset-pack/asset-library-cover.svg',110,true)
on conflict(name) do update set
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Preserve the old records while moving their legacy category labels into the new model.
update public.asset_library set category='Templates' where category in ('Cinematic Reel Pack','Layout Templates');
update public.asset_library set category='Templates' where category='After Effects Templates';
update public.asset_library set category='Graphics' where category='Thumbnail Templates';
update public.asset_library set category='Transitions' where category='Reel Transition Pack';
update public.asset_library set category='LUTs' where category='Cinematic LUT Pack';
update public.asset_library set category='SFX' where category='Creator SFX Bundle';
update public.asset_library set category='Graphics' where category='Creator Asset Pack';

-- ---------- Secure Storage ----------
insert into storage.buckets(id,name,public,file_size_limit)
values ('star-assets','star-assets',false,524288000)
on conflict(id) do update set public=false,file_size_limit=524288000;

-- Remove the legacy public-read policy if it exists.
drop policy if exists "star_assets_public_read" on storage.objects;
drop policy if exists "star_assets_admin_insert" on storage.objects;
drop policy if exists "star_assets_admin_update" on storage.objects;
drop policy if exists "star_assets_admin_delete" on storage.objects;
drop policy if exists "star_assets_admin_select" on storage.objects;
drop policy if exists "star_assets_public_preview_read" on storage.objects;
drop policy if exists "star_assets_authenticated_file_read" on storage.objects;
drop policy if exists "star_assets_authorized_file_read" on storage.objects;

-- Admins manage every object.
create policy "star_assets_admin_insert"
on storage.objects for insert to authenticated
with check (bucket_id='star-assets' and public.is_admin());

create policy "star_assets_admin_update"
on storage.objects for update to authenticated
using (bucket_id='star-assets' and public.is_admin())
with check (bucket_id='star-assets' and public.is_admin());

create policy "star_assets_admin_delete"
on storage.objects for delete to authenticated
using (bucket_id='star-assets' and public.is_admin());

create policy "star_assets_admin_select"
on storage.objects for select to authenticated
using (bucket_id='star-assets' and public.is_admin());

-- Preview/thumbnail objects are intentionally readable; original/download files are not.
create policy "star_assets_public_preview_read"
on storage.objects for select to anon, authenticated
using (
  bucket_id='star-assets'
  and (
    name like 'asset-pack/thumbnails/%'
    or name like 'asset-pack/previews/%'
  )
);

-- Original files are never public. Storage select permission is granted only when the
-- corresponding published asset is free, or the signed-in user already has access.
-- The frontend still requests a short-lived signed URL instead of a permanent URL.
create policy "star_assets_authorized_file_read"
on storage.objects for select to anon, authenticated
using (
  bucket_id='star-assets'
  and exists (
    select 1
    from public.asset_library a
    where a.file_url = storage.objects.name
      and a.published = true
      and (
        a.access_type = 'free'
        or (
          auth.uid() is not null
          and exists (
            select 1 from public.user_asset_access uaa
            where uaa.user_id = auth.uid()
              and uaa.asset_id = a.id
              and uaa.status in ('available','purchased','downloaded')
          )
        )
      )
  )
);

-- Server-side storage metadata guard. It blocks executable/script extensions and oversized files
-- even if a malicious client bypasses browser validation.
create or replace function public.validate_star_asset_object()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := lower(new.name);
  v_mime text := lower(coalesce(new.metadata->>'mimetype',''));
  v_size bigint := nullif(new.metadata->>'size','')::bigint;
begin
  if new.bucket_id <> 'star-assets' then
    return new;
  end if;

  if v_name ~ '\.(exe|dll|bat|cmd|com|msi|scr|ps1|sh|bash|php|jsp|asp|aspx|cgi|html?|svg)$' then
    raise exception 'Unsupported asset file type';
  end if;

  if v_size is not null and v_size > 524288000 then
    raise exception 'Asset file exceeds the 500 MB limit';
  end if;

  if v_mime ~ '(^|/)(x-msdownload|x-msdos-program|javascript|x-sh|x-httpd-php)$' then
    raise exception 'Unsupported asset MIME type';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_star_asset_object_trigger on storage.objects;
create trigger validate_star_asset_object_trigger
before insert or update on storage.objects
for each row execute procedure public.validate_star_asset_object();

-- Keep updated_at current.
drop trigger if exists asset_collections_updated_at on public.asset_collections;
create trigger asset_collections_updated_at before update on public.asset_collections
for each row execute procedure public.set_updated_at();

-- Starter collections are intentionally metadata-only; admins can add assets from the Admin Panel.
insert into public.asset_collections(name,description,sort_order,published)
values
('Cinematic Creator Pack','Cinematic resources for polished creator edits.',10,true),
('YouTube Creator Pack','Templates and production assets for YouTube workflows.',20,true),
('Social Media Pack','Fast assets for reels, shorts and social content.',30,true),
('VFX Essentials','Core visual effects resources for editors.',40,true),
('Color Grading Pack','LUTs and colour resources for consistent looks.',50,true),
('Gaming Creator Pack','Fast graphics, overlays and sound resources for gaming content.',60,true),
('Premiere Pro Essentials','Premiere-ready assets and editing helpers.',70,true)
on conflict(name) do nothing;
