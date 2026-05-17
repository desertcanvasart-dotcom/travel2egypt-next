# Legacy page audit

Records decisions about legacy WordPress pages that are **not** carried
forward as routes in the Next.js rebuild — dropped, folded, or merged.
Each entry notes the cutover redirect so Tier 4B redirect work has a
single source of truth.

---

## /why-choose-us — DROPPED

**Decision:** kill the page. Content folds into `/about`, which now
includes the operational positioning previously planned for
`/why-choose-us` (the deliberate small-scale framing and the "how we
work now" specifics — see About v2, session 42).

**WP cutover redirect:** `/why-choose-us` → `/about` (301). Added to
`migration/redirect-map.csv` this session.

**Date of decision:** 2026-05-17 (session 42)
