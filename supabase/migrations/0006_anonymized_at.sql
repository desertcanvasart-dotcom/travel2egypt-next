-- 0006_anonymized_at.sql — GDPR erasure timestamp on sessions (Session 10).
--
-- Applied MANUALLY by Islam via the Supabase Dashboard SQL Editor — never run
-- programmatically against the shared production database.
--
-- TIMING (per the build brief S10): apply this BEFORE the S10 admin panel
-- ships AND BEFORE the /api/data-request stamp goes live; until the column
-- exists, the stamp would error (or be a silent no-op if pre-checked). Rows
-- without an erasure request stay NULL.
--
-- S8's delete-anonymise marks archived=true but carries no timestamp. This
-- adds the evidence trail: WHEN did we honour the visitor's "Delete my
-- conversation" request? Two reasons it is REQUIRED (not optional):
--   (a) GDPR accountability — must be able to evidence the moment an erasure
--       was honoured;
--   (b) S10 admin panel — reviewers reading '[deleted]' content must
--       distinguish "visitor exercised deletion on <date>" from data
--       corruption. Surface per-conversation via the sessions.id join.
--
-- Table = sessions, since anonymise is session-scoped (covers every
-- conversation on the session). No backfill: NULL means never erased.
--
-- NOTE on numbering: renumbered from "0005" to 0006 because S9 took 0005 for
-- briefs.brief_revision.

alter table concierge.sessions
  add column if not exists anonymized_at timestamptz;
