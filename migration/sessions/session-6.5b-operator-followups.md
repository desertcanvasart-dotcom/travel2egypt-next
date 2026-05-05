# Session 6.5b — Operator follow-ups

These items don't block the Session 6.5b merge but should be addressed by the operator (Islam) at convenient intervals.

## Track 1: Travel-tips Studio editorial work

### A. Mark featured tips
The schema field `featured: boolean` was added in 8r-3b. Currently 0 of 30 tips have it set. The /travel-tips index page hides the featured strip cleanly when no tips are featured.

Recommended featured tips (canonical-essentials for first-time travelers): visa, currency, electricity, tipping, dress-code, when-to-go. Pick 6 once you've reviewed the catalog.

In Studio: open each chosen tip → Meta tab → check "Featured on travel-tips landing".

### B. Link related tips
Currently 0 of 30 tips have `relatedTips` populated. The /travel-tips/[slug] detail page hides the related-tips section cleanly when none are linked.

Recommended pattern: each tip should link to 3-5 related tips in the same category, plus 1-2 cross-category for breadth.

In Studio: open each tip → Content tab → relatedTips → reference picker → add 3-5 references.

### C. Optional editorial review of wadi-el-natrun city
The city slug was renamed during 8r-2c from `wadi-al-natron` to `wadi-el-natrun` (matches WP source). However, `name.en` is still `Wādī Al Natron`. Decision deferred:

- Option A: align name.en to `Wādī El Natrun` (matches new slug)
- Option B: align name.en to a third option (e.g., `Wadi El Natrun` without diacritics for cleaner rendering)
- Option C: leave as-is (name and slug are stylistically different but URL is the canonical reference)

In Studio: open the wadi-el-natrun city doc → name.en → revise.

## Track 2: Production cutover preparations

When ready to cut staging → production (Phase 11):

1. The .env.local override used during 8r-4 spot-check has been deleted. The production build will use `.env`'s `NEXT_PUBLIC_SANITY_DATASET=production`.
2. Production dataset is currently empty of cohort data (only 3 seed cities). The cutover involves promoting migration-staging to production — likely via Sanity's dataset replication, dataset rename, or fresh import to production.
3. Document the actual cutover procedure in a future Session 11 prompt.

## Track 3: Future prompt-engineering follow-ups (low priority)

### ESLint not runnable in this monorepo
Surfaced during 8r-3b Gate 8. The repo has no working `eslint.config.*` and the monorepo `node_modules` confuses Next's lint command. Future cleanup: install eslint in-tree or commit a working `eslint.config.js`. Not blocking; tsc and the test triad provide adequate static verification.

### TravelTipsSidebar.tsx active-category visual treatment
Landed during 8r-4 with underline-offset-4 + decoration-faience. If the sidebar grows in complexity (e.g., gets a search input or category filtering), consider if the underline pattern still scales. Not blocking.

### Migration log/redirect CSV churn
The migration/* CSVs and JSONL grew significantly during 6.5b (hundreds of lines). These are operational byproducts; future sessions can expect similar churn from re-emit work. Consider a dedicated `migration/.cache/runs/<session-id>/` directory pattern for run-specific log isolation if churn becomes confusing.
