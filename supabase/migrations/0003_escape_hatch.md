# Migration 0003 — escape-hatch logging (walkthrough)

**Who applies it:** Islam, manually, via Supabase Dashboard → SQL Editor.
**Apply BEFORE** the Session 5 escape-hatch route is exercised — the route
writes to these columns.

## What it adds

Three columns on `concierge.conversations`:

| Column | Type / default | Meaning |
|---|---|---|
| `escape_hatch_used` | `boolean default false` | True once the visitor chose any of the three escape-hatch options. |
| `escape_hatch_action` | `text` (nullable) | The last option chosen: `'whatsapp'` \| `'forward'` \| `'continue'`. Controlled vocab by comment (not a Postgres enum — plain text, like `flag_reason`, so it's trivial to extend). |
| `escape_hatch_at` | `timestamptz` (nullable) | When the last escape-hatch action fired. |

`flagged` / `flag_reason` already exist (from 0001). The route additionally
sets `flagged = true`, `flag_reason = 'escape_hatch_used'` when the hatch is
used.

## Status check (verified 2026-06-10, before apply)

Confirmed against the live DB that these columns did **not** yet exist
(`escape_hatch_used/action/at` → PostgREST 400 "column does not exist"),
while `tour_slug` (0002) returned 200 — so 0001+0002 are applied and 0003 is
the only pending change. (This corrects an assumption that the columns were
"already added.")

## How to apply

Dashboard → SQL Editor → paste `0003_escape_hatch.sql` → Run. New columns
inherit the table's existing grants + RLS automatically; no "Exposed
schemas" change needed.

Verify: `select escape_hatch_used, escape_hatch_action, escape_hatch_at
from concierge.conversations limit 1;` (should run without error), or check
Table Editor → `concierge.conversations`.

## Numbering note

Brief reserved "0002" for escape-hatch; renumbered to 0003 (S3 took 0002 for
tour context). Session 9's `brief_revision` becomes 0004.
