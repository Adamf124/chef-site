-- Chef portfolio schema
-- Run this in the Supabase SQL editor or via `supabase db push`.

-- ---------------------------------------------------------------------------
-- Admin check. These emails may sign in and write. Set both here.
-- ---------------------------------------------------------------------------
create or replace function public.admin_emails()
returns text[]
language sql
immutable
as $$
  -- TODO: set the real emails (his + yours)
  select array['famasamos@gmail.com', 'adam.ferguson124@gmail.com']
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
as $$
  select (auth.jwt() ->> 'email') = any (public.admin_emails())
$$;

-- ---------------------------------------------------------------------------
-- media: one row per photo or video
-- ---------------------------------------------------------------------------
create table public.media (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  storage_path text not null,                 -- path within the 'media' bucket
  type         text not null check (type in ('image', 'video')),
  title        text,                           -- dish name, shown on hover
  note         text,                           -- optional longer caption
  published    boolean not null default true,  -- hide a piece without deleting
  featured     boolean not null default false, -- pin to the top of the grid
  sort_order   int not null default 0
);

alter table public.media enable row level security;

-- Anyone can read published media (the public gallery).
create policy "published media is public"
  on public.media for select
  using (published = true);

-- The owner can read everything, including unpublished.
create policy "owner reads all media"
  on public.media for select
  using (public.is_owner());

-- Only the owner can create, edit, or remove media.
create policy "owner writes media"
  on public.media for all
  using (public.is_owner())
  with check (public.is_owner());

create index media_display_idx
  on public.media (featured desc, sort_order asc, created_at desc)
  where published = true;

-- ---------------------------------------------------------------------------
-- inquiries: someone reaching out. `interest` is the experiment: it tells him
-- what people actually want from him.
-- ---------------------------------------------------------------------------
create table public.inquiries (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null,
  email      text not null,
  interest   text,     -- e.g. 'private-dinner', 'catering', 'classes', 'other'
  message    text,
  handled    boolean not null default false
);

alter table public.inquiries enable row level security;

-- Anyone can submit an inquiry.
create policy "anyone can submit an inquiry"
  on public.inquiries for insert
  with check (true);

-- Only the owner can read or update them.
create policy "owner reads inquiries"
  on public.inquiries for select
  using (public.is_owner());

create policy "owner updates inquiries"
  on public.inquiries for update
  using (public.is_owner())
  with check (public.is_owner());

-- ---------------------------------------------------------------------------
-- Storage: a 'media' bucket. Public read, owner-only write.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "public read media bucket"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "owner writes media bucket"
  on storage.objects for insert
  with check (bucket_id = 'media' and public.is_owner());

create policy "owner updates media bucket"
  on storage.objects for update
  using (bucket_id = 'media' and public.is_owner());

create policy "owner deletes media bucket"
  on storage.objects for delete
  using (bucket_id = 'media' and public.is_owner());
