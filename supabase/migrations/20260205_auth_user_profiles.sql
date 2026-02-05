-- ============================================================
-- AUTH: User Profiles + Role-Based RLS
-- ============================================================

-- ============================================================
-- 1. CREATE user_profiles TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 3. HELPER FUNCTION for RLS
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- 4. RLS on user_profiles
-- ============================================================
CREATE POLICY "Authenticated can select all profiles"
  ON user_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============================================================
-- 5. DROP OLD DEV ANON POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Allow all for anon users on assets" ON assets;
DROP POLICY IF EXISTS "Allow all for anon users on renovation_projects" ON renovation_projects;
DROP POLICY IF EXISTS "Allow all for anon users on expenses" ON expenses;
DROP POLICY IF EXISTS "Allow all for anon users on incomes" ON incomes;
DROP POLICY IF EXISTS "Allow all for anon users on asset_images" ON asset_images;
DROP POLICY IF EXISTS "Allow all for anon users on leads" ON leads;

-- ============================================================
-- 6. REPLACE OLD AUTHENTICATED "ALL" POLICIES WITH ROLE-BASED
-- ============================================================

-- Drop old "Allow all" authenticated policies
DROP POLICY IF EXISTS "Allow all for authenticated users on assets" ON assets;
DROP POLICY IF EXISTS "Allow all for authenticated users on renovation_projects" ON renovation_projects;
DROP POLICY IF EXISTS "Allow all for authenticated users on expenses" ON expenses;
DROP POLICY IF EXISTS "Allow all for authenticated users on incomes" ON incomes;
DROP POLICY IF EXISTS "Allow all for authenticated users on asset_images" ON asset_images;

-- ---- ASSETS ----
CREATE POLICY "Authenticated select assets"
  ON assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert assets"
  ON assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update assets"
  ON assets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete assets"
  ON assets FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ---- RENOVATION_PROJECTS ----
CREATE POLICY "Authenticated select renovation_projects"
  ON renovation_projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert renovation_projects"
  ON renovation_projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update renovation_projects"
  ON renovation_projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete renovation_projects"
  ON renovation_projects FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ---- EXPENSES ----
CREATE POLICY "Authenticated select expenses"
  ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert expenses"
  ON expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update expenses"
  ON expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete expenses"
  ON expenses FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ---- INCOMES ----
CREATE POLICY "Authenticated select incomes"
  ON incomes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert incomes"
  ON incomes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update incomes"
  ON incomes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete incomes"
  ON incomes FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ---- ASSET_IMAGES ----
CREATE POLICY "Authenticated select asset_images"
  ON asset_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert asset_images"
  ON asset_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update asset_images"
  ON asset_images FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete asset_images"
  ON asset_images FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- ---- LEADS ----
-- Enable RLS on leads if not already done
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop old authenticated "ALL" policy on leads if it exists
DROP POLICY IF EXISTS "Allow all for authenticated users on leads" ON leads;

CREATE POLICY "Authenticated select leads"
  ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert leads"
  ON leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update leads"
  ON leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete leads"
  ON leads FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- Keep the existing "Allow anon insert on leads" policy for public lead form
-- (created in 20260204_public_listing_rls.sql - do NOT drop it)

-- ============================================================
-- 7. GRANT complete_project FUNCTION TO authenticated
--    (already done in schema, but ensure it's still there)
-- ============================================================
GRANT EXECUTE ON FUNCTION complete_project(UUID, BOOLEAN, TEXT) TO authenticated;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
