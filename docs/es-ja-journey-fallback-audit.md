# ES/JA fallback audit — journey-system editorial surfaces

**Status:** audit only, no content written. Branch `audit/es-ja-journey-fallbacks`.
**Method:** i18n key-parity scan (es/ja vs en) across journey namespaces; Sanity
field-population queries (`defined(field[_key=="es"|"ja"])`) per doc; live render
confirmation on `/ja` (ASCII = English fallback) + `pt::text` char counts for sizing.
Per docs/journey-system-rules.md §8, es/ja coalesce to en until localized.

## Headline

- **Source (a) — i18n chrome keys missing es/ja: ZERO.** All six namespaces the
  journey views use are fully translated: tourSystem (256), dayTours (22), archive
  (4), subcategory (23), nav (17), tour (25) — 0 en-fallback in es and ja. Nothing to
  draft on the i18n side.
- **Source (b) — Sanity content fields empty es/ja → coalescing to en: this is the
  entire problem.** Every English element on /es and /ja traces to an unlocalized
  Sanity field.
- es and ja fall back on the **same fields** (the locale arrays are empty for both),
  so the inventory below applies to both locales unless noted.

## Source (a): i18n keys — NONE

No journey-chrome key falls back. (Confirmed: 0/256 tourSystem, 0/22 dayTours, 0/4
archive, 0/23 subcategory, 0/17 nav, 0/25 tour.)

## Source (b): Sanity content fields falling back

### Category pages

| Page | Doc | Field path | en | es/ja | Notes |
|---|---|---|---|---|---|
| /private-day-tours | dayToursArchive | `mastTitle` | ✓ | ✗ | translated i18n `dayTours.landingTitle` exists but is **preempted** by en-coalesce |
| | | `tagline` (131 ch) | ✓ | ✗ | i18n `tourSystem.mastKicker`/`dayTours.landingDeck` preempted |
| | | `kicker` | ✓ | ✗ | i18n `tourSystem.mastKicker` preempted |
| | | `essay` (1021 ch, philosophy) | ✓ | ✗ | **long-form** |
| | | `navigator.heading` | ✓ | ✗ | i18n `tourSystem.navTitle` preempted |
| | | `navigator.items[].note` ×9 (264 ch) | ✓ | ✗ | short phrases |
| | | `featured.dek` | ✓ | ✗ | renders only if featured shown |
| | | `editorByline.{kicker,heading,intro}` | ✓ | ✓ | **already translated** |
| /egypt-travel-packages | tourCategory(private-package) | `title` | ✓ | ✗ | i18n `tourSystem.pkgCatTitle` preempted |
| | | `summary` (tagline, 149 ch) | ✓ | ✗ | **Sanity-only**, no i18n fallback |
| | | `intro` (essay, 1257 ch) | ✓ | ✗ | **long-form** |
| | | `editorByline.*` | ✓ | ✓ | already translated |
| /small-group-travel-packages | tourCategory(group-package) | `title` | ✓ | ✗ | i18n `pkgGroupCatTitle` preempted |
| | | `summary` (tagline, 125 ch) | ✓ | ✗ | Sanity-only |
| | | `intro` (essay, 1010 ch) | ✓ | ✗ | **long-form** |
| | | `editorByline.*` | ✓ | ✓ | already translated |
| /group-day-tours | — (no Sanity doc) | — | — | — | **FULLY LOCALIZED** — i18n-driven (grpDayCat*); the model the others should follow |

**Preemption note:** the 3 category masthead **titles** already have correct es/ja
in i18n, but render English because the view does `archive?.title ?? i18nKey` and the
Sanity title coalesces to a (truthy) en string, short-circuiting the `??`. These can be
fixed **in code** (don't coalesce title to en in the query, or prefer the i18n key) —
no translation needed. `/group-day-tours` already works this way. Taglines are mixed:
day-tours has a preempted i18n fallback; **package taglines are Sanity-only** and must
be populated (or given an i18n fallback).

### Landings (share PackageSubcategoryView / SubcategoryView)

| Element | Field | private-pkg (10) | group-pkg/region (3) | day-tour (15) |
|---|---|---|---|---|
| Hero title | `title` | ✗ 0 translated | ✗ 0 | ✓ 15/15 |
| Hero dek | `summary` | ✗ 0 | ✗ 0 | ✗ 0 |
| Philosophy essay | `intro` | ✓ 10/10 | ✗ 0/3 | ✓ 15/15 |
| byline / moodChooser / orientation | — | mostly absent in en (don't render; not a fallback) | | mood/orient only on 1 landing |

Representative samples (live-confirmed on /ja):
- **theme — `egypt-luxury-holidays`**: title ✗, dek ✗ fall back; essay ✓ translated.
- **region — `egypt-group-tours-from-japan`**: title ✗ ("Egypt Group Tours from Japan
  & East Asia" renders on /ja), dek ✗, essay ✗ (1009 ch) all fall back.
- Landing deks falling back overall: **13 landings**, ~1,984 ch.

## Counts & word-volume (drafting effort)

**In-scope (the 4 category pages + theme/region landings):**

| Bucket | Items | en chars | ≈ words/lang |
|---|---|---|---|
| Long-form essays | 3 category (`dayToursArchive.essay`, 2× `tourCategory.intro`) | 3,288 | ~550 |
| Long-form essays | 3 region-landing `intro` | 2,918 | ~485 |
| Short fields | 3 category taglines | 405 | ~68 |
| Short fields | 9 nav notes | 264 | ~44 |
| Short fields | 13 landing deks (`summary`) | 1,984 | ~330 |
| Short fields | kicker / navHeading / featured.dek | ~180 | ~30 |
| **Total per language** | | **~9,000** | **~1,500** |
| **Total es + ja** | | | **~3,000 words** |

- **i18n keys to draft: 0.**
- **Sanity fields to draft: 6 long-form essays + ~30 short strings** per language
  (titles where not code-fixed, taglines, nav notes, landing deks).
- **Code-fixable without translation:** 3 category masthead titles (preempted i18n).

## Do singles also fall back? YES — flagged as SEPARATE SCOPE

Singles fall back **wholesale** (title + summary + body) when the tour doc lacks es/ja
— it's all-or-nothing per doc, not field-by-field.

- **25 tours** missing es body; **28 tours** missing ja body (of 221 with en body).
- Example (live): `/ja/10-day-egypt-group-tour-cairo-nile-red-sea` renders the H1, dek,
  and body entirely in English.
- Volume (body text only, excl. title/summary): **es ~29,160 ch (~4,900 words)**,
  **ja ~55,431 ch (~9,200 words)** ≈ **~14,000 words combined**.
- This is ~6× the in-scope category/landing volume and is per-tour content (not the
  shared editorial surfaces), so it should be sized and scheduled separately.

## Recommended sequencing (for discussion — nothing done)

1. **Code fix (no translation):** stop the en-coalesce preemption on the 3 category
   masthead titles so the existing translated i18n shows.
2. **Draft (in-scope, ~3,000 words es+ja):** the 6 essays + ~30 short fields above.
3. **Separate track (~14,000 words):** the 25/28 untranslated single tours/packages.
