-- STAR VISUALS — Supabase database
-- Run this whole file once in Supabase SQL Editor.
-- It creates real profiles, courses, purchases and editing deals with RLS.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.purchase_status as enum ('pending', 'paid', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.deal_status as enum ('enquiry', 'confirmed', 'in_progress', 'review', 'completed', 'cancelled');
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

create table if not exists public.editing_deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_name text not null,
  package_name text,
  amount_inr integer,
  status public.deal_status not null default 'enquiry',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

drop trigger if exists editing_deals_updated_at on public.editing_deals;
create trigger editing_deals_updated_at before update on public.editing_deals
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
alter table public.editing_deals enable row level security;

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

-- Editing deals: users can see their own. Admins can manage all.

drop policy if exists "deals_user_insert_own" on public.editing_deals;
create policy "deals_user_insert_own"
on public.editing_deals for insert
with check (user_id = auth.uid());
drop policy if exists "deals_select_own_or_admin" on public.editing_deals;
create policy "deals_select_own_or_admin"
on public.editing_deals for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "deals_admin_insert" on public.editing_deals;
create policy "deals_admin_insert"
on public.editing_deals for insert
with check (public.is_admin());

drop policy if exists "deals_admin_update" on public.editing_deals;
create policy "deals_admin_update"
on public.editing_deals for update
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "deals_admin_delete" on public.editing_deals;
create policy "deals_admin_delete"
on public.editing_deals for delete
using (public.is_admin());

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
