# Session 7 — wikiMonument cohort + city.placesToGo population

**Status:** Plan locked. Decisions pre-staged. Ready to execute.

## Pre-conditions (verified at session 6.5b close)

- Origin/main at `be47dc8` (session 6.5b merge commit)
- Migration-staging dataset: 41 cities, 507 articles, 431 guideArticles, 30 travelTips, 6 categories, 21 editorial categories, 4 metadata. Orphan count: 0.
- Test triad: 402/402 green
- All 8r-2c classifier extensions intact (DESTINATIONS, TOKEN_TO_CITY_SLUG, WADI rule, EXPLICIT_DEFER_SLUGS, EXPLICIT_PARENT_CITY_OVERRIDES)
- 4 handoff docs created in migration/sessions/

## Locked decisions (no questions during Session 7 about these)

1. **`wadi-el-natrun` city.name.en** -> align to `Wadi El Natrun` (no diacritics, cleaner). Quick Studio edit at session start.

2. **3 attraction-pages from 8r-2b are wikiMonument targets** with these parent cities:
   - `wadi-al-hittan` -> al-fayoum
   - `wadi-el-rayan` -> al-fayoum
   - `dendera-village` -> qena

3. **city.placesToGo population strategy** -> Hybrid:
   - Auto-populate via wikiMonument's parentCity ref
   - Followed by operator review pass in Studio

4. **WP monument count** -> unknown, discover via Phase 0 audit. Plan accommodates 50-250 monuments.

## Phase structure (8 phases)

| Phase | Scope | Wall-clock | Risk |
|---|---|---|---|
| Pre-flight | Worktree setup, schema review, classifier audit, .env verification | 30-45 min | Low |
| 0 | WP audit: count monuments, identify edge cases, surface schema gaps | 30-45 min | Low (read-only) |
| 1 | wikiMonument dry-run — full cohort | 60-90 min | Medium (first write touch) |
| 1.5 | Editorial review pass — defer/override decisions | 30-60 min | Operator decision |
| 2 | wikiMonument actual write — full cohort | 60-150 min | Medium |
| 3 | city.placesToGo auto-populate via parentCity ref | 60-90 min | Medium (writes to all 41 cities) |
| 3.5 | Operator review pass for placesToGo | 60-120 min | Operator (Studio work) |
| 4 | Rendering spot-check — wikiMonument routes + city detail with placesToGo | 30-45 min | Low |
| 5 | Phase 9-style close (commit + merge + cleanup) | 30-45 min | Low |

**Total estimate: 6.5-12 hours** (range driven by monument count + editorial pass duration)

## Pre-flight phase — first sub-phase to run

Goal: verify worktree state, set up Session 7 branch, confirm everything is solid before any cohort work.

Tasks:
1. From main worktree, create `session-7-actual-write` branch from `main` HEAD (be47dc8)
2. Create new worktree at `.claude/worktrees/session-7-actual-write`
3. Verify .env points at production dataset (don't repeat the 6.5b spot-check oversight)
4. Run test triad — confirm 402/402 still green
5. Confirm orphan count = 0 in staging
6. Optional: cleanup the 8 orphan harness worktrees that surfaced during 6.5b's 9d (out-of-scope for Session 7 work, but cheap to clean)
7. STOP gate

## Phase 0 — WP audit + schema review

Goal: know what we're migrating before we touch the importer.

Tasks:
1. Read `src/sanity/schemas/wikiMonument.ts` in full — surface field shape, i18n model, required vs optional fields
2. Surface the GROQ queries (if any) currently using wikiMonument
3. Run a WP-side audit: classify all WP pages, count those that map to wikiMonument template
4. Spot-check 5-10 random monument WP pages — what's their content shape, what fields are populated, what edge cases exist
5. Surface findings + scope estimate
6. STOP gate

Expected outputs:
- Definitive monument count (e.g., 127 of which 3 are deferred-from-6.5b additions)
- List of edge cases (monuments without parentCity in WP, monuments with multi-parent claims, monuments named identically to cities like "Saint Catherine")
- Schema gap analysis (any fields the WP source needs but the schema doesn't have)

## Phase 1 — wikiMonument dry-run

Goal: mapper validates without writes. Surface what would be written.

Tasks:
1. Run `npx tsx scripts/wp-import.ts --type page --filter-by-template wiki-monument --dry-run`
2. Capture summary
3. Spot-check 5 sample monuments in dry-run output
4. Identify any monuments that would write with parentCity null (orphan candidates)
5. Identify any monuments that would write with malformed slugs
6. STOP gate

## Phase 1.5 — Editorial review

Goal: lock in defer/override decisions before actual write.

Tasks:
1. Architect surfaces orphan candidates (if any) and slug-issue candidates (if any) for editorial review
2. Operator decisions on:
   - Which orphans get EXPLICIT_PARENT_CITY_OVERRIDES entries
   - Which orphans get EXPLICIT_DEFER_SLUGS entries (don't migrate)
   - Any slugs that need rename (per the wadi-el-natron precedent)
3. Implement decisions in classifier
4. Re-run dry-run to confirm decisions held
5. STOP gate

## Phase 2 — wikiMonument actual write

Goal: write the cohort to staging.

Tasks:
1. Run `npx tsx scripts/wp-import.ts --type page --filter-by-template wiki-monument` (no --dry-run)
2. Capture summary + verify cohort count matches dry-run prediction
3. Run idempotency drift dry-run (mirrors 6.5b's pattern)
4. Coverage gates: 0 wikiMonuments with parentCity null
5. Editorial integrity spot-check on 1-2 random monuments (same pattern as 6.5b's bahariya canary)
6. STOP gate

## Phase 3 — city.placesToGo auto-populate

Goal: programmatically populate the placesToGo array on each city based on monument's parentCity ref.

Tasks:
1. Build a small Node script (or GROQ-based mutation) that:
   - Queries all wikiMonument docs grouped by parentCity._ref
   - For each city, builds an array of monument references
   - Patches city.placesToGo with the constructed array
2. Run on staging
3. Verify each of 41 cities has placesToGo populated (some may be 0 if no monuments belong)
4. STOP gate

## Phase 3.5 — Operator review pass

Goal: editorial polish on auto-populated placesToGo.

Tasks (mostly your work in Studio):
1. For each city, review placesToGo:
   - Are the auto-populated monuments correctly assigned?
   - Should some monuments be added that aren't auto-populated (e.g., a monument near the city border)?
   - Should some be removed (e.g., a monument that's technically in the city but not relevant for tourism)?
   - Should the order be re-sorted (Studio supports drag-reorder)?
2. Estimated 60-120 min depending on city count (41 cities x 2-3 min average)
3. STOP gate

## Phase 4 — Rendering spot-check

Goal: validate routes work end-to-end.

Tasks (manual + Claude Code mix):
1. Hand-spot-check 3-5 city detail pages — does placesToGo render correctly with monument cards?
2. Spot-check 3-5 wikiMonument detail pages — do they load? render correctly? have proper SEO?
3. Spot-check 1 city in each locale (EN/ES/JA)
4. STOP gate

## Phase 5 — Session close

Mirrors 6.5b's Phase 9 (single commit, no-ff merge to main, cleanup).

## Risks register

| Risk | Likelihood | Mitigation |
|---|---|---|
| WP source has 0 monument records | Low | Phase 0 audit catches this immediately |
| Schema mismatch (WP fields the schema doesn't support) | Medium | Phase 0 surfaces, decide before Phase 2 |
| Orphan count after Phase 2 > 5 | Medium | Use 6.5b's orphan-fix pattern (now well-tested) |
| Some monuments cross multiple cities (Pyramids of Giza) | High | Document editorial policy in Phase 1.5 |
| placesToGo auto-populate produces too many references per city | Medium | Phase 3.5 review pass curates |
| placesToGo auto-populate produces too few (cities with 0-2 monuments) | Medium | Operator may want to add more in 3.5 |
| Operator fatigue during 3.5 review pass (41 cities x decisions) | High | Break into 2-3 sittings; no rush |

## Recovery model

If anything fails mid-session:
- Pre-Phase 2: just re-run from where it stopped, no rollback needed
- Phase 2 partial-write: 6.5b's 4r-recovery pattern applies (resume from filtered slugs)
- Phase 3 partial-write: more sensitive (writes to 41 cities). Use idempotent merge dispatcher; can re-run safely
- Phase 4 surfaces orphan: 6.5b's 8r-orphan-fix pattern applies

## Decisions deferred to Session 7

These are open questions at session 7 start. Plan accommodates them:
- Editorial decisions on orphan monuments (Phase 1.5)
- placesToGo curation per city (Phase 3.5)
- Any rename decisions surfaced by Phase 0 audit (e.g., another wadi-el-natron-style transliteration variant)

---

**Last updated:** Session 6.5b close (2026-05-05)
**Author:** Claude (architect), Islam (operator)
**Status:** Locked. Ready for execution.
