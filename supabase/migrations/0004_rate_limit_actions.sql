-- 0004_rate_limit_actions.sql — generalize rate_limits to multiple operations (Session 7).
--
-- Applied MANUALLY by Islam via the Supabase Dashboard SQL Editor — never run
-- programmatically against the shared production database. Walkthrough in
-- 0004_rate_limit_actions.md.
--
-- Session 7 rate-limits not only chat but the expensive NON-chat operations
-- (brief extraction = a Sonnet call; resume + escape-hatch handoff = Resend
-- emails). Each becomes a separate fixed-window counter in
-- concierge.rate_limits, distinguished by a new `action` column. Pre-existing
-- chat counter rows default to 'chat', so the column is additive and safe.

alter table concierge.rate_limits
  add column action text not null default 'chat';
  -- controlled vocab: 'chat' | 'brief' | 'resume_email' | 'escape_hatch' | 'abuse'
  -- ('abuse' is the 3-strike session-termination tally, not a rate limit, but
  --  it is the same per-subject windowed counter, so it shares this table.)

-- Per-request counter reads are keyed by (subject, action, window_start):
--  • per-session limits (chat soft, brief, resume_email, escape_hatch) read by cookie_id
--  • the per-IP chat hard limit SUMs message_count by ip_hash within the hour
-- Two composite indexes serve those two access paths; the older single-column
-- rate_limits_cookie_id_idx (0001) is now redundant but left in place (cheap,
-- and dropping it is not worth a separate migration).
create index rate_limits_cookie_action_idx
  on concierge.rate_limits (cookie_id, action, window_start);
create index rate_limits_ip_action_idx
  on concierge.rate_limits (ip_hash, action, window_start)
  where ip_hash is not null;
