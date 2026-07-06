-- ============================================================
-- TIXO.ONLINE — Virtual Access Control + Gate Check-in Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add virtual_access to events (public = instant link, private = organizer approves)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS virtual_access text DEFAULT 'public';

-- 2. Add require_checkin to events (true = QR scan at gate, false = walk-in)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS require_checkin boolean DEFAULT true;

-- 3. Add approved column to tickets (for private virtual events)
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS approved boolean DEFAULT true;

-- 4. Allow organizers to update tickets for their events (for approval flow)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Organizers can update tickets for own events'
  ) THEN
    DROP POLICY "Organizers can update tickets for own events" ON public.tickets;
  END IF;
END $$;

CREATE POLICY "Organizers can update tickets for own events"
  ON public.tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = tickets.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- 5. Allow organizers to read tickets for events they organize
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Organizers can view tickets for own events'
  ) THEN
    DROP POLICY "Organizers can view tickets for own events" ON public.tickets;
  END IF;
END $$;

CREATE POLICY "Organizers can view tickets for own events"
  ON public.tickets FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = tickets.event_id
      AND events.organizer_id = auth.uid()
    )
  );
