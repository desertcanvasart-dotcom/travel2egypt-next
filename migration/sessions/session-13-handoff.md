# Session 13 Handoff — JA + ES section-nav body cleanup for /guide/* route family

## Goal

Close the JA + ES section-nav cleanup leftover for the `/guide/*` route family (cities + guideArticles) and reach strict EN parity. Distinct in kind from session 12 (which migrated slugs): this session targets **body-content cleanup** — stripping the WP-hub-template section-nav TOC tail and the cross-promo "Learn more" follow-on from JA + ES locale fields. Operator surfaced the gap during a visual review of `/ja/guide/akumimu`, where the JA body still carried template chrome that EN had already shed during the import-time pipeline.

## Outcome

**1,102 locale-field cleanups applied across 41 cities + 430 guideArticles in two locales.** JA + ES body content for the entire `/guide/*` route family now matches the cleaned EN state. Three cleanup strategies in the script's arsenal; 0 errors across all rounds; Gates A–D all pass.

## Shipped commits (this session, 11 total)

| SHA | Description |
|---|---|
| `e552041` | `feat(wp-import)`: parametrize stripSectionNavBlocks by locale + add stripCrossPromoTail |
| `05026e3` | `refactor(wp-import)`: extract section-nav patterns to shared module |
| `3ad698a` | `feat(cleanup)`: section-nav + cross-promo cleanup script for JA/ES city + guideArticle |
| `3701eaf` | `chore(cleanup)`: apply section-nav + cross-promo strip to 41 cities in JA + ES (first run — silently no-op'd due to patch-path bug) |
| `e25e00f` | `fix(cleanup)`: correct Sanity patch path — remove invalid [0] index after [_key==] filter |
| `044317f` | `chore(cleanup)`: re-apply section-nav + cross-promo strip to 41 cities in JA + ES (after path fix) |
| `ad855e5` | `chore(cleanup)`: apply section-nav + cross-promo strip to 761 guideArticles in JA + ES |
| `04cf491` | `fix(cleanup)`: broaden ES/JA regex (mixed-case ES + polite-honorific JA) |
| `18ef74c` | `feat(cleanup)`: add Strategy D orphan-tail-header detection + broaden ES/JA regex variants (DEL + を) |
| `f3d2c9f` | `chore(cleanup)`: re-run with broadened regex (Round 2) + Strategy D (Round 3) |
| (this commit) | `docs(sessions)`: session 13 handoff |

## Coverage — round-by-round

| Round | Trigger | Strategy | city ja | city es | GA ja | GA es | Total |
|---|---|---|---|---|---|---|---|
| 1 | Original regex (`の紹介`, all-caps ES) | B+C | 41 | 41 | 381 | 380 | **843** |
| 2 | Broaden #1 — `(?:ご)?` + `/i\p{L}` | B+C | 3 | 8 | 24 | 73 | **108** |
| 3 (B+C) | Broaden #2 — `(?:の\|を)` + `DE(?:L)?` | B+C | 7 | 4 | 59 | 40 | **110** |
| 3 (D)   | Strategy D — orphan-tail-header | D | 2 | 2 | 18 | 19 | **41** |
| **Total** | | | **53** | **55** | **482** | **512** | **1,102** |

Errors across all rounds: **0**.

97 docs intentionally out of scope (49 JA + 48 ES guideArticles): structurally different content with no detectable TOC pattern in either round, no orphan tail header. Likely WP non-hub-template sources, or hand-edited migrations from earlier WP→Sanity passes.

## Three cleanup strategies (final arsenal)

The script (`scripts/cleanup-section-nav-blocks.ts`) now runs three strategies in sequence per doc:

- **Strategy B** — bulk TOC head detection. Find the first block matching the locale's section-header regex; walk back consuming anchor-only paragraphs; walk forward consuming contiguous header + anchor blocks. Slices everything from there to end of doc.
- **Strategy C** — cross-promo 4-block extension. After Strategy B's `tocEnd`, looks for the WP next-city promotion signature: `[image] + [h2/h3] + [prose] + [Learn-more-text]`. If matched, extends the slice over those 4 blocks.
- **Strategy D** — position-based orphan-tail-header detection. Runs only when B+C didn't fire. Inspects ONLY the last block; requires Type-1 plain-text (no marks, no markDefs, single span, style=normal, ≤80 chars); matches loose locale signal (ES: starts with `PRESENTACIÓN`; JA: ends with `紹介`). Strips exactly that 1 block.

Audit log records `detectionMethod: "bulk-toc" | "orphan-tail-header"` per patch.

## Verification (Gates A–D)

### Gate A — sample-doc residual section-header check

4 sample docs queried against exact-string match `SECTION_HEADER_PATTERNS_{JA,ES}`:

| Doc | JA hits | ES hits |
|---|---|---|
| wp-page-56813 (city — Abu Simbel) | 0 | 0 |
| wp-page-58401 (GA — History of Akhmim) | 0 | 0 |
| wp-page-58422 (GA — Akhmim weather) | 0 | 0 |
| wp-page-59695 (GA — Hurghada stays) | 0 | 0 |

### Gate B — rendered-HTML check

6 sample URLs curled; body-level residual count of `PRESENTACIÓN…` (ES) and `…紹介` (JA) — excluding sidebar chrome:

| URL | Body-level residuals |
|---|---|
| /ja/guide/abu-shinberu | 0 |
| /es/guide/abu-simbel | 0 |
| /ja/guide/akumimu/akumimu-no-tenki | 0 |
| /es/guide/akhmim/clima-en-akhmim | 0 |
| /ja/guide/harugada/harugada-de-ninki-no-taizai-saki-gaido | 0 |
| /es/guide/hurghada/donde-dormir-en-hurghada | 0 |

### Gate C — block count + first-blocks-are-prose

4 sample docs spanning B+C bulk-strip hits and D orphan-strip hits:

| Doc | strategy | post-count | first block |
|---|---|---|---|
| wp-page-56813 (city ES, Abu Simbel) | B+C | 51 | h2 — "Guía de Viaje a Abu Simbel — …" |
| wp-page-253330 (GA ES, Kharga) | D | 39 | h2 — "Cómo llegar al Oasis de Kharga" |
| wp-page-197000 (GA JA, Taba) | D | 14 | h2 — "タバを移動するには：…" |
| wp-page-58422 (GA JA, Akhmim weather) | B+C | 27 | h2 — "今日のアクミームの天気" |

No over-strip detected.

### Gate D — EN pipeline regression

`SECTION_HEADER_PATTERNS_EN`, `LEADING_TITLE_LINE_RE_EN`, `CROSS_PROMO_LEARN_MORE_BY_LOCALE.en` — **untouched** across the entire session. `scripts/wp-import-html.ts` unchanged after Round 1. Strategy D is migration-script-only and not invoked by the import pipeline. EN code paths byte-identical to session-12 baseline; re-import would produce byte-identical output.

## Iteration history (honest record)

Gate B caught what Gate A missed — twice.

| Iteration | Caught by | Variant revealed |
|---|---|---|
| Round 2 trigger | Gate B (HTML curl on `/es/guide/abu-simbel`) | ES mixed-case (`PRESENTACIÓN DE Abu Simbel`); JA polite honorific (`のご紹介`) |
| Round 3 trigger | Sanity check on round-2 re-run | ES contraction (`PRESENTACIÓN DEL`); JA を particle (`タバの魅力をご紹介`) |
| Round 3 close | Sanity check passed; corpus residual = 0 for ES, glob-tokenizer artifacts only for JA | — |

Strategy D was introduced in Round 3 alongside the second regex broaden specifically to break the iteration cycle. Position-based heuristics are robust against text-pattern variant drift in a way exact regex matching is not.

## Methodology lessons (continuing session 12's numbering)

### Lesson 19 — Validate data-mutating scripts with an immediate integrity gate

Sanity patch paths reject `[0]` indexing after `[_key=="..."]` filters and **silently no-op while reporting success** (commits 3701eaf → e25e00f → 044317f). GROQ read paths require the index; write paths reject it. Easy to confuse. The failure was caught by a post-commit block-count integrity check that would otherwise have propagated 82 silent no-ops on the first city run, and 761 silent no-ops on the subsequent guideArticle run. **Pattern**: always pair the first batch of any data-mutating script with an immediate observable-mutation check (block count, slug value, count of altered docs) before scaling to the full corpus.

### Lesson 20 — Pattern tables for multi-consumer scripts go in a shared module from day one

Section-nav and cross-promo patterns were originally inlined in `scripts/wp-import-html.ts`. When the one-shot cleanup script was added (`cleanup-section-nav-blocks.ts`), the patterns needed to be in both places. The session 13 refactor (commit 05026e3) extracted them to `scripts/wp-import/section-nav-patterns.ts` as the single source of truth. **Pattern**: when a second consumer for a pattern table appears, do not duplicate — extract immediately. Duplicate-and-reconcile-later compounds into technical debt the moment any pattern revision lands. This was caught during the cleanup-script draft review and fixed before the first commit referenced both.

### Lesson 21 — Pattern-based cleanup regexes must be validated against the full corpus shape, not one sample

Initial regex design (commit 05026e3) was modeled on one Akhmim pre-flight sample. Real corpus data has variants the design missed: the polite-honorific JA variant (`のご紹介`), the mixed-case ES variant (`PRESENTACIÓN DE Abu Simbel`), the ES contraction variant (`PRESENTACIÓN DEL …`), the JA を particle variant (`タバの魅力をご紹介`). Gate A's narrow exact-string sample masked the gap because the chosen docs happened to use the regex-matching forms. Gate B's URL-fetch check caught it. **Methodology fix**: corpus-wide variant scan should be its own pre-flight step alongside the coverage count. Count not just "how many docs match" but "how many variants of the matching pattern exist within the corpus."

### Lesson 22 — Complement exact-pattern matching with position-based heuristics

Text-pattern matching alone is brittle against operator-domain variant drift (Spanish contractions, Japanese particle alternations, mixed-case proper nouns). Each new variant requires another regex iteration. Round 2's broadened regex left 139 docs un-cleaned; Round 3's further broadening would still not have caught every future variant in principle. Strategy D — a position-based detector that inspects only the document's last block under tight safety guards (Type-1 plain text, no marks, single span, ≤80 chars) and matches a loose locale signal (`/^PRESENTACIÓN\b/i` and `/紹介$/`) — broke the iteration cycle. **Pattern**: future cleanup-class work should consider position-based detectors from the design phase, not as a retrofit. Three guard categories matter: structural (no marks, no markDefs, single span), positional (last-block-only), and bounded (length cap).

## Deferred items

- **97 NO-TOC guideArticles** (49 JA + 48 ES). Structurally different content; no detectable TOC pattern in any round, no orphan tail header. Worth a follow-up investigation if operator surfaces a different leftover pattern in their bodies.
- **JA `*紹介` GROQ-glob residual count** of 82 GA + 4 city. Verified by sampling: all are long editorial prose paragraphs containing `ご紹介` in the middle (false positives from GROQ's tokenizer-based glob matching). Strategy D's 80-char guard correctly excludes them. Not a real residual; documented here to forestall confusion if a future corpus scan re-surfaces the same number.
- **FI / DE / AR locale handling** when those locales get added to migration-staging. Pattern tables in `section-nav-patterns.ts` will need new entries; cleanup script's `--locale` set will need to expand. Strategy D requires per-locale signals (the closing-letter or opening-token rule for the new languages).
- **§1.10 unchanged** — different cleanup class, narrowed scope (3 Al-/El- prefix decisions: `aru-faiyumu` / `aru-kuseiru` / `aru-arishu`) still as documented in session 12 handoff.

## §4.2 status — unaffected

Session 13 is body-content cleanup, distinct from session 10–12's slug migration. Bug §4.2 closure inherited from session 12: still closed for the primary content route family (`article`, `travelTip`, `guideArticle`, `city` JA slugs). No regression.

## Pre-cutover audit items (carryovers, unchanged from session 12)

- Post B textile museum deletion redirects
- `generateStaticParams` rebuild
- 10 JA-character wiki monument entries in `migration/redirect-map.csv` — deferred to wiki monument migration

## Worktree state

Branch `claude/strange-archimedes-af65fe` has hosted sessions 10, 11, 12, 13. Will be removed at session 13 close per protocol §9.1.

Fully merged to main. The session-13 sequence took main from `5c45efb` (session 12 end) → `f3d2c9f` (this session's last pre-handoff commit) → (handoff commit).

## Next session recommended scope

Three viable options (same shape as session 12's recommendation, advanced by one session's work):

1. **Language switcher cross-locale fix** — completed during session 13 (commit `45bbd02`), bug §1.8 closed for the full entity-type matrix.
2. **Next entity-type JA slug migration** — `tour`, `hotel`, `monument`, `nileCruise`, `serviceStub`, wiki types, `editorialCategory`. Single-segment routes; pre-flight is the standard route-topology + schema + cross-reference scan.
3. **Close §1.10's narrowed remaining scope** — the 3 Al-/El- prefix decisions. Still small, still ~30-45 min if operator wants §1.10 fully resolved.

4. **(NEW) — Investigate the 97 NO-TOC guideArticles** if the operator's future visual review surfaces any leftover pattern beyond what Round 3 cleaned. If the bodies are uniformly clean, the deferred item closes itself; if there's a third tail pattern, Strategy E.
