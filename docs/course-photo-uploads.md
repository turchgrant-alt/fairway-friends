# Course Photo Upload Setup

GolfeR v1 uses Supabase Storage plus a public metadata table for uploaded course photos.

## Required environment variables

Add these to your local `.env`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_SUPABASE_COURSE_PHOTO_BUCKET=course-photos
VITE_SUPABASE_COURSE_PHOTOS_TABLE=course_photos
```

`VITE_SUPABASE_COURSE_PHOTO_BUCKET` and `VITE_SUPABASE_COURSE_PHOTOS_TABLE` are optional. The app defaults to `course-photos` and `course_photos`.

## Storage bucket

Create a public Storage bucket named `course-photos`.

Uploaded image files are stored under:

```text
courseId/random-id-file-name.jpg
```

## Metadata table

Run this SQL in Supabase:

```sql
create table if not exists public.course_photos (
  id text primary key,
  course_id text not null,
  image_url text not null,
  thumbnail_url text,
  storage_path text not null unique,
  uploaded_at timestamptz not null default now(),
  uploaded_by text,
  is_cover boolean not null default false,
  caption text,
  status text default 'published'
);

create index if not exists course_photos_course_id_idx on public.course_photos (course_id);
create index if not exists course_photos_cover_idx on public.course_photos (course_id, is_cover desc, uploaded_at asc);

alter table public.course_photos enable row level security;

create policy "Public course photo reads"
on public.course_photos
for select
to anon
using (true);

create policy "Public course photo inserts"
on public.course_photos
for insert
to anon
with check (true);

create policy "Public course photo updates"
on public.course_photos
for update
to anon
using (true)
with check (true);
```

## v1 note

This setup is intentionally permissive so the no-auth demo can upload and pick course covers with the anon key. For a production system, tighten RLS and require authenticated users before allowing writes.
