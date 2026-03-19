# Performance Roadmap

## ✅ เสร็จทั้งหมดแล้ว

### กลุ่ม A — Parallel Queries ✅
- `listings/page.tsx` — parallelize assets + images queries ด้วย Promise.all
- `renovations/page.tsx` — parallelize fetchAssets + fetchProjects ด้วย Promise.all (2 จุด)
- `reports/page.tsx` — fetchAvailableYears ใช้ Promise.all อยู่แล้ว

### B1 — Reports Page Map Index ✅
- `src/app/(dashboard)/reports/page.tsx` — เปลี่ยน assetSummaries useMemo จาก O(n×m) .filter() เป็น O(n) Map index
- ผลที่ได้: เร็วขึ้น 10-50x เมื่อข้อมูลมาก (50 assets + 1,000 transactions)

### B2 — Assets Page Server-side Pagination ✅
- `src/features/assets/services/assetService.ts` — เพิ่ม pagination param, เปลี่ยน return เป็น `{ data, count }`, เพิ่ม `getStatusCounts()`
- `src/features/assets/hooks/useAssets.ts` — ใช้ SWR + รับ pagination params + expose totalCount
- `src/app/(dashboard)/assets/page.tsx` — lift state จาก useAssetFilters, ส่ง pagination เข้า useAssets
- ผลที่ได้: โหลดแค่ข้อมูล page ที่แสดง (20 records) แทนทั้งหมด

### C1 — SWR Caching ✅
- `npm install swr` — ติดตั้งแล้ว
- `src/features/assets/hooks/useAssets.ts` — ใช้ useSWR (รวมกับ B2)
- `src/features/renovations/hooks/useRenovations.ts` — ใช้ useSWR
- `src/features/expenses/hooks/useExpenses.ts` — ใช้ useSWR
- `src/features/income/hooks/useIncome.ts` — ใช้ useSWR
- ผลที่ได้: กลับมาหน้าเดิม = แสดงข้อมูลเก่าทันที + refetch background อัตโนมัติ

### C2 — ลด SELECT * ✅
- `src/features/renovations/services/renovationService.ts` — `.select('*')` → explicit columns
- `src/features/income/services/incomeService.ts` — `.select('*')` → explicit columns
- `src/features/assets/services/imageService.ts` — `.select('*')` → explicit columns
- ผลที่ได้: ลด payload เล็กน้อย
