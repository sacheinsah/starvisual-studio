-- STAR VISUALS — Supabase database
-- Run this whole file once in Supabase SQL Editor.
-- It creates real profiles, courses and purchases with RLS.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.purchase_status as enum ('pending', 'paid', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  category text,
  description text,
  duration text,
  delivery text,
  price_inr integer,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.course_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  status public.purchase_status not null default 'pending',
  amount_inr integer,
  payment_provider text,
  payment_reference text,
  progress integer not null default 0 check (progress between 0 and 100),
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- Canonical project request table used by Project Brief, My Studio and Admin Studio.
-- Safe to run on an existing project: create the table if absent, then add only missing columns.
create table if not exists public.project_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  project_name text not null,
  service_type text not null default '',
  video_duration text,
  platform text,
  editing_style text,
  requirements text not null default '',
  deadline text,
  budget text,
  footage_link text,
  reference_link text,
  additional_notes text,
  status text not null default 'NEW',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  package_name text,
  amount_inr integer,
  notes text
);

alter table public.project_requests add column if not exists user_id uuid;
alter table public.project_requests add column if not exists full_name text;
alter table public.project_requests add column if not exists email text;
alter table public.project_requests add column if not exists phone text;
alter table public.project_requests add column if not exists project_name text;
alter table public.project_requests add column if not exists service_type text;
alter table public.project_requests add column if not exists video_duration text;
alter table public.project_requests add column if not exists platform text;
alter table public.project_requests add column if not exists editing_style text;
alter table public.project_requests add column if not exists requirements text;
alter table public.project_requests add column if not exists deadline text;
alter table public.project_requests add column if not exists budget text;
alter table public.project_requests add column if not exists footage_link text;
alter table public.project_requests add column if not exists reference_link text;
alter table public.project_requests add column if not exists additional_notes text;
alter table public.project_requests add column if not exists status text;
alter table public.project_requests add column if not exists admin_notes text;
alter table public.project_requests add column if not exists created_at timestamptz default now();
alter table public.project_requests add column if not exists updated_at timestamptz default now();
alter table public.project_requests add column if not exists package_name text;
alter table public.project_requests add column if not exists amount_inr integer;
alter table public.project_requests add column if not exists notes text;

create index if not exists project_requests_user_id_idx on public.project_requests(user_id);
create index if not exists project_requests_status_idx on public.project_requests(status);
create index if not exists project_requests_created_at_idx on public.project_requests(created_at desc);

create type public.asset_access_type as enum ('free', 'premium');

create table if not exists public.asset_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null default 'Other Creative Assets',
  thumbnail_url text,
  preview_url text,
  file_url text,
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

create table if not exists public.user_asset_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  asset_id uuid not null references public.asset_library(id) on delete cascade,
  access_type public.asset_access_type not null default 'premium',
  status text not null default 'downloaded' check (status in ('downloaded', 'purchased', 'available')),
  created_at timestamptz not null default now(),
  unique (user_id, asset_id)
);

-- Keep profile data synchronized with Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists project_requests_updated_at on public.project_requests;
create trigger project_requests_updated_at before update on public.project_requests
for each row execute procedure public.set_updated_at();

drop trigger if exists asset_library_updated_at on public.asset_library;
create trigger asset_library_updated_at before update on public.asset_library
for each row execute procedure public.set_updated_at();

-- Helper used only inside RLS policies. It avoids exposing admin logic to the client.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_purchases enable row level security;
alter table public.project_requests enable row level security;
alter table public.asset_library enable row level security;
alter table public.user_asset_access enable row level security;

-- Profiles: users can read/update only their own profile. Admins can read all.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- Courses are public to read when published. Admins can manage them.
drop policy if exists "courses_public_read" on public.courses;
create policy "courses_public_read"
on public.courses for select
using (published = true or public.is_admin());

drop policy if exists "courses_admin_insert" on public.courses;
create policy "courses_admin_insert"
on public.courses for insert
with check (public.is_admin());

drop policy if exists "courses_admin_update" on public.courses;
create policy "courses_admin_update"
on public.courses for update
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "courses_admin_delete" on public.courses;
create policy "courses_admin_delete"
on public.courses for delete
using (public.is_admin());

-- Purchases: users can see only their own. Admins can see/manage all.
drop policy if exists "purchases_select_own_or_admin" on public.course_purchases;
create policy "purchases_select_own_or_admin"
on public.course_purchases for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "purchases_admin_insert" on public.course_purchases;
create policy "purchases_admin_insert"
on public.course_purchases for insert
with check (public.is_admin());

drop policy if exists "purchases_admin_update" on public.course_purchases;
create policy "purchases_admin_update"
on public.course_purchases for update
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "purchases_admin_delete" on public.course_purchases;
create policy "purchases_admin_delete"
on public.course_purchases for delete
using (public.is_admin());

-- Project requests: users can create and read only their own requests. Admins manage all.
drop policy if exists "project_requests_user_insert_own" on public.project_requests;
create policy "project_requests_user_insert_own"
on public.project_requests for insert
with check (user_id = auth.uid());

drop policy if exists "project_requests_select_own_or_admin" on public.project_requests;
create policy "project_requests_select_own_or_admin"
on public.project_requests for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "project_requests_admin_update" on public.project_requests;
create policy "project_requests_admin_update"
on public.project_requests for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "project_requests_admin_delete" on public.project_requests;
create policy "project_requests_admin_delete"
on public.project_requests for delete
using (public.is_admin());

-- Asset library: published assets are public to read. Admins manage all.
drop policy if exists "assets_public_read" on public.asset_library;
create policy "assets_public_read"
on public.asset_library for select
using (published = true or public.is_admin());

drop policy if exists "assets_admin_insert" on public.asset_library;
create policy "assets_admin_insert"
on public.asset_library for insert
with check (public.is_admin());

drop policy if exists "assets_admin_update" on public.asset_library;
create policy "assets_admin_update"
on public.asset_library for update
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "assets_admin_delete" on public.asset_library;
create policy "assets_admin_delete"
on public.asset_library for delete
using (public.is_admin());

-- User asset records: users can see their own access list; admins can read all.
drop policy if exists "user_assets_select_own_or_admin" on public.user_asset_access;
create policy "user_assets_select_own_or_admin"
on public.user_asset_access for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "user_assets_insert_own" on public.user_asset_access;
create policy "user_assets_insert_own"
on public.user_asset_access for insert
with check (user_id = auth.uid());

drop policy if exists "user_assets_update_own" on public.user_asset_access;
create policy "user_assets_update_own"
on public.user_asset_access for update
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Starter course catalog. These are public course records, not purchases.
insert into public.courses (id, title, slug, category, description, duration, delivery, price_inr, sort_order)
values
  ('11111111-1111-4111-8111-111111111111', 'Editing From Scratch', 'editing-from-scratch', 'FOUNDATION', 'A complete foundation for creators: project setup, clean cuts, pacing, music, dialogue, colour basics and export.', '4 WEEKS', 'LIVE + PRACTICE', null, 1),
  ('22222222-2222-4222-8222-222222222222', 'Cinematic Editing', 'cinematic-editing', 'CINEMATIC', 'Learn to create mood with rhythm, music, composition, sound design, colour and intentional transitions.', '5 WEEKS', 'LIVE + PROJECTS', null, 2),
  ('33333333-3333-4333-8333-333333333333', 'Motion & VFX', 'motion-vfx', 'MOTION + VFX', 'Explore motion graphics, visual effects, compositing and post-production techniques that add impact without clutter.', '4 WEEKS', 'LIVE + PRACTICE', null, 3)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  duration = excluded.duration,
  delivery = excluded.delivery,
  sort_order = excluded.sort_order;

-- IMPORTANT:
-- Do not manually create course_purchases from the public website to represent a payment.
-- The next build will add Stripe Checkout + a secure webhook that marks purchases as paid.
