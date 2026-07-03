-- ═══════════════════════════════════════════════════════════
-- MIGRATION V7: Event Photos Gallery
-- Allows users to upload event photos
-- ═══════════════════════════════════════════════════════════

-- 1. Create event_photos table
CREATE TABLE IF NOT EXISTS event_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text NOT NULL DEFAULT 'Anonymous',
  user_avatar text,
  photo_url text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Enable RLS
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Anyone can view photos
CREATE POLICY "Anyone can view event photos" ON event_photos
  FOR SELECT USING (true);

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload photos" ON event_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own photos
CREATE POLICY "Users can delete own photos" ON event_photos
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Create storage bucket (run this separately if needed)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('event-photos', 'event-photos', true)
-- ON CONFLICT (id) DO NOTHING;

-- 5. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_created_at ON event_photos(created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- ALSO RUN IN SUPABASE DASHBOARD:
-- 1. Go to Storage > Create New Bucket
-- 2. Name: "event-photos"
-- 3. Check "Public bucket"
-- 4. Create the bucket
-- 
-- Then add a storage policy:
-- Go to Storage > Policies > event-photos bucket
-- Add policy: Allow authenticated uploads
--   Operation: INSERT
--   Policy: (auth.role() = 'authenticated')
-- Add policy: Allow public reads
--   Operation: SELECT  
--   Policy: true
-- Add policy: Allow users to delete own files
--   Operation: DELETE
--   Policy: (auth.uid()::text = (storage.foldername(name))[1])
-- ═══════════════════════════════════════════════════════════
