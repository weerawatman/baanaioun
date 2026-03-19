# Baanaioun — ระบบจัดการอสังหาริมทรัพย์

ระบบบริหารจัดการอสังหาริมทรัพย์สำหรับนักลงทุนส่วนตัว ครอบคลุมตั้งแต่การบันทึกทรัพย์สิน, การจัดการโครงการปรับปรุง, ติดตามรายได้-รายจ่าย ไปจนถึงหน้าแสดงประกาศอสังหาสาธารณะ

---

## ฟีเจอร์

| ฟีเจอร์ | รายละเอียด |
|---|---|
| **Asset Management** | บันทึก/แก้ไขทรัพย์สิน, ติดตาม status lifecycle (พัฒนา → ขาย/ให้เช่า → ขายแล้ว) |
| **Renovation Projects** | จัดการโครงการปรับปรุงหรือก่อสร้างใหม่ พร้อม budget tracking |
| **Expense Tracking** | บันทึกรายจ่ายแยก category (วัสดุ, แรงงาน, สาธารณูปโภค ฯลฯ) |
| **Income Tracking** | บันทึกรายได้ต่อทรัพย์สิน (ค่าเช่า, กำไรจากการขาย ฯลฯ) |
| **Image Gallery** | อัปโหลดรูปภาพแยก timeline (ก่อน/ระหว่าง/หลังปรับปรุง) |
| **Financial Reports** | รายงานรายได้และรายจ่ายรายปี |
| **Public Listings** | หน้าแสดงทรัพย์สินพร้อมขาย/เช่าสำหรับบุคคลทั่วไป + ฟอร์มส่ง Lead |
| **Authentication** | ระบบ Login/Signup ผ่าน Supabase Auth |

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **Database & Auth**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS 4
- **Maps**: Leaflet + React-Leaflet
- **Testing**: Vitest + @vitest/coverage-v8
- **Package Manager**: npm

---

## สิ่งที่ต้องมีก่อนติดตั้ง

- Node.js 18+
- npm 9+
- Supabase account (สร้างได้ฟรีที่ [supabase.com](https://supabase.com))

---

## ติดตั้งและรัน

### 1. Clone & Install

```bash
git clone <repo-url>
cd baanaioun
npm install
```

### 2. สร้าง Supabase Project

1. สร้าง project ที่ [supabase.com](https://supabase.com)
2. ไปที่ **Project Settings → API** เพื่อดู:
   - **Project URL** (SUPABASE_URL)
   - **anon / public key** (SUPABASE_ANON_KEY)

### 3. ตั้งค่า Environment Variables

```bash
cp .env.example .env.local
```

แก้ไข `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. รัน Database Migrations

ใน **Supabase Dashboard → SQL Editor** รันไฟล์ migration ตามลำดับ:

```
supabase/migrations/001_initial_full_schema.sql
supabase/migrations/002_migrate_assets_column_names.sql
supabase/migrations/003_fix_schema_add_missing_columns.sql
supabase/migrations/004_add_project_type_to_renovations.sql
supabase/migrations/005_extend_expense_categories_construction.sql
supabase/migrations/006_add_complete_project_function.sql
supabase/migrations/007_extend_image_categories_and_project_link.sql
supabase/migrations/008_add_asset_sale_rent_fields_and_leads.sql
supabase/migrations/009_add_public_listing_view_and_rls.sql
supabase/migrations/010_add_location_field_update_views.sql
supabase/migrations/011_add_anon_select_policies.sql
supabase/migrations/012_update_asset_status_values.sql
supabase/migrations/013_add_auth_user_profiles.sql
supabase/migrations/014_add_tenant_fields_to_assets.sql
```

### 5. สร้าง Storage Bucket

ใน **Supabase Dashboard → SQL Editor**:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-images', 'asset-images', true);

CREATE POLICY "Anyone can view asset images" ON storage.objects
  FOR SELECT USING (bucket_id = 'asset-images');

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'asset-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete own images" ON storage.objects
  FOR DELETE USING (bucket_id = 'asset-images' AND auth.uid() IS NOT NULL);
```

### 6. (แนะนำ) เพิ่ม Performance Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_property_type ON assets(property_type);
CREATE INDEX IF NOT EXISTS idx_renovation_projects_asset_id ON renovation_projects(asset_id);
CREATE INDEX IF NOT EXISTS idx_renovation_projects_status ON renovation_projects(status);
CREATE INDEX IF NOT EXISTS idx_expenses_asset_id ON expenses(asset_id);
CREATE INDEX IF NOT EXISTS idx_expenses_renovation_project_id ON expenses(renovation_project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_incomes_asset_id ON incomes(asset_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
CREATE INDEX IF NOT EXISTS idx_asset_images_asset_id ON asset_images(asset_id);
CREATE INDEX IF NOT EXISTS idx_leads_asset_id ON leads(asset_id);
```

### 7. รัน Development Server

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

---

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ผลลัพธ์ |
|---|---|
| `npm run dev` | รัน development server |
| `npm run build` | Build สำหรับ production |
| `npm run lint` | ตรวจสอบ code ด้วย ESLint |
| `npm run format` | จัดรูปแบบ code ด้วย Prettier |
| `npm test` | รัน unit tests ครั้งเดียว |
| `npm run test:watch` | รัน tests แบบ watch mode |
| `npm run test:coverage` | รัน tests พร้อมรายงาน coverage |

---

## โครงสร้าง Project

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # หน้าที่ต้อง Login
│   │   ├── page.tsx        # Dashboard home
│   │   ├── assets/         # จัดการทรัพย์สิน
│   │   ├── renovations/    # โครงการปรับปรุง
│   │   └── reports/        # รายงานการเงิน
│   └── (public)/           # หน้าสาธารณะ (ไม่ต้อง Login)
│       └── listings/       # ประกาศอสังหาฯ
│
├── features/               # Feature-based modules
│   ├── assets/             # services/ + hooks/ + components/
│   ├── renovations/        # services/ + hooks/ + components/
│   ├── expenses/           # services/ + hooks/ + components/
│   └── income/             # services/ + hooks/ + components/
│
├── shared/
│   ├── components/ui/      # Button, Card, Modal, Input, ...
│   ├── hooks/              # useAuth, useModal, useDebounce, ...
│   └── utils/              # constants, format, validation, ...
│
├── types/                  # TypeScript type definitions
├── config/env.ts           # Centralized environment variables
└── lib/                    # Supabase client setup
```

ดูรายละเอียดสถาปัตยกรรมและ pattern การเขียน code ได้ที่ [PROMPT.md](./PROMPT.md)

---

## การ Deploy

### Deploy บน Vercel (แนะนำ)

1. Push code ไปที่ GitHub
2. Import project ที่ [vercel.com](https://vercel.com)
3. เพิ่ม Environment Variables ใน Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Deploy บน Self-hosted

```bash
npm run build
npm start
```

---

## License

Private project — สงวนลิขสิทธิ์
