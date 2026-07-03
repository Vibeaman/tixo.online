-- ═══════════════════════════════════════════════════════════
-- MIGRATION V6: Guest Checkout
-- Allows non-logged-in users to buy tickets / RSVP
-- ═══════════════════════════════════════════════════════════

-- 1. Make user_id nullable (guests don't have an account)
ALTER TABLE tickets ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add guest info columns
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS guest_email text;

-- 3. Update RLS policy to allow guest (anon) inserts
-- Drop existing insert policy if it restricts to authenticated users only
DO $$
BEGIN
  -- Try to drop existing restrictive insert policies
  BEGIN
    DROP POLICY IF EXISTS "Users can insert tickets" ON tickets;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP POLICY IF EXISTS "Authenticated users can insert tickets" ON tickets;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP POLICY IF EXISTS "Anyone can insert tickets" ON tickets;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Create new permissive insert policy:
-- Authenticated users can insert with their user_id,
-- Anyone (including anon) can insert with null user_id + guest info
CREATE POLICY "Authenticated or guest ticket insert" ON tickets
  FOR INSERT
  WITH CHECK (
    -- Authenticated user inserting their own ticket
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- Guest checkout: no user_id, must have guest_email
    (user_id IS NULL AND guest_email IS NOT NULL)
  );

-- 4. Also allow guests to read their own tickets by email (optional, for future use)
-- For now, guest tickets are viewable by the event organizer through existing policies.

-- ═══════════════════════════════════════════════════════════
-- DONE! Run this in the Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════
