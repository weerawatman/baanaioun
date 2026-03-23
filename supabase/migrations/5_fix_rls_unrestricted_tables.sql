-- ============================================================
-- BAANAIOUN — 5. Fix: Enable RLS on tables left UNRESTRICTED
--
-- The assets, asset_images, and leads tables were missing
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY in production,
-- so their RLS policies were never enforced. This caused the
-- authenticated role to have no INSERT permission (Supabase
-- grants SELECT by default but INSERT requires an RLS policy
-- or explicit GRANT), silently blocking all asset creation
-- from the frontend.
--
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- 1. ENABLE RLS on the three UNRESTRICTED tables
-- ============================================================
ALTER TABLE public.assets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_images  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads         ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. ASSETS — recreate policies safely
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
-- 3. ASSET_IMAGES — recreate policies safely
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
-- 4. LEADS — recreate policies safely
-- ============================================================
DROP POLICY IF EXISTS "Anon insert leads"         ON public.leads;
DROP POLICY IF EXISTS "Authenticated select leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated insert leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated update leads" ON public.leads;
DROP POLICY IF EXISTS "Admin delete leads"         ON public.leads;

CREATE POLICY "Anon insert leads"
  ON public.leads FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Authenticated select leads"
  ON public.leads FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert leads"
  ON public.leads FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update leads"
  ON public.leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin delete leads"
  ON public.leads FOR DELETE TO authenticated USING (get_user_role() = 'admin');
