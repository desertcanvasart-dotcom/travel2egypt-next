# WP REST API: whitelist `_elementor_data` for hotel/cruise/tour post types (Path 1)

**Audience:** WP admin / `mu-plugins` maintainer at travel2egypt.org
**Requested by:** Islam (operations) — for the Travel2Egypt Sanity migration
**Scope:** Read-only REST exposure. No write access required.
**Urgency:** Needed before session 8 of the migration (~2 weeks out from filing).
**Filed:** 2026-04-28

---

## What we need

Add `_elementor_data` to the REST-readable post-meta whitelist for the page
post type (and any custom post types if hotels/cruises/tours use them — see
"Affected post types" below).

Currently `GET /wp-json/wp/v2/pages/<id>?_fields=meta` returns only:

```json
{
  "meta": {
    "_acf_changed": false,
    "footnotes": "",
    "rank_math_title": "...",
    "rank_math_description": "..."
  }
}
```

`_elementor_data` is present on every Elementor-built page in the database
(`wp_postmeta`) but is not exposed by the REST API because it isn't
registered with `show_in_rest`.

We need:

```json
{
  "meta": {
    "_elementor_data": "<JSON string of Elementor element tree>",
    ...
  }
}
```

Read-only sufficient. No PUT/PATCH/DELETE needed.

---

## Why we need it

The migration importer extracts body imagery from `content.rendered` (the
PHP-rendered HTML returned by the REST API). For a substantial fraction of
Elementor-built pages, **the rendered HTML contains zero `<img>` tags
despite the page having images on the live site** — because the imagery is
rendered from `_elementor_data` post-meta JSON, not from native WP `<img>`
markup.

**Concrete sample (from session 4 audit):**

| WP id | Slug | Body length | `<img>` count | Why imagery is missing |
|---:|---|---:|---:|---|
| 83679 | `al-tarfa-desert-sanctuary-lodge` | (small) | 0 | imagery in `_elementor_data` |
| 83680 | `bedouin-castle-hotel` | 42 KB | 0 | imagery in `_elementor_data` |
| 83681 | `daniela-village-saint-catherine-hotel` | 45 KB | 0 | imagery in `_elementor_data` |

That's **3 of 9 hotels (~33%) with zero recoverable body imagery via the
REST API as currently configured.** Without `_elementor_data` access,
migration ships these properties with no body photos — which for editorial
hotel/cruise/tour pages is a meaningful content gap.

The remaining 6 of 9 hotels render imagery via the Royal/Premium Addons
carousel widget, which DOES emit `<img>` tags (different recovery path,
already handled in the importer). The 33% gap is specifically the
Elementor-data-only pattern that this whitelist solves.

Same pattern likely affects nile-cruise and tour-or-package pages (both are
Elementor page-builder driven). Confirmed sample size is small for
hotels; cruises and tours haven't been sampled yet but the underlying
mechanism is identical.

---

## Affected post types

Confirmed via classifier output (session 4 `wp-classifier.ts` + manual
audit):

| Post type | Sanity target | Count (EN) | Sampled? |
|---|---|---:|---|
| `page` (classified as `hotel`) | `hotel` | 66 | yes — 33% empty body |
| `page` (classified as `nile-cruise`) | `nileCruise` | 49 | not yet |
| `page` (classified as `tour-or-package`) | `tour` | 299 | not yet |
| `page` (classified as `monument`) | `wikiMonument` | 149 | not yet |
| `page` (classified as `destination-subpage`) | `guideArticle` | 449 | mixed; some hit by same pattern |
| `page` (classified as `destination-hub`) | `city` | 69 | session 5 in progress |

All hotel/cruise/tour/monument/subpage/hub pages run on the standard `page`
post type — there are no custom post types specific to these
classifications. So the whitelist registration scope is just the `page`
post type, which simplifies things.

---

## Technical ask

Register `_elementor_data` as REST-readable post-meta on the `page` post
type. Standard mu-plugins snippet:

```php
<?php
/**
 * Plugin Name: T2E Migration — Expose _elementor_data via REST
 * Description: Read-only REST exposure of _elementor_data for the
 *              Travel2Egypt → Sanity migration. Remove after migration cutover.
 * Version: 1.0.0
 */

add_action('rest_api_init', function () {
    register_post_meta('page', '_elementor_data', [
        'show_in_rest'  => true,
        'single'        => true,
        'type'          => 'string',
        'auth_callback' => function () {
            // Read-only. Default capability check (`edit_posts`) is fine
            // since the migration runs as the `developer` user with admin role.
            return current_user_can('edit_posts');
        },
    ]);
});
```

**Notes for the WP admin:**

- File location: `wp-content/mu-plugins/t2e-migration-elementor-rest.php`
  (mu-plugins auto-load, no activation needed).
- This does NOT modify the database, the post content, or any Elementor
  behaviour. It only exposes an existing meta field via REST.
- Authenticated requests only. The migration uses Application Passwords for
  the `developer` admin user; no anonymous access.
- After cutover (~6-10 weeks from now), this snippet should be removed.

---

## Verification after install

We'll re-run the same probe on the same three hotel IDs:

```bash
curl -u developer:$WP_APPLICATION_PASSWORD \
  'https://travel2egypt.org/wp-json/wp/v2/pages/83680?_fields=meta' \
  | jq '.meta._elementor_data | length'
```

Expected output after whitelist: a positive integer (the JSON string
length, typically 50KB-500KB). Currently returns `null`.

We'll also run a parseability check (Step 2 of Gate A from the migration
handover) that walks the JSON tree for image references and confirms the
expected widget types are recognizable.

If the verification probe passes, session 8 (hotels/cruises/tours) is
unblocked.

---

## If denied or delayed

If the WP admin can't / won't whitelist `_elementor_data`, the migration
falls back to **Path 2: featured-only**. Hotels/cruises/tours get one
hero image from `featured_media`, body imagery for the 33% empty-content
pages is lost.

Path 2 is acceptable but a real content downgrade for the affected
pages. The fall-back decision is deferred to session 8 start with full
context. No need to pre-decide between Path 1 and Path 2 now.

---

## References

- Migration architecture: `migration/known-issues.md` (in the t2e repo)
- Application Handover doc v3 (sent separately): "Pre-flight Gate A"
  section, "Cutover Blockers" section
- WP REST API meta registration docs:
  https://developer.wordpress.org/rest-api/extending-the-rest-api/modifying-responses/#post-meta-for-built-in-post-types
- Sample probe output (saved 2026-04-28):
  `migration/.diffs/elementor-data-probe.json` (in the t2e repo)
