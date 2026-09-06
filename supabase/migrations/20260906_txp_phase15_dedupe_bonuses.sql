-- ============================================================
-- TXP Phase 15 -- Prevent duplicate one-time bonus awards
-- Fixes a race condition where onAccountCreated (and other
-- one-time award methods) could fire twice concurrently and
-- credit a user's wallet more than once for the same reason.
-- ============================================================

-- 1. Hard guard at the database level: only one credit transaction
--    per user per one-time reason is ever allowed to exist.
create unique index if not exists txp_transactions_one_time_reason_idx
  on public.txp_transactions (user_id, reason)
  where type = 'credit' and reason in (
    'signup_bonus',
    'kyc_completed',
    'profile_complete',
    'legacy_appreciation_bonus'
  );

-- 2. Note: the one-time "thank you" appreciation bonus (Phase 12) has no
--    corresponding entry in txp_rules and no app code path that triggers
--    it -- it only ran as a one-off manual SQL script. It is retired by
--    simply never running that script again; the unique index above is
--    an extra safety net in case it (or any one-time bonus) is ever
--    re-run or re-triggered by accident.

-- ============================================================
-- Cleanup (run manually, ONE TIME, only if duplicates exist):
-- Uncomment and run separately to remove any existing duplicate
-- signup_bonus / etc. rows and correct affected wallet balances
-- before applying the unique index above, since the index creation
-- will fail if duplicates already exist in the table.
-- ============================================================
-- do $$
-- declare
--   dup record;
-- begin
--   for dup in
--     select user_id, reason, min(id) as keep_id, count(*) as cnt, sum(amount) - min(amount) as refund_amount
--     from public.txp_transactions
--     where type = 'credit' and reason in ('signup_bonus','kyc_completed','profile_complete','legacy_appreciation_bonus')
--     group by user_id, reason
--     having count(*) > 1
--   loop
--     delete from public.txp_transactions
--     where user_id = dup.user_id and reason = dup.reason and id <> dup.keep_id;

--     update public.txp_wallets
--     set available = greatest(available - dup.refund_amount, 0),
--         lifetime_earned = greatest(lifetime_earned - dup.refund_amount, 0),
--         updated_at = now()
--     where user_id = dup.user_id;
--   end loop;
-- end $$;
