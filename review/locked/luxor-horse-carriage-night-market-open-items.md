# Luxor by Horse Carriage: open items

Source: the live page `/private-tour-local-market-with-horse-carriage`, read 17 Nov 2026. Owner answers received 22 Nov 2026.

## Resolved (22 Nov), applied in all three languages

- **One product, no options.** The 1-, 2- and 4-hour categories are gone, and so are the tiers. It's now a single ride of about 2 hours.
- **The ride:** a wander through Luxor city by horse carriage, past the temples lit up at night, along the Nile, then through the local market in the carriage itself.
- **Title:** changed to match: "Luxor by Horse Carriage: The City at Night, the Nile & the Local Market". The URL is unchanged, so no redirect is needed.
- **Pickup:** from the guest's hotel, and back to it. Pickup zones and their prices come from Autoura at booking; the page doesn't mention them.
- **No guide:** an English-speaking assistant only. The page says this in the panel, in "Your evening", under "Not included" and in "Worth knowing". The ES and JA pages say the assistant speaks English; they don't promise Spanish or Japanese.
- **Minimum age 6, for safety.** This is an exception to rule 9, like the helicopter's operator minimum of 10. It appears in the panel and in "Worth knowing". The standard "Children under 12: 50% off" row stays.
- **No lunch, no café, no mango juice.** Shisha isn't included. The page says guests can try it at a market café if they want, at their own cost.
- **Closing line:** the mango juice is gone, since it's no longer part of the evening. New line: "An evening in a carriage, the temples lit gold, the Nile beside you and the market all around: that's the other Luxor, and it's easy to find."

## To confirm

1. **Two people per carriage.** I kept this rule, with the horse-welfare line, from the old page. Is it still how you run it?
2. **Water and the driver's tip:** kept as included, as on every other day tour. Correct for this ride?
3. **Children's 50%:** applied as standard. Confirm it holds for this product.

## Corrections to the essay in "More about this evening" (Gate A.3)

| # | Current text | Change to |
|---|---|---|
| 1 | "an English-speaking guide" (twice) | "an English-speaking assistant" (there's no guide on this product) |
| 2 | "a glass of mango juice going slowly cold" (closing) | Remove: no drinks are included |
| 3 | "and it costs almost nothing to find" (closing) | "and it's easy to find" |
| 4 | "a city that most visitors only pass through on the way to a tomb" | Keep |
| 5 | (new) Any mention of the 1-, 2- or 4-hour options, the café, or shisha as included | Remove; shisha "at your own cost, at a market café" |
| 6 | (new) Any "no minimum age" | "Minimum age 6, for safety in the carriage" |

## Figures

- About 2 hours
- Up to 2 people per carriage
- Minimum age 6

## Numeric gate (22 Nov)

- **EN and ES:** 2, 6, 12, 50.
- **JA:** the same figures, plus 1 (1名様).

## For Claude Code

- **Product structure:** remove the three categories (1 h, 2 h, 4 h) and any tiers. One product, about 2 hours.
- **Minimum age:** set to 6. This is an owner-approved exception to rule 9; record it in the product's notes. Keep the children's row.
- **Inclusions:**
  - private carriage (up to 2 per carriage) for about 2 hours
  - hotel pickup and return
  - English-speaking assistant
  - water
  - the driver's tip
- **Not included:**
  - a guide
  - food and drinks, including shisha
  - purchases at the market
- **Guide-language field:** set to "assistant, English only". Don't show the guide-language rule on this product.
- **Pickup zones:** from Autoura. Don't add zone copy to the page.
- **Title:** update the title, SEO title and og:title in each locale.
- **Essay:** apply corrections 1–6 in all three locales.
- **Review flag:** keep `needsReview: true`.
- **URL:** unchanged, so no redirect.
