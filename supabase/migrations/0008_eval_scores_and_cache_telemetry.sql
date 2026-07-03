-- 0008_eval_scores_and_cache_telemetry.sql — production quality sampling +
-- prompt-cache telemetry (Harness Layer 3).
--
-- Applied MANUALLY by Islam via the Supabase Dashboard SQL Editor — never run
-- programmatically against the shared production database.
--
-- NOTE on numbering: 0007 is taken by the S13 portfolio-triage migration
-- (applied to production 2026-06-30 from branch feat/concierge-s13-portfolio-
-- triage, not yet merged) — hence 0008 even though 0007 is absent from this
-- tree.
--
-- TIMING: the Layer 3 code is deliberately fail-soft — /api/admin/quality-
-- sample returns 503 migration_0008_missing, the digest omits its two new
-- sections, and /api/chat falls back to inserting without the cache column —
-- so deploy order does NOT matter. Apply whenever convenient; the features
-- light up on the next cron run.
--
-- (a) eval_scores: one LLM-judge rubric score per sampled production
--     conversation (pacing / grounding / tone, 1-5 — same rubric as the
--     offline eval harness, scripts/concierge-eval/). Written by
--     /api/admin/quality-sample (Railway cron, daily, before the digest);
--     read by the digest. UNIQUE(conversation_id): a conversation is judged
--     once, ever — re-sampling would double-count drift metrics.
--
-- (b) messages.token_count_cache_read: the cache_read_input_tokens from each
--     real assistant turn. token_count_input already stores the FULL input
--     (uncached + cache_read + cache_write) for the S7 caps; this column
--     makes the cached share visible so the digest can compute the daily
--     cache-hit rate and flag a collapse (an invalidated v4.1 prefix shows up
--     as cost+latency, silently, today). NULL = pre-0008 turn or canned wrap.

create table if not exists concierge.eval_scores (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique
    references concierge.conversations(id) on delete cascade,
  -- The Cairo calendar day the sample covered (the digest joins on this).
  sampled_on date not null,
  judge_model text not null,
  pacing int not null check (pacing between 1 and 5),
  grounding int not null check (grounding between 1 and 5),
  tone int not null check (tone between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists eval_scores_sampled_on_idx
  on concierge.eval_scores (sampled_on);

alter table concierge.messages
  add column if not exists token_count_cache_read int;
