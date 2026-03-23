# migrations/

Run these **in order** in Supabase SQL Editor to set up a fresh database.

## Initial Setup (Fresh Database)

| File | What it creates |
|------|----------------|
| `1_core_schema.sql` | All tables: assets, renovation_projects, expenses, incomes, asset_images, leads |
| `2_rls_and_auth.sql` | user_profiles, auth trigger, RLS policies, complete_project() function |
| `3_public_listings.sql` | public_assets / public_asset_images views + anon access for listings portal |
| `4_indexes.sql` | Performance indexes on foreign keys and filtered columns |

## Fixes & Updates

| File | Fixes | Status |
|------|-------|--------|
| `5_fix_rls_unrestricted_tables.sql` | ⚠️ **DEPRECATED**: Partial RLS fix (only 3 tables) | Use Migration 6 instead |
| `6_comprehensive_rls_fix.sql` | ✅ **Complete RLS fix** - Enables RLS on all 7 tables + recreates all policies | **Use this** - safe to re-run |

### Why Migration 6?

Migration 2 created RLS policies but **didn't enable RLS** on the tables, so INSERT operations would fail silently. Migration 6 fixes this comprehensively by:
- Enabling RLS on all 7 tables
- Recreating all policies cleanly
- Including verification steps

See [Asset Creation Fix Guide](../docs/ASSET_CREATION_FIX.md) for details.

## After running migrations

1. Go to **Storage** → Create bucket named `asset-files` (public)
2. Add storage policies from the comments in `3_public_listings.sql`
3. Optionally run `../seeds/seed_demo_data.sql` to populate with demo assets

## Migration history

The `../archive/` folder contains the 14 incremental migrations applied to production during development.
