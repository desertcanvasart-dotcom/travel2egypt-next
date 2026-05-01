# Session 6 — Destination subpages migration

Handoff from session 5.5 (brand swap, completed 2026-05-01) to session 6
(largest cohort: 449 destination subpages). Read end-to-end before
kicking off.

## Brand locked confirmation

The brand is locked in main as of session 5.5 close. Session 6 ships
new templates against this locked brand, not against an in-flight one.
**No further visual restyling is expected during session 6** beyond
applying the existing brand vocabulary to new templates.

Locked artifacts (canonical reference: `migration/.brand-inputs/
travel2egypt-brand-inputs.md` + `migration/known-issues.md` "Session
5.5 close"):

- **Palette tokens** — `--color-{limestone,faience,sand,night,paper,
  rule}` and modifiers, declared in `src/app/globals.css` `@theme`.
- **Type system** — Cormorant Garamond + Inter (latin/latin-ext);
  Noto Serif JP + Noto Sans JP for JA. Fluid clamp() display scale,
  body sizes, letter-spacing, line-height tokens. Locale font override
  outside `@layer base` so it wins over Tailwind utilities.
- **Wordmark** — `src/components/Wordmark.tsx`, italic faience "2".
- **Components** — buttons (`.btn-primary` / `.btn-secondary`),
  SectionHeader (Roman numerals + faience italic accent),
  ConciergeCTA (reusable, supports `tourSlug` prop), ArticleCard /
  TourCard / PackageCard / GuideRefCard / WikiCard.
- **PortableText** (`src/components/Body.tsx`) — operator-note with
  italic faience eyebrow tone label, pull-quote with anchored faience
  opening mark, side-image, internal-link mark.

When building new templates, **reuse these components and tokens, do
not re-spec.** If a brand divergence is needed, surface for review
before implementing.

## Session-5-discovered defects to address before session 6 actual write

These were captured in session 5's known-issues; surface fresh at
session 6 start and resolve before writing 449 docs.

### `--filter-by-template` only narrows pages, not posts

The flag was scoped to filter `page` template values during dry-run
and ignored the `post` corpus entirely. Session 6 cohort is mixed:
city-detail subpages may live as either pages or posts depending on
WP origin, and the flag's incomplete scope would let the wrong corpus
slip through.

**Action**: extend `--filter-by-template` to apply to both pages and
posts, OR add a separate `--type=page|post|both` flag and surface a
WHERE-applied summary at the top of each dry-run.

**Captured in:** `migration/known-issues.md` (Q-block, session 5 close
section).

### `mergeArticleDoc` and `mergeGuideArticleDoc` parallels to `mergeCityDoc`

Session 5 implemented `mergeCityDoc` to protect editorial-only fields
during CREATE/UPDATE: WP-sourced fields overwrite, editorial-only
fields are preserved. Articles + subpages need the same protection
shape. Without it, session 6's actual write would clobber editorial
edits made between session-5-close and session-6-start.

**Action**: implement `mergeArticleDoc` and `mergeGuideArticleDoc`
following the `mergeCityDoc` pattern. Mirror the field classification
table in `scripts/wp-import/mappers/`.

**Captured in:** `migration/known-issues.md` "Session-5-discovered
defects" + Q3 (city UPDATE merge rule).

### 27 `*-egypt` deferred slugs from session 5 to triage at session 6 start

Session 5 deferred 27 slugs matching the `*-egypt` suffix overshoot
pattern. Each needs an explicit triage decision: keep, redirect, or
drop. Session 6 corpus may or may not include these depending on
post-type; either way, triage before write.

**Captured in:** `migration/known-issues.md` "*-egypt suffix rule
overshoots — session 5 discovery" + redirect-orphans.csv.

## Session-5.5-discovered out-of-scope items (carry forward)

These surfaced during the brand swap and were intentionally deferred.
Address opportunistically during session 6 or carry into 7+.

### Tour / wiki / packages list page templates still on legacy classes

Phase 2's class sweep was scoped to: components, city detail page,
homepage, blog landing, footer, header, locale switcher. The list-page
templates for tours, wiki (top-level + per-domain), and packages were
not swept and still carry `text-orange-deep` / `text-ink-soft` /
`bg-cream-deep` etc. classes. They render against the @theme aliases
correctly (palette is right) but the class names need replacement,
and the layout patterns (eyebrows, card aspect ratios, hover treatments)
need brand-spec alignment.

**Action**: include these templates in session 6's brand-application
pass when subpage templates are touched. Then remove the legacy aliases
from globals.css `@theme`.

### JA-locale Cairo slug 404s on staging

`/ja/guide/カイロ` returns 404 against migration-staging dataset
despite `api/locale-resolve/city` resolving the slug correctly.
Production has working JA Cairo. Pre-existing dataset issue, not
brand-swap-related.

**Action**: triage with migration scripts at session 6 start. May
indicate a slug propagation issue in the city import for JA-locale
slugs, or a dataset-state inconsistency. Verify before session 6
actual write reaches articles/subpages with JA slugs.

### Tour detail concierge CTA + section headers

The `ConciergeCTA` component supports `tourSlug` for per-tour context,
but no tour detail template exists yet to render it. Section header
pattern for tour pages is similarly unwired.

**Action**: when tour detail template is built (session 6 or 7),
render `<ConciergeCTA tourSlug={tour.slug} />` at page bottom and
apply `<SectionHeader>` to itinerary / inclusions / etc. blocks.

### "Recently designed trips" + Knowledge / Wiki sections from homepage v2

These two homepage v2 sections require:
- A homepage Sanity document (singleton) carrying the curated list of
  recent trips and the Knowledge anchors.
- Recent-trip fixture content (or real trip records).

**Action**: defer until both content shape is decided and a homepage
singleton schema lands. Session 6 may add the schema; population is
session 7+.

### Legacy aliases removal in `@theme`

The `cream`, `ink`, `orange`, `line`, `gold`, `terra` color tokens are
still alive in `src/app/globals.css` to keep unmigrated page templates
rendering. Remove them after the broader page-template sweep
(see "Tour / wiki / packages" item above) is complete.

## Pre-flight gates to run at session 6 start

Standing rules from session 5 close + 5.5 close. Run **all** before
any actual write:

1. **Worktree-CWD verification.**
   ```bash
   cd ~/t2e
   pwd
   git worktree list
   git branch --show-current
   git log --oneline -5
   node --version
   ```
   Confirm `pwd` = main worktree, branch = main, top commit is the
   session-5.5 merge or descendant.

2. **Brand-inputs path verification.**
   ```bash
   ls migration/.brand-inputs/
   ```
   Confirm 4 .md + 1 .html present (gitignored locally; if missing,
   re-copy from `~/Desktop/travel2egypt-brand/`). The brand documents
   must remain available during session 6 for spec lookups.

3. **Corpus-fact verification.** Re-run the entity-count GROQ probes
   from session 5. Confirm:
   - Cities: 41 (or whatever the canonical figure is at session 6
     start; cross-check `migration/known-issues.md` "Counts at
     session 5 close").
   - Articles: per session 5 final count.
   - Editorial-only fields on production cities (Cairo `placesToGo`,
     Key Facts) are still present and not overwritten.

4. **`tsc --noEmit` clean** before any new code lands.

5. **Drift-assertion baseline.** If session 5's drift assertion suite
   exists, run it against current main to confirm no regression
   introduced post-session-5.

6. **Create session 6 worktree + branch** per workflow rule 1, only
   after gates 1-5 pass.

## Cutover blockers timeline

DOC 1 carries the canonical Cutover Blockers table. Session 5 close
flagged production-only Cairo enrichments and tightened the deadline
from "session 9 close" to "session 8 close" so session 9 stays a
closeout buffer. Session 5.5 does not propose further tightening:
session 6 (449 subpages) is the largest write cohort but doesn't
itself open new blockers — it consumes the article merge rule
(`mergeArticleDoc` defect above) which is in-scope for session 6
implementation.

If session 6 surfaces new blockers, append them to known-issues
"Cutover Blockers" with owner + session 8 deadline.

## Notes for the session 6 brief author

- DOC 4 brief should reuse the Phase / STOP-gate structure from the
  session 5.5 brief — it worked well for staged review.
- Visual-review steps should be on `migration-staging` for the larger
  staging-only corpus; production is for hand-seeded content checks
  only.
- The `.env` toggle pattern (production ↔ migration-staging) is
  audited in surfaces; keep it as a discrete step in the brief.
- Methodology lessons 13 (framework version pinning) and 14
  (rendered-DOM vs HTML grep) from session 5.5 are now in
  `migration/known-issues.md` — reference them in standing-rules
  block at session 6 start.

End of handoff.
