# ArchiveTemplate

A reusable, item-agnostic archive page. `/hotels` is the first instance;
`/private-day-tours`, `/nile-cruises`, and `/travel-tips` are meant to drop in
on top of it **without editing the template**.

## What the template renders

`ArchiveTemplate` composes, in order:

1. **ArchiveHeader** — kicker/edition, title, italic tagline (type-led, no hero).
2. **ArchiveEssay** — two-column sticky-heading + PortableText body. Supports a
   `definitionList` block (term/description rows) and `conciergeNote`, both via
   the shared `<Body>` serializer.
3. **FeaturedItem** — asymmetric image + copy, facet badge line, dek, optional
   body with inline `conciergeNote`, a link. Hidden when no featured item.
4. **ThemedCollection** (repeatable) — kicker + title + intro + derived meta,
   then cards in one of three layouts: `lead` (1 large + 2), `pair` (2 wide),
   `trio` (3 equal). The editor picks the variant per collection.
5. **ArchiveIndex** — every item as dense rows with faceted, URL-synced,
   client-side filters (aria-pressed; empty state).
6. **Closing rhythm** — reused `ConciergeCTA` → `ArticleFootBand` →
   `FloatingConcierge`.

## The item abstraction (why it's reusable)

The template only knows `ArchiveItem` (`types.ts`):

```ts
interface ArchiveItem {
  _id; title; href; summary?; image?;
  facets: { key; value; label; render?: 'badge' | 'stars' | 'text' }[];
}
```

Facets are generic. Cards and index rows render them by their `render` hint —
no facet key is hardcoded. Per archive type, the **facets** differ:

| Archive            | facets                       |
| ------------------ | ---------------------------- |
| hotels             | `grade`, `stars`, `city`     |
| private-day-tours  | `duration`, `city`           |
| nile-cruises       | `nights`, `route`            |
| travel-tips        | `category`                   |

### ⚠️ TODO before the tours / cruises archives — RANGE facets

The facet filter model is currently **exact-match only** (`badge` / `stars` /
`text`): a row matches a filter when `facet.value === selected`. That works for
grade, city, route, category.

It does **not** work for `duration` (private-day-tours) or `nights`
(nile-cruises), which travelers filter by **range**, not exact value — e.g.
"2–5 days", "6–10", "11+". A `duration=3` exact filter would hide a 4-day tour.

**Resolve this first when adding the tours archive.** Two options:

1. **Pre-bucket at query time (no template change):** map each item's raw
   duration to a bucket label and emit it as a normal `badge`/`text` facet
   (`value: '2-5'`, `label: '2–5 days'`), with the filter options being those
   buckets. Simplest; keeps `ArchiveIndex` exact-match. Downside: bucket
   boundaries are fixed in the route, not data-driven.
2. **Add a `range` facet type to `ArchiveIndex`:** the facet carries a numeric
   value; the filter group defines ranges (`{min,max,label}[]`); matching tests
   `min <= value <= max`. More general, reusable across both archives, but
   touches the template's filter logic and `types.ts`.

Recommendation: option 2 if both tours and cruises need it (they do), so the
range logic lives once in the template rather than being re-bucketed per route.

## Adding a new archive (no template edits)

1. **Schema** — copy `src/sanity/schemas/hotelsArchive.ts` to e.g.
   `toursArchive.ts`, swap the `reference` target (`hotel` → `tour`) on
   `featured.hotel` and `collections[].hotels`, rename the type, and register it
   in `schemas/index.ts`. (Per-type docs were chosen over one generic doc.)
2. **Query** — add `toursArchiveQuery(locale)` mirroring `hotelsArchiveQuery`,
   resolving the referenced items with that type's card projection.
3. **Route** — create `app/(site)/[locale]/<archive>/page.tsx`. Map each raw doc
   to an `ArchiveItem`, building its `facets` array, and build the
   `FacetFilterGroup[]` for the index. Pass everything to `<ArchiveTemplate>`.
   Copy the hotels route as the starting point.
4. **i18n** — add the archive's UI strings (index title/intro, item noun,
   featured kicker/link, filter labels, foot-band copy) under a namespace in
   `messages/{en,es,ja}.json`. Generic strings (`all`, `collectionLabel`,
   `emptyState`) live in the shared `archive` namespace.
5. **Content** — create the archive-settings document in Studio and curate the
   essay, featured item, and collections (reference lists, not auto-queries —
   the curation is the editorial value).

That's it: new facet config + new content, not template changes.

## Notes

- Localization: pass already-resolved (locale + EN fallback) strings and
  PortableText into the template. The hotels route resolves these in GROQ.
- Graceful fallbacks: cards/featured render without an image (placeholder), and
  the index shows an empty state when filtered to zero.
- RTL is intentionally out of scope (no RTL locales planned for this site).
