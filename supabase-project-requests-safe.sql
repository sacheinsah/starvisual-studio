-- ============================================================
-- STAR VISUALS — PROJECT REQUESTS / ADMIN MIGRATION
-- ============================================================
-- Safe migration:
-- - Does NOT delete existing data
-- - Does NOT drop tables
-- - Does NOT touch courses
-- - Does NOT touch purchases/payments
-- - Does NOT modify authentication
-- - Uses the permanent Supabase Auth UUID for the administrator
-- - Uses public.project_requests for project submissions
-- ============================================================

create extension if not exists pgcrypto;


-- ============================================================
-- 1. PERMANENT PROJECT-REQUEST ADMIN ALLOWLIST
-- ============================================================

create table if not exists public.project_request_admins (
  user_id uuid primary key,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.project_request_admins
  add column if not exists user_id uuid;

alter table public.project_request_admins
  add column if not exists active boolean not null default true;

alter table public.project_request_admins
  add column if not exists created_at timestamptz not null default now();

create index if not exists project_request_admins_active_idx
  on public.project_request_admins (active);

alter table public.project_request_admins enable row level security;


-- ============================================================
-- 2. VERIFY PERMANENT ADMIN ACCOUNT EXISTS
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from auth.users
    where lower(email) = lower('himanshuraj4256@gmail.com')
  ) then
    raise exception
      'Administrator account himanshuraj4256@gmail.com was not found in auth.users';
  end if;
end
$$;


-- ============================================================
-- 3. LINK ADMIN EMAIL TO ITS SUPABASE AUTH UUID
-- ============================================================

insert into public.project_request_admins (
  user_id,
  active
)
select
  id,
  true
from auth.users
where lower(email) = lower('himanshuraj4256@gmail.com')
on conflict (user_id)
do update set active = true;


-- ============================================================
-- 4. VERIFY ADMIN LINK
-- ============================================================

select
  u.id as administrator_user_id,
  u.email,
  a.active as project_request_admin_active
from auth.users u
join public.project_request_admins a
  on a.user_id = u.id
where lower(u.email) = lower('himanshuraj4256@gmail.com');


-- ============================================================
-- 5. SECURE ADMIN CHECK FUNCTION
-- ============================================================

create or replace function public.project_request_admin_check()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_request_admins
    where user_id = auth.uid()
      and active = true
  );
$$;

grant execute
on function public.project_request_admin_check()
to authenticated;


-- ============================================================
-- 6. PROJECT REQUESTS TABLE
-- ============================================================

create table if not exists public.project_requests (
  id uuid primary key default gen_random_uuid(),

  user_id uuid,

  full_name text,
  email text,
  phone text,

  project_name text,
  service_type text,
  video_duration text,
  platform text,
  editing_style text,

  requirements text,

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


-- ============================================================
-- 7. ENSURE ALL EXPECTED COLUMNS EXIST
-- ============================================================

alter table public.project_requests
  add column if not exists user_id uuid;

alter table public.project_requests
  add column if not exists full_name text;

alter table public.project_requests
  add column if not exists email text;

alter table public.project_requests
  add column if not exists phone text;

alter table public.project_requests
  add column if not exists project_name text;

alter table public.project_requests
  add column if not exists service_type text;

alter table public.project_requests
  add column if not exists video_duration text;

alter table public.project_requests
  add column if not exists platform text;

alter table public.project_requests
  add column if not exists editing_style text;

alter table public.project_requests
  add column if not exists requirements text;

alter table public.project_requests
  add column if not exists deadline text;

alter table public.project_requests
  add column if not exists budget text;

alter table public.project_requests
  add column if not exists footage_link text;

alter table public.project_requests
  add column if not exists reference_link text;

alter table public.project_requests
  add column if not exists additional_notes text;

alter table public.project_requests
  add column if not exists status text;

alter table public.project_requests
  add column if not exists admin_notes text;

alter table public.project_requests
  add column if not exists created_at timestamptz
  default now();

alter table public.project_requests
  add column if not exists updated_at timestamptz
  default now();

alter table public.project_requests
  add column if not exists package_name text;

alter table public.project_requests
  add column if not exists amount_inr integer;

alter table public.project_requests
  add column if not exists notes text;


-- ============================================================
-- 8. INDEXES
-- ============================================================

create index if not exists project_requests_user_id_idx
  on public.project_requests (user_id);

create index if not exists project_requests_status_idx
  on public.project_requests (status);

create index if not exists project_requests_created_at_idx
  on public.project_requests (created_at desc);


-- ============================================================
-- 9. ENABLE RLS
-- ============================================================

alter table public.project_requests
  enable row level security;


-- ============================================================
-- 10. DATABASE PRIVILEGES
-- ============================================================

grant select, insert, update
on public.project_requests
to authenticated;


-- ============================================================
-- 11. REPAIR EXISTING LEGACY POLICIES
-- ============================================================

do $$
declare
  select_policy text;
  update_policy text;
begin

  foreach select_policy in array array[
    'project_requests_select_own_or_admin',
    'project_requests_admin_select_all'
  ]
  loop

    if exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'project_requests'
        and policyname = select_policy
    ) then

      execute format(
        'alter policy %I on public.project_requests
         using (
           auth.uid() = user_id
           or public.project_request_admin_check()
         )',
        select_policy
      );

    end if;

  end loop;


  foreach update_policy in array array[
    'project_requests_admin_update',
    'project_requests_admin_update_all'
  ]
  loop

    if exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'project_requests'
        and policyname = update_policy
    ) then

      execute format(
        'alter policy %I on public.project_requests
         using (public.project_request_admin_check())
         with check (public.project_request_admin_check())',
        update_policy
      );

    end if;

  end loop;


  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'project_requests'
      and policyname = 'project_requests_admin_delete'
  ) then

    alter policy project_requests_admin_delete
      on public.project_requests
      using (public.project_request_admin_check());

  end if;

end
$$;


-- ============================================================
-- 12. UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.project_requests_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


do $$
begin

  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.project_requests'::regclass
      and tgname = 'project_requests_set_updated_at'
  ) then

    create trigger project_requests_set_updated_at
      before update
      on public.project_requests
      for each row
      execute function public.project_requests_set_updated_at();

  end if;

end
$$;


-- ============================================================
-- 13. USER INSERT POLICY
-- ============================================================

do $$
begin

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'project_requests'
      and policyname = 'project_requests_user_insert_own'
  ) then

    create policy project_requests_user_insert_own
      on public.project_requests
      for insert
      to authenticated
      with check (
        auth.uid() = user_id
      );

  end if;

end
$$;


-- ============================================================
-- 14. USER VIEW OWN REQUESTS
-- ============================================================

do $$
begin

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'project_requests'
      and policyname = 'project_requests_user_select_own'
  ) then

    create policy project_requests_user_select_own
      on public.project_requests
      for select
      to authenticated
      using (
        auth.uid() = user_id
      );

  end if;

end
$$;


-- ============================================================
-- 15. ADMIN VIEW ALL REQUESTS
-- ============================================================

do $$
begin

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'project_requests'
      and policyname = 'project_requests_admin_select_all'
  ) then

    create policy project_requests_admin_select_all
      on public.project_requests
      for select
      to authenticated
      using (
        public.project_request_admin_check()
      );

  end if;

end
$$;


-- ============================================================
-- 16. ADMIN UPDATE REQUESTS
-- ============================================================

do $$
begin

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'project_requests'
      and policyname = 'project_requests_admin_update_all'
  ) then

    create policy project_requests_admin_update_all
      on public.project_requests
      for update
      to authenticated
      using (
        public.project_request_admin_check()
      )
      with check (
        public.project_request_admin_check()
      );

  end if;

end
$$;


-- ============================================================
-- 17. RELOAD SUPABASE / POSTGREST SCHEMA CACHE
-- ============================================================

notify pgrst, 'reload schema';


-- ============================================================
-- 18. VERIFY PROJECT REQUEST TABLE
-- ============================================================

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'project_requests'
order by ordinal_position;


-- ============================================================
-- 19. VERIFY RLS POLICIES
-- ============================================================

select
  policyname,
  cmd,
  roles
from pg_policies
where schemaname = 'public'
  and tablename = 'project_requests'
order by policyname;


-- ============================================================
-- 20. FINAL ADMIN VERIFICATION
-- ============================================================

select
  u.email,
  u.id as administrator_uuid,
  a.active
from auth.users u
left join public.project_request_admins a
  on a.user_id = u.id
where lower(u.email) = lower('himanshuraj4256@gmail.com');