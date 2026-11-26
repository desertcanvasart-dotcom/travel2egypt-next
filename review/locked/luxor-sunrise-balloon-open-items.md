# Luxor Hot-Air Balloon (merged): open items

Sources: the two live pages, read 17 Nov 2026:
- `/skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience` (the approved balloon)
- `/sunrise-hot-air-balloon-ride-over-luxors-ancient-landmarks` (the legacy second listing)

Owner answers received 22 Nov 2026.

## Resolved (22 Nov), applied in all three languages

- **The two listings are merged into one product.**
  - **Keeper:** the approved balloon page, `/skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience`.
  - **Retired:** the second listing, redirected to the keeper in all three languages (instructions below).
- **Taken over from the second listing:** tea or coffee after landing, and a flight certificate. Both are now in "Your day" and in "Included". Its "rest of the day free" line is in the panel. Nothing else was taken from it; it had no essay.
- **Two flights, two prices:** the sunrise flight and the after-sunrise flight. The page makes clear in five places that they are different trips with different prices, chosen at booking:
  - the title
  - the panel
  - "Why the day runs this way"
  - "Worth knowing"
  - "Make it your own"

  The prices themselves come from the booking engine and are not in the copy.
- **Title:** "Luxor Hot-Air Balloon over the West Bank: Sunrise or After-Sunrise Flight".
- **Minimum age 18:** removed under rule 9.
- **Lunch rule:** not applied (an early-morning flight).

## Still open (from the approved balloon's list; please answer when you can)

1. **Private or shared basket?** The keeper's slug says "private", but nothing on the page claims a private basket, and Luxor balloons usually carry 20 or more people. The page currently doesn't say either way. If it's private, I'll add "Type: Private basket" and put "Private" in the title. If it's shared, the slug's "private" is misleading and worth changing; I can give the coder a new slug and redirect.
2. **Children.** With the age line gone, should the standard "Children under 12: 50% off" row apply, or does the operator set its own child price (or a minimum age) through the booking engine? For now the page has no children's row.
3. **After-sunrise flight timing.** The page only says "a little later in the morning, once the sun is up". If there's a usual launch or pickup time for either flight, I'll add it.
4. **Tipping the pilot and ground crew:** expected, recommended or included? The page mentions only the driver.
5. **Duration:** "2–3 hours, about 30 minutes in the air" is used for both flights. Correct for the after-sunrise flight too?

## Corrections to the essay in "More about this day" (Gate A.3)

| # | Current text | Change to |
|---|---|---|
| 1 | "the Valley of the Kings, which is the tomb cluster cut into the south face of the cliff" | "the Valley of the Kings, the hidden valley behind the cliffs where the royal tombs are cut" |
| 2 | "a sharp green-to-yellow boundary that has shifted very little in three thousand years" | "a sharp green-to-yellow boundary" |
| 3 | "Then, in roughly this order as the light comes up:" | "Then, depending on the wind, as the light comes up:" |
| 4 | "The balloon is the only way most travellers will see it that way." | "From the air, most travellers see it that way for the first time." |
| 5 | "one of the most densely monumented landscapes in the world" | "a landscape dense with monuments" |
| 6 | "the cliff face above the Valley of the Kings catches the first light" (dek) | Keep |
| 7 | (new) Any line implying there's only a sunrise flight | Add: "There are two flights, sunrise and after-sunrise, each with its own price." |
| 8 | (new) Any minimum age | Remove |

## Figures

- 2–3 hours door to door; about 30 minutes in the air
- Flying height usually 300–500 m

## Numeric gate (22 Nov)

- **EN and ES:** 2, 3, 30, 300, 500.
- **JA:** the same figures, plus 1 from 1〜2分 ("a minute or two", written in words in EN).

## Instructions for Claude Code

Canon gates A–D apply. Do everything in one branch. The redirects go in the same commit as the retirement. Wherever a step says "report", report before writing.

### 1. Update the keeper

1. Find it by the EN slug `/skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience`. Report:
   - its `_id`
   - its slugs in all three locales
   - its fields: title, panel, price options, tiers, age field, inclusions
2. Write the rollback JSON before any change (Gate D).
3. Load the three files in this folder verbatim (Gate A pre-flight):
   - `luxor-sunrise-balloon.md`
   - `luxor-sunrise-balloon-es.md`
   - `luxor-sunrise-balloon-ja.md`
4. Set the price options. The product needs **two price options**:
   - "Sunrise flight"
   - "After-sunrise flight"

   Each option has its own price from the booking engine, and the guest chooses one on the booking form. The "From" price shows the lower of the two. These are flight choices, not the old tiers.
5. Set the inclusions:
   - the chosen flight
   - hotel or boat pickup and return
   - ferry crossings and transfers to the launch field
   - safety briefing
   - tea or coffee after landing
   - flight certificate
   - the driver's tip
6. Remove the minimum-age value (owner rule 9).
7. Update the title, the SEO title and the og:title in each locale.
8. Set the guide links: Temple of Hatshepsut · Colossi of Memnon · Valley of the Kings · Karnak · Luxor West Bank. These are context only.
9. Apply essay corrections 1–8 in all three locales.
10. Set `needsReview: true`.
11. Keep the slug unchanged for now. It may change once the owner answers the private-or-shared question.

### 2. Retire the second listing

1. Find it by the EN slug `/sunrise-hot-air-balloon-ride-over-luxors-ancient-landmarks`. Report:
   - its `_id`
   - its slugs in all three locales
   - every document that references it
2. Write its rollback JSON first.
3. Repoint every inbound reference to the keeper's `_id`:
   - rewrite the leaf `_ref`s and preserve the `_key`s
   - remove duplicates where a list would then hold the keeper twice, and report them
4. Hide the second listing; do not delete it. Flag it `superseded-duplicate`, with `supersededBy` set to the keeper's `_id`.
5. In the same commit, add 301s from each of its locale slugs to the keeper's slug in the same locale:
   - EN: `/sunrise-hot-air-balloon-ride-over-luxors-ancient-landmarks` → `/skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience`
   - ES and JA: its slugs → the keeper's ES and JA slugs
6. Repoint any existing redirect that targets one of its slugs straight at the keeper. No chains.

### 3. Checks before the PR

1. Redirects:
   - Regenerate the redirect map and run the tests.
   - There must be zero cycles and zero chains.
   - Each of the three retired URLs must return a single 301 to a 200 page.
2. Sitemap: the retired slugs are out; the keeper is unchanged.
3. Internal links: search for the retired slugs in all three locales. Update each one and list it in the PR.
4. Booking form: both flight options appear, with their own prices, and the guest must choose one. Report how the "From" price is calculated.
5. Gate B: render the keeper in EN, ES and JA, on desktop and mobile. Check that:
   - the two-flight line shows in the panel
   - there is no age line
   - JA has no italics
6. Gate C: keep the keeper's images. If the second listing has a better hero image, report it, but don't swap it without the owner's approval.
7. Numeric gate: the ES and JA figures must equal EN.
8. If a schema change is needed for the two flight options, write the migration file but do not run it. The owner applies migrations by hand.
9. Do not set `needsReview: false`.

### 4. In the PR description

List:
- both `_id`s
- the rollback file paths
- every repointed reference
- every redirect added
- how the two flight options are wired
- anything you could not do, and why
