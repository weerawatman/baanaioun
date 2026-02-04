-- Migration: Public listing RLS policies
-- 1. Add 'available' to asset status
-- 2. Create public_assets view (hides sensitive columns)
-- 3. Anon INSERT-only policy on leads

-- ============================================================
-- 1. Add 'available' to asset status constraint
-- ============================================================
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_status_check;
ALTER TABLE assets ADD CONSTRAINT assets_status_check
  CHECK (status IN ('owned', 'sold', 'under_renovation', 'available'));

-- ============================================================
-- 2. Create public_assets view
--    SECURITY DEFINER so it bypasses RLS on the assets table.
--    Only exposes columns safe for public listing.
--    Filters to status = 'available' at the view level.
-- ============================================================
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
  status,
  created_at
FROM assets
WHERE status = 'available';

-- Grant anon SELECT on the view only (NOT on the assets table)
GRANT SELECT ON public_assets TO anon;

-- ============================================================
-- 3. Create public_asset_images view
--    So public listings can show images without exposing the
--    full asset_images table.
-- ============================================================
CREATE OR REPLACE VIEW public_asset_images
  WITH (security_invoker = false)
AS
SELECT
  ai.id,
  ai.asset_id,
  ai.url,
  ai.caption,
  ai.is_primary,
  ai.category,
  ai.created_at
FROM asset_images ai
INNER JOIN assets a ON a.id = ai.asset_id
WHERE a.status = 'available';

GRANT SELECT ON public_asset_images TO anon;

-- ============================================================
-- 4. Leads: anon can INSERT only (no SELECT / UPDATE / DELETE)
--    RLS is already enabled from the previous migration.
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'leads'
      AND policyname = 'Allow anon insert on leads'
  ) THEN
    CREATE POLICY "Allow anon insert on leads" ON leads
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;

-- No SELECT policy for anon on leads = anon cannot read any lead data.
-- No SELECT policy for anon on assets = anon cannot query assets directly.
-- Anon users must go through public_assets / public_asset_images views.
