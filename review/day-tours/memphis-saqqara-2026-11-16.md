# Giza, Memphis & Saqqara in the day-tour format (2026-11-16)

Product: `tour.private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara` ·
https://travel2egypt.org/private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara

**Status: prepared, NOT published.**
- The EN locked file is in `review/locked/giza-memphis-saqqara-day-tour.md`.
- The import is `scripts/day-tour-format/import-giza-memphis-saqqara-2026-11-16.mjs` (data in `giza-memphis-saqqara.data.mjs`).
- It refuses `--apply` until the locked ES and JA files exist (canon VI.3).

## Gates run (dry run)

- **Verbatim pre-flight:** all 67 strings match the locked EN file.
- **Content lint:** 0 aborts, **7 superlative flags** for owner review:
  - Memphis "the first capital of a unified Egypt"
  - Khufu "the tallest man-made structure on earth for nearly four thousand years"
  - the Sphinx "the largest monolithic statue in the world"
  - Djoser "Egypt's first pyramid, and the oldest large-scale cut-stone building in the world"
  - three order phrases that aren't claims: "Djoser's first attempt", "Djoser's first", "Saqqara and Memphis first"
- **Local render** (page query evaluated over the patched doc; nothing written):
  - The panel matches the locked file: "Full day · about 8½ hours", "08:30 from your hotel…", "around 17:00", "included, at a local restaurant", "English".
  - 11 stops in order; 7 guide links, all 200.
  - The closing line is shown once.
  - Screenshots are in `memphis-screens-2026-11-16/`.

## Guide links

| Site | Page |
|---|---|
| Great Pyramid of Khufu | /guide/giza/the-great-pyramid-of-khufu |
| Pyramid of Khafre | /guide/giza/pyramid-of-khafre |
| Pyramid of Menkaure | /guide/giza/pyramid-of-menkaure |
| Great Sphinx | /guide/giza/the-great-sphinx |
| Memphis open-air museum | /guide/giza/memphis-mit-rahina |
| Saqqara necropolis | /guide/giza/the-saqqara-necropolis |
| Imhotep Museum | /guide/giza/imhotep-museum-at-saqqara |

**Unmatched:** Valley Temple of Khafre, Colossus of Ramses II, Alabaster Sphinx, Step Pyramid of Djoser (no guide, wiki or travel-tips page).

## Essay vs the locked file (Gate A.3): exact deltas, NOT yet corrected

The locked file says "the full essay, with the three approved corrections", but the corrected text isn't in the file.

| Essay block (EN) | Says now | Locked file |
|---|---|---|
| …17 | Menkaure "is the one you enter" | Inside Khafre **or** Menkaure, included, subject to site rules |
| …1f, …49 | "there is a camel ride…" / "The camel ride is included but easy to skip on the day." | Camel ride: extra cost |
| …33 | The painted mastaba tombs as part of the visit | Mastabas of Mereruka, Kagemni and Ti: optional extra, extra ticket |
| …11 | Pyramids "built across roughly seventy years — from around 2560 to 2490 BC" | "within about eighty years of each other, around 2500 BC" |

The ES and JA essays need the same corrections.

## Field changes in the same publish

- `durationHours` 9 → 8.5 (the locked panel says "about 8½ hours"; the page renders ½).
- `durationLabel` is still "Full day · ~9–10 hrs" in EN (and ES/JA). Its hour range changes with the locked ES/JA files. The page shows the band ("Full day") plus the hours field.

## Needed from the owner before publishing

1. Locked ES and JA files for this tour.
2. The corrected essay (EN/ES/JA), the three approved corrections plus the "seventy years" figure.
3. A ruling on the 7 superlative flags: add facts to `docs/established-superlatives.md`, or approve them.
4. Optional: short labels for "Your day at a glance". It currently uses the stop titles, because the locked file has no short labels.
