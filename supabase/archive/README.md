# archive/

Migration history — incremental changes applied to the production database during development.

**Do NOT run these for a fresh setup.** Use `../migrations/` instead.

| File | What it did |
|------|-------------|
| 001 | Initial schema (assets, renovations, expenses, incomes, images) |
| 002 | Rename columns in assets for consistency |
| 003 | Fix/backfill missing columns idempotently |
| 004 | Add project_type to renovation_projects |
| 005 | Extend expense categories for construction work |
| 006 | Add complete_project() function with enhanced error handling |
| 007 | Add renovation_project_id to asset_images + new image categories |
| 008 | Add selling_price, rental_price, description to assets; create leads table |
| 009 | Create public_assets / public_asset_images views + anon INSERT on leads |
| 010 | Add location_lat_long to assets, update views |
| 011 | Dev-only: temporary anon full-access policies (replaced by 013) |
| 012 | Migrate status values: owned→developing, available→ready_for_sale |
| 013 | Add user_profiles + handle_new_user trigger + role-based RLS |
| 014 | Add tenant_name, tenant_contact to assets |
