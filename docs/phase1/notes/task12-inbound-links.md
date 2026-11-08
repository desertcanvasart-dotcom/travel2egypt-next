# Tasks 12 and 18: inbound links to the posts leaving Travel2Egypt

Read-only inventory, 2026-09-26. Nothing was changed. Built with
`docs/phase1/notes/task12_inbound.py` over a full raw dump of the production
dataset (every document type, published and drafts), so it covers blog,
guide, travel tips, resources, journeys, packages, tours, hotels, cruises and
wiki pages.

**What counts as a link:** an `internalLink` mark that references one of the
36 post documents (12 posts x EN/ES/JA), or any string (in practice an
`externalLink` `href`) whose path ends in one of their 36 slugs. Slug matches
are exact path segments, so `/es/blog/vacaciones-en-egipto-desde-canada` does
not count as a link to `/es/blog/vacaciones-en-egipto`. Category references and
`translation.metadata` are excluded. One row per link mark; a page that links
twice to the same post in two different paragraphs shows twice.

Many guide/wiki marks also carry `_pendingInternalRef.wpUrl`, a migration
note with the original WordPress URL. Where the note and the `href` disagree,
the row says so (these are the broken links below).

## Summary

**Sillage posts (Task 12): 61 link marks in 54 published documents,
plus 6 hard-coded links in `src/`.** Four posts have no inbound Sanity link at
all: `boutique-nile-cruises-in-egypt`, `how-to-choose-the-right-egyptian-airport-for-your-private-flight`,
`a-helicopter-adventure-over-the-pyramids-and-nile` and `exclusive-access-to-the-giza-pyramid`
(the last is linked from code only).

| Post (EN slug) | Sanity links: EN | ES | JA | total | Hard-coded in src/ |
|---|---|---|---|---|---|
| `egypt-luxury-travel` | 0 | 4 | 0 | 4 | 0 |
| `the-luxurious-egyptian-vacation` | 0 | 1 | 2 | 3 | 0 |
| `luxury-resorts-in-egypt` | 2 | 9 | 3 | 14 | 0 |
| `egypt-luxury-beach-resorts` | 1 | 11 | 1 | 13 | 0 |
| `luxury-nile-cruise` | 0 | 0 | 1 | 1 | 0 |
| `boutique-nile-cruises-in-egypt` | 0 | 0 | 0 | 0 | 0 |
| `experiencing-egypt-aboard-the-oberoi-zahra` | 1 | 0 | 3 | 4 | 0 |
| `historical-hotels-in-egypt` | 1 | 14 | 1 | 16 | 3 (travellingInStyleContent.ts EN/ES/JA) |
| `boutique-hotels-in-egypt` | 1 | 5 | 0 | 6 | 0 |
| `how-to-choose-the-right-egyptian-airport-for-your-private-flight` | 0 | 0 | 0 | 0 | 0 |
| `a-helicopter-adventure-over-the-pyramids-and-nile` | 0 | 0 | 0 | 0 | 0 |
| `exclusive-access-to-the-giza-pyramid` | 0 | 0 | 0 | 0 | 3 (firstTimeContent.ts EN/ES/JA) |

"EN/ES/JA" is the language of the **linked** post. Every link counted under JA is one of
the broken EN-field links described below: **no Japanese page links to any of these posts**,
and every working link to an EN post is one of 6 `internalLink` references from wiki and hotel
pages (Hawara, Hanging Mosque, St. Regis Cairo, Royal Jewellery Museum, Saqqara, Kharga Cultural
Museum). Most of the equity-carrying internal links are Spanish. Linking documents by type:
{'guideArticle': 35, 'tour': 2, 'wikiMonument': 17, 'hotel': 1, 'article': 6}.

**Budget hotels post (Task 18): 53 link marks in 52 published documents**
({'es': 51, 'ja': 1, 'en': 1} by linked language), none hard-coded. Almost all are
Spanish guide pages linking `/es/blog/hoteles-economicos-cerca-de-las-piramides`.

Draft documents (`drafts.*`) carry another 12 marks to Sillage posts and 5 to the budget
post; they are listed at the end so the Step 5 clean-up edits the drafts too.

### Things to know before the clean-up

1. **12 of these links are already broken (404).** In 12 English guide-page
   fields the migration wrote the **Japanese** slug on the English route, e.g.
   `/blog/ejiputo-no-rekishi-aru-hoteru` in the EN body of the Edfu guide, where the
   `wpUrl` note shows it was meant to be `/blog/historical-hotels-in-egypt`. I checked two on
   the live site: both 404. This looks like a systematic migration bug
   (EN field + JA slug), probably not limited to these posts; worth a site-wide check.
2. **Cross-locale links.** `wp-post-257609-en` ("Wonders of Egypt in March", EN) and its JA
   version `wp-post-257611-ja` link to the **Spanish** posts; the EN document's body is in
   Spanish (see task19.md). `wp-page-87835` (a tour) links from its ES field to the EN budget post.
3. **Legacy absolute URLs.** Wiki pages (and some guide pages) link
   `https://travel2egypt.org/es/<slug>/` (WordPress style). These work today through the
   `[...rest]` catch-all (`src/app/(site)/[locale]/[...rest]/page.tsx`, 308 to `/blog/<slug>`),
   so each is a 2-hop link now and will become a 3-hop chain, or a 404 once the post is
   unpublished, unless the legacy root slug also gets a redirect row (see task12-redirects.csv).
4. **Hard-coded links in `src/`** (next-intl `Link`, locale prefix added at runtime):
   - `src/components/journeys/firstTimeContent.ts` lines 117, 220, 322: the **"One journal thread"**
     card on `/journeys/first-time-in-egypt` (EN/ES/JA) is `exclusive-access-to-the-giza-pyramid`
     (and its ES/JA slugs). That journey page is itself a Task 14 target. When the post moves,
     the card needs a new pick (owner's editorial selection, per the code comment).
   - `src/components/journeys/travellingInStyleContent.ts` lines 108, 202, 297: the journal card on
     `/journeys/travelling-in-style` (EN/ES/JA) is `historical-hotels-in-egypt`.
   No other file in `src/`, `messages/` or `public/` contains any of the 39 slugs.

## Published documents: Sillage posts (Task 12)

| # | Linking doc | Type | Title | Field locale | Links to | Link | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `wp-page-59718` | wikiMonument | Kharga Cultural Museum | en | `/blog/boutique-hotels-in-egypt` | internalLink (reference) |  |
| 2 | `wp-post-144441-es` | article | Maravillas de Egipto en marzo: Una aventura primaveral | es | `/es/blog/hoteles-boutique-en-egipto-de-lujo-unicos` | externalLink href `/es/blog/hoteles-boutique-en-egipto-de-lujo-unicos` |  |
| 3 | `wp-post-257609-en` | article | Wonders of Egypt in March: A Spring Adventure | en | `/es/blog/hoteles-boutique-en-egipto-de-lujo-unicos` | externalLink href `/es/blog/hoteles-boutique-en-egipto-de-lujo-unicos` | cross-locale: en article links to the es post |
| 4 | `wp-post-257611-ja` | article | 3月のエジプトの魅力：春の冒険 | ja | `/es/blog/hoteles-boutique-en-egipto-de-lujo-unicos` | externalLink href `/es/blog/hoteles-boutique-en-egipto-de-lujo-unicos` | cross-locale: ja article links to the es post |
| 5 | `wp-page-58796` | guideArticle | Stay in Al Gouna | es | `/es/blog/hoteles-boutique-en-egipto-de-lujo-unicos` | externalLink href `/es/blog/hoteles-boutique-en-egipto-de-lujo-unicos` |  |
| 6 | `wp-page-60649` | guideArticle | Places to Stay in Luxor | es | `/es/blog/hoteles-boutique-en-egipto-de-lujo-unicos` | externalLink href `/es/blog/hoteles-boutique-en-egipto-de-lujo-unicos` |  |
| 7 | `wp-page-63890` | hotel | The St. Regis Cairo | en | `/blog/egypt-luxury-beach-resorts` | internalLink (reference) |  |
| 8 | `wp-page-59422` | guideArticle | Culinary Journey | es | `/es/blog/resorts-de-playa-de-lujo-de-egipto` | externalLink href `/es/blog/resorts-de-playa-de-lujo-de-egipto` |  |
| 9 | `wp-page-59636` | guideArticle | Accommodations In Farafra | es | `/es/blog/resorts-de-playa-de-lujo-de-egipto` | externalLink href `/es/blog/resorts-de-playa-de-lujo-de-egipto` |  |
| 10 | `wp-page-59712` | guideArticle | Hurghada Marina | es | `/es/blog/resorts-de-playa-de-lujo-de-egipto` | externalLink href `/es/blog/resorts-de-playa-de-lujo-de-egipto` |  |
| 11 | `wp-page-60442` | guideArticle | Things To Do in safaga | es | `/es/blog/resorts-de-playa-de-lujo-de-egipto` | externalLink href `/es/blog/resorts-de-playa-de-lujo-de-egipto` |  |
| 12 | `wp-page-60649` | guideArticle | Places to Stay in Luxor | es | `/es/blog/resorts-de-playa-de-lujo-de-egipto` | externalLink href `/es/blog/resorts-de-playa-de-lujo-de-egipto` |  |
| 13 | `wp-page-68016` | guideArticle | How To Go To Esna | es | `/es/blog/resorts-de-playa-de-lujo-de-egipto` | externalLink href `/es/blog/resorts-de-playa-de-lujo-de-egipto` |  |
| 14 | `wp-page-78400` | guideArticle | Things To Do In Marsa Alam | es | `/es/blog/resorts-de-playa-de-lujo-de-egipto` | externalLink href `/es/blog/resorts-de-playa-de-lujo-de-egipto` |  |
| 15 | `wp-page-86841` | guideArticle | Luxor Private Day Tours | es | `/es/blog/resorts-de-playa-de-lujo-de-egipto` | externalLink href `/es/blog/resorts-de-playa-de-lujo-de-egipto` |  |
| 16 | `wp-page-63521` | wikiMonument | Mosque of Al-Mu ayyad Shaykh | es | `/es/blog/resorts-de-playa-de-lujo-de-egipto` | externalLink href `https://travel2egypt.org/es/resorts-de-playa-de-lujo-de-egipto/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 17 | `wp-page-69954` | wikiMonument | Abu Rawash Pyramid Of Djedefre | es | `/es/blog/resorts-de-playa-de-lujo-de-egipto` | externalLink href `https://travel2egypt.org/es/resorts-de-playa-de-lujo-de-egipto/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 18 | `wp-page-95543` | wikiMonument | Museum of Islamic Art | es | `/es/blog/resorts-de-playa-de-lujo-de-egipto` | externalLink href `https://travel2egypt.org/es/resorts-de-playa-de-lujo-de-egipto/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 19 | `wp-page-61927` | guideArticle | Tropitel Naama Bay Sharm | en | `/ja/blog/ejiputo-no-kokyu-bichi-rizoto` | externalLink href `/blog/ejiputo-no-kokyu-bichi-rizoto` | BROKEN (404): en field meant `/blog/egypt-luxury-beach-resorts` (legacy wpUrl) but href is the JA slug on the EN route |
| 20 | `wp-page-60122` | guideArticle | Accommodation Options Ismailia | es | `/es/blog/viajes-de-lujo-a-egipto` | externalLink href `/es/blog/viajes-de-lujo-a-egipto` |  |
| 21 | `wp-page-60381` | guideArticle | Travel to Ras Sudr | es | `/es/blog/viajes-de-lujo-a-egipto` | externalLink href `/es/blog/viajes-de-lujo-a-egipto` |  |
| 22 | `wp-page-78152` | guideArticle | Taba Heights | es | `/es/blog/viajes-de-lujo-a-egipto` | externalLink href `/es/blog/viajes-de-lujo-a-egipto` |  |
| 23 | `wp-page-94643` | wikiMonument | The Egyptian Museum | es | `/es/blog/viajes-de-lujo-a-egipto` | externalLink href `https://travel2egypt.org/es/viajes-de-lujo-a-egipto/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 24 | `wp-page-59186` | wikiMonument | Royal Family Jewellery Museum | en | `/blog/experiencing-egypt-aboard-the-oberoi-zahra` | internalLink (reference) |  |
| 25 | `wp-page-59212` | guideArticle | How to Reach Aswan | en | `/ja/blog/oberoizafura-de-nairu-o-tabi-suru` | externalLink href `/blog/oberoizafura-de-nairu-o-tabi-suru` | BROKEN (404): en field meant `/blog/experiencing-egypt-aboard-the-oberoi-zahra` (legacy wpUrl) but href is the JA slug on the EN route |
| 26 | `wp-page-59619` | guideArticle | Tours In Esna | en | `/ja/blog/oberoizafura-de-nairu-o-tabi-suru` | externalLink href `/blog/oberoizafura-de-nairu-o-tabi-suru` | BROKEN (404): en field meant `/blog/experiencing-egypt-aboard-the-oberoi-zahra` (legacy wpUrl) but href is the JA slug on the EN route |
| 27 | `wp-page-59712` | guideArticle | Hurghada Marina | en | `/ja/blog/oberoizafura-de-nairu-o-tabi-suru` | externalLink href `/blog/oberoizafura-de-nairu-o-tabi-suru` | BROKEN (404): en field meant `/blog/experiencing-egypt-aboard-the-oberoi-zahra` (legacy wpUrl) but href is the JA slug on the EN route |
| 28 | `wp-page-69956` | wikiMonument | The Saqqara Necropolis | en | `/blog/historical-hotels-in-egypt` | internalLink (reference) |  |
| 29 | `wp-post-144441-es` | article | Maravillas de Egipto en marzo: Una aventura primaveral | es | `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` | externalLink href `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` |  |
| 30 | `wp-post-257609-en` | article | Wonders of Egypt in March: A Spring Adventure | en | `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` | externalLink href `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` | cross-locale: en article links to the es post |
| 31 | `wp-post-257611-ja` | article | 3月のエジプトの魅力：春の冒険 | ja | `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` | externalLink href `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` | cross-locale: ja article links to the es post |
| 32 | `guideArticle.cairo.an-nasir-mohammed-bin-qalawoon-mosque` | guideArticle | An-Nasir Mohammed Bin Qalawoon Mosque | es | `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` | externalLink href `https://travel2egypt.org/es/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 33 | `guideArticle.qena.the-temple-of-hathor` | guideArticle | The Temple of Hathor | es | `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` | externalLink href `https://travel2egypt.org/es/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 34 | `wp-page-114936` | guideArticle | Hurghada Small Group Day Tours | es | `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` | externalLink href `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` |  |
| 35 | `wp-page-59423` | guideArticle | Getting Around Dahab | es | `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` | externalLink href `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` |  |
| 36 | `wp-page-63606` | guideArticle | coptic cairo | es | `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` | externalLink href `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` |  |
| 37 | `wp-page-86911` | guideArticle | Sharm El-Sheikh Private Day Tours | es | `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` | externalLink href `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` |  |
| 38 | `wp-page-146018` | tour | Private Day Tour: South Sinai Desert, Bedouin Community & Blue Hole Snorkeling from Sharm El Sheikh | es | `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` | externalLink href `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` |  |
| 39 | `wp-page-59197` | wikiMonument | The Greco-Roman Museum | es | `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` | externalLink href `https://travel2egypt.org/es/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 40 | `wp-page-63577` | wikiMonument | An-Nasir Mohammed Bin Qalawoon Mosque | es | `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` | externalLink href `https://travel2egypt.org/es/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 41 | `wp-page-69956` | wikiMonument | The Saqqara Necropolis | es | `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` | externalLink href `https://travel2egypt.org/es/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 42 | `wp-page-76518` | wikiMonument | The Temple of Hathor | es | `/es/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo` | externalLink href `https://travel2egypt.org/es/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 43 | `wp-page-59571` | guideArticle | Edfu Historical Guide | en | `/ja/blog/ejiputo-no-rekishi-aru-hoteru` | externalLink href `/blog/ejiputo-no-rekishi-aru-hoteru` | BROKEN (404): en field meant `/blog/historical-hotels-in-egypt` (legacy wpUrl) but href is the JA slug on the EN route |
| 44 | `wp-page-59619` | guideArticle | Tours In Esna | en | `/ja/blog/ragujuarinairukuruzu-no-erabikata` | externalLink href `/blog/ragujuarinairukuruzu-no-erabikata` | BROKEN (404): en field meant `/blog/luxury-nile-cruise` (legacy wpUrl) but href is the JA slug on the EN route |
| 45 | `wp-page-61545` | wikiMonument | The Pyramid Of Hawara | en | `/blog/luxury-resorts-in-egypt` | internalLink (reference) |  |
| 46 | `wp-page-61658` | wikiMonument | The Hanging Mosque | en | `/blog/luxury-resorts-in-egypt` | internalLink (reference) |  |
| 47 | `wp-page-60075` | guideArticle | Navigating Giza | es | `/es/blog/centros-turisticos-de-lujo-en-egipto-junto-al-nilo` | externalLink href `/es/blog/centros-turisticos-de-lujo-en-egipto-junto-al-nilo` |  |
| 48 | `wp-page-60436` | guideArticle | History of safaga | es | `/es/blog/centros-turisticos-de-lujo-en-egipto-junto-al-nilo` | externalLink href `/es/blog/centros-turisticos-de-lujo-en-egipto-junto-al-nilo` |  |
| 49 | `wp-page-60445` | guideArticle | Only in safaga | es | `/es/blog/centros-turisticos-de-lujo-en-egipto-junto-al-nilo` | externalLink href `/es/blog/centros-turisticos-de-lujo-en-egipto-junto-al-nilo` |  |
| 50 | `wp-page-60712` | guideArticle | Past and Present Marsa Alam | es | `/es/blog/centros-turisticos-de-lujo-en-egipto-junto-al-nilo` | externalLink href `/es/blog/centros-turisticos-de-lujo-en-egipto-junto-al-nilo` |  |
| 51 | `wp-page-88412` | tour | Horse Carriage & Local Market: Three Ways to See Luxor by Night | es | `/es/blog/centros-turisticos-de-lujo-en-egipto-junto-al-nilo` | externalLink href `/es/blog/centros-turisticos-de-lujo-en-egipto-junto-al-nilo` |  |
| 52 | `wp-page-58714` | wikiMonument | Sultan Selim Fortress | es | `/es/blog/centros-turisticos-de-lujo-en-egipto-junto-al-nilo` | externalLink href `https://travel2egypt.org/es/centros-turisticos-de-lujo-en-egipto-junto-al-nilo/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 53 | `wp-page-59381` | wikiMonument | Pyramid of Meidum | es | `/es/blog/centros-turisticos-de-lujo-en-egipto-junto-al-nilo` | externalLink href `https://travel2egypt.org/es/centros-turisticos-de-lujo-en-egipto-junto-al-nilo/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 54 | `wp-page-60776` | wikiMonument | The Heavenly Cathedral | es | `/es/blog/centros-turisticos-de-lujo-en-egipto-junto-al-nilo` | externalLink href `https://travel2egypt.org/es/centros-turisticos-de-lujo-en-egipto-junto-al-nilo/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 55 | `wp-page-69929` | wikiMonument | Abusir Pyramid Of Neferirkare | es | `/es/blog/centros-turisticos-de-lujo-en-egipto-junto-al-nilo` | externalLink href `https://travel2egypt.org/es/centros-turisticos-de-lujo-en-egipto-junto-al-nilo/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 56 | `wp-page-58799` | guideArticle | Al Gouna Festivals And Celebrations | en | `/ja/blog/ejiputo-no-ragujuaririzoto-o-do-erabu-ka` | externalLink href `/blog/ejiputo-no-ragujuaririzoto-o-do-erabu-ka` | BROKEN (404): en field meant `/blog/luxury-resorts-in-egypt` (legacy wpUrl) but href is the JA slug on the EN route |
| 57 | `wp-page-59610` | guideArticle | Things To Do In Esna | en | `/ja/blog/ejiputo-no-ragujuaririzoto-o-do-erabu-ka` | externalLink href `/blog/ejiputo-no-ragujuaririzoto-o-do-erabu-ka` | BROKEN (404): en field meant `/blog/luxury-resorts-in-egypt` (legacy wpUrl) but href is the JA slug on the EN route |
| 58 | `wp-page-60133` | guideArticle | Only Here In Ismailia | en | `/ja/blog/ejiputo-no-ragujuaririzoto-o-do-erabu-ka` | externalLink href `/blog/ejiputo-no-ragujuaririzoto-o-do-erabu-ka` | BROKEN (404): en field meant `/blog/luxury-resorts-in-egypt` (legacy wpUrl) but href is the JA slug on the EN route |
| 59 | `wp-page-59638` | guideArticle | Getting Around In Farafra | es | `/es/blog/vacaciones-en-egipto` | externalLink href `/es/blog/vacaciones-en-egipto` |  |
| 60 | `wp-page-60207` | guideArticle | Best Marsa Alam Tours | en | `/ja/blog/ejiputo-no-ragujuari-na-bakeshon` | externalLink href `/blog/ejiputo-no-ragujuari-na-bakeshon` | BROKEN (404): en field meant `/blog/the-luxurious-egyptian-vacation` (legacy wpUrl) but href is the JA slug on the EN route |
| 61 | `wp-page-78784` | guideArticle | Public Transport in Kom Ombo | en | `/ja/blog/ejiputo-no-ragujuari-na-bakeshon` | externalLink href `/blog/ejiputo-no-ragujuari-na-bakeshon` | BROKEN (404): en field meant `/blog/the-luxurious-egyptian-vacation` (legacy wpUrl) but href is the JA slug on the EN route |

## Published documents: budget hotels post (Task 18)

| # | Linking doc | Type | Title | Field locale | Links to | Link | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `wp-page-87835` | tour | Fayoum Oasis, Meidum & Hawara Pyramids: A Full-Day Tour | es | `/blog/budget-hotels-near-the-pyramids` | externalLink href `/blog/budget-hotels-near-the-pyramids` | cross-locale: es field links to the en post |
| 2 | `wp-post-144441-es` | article | Maravillas de Egipto en marzo: Una aventura primaveral | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 3 | `wp-post-144544-es` | article | Tesoros de El Cairo: Visita de un día al Museo Egipcio, la Ciudadela y el Bazar | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 4 | `wp-post-257609-en` | article | Wonders of Egypt in March: A Spring Adventure | en | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` | cross-locale: en article links to the es post |
| 5 | `wp-post-257611-ja` | article | 3月のエジプトの魅力：春の冒険 | ja | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` | cross-locale: ja article links to the es post |
| 6 | `wp-page-114936` | guideArticle | Hurghada Small Group Day Tours | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 7 | `wp-page-58642` | guideArticle | Places to Stay in Al Minya | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 8 | `wp-page-58796` | guideArticle | Stay in Al Gouna | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 9 | `wp-page-58802` | guideArticle | Getting Around in Al Gouna | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 10 | `wp-page-59212` | guideArticle | How to Reach Aswan | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 11 | `wp-page-59392` | guideArticle | Things To Do in Cairo | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 12 | `wp-page-59393` | guideArticle | Where to Stay in Cairo | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 13 | `wp-page-59423` | guideArticle | Getting Around Dahab | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 14 | `wp-page-59480` | guideArticle | Food in Dakhla Oasis | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 15 | `wp-page-59493` | guideArticle | Hotels in Dakhla Oasis | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 16 | `wp-page-59590` | guideArticle | Edfu Food and Drink | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 17 | `wp-page-59636` | guideArticle | Accommodations In Farafra | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 18 | `wp-page-59642` | guideArticle | Things To Do In Farafra | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 19 | `wp-page-59706` | guideArticle | What To Eat In Hurghada | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 20 | `wp-page-59734` | guideArticle | Where To Stay In Kharga Oasis | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 21 | `wp-page-60072` | guideArticle | Top Hotels in Giza | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 22 | `wp-page-60075` | guideArticle | Navigating Giza | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 23 | `wp-page-60123` | guideArticle | Navigating Ismailia | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 24 | `wp-page-60229` | guideArticle | Getting Around Marsa Matruh | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 25 | `wp-page-60323` | guideArticle | Top Hotels in Qena | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 26 | `wp-page-60382` | guideArticle | Places to Stay in Ras Sudr | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 27 | `wp-page-60383` | guideArticle | Ras Sudr Local Transport Guide | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 28 | `wp-page-60384` | guideArticle | Things To Do In Ras Sudr | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 29 | `wp-page-60421` | guideArticle | Stay in Rosetta | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 30 | `wp-page-60459` | guideArticle | Where To Stay in Saint Catherine | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 31 | `wp-page-60487` | guideArticle | Things To Do In Sharm El Sheikh | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 32 | `wp-page-60508` | guideArticle | Siwa Hotel Guide | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 33 | `wp-page-60509` | guideArticle | Getting Around Siwa | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 34 | `wp-page-60535` | guideArticle | Sohag Hotel Guide | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 35 | `wp-page-60539` | guideArticle | Sohag Dining Experiences | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 36 | `wp-page-60577` | guideArticle | Story of Taba | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 37 | `wp-page-60649` | guideArticle | Places to Stay in Luxor | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 38 | `wp-page-60661` | guideArticle | Cultural Events In Luxor | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 39 | `wp-page-60706` | guideArticle | Only In Marsa Alam | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 40 | `wp-page-78152` | guideArticle | Taba Heights | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 41 | `wp-page-78400` | guideArticle | Things To Do In Marsa Alam | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 42 | `wp-page-83360` | guideArticle | Dahab Historical Guide | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 43 | `wp-page-86841` | guideArticle | Luxor Private Day Tours | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 44 | `wp-page-86858` | guideArticle | Hurghada Private Day Tours | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 45 | `wp-page-87064` | guideArticle | Aswan Private Day Tours | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 46 | `wp-page-87387` | guideArticle | Luxor Small Group Day Tours | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 47 | `wp-page-116301` | tour | Dendera & Abydos from Hurghada: A Full-Day Temple Tour | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 48 | `wp-page-156014` | tour | Fayoum Desert: Two Days Between Wadi al-Hitan, Wadi al-Rayan, and Lake Qarun | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 49 | `wp-page-88556` | tour | Sindbad Submarine, Hurghada: A Real Dive Beneath the Red Sea | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 50 | `wp-page-88558` | tour | Giftun Island Snorkelling Day Trip from Hurghada | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 51 | `wp-page-89602` | tour | Timeless Wonders: 10-Days Eternal Egypt Tour | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 52 | `wp-page-76255` | wikiMonument | Al-Azhar Mosque | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `https://travel2egypt.org/es/hoteles-economicos-cerca-de-las-piramides/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 53 | `wp-page-59706` | guideArticle | What To Eat In Hurghada | en | `/ja/blog/giza-no-piramiddo-chikaku-no-kakuyasu-hoteru` | externalLink href `/blog/giza-no-piramiddo-chikaku-no-kakuyasu-hoteru` | BROKEN (404): en field meant `/blog/budget-hotels-near-the-pyramids` (legacy wpUrl) but href is the JA slug on the EN route |

## Draft documents (`drafts.*`)

| # | Linking doc | Type | Title | Field locale | Links to | Link | Notes |
|---|---|---|---|---|---|---|---|
| 1 | `drafts.wp-page-86853` | hotel | 4-Days Stay at Marriott Mena House | es | `/es/blog/hoteles-boutique-en-egipto-de-lujo-unicos` | externalLink href `https://travel2egypt.org/es/hoteles-boutique-en-egipto-de-lujo-unicos/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 2 | `drafts.wp-page-59654` | guideArticle | Qasr Al-Farafra | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `https://travel2egypt.org/es/hoteles-economicos-cerca-de-las-piramides/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 3 | `drafts.wp-page-60509` | guideArticle | Getting Around Siwa | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 4 | `drafts.wp-page-75694` | guideArticle | Places To Go In Safaga | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `https://travel2egypt.org/es/hoteles-economicos-cerca-de-las-piramides/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 5 | `drafts.wp-page-86853` | hotel | 4-Days Stay at Marriott Mena House | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `https://travel2egypt.org/es/hoteles-economicos-cerca-de-las-piramides/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 6 | `drafts.wp-page-89619` | tour | Pharaohs Legacy: 10-Day Egypt and The Nile Tour Package | es | `/es/blog/hoteles-economicos-cerca-de-las-piramides` | externalLink href `/es/blog/hoteles-economicos-cerca-de-las-piramides` |  |
| 7 | `drafts.wp-page-62469` | hotel | Renaissance Sharm El-Sheikh | en | `/blog/egypt-luxury-beach-resorts` | externalLink href `http://travel2egypt.org/egypt-luxury-beach-resorts/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 8 | `drafts.wp-page-63598` | hotel | The Four Seasons At Sharm | en | `/blog/egypt-luxury-beach-resorts` | externalLink href `http://travel2egypt.org/egypt-luxury-beach-resorts/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 9 | `drafts.wp-page-63628` | hotel | The Westin Soma Bay Golf Resort Spa | en | `/blog/egypt-luxury-travel` | externalLink href `http://travel2egypt.org/egypt-luxury-travel/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 10 | `drafts.wp-page-86853` | hotel | 4-Days Stay at Marriott Mena House | es | `/es/blog/viajes-de-lujo-a-egipto` | externalLink href `https://travel2egypt.org/es/viajes-de-lujo-a-egipto/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 11 | `drafts.wp-page-253537` | guideArticle | Kharga Oasis Only Here | en | `/blog/experiencing-egypt-aboard-the-oberoi-zahra` | externalLink href `https://travel2egypt.org/experiencing-egypt-aboard-the-oberoi-zahra/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 12 | `drafts.wp-page-59571` | guideArticle | Edfu Historical Guide | en | `/ja/blog/ejiputo-no-rekishi-aru-hoteru` | externalLink href `/blog/ejiputo-no-rekishi-aru-hoteru` | BROKEN (404): en field meant `/blog/historical-hotels-in-egypt` (legacy wpUrl) but href is the JA slug on the EN route |
| 13 | `drafts.wp-page-131827` | hotel | Sunrise Montemare Resort | en | `/blog/luxury-nile-cruise` | externalLink href `http://travel2egypt.org/luxury-nile-cruise/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 14 | `drafts.wp-page-62469` | hotel | Renaissance Sharm El-Sheikh | en | `/blog/luxury-nile-cruise` | externalLink href `http://travel2egypt.org/luxury-nile-cruise/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 15 | `drafts.wp-page-86853` | hotel | 4-Days Stay at Marriott Mena House | es | `/es/blog/guia-de-cruceros-de-lujo-por-el-nilo` | externalLink href `https://travel2egypt.org/es/guia-de-cruceros-de-lujo-por-el-nilo/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 16 | `drafts.wp-page-62450` | hotel | Rixos Seagate Sharm Hotel | en | `/blog/the-luxurious-egyptian-vacation` | externalLink href `http://travel2egypt.org/the-luxurious-egyptian-vacation/` | absolute legacy WP URL (308 via [...rest] catch-all) |
| 17 | `drafts.wp-page-64289` | nileCruise | M/S Sonesta St. George | en | `/blog/the-luxurious-egyptian-vacation` | externalLink href `http://travel2egypt.org/the-luxurious-egyptian-vacation/` | absolute legacy WP URL (308 via [...rest] catch-all) |
