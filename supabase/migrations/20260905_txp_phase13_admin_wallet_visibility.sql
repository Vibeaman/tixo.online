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
-- Unlike a broad "anyone can read" policy, this locks visibility to real
-- admin accounts only, using the existing profiles.is_admin column
-- (already relied on elsewhere, e.g. AdminService.isAdmin()). A
-- SECURITY DEFINER helper avoids infinite recursion from a policy that
-- would otherwise query profiles (itself RLS-protected) inline.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

grant execute on function public.is_admin() to authenticated, anon;

create policy "Admins can read all wallets" on public.txp_wallets
  for select using (public.is_admin());

create policy "Admins can read all transactions" on public.txp_transactions
  for select using (public.is_admin());
