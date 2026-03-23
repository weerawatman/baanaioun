-- ============================================================
-- BAANAIOUN — 1. Core Schema (Clean Start)
-- ============================================================

-- 0. DROP EVERYTHING FIRST (To ensure a clean run)
DROP VIEW IF EXISTS public_asset_images;
DROP VIEW IF EXISTS public_assets;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS asset_images CASCADE;
DROP TABLE IF EXISTS incomes CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS renovation_projects CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 1. ASSETS
CREATE TABLE assets (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  asset_code            TEXT         GENERATED ALWAYS AS ('A-' || UPPER(SUBSTR(id::TEXT, 1, 8))) STORED,
  title_deed_number     TEXT         NOT NULL,
  name                  TEXT         DEFAULT 'ทรัพย์สินไม่มีชื่อ',
  address               TEXT,
  property_type         TEXT         NOT NULL,
  purchase_price        NUMERIC      NOT NULL DEFAULT 0,
  purchase_date         DATE,
  appraised_value       NUMERIC,
  mortgage_bank         TEXT,
  mortgage_amount       NUMERIC,
  loan_term_years       INTEGER,
  loan_start_date       DATE,
  fire_insurance_expiry DATE,
  land_tax_due_date     DATE,
  status                TEXT         NOT NULL DEFAULT 'developing',
  notes                 TEXT,
  selling_price         NUMERIC,
  rental_price          NUMERIC,
  description           TEXT,
  location_lat_long     TEXT,
  tenant_name           TEXT,
  tenant_contact        TEXT,
  updated_at            TIMESTAMPTZ  DEFAULT NOW(),

  CONSTRAINT assets_property_type_check CHECK (
    property_type IN ('land', 'house', 'semi_detached_house', 'condo', 'townhouse', 'commercial', 'other')
  ),
  CONSTRAINT assets_status_check CHECK (
    status IN ('developing', 'ready_for_sale', 'ready_for_rent', 'rented', 'sold', 'available')
  )
);

-- 2. RENOVATION_PROJECTS
CREATE TABLE renovation_projects (
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

-- 3. EXPENSES
CREATE TABLE expenses (
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

-- 4. INCOMES
CREATE TABLE incomes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  asset_id    UUID        NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  source      TEXT        NOT NULL,
  amount      NUMERIC     NOT NULL DEFAULT 0,
  date        DATE        NOT NULL,
  description TEXT
);

-- 5. ASSET_IMAGES
CREATE TABLE asset_images (
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

-- 6. LEADS
CREATE TABLE leads (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  asset_id         UUID        NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  customer_name    TEXT        NOT NULL,
  customer_phone   TEXT,
  customer_line_id TEXT,
  message          TEXT
);
