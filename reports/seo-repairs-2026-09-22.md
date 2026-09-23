# Migration routing repairs — 22 September 2026

The supplied Search Console export contains 1,000 examples from a reported 1,879 missing URLs. Live checks found 780 ending at 404 and 220 intentionally retired families ending at 410. This change repairs confirmed routing defects and verified URL mappings; it does not assert that all missing content has been recovered or indexed.

## Changes

- Disable next-intl's prefix-only HTTP language alternates. The site's document-aware HTML and sitemap alternates remain in use.
- Resolve legacy blog URLs using article `slug.current` and `language`, preserving localized-array lookup and collision precedence for other content types.
- Resolve monument language switches through the CMS; missing translations/fetch failures lead to the monument listing instead of an invented slug.
- Add 259 redirects and correct 16 existing destinations, including flattening aliases. Each of the 259 distinct final destinations returned 200 with a matching canonical and no noindex during fresh validation.
- Remove seven redirect rules that intercept existing canonical routes: two cruise tour pages and five guide pages. The production root locale resolver confirms both cruise tour slugs exist. The live sitemap and published CMS document metadata identify the guide routes.
- Exclude redirect sources and noindex documents from the sitemap; omit alternate URLs that are not present in its final entry set.
- Rewrite audited legacy links in Portable Text at rendering time, preserving queries and fragments. CMS documents are not mutated. External and unreviewed URLs remain unchanged.

The canonical redirect CSV and its generated TypeScript module remain synchronized. `migration/seo-repairs-2026-09-22.json` records every changed mapping, its previous destination, and evidence. The new guard tests fail if those mappings drift or the removed intercepting redirects reappear.

## Validation completed

- The article regression test failed against the original query, then passed after the fix.
- Typecheck and all suites in the existing CI workflow passed, including retired routes, streaming boundaries, redirect integrity, concierge and link-map tests.
- Redirect regeneration tests: 3,816 passed, zero failed.
- New migration tests cover EN/ES/JA article resolution, language isolation, draft filtering, collision precedence, middleware headers, sitemap filtering, monument switching, and audited content links.
- Live checks: 259/259 distinct redirect destinations passed status, canonical and noindex checks.
- Local preview at `http://localhost:3218`: the English Zamalek article redirected and visibly rendered in the browser. HTTP checks confirmed the Spanish Cave Church redirect, a Japanese blog page, and all five restored guide pages returned 200. Existing trailing-slash normalization adds a separate 308 before the content redirect.

## Required before merging

Keep this PR in draft until a complete authenticated preview is checked. The local checkout has no configured Sanity read token. Compilation and font-fetch delays caused preview timeouts; the two restored cruise tour pages and the live preview sitemap did not complete their checks. Their data/routing evidence is recorded above, but this is not a substitute for verifying their rendered pages. The full production build was not run; the existing CI also excludes it because it requires backend environment configuration.

On a configured preview, run:

```sh
npm run test:migration-routing
npm run verify:migration-destinations -- --base-url=https://YOUR-PREVIEW-HOST
```

Confirm both restored cruise pages render the intended tour content, the sitemap has no redirected/noindex entries or unavailable alternates, and monument switching works in the browser. Preview X-Robots-Tag noindex is deliberate; production must remain indexable.

After an approved deployment, run `npm run verify:migration-destinations` against production, submit the corrected sitemap, and inspect important canonical URLs in Search Console. No deployment, CMS mutation, Search Console update, or domain Change of Address action was performed here.

## Content still needing a decision

275 of the exported 404 URLs have explicit repaired mappings in this change. `reports/seo-unresolved-2026-09-22.json` records the other 505 examples for historical-content review. These are not automatically 505 pages that should be restored. Some may be stale language variants or intentionally removed content. The general blog resolver may also cover additional aliases beyond the explicit map.

Three pre-existing broken redirects from the export are deliberately unresolved because an equivalent successor was not established:

- `/ja/ナイルクルーズの休日`
- `/ja/ダハビーヤ・ナイルクルーズ`
- `/ja/カスル・イブリム・クルーズ・シップ`

Do not send these to an unrelated homepage or generic product merely to make the status green. Confirm an equivalent page or intentionally retire the old content. The 220 retired URLs were left unchanged. The 879 examples missing from the export and other Search Console issue categories have not been audited.

## Rollback

Revert this PR's commit and redeploy the prior revision. No CMS data or external settings were changed, so the code and redirect-data revert is the complete rollback for this change.
