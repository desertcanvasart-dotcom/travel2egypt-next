# Memphis, Saqqara, the Citadel & Khan El Khalili: open items

Source: the live page `/memphis-saqqara-citadel-khan-tour`, read 17 Nov 2026. Owner answers received 22 Nov 2026.

## Resolved (22 Nov)

- **This page:** approved as drafted.
  - **Entrance tickets:** included (Memphis, Saqqara and the Citadel).
  - **Everything else:** unchanged.
  - **URL:** unchanged.
- **Overlap with `/private-tour-memphis-and-saqqara`:** merge it into this product, **but only if Claude Code confirms the overlap first.** Claude Code inspects the other product and reports what it finds before changing anything (instructions below). If it turns out to be a different product, nothing is merged and the owner decides.

## Small points (not blockers)

1. **After a merge.** Guests looking for the Al-Muizz version would land here. If you'd like, "Make it your own" could offer "swap the Citadel for a walk along Al-Muizz Street". I haven't added it; your call.
2. **Memphis date.** This page says "around 3000 BC"; other pages use 3100 BC. I've left it as it is ("the rest is okay"); tell me if you want one date site-wide.

## Corrections to the essay in "More about this day" (Gate A.3), applied as recommended

| # | Current text | Change to |
|---|---|---|
| 1 | "established in 1382 by the Mamluk sultan Barquq" | "established in 1382 by the Mamluk emir Jaharkas al-Khalili" |
| 2 | "An English-speaking Egyptologist guide" | "An Egyptologist guide in your language" |
| 3 | "It is the world's oldest large-cut-stone structure" | The shared Tier 1 wording, once approved; until then, "one of the earliest large buildings in cut stone" |
| 4 | "some of the finest early Egyptian art anywhere" | "remarkable early Egyptian painting" |
| 5 | "Travellers who do this day after seeing Giza often say it is the day that made Cairo coherent." | "Done after Giza, this is the day that makes Cairo coherent; done before, it makes the pyramids easier to read." |
| 6 | "the dynasty that ended with Farouk in 1952" | "the dynasty that ruled until 1952" |
| 7 | "El Fishawy has been operating since around 1773" | "operating continuously since 1773, according to its own account" (the site-wide wording) |

## Figures

- Memphis around 3000 BC (see small point 2)
- Djoser around 2650 BC
- Citadel 1176; mosque 1830–48; Khan 1382
- Pickup 08:00–09:00; about 8 hours; about an hour's drive back

## Numeric gate (22 Nov)

- **EN and ES:** the same figures.
- **JA:** the same figures, plus 1 (1名様, 約1時間), 2 (ラムセス2世 "Ramses II"), 10 (10月6日市) and 30 (30分, "half an hour").

## Instructions for Claude Code

Canon gates A–D apply. **Step 1 is read-only.** Do not change anything until step 1 is reported and its condition is met.

### 1. Check the other product first (read-only, report only)

Find the product with the EN slug `/private-tour-memphis-and-saqqara`. Change nothing. Report:

1. its `_id`, its title and its slugs in all three locales
2. its stops in itinerary order, its duration, its inclusions and its pickup city
3. its price basis (per person or per car, any tiers) and whether it is live or hidden
4. every document that references it (hubs, theme pages, destination pages, related tours, journeys, nav, guides, blog posts)
5. its images, with their sizes

Then apply this test.

- **The overlap is confirmed** only if all of these hold:
  - it is a full-day private tour from Cairo or Giza
  - its stops are Memphis and Saqqara, plus Al-Muizz Street and/or Khan El Khalili
  - it has no stop that this product lacks, other than Al-Muizz Street (for example Giza, Dahshur, the Egyptian Museum or the Imhotep Museum as a separate stop)
- **If the overlap is confirmed,** go on to steps 2 to 4.
- **If it is not confirmed,** stop after step 2. Make no change to the other product, add no redirect, and report what differs so the owner can decide.

Do not touch the Giza, Memphis & Saqqara day tour. It is a different product.

### 2. Update this product (the keeper)

1. Find it by the EN slug `/memphis-saqqara-citadel-khan-tour`, and report its `_id` and its slugs in all three locales.
2. Write the rollback JSON before any change (Gate D).
3. Load the three files in this folder verbatim (Gate A pre-flight):
   - `memphis-saqqara-citadel-khan-el-khalili.md`
   - `memphis-saqqara-citadel-khan-el-khalili-es.md`
   - `memphis-saqqara-citadel-khan-el-khalili-ja.md`
4. Set the inclusions: entrance to Memphis, Saqqara and the Citadel; lunch; water; the driver's tip.
5. Remove any tiers and any minimum age (owner rules 8 and 9). Keep the children's row.
6. Set the guide links: Memphis · Saqqara · Step Pyramid · Citadel · Mosque of Muhammad Ali · Khan El Khalili · Giza.
7. Apply essay corrections 1–7 from the table above in all three locales.
8. Set `needsReview: true`. Keep the slug unchanged.

### 3. Only if the overlap is confirmed: retire `/private-tour-memphis-and-saqqara`

1. Write its rollback JSON first.
2. Repoint every inbound reference to the keeper's `_id`. Rewrite the leaf `_ref`s and preserve the `_key`s. Where a list would then hold the keeper twice, remove the duplicate and report it.
3. Hide the product (do not delete it). Flag it `superseded-duplicate`, with `supersededBy` set to the keeper's `_id`.
4. In the same commit, add 301s from each of its locale slugs to the keeper's slug in the same locale:
   - EN `/private-tour-memphis-and-saqqara` → `/memphis-saqqara-citadel-khan-tour`
   - ES (its ES slug) → (the keeper's ES slug)
   - JA (its JA slug) → (the keeper's JA slug)
5. Repoint any existing redirect that targets one of its slugs straight at the keeper, so there are no chains.

### 4. Checks before the PR

1. **Redirects** (only if step 3 ran): regenerate the redirect map and run the tests. There must be zero cycles and zero chains, and each retired URL must return a single 301 to a 200 page.
2. **Sitemap and internal links:** remove the retired slugs from the sitemap. Update every internal link to them and list each one in the PR.
3. **Gate B:** render the keeper in EN, ES and JA, on desktop and mobile. Check that there is no tier and no age line, and that JA has no italics.
4. **Gate C:** keep the keeper's images. If the retired product has a better image, report it, but don't swap it without owner approval.
5. **Numeric gate:** ES and JA figures must equal EN, with the JA exceptions listed above.
6. **Migrations:** if a schema change is needed, write the migration file but do not run it. The owner applies migrations by hand.
7. **Review flag:** do not set `needsReview: false`.

### 5. In the PR description

List:
- the step 1 report and the overlap verdict (confirmed or not, and why)
- both `_id`s
- the rollback paths
- every repointed reference
- every redirect added
- anything you could not do, and why
