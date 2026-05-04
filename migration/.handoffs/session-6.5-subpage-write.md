# Session 6.5 — Destination-subpage actual write

> **Status: 6.5a complete (2026-05-04). 6.5b ready to execute.**
>
> Session 6.5 has been split:
>
> - **6.5a (complete)** — preparation work merged. `travelTipCategory`
>   docs seeded; `travelTip` mapper + classifier rule + `MERGE_REGISTRY`
>   entry; 5 override maps for editorial routing; 4 investigations
>   resolved (33-vs-18 cohort, page-corpus article gap, topic-suffix
>   audit, `^egyptian-` audit). 261 test assertions green.
> - **6.5b (pending)** — actual **451-doc** write
>   (417 guideArticle + 30 travelTip + 4 article) + post-write drift
>   assertion + close-to-session-7 handoff. See
>   [`session-6.5b-actual-write.md`](session-6.5b-actual-write.md) for
>   the canonical 6.5b input.
>
> Final cohort numbers, decision log, override maps, and methodology
> lessons (18, 19, 20) live in `migration/known-issues.md` "Session 6.5a
> close" section. Trust that file over this brief for cohort numbers
> if they differ.

Handoff input from session 6 close (2026-05-03).

**Scope:** 449 destination-subpages → `guideArticle`, plus 17–18
country-level slugs → `travelTip` (new mapper), plus 2 cutover redirects
(+ 1 conditional). Editorial-field protection via `applyMerge` dispatcher
landed in session 6.

**Out of scope:** schema changes (other than registering travelTip in
MERGE_REGISTRY); brand sweeps; non-subpage migrations.

---

## Pre-flight defects landed in main

Session 6 (pre-flight only) shipped these as preconditions for 6.5:

| Commit | Defect resolved | Why it matters for 6.5 |
|---|---|---|
| `038649e` | `--filter-by-template` posts narrowing | 6.5 invokes wp-import with `--type page` (or `--type both`) — without this fix, categories + posts would have run unfiltered alongside the page-narrowed write, the session 5 Step 8 trap. New `--type=both` value supports running pages + posts together with template narrowing applied symmetrically. |
| `72b8840` | `mergeArticleDoc` + `mergeGuideArticleDoc` + `applyMerge` dispatcher + registry | 6.5's 449-doc write goes through `persistResult`; `isMergeableType('guideArticle')` returns true so the registry routes through `mergeGuideArticleDoc` and editorial-only fields (`section`, `orderRank`, `relatedTours`, `seo`) are preserved on UPDATE. Article writes (if 6.5 touches any) similarly protected. |
| `4b5d3a3` | 27 `*-egypt` deferred slugs triage resolved | Decision artifact at `migration/.diffs/destination-hub-misclassified-resolved.md` — canonical input for the 17–18 travelTip cohort + 2 reaching-{siwa,sohag} guideArticles + 2 cutover redirects. |
| (merge SHA) | All three commits merged to main at session 6 close | See `git log --oneline` post-merge. |

---

## Field classification tables

Source of truth: `scripts/wp-import/merge.ts` constants. Reproduced here
for handoff-self-containedness; if these diverge from the file, trust
the file.

```ts
ARTICLE_EDITORIAL_ONLY_FIELDS = [
  'author', 'category', 'featured', 'updatedAt',
  'relatedArticles', 'relatedTours', 'relatedCities',
] as const;

GUIDE_ARTICLE_EDITORIAL_ONLY_FIELDS = [
  'section', 'orderRank', 'relatedTours', 'seo',
] as const;
```

**`travelTip` field classification (pre-staged proposal — not yet
registered, see Prerequisite 3 below):**

```ts
TRAVEL_TIP_EDITORIAL_ONLY_FIELDS = [
  'category', 'relatedTips', 'seo',
] as const;
```

`category` editorial-only by methodology lesson 15 — mapper-produced
acknowledged-default, editorial reassignment canonical. `relatedTips`
and `seo` mapper-not-produced.

Reasoning principle (lesson 15): mapper output is acknowledged-default,
not canonical assignment. Editorial Studio work is canonical authority.

---

## 27-slug triage outcome

**Canonical artifact:** `migration/.diffs/destination-hub-misclassified-resolved.md`.

Per-slug routing summary (consume the file for full table + body
sample for `about-egypt` + cross-references):

- **2 → `guideArticle`**: `reaching-siwa-egypt` (siwa, plan-your-trip),
  `reaching-sohag-egypt` (sohag, plan-your-trip)
- **15 → `travelTip` (unconditional)** across 6 category buckets:
  `getting-around` (×2), `practical-essentials` (×6), `culture-and-money`
  (×4), `when-to-go` (×2), `food` (×1), `traveler-segments` (×2)
- **1 → `travelTip` (conditional)**: `currency-in-egypt` —
  if post-strip body ≥ 3,000 chars; else falls through to redirect
- **2 → cutover redirect, no migration**: `hassle-free-egypt` →
  `/tours/`; `about-egypt` → `/` (D2 default; editorial deferred)
- (5 tour rows defer to session 8)

---

## Critical session 6.5 prerequisites

Four prerequisites must land before the 17–18 travelTip writes execute.
Item 4 also affects the guideArticle cohort.

### Prereq 1 — `travelTipCategory` docs (Approach A recommended)

`travelTipCategory` referenced from `travelTip.category` ([travelTip.ts:69](../../src/sanity/schemas/travelTip.ts:69)).
**No category docs exist** in either production or migration-staging.
The schema does NOT mark `category` required (no `Rule.required`), so
two approaches:

- **Approach A (recommended):** Pre-create the 6 category docs in 6.5
  pre-flight. Author EN/ES/JA names + slugs for `getting-around`,
  `practical-essentials`, `culture-and-money`, `when-to-go`, `food`,
  `traveler-segments`. Then the travelTip mapper outputs reference them
  by `_id`. ~30 minutes of authoring.
- **Approach B (fallback):** Write travelTips with `category` omitted.
  Editorial Studio post-cutover triages each into a category once those
  are authored.

A is cleaner; B is faster if pre-flight is time-constrained.

### Prereq 2 — `travelTip` mapper

**No mapper exists.** Session 6.5 must add `scripts/wp-import/mappers/travelTip.ts`
following the field-level i18n pattern of `guideArticle.ts` /
`city.ts`. Required behavior:

- `_id = wp-page-${en.id}` (deterministic from WP id)
- `_type = 'travelTip'`
- `title`, `slug`, `summary`, `body` as i18n arrays per the schema's
  `internationalizedArrayString` / `internationalizedArrayText` /
  `localizedPortableTextField` types
- Optional `category` reference (gated on Prereq 1)
- `migration` provenance via `buildMigrationMeta`
- Apply `tourPromo` / `categoryGrid` strip rules during HTML→PT —
  load-bearing for D4 `currency-in-egypt`'s post-strip body length check
- Honor D4's 3,000-char fallback: emit a warning + skip writing if
  post-strip body for `currency-in-egypt` falls below threshold; surface
  in run summary so 6.5 author can flag for redirect-map

Wire into `wp-import.ts`'s `importPages` dispatch alongside the existing
`destination-subpage` → `mapGuideArticle` route.

### Prereq 3 — `MERGE_REGISTRY` entry for `travelTip`

Without registration, `isMergeableType('travelTip')` returns false and
the dispatcher silently bypasses merge protection
(see session 6 close — registry-gate failure mode is acceptable
*because* the standing pattern requires explicit registration; the
discipline is the safety, not the code).

In `scripts/wp-import/merge.ts`:

```ts
export const TRAVEL_TIP_EDITORIAL_ONLY_FIELDS: readonly string[] = [
  'category', 'relatedTips', 'seo',
] as const;

export function mergeTravelTipDoc(
  existing: SanityDoc | null,
  wp: SanityDoc,
): { merged: SanityDoc; perFieldChanges: PerFieldChange[] } {
  return mergeCityDoc(existing, wp, TRAVEL_TIP_EDITORIAL_ONLY_FIELDS);
}

const MERGE_REGISTRY: Record<string, readonly string[]> = {
  city: CITY_EDITORIAL_ONLY_FIELDS,
  article: ARTICLE_EDITORIAL_ONLY_FIELDS,
  guideArticle: GUIDE_ARTICLE_EDITORIAL_ONLY_FIELDS,
  travelTip: TRAVEL_TIP_EDITORIAL_ONLY_FIELDS,  // ← add this line
};
```

Add a `merge-dispatch.test.ts` triad for `travelTip` matching the
article + guideArticle pattern (Q3 sub-decisions; persistResult
end-to-end with clobber-semantics mock; fingerprint discrimination).

### Prereq 4 — Scope flag invocation

Use `--slug-include` (comma-separated exact list) to scope to the exact
17–18 travelTip slugs from `resolved.md`'s routing table. This avoids
re-triggering the *-egypt misclassification trap.

Suggested invocation pattern (6.5 author refines):

```bash
npm run wp-import -- \
  --type page \
  --slug-include "airports-in-egypt,transportation-in-egypt,electricity-in-egypt,wifi-in-egypt,telephones-in-egypt,time-in-egypt,language-in-egypt,toilets-in-egypt,bargaining-in-egypt,tipping-in-egypt,touts-in-egypt,cultural-etiquette-in-egypt,ramadan-in-egypt,month-by-month-guide-to-egypt,culinary-journey-in-egypt,solo-woman-traveler-in-egypt,vegetarian-travelers-to-egypt,currency-in-egypt" \
  --dry-run
```

Alternative: extend `scripts/wp-classifier.ts` with a `travelTip`
PageType + the suffix/prefix rules from `destination-hub-misclassified-deferred.md`
heuristic notes block, then use `--filter-by-template travelTip --type page`.
Heavier but reusable across future re-imports.

For the 449 guideArticle cohort, the existing classifier already routes
`destination-subpage` correctly. Suggested:

```bash
npm run wp-import -- \
  --type page \
  --filter-by-template destination-subpage \
  --dry-run
```

`--type page` is **required** when `--filter-by-template` is set (Phase 1
fix). `--type=page` (equals form) does NOT parse — use space-separated.

---

## Pre-flight gates to run at session 6.5 start

Standing pattern from session 5 / 5.5 / 6. Run **all** before any actual
write:

1. **Worktree-CWD verification:**
   ```bash
   cd ~/t2e
   pwd && git branch --show-current && git log --oneline -5
   git worktree list && node --version
   ```
   Confirm main at session-6-merge-SHA or descendant.

2. **Brand-inputs path verification:**
   ```bash
   ls migration/.brand-inputs/
   ```
   Expected 4 .md + 1 .html. If missing, `cp ~/Desktop/travel2egypt-brand/* migration/.brand-inputs/`.

3. **Corpus-fact verification — direct curl, no .env toggle** (cleaner
   pattern from session 6):
   ```bash
   for q in 'count(*[_type=="city"])' 'count(*[_type=="article"])' \
            'count(*[_type=="guideArticle"])' 'count(*[_type=="travelTip"])' \
            'count(*[_type=="travelTipCategory"])' \
            'count(*[_type=="editorialCategory"])'; do
     enc=$(printf '%s' "$q" | jq -sRr @uri)
     printf '%-50s → %s\n' "$q" "$(curl -s "https://ufallvd2.api.sanity.io/v2024-12-01/data/query/migration-staging?query=$enc" | jq -c '.result')"
   done
   ```
   Expected (per session 6 close): cities 41, articles 495, guideArticle 0,
   travelTip 0, travelTipCategory 0 (or 6 after Prereq 1), editorialCategory 21.

4. **Drift assertion baseline** — fresh worktree → cold cache → expected
   false-positive drift on hero asset refs per session 6 close
   "Cold-cache vs. hot-cache asset ref divergence" operational note.
   **Document the false-positives explicitly in the 6.5 surface** rather
   than treating as a defect. Real drift assertion comes after the 6.5
   actual write (cache hot at that point).

5. **`tsc --noEmit` clean** before any new code lands (Prereq 2 + 3 work
   triggers a fresh check).

6. **Create session 6.5 worktree + branch** per workflow rule 1.

---

## Expected scope

| Cohort | Source | Target | Editorial-field protection |
|---|---|---|---|
| 449 destination-subpages | WP `page` classified `destination-subpage` | `guideArticle` | `mergeGuideArticleDoc` (already in `MERGE_REGISTRY`) |
| 17 unconditional country-level slugs | WP `page` (currently misclassified `destination-hub`) | `travelTip` (new mapper) | `mergeTravelTipDoc` (added to `MERGE_REGISTRY` as Prereq 3) |
| 1 conditional country-level slug | `currency-in-egypt` | `travelTip` if post-strip body ≥ 3,000 chars; else redirect | same as above |
| 2 cutover redirects | `hassle-free-egypt`, `about-egypt` | manual-redirects.csv (session 9 step 13 mechanism) | n/a |

---

## Out-of-scope items still carrying forward

From session 5.5 + session 6:

- **Tour / wiki / packages list page brand sweep** — opportunistic during
  6.5 if natural; otherwise post-cutover. Legacy classes still in those
  templates; legacy aliases in `globals.css` `@theme` cannot be removed
  until the sweep lands.
- **Region values on remaining staging cities** (Siwa, Sharm El Sheikh,
  Hurghada, Alexandria) — opportunistic during 6.5 city update if any
  city work happens incidentally; otherwise carry to session 7+.
- **JA-locale Cairo slug 404 triage on staging** — pre-existing dataset
  issue. Not blocking 6.5 write; flag if it surfaces during 6.5 verification.
- **Legacy alias removal in `@theme`** — depends on broader page-template
  sweep above.
- **"Recently designed trips" + Knowledge / Wiki sections from homepage v2**
  — depends on real content + a homepage Sanity document; defer to
  session 7+.

---

## Cutover blockers timeline

Session 8 close deadline for production-only city enrichments still
holds. Session 6.5 (449-doc write) is the largest cohort but does not
itself open new blockers — it consumes the merge protection landed in
session 6. Per session 6 close, no tightening to the timeline.

---

## Methodology lessons in force

All 17 lessons from sessions 4–6 in `migration/known-issues.md`
"Methodology lessons (carry forward)". Particular attention for 6.5:

- **Lesson 8** — Safety-net components must share runtime code with the
  operation they protect. (For travelTip: register in MERGE_REGISTRY.)
- **Lesson 9** — Every safety-net component requires its own integration
  test triad. (For travelTip: 7 test assertions matching the
  merge-dispatch.test.ts pattern from session 6.)
- **Lesson 12** — Post-write drift assertion as standing protocol. (For
  6.5: run drift after the actual write, with hot cache.)
- **Lesson 15** — Field classification is about provenance authority, not
  mapper output. (For travelTip: `category` is editorial-only.)
- **Lesson 16** — When classifier output conflicts with schema reality,
  schema wins. (Already applied in resolved.md routing.)
- **Lesson 17** — Drift signals require root-cause investigation before
  remediation. (For 6.5: cold-cache false-positives are environment-
  introduced, not code-introduced — distinguish before remediating.)

---

## End of handoff

Session 6.5 brief author: build Phase / STOP-gate brief mirroring the
session 5.5 / session 6 structure. Phases anticipated:

- Phase 0 — pre-flight gates (above)
- Phase 1 — Prereq 1 (travelTipCategory docs) + Prereq 2 (travelTip mapper)
- Phase 2 — Prereq 3 (MERGE_REGISTRY + tests for travelTip)
- Phase 3 — guideArticle 449-doc dry-run-diff-only validation against
  staging (with the post-Phase-2 merge protection in place)
- Phase 4 — actual write: guideArticles + travelTips, in that order
- Phase 5 — post-write drift assertion (hot cache, expected 0 changed
  lines for the merged cohort)
- Phase 6 — session close + handoff to session 7

Final scope and STOP gates per 6.5 brief author judgment.
