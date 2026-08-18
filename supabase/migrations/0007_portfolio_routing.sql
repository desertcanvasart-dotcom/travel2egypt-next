-- 0007_portfolio_routing.sql — portfolio triage routing (Session 13).
--
-- Applied MANUALLY by Islam via the Supabase Dashboard SQL Editor — never run
-- programmatically against the shared production database.
--
-- TIMING (per the build brief S13): apply this BEFORE the v4.2 prompt ships
-- and BEFORE /api/brief is wired to write `routed_brand` — until the columns
-- exist, that update/insert errors. Existing rows backfill to the anchor via
-- the column default ('travel2egypt'), which is exactly the desired posture:
-- everything is Travel2Egypt unless explicitly routed.
--
-- WHAT THIS ADDS (the founder's spec, future-session-portfolio-triage.md):
--   conversations.routed_brand   — the lead's CURRENT room. MUTABLE: the
--                                  handoff is reversible (a customer can move
--                                  back to the house or be re-routed), and the
--                                  house always owns the relationship, so this
--                                  is a column on the conversation (the durable
--                                  lead), not a one-way value on the brief.
--   conversations.routing_reason — the 'why' behind the route, for admin
--                                  oversight + audit. Nullable.
--   briefs.delivered_brand       — an IMMUTABLE per-brief snapshot of where THIS
--                                  brief was actually delivered. A re-route
--                                  produces a NEW brief revision delivered to the
--                                  new endpoint; this preserves the true history
--                                  of every delivery target (pairs with the S9
--                                  brief_revision idempotency design).
--
-- CONTROLLED VOCABULARY mirrors the existing flag_reason pattern (0001): the
-- four family brands. 'travel2egypt' is the anchor/default.

alter table concierge.conversations
  add column if not exists routed_brand text not null default 'travel2egypt'
    check (routed_brand in ('travel2egypt','affordegypt','sawa','sillage')),
  add column if not exists routing_reason text;

alter table concierge.briefs
  add column if not exists delivered_brand text
    check (delivered_brand in ('travel2egypt','affordegypt','sawa','sillage'));

-- Admin oversight filters all leads by their room with a plain WHERE clause.
create index if not exists conversations_routed_brand_idx
  on concierge.conversations(routed_brand);
