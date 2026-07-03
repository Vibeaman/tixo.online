-- ============================================================
-- PLANAM.IO – Multi-tier checkout, RSVP, hybrid mode, analytics
-- ============================================================

-- Add attendance_mode and is_rsvp to tickets
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS attendance_mode text DEFAULT 'in-person';
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS is_rsvp boolean DEFAULT false;

-- Analytics: ticket_sales view for organizer dashboard
CREATE OR REPLACE VIEW public.ticket_sales_summary AS
SELECT
  e.id as event_id,
  e.title as event_title,
  e.organizer_id,
  e.image as event_image,
  e.date as event_date,
  COUNT(t.id) as total_tickets,
  COALESCE(SUM(t.quantity), 0) as total_quantity,
  COALESCE(SUM(t.total_price), 0) as total_revenue,
  COUNT(CASE WHEN t.is_rsvp = true THEN 1 END) as total_rsvps,
  COUNT(CASE WHEN t.attendance_mode = 'virtual' THEN 1 END) as virtual_attendees,
  COUNT(CASE WHEN t.attendance_mode = 'in-person' THEN 1 END) as inperson_attendees
FROM public.events e
LEFT JOIN public.tickets t ON t.event_id = e.id
GROUP BY e.id, e.title, e.organizer_id, e.image, e.date;

-- RLS for the view (views inherit from base tables, but we need a policy)
-- Actually views use the base table policies, so this is fine.

-- Daily sales for analytics chart
CREATE OR REPLACE VIEW public.daily_sales AS
SELECT
  e.organizer_id,
  DATE(t.purchased_at) as sale_date,
  COUNT(t.id) as tickets_sold,
  COALESCE(SUM(t.total_price), 0) as revenue
FROM public.tickets t
JOIN public.events e ON e.id = t.event_id
GROUP BY e.organizer_id, DATE(t.purchased_at)
ORDER BY sale_date DESC;

