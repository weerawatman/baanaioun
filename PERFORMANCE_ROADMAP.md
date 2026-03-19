# Performance Roadmap

แผนงานปรับปรุง performance ที่เหลือ (กลุ่ม A เสร็จแล้ว)

---

## ✅ เสร็จแล้ว — กลุ่ม A (Parallel Queries)

- `listings/page.tsx` — parallelize assets + images queries ด้วย Promise.all
- `renovations/page.tsx` — parallelize fetchAssets + fetchProjects ด้วย Promise.all (2 จุด)
- `reports/page.tsx` — fetchAvailableYears ใช้ Promise.all อยู่แล้ว

---

## 🔜 กลุ่ม B — ผลกระทบใหญ่

### B1. Reports Page — Map Index แทน N+1 Filter
**ไฟล์:** `src/app/(dashboard)/reports/page.tsx`

**ปัญหา:** `assetSummaries` useMemo (บรรทัด 106-133) วน loop ทุก asset แล้ว `.filter()` ผ่าน incomes/expenses ทั้งหมดซ้ำทุกตัว = O(n × m)

**วิธีแก้:** สร้าง Map index ก่อน 1 ครั้ง ใน useMemo เดียวกัน แล้วค้นหาใน O(1) แทน
```typescript
const assetSummaries = useMemo(() => {
  // สร้าง index ก่อน 1 ครั้ง
  const incomeByAsset = new Map<string, Income[]>();
  const expenseByAsset = new Map<string, Expense[]>();

  incomes.forEach(i => {
    if (!incomeByAsset.has(i.asset_id)) incomeByAsset.set(i.asset_id, []);
    incomeByAsset.get(i.asset_id)!.push(i);
  });
  expenses.forEach(e => {
    if (!e.asset_id) return;
    if (!expenseByAsset.has(e.asset_id)) expenseByAsset.set(e.asset_id, []);
    expenseByAsset.get(e.asset_id)!.push(e);
  });

  // ค้นหาจาก Map แทน .filter()
  return assets.map(asset => {
    const assetIncomes = incomeByAsset.get(asset.id) ?? [];
    const assetExpenses = expenseByAsset.get(asset.id) ?? [];
    // ... คำนวณเหมือนเดิม
  });
}, [assets, incomes, expenses]);
```

**ผลที่คาดหวัง:** เร็วขึ้น 10-50x เมื่อข้อมูลมาก (50 assets + 1,000 transactions)

---

### B2. Assets Page — Server-side Pagination
**ไฟล์ที่ต้องแก้:**
- `src/features/assets/services/assetService.ts`
- `src/features/assets/hooks/useAssets.ts`
- `src/app/(dashboard)/assets/page.tsx`

**ปัญหา:** ดึงทุก asset มาหมดแล้วค่อย paginate ใน JavaScript — ถ้ามี 500 assets โหลดมาทั้งหมด แสดงแค่ 20 ตัว

**วิธีแก้:**
1. เพิ่ม `page` และ `pageSize` parameter เข้าไปใน `assetService.getAssets()`
2. ใช้ `.range(offset, offset + pageSize - 1)` ใน Supabase query
3. รับ total count กลับมาด้วย `.select('*', { count: 'exact' })`
4. ส่ง `page` state จาก `assets/page.tsx` เข้า hook

**ผลที่คาดหวัง:** โหลดแค่ข้อมูลที่แสดง ประหยัด bandwidth + memory อย่างมากเมื่อข้อมูลโต

---

## 🔜 กลุ่ม C — ปรับปรุงระยะยาว

### C1. SWR Caching (scope ใหญ่ที่สุด)
**ไฟล์ที่ต้องแก้:** hooks ทุกตัวที่ fetch ข้อมูล
- `src/features/assets/hooks/useAssets.ts`
- `src/features/renovations/hooks/useRenovations.ts`
- `src/features/expenses/hooks/useExpenses.ts`
- `src/features/income/hooks/useIncome.ts`

**ปัญหา:** กดออกจากหน้าแล้วกลับมา = query ใหม่ทั้งหมดทุกครั้ง ไม่มี cache เลย

**วิธีแก้:** ติดตั้ง `swr` หรือ `@tanstack/react-query` แทน useState + useEffect pattern ในทุก hook
```bash
npm install swr
# หรือ
npm install @tanstack/react-query
```
- กลับมาที่หน้าเดิม = แสดงข้อมูลเก่าทันที + refetch background อัตโนมัติ
- หลังเพิ่ม/แก้ข้อมูล = invalidate cache key ที่เกี่ยวข้อง
- request deduplication: ถ้า 2 component เรียก hook เดียวกัน ส่ง query แค่ครั้งเดียว

**ผลที่คาดหวัง:** UX ดีขึ้นมากสำหรับ navigation ไปมาระหว่างหน้า

---

### C2. ลด Column ใน SELECT *
**ไฟล์ที่ต้องแก้:**
- `src/features/renovations/services/renovationService.ts` — `.select('*')` → ระบุ column ที่ใช้จริง
- `src/features/income/services/incomeService.ts` — `.select('*')` → ระบุ column ที่ใช้จริง
- `src/features/assets/services/imageService.ts` — `.select('*')` → ระบุ column ที่ใช้จริง

**ปัญหา:** ดึง column ที่ไม่ได้ใช้มาด้วย เช่น `description`, `notes` ในหน้า list

**วิธีแก้:** เปลี่ยน `.select('*')` เป็น `.select('id, name, status, ...')` ตาม column ที่แต่ละหน้าใช้จริง

**ผลที่คาดหวัง:** ลด payload เล็กน้อย เห็นผลเมื่อมี row จำนวนมาก

---

## ลำดับที่แนะนำ

| ลำดับ | งาน | ความยาก | Impact | คำสั่งที่ใช้ |
|---|---|---|---|---|
| 1 | B1 — Map index ใน reports | ง่าย | สูงมาก | "ทำ B1" |
| 2 | B2 — Server-side pagination | กลาง | สูง | "ทำ B2" |
| 3 | C2 — ลด SELECT * | ง่าย | ต่ำ-กลาง | "ทำ C2" |
| 4 | C1 — SWR caching | ยาก | สูงมาก (UX) | "ทำ C1" |
