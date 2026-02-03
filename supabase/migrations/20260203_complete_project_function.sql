-- Migration: Add complete_project function for atomic project completion
-- Run this migration in your Supabase SQL Editor

-- Ensure project_type column exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'renovation_projects' AND column_name = 'project_type'
  ) THEN
    ALTER TABLE renovation_projects
    ADD COLUMN project_type TEXT DEFAULT 'renovation' NOT NULL;

    ALTER TABLE renovation_projects
    ADD CONSTRAINT renovation_projects_project_type_check
    CHECK (project_type IN ('renovation', 'new_construction'));
  END IF;
END $$;

-- Ensure target_property_type column exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'renovation_projects' AND column_name = 'target_property_type'
  ) THEN
    ALTER TABLE renovation_projects
    ADD COLUMN target_property_type TEXT DEFAULT NULL;

    ALTER TABLE renovation_projects
    ADD CONSTRAINT renovation_projects_target_property_type_check
    CHECK (target_property_type IS NULL OR target_property_type IN ('land', 'house', 'semi_detached_house', 'condo', 'townhouse', 'commercial', 'other'));
  END IF;
END $$;

-- Create or replace function to complete a project and update asset atomically
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
  -- Get the project
  SELECT * INTO v_project
  FROM renovation_projects
  WHERE id = p_project_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Project not found');
  END IF;

  -- Check if already completed
  IF v_project.status = 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Project already completed');
  END IF;

  -- Update project status to completed
  UPDATE renovation_projects
  SET
    status = 'completed',
    end_date = CURRENT_DATE
  WHERE id = p_project_id;

  -- If updating asset and it's a new construction project
  IF p_update_asset AND v_project.project_type = 'new_construction' AND v_project.target_property_type IS NOT NULL THEN
    -- Get current asset
    SELECT * INTO v_asset
    FROM assets
    WHERE id = v_project.asset_id;

    IF FOUND THEN
      -- Update asset with new property type, status, and optionally name
      UPDATE assets
      SET
        property_type = v_project.target_property_type,
        status = 'owned',
        name = COALESCE(NULLIF(TRIM(p_new_asset_name), ''), name)
      WHERE id = v_project.asset_id;

      v_result := json_build_object(
        'success', true,
        'project_id', p_project_id,
        'asset_updated', true,
        'old_property_type', v_asset.property_type,
        'new_property_type', v_project.target_property_type,
        'old_name', v_asset.name,
        'new_name', COALESCE(NULLIF(TRIM(p_new_asset_name), ''), v_asset.name)
      );
    ELSE
      v_result := json_build_object(
        'success', true,
        'project_id', p_project_id,
        'asset_updated', false,
        'warning', 'Asset not found'
      );
    END IF;
  ELSE
    v_result := json_build_object(
      'success', true,
      'project_id', p_project_id,
      'asset_updated', false
    );
  END IF;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_project(UUID, BOOLEAN, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION complete_project IS 'Atomically completes a project and optionally updates the linked asset with new property type, status (to owned), and name.';
