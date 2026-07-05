-- ═══════════════════════════════════════════════════════════
-- MIGRATION V9: Buy-for-Others — Attendee Names on Tickets
-- ═══════════════════════════════════════════════════════════
-- Adds an attendee_name column so each ticket row can
-- identify the actual person attending (not just the buyer).
-- When buying multiple tickets, each gets its own row with
-- quantity = 1, a unique QR code, and the attendee's name.
-- ═══════════════════════════════════════════════════════════

-- 1. Add attendee_name column to tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS attendee_name text;

-- 2. Backfill existing tickets: use profile full_name or guest_name
UPDATE tickets t
SET attendee_name = COALESCE(
  (SELECT p.full_name FROM profiles p WHERE p.id = t.user_id),
  t.guest_name
)
WHERE t.attendee_name IS NULL;

-- ═══════════════════════════════════════════════════════════
-- DONE! Attendee names column added and backfilled.
-- ═══════════════════════════════════════════════════════════
