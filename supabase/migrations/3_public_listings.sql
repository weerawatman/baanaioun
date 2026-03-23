-- ============================================================
-- BAANAIOUN — 3. Public Listings Portal
--
-- Exposes selected asset data to unauthenticated (anon) users
-- so they can browse listings and submit interest forms.
--
-- Security model:
--   - Anon users access data ONLY through views (not tables)
--   - Views hide all private/financial columns
--   - Anon can INSERT leads (submit interest forms)
--   - Anon cannot SELECT, UPDATE, or DELETE any table directly
--
-- Run ORDER: 1 → 2 → 3 → 4
-- ============================================================

-- ============================================================
-- PUBLIC_ASSETS VIEW
-- Shows assets that are ready_for_sale or ready_for_rent.
-- Hides: title_deed_number, purchase_price, mortgage details,
--        tenant info, notes, and all financial history.
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
  location_lat_long,
  status,
  created_at
FROM assets
WHERE status IN ('ready_for_sale', 'ready_for_rent');

GRANT SELECT ON public_assets TO anon;

-- ============================================================
-- PUBLIC_ASSET_IMAGES VIEW
-- Shows images only for publicly visible assets.
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
WHERE a.status IN ('ready_for_sale', 'ready_for_rent');

GRANT SELECT ON public_asset_images TO anon;

-- ============================================================
-- ANON INSERT ON LEADS
-- Allows public users to submit interest forms.
-- Anon cannot SELECT, UPDATE, or DELETE leads.
-- ============================================================
CREATE POLICY "Anon insert leads"
  ON leads FOR INSERT TO anon WITH CHECK (true);

-- ============================================================
-- STORAGE POLICIES (for asset-files bucket)
-- Run these after creating the bucket in Supabase Dashboard.
--
-- CREATE POLICY "Public read asset files"
--   ON storage.objects FOR SELECT TO anon
--   USING (bucket_id = 'asset-files');
--
-- CREATE POLICY "Authenticated upload asset files"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'asset-files');
--
-- CREATE POLICY "Authenticated delete asset files"
--   ON storage.objects FOR DELETE TO authenticated
--   USING (bucket_id = 'asset-files');
-- ============================================================
