-- ============================================================
-- PLANAM.IO — Migration V2: Virtual events, date ranges, edit support
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add new columns to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_date text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_time text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'in-person';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS virtual_link text;

-- Rename existing 'date' and 'time' to be clearer (they stay as start)
-- No rename needed — we'll just treat 'date' as start_date and 'time' as start_time in the app

-- Update seed events with end dates and event types
UPDATE public.events SET end_date = '2027-03-01', end_time = '22:00', event_type = 'in-person' WHERE id = 'a1b2c3d4-0010-4000-8000-000000000010';

-- Done! ✅
