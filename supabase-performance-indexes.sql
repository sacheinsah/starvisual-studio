-- STAR VISUALS — additive performance indexes
-- Safe for production: creates indexes only; no data/table reset.
-- Run after the existing Star Visuals schema migrations.

create index if not exists asset_library_published_created_idx
  on public.asset_library (published, created_at desc);

create index if not exists asset_library_published_category_created_idx
  on public.asset_library (published, category, created_at desc);

create index if not exists asset_library_published_access_created_idx
  on public.asset_library (published, access_type, created_at desc);

create index if not exists asset_library_published_downloads_idx
  on public.asset_library (published, downloads_count desc);

create index if not exists asset_library_published_featured_idx
  on public.asset_library (published, featured, created_at desc);

create index if not exists asset_library_published_trending_idx
  on public.asset_library (published, trending, created_at desc);

create index if not exists courses_published_sort_created_idx
  on public.courses (published, sort_order, created_at desc);

create index if not exists course_lessons_course_published_order_idx
  on public.course_lessons (course_id, published, lesson_order, created_at);

create index if not exists enrollments_user_course_idx
  on public.enrollments (user_id, course_id);

create index if not exists service_packages_published_sort_idx
  on public.service_packages (published, sort_order);

create index if not exists project_requests_user_updated_idx
  on public.project_requests (user_id, updated_at desc);
