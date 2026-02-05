-- ============================================================
-- Migration: Add Tenant Information Fields to Assets
-- Date: 2026-02-05
-- ============================================================

-- Add tenant_name and tenant_contact columns to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS tenant_name TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS tenant_contact TEXT;

-- Add comment for documentation
COMMENT ON COLUMN assets.tenant_name IS 'Name of the tenant (only applicable when status is rented)';
COMMENT ON COLUMN assets.tenant_contact IS 'Contact information for the tenant (phone/email)';

-- Verification
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'assets'
  AND column_name IN ('tenant_name', 'tenant_contact')
ORDER BY column_name;
