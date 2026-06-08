# Structured-Data / Schema.org Markup Audit

**Date:** 2026-06-08
**Scope:** Read-only audit. No code or schema changes made.
**Headline:** The site already has a well-architected JSON-LD system (`src/lib/structured-data.ts` + `<JsonLd />`) wired into ~10 page types. The Organization schema on root layout is comprehensive. The gaps are not "no schema exists" — they're targeted: a handful of high-traffic detail page types currently emit *only* a `BreadcrumbList` when they could be emitting `Hotel`, `TouristTrip` (cruise), `TouristAttraction`, or `Article`. The fixes are small-to-medium and the data largely already exists in Sanity.

---

## 1. Inventory — what JSON-LD does each page emit today?

| Page type | Route | JSON-LD emitted | Generated dynamically? |
|---|---|---|---|
| Site-wide (all pages) | root layout | `TravelAgency` (Organization) | ✅ from `siteSettings` |
| Homepage | `/[locale]` | Only the site-wide `TravelAgency` | n/a (no page-specific) |
| Guide hub | `/[locale]/guide` | `BreadcrumbList` | ✅ |
| Destination guide page | `/[locale]/guide/[citySlug]` | `Place` + `BreadcrumbList` | ✅ |
| Guide article | `/[locale]/guide/[citySlug]/[slug]` | `BreadcrumbList` only | ✅ |
| Tour detail (day tour) | `/[locale]/[slug]` (catch-all → `TourPageView`) | `TouristTrip` + `BreadcrumbList` | ✅ |
| Tour detail (private package) | same catch-all | `TouristTrip` + `BreadcrumbList` | ✅ |
| Tour detail (group package, 9-day) | same catch-all | `TouristTrip` + `BreadcrumbList` | ✅ |
| Nile cruise detail | `/[locale]/nile-cruises/[slug]` | `BreadcrumbList` only | ✅ |
| Hotel detail | `/[locale]/hotels/[slug]` | `BreadcrumbList` only | ✅ |
| Journal article | `/[locale]/blog/[slug]` | `Article` + `BreadcrumbList` | ✅ |
| Journal category | `/[locale]/blog/category/[slug]` | `BreadcrumbList` | ✅ |
| Travel tip | `/[locale]/travel-tips/[slug]` | `Article` + `BreadcrumbList` | ✅ |
| Wiki monument | `/[locale]/wiki/monuments/[slug]` | `LandmarksOrHistoricalBuildings` (Place subtype) + `BreadcrumbList` | ✅ |
| Wiki person / dynasty / deity | `/[locale]/wiki/{people,dynasties,deities}/[slug]` | **None** (no page-specific JSON-LD) — also `Disallow`'d in robots.ts | n/a |
| About | `/[locale]/about` | Only site-wide Org | — |
| Contact | `/[locale]/contact` | Only site-wide Org | — |
| FAQ | `/[locale]/faq` | Only site-wide Org | — |
| Packages list | `/[locale]/packages` | Only site-wide Org | — |
| Tours list | `/[locale]/tours` | Only site-wide Org | — |
| Hotels list | `/[locale]/hotels` | Only site-wide Org | — |
| Nile cruises list | `/[locale]/nile-cruises` | Only site-wide Org | — |
| Static editorial (`/responsible-travel`, `/hotel-grade-concept`, `/disclaimer`, etc.) | various | Only site-wide Org | — |

---

## 2. Codebase state — does a JSON-LD generation system exist?

**Yes — and it's well-built.** There's no `schema-dts` / `next-seo` / `react-schemaorg` dependency, but there's a hand-rolled equivalent.

- **`src/lib/structured-data.ts`** — builder functions returning plain schema.org objects:
  - `buildOrganizationSchema(input)` → `TravelAgency` with `address`, `contactPoint`, `sameAs[]`, `areaServed`, `knowsAbout`, `subOrganization[]` (sister brands), and `hasCredential[]` (the four accreditations are hardcoded here: **JATA, IATA, ASTA, ETAA**).
  - `buildArticleSchema(input, locale, path?)` → `Article` with `headline`, `description`, `image`, `datePublished`, `dateModified`, `author` (Person + URL when slug present), `articleSection`, `publisher` (back-reference to `#organization`), `inLanguage`.
  - `buildTouristTripSchema(input, locale)` → `TouristTrip` with `name`, `description`, `url`, `image`, `provider` (`@id` back-ref), `itinerary[]` (Places), and `offers` (only when `priceFrom` is a number).
  - `buildPlaceSchema(input, locale)` → `Place` for cities, `LandmarksOrHistoricalBuildings` for monuments, with `geo.GeoCoordinates`, `address`, `image`.
  - `buildPersonSchema(input, locale)` → `Person` for wiki people / authors (currently **not used by any page**).
  - `buildBreadcrumbList(items, locale)` → standard `BreadcrumbList`.
  - `buildFAQSchema(items)` → `FAQPage` (currently **not used by any page**).

- **`src/components/JsonLd.tsx`** — minimal renderer; takes one object or an array, serializes with `<` escaping, emits `<script type="application/ld+json">`. Accepts arrays so a page can emit multiple schemas in one tag set.

- **Wiring:** `siteSettings` is fetched in the root layout (`src/app/(site)/[locale]/layout.tsx`) and passed to `buildOrganizationSchema`. The result is rendered as `<JsonLd data={orgSchema} />` directly in `<body>` on every page.

- **Per-page metadata** uses Next.js `generateMetadata` everywhere via `buildMetadata` / `buildStaticMetadata` from `src/lib/seo.ts` (separate from structured data — handles `title`, `description`, OG, canonical, hreflang).

- **i18n is correctly handled.** `buildOrganizationSchema` is called with the locale-resolved `siteSettings`, so JA pages emit Japanese `name`, `description`, `address`, etc. The detail schemas (Article, TouristTrip, Place, Person) take already-resolved per-locale values and set `inLanguage: locale`. Hreflang itself is in metadata, not JSON-LD.

**The `@id` discipline is correct.** The Organization has `@id: '{SITE_URL}#organization'`. Article and TouristTrip schemas reference it via `publisher: { '@id': ... }` and `provider: { '@id': ... }` — meaning Google's parser can correctly join the entity graph instead of treating each schema as orphaned.

**There is no `WebSite` schema.** Standard practice on a content site is to emit a single `WebSite` JSON-LD on the homepage with a `SearchAction.potentialAction` (sitelinks search box) and `inLanguage`. Currently absent.

---

## 3. Sanity → schema.org field mapping

### `tour` → `TouristTrip` *(emitted; partial)*

| Sanity field | schema.org property | Status |
|---|---|---|
| `title` (i18n) | `name` | ✅ wired |
| `summary` (i18n text) | `description` | ✅ wired — and it's the right field (concise, not the editorial body) |
| `slug` | `url` (via `absoluteUrl`) | ✅ wired |
| `heroImage` (localizedImage) | `image` | ✅ wired |
| `cities[]` → `name` | `itinerary[].Place.name` + `address.addressLocality` | ✅ wired — but reductive (only the city name; could carry `geo` if it joined to `city.coordinates`) |
| `priceFrom` (number) | `offers.price`, `offers.priceCurrency` | ✅ wired — **but `priceFrom` is not a field on `tour.ts`. The current code reads a value that doesn't exist on the schema.** The schema has `basePrice` (group packages), `priceIndication` (consultation prose, i18n), `priceTiers`, and `peakUpliftPct`. `priceFrom` appears to be a legacy/expected field. **Confirmed gap.** |
| `durationDays` | `TouristTrip.itinerary.duration` or `Duration` ISO-8601 | ❌ field exists in Sanity; **not currently emitted** |
| `durationLabel` (i18n) | could feed `description` if no `summary` | ❌ not emitted |
| `type` (`dayTour` / `package`) | `additionalType` or `touristType` | ❌ not emitted |
| `tourMode` (`private` / `group`) | `additionalType` ("PrivateTour" via Schema.org extension, or a `Specification`) | ❌ not emitted |
| `theme` (reference) | `keywords` or `about` | ❌ not emitted |
| `originRegion` (group packages) | `audience.GeographicArea` | ❌ not emitted |
| `maxGroup` (group packages) | `maximumAttendeeCapacity` | ❌ not emitted |
| `departures[]` (group packages) | could fan out to multiple `TouristTrip` instances with `Event.startDate` — or one trip with `Schedule` | ❌ not emitted (largest editorial decision needed) |
| `highlights[]` (i18n) | `tourBookingPage` items or `description` enrichment | ❌ not emitted |
| `inclusions` / `exclusions` (PT) | not a great fit; can flow into `additionalProperty` | ❌ not emitted (low priority — these are PT) |
| `days[]` (itinerary) | could fan to `TouristTrip.subTrip[]` with `Day n` | ❌ not emitted |
| `cities[].coordinates` (via city ref) | `itinerary[].geo` | ❌ not joined — current query only pulls `cities[].name` |

### `nileCruise` → `TouristTrip` (or `BoatTrip` if more specific) *(not emitted)*

| Sanity field | schema.org property | Status |
|---|---|---|
| `name` | `name` | ❌ no schema emitted |
| `summary` (i18n) | `description` | ❌ |
| `heroImage` | `image` | ❌ |
| `type` (`cruise-ship` / `yacht` / `dahabiya` / `felucca`) | `additionalType` or schema-specific (BoatTrip exists) | ❌ |
| `cruiseRoute` | `itinerary` or `subjectOf` | ❌ |
| `tier` (`luxury`, etc.) | `audienceType` or `aggregateRating` placeholder | ❌ |
| `capacity` | `maximumAttendeeCapacity` | ❌ |
| `durationNights` | `Duration` ISO-8601 (`P3D` etc.) | ❌ |
| `departureCity` / `returnCity` | `itinerary[0]` / `itinerary[N]` | ❌ |
| `departureWeekdays[]` | `Schedule.byDay` | ❌ |
| `itinerary[]` (cruiseDay) | `subTrip[]` | ❌ |
| `poweredBy` (operating partner) | `provider` (override) or `additionalProperty` | ❌ |

### `hotel` → `Hotel` (or `LodgingBusiness`) *(not emitted)*

| Sanity field | schema.org property | Status |
|---|---|---|
| `name` | `name` | ❌ |
| `city` (ref) | `address.addressLocality` + `geo` (if city has coords) | ❌ |
| `category` (standard/deluxe/luxury/boutique) | `audience.audienceType` or `additionalType` | ❌ |
| `starRating` (1–5) | `starRating.Rating.ratingValue` | ❌ |
| `summary` (i18n) | `description` | ❌ |
| `heroImage`, `gallery` | `image`, `photo` | ❌ |
| **Missing in schema:** `priceRange`, `amenityFeature`, `checkinTime`, `checkoutTime` | — | gap in Sanity (likely acceptable — operator does not list rooms) |

### `guideArticle` → `Article` *(for `kind: article` sections)* / `TouristAttraction` *(for `kind: attraction`)*

| Sanity field | schema.org property | Status |
|---|---|---|
| `title` | `name` / `headline` | ❌ not emitted (only Breadcrumb is currently emitted) |
| `summary` | `description` | ❌ |
| `heroImage` | `image` | ❌ |
| `parentCity.name` | `containedInPlace.Place.name` | ❌ |
| `kind` (`article` / `attraction`) | discriminator between `Article` and `TouristAttraction` | ❌ |
| `monumentType` | `additionalType` (for attraction kind) | ❌ |
| `preciseLocation` (string) | `address.streetAddress` | ❌ |
| `coordinates` | `geo.GeoCoordinates` | ❌ |
| `placesToGoGroup` | `category` | ❌ |

### `city` → `Place` / `TouristDestination` *(emitted as `Place`)*

| Sanity field | schema.org property | Status |
|---|---|---|
| `name` | `name` | ✅ |
| `summary` | `description` | ✅ |
| `coordinates` | `geo` | ✅ |
| `region` / `guideRegion` | `containedInPlace` | ❌ not emitted |
| `keyFacts.bestSeason` | `additionalProperty` or `tourBookingPage` | ❌ |
| `keyFacts.daysNeeded` | `additionalProperty` (could populate "recommended visit duration") | ❌ |
| Type tag — `TouristDestination` is more specific than `Place` for a city-guide context | — | could be upgraded |

### `article` (journal) → `Article` *(emitted)*

| Sanity field | schema.org property | Status |
|---|---|---|
| `title` | `headline` | ✅ |
| `deck` | `description` | ✅ |
| `slug` | URL | ✅ |
| `publishedAt` / `updatedAt` | `datePublished` / `dateModified` | ✅ |
| `heroImage` | `image` | ✅ |
| `author.name` / `author.slug` | `author.Person.name` + `url` | ✅ |
| `category.name` | `articleSection` | ✅ |
| `relatedArticles[]` | `mentions[]` or `relatedLink[]` | ❌ not emitted (low value) |

**Status: complete enough.** Journal is the best-mapped content type today.

### `wikiMonument` → `LandmarksOrHistoricalBuildings` *(emitted)*

| Sanity field | schema.org property | Status |
|---|---|---|
| `name`, `summary`, `coordinates`, `heroImage`, `preciseLocation` | name, description, geo, image, address | ✅ |
| `monumentType` | `additionalType` | ❌ |
| `builtBy`, `builtDuring`, `dedicatedTo` | could populate `description` enrichment or `additionalProperty` | ❌ |
| `buriedHere[]` (refs to wikiPerson) | `containedInPlace` reverse — could emit `subjectOf` | ❌ |

### `wikiPerson` → `Person` *(builder exists, NOT used by any page)*

| Sanity field | schema.org property | Status |
|---|---|---|
| `name`, `role`, `alternateNames`, `summary`, `heroImage` | Person fields | builder handles them — but the **page never calls `buildPersonSchema`** |
| `reignStartYear`, `reignEndYear`, `reignDisplay` | could populate `description` and `additionalProperty` | builder uses `reignDisplay` only |
| `dynasty` (ref) | `affiliation` | ❌ |
| `predecessor`, `successor` | `predecessor.Person`, `successor.Person` (custom; not standard) | ❌ |
| `burialSite` (ref) | `deathPlace` is close but not exact | ❌ |

Also: wiki person/dynasty/deity routes are currently **`Disallow`'d in `robots.ts`** ("/wiki/deities", "/wiki/dynasties", "/wiki/people"). So even if Person schema were emitted, no crawler would see it. Strategic question: is the wiki/people content meant to stay deindexed, or is the disallow temporary?

### `siteSettings` → `TravelAgency` *(emitted on every page)*

Already comprehensive. See §4.

### `wikiDynasty` / `wikiDeity` → `Thing` or `subjectOf` Article

No mapping today. Lower priority because the routes are disallowed in robots.

### `faqEntry` + `faqCategory` → `FAQPage`

Builder `buildFAQSchema` exists but **the `/faq` page does not call it.** Trivial fix.

---

## 4. The Organization-level schema

**Status: present and ~90% complete.** Emitted on every page via root layout.

| Property | Status |
|---|---|
| `@type: 'TravelAgency'` | ✅ |
| `@id` | ✅ (`{SITE_URL}#organization`) |
| `name` | ✅ from `siteSettings.siteName` |
| `description` | ✅ from `siteSettings.tagline` |
| `slogan` | ✅ same |
| `url` | ✅ (caveat: depends on `NEXT_PUBLIC_SITE_URL` being set in prod — flagged in source comments) |
| `foundingDate` | ✅ `"2003"` (hardcoded) |
| `founder` | ❌ **missing.** `siteSettings.system.ts` has no founder field. Founder is Islam Hussein per brand facts; not exposed anywhere structured. |
| `legalName` | ❌ not in schema or output |
| `logo` | ✅ when `siteSettings.logo` is set |
| `image` | ✅ when `siteSettings.defaultOgImage` is set |
| `address` | ✅ structured `PostalAddress`; defaults `addressCountry: 'EG'` |
| `contactPoint` | ✅ uses `phone` *or* `whatsapp` (fallback), `email`, `availableLanguage: ['en','es','ja']` |
| `sameAs[]` | ✅ pulls Facebook / Instagram / YouTube / LinkedIn / Twitter / TripAdvisor |
| `areaServed` | ✅ Country = Egypt |
| `knowsAbout` | ✅ from Sanity, with editorial note: "important for AI-search citation" |
| `subOrganization` | ✅ sister brands (AffordEgypt, Soléi, etc.) |
| `hasCredential` | ✅ — **all four accreditations (JATA, IATA, ASTA, ETAA) are hardcoded in `structured-data.ts`** with `recognizedBy.Organization.url` to each accrediting body |
| `serviceType` | ❌ not emitted (could be "Bespoke travel design", "Private guided tours", "Cruise booking", etc.) |

**Two genuine gaps in the Org schema:**
1. **Founder.** No `siteSettings.founder` field; no `founder.Person` in JSON-LD output. Brand fact "Founder: Islam Hussein" is currently not machine-readable.
2. **legalName / serviceType.** Cosmetic but useful for Knowledge Panel completeness.

---

## 5. Breadcrumb and navigation structure

**Status: present on most detail pages, missing from a few.**

Emitted on: tour detail, package detail, guide hub, city guide, guide article, journal article, journal category, hotel detail, nile cruise detail, travel tip, wiki monument.

Missing on: homepage (debatable — usually no breadcrumb on root), about, contact, FAQ, packages/tours/hotels/nile-cruises list pages, all static editorial pages (`/responsible-travel`, `/hotel-grade-concept`, etc.), wiki listing pages, wiki person/dynasty/deity detail.

The list pages are the cheapest visible gap — adding a 2-item `BreadcrumbList` (Home → Tours) on `/tours`, `/packages`, `/hotels`, `/nile-cruises` is a 4-line change per page.

---

## 6. Editorial body vs. structured description (the hybrid tradeoff)

**Verdict: the data shape already supports a clean separation.**

`tour.ts` has a dedicated `summary` field — `internationalizedArrayText`, marked required, with the editor description: *"One or two sentences. Shown on cards and search results."* This is exactly what `TouristTrip.description` should consume — and that's what the current `buildTouristTripSchema` does.

`article.ts` has `deck` — same pattern, populates `Article.description`.

`city.ts` has `summary` — same pattern, populates `Place.description`.

`guideArticle.ts` has `summary`. `nileCruise.ts` has `summary`. `hotel.ts` has `summary`. `wikiMonument.ts` has `summary`. `wikiPerson.ts` has `summary`.

**Every content type has a short-description field distinct from `body`.** The editorial-vs-machine concern is not a real concern here — there's no need to derive structured descriptions from portable-text body. The summary field is the bridge.

The one place this isn't true is the static landing pages (`/about`, `/contact`, `/responsible-travel`, etc.), which are translation-string-driven, not Sanity-driven. Those don't need a "summary field" — they need a per-page schema emission with the description taken from the static copy (similar to how `buildStaticMetadata` reads from translations).

---

## 7. Pricing exposure in structured data

**Current state:**

- The `buildTouristTripSchema` builder accepts a `priceFrom: number` and, when truthy, emits an `Offer` with `price`, `priceCurrency` (locale-aware via `currencyFor`), and `availability: InStock`.
- **`priceFrom` is not a field on `tour.ts`.** The schema's pricing fields are: `priceIndication` (i18n prose), `priceTiers` (likely a tour-system block), `priceNote`, `singleSupplement`, `basePrice` (group packages, scheduled departures), `peakUpliftPct`, `maxGroup`, `departures[]`.
- The call site in `TourPageView.tsx` passes `tour.priceFrom` — which, given the schema, will be undefined for every tour. So **no `offers` block is being emitted for any tour today, despite the code path existing.**

**Options for what to emit:**

| Pattern | When it fits | What schema.org allows |
|---|---|---|
| **A. Emit `offers.Offer` with `price` = `basePrice`** | Group packages where `basePrice` is set | Standard. `priceCurrency: 'EUR'` (basePrice is per the schema description "per person, EUR"). Set `availability: InStock` and `eligibleQuantity` if maxGroup is known. |
| **B. Emit `offers.AggregateOffer` with `lowPrice` = `basePrice` and `highPrice` = `basePrice * (1 + peakUpliftPct/100)`** | Group packages with peak uplift configured | More accurate — communicates the range without lying about a single price. |
| **C. Emit `offers.Offer` with `priceSpecification.PriceSpecification.priceCurrency` but no `price`, plus `description` like "Consultative pricing — quoted per itinerary"** | Private packages with `priceIndication` set | Schema-valid but Google may flag as "missing price." |
| **D. Omit `offers` entirely; rely on the editorial body and the `provider` back-reference** | Private packages with no fixed price | Cleanest. No false signal. |
| **E. Emit `offers.priceRange` (string, e.g. "€€€")** | LodgingBusiness only; not standard for TouristTrip | Not applicable here. |

**Recommendation (for you to confirm):**
- **Group packages:** option B (AggregateOffer with low/high from base + peak uplift), once `basePrice` is set. Until then, option D.
- **Private packages:** option D. The honest answer matches the consultation model — emitting a fake price would be worse than emitting none.
- **Day tours:** depends on whether they have a list price. Looking at the schema, day tours follow the same `priceIndication` pattern (no transactional price field). Default to D unless a `priceFrom` field is added.

**This implies a small schema decision before any code change:** is `priceFrom` going to be added to `tour.ts` as a real field (a per-person published price for day tours), or is the consultation-only pattern uniform across all tour types? If the latter, the unused `priceFrom` path in `buildTouristTripSchema` should be removed.

---

## 8. AI crawler posture (`robots.txt`)

**Verdict: explicitly welcoming AI crawlers.** `src/app/robots.ts` is runtime-gated:

- On non-production hosts → block everything (Railway preview won't get indexed).
- On production →
  - `User-Agent: *` → `Allow: /` with disallows for `/studio`, `/api`, `/wiki/deities`, `/wiki/dynasties`, `/wiki/people`.
  - Then **explicit `Allow: /` for `anthropic-ai`, `ClaudeBot`, `GPTBot`, `ChatGPT-User`, `Google-Extended`, `PerplexityBot`, `CCBot`.**

This is a deliberate strategic decision (also documented in `public/llms.txt`). It's the right posture for this brand: editorial content as a distribution asset, LLM citation as a channel. The four wiki disallows are likely a separate decision (incomplete content or migration in progress) — not an AI-specific block.

**Effective posture:** the site is *more* AI-friendly than 90% of comparable travel sites. Combined with `llms.txt` (which is the AI-native equivalent of `sitemap.xml` and clearly explains brand voice + citation preferences), this is already a strong baseline.

---

## 9. Gap analysis

### Present and correct (no work needed)
- Organization / TravelAgency schema on every page
- Accreditations (JATA / IATA / ASTA / ETAA) in `hasCredential`
- BreadcrumbList on the major detail pages
- Article schema for journal posts
- Article schema for travel tips
- Place schema for cities
- LandmarksOrHistoricalBuildings (Place subtype) for wiki monuments
- TouristTrip schema for tours (basic) — minus the broken `priceFrom` path
- AI crawler robots.txt posture
- `llms.txt` content guide
- The Sanity short-description fields (`summary`, `deck`) are populated and structurally separate from the editorial `body` — the hybrid tradeoff is real but already solved in the data model

### Present but incomplete

| Schema | What's missing |
|---|---|
| `TouristTrip` (tour pages) | `duration`, `additionalType` (private/group/day-tour/package), `audience` (originRegion), `maximumAttendeeCapacity` (maxGroup), proper `offers` (the current path keys off a non-existent field), `subTrip[]` for itinerary days, `geo` on itinerary places (cities have coordinates; not joined into the query) |
| `Organization` (TravelAgency) | `founder.Person` (Islam Hussein), `legalName`, `serviceType[]` |
| `Place` (city pages) | upgrade to `TouristDestination` subtype; `containedInPlace` (region), `additionalProperty` for keyFacts (best season, days needed) |
| `LandmarksOrHistoricalBuildings` (wiki monument) | `additionalType` (from `monumentType`), `subjectOf` linking to wikiPerson refs |
| `Article` (journal) | already strong; could add `mentions[]` from relatedArticles/relatedTours |

### Missing entirely

| Schema | Where it should go | Why it matters |
|---|---|---|
| `WebSite` (with `SearchAction` if applicable, otherwise minimal) | Homepage | Google sitelinks; identifies the canonical site entity |
| `Hotel` / `LodgingBusiness` | `/hotels/[slug]` | Every hotel detail page currently has zero subject-matter schema |
| `TouristTrip` (or `BoatTrip`) | `/nile-cruises/[slug]` | Same — cruise detail pages have only breadcrumb |
| `Article` or `TouristAttraction` (depending on `kind`) | `/guide/[citySlug]/[slug]` | Guide articles are the editorial backbone; emitting only Breadcrumb is the biggest single SEO/AI miss |
| `FAQPage` | `/faq` | Builder exists; page just doesn't call it |
| `Person` | `/wiki/people/[slug]` | Builder exists; page doesn't call it (also: route is currently `Disallow`'d, so fix robots first if wiki/people should be discoverable) |
| `BreadcrumbList` on list pages | `/tours`, `/packages`, `/hotels`, `/nile-cruises`, `/blog`, etc. | Trivial, high-coverage win |
| `Organization.founder` | exposed via Sanity → root layout | Brand fact "Founder: Islam Hussein" is invisible to crawlers |
| `ContactPoint` enrichment on `/contact` | Contact page emits a `LocalBusiness` or extra ContactPoint duplicating the Org's, with form-anchor structure | Helps "How do I contact Travel2Egypt" type AI queries find the right page |
| Static-page schemas (about, responsible-travel, etc.) | Each static page emits a `WebPage` with `inLanguage` + breadcrumb at minimum | Currently only inherits Org |

---

## 10. Effort sizing

| Item | Effort | Notes |
|---|---|---|
| Add `BreadcrumbList` to the 4 list pages + 8 static pages | **S** | One-line `buildBreadcrumbList` call per page. No schema changes. ~30 min total. |
| Add `FAQPage` to `/faq` (builder already exists) | **S** | Query `faqEntry` docs, map to `{question, answer}`, call `buildFAQSchema`. ~1 hour incl. plain-text rendering of PT answers. |
| Add `Hotel` schema to `/hotels/[slug]` | **S** | All needed fields exist on `hotel.ts`. New `buildHotelSchema(input, locale)` in `structured-data.ts`. ~1–2 hours. |
| Add `TouristTrip` (or `BoatTrip`) schema to `/nile-cruises/[slug]` | **S–M** | All fields exist on `nileCruise.ts`. New builder. Decision: TouristTrip vs BoatTrip type. ~2 hours. |
| Add `Article` / `TouristAttraction` to `/guide/[citySlug]/[slug]` | **S** | `guideArticle.kind` discriminates. Existing fields cover it. ~1 hour. |
| Add `WebSite` schema to homepage | **S** | New builder + one-line call. ~30 min. Optional SearchAction. |
| Add `founder` to Org schema | **S+M (schema change)** | Add `founder` field group to `siteSettings` (name, slug, optional Person ref), populate in Studio, render in `buildOrganizationSchema`. ~1 hour code + 5 min content. |
| Enrich `TouristTrip` with `duration`, `additionalType`, `audience`, `maximumAttendeeCapacity` | **S** | All fields exist. ~1 hour. |
| Fix `priceFrom` bug — decide on pricing model first, then either remove the unused code path or wire it to `basePrice` / AggregateOffer | **S after decision** | Code change is 20 min once the editorial decision is made (§7). |
| Join `city.coordinates` into tour `itinerary[].Place.geo` | **S** | Modify the tour query to include `cities[].coordinates`. ~30 min. |
| Add `Person` schema to `/wiki/people/[slug]` | **S** | Builder exists. But also need to decide whether wiki/people should be removed from robots `Disallow`. |
| Upgrade `Place` → `TouristDestination` on city pages + add `containedInPlace` (region) | **S** | One-line type change + region join. ~30 min. |
| Static page schemas (about, contact, responsible-travel, etc.) | **M** | Need a new pattern: static-page schema builder reading from translations. ~3–4 hours to design + apply across ~8 pages. |
| Pre-launch group package departures schema (Event / Schedule fan-out) | **M–L** | Only relevant once `basePrice` and `departures[]` are populated. Requires editorial decision on whether to expose dates as `Event` entities. Defer until departures data is real. |

**Total to close the visible 80%: well under one engineering day.** No new dependencies. The hardest call is the pricing/offers question, which is a content decision, not an engineering one.

---

## 11. Recommended order of attack

Highest (AI/SEO impact) ÷ (effort), descending:

1. **Add `Article` (or `TouristAttraction`) to `/guide/[citySlug]/[slug]`** — the guide articles are the highest-value content the brand publishes for AI citation, and they currently emit only Breadcrumb. (S)
2. **Add `Hotel` to `/hotels/[slug]` and `TouristTrip`/`BoatTrip` to `/nile-cruises/[slug]`** — same gap, two more detail-page types. (S each)
3. **Enrich `TouristTrip` on tour pages** with `duration`, `additionalType`, `audience`, `maximumAttendeeCapacity`. Same builder, fields already exist. (S)
4. **Add `WebSite` schema on the homepage** — Knowledge Panel identity. (S)
5. **Add Breadcrumb to list pages and key static pages** (`/tours`, `/packages`, `/hotels`, `/nile-cruises`, `/about`, `/contact`, `/faq`, `/responsible-travel`, `/hotel-grade-concept`). (S, batchable)
6. **Wire `FAQPage` to `/faq`.** Builder exists; query is the only new piece. (S)
7. **Add `founder` to siteSettings + render in Org schema.** Brand-fact gap. (S + small schema change)
8. **Decide on the pricing/offers question (§7) and either remove the dead `priceFrom` path or implement `AggregateOffer` for group packages.** Engineering trivial; the decision is editorial. (S after decision)
9. **Upgrade city `Place` → `TouristDestination` with `containedInPlace`.** Subtype upgrade. (S)
10. **Join `city.coordinates` into tour itinerary `geo`.** Query change. (S)
11. **Static page schemas (about, contact, responsible-travel, etc.).** Useful but lower marginal value once Org + Breadcrumb cover the basics. (M)
12. **Wiki person/dynasty/deity schemas + robots.txt re-evaluation.** Defer until the wiki content's discoverability decision is made. (S after decision)
13. **Group package departures as `Event`s.** Defer until `basePrice` + `departures[]` are populated for real. (M–L)

Steps 1–6 together close the "every detail page emits a subject-matter schema" gap. Steps 7–10 polish. 11–13 are post-launch.

---

## 12. Open questions for you

1. **Pricing/offers exposure (§7).** Three sub-questions:
   - Should `priceFrom` become a real field on `tour.ts` for day tours? If yes, the existing code path is correct and just needs the schema field. If no, the dead path should be removed.
   - For group packages: emit `AggregateOffer(low=basePrice, high=basePrice*(1+peakUpliftPct/100))` once `basePrice` is set?
   - For private packages: confirm "omit `offers` entirely" is the right pattern.

2. **The wiki/people disallow.** The four `Disallow` entries (`/wiki/deities`, `/wiki/dynasties`, `/wiki/people`) — are those temporary while content is built, or a permanent strategic choice? The answer determines whether to invest in `Person`/`wikiDynasty`/`wikiDeity` JSON-LD now or defer.

3. **`founder` exposure.** Want me to add a `founder` field group to `siteSettings` (name, optional slug for `/about/islam-hussein`, optional Person reference) so it can be populated in Studio and rendered into Org JSON-LD? Or hardcode founder='Islam Hussein' in `structured-data.ts` like the accreditations currently are?

4. **`TouristTrip` vs `BoatTrip` for Nile cruises.** Schema.org has both. `TouristTrip` is generic; `BoatTrip` is a `Trip` subtype but less recognized by tooling. My instinct is `TouristTrip` with `additionalType: 'BoatTrip'`. Confirm?

5. **`TouristAttraction` vs `Article` discriminator on `/guide/[citySlug]/[slug]`.** `guideArticle.kind` already has `'article'` and `'attraction'` values. Confirm that `kind='attraction'` should emit `TouristAttraction` (with `geo`, `containedInPlace`, `address`) while `kind='article'` emits `Article` (with `headline`, `articleSection: parentCity.name`). That's my read of the schema.

6. **WebSite `SearchAction`.** Do you have or plan a site-wide search? If yes, the homepage `WebSite` schema should advertise it as a `potentialAction.SearchAction`. If no, emit `WebSite` without `SearchAction`.

7. **Static page schemas.** Are `/responsible-travel`, `/hotel-grade-concept`, `/disclaimer`, `/privacy-policy`, `/terms`, `/cookie-policy`, `/distance-between-egyptian-cities`, `/your-name-in-hieroglyphs` worth the effort, or are they low enough traffic that inheriting only the Org schema is fine?

8. **Re-using `buildPersonSchema` for `/about/[author]`.** The builder supports an `author` type that routes to `/about/[slug]`. Are there author bio pages today, or is this dormant code?

---

## Summary

The site is in **much better shape** than this audit was originally framed to discover. The Organization JSON-LD is comprehensive and emitted everywhere. A builder library exists. Six page types already emit good per-page schema. The accreditations and AI-crawler welcomes are deliberate, well-documented, and correct.

The gaps are concentrated in four areas:

1. **Detail pages emitting only Breadcrumb when they could emit subject-matter schema** — guide articles, hotels, nile cruises. (Steps 1–2 above.)
2. **The `TouristTrip` schema is shallow** relative to the rich Sanity data — duration, type, audience, capacity are all sitting unused. (Step 3.)
3. **A bug:** `priceFrom` is being read from a non-existent field. No tour has ever emitted an `offers` block. (Decision-blocked.)
4. **The Founder is not in structured data** even though "Founded 2003 by Islam Hussein" is a core brand fact. (Small schema addition.)

None of this requires content backfill or new libraries. Closing 80% of the gap is a single engineering day after the open questions in §12 are answered. The editorial-vs-machine-readability tradeoff the brand has been managing is **not a real tradeoff** at the data layer — every content type already has a clean `summary`/`deck` field separate from the editorial `body`, which is exactly the right shape.
