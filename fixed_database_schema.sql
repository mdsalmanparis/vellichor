-- This script provides the corrected schema and RLS policies to fix deletion errors.
-- You should run this script in the SQL Editor in your Supabase project.
-- It assumes your tables have `is_deleted` columns, which are necessary for the app's trash feature.

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Alter tables to ensure they have the `is_deleted` column.
-- If these columns already exist, these commands will produce a notice but will not fail.
alter table public.folders add column if not exists is_deleted boolean default false not null;
alter table public.sections add column if not exists is_deleted boolean default false not null;
alter table public.pages add column if not exists is_deleted boolean default false not null;


-- 2. Turn on Row Level Security (if not already on)
alter table public.folders enable row level security;
alter table public.sections enable row level security;
alter table public.pages enable row level security;


-- 3. Define corrected RLS POLICIES
-- The key change is to make SELECT policies simpler. They should only check for ownership.
-- The application code is already responsible for filtering out items where `is_deleted = true`.
-- This allows the DELETE policies for nested items to work correctly, as they can now "see"
-- their soft-deleted parent items during the security check.

-- FOLDERS
-- Drop existing policies first to avoid conflicts when re-creating them.
drop policy if exists "Users can view their own folders" on public.folders;
drop policy if exists "Users can insert their own folders" on public.folders;
drop policy if exists "Users can update their own folders" on public.folders;
drop policy if exists "Users can delete their own folders" on public.folders;

-- Policies for folders only need to check the user_id.
create policy "Users can view their own folders" on public.folders for select using (auth.uid() = user_id);
create policy "Users can insert their own folders" on public.folders for insert with check (auth.uid() = user_id);
create policy "Users can update their own folders" on public.folders for update using (auth.uid() = user_id);
create policy "Users can delete their own folders" on public.folders for delete using (auth.uid() = user_id);


-- SECTIONS
-- Drop existing policies first to avoid conflicts.
drop policy if exists "Users can view sections of their folders" on public.sections;
drop policy if exists "Users can insert sections in their folders" on public.sections;
drop policy if exists "Users can update their sections" on public.sections;
drop policy if exists "Users can delete their sections" on public.sections;

-- Policies for sections must check that the user owns the parent folder.
-- Because the folder SELECT policy is now simpler, this check will work even if the folder is soft-deleted.
create policy "Users can view sections of their folders" on public.sections for select using ( exists (select 1 from public.folders f where f.id = folder_id and f.user_id = auth.uid()) );
create policy "Users can insert sections in their folders" on public.sections for insert with check ( exists (select 1 from public.folders f where f.id = folder_id and f.user_id = auth.uid()) );
create policy "Users can update their sections" on public.sections for update using ( exists (select 1 from public.folders f where f.id = folder_id and f.user_id = auth.uid()) );
create policy "Users can delete their sections" on public.sections for delete using ( exists (select 1 from public.folders f where f.id = folder_id and f.user_id = auth.uid()) );


-- PAGES
-- Drop existing policies first to avoid conflicts.
drop policy if exists "Users can view their own pages" on public.pages;
drop policy if exists "Users can insert their own pages" on public.pages;
drop policy if exists "Users can update their own pages" on public.pages;
drop policy if exists "Users can delete their own pages" on public.pages;

-- Policies for pages only need to check the user_id.
create policy "Users can view their own pages" on public.pages for select using (auth.uid() = user_id);
create policy "Users can insert their own pages" on public.pages for insert with check (auth.uid() = user_id);
create policy "Users can update their own pages" on public.pages for update using (auth.uid() = user_id);
create policy "Users can delete their own pages" on public.pages for delete using (auth.uid() = user_id);

