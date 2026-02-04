-- Migration: Add location_lat_long to assets and update public views

-- 1. Add location column to assets
ALTER TABLE assets ADD COLUMN IF NOT EXISTS location_lat_long TEXT;

-- 2. Recreate public_assets view to include location_lat_long
CREATE OR REPLACE VIEW public_assets
  WITH (security_invoker = false)
AS
SELECT
  id,
  name,
  property_type,
  address,
  description,
  selling_price,
  rental_price,
  location_lat_long,
  status,
  created_at
FROM assets
WHERE status = 'available';

GRANT SELECT ON public_assets TO anon;
