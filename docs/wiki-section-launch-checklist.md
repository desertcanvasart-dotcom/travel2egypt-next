# Wiki section — launch checklist & deferral notes

**Status: POSTPONED, not cancelled.** The `/wiki` section (monuments, people,
dynasties, deities) is built but intentionally dark — the nav entry is hidden
(deferred since Session 31) and the supporting content isn't finished. It will
be published once the content is ready.

This note records the one non-obvious thing that **will break the wiki section
on launch day if it isn't handled**, plus the surrounding state, so it isn't
lost between now and then.

---

## ⚠️ Launch blocker: the wiki→guide redirects must be removed before publishing

During the Phase-2 / Session-57 consolidation (see
[`migrations/phase-2-plan.md` §6](./migrations/phase-2-plan.md)), each
`wikiMonument` was given a sibling `guideArticle` (`kind=attraction`) at
`/guide/<city>/<slug>`, and **301 redirects were added so every
`/wiki/monuments/<slug>` URL bounces to its guide article.** Those redirects
are correct *while the wiki section is dark* — they keep old monument URLs
useful instead of 404ing.

But they assume the wiki section stays retired. **The day the wiki section is
published, those redirects will hijack every wiki monument URL and send it to
the guide article — the wiki monument pages will be unreachable.**

**On wiki launch, you must remove the `/wiki/monuments/* → /guide/*` redirects.**

- File: [`migration/redirect-map.csv`](../migration/redirect-map.csv) (canonical source).
- Rows to remove: every row whose `from_url` contains `/wiki/monuments/`
  (~**400 rows = 134 monuments × 3 locales**). Sample:
  `https://travel2egypt.org/wiki/monuments/fatnas-island/,/guide/siwa-oasis/fatnas-island,en,301,,0.00`
- After editing the CSV, regenerate the build artifact:
  `npm run redirect-map:regenerate` (rewrites `migration/redirect-map.generated.ts`,
  which `next.config.ts` imports).
- The `/wiki/monuments` routes already exist
  (`src/app/(site)/[locale]/wiki/monuments/page.tsx` and `[slug]/page.tsx`), so
  once the redirects are gone the pages resolve again.
- Also un-hide the wiki nav entry in `src/components/Header.tsx` (currently
  commented out: "Egypt Wiki nav stays hidden for v1").

---

## Intended end state: guide AND wiki coexist (NOT one-or-the-other)

A monument is meant to live in **both** places, serving different intents:

- `/guide/<city>/<slug>` — the **attraction / trip-planning** view (a `guideArticle`,
  curated into the city's `placesToGo`).
- `/wiki/monuments/<slug>` — the **encyclopedic** view (a `wikiMonument`).

They are **complementary, not duplicates.** Do not collapse them into one.

### Consequence: do NOT delete `wikiMonument` docs

`migrations/phase-2-plan.md` §6 originally described consolidation as
"`wikiMonument` → `guideArticle`, then remove the `wikiMonument`." **That removal
step is explicitly NOT to be executed.** The wiki docs are inventory for the
unreleased wiki section. As of this writing the dataset has:

- **134** `wikiMonument` docs (all retained).
- **110** of them have a `guideArticle` (`kind=attraction`) twin by slug.
- **24** have no guide twin (wiki is currently their only copy).
- **0** `wikiPerson` docs yet (the wiki graph is still being authored — another
  reason the section isn't ready).

The redirects (above) are what make the consolidation *behave* correctly while
the section is dark; the docs themselves stay put for launch.

---

## TL;DR for whoever launches the wiki section

1. Remove all `/wiki/monuments/* → /guide/*` rows from `migration/redirect-map.csv`.
2. `npm run redirect-map:regenerate`.
3. Un-hide the wiki nav in `src/components/Header.tsx`.
4. Verify `/wiki/monuments/<slug>` resolves (no longer 301s) and the guide
   article at `/guide/<city>/<slug>` still resolves independently.
5. Do **not** delete `wikiMonument` documents — guide and wiki are meant to coexist.
