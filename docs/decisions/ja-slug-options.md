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
