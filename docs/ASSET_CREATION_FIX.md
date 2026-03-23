# 🔧 Asset Creation Issue - Comprehensive Troubleshooting Guide

## 📋 Problem Summary

After running `5_fix_rls_unrestricted_tables.sql`, assets still cannot be created from the frontend. The issue was **incomplete RLS (Row-Level Security) configuration**.

### Root Causes Identified:

1. **Migration 2 Bug**: Created RLS policies but **did NOT enable RLS** on most tables
2. **Migration 5 Incomplete**: Only enabled RLS on 3 tables (assets, asset_images, leads) but left 4 tables without RLS:
   - `renovation_projects`
   - `expenses`
   - `incomes`
   - `user_profiles` (assumed enabled, but not verified)

**Why this matters**: When RLS policies exist but RLS is **not enabled** on a table, the policies are **NEVER ENFORCED**. Supabase then uses default behavior, which blocks INSERT for authenticated users without explicit RLS policy.

---

## ✅ Solution: Apply Migration 6

### Step 1: Run the Comprehensive RLS Fix Migration

In **Supabase Dashboard → SQL Editor**, run:

```bash
supabase/migrations/6_comprehensive_rls_fix.sql
```

This migration:
- ✓ Enables RLS on **ALL 7 tables**
- ✓ Recreates all RLS policies cleanly
- ✓ Handles idempotency (safe to run multiple times)

### Step 2: Verify the Fix (Optional but Recommended)

After running the migration, verify RLS is enabled on all tables by running this query in the SQL Editor:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'user_profiles', 'assets', 'renovation_projects', 
    'expenses', 'incomes', 'asset_images', 'leads'
  )
ORDER BY tablename;
```

**Expected result**: All rows should show `rowsecurity = true`

---

## 🧪 Verify the Fix Works

### Option 1: Using Browser Diagnostics (Recommended for Development)

1. Log in to your app
2. Open **Browser Developer Console** (F12)
3. Paste and run:

```javascript
// Import the diagnostic utility
import { diagnosticAssetCreation, logDiagnosticReport } from '@/features/assets/services/assetDiagnostic'

// Run diagnostics
const report = await diagnosticAssetCreation()

// View results
logDiagnosticReport(report)
```

This will run 5 checks:
- ✓ Authentication status
- ✓ User profile access
- ✓ Can read existing assets
- ✓ Can create a test asset (will be cleaned up)
- ✓ RLS status

If all show ✓, your issue is fixed!

### Option 2: Manual Test in Frontend

1. Log in to the app
2. Navigate to the assets page
3. Click "Add Asset"
4. Fill in the form and submit
5. Check if it saves successfully

### Option 3: Direct Database Test

In **Supabase Dashboard → SQL Editor**, run as authenticated user:

```sql
INSERT INTO assets (
  title_deed_number, 
  property_type, 
  purchase_price
) VALUES (
  'MANUAL-TEST-' || floor(random() * 100000)::text,
  'land',
  100000
)
RETURNING id, title_deed_number;
```

If this returns a new asset ID, RLS is working correctly.

---

## 🚨 If Asset Creation STILL Fails After Migration 6

### Step 1: Check the Exact Error

Add error logging to `src/features/assets/services/assetService.ts`:

```typescript
// In the createAsset method catch block:
console.error('Full Error Details:', {
  code: error.code,           // Error code (42501 = RLS block)
  message: error.message,
  details: (error as any).details,
  hint: (error as any).hint,
  statusCode: (error as any).status,
});
```

### Step 2: Common Error Codes

| Code | Problem | Solution |
|------|---------|----------|
| `42501` | RLS Policy blocking insert | Run Migration 6 or check get_user_role() function |
| `23502` | NOT NULL constraint violation | Asset data is missing required fields |
| `23503` | Foreign key violation | Referenced asset/project doesn't exist |
| `PGRST301` | JWT expired | Click "Refresh" or log in again |
| `connection_error` | Network issue | Check Supabase URL/key in env vars |

### Step 3: Verify Environment Variables

In `.env.local` or environment config:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (long JWT string)
```

⚠️ **IMPORTANT**: The anonKey (not the service role key) should be used on the frontend.

### Step 4: Verify User Profile Exists

After logging in, run in SQL Editor:

```sql
SELECT * FROM user_profiles WHERE id = auth.uid();
```

If this returns nothing, the user profile wasn't created. Run this to create it:

```sql
INSERT INTO user_profiles (id, email, role)
SELECT id, email, 'user'
FROM auth.users
WHERE id = auth.uid()
AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid());
```

### Step 5: Check Session/JWT Token

In browser console:

```javascript
const { data } = await supabase.auth.getUser()
console.log('Current User:', data.user)

const { data: { session } } = await supabase.auth.getSession()
console.log('Current Session:', session)
```

If session is null, the user isn't properly authenticated to Supabase.

---

## 📝 Prevention: Best Practices Going Forward

### 1. **Always Enable RLS in Schema Files**

❌ **Bad** (current migrations):
```sql
CREATE TABLE IF NOT EXISTS assets (...)
-- Missing this line! RLS policies exist but aren't enforced
```

✅ **Good**:
```sql
CREATE TABLE IF NOT EXISTS assets (...)

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "..." ON assets ...
```

### 2. **Use Idempotent Migrations**

Always use `DROP POLICY IF EXISTS` before `CREATE POLICY`:

```sql
DROP POLICY IF EXISTS "policy name" ON table_name;
CREATE POLICY "policy name" ...
```

### 3. **Add Verification to Migrations**

Include test queries to verify the fix works:

```sql
-- Verification: Try inserting as a test
BEGIN;
  INSERT INTO assets (title_deed_number, property_type, purchase_price)
  VALUES ('TEST', 'land', 0);
  -- If this fails with 42501, RLS is still blocking
ROLLBACK;
```

### 4. **Document RLS Strategy**

Create a `docs/RLS_STRATEGY.md` file:
- Which tables need RLS
- Which roles access what
- Policy logic for complex rules

---

## 🔍 Additional Notes

### About the Fix

**Migration 5** was a partial patch that only fixed 3 tables. **Migration 6** is the comprehensive fix that:

1. Enables RLS on all 7 tables
2. Handles edge cases (user_profiles, leads with anon access)
3. Is fully idempotent (safe to re-run)
4. Includes verification steps

### Why RLS is Essential

Row-Level Security is critical for:
- **Multi-tenant safety**: Each user only sees their own data
- **Role-based access**: Admin-only operations are protected
- **Public features**: Anon users can submit leads without seeing all data

### Performance Impact

Enabling RLS has minimal performance impact for well-designed policies. The policies used here (`WITH CHECK (true)`) are evaluated at the database level, not in application code.

---

## 🆘 Need More Help?

### Debugging Tips

1. **Check logs**: `src/shared/utils/errorHandler.ts` has error formatting
2. **Use diagnostics**: Run `assetDiagnostic.ts` to pinpoint issues
3. **Check Supabase dashboard**: View real-time logs under "Logs" → "API requests"
4. **Verify JWT**: Decode the session token at jwt.io

### References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Policies](https://supabase.com/docs/guides/storage/security)
- [PostgREST Error Codes](https://postgrest.org/en/stable/references/errors.html)

---

## ✨ Checklist: Implementation Steps

- [ ] Run Migration 6 in Supabase Dashboard
- [ ] Verify all tables have RLS enabled (run verification query)
- [ ] Test asset creation in the UI
- [ ] (If needed) Run diagnostics from browser console
- [ ] (If needed) Check error codes and follow troubleshooting steps
- [ ] Clear browser cache and cookies if experiencing issues
- [ ] Update team docs with the RLS fix
- [ ] Monitor asset creation for next 24 hours

---

**Last Updated**: 2026-03-23
**Author**: AI Assistant
**Status**: Ready for production ✓
