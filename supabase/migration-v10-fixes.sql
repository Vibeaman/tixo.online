-- ═══════════════════════════════════════════════════════════
-- MIGRATION V10: Bug Fixes — RLS, Google OAuth avatar, storage
-- ═══════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────
-- FIX 1: Organizers MUST be able to read tickets for their events
-- Currently only "Users can view own tickets" (auth.uid() = user_id)
-- This breaks: ScanTickets, attendee list, QR code scanning
-- ──────────────────────────────────────────────────────────
CREATE POLICY "Organizers can view event tickets"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = tickets.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────
-- FIX 2: Google OAuth — capture avatar_url on signup
-- The handle_new_user trigger only saves full_name + email,
-- missing the Google profile picture.
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.email, ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────────────────
-- FIX 3: Ensure event-photos storage bucket exists
-- Migration V7 had this commented out
-- ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for event-photos (safe to re-run)
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Public event photo access"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'event-photos');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "Authenticated users can upload event photos"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'event-photos' AND auth.role() = 'authenticated');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "Users can delete own event photos"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'event-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ──────────────────────────────────────────────────────────
-- FIX 4: Backfill existing Google OAuth users' avatars
-- If they signed up before this fix, pull avatar from auth.users
-- ──────────────────────────────────────────────────────────
UPDATE profiles p
SET avatar_url = COALESCE(
  u.raw_user_meta_data->>'avatar_url',
  u.raw_user_meta_data->>'picture'
)
FROM auth.users u
WHERE p.id = u.id
  AND p.avatar_url IS NULL
  AND (u.raw_user_meta_data->>'avatar_url' IS NOT NULL
       OR u.raw_user_meta_data->>'picture' IS NOT NULL);

-- ═══════════════════════════════════════════════════════════
-- DONE! Fixes applied.
-- ═══════════════════════════════════════════════════════════
