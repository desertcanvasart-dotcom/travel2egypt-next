# Session 54 — `signature` → `others` section remap run log

**2026-05-19 · migration-staging · `scripts/session-54-signature-section-remap.mjs`**

## Mapping change

The `kind` → `section` mapping for `signature` changed (phase-2-plan.md §2.4):

```
signature:  introducing  ->  others
```

All other rows unchanged. Re-patch re-aligns the dataset to the new contract.

## Result

```
kind=signature published guideArticle docs: 28
section: patched 26 | skipped (already others) 2
failures: 0
```

Post-run verification (`migration-staging`): all **28** published
`kind=signature` `guideArticle` docs now have `section=others`
(distribution `{others: 28}`). 0 drafts in scope.

## Pre-flight (STOP gate)

- `kind=signature` published docs: **28** (matches s53 final distribution
  table; the brief's "~26" estimate was low — not a miscount).
- Pre-run `section` distribution: `introducing` 26, `others` 2 — the 2 at
  `others` were idempotently skipped.

## Part 2 — Abu Simbel `placesToGo` — NOT done (deferred)

The s54 brief also scoped a quick-fix appending 2 `wikiMonument` refs
(`the-small-temple-of-abu-simbel`, `qasr-ibrim`) to `abu-simbel`
(`city` doc `wp-page-56813`). Pre-flight found **neither doc exists** —
searched all 134 `wikiMonument` docs by slug and by name (incl. "Small
Temple", "Nefertari", "Hathor", "Ibrim"). Only 3 `wikiMonument` docs are
tied to Abu Simbel (Great Temple, Amada, Derr) and all 3 are already in
`placesToGo`. This hit the brief's STOP-DURING-SESSION trigger. Operator
decision: **drop Part 2, fold into the Phase 3d systematic wikiMonument /
city pass.** No `city` doc was touched this session.
