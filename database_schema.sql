-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create folders table
create table public.folders (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create sections table
create table public.sections (
    id uuid default uuid_generate_v4() primary key,
    folder_id uuid references public.folders(id) on delete cascade not null,
    title text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create pages table
create table public.pages (
    id uuid default uuid_generate_v4() primary key,
    folder_id uuid references public.folders(id) on delete cascade not null,
    section_id uuid references public.sections(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    content jsonb, -- Storing Tiptap JSON format
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security
alter table public.folders enable row level security;
alter table public.sections enable row level security;
alter table public.pages enable row level security;

-- Create policies so users can only access their own data
create policy "Users can view their own folders" on public.folders for select using (auth.uid() = user_id);
create policy "Users can insert their own folders" on public.folders for insert with check (auth.uid() = user_id);
create policy "Users can update their own folders" on public.folders for update using (auth.uid() = user_id);
create policy "Users can delete their own folders" on public.folders for delete using (auth.uid() = user_id);

-- For sections, we check if the section's folder belongs to the user
create policy "Users can view sections of their folders" on public.sections for select using (
    exists (select 1 from public.folders f where f.id = folder_id and f.user_id = auth.uid())
);
create policy "Users can insert sections in their folders" on public.sections for insert with check (
    exists (select 1 from public.folders f where f.id = folder_id and f.user_id = auth.uid())
);
create policy "Users can update their sections" on public.sections for update using (
    exists (select 1 from public.folders f where f.id = folder_id and f.user_id = auth.uid())
);
create policy "Users can delete their sections" on public.sections for delete using (
    exists (select 1 from public.folders f where f.id = folder_id and f.user_id = auth.uid())
);

-- Pages policies
create policy "Users can view their own pages" on public.pages for select using (auth.uid() = user_id);
create policy "Users can insert their own pages" on public.pages for insert with check (auth.uid() = user_id);
create policy "Users can update their own pages" on public.pages for update using (auth.uid() = user_id);
create policy "Users can delete their own pages" on public.pages for delete using (auth.uid() = user_id);
