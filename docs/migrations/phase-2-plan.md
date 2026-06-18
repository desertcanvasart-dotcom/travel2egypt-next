# Phase 2 — Destination Architecture Design

**Session 50 · 2026-05-18 · design document (no system changed)**

This is the executable spec for **Phase 3** (structure build) and **Phase 4**
(content import). It builds on the Session 48 gap audit
([phase-1-gap-report.md](phase-1-gap-report.md)) and the Session 49 conflict-doc
dump ([session-49-conflict-docs.md](session-49-conflict-docs.md)).

**Backfill status — final.** The s50 plan carried `[OPERATOR INPUT PENDING]`
placeholders; all four design decisions are now **locked** and the plan carries
no remaining placeholders:

- **§2.2** `publishedAt` — **LOCKED**: do not add the field.
- **§2.6** front-matter → field mapping — **LOCKED**: reconciled against
  `docs/migrations/content-authoring-guide.md` (now committed to the repo).
- **§6.2** `wikiMonument` orphan-field disposition — **LOCKED**: carry 6 fields,
  drop 6, prosify the 4 dropped wiki cross-refs.
- **§6.3** `city.placesToGo` rework — **LOCKED**: re-point to `guideArticle`
  references filtered to `kind == "attraction"`.

Reconciling §2.6 against the authoring guide surfaced three guide ↔ plan/schema
conflicts; **all three were resolved in Session 52** (drop `publishedAt` from the
guide, fix the `wadi-el-natrun` slug, drop `kind=parent` 12 → 11) — see §11.4.

---

## §1. Executive summary

**Scope.** Migrate ~90 absent destination pages into `guideArticle`, consolidate
134 `wikiMonument` docs into `guideArticle`, merge 2 conflict docs into their
parent guides, build a bulk MD-import tool, and build + wire a redirect map for
all ~206 legacy destination URLs.

**Locked decisions carried into this plan** (from s48/s49 and the s50 addendum —
not revisited here):

1. All attraction pages live in `guideArticle` under `/guide/<city>/<slug>`.
2. The 134 `wikiMonument` docs consolidate into `guideArticle` (option A).
3. Trilingual from the start — EN/ES/JA required together.
4. 2 merge tasks: `wp-page-60303` → `nuweiba-travel-guide`,
   `wp-page-75692` → `safaga-travel-guide`.
5. 3 redirect-to-parent URLs stand: `cultural-events-in-nuweiba`,
   `annual-events-in-safaga`, `cultural-tours-in-taba`.
6. Sanity stays clean — no placeholder docs; "no content yet" is handled by the
   redirect map pointing at the parent city guide.
7. `kind` is a new 11-value enum on `guideArticle`.
8. `section` (existing 5-value enum) is **auto-derived from `kind`** at import —
   editors set only `kind`. (s50 addendum.)

**Key finding that shapes the plan:** the content model and routing are
**already built and generic** — adding destination content is a *content* and
*tooling* exercise, not a schema rebuild. The only schema change is one new
enum field. The redirect layer, by contrast, **does not exist at runtime** and
must be built from scratch.

**Expected effort:** Phase 3 ≈ **5–6 sessions** (schema, import tool, redirect
tooling + wiring, wikiMonument consolidation, merge tasks, `kind` backfill).
Phase 4 ≈ **7–11 sessions** (content import waves). See §9–§10.

---

## §2. Sanity content model

### §2.1 `guideArticle` as-is

Current fields ([src/sanity/schemas/guideArticle.ts](../../src/sanity/schemas/guideArticle.ts)):

| Field | Type | Notes |
|---|---|---|
| `parentCity` | reference → `city` | required ✓ — the city-reference mechanism already exists |
| `title` | `internationalizedArrayString` | required |
| `slug` | i18n-array (`localizedSlugField`) | one slug per locale; EN required |
| `section` | string enum (5 values) | sidebar grouping — see §2.4 |
| `orderRank` | number | display order within city |
| `summary` | `internationalizedArrayText` | one-sentence listing blurb — serves the "description" role |
| `body` | i18n portable text (`localizedPortableTextField`) | supports `block`, `image`, `pullQuote`, `sideImage` |
| `heroImage` | `localizedImage` | |
| `relatedTours` | array of reference → `tour` | |
| `seo` | `seo` object | |
| `migration` | `migration` object | WP provenance (`wpId`, `wpUrl`, `reviewFlag`, …) |

### §2.2 Required additions

| Addition | Detail | Severity |
|---|---|---|
| **`kind`** | New 11-value string enum (§2.3). Editorial taxonomy. Required. | Minor — additive |
| **`publishedAt`** | **LOCKED — do not add.** Sanity's built-in `_createdAt` / `_updatedAt`, plus the existing `migration.migratedAt`, cover display-date needs without editorial overhead. This is the lower-risk default; a dedicated `publishedAt` field can be added in a future schema session if a specific need surfaces. (`publishedAt` has also been dropped from the content-authoring-guide front-matter — s52 — so there is no longer a guide/schema conflict.) | Locked — don't add |

No other field additions are required for `guideArticle`. **No new document
types are needed.**

### §2.3 The `kind` enum — specification

`kind` is the editorial taxonomy. 11 values:

| `kind` | Meaning |
|---|---|
| `signature` | "Only here in X" — the destination's signature page |
| `attraction` | An individual monument / site / place |
| `transport-to` | How to reach the destination |
| `transport-around` | Getting around within the destination |
| `accommodation` | Where to stay |
| `food` | Where/what to eat |
| `tours` | Tours and activities |
| `events` | Festivals and events |
| `climate` | Weather / when to go |
| `heritage` | History and heritage |
| `overview` | "Places to go" / general destination overview |

**On parent destination guides.** A destination's parent guide is its **`city`**
document, served at `/guide/<city>` — it is not a `guideArticle` and has no
`kind`. City documents are operator-curated and are **not** created by the bulk
MD import. If a destination ever lacks one, the `city` doc is created directly
in Sanity Studio. (All 41 destinations — including Baris and Esna — already have
a `city` doc; see §11.) There is therefore no `kind=parent` value: the bulk
import only ever produces the 11 sub-page kinds above.

### §2.4 `kind` → `section` relationship (s50 addendum — locked)

Two fields, two jobs:

- **`kind`** — *editorial taxonomy*. Drives editorial discovery, the redirect
  map, and per-category migration batching. Editor-set (in MD front-matter).
- **`section`** — *UX grouping*. Drives the sidebar grouping on the city page
  (5 buckets). **Derived, never hand-set** going forward.

The bulk-import tool computes `section` from `kind` deterministically:

| `kind` | → `section` |
|---|---|
| `signature` | `others` |
| `heritage` | `introducing` |
| `transport-to` | `plan-your-trip` |
| `climate` | `plan-your-trip` |
| `transport-around` | `while-you-are-there` |
| `accommodation` | `while-you-are-there` |
| `food` | `while-you-are-there` |
| `tours` | `while-you-are-there` |
| `attraction` | `places-to-go` |
| `events` | `others` |
| `overview` | `others` |

This mapping is **not invertible 1:1** (`section=others` ← `events`,
`overview`, *or* `signature`; three `kind`s collapse to `while-you-are-there`).
That asymmetry is why the Phase 3 backfill of the 431 existing docs needs
per-doc judgment (§9).

### §2.5 Locale handling

All localised fields use the established i18n-array shape — an array with one
object per locale, keyed by `_key` (`en`/`es`/`ja`):

- `title`, `summary` → `internationalizedArrayString` / `internationalizedArrayText`
- `slug` → array of `{ _key, value: { _type: 'slug', current } }`
- `body` → array of `{ _key, value: [ …portable-text… ] }`

**The slug is one-per-locale but the path structure is shared** — there is no
per-locale *route* divergence beyond the slug string. EN is required; ES/JA fall
back to the EN slug if blank (per `localizedSlugField` validation). Writes must
use the raw `@sanity/client` so `_key`s are stored verbatim (s44 lesson).

### §2.6 Front-matter → Sanity field mapping

**LOCKED — reconciled against `docs/migrations/content-authoring-guide.md`**
(committed to the repo). The guide defines one MD file per (page, locale), each
with YAML front-matter (guide §4). The import tool assembles the i18n-array
fields by reading the three locale siblings for a slug.

| Front-matter field | Req? | → `guideArticle` field | Notes |
|---|---|---|---|
| `slug` | required | `slug` (i18n-array) | Same slug across all three locales (guide §11). EN required. |
| `city` | required | `parentCity` | Resolved: city-slug → `city` reference. |
| `kind` | required | `kind` | One of the 11 values; `section` derived from it (§2.4). |
| `locale` | required | *(selects the i18n `_key`)* | Determines which `en`/`es`/`ja` entry this file populates. |
| `title` | required | `title` (per-locale entry) | |
| `description` | required | `seo.metaDescription` (per-locale) | ~155-char SEO snippet — maps to the `seo` object, **not** `summary`. |
| *(`publishedAt` — removed)* | — | — | `publishedAt` was dropped from the authoring guide in s52; it is no longer a front-matter field. Per §2.2 there is no `guideArticle.publishedAt` either. |
| `heroImage` | optional | `heroImage` | Relative `./images/` path; uploaded to the Sanity CDN by the import tool. |
| `excerpt` | optional | `summary` (per-locale) | The listing/card blurb — this is what `guideArticle.summary` is for. |
| `keywords` | optional | `seo` keywords if the `seo` object supports a keyword field; else not persisted | 3c to confirm against the `seo` schema. |
| `lastUpdated` | optional | **— not persisted —** | No `guideArticle` field. Drop, or fold into `migration` metadata — 3c decides. |
| body markdown | — | `body` (MD → portable text) | `# H1` is disallowed by the guide; `title` is the H1. |

Fields **not** author-set (so absent from front-matter): `orderRank` (schema
default 100), `relatedTours`, and the §6.2 carried-over monument fields
(`monumentType`, `coordinates`, etc. — populated only by the §6 consolidation,
never by the MD import).

---

## §3. URL routing

### §3.1 `/guide/<city>/<slug>` — validated, documented as-is

- Route: `src/app/(site)/[locale]/guide/[citySlug]/[slug]/page.tsx`. SSG via
  `generateStaticParams` over all `guideArticle` slugs × locales.
- Rendering is **generic**: title, `summary`, `body`, `heroImage`, and a
  `CityGuideSidebar`. The page reads `section` only to print a breadcrumb label.

### §3.2 `kind`-aware rendering — design decision: **generic, no per-kind layouts**

`kind` is **metadata only**. The route renders every `guideArticle` identically
regardless of `kind`. This is a deliberate decision and matches how `section`
already behaves. Benefits: no routing work in Phase 3, attractions and food
pages and transport pages all share one validated template. If a future kind
ever needs a bespoke layout, that is a separate, additive change — Phase 2 does
not pre-build for it.

### §3.3 `/wiki/monuments/<slug>` during consolidation

`/wiki/monuments/[slug]` is a live SSG route today. As each `wikiMonument` is
consolidated into a `guideArticle` (§6), its monument URL must 301 to the new
`/guide/<city>/<slug>`. Because the wiki route is SSG, the redirect is wired in
the redirect layer (§3.4), **not** by deleting the route — the route can stay
until every monument is migrated, then be removed in a final cleanup.

### §3.4 404 handling and the redirect-map integration point

**There is no runtime redirect engine today.** `next.config.ts` has no
`redirects()`; middleware does only i18n + `noindex`. `migration/redirect-map.csv`
exists as data but nothing consumes it. Phase 3 must **build** the redirect
layer. Two options:

- **A — `next.config.ts` `redirects()`** generated from `redirect-map.csv` at
  build time. Simple, fast (edge-evaluated), but the redirect set is frozen per
  deploy and large lists inflate the config.
- **B — middleware lookup** against a compiled redirect table. Handles large
  sets and can be updated without a full rebuild, at a small per-request cost.

**Recommendation: Option A.** ~206 destination redirects + 134 monument
redirects + the existing 129 rows ≈ 470 entries — well within what
`redirects()` handles comfortably, and the destination URL set is stable once
Phase 4 completes. The redirect-map regenerator (§5) emits the `redirects()`
array as a generated file that `next.config.ts` imports.

---

## §4. Bulk content-import tool design

### §4.1 Purpose

Input: a tree of Markdown files authored per `content-authoring-guide.md`.
Output: `guideArticle` documents in the `migration-staging` dataset.

### §4.2 Input layout

```
content/destinations/<city>/<slug>.<locale>.md      e.g.
content/destinations/luxor/the-valley-of-the-kings.en.md
content/destinations/luxor/the-valley-of-the-kings.es.md
content/destinations/luxor/the-valley-of-the-kings.ja.md
```

One file per (slug, locale). The three locale files for a slug are siblings;
they share `city`, `kind`, `slug` and `orderRank`, and differ in `title`,
`summary` and body prose. (Final layout confirmed against the authoring guide.)

### §4.3 Components

1. **File walker** — globs `content/destinations/**/*.md`, groups files by
   `(city, slug)`, collects locale siblings.
2. **Front-matter parser** — YAML front-matter (use `gray-matter`, already a
   common dependency pattern; confirm or add). Produces a typed record per file.
3. **MD → Portable Text converter.** No MD→PT converter exists today; only
   `scripts/wp-import-html.ts` (HTML→PT). **Recommendation:** convert
   **MD → HTML** with a small dependency (`marked`), then reuse the existing,
   battle-tested `wp-import-html.ts` HTML→PT pipeline — it already emits the
   exact `block` / `image` / `pullQuote` / `sideImage` shapes the `body` field
   accepts. This avoids a second, divergent PT generator.
4. **Image uploader** — reuse `scripts/wp-import/media.ts` (uploads to the
   Sanity asset CDN, caches by source URL/hash).
5. **Sanity write loop** — raw `@sanity/client` (`createClient` +
   `.createOrReplace()` / `.patch().commit()`), the path `seed.ts` and
   `scripts/wp-import/sanity.ts` already use. Raw client stores `_key`/`_type`
   verbatim (s44 lesson — the MCP tool must not be used here).
6. **`section` derivation** — set `section` from `kind` via the §2.4 table.
7. **Validation** (import fails the file, with a reason, if any fail):
   - `kind` present and one of the 11 values.
   - EN locale file present (ES/JA optional but warned — §8).
   - `slug` present; `city` resolves to an existing `city` doc.
   - required fields per the authoring guide present.
8. **Idempotency** — deterministic `_id` derived from city+slug (or look up by
   slug). If the doc exists, `patch`; else `create`. Re-running the tool
   produces no duplicates.
9. **Error reporting** — a run summary: created / updated / skipped counts, and
   a list of skipped files each with its failure reason.

### §4.4 CLI shape

```
npm run import:destinations -- [--dry-run] [--city <slug>] [--only <slug>]
```

- `--dry-run` — parse, validate, convert, report; **no Sanity writes**.
- `--city` — limit to one destination (Phase 4 batching).
- `--only` — single slug (debugging).
Default: process the whole `content/destinations/` tree.

### §4.5 Build effort

≈ **1–2 sessions.** Most machinery is reusable (`wp-import-html.ts`, `media.ts`,
`sanity.ts`); the new code is the walker, front-matter parser, MD→HTML step,
`kind`→`section` derivation, and validation.

---

## §5. Redirect-map design

### §5.1 Source of truth — extend the existing file

`migration/redirect-map.csv` already exists (129 rows) with columns:

```
from_url,to_path,locale,status_code,legacy_wp_id,priority_score
```

**Use this schema — do not invent a new one.** It is already produced by
`scripts/wp-import/redirect-map.ts` (a redirect-map writer + priority scorer).
The s50-brief's proposed columns (`reason`, `source_doc_id`) are useful — add
them as **optional trailing columns** rather than restructuring:

```
from_url,to_path,locale,status_code,legacy_wp_id,priority_score,reason,source_doc_id
```

### §5.2 Population pipeline

For every legacy destination URL:

1. **`disposition=migrate` rows (inventory CSV).**
   - New target URL: from the per-destination xlsx `Best New URL` where
     present; else derive `/guide/<city-slug>/<slug>`.
   - If the new `guideArticle` **exists** in Sanity → `to_path` = that specific
     URL.
   - If **absent** → `to_path` = the parent city guide `/guide/<city-slug>`
     (the "no content yet" fallback — keeps Sanity clean, no placeholder docs).
2. **The 3 `redirect-to-parent` rows** — `to_path` = parent city guide.
3. **`wikiMonument` consolidation (134 docs)** — add
   `/wiki/monuments/<slug>` → `/guide/<city>/<slug>` for each consolidated doc.
4. **The 2 merge tasks** — add the old slug → the parent travel guide.

### §5.3 Update strategy

The map is **regenerated**, not hand-edited. As content lands in Phase 4, the
regenerator re-runs: a row whose target was the parent-guide fallback is
upgraded to the specific new URL once that doc exists in Sanity. So the map
converges from "mostly parent fallbacks" to "mostly specific URLs" as Phase 4
progresses.

### §5.4 Tooling

Extend `scripts/wp-import/redirect-map.ts` into a **regenerator** that:
- reads the inventory CSV + xlsx mappings + current Sanity state,
- computes `to_path` per §5.2 (specific URL if the doc exists, else parent),
- writes `migration/redirect-map.csv`,
- emits the generated `redirects()` array for `next.config.ts` (§3.4).

Effort ≈ **1 session** (the scorer and CSV writer already exist).

---

## §6. `wikiMonument` → `guideArticle` consolidation

> **⚠️ AMENDED (post-launch-planning).** The "then remove the `wikiMonument`
> docs" intent below is **superseded**. The wiki section is postponed, not
> cancelled, and a monument is meant to live in **both** `/guide/<city>/<slug>`
> and `/wiki/monuments/<slug>`. **Do not delete `wikiMonument` docs.** The
> consolidation's redirects + twin guide articles stand; the doc-removal step
> does not. See [`../wiki-section-launch-checklist.md`](../wiki-section-launch-checklist.md)
> for the full rationale and the launch-day step (remove the `/wiki/monuments/*
> → /guide/*` redirects before publishing the wiki section).

### §6.1 Scope

134 `wikiMonument` docs → 134 new `guideArticle` docs with `kind=attraction`.

### §6.2 Field mapping

**Clean 1:1 maps** (both schemas share the shape):

| `wikiMonument` | → `guideArticle` |
|---|---|
| `name` | `title` |
| `slug` | `slug` |
| `city` | `parentCity` |
| `summary` | `summary` |
| `body` | `body` |
| `heroImage` | `heroImage` |
| `relatedTours` | `relatedTours` |
| `seo` | `seo` |
| `migration` | `migration` |
| *(set)* | `kind = attraction`, `section = places-to-go` (derived) |

**Orphan-field disposition — LOCKED (Session 51).** The 12 `wikiMonument`
fields with no `guideArticle` equivalent are dispositioned as follows.

**Carry over** — added to `guideArticle` as **optional** fields in the Phase 3a
schema session. They sit unused on non-attraction `guideArticle` docs and carry
the consolidated monument data on `kind=attraction` docs:

| Field carried over | Type |
|---|---|
| `monumentType` | string enum (17 values) |
| `preciseLocation` | `internationalizedArrayString` |
| `coordinates` | `coordinates` object |
| `visitorInfo` | i18n portable text (`localizedPortableTextField`) |
| `gallery` | array of `localizedImage` |
| `featured` | boolean |

**Drop** — not carried as structured fields:

| Field dropped | Was | Reason |
|---|---|---|
| `builtBy` | → `wikiPerson` ref | wiki cross-ref |
| `builtDuring` | → `wikiDynasty` ref | wiki cross-ref |
| `buriedHere` | → `wikiPerson` ref | wiki cross-ref |
| `dedicatedTo` | → `wikiDeity` ref | wiki cross-ref |
| `relatedMonuments` | → `wikiMonument` refs | invalid post-consolidation — targets are removed |
| `relatedArticles` | → `article` refs | `article` type is being phased out |

**The 4 dropped wiki cross-refs are prosified, not lost.** During consolidation
the script reads each referenced `wikiPerson` / `wikiDynasty` / `wikiDeity`
document's name and **folds the fact into the `guideArticle` body as prose**
(e.g. "Built by Ramesses II during the Nineteenth Dynasty") **where that fact is
not already stated in the body**. Cases where it is unclear whether the body
already covers the fact — or which name form to use — go to an
**operator-review gate** rather than being auto-written.

`relatedMonuments` / `relatedArticles` are dropped outright with no prose fold —
post-consolidation, related-attraction discovery is served by the city page's
`kind=attraction` listing (§6.3).

### §6.3 `city.placesToGo` rework — LOCKED (Session 51)

`city.placesToGo` is an array of references **to `wikiMonument`**, rendered in
the city-page sidebar. Consolidating wikiMonument away breaks this field.

**Locked decision:** re-point `city.placesToGo` from `wikiMonument` references
to **`guideArticle` references, constrained to `kind == "attraction"`**. This is
a schema change on the `city` document type, handled in the **Phase 3a** schema
session alongside the `kind` addition. The existing reference *values* are
re-pointed during the §6.4 consolidation run — as each `wikiMonument` becomes a
`guideArticle`, every `placesToGo` entry that pointed at the old monument is
swapped for a reference to the new `guideArticle`.

### §6.4 Execution

Bulk transformation script: read each `wikiMonument`, create the
`guideArticle`, add the redirect row, **soft-archive** the source (set a
`migration.reviewFlag` / supersede marker — do **not** delete, so a rollback is
possible). Final hard-delete of `wikiMonument` docs is a separate, later step
after operator sign-off.

### §6.5 Edge cases

`wikiMonument.city` is a **required** reference, so every monument already has a
city — no ambiguous-city problem for the 134 (this was an open worry in the
brief; the schema resolves it). Ambiguity only arises for the 91 absent
*attractions* from the CSV that are authored fresh in Phase 4 (§11).

---

## §7. Merge tasks

Two `guideArticle` docs are merged into their parent city guides and retired.

### §7.1 `wp-page-60303` → `nuweiba-travel-guide`

- `cultural-events-in-nuweiba` (EN 1,872 / ES 2,139 / JA 852 chars; see s49).
- Append its body, per locale, into the `nuweiba` city doc's `overview` (or a
  dedicated section) under an appropriate heading.
- Add redirect `/cultural-events-in-nuweiba/` → `/guide/nuweiba` (301).
- Delete the source `guideArticle` (all locales live in the one i18n doc).

### §7.2 `wp-page-75692` → `safaga-travel-guide`

- `annual-events-in-safaga` (EN 2,475 / ES 2,808 / JA 1,076). Same pattern;
  parent is the `safaga` city doc.

### §7.3 Review gate

Both merges produce operator-visible content changes on the city pages →
**operator reviews the merged city-page body before publish.** Execute as one
focused Phase 3 session (≈ 0.5 session).

---

## §8. Translation handling in tooling

- **EN required**; ES + JA strongly expected (trilingual decision). The import
  tool imports an EN-only slug if that is all that exists, and **flags it**
  (`migration.reviewFlag = "locale-incomplete"`) for the translation queue.
- **Missing-locale behaviour at runtime** is already handled — ES/JA fall back
  to the EN slug and EN body via the established GROQ projection. No placeholder
  docs.
- **Per-locale slug variants are supported** by the schema (one slug per locale)
  but **the path structure is shared** — no per-locale routing divergence. If a
  locale slug is blank it falls back to EN.
- The translation-review queue (cumulative from prior sessions — s46 consent
  namespace, s47 cookie copy, and now any locale-incomplete imports) stays
  active; the import tool feeds it rather than blocking on it.

---

## §9. Phase 3 session plan

| # | Session | Scope | Depends on |
|---|---|---|---|
| 3a | Schema additions | Add `kind` enum to `guideArticle`; add the 6 carried-over optional fields from §6.2 (`monumentType`, `preciseLocation`, `coordinates`, `visitorInfo`, `gallery`, `featured`); re-point `city.placesToGo` to `guideArticle`/`kind==attraction` (§6.3); deploy schema | — |
| 3b | `kind` backfill | Backfill `kind` on the 431 existing `guideArticle` docs (see below) | 3a |
| 3c | Import-tool build | Build the bulk MD-import tool (§4) against the locked §2.6 mapping; confirm `keywords`/`seo` field details | 3a |
| 3d | Redirect tooling | Build the redirect-map regenerator + wire `next.config.ts` `redirects()` (§5, §3.4) | — |
| 3e | wikiMonument consolidation | Run the 134-doc transformation (§6) | 3a, 3c-ish |
| 3f | Merge tasks | Execute the 2 merges (§7) | 3a |

**`kind` backfill (3b)** — the 431 existing `guideArticle` docs have `section`
set but not `kind`, and `section`→`kind` is not 1:1:
- `section=places-to-go` → `kind=attraction` — clean, scripted.
- All other sections → slug-pattern heuristic (the s48 slug-variant inventory in
  §5 of the gap report is the input — e.g. `only-*` → `signature`, `how-to-go|
  reach|travel-to|ways-to-get` → `transport-to`, `weather|climate|temperature|
  when-to-go` → `climate`, etc.), with ambiguous docs flagged for operator
  review.
This is a Phase 3 sub-task, **not blocking** the Phase 2 plan.

3a → 3b are sequential. 3c and 3d can run **in parallel** with each other and
with 3b. 3e depends on 3a (and benefits from 3c's tooling). **≈ 5–6 sessions.**

---

## §10. Phase 4 session plan

Phase 4 is the content import itself.

- **First wave** — import the operator's already-authored content (the ~2,000
  destination docs reported ready) via the §4 tool, batched **per destination**
  (`--city <slug>`): one destination = one reviewable unit.
- **Batch order** — lead with the destinations carrying the largest s48 gaps
  (Farafra 8, Alexandria 7, Siwa 7, Al Minya 5, Bahariya 5, Marsa Alam 5,
  Qena 5) so the redirect map converges fastest off parent-fallbacks.
- **Per-batch gates:** dry-run → review skipped-file report → real import →
  spot-check rendered pages on Railway → re-run the redirect-map regenerator so
  the new specific URLs replace parent fallbacks.
- **Translation completeness** — each batch reports locale-incomplete slugs into
  the review queue (§8); the batch is not blocked on them.

**≈ 7–11 sessions**, consistent with the s48 estimate. The bulk is attraction
content (the 71 absent attractions + the 134 consolidated monuments).

---

## §11. Open-items tracker

| Item | Owner | Notes |
|---|---|---|
| `content-authoring-guide.md` | — | **Resolved** — committed to `docs/migrations/`; §2.6 reconciled against it. |
| `wikiMonument` orphan-field disposition | — | **Resolved** — §6.2: 6 carried, 6 dropped, 4 cross-refs prosified. |
| `publishedAt` field semantics | — | **Resolved** — §2.2: locked "do not add"; also removed from the authoring guide (s52, §11.4). |
| **D5 — Giza's 2 unspecified redirect pages** | Operator | Carried from s48 §6.4 — URLs still unidentified. |
| 91 absent attractions — city assignment | Phase 4 | Each absent attraction's `parentCity` is set from the inventory CSV `destination`; `biahmu` resolved to Al Fayoum (s48 §6.2). |
| 134 `wikiMonument` city assignments | — | **Resolved** — `wikiMonument.city` is a required ref; no ambiguity (§6.5). |
| Volume breakdown of the ~3,000 total docs | Operator | Only destination content is scoped here; other types (tours, hotels, articles, wiki) are out of Phase 2 scope. |
| Translation-review queue | Editorial | Cumulative; s46/s47 items + any locale-incomplete imports. |
| Session 47 cookie-policy reconciliation | — | **Resolved** — completed in s47; production-dataset boilerplate remains a cutover-sweep item only. |
| 2 duplicate `/fi/` rows in `migration/redirect-map.csv` | Backlog | Surfaced by s55: `/fi/kuinka-pukeutua-vieraillessa-egyptissa/` and `/fi/liikkuminen-egyptissa/` each appear twice in the baseline (pre-existing from the s48 writer). The s55 regenerator dedupes by `source` when emitting `redirect-map.generated.ts` (128 rows → 126 unique rules), so this does not affect runtime. Cleanup is a one-line dedup in the live-entries collection path of `scripts/wp-import/redirect-map.ts` — non-blocking, separate session. |
| `placesToGo` broken-ref scanner | Backlog | Surfaced by s57: the `CityGuideSidebar` renderer crashed when a `placesToGo[]->` projection yielded a null transient entry (GROQ deref of a ref whose target hasn't propagated to the read-CDN, or whose target was deleted). The defensive `.filter(Boolean)` (s57 step D, commit `9f15754`) keeps the renderer up but drops nulls silently — a stale or broken ref disappears without warning. **Backlog:** a small script (`scripts/audit-places-to-go-refs.mjs`) that walks every city's `placesToGo` array and reports refs whose target docs don't exist. Run before Phase 4 wrap; surface the list to the operator for re-curation in Studio. Non-blocking. |
| **Deferred tour migration** (Type 2 single tours + Type 3 category pages) | Tours-section session | Surfaced during the guide-MD bulk-upload prep. 16 single-tour `guideArticle` docs (e.g., `cairo-dinner-cruise-with-belly-dancing-show`, `royal-seascope-submarine-hurghada`) need migration to a proper `tour` doc type — they currently pollute city-guide sidebars but contain real product content that **must not be deleted**. 15 tour-category landing pages (`<city>-private-day-tours`, `<city>-small-group-day-tools`) need migration to a new `tourCategory` doc type with editorial intro + filtered tour listing, to preserve SEO equity and hand-written copy. Interim: a `hidden: boolean` field on `guideArticle` + sidebar query filter (~20-line change) keeps the single-tour docs out of sidebars during the wait. **Full plan + slug lists + schema sketch:** [`migration/deferred-tour-migration.md`](../../migration/deferred-tour-migration.md). |

### §11.4 Guide ↔ plan/schema conflicts — RESOLVED (Session 52)

Reconciling §2.6 against `content-authoring-guide.md` exposed three points where
the authoring guide and the plan/schema disagreed. **All three were resolved in
Session 52** — both documents now agree:

1. **`publishedAt`** — **Resolved.** The guide made `publishedAt` a *required*
   front-matter field, but §2.2 locks "no `publishedAt` schema field." `publishedAt`
   has been **removed from the authoring guide** (front-matter spec, required-field
   table, and example). Sanity's `_createdAt`/`_updatedAt` cover display-date needs.
2. **`wadi-al-natron` vs `wadi-el-natrun`** — **Resolved.** The guide's city-slug
   list spelled it `wadi-al-natron`; the `city` document's slug in Sanity is
   `wadi-el-natrun` (`wp-page-58731`). The **guide has been corrected** to
   `wadi-el-natrun`. A full 41-slug cross-check (s52 pre-flight) confirmed this was
   the *only* mismatch — the other 40 slugs match Sanity exactly.
3. **`kind=parent`** — **Resolved.** `kind=parent` has been **dropped entirely**
   (12 → 11 `kind` values) from both documents. A destination's parent guide is
   its `city` document at `/guide/<city>` — operator-curated, never bulk-imported
   (see §2.3). The bulk import only ever produces the 11 sub-page kinds.

### City-doc check (resolved this session)

All **41 destinations have `city` docs, including Baris and Esna** — the brief's
worry about missing city docs does not materialise. (Bahariya, Cairo, Luxor,
Qena additionally have stray `drafts.` siblings — cosmetic; clean up opportunistically.)

---

## §12. Risks and unknowns

| Risk | Impact | Mitigation |
|---|---|---|
| **`wikiMonument` consolidation drops the Egypt-Wiki graph** (`builtBy`/`builtDuring`/`buriedHere`/`dedicatedTo` links to person/dynasty/deity docs) | Low–Medium — structured links become prose | Locked (§6.2): the 4 cross-refs are prosified into body content during consolidation, with an operator-review gate for ambiguous cases. The structured graph is not preserved by design; the facts are. |
| **No MD→PT converter exists** | Low | Reuse `wp-import-html.ts` via an MD→HTML step (§4.3) — avoids a divergent generator. |
| **Redirect layer is greenfield** | Medium — SEO equity at stake until built | Session 3d builds + wires it before Phase 4 content lands; parent-fallback means every legacy URL 301s to *something* from day one. |
| **Bulk-write rate limits / Sanity API quotas** | Low–Medium — ~134 + ~2,000 writes | Throttle the write loop; batch per destination; the raw client + `createOrReplace` is idempotent so interrupted runs resume safely. |
| **Trilingual gaps** if the team delivers EN-only | Medium — locale-incomplete pages | Import proceeds EN-only with a `reviewFlag`; runtime EN-fallback keeps pages whole; queue tracks the debt. |
| **Image volume + CDN cost** | Low–Medium | `media.ts` caches by source hash (no re-upload); monitor Sanity asset usage during the first Phase 4 batch. |
| Guide ↔ plan conflicts (§11.4) | Resolved | All three (`publishedAt`, `wadi-el-natrun` slug, `kind=parent`) were resolved in Session 52 — guide and plan are aligned. |
| **431-doc `kind` backfill mis-assigns** | Low | `places-to-go`→`attraction` is exact; everything else is heuristic + operator review of ambiguous docs. |

---

## §13. Recommended next session

**Fire Phase 3a — schema additions — first.** It is the only hard dependency
for everything else (3b, 3c, 3e, 3f all need the `kind` field deployed). Its
scope is now fully specified and locked: add the `kind` enum, add the 6
carried-over optional fields (§6.2), and re-point `city.placesToGo` (§6.3).
Small, additive, low-risk — and it unblocks the most parallelism.

**3a has no remaining pre-conditions** — all four design decisions are locked,
and the three guide ↔ plan conflicts (§11.4) were resolved in Session 52. The
plan and the authoring guide are now fully aligned.

Once 3a lands, run 3b (`kind` backfill), 3c (import tool) and 3d (redirect
tooling) — 3c and 3d in parallel — then 3e and 3f.
