-- STAR VISUALS — Asset Library external download link column repair
-- Run this in Supabase SQL Editor.
-- This ONLY adds the Asset Library column required for external download links.
-- It does NOT modify Editing Services, service_packages, or service_asset_links.

alter table if exists public.asset_library
  add column if not exists external_download_url text;

-- Ask PostgREST/Supabase API to reload its schema cache immediately.
notify pgrst, 'reload schema';

-- Optional verification:
-- select column_name, data_type
-- from information_schema.columns
-- where table_schema='public'
--   and table_name='asset_library'
--   and column_name='external_download_url';
