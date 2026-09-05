-- Phase 3A: User referral codes for TXP
alter table public.profiles add column if not exists referral_code text unique;
create index if not exists idx_profiles_referral_code on public.profiles (referral_code) where referral_code is not null;
