# Luxor by Air from Cairo (2 days): open items

Source: the live page `/02-day-luxor-tour-by-plane-from-cairo`, read 17 Nov 2026.

## Resolved (17 Nov), applied in all three languages

- **Duplicate:** the main URL is `/02-day-luxor-tour-by-plane-from-cairo`. `/luxor-2-day-tour-by-plane-from-cairo` is retired with a 301 to it (see the instructions for Claude Code below).
- **West Bank:** the Valley of the Kings with three standard tombs, the Temple of Hatshepsut and the Colossi of Memnon. The reseller wording ("depending on your specific booking", "varies by operator", "verify… before booking") is gone.
- **Meals:** lunch at a local restaurant on both days, and breakfast at the hotel on Day 2. Nothing else.
- **Hotel:** the Jolie Ville Kings Island Resort, Luxor, replacing the Karnak Luxor Hotel. The old line "close to the East Bank sites" is removed, because Kings Island isn’t next to them.
- **The panel heading** is "The shape of the journey", not "…of the day".
- **The closing concierge note** is added at the end of the page.
- **The corrections to the essay passages** (approved; required under canon Gate A.3):
  1. Karnak’s superlatives ("perhaps no city on earth", "the largest religious complex ever constructed", "the largest religious site ever built") are reduced to one Tier 1 wording, used once.
  2. "accumulated across roughly thirty dynasties" → "across some 1,500 years"
  3. The reseller language is removed.
  4. Kept as they are: Luxor Temple’s three and a half thousand years of worship, and "the correct choice for a short Luxor trip".
- **Figures confirmed by you** (17 Nov):
  - Karnak about 100 ha, about 1,500 years, 134 columns, 21 m
  - the White Chapel c. 1950 BC
  - Hatshepsut’s obelisk 29.5 m
  - Luxor Temple c. 1390 BC
  - the Paris obelisk since 1836
  - the Avenue of Sphinxes reopened in November 2021
  - Carter 1922
  - the Colossi c. 1350 BC
- **A correction of my own:** the old "Why this route works" said the road is "six hours each way". Cairo to Luxor by road takes much longer, so it now says "a long day on the road each way", with no figure.

## Small points: resolved (17 Nov)

1. **Hotel name confirmed:** "Jolie Ville Kings Island Resort". The JA rendering ジョリー・ヴィル・キングス・アイランド・リゾート stands.
2. **Karnak’s Tier 1 wording, approved:** "Karnak is one of the largest religious complexes ever built." Add it to `docs/established-superlatives.md` with its source. It’s the single wording the essay uses, once, in place of the three old superlatives.
   - ES: «Karnak es uno de los mayores complejos religiosos jamás construidos.»
   - JA: 「カルナック神殿は、史上最大級の宗教建築群のひとつです。」
3. **Concierge note approved** as written (EN and ES; not shown in JA).

**This tour’s EN, ES and JA copy is now final.** Before going live it still needs the native-speaker review and the duplicate merge below.

## Instructions for Claude Code: merging the duplicate (canon Gate D)

1. **Keeper:** the Sanity document at `/02-day-luxor-tour-by-plane-from-cairo`. It receives this locked copy in EN, ES and JA.
2. **Before any write:** write the rollback JSON for both documents.
3. Repoint every inbound reference (hubs, related tours, journeys, nav) from the `/luxor-2-day-tour-by-plane-from-cairo` document to the keeper. Rewrite the leaf `_ref`s and preserve the `_key`s.
4. Hide the retired document, and flag it `superseded-duplicate` with `supersededBy` pointing to the keeper.
5. Add a 301 from `/luxor-2-day-tour-by-plane-from-cairo` to `/02-day-luxor-tour-by-plane-from-cairo`, plus the ES and JA slug equivalents, in the same commit. Regenerate the redirect map and run the tests: zero cycles, and every target returns 200.
6. Report both documents’ current fields (title, summary, metaDescription, hero) before writing.

## Guide links to match

Karnak · Luxor Temple · Avenue of Sphinxes · Valley of the Kings · Hatshepsut · Colossi of Memnon.

## ES and JA locked copy (17 Nov)

- **Numeric gate: passed.** Every figure in ES and JA matches EN. JA writes "three tombs" and "three kilometres" as 3基 and 約3キロ.
- **The concierge note** appears in EN and ES only. **JA leaves it out**, following the standing rule that JA hides concierge content, since the concierge supports EN and ES only.
- **Hotel name in JA:** ジョリー・ヴィル・キングス・アイランド・リゾート. It changes if you correct the EN name (small point 1).
- **ES** uses tú. **JA:** the closing line has no italics.
- **Native-speaker review:** needed before going live (canon Part V).

## Review: changes applied (17 Nov, evening), in EN, ES and JA

Decided by you:
- **Return transfer in Cairo is included.** Day 2 now ends with a driver taking the client to their Cairo hotel. It's on the Day 2 Travel line and in Included ("Pickup from your Cairo hotel, and the transfer back to it on Day 2").
- **The White Chapel is now an optional extra.** It's out of Day 1's programme and "The day" line, and is now listed under "Optional on this day" and in "Not included" (extra ticket, Karnak Open-Air Museum).

Fixes:
- **"The evening visit to Luxor Temple"** is added to Not included (extra).
- **Closing line, EN:** "Luxor can’t be seen properly in half a day. Two days, from Karnak to the West Bank tombs, is the honest minimum for what it holds." ES: «Luxor no se puede ver bien en medio día…». JA: unchanged.
- **"Flying keeps the day"** → "Flying saves the day for the sites". ES: "Volar te ahorra el día" → "En avión no pierdes el día".
- **Make it your own:** "set the second day around them" → "build the programme around them" (EN, ES), so it doesn't repeat the concierge note. JA is unchanged, because it has no concierge note.
- **ES hotel:** "en la isla Kings Island" → "en Kings Island, una isla del Nilo en Luxor".

Left for the native-speaker reviewer:
- **ES "empezáis"** is Spain's vosotros, used alongside tú. Keep it for Spain, or use "empiezan" for Latin America.

Numeric gate: no figures changed. The White Chapel’s c. 1950 BC date was never in the page text.
