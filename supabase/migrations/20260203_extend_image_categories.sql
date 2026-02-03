-- Migration: Extend image categories for project timeline view
-- This migration adds support for project-linked images and new categories

-- Add renovation_project_id column for project linking
ALTER TABLE asset_images
ADD COLUMN IF NOT EXISTS renovation_project_id UUID REFERENCES renovation_projects(id) ON DELETE SET NULL;

-- Create index for project-based queries
CREATE INDEX IF NOT EXISTS idx_asset_images_project_id ON asset_images(renovation_project_id);

-- Drop existing category constraint
ALTER TABLE asset_images DROP CONSTRAINT IF EXISTS asset_images_category_check;

-- Add new constraint with extended categories
-- New categories:
--   'in_progress' - Images taken during active construction/renovation
--   'final' - Showcase-quality completion photos
ALTER TABLE asset_images ADD CONSTRAINT asset_images_category_check
CHECK (category IN ('purchase', 'before_renovation', 'in_progress', 'after_renovation', 'final'));
