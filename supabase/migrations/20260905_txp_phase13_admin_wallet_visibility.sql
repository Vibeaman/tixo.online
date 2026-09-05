-- ============================================================
-- TXP Phase 13 -- Admin panel can't see other users' wallets/transactions
-- ============================================================
-- txp_wallets and txp_transactions only had a SELECT policy scoped to
-- auth.uid() = user_id (each user reading their own row). The admin panel
-- (AdminTxp.jsx) is a passcode-gated page with no distinct Postgres role,
-- so its "User Wallets" search runs as a regular authenticated user and
-- can only ever see the logged-in admin's own wallet row -- every other
-- user appears as 0 TXP, even though their balance is correct in the DB.
--
-- Mirrors the existing "public config" pattern already used for txp_rules
-- ("Anyone can read rules", using (true)) since this app has no
-- service-role backend to scope admin reads to.

create policy "Anyone can read all wallets" on public.txp_wallets
  for select using (true);

create policy "Anyone can read all transactions" on public.txp_transactions
  for select using (true);
