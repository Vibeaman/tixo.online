-- ============================================================
-- PLANAM.IO – Event Reshare / Affiliate System
-- ============================================================

-- 1. Add reshare_enabled to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS reshare_enabled boolean DEFAULT false;

-- 2. Referral Links table
CREATE TABLE IF NOT EXISTS public.referral_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code text UNIQUE NOT NULL,
  clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read referral links"
  ON public.referral_links FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create referral links"
  ON public.referral_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own referral links"
  ON public.referral_links FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Referral Commissions table
CREATE TABLE IF NOT EXISTS public.referral_commissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_link_id uuid REFERENCES public.referral_links(id) ON DELETE SET NULL,
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  referrer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ticket_amount numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  platform_fee numeric NOT NULL DEFAULT 0,
  organizer_revenue numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'reversed', 'paid')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own commissions"
  ON public.referral_commissions FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() IN (
    SELECT organizer_id FROM public.events WHERE id = event_id
  ));

CREATE POLICY "System can insert commissions"
  ON public.referral_commissions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Add referral_code to tickets for tracking
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS referral_code text;

