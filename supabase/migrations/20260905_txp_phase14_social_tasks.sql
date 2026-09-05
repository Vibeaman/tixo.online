-- ============================================================
-- TXP Phase 14 -- Reshare / Social Tasks
-- Simple admin-managed tasks like "Follow on IG", "Follow on X".
-- Self-reported completion (user clicks "I've done this"), one-time
-- per user per task, tracked in txp_transactions like every other
-- earning action so it shows up in wallet history automatically.
-- ============================================================

create table if not exists public.txp_social_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  platform text not null default 'other' check (platform in ('instagram', 'x', 'tiktok', 'youtube', 'whatsapp', 'other')),
  link_url text not null,
  reward_amount integer not null default 5 check (reward_amount > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.txp_social_task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.txp_social_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  awarded_txp integer not null,
  completed_at timestamptz not null default now(),
  unique (task_id, user_id)
);

alter table public.txp_social_tasks enable row level security;
alter table public.txp_social_task_completions enable row level security;

-- Everyone signed in can see active tasks
create policy "Anyone can read active social tasks" on public.txp_social_tasks
  for select using (is_active = true);

-- Admins can see + manage all tasks
create policy "Admins can read all social tasks" on public.txp_social_tasks
  for select using (public.is_admin());

create policy "Admins can insert social tasks" on public.txp_social_tasks
  for insert with check (public.is_admin());

create policy "Admins can update social tasks" on public.txp_social_tasks
  for update using (public.is_admin()) with check (public.is_admin());

create policy "Admins can delete social tasks" on public.txp_social_tasks
  for delete using (public.is_admin());

-- Users can see + insert only their own completions (self-reported "I did this")
create policy "Users can read own completions" on public.txp_social_task_completions
  for select using (auth.uid() = user_id);

create policy "Users can insert own completions" on public.txp_social_task_completions
  for insert with check (auth.uid() = user_id);

-- Admins can see every completion (to review who completed what)
create policy "Admins can read all completions" on public.txp_social_task_completions
  for select using (public.is_admin());
