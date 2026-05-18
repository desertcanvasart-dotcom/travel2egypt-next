# Session 53 — `kind` + `section` backfill run log

**2026-05-18 · migration-staging · `scripts/session-53-kind-section-backfill.mjs`**

## Result

```
kind:    patched 431 | skipped (already set) 0
section: patched 141 | skipped (already set) 290
failures: 0
```

Post-run verification (`migration-staging`):

- 432 `guideArticle` docs total. **431 published all have `kind`.**
- `kind` unset on **1** doc only — `drafts.wp-page-60424` (`best-rosetta-tours`),
  the draft sibling of published `wp-page-60424`. Out of the 431-doc scope; its
  published version is classified `tours`. The draft picks up `kind` when next
  edited/published, or via a follow-up.
- **0** `guideArticle` docs without `section` (was 141 before this run).

## What ran

1. **`kind`** set on all 431 published `guideArticle` docs. Idempotent — would
   skip any doc already carrying a `kind` (none did; the field was new).
2. **`section`** set on the **141** docs whose `section` was `null`, derived
   from `kind` via the locked `kind` → `section` lookup. The **290** docs that
   already had a `section` were **not touched**.

## Final `kind` distribution (431 docs)

| kind | count | | kind | count |
|---|---|---|---|---|
| tours | 98 | | transport-to | 37 |
| accommodation | 48 | | signature | 28 |
| climate | 42 | | attraction | 25 |
| transport-around | 41 | | events | 16 |
| food | 41 | | overview | 15 |
| heritage | 40 | | | |

## Classification method

- 375 docs auto-classified by slug-pattern heuristic (GROQ `select()`).
- 56 docs reviewed at STOP GATE 2 and resolved explicitly: 20 → `attraction`,
  15 → `tours`, 7 → `accommodation`, 2 → `transport-around`
  (`how-to-get-around-*` — heuristic gap), 2 → `signature` (`*-only-here` —
  heuristic gap), 10 → `overview` (operator decision).

## Flags for later (non-blocking)

- **`ticket-prices-for-attractions-in-*` (9 docs) + `fayoum-horizons` (1)** were
  classified `kind=overview` per operator decision. None is a clean fit for the
  11-kind taxonomy — these 10 are **candidates for content reorganisation
  later**. Not blocking Phase 3.
- The 15 `tours`-classified "tour product" docs (`*-day-tours`, `*-show`,
  city-breaks) are arguably `tour`-type content living in `guideArticle`.
  `kind=tours` is correct within the taxonomy; whether they should move to the
  `tour` doc type is a separate, later question.
