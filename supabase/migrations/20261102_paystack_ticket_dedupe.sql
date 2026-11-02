-- Paystack ticket deduplication safeguards.
-- The frontend and webhook both check payment_reference before inserting.
-- These indexes make those checks fast and ensure a reference cannot reuse a
-- check-in code if both paths ever race.

CREATE INDEX IF NOT EXISTS tickets_payment_reference_idx
  ON public.tickets (payment_reference)
  WHERE payment_reference IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tickets_payment_reference_check_in_code_idx
  ON public.tickets (payment_reference, check_in_code)
  WHERE payment_reference IS NOT NULL;
