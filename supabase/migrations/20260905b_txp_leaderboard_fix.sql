-- ============================================================
-- TXP Leaderboard fix
-- The "Users read own X" RLS policies mean every user's browser can only
-- ever fetch their OWN wallet/transaction rows. When the leaderboard
-- code tried to rank all users client-side, each user only ever saw
-- themselves -- so everyone appeared as "#1".
--
-- Fix: a SECURITY DEFINER function that computes the ranking totals
-- server-side (bypassing per-row RLS just for this aggregate), without
-- exposing anyone's raw transaction history or full wallet row.
-- ============================================================

create or replace function public.get_txp_leaderboard(p_period text default 'monthly')
returns table(user_id uuid, points bigint, lifetime_earned bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_period = 'all_time' then
    return query
      select w.user_id, w.lifetime_earned::bigint as points, w.lifetime_earned::bigint as lifetime_earned
      from public.txp_wallets w
      where w.lifetime_earned > 0
      order by w.lifetime_earned desc;
  else
    return query
      select t.user_id, sum(t.amount)::bigint as points, w.lifetime_earned::bigint as lifetime_earned
      from public.txp_transactions t
      join public.txp_wallets w on w.user_id = t.user_id
      where t.type = 'credit'
        and t.created_at >= date_trunc('month', now() at time zone 'utc')
      group by t.user_id, w.lifetime_earned
      having sum(t.amount) > 0
      order by sum(t.amount) desc;
  end if;
end;
$$;

grant execute on function public.get_txp_leaderboard(text) to authenticated, anon;
