# Journey publish-gap (C1) — findings & disposition (production, 2026-07-08)

## TL;DR
**The stuck-hero publish gap is already fully closed in `production`.** The Batch-0 audit
(migration-staging) counted ~110 draft-only-hero tours; prior sessions (the internal-linking
tranche + tour dedup + cutover) published them. Today there are **39 draft `tour` docs**, and
**none is a safe hero-surfacing publish**. Verified breakdown:

| Bucket | Count | Disposition |
|---|---|---|
| **HERO_ONLY** (draft adds only a hero) | **0** | — gap closed |
| **IDENTICAL** (draft == published on all content) | **4** | Stale drafts. Publishing = no live change; discard = tidy Studio. Safe either way. |
| **OWNER_EDITED** (real content diffs vs live) | **1** | `wp-page-89619` — owner WIP (body/days/slug/summary/theme/title/relatedTours differ). **Leave for owner.** |
| **NEW_DRAFT** (no published counterpart) | **34** | **Dedup-superseded duplicate drafts.** Each shadows a live `tour.*` canonical. **Do NOT publish** (would create duplicate live tours). Candidates for discard. |

Method: `scripts/journey-publish-gap-classify.ts` (deep field diff, drafts vs published, excludes
`_`-prefixed system keys incl. the API-injected `_system{base:{rev}}`). Raw bucket table:
`docs/journey-publish-gap-2026-07-08.md`.

## Why the 34 NEW_DRAFT are dedup residue (not missing tours)
- They carry full localized slugs (en/es/ja) and heroes but have **no published counterpart** at
  their own `_id`.
- **33 of 34** have redirect rows in `migration/redirect-map.csv` — their old WP URLs already
  **301 to the canonical tour slug**. Example: `drafts.wp-page-88607` (enSlug
  `abu-simbel-by-plane-from-aswan`) is shadowed by the live `tour.abu-simble-by-plane-from-aswan`
  ("Abu Simbel by Plane from Aswan: A Morning with Ramses II").
- The **1** without a redirect row — `wp-page-115168` ("Dolphins Dance Group…", enSlug
  `shared-seas-full-day-snorkeling-tour`) — is still a duplicate: shadowed by the live
  `tour.dolphins-dance-group-shared-seas-full-day-snorkeling-tour` ("Dolphins Dance: A Shared
  Full-Day Snorkel from Hurghada").
- Zero of the 34 are referenced by any published landing/tour.

This matches the recorded dedup state: SET A/B/C/D old→keeper dedup was applied to prod, keepers
republished as clean `tour.<slug>` canonicals, WP originals unpublished + 301'd — leaving these
slug-bearing **draft shells** behind.

## Recommendation
1. **Publish: nothing.** No draft surfaces a hero or other value; publishing the 34 would create
   duplicate live tours.
2. **Discard (cleanup, reversible via backup): the 34 dedup duplicates + the 4 stale IDENTICAL
   drafts = 38 drafts.** This removes the draft indicators in Studio and eliminates the risk of a
   future accidental "Publish" surfacing a duplicate. A rollback JSON of every discarded draft is
   written to `backups/` first.
3. **Leave: `wp-page-89619`** (owner WIP) untouched.

Discarding is a destructive op on live data (even with backup), so it awaits owner go-ahead.
If preferred, the drafts can simply be left in place — they are inert (unpublished, unreferenced,
old URLs already redirected) and harmless beyond Studio clutter.
