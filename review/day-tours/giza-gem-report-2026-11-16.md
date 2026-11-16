# Giza Pyramids & GEM in the day-tour format — report (2026-11-16)

Product: `wp-page-239597` · https://travel2egypt.org/pyramids-of-giza-and-grand-egyptian-museum

**Status: code in the PR; content NOT written to production yet.** The import is
`scripts/day-tour-format/import-giza-gem-2026-11-16.mjs` (data in `giza-gem.data.mjs`,
verbatim from the owner-approved reference, final 16 Nov). It writes only with `--apply`.
Screenshots come from a local render: the page query evaluated (groq-js) over the
patched document; nothing written.

## Screenshots (`screens-2026-11-16/`)

| | 1440 | 375 |
|---|---|---|
| Panel (Type, Duration, From, Children, Pickup, Back, Lunch, Your guide speaks) | `giza-en-1440-panel.png` | `giza-en-375-panel.png` |
| Your day (timeline) | `giza-en-1440-timeline.png` | `giza-en-375-timeline.png` |
| Right column: Your day at a glance (desktop only, ≥1024px) | `giza-en-1440-right-column.png` | – |
| Included and extra | `giza-en-1440-included.png` | `giza-en-375-included.png` |

## Checks on the local render (EN)

- Section order: opening · Why the day runs this way · Your day · More about this day · Included and extra · Is this day for you? · Make it yours (Check this date / WhatsApp) · closing line · end block, more days from Cairo, guide, FAQ.
- Panel rows exactly as the reference; From reads "$120 per person · price depends on group size".
- Timeline: 08:00, 09:00 (with "Inside a pyramid (included)…"), 10:30, 11:15, 12:30 extras (Khufu; camel with the approved welfare line), 13:15 lunch, 14:30 GEM, 17:00–18:00 back.
- "Your day at a glance": 08:00 Pickup → 09:00 Giza Plateau → 10:30 Panorama → 11:15 Sphinx & Valley Temple → 13:15 Lunch → 14:30 Grand Egyptian Museum → 17:00–18:00 Back.
- "More about this day" holds the whole EN essay unchanged (collapsed by default, in the HTML), except "Both, in the same day, is the right answer.", which is the closing line, so it isn't shown twice.
- Included and extra: exactly the reference's 9 + 5 lines.

## Owner-rule rows on other day tours (live once deployed, no data needed)

- **Cairo and Giza day tours** (city = Cairo or Giza), EN/ES/JA:
  - Children under 12: 50% off.
  - Pickup: the Cairo/Giza zone line. The time appears only once the tour's day-tour intro is approved.
  - Your guide speaks: English / español / 日本語.
- **Luxor, Aswan and Alexandria-based tours:** no rows yet. Alexandria tours departing from Cairo are filed under Cairo, so they do get the rows.

ES and JA Giza pages: old layout; only the owner-rule rows change. Checked locally.

## Price tiers (decision 2026-11-16)

- Not built: `getFromPrice`, the per-group-size tiers and the Check-a-date estimate. That prompt isn't implemented anywhere, and this tour has no tiers in Sanity.
- The From row uses today's "from" price plus "price depends on group size", and the Children row shows "50% off".
- Acceptance item 5 (the estimate in Check a date) waits for the tier prompt.

## Guide-link matches (site → URL)

| Stop | Site | Page |
|---|---|---|
| 09:00 | Great Pyramid of Khufu | /guide/giza/the-great-pyramid-of-khufu |
| 09:00 | Pyramid of Khafre | /guide/giza/pyramid-of-khafre |
| 09:00 | Pyramid of Menkaure | /guide/giza/pyramid-of-menkaure |
| 11:15 | Great Sphinx | /guide/giza/the-great-sphinx |

**Unmatched (shown without a link):**
- **Valley Temple of Khafre:** no page.
- **Grand Egyptian Museum:** no guide/wiki/travel-tips page. Blog articles exist: /blog/the-grand-egyptian-museum and /blog/the-grand-egyptian-museum-2024-insider-guide. Owner to say whether to link a blog article.
- **Tutankhamun galleries:** no page. Blog candidate: /blog/where-is-tutankhamun-now.

## Product data the import changes (EN only)

- dayTourIntro + dayTimeline (3 periods), approved.
- inclusions: the 4 EN rows (in review) → the reference's 9, approved.
- exclusions: none → the reference's 5, approved.
- customisationOptions: the 4 EN rows (in review) → the reference's 3, approved.
- ES/JA untouched.
