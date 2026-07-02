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
UPDATE public.events SET end_date = '2026-12-20', end_time = '23:59', event_type = 'in-person' WHERE id = 'a1b2c3d4-0001-4000-8000-000000000001';
UPDATE public.events SET end_date = '2027-03-17', end_time = '18:00', event_type = 'hybrid', virtual_link = 'https://meet.planam.io/lagos-tech-summit' WHERE id = 'a1b2c3d4-0002-4000-8000-000000000002';
UPDATE public.events SET end_date = '2027-01-22', end_time = '18:00', event_type = 'in-person' WHERE id = 'a1b2c3d4-0003-4000-8000-000000000003';
UPDATE public.events SET end_date = '2027-01-06', end_time = '23:00', event_type = 'in-person' WHERE id = 'a1b2c3d4-0004-4000-8000-000000000004';
UPDATE public.events SET end_date = '2027-02-14', end_time = '20:00', event_type = 'in-person' WHERE id = 'a1b2c3d4-0005-4000-8000-000000000005';
UPDATE public.events SET end_date = '2027-02-08', end_time = '14:00', event_type = 'in-person' WHERE id = 'a1b2c3d4-0006-4000-8000-000000000006';
UPDATE public.events SET end_date = '2027-01-01', end_time = '04:00', event_type = 'in-person' WHERE id = 'a1b2c3d4-0007-4000-8000-000000000007';
UPDATE public.events SET end_date = '2027-01-18', end_time = '22:00', event_type = 'in-person' WHERE id = 'a1b2c3d4-0008-4000-8000-000000000008';
UPDATE public.events SET end_date = '2027-04-10', end_time = '21:00', event_type = 'virtual', virtual_link = 'https://meet.planam.io/startup-pitch' WHERE id = 'a1b2c3d4-0009-4000-8000-000000000009';
UPDATE public.events SET end_date = '2027-03-01', end_time = '22:00', event_type = 'in-person' WHERE id = 'a1b2c3d4-0010-4000-8000-000000000010';

-- Done! ✅
