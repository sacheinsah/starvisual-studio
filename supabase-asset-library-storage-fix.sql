-- STAR VISUALS — Asset Library Storage Repair
-- Run this file in Supabase SQL Editor if the Admin Asset Library shows:
-- "Bucket not found" or storage permission errors.
-- Safe to run more than once.

-- The frontend uses exactly one bucket for uploaded creative assets.
insert into storage.buckets (id, name, public, file_size_limit)
values ('star-assets', 'star-assets', true, 524288000)
on conflict (id) do update
set name = excluded.name,
    public = true,
    file_size_limit = excluded.file_size_limit;

-- Admins can upload asset files.
drop policy if exists "star_assets_admin_insert" on storage.objects;
create policy "star_assets_admin_insert"
on storage.objects
for insert to authenticated
with check (bucket_id = 'star-assets' and public.is_admin());

-- Admins can update asset files.
drop policy if exists "star_assets_admin_update" on storage.objects;
create policy "star_assets_admin_update"
on storage.objects
for update to authenticated
using (bucket_id = 'star-assets' and public.is_admin())
with check (bucket_id = 'star-assets' and public.is_admin());

-- Admins can delete asset files.
drop policy if exists "star_assets_admin_delete" on storage.objects;
create policy "star_assets_admin_delete"
on storage.objects
for delete to authenticated
using (bucket_id = 'star-assets' and public.is_admin());

-- Admins can list/read storage objects when needed by the admin UI.
drop policy if exists "star_assets_admin_select" on storage.objects;
create policy "star_assets_admin_select"
on storage.objects
for select to authenticated
using (bucket_id = 'star-assets' and public.is_admin());

-- The asset table itself is managed by the existing public.is_admin() policies.
-- Refresh PostgREST schema metadata.
notify pgrst, 'reload schema';

-- Verification: these should return one row / the expected policies.
select id, name, public, file_size_limit
from storage.buckets
where id = 'star-assets';

select policyname, cmd, roles
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'star_assets_admin_%'
order by policyname;
