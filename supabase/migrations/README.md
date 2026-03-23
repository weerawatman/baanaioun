# migrations/

Run these **in order** in Supabase SQL Editor to set up a fresh database.

| File | What it creates |
|------|----------------|
| `1_core_schema.sql` | All tables: assets, renovation_projects, expenses, incomes, asset_images, leads |
| `2_rls_and_auth.sql` | user_profiles, auth trigger, RLS policies, complete_project() function |
| `3_public_listings.sql` | public_assets / public_asset_images views + anon access for listings portal |
| `4_indexes.sql` | Performance indexes on foreign keys and filtered columns |

## After running migrations

1. Go to **Storage** → Create bucket named `asset-files` (public)
2. Add storage policies from the comments in `3_public_listings.sql`
3. Optionally run `../seeds/seed_demo_data.sql` to populate with demo assets

## Migration history

The `../archive/` folder contains the 14 incremental migrations applied to production during development.
