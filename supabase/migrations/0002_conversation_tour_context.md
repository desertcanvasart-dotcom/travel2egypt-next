# Migration 0002 — conversation tour context (walkthrough)

**Who applies it:** Islam, manually, via Supabase Dashboard → SQL Editor.

## What it adds

Two nullable columns on `concierge.conversations`:

| Column | Meaning |
|---|---|
| `tour_slug` | Canonical root slug of the tour the visitor arrived from (`?tour=` param, validated against Sanity server-side before persisting). |
| `tour_title` | The resolved, locale-correct tour title at attach time — denormalized so the runtime context block and the S10 admin panel don't need a Sanity round-trip. |

Semantics (locked at S3 kickoff):
- Attach/overwrite: a visitor arriving with `?tour=` mid-conversation updates
  the existing conversation's tour ref — most recent tour wins, history kept.
- Invalid/garbage slugs never reach these columns: the chat route resolves
  the slug against Sanity first and silently skips persistence on a miss.
- The columns feed the second system block (runtime context injection) in
  `/api/chat` — the locked v4.1 prompt is never edited.

## How to apply

Dashboard → SQL Editor → paste `0002_conversation_tour_context.sql` → Run.
No "Exposed schemas" change needed (the schema is already exposed); new
columns inherit the table's existing grants and RLS posture automatically.

Verify: Table Editor → `concierge.conversations` shows `tour_slug` and
`tour_title`; or SQL: `select tour_slug, tour_title from concierge.conversations limit 1;`

## Numbering note

The build brief originally reserved 0002 for the Session 5 escape-hatch
columns and 0003 for Session 9 `brief_revision`. Approved renumbering:
escape-hatch → `0003_escape_hatch.sql`, brief_revision → `0004_brief_revision.sql`.
