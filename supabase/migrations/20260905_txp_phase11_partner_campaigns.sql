-- ============================================================
-- TXP (Tixo Points) Phase 11 -- Partner Campaigns
-- ============================================================
-- Lets an external partner platform trigger a one-off TXP reward for a Tixo
-- user via a webhook call (e.g. "sign up on Partner X" or "make a purchase
-- on Partner Y"). Each campaign has its own webhook_secret so multiple
-- partners can be onboarded independently and revoked/rotated one at a time.

-- 1. Campaigns -- admin-defined, partner-scoped reward definitions
create table if not exists public.txp_campaigns (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  reward_amount   integer not null default 0,      -- TXP awarded per successful claim
  trigger_action  text not null,                    -- free-text code, e.g. 'partner_signup', 'partner_purchase'
  partner_name    text not null,
  webhook_secret  text not null unique,             -- random token the partner sends to authenticate webhook calls
  start_date      timestamptz,                      -- null = no start restriction
  end_date        timestamptz,                      -- null = no end restriction
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- 2. Campaign claims -- one row per user per successful webhook award,
-- also used to de-duplicate partner retries via external_reference.
create table if not exists public.txp_campaign_claims (
  id                 uuid primary key default gen_random_uuid(),
  campaign_id        uuid not null references public.txp_campaigns(id) on delete cascade,
  user_id            uuid not null references auth.users(id) on delete cascade,
  external_reference text,                          -- partner's own transaction/user id, for idempotency (nullable)
  awarded_txp        integer not null default 0,
  created_at         timestamptz not null default now(),
  -- A user can only claim a given campaign once...
  constraint txp_campaign_claims_user_unique unique (campaign_id, user_id),
  -- ...and a given partner-side reference can only ever award once, even if
  -- the partner's own retried the webhook call with the same reference.
  constraint txp_campaign_claims_ref_unique unique (campaign_id, external_reference)
);

-- Indexes
create index if not exists idx_txp_campaigns_active        on public.txp_campaigns (is_active);
create index if not exists idx_txp_campaigns_webhook_secret on public.txp_campaigns (webhook_secret);
create index if not exists idx_txp_campaign_claims_campaign on public.txp_campaign_claims (campaign_id);
create index if not exists idx_txp_campaign_claims_user     on public.txp_campaign_claims (user_id);

-- RLS
alter table public.txp_campaigns enable row level security;
alter table public.txp_campaign_claims enable row level security;

-- Anyone can read campaigns (needed so the public Ways to Earn page can list
-- active partner campaigns without an authenticated session).
create policy "Anyone can read campaigns" on public.txp_campaigns
  for select using (true);

-- Users can read their own campaign claims (mirrors "Users read own
-- transactions" from phase1 -- no client ever needs to see other users' claims).
create policy "Users read own campaign claims" on public.txp_campaign_claims
  for select using (auth.uid() = user_id);

-- NOTE ON WRITE ACCESS & THE webhook_secret TRADEOFF (see phase10 migration
-- for the full rationale on why this app's admin writes are permissive):
-- The admin panel (AdminTxp.jsx) has no distinct Postgres role -- it's a
-- shared passcode gate that writes through TxpService using the anon/
-- publishable Supabase client, same as every other txp_* admin flow. To keep
-- that working without inventing a stricter scheme, campaign INSERT/UPDATE
-- below mirrors the existing permissive "using (true)" pattern.
--
-- Because SELECT on txp_campaigns is also public (`using (true)`, required
-- for the Ways to Earn page), the webhook_secret column is technically
-- readable by anyone querying this table with the anon key directly, not
-- just via the app's own queries (which only ever select the public-facing
-- columns for that page). The partner webhook route
-- (api/webhook/partner-campaign.js) does not rely on RLS to protect the
-- secret -- it treats "don't ship the secret in the client bundle" as the
-- real boundary and validates it server-side on every request. If this
-- becomes a real partner-facing product, move webhook_secret to a
-- service-role-only-readable table/view instead of relying on convention.
create policy "Anyone can insert campaigns" on public.txp_campaigns
  for insert with check (true);

create policy "Anyone can update campaigns" on public.txp_campaigns
  for update using (true) with check (true);

-- No client-side INSERT/UPDATE policy is added for txp_campaign_claims:
-- claims are only ever written by the partner webhook handler, which awards
-- TXP through TxpService the same way every other earning method in this
-- codebase does (see phase10's note on txp_wallets/txp_transactions writes).
