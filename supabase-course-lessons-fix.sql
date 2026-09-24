-- STAR VISUALS — enrolled course learning / lecture player fix
-- Run once in Supabase SQL Editor.
-- Keeps Editing Services untouched.

-- Materials attached to an individual course lecture (PDFs, files, or external links).
create table if not exists public.course_lesson_materials (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  title text not null,
  material_type text not null default 'file',
  file_path text,
  external_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_lesson_materials_source_check check (file_path is not null or external_url is not null)
);

alter table public.course_lesson_materials enable row level security;

drop policy if exists "course_lesson_materials_select_enrolled_or_admin" on public.course_lesson_materials;
create policy "course_lesson_materials_select_enrolled_or_admin"
on public.course_lesson_materials
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.course_lessons cl
    join public.enrollments e on e.course_id = cl.course_id
    where cl.id = course_lesson_materials.lesson_id
      and e.user_id = auth.uid()
  )
);

drop policy if exists "course_lesson_materials_admin_insert" on public.course_lesson_materials;
create policy "course_lesson_materials_admin_insert"
on public.course_lesson_materials
for insert to authenticated
with check (public.is_admin());

drop policy if exists "course_lesson_materials_admin_update" on public.course_lesson_materials;
create policy "course_lesson_materials_admin_update"
on public.course_lesson_materials
for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "course_lesson_materials_admin_delete" on public.course_lesson_materials;
create policy "course_lesson_materials_admin_delete"
on public.course_lesson_materials
for delete to authenticated
using (public.is_admin());

grant select on public.course_lesson_materials to authenticated;
grant insert, update, delete on public.course_lesson_materials to authenticated;

drop trigger if exists course_lesson_materials_updated_at on public.course_lesson_materials;
create trigger course_lesson_materials_updated_at
before update on public.course_lesson_materials
for each row execute procedure public.set_updated_at();

-- Published lesson rows are readable only by enrolled users or admins.
drop policy if exists "course_lessons_select_authenticated" on public.course_lessons;
drop policy if exists "course_lessons_select_enrolled_or_admin" on public.course_lessons;
create policy "course_lessons_select_enrolled_or_admin"
on public.course_lessons
for select to authenticated
using (
  public.is_admin()
  or (
    published = true
    and exists (
      select 1 from public.enrollments e
      where e.course_id = course_lessons.course_id
        and e.user_id = auth.uid()
    )
  )
);

grant select on public.course_lessons to authenticated;

-- Keep course files private. The first storage path folder must be the course UUID,
-- e.g. <course-id>/lecture.mp4 or <course-id>/materials/notes.pdf.
drop policy if exists "course_files_enrolled_read" on storage.objects;
create policy "course_files_enrolled_read"
on storage.objects
for select to authenticated
using (
  bucket_id = 'course-files'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.enrollments e
      where e.user_id = auth.uid()
        and e.course_id::text = (storage.foldername(name))[1]
    )
  )
);

notify pgrst, 'reload schema';
