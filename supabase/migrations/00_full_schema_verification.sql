-- ============================================================
-- BAANAIOUN - Full Schema Verification & Setup Script
-- Run this in Supabase SQL Editor to verify/create all tables
-- ============================================================

-- ============================================================
-- 1. ASSETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  title_deed_number TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  property_type TEXT NOT NULL,
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  purchase_date DATE,
  appraised_value NUMERIC,
  mortgage_bank TEXT,
  mortgage_amount NUMERIC,
  fire_insurance_expiry DATE,
  land_tax_due_date DATE,
  status TEXT NOT NULL DEFAULT 'owned',
  notes TEXT
);

-- Add check constraints for assets (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assets_property_type_check'
  ) THEN
    ALTER TABLE assets ADD CONSTRAINT assets_property_type_check
    CHECK (property_type IN ('land', 'house', 'semi_detached_house', 'condo', 'townhouse', 'commercial', 'other'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assets_status_check'
  ) THEN
    ALTER TABLE assets ADD CONSTRAINT assets_status_check
    CHECK (status IN ('owned', 'sold', 'under_renovation'));
  END IF;
END $$;

-- ============================================================
-- 2. RENOVATION_PROJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS renovation_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  budget NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned',
  project_type TEXT NOT NULL DEFAULT 'renovation',
  target_property_type TEXT
);

-- Add columns if they don't exist (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'renovation_projects' AND column_name = 'project_type'
  ) THEN
    ALTER TABLE renovation_projects ADD COLUMN project_type TEXT NOT NULL DEFAULT 'renovation';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'renovation_projects' AND column_name = 'target_property_type'
  ) THEN
    ALTER TABLE renovation_projects ADD COLUMN target_property_type TEXT;
  END IF;
END $$;

-- Add check constraints for renovation_projects (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'renovation_projects_status_check'
  ) THEN
    ALTER TABLE renovation_projects ADD CONSTRAINT renovation_projects_status_check
    CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'renovation_projects_project_type_check'
  ) THEN
    ALTER TABLE renovation_projects ADD CONSTRAINT renovation_projects_project_type_check
    CHECK (project_type IN ('renovation', 'new_construction'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'renovation_projects_target_property_type_check'
  ) THEN
    ALTER TABLE renovation_projects ADD CONSTRAINT renovation_projects_target_property_type_check
    CHECK (target_property_type IS NULL OR target_property_type IN ('land', 'house', 'semi_detached_house', 'condo', 'townhouse', 'commercial', 'other'));
  END IF;
END $$;

-- Create index for project_type
CREATE INDEX IF NOT EXISTS idx_renovation_projects_project_type ON renovation_projects(project_type);

-- ============================================================
-- 3. EXPENSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  renovation_project_id UUID REFERENCES renovation_projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  description TEXT,
  vendor TEXT
);

-- Update expense category constraint (drop old, add new with all categories)
DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_category_check'
  ) THEN
    ALTER TABLE expenses DROP CONSTRAINT expenses_category_check;
  END IF;

  -- Add new constraint with all categories
  ALTER TABLE expenses ADD CONSTRAINT expenses_category_check
  CHECK (category IN (
    'materials', 'labor', 'service', 'electricity',
    'land_filling', 'building_permit', 'foundation', 'architect_fee'
  ));
END $$;

-- ============================================================
-- 4. INCOMES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  description TEXT
);

-- ============================================================
-- 5. ASSET_IMAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS asset_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  category TEXT NOT NULL DEFAULT 'purchase'
);

-- Add check constraint for image category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'asset_images_category_check'
  ) THEN
    ALTER TABLE asset_images ADD CONSTRAINT asset_images_category_check
    CHECK (category IN ('purchase', 'before_renovation', 'after_renovation'));
  END IF;
END $$;

-- ============================================================
-- 6. COMPLETE_PROJECT FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION complete_project(
  p_project_id UUID,
  p_update_asset BOOLEAN DEFAULT FALSE,
  p_new_asset_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project RECORD;
  v_asset RECORD;
  v_result JSON;
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

  IF p_update_asset AND v_project.project_type = 'new_construction' AND v_project.target_property_type IS NOT NULL THEN
    SELECT * INTO v_asset FROM assets WHERE id = v_project.asset_id;
    IF FOUND THEN
      UPDATE assets
      SET property_type = v_project.target_property_type,
          status = 'owned',
          name = COALESCE(NULLIF(TRIM(p_new_asset_name), ''), name)
      WHERE id = v_project.asset_id;

      v_result := json_build_object(
        'success', true,
        'asset_updated', true,
        'old_property_type', v_asset.property_type,
        'new_property_type', v_project.target_property_type
      );
    ELSE
      v_result := json_build_object('success', true, 'asset_updated', false);
    END IF;
  ELSE
    v_result := json_build_object('success', true, 'asset_updated', false);
  END IF;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION complete_project(UUID, BOOLEAN, TEXT) TO authenticated;

-- ============================================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_images ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (adjust as needed)
DO $$
BEGIN
  -- Assets policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for authenticated users on assets') THEN
    CREATE POLICY "Allow all for authenticated users on assets" ON assets FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- Renovation projects policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for authenticated users on renovation_projects') THEN
    CREATE POLICY "Allow all for authenticated users on renovation_projects" ON renovation_projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- Expenses policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for authenticated users on expenses') THEN
    CREATE POLICY "Allow all for authenticated users on expenses" ON expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- Incomes policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for authenticated users on incomes') THEN
    CREATE POLICY "Allow all for authenticated users on incomes" ON incomes FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  -- Asset images policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for authenticated users on asset_images') THEN
    CREATE POLICY "Allow all for authenticated users on asset_images" ON asset_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 8. VERIFICATION QUERIES
-- ============================================================
-- Run these to verify everything is set up correctly:

SELECT '=== TABLES ===' as info;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

SELECT '=== ASSETS COLUMNS ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'assets' ORDER BY ordinal_position;

SELECT '=== RENOVATION_PROJECTS COLUMNS ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'renovation_projects' ORDER BY ordinal_position;

SELECT '=== EXPENSES COLUMNS ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'expenses' ORDER BY ordinal_position;

SELECT '=== CHECK CONSTRAINTS ===' as info;
SELECT conname, conrelid::regclass as table_name
FROM pg_constraint
WHERE contype = 'c' AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, conname;

SELECT '=== FUNCTIONS ===' as info;
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
