-- ============================================================
-- Phase 15 -- Site-wide announcement banners (admin-managed)
-- ============================================================
-- Lets admins post an important message that shows as a banner across
-- every page for every visitor (e.g. maintenance notice, new feature,
-- promo). Only one is "active" at a time in practice, but the schema
-- supports scheduling/multiple and the app just shows the most recent
-- active one whose start/end window includes now.

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  level text not null default 'info' check (level in ('info', 'success', 'warning', 'critical')),
  link_url text,
  link_label text,
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

-- Anyone (including logged-out visitors) can read active announcements
-- currently in their scheduling window -- this is public marketing/status
-- copy, not sensitive data.
create policy "Anyone can read active announcements" on public.announcements
  for select using (
    is_active = true
    and starts_at <= now()
    and (ends_at is null or ends_at > now())
  );

-- Only real admins can create, edit, or delete announcements.
create policy "Admins can read all announcements" on public.announcements
  for select using (public.is_admin());

create policy "Admins can insert announcements" on public.announcements
  for insert with check (public.is_admin());

create policy "Admins can update announcements" on public.announcements
  for update using (public.is_admin()) with check (public.is_admin());

create policy "Admins can delete announcements" on public.announcements
  for delete using (public.is_admin());
