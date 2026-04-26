# Travel2Egypt — Next.js + Sanity rebuild

Multilingual editorial-grade travel site. Next.js 15 App Router, Sanity CMS,
next-intl, Tailwind v4, TypeScript.

This is the foundation scaffold from the strategic rebuild conversation. It
encodes the architectural decisions agreed in that brief: consultation-only
booking model, locale-aware schemas from day one, editorial weight in the
content model, sister-brand portfolio structure.

---

## What's in this repo

```
.
├── messages/                       UI strings per locale (en, es, ja)
├── scripts/
│   └── seed.ts                     Fixture seeder for the demo
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx          Locale-aware layout, fonts, providers
│   │   │   ├── page.tsx            Homepage stub
│   │   │   └── guide/
│   │   │       ├── page.tsx        /guide landing
│   │   │       └── [citySlug]/    
│   │   │           └── page.tsx    /guide/cairo — full demo page
│   │   ├── studio/[[...tool]]/
│   │   │   └── page.tsx            Sanity Studio mounted at /studio
│   │   ├── globals.css             Brand tokens + editorial prose
│   │   └── layout.tsx              Root layout
│   ├── components/
│   │   ├── Body.tsx                Portable Text renderer w/ operator-note
│   │   ├── Footer.tsx              Footer w/ sister brands
│   │   ├── Header.tsx
│   │   └── LocaleSwitcher.tsx
│   ├── i18n/
│   │   ├── navigation.ts           Localized Link, useRouter, etc.
│   │   ├── request.ts              next-intl server config
│   │   └── routing.ts              Locale list + URL strategy
│   └── sanity/
│       ├── env.ts
│       ├── lib/
│       │   ├── client.ts
│       │   ├── i18n.ts             GROQ helpers w/ EN fallback
│       │   ├── image.ts
│       │   ├── languages.ts
│       │   └── queries.ts
│       ├── schemas/                25 schema files (see below)
│       └── structure/
│           └── index.ts            Studio desk layout
├── middleware.ts                   Locale routing middleware
├── next.config.ts
├── sanity.cli.ts
├── sanity.config.ts                Studio config + i18n plugins
└── package.json
```

### Document types in the Sanity schema

**Editorial:** `article` (document-level i18n), `editorialCategory`, `author`,
`travelerStory`

**Tours:** `tour` (unified day-tour + package with type discriminator), `theme`

**Geography & guides:** `city`, `guideArticle`

**Reference:** `travelTip`, `travelTipCategory`, `faqEntry`, `faqCategory`

**Wiki:** `wikiDynasty`, `wikiPerson`, `wikiMonument`, `wikiDeity` —
interconnected via reciprocal references for the encyclopedic Egypt section

**Informational:** `hotel` (city-based with tier), `nileCruise`

**System:** `page`, `legalPage`, `trustBadge`, `siteSettings` (singleton),
`conciergeLinkMap` (singleton)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Sanity project

```bash
npx sanity@latest init --bare
```

When prompted: create a new project, name it Travel2Egypt, dataset name
`production`, public dataset. Note the **project ID** it prints.

### 3. Generate a write token

Go to https://manage.sanity.io → your project → API → Tokens → Add API token.
Name: `seed`. Permissions: `Editor`. Copy the token.

### 4. Configure environment

```bash
cp .env.example .env
```

Fill in:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=<your project id>
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_WRITE_TOKEN=<the token from step 3>
```

### 5. Add CORS origin

In manage.sanity.io → API → CORS Origins → Add CORS origin:
`http://localhost:3000` with credentials enabled. (Add your production URL
when you deploy.)

### 6. Seed fixture data

```bash
npm run seed
```

This creates Cairo with two sub-articles, two example tours, the Egypt In
Depth theme, and the site settings singleton — all localized in EN/ES/JA.

### 7. Run the dev server

```bash
npm run dev
```

Open:
- http://localhost:3000 — homepage stub
- http://localhost:3000/studio — Sanity Studio (sign in with the same Google
  account you used to create the project)
- http://localhost:3000/guide/cairo — the end-to-end demo page (EN)
- http://localhost:3000/es/guide/el-cairo — Spanish version
- http://localhost:3000/ja/guide/cairo — Japanese version

Use the locale switcher in the header to navigate between them.

---

## Architectural decisions encoded here

These are documented in code comments and the strategic brief. Calling them
out so you don't accidentally undo them.

### 1. EN at root, /es and /ja prefixed

EN is the canonical content language. Travel2Egypt's WordPress origin had
EN as the editorial source, and the rebuild preserves this. See
`src/i18n/routing.ts`.

### 2. Field-level i18n for most types, document-level for articles only

Tours, cities, guides, wiki — all use the `internationalized-array` plugin
(one document, all locales inside). Articles use `document-internationalization`
(one document per locale, linked) because editorial content genuinely diverges
across audiences. See `sanity.config.ts`.

### 3. EN fallback in every GROQ query

If a locale doesn't have translated content yet, pages render the EN
fallback rather than breaking. This enables progressive content rollout —
ship EN first, translate when ready. See `src/sanity/lib/i18n.ts`.

### 4. Localized slugs per locale

Cairo can have slug `cairo` in EN, `el-cairo` in ES, `cairo` in JA — and
each renders its own canonical URL. Slugs default to EN when blank. See
`src/sanity/schemas/_helpers.ts` (`localizedSlugField`).

### 5. Consultation-only — no booking engine

Tour pages have an optional `priceIndication` field for rough directional
pricing only. There's no checkout flow, no cart, no per-guest configurator.
CTAs route to the AI concierge (built separately) or WhatsApp. See
`src/sanity/schemas/tour.ts`.

### 6. Operator-note callouts are first-class

The brand voice ("we don't recommend Alexandria for first-time visitors")
lives in the rich-text layer as a structured block type, not just bold
paragraphs. Editors choose tone (honest / caution / insider / context) and
the renderer handles styling. See `src/sanity/schemas/portableText.ts` and
`src/components/Body.tsx`.

### 7. Wiki types are interconnected via references

A `wikiPerson` (Hatshepsut) references her dynasty, her temple, her tomb,
her parents, spouses, predecessor, successor. Reverse references mean the
dynasty page lists her among rulers, the temple page shows her as
commissioner, etc. This pattern depends on editors maintaining forward
references; reverse views come from GROQ queries on the public site.

### 8. Sister brands in the footer

AffordEgypt and Soléi appear as a "Other Travel2Egypt brands" element in
the footer of every page. Driven by `siteSettings.sisterBrands` — editable
without code. See `src/components/Footer.tsx`.

### 9. Concierge link map as a Sanity singleton

The AI agent's deep-linking ("the Tomb of Petosiris at Tuna el-Gebel" →
`/wiki/monuments/petosiris-tuna-el-gebel`) is driven by an editable map of
canonical names → document references. See
`src/sanity/schemas/system.ts` (`conciergeLinkMapSchema`).

### 10. Cloudinary-ready, Sanity asset by default

Image rendering goes through `urlFor()` (Sanity CDN) by default. To migrate
to Cloudinary later: install `sanity-plugin-cloudinary`, swap the helper,
domain is already allowlisted in `next.config.ts`.

---

## What's not built yet (deliberate)

This scaffold ends at the foundation. Specifically not built here:

- **AI concierge integration** at `/plan-your-tour` — separate build per
  the production-build-brief.md
- **WordPress migration script** — needs the WP REST API audit first
- **Tour, package, wiki, blog, and all other page templates** — only the
  city guide is implemented end-to-end as the architectural proof
- **Trust strip component** with TripAdvisor / JATA / IATA / ASTA — design
  spec is in concierge-page-mockup-v2.html, build when needed
- **Localized slug auto-generation** in the Studio — currently editors paste
  slugs manually; the plugin's `Generate` button works per-locale field
- **Sitemap with hreflang alternates** — `next-sitemap` integration pending
- **Redirect map from old WordPress URLs** — needs URL inventory from WP

These are sequenced for the next phases. The strategic brief estimates
4–6 months total; this scaffold is the first 2–3 weeks of Phase 1.

---

## Schema authoring tips

### Adding a new locale

If Finnish comes back, or you add a new market:

1. Add to `src/sanity/lib/languages.ts` (`SUPPORTED_LANGUAGES`)
2. Add to `src/i18n/routing.ts` (`locales` and `prefixes`)
3. Create `messages/fi.json` (copy from en.json and translate)
4. Republish all documents — the Studio will surface the new locale field
   automatically

No schema migrations required. This is the payoff for using the
internationalized-array plugin from day one.

### Adding a new document type

1. Create `src/sanity/schemas/yourType.ts` following the pattern in
   `city.ts` (or `article.ts` if document-level i18n is needed)
2. Import it in `src/sanity/schemas/index.ts`
3. Add it to `src/sanity/structure/index.ts` so it appears in the desk
4. Restart the Studio

### Adding a new field to an existing type

Just add it to the schema. No migrations needed for additive changes.
For removals or renames, consult the Sanity migration docs — the
`@sanity/migrate` package handles bulk transforms.

---

## Deployment notes

**Vercel** is the natural Next.js host. Set the same environment variables
in the Vercel dashboard. Add your production domain to Sanity CORS origins.

**Studio hosting:** the Studio is mounted at `/studio` in the same
Next.js app, so it deploys with the site. Editors don't need a separate URL.

**Build command:** `npm run build` runs Next.js build; the Studio bundles
into the same output.

---

## Open questions deferred to implementation

These came up during schema design and were deferred. Capture answers as
you make them:

- Slug strategy when an editor changes a published EN slug — auto-redirect
  from old slug, or 404? Probably needs a `previousSlugs` field for
  redirect mapping.
- Article reading-time computation — client-side from rendered Portable
  Text, or stored field updated on publish?
- Wiki cross-link automation — when a `wikiPerson` references a `wikiMonument`,
  should the inverse appear automatically? Currently both directions must
  be set manually.
- Hotel category vs star-rating — both fields exist. Decide editorial rule
  for which takes precedence in display.
- Legal page review status field — currently a tracking field. Should
  publishing be blocked if review status is false for that locale?

---

## Credits

Brand tokens and design language adapted from
`concierge-page-mockup-v2.html`. Strategic decisions encoded per
`site-rebuild-strategic-brief.md` v1.1.
