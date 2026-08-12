-- Add is_private column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;
