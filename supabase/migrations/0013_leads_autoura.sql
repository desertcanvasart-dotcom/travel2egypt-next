-- 0013_leads_autoura.sql — did the lead reach the Autoura app? (2026-11-12)
-- /api/lead now also sends every (non-test) lead, signed, to Autoura's
-- /api/webhooks/website-lead so it lands in the CRM, not only in info@.
-- The outcome is written back here: 'sent' | 'failed' | 'skipped', with the
-- receiver's reply. NULL = sent before this existed (or not yet recorded).
--
-- Applied MANUALLY by Islam via the Supabase Dashboard SQL Editor — never run
-- programmatically against the shared production database. Apply AFTER 0012.
-- Safe to re-run.
--
-- TIMING: fail-soft. Until this runs the lead is still sent to Autoura; only
-- the write-back of the outcome fails (logged).

alter table concierge.leads add column if not exists autoura_status text null
  check (autoura_status in ('sent', 'failed', 'skipped'));
alter table concierge.leads add column if not exists autoura_response jsonb null;
alter table concierge.leads add column if not exists autoura_attempts int null;
create index if not exists leads_autoura_status_idx on concierge.leads (autoura_status);
