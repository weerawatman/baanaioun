-- ============================================================
-- เพิ่ม RLS policies สำหรับ anon users (สำหรับ development)
-- ให้ anon สามารถอ่าน/เขียนข้อมูลในหน้า dashboard ได้
-- TODO: เปลี่ยนเป็น authenticated เมื่อเพิ่มระบบ login แล้ว
-- ============================================================

-- Assets: anon full access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon users on assets') THEN
    CREATE POLICY "Allow all for anon users on assets"
      ON assets FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Renovation Projects: anon full access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon users on renovation_projects') THEN
    CREATE POLICY "Allow all for anon users on renovation_projects"
      ON renovation_projects FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Expenses: anon full access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon users on expenses') THEN
    CREATE POLICY "Allow all for anon users on expenses"
      ON expenses FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Incomes: anon full access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon users on incomes') THEN
    CREATE POLICY "Allow all for anon users on incomes"
      ON incomes FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Asset Images: anon full access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon users on asset_images') THEN
    CREATE POLICY "Allow all for anon users on asset_images"
      ON asset_images FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Leads: anon already has INSERT from previous migration, add SELECT for dashboard
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon users on leads') THEN
    CREATE POLICY "Allow all for anon users on leads"
      ON leads FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- ตรวจสอบ policies ทั้งหมด
-- ============================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
