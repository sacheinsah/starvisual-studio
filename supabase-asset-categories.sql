-- STAR VISUALS — Dynamic Asset Categories
-- Run this once in Supabase SQL Editor after the existing Asset Library migrations.

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
on public.asset_categories for select
to anon, authenticated
using (published = true or public.is_admin());

drop policy if exists "asset_categories_admin_insert" on public.asset_categories;
create policy "asset_categories_admin_insert"
on public.asset_categories for insert
to authenticated
with check (public.is_admin());

drop policy if exists "asset_categories_admin_update" on public.asset_categories;
create policy "asset_categories_admin_update"
on public.asset_categories for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "asset_categories_admin_delete" on public.asset_categories;
create policy "asset_categories_admin_delete"
on public.asset_categories for delete
to authenticated
using (public.is_admin());

grant select on public.asset_categories to anon, authenticated;
grant insert, update, delete on public.asset_categories to authenticated;

insert into public.asset_categories (name, description, thumbnail_url, sort_order)
values
('Cinematic Reel Pack','Cinematic reel templates and storytelling resources.','assets/asset-pack/asset-library-cover.svg',10),
('Premium Motion Pack','Premium motion graphics, presets and animation resources.','assets/asset-pack/asset-library-cover.svg',20),
('Thumbnail Formula Pack','Thumbnail systems and visual formulas for creators.','assets/asset-pack/asset-library-cover.svg',30),
('Reel Transition Pack','Transitions and finishing assets for short-form edits.','assets/asset-pack/asset-library-cover.svg',40),
('Cinematic LUT Pack','Cinematic colour presets and LUT resources.','assets/asset-pack/asset-library-cover.svg',50),
('Creator SFX Bundle','Impacts, whooshes, ambience and creator sound effects.','assets/asset-pack/asset-library-cover.svg',60),
('Creator Asset Pack','General creator resources, overlays and production assets.','assets/asset-pack/asset-library-cover.svg',70)
on conflict (name) do update set
  description=excluded.description,
  thumbnail_url=coalesce(nullif(public.asset_categories.thumbnail_url,''),excluded.thumbnail_url),
  sort_order=excluded.sort_order,
  updated_at=now();

-- Normalize legacy Asset Library category names into the new category system.
update public.asset_library set category='Cinematic Reel Pack' where category='Layout Templates';
update public.asset_library set category='Premium Motion Pack' where category='After Effects Templates';
update public.asset_library set category='Thumbnail Formula Pack' where category='Thumbnail Templates';
update public.asset_library set category='Reel Transition Pack' where category='Transition Packs';
update public.asset_library set category='Cinematic LUT Pack' where category='LUTs / Color Presets';
update public.asset_library set category='Creator SFX Bundle' where category='SFX / Audio Packs';

-- Optional integrity index for fast category browsing.
create index if not exists asset_library_category_published_idx
on public.asset_library(category, published, created_at desc);
