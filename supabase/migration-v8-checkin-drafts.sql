-- ═══════════════════════════════════════════════════════════
-- MIGRATION V8: Event Check-in System + Draft Events
-- ═══════════════════════════════════════════════════════════

-- 1. Add status column to events (draft / published)
ALTER TABLE events ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';

-- 2. Add check-in fields to tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS check_in_code text UNIQUE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS checked_in boolean DEFAULT false;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS checked_in_by uuid REFERENCES auth.users(id);

-- 3. Backfill existing tickets with unique 8-char check-in codes
UPDATE tickets
SET check_in_code = upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE check_in_code IS NULL;

-- 4. RLS: Organizers can update check-in status on tickets for their events
CREATE POLICY "Organizers can check in tickets"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = tickets.event_id
      AND events.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = tickets.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- 5. Create a check-in stats view for organizers
CREATE OR REPLACE VIEW event_checkin_stats AS
SELECT
  e.id AS event_id,
  e.title AS event_title,
  e.organizer_id,
  e.date AS event_date,
  e.image AS event_image,
  COUNT(t.id) AS total_tickets,
  COUNT(CASE WHEN t.checked_in = true THEN 1 END) AS checked_in_count,
  COUNT(CASE WHEN t.checked_in = false OR t.checked_in IS NULL THEN 1 END) AS not_checked_in_count
FROM events e
LEFT JOIN tickets t ON t.event_id = e.id
GROUP BY e.id, e.title, e.organizer_id, e.date, e.image;

-- ═══════════════════════════════════════════════════════════
-- DONE! Check-in system + Draft events ready.
-- ═══════════════════════════════════════════════════════════
