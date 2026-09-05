-- ============================================================
-- TXP (Tixo Points) Phase 10 -- Anti-Fraud & Audit
-- ============================================================

-- 1. Daily earning caps per rule (nullable = unlimited)
alter table public.txp_rules add column if not exists daily_cap integer;

-- 2. Wallet freeze support
alter table public.txp_wallets add column if not exists is_frozen boolean not null default false;
alter table public.txp_wallets add column if not exists frozen_reason text;
alter table public.txp_wallets add column if not exists frozen_at timestamptz;

-- 3. Ticket refund tracking
alter table public.tickets add column if not exists refund_status text not null default 'none';
alter table public.tickets add column if not exists refunded_at timestamptz;
alter table public.tickets add column if not exists refunded_by text;

-- 4. Fraud flags -- system/admin-raised suspicious-activity flags
create table if not exists public.txp_fraud_flags (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  flag_type      text not null,                 -- e.g. 'mass_referrals', 'rapid_shares', 'high_velocity_earning', 'rate_limit_hit'
  severity       text not null default 'low',   -- 'low' | 'medium' | 'high'
  reason         text not null,                 -- human-readable explanation
  metadata       jsonb default '{}',
  status         text not null default 'open',  -- 'open' | 'reviewing' | 'resolved' | 'dismissed'
  created_at     timestamptz not null default now(),
  resolved_at    timestamptz,
  resolved_by    text,
  resolution_note text
);

create index if not exists idx_txp_fraud_flags_user   on public.txp_fraud_flags (user_id);
create index if not exists idx_txp_fraud_flags_status  on public.txp_fraud_flags (status);

-- 5. Audit log -- records every admin/system action against a user's TXP wallet
create table if not exists public.txp_audit_log (
  id             uuid primary key default gen_random_uuid(),
  actor          text,                          -- free-text admin identity (no formal admin auth yet)
  action         text not null,                 -- e.g. 'freeze_wallet', 'unfreeze_wallet', 'resolve_fraud_flag', 'reverse_ticket_points'
  target_user_id uuid,
  metadata       jsonb default '{}',
  created_at     timestamptz not null default now()
);

create index if not exists idx_txp_audit_log_target      on public.txp_audit_log (target_user_id);
create index if not exists idx_txp_audit_log_created_at  on public.txp_audit_log (created_at desc);

-- RLS
alter table public.txp_fraud_flags enable row level security;
alter table public.txp_audit_log   enable row level security;

-- Users can read their own fraud flags
create policy "Users read own fraud flags" on public.txp_fraud_flags
  for select using (auth.uid() = user_id);

-- Users can read their own audit log entries
create policy "Users read own audit log" on public.txp_audit_log
  for select using (auth.uid() = target_user_id);

-- NOTE ON WRITE ACCESS:
-- This app has no service-role backend for TXP -- every existing txp_* table
-- (txp_wallets, txp_transactions, txp_rules, txp_referrals, txp_redemptions) is
-- written to directly by TxpService using the anon/publishable Supabase client,
-- from both regular user flows (client-side award calls) and the passcode-gated
-- admin panel (AdminTxp.jsx), which has no distinct Postgres role of its own.
-- None of the committed migrations for those tables define INSERT/UPDATE policies
-- scoped to a service role or an "is_admin" claim, yet admin award/deduct/rule-edit
-- writes work in production today -- meaning permissive write access for these
-- tables already exists on the live project (most likely added ad-hoc via the
-- Supabase dashboard and never captured in a migration file).
-- To keep the new fraud/audit tables usable by that same anon-client admin panel
-- (and by client-side rate-limit/flag inserts during normal earning flows) without
-- inventing a stricter scheme that would silently break AdminTxp.jsx, we mirror the
-- existing "public config" pattern (see "Anyone can read rules" on txp_rules,
-- using (true) with no role restriction) and extend it with explicit, equally
-- permissive write policies. No DELETE policy is added since nothing deletes
-- these rows client-side.
create policy "Anyone can insert fraud flags" on public.txp_fraud_flags
  for insert with check (true);

create policy "Anyone can update fraud flags" on public.txp_fraud_flags
  for update using (true) with check (true);

create policy "Anyone can insert audit log" on public.txp_audit_log
  for insert with check (true);

-- Seed sensible daily caps for a few high-abuse-risk actions.
-- Uses UPDATE so this is a no-op if the rule row doesn't exist.
update public.txp_rules set daily_cap = 100 where action = 'event_shared';
update public.txp_rules set daily_cap = 500 where action = 'referral_registered'; -- 500 pts / 100 pts per referral = 5 referrals/day
