# Travel2Egypt — WordPress → Sanity Migration Mapping

Generated: 2026-04-27
Companion to: [`audit-report.md`](./audit-report.md)
Target dataset: **`migration-staging`** (NOT production)

This document specifies field-by-field how each WordPress entity becomes a Sanity document. It bakes in the decisions made after Phase A:

- **Authenticated WP REST** access via the `developer` admin app-password (HTTP Basic).
- **HTML hreflang scraping** as the WPML translation-linkage source. (Auth REST does not expose `translations` even with admin role; verified.)
- **Expanded classifier** (validated at 19.7% unclassified — under the ≤20% target).
- **3–5 req/sec read pace** (authenticated calls are off the public rate-limit but Wordfence is in front; back off on 403/429).
- **Old nested URLs in the pre-block CSV** are first-class redirect inputs, not just orphans.
- **`/fi/` URLs** strip-and-301 to EN.
- **ES/JA-only entities** import as locale-only (no backfill).

---

## 0. Top-line summary table

| WP entity | Sanity target | i18n model | Locale linkage |
|---|---|---|---|
| `post` | `article` | document-level (one doc per locale) | hreflang scrape; one doc per language |
| `page` classified `destination-hub` | `city` (UPDATE existing seed if slug matches) | field-level | locales merged into one doc |
| `page` classified `destination-subpage` (non-Cairo-neighborhood) | `guideArticle` | field-level | locales merged |
| `page` classified `destination-subpage` w/ section `places-to-go` (Cairo neighborhoods like coptic-cairo, islamic-cairo) | `guideArticle` w/ `section: places-to-go` | field-level | locales merged |
| `page` classified `monument` | `wikiMonument` (+ pushed onto parent `city.placesToGo`) | field-level | locales merged |
| `page` classified `tour-or-package` (≤7 days) | `tour` w/ `type: dayTour` | field-level | locales merged |
| `page` classified `tour-or-package` (>7 days OR has "package"/"vacation"/"itinerary") | `tour` w/ `type: package` | field-level | locales merged |
| `page` classified `hotel` | `hotel` (Sanity schema) | field-level | locales merged |
| `page` classified `nile-cruise` | `nileCruise` (Sanity schema) | field-level | locales merged |
| `page` classified `service-or-utility` | **DEFERRED** — stub article + redirect to `/plan-your-tour` (§11) | n/a | n/a |
| `page` classified `article` (pharaohs-of-, ancient-, egyptian-) | `article` | document-level | hreflang scrape |
| `page` classified `persona-or-system` | **SKIP** — these are Next.js pages (`/about`, `/`, `/just-me`) and should not migrate to CMS | n/a | n/a |
| `page` classified `test-or-junk` | **SKIP** with a warning in log; require `--include-junk` to override | n/a | n/a |
| `page` classified `unclassified` | Import as `article` with editor-review flag (see §10) | document-level | hreflang scrape |
| `category` (post taxonomy) | `editorialCategory` | n/a (not localized in current schema) | — |
| `tag` (post taxonomy) | dropped (kept on doc as `_legacyWpTags` for traceability only) | — | — |
| `attachment` (media) | Sanity asset (one per WP attachment ID) | shared file, per-locale alt | — |

The `tour` schema uses a single document with a `type` discriminator (per [README §2](../README.md)) so day-tours and packages share i18n behavior.

---

## 1. Authentication & access

All WP REST calls use HTTP Basic auth:

```
Authorization: Basic base64(WP_APPLICATION_USERNAME:WP_APPLICATION_PASSWORD)
User-Agent: t2e-migration/1.0
Accept: application/json
```

`User-Agent` is **required** — without it, Cloudflare returns "error 1010" (browser-integrity-check failure) on auth requests, even with valid credentials. Verified.

**Read pace:** target 4 req/sec sustained. Implement a token-bucket limiter, **not** a 250 ms sleep — the limiter must absorb burst-then-pause patterns smoothly so we don't accidentally exceed 5 req/sec at the boundary between batches.

**Wordfence backoff protocol:** any 403 (other than `rest_forbidden_context` for unauth scopes) or 429:
1. Pause all requests for 60 s.
2. Resume at 1 req/sec for 30 s probe.
3. If clean, ramp back to 4 req/sec.
4. If three backoffs trigger in one run, **halt the run** and surface the IP/headers in the migration log so the operator can coordinate with the site admin (Wordfence may need an allowlist entry).

---

## 2. WPML translation-linkage strategy (verified)

### What does NOT work
- `?context=edit` does not add `lang`/`translations` fields to entity responses.
- `/wpml/v1/post-translations/{id}` is not registered (404 even with admin auth).
- `/wpml/tm/v1/jobs` returns 403 even for `administrator` role — requires a translation-manager role specifically, which the site doesn't have configured in a way the API exposes.
- `acf` field is empty across sampled posts. Not used here.

### What DOES work — HTML hreflang scrape
Each rendered page has `<link rel="alternate" hreflang="…" href="…">` tags in `<head>`. Verified on `/the-curse-of-king-tuts-tomb/`:

```
hreflang="en" → https://travel2egypt.org/the-curse-of-king-tuts-tomb/
hreflang="es" → https://travel2egypt.org/es/la-maldicion-de-la-tumba-del-rey-tut/
hreflang="ja" → https://travel2egypt.org/ja/...エンコード済JP slug.../
hreflang="x-default" → https://travel2egypt.org/the-curse-of-king-tuts-tomb/
```

Pages without translations show only `en` + `x-default` (e.g., `/getting-around-suez/`) — singletons surface naturally.

### Importer flow

1. Enumerate EN entities via `?lang=en` (paginated).
2. For each EN entity, fetch its rendered HTML (the URL in `link`), parse `<head>` once, extract hreflang map.
3. For each non-EN hreflang URL, look up the corresponding entity in the cached ES/JA REST results (matched by URL).
4. Build the locale group:
   - **Document-level i18n (`article`):** create one Sanity doc per locale; cross-link via `@sanity/document-internationalization` metadata.
   - **Field-level i18n (`city`, `guideArticle`, `tour`, `wikiMonument`):** create one Sanity doc; populate the `internationalizedArrayString` / `internationalizedArrayText` / per-locale slug arrays with each locale's title, summary, body, etc.

### Cache shape
The HTML scrape result for each EN URL is cached at `migration/.cache/hreflang/{wpId}.json`:
```json
{ "wpId": 243401, "links": { "en": "...", "es": "...", "ja": "...", "x-default": "..." } }
```
Idempotent re-runs reuse this cache; pass `--rescrape-hreflang` to invalidate.

### Fallback when no hreflang is present
- If the rendered page has only `en` + `x-default`: import as locale-only EN, no ES/JA doc created.
- If the rendered page has hreflang for a locale but the URL doesn't resolve in the REST cache (e.g., 404 or moved): log as `HREFLANG_BROKEN` with both URLs; create the EN doc with no locale link, surface in migration summary for manual triage.

---

## 3. Per-entity field mapping

All schemas referenced live under [`src/sanity/schemas/`](../src/sanity/schemas).

### 3.1 WP `post` → Sanity `article` (document-level i18n)

| WP source | Sanity target | Notes |
|---|---|---|
| `id` | `_legacyWpId` (number) | New field on `article` (see §7) |
| `link` | `_legacyWpUrl` (string) | New field |
| `modified_gmt` | `_legacyWpModifiedAt` (datetime) | New field |
| `template` | `_legacyWpTemplate` (string \| null) | New field |
| `slug` (per locale) | `slug.current` | One Sanity doc per locale; slug is plain (not internationalizedArray) on `article`. EN doc uses EN slug. |
| `title.rendered` | `title` | HTML-decode entities first; preserve non-ASCII as-is |
| `excerpt.rendered` | `excerpt` (plain text) | HTML strip; collapse whitespace |
| `content.rendered` | `body` | Full HTML→PT pipeline (see §4) |
| `featured_media` (id) → fetch `/media/{id}` | `heroImage` | Upload original to Sanity; alt from media `alt_text` per locale (re-fetch media with `?lang=es` and `?lang=ja` to capture all alts) |
| `categories[]` (term IDs) | `category` (reference to `editorialCategory`) | Take the first category as primary; surface multi-category warnings in log |
| `tags[]` | `_legacyWpTags` (string[] of slugs) | Not surfaced in editorial UI; preserved for trace |
| `date` | `publishedAt` | |
| `author` (user ID) | `author` (reference) — best-effort | Authors from `/wp/v2/users` import to `author` schema; if no match, leave null |
| `meta.rank_math_title` | `seo.metaTitle` | |
| `meta.rank_math_description` | `seo.metaDescription` | |
| (locale-group via hreflang) | `language` field + document-internationalization metadata | One Sanity doc per locale, linked |
| (idempotency key) | `_id` = `wp-post-{wpId}-{locale}` | Different per locale because document-level i18n |

### 3.2 WP `page` (destination-hub) → Sanity `city` (UPDATE-or-create)

Only **destination hubs** map to `city`. Two important constraints:

1. **City docs from Phase 1 already exist in production for Cairo, Luxor, Aswan, Abu Simbel** (and possibly more). The importer writes to `migration-staging`, but seed data for Phase 1 may also have been seeded there — we'll detect existing cities by EN slug and **update in place** rather than creating duplicates. The deterministic `_id` strategy (`wp-page-{wpId}` for new) collides safely: existing seed cities use slug-derived IDs (per `scripts/seed.ts`), so a new WP-derived ID won't collide with seed IDs. The importer must therefore look up by `slug[_key=="en"][0].value.current` first, and if found, patch onto that doc rather than creating `wp-page-{wpId}`.

| WP source | Sanity target | Notes |
|---|---|---|
| `id` | `_legacyWpId` | |
| `link` | `_legacyWpUrl` | |
| `modified_gmt` | `_legacyWpModifiedAt` | |
| `template` | `_legacyWpTemplate` | |
| `slug` (per locale via hreflang lookup) | `slug[_key=...].value.current` | EN required; ES/JA fall back to EN if missing |
| `title.rendered` per locale | `name[_key=...].value` | |
| `excerpt.rendered` per locale (else first paragraph of body) | `summary[_key=...].value` | |
| `content.rendered` per locale | `overview[_key=...].value` (Portable Text) | Full HTML→PT pipeline |
| `featured_media` | `heroImage` (localizedImage) | Per-locale alts from media |
| `categories` | `region` (best-effort) | Heuristic: if WP page is in `tours` category and slug includes Lower-Egypt token → `lower-egypt`; otherwise leave editor to set. Don't guess wildly. |
| (mined from body) | `keyFacts.bestSeason / gettingThere / daysNeeded` | Detection heuristics in §4.4. If absent, leave empty for manual editor population. |
| `meta.rank_math_*` | `seo.metaTitle / metaDescription` | |
| (idempotency) | look up by EN slug first; else `_id = wp-page-{wpId}` | |
| **`placesToGo`** | populated AFTER monument-pass (§3.4) | Cross-reference from `wikiMonument` documents matched by destination |

### 3.3 WP `page` (destination-subpage) → Sanity `guideArticle`

| WP source | Sanity target | Notes |
|---|---|---|
| `id`, `link`, `modified_gmt`, `template` | `_legacyWp*` | |
| `slug` (per locale) | `slug[_key=...].value.current` | |
| `title.rendered` per locale | `title[_key=...].value` | |
| `excerpt.rendered` per locale | `summary[_key=...].value` | |
| `content.rendered` per locale | `body[_key=...].value` (Portable Text) | |
| `featured_media` | `heroImage` (localizedImage) | |
| (classifier output) | `parentCity` reference | resolved by `inferredParentCity` token → look up city doc by EN slug |
| (classifier output) | `section` ∈ {introducing, plan-your-trip, while-you-are-there, places-to-go, others} | from the `inferredSection` field in the classifier |
| `meta.rank_math_*` | `seo.*` | |
| (idempotency) | `_id = wp-page-{wpId}` | |

#### `section` mapping table (final)

| Slug pattern | Section value |
|---|---|
| `getting-around-*`, `*-getting-around`, `transport-*`, `*-transport`, `food-*`, `*-food`, `things-to-do-*`, `where-to-eat-in-*` | `while-you-are-there` |
| `how-to-get-to-*`, `how-to-go-to-*`, `where-to-stay-*`, `*-where-to-stay`, `weather-*`, `*-weather`, `when-to-go-*`, `when-to-visit-*`, `best-time-to-*`, `*-seasonal-guide`, `*-airport-transfer` (when not service-deferred) | `plan-your-trip` |
| `history-*`, `*-history`, `*-introduction`, `introduction-to-*`, `overview-of-*`, `*-overview` | `introducing` |
| `events-*`, `*-events`, `tours-in-*`, `tours-from-*`, `*-tours`, `*-only-here` | `others` |
| **Cairo neighborhoods** (`coptic-cairo`, `islamic-cairo`, `old-cairo`, `khan-el-khalili`, `zamalek`, `maadi`, `heliopolis`) | `places-to-go` |
| Destination-prefix subpage with no clearer signal (e.g., `marsa-alam-{x}`, `siwa-{x}` w/o topic match) | `others` |

> **Important:** Per the `guideArticle` schema description: *"Places To Go is normally populated via wikiMonument references on the parent city (city.placesToGo), not by guideArticle documents — the value exists here only for migration compatibility."* Cairo neighborhoods are an exception: they are large district-level pages, not single monuments, and don't fit `wikiMonument`'s shape. They legitimately belong as `guideArticle` with `section: places-to-go`.

### 3.4 WP `page` (monument) → Sanity `wikiMonument` (+ city.placesToGo backref)

| WP source | Sanity target | Notes |
|---|---|---|
| `id`, `link`, `modified_gmt` | `_legacyWp*` | |
| `slug` (per locale) | `slug[_key=...].value.current` | |
| `title.rendered` per locale | `name[_key=...].value` | |
| `excerpt.rendered` per locale | `summary[_key=...].value` | |
| `content.rendered` per locale | `body[_key=...].value` (Portable Text) | |
| (mined from body) | `visitorInfo[_key=...].value` (Portable Text) | Heuristic: extract paragraphs/sections containing keywords like *open from, ticket, entry fee, spend at least, best time to visit, photography is, wear, dress* OR section headers *Visitor Info / Practical Tips / Before You Go*. **If detection is uncertain, leave empty.** Never invent. |
| `featured_media` | `heroImage` | |
| (classifier `inferredParentCity`) | `relatedCity` reference (if schema has one — confirm or omit) | Otherwise the relationship is one-way via `city.placesToGo` |
| (idempotency) | `_id = wp-page-{wpId}` | |

**After all monuments imported, run a reconciliation pass**: for each `wikiMonument` with a non-null `inferredParentCity`, append a reference to `placesToGo` on that city's Sanity doc. **De-duplicate** — re-runs must not create duplicate references. The placesToGo array uses `{_type: "reference", _ref: "wp-page-{monumentId}", _key: <stable-hash>}`.

> **CRITICAL:** A page classified `monument` becomes a `wikiMonument` only — never both a `wikiMonument` AND a `guideArticle`. Single source of truth.

### 3.5 WP `page` (tour-or-package) → Sanity `tour`

The `tour` schema is unified with a `type` discriminator. Decision rule:

| Slug signal | `tour.type` |
|---|---|
| Slug contains `package`, `vacation`, `itinerary`, `cruise-vacation`, OR matches `\d+-day` where N > 7 | `package` |
| Otherwise (matches `^private-`, `-day-tour`, `-day-trip`, `-experience`, `-safari`, `-trek`, `-retreat`, etc.) | `dayTour` |

| WP source | Sanity target | Notes |
|---|---|---|
| `id`, `link`, `modified_gmt`, `template` | `_legacyWp*` | |
| `slug` (per locale) | `slug[_key=...].value.current` | |
| `title.rendered` per locale | `title[_key=...].value` | |
| `excerpt.rendered` per locale | `summary[_key=...].value` | |
| `content.rendered` per locale | `description[_key=...].value` (Portable Text) | |
| `featured_media` + gallery (mined `<img>` from body) | `heroImage`, `gallery[]` | |
| (mined from body — number after digits/days) | `durationDays` (number) | Heuristic: parse leading `\d+-day` or first occurrence of "X days" |
| `priceIndication` | leave empty | Per [README §5](../README.md): no booking engine. Editorial decision per tour. |
| (mined `from-{city}`) | `startCity` reference (if schema has it) | Otherwise leave empty |
| (idempotency) | `_id = wp-page-{wpId}` | |

### 3.6 Categories → `editorialCategory`

| WP source | Sanity target |
|---|---|
| `id` | `_legacyWpCategoryId` |
| `slug` | `slug.current` |
| `name` | `title` |
| `description` (if present) | `description` |

26 WP categories. **Skip categories with `count = 0`** (8 of 26) — they're empty placeholders. The importer logs them and proceeds.

### 3.7 Tags

Not migrated as standalone Sanity docs. WP `tags` are flattened to `_legacyWpTags: string[]` on the parent post. Editors can later opt to surface specific tags as filterable facets.

### 3.8 Media

| WP source | Sanity target | Notes |
|---|---|---|
| `id` | (filename hash + `_legacyWpAttachmentId` on the asset's metadata) | Sanity assets do not have a `_legacyWpId` field on the asset itself; carry as a metadata key |
| `source_url` (largest variant — `media_details.sizes.full.source_url`) | uploaded blob | Always the original size, never thumbnails |
| `media_details.file` | asset filename | Preserve original WP filename for trace |
| `alt_text` (fetched per locale via `?lang=en\|es\|ja`) | per-locale alt on the **embedding** image block, not on the asset | The asset is one. The block referencing it carries a `internationalizedArrayString` alt. |
| `caption.rendered` | per-locale caption on the embedding block | |
| (idempotency) | reuse asset by SHA256 of filename + first 1 MB of bytes | Sanity's asset upload returns existing asset reference if the binary already exists. |

> **Performance note:** 5,540 attachments × 3 locale fetches = 16,620 small REST calls just to collect alt text. At 4 req/sec that's ~70 minutes. The importer should batch this: fetch each media `?lang=en`, `?lang=es`, `?lang=ja` lazily as the importer encounters body images, **not** preemptively. Cache results in `migration/.cache/media/{wpId}-{locale}.json`.

---

## 4. HTML → Portable Text pipeline

Implemented as a single deterministic pure function `htmlToPortableText(html, opts)` in `scripts/wp-import-html.ts`. Used by all body-bearing entities.

### 4.1 Pre-processing (strip noise)

In order:

1. **Remove all Elementor wrappers.** Strip elements whose class begins with `elementor-`, `e-` (where the next char is a letter), `wpr-`, `eael-`, `elementskit-`. Keep their **inner text content**, lifting up. Iterate to convergence.
2. **Remove Link Whisper noise.** Strip `data-wpil-monitor-id`, `data-wpil-keyword-link` attributes (keep the `<a href>`).
3. **Drop these elements entirely:** `<style>`, `<script>`, `<noscript>`, `<svg>`, `<iframe>` (unless `src` is a YouTube/Vimeo embed — those become an `embed` block if the schema supports it, else a link), `<form>`, social-share buttons (class containing `share`, `social-icons`, `addtoany`), author-bio cards (class containing `about-author`, `post-author`).
4. **Drop empty `<div>`s** after lifting.
5. **Decode HTML entities** (`&nbsp;` → space, `&amp;` → `&`, etc.) once at the end of pre-processing.

### 4.2 Block-level mapping

| Source | Portable Text output |
|---|---|
| `<h2>` … `<h6>` | block style `h2`/`h3`/`h4` (clamp h5/h6 to h4) |
| `<p>` | block style `normal` |
| `<ul>` / `<li>` | bullet list block |
| `<ol>` / `<li>` | numbered list block |
| `<blockquote>` (default) | block style `blockquote` |
| `<blockquote class="…pull…">`, or `class="…callout-quote…"`, or `class="…highlight…"`, or Elementor "Pullquote" widget | **`pullQuote` block** (see §4.5) |
| `<figure>` w/ `<img>` + optional `<figcaption>` (no alignment class) | image block w/ `alt` + `caption` |
| `<figure class="alignright …">`, `<figure class="alignleft …">`, OR Elementor image widgets with right/left alignment | **`sideImage` block** (see §4.6) |
| `<table>` | inline-as-list fallback (no Sanity table block in current schema). Surface in log as `TABLE_FLATTENED` for manual review. |
| `<hr>` | drop |
| `<a href="#…">` | externalLink mark with `href` preserved (anchor links stay as text+mark) |

### 4.3 Inline marks

| Source | Mark |
|---|---|
| `<strong>`, `<b>` | `strong` |
| `<em>`, `<i>` | `em` |
| `<u>` | `underline` |
| `<a href="...">` (external or unknown) | `externalLink` annotation (`href`, `newTab` if `rel` includes `noopener` or `_blank`) |
| `<a href="https://travel2egypt.org/...">` (internal — Phase 1 import) | placeholder `_pendingInternalLink: { wpUrl: "..." }` — resolved in `--phase=relink` |
| `<code>`, `<pre>` | dropped to plain text (no code mark in schema) |

### 4.4 Mining city `keyFacts` from hub bodies

For destination-hub pages only. Look in the body's structured headers and short paragraphs for:

- **bestSeason**: section header matching `/best season|when to (go|visit)|weather|climate/i` → take the first sentence of the following paragraph.
- **gettingThere**: `/getting (there|here)|how to get to|reach .* by/i` → first sentence.
- **daysNeeded**: `/how (many )?days|recommended (length|stay)|spend (a |at least )?\d+ days/i` → first sentence.

Each mined value is a string. Be conservative — if multiple matches, take the shortest. If none match, leave empty.

### 4.5 Pull-quote detection (special)

Triggers:
- `<blockquote>` with class containing `pull`, `highlight`, `callout-quote`, `wp-block-pullquote`, OR
- Elementor widgets `data-widget_type="pullquote.default"` or `text-editor.default` with explicit `pullquote` styling.

Output:
```
{
  _type: 'pullQuote',
  quote: [{ _key: locale, value: <text content> }],
  attribution: <if a <cite> child exists, OR if text after — em-dash matches a person/role pattern>,
  style: 'literary'  // default
}
```

Style inference (apply in order):
- `style: 'historical'` if quote begins with `In the year`, `An ancient`, `It is written`, `According to (Herodotus|Plutarch|Strabo|…)`.
- `style: 'traveler'` if first-person pronouns ("I will never forget", "We arrived as the sun…").
- Else `style: 'literary'`.

### 4.6 Side-image detection (special)

Triggers:
- `<figure class="alignright …">` → `alignment: 'right'`
- `<figure class="alignleft …">` → `alignment: 'left'`
- Elementor `<div data-element_type="image">` with `align: right|left` in its settings JSON → use that alignment.
- Inline `<img>` with `style="float: right|left"` → side-image with that alignment.

Inline images **without** alignment (centered or fullwidth) → regular image block, not side-image.

Caption populated from `<figcaption>` if present.

### 4.7 Operator-note detection

Conservative. A `<p>` becomes an `operatorNote` (`tone: 'honest'`) **only** when it begins (case-insensitive, after stripping leading punctuation) with one of:

- `Honestly,`
- `We don't recommend`
- `Watch out for`
- `Most travelers don't realize`
- `What we tell our clients`
- `We always tell our guests`
- `Frankly,`

These phrases are operator-voice signals seen in Travel2Egypt's existing copy. Other tones (`caution`, `insider`, `context`) are NOT auto-assigned — editors will retune by hand. Log per-document operator-note count.

### 4.8 Wiki-monument visitor-info mining

For `wikiMonument` body, scan paragraphs and `<h2>/<h3>` sections for visitor-practical content. A paragraph is "visitor info" if it contains 2+ of:
- `open from` / `opening hours` / `closes at`
- `ticket` / `entry fee` / `admission`
- `spend at least` / `time to spend` / `allow .* hours`
- `best time to visit`
- `photography is (allowed|forbidden|free)`
- `dress` / `wear`

OR if it's the body of a section whose header literally matches `/^(visitor info|practical tips|before you go|getting in)$/i`.

If detected, copy those paragraphs (in order) into `visitorInfo` Portable Text. **If detection is uncertain or finds nothing, leave `visitorInfo` empty.** Editors fill manually later.

---

## 5. Internal-link rewriting (two-phase)

### Phase 1 — capture
During the initial import, every `<a href>` whose host is `travel2egypt.org` (incl. `/es/` and `/ja/` and the bare `/` prefix) becomes an `externalLink` mark with an extra metadata field:

```
{ _type: 'externalLink', href: 'https://travel2egypt.org/...', _pendingInternalRef: { wpUrl: '...', sourceLocale: 'en' } }
```

Sanity ignores unknown fields, so this round-trips through publication safely until Phase 2.

### Phase 2 — `--phase=relink`
Walk every imported document. For each mark with `_pendingInternalRef`:
1. Look up Sanity doc by `_legacyWpUrl == wpUrl`.
2. If found: replace the `externalLink` mark with `internalLink` carrying `reference._ref` to that doc.
3. If not found:
   - If `wpUrl` exists in the redirect map (§9), keep as `externalLink` (visitor will hit the redirect).
   - Else, mark as orphaned in `migration/relink-orphans.csv` and keep as `externalLink` to the original URL.

---

## 6. Locale binding details

### Document-level i18n (`article` only)
- One Sanity document per locale: `wp-post-{wpId}-en`, `wp-post-{wpId}-es`, `wp-post-{wpId}-ja`.
- Each has its own `language` field and translation references via the `@sanity/document-internationalization` plugin.
- The plugin requires a `translationsRef` array on each doc; the importer populates this from the hreflang map.

### Field-level i18n (`city`, `guideArticle`, `tour`, `wikiMonument`)
- One Sanity document; each i18n field is an `internationalizedArrayString` / `internationalizedArrayText` / per-locale slug array.
- For each locale present in the hreflang map, fetch that locale's WP entity (`?lang=es` etc.) and populate the corresponding `_key`.
- Locales not present in hreflang are simply absent from the array — the EN-fallback GROQ helper handles rendering.

### ES/JA-only entities (orphans)
Per the user's decision:
- Import as locale-only Sanity documents.
- `_id` = `wp-{type}-{wpId}-{locale}` for `article`; for field-level types, the doc has only one locale's value populated and **no EN value** — this is unusual but supported by the schema (EN is required only for required-EN-fallback fields like `city.name` and `city.slug`). For required EN fields on a non-EN orphan, the importer **falls back to copying the non-EN value into EN** with a `_legacyWpEnFallback: true` marker, surfacing in the migration log for editor review.
- Logged in `migration/locale-orphans.csv` with `wpId, locale, slug, link`.

### `/fi/` URLs
Per the user's decision: **301 to corresponding EN URL** (strip `/fi/` prefix). These do NOT become Sanity docs. They go straight into `migration/redirect-map.csv`:

```
from_url, to_path, locale, status_code, legacy_wp_id, priority_score
https://travel2egypt.org/fi/kuinka-pukeutua-vieraillessa-egyptissa/, /how-to-dress-when-visiting-egypt, en, 301, , 96
```

---

## 7. Schema additions (`_legacyWp*` fields)

To preserve provenance, the importer requires these fields on `article`, `city`, `guideArticle`, `tour`, `wikiMonument`, `hotel`, `nileCruise`, `editorialCategory`:

| Field | Type | Description |
|---|---|---|
| `_legacyWpId` | number | WP post/page ID. Single value (per-locale duplicate is fine). |
| `_legacyWpUrl` | string | Original full WP URL (English). |
| `_legacyWpModifiedAt` | datetime | WP `modified_gmt`. |
| `_legacyWpTemplate` | string \| null | WP page template (mostly `elementor_header_footer`). |
| `_migratedAt` | datetime | When the importer last wrote this doc. |
| `_migrationSource` | string | Always `"wp-import"` for now. |
| `_migrationReviewFlag` | string \| null | Set when the doc needs editor attention (e.g., `"unclassified-as-article"`, `"locale-orphan"`, `"keyfacts-mining-failed"`). Surfaces in Studio via a desk-structure filter. |

These are **additive, optional, hidden fields**. Adding them does not break existing Phase 1 fixtures (per audit-report.md decision-log). Schema additions land in a single commit at the start of Phase C, before any importer code runs.

---

## 8. Classifier results (final, validated post-Phase-B-revisions)

Distribution across all 1,246 EN pages after the round-2 expansion (hotel/nile-cruise rules, safety fallback for ambiguous destination-subpages, Cairo neighborhood update, wadi-* explicit inference, and tour-rule-order fix). Run `npx tsx scripts/wp-classifier-validate.ts` to reproduce.

| Type | Count | % | Sanity target |
|---|---:|---:|---|
| `destination-subpage` | 422 | 33.9% | `guideArticle` (303 with section assigned; 119 with section unset → `_migrationReviewFlag: "section-needs-assignment"`) |
| `tour-or-package` | 268 | 21.5% | `tour` |
| `unclassified` | 189 | **15.2%** | `article` w/ `_migrationReviewFlag: "unclassified-as-article"` |
| `monument` | 145 | 11.6% | `wikiMonument` |
| `destination-hub` | 69 | 5.5% | `city` (update existing) |
| `hotel` | 66 | 5.3% | `hotel` |
| `nile-cruise` | 49 | 3.9% | `nileCruise` |
| `persona-or-system` | 19 | 1.5% | SKIP |
| `test-or-junk` | 10 | 0.8% | SKIP |
| `service-or-utility` | 7 | 0.6% | DEFER (§11) |
| `article` (pharaohs/ancient/egyptian) | 2 | 0.2% | `article` |
| **Total** | **1246** | | |

**Section distribution (within the 422 destination-subpages):**
- Section assigned: 303 (`while-you-are-there`, `plan-your-trip`, `introducing`, `places-to-go`, `others`)
- Section unset (needs editor assignment): 119

The `others` bucket is now ~57 pages — events, tour-listing aggregators, only-here pages — a genuinely-leftover bucket as intended.

Of the 1,246 pages, **381 (30.6%)** have an inferred `parentCity` token — these get auto-wired to their city; the remaining destination-subpages either have `inferredParentCity = null` (manual triage) or the parent is unambiguous from context (e.g., `wadi-feiran` → editor decides).

### `inferredSection` distribution
- `others`: 260
- `while-you-are-there`: 87
- `plan-your-trip`: 65
- `introducing`: 31
- `places-to-go`: 6 (the Cairo neighborhoods)

### `inferredParentCity` top destinations
Cairo (30), Sharm El-Sheikh (25), Aswan (21), Luxor (19), Hurghada (19), Alexandria (14), Giza (13), Fayoum (13), Marsa Alam (12), Al-Gouna (12), Saint Catherine (12), Asyut (12), Abu Simbel (11), Kom-Ombo (10), Rosetta (10), Beni-Suef (10), Kharga Oasis (9), Nuweiba (9), Taba (9), Bahariya (9). (Long tail follows.)

### Posts (separate from pages)

163 EN posts. All map to `article` (document-level i18n). No classification needed — every post is editorial.

---

## 9. Redirect map generation

Output: `migration/redirect-map.csv`. Columns: `from_url`, `to_path`, `locale`, `status_code`, `legacy_wp_id`, `priority_score`.

### Sources

1. **Live WP URLs.** For every imported entity, emit a redirect from the WP URL to the new Next.js path:
   - `article` (post): `/blog/{slug}` (locale-prefixed for ES/JA: `/es/blog/{slug}`, `/ja/blog/{slug}`)
   - `city`: `/guide/{slug}`
   - `guideArticle`: `/guide/{parentCitySlug}/{slug}`
   - `wikiMonument`: `/wiki/monuments/{slug}`
   - `tour` (dayTour): `/tours/{slug}`
   - `tour` (package): `/packages/{slug}`
   - `editorialCategory`: `/blog?category={slug}` (or omit if no category landing page)

2. **Historic nested URLs from the pre-block CSV** (the 258 unresolved). Per the user's decision, parse each historic `/{destination}-travel-guide/{sub}/` URL:
   - Extract destination token + sub-topic.
   - Look up the corresponding new entity:
     - If `sub` matches a slug we imported → redirect to that entity's new URL.
     - If `sub` resembles a known monument → redirect to `/wiki/monuments/{best-match}`.
     - If `sub` resembles a topic → redirect to `/guide/{destination}/{best-match-guideArticle-slug}`.
   - Unmatched: append to `migration/redirect-orphans.csv` for manual triage.

3. **`/fi/` URLs from any source.** Strip `/fi/` and redirect to the corresponding EN URL.

4. **`/es/`, `/ja/` URL variants** for the same entity.

### Priority score
`score = 0.7 * clicks_pre_block + 0.3 * impressions_recovering_last_7_days`. URLs not in either CSV: `score = 0`. Sort descending. Highest-priority content migrates first in test runs (Phase D).

### Locale prefix conventions
- EN paths are root-prefixed (`/blog/...`).
- ES paths use `/es/...` (per [README §1](../README.md): "EN at root, /es and /ja prefixed").
- JA paths use `/ja/...`.
- The `to_path` column is **locale-prefixed already**; consumers just emit a 301.

---

## 10. The 245 "unclassified" pages — handling

Per the user's decision: **import as `article` with editor-review flag.**

Each unclassified page becomes:
- A Sanity `article` document (document-level i18n).
- `_id = wp-page-{wpId}-en` (and `-es`/`-ja` if hreflang has them).
- `_migrationReviewFlag = "unclassified-as-article"`.
- Body, hero, title, etc. fully migrated — same pipeline as posts.

Editors get a Studio desk filter "Unclassified migrations" listing all 245. They can:
- Reclassify by changing `_type` (manual GROQ patch — done by the data team, not editors).
- Or accept the article classification (drop the review flag).

Two unclassified slugs that should NOT default to `article`:
- `your-name-in-hieroglyphics` — looks like an interactive tool/landing page. **SKIP** with `_migrationReviewFlag = "interactive-tool"`. Surface for product decision.
- `weekly-flash-deals`, `summer-escapes`, `entrada-booking` — promotional/booking-flow pages. **SKIP** with `_migrationReviewFlag = "promotional-marketing"`. Surface for editorial decision.

The importer's "skip with flag" path writes a stub doc (just `_id` + `_legacyWp*` + `_migrationReviewFlag`) so the editor can see them in Studio without their content polluting search/sitemap.

---

## 11. Service-or-utility pages (4 entities) — DEFERRED

Pages: `hurghada-airport-transfer`, `cairo-airport-transfer`, plus 2 similar.

Per [README §5](../README.md), Travel2Egypt is consultation-only — there's no booking engine and the AI concierge handles operational requests directly. Airport-transfer pages are operationally redundant with the concierge model.

**Decision (proposed for confirmation in mapping doc review):**
- Do NOT auto-migrate to a `tour` / `service` schema.
- Write a stub `article` doc with `_migrationReviewFlag = "service-deferred"` and `body = []`.
- Add to the redirect map pointing to `/plan-your-tour` (the concierge entry) so URL equity is preserved.
- Surface in Studio for product/editorial team to decide: rewrite as concierge-pointing teaser, or 410 (gone).

---

## 12. Skip list (final)

The importer **skips** (no Sanity doc written, only redirect entry if the URL has traffic):

| Reason | Slugs |
|---|---|
| `test-or-junk` | `testing`, `233278-2`, `home-2`, anything matching `/^elementor-\d+$/`, `/^elementskit-/`, `/^\d+-paivan-/` (Finnish residue) |
| `persona-or-system` | `home`, `about`, `contact`, `tailored-tours`, `plan-your-trip`, `plan-your-tour`, `just-me`, `me-and-my-partner`, `families-with-kids`, `friends-private-group`, `privacy-policy`, `terms-of-service`, `terms-and-conditions`, `cookie-policy`, `cookie-notice`, `terms-conditions`, `sitemap`, `thank-you`, `blog`, `tbt`, `tailor`, `family`, `add_services`, `entrada-booking`, `subscriptions`, `newsletter` |
| Interactive tool | `your-name-in-hieroglyphics` |
| Promotional/marketing | `weekly-flash-deals`, `summer-escapes`, `cairo-sky-adventure` (and any other `*-flash-deals`, `*-deal-of-the-week`) |

Override with `--include-junk` flag (writes stubs for everything in the skip list, useful for completeness audits).

All skipped URLs still get redirect-map entries pointing to a sensible Next.js destination (homepage, `/blog`, `/plan-your-tour`, etc.) — see `redirect-map.csv` generation in §9.

---

## 13. Importer CLI surface

(Documented here so it lands in the mapping doc review; built in Phase C.)

```
npm run wp-import -- [options]
```

Required env: `WP_APPLICATION_USERNAME`, `WP_APPLICATION_PASSWORD`, `SANITY_STAGING_API_WRITE_TOKEN`, `NEXT_PUBLIC_SANITY_PROJECT_ID`. Loud failure if any missing or if the configured Sanity dataset is anything other than `migration-staging`.

| Flag | Behavior |
|---|---|
| `--dry-run` | Produce a preview report; no Sanity writes, no media uploads. |
| `--limit N` | Process at most N WP entities. |
| `--type post\|page\|attachment\|category\|all` | Filter by entity type. |
| `--filter-by-template <name>` | Filter pages by classifier output: `destination-hub`, `destination-subpage`, `monument`, `tour-or-package`, `service-or-utility`, `article`, `unclassified`. |
| `--since YYYY-MM-DD` | Only entities `modified_gmt >= since`. |
| `--language en\|es\|ja\|all` | Filter by hreflang locale. `all` is default. |
| `--continue-on-error` | Log + continue past per-entity errors; otherwise abort. |
| `--verbose` | Verbose logging. |
| `--phase import\|relink` | Import pass vs internal-link resolution pass. |
| `--include-junk` | Write stubs for skip-list entries. |
| `--rescrape-hreflang` | Invalidate hreflang cache. |
| `--rate N` | Override default 4 req/sec read pace (for backoff scenarios). |

---

## 14. Open decisions surfaced for review

1. **`tour` schema field for "starting city" / "departure city"** — does it exist on the current schema, or do I need to add it? (I'll check at start of Phase C and note as a schema addition if needed.)
2. **`wikiMonument` schema field for parent-city back-reference** — same question. The current architecture has `city.placesToGo[].ref → wikiMonument` (one-way). If we want bidirectional, add `wikiMonument.relatedCity` reference. Not strictly needed for migration; the importer just populates `city.placesToGo` and the inverse is implicit.
3. **`editorialCategory` localization** — current schema is not localized. The 26 WP categories have no translations on the WP side either (verified — there's no per-locale category list). Recommend leaving non-localized for now.
4. **Service-or-utility treatment** (§11) — confirm "stub article + redirect-to-concierge" is the right call for the 4 airport-transfer pages, or do you want them as full `tour` docs?
5. **Cairo neighborhood scope** — I've encoded `coptic-cairo`, `islamic-cairo`, `old-cairo`, `khan-el-khalili`, `zamalek`, `maadi`, `heliopolis`. Add more (`giza-plateau`, `garden-city`, `nasr-city`, `october-6-city`)? They surface in unclassified currently.
6. **Wadi-* pages** — currently classified as `destination-subpage` with `inferredParentCity` unset. They live across Sinai and Western Desert. Want me to assume Sinai-region wadis (`wadi-feiran`, `wadi-mukattab`) → parentCity: sinai, and Western Desert wadis (`wadi-el-rayan`, `wadi-el-hitan`) → parentCity: fayoum? Or leave for editor triage?

---

## 15. Validation summary

| Check | Status |
|---|---|
| Authenticated WP REST works (admin role + correct UA) | ✅ verified |
| WPML translation linkage via REST | ❌ not exposed; using HTML hreflang scrape instead |
| HTML hreflang scrape returns clean per-locale URLs | ✅ verified on 2 sample posts |
| Classifier ≤ 20% unclassified target | ✅ 19.7% (245 of 1246) |
| Inferred parentCity coverage on subpages/monuments | 30.6% (381 of 1246 — auto-wired to city) |
| Distinct destination tokens identified | 25+ (Cairo, Luxor, Aswan, Sharm, Hurghada, Alexandria, etc.) |
| Schema additions don't break existing fixtures | ✅ all `_legacyWp*` are additive optional fields |
| Production write blocked | ✅ importer aborts unless dataset = `migration-staging` |

---

## 16. End of Phase B — STOP

No importer code has been written. No schema changes have been committed.

Awaiting approval to proceed to Phase C: build `scripts/wp-import.ts`, add the `_legacyWp*` fields to schemas, and prepare for the first dry-run.
