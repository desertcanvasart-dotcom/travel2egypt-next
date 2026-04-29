# Session 5.5 — Brand swap (Ring 2)

Handoff from session 5 (city import + safety-net infrastructure) to
session 5.5 (brand swap). Read this end-to-end before kicking off.

## Scope confirmation

Ring 2 brand swap, **not** Ring 1. The distinction matters:

- **Ring 1 (visual-only)** — palette, logo, photography swap. Out of scope
  for 5.5. Will fold in once Ring 2 typographic foundations are stable.
- **Ring 2 (this session)** — typographic hierarchy, Portable Text rendering
  (pull-quote / side-image composition), heading scales, line-heights,
  spacing rhythm. The opinionated foundation that the Ring 1 visual layer
  later sits on top of.

Locked in session 5 as Q1 cutover decision (see `migration/known-issues.md`
"Cutover decisions made" → Q1).

## Content state at 5.5 start

The brand swap re-renders against the migrated content base — should not
require any content re-import.

| Type | Count | Notes |
|---|---:|---|
| `city` | 41 | All in `migration-staging`. 17 with hero image; 24 without. 40 flagged `keyfacts-mining-failed` (1 success: Sohag) |
| `article` | 495 | Imported across sessions 4 + 5 |
| `editorialCategory` | 19 | Two curated + WP-derived |

## Brand inputs status

Islam confirmed inputs ready at `~/Desktop/travel2egypt-brand/`:

- Final hex codes: 3 primary + 2-4 secondary
- Logo: SVG + PNG (with transparency)
- Font choices: keep current or replace (decision lives with brand inputs)
- 3-5 reference URLs (Black Tomato / Audley / Departures level)
- Existing brand guidelines doc
- Real Travel2Egypt photography (replaces Unsplash placeholders during /
  after migration)

**Pre-flight**: confirm Claude Code can access the Desktop path. May need
a symlink into the repo or a one-time copy into `migration/.brand-inputs/`
(gitignored) so the harness can read inputs without leaving the repo.

## Rendering edge cases discovered in session 5 Studio inspection

The brand swap needs to handle each of these gracefully — they are real
content states in `migration-staging` today, not hypotheticals:

1. **Cities WITH hero image vs. cities WITHOUT.** Both render paths must
   read well under the new brand. 17 of 41 cities have a hero; the other
   24 fall through to a hero-less treatment. Confirm both states get
   first-class design attention, not "with hero" as the canonical and
   "without" as a fallback afterthought.
2. **City list view shows region as raw slug.** E.g. `upper-egypt` instead
   of "Upper Egypt". This is a Studio preview-config issue (not a content
   issue — the data is correct, the display formatter is missing). Can be
   cleaned up either as part of the brand swap (probably the right home,
   since list-view styling lives there) or as a separate small commit
   before kickoff. Decide at 5.5 start.
3. **`keyFacts` populated on Sohag, missing on the other 40.** Front-end
   needs to handle both states. The 40 without `keyFacts` carry a
   `keyfacts-mining-failed` review flag. Do not let the brand-swap layout
   assume `keyFacts` is always present — design for the absence case.

## Pre-flight items for session 5.5

Run these before any component restyling:

1. **Confirm brand inputs accessible.** Verify the Desktop path is
   reachable from the worktree, or set up a symlink / repo-side copy.
2. **Lock font stack first.** Before touching components, decide the final
   font choices and load them once. Restyling components against an
   unstable font base wastes work — line-heights and spacing rhythm read
   differently per font, and "fix it later" doesn't survive the Ring 2
   workload.
3. **Capture before/after screenshots.** Save current-state screenshots of:
   - City list page
   - 1 city detail page WITH hero (e.g. Cairo, Aswan)
   - 1 city detail page WITHOUT hero (e.g. Bahariya Oasis)
   - 1 article (any)
   - Studio list view of cities (so we can spot the region-slug issue
     resolution)
   These become the baseline for the brand swap diff.

## Workflow rules carried in from session 5

These apply equally in 5.5 (per `migration/known-issues.md`):

1. **Worktree-CWD verification at session start.** First command:
   `pwd && git worktree list && git branch --show-current && git log --oneline -5 && node --version`.
2. **No actual writes to `migration-staging` content** — 5.5 is a
   front-end / Studio config session, not a content session. Any deviation
   should be surfaced for explicit direction.

## Out of scope for 5.5

Do not touch in this session:

- Content (no re-imports, no field edits in Studio)
- The migration scripts (`scripts/wp-import/...`)
- DOC 1 / DOC 3 (those fold in at session 6 prep, not at 5.5)
- Session-5-discovered defects (the `--filter-by-template` fix, the
  `mergeArticleDoc` work — those land at session 6 start)
