# Session 12 Handoff — JA slug migration: guideArticle + city + (β) place-name standardization

## Goal (revised mid-session, twice)

- **Original**: close bug §4.2 for `guideArticle` (~700 docs estimated)
- **First revision** (after gate C surfaced the route topology): expand to include `city` for `/ja/guide/*` route closure — guideArticle URLs are 2-segment `/[citySlug]/[articleSlug]`, requiring both layers ASCII
- **Second revision** (operator decision): expand to **(β)** — apply uniform middle-dot principle across the corpus, executing most of `docs/decisions/ja-slug-options.md` §1.10's planned place-name standardization implicitly. Substring scan surfaced 91 additional guideArticle docs across 11 place-name clusters; 6 singleton multi-dot compounds (Aswan High Dam + 5 hotels); 11 new city overrides on top of 5 cluster-consistency carryovers.

## Outcome

**Bug §4.2 is closed for the primary content route family.** All 12 URLs in Gate C returned 200 OK. The bug class — Japanese-character JA slugs producing URL-encoding-mismatch 404s — is resolved for every `/[locale]/blog/*`, `/[locale]/travel-tips/*`, `/[locale]/guide/[city]`, and `/[locale]/guide/[city]/[article]` route across sessions 10+11+12.

## Shipped commits (this session, 9 total)

| SHA | Description |
|---|---|
| `0157428` | `feat(migration)`: add guideArticle to ENTITY_CONFIGS |
| `2064715` | `chore(migration)`: add 41 JA slug overrides for guideArticle session 12 batch |
| `fffa414` | `chore(migration)`: apply JA slug migration to 430 guideArticles |
| `2ab42d4` | `feat(migration)`: add city to ENTITY_CONFIGS for JA slug migration |
| `28faf36` | `chore(migration)`: add 113 JA slug overrides for (β) place-name standardization |
| `b6a404c` | `chore(migration)`: re-apply JA slug migration to guideArticle with 91 new substring + 6 singleton overrides |
| `1c50cda` | `chore(migration)`: apply JA slug migration to 41 cities in migration-staging |
| `a291679` | `feat(mapper)`: city.ts JA slug derivation via local cityI18nSlugWithJaRomaji |
| (this commit) | `docs(sessions)`: session 12 handoff |

## Bug §4.2 status — closed for the primary content route family

| Entity type | Status | Coverage |
|---|---|---|
| `article` (session 11) | **Closed** | 168 JA docs |
| `travelTip` (session 11) | **Closed** | 30 JA docs |
| `guideArticle` (session 12) | **Closed** | 430 JA docs |
| `city` (session 12) | **Closed** | 41 JA docs |
| **Combined sessions 10-12** | **669 docs JA-slug-migrated across the four entity types serving the primary content routes** | |

Remaining entity types (`tour`, `hotel`, `monument`, `nileCruise`, `serviceStub`, `wikiMonument`, `wikiDeity`, `wikiDynasty`, `wikiPerson`, `editorialCategory`) — none yet migrated; each unblocks independently of all others (no multi-segment route dependencies per the architectural finding below).

## Verification results

### Gates A + B (data-level)

| Check | guideArticle | city |
|---|---|---|
| `slug._type === 'slug'` preserved | 430/430 ✓ | 41/41 ✓ |
| All JA slugs ASCII | 430/430 visually ✓ | 41/41 visually ✓ |

### Gate C (the critical end-to-end check) — 12/12 → 200 OK

| URL | Status | Note |
|---|---|---|
| `/ja/guide/sei-katarina/sei-katarina-no-rekishi` | 200 | sei-katarina cluster |
| `/ja/guide/sei-katarina/sei-katarina-san` | 200 | sei-katarina cluster |
| `/ja/guide/aru-wadhi-aru-gadhido/aru-wadhi-aru-gadhido-no-rekishi` | 200 | aru-wadhi cluster |
| `/ja/guide/eru-gu-na/eru-gu-na-no-osusume-tsua` | 200 | eru-gu-na cluster |
| `/ja/guide/aru-minya/aru-minya-no-tsukibetsu-tenki-to-osusume-no-fukuso` | 200 | aru-minya NEW (β) |
| `/ja/guide/marusa-matorufu/marusa-matorufu-no-rekishi-teki-haikei` | 200 | marusa-matorufu NEW (β) |
| `/ja/guide/rashido/rashido-no-rekishi` | 200 | rashido NEW (Rosetta-portion-dropped) |
| `/ja/guide/haruga/harugada-no-tenki-yoho` | 200 | algorithmic non-overridden control |
| `/ja/guide/sei-katarina` | 200 | city detail page |
| `/ja/guide/aru-minya` | 200 | city detail page NEW (β) |
| `/ja/blog/korona-uirusu-jidai-no-ejiputo-ryoko` | 200 | session 11 article regression ✓ |
| `/ja/travel-tips/shogai-no-aru-kata-no-ryoko` | 200 | session 11 travelTip override regression ✓ |

### Gate D — cross-locale switcher status (deferred-bug class)

Switcher still uses prefix-swap for `/guide/*` and `/travel-tips/*` routes — no α API route extended for guideArticle, city, or travelTip this session. Cross-locale clicks from EN → JA on these routes still 404. **Not a regression** — confirms the deferred bug class per `docs/decisions/ja-slug-options.md` §1.8. Same status as session 11 close.

### Gate E — truncation

3 truncations in guideArticle (down from 4 before overrides; one new singleton hotel slug pushed length back up by 1). 0 truncations in city. All word-boundary-clean (spot-checked in sessions 10/11 and again this session).

## Override file growth tracking

| Stage | Entries |
|---|---|
| Session 11 end | 1 |
| Session 12 mid (after first 41 batch) | 42 |
| **Session 12 end (after 113 batch)** | **155** |

Breakdown of the 155: 1 travelTip + 138 guideArticle (41 first batch + 91 substring + 6 singletons) + 16 city.

## Coverage reconciliation

- **guideArticle**: operator estimate ~700, **actual 430**. Source of discrepancy: pre-import forecast vs post-import actual after classifier filtering (per session 7 handoff). Locale-entries total across the corpus = 1289 (≈ 3 × doc count). 1 EN-only doc out of migration scope.
- **city**: actual 41, matches session 7 handoff exactly. No reconciliation needed.

## Architectural findings — FOUR (1-3 from session 11, 4 new this session)

### Finding 1 — Per-locale WP ID divergence

**Translation sibling docs have different base WP IDs; resolve via `translation.metadata`, never via string substitution on _id.**

(carried from session 11) Each locale sibling carries its own WP post ID. Siblings of the same logical article have different base IDs. Resolve sibling IDs via the `translation.metadata` doc's `translations[].value._ref`, never by string substitution.

### Finding 2 — Dual-metadata convention

**Every translation set has both `tmeta-*` shadow docs and canonical `translation.metadata.*` references; only the dot-prefix path enforces integrity.**

(carried from session 11) Every translation set in `migration-staging` has both a `tmeta-wp-post-{wpId}` shadow record and a `translation.metadata.wp-post-{wpId}` plugin-canonical doc. Only the dot-prefix variant enforces referential integrity at delete time.

### Finding 3 — Doc-level vs field-level i18n divergence (carried; city confirmed field-level this session)

**`article` uses doc-level i18n (separate doc per locale); `travelTip`, `guideArticle`, `city` use field-level i18n (one doc with locale-keyed slug array). Mapper integration patterns differ accordingly.**

(carried from session 11; expanded with city this session) **Confirmed for city this session**: `internationalizedArrayString` for name + `localizedSlugField()`, single doc per logical city with `_id: wp-page-${wpId}`. Migration script's `--type` config + scope queries differ accordingly.

### Finding 4 — Multi-segment route dependencies must be verified at scope-locking time (NEW)

Surfaced when Gate C revealed `/ja/guide/[citySlug]/[articleSlug]` is the **only** multi-segment dynamic route with two entity-slug dependencies. All other dynamic routes in this app are single-segment-after-prefix:

- `/[locale]/blog/[slug]` — article only
- `/[locale]/blog/category/[slug]` — editorialCategory (`category` is a static segment)
- `/[locale]/packages/[slug]`, `/tours/[slug]`, `/travel-tips/[slug]` — single entity
- `/[locale]/wiki/{deities|dynasties|monuments|people}/[slug]` — single entity (`wiki/<type>/` is static)
- `/[locale]/guide/[citySlug]` — single entity

**Lesson**: route topology inspection of `src/app/(site)/[locale]/` should precede any entity-migration scope-lock. **Bounded surprise**: no other route in this app has the multi-segment pattern. Future entity migrations (tour, hotel, monument, wikiDeity, etc.) won't hit the same class of surprise.

## Methodology lessons (continuing session 11 numbering)

### Lesson 18 — Cluster-wide substring replacement is the efficient pattern for operator-domain corrections

When an operator-domain correction applies to a place-name cluster (sei-katarina, aru-minya, marusa-matorufu, etc.), enumerate every doc whose algorithmic slug contains the source substring and apply the replacement uniformly, with explicit false-positive scan to confirm the substring is unique to its place-name. Override entries are batch-written with shared reason fields referencing the parent city's override `_id`. This pattern scales from 5-doc clusters to 10+ doc clusters without per-entry operator attention while preserving full audit traceability.

## §1.10 deferred work — substantially narrowed by this session

The (β) decision was made mid-session and executed most of §1.10's planned place-name standardization. **The remaining §1.10 scope is genuinely smaller now, not the same scope deferred again.** Remaining work:

1. **Al-/El- prefix standardization** for places where the algorithm already preserved middle-dots correctly:
   - `aru-faiyumu` (Al-Fayoum)
   - `aru-kuseiru` (Al-Quseir)
   - `aru-arishu` (Al-Arish)
   - Operator decision needed: keep algorithmic `aru-` (kana-faithful) forms, or apply international-convention `al-` / `el-` (as done for El Gouna)?

2. **Future entity types' JA slug considerations** — `tour`, `hotel`, `monument`, `nileCruise`, `serviceStub`, `wikiMonument`, `wikiDeity`, `wikiDynasty`, `wikiPerson`, `editorialCategory`. Each gets the standard pre-flight: (a) route-topology check, (b) schema check (doc-level vs field-level i18n), (c) cross-reference scan, before scope-lock.

## Other deferred items

- **Language switcher cross-locale fix** (decision doc §1.8) — same status as session 11 close. Deferred α-route extensions for travelTip, guideArticle, city, editorialCategory, wiki types. Inflection point for option-2 migration (middleware-driven layout-level provider) sits at ~5+ entity types needing the pattern; current count meets that threshold.
- **Override-bypass-cap caveat** — algorithmic outputs are truncated at 60 chars with word-boundary respect. Override values are written verbatim, no truncation. All 155 current overrides are under cap (longest 56 chars), so not a current concern, but future override authors should know the cap doesn't protect them.
- **Wiki monument redirect-map JA entries** (~10) — surfaced during this session's city pre-flight cross-reference scan. `migration/redirect-map.csv` contains JA-character `/ja/wiki/monuments/...` entries that will need ripple updates when wiki monument JA slug migration runs in a future session. Captured in the (β) decision context.
- **Editorial cleanup: `wp-page-58952`** — JA name has ガ (`gadi`) but pre-migration JA slug had ジャ (`jadi`). Kana variant in source data. The city override `aru-wadhi-aru-gadhido` resolves the slug-level discrepancy, but the JA name field still shows ガ vs ジャ inconsistency. Out of scope for slug migration; flagged for editorial review.

## Pre-cutover audit items (carryovers from earlier sessions)

- **Post B textile museum deletion redirects** (session 11): inbound links to `/blog/egyptian-textile-museum` should redirect to `/blog/egyptian-textiles-museum` (Post A canonical). Add to manual-redirects at cutover.
- **`generateStaticParams` rebuild**: dev server picks up new params on next request; production build needs re-running to regenerate static params for all the new ASCII JA slugs across articles + travelTips + guideArticles + cities. Schedule into cutover.
- **Redirect-map ripple check (session 12 city)**: no city-related Japanese-character entries in `migration/redirect-map.csv` (verified during pre-flight). The 10 JA-character wiki monument entries are deferred to wiki monument migration (separate session).

## Worktree state

Branch `claude/strange-archimedes-af65fe` has hosted sessions 10, 11, 12 (reused per session 11 start). Will be removed at session 12 close per protocol §9.1.

Fully merged to main. No drift. The session-12 sequence took main from `7af4d45` (session 11 end) → `a291679` (this session pre-handoff) → (handoff commit).

## Next session recommended scope

Three viable next-session options, operator's choice:

1. **Language switcher cross-locale fix for non-article entity types** (deferred §1.8). Inflection point reached — 4-5+ entity types now have the α-route gap. Good moment to evaluate option-2 migration (middleware-driven layout-level provider per `docs/decisions/ja-slug-options.md` §2 future option 2) vs. continuing per-entity α route additions.

2. **Next entity-type JA slug migration** — most candidates have small corpora (`tour`, `hotel`, `monument`, etc.). None have multi-segment route dependencies (per Finding 4). Pre-flight is: schema check (i18n strategy), cross-reference scan, override candidate review per dry-run.

3. **Close §1.10's narrowed remaining scope** — the 3 Al-/El- prefix standardization decisions (`aru-faiyumu` / `aru-kuseiru` / `aru-arishu`) plus any cross-references they unblock. Probably a 30-45 min session given how small the remaining scope is. Worth considering if you want §1.10 fully resolved before moving to new entity migrations.
