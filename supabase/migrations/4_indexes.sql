-- ============================================================
-- BAANAIOUN — 4. Performance Indexes
--
-- Run after all tables are created (after migration 1).
-- Indexes on foreign keys and frequently filtered columns.
--
-- Run ORDER: 1 → 2 → 3 → 4
-- ============================================================

-- assets (filtered by status and property_type in dashboard)
CREATE INDEX IF NOT EXISTS idx_assets_status        ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_property_type ON assets(property_type);

-- renovation_projects
CREATE INDEX IF NOT EXISTS idx_renovation_projects_asset_id     ON renovation_projects(asset_id);
CREATE INDEX IF NOT EXISTS idx_renovation_projects_status       ON renovation_projects(status);
CREATE INDEX IF NOT EXISTS idx_renovation_projects_project_type ON renovation_projects(project_type);

-- expenses
CREATE INDEX IF NOT EXISTS idx_expenses_asset_id              ON expenses(asset_id);
CREATE INDEX IF NOT EXISTS idx_expenses_renovation_project_id ON expenses(renovation_project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date                  ON expenses(date);

-- incomes
CREATE INDEX IF NOT EXISTS idx_incomes_asset_id ON incomes(asset_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date     ON incomes(date);

-- asset_images
CREATE INDEX IF NOT EXISTS idx_asset_images_asset_id   ON asset_images(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_images_project_id ON asset_images(renovation_project_id);

-- leads
CREATE INDEX IF NOT EXISTS idx_leads_asset_id ON leads(asset_id);
