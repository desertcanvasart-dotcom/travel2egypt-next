# Deferred tour migration

Carried forward from the guide-MD bulk-upload session. **Do not lose track of this when the tours/products section is built.**

The current guide-MD upload (the 660-file `/guide/` MD corpus → `guideArticle` + `city.overview` writes) **explicitly leaves these items alone**. They are tour-section concerns that don't belong inside the guide section but currently live as `guideArticle` docs from the WP import. Deleting them now would lose content; they need proper migration to dedicated tour doc types.

---

## Item 1 — Type 2: single tour pages → `tour` doc type

**Problem.** 16 docs currently stored as `guideArticle` (mostly `section: while-you-are-there`, `kind: tours`) are actually specific tour-product pages. They show up in city-guide sidebars where they don't belong. The corresponding `tour` doc-type entries **do not exist** — `*[_type=="tour" && slug in [...]]` returns zero. Deleting these guideArticles = losing the content. Confirmed via query in this session.

**The 16 docs (slugs):**

| Slug | Hosting city (slug) |
|---|---|
| `4-days-white-desert-wadi-al-hittan-exploration` | _(check during migration — likely al-fayoum/bahariya)_ |
| `cairo-alexandria-city-break-5-days` | cairo |
| `cairo-dinner-cruise-with-belly-dancing-show` | cairo |
| `cairo-weekend-city-break-2-nights-3-days` | cairo |
| `dendera-and-abydos-temples-from-al-gouna` | al-gouna |
| `dolphin-show-sharm-el-sheikh` | sharm-el-sheikh |
| `dolphins-in-sharm-el-sheikh` | sharm-el-sheikh |
| `hurghada-dolphin-show` | hurghada |
| `islamic-cairo-day-tour` | cairo |
| `nmec-royal-mummies-old-cairo` | cairo |
| `royal-seascope-submarine-hurghada` | hurghada |
| `saladin-citadel-khan-el-khalili-bazaar-cairo` | cairo |
| `sharm-el-sheikh-to-jerusalem-and-dead-sea` | sharm-el-sheikh |
| `sharm-el-sheikh-to-mount-sinai` | sharm-el-sheikh |
| `sound-light-show-at-karnak-temple-in-luxor` | luxor |
| `the-giza-sound-and-light-show` | giza |

**Interim treatment (this session):** add a `hidden: boolean` field to `guideArticle` schema; mark these 16 as `hidden: true`; filter the city-guide sidebar query on `hidden != true`. Data stays intact; sidebars stay clean.

**Future migration steps:**

1. Create a `tour` doc per slug. Copy: `title`, `body`, `slug`, `heroImage`, `summary`, `seo`. The schema also requires:
   - `type` — likely `dayTour` for the show/excursion ones, `package` for the multi-day city breaks (`cairo-alexandria-city-break-5-days`, `cairo-weekend-city-break-2-nights-3-days`).
   - `tourMode` — `group` for most of these (they're scheduled departures); editor confirm per slug.
   - `durationDays` — derivable from title (e.g., `5-days` → 5).
   - `days[]` — itinerary structure. Not present in the guideArticle body; needs editorial pass.
   - `theme._ref` — pick the right theme from `theme-*` (e.g., dolphin-show → `theme-egypt-on-the-go` or similar; city-break → `theme-egypt-in-depth`).
   - `cities[]` — array of city refs the tour touches (multi-city for the cross-region ones).
2. After tour docs are live and verified:
   - Delete the `guideArticle` source docs.
   - Add redirect rows: `/guide/<city>/<slug>` → `/tours/<slug>` (or whatever the canonical tour URL pattern is).
3. Remove the `hidden` field from the schema once no guideArticle still uses it (cosmetic).

---

## Item 2 — Type 3: tour category landing pages → new `tourCategory` doc type

**Problem.** 15 docs at slugs like `<city>-private-day-tours` and `<city>-small-group-day-tours` are tour-category landing pages from the old WP site. Each had editorial content (41–130 portable-text blocks of hand-written copy) plus SEO equity at its URL. The new site's tour discovery is filter-based, which loses both. Operator wants to preserve these as dedicated SEO-friendly pages with editorial intro + filtered tour listing below.

**Decision locked this session:** introduce a new `tourCategory` document type rather than retasking `guideArticle`. Cleaner separation; easier evolution.

**The 15 docs (slugs):**

`al-gouna-private-day-tours`, `alexandria-private-day-tours`, `aswan-private-day-tours`, `aswan-small-group-day-tours`, `cairo-private-day-tours`, `cairo-small-group-day-tours`, `hurghada-private-day-tours`, `hurghada-small-group-day-tours`, `luxor-private-day-tours`, `luxor-small-group-day-tours`, `marsa-alam-private-day-tours`, `marsa-alam-small-group-day-tours`, `safaga-private-day-tours`, `sharm-el-sheikh-private-day-tours`, `sharm-el-sheikh-small-group-day-tours`

**Future migration steps:**

1. Define `tourCategory` schema. Fields (proposed):
   - `city` — required `reference` to `city`.
   - `mode` — `string` with `list: ['private', 'group']`. (Mirrors the `tourMode` enum on `tour`.)
   - `tourType` — `string` with `list: ['dayTour', 'package']`. (Or simplified — most category pages today cover dayTours only.)
   - `title`, `slug`, `summary`, `body` (portable text), `heroImage`, `seo` — standard editorial fields.
   - `orderRank` — for listing.
2. Add a Next.js route that renders the page: hero → editorial body → filtered list of `tour` docs where `tour.city == this.city && tour.tourMode == this.mode && tour.type == this.tourType` (or however the filter is shaped).
3. Migrate each of the 15 docs: create the `tourCategory` doc, copy body/title/seo from the `guideArticle`, set `city._ref` + `mode` + `tourType` from the slug (e.g., `hurghada-private-day-tours` → city=`hurghada`, mode=`private`, type=`dayTour`).
4. After verified live:
   - Delete the source `guideArticle` docs.
   - Add redirect rows (or — if URL pattern stays identical — no redirect needed; just route resolution).
5. **Sidebar handling during interim:** the 15 docs currently live with `section: others, kind: tours` and appear in the city-guide sidebar under "Others". Operator decision (this session): leave them visible there until the migration runs. They're at least *relevant* to the city.

---

## Item 3 — Siwa Oasis `adventure-activities-in-siwa-oasis` → article doc type

**Reclassified during audit reconciliation** (was previously slated for delete+redirect; operator clarified the content is blog-post-shaped, not a Things-To-Do).

- The doc (`wp-page-112945`) stays in place as a `guideArticle` for now.
- During the future article migration, it gets converted to `article` doc type and removed from the city's guide sidebar.
- Sibling doc `things-to-do-in-siwa-oasis` is the canonical Things-To-Do page for Siwa (populated by `Siwa Oasis/Things To Do.md`).
- No deletion / redirect during the guide-MD upload session.

---

## Item 4 — `hidden` field on `guideArticle` (this session's prerequisite)

Schema change required before Item 1's interim treatment can be applied. Tiny patch:

```ts
// src/sanity/schemas/guideArticle.ts
defineField({
  name: 'hidden',
  title: 'Hidden from sidebars',
  description:
    'When true, this doc is excluded from city-guide sidebar listings. Used as a holding flag for legacy single-tour docs awaiting migration to the tour doc type.',
  type: 'boolean',
  initialValue: false,
  group: 'meta',
}),
```

And in the sidebar query: add `&& hidden != true` to the guideArticle filter.

Redeploy Studio after the schema change so the field becomes editable in-Studio if anyone needs to flip it manually.

---

## Cross-references

- This document is referenced from `docs/migrations/phase-2-plan.md §11` (Open-items tracker).
- Origin: guide-MD bulk-upload preparation session (May 2026).
- Related: §6.2 of phase-2-plan (wikiMonument consolidation — same "preserve editorial value, don't lose content" principle).

---

## Session 47 follow-up — final design + s48 build plan

Late in session 47 we worked through the full tours/products IA. Decisions
below are **locked** unless explicitly revisited. The big surprise was that
the existing `tour` schema is already the 2×2 model we wanted — significantly
reducing s48 scope.

### Existing state in `migration-staging` (audited 2026-05-28)

- **194 `tour` docs** already present with this distribution:

| | private | group | (unset) |
|---|---|---|---|
| **dayTour** | 60 | 40 | 0 |
| **package** | 31 | 32 | 31 |

- **`theme` doc type exists** with 9 slugs: `adventure`, `egypt-in-depth`,
  `nile-cruise`, `hassle-free`, `family-egypt`, `luxury`,
  `egypt-and-the-red-sea`, `egypt-on-the-go`, `special-interest`.
- 31 packages missing `tourMode` — backfill in s48.

### MD source (audited at `/Users/islamhussein/Downloads/All 3 langs/en/`)

- `private day tours/` — 9 city landings, 92 individual tour MDs
- `group day tours/` — 6 city landings, 18 individual tour MDs
- `private packages/` — 9 theme landings, 64 individual tour MDs
- `group packages/` — 3 origin-region landings, 3 individual tour MDs

### MD ↔ Sanity overlap

```
MD slugs:                   207
Existing Sanity tours:      194
Overlap (upsert candidate): 100
MD-only (new):              107
Sanity-only (keep as-is):    94
```

Final tour count after s48: ~301.

### Slug-collision audit — clean

Three lists set-intersected on 2026-05-28:

- **List A** — reserved root routes from `src/app/(site)/[locale]/*` (26 slugs:
  about, blog, contact, cookie-policy, disclaimer, distance-between-egyptian-cities,
  faq, guide, hotel-grade-concept, hotels, nile-cruises, packages, privacy-policy,
  responsible-travel, terms, tours, travel-tips, wiki, your-name-in-hieroglyphs +
  framework reserves) — **0 collisions with C**.
- **List B** — existing non-tour Sanity slugs (article, wikiMonument, nileCruise,
  hotel, editorialCategory; 255 unique) — **0 collisions with C**.
- **List C** — proposed root-level tour slugs (207 from MD + 4 hubs + 28
  sub-landings) — clean.

Catch-all routing at root will work with no precedence hacks.

### Locked decisions

#### 1. URL strategy — preserve everything

All four legacy hub URLs stay exactly as they are. No redirects.

```
/private-day-tours/                     ← tourCategory hub  (KEEP)
/group-day-tours/                       ← tourCategory hub  (KEEP — URL only)
/egypt-travel-packages/                 ← tourCategory hub  (KEEP)
/small-group-travel-packages/           ← tourCategory hub  (KEEP)

/<city>-private-day-tours/              ← tourLanding ×9    (KEEP, all 9 city slugs)
/<city>-small-group-day-tours/          ← tourLanding ×6    (KEEP, all 6 city slugs)
/<theme-slug>/                          ← tourLanding ×10   (KEEP all 10 themes)
/<origin-region-slug>/                  ← tourLanding ×3    (NEW, Pattern A — see below)

/<tour-slug>/                           ← tour ×~300        (KEEP, every slug at root)
```

#### 2. `/group-day-tours/` — URL preserved, label changes only

- URL stays `/group-day-tours/` (no redirects needed).
- Display label everywhere reads **"Small Group Day Tours"** — matches the
  sub-page slugs (`<city>-small-group-day-tours`) and the package side's
  "Small Group Travel Packages". Locks visual consistency without SEO loss.

#### 3. Origin-region slugs for Group Packages (Pattern A — locked)

Three new `tourLanding` docs, slugs at root:

```
/egypt-group-tours-from-japan
/egypt-group-tours-from-usa-canada
/egypt-group-tours-from-uk-europe
```

`originRegion` enum on `tour` and `tourLanding`:
`'japan-east-asia' | 'usa-canada' | 'uk-europe'`.

#### 4. Themes — 10 total (locked)

Existing 9 (already in Sanity) + add `dahabiya-nile-cruise`:

```
adventure                  (existing, 6 tours)
egypt-in-depth             (existing, 43)
nile-cruise                (existing, 12)
hassle-free                (existing, 10)
family-egypt               (existing, 6)
luxury                     (existing, 5)
egypt-and-the-red-sea      (existing, 4)
egypt-on-the-go            (existing, 4)
special-interest           (existing, 4)
dahabiya-nile-cruise       (NEW — matches MD folder; no existing tours yet)
```

Create the new `theme` doc with EN slug `dahabiya-nile-cruise` and EN title
*"Dahabiya Nile Cruise"*. ES/JA titles to be filled from MD frontmatter (the
MD folder is `Dahabiya Nile Cruise/`).

#### 5. Schema additions (minimal — most of it exists)

Three small changes to the existing `tour` schema + two new doc types:

**`tour` schema additions:**
```ts
// New field — required only when type === 'package' && tourMode === 'group'
defineField({
  name: 'originRegion',
  title: 'Origin region (group packages)',
  description: 'Traveler origin segment for small-group multi-day packages.',
  type: 'string',
  options: {
    list: [
      { title: 'Japan & East Asia', value: 'japan-east-asia' },
      { title: 'USA & Canada',      value: 'usa-canada' },
      { title: 'UK & Europe',       value: 'uk-europe' },
    ],
    layout: 'radio',
  },
  hidden: ({ document }) =>
    document?.type !== 'package' || document?.tourMode !== 'group',
  validation: (Rule) =>
    Rule.custom((value, ctx) => {
      const d: any = ctx.document;
      if (d?.type === 'package' && d?.tourMode === 'group' && !value) {
        return 'Group packages require an origin region';
      }
      return true;
    }),
  group: 'classification',
}),
```

**New `tourCategory` doc type** — the 4 top-level hub pages
(`/private-day-tours/`, `/group-day-tours/`, `/egypt-travel-packages/`,
`/small-group-travel-packages/`):

```ts
{
  name: 'tourCategory',
  fields: [
    key:           string enum '(private|group)-(day-tour|package)'  // discriminator
    slug:          internationalizedArray.slug                       // EN locked to legacy WP slug
    title:         internationalizedArray.string
    summary:       internationalizedArray.string
    intro:         internationalizedArray.portableText
    heroImage
    subAxisLabel:  string ('Choose by destination' | 'Choose your theme' | 'Choose your region')
    faq:           internationalizedArray.portableText (optional)
    seo
    migration.wpUrl
  ],
}
```

**New `tourLanding` doc type** — the 28 sub-category landing pages
(9 + 6 + 10 + 3):

```ts
{
  name: 'tourLanding',
  fields: [
    category:        reference to tourCategory                  // required
    // discriminator — EXACTLY ONE matches the parent category's sub-axis:
    destinationCity: reference to city                          // when category is day-tour
    themeRef:        reference to theme                         // when category is private-package
    originRegion:    string enum                                // when category is group-package

    slug:            internationalizedArray.slug                // EN locked to legacy WP slug
    title:           internationalizedArray.string
    summary:         internationalizedArray.string
    intro:           internationalizedArray.portableText
    heroImage
    relatedTours:    array of references to tour                // optional — manual ordering
    faq:             internationalizedArray.portableText (optional)
    seo
    migration.wpUrl
  ],
}
```

#### 6. Routing — repurpose existing catch-all

`src/app/(site)/[locale]/[...rest]/page.tsx` currently only fires `notFound()`.
Rewrite as a type-dispatched resolver:

```ts
const doc = await sanity.fetch(`
  *[slug[_key==$loc][0].value.current == $slug && !(_id in path("drafts.**"))]
   | order(select(
       _type == "tourCategory" => 1,
       _type == "tourLanding"  => 2,
       _type == "tour"         => 3,
       _type == "article"      => 4,
       _type == "wikiMonument" => 5,
       99
     ) asc)[0]
`, { slug, loc: locale });

if (!doc) notFound();
switch (doc._type) { /* render appropriate page component */ }
```

The order clause picks deterministically if two doc types ever share a slug.
Audit shows zero overlap today — clause is defensive.

### s48 build sequence

1. **Schema** — add `originRegion` to `tour`; add `tourCategory`,
   `tourLanding`. Deploy Studio.
2. **Theme** — create `theme.dahabiya-nile-cruise` doc (10th).
3. **Backfill** — patch 31 packages with their `tourMode` (probably all
   `private`, but verify per slug from MD source).
4. **Bulk-create** the 4 `tourCategory` hubs from the corresponding MD
   hub files (if present in MD source folders) or hand-author the intros.
5. **Bulk-create** the 28 `tourLanding` sub-landings — 25 of these already
   exist as `guideArticle` docs (the 15 from Item 2 above + 10 more
   private-package theme landings if they exist) — most likely *migrate*
   guideArticle → tourLanding rather than starting fresh.
6. **Bulk-create/upsert** the 107 new tours + 100 MD-overlap upserts from
   the MD corpus. Reuse `wp-import-md` machinery.
7. **Reclassify** the reclassified Hurghada Pearl
   (`wp-page-86865`, currently `guideArticle.kind=tours`) into a proper
   `tour` doc, then delete the guideArticle.
8. **Migrate** the 16 Type 2 + 15 Type 3 guideArticles (Items 1 & 2 above)
   into `tour` / `tourLanding`. Delete sources after verify.
9. **Routing** — rewrite `[...rest]/page.tsx` as the type-dispatched catch-all.
   Author 3 page components: `<TourCategoryPage>`, `<TourLandingPage>`,
   `<TourDetailPage>`.
10. **Sitemap / SEO** — regenerate, confirm all 333+ root URLs are listed.
11. **Verify** — spot-check 1 page per category on staging, 1 in each locale.
12. **Cutover** — push to prod. Zero redirects to manage on the high-traffic
    URLs; the only new redirects are for any orphan WP URLs not covered
    (audit late in s48).

### Risks / known-unknowns flagged for s48

- **Itinerary structure (`days[]`)**: existing schema has a structured `days[]`
  field for tour itineraries. MD source likely has prose itineraries that
  need an MD-to-`days[]` parser, or we settle for a single body block per
  tour and skip `days[]` in v1. Decide at start of s48.
- **The 94 Sanity-only tours**: these stay as-is unless any have
  `type/tourMode/theme` data quality issues that block the routing layer.
  Run a quick QA pass over them.
- **The 31 packages with unset `tourMode`**: data-debt to clear before
  routing layer goes live (otherwise their category landing page won't
  list them).
- **Hub intros for the 4 `tourCategory` docs**: do MD folders have a
  top-level intro `.md` per category? If not, copy needs hand-authoring.
- **9 private-package theme landings**: do they exist as guideArticle docs
  on WP, or only as the 9 MD theme folders? Audit in s48.

### Files to read at start of s48

- This document (you're in it).
- `src/sanity/schemas/tour.ts` — existing schema. Already 2×2.
- `src/sanity/schemas/theme.ts` — for theme doc creation pattern.
- `scripts/bulk-upload-guide-md.ts` — template for MD-bulk machinery.
- `src/app/(site)/[locale]/[...rest]/page.tsx` — currently 404-only stub.
- `/Users/islamhussein/Downloads/All 3 langs/{en,es,ja}/{private,group} {packages,day tours}/` — MD source.

