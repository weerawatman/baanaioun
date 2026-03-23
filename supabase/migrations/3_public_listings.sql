-- ============================================================
-- BAANAIOUN — 3. Public Listings Portal (Idempotent)
-- ============================================================

-- PUBLIC_ASSETS VIEW
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
WHERE status IN ('ready_for_sale', 'ready_for_rent', 'available');

GRANT SELECT ON public_assets TO anon;

-- PUBLIC_ASSET_IMAGES VIEW
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
WHERE a.status IN ('ready_for_sale', 'ready_for_rent', 'available');

GRANT SELECT ON public_asset_images TO anon;

-- ANON INSERT ON LEADS
DROP POLICY IF EXISTS "Anon insert leads" ON leads;
CREATE POLICY "Anon insert leads"
  ON leads FOR INSERT TO anon WITH CHECK (true);
