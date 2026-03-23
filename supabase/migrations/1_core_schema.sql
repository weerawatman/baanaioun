-- ============================================================
-- BAANAIOUN — 1. Core Schema
-- Creates all database tables with current column structure.
--
-- Run ORDER: 1 → 2 → 3 → 4
-- ============================================================

-- ============================================================
-- ASSETS
-- Central table. All other tables link back to assets.
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  asset_code            TEXT         GENERATED ALWAYS AS ('A-' || UPPER(SUBSTR(id::TEXT, 1, 8))) STORED,
  title_deed_number     TEXT         NOT NULL,
  name                  TEXT,
  address               TEXT,
  property_type         TEXT         NOT NULL,
  purchase_price        NUMERIC      NOT NULL DEFAULT 0,
  purchase_date         DATE,
  appraised_value       NUMERIC,
  mortgage_bank         TEXT,
  mortgage_amount       NUMERIC,
  fire_insurance_expiry DATE,
  land_tax_due_date     DATE,
  status                TEXT         NOT NULL DEFAULT 'developing',
  notes                 TEXT,
  -- Public listing fields
  selling_price         NUMERIC,
  rental_price          NUMERIC,
  description           TEXT,
  location_lat_long     TEXT,
  -- Rental tracking
  tenant_name           TEXT,
  tenant_contact        TEXT,

  CONSTRAINT assets_property_type_check CHECK (
    property_type IN ('land', 'house', 'semi_detached_house', 'condo', 'townhouse', 'commercial', 'other')
  ),
  CONSTRAINT assets_status_check CHECK (
    status IN ('developing', 'ready_for_sale', 'ready_for_rent', 'rented', 'sold')
  )
);

COMMENT ON COLUMN assets.asset_code        IS 'Auto-generated short ID (e.g. A-550E8400)';
COMMENT ON COLUMN assets.location_lat_long IS 'Coordinates as "lat,lng" string (e.g. "13.7563,100.5018")';
COMMENT ON COLUMN assets.tenant_name       IS 'Current tenant name — set when status = rented';
COMMENT ON COLUMN assets.tenant_contact    IS 'Tenant phone/email — set when status = rented';

-- ============================================================
-- RENOVATION_PROJECTS
-- Tracks renovation and new-construction projects per asset.
-- ============================================================
CREATE TABLE IF NOT EXISTS renovation_projects (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  asset_id             UUID        NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  name                 TEXT        NOT NULL,
  description          TEXT,
  project_type         TEXT        NOT NULL DEFAULT 'renovation',
  target_property_type TEXT,
  start_date           DATE        NOT NULL,
  end_date             DATE,
  budget               NUMERIC     NOT NULL DEFAULT 0,
  actual_cost          NUMERIC,
  status               TEXT        NOT NULL DEFAULT 'planned',

  CONSTRAINT renovation_projects_project_type_check CHECK (
    project_type IN ('renovation', 'new_construction')
  ),
  CONSTRAINT renovation_projects_status_check CHECK (
    status IN ('planned', 'in_progress', 'completed', 'cancelled')
  ),
  CONSTRAINT renovation_projects_target_property_type_check CHECK (
    target_property_type IS NULL OR target_property_type IN
    ('land', 'house', 'semi_detached_house', 'condo', 'townhouse', 'commercial', 'other')
  )
);

COMMENT ON COLUMN renovation_projects.project_type         IS 'renovation = ปรับปรุง | new_construction = ก่อสร้างใหม่';
COMMENT ON COLUMN renovation_projects.target_property_type IS 'For new_construction: property type after completion';

-- ============================================================
-- EXPENSES
-- Costs linked to an asset and/or a renovation project.
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  asset_id              UUID        REFERENCES assets(id) ON DELETE CASCADE,
  renovation_project_id UUID        REFERENCES renovation_projects(id) ON DELETE CASCADE,
  category              TEXT        NOT NULL,
  amount                NUMERIC     NOT NULL DEFAULT 0,
  date                  DATE        NOT NULL,
  description           TEXT,
  vendor                TEXT,

  CONSTRAINT expenses_category_check CHECK (
    category IN (
      'materials', 'labor', 'service', 'electricity',
      'land_filling', 'building_permit', 'foundation', 'architect_fee'
    )
  )
);

-- ============================================================
-- INCOMES
-- Revenue received from an asset (rent, sale proceeds, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS incomes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  asset_id    UUID        NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  source      TEXT        NOT NULL,
  amount      NUMERIC     NOT NULL DEFAULT 0,
  date        DATE        NOT NULL,
  description TEXT
);

-- ============================================================
-- ASSET_IMAGES
-- Photos linked to an asset, optionally tied to a project.
-- ============================================================
CREATE TABLE IF NOT EXISTS asset_images (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  asset_id              UUID        NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  renovation_project_id UUID        REFERENCES renovation_projects(id) ON DELETE SET NULL,
  url                   TEXT        NOT NULL,
  caption               TEXT,
  is_primary            BOOLEAN     NOT NULL DEFAULT FALSE,
  category              TEXT        NOT NULL DEFAULT 'purchase',

  CONSTRAINT asset_images_category_check CHECK (
    category IN ('purchase', 'before_renovation', 'in_progress', 'after_renovation', 'final')
  )
);

COMMENT ON COLUMN asset_images.is_primary            IS 'Main thumbnail shown on listing cards';
COMMENT ON COLUMN asset_images.renovation_project_id IS 'Links image to a project timeline (optional)';

-- ============================================================
-- LEADS
-- Interest forms submitted via the public listings portal.
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  asset_id         UUID        NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  customer_name    TEXT        NOT NULL,
  customer_phone   TEXT,
  customer_line_id TEXT,
  message          TEXT
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- Policies are defined in 2_rls_and_auth.sql
-- ============================================================
ALTER TABLE assets              ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_images        ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads               ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STORAGE BUCKET
-- Create manually in Supabase Dashboard > Storage, or run:
--
--   INSERT INTO storage.buckets (id, name, public)
--   VALUES ('asset-files', 'asset-files', true);
--
-- Storage policies are documented in 3_public_listings.sql
-- ============================================================
