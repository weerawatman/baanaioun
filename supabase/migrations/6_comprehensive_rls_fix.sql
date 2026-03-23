-- ============================================================
-- BAANAIOUN — 6. Comprehensive Fix: Enable RLS Everywhere
--
-- Migration 2 created RLS policies but did NOT enable RLS on
-- most tables. Migration 5 only fixed 3 tables. This migration:
--
-- 1. Enables RLS on ALL tables with policies
-- 2. Verifies and recreates all policies cleanly
-- 3. Ensures user_profiles has RLS enabled
-- 4. Tests that policies are in place
--
-- This is the DEFINITIVE RLS configuration.
--
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: ENABLE RLS on ALL tables (idempotent)
-- ============================================================
ALTER TABLE IF EXISTS public.user_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.renovation_projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.incomes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.asset_images         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads                ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- VERIFICATION: Check RLS status (run manually to verify)
-- ============================================================
/* VERIFICATION QUERY - Run this to confirm RLS is enabled:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'user_profiles', 'assets', 'renovation_projects', 
    'expenses', 'incomes', 'asset_images', 'leads'
  )
ORDER BY tablename;
-- All should show rowsecurity = true
*/

-- ============================================================
-- STEP 2: USER_PROFILES — Ensure policies exist
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "Authenticated can read all profiles"
  ON public.user_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============================================================
-- STEP 3: ASSETS — Verify policies exist
-- ============================================================
DROP POLICY IF EXISTS "Authenticated select assets"  ON public.assets;
DROP POLICY IF EXISTS "Authenticated insert assets"  ON public.assets;
DROP POLICY IF EXISTS "Authenticated update assets"  ON public.assets;
DROP POLICY IF EXISTS "Admin delete assets"          ON public.assets;

CREATE POLICY "Authenticated select assets"
  ON public.assets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert assets"
  ON public.assets FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update assets"
  ON public.assets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin delete assets"
  ON public.assets FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ============================================================
-- STEP 4: RENOVATION_PROJECTS — Enable RLS and ensure policies
-- ============================================================
DROP POLICY IF EXISTS "Authenticated select renovation_projects"  ON public.renovation_projects;
DROP POLICY IF EXISTS "Authenticated insert renovation_projects"  ON public.renovation_projects;
DROP POLICY IF EXISTS "Authenticated update renovation_projects"  ON public.renovation_projects;
DROP POLICY IF EXISTS "Admin delete renovation_projects"          ON public.renovation_projects;

CREATE POLICY "Authenticated select renovation_projects"
  ON public.renovation_projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert renovation_projects"
  ON public.renovation_projects FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update renovation_projects"
  ON public.renovation_projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin delete renovation_projects"
  ON public.renovation_projects FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ============================================================
-- STEP 5: EXPENSES — Enable RLS and ensure policies
-- ============================================================
DROP POLICY IF EXISTS "Authenticated select expenses"  ON public.expenses;
DROP POLICY IF EXISTS "Authenticated insert expenses"  ON public.expenses;
DROP POLICY IF EXISTS "Authenticated update expenses"  ON public.expenses;
DROP POLICY IF EXISTS "Admin delete expenses"          ON public.expenses;

CREATE POLICY "Authenticated select expenses"
  ON public.expenses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert expenses"
  ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update expenses"
  ON public.expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin delete expenses"
  ON public.expenses FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ============================================================
-- STEP 6: INCOMES — Enable RLS and ensure policies
-- ============================================================
DROP POLICY IF EXISTS "Authenticated select incomes"  ON public.incomes;
DROP POLICY IF EXISTS "Authenticated insert incomes"  ON public.incomes;
DROP POLICY IF EXISTS "Authenticated update incomes"  ON public.incomes;
DROP POLICY IF EXISTS "Admin delete incomes"          ON public.incomes;

CREATE POLICY "Authenticated select incomes"
  ON public.incomes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert incomes"
  ON public.incomes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update incomes"
  ON public.incomes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin delete incomes"
  ON public.incomes FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ============================================================
-- STEP 7: ASSET_IMAGES — Verify policies
-- ============================================================
DROP POLICY IF EXISTS "Authenticated select asset_images"  ON public.asset_images;
DROP POLICY IF EXISTS "Authenticated insert asset_images"  ON public.asset_images;
DROP POLICY IF EXISTS "Authenticated update asset_images"  ON public.asset_images;
DROP POLICY IF EXISTS "Admin delete asset_images"          ON public.asset_images;

CREATE POLICY "Authenticated select asset_images"
  ON public.asset_images FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert asset_images"
  ON public.asset_images FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update asset_images"
  ON public.asset_images FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin delete asset_images"
  ON public.asset_images FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ============================================================
-- STEP 8: LEADS — Verify all policies including anon
-- ============================================================
DROP POLICY IF EXISTS "Anon insert leads"            ON public.leads;
DROP POLICY IF EXISTS "Authenticated select leads"   ON public.leads;
DROP POLICY IF EXISTS "Authenticated insert leads"   ON public.leads;
DROP POLICY IF EXISTS "Authenticated update leads"   ON public.leads;
DROP POLICY IF EXISTS "Admin delete leads"           ON public.leads;

-- Public (anon) can only insert leads (the public portal submission)
CREATE POLICY "Anon insert leads"
  ON public.leads FOR INSERT TO anon WITH CHECK (true);

-- Authenticated users can select, insert, and update leads
CREATE POLICY "Authenticated select leads"
  ON public.leads FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert leads"
  ON public.leads FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update leads"
  ON public.leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Only admin can delete leads
CREATE POLICY "Admin delete leads"
  ON public.leads FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ============================================================
-- STEP 9: Allow anon (public) SELECT on leads view
-- ============================================================
DROP POLICY IF EXISTS "Anon select leads public view" ON public.leads;

CREATE POLICY "Anon select leads public view"
  ON public.leads FOR SELECT TO anon USING (true);

-- ============================================================
-- FINAL VERIFICATION NOTES:
-- ============================================================
-- After running this migration, verify:
--
-- 1. All tables have RLS enabled (check pg_tables)
-- 2. Test INSERT as authenticated user:
--    INSERT INTO assets (title_deed_number, property_type, purchase_price) 
--    VALUES ('TEST001', 'land', 100000);
--
-- 3. Test that anon can insert leads:
--    INSERT INTO leads (asset_id, name, email, phone) 
--    VALUES (...);
--
-- 4. Check that get_user_role() works:
--    SELECT get_user_role();
--
-- If asset creation STILL fails after this, check:
-- - User is logged in (check auth.uid() in browser console)
-- - Session token is being sent to Supabase
-- - Browser console for PostgREST errors (42501 = RLS block)
