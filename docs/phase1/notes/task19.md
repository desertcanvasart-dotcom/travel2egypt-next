# Task 19: blog categories (proposal, not applied)

Status: **needs decision** (approve `docs/phase1/categories-proposal.csv`). Nothing changed
in Sanity. Written 2026-09-26. Regenerate both CSVs with
`python3 docs/phase1/notes/task19_categories.py` (the hand assignments live in its `PROPOSED` map).

## How categories work today

- **Schema** (`src/sanity/schemas/editorial.ts`, `editorialCategory`): `name`
  (internationalizedArrayString, en/es/ja), `slug` (localized slug array, EN required, ES/JA
  optional), optional `parent` reference (two levels only: a root bucket and its leaves),
  `description`, `orderRank`, `heroImage`, `seo`.
- **Posts** (`article.category`, required) point at **one** category. Each language document
  carries its own reference; today every ES and JA post has the same category as its EN
  version (checked: 0 mismatches across 167 + 167 documents).
- **Hierarchy in use:** 2 roots, **Planning** (`planning`, ES `planificacion`, JA `planning`)
  and **Destination** (`destination`, ES `destino`, JA `destination`), with 21 leaves
  (19 from WordPress, `wp-category-*`, plus `destination-depth` and `planning-advice`). Posts
  are attached to leaves only. The WordPress leaves have **only an EN slug**, so their ES/JA
  URLs reuse it (`/es/blog/category/hotels`); only the roots have localized ES slugs.
- **Routes:** `/[locale]/blog/category/[slug]`
  (`src/app/(site)/[locale]/blog/category/[slug]/page.tsx`). The slug is matched in the current
  locale, falling back to EN. A root page lists its leaves as a filter bar and every post
  under them; a leaf page lists its own posts. `generateStaticParams` emits every category in
  every locale. hreflang alternates come from the localized slugs. The `/blog` index nav shows
  **roots only** (`categoryRootsQuery`), so readers see just "Planning" and "Destination" there.
  The article breadcrumb is Journal › root › leaf. "Read next" = 3 newest posts in the **same
  leaf** category, so the reassignment also changes every post's Read next.
- The locale switcher resolves category slugs through `/api/locale-resolve/blogCategory`.
- Category pages are in the sitemap (`editorialCategory` in `sitemapDocsQuery`); redirect
  sources are removed from it automatically.

Counts today (published EN posts): 167 in 20 leaves with posts. Tours 41, Adventure 15,
History 14, Culture 12, Egypt Travel Guide 12, Tips & Tricks 11, Hotels 9, Luxury Stay 9,
Places in Egypt 9, Nile Cruise 7, Pharaoh Monuments 5, Creative 4, Islamic Monuments 4,
Things to Do 4, Destination Depth 3, Lifestyle 3, Safety 2, Coptic Monuments 1, Food 1,
Wellness 1 (Planning Advice 0).

## Proposed scheme: 9 categories

I kept the brief's eight and split **Practical Egypt** out of Planning. With both in one
bucket, Planning would hold 47 of 127 posts and bury the safety, transport and etiquette pieces
under itineraries and month guides. The split is clean: Planning = *what trip to build*
(itineraries, when to go, who's travelling, packages); Practical = *how to handle Egypt on the
ground* (safety, transport, dress, scams, escorts). Merge them back if you prefer eight.

| Proposed category | EN slug | ES name / slug | JA name / slug | EN posts |
|---|---|---|---|---|
| Planning & Itineraries | `planning-and-itineraries` | Planificación e itinerarios / `planificacion-e-itinerarios` | 旅の計画と旅程 / `planning-and-itineraries` | 40 |
| Practical Egypt | `practical-egypt` | Egipto práctico / `egipto-practico` | 旅の実用情報 / `practical-egypt` | 7 |
| The Nile | `the-nile` | El Nilo / `el-nilo` | ナイル / `the-nile` | 10 |
| Sites & Monuments | `sites-and-monuments` | Sitios y monumentos / `sitios-y-monumentos` | 遺跡とモニュメント / `sites-and-monuments` | 14 |
| History & Egyptology | `history-and-egyptology` | Historia y egiptología / `historia-y-egiptologia` | 歴史とエジプト学 / `history-and-egyptology` | 18 |
| Cairo & the Cities | `cairo-and-the-cities` | El Cairo y las ciudades / `el-cairo-y-las-ciudades` | カイロと都市 / `cairo-and-the-cities` | 15 |
| Desert, Oases & Sinai | `desert-oases-and-sinai` | Desierto, oasis y Sinaí / `desierto-oasis-y-sinai` | 砂漠・オアシス・シナイ / `desert-oases-and-sinai` | 11 |
| Red Sea & Diving | `red-sea-and-diving` | Mar Rojo y buceo / `mar-rojo-y-buceo` | 紅海とダイビング / `red-sea-and-diving` | 5 |
| Culture & Food | `culture-and-food` | Cultura y gastronomía / `cultura-y-gastronomia` | 文化と食 / `culture-and-food` | 7 |
| **Staying on the blog** | | | | **127** |
| Leaving in Phase 1 (flagged, no category) | | | | 40 |

Each count is EN posts; the ES and JA versions follow the EN assignment (x3 = 381 documents).
The ES/JA names are my drafts for a native review. JA slugs follow the existing convention
for category slugs (the JA roots use the English slug); JA post slugs are romaji, so
romaji category slugs are an option if you want them.

The 40 flagged posts: 12 move to Sillage (Task 12), 1 to AffordEgypt (Task 18), 27 are Phase 1
sources that redirect (from `scripts/phase1-urls.json`, role `source`). They keep their current
category until they are unpublished; the CSV marks them `(n/a: leaves the blog)`.

### Boundaries I used

- **Sites & Monuments**: a place or collection you visit (Giza, Karnak, the Valley of the Kings,
  the museums, sacred sites nationwide). **History & Egyptology**: people, periods, ideas and
  debates (pharaohs, gods, Tutankhamun, hieroglyphs, repatriation).
- **Cairo & the Cities**: Cairo districts, markets, Islamic and Coptic Cairo, where to stay in
  Cairo, plus the one Luxor town experience (balloons). Islamic Cairo monuments go here rather
  than Sites because the posts are written as walks through the city.
- **Itineraries for Cairo** (3 days, 4 days, Cairo + Alexandria) stay in Planning with the other
  itineraries.
- The Nile takes the dahabiya packing post that sits under History today (the brief's example)
  and the Nubian lodges post.
- Family resorts go to Red Sea & Diving (they are mostly Red Sea resorts); the other family
  posts are Planning.

### Weak spots, for your judgement

- **Red Sea & Diving has 5 posts** (Hurghada and Sharm move to the city guides in Task 16, the
  luxury beach posts to Sillage). Keep it (it will grow) or fold it into Desert, Oases & Sinai
  as "Deserts, Sinai & the Red Sea".
- **Planning & Itineraries has 40.** A further split is available: *When to Go* (the 14
  month/season/eclipse posts) vs *Itineraries & Trip Types* (26).
- Two items that aren't really blog posts: `egyptian-museum-citadel-and-khan-el-khalili-bazaar`
  (wp-post-87870-en) is a legacy tour page imported as a post ("Gallery", "Price €15 ~ €142"
  in its body), and `wonders-of-egypt-in-march-a-spring-adventure` (wp-post-257609-en) is an EN
  document whose body is in **Spanish**. Both are categorised, but both need their own fix.
- Consolidation candidates spotted while sorting (later phases, not proposed here):
  `lake-nasser-cruise` / `lake-nasser-cruises`; the three family-trip posts; the five
  Tutankhamun posts (one is Task 9 already).
- 11 of the staying posts have open Phase 1 drafts (`has_open_draft` column); their category
  change must go into those drafts, not over them.

## Retired category URLs

**All 23 current categories retire** (2 roots, 21 leaves), because none maps 1:1 onto a new
one. `docs/phase1/categories-redirects.csv` has 69 rows (23 x EN/ES/JA) in the redirect-map
column order (`from_url,to_path,locale,status_code`) plus three helper columns (old ID, old name,
how its staying posts split). Each old category goes to the new category that receives most of
its staying posts. Exceptions:
- **Destination** (root) → `/blog` (`/es/blog`, `/ja/blog`): it spans every destination category.
- **Luxury Stay** → `/blog`: its three staying posts scatter (Cairo, Desert, Culture) and its
  territory moves to Sillage, so no single category is a fair successor.
- **Planning**, **Planning Advice** (0 posts) → Planning & Itineraries; **Safety** (both posts
  retire in Tasks 2 and 17) → Practical Egypt.
- Ties: Creative (1 Planning, 1 History) → Planning; Destination Depth (1 Cairo, 1 Planning) →
  Cairo & the Cities.

ES/JA rows use each old category's real ES/JA URL (the EN slug for the WordPress leaves,
`planificacion` / `destino` for the ES roots) and point to the new category's ES/JA slug. The
new slugs don't collide with any old slug, so there are no loops. Each target returns 200 only
once the new category documents are published; ship the rows after that.

## Applying it later (after approval)

1. **Create 9 `editorialCategory` documents** as drafts, IDs `category-<en-slug>` (e.g.
   `category-the-nile`), with `name` and `slug` for en/es/ja from the table, `orderRank` in
   table order (10, 20, … 90), and a `description` per locale (to be written). **No `parent`**:
   make them roots, so all nine show in the `/blog` nav and each page lists its own posts.
   The code handles root categories without leaves already (the leaf filter bar only renders
   when a root has leaves; breadcrumbs become Journal › Category). No code change needed.
   - Alternative: keep Planning and Destination as roots and hang the nine under them. That
     keeps two nav links on `/blog` and puts History and Culture under "Destination", which
     reads oddly; I don't recommend it.
2. **Reassign posts:** set `category` on each EN post and its ES and JA versions (381 documents,
   drafts). A small script over the CSV can do it (`sanity_id`, `es_id`, `ja_id`,
   `proposed_category`). Skip the 40 flagged posts.
3. **Publish** the categories and the post drafts together (a post can't point at an
   unpublished category).
4. **Add the 69 redirect rows** from `categories-redirects.csv`, regenerate, run the integrity
   test.
5. **Unpublish the 23 old category documents** (never delete). This is necessary, not tidying:
   the two old roots would otherwise stay in the `/blog` nav (it lists every root), and the old
   leaves would stay in `generateStaticParams`. Redirects already win before the page, so
   unpublishing doesn't change what readers see.
6. Check that no hard-coded link points at an old category URL (none found in `src/` today;
   `retired-content.test.ts` lists `/blog/category/culture`, `/es/blog/category/cultura`,
   `/ja/blog/category/bunka` only as middleware "retained" paths, so a 301 there doesn't break it).
