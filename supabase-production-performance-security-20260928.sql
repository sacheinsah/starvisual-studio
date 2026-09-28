-- STAR VISUALS — production performance/security hardening
-- Applied to production starvisual-studio on 2026-09-28.
-- Safe/additive: no data reset, table drops, storage deletion, or auth reset.
--
-- This migration documents the verified production changes:
-- 1) Cover enrollments.course_id foreign-key lookups.
-- 2) Cache auth.uid()/admin helper evaluation inside RLS policies.
-- 3) Consolidate overlapping permissive SELECT/INSERT policies.
-- 4) Restrict security-definer helper RPC execution from PUBLIC/anon.
-- 5) Pin the project request timestamp trigger search_path.

create index if not exists enrollments_course_id_idx
  on public.enrollments (course_id);

drop policy if exists "project_requests_user_insert_own" on public.project_requests;
create policy "project_requests_user_insert_own" on public.project_requests
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "project_requests_admin_select_all" on public.project_requests;
drop policy if exists "project_requests_user_select_own" on public.project_requests;
create policy "project_requests_user_or_admin_select" on public.project_requests
  for select to authenticated
  using ((user_id = (select auth.uid())) or (select project_request_admin_check()));

drop policy if exists "project_requests_admin_update_all" on public.project_requests;
create policy "project_requests_admin_update_all" on public.project_requests
  for update to authenticated
  using ((select project_request_admin_check()))
  with check ((select project_request_admin_check()));

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select to authenticated
  using ((id = (select auth.uid())) or (select is_admin()));

drop policy if exists "users can create their own enrollments" on public.enrollments;
create policy "users can create their own enrollments" on public.enrollments
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "users can view their own enrollments" on public.enrollments;
create policy "users can view their own enrollments" on public.enrollments
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins can insert course lessons" on public.course_lessons;
drop policy if exists "admins can insert course lesson" on public.course_lessons;
create policy "admins can insert course lesson" on public.course_lessons
  for insert to authenticated
  with check ((select is_admin()));

drop policy if exists "course_lessons_select_enrolled_or_admin" on public.course_lessons;
-- Existing authenticated SELECT=true access is preserved.

drop policy if exists "Public can read published courses" on public.courses;
drop policy if exists "anyone can view courses" on public.courses;
create policy "Public can read published courses" on public.courses
  for select to anon, authenticated
  using ((published = true) or (select is_admin()));

revoke execute on function public.is_admin() from public;
revoke execute on function public.project_request_admin_check() from public;
revoke execute on function public.rls_auto_enable() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.project_request_admin_check() to authenticated;

create or replace function public.project_requests_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;
