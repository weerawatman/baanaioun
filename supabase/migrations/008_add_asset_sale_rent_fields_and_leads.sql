-- Migration: Add selling_price, rental_price, description to assets table
-- and create leads table

-- 1. Add new columns to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS selling_price NUMERIC;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS rental_price NUMERIC;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_line_id TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create index on asset_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_asset_id ON leads(asset_id);

-- 4. Enable RLS on leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 5. Allow all operations for authenticated users (matching existing tables' pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Allow all for authenticated users'
  ) THEN
    CREATE POLICY "Allow all for authenticated users" ON leads
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
