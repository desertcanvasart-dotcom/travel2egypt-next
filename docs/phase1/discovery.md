# Phase 1: Step 0 discovery

Branch: `content/phase1-consolidation` (from `main` at a468d88). Written 2026-09-26.

> **Update 2026-09-25:** the blocker below is resolved. Sanity and the live
> site are reachable, and Step 1 (backups plus the verified inventory) is done.
> See `step1-backup.md`, which also corrects findings 1 and 2 below.
>
> **Blocker for everything past Step 0 (original note).** This environment cannot reach Sanity
> (`ufallvd2.api.sanity.io`, `ufallvd2.apicdn.sanity.io`) or `travel2egypt.org`:
> the network proxy answers 403, and no Sanity token is configured. Everything
> below comes from the code, the redirect map, and
> `migration/bulk-upload-log.jsonl`. No document has been read, backed up or
> drafted, and no URL has been requested. See "What is needed to continue" at the
> end.

## 1. How the four page families are modelled

| | Blog `/blog/[slug]` | Guide `/guide/[city]` and `/guide/[city]/[slug]` | Travel tips `/travel-tips/[slug]` | Resources `/resources/[slug]` |
|---|---|---|---|---|
| Sanity type | `article` | `city`, `guideArticle` | `travelTip` (+ `travelTipCategory`) | `fieldGuide` |
| Locale model | **Document-level**: one doc per language (`language` field), linked by `translation.metadata` | Field-level: one doc, localized fields | Field-level | Field-level |
| Slug | Plain `slug` (`slug.current`), different per language doc | `slug[]` keyed en/es/ja (`localizedSlugField`); EN required, ES/JA fall back to EN | Same as guide | Same as guide |
| Locale fallback on request | **None.** `articleBySlugQuery` needs `language == $locale`, so `/es/blog/<en-slug>` 404s | Locale slug, or EN slug when the locale slug is empty | Same as guide | Same as guide |
| Category | `category` → `editorialCategory` (required) | none (`kind`, `section` strings on guideArticle) | `category` → `travelTipCategory` (optional) | none |
| Author / byline | `author` → `author` (required) | none | none | none |
| Published / updated | `publishedAt` (required), `updatedAt` (optional); page shows `updatedAt ?? publishedAt` | none | none (only `_updatedAt`) | none |
| Meta description | `seo.metaDescription` (inline object, plain text, **no `noIndex` field**) | `seo.metaDescription` (shared `seo` type, localized) | same | same, falls back to `standfirstLead` |
| Body | `body` (single-language portable text) | `body` / `visitorInfo` (guideArticle), `overview` (city) | `body` (localized portable text) | `sections[]` (structured, not portable text) |
| Hide without unpublishing | none | `guideArticle.hidden` (404s it, drops it from lists and the sitemap) | none | none |

Files: `src/sanity/schemas/article.ts`, `city.ts`, `guideArticle.ts`, `travelTip.ts`, `fieldGuide.ts`, `editorial.ts` (editorialCategory, author), `seo.ts`; queries in `src/sanity/lib/queries.ts`.

**What this means for the brief:**
- A blog source has up to **three separate documents and three different slugs** (EN, ES, JA). Each needs its own redirect row, and the ES/JA slugs can only be read from Sanity. "Redirect a JA source to the JA target" means finding the target's JA document through its `translation.metadata` group.
- Blog-to-blog consolidations (tasks 1, 2, 5, 9–13, 15) merge into **each language's target document separately**. An EN draft does not change the ES or JA page.
- Guide and travel-tip targets (tasks 3, 6, 7, 16, 17) are one document with localized fields. Porting content into them means editing the EN, ES and JA body arrays of the same draft.
- Only blog posts have an updated-date field. The brief's "updated date field" step for Task 3 (Siwa guide page) has no field to set.
- The comment above the blog queries (`queries.ts` ~1195) says blog "falls back to the EN doc"; the code does not. The code is right; the comment is stale.

## 2. Redirects

- **One mechanism:** `migration/redirect-map.csv` (canonical, columns `from_url,to_path,locale,status_code,legacy_wp_id,priority_score`) → `npm run redirect-map:regenerate` → `migration/redirect-map.generated.ts` → `next.config.ts` `redirects()`, all `permanent: true` (308). Non-ASCII (JA) paths are percent-encoded in `next.config.ts`. Phase 1 will use this and nothing else.
- Next.js runs these redirects **before** the page, so a redirect row wins over a still-published document.
- **Guards already in CI:**
  - `test:redirect-map-integrity`: no chains, duplicates or self-loops.
  - `test:retired-content`: no redirect row may shadow a 410-retired URL family.
  - `test:migration-routing`: covers `migration/seo-repairs-2026-09-22.json` (audited aliases) and restored routes.
- `src/lib/redirect-sources.ts` drops redirect sources from `generateStaticParams`, so a route that is both a page and a redirect source doesn't break `next build`.
- **The regenerator has rewritten hand-fixed rows before** (see the header of `redirect-map-integrity.test.ts`). Phase 1 rows will be added to the CSV, then regenerated, then checked with the integrity test.
- **Separate from redirects:** `src/middleware.ts` `RETIRED_PATH` returns **410** for WordPress URL families. It isn't a redirect mechanism, and no Phase 1 URL matches it.

## 3. Sitemap

`src/app/sitemap.ts` (hourly revalidation) with `src/lib/sitemap-policy.ts`:
- Reads published documents only (client perspective `published`), so **unpublished docs drop out automatically**.
- `finalizeSitemap` removes every URL that is a redirect-map source, and strips hreflang alternates pointing at URLs no longer in the sitemap. So **redirected URLs, and alternates pointing at them, drop out automatically** once their rows are in the map.
- `sitemapDocsQuery` filters `seo.noIndex != true`, but `article`'s inline `seo` object has no `noIndex` field, so that filter is a no-op for blog posts. This doesn't affect Phase 1.

## 4. "Read next" and related lists (for later phases)

- **Blog "Read next" is automatic:** the 3 newest posts in the same language and the same leaf category (`articleRelatedWeaveQuery`). The page also has a "recent" band and city/tour weaves. The manual `relatedArticles` array is fetched but **never rendered**. Unpublishing a retired post removes it from every list; there's no manual list to clean.
- **Travel tips "More in {category}" is automatic:** 4 tips in the same category (`siblingTravelTipsQuery`). The manual `relatedTips` field is fetched but not rendered.
- **Travel Tips index:** built from every published `travelTip`, grouped by its `category`. The `travelTipsArchive` singleton only orders the departments and picks the cornerstone tip. **The only way to take a tip off the index and department lists is to unpublish it** (or clear its category, which leaves the page live). Check that it isn't the singleton's `cornerstone.tip`.
- **Resources index and footer:** both hard-coded (`src/app/(site)/[locale]/resources/page.tsx` `ENTRIES`, `src/components/Footer.tsx`). The index lists `tipping-honestly`; the footer doesn't. A `resourcesTipping` label ("Tipping, Honestly") exists in all three message files but nothing uses it, which suggests the footer entry was meant to be there (Task 20). **Correction (Step 4):** the omission is intentional — commit `0d8d447` (2026-06-17) removed "Tipping, Honestly" from the footer on request; the `resourcesTipping` keys are leftovers from `34acb5d`. See `notes/task20.md`.

## 5. Inventory

See `docs/phase1/inventory.csv` (180 rows: every URL in the brief × en/es/ja). The URL list itself is in `scripts/phase1-urls.json`.

- **Sanity IDs** come from `migration/bulk-upload-log.jsonl` (the 2026-05-28 Markdown import) and are **unverified**. Every blog source and target except one appears in that log with EN, ES and JA document IDs, so ES/JA versions most likely exist for all of them.
- **ES/JA slugs and existence:** can't be determined without Sanity. They're marked `<es slug: needs Sanity>` in the CSV.
- **Status codes:** not checked (network blocked).
- **Static-route targets exist in code** in all three locales: `/egypt-travel-packages` (localized ES/JA leaves), `/journeys/first-time-in-egypt`, `/guide`.

### Findings already visible from the repo

1. **`/travel-tips/telephones-in-egypt` is already redirected** (EN → `/travel-tips/staying-connected-in-egypt`, plus ES and JA rows) and was deleted from the staging dataset by `scripts/bulk-import-travel-tips-md.ts`. If you still see a Telephones stub, it is either the ES/JA page (the map also sends `/es/telefonos-en-egipto` → `/es/travel-tips/telefonos-en-egipto` and `/ja/travel-tips/telefonos-en-egipto` → `/ja/travel-tips/ejiputo-de-no-denwa-riyo-nitsuite`, both apparently live) or a production document the staging clean-up never reached. Task 7 needs a Sanity read to tell which. **Resolved:** the production document `wp-page-60914` is still published, and ES/JA serve 200 (see `step1-backup.md`).
2. **`/blog/egypt-weather-guide` (Task 17 source) is not in the upload log.** ~~It may not exist as a blog post at all.~~ It exists (`wp-post-73355-en`, with ES and JA versions); see `step1-backup.md`.
3. **11 existing redirect rows point at Phase 1 source URLs.** Once those sources redirect, each would become a chain, so they must be repointed to the final target in the same commit. The integrity test would catch them anyway.
   - `/touring-egypt` → `/blog/touring-egypt`
   - `/siwa-oasis-culture-and-adventure` → `/blog/siwa-oasis-culture-and-adventure`
   - `/local-hospitals-in-egypt` → `/blog/local-hospitals-in-egypt`
   - `/how-to-choose-a-sim-card-for-your-trip-to-egypt` → `/blog/how-to-choose-a-sim-card-for-your-trip-to-egypt`
   - `/faux-pas-to-avoid-in-egypt` → `/blog/faux-pas-to-avoid-in-egypt`
   - `/discover-siwa-oasis` → `/blog/discover-siwa-oasis`
   - `/best-time-to-cruise-the-nile` → `/blog/best-time-to-cruise-the-nile`
   - `/top-things-to-do-in-luxor-egypt` → `/blog/top-things-to-do-in-luxor-egypt`
   - `/the-1922-discovery-of-tutankhamuns-tomb-why-it-matters-the-ultimate-guide` → `/blog/the-1922-discovery-…`
   - `/blog/vacaciones-inolvidables-en-egipto` → `/blog/vacation-in-egypt` (a Spanish slug without the `/es` prefix, sent to the EN post)
   - `/blog/nairu-kuruzu-de-otozureru-rekishi-iseki` → `/blog/historical-sites-visited-by-a-nile-cruise` (a Japanese slug without `/ja`, sent to the EN post)

   The last two send ES/JA legacy URLs to English pages. Rule 7 says they should go to the ES/JA target once those slugs are known.
4. **No `docs/phase1/gsc/` export exists.** `migration/seo-data/` holds an older Search Console export, but it covers legacy WordPress URLs (e.g. `/places-to-visit-in-aswan/`, `/aswan-travel-guide/`), not the current `/blog/…` vs `/guide/…` pairs. Unless you add a current export, Task 16 will go blog → guide as the brief's default.
5. **The post Markdown is not in the repo.** The upload log names the source files (e.g. `egypt-holiday-deals_es_2026-05.md`), but they aren't committed. **Sanity is the only copy of the post content**, so the backups in `docs/phase1/backup/` matter.
6. `tipping-honestly` is a `fieldGuide` document (`fieldGuide-tipping-honestly`) seeded by `scripts/seed-field-guide-tipping.ts`. The repo has its full text; `tipping-in-egypt` exists only in Sanity.

## What is needed to continue

1. **Network access** from this environment to `ufallvd2.api.sanity.io` and `ufallvd2.apicdn.sanity.io` (read and draft writes), plus `travel2egypt.org` (status checks). Set this under Network access in the environment settings.
2. **A Sanity token** as an environment variable. The brief needs drafts (which require write access), so read-only isn't enough. Please use a token scoped as narrowly as possible: an Editor-role token on the `production` dataset. Drafts don't change the live site until you publish.
3. **Which dataset is live:** production reads `production` according to `docs/environments-and-datasets.md`, while the migration scripts target `migration-staging`. I'll assume `production` unless you say otherwise.

With those, Step 1 onwards can proceed: backups first, then the inventory re-run with real IDs, slugs and status codes.
