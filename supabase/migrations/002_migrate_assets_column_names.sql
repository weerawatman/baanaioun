-- ============================================================
-- BAANAIOUN - Migrate Assets Schema
-- รัน SQL นี้ใน Supabase SQL Editor ทีละ block
-- ============================================================

-- ============================================================
-- BLOCK 1: Rename columns ใน assets table
-- ============================================================
ALTER TABLE assets RENAME COLUMN title_deed_no TO title_deed_number;

-- ============================================================
-- BLOCK 2: Rename asset_type to property_type
-- ============================================================
ALTER TABLE assets RENAME COLUMN asset_type TO property_type;

-- ============================================================
-- BLOCK 3: Rename address_detail to address
-- ============================================================
ALTER TABLE assets RENAME COLUMN address_detail TO address;

-- ============================================================
-- BLOCK 4: Add missing columns
-- ============================================================
ALTER TABLE assets ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'ทรัพย์สินไม่มีชื่อ';

ALTER TABLE assets ADD COLUMN IF NOT EXISTS purchase_date DATE;

ALTER TABLE assets ADD COLUMN IF NOT EXISTS mortgage_amount NUMERIC;

ALTER TABLE assets ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================
-- BLOCK 5: Update name from asset_code if empty
-- ============================================================
UPDATE assets SET name = COALESCE(asset_code, 'ทรัพย์สิน-' || id::text) WHERE name = 'ทรัพย์สินไม่มีชื่อ' OR name IS NULL;

-- ============================================================
-- BLOCK 6: Add constraints for property_type
-- ============================================================
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_property_type_check;

ALTER TABLE assets ADD CONSTRAINT assets_property_type_check CHECK (property_type IN ('land', 'house', 'semi_detached_house', 'condo', 'townhouse', 'commercial', 'other'));

-- ============================================================
-- BLOCK 7: Add constraints for status
-- ============================================================
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_status_check;

ALTER TABLE assets ADD CONSTRAINT assets_status_check CHECK (status IN ('owned', 'sold', 'under_renovation'));
