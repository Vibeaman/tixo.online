-- ============================================================
-- PLANAM.IO — Supabase Migration
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. EVENTS TABLE
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  date text not null,
  time text,
  location text,
  category text,
  image text,
  organizer_id uuid references public.profiles(id),
  organizer_name text,
  ticket_tiers jsonb default '[]'::jsonb,
  tags text[] default '{}',
  is_featured boolean default false,
  watchers int default 0,
  demand int default 0,
  created_at timestamptz default now()
);

alter table public.events enable row level security;

create policy "Events are viewable by everyone"
  on public.events for select using (true);

create policy "Authenticated users can create events"
  on public.events for insert with check (auth.uid() = organizer_id);

create policy "Organizers can update own events"
  on public.events for update using (auth.uid() = organizer_id);

create policy "Organizers can delete own events"
  on public.events for delete using (auth.uid() = organizer_id);


-- 3. TICKETS TABLE
create table if not exists public.tickets (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  event_title text,
  tier_name text,
  quantity int default 1,
  total_price numeric default 0,
  purchased_at timestamptz default now()
);

alter table public.tickets enable row level security;

create policy "Users can view own tickets"
  on public.tickets for select using (auth.uid() = user_id);

create policy "Authenticated users can purchase tickets"
  on public.tickets for insert with check (auth.uid() = user_id);


