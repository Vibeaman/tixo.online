-- Payment recovery and idempotent ticket creation.
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS ticket_index integer,
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

DROP INDEX IF EXISTS public.tickets_payment_reference_check_in_code_idx;

CREATE UNIQUE INDEX IF NOT EXISTS tickets_payment_reference_ticket_index_uidx
  ON public.tickets (payment_reference, ticket_index)
  WHERE payment_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS tickets_payment_reference_idx
  ON public.tickets (payment_reference)
  WHERE payment_reference IS NOT NULL;
