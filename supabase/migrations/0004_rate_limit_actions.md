# Migration 0004 — rate-limit actions (walkthrough)

**Who applies it:** Islam, manually, via Supabase Dashboard → SQL Editor.
**Apply BEFORE** the Session 7 rate-limiting code is exercised against the
live DB — the limiter writes/reads the new `action` column on every limited
request, so the chat route (and the brief/resume/escape-hatch routes) will
error until this is applied.

## What it adds

One column on `concierge.rate_limits`, plus two composite lookup indexes:

| Object | Detail |
|---|---|
| `action` | `text not null default 'chat'`. Controlled vocab (by comment, not a Postgres enum — like `flag_reason`): `'chat'` \| `'brief'` \| `'resume_email'` \| `'escape_hatch'` \| `'abuse'`. Distinguishes the per-operation fixed-window counters that now share this table. (`'abuse'` is the 3-strike session-termination tally — not a rate limit, but the same per-subject windowed counter.) |
| `rate_limits_cookie_action_idx` | `(cookie_id, action, window_start)` — serves the per-session counter read on every limited request. |
| `rate_limits_ip_action_idx` | `(ip_hash, action, window_start) where ip_hash is not null` — serves the per-IP chat hard-limit `SUM(message_count)` over the hour. |

The column is **additive with a default**, so any pre-existing rows (there are
none — the table was created empty in 0001 and unused until S7) become `'chat'`
automatically. No data backfill needed.

## Why a migration was needed (S7 finding)

0001's `rate_limits` modelled a single message counter (`message_count` +
`window_start`) with no way to say *what* is being counted. Session 7 limits
four distinct operations — chat, brief extraction (Sonnet cost), resume email,
escape-hatch handoff email (Resend cost) — in the same table. The `action`
discriminator lets one generic counter helper (`lib/concierge/rateLimit.ts`)
serve all four as `(subject, action, window)` rows. `cookie_id` stays
`NOT NULL`: every counter is keyed by a session; the per-IP chat check sums
existing `'chat'` rows by `ip_hash` rather than needing IP-only rows.

## How to apply

Dashboard → SQL Editor → paste `0004_rate_limit_actions.sql` → Run. The new
column + indexes inherit the table's existing grants + RLS automatically; no
"Exposed schemas" change needed (the schema is already exposed from 0001).

Verify:

```sql
select action, count(*) from concierge.rate_limits group by action;
-- runs without error (empty result set is fine on an unused table)
```

or check Table Editor → `concierge.rate_limits` → the `action` column is
present with default `'chat'`.

## Numbering note

0001 reserved no number for this; the brief's "later migrations" note (0002
escape-hatch, 0003 brief_revision) is stale — the repo took 0002 for
tour-context (S3) and 0003 for escape-hatch (S5), so rate-limit actions is
**0004**. Session 9's `brief_revision` becomes 0005.
