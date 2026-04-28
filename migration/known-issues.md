# WP → Sanity migration: known issues

Working document for the next session. Captures the diagnostic findings from session 4
run 2 (post-strip-rules). The 495 articles + 165 translation.metadata are in
`migration-staging` with the documented issues listed below.

---

## Methodology lessons (carry forward)

Plain lesson statements drawn from this session's wrong turns. Future
sessions read these as context, not as actionable items.

### Loud failures over silent ones

A `try/catch` that returns `null` indistinguishably from a successful empty
result is epistemically broken — it removes the system's ability to tell you
something's wrong. The original `resolveAttachmentByFilename` swallowed every
404 from the malformed URL path, so the filename-fallback "ran" returning
zero hits while the run summary reported clean. One full re-run cycle and one
wrong diagnosis (same-wpId-different-src) cost. Pattern to use instead: every
new code path's failure modes log to stderr at minimum, ideally with the input
that triggered them. Make silence impossible.

### Sample-based corpus characterizations are probabilistic, not categorical

When sampling N articles to characterize a corpus, the honest output is "N
articles sampled show pattern X; tail cases possible." When a fix depends on
a categorical claim about the corpus, either run an exhaustive scan or
design the fix to fail loudly on the tail case rather than silently swallowing
it. Pre-flight characterization "every img has `wp-image-{ID}`" is an
overgeneralization from sample to population — what was actually true is
"every img in 8 samples has `wp-image-{ID}`." The Elementor `image.default`
widget on `travel-agency-in-egypt` rendered class-less imgs and was the
hidden tail case.

### TypeScript clean is necessary, not sufficient

`tsc --noEmit` checks types, not runtime correctness. URL strings, API
endpoints, and schema field names are not type-checked against external
systems. New code paths exercising external APIs need a one-shot exercise
against a known input before declaring clean. Adding a
`--hit-new-paths` mode to wp-import that runs each new resolver against one
seed input and asserts non-empty cache files would be small future investment
if this pattern recurs.

## Branch state

Branch `claude/awesome-shannon-3194f1` is **alive, not merged**. It contains three
valid patches that should ship together with the fixes below:

1. **Sanity write retry** — 3-attempt exponential backoff (1s/4s/16s) on transient
   5xx + ECONNRESET. Mirrors the Wordfence pattern on the read side.
2. **Missing-attachment triage list** — registry of source-URL 404s with referencing
   article slug + locale, surfaced under "Missing source attachments" in
   `migration/migration-summary.md`.
3. **Strip rules** — three Elementor widget strippers (tour-promo CTA, category-grid,
   duplicate-paragraph backlink) plus per-rule counters in summary + per-article
   JSONL events.

Decision standing for the next session: bundle these three with the critical fixes
below in a single merge to main, rather than partial-merging now.

---

## Critical (blocks merge)

### 3B — alt / caption i18n shape mismatch

**Symptom:** Studio shows "Expected type String got Array" on every article body image.

**Root cause:** Article uses **document-level i18n** (one Sanity doc per locale,
linked via `translation.metadata`). Each locale doc should hold plain strings for its
locale's `alt` / `caption`. The HTML→PT pipeline always emits **field-level i18n
arrays** instead.

- Pipeline writes i18n arrays at:
  - `scripts/wp-import-html.ts:336` (sideImage from `<figure>` with alignment)
  - `scripts/wp-import-html.ts:350` (image from `<figure>`)
  - `scripts/wp-import-html.ts:371` (sideImage from bare `<img style="float">`)
  - `scripts/wp-import-html.ts:383` (image from bare `<img>`)
- Schema declares strings:
  - `src/sanity/schemas/article.ts:117-123` (body image `alt: string`, `caption: string`)

**Fix shapes considered:**
- (a) Pass a `localeShape: 'string' | 'i18n'` flag through `ConversionOptions`,
  default `'i18n'`, override to `'string'` from `mapArticle`.
- (b) Post-process blocks in `mapArticle` to flatten arrays to strings using the
  current locale.

(a) is cleaner; (b) keeps the pipeline pure but adds a transform pass.

### 3C — required author + category references not written

**Symptom:** Studio shows red required-validation errors on every imported article.

**Root cause:** `src/sanity/schemas/article.ts` declares both fields with
`Rule.required()`:

- Line 71-77: `category` → reference to `editorialCategory`, required
- Line 78-85: `author` → reference to `author`, required

Importer (`scripts/wp-import/mappers/article.ts`) writes neither.

**Fix shapes considered:**
- Importer writes a default author + category reference (probably "Travel2Egypt
  staff" / a "Migrated" or per-WP-category mapping). Needs editorial input on the
  default(s).
- Or: relax the schema validation (`Rule.required()` → optional) and let editorial
  fill in over time.

Both options need editorial sign-off. Safe default for now: define a single
"Migration import" author seed doc + a "Travel & Culture" category seed doc, write
those refs to every imported article, let editorial reassign in Studio.

### 5 — 156 body images have no asset reference

**Symptom:** ~30% of body images on affected articles render as broken-image
placeholders in Studio. Counts pulled from `migration-staging` GROQ scan.

**Hot articles** (sample):

| Slug | `_pendingImage` only | with asset | % missing |
|---|---:|---:|---:|
| places-in-egypt | 8 | 14 | 36% |
| sacred-places-in-egypt-temples-mosques-and-religious-sites… | 6 | 9 | 40% |
| must-visit-museums-in-egypt | 1 | 6 | 14% |
| travel-agency-in-egypt | 1 | 1 | 50% |

**Root cause:** Body image resolver only handles `<img>` tags carrying a
`wp-image-{ID}` class:

- `scripts/wp-import/mappers/_shared.ts:147-156`

```ts
const m = /wp-image-(\d+)/.exec(cls);
if (!m) continue;
```

Any `<img>` without that class (Block-editor inserts, pasted/cross-domain images,
some Elementor inner-content images) is emitted with `_pendingImage: <src>` and no
upload.

Of the 156 missing-asset blocks, 56 are documented 404 misses (in
`migration/migration-summary.md` "Missing source attachments"). The remaining ~100
are class-less `<img>` tags that need a URL→attachment fallback.

**Fix shape:** extend resolver with a fallback: when `wp-image-{ID}` is absent, hit
`/wp-json/wp/v2/media?search=<filename-without-extension>` to resolve the
attachment ID by source filename. Cacheable; adds at most one extra REST call per
class-less `<img>` per run.

---

## Real but not blocking

### 3A — excerpt vs deck field name mismatch

**Symptom:** Studio "field not in schema" warning on every article.

**Cause:** Importer writes `excerpt` field, schema declares `deck` (Standfirst).

- Importer: `scripts/wp-import/mappers/article.ts:74`
- Schema: `src/sanity/schemas/article.ts:62-69` (declares `deck` as `text`, rows: 3)

**Fix:** rename `excerpt` → `deck` in importer (one-line change). Sanity will store
the data correctly under the right name; the orphaned `excerpt` data already in
staging will be overwritten on the next re-run.

### 2 — wrong-language bodies (10 articles)

**Symptom:** Article documents in JA / ES locales contain bodies in another
language.

**Root cause:** WPML partial translations in WP source data — translator translated
the title but not the body (most cases) or WPML fell through to a sibling locale
(at least one ES-body-under-JA-slug case).

Confirmed by direct WP REST inspection of `migration/.cache/rest/posts-bySlug-…`.
Importer is fetching `?slug=…&lang=ja` and getting back what WP returns. Not an
importer bug.

**JA offenders (6 of 165):**

| wpId | Slug | CJK ratio | Body actual language |
|---:|---|---:|---|
| 257611 | `3月のエジプトの魅力-春の冒険` | 0.000 | Spanish (WPML fallback) |
| 249618 | `エジプトのコプト教徒：古代信仰の守護者たち` | 0.0001 | English |
| 249591 | `王家の谷の必見の墓（2025年版）：隠れた名所と知` | 0.0007 | English |
| 249589 | `8月にエジプトへ旅行する` | 0.0016 | English |
| 249606 | `ベスト12日間エジプト旅行プラン` | 0.0021 | English |
| 178056 | `エジプトのグルメダイニング：ラグジュアリーホ` | 0.025 | Mostly English (partial) |

**ES offenders (4 of 164 published):**

| wpId | Slug | Body actual language |
|---:|---|---|
| 257593 | `arqueologia-subacuatica-y-buceo-en-naufragios-en-el-mar-rojo` | English |
| 144345 | `faraones-del-reino-medio-logros-y-legado` | English |
| 144410 | `gastronomia-en-egipto-hoteles` | English |
| 249446 | `la-historia-de-bab-zuweila-la-legendaria-puerta-de-la-ciudad-en-el-cairo-islamico` | English |

**Action:** editorial triage. Either strip from migration (drop these 10 docs and
mark for re-translation in WP), or import-as-is with a `reviewFlag:
'locale-content-mismatch'` on the affected docs and route to a translation
backlog. Latter probably better — migration shouldn't gate-keep editorial work.

Either way: needs a new `reviewFlag` enum value if option B is chosen
(`scripts/wp-import/types.ts:104-115`).

---

## Deferred

### 4 — heading concatenation prevalence

GROQ can't substring-match string fields, so a precise count of
`<strong>X</strong>` followed by non-whitespace inside paragraph blocks isn't
queryable directly. Proxy metric: 30 heading blocks (h2/h3/h4) across 495 articles
have ≥2 spans (~6%) — but this counts any heading with inline marks, not all of
which are concat bugs. Most "awe-/in/spiring" cases come from the WP **Link
Whisper** plugin auto-linking words mid-token; rendering is structurally correct
PT, just visually weird. Defer until Studio walkthrough surfaces concrete count.

### 7 — sub-paragraph dedupe

Current rule (`scripts/wp-import-html.ts:153-164`) does whole-`<p>` exact-string
match — caught 108 instances cleanly. Misses two patterns:

- **Internal repeat**: `<p>X X Y</p>` (sentence X duplicated within one paragraph).
  Needs sentence-split + intra-paragraph dedup. Risky without sample data;
  intentional repetition for emphasis would over-strip.
- **Prefix overlap**: short `<p>X</p>` is an exact prefix of longer `<p>X Y Z</p>`
  elsewhere in body. Cleanly fixable: replace `Set<string>` with sorted
  longest-first list; drop candidates that are prefixes (with length-ratio guard,
  e.g. prefix ≥50% of host). ~25 lines, low false-positive risk.

**Verdict:** prefix dedup is cheap and ship-ready. Internal dedup needs 3–5
concrete examples to tune. Defer both unless editorial flags more cases.

### Earlier-deferred (still open)

- **`the-curse-of-king-tuts-tomb` body truncation** — body ends mid-sentence at
  *"…numerous pulp fiction magazines"*. Now visible in Studio image 3 as the pink
  leading block + double-H1 anomaly. Likely an HTML pre-strip pass over-removed a
  trailing structure. Investigate after the critical fixes land.
- **`129-reasons-to-visit-karnak-temple` literal `\n` escapes** — Elementor
  heading-widget handling gap; raw `\n` showing up in span text where headings
  should have line-broken cleanly.

---

## Strip-rule top-5 (informational, useful editorial signal)

Counts are sums across the en+es+ja locales of each post group.

### Top 5 by tour-promo CTA stripped

| # | Slug | Count |
|---:|---|---:|
| 1 | `top-things-to-do-in-luxor-egypt` | 48 |
| 2 | `egypt-holidays-from-uk` | 30 |
| 3 | `7-unforgettable-to-do-in-aswan` | 24 |
| 4 | `places-to-visit-in-aswan` | 24 |
| 5 | `cinematic-guide-to-egypts-film-sites` | 24 |

### Top 5 by category-grid stripped

| # | Slug | Count |
|---:|---|---:|
| 1 | `alcohol-in-egypt` | 18 |
| 2 | `visiting-egypt-in-july` | 18 |
| 3 | `egypt-package-deals` | 16 |
| 4 | `faux-pas-to-avoid-in-egypt` | 16 |
| 5 | `is-egypt-safe` | 16 |

> `is-egypt-safe` had 16 category-grid widgets stripped this run — directly
> contradicts the prior session's "step 3 verified clean" claim. The prior
> session's strip rules existed only in the handoff doc; even on `is-egypt-safe`
> the category-grids were never actually being stripped before this session.

### Top 5 by duplicate-paragraph backlink stripped

| # | Slug | Count |
|---:|---|---:|
| 1 | `must-visit-islamic-places-in-cairo` | 13 |
| 2 | `sphinxes-and-obelisks` | 11 |
| 3 | `understanding-egyptian-hieroglyphs` | 11 |
| 4 | `2-weeks-egypt-tour-itinerary` | 8 |
| 5 | `animals-in-ancient-egypt` | 6 |

Aggregate run-2 totals: 1844 tour-promo + 200 category-grid + 108 duplicate-paragraph stripped.

Run-3 (post-bundle) extends the strip set with three more rules: swiper
carousel (`swiper-slide-image`), Royal/Premium Addons carousel
(`premium-adv-carousel__item-img`), and `bdt-img` related-tour widgets.
Per-rule counters and per-article carousel-discarded src URLs surface in
`migration-summary.md`.

---

## Pre-flight gates for upcoming entity types

Distinct from the critical/not-blocking/deferred axis: these are findings
that must be resolved **before** the next entity-type mapper runs (hubs,
subpages, monuments, hotels, nile-cruises, tours).

### Hotel/cruise/tour body imagery hidden in `_elementor_data` post-meta

**Discovered while sampling 9 hotel pages adversarially.** ~33% of hotels
(`al-tarfa-desert-sanctuary-lodge`, `bedouin-castle-hotel`,
`daniela-village-saint-catherine-hotel`) return 40+ KB of `content.rendered`
with **zero `<img>` tags and zero `/wp-content/uploads/` URL references** of
any kind — neither in `<img src>`, nor inline-style `background-image`, nor
`data-image`/`data-elementor-image` attributes. The remaining 6 hotels render
imagery via the Royal/Premium Addons carousel widget
(`premium-adv-carousel__item-img`) — class-less from the importer's
perspective, but the URLs are at least present.

The implication: for ~1/3 of hotels, the imagery lives entirely in
`_elementor_data` post-meta JSON, which `content.rendered` does not include.
The current importer scrapes `content.rendered` only.

**Sample (9 hotels):**

| WP id | Slug | Body length | `<img>` count | Mechanism |
|---:|---|---:|---:|---|
| 83679 | `al-tarfa-desert-sanctuary-lodge` | small | 0 | imagery in `_elementor_data` |
| 83680 | `bedouin-castle-hotel` | 42 273 | 0 | imagery in `_elementor_data` |
| 83681 | `daniela-village-saint-catherine-hotel` | 45 330 | 0 | imagery in `_elementor_data` |
| 63657 | `hilton-alexandria-corniche-hotel` | 47 074 | 4 | premium-adv carousel |
| 63630 | `hurghada-marriott-red-sea-resort` | 48 749 | 3 | premium-adv carousel |
| 63932 | `jw-marriott-cairo-hotel` | 48 601 | 4 | premium-adv carousel |
| 63523 | `mercure-luxor-karnak-resort` | 49 457 | 4 | premium-adv carousel |
| 63666 | `sheraton-montazah-hotel` | 49 261 | 4 | premium-adv carousel |
| 64598 | `steigenberger-nile-palace-luxor-hotel` | 50 191 | 4 | premium-adv carousel |

Same pattern likely applies to nile-cruises and tour-or-package pages — both
are Elementor page-builder driven. Spot-check on at least 4 cruises + 4 tours
before locking the relevant mapper.

**Three viable paths (decision needed before hotel/cruise/tour mappers):**

1. **REST meta-field whitelist.** Register `_elementor_data` (and any related
   meta keys) as REST-readable on the WP side, then parse the Elementor JSON
   tree client-side to extract image references. Requires WP plugin or
   `mu-plugins/` change. Highest fidelity, most upstream work.
2. **Featured-only.** Use `featured_media` as the sole image source for
   these entity types. Single hero per hotel/cruise/tour; accept body-imagery
   loss for the 33% with empty `content.rendered` and the carousel imagery
   loss on the other 67%. Lowest implementation cost; matches
   editorial-luxury restraint; defensible.
3. **Live HTML scrape.** Fetch the rendered HTML page (post-PHP-render),
   parse the resolved DOM. Captures everything Elementor produces but adds
   a second fetch path with rate-limit/cache implications and is fragile to
   theme changes.

**Decision should be made together with the editorial gallery question:**
if hotel/cruise/tour content is preserved as a `gallery` array, path 1 or 3
is needed. If it collapses to single hero only, path 2 is sufficient.

### Carousel-imagery editorial review (post-strip)

Every imported article has its stripped carousel imagery surfaced in
`migration/migration-summary.md` under "Stripped carousels" with sample src
URLs (capped at 20 per widget per locale). Editorial should review
post-import and flag any high-value articles that need surgical re-import
once a gallery strategy is locked.

---

## Migration-staging-only artifacts

The following documents live **only in the migration-staging dataset** and
must NOT be promoted to the production dataset by any future sync/promote
script. They are migration-specific artifacts whose presence in production
would encode false provenance.

- `author.legacy-archive` ("Travel2Egypt Archive") — written via
  `createIfNotExists` from `scripts/wp-import.ts` on every import run.
  Referenced by every imported article as the default `author`. Honest
  transitional construct: imported articles weren't authored by editorial;
  they were imported. Editorial reassignment to real authors handles
  promotion-time correctness.

If a future "promote staging → production" script is added, it must:
- Skip docs whose `_id` is `author-legacy-archive`.
- For every article that references `author.legacy-archive`, either reassign
  to a real author before promotion OR carry the archive author across as a
  documented migration artifact (with the same caveat in production Studio).

The two `editorialCategory` seed docs (`category-planning`,
`category-destination`) are NOT staging-only — those are the curated
production taxonomy, ensured in staging only because imported articles need
them to resolve. The production `scripts/seed.ts` remains canonical.

---

## Triage matrix

| # | Issue | Severity | Notes |
|---:|---|---|---|
| 3B | alt/caption shape | **resolved** | `localeShape: 'string' \| 'i18n'` flag through `ConversionOptions`; mapArticle sets `'string'` |
| 3C | required author + category | **resolved** | `author.legacy-archive` seed + two-bucket category heuristic with `wpCategorySlugs` provenance |
| 5 | 156 images without asset | **resolved** | Carousel widgets stripped (swiper + premium-adv + bdt-img) + filename-fallback resolver with ambiguous-match registry |
| 3A | excerpt → deck rename | **resolved** | Field renamed in mapArticle |
| 2 | wrong-language bodies | not-blocking | Editorial triage; possibly + reviewFlag enum |
| 4 | heading concat | deferred | Studio sampling first |
| 7 | sub-paragraph dedupe | deferred | Prefix dedup cheap, internal needs samples |
| — | curse-of-king-tut truncation | deferred | Investigate after critical fixes |
| — | karnak-temple `\n` escapes | deferred | Elementor heading-widget gap |
