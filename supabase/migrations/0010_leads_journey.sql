-- 0010_leads_journey.sql — journey + style answer get their own columns
-- (journey pages Phase A, PR #212 follow-up, 2026-11-10).
--
-- Applied MANUALLY by Islam via the Supabase Dashboard SQL Editor — never run
-- programmatically against the shared production database. Safe to re-run.
--
-- TIMING: /api/lead is fail-soft on these columns. Until 0010 is applied the
-- insert retries without journey/style_answer (logged), and the team email
-- still shows both. Apply it before or right after the deploy.

-- 1. Columns.
--    journey      — journey key: first-time | cultural | family | desert | style | coming-back
--    style_answer — the raw answer: a JSON string (radio/text/days/ages) or a
--                   JSON array of strings (the Culture & history multi-select)
alter table concierge.leads add column if not exists journey text null;
alter table concierge.leads add column if not exists style_answer jsonb null;

-- is_test belongs to the plan-page test-mode follow-up (not merged yet). Added
-- here with IF NOT EXISTS so T2E-E5N7EH can be flagged now; the follow-up's
-- own migration must also use IF NOT EXISTS.
alter table concierge.leads add column if not exists is_test boolean not null default false;

create index if not exists leads_journey_idx on concierge.leads (journey) where journey is not null;

-- 2. Backfill: move journey / style answer out of utm (utm keeps only real
--    utm_* / gclid campaign tags). Rows written before this migration stored
--    them as utm.journey and utm.style_answer (a joined string).
update concierge.leads
set
  journey = coalesce(journey, utm->>'journey'),
  style_answer = coalesce(style_answer, case when utm ? 'style_answer' then to_jsonb(utm->>'style_answer') end),
  utm = utm - 'journey' - 'style_answer' - 'styleAnswer'
where utm ? 'journey' or utm ? 'style_answer' or utm ? 'styleAnswer';

-- 3. The journey-page QA lead sent before test mode existed.
update concierge.leads set is_test = true where reference = 'T2E-E5N7EH';

-- Check (expect: 1 row, journey = 'desert', style_answer = "Camping",
-- utm = {}, is_test = true):
-- select reference, journey, style_answer, utm, is_test from concierge.leads where reference = 'T2E-E5N7EH';
