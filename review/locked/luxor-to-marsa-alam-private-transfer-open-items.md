# Luxor to Marsa Alam transfer: open items

Source: the live page `/private-tour-transfer-from-luxor-to-marsa-alam-by-car`, read 17 Nov 2026. Owner answers received 22 Nov 2026.

## Resolved (22 Nov), applied in all three languages

- **Priced per car, not per person.**
  - The panel now reads "{lowest per-car price} per car, not per person".
  - "Price depends on group size" is gone.
  - "Included" says the price is per car.
  - There's no children's row, because children don't change a per-car price.
- **Drop-off area:** guests choose their exact area in or around Marsa Alam at booking, using the Autoura zone function. The page says "your hotel or resort in the Marsa Alam area; you choose your exact area when you book", and names no specific resorts.
- **Lunch rule:** not applied, because this is a transfer.
- **URL:** unchanged, so no redirect.

## Still open: please check with operations

1. **Which road, and how long?** The page keeps the live route description: about 8 hours with rest stops, down through the Red Sea Hills to the coast, then south. The usual route is the shorter desert road from Edfu straight to Marsa Alam, often around 4–5 hours. If your drivers take the Edfu road, I'll change:
   - the duration
   - "Why the day runs this way"
   - the afternoon section
   - "Worth knowing" ("eight hours in a car")

   The price may change too. The title doesn't name a road, so it stays either way.
2. **Driver's language.** The page says "your driver speaks enough English for the practicalities". The ES and JA pages say the same, adjusted for each language: the driver speaks English, not Spanish or Japanese.

## Corrections to the essay in "More about this day" (Gate A.3)

| # | Current text | Change to |
|---|---|---|
| 1 | "Atransfer is not a tour" | "A transfer is not a tour" |
| 2 | "The first stretch heads east out of Luxor… This is the Qena–Safaga corridor" | After open item 1 |
| 3 | "The exact departure time will be confirmed by your operator" | "…confirmed with your booking" |
| 4 | "without the indignities of a domestic flight" | "without a domestic flight" |
| 5 | "Marsa Alam… roughly 200 kilometres south of Hurghada" | Remove the figure until sourced (closer to 270 km by road) |
| 6 | (new) Any per-person price wording | "per car" |

## Figures

- About 8 hours with rest stops (pending open item 1)

## Numeric gate (22 Nov)

- **EN and ES:** 8.
- **JA:** 8, plus 1 (1台 "per car", 1日 "one day"), and 4 and 10 (4月から10月, "April to October", which EN writes in words).

## For Claude Code

- **Pricing:** change the price basis from per person to per car, and label the "From" price "per car". Remove any per-person tiers and the children's discount for this product.
- **Drop-off zones:** these come from Autoura (the Marsa Alam-area zones). Don't add zone names to the page.
- **Inclusions:** private car and driver from the Luxor hotel to the Marsa Alam-area hotel, rest stops on request, water and the driver's tip.
- **Guide links:** Luxor · Marsa Alam · Eastern Desert · Red Sea.
- **Essay:** apply corrections 1 and 3–6 in all three locales. Hold correction 2 until the owner confirms the road.
- **Review:** `needsReview: true`.
- **URL:** unchanged; no redirect.
