-- Migration: Add project_type and target_property_type columns to renovation_projects
-- Run this migration in your Supabase SQL Editor

-- Add project_type column with default 'renovation' for existing rows
ALTER TABLE renovation_projects
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'renovation' NOT NULL;

-- Add target_property_type column (nullable, used only for new_construction projects)
ALTER TABLE renovation_projects
ADD COLUMN IF NOT EXISTS target_property_type TEXT DEFAULT NULL;

-- Add check constraint for project_type values
ALTER TABLE renovation_projects
ADD CONSTRAINT renovation_projects_project_type_check
CHECK (project_type IN ('renovation', 'new_construction'));

-- Add check constraint for target_property_type values (when not null)
ALTER TABLE renovation_projects
ADD CONSTRAINT renovation_projects_target_property_type_check
CHECK (target_property_type IS NULL OR target_property_type IN ('land', 'house', 'semi_detached_house', 'condo', 'townhouse', 'commercial', 'other'));

-- Create index for filtering by project_type
CREATE INDEX IF NOT EXISTS idx_renovation_projects_project_type ON renovation_projects(project_type);

-- Comment for documentation
COMMENT ON COLUMN renovation_projects.project_type IS 'Type of project: renovation or new_construction';
COMMENT ON COLUMN renovation_projects.target_property_type IS 'Target property type for new_construction projects. Used to update asset property_type upon completion.';
