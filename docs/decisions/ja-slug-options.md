# JA slug strategy + provider pattern retraction

**Date:** 2026-05-12
**Status:** Decided (JA slugs); decided + documented (architectural pattern)
**Related session:** Language switcher fix (handover §4.3 / §7.1.2). Bug §4.3 resolved this session; bug §4.2 (JA slug routing) implementation deferred to next session per this decision record.

---

## 1. JA slug strategy

### Decision

**Option D — per-locale strategy.** EN unchanged. ES preserves Spanish slugs (already working). JA articles migrate to romaji (Latin transliteration). Applies to article slugs in this decision; cities, tours, monuments, deities, etc. follow the same convention as they migrate.

### Rationale

Japanese-character slugs (Hiragana / Katakana / Kanji) trigger a URL-encoding mismatch in routing: the browser percent-encodes the characters, Next.js decodes them on the way through to the route param, and the GROQ slug match against the stored Japanese-character `slug.current` fails. All 170 JA article detail pages currently 404 as a result.

Romaji avoids the encoding mismatch entirely while preserving readable, shareable URLs. The cost is loss of native-script slugs — a real but acceptable trade. ES already works correctly with Spanish slugs because Latin-1 characters in URLs do not exhibit the same encoding pathology in practice; no change there.

### Scope of this decision

- Applies to: **article slugs**, all 170 JA articles in `migration-staging`.
- Applies going forward: future JA content of any entity type (cities, tours, monuments, deities) follows the same romaji convention. Mapper logic should be shared, not copy-pasted per entity.
- Does **not** apply to: category slugs and wiki slugs cross-locale routing. Those are a different bug class (cross-locale URL construction for non-article entities) and remain deferred — same architectural fix pattern (per-entity API route, see §2 below).

### Implementation plan (executes in next session, not this one)

The operator will provide an external slug list keyed by Sanity `_id`. The next session executes:

1. **Mapper update.** Modify `scripts/wp-import/mappers/article.ts` and `scripts/wp-import/mappers/_shared.ts` so JA slug derivation produces romaji. Shared helper preferred — the same logic will apply to future entity types when they migrate.
2. **One-shot migration of existing 170 JA articles** in `migration-staging`. Script consumes the operator-provided slug list and patches each article's `slug.current` via `@sanity/client`. Idempotent. Each patch logs `_id`, old slug, new slug for audit.
3. **Redirect-map ripple check.** Verify no entries in `redirect-map.csv` reference old Japanese-character JA slugs that would now point at a 404. If any exist, regenerate the redirect entries for those articles.
4. **Verification queries.** Confirm all 170 JA articles have new slugs (no stray Japanese characters in `slug.current` for `language == "ja"` documents). Detail pages now resolve (no 404). Test matrix: at least 5 articles loaded successfully at `/ja/blog/<new-slug>`.
5. **Rollback plan.** Sanity document history retains the old slugs for each `_id`. If a regression appears, restore the previous version per `_id` via Studio's history view, or by replaying the patch script with the inverse slug mapping. Operator-provided slug list is the source of truth for the new state.

Estimated 2–3 hours.

### Out of scope of this decision

- Cities, tours, monuments — those follow the same per-locale convention (EN English, ES Spanish, JA romaji) as they migrate. Decision applies; implementation lives with each entity's migration session.
- Cross-locale URL construction for any entity other than articles. That is the same architectural fix as articles (per-entity API route + LocaleSwitcher branch), tracked as deferred items in the session handoff.

---

## 1.5 Locked policies for romanization

Decided at session 11 start, before implementation. Applied uniformly to the migration script and every wp-import mapper that produces JA slugs.

1. **Romanization standard**: Hepburn, via `kuroshiro` + `kuroshiro-analyzer-kuromoji`.
2. **Long vowels**: macrons collapsed to single ASCII vowels. ō→o, ū→u, ē→e, ā→a, ī→i. No macrons in final output.
3. **Length cap**: 60 chars max. Truncate at the last hyphen boundary at or before position 60 — never mid-word. If no hyphen exists within 60 chars (exceedingly rare with romanized JA), hard-truncate.
4. **Particles preserved as romaji**: do not strip grammatical particles (`no`, `ni`, `e`, `ga`, `wo`, `wa`, `to`, `de`, `kara`, `made`, `ya`, `mo`). Romaji is transliteration, not paraphrase. Stripping conflates distinct meanings (e.g., "X no Y" vs "X e no Y") and is a credibility hit for Japanese-speaking visitors. Non-negotiable per operator linguistic expertise.

---

## 1.6 Architecture revision (replaces "external slug list" framing from §1)

Single source of truth: Sanity (`migration-staging`). Slugs are generated algorithmically by a shared helper consumed by two callers:

  (a) **One-shot migration script** (`scripts/migrate-ja-romaji-slugs.ts`) — patches existing JA docs across multiple entity types.
  (b) **wp-import mappers** (`scripts/wp-import/mappers/*.ts`) — handles future JA content imports.

Same algorithm, same code path. No external spreadsheet handoff.

**Override file** `migration/ja-slug-overrides.json` (committed, root-relative). Keyed by Sanity `_id` (which already namespaces by entity type via the doc-id convention `wp-{type}-{wpId}-{lang}`). Both consumers consult overrides before falling back to the algorithm. Values are either bare strings (`"slug-here"`) or objects (`{ "slug": "...", "reason": "..." }`) when a comment is warranted.

**Library**: `kuroshiro` v1.2 + `kuroshiro-analyzer-kuromoji` v1.1. Hepburn output, ASCII post-processing per §1.5 policies. ~14MB kuromoji dictionary loaded once per process.

**Library risk**: kuroshiro v1 was last updated 2020. Stable for our use case; if a future Node major breaks compatibility, replacement is a 1–2hr swap behind the helper's interface (`titleToRomajiSlug(jaTitle)`). Acceptable.

### Phased rollout

JA slug migration touches multiple entity types. Phasing keeps each session's review surface tractable:

| Session | Entity types | Doc count (JA) |
|---|---|---|
| 11 (this) | `article`, `travelTip` | 170 + ~30 |
| 12 (next) | `guideArticle` | ~700 |
| Future | `city`, `tour`, `wikiMonument`, others as they migrate | per entity |

Each session adds its entity type to the migration script's `--type` allowed values and to the corresponding wp-import mapper. The helper and override file are built once (session 11) and reused unchanged.

---

## 1.7 Rollback plan

Sanity document history retains the pre-migration slug per `_id`.

**Single-article revert**: Sanity Studio → document → History → restore to revision before the slug patch landed.

**Bulk revert** (only if widespread regression): write a separate revert script that consumes the dry-run CSV produced earlier in the migration (`migration/.cache/ja-slug-{type}-{timestamp}.csv`). Each CSV row contains `_id, oldSlug, newSlug` — the inverse map. Re-run the migration script with a `--revert <csv-path>` flag pointing at that CSV. Don't pre-build; write only if needed.

Pre-migration state is fully reconstructable from any committed dry-run CSV under `migration/.cache/`. The CSVs are gitignored as derived artifacts, but each `--commit` run also logs `{op: 'ja-slug-update', _id, oldSlug, newSlug}` rows to `migration/migration-log.jsonl` (committed) for audit-stable recovery if `.cache/` is lost.

---

## 1.8 Switcher consequence for non-article entities

After this session's migration, JA detail pages will **route correctly** on direct navigation for both `article` and `travelTip` types (the URL-encoding bug §4.2 is resolved for those types). However:

- The `LocaleSwitcher` currently has α API-route branches only for `/guide/[citySlug]` (existing) and `/blog/[slug]` (added session 10). It does **not** have branches for `/travel-tips/[slug]`, `/blog/category/[slug]`, or any `/wiki/*` route.
- Consequence: a user on an EN travel tip page clicking JA will get a prefix-swapped URL (`/ja/travel-tips/<EN-slug>`) which 404s, even though the destination JA travel tip itself now resolves on direct navigation.
- Same bug class as the category-page switcher bug deferred in session 10.

Tracked as a deferred item in the session 11 handoff. Inflection point for the architectural reconsideration (per §2 "Future option 2"): once 5+ entity types need the α pattern. Current count of deferred switcher fixes: `travelTip`, `guideArticle`, `editorialCategory`, `wikiMonument` (and possibly more wiki types) — already 4, plus any further entity types making the case for migration to a middleware-driven layout-level provider stronger by session 12.

---

## 2. Architectural retraction: provider pattern (β) → API route (α)

### What was attempted

This session initially proposed and partly implemented a "TranslationProvider" pattern (Option β):

- Server-side helper `fetchTranslationSlugs(docId)` reads the `@sanity/document-internationalization` plugin's `translation.metadata` document and returns `{ locale → slug }` map.
- Article detail page server-fetches the map and wraps children in `<TranslationProvider>`.
- `LocaleSwitcher` consumes the React context and constructs cross-locale URLs from the map.
- Stated benefit: zero client-side round-trip on locale pick; one server fetch per translatable-detail page.
- Stated intent: standard pattern for all future translatable-doc routes (tours, monuments, cities-when-migrated).

### Why it doesn't work

The `LocaleSwitcher` lives inside the `Header` component. The `[locale]/layout.tsx` renders `Header` as a **sibling** of `{children}`, not a parent of it. In the React tree:

```
<NextIntlClientProvider>
  <Header>
    <LocaleSwitcher />        ← parent of TranslationProvider below
  </Header>
  <main>
    {children}                ← article page lives here
      <TranslationProvider>   ← only wraps article content
        <article>…</article>
      </TranslationProvider>
  </main>
</NextIntlClientProvider>
```

React context flows from provider to descendants only. The `LocaleSwitcher` in the Header is a sibling-of-an-ancestor of the `TranslationProvider`, not a descendant — `useContext(TranslationContext)` returns `null`, the consumer falls through to legacy prefix-swap, the bug is not fixed.

This is structural in App Router: layouts render before page data is fetched, and a layout's params do not include child route segments. A page cannot lift a provider up to the layout level. The `TranslationProvider` had to be at the layout level, but at that level the slug data is not yet available unless the layout itself fetches it — which requires the layout to know the child slug, which it does not without parsing the URL via headers or middleware.

This is a design miss in the original proposal, not an implementation failure. Documented here so the same pattern is not re-attempted under the same constraints.

### What landed instead (α)

Per-entity API route, matching the existing city resolver pattern that has been working in the codebase:

- `src/app/api/locale-resolve/article/route.ts` — GET handler. Accepts `fromLocale`, `fromSlug`, `toLocale`. Returns `{ slug: string | null }`.
- `LocaleSwitcher.resolveLocalizedPathname` gains an article branch parallel to the existing city branch. Matches `/blog/[slug]` (explicitly not `/blog` or `/blog/category/[slug]`). On API miss, falls back to `/[locale]/blog` archive.
- The `fetchTranslationSlugs` helper from commit `bb17cf5` is reused by the API route — no duplicate GROQ.

Cost: one client-side fetch per language pick (network round-trip on click). Acceptable at current scale.

### Standard going forward

For translatable-doc routes whose switcher lives in global chrome (Header, Footer), **add a per-entity API route + a new branch in `resolveLocalizedPathname`**. Do not add a new TranslationProvider mount. The existing city + new article routes are the templates.

### Future option 2

If the per-entity API-route count becomes painful at scale (~5+ translatable entity types), consider migrating to a middleware-driven layout-level provider:

- Middleware sets a request header (e.g. `x-pathname`) containing the resolved route.
- `[locale]/layout.tsx` reads the header via `next/headers`, parses the route, fetches the slug map server-side, and wraps `Header + children` in a single `<TranslationProvider>`.
- Switcher reads the context — works correctly because the provider is now an ancestor of the Header.

Cost: middleware change, URL pattern parsing in the layout, more surface area than the per-entity API pattern. Not warranted at current scale (2 translatable-detail entities live: cities, articles).

---

## 3. Sanity referential integrity finding

Discovered during this session's Gate 4 verification attempt. Sanity's mutation API blocks `unpublish` and `delete` on any document referenced by another active document. In this codebase, every published article is referenced by a `translation.metadata` document maintained by the `@sanity/document-internationalization` plugin. Therefore, no individual article translation can be unpublished without first patching out the reference in its metadata doc.

Practical implication: synthetic testing of "missing-translation" UI fallback paths requires either (a) a content gap arising naturally in the corpus, or (b) a non-production data fixture. Neither was available this session — `migration-staging` has 100% hreflang coverage (handover §3.2), and patching the metadata doc to drop a reference is a write operation outside this session's read-only scope.

Worth knowing for future testing of any cross-locale missing-translation UX (e.g., the disabled-state UX that was deferred this session).

---

## 4. Verification status for fallback path

The "missing translation → fall back to `/[targetLocale]/blog` archive" path in `LocaleSwitcher.resolveLocalizedPathname` was **not verified end-to-end in the browser** this session, for the reasons in §3.

It was verified by:

- **API contract.** `curl /api/locale-resolve/article?fromLocale=en&fromSlug=nonexistent-slug-xyz&toLocale=es` returns HTTP 404 with body `{"slug":null}`. Confirmed during this session's API-route verification step.
- **Code reading.** The relevant branch in `LocaleSwitcher.tsx`:
  ```ts
  const articleMatch = pathname.match(/^\/blog\/(?!category\/)([^/]+)\/?$/);
  if (articleMatch) {
    const fromSlug = articleMatch[1];
    try {
      const res = await fetch(`/api/locale-resolve/article?...`);
      if (res.ok) {
        const { slug } = (await res.json()) as { slug: string | null };
        if (slug) return `/blog/${slug}`;
      }
    } catch { /* fall through */ }
    return '/blog';
  }
  ```
  A 404 response yields `res.ok === false`, skips the body parse, falls through to `return '/blog'`. The `next-intl` router then composes the locale prefix to produce `/[targetLocale]/blog`.

**Known testing gap.** If the fallback ever produces wrong behavior in production (e.g., user clicks a non-current locale on an article that legitimately lacks that translation and lands somewhere unexpected), this is the entry point for investigation. The contract is correct on paper; absent a synthetic test, treat it as "trusted but not directly observed."

---

## 5. Deferred items (cross-reference)

Captured in the session handoff (`migration/sessions/session-10-handoff.md`), not duplicated here. Summary:

- Category-page switcher bug — same root cause class, same α pattern when fixed
- Wiki-detail switcher bug — same root cause class
- Disabled-state UX for missing translations — deferred per §3 + design rationale in session handoff
- `TranslationProvider` + `fetchTranslationSlugs` helper currently orphan — kept for near-future use in SEO hreflang generation (see session handoff)
- JA slug routing implementation — scheduled next session per §1 above
