# Travel2Egypt — Launch v1 Scope

**Lock date:** 2026-05-16 (session 31)
**Status:** Pre-launch
**Dataset:** migration-staging (production cutover pending)

## In scope (v1)

| Entity | Published count | Notes |
|---|---:|---|
| tour (dayTour) | 100 | Body content present; hero fills + duration hours editorial backlog |
| tour (package) | 94 | Body content present; hero fills editorial backlog |
| hotel | 64 | Placeholders; category review backlog |
| nileCruise | 34 | Placeholders; tier + propulsion + itinerary editorial backlog |
| guideArticle | ~431 | Most content present; section-assignment backlog |
| travelTip | TBD | Launch-ready |
| article (journal) | TBD | Launch-ready |
| wikiMonument | **134** | **Fully content-complete from migration; ships in v1** |
| legalPage | 4 | Terms, Privacy, Cookie, Disclaimer (session 30) |
| city | 41 | Travel-guide spines; 26 reference monuments via placesToGo |

## Deferred to v2

### Egypt Wiki — wikiDeity, wikiDynasty, wikiPerson (surgical defer, session 31)

**Not deferred:** `wikiMonument` (134 fully-populated docs) ships in v1.
The 26 cities that cross-reference monuments via `placesToGo` continue
to render those links correctly in the city sidebar.

| Type | Docs | v1 state |
|---|---:|---|
| wikiDeity | 0 | route renders Coming Soon, noindex, disallowed in robots.txt |
| wikiDynasty | 0 | same |
| wikiPerson | 0 | same |

**Frontend nav decision:** Egypt Wiki main nav link **hidden** in Header
+ Footer for v1 (the "full wiki" branding implied by the label feels
premature with three sub-sections still empty). Monuments remain
reachable via:
- City sidebar "Places to Go" → monument detail
- Direct URL: `/en/wiki/monuments`
- `/wiki` and `/{locale}/wiki` redirect to `/wiki/monuments`

**Re-enable for v2:**
1. Uncomment 3 deferred lines in `src/sanity/structure/index.ts` (Egypt
   Wiki section, lines around 419-421).
2. Replace the 6 Coming Soon route files
   (`src/app/(site)/[locale]/wiki/{deities,dynasties,people}/page.tsx`
   and their `[slug]/page.tsx`) with the previous query-based
   implementations (recover from git history at session 30 HEAD).
3. Restore `/wiki` landing to the multi-section featured-grid
   (`src/app/(site)/[locale]/wiki/page.tsx` was a redirect after
   session 31 — recover from history).
4. Add `wikiPerson`, `wikiDynasty`, `wikiDeity` back to
   `sitemapDocsQuery._type in [...]` in `src/sanity/lib/queries.ts`.
5. Remove the three `Disallow: /wiki/...` lines from `public/robots.txt`.
6. Restore Wiki link in Header.tsx + Footer.tsx (look for the
   "session 31 surgical defer" comment).
7. Populate `wikiDeity`, `wikiDynasty`, `wikiPerson` documents in
   Sanity (editorial work).

### 12 dahabiya tour packages (deferred per session 17)

- 7 country variants of `7-day-luxury-dahabiya-cruise-vacation` form a B3
  cluster
- Filed: `migration/sessions/session-17-audit/dahabiya-packages-deferred.json`
- Re-enable in a future tour-batch micro-session

## Pre-launch checklist (separate work, not this session)

- Hero image fills (~133 docs across types; Studio workflow filters surface them)
- Hotel category review completion (66 docs)
- Cruise tier + propulsion + itinerary fills (34 docs; bulk poweredBy
  assignment plan pending operator confirm in session 25 follow-up)
- Guide section assignment (~141 docs)
- Tour duration hours fills (~100 docs)
- ES/JA slug completion (1+8 docs missing per session 26 workflow filters)
- Production dataset creation + cutover from migration-staging
- WordPress → Next.js redirect mapping
- Custom domain + DNS cutover
- Cookie consent banner (Cookie Policy page exists; consent UI deferred)

## Outstanding decisions

- Session 21 orphan drafts cleanup
- `grand-islamic-cairo-day-tour` misclassification
- `itineraryPhases` schema candidate
- Fallback hero images (Sanity vs `public/`)
- Bulk `poweredBy` assignment plan (25 cruise-ships → engine, 9 dahabiyas → wind)
