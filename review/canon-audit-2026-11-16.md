# Content-canon audit: itinerary + day-tour formats (2026-11-16)

Checked against `docs/content-canon.md` after PRs #252–#254 and the production
writes for the 7-Day tour (`wp-page-136519`) and Giza Pyramids & GEM (`wp-page-239597`).
The canon does not conflict with the new templates: Part VI-2 asks for exactly this, a page
type's layout designed once, approved, then reused. The gaps were in process.

## Passed (checked, not assumed)

| Rule | Result |
|---|---|
| II-5 anti-filler ban (EN/ES/JA) | No banned phrase in any published string, draft or script. |
| II-6 no invention | All 164 published EN strings match the locked copy (`review/locked/*.md`) verbatim; 2 glance labels are locked in the day-tour brief. |
| III-2 numeric gate | Every figure in ES/JA matches EN. The only differences are the same value written differently: 2000万 = twenty million; "años sesenta y setenta" = 1960s and 1970s. |
| III-6 JA no italics | Already enforced by `html[lang='ja'] .tour-doc * { font-style: normal !important }`. |
| Gate C images, Gate D slugs/redirects | Nothing changed. |
| II-7 prices | No price hand-typed; the From row renders the stored value. |

## Fixed today (this PR)

1. **Gate D-13 / VII-3, rollback first.** The four earlier writes had none.
   - The pre-change documents were recovered from Sanity history: `migration/rollback/*.before-2026-11-16.json` (7-Day as of 15 Nov, Giza as of 11 Nov).
   - Every import and staging script now writes its rollback before any write (`scripts/lib/content-gates.mjs` → `writeRollback`).
2. **Gate A-1/A-2, locked copy + verbatim pre-flight.**
   - The owner-approved reference drafts now live in the repo: `review/locked/`.
   - Every script aborts if a string it would write is not in the locked copy:
     - EN imports check against `review/locked/*.md`;
     - ES/JA imports check against the approved `review/localize/<lang>-strings.json` plus that language's own essay;
     - batch stagings check against their approved draft file.
   - Only strings the run changes are checked.
3. **III-6, EN typographic apostrophes.**
   - 18 EN strings were republished with ’ instead of ' (7 on the 7-Day tour, 11 on Giza), with a rollback written first. That is the only content change.
   - The scripts now normalize EN apostrophes before every write.
   - A re-run shows 0 remaining changes.
4. **B-6, field sweep.** Findings below; nothing changed without approval.
5. **B-4, live verification.** Live screenshots in all three languages at desktop and mobile: `review/canon-screens-2026-11-16/` (added once the hourly revalidate has published the ES/JA writes).

## Field sweep (B-6): found, not changed (needs the owner)

**7-Day tour**
- EN `summary`: "compress Egypt's spine": a straight apostrophe, and "a final day at the Theban temples". In the approved days, Luxor is day 6 and day 7 is the Cairo departure.
- EN `seo.metaDescription`: "a last day in Thebes" has the same mismatch.
- JA `seo.metaTitle` and `seo.metaDescription` are empty (VI-4: the full field set ships in all three languages).

**Giza & GEM**
- `seo.metaTitle` / `metaDescription` are empty in all three languages.
- EN `summary`: "two of Egypt's greatest sites" is a soft superlative (II-3) with a straight apostrophe. "Here is what to expect." is a filler close.
- `shapeOfDay` (not shown on day-tour pages; read by other surfaces) contradicts the approved content:
  - EN says "≈17:00 return" (approved: 17:00–18:00) and "tiered pricing";
  - JA says 午後5時前ごろお帰り (before 17:00) and a three-tier price with lunch only in the top tier (approved: lunch included).
- Hero: a museum-interior shot (visitor photographing statues), fine for the GEM half of the claim; no pyramid in frame.

## Needs a founder ruling (canon VII-1: a conflicting instruction triggers a question)

1. **VI-3, all three languages ship together.**
   - The briefs sequenced EN first, then ES/JA after approval. EN went live about an hour before ES/JA.
   - Future batches: either stage all three before publishing any, or amend the canon.
2. **III-5, heading set.** These were added without one-time approval:
   - "More about this route";
   - "Make it yours" / "Hazlo tuyo" / "あなただけの旅に";
   - the stay rows (Hotels, On the Nile, Sleeper train, Flight, Camp, By road, Every day);
   - the ES/JA night kinds;
   - the ES/JA pickup-zone wording.
3. **II-3, superlatives in the approved references, not verified against the sibling set:**
   - "the largest stone structure ever built";
   - "the only surviving wonder of the ancient world";
   - "the only one where some original casing stones survive";
   - "the most completely preserved temple in Egypt";
   - "the largest archaeological museum in the world by floor area".
4. **I-1, honesty.** "Your guide speaks: español / 日本語" shows on Cairo/Giza *group* day tours (owner rule §6.1). If shared departures don't run in ES/JA, this oversells.
5. **I-1, honesty.** "Minimum age 18" sits in the Karnak, Abu Simbel and balloon text, against "children under 12: 50% off".
