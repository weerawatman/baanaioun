-- ============================================================
-- BAANAIOUN - Fix Schema Script (Safe for existing tables)
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: Add missing columns to ASSETS table
-- ============================================================
DO $$
BEGIN
  -- Add property_type if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'property_type') THEN
    ALTER TABLE assets ADD COLUMN property_type TEXT DEFAULT 'land';
    UPDATE assets SET property_type = 'land' WHERE property_type IS NULL;
    ALTER TABLE assets ALTER COLUMN property_type SET NOT NULL;
    RAISE NOTICE 'Added column: assets.property_type';
  END IF;

  -- Add status if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'status') THEN
    ALTER TABLE assets ADD COLUMN status TEXT DEFAULT 'owned';
    UPDATE assets SET status = 'owned' WHERE status IS NULL;
    ALTER TABLE assets ALTER COLUMN status SET NOT NULL;
    RAISE NOTICE 'Added column: assets.status';
  END IF;

  -- Add title_deed_number if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'title_deed_number') THEN
    ALTER TABLE assets ADD COLUMN title_deed_number TEXT DEFAULT '';
    RAISE NOTICE 'Added column: assets.title_deed_number';
  END IF;

  -- Add name if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'name') THEN
    ALTER TABLE assets ADD COLUMN name TEXT DEFAULT 'Unnamed Asset';
    RAISE NOTICE 'Added column: assets.name';
  END IF;

  -- Add address if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'address') THEN
    ALTER TABLE assets ADD COLUMN address TEXT;
    RAISE NOTICE 'Added column: assets.address';
  END IF;

  -- Add purchase_price if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'purchase_price') THEN
    ALTER TABLE assets ADD COLUMN purchase_price NUMERIC DEFAULT 0;
    RAISE NOTICE 'Added column: assets.purchase_price';
  END IF;

  -- Add purchase_date if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'purchase_date') THEN
    ALTER TABLE assets ADD COLUMN purchase_date DATE;
    RAISE NOTICE 'Added column: assets.purchase_date';
  END IF;

  -- Add appraised_value if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'appraised_value') THEN
    ALTER TABLE assets ADD COLUMN appraised_value NUMERIC;
    RAISE NOTICE 'Added column: assets.appraised_value';
  END IF;

  -- Add mortgage_bank if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'mortgage_bank') THEN
    ALTER TABLE assets ADD COLUMN mortgage_bank TEXT;
    RAISE NOTICE 'Added column: assets.mortgage_bank';
  END IF;

  -- Add mortgage_amount if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'mortgage_amount') THEN
    ALTER TABLE assets ADD COLUMN mortgage_amount NUMERIC;
    RAISE NOTICE 'Added column: assets.mortgage_amount';
  END IF;

  -- Add fire_insurance_expiry if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'fire_insurance_expiry') THEN
    ALTER TABLE assets ADD COLUMN fire_insurance_expiry DATE;
    RAISE NOTICE 'Added column: assets.fire_insurance_expiry';
  END IF;

  -- Add land_tax_due_date if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'land_tax_due_date') THEN
    ALTER TABLE assets ADD COLUMN land_tax_due_date DATE;
    RAISE NOTICE 'Added column: assets.land_tax_due_date';
  END IF;

  -- Add notes if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'notes') THEN
    ALTER TABLE assets ADD COLUMN notes TEXT;
    RAISE NOTICE 'Added column: assets.notes';
  END IF;
END $$;

-- ============================================================
-- STEP 2: Add constraints to ASSETS (after columns exist)
-- ============================================================
DO $$
BEGIN
  -- Drop old constraint if exists, then add new
  ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_property_type_check;
  ALTER TABLE assets ADD CONSTRAINT assets_property_type_check
    CHECK (property_type IN ('land', 'house', 'semi_detached_house', 'condo', 'townhouse', 'commercial', 'other'));
  RAISE NOTICE 'Added constraint: assets_property_type_check';

  ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_status_check;
  ALTER TABLE assets ADD CONSTRAINT assets_status_check
    CHECK (status IN ('owned', 'sold', 'under_renovation'));
  RAISE NOTICE 'Added constraint: assets_status_check';
END $$;

-- ============================================================
-- STEP 3: Add missing columns to RENOVATION_PROJECTS table
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'renovation_projects' AND column_name = 'project_type') THEN
    ALTER TABLE renovation_projects ADD COLUMN project_type TEXT DEFAULT 'renovation' NOT NULL;
    RAISE NOTICE 'Added column: renovation_projects.project_type';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'renovation_projects' AND column_name = 'target_property_type') THEN
    ALTER TABLE renovation_projects ADD COLUMN target_property_type TEXT;
    RAISE NOTICE 'Added column: renovation_projects.target_property_type';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'renovation_projects' AND column_name = 'budget') THEN
    ALTER TABLE renovation_projects ADD COLUMN budget NUMERIC DEFAULT 0;
    RAISE NOTICE 'Added column: renovation_projects.budget';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'renovation_projects' AND column_name = 'status') THEN
    ALTER TABLE renovation_projects ADD COLUMN status TEXT DEFAULT 'planned';
    RAISE NOTICE 'Added column: renovation_projects.status';
  END IF;
END $$;

-- ============================================================
-- STEP 4: Add constraints to RENOVATION_PROJECTS
-- ============================================================
DO $$
BEGIN
  ALTER TABLE renovation_projects DROP CONSTRAINT IF EXISTS renovation_projects_status_check;
  ALTER TABLE renovation_projects ADD CONSTRAINT renovation_projects_status_check
    CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled'));

  ALTER TABLE renovation_projects DROP CONSTRAINT IF EXISTS renovation_projects_project_type_check;
  ALTER TABLE renovation_projects ADD CONSTRAINT renovation_projects_project_type_check
    CHECK (project_type IN ('renovation', 'new_construction'));

  ALTER TABLE renovation_projects DROP CONSTRAINT IF EXISTS renovation_projects_target_property_type_check;
  ALTER TABLE renovation_projects ADD CONSTRAINT renovation_projects_target_property_type_check
    CHECK (target_property_type IS NULL OR target_property_type IN ('land', 'house', 'semi_detached_house', 'condo', 'townhouse', 'commercial', 'other'));
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_renovation_projects_project_type ON renovation_projects(project_type);

-- ============================================================
-- STEP 5: Fix EXPENSES table
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'vendor') THEN
    ALTER TABLE expenses ADD COLUMN vendor TEXT;
    RAISE NOTICE 'Added column: expenses.vendor';
  END IF;
END $$;

-- Update expense category constraint
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
ALTER TABLE expenses ADD CONSTRAINT expenses_category_check
  CHECK (category IN (
    'materials', 'labor', 'service', 'electricity',
    'land_filling', 'building_permit', 'foundation', 'architect_fee'
  ));

-- ============================================================
-- STEP 6: Fix ASSET_IMAGES table
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'asset_images' AND column_name = 'category') THEN
    ALTER TABLE asset_images ADD COLUMN category TEXT DEFAULT 'purchase';
    RAISE NOTICE 'Added column: asset_images.category';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'asset_images' AND column_name = 'is_primary') THEN
    ALTER TABLE asset_images ADD COLUMN is_primary BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added column: asset_images.is_primary';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'asset_images' AND column_name = 'caption') THEN
    ALTER TABLE asset_images ADD COLUMN caption TEXT;
    RAISE NOTICE 'Added column: asset_images.caption';
  END IF;
END $$;

ALTER TABLE asset_images DROP CONSTRAINT IF EXISTS asset_images_category_check;
ALTER TABLE asset_images ADD CONSTRAINT asset_images_category_check
  CHECK (category IN ('purchase', 'before_renovation', 'after_renovation'));

-- ============================================================
-- STEP 7: Create complete_project function
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
BEGIN
  SELECT * INTO v_project FROM renovation_projects WHERE id = p_project_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Project not found');
  END IF;

  UPDATE renovation_projects SET status = 'completed', end_date = CURRENT_DATE WHERE id = p_project_id;

  IF p_update_asset AND v_project.project_type = 'new_construction' AND v_project.target_property_type IS NOT NULL THEN
    SELECT * INTO v_asset FROM assets WHERE id = v_project.asset_id;
    IF FOUND THEN
      UPDATE assets
      SET property_type = v_project.target_property_type,
          status = 'owned',
          name = COALESCE(NULLIF(TRIM(p_new_asset_name), ''), name)
      WHERE id = v_project.asset_id;
      RETURN json_build_object('success', true, 'asset_updated', true);
    END IF;
  END IF;

  RETURN json_build_object('success', true, 'asset_updated', false);
END;
$$;

GRANT EXECUTE ON FUNCTION complete_project(UUID, BOOLEAN, TEXT) TO authenticated;

-- ============================================================
-- STEP 8: Verify Schema
-- ============================================================
SELECT 'Schema update completed!' as status;

SELECT '=== ASSETS COLUMNS ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'assets' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== RENOVATION_PROJECTS COLUMNS ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'renovation_projects' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== EXPENSES COLUMNS ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'expenses' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== ALL CONSTRAINTS ===' as section;
SELECT conname as constraint_name, conrelid::regclass as table_name
FROM pg_constraint
WHERE contype = 'c' AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text;
