# SubcategoryTemplate

The **middle layer** of the three-level Tours/Packages structure
(category → **subcategory** → single). A long editorial body fused with a
scoped product grid under a place hero. It is **not** an ArchiveTemplate
instance and not the article template — it composes existing parts
(`PlaceHero`, `Body`, `ArchiveCard`, `ConciergeCTA`, `ArticleFootBand`,
`FloatingConcierge`).

## Composition (top → bottom)

`PlaceHero` → three-level breadcrumb → centered editorial body (PortableText,
single-column, may include a `conciergeNote`) → scoped product grid
("{n} {track} days from {city}", `ArchiveCard` lead + grid, optional
"All {city} tours →") → contextual `ConciergeCTA` → `ArticleFootBand` →
`FloatingConcierge`.

The foot band's third column is **cross-links** (city guide / hotels / the
other day-tour track), built by `lib/cross-links.ts#buildCityCrossLinks` and
rendered via `ArticleFootBand`'s optional `practicalItems` prop.

## Wiring (this session: day-tour subcategories)

`tourLanding` docs for `private-day-tour` / `group-day-tour` (discriminated by
`destinationCity`) are routed by the `[...rest]` catch-all to
`SubcategoryRoute`, an async wrapper that:

1. maps the landing's already-scoped `tours` (from `tourLandingBySlugQuery`,
   filtered by city × track) to `ArchiveItem`s,
2. resolves the other-track landing slug (`otherTrackLandingSlugQuery`) for the
   cross-links,
3. builds the contextual CTA + foot band and renders `SubcategoryTemplate`.

`tourLanding` gained: `conciergeNote`/`definitionList` support on the `intro`
essay (via `_archiveBlocks`), and an optional `ctaContext` CTA-copy override.

## Adding package-theme / origin-region subcategories (deferred)

Package landings (`private-package` × theme, `group-package` × origin-region)
reuse this template unchanged:

1. Build the package **category** archives first (`/private-packages`,
   `/group-packages`) — out of scope here.
2. In the catch-all, route those `tourLanding` keys to `SubcategoryRoute` too
   (extend the key check; the discriminator is `themeRef` / `originRegion`
   instead of `destinationCity`).
3. Generalise `SubcategoryRoute`'s axis handling: derive the hero kicker,
   breadcrumb (`Packages / {track} / {theme|region}`), scoped heading, and
   cross-links from the theme/region instead of the city. The cross-link helper
   stays the same shape (swap city guide → theme hub).
4. `tourLandingBySlugQuery` already scopes `tours` by `themeRef` / `originRegion`
   — no query change needed.

No `SubcategoryTemplate` edits should be required — only the route's
axis-resolution in `SubcategoryRoute`.

## Single tour close rhythm (`TourCloseRhythm`)

The single tour page (catch-all `tour` branch → `TourPageView`) gains the
article archetype's closing rhythm **after** its concierge CTA, via
`TourCloseRhythm` rendered as a sibling: a related weave ("More {track} days in
{city}" siblings) + `ArticleFootBand` (in-season / journal / city cross-links
from the same `buildCityCrossLinks` helper) + `FloatingConcierge`. Gated to
`type === 'dayTour'` with a city; packages get this when their archives land.
