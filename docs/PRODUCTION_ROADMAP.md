# Baanaioun - Production Roadmap

เอกสารฉบับนี้สรุปแผนงานการปรับปรุงระบบจาก **Functional Prototype** สู่ **Production-Grade Application** อย่างเป็นระบบ เพื่อความเสถียร ประสิทธิภาพ และความปลอดภัยสูงสุด

---

## 🟢 Phase 1: Infrastructure & Performance (Completed)
เน้นการเพิ่มความเร็วและลดการใช้ทรัพยากร (Infrastructure Hardening)
- [x] **Next.js Image Optimization**: เปลี่ยนจาก `<img>` เป็น `next/image` ทั้งระบบ
  - รองรับการทำ Automatic Resizing และ WebP Conversion
  - เพิ่ม `priority` ให้กับ Hero Image เพื่อคะแนน LCP ที่ดีขึ้น
- [x] **Remote Patterns Config**: ตั้งค่าความปลอดภัยใน `next.config.ts` ให้รองรับเฉพาะ Domain ของ Supabase
- [x] **Responsive Images**: กำหนด `sizes` และ `fill` ในคอมโพเนนต์ต่างๆ เพื่อการแสดงผลที่ถูกต้องในทุกอุปกรณ์

## 🟢 Phase 2: Professional UX & Reliability (Completed)
เน้นประสบการณ์ผู้ใช้ที่ลื่นไหลและการจัดการข้อผิดพลาด (UX & Error Handling)
- [x] **Advanced Form Management**: ติดตั้งและใช้งาน `react-hook-form` ร่วมกับ `zod`
  - ยกระดับการตรวจสอบข้อมูล (Validation) ให้เป็นมาตรฐานสากล
  - จัดการ Error Message และ Loading State ได้อย่างเป็นมืออาชีพ
- [x] **Robust Error Boundaries**:
  - สร้าง `not-found.tsx` (404 Page) สำหรับกรณีไม่พบข้อมูล
  - สร้าง `error.tsx` (500 Page) เพื่อดักจับ Exception และให้ผู้ใช้กด Retry ได้โดยไม่ต้องโหลดหน้าใหม่ทั้งหมด

## 🟢 Phase 3: Data Integrity & Governance (Completed)
เน้นความโปร่งใสและการตรวจสอบได้ของข้อมูล (Audit & Security)
- [x] **Activity Logs (Audit Trail)**:
  - สร้างตาราง `activity_logs` และ PostgreSQL Triggers ใน Supabase
  - บันทึกประวัติการแก้ไขข้อมูลทรัพย์สิน (Old/New Data) อัตโนมัติ
- [x] **Role-Based Security**: กำหนดสิทธิ์ RLS ให้เฉพาะ Admin เท่านั้นที่เห็นประวัติการแก้ไข

## 🟢 Phase 4: Operational Excellence (Completed)
เน้นความสะดวกของ Admin และการแจ้งเตือน (Admin Mastery)
- [x] **Global Notification System**:
  - ติดตั้ง `sonner` แทนที่การใช้ `alert()` ทั้งระบบ
  - แสดงผล Success/Error Toast ที่สวยงามและไม่ขัดจังหวะการทำงาน
- [x] **Admin Form Validation**:
  - ปรับปรุง `AddAssetModal` และ `AddRenovationModal` ให้ใช้ `zod`
  - เพิ่ม Inline Field Errors (ป้องกันราคาติดลบ, end_date < start_date ฯลฯ)
- [x] **Leads Management UI**:
  - เพิ่มฟีเจอร์การเปลี่ยนสถานะ Lead (New → Contacted → Closed) แบบ Inline
  - เพิ่มระบบบันทึก Admin Notes พร้อม Auto-save on blur

## 🟢 Phase 4.5: Security, Auth Resilience & CAPTCHA (Completed)
เน้นความปลอดภัยและเสถียรภาพของ Session (Security Hardening)
- [x] **Content Security Policy (CSP)**: เพิ่ม CSP Headers ใน `next.config.ts`
  - ครอบคลุม Cloudflare Turnstile, Supabase, OpenStreetMap, Leaflet, Sentry
- [x] **Cloudflare Turnstile CAPTCHA**: ติดตั้ง CAPTCHA บนฟอร์มติดต่อหน้า public
  - ป้องกัน spam ส่งไปยัง `/api/submit-lead`
- [x] **Session Resilience (5-Layer Defense)**:
  1. `autoRefreshToken` — background timer ของ Supabase
  2. `visibilitychange` event → `getSession()` เมื่อผู้ใช้กลับมาที่ tab
  3. `window.focus` event → `getSession()` เมื่อ Alt+Tab กลับมา
  4. 401 Interceptor ใน `global.fetch` → `refreshSession()` fire-and-forget
  5. Middleware `allowThrough` — ไม่ redirect เมื่อ `getUser()` fail แบบ transient
- [x] **Keepalive Ping**: ping `assets` table ทุก 4 นาที ป้องกัน Supabase cold start
- [x] **Bug Fix — Public Route AuthContext**:
  - สร้าง `src/app/(public)/layout.tsx` ครอบ `AuthProvider`
  - แก้ปัญหา infinite loading บนมือถือ เพราะ `authLoading` ค้างเป็น `true` ตลอดกาล

---

## 🟡 Phase 5: Search & SEO Optimization
เน้นการทำให้คนหาทรัพย์สินเจอและใช้งานง่าย (Marketing & Accessibility)
- [ ] **Full-Text Search**: เพิ่มความสามารถในการค้นหาทรัพย์สินด้วยคำค้นหา (Keyword Search) ใน Supabase
- [ ] **Advanced Filtering**: ปรับปรุงระบบ Filter (ราคา, ประเภท, ทำเล) ให้ลื่นไหลแบบ Real-time
- [ ] **Metadata & SEO**:
  - ตั้งค่า Dynamic Metadata สำหรับแต่ละหน้าทรัพย์สินเพื่อให้แชร์ลง Facebook/LINE แล้วแสดงรูปและราคาที่ถูกต้อง (Open Graph)
  - สร้าง `sitemap.xml` และ `robots.txt` อัตโนมัติ

## 🔴 Phase 6: DevOps & Launch Strategy
ขั้นตอนสุดท้ายก่อนเปิดตัว (Final Go-Live)
- [ ] **Environment Separation**: แยกฐานข้อมูล Development และ Production ออกจากกันอย่างเด็ดขาด
- [ ] **Sentry Monitoring**: เชื่อมต่อระบบ Error Tracking อย่างสมบูรณ์เพื่อแจ้งเตือนเข้า Email/LINE ทันทีเมื่อเกิด Error ในฝั่งผู้ใช้
- [ ] **Database Backup & Recovery**: ตั้งค่าระบบ Backup อัตโนมัติใน Supabase และทดสอบการกู้คืนข้อมูล
- [ ] **SSL & Domain Setup**: ตรวจสอบความถูกต้องของใบรับรองความปลอดภัยและ Domain Redirection

---

## Architectural Rules (บทเรียนสำคัญ)

### ⚠️ ทุก Route Group ต้องมี `layout.tsx` ครอบ `AuthProvider`

**ปัญหาที่เกิดขึ้นจริง:** หน้า `/listings` (public) โหลดหมุนค้างบนมือถือ เพราะ `useAuth()` ถูกเรียกโดยไม่มี `AuthProvider` ครอบ → ได้รับค่า default `{ loading: true }` ที่ไม่มีวันเปลี่ยนเป็น `false`

**กฎ:** เมื่อสร้าง route group ใหม่ (`(groupname)/`) **ต้องสร้าง `layout.tsx` พร้อมกันทันที** แม้ว่าหน้านั้นจะเป็น public และไม่ต้อง login ก็ตาม

```
# ถูกต้อง — ทุก route group มี layout.tsx
src/app/
├── (dashboard)/
│   └── layout.tsx   ← AuthProvider + Sidebar
└── (public)/
    └── layout.tsx   ← AuthProvider (เพื่อให้ useAuth() มีค่าจริง)

# ผิด — (public) ไม่มี layout.tsx
src/app/
├── (dashboard)/
│   └── layout.tsx
└── (public)/        ← useAuth() จะ return { loading: true } ตลอดกาล!
    └── listings/
```

**เหตุผล:** `AuthContext` default value มี `loading: true` โดยเจตนา (ป้องกัน flash) แต่ถ้าไม่มี `AuthProvider` mount ค่านี้จะไม่มีวันเปลี่ยน ส่งผลให้ทุก component ที่ depends on `authLoading` แสดง spinner ตลอดกาล

---

## Technical Standards

- **Framework**: Next.js 16 (App Router) + React 19
- **Database/Auth**: Supabase (PostgreSQL + RLS)
- **Form/Validation**: React Hook Form + Zod v4
- **UI/Styles**: Tailwind CSS 4
- **Notifications**: Sonner (toast)
- **CAPTCHA**: Cloudflare Turnstile
- **Monitoring**: Sentry (Planned)
- **Deployment**: Cloudflare Pages (Edge Runtime)

---

*Last updated: 2026-03-24*
