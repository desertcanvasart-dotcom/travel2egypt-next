# Luxor to Hurghada transfer: open items

Source: the live page `/private-tour-transfer-from-luxor-to-hurghada-by-bus`, read 17 Nov 2026. Owner answers received 22 Nov 2026.

## Resolved (22 Nov), applied in all three languages

- **Priced per car, not per person.**
  - The panel now reads "{lowest per-car price} per car, not per person".
  - "Price depends on group size" is gone.
  - "Included" says the price is per car.
  - There's no children's row, because children don't change a per-car price.
- **Drop-off area:** guests choose their exact area in or around Hurghada at booking, using the Autoura zone function. The page says "your hotel or resort in the Hurghada area; you choose your exact area when you book", and names no specific resorts.
- **URL:** kept (`…-by-bus`). The copy says "car" throughout and never "bus". No redirect.
- **Lunch rule:** not applied, because this is a transfer.
- **One phrase softened:** the closing line "the only way to feel its scale" now reads "how you feel its scale".

## Corrections to the essay in "More about this day" (Gate A.3)

| # | Current text | Change to |
|---|---|---|
| 1 | "the road south-west out of it" | "the road north out of it" (the route heads north via Qena, then east across the desert) |
| 2 | "some of the densest concentrations of ancient monuments on earth" | Keep (Tier 2) |
| 3 | "The Luxor–Hurghada corridor is one of Egypt's most-travelled tourist routes" | Keep |
| 4 | "the only option that gives you departure control… crossing the country under your own terms" | Keep |
| 5 | (new) Any per-person price wording | "per car" |

## Figures

- About 290 km, about 4 hours
- Over 35°C from April to October

## Numeric gate (22 Nov)

- **EN and ES:** 4, 35, 290.
- **JA:** the same figures, plus 1 (1台, "per car") and 10 (4月から10月, "April to October").

## For Claude Code

- **Pricing model:** per car. Change the product's price basis from per person to per car, and label the "From" price "per car". Remove any per-person tiers and the children's discount for this product.
- **Drop-off zones:** from Autoura (the Hurghada-area zones). Don't add zone names to the page.
- **Inclusions:** private car and driver from the Luxor hotel to the Hurghada-area hotel, water, the driver's tip.
- **Guide links:** Luxor · Hurghada · Eastern Desert · Red Sea.
- **Essay:** apply corrections 1–5 in all three locales.
- **Review:** `needsReview: true`.
- **URL:** unchanged; no redirect.
