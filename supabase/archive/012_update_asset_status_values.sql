-- ============================================================
-- Migration: Update Asset Status Values
-- Old: owned, sold, under_renovation, available
-- New: developing, ready_for_sale, ready_for_rent, rented, sold
-- ============================================================

-- 1. Migrate existing data to new status values
UPDATE assets SET status = 'developing' WHERE status = 'owned';
UPDATE assets SET status = 'developing' WHERE status = 'under_renovation';
UPDATE assets SET status = 'ready_for_sale' WHERE status = 'available';
-- 'sold' stays as 'sold'

-- 2. Drop + recreate the status check constraint
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_status_check;
ALTER TABLE assets ADD CONSTRAINT assets_status_check
  CHECK (status IN ('developing', 'ready_for_sale', 'ready_for_rent', 'rented', 'sold'));

-- 3. Update public_assets view to filter ready_for_sale and ready_for_rent
DROP VIEW IF EXISTS public_asset_images;
DROP VIEW IF EXISTS public_assets;

CREATE VIEW public_assets
  WITH (security_invoker = false)
AS
SELECT
  id, name, property_type, address, description,
  selling_price, rental_price, location_lat_long, status, created_at
FROM assets
WHERE status IN ('ready_for_sale', 'ready_for_rent');

GRANT SELECT ON public_assets TO anon;

-- 4. Recreate public_asset_images view (depends on public_assets filter)
CREATE VIEW public_asset_images
  WITH (security_invoker = false)
AS
SELECT
  ai.id, ai.asset_id, ai.url, ai.caption,
  ai.is_primary, ai.category, ai.created_at
FROM asset_images ai
INNER JOIN assets a ON a.id = ai.asset_id
WHERE a.status IN ('ready_for_sale', 'ready_for_rent');

GRANT SELECT ON public_asset_images TO anon;
