-- ============================================================
-- TIXO.ONLINE — Payout Profiles Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Payout profiles: stores organizer bank details + Paystack subaccount codes
CREATE TABLE IF NOT EXISTS public.payout_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  bank_code text NOT NULL,
  bank_name text NOT NULL DEFAULT '',
  account_number text NOT NULL,
  account_name text DEFAULT '',
  subaccount_code text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payout_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own payout profile
CREATE POLICY "Users can view own payout profile"
  ON public.payout_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own payout profile
CREATE POLICY "Users can insert own payout profile"
  ON public.payout_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own payout profile
CREATE POLICY "Users can update own payout profile"
  ON public.payout_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow service role full access (for API endpoints)
-- (Service role bypasses RLS by default in Supabase)

-- Anyone can read subaccount_code for a given organizer (needed during checkout)
CREATE POLICY "Anyone can read organizer subaccount code"
  ON public.payout_profiles FOR SELECT
  USING (true);

-- Grant: drop the restrictive policy, the public read policy covers it
DROP POLICY IF EXISTS "Users can view own payout profile" ON public.payout_profiles;
