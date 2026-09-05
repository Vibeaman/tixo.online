-- TXP redemption settings (admin-configurable)
CREATE TABLE IF NOT EXISTS txp_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE txp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON txp_settings
  FOR SELECT USING (true);

-- Seed defaults
INSERT INTO txp_settings (key, value, description) VALUES
  ('redemption_rate', '100', 'TXP per ₦100 (100 TXP = ₦100)'),
  ('max_txp_percentage', '100', 'Max percentage of ticket price payable with TXP (0-100)')
ON CONFLICT (key) DO NOTHING;

-- Track TXP redemptions
CREATE TABLE IF NOT EXISTS txp_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  ticket_ids TEXT[], -- array of ticket IDs from the purchase
  txp_amount INTEGER NOT NULL, -- points spent
  naira_equivalent NUMERIC(10,2) NOT NULL, -- ₦ value of the points
  original_total NUMERIC(10,2) NOT NULL, -- original ticket total
  remaining_paid NUMERIC(10,2) NOT NULL, -- amount paid via Paystack (if any)
  status TEXT DEFAULT 'completed', -- completed, reversed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE txp_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions" ON txp_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemptions" ON txp_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
