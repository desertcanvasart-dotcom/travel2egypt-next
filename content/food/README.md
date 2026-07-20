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
- The body (everything after the frontmatter) is literary prose with plain `##`
  / `###` headers. JA presentation (■ headings, `· · ·`, katakana glosses,
  `最終更新`) is applied at render — author plain markdown.

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
```

Add a new dish to `src/data/food-glossary.ts` first; only then may an article
reference it.
