# Two Days from Luxor to Abu Simbel: open items

## Resolved (17 Nov), applied to the draft

- **Duplicate:** the main URL is the shorter one, `/aswan-and-abu-simbel-from-luxor`. This content goes there, and `/2-day-egypt-s-majestic-trio-aswan-and-abu-simbel-from-luxor` gets a 301 to it (see the instructions for Claude Code below).
- **Meals included:** lunch in Aswan and dinner at the hotel on Day 1; breakfast at the hotel and lunch in Abu Simbel on Day 2.
- **The trip ends in Aswan.** The return to Luxor isn’t included; it’s arranged on request, at extra cost. It now appears under "Not included" and "Make it your own", and in "Worth knowing".
- **Optional afternoon** (felucca, Nubian village): extra.
- **Convoy:** removed completely; it was old information. The opening no longer mentions the 3 a.m. convoy, "six hours each way" or "ninety minutes at the temples".
- **Day 2 departure:** around 06:00, so it’s no longer described as "well before dawn".
- **Luxor pickup:** included, from the hotel, and shown in the panel and the inclusions.
- **The corrections to the essay passages** (approved; required under canon Gate A.3):
  1. "Ashort private journey" → "A short private journey"
  2. The Abu Simbel blocks: one figure across the site (807 for the Great Temple; over 1,000 for both)
  3. "and a dozen other temples" → "and some twenty other monuments"
  4. Philae: flooded by the *old* Aswan Dam (1902) and threatened by the High Dam, not "the High Dam’s flooding of the first cataract"
  5. Superlatives in the essay are reframed as our own judgement or softened ("among the…")
  6. Any remaining mention of the convoy is removed from the essay, matching the page.

## Small points, not blockers

1. **Drop-off in Aswan:** I’ve written that the trip ends at the Aswan hotel, the railway station or the airport, all included. Correct me if the station or airport costs extra.
2. **Pickup time in Luxor:** not given, so the page shows none. If there’s a usual time, it goes in the panel.
3. **Closing line:** kept, as per the standing rule. "Not remembering it" is a judgement about other travellers. Keep it, or soften it to "…and come back the same night with little time to take it in"?

## Instructions for Claude Code: merging the duplicate (canon Gate D)

1. **Keeper:** the Sanity document at `/aswan-and-abu-simbel-from-luxor`. It receives this locked copy in EN, ES and JA.
2. **Before any write:** write the rollback JSON for both documents.
3. Repoint every inbound reference (hubs, related tours, journeys, nav) from the long-URL document to the keeper. Rewrite the leaf `_ref`s and preserve the `_key`s.
4. Hide the long-URL document, and flag it `superseded-duplicate` with `supersededBy` pointing to the keeper.
5. Add a 301 from `/2-day-egypt-s-majestic-trio-aswan-and-abu-simbel-from-luxor` to `/aswan-and-abu-simbel-from-luxor`, plus the ES and JA slug equivalents, in the same commit. Then regenerate the redirect map and run the redirect tests: zero cycles, and every target returns 200.
6. Report both documents’ current field values (title, summary, metaDescription, hero) before writing, so nothing useful from the long page is lost.

## Figures to source before locking

- Philae moved 1972–80
- the Unfinished Obelisk: 42 m
- the High Dam completed in 1970; about 100,000 Nubians displaced
- Abu Simbel: 13th century BC; seated figures over 20 m; moved 1964–68; lifted 65 m; the sun festival around 22 February and 22 October
- Aswan → Abu Simbel: about three hours’ drive

## Guide links to match

Philae · Unfinished Obelisk · Aswan High Dam · Elephantine Island · Nubian village · Abu Simbel.

## Next

The ES (tú) and JA locked copy once you’ve checked this EN.

## ES and JA locked copy (17 Nov)

Files: `2-day-aswan-and-abu-simbel-from-luxor-es.md`, `2-day-aswan-and-abu-simbel-from-luxor-ja.md`.

- **Numeric gate: passed.** Every figure in ES and JA matches EN. ES writes the 13th century in Roman numerals («siglo XIII»), as Spanish normally does. JA writes 100,000 as 10万, and "three signature stops" and "four seated figures" as 3か所 and 4体. The meaning is the same.
- **If you soften the closing line** (small point 3), it changes in all three files.
- **ES** uses tú. **JA:** the closing line has no italics.
- **Native-speaker review:** needed before going live (canon Part V).
