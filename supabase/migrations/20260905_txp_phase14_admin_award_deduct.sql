-- ============================================================
-- TXP Phase 14 -- Admin Award/Deduct TXP fails with RLS violation
-- ============================================================
-- The admin panel's Award/Deduct TXP action inserts a txp_transactions
-- row and updates a txp_wallets row for the TARGET user being adjusted,
-- not for the admin performing the action. The existing insert/update
-- policies only allow auth.uid() = user_id (each user writing their own
-- row), so any admin award/deduct on someone else's wallet is blocked
-- with "new row violates row-level security policy".
--
-- Fix: let real admins (public.is_admin(), added in phase 13) write to
-- any user's wallet/transactions, in addition to each user's own access.

create policy "Admins can insert any wallet" on public.txp_wallets
  for insert with check (public.is_admin());

create policy "Admins can update any wallet" on public.txp_wallets
  for update using (public.is_admin()) with check (public.is_admin());

create policy "Admins can insert any transaction" on public.txp_transactions
  for insert with check (public.is_admin());

create policy "Admins can update any transaction" on public.txp_transactions
  for update using (public.is_admin()) with check (public.is_admin());
