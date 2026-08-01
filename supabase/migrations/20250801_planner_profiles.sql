create table if not exists planner_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  account_name text not null,
  bank_name text not null,
  account_number text not null,
  bvn text not null,
  nin text not null,
  disclaimer_accepted boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table planner_profiles enable row level security;

create policy "Users can view own planner profile"
  on planner_profiles for select using (auth.uid() = user_id);

create policy "Users can insert own planner profile"
  on planner_profiles for insert with check (auth.uid() = user_id);

create policy "Users can update own planner profile"
  on planner_profiles for update using (auth.uid() = user_id);
