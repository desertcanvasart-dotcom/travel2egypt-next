# Food section — authoring & import

Markdown source for the Food section. Import with:

```bash
npm run import:food -- --dir content/food --dry-run   # validate, write nothing
npm run import:food -- --dir content/food --commit     # import as DRAFTS
```

Everything lands as a **draft** (`drafts.foodArticle.<slug>.<locale>`). The EN
write upserts onto the seeded stub for that slug (no duplicate). **Publishing is
a human act in Studio** — the importer never publishes.

## Files

- Name each file `<slug>.<locale>.md`, locale ∈ `en` `es` `ja`. **The slug and
  locale come from the filename.** All locales of one piece share the EN slug.
- Images: reference by relative path (e.g. `images/hero.jpg`); put them in a
  sibling `images/` folder. They upload at import time, content-hash deduped.
- The body (everything after the frontmatter) is literary prose with plain
  markdown headers. JA presentation (■ headings, `· · ·`, katakana glosses,
  `最終更新`) is applied at render — author plain markdown.
- **Top-level section heads are `##` (h2).** The JA render layer keys strictly
  off h2: it inserts the `· · ·` dividers before each h2 after the first, and
  the scoped CSS draws the gold `■` prefix on h2 only. A section head written as
  `###` (h3) renders **unornamented in JA** — no divider, no ■ — so use `##` for
  the article's main sections. `###` stays legal for a genuine *sub*-section
  nested inside a section (it just renders plainly in JA, which is acceptable).
  All locales of one piece must use the same heading levels so they stay
  structurally parallel (shared TOC anchors, matching section rhythm).

## Frontmatter contract

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | **all locales** | |
| `format` | enum | **all locales** | `biography` \| `generations` \| `route` \| `practical`. Must match across a piece's locales. |
| `region` | enum | **all locales** | `cairo` \| `alexandria-coast` \| `nile-south` \| `oases-sinai` \| `all-egypt`. Must match across locales. |
| `publishedAt` | date | **all locales** | `YYYY-MM-DD` or ISO. |
| `updatedAt` | date | **JA required**, EN/ES optional | Drives the JA `最終更新` line. |
| `deck` | string | optional | Standfirst / subtitle. |
| `author` | string | optional | An author **slug**. Defaults to `travel2egypt-editorial`. |
| `dishes` | string[] | optional | Glossary keys — validated against `src/data/food-glossary.ts`. |
| `heroImage` | string | optional | Relative path to the hero image. |
| `heroAlt` | string | **required if `heroImage` set** | Alt text, in this file's own language. |
| `heroCaption` | string | optional | |
| `heroCredit` | string | optional | |
| `tour` | string | optional, **route only** | A tour's EN slug — resolved to a reference. |
| `lastVerified` | date | optional, **route only** | Venue accuracy-review date. |
| `metaTitle` | string | optional | SEO. |
| `metaDescription` | string | optional | SEO. |

Route-only fields (`tour`, `lastVerified`) are refused on non-route formats
(evergreen pieces name no venues). The importer refuses the whole run — writing
nothing — if any file breaks the contract, and prints exactly what to fix.

## Glossary keys for `dishes`

`dishes` takes **slugified keys**, not display spellings — hyphenated and
lower-case (`om-ali`, not "Om Ali"; `samna-baladi`, `kebda-eskandarani`). The
canonical keys (single source of truth: `src/data/food-glossary.ts`):

```
koshari · taameya · molokhia · sayadeya · feteer · ful · om-ali · hawawshi
dukkah · samna-baladi · kebda-eskandarani · zarb · tagella
taliya · tasbeeka · mahshi · fatta · torshi · shatta · mish · karkadeh
wika · eish-shamsi · fesikh · termis · kahk · qatayef · kunafa · dakka
```

Add a new dish to `src/data/food-glossary.ts` first; only then may an article
reference it. Note `dakka` (koshari garlic-vinegar sauce) and `dukkah` (dry
nut-and-spice condiment) are different things — don't conflate them.

## Research base

Two research documents underpin the section. Both are **reference only** —
excluded from the import pipeline (no `.<locale>.md` segment; they sit in
`_research/`, which the importer's non-recursive scan never descends into) and
never turned into article content wholesale. Sourced claims are **spot-verified
against their cited links at writing time** — re-checked per article, not trusted
wholesale.

**Doc 1 — canonical.** [`_research/egyptian_food_and_cooking_field_guide.md`](_research/egyptian_food_and_cooking_field_guide.md)
— the sourced historical/regional field guide; the section's primary reference.

**Doc 2 — supplementary, verify per claim.** [`_research/deep-dive/Food_and_Cooking_in_Egypt_A_Deep_Dive.md`](_research/deep-dive/Food_and_Cooking_in_Egypt_A_Deep_Dive.md)
— broader, but a tier weaker in sourcing (Wikipedia/blog citations).
**Exception:** section 7 (bread politics) is solidly sourced (IFPRI / USDA / WHO)
and usable with normal spot-verification. The house rule applies *doubly* here:
any claim taken from Doc 2 is **re-sourced, or downgraded to "Origin story,"** at
writing time.

**Images caveat.** The charts bundled with Doc 2 (`deep-dive/images/fig_bread`,
`fig_wheat`, `fig_obesity`, `fig_timeline`, `fig_regions`, `cover`) are **research
artifacts, not site assets** — never publish them without a provenance check and
a restyle to the site's design language. The no-AI-food-imagery rule is
unaffected and absolute.

**TODO — reconcile conflicting figures (editorial · owner: Islam).** Settle a
single canonical number for each; until resolved, articles cite **neither** value
without checking here first:

- subsidy beneficiaries — **71M** (Doc 1) vs **73M** (Doc 2)
- bread price-freeze start year — **1988** vs **1989**
- al-Hakim molokhia-ban date — **1004** vs **~1005**

## Editorial conventions

**Confidence vocabulary** (adopted verbatim from the research base; use it in
briefs and prose framing):

- **Documented** — evidence exists.
- **Plausible lineage** — ingredients or techniques align, but the named dish
  can't be traced continuously.
- **Origin story** — memorable folklore, weak paperwork.

House rule: **origin stories are told as stories, never asserted as history.**

**Naming exception — Koshary/koshari.** UNESCO's 2025 inscription title spells it
"**Koshary**". Site copy uses the canonical **`koshari`**; you may quote the
official "Koshary" title where the inscription itself is discussed.
