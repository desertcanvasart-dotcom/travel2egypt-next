-- 0002_conversation_tour_context.sql — tour-context entry point (Session 3).
--
-- Applied MANUALLY by Islam via the Supabase Dashboard SQL Editor.
-- Adds the persisted tour reference for conversations that started from (or
-- later attached) a tour page via /plan-your-tour?tour=<slug>. Metadata, not
-- conversation content — kept as columns so the S10 admin panel can filter
-- by tour with plain WHERE clauses.
--
-- NOTE: this renumbers the brief's migration plan (approved at S3 kickoff):
-- escape-hatch columns (S5) become 0003, brief_revision (S9) becomes 0004.

alter table concierge.conversations
  add column tour_slug  text,
  add column tour_title text;

-- Most-recent-tour-wins on overwrite (S3 decision 5); no index needed until
-- the admin panel ships — add one in S10 if tour filtering proves hot.
