# Session 31 — Egypt Wiki surgical defer (keep monuments live)

**Date:** 2026-05-16
**Branch:** `session-31-wiki-surgical-defer`
**Prior audit:** session 29 (Path A/B/C analysis), parked at STOP gate
until operator picked Path B in this session.

## Scope decision

Operator confirmed **Path B — surgical defer**:
- `wikiMonument` (134 docs, all content-complete) ships in v1.
- `wikiDeity`, `wikiDynasty`, `wikiPerson` (0 docs each) deferred to v2.

The original prompt's plan was a blanket "defer all wiki" — that
would have broken 26 city sidebars whose `placesToGo` arrays hold
~134 monument refs (Cairo: 39, Giza: 24, Aswan: 11, Luxor: 6, etc).
The pre-flight audit in session 29 caught this before any frontend
change shipped.

## Changes

### Frontend nav (hidden)
- [Header.tsx](src/components/Header.tsx) — Egypt Wiki link removed
  from main nav; replaced with a comment marking the v2 restore point.
- [Footer.tsx](src/components/Footer.tsx) — same in About column.

Decision per operator: "default to hidden if no override". The "Egypt
Wiki" label implies the full reference (dynasties, pharaohs, deities,
monuments); shipping with only monuments would mis-signal completeness.
Monuments still reachable from city sidebars and direct URL.

### Routes
- [`/[locale]/wiki/page.tsx`](src/app/(site)/[locale]/wiki/page.tsx)
  now redirects to `/{locale}/wiki/monuments` (was a 4-section
  featured-grid; restore from session 30 HEAD when v2 ships).
- 6 deferred-type route files (`deities/page.tsx`, `deities/[slug]/page.tsx`,
  same for `dynasties` + `people`) replaced with thin pages that render
  `<WikiComingSoon>`. Slug param ignored — any URL under those paths
  shows the same placeholder.
- `/wiki/monuments/*` routes untouched.

### Components
- New [`<WikiComingSoon>`](src/components/WikiComingSoon.tsx) — shared
  placeholder; localized headline, deck, and CTAs (browse monuments
  or back home). Exports `wikiComingSoonMetadata` with `robots: { index: false }`.

### Studio structure
- [`src/sanity/structure/index.ts`](src/sanity/structure/index.ts) Egypt
  Wiki list now contains only `wikiMonument`. The three deferred
  `S.documentTypeListItem(...)` lines are commented out (not deleted)
  with a comment explaining the v2 restore path. Schemas remain
  registered in [`schemas/index.ts`](src/sanity/schemas/index.ts) for PT
  `internalLink` reference targets and forward compatibility.

### Sitemap
- [`sitemap.ts`](src/app/sitemap.ts) — `STATIC_PATHS` replaces `/wiki`
  with `/wiki/monuments` (surface the live landing directly to search
  engines instead of the redirect).
- [`queries.ts`](src/sanity/lib/queries.ts) `sitemapDocsQuery` — removed
  `wikiPerson`, `wikiDynasty`, `wikiDeity` from the `_type in [...]`
  list. With 0 docs they'd return nothing anyway, but defensively
  scoping prevents any accidental stub/draft creation from leaking
  URLs.

### robots.txt
- Added `Disallow: /wiki/deities`, `/wiki/dynasties`, `/wiki/people`.
  Belt-and-suspenders with the `noindex` meta on the Coming Soon pages.

### Translations
- `messages/{en,es,ja}.json` — new `wikiComingSoon` namespace
  (eyebrow, headline, deck, CTAs, section labels).

## Smoke test (after `npm run dev`)

| URL | Expected |
|---|---|
| `/en` | Main nav: Day Tours, Packages, Travel Guide, Journal — **no Egypt Wiki link** |
| `/en/wiki` | 307/308 redirect to `/en/wiki/monuments` |
| `/en/wiki/monuments` | Existing monuments index, renders as before |
| `/en/wiki/monuments/the-great-sphinx` | Existing detail page, renders as before |
| `/en/wiki/deities` | Coming Soon page (EN), CTA to /wiki/monuments |
| `/en/wiki/deities/anything` | Same Coming Soon (slug ignored) |
| `/en/wiki/dynasties` | Coming Soon (EN), "Dynasties" in headline |
| `/en/wiki/people` | Coming Soon (EN), "People" in headline |
| `/es/wiki/deities` | Coming Soon ES — "Próximamente · Wiki de Egipto · Deidades llegará pronto" |
| `/ja/wiki/dynasties` | Coming Soon JA — "近日公開・エジプトWiki・王朝は準備中" |
| `/en/guide/cairo` | City sidebar "Places to Go" lists 39 monument links — **still live, all click through** |
| `/en/guide/giza` | Same with 24 monument links |
| `/sitemap.xml` | Contains `/wiki/monuments` static + 134 `/wiki/monuments/*` docs; **no `/wiki/deities|dynasties|people` paths** |
| `/robots.txt` | Three `Disallow: /wiki/...` lines for deferred sub-sections |
| Studio `/studio` | Egypt Wiki group shows only **Monuments**; three other types hidden |

## Methodology note — pre-flight audits are mandatory

The original "defer wiki" prompt would have shipped broken city
sidebars on every major destination (Cairo, Giza, Aswan, Luxor,
Alexandria, …). The session 29 audit caught it because it queried
*actual* dataset state instead of trusting the prompt's assertion that
wiki content needed editorial creation. wikiMonument was already done.

This is the third time a session prompt's stated premise has been
materially wrong about dataset state (session 21 cancellation tier,
session 25 "many fields aren't rendered", session 29 "wiki is empty").
The pattern: pre-flight queries before destructive or
architectural-shape changes are not optional. Encoded into the
session-prompt template would help — every session prompt should expect
the implementer to verify dataset state before acting on assumptions
about it.

## V2 restore path (when ready)

Single grep marker — search the repo for `"session 31 surgical defer"`.
Every place that needs reversal has that comment. Concrete list:

1. **Studio nav** — uncomment 3 lines in `src/sanity/structure/index.ts`.
2. **Sitemap query** — add `wikiPerson`, `wikiDynasty`, `wikiDeity`
   back to `_type in [...]` in `sitemapDocsQuery` (queries.ts).
3. **robots.txt** — remove 3 `Disallow: /wiki/...` lines.
4. **Header.tsx + Footer.tsx** — restore Egypt Wiki link.
5. **Sitemap STATIC_PATHS** — change `/wiki/monuments` back to `/wiki`.
6. **6 route files** — restore the previous full-fledged implementations
   from git (session 30 HEAD is the clean reference point).
7. **`/wiki/page.tsx`** — replace redirect with the multi-section
   featured grid (session 30 HEAD).
8. **Populate Deity/Dynasty/Person docs** in Sanity — editorial work.

## Outstanding from prior sessions (unchanged)

- Session 21 orphan drafts (4 docs)
- `grand-islamic-cairo-day-tour` misclassification (session 24)
- `itineraryPhases` future schema candidate (session 24)
- Fallback hero images decision (session 25 follow-up)
- Bulk `poweredBy` assignment plan (session 25 follow-up — 25 cruise-ships
  → engine, 9 dahabiyas → wind, dry-run plan in chat awaiting confirm)
- Cookie consent banner (separate from Cookie Policy page shipped session 30)
