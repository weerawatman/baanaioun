-- Migration 8: Add status and admin_notes to leads table
-- Phase 4: Leads Management UI
--
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create enum for lead status
create type lead_status as enum ('new', 'contacted', 'closed');

-- 2. Add columns to leads table
alter table leads
  add column status lead_status not null default 'new',
  add column admin_notes text;

-- 3. Backfill: existing leads get status = 'new' (already handled by default above)

-- 4. RLS: admin can update status/notes; anon cannot
--    (leads table already has RLS enabled from migration 2/3)
--    The existing policy allows anon INSERT only.
--    We need an UPDATE policy for authenticated users (admin).

create policy "Admin can update lead status and notes"
  on leads
  for update
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- Verify
-- ============================================================
-- select column_name, data_type, column_default
-- from information_schema.columns
-- where table_name = 'leads'
-- order by ordinal_position;
