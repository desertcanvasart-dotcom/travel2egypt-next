-- 0003_escape_hatch.sql — escape-hatch logging (Session 5).
--
-- Applied MANUALLY by Islam via the Supabase Dashboard SQL Editor.
-- Adds the three escape-hatch columns to concierge.conversations. The
-- `flagged` / `flag_reason` columns already exist (from 0001) — the escape
-- hatch sets flagged=true, flag_reason='escape_hatch_used' in the route.
--
-- (This is the brief's "0002" escape-hatch migration, renumbered to 0003
-- because S3 used 0002 for the tour-context columns.)

alter table concierge.conversations
  add column escape_hatch_used   boolean default false,
  add column escape_hatch_action text,        -- controlled vocab: 'whatsapp' | 'forward' | 'continue' (last action)
  add column escape_hatch_at      timestamptz;

-- No index needed until the S10 admin panel filters on these; add one then
-- if escape-hatch filtering proves hot. Per-event analytics (Plausible) are
-- deferred — Plausible is not yet wired in the app; the columns are the
-- durable record meanwhile.
