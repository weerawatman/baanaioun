-- ============================================================
-- TEST DATA FOR PUBLIC LISTING PORTAL
-- Run this in Supabase SQL Editor to create sample listings
-- ============================================================

-- First, let's check if you have any available assets
SELECT 
  id, 
  name, 
  status, 
  selling_price, 
  rental_price 
FROM assets 
WHERE status = 'available';

-- ============================================================
-- OPTION 1: Update existing asset to make it public
-- ============================================================
-- Replace 'your-asset-id' with an actual asset ID from your database

UPDATE assets 
SET 
  status = 'available',
  selling_price = 3500000,  -- 3.5M THB
  rental_price = 15000,     -- 15K THB/month
  description = 'บ้านเดี่ยว 2 ชั้น พื้นที่ใช้สอย 150 ตร.ม. 
3 ห้องนอน 2 ห้องน้ำ 
ตกแต่งพร้อมอยู่ 
ใกล้ห้างสรรพสินค้า โรงเรียน โรงพยาบาล
เหมาะสำหรับครอบครัว',
  location_lat_long = '13.7563,100.5018'  -- Bangkok coordinates (example)
WHERE id = 'your-asset-id';

-- ============================================================
-- OPTION 2: Create a new test asset
-- ============================================================

INSERT INTO assets (
  title_deed_number,
  name,
  address,
  property_type,
  purchase_price,
  purchase_date,
  status,
  selling_price,
  rental_price,
  description,
  location_lat_long
) VALUES 
(
  'TEST-001',
  'บ้านเดี่ยว 2 ชั้น ใกล้ BTS',
  '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
  'house',
  3000000,
  '2024-01-15',
  'available',
  3500000,
  15000,
  'บ้านเดี่ยว 2 ชั้น สภาพดี พร้อมอยู่
- พื้นที่ใช้สอย 150 ตร.ม.
- 3 ห้องนอน 2 ห้องน้ำ
- จอดรถได้ 2 คัน
- ใกล้ BTS เพียง 500 เมตร
- ใกล้ห้างสรรพสินค้า โรงเรียน โรงพยาบาล
- เหมาะสำหรับครอบครัว',
  '13.7563,100.5018'
),
(
  'TEST-002',
  'คอนโดมิเนียม วิวสวย ชั้น 25',
  '456 ถนนพระราม 4 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
  'condo',
  2500000,
  '2024-02-01',
  'available',
  2800000,
  12000,
  'คอนโดมิเนียม 1 ห้องนอน วิวสวย
- ชั้น 25 วิวเมือง
- พื้นที่ 35 ตร.ม.
- ตกแต่งครบ พร้อมเฟอร์นิเจอร์
- สระว่ายน้ำ ฟิตเนส
- รักษาความปลอดภัย 24 ชม.
- ใกล้ MRT',
  '13.7308,100.5418'
),
(
  'TEST-003',
  'ที่ดินเปล่า 2 ไร่ ติดถนนใหญ่',
  '789 ถนนพหลโยธิน อำเภอเมือง จังหวัดปทุมธานี 12000',
  'land',
  8000000,
  '2024-03-01',
  'available',
  10000000,
  NULL,
  'ที่ดินเปล่า เหมาะสำหรับสร้างบ้าน หรือทำธุรกิจ
- พื้นที่ 2 ไร่ (800 ตร.ว.)
- ติดถนนใหญ่ หน้ากว้าง 40 เมตร
- ไฟฟ้า น้ำประปา พร้อม
- ใกล้ตลาด โรงเรียน
- เหมาะสำหรับสร้างบ้าน หรือทำธุรกิจ',
  '14.0208,100.5250'
);

-- ============================================================
-- Add sample images for the test assets
-- ============================================================
-- Note: Replace URLs with actual image URLs from your storage

-- For the first test asset (get the ID first)
WITH new_asset AS (
  SELECT id FROM assets WHERE title_deed_number = 'TEST-001' LIMIT 1
)
INSERT INTO asset_images (asset_id, url, caption, is_primary, category)
SELECT 
  id,
  'https://placehold.co/800x600/c75d24/white?text=House+Front',
  'ด้านหน้าบ้าน',
  true,
  'purchase'
FROM new_asset
UNION ALL
SELECT 
  id,
  'https://placehold.co/800x600/5c8a4e/white?text=Living+Room',
  'ห้องนั่งเล่น',
  false,
  'after_renovation'
FROM new_asset
UNION ALL
SELECT 
  id,
  'https://placehold.co/800x600/c49a1a/white?text=Bedroom',
  'ห้องนอนใหญ่',
  false,
  'after_renovation'
FROM new_asset;

-- For the second test asset (condo)
WITH new_asset AS (
  SELECT id FROM assets WHERE title_deed_number = 'TEST-002' LIMIT 1
)
INSERT INTO asset_images (asset_id, url, caption, is_primary, category)
SELECT 
  id,
  'https://placehold.co/800x600/c75d24/white?text=Condo+View',
  'วิวจากห้อง',
  true,
  'purchase'
FROM new_asset
UNION ALL
SELECT 
  id,
  'https://placehold.co/800x600/5c8a4e/white?text=Bedroom',
  'ห้องนอน',
  false,
  'after_renovation'
FROM new_asset;

-- For the third test asset (land)
WITH new_asset AS (
  SELECT id FROM assets WHERE title_deed_number = 'TEST-003' LIMIT 1
)
INSERT INTO asset_images (asset_id, url, caption, is_primary, category)
SELECT 
  id,
  'https://placehold.co/800x600/c75d24/white?text=Land+Plot',
  'ที่ดินเปล่า',
  true,
  'purchase'
FROM new_asset;

-- ============================================================
-- VERIFY: Check what will appear on the public listing
-- ============================================================

-- This is what anonymous users will see
SELECT * FROM public_assets;

-- Check images
SELECT 
  pa.name,
  pai.url,
  pai.caption,
  pai.is_primary
FROM public_assets pa
LEFT JOIN public_asset_images pai ON pa.id = pai.asset_id
ORDER BY pa.name, pai.is_primary DESC;

-- ============================================================
-- CLEANUP (if needed)
-- ============================================================
-- To remove test data:

-- DELETE FROM assets WHERE title_deed_number LIKE 'TEST-%';

-- ============================================================
-- NOTES
-- ============================================================
-- 1. Replace placeholder image URLs with real images from your storage
-- 2. Update coordinates (location_lat_long) to actual property locations
-- 3. Adjust prices to realistic values for your market
-- 4. Customize descriptions in Thai to match your properties
-- ============================================================
