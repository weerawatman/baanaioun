-- ============================================================
-- BAANAIOUN — 2. Auth & Row-Level Security (Idempotent)
-- ============================================================

-- USER_PROFILES
CREATE TABLE IF NOT EXISTS user_profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT        NOT NULL,
  full_name  TEXT,
  role       TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- FUNCTION: get_user_role()
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$;

-- FUNCTION: handle_new_user()
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- FUNCTION: complete_project()
CREATE OR REPLACE FUNCTION complete_project(
  p_project_id     UUID,
  p_update_asset   BOOLEAN DEFAULT FALSE,
  p_new_asset_name TEXT    DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_project RECORD;
  v_asset   RECORD;
BEGIN
  SELECT * INTO v_project FROM renovation_projects WHERE id = p_project_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Project not found');
  END IF;

  IF v_project.status = 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Project already completed');
  END IF;

  UPDATE renovation_projects
  SET status = 'completed', end_date = CURRENT_DATE
  WHERE id = p_project_id;

  IF p_update_asset
     AND v_project.project_type = 'new_construction'
     AND v_project.target_property_type IS NOT NULL
  THEN
    SELECT * INTO v_asset FROM assets WHERE id = v_project.asset_id;
    IF FOUND THEN
      UPDATE assets
      SET property_type = v_project.target_property_type,
          name = COALESCE(NULLIF(TRIM(p_new_asset_name), ''), name)
      WHERE id = v_project.asset_id;

      RETURN json_build_object(
        'success',           true,
        'asset_updated',     true,
        'old_property_type', v_asset.property_type,
        'new_property_type', v_project.target_property_type
      );
    END IF;
  END IF;

  RETURN json_build_object('success', true, 'asset_updated', false);
END;
$$;

GRANT EXECUTE ON FUNCTION complete_project(UUID, BOOLEAN, TEXT) TO authenticated;

-- RLS POLICIES — user_profiles
DROP POLICY IF EXISTS "Authenticated can read all profiles" ON user_profiles;
CREATE POLICY "Authenticated can read all profiles"
  ON user_profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- RLS POLICIES — assets
DROP POLICY IF EXISTS "Authenticated select assets" ON assets;
CREATE POLICY "Authenticated select assets"
  ON assets FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated insert assets" ON assets;
CREATE POLICY "Authenticated insert assets"
  ON assets FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update assets" ON assets;
CREATE POLICY "Authenticated update assets"
  ON assets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin delete assets" ON assets;
CREATE POLICY "Admin delete assets"
  ON assets FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- RLS POLICIES — renovation_projects
DROP POLICY IF EXISTS "Authenticated select renovation_projects" ON renovation_projects;
CREATE POLICY "Authenticated select renovation_projects"
  ON renovation_projects FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated insert renovation_projects" ON renovation_projects;
CREATE POLICY "Authenticated insert renovation_projects"
  ON renovation_projects FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update renovation_projects" ON renovation_projects;
CREATE POLICY "Authenticated update renovation_projects"
  ON renovation_projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin delete renovation_projects" ON renovation_projects;
CREATE POLICY "Admin delete renovation_projects"
  ON renovation_projects FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- RLS POLICIES — expenses
DROP POLICY IF EXISTS "Authenticated select expenses" ON expenses;
CREATE POLICY "Authenticated select expenses"
  ON expenses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated insert expenses" ON expenses;
CREATE POLICY "Authenticated insert expenses"
  ON expenses FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update expenses" ON expenses;
CREATE POLICY "Authenticated update expenses"
  ON expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin delete expenses" ON expenses;
CREATE POLICY "Admin delete expenses"
  ON expenses FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- RLS POLICIES — incomes
DROP POLICY IF EXISTS "Authenticated select incomes" ON incomes;
CREATE POLICY "Authenticated select incomes"
  ON incomes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated insert incomes" ON incomes;
CREATE POLICY "Authenticated insert incomes"
  ON incomes FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update incomes" ON incomes;
CREATE POLICY "Authenticated update incomes"
  ON incomes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin delete incomes" ON incomes;
CREATE POLICY "Admin delete incomes"
  ON incomes FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- RLS POLICIES — asset_images
DROP POLICY IF EXISTS "Authenticated select asset_images" ON asset_images;
CREATE POLICY "Authenticated select asset_images"
  ON asset_images FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated insert asset_images" ON asset_images;
CREATE POLICY "Authenticated insert asset_images"
  ON asset_images FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update asset_images" ON asset_images;
CREATE POLICY "Authenticated update asset_images"
  ON asset_images FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin delete asset_images" ON asset_images;
CREATE POLICY "Admin delete asset_images"
  ON asset_images FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- RLS POLICIES — leads
DROP POLICY IF EXISTS "Authenticated select leads" ON leads;
CREATE POLICY "Authenticated select leads"
  ON leads FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated insert leads" ON leads;
CREATE POLICY "Authenticated insert leads"
  ON leads FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated update leads" ON leads;
CREATE POLICY "Authenticated update leads"
  ON leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin delete leads" ON leads;
CREATE POLICY "Admin delete leads"
  ON leads FOR DELETE TO authenticated USING (get_user_role() = 'admin');
