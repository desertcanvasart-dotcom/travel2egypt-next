-- 0012_leads_enquiry_type.sql — what an enquiry is about (small-group hub,
-- 2026-11-10). 'small_group' for the /small-group-travel-packages forms
-- (hero, card, closing form); NULL for every other lead and for old rows.
--
-- Applied MANUALLY by Islam via the Supabase Dashboard SQL Editor — never run
-- programmatically against the shared production database. Apply AFTER 0011.
-- Safe to re-run.
--
-- TIMING: /api/lead is fail-soft. Until this runs, a small-group lead is
-- stored without enquiry_type (the insert retries at the 0011 tier, logged);
-- the team email still says "Small-group enquiry" and names the departure,
-- and form_location (small_group_hero / _card / _end) still identifies it.

alter table concierge.leads add column if not exists enquiry_type text null;
create index if not exists leads_enquiry_type_idx on concierge.leads (enquiry_type) where enquiry_type is not null;
