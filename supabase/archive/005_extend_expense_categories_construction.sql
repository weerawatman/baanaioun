-- Migration: Add construction-specific expense categories
-- Run this migration in your Supabase SQL Editor

-- Drop existing category check constraint if it exists
ALTER TABLE expenses
DROP CONSTRAINT IF EXISTS expenses_category_check;

-- Add new check constraint with all expense categories (including construction-specific)
ALTER TABLE expenses
ADD CONSTRAINT expenses_category_check
CHECK (category IN (
  -- General categories
  'materials',
  'labor',
  'service',
  'electricity',
  -- Construction-specific categories
  'land_filling',
  'building_permit',
  'foundation',
  'architect_fee'
));

-- Comment for documentation
COMMENT ON COLUMN expenses.category IS 'Expense category: materials, labor, service, electricity (general) or land_filling, building_permit, foundation, architect_fee (construction-specific)';
