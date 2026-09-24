-- STAR VISUALS — Service Library Asset Assignments
-- Run this in Supabase SQL Editor after the base schema. Safe to run repeatedly.

create table if not exists public.service_asset_links (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.asset_library(id) on delete cascade,
  service_id uuid not null references public.service_packages(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (asset_id, service_id)
);

create index if not exists service_asset_links_asset_id_idx on public.service_asset_links(asset_id);
create index if not exists service_asset_links_service_id_idx on public.service_asset_links(service_id);

alter table public.service_asset_links enable row level security;

drop policy if exists "service_asset_links_public_read" on public.service_asset_links;
create policy "service_asset_links_public_read"
on public.service_asset_links for select
to anon, authenticated
using (
  exists (select 1 from public.asset_library a where a.id = asset_id and a.published = true)
  and exists (select 1 from public.service_packages s where s.id = service_id and s.published = true)
);

drop policy if exists "service_asset_links_admin_insert" on public.service_asset_links;
create policy "service_asset_links_admin_insert"
on public.service_asset_links for insert
to authenticated
with check (public.is_admin());

drop policy if exists "service_asset_links_admin_update" on public.service_asset_links;
create policy "service_asset_links_admin_update"
on public.service_asset_links for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "service_asset_links_admin_delete" on public.service_asset_links;
create policy "service_asset_links_admin_delete"
on public.service_asset_links for delete
to authenticated
using (public.is_admin());

grant select on public.service_asset_links to anon, authenticated;
grant insert, update, delete on public.service_asset_links to authenticated;
