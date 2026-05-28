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
