-- Ticket Transfer columns
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS transferred_to_email text;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS transferred_to_name text;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS transferred_at timestamptz;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS transfer_status text DEFAULT null;
-- null = not transferred, 'transferred' = given away, 'received' = received from someone

-- Recurring events columns (ensure they exist)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS recurrence_pattern text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS recurrence_end_date date;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS parent_event_id uuid REFERENCES public.events(id);
