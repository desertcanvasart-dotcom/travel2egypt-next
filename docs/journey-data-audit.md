# Journey System — Data Audit (Batch 0, read-only)

Dataset: `migration-staging` (project `ufallvd2`). Perspective: `published` unless noted.
Read-only snapshot for the 4-bucket, 28-landing rollout. Nothing was changed, built, or seeded.

## 1. The 2×2 buckets

| Bucket | (type, mode) query | Single docs | Distinct axis | Expected landings | Landings found |
|---|---|---|---|---|---|
| Private Day Tours | `type=="dayTour" && tourMode=="private"` | **102** | 10 cities | 9 | **9** ✅ |
| Small Group Day Tours | `type=="dayTour" && tourMode=="group"` | **21** | 6 cities | 6 | **6** ✅ |
| Egypt Travel Packages | `type=="package" && tourMode=="private"` | **94** | 10 themes | 10 | **10** ✅ |
| Small Group Travel Packages | `type=="package" && tourMode=="group"` | **3** | 3 origin-regions | 3 | **3** ✅ |

- **All 28 subcategory landings already exist** (9+6+10+3). None need creating.
- **All 4 category-level docs exist** (`tourCategory`: private-day-tour, group-day-tour, private-package, group-package — subAxis destination-city / destination-city / theme / origin-region).
- **Bucket scoping is clean: 0 docs with unset/ambiguous `type` or `tourMode`.** Every one of the 220 tour docs has both.
- ⚠️ **Mismatch flag — Private Day Tours: 10 distinct city refs vs 9 landings.** The 10th city is **Giza** (tour `memphis-saqqara-citadel-khan-tour`, cities `[giza, cairo]`). There is no Giza landing; the tour is still reachable via the Cairo landing because its `cities[]` also includes `cairo`. Action: confirm any Giza-only private day tours aren't orphaned (none found in this snapshot).

### Landings per bucket (axis · status)
**Private Day Tours (9):** al-gouna, alexandria, aswan, cairo, hurghada, luxor, marsa-alam, safaga, **sharm-el-sheikh**.
**Small Group Day Tours (6):** aswan, cairo, hurghada, luxor, marsa-alam, sharm-el-sheikh.
**Egypt Travel Packages (10, by theme):** dahabiya-nile-cruise, family-egypt, egypt-in-depth, luxury, egypt-on-the-go, egypt-and-the-red-sea, hassle-free, adventure, nile-cruise, special-interest.
**Small Group Travel Packages (3, by origin-region):** japan-east-asia, uk-europe, usa-canada.

(Per-landing tour counts scale with the bucket totals above; the live per-city/theme count is computed by each landing's discriminator query at render time.)

## 2. Landing editorial readiness

| | Byline heading+note seeded | Flagship (mood chooser) | Flagship (orientation) | Essay/intro present |
|---|---|---|---|---|
| Sharm El-Sheikh Private Day Tours | ✅ | ✅ | ✅ | ✅ |
| Other 8 private day landings | ❌ | ❌ | ❌ | ✅ |
| 6 small-group day landings | ❌ | ❌ | ❌ | ✅ |
| 10 private package landings | ❌ | ❌ | ❌ | ✅ |
| 3 group package landings | ❌ | ❌ | ❌ | **❌ (no intro)** |

- **Byline (heading + note): seeded on 1 of 28** (Sharm private only). The other 27 will render the byline kicker-only unless code falls back to i18n, OR they get seeded. Per Rule §3, required editorial fields must be seeded so they never render blank.
- **Flagship content (mood chooser / orientation): authored on 1 of 28** (Sharm private). All others are "standard" landings by Rule §6 — acceptable, richness is content-driven.
- ⚠️ **The 3 group-package landings have no `intro`** (essay) — they will render a blank essay frame. Seed before shipping.

## 3. Single-doc completeness (all 220 tour/package docs)

123 day tours · 97 packages.

| Field | Populated | % | Notes / deficient set |
|---|---|---|---|
| Published hero image | 84 / 220 | **38%** | See publish-gap below — the real number is far higher in drafts. |
| Hero somewhere (pub OR draft) | ~194 / 220 | **~88%** | Only **~26 docs (12%) have no hero anywhere**. |
| Price / tier data (any) | 4 / 220 | **2%** | Effectively unpopulated. Only the seeded `quad-bike-tour-at-sunset` has structured `priceTiers`. |
| Structured price tiers | 1 / 220 | 0.5% | quad-bike only. |
| Included **and** Not-included (structured) | 1 / 220 | 0.5% | quad-bike only. Legacy portable-text inclusions/exclusions: **0**. |
| Shape-of-the-day (rail) | 1 / 220 | 0.5% | quad-bike only. |
| Itinerary — timed timeline | **0 / 220** | 0% | No tour has a structured hour-by-hour timeline. |
| Itinerary — day-by-day `days[]` | 132 / 220 | 60% | 73 packages + 59 day tours. Remainder rely on prose body. |
| Theme set (packages) | 94 / 97 | 97% | The 3 group packages key off `originRegion`, not theme. |
| Theme set (day tours) | **0 / 123** | **0%** | ⚠️ The L2 index "theme" column is blank for every day tour. |

### Per-bucket published hero
- Private Day Tours: **35 / 102** (34%)
- Small Group Day Tours: **2 / 21** (10%)
- Egypt Travel Packages: **47 / 94** (50%)
- Small Group Travel Packages: **0 / 3** (0%)

### ⚠️ Publish gap — the single biggest data issue
- **113 draft tour docs exist; 112 carry a hero image in the draft.**
- **110 of those are draft-only** — the published doc has no hero, the draft does.
- Net: publishing those drafts would lift published-hero coverage from **84 → ~194 of 220**.
- This is the highest-leverage action before the rollout. (No publishing was done — read-only session.)

## 4. Decision-apparatus readiness (single pages, Rule §4)

The apparatus fields (meta row group/effort/departs/from, shape-of-day, price tiers, included/not-included, trust) are **new structured fields that are essentially empty across the corpus** — only the one seeded tour (`quad-bike-tour-at-sunset-sharm-el-sheikh`) has them. Trust signals are global (code), so the trust card is fine everywhere. Everything else on the rail must be **authored per tour** (or sourced from existing inline prose, as was done for the quad-bike tour) — this is the dominant content workload for the rollout.

Itinerary rule: with **0 timed timelines**, every single day-tour page correctly uses the prose route (no fabrication). Packages will use `days[]` (132 docs have it).

## 5. Data gaps to surface (no invention — per Rule §5)

1. **Publish gap: 110 draft-only hero images.** Publish the draft tours to surface heroes.
2. **Price/tier data: ~218 docs have none.** Decision-rail price-logic cards can't render until authored — do not invent.
3. **Structured inclusions: 219 docs have none** (no legacy PT inclusions either). Included/Not-included sections will be empty until authored.
4. **Day-tour theme: 0/123.** The L2 index theme column is blank for all day tours; either populate theme or accept blank cells.
5. **27/28 landings lack a seeded byline; 3 group-package landings lack an essay/intro.**
6. **~26 docs have no hero in any perspective** — genuinely missing imagery.
7. **Giza** appears as a 10th private-day-tour city with no landing (low impact; tours co-tagged to Cairo).

## Method
Counts via GROQ aggregates on `published` (singles, landings, category docs, completeness) and `raw` (draft-only hero gap, via `string::split(_id,"drafts.")[1]` published cross-check). No mutations issued.
