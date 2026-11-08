# Task 12: luxury posts to Sillage (prepared, not applied)

Status: **needs decision** (JA versions, ES destinations, two pages in luxury territory).
Nothing was changed in Sanity, the redirect map or the code. Written 2026-09-26.

## What was prepared

- **Exports:** `docs/phase1/export/sillage/`, 36 files = 12 posts x EN/ES/JA.
  Naming: `<en-slug>.md` (EN), `<en-slug>.es.md`, `<en-slug>.ja.md`. The file name always
  uses the **EN** slug so the three language versions sort together; each file's own
  `slug` and `original_url` in the front matter are that language's real slug and URL.
  Front matter: title, deck, meta description, original URL (locale-correct), language,
  slug, published date, `updated_at` (unset on every one of these posts), last WordPress
  edit (`wp_modified_at`), last Sanity write, legacy WordPress URL, Sanity ID, the EN slug,
  planned Sillage destination, translation group (EN/ES/JA IDs), current category, images
  (asset ref, alt, caption, CDN URL). None of the 36 bodies contains an in-body image; each
  has only its hero image. Links are absolute `https://travel2egypt.org/...` URLs in the
  linked page's own locale. Regenerate with `python3 docs/phase1/notes/export_clean.py sillage`.
- **Planned redirects:** `docs/phase1/notes/task12-redirects.csv` (columns
  `from_url,to_url,locale,note`) for the lead to add **commented out**, shipping only
  when each Sillage URL returns 200. I could not check any Sillage URL: this environment's
  proxy refuses `sillage-egypte.com` (CONNECT 403), so all seven destinations are unverified.
  - 12 EN rows `/blog/<slug>` to the Sillage URL from the brief.
  - 12 optional EN rows for the legacy WordPress root slug `/<slug>`. Today these 308 to
    `/blog/<slug>` through the `[...rest]` catch-all
    (`src/app/(site)/[locale]/[...rest]/page.tsx`), which would make a 2-hop chain once the
    post redirects, and a 404 once the post is unpublished (the catch-all looks the slug up in
    Sanity). Several wiki pages still link these legacy URLs (see the inbound list).
    The same applies to ES legacy roots `/es/<es-slug>`; add those with the ES decision.
  - **15 existing redirect-map rows already point at these posts** (1 EN, 3 ES, 11 JA; old
    slugs → current slug). Each must be repointed to the final destination in the same commit,
    or it becomes a chain. They are in the CSV with the note "REPOINT" or "existing row".
    The integrity test would catch the chains anyway.
  - ES and JA rows have an **empty `to_url`** on purpose: see the decisions below.
- **Inbound links:** `docs/phase1/notes/task12-inbound-links.md`. 61 link marks in 54
  published documents, plus 6 hard-coded links in `src/`. 11 of the 61 are already broken.

## The 12 posts and their language versions

| EN post | EN ID | ES version | JA version | Planned Sillage page |
|---|---|---|---|---|
| `/blog/egypt-luxury-travel` | wp-post-112730-en | `/es/blog/viajes-de-lujo-a-egipto` (wp-post-144353-es) | `/ja/blog/ejiputo-no-ragujuari-ryoko` (wp-post-167058-ja) | journal/is-luxury-egypt-worth-it |
| `/blog/the-luxurious-egyptian-vacation` | wp-post-1460-en | `/es/blog/vacaciones-en-egipto` (wp-post-144319-es) | `/ja/blog/ejiputo-no-ragujuari-na-bakeshon` (wp-post-161810-ja) | journal/is-luxury-egypt-worth-it |
| `/blog/luxury-resorts-in-egypt` | wp-post-112604-en | `/es/blog/centros-turisticos-de-lujo-en-egipto-junto-al-nilo` (wp-post-144354-es) | `/ja/blog/ejiputo-no-ragujuaririzoto-o-do-erabu-ka` (wp-post-167134-ja) | journal/best-luxury-resorts-red-sea |
| `/blog/egypt-luxury-beach-resorts` | wp-post-127829-en | `/es/blog/resorts-de-playa-de-lujo-de-egipto` (wp-post-144415-es) | `/ja/blog/ejiputo-no-kokyu-bichi-rizoto` (wp-post-178066-ja) | journal/best-luxury-resorts-red-sea |
| `/blog/luxury-nile-cruise` | wp-post-113080-en | `/es/blog/guia-de-cruceros-de-lujo-por-el-nilo` (wp-post-144346-es) | `/ja/blog/ragujuarinairukuruzu-no-erabikata` (wp-post-166896-ja) | journal/best-luxury-nile-cruises |
| `/blog/boutique-nile-cruises-in-egypt` | wp-post-231969-en | `/es/blog/cruceros-boutique-por-el-nilo-en-egipto-para-2026-y-anos-posteriores` (wp-post-248739-es) | `/ja/blog/butikku-nairu-kuruzu` (wp-post-238922-ja) | journal/best-luxury-nile-cruises |
| `/blog/experiencing-egypt-aboard-the-oberoi-zahra` | wp-post-1427-en | `/es/blog/descubriendo-egipto-a-bordo-del-oberoi-zahra` (wp-post-144336-es) | `/ja/blog/oberoizafura-de-nairu-o-tabi-suru` (wp-post-162352-ja) | journal/best-luxury-nile-cruises |
| `/blog/historical-hotels-in-egypt` | wp-post-144683-en | `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` (wp-post-144703-es) | `/ja/blog/ejiputo-no-rekishi-aru-hoteru` (wp-post-172259-ja) | journal/historic-hotels-of-egypt |
| `/blog/boutique-hotels-in-egypt` | wp-post-113047-en | `/es/blog/hoteles-boutique-en-egipto-de-lujo-unicos` (wp-post-144344-es) | `/ja/blog/ejiputo-no-butikku-hoteru` (wp-post-166891-ja) | journal/luxury-villas-egypt |
| `/blog/how-to-choose-the-right-egyptian-airport-for-your-private-flight` | wp-post-157835-en | `/es/blog/como-elegir-el-aeropuerto-egipcio-adecuado-para-tu-vuelo-privado` (wp-post-249403-es) | `/ja/blog/ejiputo-e-puraibeto-ki-de-hairu-kuko-no-erabikata` (wp-post-167154-ja) | journal/private-jet-and-helicopter-egypt |
| `/blog/a-helicopter-adventure-over-the-pyramids-and-nile` | wp-post-238980-en | `/es/blog/una-aventura-en-helicoptero-sobre-las-piramides-y-el-nilo` (wp-post-240585-es) | `/ja/blog/sora-kara-miru-kairo` (wp-post-240795-ja) | journal/private-jet-and-helicopter-egypt |
| `/blog/exclusive-access-to-the-giza-pyramid` | wp-post-187520-en | `/es/blog/acceso-exclusivo-a-la-piramide-de-guiza-una-experiencia-unica-en-la-vida` (wp-post-249320-es) | `/ja/blog/hitonami-ga-kuru-mae-no-giza-daichi` (wp-post-249247-ja) | journal/pyramids-without-crowds |

Every post exists in all three languages (36 published documents, all live).

## Decisions needed

### 1. The 12 Japanese versions (Sillage has no Japanese)

The brief rules out redirecting JA to English. Options:

- **A. Keep the JA posts on Travel2Egypt for now** and leave their URLs alone. Cheapest and
  loses nothing, but Travel2Egypt keeps luxury content in Japanese only.
- **B. Retire each JA post into the nearest mid-market Travel2Egypt JA page** (a normal
  JA-to-JA 301). Candidates, all live in JA:
  - Nile cruise posts (luxury-nile-cruise, boutique-nile-cruises, oberoi-zahra) →
    `/ja/blog/ejiputo-no-nairu-kuruzu-kanzen-gaido` (definitive Nile cruise guide) or
    `/ja/blog/dahabiya-no-nairu-kuruzu` (dahabiyas).
  - Resorts (luxury-resorts, luxury-beach-resorts) → `/ja/blog/ejiputo-no-famiri-rizoto` or `/ja/guide/harugada`.
  - Hotels (historical-hotels, boutique-hotels) → `/ja/travel-tips/ejiputo-no-shukuhaku-gaido`
    (accommodation tip) or `/ja/hotels`.
  - Private flight → `/ja/travel-tips/ejiputo-no-kuko` (airports tip).
  - Giza before the crowd → `/ja/blog/giza-no-piramiddo-de-sugosu-ichi-nichi` (a day at Giza).
  - Luxury travel / luxurious vacation / helicopter → `/ja/journeys/joshitsu-ni-tabisuru`
    (Travelling in style, JA) or keep (option A).
  These are topical neighbours, not equivalents; the redirect passes some equity but the
  reader gets a different page.
- **C. Unpublish without a redirect** (410/404). Not recommended: loses the equity.

My recommendation: **A for now**, B post by post later if JA traffic on these URLs is low.
Worth checking JA Search Console clicks before choosing.

### 2. The 12 Spanish versions

Sillage publishes in ES, so the ES posts can follow the EN posts **if Sillage has (or will
have) the Spanish equivalent of each destination**. I don't know Sillage's ES URL scheme
(e.g. `/es/journal/...`) and couldn't reach the site. Question for the owner: *does each of
the seven Sillage journal pages have a Spanish version, and at what URL?* Until then the ES
rows stay blank; don't send ES readers to the English Sillage page. If Sillage won't carry
Spanish for some of them, the ES post falls back to option A or B above (ES targets exist for
all the same candidates).

### 3. Luxury territory still on Travel2Egypt (owner's call)

- **`/journeys/travelling-in-style`** (ES `/es/journeys/viajar-con-estilo`, JA
  `/ja/journeys/joshitsu-ni-tabisuru`). Hard-coded page
  (`src/components/journeys/travellingInStyleContent.ts`), owner-approved copy. It is
  explicitly written as "Travel2Egypt at its fullest register": dahabiyas, landmark hotels,
  a private Egyptologist. It already hands the top tier to Sillage once, in its last essay
  paragraph (the only journey page with an outbound Sillage link). It is in the main nav
  (`JourneysMenu`, `MobileNav`), the home page and the sitemap. Its journal card is
  `/blog/historical-hotels-in-egypt`, **one of the posts moving to Sillage**, so that card
  needs a new pick whatever is decided about the page.
- **"Luxury Stay" blog category** (`wp-category-76`, `/blog/category/luxury-stay`, 200 in EN,
  ES, JA). **9 EN posts (27 with ES/JA).** Six move to Sillage (egypt-luxury-travel,
  the-luxurious-egyptian-vacation, luxury-resorts-in-egypt, egypt-luxury-beach-resorts,
  experiencing-egypt-aboard-the-oberoi-zahra, boutique-nile-cruises-in-egypt). Three stay and
  are re-homed by Task 19: gourmet-dining-in-egypt (Culture & Food),
  discovering-the-best-hotels-in-cairo (Cairo & the Cities), eco-lodges-in-egypt (Desert,
  Oases & Sinai). Task 19 retires the category and redirects its URL to `/blog`.
- Other luxury-adjacent pages the brief doesn't list (for awareness, no proposal):
  `/blog/remal-el-rayan-glamp` (a Fayoum glamp, its own deck says "not just a luxury camp"),
  the two dahabiya posts, and the hotel pages for five-star properties (St. Regis Cairo, Four
  Seasons Sharm, etc.) under `/hotels`.

### 4. The first-time journey loses its journal pick

`/journeys/first-time-in-egypt` (a Task 14 target) features
`/blog/exclusive-access-to-the-giza-pyramid` as its single "One journal thread" card in all
three languages (`src/components/journeys/firstTimeContent.ts` lines 117, 220, 322; the
travelling-in-style comments say this piece was deliberately "reserved by first-time"). Moving
the post to Sillage removes it. The owner needs to pick a replacement card (e.g. the Giza day
post or the Task 8 Giza post) before the redirect ships.

## Order of work when approved

1. Sillage pages live (200) in EN (and ES if used).
2. Uncomment the EN rows (plus legacy roots and the repointed existing rows), regenerate, run
   the integrity test.
3. Replace the two hard-coded journey cards; update the inbound links in drafts (Step 5),
   fixing the 11 already-broken ones at the same time.
4. Unpublish the EN (and ES, if redirected) posts only after the redirects are live.
