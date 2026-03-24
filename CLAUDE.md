# Baanaioun — Claude Code Context

ระบบจัดการอสังหาริมทรัพย์สำหรับนักลงทุนส่วนตัว UI ภาษาไทยทั้งหมด
Production: https://www.baanaioun.com (Cloudflare Pages)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database/Auth | Supabase (PostgreSQL + RLS + Supabase Auth) |
| Storage | Supabase Storage (`asset-files` bucket) |
| Maps | Leaflet + React-Leaflet (dynamic import — no SSR) |
| Data Fetching | SWR (dashboard) / raw fetch (public pages) |
| Forms | react-hook-form + zod v4 |
| Notifications | sonner (`<Toaster>` in root layout) |
| CAPTCHA | Cloudflare Turnstile (imperative render) |
| Package Manager | npm |
| Deployment | Cloudflare Pages (Edge Runtime) |

---

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier
npm test             # Vitest
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout — Toaster only, NO AuthProvider here
│   ├── (dashboard)/
│   │   ├── layout.tsx              # AuthProvider + Sidebar — dashboard routes
│   │   ├── assets/
│   │   ├── renovations/
│   │   ├── expenses/
│   │   ├── income/
│   │   ├── leads/
│   │   └── reports/
│   ├── (public)/
│   │   ├── layout.tsx              # AuthProvider — public routes ⚠️ see rule below
│   │   └── listings/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   ├── login/
│   ├── signup/
│   └── api/submit-lead/            # Edge API — lead form submission + email
│
├── features/                       # Feature-based modules
│   ├── assets/services/ hooks/ components/
│   ├── renovations/services/ hooks/ components/
│   ├── expenses/services/ hooks/ components/
│   ├── income/services/ hooks/ components/
│   └── leads/services/ hooks/
│
├── shared/
│   ├── contexts/AuthContext.tsx    # useAuth() — must have AuthProvider ancestor
│   ├── components/ui/              # Button, Card, Modal, Input, Spinner, StatusBadge, EmptyState
│   ├── components/layout/Sidebar
│   ├── components/MapPicker MapPickerDynamic
│   └── utils/                      # constants, format, validation, errorHandler, logger
│
├── types/database.ts               # All DB types — source of truth
├── config/env.ts                   # Type-safe env var access (never use process.env directly)
├── lib/supabase/client.ts          # Browser Supabase client (singleton)
├── lib/supabase/middleware.ts      # updateSession() for middleware
└── middleware.ts                   # Route protection
```

---

## Critical Architectural Rules

### ⚠️ Rule 1: Every Route Group Needs Its Own `layout.tsx` with `AuthProvider`

`AuthContext` default value has `loading: true`. Without `AuthProvider`, `useAuth()` returns
this default forever → any component using `authLoading` shows an infinite spinner.

**When adding a new route group `(groupname)/`, always create `layout.tsx` immediately:**

```tsx
// src/app/(groupname)/layout.tsx
import { AuthProvider } from '@/shared/contexts/AuthContext';

export default function GroupLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
```

### ⚠️ Rule 2: `useCallback` Deps Must Use Primitive Values

Object references change every render → infinite re-fetch loops.

```tsx
// ❌ Wrong — object ref changes every render
const fn = useCallback(() => fetch(filters), [filters]);

// ✅ Correct — primitives are stable
const fn = useCallback(() => fetch(filters), [filters?.status, filters?.search]);
```

### ⚠️ Rule 3: Always Use `env.ts` for Env Vars

```tsx
// ❌ Wrong
process.env.NEXT_PUBLIC_SUPABASE_URL

// ✅ Correct
import { env } from '@/config/env';
env.supabase.url
```

### ⚠️ Rule 4: Supabase Client Is a Singleton — Never Re-export as a Function

The browser client in `lib/supabase/client.ts` uses a self-referencing closure in `global.fetch`
(401 interceptor). Wrapping it in a factory function breaks TypeScript generic inference across
all service files.

```tsx
// ❌ Wrong
export function createClient() { return createBrowserClient(...) }

// ✅ Correct
export const supabase = createBrowserClient(...)
```

---

## Coding Standards

### TypeScript
- Avoid `any` — use proper types from `src/types/database.ts`
- All DB types come from `database.ts` — update it when schema changes
- Use `zod` for runtime validation on form inputs

### Components
- All UI text in **Thai**
- Currency: `Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })`
- Dates: Thai format via `formatCurrency` / `formatDate` in `shared/utils/format.ts`
- Use `sonner` `toast.success()` / `toast.error()` — never `alert()`
- Use shared UI components from `shared/components/ui/` before creating new ones

### Services (Singleton Pattern)
```tsx
class AssetService {
  async getAssets(filters?, pagination?): Promise<{ data: Asset[]; count: number }> { ... }
  async getAssetById(id: string): Promise<Asset | null> { ... }
  async createAsset(data: CreateAssetInput): Promise<Asset> { ... }
  async updateAsset(id: string, data: Partial<CreateAssetInput>): Promise<Asset> { ... }
  async deleteAsset(id: string): Promise<void> { ... }
}
export const assetService = new AssetService();
```

### SWR Hooks (Dashboard)
```tsx
const { data, error, isLoading, mutate } = useSWR(
  ['key', primitiveParam1, primitiveParam2],
  () => service.getData(params),
  {
    revalidateOnFocus: true,
    focusThrottleInterval: 60000,
    keepPreviousData: true,
    errorRetryCount: 2,
    errorRetryInterval: 3000,
    shouldRetryOnError: (err) => err.name !== 'AbortError',
  }
);
```

### Error Handling
- `AbortError` = intentional browser cancel — handle silently, never show as error
- Always use `finally` to clear loading state
- Use `toast.error(message)` for user-facing errors
- Use `console.error(err)` for dev logging only

### Forms (zod + react-hook-form)
```tsx
const schema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ'),
  price: z.number().min(0, 'ราคาต้องไม่ติดลบ').optional(),
});
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

---

## Database Key Points

- `assets.asset_code` — auto-generated by DB trigger (AST-001, AST-002...), never pass in INSERT
- `CreateAssetInput` omits `id`, `created_at`, `asset_code`
- Public views: `public_assets`, `public_asset_images` — used by `/listings`, accessible to anon
- Leads: anon can INSERT only — no SELECT, no UPDATE
- `location_lat_long` column exists on `assets` — always include in SELECT if editing coordinates

### Status Lifecycle
```
developing → ready_for_sale → sold
           → ready_for_rent → rented
```

---

## Auth Architecture

```
Middleware (Edge)
  └── updateSession() — getUser() validates token with Supabase server
      └── allowThrough flag — don't redirect on transient failures if auth cookies exist

Client (AuthContext)
  ├── getSession() on mount
  ├── onAuthStateChange subscription
  ├── visibilitychange → refreshOnReturn()
  ├── window.focus → refreshOnReturn()
  └── keepalive ping every 4min (assets table HEAD query)

Supabase Client (lib/supabase/client.ts)
  └── global.fetch wrapper — 401 on non-auth URLs → refreshSession() fire-and-forget
```

---

## Anti-Patterns to Avoid

```tsx
// ❌ JSON.stringify in deps
useEffect(() => {}, [JSON.stringify(obj)]);

// ❌ Object ref in useCallback deps
useCallback(() => {}, [filterObject]);

// ❌ Direct process.env access
process.env.NEXT_PUBLIC_SUPABASE_URL

// ❌ alert() for user feedback
alert('สำเร็จ');

// ❌ Fetch inside expand toggle (N+1)
onClick={() => { setOpen(true); fetchData(id); }}

// ❌ No finally on setLoading
try { setLoading(true); await fetch(); } catch { }
// missing: finally { setLoading(false); }

// ❌ New route group without layout.tsx + AuthProvider
// src/app/(newgroup)/page.tsx — useAuth() will return { loading: true } forever
```

---

## Leaflet / Maps

MapPicker must be dynamically imported (no SSR):
```tsx
import dynamic from 'next/dynamic';
const MapPickerDynamic = dynamic(() => import('@/shared/components/MapPickerDynamic'), {
  ssr: false,
  loading: () => <div className="h-64 bg-warm-100 rounded-xl animate-pulse" />,
});
```

---

## Cloudflare Turnstile (CAPTCHA)

Used on public contact form. Rendered imperatively:
```tsx
turnstileWidgetId.current = window.turnstile.render(containerRef.current, {
  sitekey: env.turnstile.siteKey,
  theme: 'auto',
  size: 'flexible',
});
```

CSS override in `globals.css` forces widget to match input field width.

---

## Migrations

New DB changes go in `supabase/migrations/` as numbered SQL files.
Run via Supabase Dashboard → SQL Editor.
Always update `src/types/database.ts` to match schema changes.
