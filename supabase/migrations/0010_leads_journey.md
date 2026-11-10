# Migration 0010 — leads: journey + style answer columns (walkthrough)

**Who applies it:** Islam, manually, via Supabase Dashboard → SQL Editor
(paste `0010_leads_journey.sql`, Run). Safe to re-run.

**When:** right after PR #212 deploys (or before — the API is fail-soft:
until the columns exist it stores the lead without them and logs it; the
team email always shows both).

## What it does

| Change | Notes |
|---|---|
| `journey text null` | journey key the form opened from (`first-time`, `cultural`, `family`, `desert`, `style`, `coming-back`) |
| `style_answer jsonb null` | the raw answer — a string (radio, text, days band, children's ages) or an array (Culture & history multi-select) |
| `is_test boolean default false` | from the plan-page test-mode follow-up (not merged yet); `IF NOT EXISTS` so both migrations can run in either order |
| Backfill | moves `utm.journey` / `utm.style_answer` into the new columns and removes them from `utm` — **1 row** at time of writing (T2E-E5N7EH) |
| `T2E-E5N7EH` → `is_test = true` | the journey-page QA lead of 2026-11-10 |

After this, `utm` holds only real campaign tags (`utm_*`, `gclid`).

The last line of the SQL file is a commented `select` to confirm the result.
