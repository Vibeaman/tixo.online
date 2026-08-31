-- Phase 2: Update point values and add new action rules

update public.txp_rules set points = 50  where action = 'signup_bonus';
update public.txp_rules set points = 50, description = 'Points for completing your profile (name, avatar, phone)' where action = 'profile_complete';
update public.txp_rules set points = 200, description = 'Points when an organizer creates/saves an event' where action = 'event_created';
update public.txp_rules set points = 1, description = '1 point per 100 naira spent on tickets (pending until event confirmed)' where action = 'ticket_purchase';

delete from public.txp_rules where action in ('check_in', 'referral_reward');

insert into public.txp_rules (action, points, description) values
  ('kyc_completed',          100, 'Points for completing KYC verification'),
  ('event_published',        100, 'Points when an organizer publishes an event'),
  ('event_shared',           10,  'Points for sharing an event (once per user per event)'),
  ('event_attended',         50,  'Points for attending/checking in at an event'),
  ('review_submitted',       25,  'Points for submitting a review after an event'),
  ('referral_registered',    100, 'Pending points when someone you referred signs up'),
  ('referral_first_purchase', 250, 'Points when your referral makes their first purchase')
on conflict (action) do nothing;
