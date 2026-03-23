# Baanaioun — ระบบจัดการอสังหาริมทรัพย์

ระบบบริหารจัดการอสังหาริมทรัพย์สำหรับนักลงทุนส่วนตัว พัฒนาด้วย Next.js 16 + Supabase

**Production:** [baanaioun.com](https://www.baanaioun.com)

---

## ฟีเจอร์

| | ฟีเจอร์ | รายละเอียด |
|--|---------|-----------|
| 🏠 | **จัดการทรัพย์สิน** | บันทึก/แก้ไขทรัพย์สิน ติดตาม lifecycle ตั้งแต่ซื้อจนขายออก |
| 🔨 | **โครงการก่อสร้าง/ปรับปรุง** | budget tracking, timeline รูปภาพ, complete project workflow |
| 💸 | **รายจ่าย** | แยก category (วัสดุ, แรงงาน, ค่าก่อสร้าง ฯลฯ) ผูกกับโครงการได้ |
| 💰 | **รายได้** | บันทึกรายได้ต่อทรัพย์สิน (ค่าเช่า, กำไรขาย ฯลฯ) |
| 🖼️ | **แกลเลอรี่รูปภาพ** | อัปโหลดรูปแยก timeline (ก่อน/ระหว่าง/หลังปรับปรุง) |
| 📊 | **รายงาน** | รายได้-รายจ่ายรายปีต่อทรัพย์สิน |
| 🌐 | **ประกาศขาย/เช่า** | หน้าสาธารณะสำหรับลูกค้า + ฟอร์มแจ้งความสนใจ |
| 👥 | **ลูกค้าที่สนใจ** | รายการ leads ที่ส่งมาจากหน้าประกาศ |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Database & Auth:** Supabase (PostgreSQL + Row Level Security)
- **Storage:** Supabase Storage (รูปภาพทรัพย์สิน)
- **Styling:** Tailwind CSS 4
- **Maps:** Leaflet + React-Leaflet (OpenStreetMap)
- **Email:** Resend (แจ้งเตือน leads)
- **Hosting:** Cloudflare Pages (Edge Runtime)
- **Testing:** Vitest

---

## เริ่มต้นใช้งาน

### สิ่งที่ต้องมี

- Node.js 20+
- npm
- Supabase account (ฟรีที่ [supabase.com](https://supabase.com))
- Resend account (ฟรีที่ [resend.com](https://resend.com)) — สำหรับ email notifications

---

### ขั้นตอนที่ 1 — Clone และ Install

```bash
git clone https://github.com/weerawatman/baanaioun.git
cd baanaioun
npm install
```

---

### ขั้นตอนที่ 2 — สร้าง Supabase Project

1. ไปที่ [supabase.com](https://supabase.com) → สร้าง project ใหม่
2. เปิด **Project Settings → API** และ copy:
   - **Project URL**
   - **anon / public key**

---

### ขั้นตอนที่ 3 — ตั้งค่า Environment Variables

```bash
cp .env.example .env.local
```

แก้ไข `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

NEXT_PUBLIC_APP_URL=http://localhost:3000

RESEND_API_KEY=re_xxxxxxxxxxxx
NOTIFICATION_EMAIL=your@email.com
NOTIFICATION_FROM_EMAIL=notify@yourdomain.com
```

---

### ขั้นตอนที่ 4 — สร้าง Database

เปิด **Supabase Dashboard → SQL Editor** แล้วรันไฟล์ตามลำดับ:

```
supabase/migrations/1_core_schema.sql       ← ตาราง + RLS enable
supabase/migrations/2_rls_and_auth.sql      ← user profiles + policies
supabase/migrations/3_public_listings.sql   ← views + anon access
supabase/migrations/4_indexes.sql           ← indexes
```

---

### ขั้นตอนที่ 5 — สร้าง Storage Bucket

ใน **Supabase Dashboard → Storage:**

1. คลิก **New bucket** → ชื่อ `asset-files` → เปิด Public
2. เพิ่ม Storage Policies (ไปที่ Policies tab ของ bucket):

| Policy | Role | Operation |
|--------|------|-----------|
| Public read asset files | anon | SELECT |
| Authenticated upload asset files | authenticated | INSERT |
| Authenticated delete asset files | authenticated | DELETE |

หรือรัน SQL จาก comment ใน `supabase/migrations/3_public_listings.sql`

---

### ขั้นตอนที่ 6 — รัน Development Server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

> สมัครบัญชีแรกผ่านหน้า `/signup` — บัญชีแรกจะได้ role `user` โดยอัตโนมัติ
> เปลี่ยน role เป็น `admin` ได้ใน Supabase → Table Editor → user_profiles

---

### (Optional) ใส่ข้อมูลตัวอย่าง

```sql
-- รันใน Supabase SQL Editor
-- supabase/seeds/seed_demo_data.sql
```

⚠️ ลบข้อมูลเดิมที่มี prefix `TEST-` ก่อนใส่ใหม่ — ไม่ควรรันบน production

---

## คำสั่งที่ใช้บ่อย

```bash
npm run dev          # Development server
npm run build        # Build production
npm run lint         # ESLint
npm run format       # Prettier
npm test             # Unit tests (Vitest)
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

---

## โครงสร้าง Project

```
baanaioun/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # หน้าที่ต้อง login
│   │   │   ├── assets/         # จัดการทรัพย์สิน
│   │   │   ├── renovations/    # โครงการก่อสร้าง/ปรับปรุง
│   │   │   ├── leads/          # ลูกค้าที่สนใจ
│   │   │   └── reports/        # รายงาน
│   │   ├── (public)/listings/  # ประกาศสาธารณะ (ไม่ต้อง login)
│   │   └── api/submit-lead/    # Edge API: รับฟอร์มสนใจ + ส่ง email
│   │
│   ├── features/               # Business logic แยกตาม feature
│   │   ├── assets/             # services/ hooks/ components/
│   │   ├── renovations/        # services/ hooks/ components/
│   │   ├── expenses/           # services/ hooks/ components/
│   │   ├── income/             # services/ hooks/ components/
│   │   └── leads/              # services/ hooks/
│   │
│   ├── shared/
│   │   ├── components/ui/      # Button, Card, Modal, Spinner ...
│   │   ├── hooks/              # useAuth, useDebounce, useLocalStorage ...
│   │   └── utils/              # constants, format, validation, errorHandler ...
│   │
│   ├── types/database.ts       # TypeScript interfaces ตรงกับ Supabase schema
│   ├── lib/                    # Supabase client setup
│   └── config/env.ts           # Environment variables (type-safe)
│
├── supabase/
│   ├── migrations/             # รัน 1→2→3→4 เพื่อสร้าง database ใหม่
│   ├── seeds/                  # ข้อมูลตัวอย่างสำหรับ development
│   ├── scripts/                # Utility scripts (verify security ฯลฯ)
│   └── archive/                # Migration history (applied to production)
│
└── docs/
    ├── DEVELOPMENT_GUIDE.md    # Coding standards และ architecture
    └── PERFORMANCE_ROADMAP.md  # Performance decisions history
```

---

## Database Schema

```
assets ──────────────────────────────────────────────────────┐
  │                                                           │
  ├── renovation_projects (CASCADE DELETE)                    │
  │     └── asset_images (project link, SET NULL on delete)  │
  │     └── expenses (project link, CASCADE DELETE)          │
  │                                                           │
  ├── expenses (CASCADE DELETE)                               │
  ├── incomes (CASCADE DELETE)                                │
  ├── asset_images (CASCADE DELETE)                           │
  └── leads (CASCADE DELETE)                                  │
                                                              │
user_profiles ← auth.users (Supabase Auth) ─────────────────┘

Views (anon access):
  public_assets        → assets WHERE status IN (ready_for_sale, ready_for_rent)
  public_asset_images  → asset_images JOIN public assets
```

**Asset status lifecycle:**
```
developing → ready_for_sale → sold
           → ready_for_rent → rented
```

---

## Deploy บน Cloudflare Pages

1. Push code ไปที่ GitHub
2. เชื่อมต่อ repo ที่ [Cloudflare Pages](https://pages.cloudflare.com)
3. ตั้งค่า build:
   - **Build command:** `npm run build`
   - **Output directory:** `.next`
4. เพิ่ม Environment Variables ทั้งหมดจาก `.env.example`

> **หมายเหตุ:** ใช้ Edge Runtime — ไม่รองรับ `next/image` optimization
> ใช้ `<img>` แทนและเก็บรูปที่ Supabase Storage (public CDN)

---

## License

Private project — สงวนลิขสิทธิ์
