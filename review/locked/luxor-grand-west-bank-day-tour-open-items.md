# The Grand West Bank: open items

Source: the live page `/private-tour-full-day-to-grand-west-bank`, read 17 Nov 2026. Owner answers received 22 Nov 2026.

## Resolved (22 Nov), applied in all three languages

- **Tiers:** none.
- **What's included:** entrance to all six sites. That means the standard Valley of the Kings ticket (three tombs, chosen from those open on the day) and the standard Valley of the Queens ticket (the tombs open on the day).
- **Tutankhamun (KV62) and Nefertari:** extra tickets, not included. They now appear:
  - in the itinerary text
  - in a new "Optional extras, if you've chosen them" block
  - under "Not included"
  - in "Make it your own"

  Nefertari's daily cap is kept, worded as "if you add Nefertari's tomb".
- **Title:** Nefertari's tomb is now an extra, so it can't headline the product. The title is now "The Grand West Bank: Valley of the Kings, Valley of the Queens & Deir el-Medina, Private Day Tour". The URL is unchanged, so there's no redirect.
- **Age:** the minimum-age line is removed. The standard "Children under 12: 50% off" row is added.
- **Overlap:** settled. `/the-ultimate-luxor-day-tour` covers both banks; this one is the concentrated West Bank day. "Worth knowing" now says so, and points to the Ultimate tour for Karnak and Luxor Temple.
- **One phrase softened:** at Deir el-Medina, "painted by the best craftsmen in Egypt for themselves" now reads "painted for themselves by the same craftsmen who decorated the royal tombs".

## Corrections to the essay in "More about this day" (Gate A.3)

| # | Current text | Change to |
|---|---|---|
| 1 | The two tier paragraphs (essay and summary block) | "Entrance to all six sites, with three tombs in the Valley of the Kings and the standard Valley of the Queens ticket, and lunch at a local restaurant are included. The tombs of Tutankhamun and Nefertari are extra tickets." |
| 2 | "a licensed, English-speaking Egyptologist guide" | "a licensed Egyptologist guide in your language" |
| 3 | "It is widely considered the finest decorated tomb in Egypt." | "For us, it's the most beautiful painted tomb in Egypt." (Tier 2) |
| 4 | "the largest such complex ever built in Egypt" (Amenhotep III's temple) | "his great mortuary temple", as on the page |
| 5 | "This is a site without parallel in the ancient world" / "more than almost any other site in the ancient world" | Soften: "a site like few others" / "more than most sites in the ancient world" |
| 6 | "one of the most concentrated stretches of ancient funerary architecture on earth" | "a rare concentration of royal funerary architecture" |
| 7 | "the most underrated site on the West Bank" | Keep (Tier 2) |
| 8 | (new) Any line saying the Tutankhamun or Nefertari tomb is included | Extra ticket |

## Figures

- Valley of the Kings about 1550–1070 BC; more than sixty tombs
- Nefertari c. 1255 BC
- Colossi eighteen metres
- Hatshepsut about 1473–1458 BC
- Medinet Habu about 1180 BC
- Pickup 07:00; about 9 hours

## Numeric gate (22 Nov)

- **EN and ES:** the same figures.
- **JA:** the same figures, plus extra digits that come from Japanese conventions, not from new facts:
  - 1 (1名様)
  - 2 (ラムセス2世 "Ramses II")
  - 3 (アメンヘテプ3世 "Amenhotep III", トトメス3世 "Thutmose III", ラムセス3世 "Ramses III")
  - 18 (JA writes 18メートル for "eighteen metres")
  - 62 (KV62 also appears in EN)

## For Claude Code

- Remove the tiers and the minimum-age value, and add the children's row.
- Inclusions: entrance to the six sites, with the standard Valley of the Kings ticket (three tombs) and the standard Valley of the Queens ticket. Also lunch, water and the driver's tip.
- Optional extras: the Tutankhamun tomb ticket and the Nefertari tomb ticket. Set them up as priced add-ons. Their prices live in the data layer, not in the copy.
- Title, SEO title and og:title: the new title in each locale.
- Link "Ultimate Luxor day tour" in "Worth knowing" to `/the-ultimate-luxor-day-tour` in all three locales.
- Guide links: Valley of the Kings · Tomb of Tutankhamun · Valley of the Queens · Tomb of Nefertari · Colossi of Memnon · Temple of Hatshepsut · Medinet Habu · Deir el-Medina.
- Apply essay corrections 1–8 in all three locales.
- `needsReview: true`.
- URL unchanged; no redirect.
