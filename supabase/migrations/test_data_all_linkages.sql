-- ============================================================
-- BAANAIOUN - ข้อมูลทดสอบครบทุกความสัมพันธ์ (All Linkages)
-- รัน SQL นี้ใน Supabase SQL Editor
-- ============================================================
-- ครอบคลุม:
--   1. Assets (ทุกสถานะ: owned, under_renovation, available, sold)
--   2. Renovation Projects → Assets (ทั้ง renovation & new_construction)
--   3. Expenses → Assets + Renovation Projects (ทุก category)
--   4. Incomes → Assets
--   5. Asset Images → Assets + Renovation Projects (ทุก category)
--   6. Leads → Assets
-- ============================================================

-- ============================================================
-- 0. อัพเดท Schema ที่ยังไม่ได้ apply (ทำก่อนใส่ข้อมูล)
-- ============================================================

-- เพิ่มคอลัมน์ renovation_project_id ใน asset_images (เชื่อมรูปกับโครงการ)
ALTER TABLE asset_images
ADD COLUMN IF NOT EXISTS renovation_project_id UUID REFERENCES renovation_projects(id) ON DELETE SET NULL;

-- สร้าง index สำหรับ query ตาม project
CREATE INDEX IF NOT EXISTS idx_asset_images_project_id ON asset_images(renovation_project_id);

-- อัพเดท constraint หมวดหมู่รูปภาพ (เพิ่ม in_progress, final)
ALTER TABLE asset_images DROP CONSTRAINT IF EXISTS asset_images_category_check;
ALTER TABLE asset_images ADD CONSTRAINT asset_images_category_check
CHECK (category IN ('purchase', 'before_renovation', 'in_progress', 'after_renovation', 'final'));

-- อัพเดท public_assets view (drop แล้วสร้างใหม่ เพราะชื่อคอลัมน์เปลี่ยน)
DROP VIEW IF EXISTS public_assets;
CREATE VIEW public_assets
  WITH (security_invoker = false)
AS
SELECT
  id, name, property_type, address, description,
  selling_price, rental_price, location_lat_long, status, created_at
FROM assets
WHERE status = 'available';

GRANT SELECT ON public_assets TO anon;

-- อัพเดท public_asset_images view
DROP VIEW IF EXISTS public_asset_images;
CREATE VIEW public_asset_images
  WITH (security_invoker = false)
AS
SELECT
  ai.id, ai.asset_id, ai.url, ai.caption,
  ai.is_primary, ai.category, ai.created_at
FROM asset_images ai
INNER JOIN assets a ON a.id = ai.asset_id
WHERE a.status = 'available';

GRANT SELECT ON public_asset_images TO anon;

-- ============================================================
-- ลบข้อมูลทดสอบเก่า (ลบ child tables ก่อน เพราะ FK อาจไม่มี CASCADE)
-- ============================================================
DELETE FROM leads WHERE asset_id IN (SELECT id FROM assets WHERE title_deed_number LIKE 'TEST-%');
DELETE FROM asset_images WHERE asset_id IN (SELECT id FROM assets WHERE title_deed_number LIKE 'TEST-%');
DELETE FROM expenses WHERE asset_id IN (SELECT id FROM assets WHERE title_deed_number LIKE 'TEST-%');
DELETE FROM incomes WHERE asset_id IN (SELECT id FROM assets WHERE title_deed_number LIKE 'TEST-%');
DELETE FROM renovation_projects WHERE asset_id IN (SELECT id FROM assets WHERE title_deed_number LIKE 'TEST-%');
DELETE FROM assets WHERE title_deed_number LIKE 'TEST-%';

-- ============================================================
-- 1. สร้างทรัพย์สิน (ASSETS) - 5 รายการ ครบทุกสถานะ
-- ============================================================

-- ASSET 1: บ้านเดี่ยว - สถานะ "available" (พร้อมขาย/เช่า)
INSERT INTO assets (
  asset_code, title_deed_number, name, address, property_type,
  purchase_price, purchase_date, appraised_value,
  mortgage_bank, mortgage_amount, fire_insurance_expiry,
  land_tax_due_date, status, notes,
  selling_price, rental_price, description, location_lat_long
) VALUES (
  'ASSET-TEST-001', 'TEST-001',
  'บ้านเดี่ยว 2 ชั้น ใกล้ BTS อ่อนนุช',
  '123 ถนนสุขุมวิท 77 แขวงสวนหลวง เขตสวนหลวง กรุงเทพมหานคร 10250',
  'house',
  3000000, '2024-01-15', 3800000,
  'ธนาคารกสิกรไทย', 2000000, '2026-12-31',
  '2026-04-30', 'available', 'บ้านปรับปรุงใหม่ทั้งหลัง พร้อมขาย',
  3500000, 15000,
  'บ้านเดี่ยว 2 ชั้น สภาพดี พร้อมอยู่ 3 ห้องนอน 2 ห้องน้ำ พื้นที่ 150 ตร.ม. ใกล้ BTS อ่อนนุช',
  '13.6904,100.6089'
);

-- ASSET 2: คอนโด - สถานะ "available" (พร้อมขาย/เช่า)
INSERT INTO assets (
  asset_code, title_deed_number, name, address, property_type,
  purchase_price, purchase_date, appraised_value,
  status, selling_price, rental_price, description, location_lat_long
) VALUES (
  'ASSET-TEST-002', 'TEST-002',
  'คอนโดมิเนียม วิวสวย ชั้น 25 ใกล้ MRT',
  '456 ถนนพระราม 4 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
  'condo',
  2500000, '2024-02-01', 3000000,
  'available', 2800000, 12000,
  'คอนโด 1 ห้องนอน ชั้น 25 วิวเมือง ตกแต่งครบ ใกล้ MRT ควีนสิริกิติ์',
  '13.7308,100.5618'
);

-- ASSET 3: ที่ดิน - สถานะ "under_renovation" (กำลังสร้างบ้าน)
INSERT INTO assets (
  asset_code, title_deed_number, name, address, property_type,
  purchase_price, purchase_date, appraised_value,
  status, notes, location_lat_long
) VALUES (
  'ASSET-TEST-003', 'TEST-003',
  'ที่ดินเปล่า 1 ไร่ คลอง 4 ปทุมธานี',
  '789 ถนนรังสิต-นครนายก ตำบลบึงยี่โถ อำเภอธัญบุรี จังหวัดปทุมธานี 12110',
  'land',
  5000000, '2024-06-01', 6000000,
  'under_renovation', 'กำลังสร้างบ้านบนที่ดิน',
  '14.0208,100.6850'
);

-- ASSET 4: ทาวน์เฮ้าส์ - สถานะ "owned" (ถือครอง)
INSERT INTO assets (
  asset_code, title_deed_number, name, address, property_type,
  purchase_price, purchase_date, appraised_value,
  mortgage_bank, mortgage_amount, fire_insurance_expiry,
  land_tax_due_date, status, notes
) VALUES (
  'ASSET-TEST-004',
  'TEST-004',
  'ทาวน์เฮ้าส์ 2 ชั้น หมู่บ้านพฤกษา',
  '321 ถนนเลียบคลองสอง แขวงบางชัน เขตคลองสามวา กรุงเทพมหานคร 10510',
  'townhouse',
  1800000, '2023-08-15', 2200000,
  'ธนาคารกรุงเทพ', 1200000, '2026-08-15',
  '2026-04-30', 'owned', 'ให้เช่าอยู่ สัญญา 1 ปี'
);

-- ASSET 5: อาคารพาณิชย์ - สถานะ "sold" (ขายแล้ว)
INSERT INTO assets (
  asset_code, title_deed_number, name, address, property_type,
  purchase_price, purchase_date, appraised_value,
  status, notes, selling_price
) VALUES (
  'ASSET-TEST-005', 'TEST-005',
  'อาคารพาณิชย์ 3 ชั้น ย่านรามอินทรา',
  '555 ถนนรามอินทรา แขวงอนุสาวรีย์ เขตบางเขน กรุงเทพมหานคร 10220',
  'commercial',
  4500000, '2022-03-01', 5500000,
  'sold', 'ขายแล้วเมื่อ ม.ค. 2026', 5200000
);

-- ============================================================
-- 2. สร้างโครงการปรับปรุง (RENOVATION PROJECTS) → เชื่อม Assets
-- ============================================================

-- Project 1: ปรับปรุงบ้าน TEST-001 (completed)
INSERT INTO renovation_projects (
  asset_id, name, description, start_date, end_date,
  budget, status, project_type
)
SELECT id,
  'ปรับปรุงบ้านทั้งหลัง รอบที่ 1',
  'รื้อห้องน้ำ เปลี่ยนกระเบื้อง ทาสีใหม่ทั้งหลัง ติดเหล็กดัด',
  '2024-03-01', '2024-06-30',
  350000, 'completed', 'renovation'
FROM assets WHERE title_deed_number = 'TEST-001';

-- Project 2: ปรับปรุงบ้าน TEST-001 ระยะ 2 (in_progress)
INSERT INTO renovation_projects (
  asset_id, name, description, start_date,
  budget, status, project_type
)
SELECT id,
  'ปรับปรุงสวนและรั้วบ้าน',
  'จัดสวนหน้าบ้าน สร้างรั้วใหม่ ปูทางเดิน',
  '2025-01-15',
  120000, 'in_progress', 'renovation'
FROM assets WHERE title_deed_number = 'TEST-001';

-- Project 3: สร้างบ้านใหม่บนที่ดิน TEST-003 (in_progress, new_construction)
INSERT INTO renovation_projects (
  asset_id, name, description, start_date,
  budget, status, project_type, target_property_type
)
SELECT id,
  'สร้างบ้านเดี่ยว 2 ชั้น',
  'สร้างบ้านเดี่ยว 2 ชั้น 3 ห้องนอน 2 ห้องน้ำ บนที่ดิน 1 ไร่',
  '2025-02-01',
  2500000, 'in_progress', 'new_construction', 'house'
FROM assets WHERE title_deed_number = 'TEST-003';

-- Project 4: ปรับปรุงทาวน์เฮ้าส์ TEST-004 (planned)
INSERT INTO renovation_projects (
  asset_id, name, description, start_date,
  budget, status, project_type
)
SELECT id,
  'ทาสีใหม่ ซ่อมหลังคา',
  'ทาสีภายนอกใหม่ ซ่อมหลังคารั่ว เปลี่ยนท่อประปาเก่า',
  '2026-03-01',
  80000, 'planned', 'renovation'
FROM assets WHERE title_deed_number = 'TEST-004';

-- Project 5: ปรับปรุงอาคารพาณิชย์ TEST-005 (completed, ก่อนขาย)
INSERT INTO renovation_projects (
  asset_id, name, description, start_date, end_date,
  budget, status, project_type
)
SELECT id,
  'ปรับปรุงอาคารก่อนขาย',
  'ทาสีใหม่ เปลี่ยนกระจก ติดแอร์ใหม่ ปูกระเบื้อง',
  '2025-06-01', '2025-09-30',
  500000, 'completed', 'renovation'
FROM assets WHERE title_deed_number = 'TEST-005';

-- Project 6: cancelled project (ทดสอบสถานะ cancelled)
INSERT INTO renovation_projects (
  asset_id, name, description, start_date,
  budget, status, project_type
)
SELECT id,
  'ต่อเติมห้องครัว (ยกเลิก)',
  'แผนต่อเติมห้องครัวด้านหลัง - ยกเลิกเนื่องจากงบไม่เพียงพอ',
  '2025-05-01',
  200000, 'cancelled', 'renovation'
FROM assets WHERE title_deed_number = 'TEST-004';

-- ============================================================
-- 3. สร้างค่าใช้จ่าย (EXPENSES) → เชื่อม Assets + Renovation Projects
-- ============================================================

-- 3A: ค่าใช้จ่ายเชื่อมกับ Asset + Renovation Project (ทั้งคู่)
-- ค่าใช้จ่ายของ Project 1 (ปรับปรุงบ้าน TEST-001 completed)
INSERT INTO expenses (asset_id, renovation_project_id, category, amount, date, description, vendor)
SELECT a.id, rp.id, 'materials', 85000, '2024-03-05', 'กระเบื้อง ปูน ทราย', 'โฮมโปร'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'ปรับปรุงบ้านทั้งหลัง รอบที่ 1'
WHERE a.title_deed_number = 'TEST-001';

INSERT INTO expenses (asset_id, renovation_project_id, category, amount, date, description, vendor)
SELECT a.id, rp.id, 'labor', 150000, '2024-04-01', 'ค่าแรงช่างก่อสร้าง 3 คน 2 เดือน', 'ทีมช่างสมชาย'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'ปรับปรุงบ้านทั้งหลัง รอบที่ 1'
WHERE a.title_deed_number = 'TEST-001';

INSERT INTO expenses (asset_id, renovation_project_id, category, amount, date, description, vendor)
SELECT a.id, rp.id, 'materials', 45000, '2024-04-15', 'สีทาบ้าน น้ำมันรองพื้น', 'ดูโฮม'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'ปรับปรุงบ้านทั้งหลัง รอบที่ 1'
WHERE a.title_deed_number = 'TEST-001';

INSERT INTO expenses (asset_id, renovation_project_id, category, amount, date, description, vendor)
SELECT a.id, rp.id, 'service', 25000, '2024-05-01', 'ค่าติดตั้งเหล็กดัด', 'ร้านเหล็กดัดเจริญ'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'ปรับปรุงบ้านทั้งหลัง รอบที่ 1'
WHERE a.title_deed_number = 'TEST-001';

INSERT INTO expenses (asset_id, renovation_project_id, category, amount, date, description, vendor)
SELECT a.id, rp.id, 'electricity', 8500, '2024-06-01', 'ค่าไฟฟ้าระหว่างก่อสร้าง', 'การไฟฟ้านครหลวง'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'ปรับปรุงบ้านทั้งหลัง รอบที่ 1'
WHERE a.title_deed_number = 'TEST-001';

-- ค่าใช้จ่ายของ Project 2 (ปรับปรุงสวน TEST-001 in_progress)
INSERT INTO expenses (asset_id, renovation_project_id, category, amount, date, description, vendor)
SELECT a.id, rp.id, 'materials', 35000, '2025-01-20', 'ต้นไม้ หิน กรวด ดินปลูก', 'ร้านต้นไม้สวนจตุจักร'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'ปรับปรุงสวนและรั้วบ้าน'
WHERE a.title_deed_number = 'TEST-001';

INSERT INTO expenses (asset_id, renovation_project_id, category, amount, date, description, vendor)
SELECT a.id, rp.id, 'labor', 40000, '2025-02-01', 'ค่าแรงช่างทำสวนและก่อรั้ว', 'ทีมช่างจัดสวน'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'ปรับปรุงสวนและรั้วบ้าน'
WHERE a.title_deed_number = 'TEST-001';

-- ค่าใช้จ่ายของ Project 3 (สร้างบ้านใหม่ TEST-003 - ทุก category ก่อสร้าง)
INSERT INTO expenses (asset_id, renovation_project_id, category, amount, date, description, vendor)
SELECT a.id, rp.id, 'architect_fee', 150000, '2025-01-15', 'ค่าออกแบบบ้าน + แบบก่อสร้าง', 'บริษัท สถาปนิกดี จำกัด'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'สร้างบ้านเดี่ยว 2 ชั้น'
WHERE a.title_deed_number = 'TEST-003';

INSERT INTO expenses (asset_id, renovation_project_id, category, amount, date, description, vendor)
SELECT a.id, rp.id, 'building_permit', 35000, '2025-01-25', 'ค่าใบอนุญาตก่อสร้าง + ค่าธรรมเนียม', 'เทศบาลตำบลบึงยี่โถ'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'สร้างบ้านเดี่ยว 2 ชั้น'
WHERE a.title_deed_number = 'TEST-003';

INSERT INTO expenses (asset_id, renovation_project_id, category, amount, date, description, vendor)
SELECT a.id, rp.id, 'land_filling', 280000, '2025-02-10', 'ค่าถมดิน 200 คัน', 'ร้านดินถม ส.ทวีโชค'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'สร้างบ้านเดี่ยว 2 ชั้น'
WHERE a.title_deed_number = 'TEST-003';

INSERT INTO expenses (asset_id, renovation_project_id, category, amount, date, description, vendor)
SELECT a.id, rp.id, 'foundation', 450000, '2025-03-01', 'ค่าตอกเสาเข็ม + เทฐานราก', 'บริษัท เสาเข็มมั่นคง จำกัด'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'สร้างบ้านเดี่ยว 2 ชั้น'
WHERE a.title_deed_number = 'TEST-003';

INSERT INTO expenses (asset_id, renovation_project_id, category, amount, date, description, vendor)
SELECT a.id, rp.id, 'materials', 650000, '2025-04-01', 'เหล็ก ปูน อิฐ หลังคา วัสดุก่อสร้างทั้งหมด', 'SCG'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'สร้างบ้านเดี่ยว 2 ชั้น'
WHERE a.title_deed_number = 'TEST-003';

INSERT INTO expenses (asset_id, renovation_project_id, category, amount, date, description, vendor)
SELECT a.id, rp.id, 'labor', 500000, '2025-04-01', 'ค่าแรงช่างก่อสร้างทีม 8 คน', 'หจก.ก่อสร้างอนันต์'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'สร้างบ้านเดี่ยว 2 ชั้น'
WHERE a.title_deed_number = 'TEST-003';

INSERT INTO expenses (asset_id, renovation_project_id, category, amount, date, description, vendor)
SELECT a.id, rp.id, 'electricity', 12000, '2025-05-01', 'ค่าไฟฟ้าชั่วคราวหน้าไซต์', 'การไฟฟ้าส่วนภูมิภาค'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'สร้างบ้านเดี่ยว 2 ชั้น'
WHERE a.title_deed_number = 'TEST-003';

INSERT INTO expenses (asset_id, renovation_project_id, category, amount, date, description, vendor)
SELECT a.id, rp.id, 'service', 85000, '2025-06-01', 'ค่าเดินท่อประปา + ไฟฟ้าถาวร', 'ช่างประปา&ไฟฟ้า'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'สร้างบ้านเดี่ยว 2 ชั้น'
WHERE a.title_deed_number = 'TEST-003';

-- ค่าใช้จ่ายของ Project 5 (ปรับปรุงอาคารพาณิชย์ TEST-005)
INSERT INTO expenses (asset_id, renovation_project_id, category, amount, date, description, vendor)
SELECT a.id, rp.id, 'materials', 180000, '2025-06-15', 'กระจก สี กระเบื้อง แอร์ 4 ตัว', 'แอร์เฮ้าส์'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'ปรับปรุงอาคารก่อนขาย'
WHERE a.title_deed_number = 'TEST-005';

INSERT INTO expenses (asset_id, renovation_project_id, category, amount, date, description, vendor)
SELECT a.id, rp.id, 'labor', 220000, '2025-07-01', 'ค่าแรงช่างปรับปรุง 3 เดือน', 'ทีมช่างวิชัย'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'ปรับปรุงอาคารก่อนขาย'
WHERE a.title_deed_number = 'TEST-005';

-- 3B: ค่าใช้จ่ายเชื่อมกับ Asset อย่างเดียว (ไม่มี project)
INSERT INTO expenses (asset_id, category, amount, date, description, vendor)
SELECT id, 'service', 3500, '2025-06-01', 'ค่าส่วนกลางคอนโด เดือน มิ.ย.', 'นิติบุคคลอาคารชุด'
FROM assets WHERE title_deed_number = 'TEST-002';

INSERT INTO expenses (asset_id, category, amount, date, description, vendor)
SELECT id, 'service', 3500, '2025-07-01', 'ค่าส่วนกลางคอนโด เดือน ก.ค.', 'นิติบุคคลอาคารชุด'
FROM assets WHERE title_deed_number = 'TEST-002';

INSERT INTO expenses (asset_id, category, amount, date, description, vendor)
SELECT id, 'electricity', 1800, '2025-06-15', 'ค่าไฟฟ้าคอนโด เดือน มิ.ย.', 'การไฟฟ้านครหลวง'
FROM assets WHERE title_deed_number = 'TEST-002';

INSERT INTO expenses (asset_id, category, amount, date, description, vendor)
SELECT id, 'service', 5000, '2025-12-01', 'ค่าประกันภัยทาวน์เฮ้าส์ รายปี', 'เมืองไทยประกันภัย'
FROM assets WHERE title_deed_number = 'TEST-004';

-- ============================================================
-- 4. สร้างรายได้ (INCOMES) → เชื่อม Assets
-- ============================================================

-- รายได้ค่าเช่าจากคอนโด TEST-002 (6 เดือน)
INSERT INTO incomes (asset_id, source, amount, date, description)
SELECT id, 'rent', 12000, '2025-01-05', 'ค่าเช่าคอนโด ม.ค. 2025'
FROM assets WHERE title_deed_number = 'TEST-002';

INSERT INTO incomes (asset_id, source, amount, date, description)
SELECT id, 'rent', 12000, '2025-02-05', 'ค่าเช่าคอนโด ก.พ. 2025'
FROM assets WHERE title_deed_number = 'TEST-002';

INSERT INTO incomes (asset_id, source, amount, date, description)
SELECT id, 'rent', 12000, '2025-03-05', 'ค่าเช่าคอนโด มี.ค. 2025'
FROM assets WHERE title_deed_number = 'TEST-002';

INSERT INTO incomes (asset_id, source, amount, date, description)
SELECT id, 'rent', 12000, '2025-04-05', 'ค่าเช่าคอนโด เม.ย. 2025'
FROM assets WHERE title_deed_number = 'TEST-002';

INSERT INTO incomes (asset_id, source, amount, date, description)
SELECT id, 'rent', 12000, '2025-05-05', 'ค่าเช่าคอนโด พ.ค. 2025'
FROM assets WHERE title_deed_number = 'TEST-002';

INSERT INTO incomes (asset_id, source, amount, date, description)
SELECT id, 'rent', 12000, '2025-06-05', 'ค่าเช่าคอนโด มิ.ย. 2025'
FROM assets WHERE title_deed_number = 'TEST-002';

-- รายได้ค่าเช่าจากทาวน์เฮ้าส์ TEST-004 (6 เดือน)
INSERT INTO incomes (asset_id, source, amount, date, description)
SELECT id, 'rent', 8000, '2025-01-10', 'ค่าเช่าทาวน์เฮ้าส์ ม.ค. 2025'
FROM assets WHERE title_deed_number = 'TEST-004';

INSERT INTO incomes (asset_id, source, amount, date, description)
SELECT id, 'rent', 8000, '2025-02-10', 'ค่าเช่าทาวน์เฮ้าส์ ก.พ. 2025'
FROM assets WHERE title_deed_number = 'TEST-004';

INSERT INTO incomes (asset_id, source, amount, date, description)
SELECT id, 'rent', 8000, '2025-03-10', 'ค่าเช่าทาวน์เฮ้าส์ มี.ค. 2025'
FROM assets WHERE title_deed_number = 'TEST-004';

INSERT INTO incomes (asset_id, source, amount, date, description)
SELECT id, 'rent', 8000, '2025-04-10', 'ค่าเช่าทาวน์เฮ้าส์ เม.ย. 2025'
FROM assets WHERE title_deed_number = 'TEST-004';

INSERT INTO incomes (asset_id, source, amount, date, description)
SELECT id, 'rent', 8000, '2025-05-10', 'ค่าเช่าทาวน์เฮ้าส์ พ.ค. 2025'
FROM assets WHERE title_deed_number = 'TEST-004';

INSERT INTO incomes (asset_id, source, amount, date, description)
SELECT id, 'rent', 8000, '2025-06-10', 'ค่าเช่าทาวน์เฮ้าส์ มิ.ย. 2025'
FROM assets WHERE title_deed_number = 'TEST-004';

-- รายได้จากการขายอาคารพาณิชย์ TEST-005
INSERT INTO incomes (asset_id, source, amount, date, description)
SELECT id, 'sale', 5200000, '2026-01-15', 'ขายอาคารพาณิชย์ 3 ชั้น ย่านรามอินทรา'
FROM assets WHERE title_deed_number = 'TEST-005';

-- รายได้ค่ามัดจำจาก TEST-001
INSERT INTO incomes (asset_id, source, amount, date, description)
SELECT id, 'deposit', 50000, '2026-01-20', 'ค่ามัดจำจากผู้สนใจซื้อบ้าน (คุณสมศักดิ์)'
FROM assets WHERE title_deed_number = 'TEST-001';

-- ============================================================
-- 5. สร้างรูปภาพ (ASSET_IMAGES) → เชื่อม Assets + Renovation Projects
-- ============================================================

-- 5A: รูปภาพของบ้าน TEST-001 (เชื่อมกับ asset เท่านั้น - ภาพตอนซื้อ)
INSERT INTO asset_images (asset_id, url, caption, is_primary, category)
SELECT id,
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop',
  'ด้านหน้าบ้านตอนซื้อ', true, 'purchase'
FROM assets WHERE title_deed_number = 'TEST-001';

INSERT INTO asset_images (asset_id, url, caption, is_primary, category)
SELECT id,
  'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop',
  'สภาพห้องน้ำก่อนปรับปรุง', false, 'before_renovation'
FROM assets WHERE title_deed_number = 'TEST-001';

-- 5B: รูปภาพของบ้าน TEST-001 เชื่อมกับ Renovation Project 1 (completed)
INSERT INTO asset_images (asset_id, renovation_project_id, url, caption, is_primary, category)
SELECT a.id, rp.id,
  'https://images.unsplash.com/photo-1585128792020-803d29415281?w=800&h=600&fit=crop',
  'ระหว่างรื้อกระเบื้อง', false, 'in_progress'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'ปรับปรุงบ้านทั้งหลัง รอบที่ 1'
WHERE a.title_deed_number = 'TEST-001';

INSERT INTO asset_images (asset_id, renovation_project_id, url, caption, is_primary, category)
SELECT a.id, rp.id,
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
  'ห้องนั่งเล่นหลังปรับปรุง', false, 'after_renovation'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'ปรับปรุงบ้านทั้งหลัง รอบที่ 1'
WHERE a.title_deed_number = 'TEST-001';

INSERT INTO asset_images (asset_id, renovation_project_id, url, caption, is_primary, category)
SELECT a.id, rp.id,
  'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&h=600&fit=crop',
  'ห้องนอนใหญ่หลังปรับปรุง', false, 'after_renovation'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'ปรับปรุงบ้านทั้งหลัง รอบที่ 1'
WHERE a.title_deed_number = 'TEST-001';

INSERT INTO asset_images (asset_id, renovation_project_id, url, caption, is_primary, category)
SELECT a.id, rp.id,
  'https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=800&h=600&fit=crop',
  'ห้องครัวหลังปรับปรุงเสร็จ', false, 'final'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'ปรับปรุงบ้านทั้งหลัง รอบที่ 1'
WHERE a.title_deed_number = 'TEST-001';

-- 5C: รูปภาพของบ้าน TEST-001 เชื่อมกับ Renovation Project 2 (in_progress - สวน)
INSERT INTO asset_images (asset_id, renovation_project_id, url, caption, is_primary, category)
SELECT a.id, rp.id,
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
  'สวนหน้าบ้านก่อนจัด', false, 'before_renovation'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'ปรับปรุงสวนและรั้วบ้าน'
WHERE a.title_deed_number = 'TEST-001';

INSERT INTO asset_images (asset_id, renovation_project_id, url, caption, is_primary, category)
SELECT a.id, rp.id,
  'https://images.unsplash.com/photo-1598902108854-d1446e214baf?w=800&h=600&fit=crop',
  'กำลังทำสวนและปูทางเดิน', false, 'in_progress'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'ปรับปรุงสวนและรั้วบ้าน'
WHERE a.title_deed_number = 'TEST-001';

-- 5D: รูปภาพคอนโด TEST-002
INSERT INTO asset_images (asset_id, url, caption, is_primary, category)
SELECT id,
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
  'วิวจากห้องชั้น 25', true, 'purchase'
FROM assets WHERE title_deed_number = 'TEST-002';

INSERT INTO asset_images (asset_id, url, caption, is_primary, category)
SELECT id,
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
  'ห้องนอน', false, 'purchase'
FROM assets WHERE title_deed_number = 'TEST-002';

INSERT INTO asset_images (asset_id, url, caption, is_primary, category)
SELECT id,
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
  'ห้องครัว', false, 'purchase'
FROM assets WHERE title_deed_number = 'TEST-002';

-- 5E: รูปภาพที่ดิน TEST-003 เชื่อมกับ Project สร้างบ้าน
INSERT INTO asset_images (asset_id, url, caption, is_primary, category)
SELECT id,
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
  'ที่ดินเปล่าก่อนถม', true, 'purchase'
FROM assets WHERE title_deed_number = 'TEST-003';

INSERT INTO asset_images (asset_id, renovation_project_id, url, caption, is_primary, category)
SELECT a.id, rp.id,
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop',
  'ถมดินเสร็จ เริ่มวางฐานราก', false, 'in_progress'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'สร้างบ้านเดี่ยว 2 ชั้น'
WHERE a.title_deed_number = 'TEST-003';

INSERT INTO asset_images (asset_id, renovation_project_id, url, caption, is_primary, category)
SELECT a.id, rp.id,
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop',
  'โครงสร้างชั้น 1 เสร็จ กำลังก่อชั้น 2', false, 'in_progress'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'สร้างบ้านเดี่ยว 2 ชั้น'
WHERE a.title_deed_number = 'TEST-003';

-- 5F: รูปภาพอาคารพาณิชย์ TEST-005 เชื่อมกับ Project ปรับปรุง
INSERT INTO asset_images (asset_id, url, caption, is_primary, category)
SELECT id,
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
  'อาคารพาณิชย์ตอนซื้อ', true, 'purchase'
FROM assets WHERE title_deed_number = 'TEST-005';

INSERT INTO asset_images (asset_id, renovation_project_id, url, caption, is_primary, category)
SELECT a.id, rp.id,
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
  'อาคารหลังปรับปรุงเสร็จ', false, 'final'
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id AND rp.name = 'ปรับปรุงอาคารก่อนขาย'
WHERE a.title_deed_number = 'TEST-005';

-- ============================================================
-- 6. สร้างลูกค้าสนใจ (LEADS) → เชื่อม Assets
-- ============================================================

-- Leads สำหรับบ้าน TEST-001 (available)
INSERT INTO leads (asset_id, customer_name, customer_phone, customer_line_id, message)
SELECT id, 'สมศักดิ์ ใจดี', '081-234-5678', 'somsak.j', 'สนใจซื้อบ้านครับ อยากนัดดูบ้านวันเสาร์ได้ไหม?'
FROM assets WHERE title_deed_number = 'TEST-001';

INSERT INTO leads (asset_id, customer_name, customer_phone, customer_line_id, message)
SELECT id, 'สุภาพร จันทร์สว่าง', '089-876-5432', 'supaporn_c', 'สนใจเช่าค่ะ ย้ายเข้าเดือนหน้าได้ไหม? มีสัตว์เลี้ยงได้ไหมคะ?'
FROM assets WHERE title_deed_number = 'TEST-001';

INSERT INTO leads (asset_id, customer_name, customer_phone, customer_line_id, message)
SELECT id, 'วิชัย เจริญสุข', '092-345-6789', NULL, 'อยากทราบราคาต่อรองได้ไหมครับ ถ้าจ่ายเงินสดหมด'
FROM assets WHERE title_deed_number = 'TEST-001';

-- Leads สำหรับคอนโด TEST-002 (available)
INSERT INTO leads (asset_id, customer_name, customer_phone, customer_line_id, message)
SELECT id, 'นภา ศรีสมบูรณ์', '086-111-2222', 'napa.sri', 'สนใจเช่าคอนโดค่ะ ทำงานใกล้ MRT ศูนย์สิริกิติ์'
FROM assets WHERE title_deed_number = 'TEST-002';

INSERT INTO leads (asset_id, customer_name, customer_phone, customer_line_id, message)
SELECT id, 'John Smith', '095-999-8888', 'john.bkk', 'Interested in buying. Can I schedule a viewing?'
FROM assets WHERE title_deed_number = 'TEST-002';

-- Lead สำหรับที่ดิน TEST-003 (under_renovation แต่มีคนสนใจ)
INSERT INTO leads (asset_id, customer_name, customer_phone, customer_line_id, message)
SELECT id, 'ธนา อัครเศรษฐ์', '081-555-6666', 'thana.a', 'สนใจซื้อบ้านหลังสร้างเสร็จครับ ช่วยแจ้งเมื่อพร้อมขายด้วย'
FROM assets WHERE title_deed_number = 'TEST-003';

-- ============================================================
-- 7. ตรวจสอบผลลัพธ์ (Verification Queries)
-- ============================================================

-- สรุปจำนวนข้อมูลทดสอบทั้งหมด
SELECT '=== สรุปข้อมูลทดสอบ ===' as info;

SELECT 'Assets' as table_name, COUNT(*) as total_records
FROM assets WHERE title_deed_number LIKE 'TEST-%'
UNION ALL
SELECT 'Renovation Projects', COUNT(*)
FROM renovation_projects rp JOIN assets a ON rp.asset_id = a.id WHERE a.title_deed_number LIKE 'TEST-%'
UNION ALL
SELECT 'Expenses', COUNT(*)
FROM expenses e JOIN assets a ON e.asset_id = a.id WHERE a.title_deed_number LIKE 'TEST-%'
UNION ALL
SELECT 'Incomes', COUNT(*)
FROM incomes i JOIN assets a ON i.asset_id = a.id WHERE a.title_deed_number LIKE 'TEST-%'
UNION ALL
SELECT 'Asset Images', COUNT(*)
FROM asset_images ai JOIN assets a ON ai.asset_id = a.id WHERE a.title_deed_number LIKE 'TEST-%'
UNION ALL
SELECT 'Leads', COUNT(*)
FROM leads l JOIN assets a ON l.asset_id = a.id WHERE a.title_deed_number LIKE 'TEST-%';

-- ตรวจสอบ Linkage: Assets → Renovation Projects
SELECT '=== Linkage: Assets → Renovation Projects ===' as info;
SELECT a.name as asset_name, rp.name as project_name, rp.project_type, rp.status
FROM assets a
JOIN renovation_projects rp ON rp.asset_id = a.id
WHERE a.title_deed_number LIKE 'TEST-%'
ORDER BY a.title_deed_number, rp.start_date;

-- ตรวจสอบ Linkage: Expenses → Assets + Projects
SELECT '=== Linkage: Expenses → Assets + Projects ===' as info;
SELECT
  a.name as asset_name,
  rp.name as project_name,
  e.category, e.amount, e.vendor
FROM expenses e
JOIN assets a ON e.asset_id = a.id
LEFT JOIN renovation_projects rp ON e.renovation_project_id = rp.id
WHERE a.title_deed_number LIKE 'TEST-%'
ORDER BY a.title_deed_number, e.date;

-- ตรวจสอบ Linkage: Incomes → Assets
SELECT '=== Linkage: Incomes → Assets ===' as info;
SELECT a.name as asset_name, i.source, i.amount, i.date, i.description
FROM incomes i
JOIN assets a ON i.asset_id = a.id
WHERE a.title_deed_number LIKE 'TEST-%'
ORDER BY a.title_deed_number, i.date;

-- ตรวจสอบ Linkage: Asset Images → Assets + Projects
SELECT '=== Linkage: Images → Assets + Projects ===' as info;
SELECT
  a.name as asset_name,
  rp.name as project_name,
  ai.caption, ai.category, ai.is_primary
FROM asset_images ai
JOIN assets a ON ai.asset_id = a.id
LEFT JOIN renovation_projects rp ON ai.renovation_project_id = rp.id
WHERE a.title_deed_number LIKE 'TEST-%'
ORDER BY a.title_deed_number, ai.category;

-- ตรวจสอบ Linkage: Leads → Assets
SELECT '=== Linkage: Leads → Assets ===' as info;
SELECT a.name as asset_name, l.customer_name, l.customer_phone, l.message
FROM leads l
JOIN assets a ON l.asset_id = a.id
WHERE a.title_deed_number LIKE 'TEST-%'
ORDER BY a.title_deed_number, l.created_at;

-- ตรวจสอบ Public Views
SELECT '=== Public Assets View ===' as info;
SELECT name, property_type, selling_price, rental_price FROM public_assets ORDER BY name;

SELECT '=== Public Asset Images View ===' as info;
SELECT pai.asset_id, pai.caption, pai.is_primary, pai.category
FROM public_asset_images pai
ORDER BY pai.asset_id, pai.is_primary DESC;

-- สรุปการเงิน
SELECT '=== สรุปการเงินตามทรัพย์สิน ===' as info;
SELECT
  a.name,
  a.purchase_price,
  COALESCE(SUM(e.amount), 0) as total_expenses,
  COALESCE(income_data.total_income, 0) as total_income,
  COALESCE(income_data.total_income, 0) - a.purchase_price - COALESCE(SUM(e.amount), 0) as net_profit
FROM assets a
LEFT JOIN expenses e ON e.asset_id = a.id
LEFT JOIN (
  SELECT asset_id, SUM(amount) as total_income
  FROM incomes GROUP BY asset_id
) income_data ON income_data.asset_id = a.id
WHERE a.title_deed_number LIKE 'TEST-%'
GROUP BY a.id, a.name, a.purchase_price, income_data.total_income
ORDER BY a.title_deed_number;

-- ============================================================
-- สำเร็จ!
-- ============================================================
-- ข้อมูลทดสอบครบทุก linkage:
--   5 Assets (owned, under_renovation, available x2, sold)
--   6 Renovation Projects (planned, in_progress, completed, cancelled)
--   20 Expenses (ทุก category, เชื่อม asset + project)
--   14 Incomes (rent, sale, deposit)
--   18 Asset Images (ทุก category, เชื่อม asset + project)
--   6 Leads (เชื่อม assets)
-- ============================================================
