# Task 18: budget hotels post to AffordEgypt (prepared, not applied)

Status: **needs decision** (the AffordEgypt URL). Nothing changed in Sanity, the redirect map
or the code. Written 2026-09-26.

## Exports

| File | Document | Original URL |
|---|---|---|
| `docs/phase1/export/budget-hotels-near-the-pyramids.md` | wp-post-152394-en | https://travel2egypt.org/blog/budget-hotels-near-the-pyramids |
| `docs/phase1/export/budget-hotels-near-the-pyramids.es.md` | wp-post-153543-es | https://travel2egypt.org/es/blog/hoteles-economicos-cerca-de-las-piramides |
| `docs/phase1/export/budget-hotels-near-the-pyramids.ja.md` | wp-post-167171-ja | https://travel2egypt.org/ja/blog/giza-no-piramiddo-chikaku-no-kakuyasu-hoteru |

Published 2024-12-14 (all three share the EN `publishedAt`), `updatedAt` unset, last WordPress
edit in the front matter. One image each (the hero; no in-body images). Regenerate with
`python3 docs/phase1/notes/export_clean.py budget`.

**[VERIFY] markers.** The post (all three languages) names **no budget hotel and quotes no
price**: it is advice on the Sphinx Gate area, rooftop views, noise and booking checks. The only
property named is the Mena House, as the high-end contrast; it carries
`[VERIFY: name, still operating]` in each language. There are no hotel-name headings and no
prices to mark. AffordEgypt will probably want named hotels and prices; those would be new facts
and need sourcing.

## Redirect (for the lead, commented out)

Ship only once the AffordEgypt page returns 200. affordegypt.com was unreachable from this
environment (proxy CONNECT 403), and no destination URL is given in the brief.

```
from_url,to_url,locale
/blog/budget-hotels-near-the-pyramids,https://affordegypt.com/<TBC>,en
/budget-hotels-near-the-pyramids,https://affordegypt.com/<TBC>,en            # legacy WP root slug, today 308s via [...rest]
```

- **ES and JA:** does AffordEgypt publish in Spanish or Japanese? If not, the same A/B choice
  as Task 12 applies (keep, or 301 to a Travel2Egypt page in the same language, e.g.
  `/es|ja/travel-tips/<accommodation tip>` or the Giza guide).
- **Existing redirect-map row to repoint** (or it becomes a chain):
  `/ja/blog/piramiddo-chikaku-no-yosan-hoteru-ejiputo-no-jimoto-gaido` →
  `/ja/blog/giza-no-piramiddo-chikaku-no-kakuyasu-hoteru`.

## Inbound links

53 link marks in 52 published documents (plus 5 in drafts), almost all Spanish guide pages
linking `/es/blog/hoteles-economicos-cerca-de-las-piramides`. One EN guide field (What To Eat
In Hurghada, `wp-page-59706`) links the **JA** slug on the EN route and already 404s. Full list
in `task12-inbound-links.md`, section "budget hotels post". Because the ES post carries most of
the internal links, the ES decision matters more here than for the Sillage posts.
