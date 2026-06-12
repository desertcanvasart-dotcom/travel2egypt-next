-- 0005_brief_revision.sql — brief revision counter on concierge.briefs (Session 9).
--
-- Applied MANUALLY by Islam via the Supabase Dashboard SQL Editor — never run
-- programmatically against the shared production database.
--
-- TIMING (per the build brief S9): apply this BEFORE any briefs row is written
-- with a revision — i.e. before live S9 Phase 3 delivery — not earlier. The
-- /api/brief route writes `brief_revision` on every new briefs row from S9 on;
-- until this column exists that insert errors. The Autoura sender stamps the
-- revision (1 for a first brief; N+1 when a conversation already has N) and
-- carries it in the webhook payload + the (conversation_id, brief_revision)
-- idempotency key the receiver dedups on.
--
-- NOTE on numbering: the original brief called this "0003"; the repo took 0002
-- for tour-context, 0003 for escape-hatch, 0004 for rate-limit actions, so this
-- is 0005. S10's anonymized_at follows as 0006.

alter table concierge.briefs
  add column if not exists brief_revision int not null default 1;
