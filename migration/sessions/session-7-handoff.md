# Session 7 Handoff — wikiMonument cohort + city.placesToGo

## Pre-conditions (from Session 6.5b close)
- Staging dataset is at zero orphans, 431 guideArticles + 30 travelTips + 41 cities
- All 8r-2c classifier extensions intact
- 17 deferred guideArticles deleted from staging (none of them belong to Session 7's cohort)

## Cohort scope: wikiMonument cohort (149 docs)
Session 7 migrates the wikiMonument cohort from WordPress source. Estimated count: 149 monuments. WP source: pages with `template: wiki-monument` (or whatever the actual template attribute is — verify via classifier inspection).

### 3 deferred attraction-pages from 8r-2b that need wikiMonument migration
These three were classified as guideArticle in 6.5b's first re-emit but moved to EXPLICIT_DEFER_SLUGS during the orphan-fix (the editorial decision: they're attractions, not guide articles). They were deleted from staging during 8r-2d's batch delete. Session 7 should re-classify them as wikiMonument and migrate properly:

| WP slug | Should land at | Notes |
|---|---|---|
| `wadi-al-hittan` | place_to_go under al-fayoum | UNESCO whale fossil site; check that mapper handles whale fossil photo gallery |
| `wadi-el-rayan` | place_to_go under al-fayoum | National park; multiple lakes, waterfall |
| `dendera-village` | place_to_go under qena | Dendera Temple area |

## Companion task: city.placesToGo population
Each of the 41 city docs should have its `placesToGo` array populated with relevant wikiMonument references. Currently empty (only Cairo seeded). Sub-phase scope: enumerate which monuments belong to which city, populate the references.

## Editorial follow-up (optional, not blocking)
After Session 6.5b closed, the city `wadi-el-natrun`'s slug is `wadi-el-natrun` but `name.en` is still `Wādī Al Natron`. Decision deferred to operator: align name to `Wādī El Natrun` or leave as-is. Not blocking Session 7 work.

## Risks / known unknowns
- WikiMonument schema may have fields the migration mapper doesn't handle (e.g., specific photo gallery handling, ancient-name fields, hours-of-operation dictionaries)
- The 8r-2c classifier's ability to distinguish wiki-monument from destination-subpage may need extension if templates overlap
- Some monuments cross multiple cities (e.g., the Pyramids of Giza could be referenced from Giza and Cairo); decide editorial reference policy

## Pre-flight gates needed
1. Schema review — confirm wikiMonument fields and mapper coverage
2. Cohort sample dry-run on 10-15 random monuments
3. Editorial review of place_to_go reference graph (one city's references reviewed before scaling)

## Wall-clock estimate
6-10 hours, depending on schema complexity and editorial-review depth.
