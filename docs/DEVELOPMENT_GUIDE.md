# Baanaioun — App Build Prompt

สำหรับนักพัฒนาหรือ AI ที่ต้องการสร้าง App ระบบจัดการอสังหาริมทรัพย์ที่เหมือนกับ Baanaioun

---

## ภาพรวมของ App

**Baanaioun** คือระบบจัดการอสังหาริมทรัพย์ (Real Estate Asset Management) สำหรับนักลงทุนส่วนตัว ใช้ภาษา Thai เป็น UI หลัก

### ฟีเจอร์หลัก

1. **Asset Management** — บันทึกและจัดการทรัพย์สิน (ที่ดิน, บ้าน, คอนโด ฯลฯ) พร้อม status lifecycle
2. **Renovation Projects** — ติดตามโครงการปรับปรุง/ก่อสร้าง พร้อม budget tracking
3. **Expense Tracking** — บันทึกค่าใช้จ่ายแยกตาม category (วัสดุ, แรงงาน, บริการ ฯลฯ)
4. **Income Tracking** — บันทึกรายได้จากทรัพย์สิน (ค่าเช่า, กำไรจากการขาย ฯลฯ)
5. **Image Gallery** — อัปโหลดรูปภาพแยกตาม timeline (ก่อน-ระหว่าง-หลังปรับปรุง)
6. **Financial Reports** — รายงานรายได้/รายจ่ายรายปี
7. **Public Listings Portal** — หน้าสาธารณะแสดงอสังหาฯ ที่พร้อมขาย/เช่า พร้อมฟอร์ม Lead
8. **Authentication** — ระบบ Login/Signup ผ่าน Supabase Auth

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 + TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage (image uploads) |
| Maps | Leaflet + React-Leaflet |
| Testing | Vitest + @vitest/coverage-v8 |
| Linting | ESLint 9 + Prettier 3 |
| Package Manager | npm |

---

## Database Schema

### Tables (สร้างตามลำดับนี้)

#### 1. `user_profiles`
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `assets` (ทรัพย์สิน)
```sql
CREATE TYPE property_type AS ENUM (
  'land', 'house', 'semi_detached_house', 'condo', 'townhouse', 'commercial', 'other'
);
CREATE TYPE asset_status AS ENUM (
  'developing', 'ready_for_sale', 'ready_for_rent', 'rented', 'sold'
);

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code TEXT NOT NULL UNIQUE,  -- Auto-generated: 'AST-001', 'AST-002', ...
  title_deed_number TEXT,
  name TEXT NOT NULL,
  address TEXT,
  description TEXT,
  property_type property_type NOT NULL,
  purchase_price NUMERIC,
  selling_price NUMERIC,
  rental_price NUMERIC,
  purchase_date DATE,
  sale_date DATE,
  status asset_status NOT NULL DEFAULT 'developing',
  location_lat NUMERIC,
  location_lng NUMERIC,
  tenant_name TEXT,
  tenant_contact TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `renovation_projects`
```sql
CREATE TYPE renovation_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE project_type AS ENUM ('renovation', 'new_construction');

CREATE TABLE renovation_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  budget NUMERIC,
  status renovation_status NOT NULL DEFAULT 'planned',
  project_type project_type NOT NULL DEFAULT 'renovation',
  target_property_type property_type,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `expenses`
```sql
CREATE TYPE expense_category AS ENUM (
  'materials', 'labor', 'service', 'electricity', 'land_filling',
  'building_permit', 'foundation', 'architect_fee', 'other'
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  renovation_project_id UUID REFERENCES renovation_projects(id) ON DELETE CASCADE,
  category expense_category NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  vendor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
  -- Note: asset_id OR renovation_project_id, both optional
);
```

#### 5. `incomes`
```sql
CREATE TABLE incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. `asset_images`
```sql
CREATE TYPE image_category AS ENUM (
  'purchase', 'before_renovation', 'in_progress', 'after_renovation', 'final'
);

CREATE TABLE asset_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  renovation_project_id UUID REFERENCES renovation_projects(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  category image_category NOT NULL DEFAULT 'purchase',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 7. `leads` (Public contact form submissions)
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line_id TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Database Functions

#### `complete_project()` — Mark renovation complete, update asset status
```sql
CREATE OR REPLACE FUNCTION complete_project(
  p_project_id UUID,
  p_new_asset_status asset_status DEFAULT 'ready_for_sale'
) RETURNS void AS $$
BEGIN
  UPDATE renovation_projects SET status = 'completed', end_date = CURRENT_DATE
  WHERE id = p_project_id;

  UPDATE assets SET status = p_new_asset_status
  WHERE id = (SELECT asset_id FROM renovation_projects WHERE id = p_project_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Asset Code Auto-Generation Trigger
```sql
CREATE OR REPLACE FUNCTION generate_asset_code() RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(asset_code FROM 5) AS INTEGER)), 0) + 1
  INTO next_num FROM assets WHERE asset_code LIKE 'AST-%';
  NEW.asset_code := 'AST-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_asset_code
  BEFORE INSERT ON assets
  FOR EACH ROW WHEN (NEW.asset_code IS NULL)
  EXECUTE FUNCTION generate_asset_code();
```

### Views

#### `public_assets` — For public listings portal
```sql
CREATE VIEW public_assets AS
SELECT id, name, property_type, address, description, selling_price, rental_price, status,
       location_lat, location_lng, created_at
FROM assets
WHERE status IN ('ready_for_sale', 'ready_for_rent');
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Authenticated users: full access to their data
CREATE POLICY "Users manage own assets" ON assets
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Anonymous users: read public_assets, insert leads only
CREATE POLICY "Anon can read public listings" ON assets
  FOR SELECT USING (status IN ('ready_for_sale', 'ready_for_rent'));

CREATE POLICY "Anon can submit leads" ON leads
  FOR INSERT WITH CHECK (true);
```

### Performance Indexes
```sql
-- Run in Supabase Dashboard → SQL Editor
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

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Protected routes (auth required)
│   │   ├── layout.tsx            # Dashboard layout with Sidebar
│   │   ├── page.tsx              # Dashboard home
│   │   ├── assets/page.tsx       # Assets list + CRUD
│   │   ├── assets/[id]/page.tsx  # Asset detail
│   │   ├── renovations/page.tsx  # Renovation projects
│   │   └── reports/page.tsx      # Financial reports
│   ├── (public)/                 # Public routes (no auth)
│   │   └── listings/             # Public property portal
│   │       ├── page.tsx
│   │       ├── [id]/page.tsx
│   │       └── [id]/actions.ts   # Server action: lead submission
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── layout.tsx                # Root layout + AuthContext
│
├── features/                     # Feature-based modules
│   ├── assets/                   # services/ + hooks/ + components/
│   ├── renovations/              # services/ + hooks/ + components/
│   ├── expenses/                 # services/ + hooks/ + components/
│   └── income/                   # services/ + hooks/ + components/
│
├── shared/
│   ├── components/ui/            # Button, Card, Modal, Input, Spinner, StatusBadge, EmptyState
│   ├── components/layout/        # Sidebar
│   ├── components/               # MapPicker, MapPickerDynamic
│   ├── hooks/                    # useAuth, useDebounce, useLocalStorage, useModal
│   └── utils/                    # constants, format, validation, errorHandler, logger, withTimeout
│
├── types/
│   ├── database.ts               # All DB types (Asset, Expense, Income, ...)
│   ├── forms.ts                  # Form input types
│   ├── api.ts                    # ApiResponse<T>, PaginatedResponse<T>
│   └── index.ts                  # Barrel export
│
├── config/
│   └── env.ts                    # Centralized env var access
│
├── contexts/
│   └── AuthContext.tsx           # Auth state provider
│
├── lib/
│   ├── supabase.ts               # Supabase browser client
│   ├── supabase-server.ts        # Supabase server client
│   └── supabase-middleware.ts    # Auth session refresh
│
└── middleware.ts                 # Route protection
```

---

## Architecture Patterns

### 1. Service Singleton Pattern
```typescript
// features/assets/services/assetService.ts
class AssetService {
  private async query<T>(fn: () => PromiseLike<T>): Promise<T> {
    return withTimeout(fn());
  }

  async getAll(filters?: AssetFilters): Promise<Asset[]> { ... }
  async getById(id: string): Promise<Asset | null> { ... }
  async create(data: CreateAssetInput): Promise<Asset> { ... }
  async update(id: string, data: Partial<CreateAssetInput>): Promise<Asset> { ... }
  async delete(id: string): Promise<void> { ... }
}

export const assetService = new AssetService(); // Singleton
```

### 2. Custom Hook with useCallback + Primitive Dependencies
```typescript
// features/assets/hooks/useAssets.ts
export function useAssets(filters?: AssetFilters) {
  const [data, setData] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await assetService.getAll(filters);
      setData(result);
    } catch (err) {
      setError(handleError(err));
    } finally {
      setIsLoading(false);
    }
  // Use primitive values, NOT the filter object reference
  }, [filters?.status, filters?.propertyType, filters?.search]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  return { data, isLoading, error, refetch: fetchAssets };
}
```

### 3. useModal Hook
```typescript
// shared/hooks/useModal.ts
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  return { isOpen, open, close, toggle };
}

// Usage:
const addModal = useModal();
<Button onClick={addModal.open}>เพิ่ม</Button>
<Modal isOpen={addModal.isOpen} onClose={addModal.close}>...</Modal>
```

### 4. Centralized Constants
```typescript
// shared/utils/constants.ts
export const ASSET_STATUS_LABELS: Record<AssetStatus, { label: string; color: string }> = {
  developing:     { label: 'กำลังพัฒนา',      color: 'bg-yellow-100 text-yellow-800' },
  ready_for_sale: { label: 'พร้อมขาย',         color: 'bg-green-100 text-green-800' },
  ready_for_rent: { label: 'พร้อมให้เช่า',     color: 'bg-blue-100 text-blue-800' },
  rented:         { label: 'ให้เช่าแล้ว',      color: 'bg-purple-100 text-purple-800' },
  sold:           { label: 'ขายแล้ว',          color: 'bg-gray-100 text-gray-800' },
};
```

### 5. Typed withTimeout Utility
```typescript
// shared/utils/withTimeout.ts
export async function withTimeout<T>(promise: PromiseLike<T>, ms = 10000): Promise<T> {
  const timer = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new AppError('Request timed out', ErrorCodes.TIMEOUT, 408)), ms)
  );
  return Promise.race([promise as Promise<T>, timer]);
}
```

### 6. API Response Types
```typescript
// types/api.ts
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Thai UI Labels

UI ทั้งหมดใช้ภาษาไทย ต้องกำหนด label maps ใน `constants.ts`:

```typescript
export const PROPERTY_TYPE_LABELS = {
  land:                 { label: 'ที่ดิน',           icon: '🌍' },
  house:                { label: 'บ้านเดี่ยว',        icon: '🏠' },
  semi_detached_house:  { label: 'บ้านแฝด',           icon: '🏘️' },
  condo:                { label: 'คอนโดมิเนียม',       icon: '🏢' },
  townhouse:            { label: 'ทาวน์เฮ้าส์',       icon: '🏙️' },
  commercial:           { label: 'อาคารพาณิชย์',      icon: '🏪' },
  other:                { label: 'อื่นๆ',              icon: '🏗️' },
};
```

วันที่แสดงในรูปแบบ Thai: `15 มีนาคม 2566`
สกุลเงิน: THB (บาท) ใช้ `Intl.NumberFormat('th-TH')`

---

## Setup Instructions

### 1. Clone & Install
```bash
git clone <repo-url>
cd baanaioun
npm install
```

### 2. Create Supabase Project
1. สร้าง project ที่ [supabase.com](https://supabase.com)
2. ไปที่ **Project Settings → API** เพื่อดู URL และ anon key

### 3. Configure Environment
```bash
cp .env.example .env.local
# แก้ไข .env.local ใส่ Supabase URL และ anon key
```

### 4. Run Database Migrations
ใน Supabase Dashboard → SQL Editor รัน migration files ตามลำดับ:
```
supabase/migrations/001_initial_full_schema.sql
supabase/migrations/002_migrate_assets_column_names.sql
... (ถึง 014)
```

### 5. Create Storage Bucket
```sql
-- รันใน Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public) VALUES ('asset-images', 'asset-images', true);

CREATE POLICY "Anyone can view asset images" ON storage.objects
  FOR SELECT USING (bucket_id = 'asset-images');

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'asset-images' AND auth.uid() IS NOT NULL);
```

### 6. Run Development Server
```bash
npm run dev
# http://localhost:3000
```

### 7. Run Tests
```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Feature-based folder structure | Scale ง่าย, แต่ละ feature self-contained |
| Singleton services | ไม่สร้าง instance ซ้ำ, ง่ายต่อการ mock ใน tests |
| useCallback + primitive deps | ป้องกัน infinite re-fetch จาก object reference changes |
| Centralized constants | เปลี่ยน label/color ที่เดียว กระทบทั้ง app |
| withTimeout wrapper | ป้องกัน Supabase query ค้างไม่มีกำหนด |
| Dynamic import for MapPicker | Leaflet ไม่รองรับ SSR, ต้อง load แบบ client-only |
| Server Actions for leads | Lead submission ไม่ต้องการ auth, ใช้ server action แทน API route |
| DB-level date filtering | Filter ที่ database ดีกว่า filter ใน JavaScript |
| Batch expense loading | ป้องกัน N+1 query ใน renovation projects list |

---

## Common Patterns to Follow

### ❌ Anti-patterns (อย่าทำ)
```typescript
// อย่าใช้ JSON.stringify ใน dependency array
useEffect(() => { fetch(filters); }, [JSON.stringify(filters)]);

// อย่าใช้ object reference ใน useCallback deps
const fn = useCallback(() => {}, [filterObject]); // object เปลี่ยน ref ทุก render

// อย่า as any ใน Promise.race
return Promise.race([promise, timer]) as any;

// อย่า fetch ทุกครั้งที่ user กด expand
const toggle = () => { setOpen(!open); fetchData(id); }; // N+1 query
```

### ✅ Good patterns (ทำแบบนี้)
```typescript
// ใช้ primitive values ใน dependency array
const fn = useCallback(() => {}, [filters?.status, filters?.assetId]);

// ใช้ typed withTimeout
return withTimeout(supabaseQuery());

// Batch load แล้วค้นหาใน memory
const allExpenses = await expenseService.getExpensesForProjects(projectIds);
const projectExpenses = allExpenses.filter(e => e.renovation_project_id === id);

// DB-level filtering
.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`)
```
