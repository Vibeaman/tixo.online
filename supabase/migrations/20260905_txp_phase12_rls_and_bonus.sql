-- ============================================================
-- TXP Phase 12 -- Fix client write RLS + one-time appreciation bonus
-- ============================================================

-- 1. Allow users to create/update their own wallet row.
--    (getWallet() auto-creates a wallet on first visit from the browser;
--     this was previously blocked because no INSERT/UPDATE policy existed.)
create policy "Users insert own wallet" on public.txp_wallets
  for insert with check (auth.uid() = user_id);

create policy "Users update own wallet" on public.txp_wallets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Allow users to insert their own TXP transactions (earning/spending
--    actions are triggered client-side by TxpService).
create policy "Users insert own transactions" on public.txp_transactions
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- 3. One-time "thank you" bonus: 50 TXP for every existing user
--    Idempotent -- safe to re-run, will not double-award.
-- ============================================================
do $$
declare
  u record;
  w_id uuid;
  already_awarded boolean;
begin
  for u in select id from auth.users loop
    -- ensure wallet exists
    select id into w_id from public.txp_wallets where user_id = u.id;
    if w_id is null then
      insert into public.txp_wallets (user_id) values (u.id) returning id into w_id;
    end if;

    -- skip if this user already got the bonus
    select exists(
      select 1 from public.txp_transactions
      where user_id = u.id and reason = 'legacy_appreciation_bonus'
    ) into already_awarded;

    if not already_awarded then
      insert into public.txp_transactions (user_id, amount, type, status, reason, metadata)
      values (u.id, 50, 'credit', 'available', 'legacy_appreciation_bonus', '{"note":"Thank you for being an early Tixo user"}');

      update public.txp_wallets
      set available = available + 50,
          lifetime_earned = lifetime_earned + 50,
          updated_at = now()
      where user_id = u.id;
    end if;
  end loop;
end $$;
