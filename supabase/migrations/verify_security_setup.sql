-- ============================================================
-- SECURITY VERIFICATION SCRIPT
-- Run this to verify your RLS and public access setup
-- ============================================================

-- ============================================================
-- SECTION 1: VERIFY RLS IS ENABLED
-- ============================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('assets', 'leads', 'asset_images', 'renovation_projects', 'expenses', 'incomes')
ORDER BY tablename;

-- ============================================================
-- SECTION 2: VERIFY RLS POLICIES
-- ============================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd as "Command",
  qual as "USING Expression",
  with_check as "WITH CHECK Expression"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================
-- SECTION 3: VERIFY PUBLIC VIEWS EXIST
-- ============================================================
SELECT 
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('public_assets', 'public_asset_images')
ORDER BY table_name;

-- ============================================================
-- SECTION 4: VERIFY GRANTS TO ANON ROLE
-- ============================================================
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'anon'
  AND table_schema = 'public'
ORDER BY table_name, privilege_type;

-- ============================================================
-- SECTION 5: TEST QUERIES (What anon users can see)
-- ============================================================

-- This is what anonymous users CAN query:
SELECT '=== PUBLIC ASSETS (What anon can see) ===' as info;
SELECT * FROM public_assets LIMIT 5;

SELECT '=== PUBLIC ASSET IMAGES (What anon can see) ===' as info;
SELECT * FROM public_asset_images LIMIT 5;

-- ============================================================
-- SECTION 6: VERIFY SENSITIVE COLUMNS ARE HIDDEN
-- ============================================================
SELECT '=== COLUMNS IN public_assets VIEW ===' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'public_assets'
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== SENSITIVE COLUMNS IN assets TABLE (NOT in public view) ===' as info;
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'assets'
  AND table_schema = 'public'
  AND column_name NOT IN (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'public_assets'
  )
ORDER BY column_name;

-- ============================================================
-- EXPECTED RESULTS:
-- ============================================================
-- 1. All 6 tables should have RLS enabled = true
-- 2. Policies should show:
--    - "Allow all for authenticated users" on all tables
--    - "Allow anon insert on leads" on leads table
-- 3. Views should exist: public_assets, public_asset_images
-- 4. Anon grants should show:
--    - SELECT on public_assets
--    - SELECT on public_asset_images
--    - NO grants on assets, asset_images, or other tables
-- 5. Sensitive columns NOT in public_assets:
--    - purchase_price, appraised_value, mortgage_bank, 
--    - mortgage_amount, fire_insurance_expiry, land_tax_due_date,
--    - title_deed_number, notes
-- ============================================================
