-- ============================================================
-- TXP (Tixo Points) Phase 1 -- Foundation
-- ============================================================

-- 1. Wallets -- one per user
create table if not exists public.txp_wallets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  available    integer not null default 0,
  pending      integer not null default 0,
  lifetime_earned   integer not null default 0,
  lifetime_redeemed integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint txp_wallets_user_unique unique (user_id)
);

-- 2. Transactions -- full ledger of every credit / debit
create table if not exists public.txp_transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  amount       integer not null,               -- positive = credit, negative = debit
  type         text not null,                   -- 'credit' | 'debit'
  status       text not null default 'available', -- 'pending' | 'available'
  reason       text not null,                   -- e.g. 'signup_bonus', 'ticket_purchase', 'referral_reward', 'redemption'
  metadata     jsonb default '{}',              -- flexible: event_id, ticket_id, referral_id, etc.
  created_at   timestamptz not null default now()
);

-- 3. Rules -- admin-configurable point values per action
create table if not exists public.txp_rules (
  id           uuid primary key default gen_random_uuid(),
  action       text not null unique,            -- e.g. 'signup_bonus', 'ticket_purchase', 'referral_reward', 'event_created', 'profile_complete'
  points       integer not null default 0,
  description  text,
  enabled      boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 4. Referrals -- tracks who referred whom for TXP rewards
create table if not exists public.txp_referrals (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  uuid not null references auth.users(id) on delete cascade,
  referee_id   uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending', -- 'pending' | 'completed' | 'expired'
  reward_claimed boolean not null default false,
  created_at   timestamptz not null default now(),
  constraint txp_referrals_pair_unique unique (referrer_id, referee_id)
);

-- Indexes for fast lookups
create index if not exists idx_txp_transactions_user  on public.txp_transactions (user_id, created_at desc);
create index if not exists idx_txp_transactions_reason on public.txp_transactions (reason);
create index if not exists idx_txp_referrals_referrer on public.txp_referrals (referrer_id);
create index if not exists idx_txp_referrals_referee  on public.txp_referrals (referee_id);

-- RLS
alter table public.txp_wallets enable row level security;
alter table public.txp_transactions enable row level security;
alter table public.txp_rules enable row level security;
alter table public.txp_referrals enable row level security;

-- Users can read their own wallet
create policy "Users read own wallet" on public.txp_wallets
  for select using (auth.uid() = user_id);

-- Users can read their own transactions
create policy "Users read own transactions" on public.txp_transactions
  for select using (auth.uid() = user_id);

-- Anyone can read rules (public config)
create policy "Anyone can read rules" on public.txp_rules
  for select using (true);

-- Users can read referrals they are part of
create policy "Users read own referrals" on public.txp_referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referee_id);

-- Service role handles all inserts/updates (no direct client writes)
-- Point mutations go through TxpService which uses supabase client;
-- for production, use an edge function or service-role key.

-- Seed default rules
insert into public.txp_rules (action, points, description) values
  ('signup_bonus',     50,  'Points awarded when a new user signs up'),
  ('profile_complete', 25,  'Points for completing your profile (name, avatar, phone)'),
  ('ticket_purchase',  10,  'Points per ticket purchased'),
  ('event_created',    30,  'Points when an organizer publishes an event'),
  ('referral_reward',  100, 'Points when someone you referred signs up'),
  ('check_in',         5,   'Points for checking in at an event')
on conflict (action) do nothing;
