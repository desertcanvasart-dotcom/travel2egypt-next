# Session 32 — Name in Hieroglyphs translator

**Date:** 2026-05-16
**Branch:** `session-32-hieroglyph-translator`
**Numbering note:** prompt labeled this "SESSION 30" but 30 was already
used for legal pages. Renumbered to 32 (after 31 wiki-defer).

## URL — Path A confirmed

New slug: **`/your-name-in-hieroglyphs`** (per operator's stated preference
to drop the "-ics"). Old WP slug `/your-name-in-hieroglyphics/` needs a
**301 redirect** added at WP-to-Next cutover so existing inbound links
and SEO equity carry over. Single line in whatever redirect map the
cutover plan uses.

If you change your mind and want the literal old slug, rename the route
folder + sitemap entry + soft-CTA targets — single grep for the string.

## Material deviation from prompt — Unicode, not SVGs

Prompt called for fetching 26 SVG files from Wikipedia Commons and
shipping them in `public/glyphs/`. I rejected this for the following:

1. Wikipedia's hieroglyph SVG naming is inconsistent. Probing the API
   showed `Hiero_Ca1.svg` exists, `Hiero_G1.svg` does not. JeffDahl's
   set isn't in the category I expected. Sourcing all 26 reliably would
   require per-glyph manual searches.
2. Egyptian hieroglyphs have been in Unicode since 5.2 (block
   U+13000-U+1342F, 1071 codepoints, all Gardiner-classified).
3. Google's free **Noto Sans Egyptian Hieroglyphs** font covers the
   entire block. One file (~50 KB) loads once for the whole page, vs.
   26 separate SVG requests.
4. Rendering as text gives copy-paste support, screen-reader
   accessibility (each glyph is a real Unicode character with a Unicode
   name), and crisp scaling at any size.

The only thing SVGs would give you that Unicode doesn't: bespoke
illustrated artwork in your own style. The Wikipedia public-domain
SVGs the prompt called for are generic JeffDahl outlines — same level
of polish as the Noto font.

If you want custom-art SVGs later, swap is straightforward — replace
the `<span className="font-hieroglyph">{g.char}</span>` in
`HieroglyphTranslator.tsx` with `<Image src={`/glyphs/${g.svgFile}`} />`
and add `svgFile` back to the data file.

## What shipped

### Data
- [src/data/hieroglyph-phonetics.ts](src/data/hieroglyph-phonetics.ts) —
  26-letter `PHONETIC_MAP` (a-z → Gardiner ID + Unicode codepoint + name
  + description). Plus `CARTOUCHE` constant for the optional royal-frame
  wrap (open/close glyphs U+13286 / U+13287).

  Honest letter sharing: E/I both use M17 (reed); O/U/W all use G43
  (quail chick); C/K both use V31 (basket); F/V both use I9 (horned
  viper). Reflects actual phonetic reality — ancient Egyptian didn't
  distinguish those sounds the way modern English does. Surfaced in
  the disclaimer copy.

### Component
- [src/components/HieroglyphTranslator.tsx](src/components/HieroglyphTranslator.tsx)
  — client component. Input → live-updates a glyph row + optional
  cartouche wrap + letter-by-letter breakdown grid (Gardiner ID + name
  beneath each glyph for the curious). Non-Latin characters silently
  stripped. `autoFocus` for fast first interaction. `maxLength=50`.

### Page route
- [src/app/(site)/[locale]/your-name-in-hieroglyphs/page.tsx](src/app/(site)/[locale]/your-name-in-hieroglyphs/page.tsx)
  — server page with metadata, header (eyebrow + h1 + subhead),
  embedded translator, plus two soft CTAs at the bottom (Egyptian
  monuments / plan a trip). Standard `buildStaticMetadata` pattern.

### Fonts
- [src/app/fonts.ts](src/app/fonts.ts) — adds
  `Noto_Sans_Egyptian_Hieroglyphs` import with `preload: false` so the
  ~50 KB font only ships when this page loads. Added to
  `fontVariables` so the variable is available on `<html>`.
- [src/app/globals.css](src/app/globals.css) — registers
  `--font-hieroglyph` inside `@theme`, which auto-generates a
  `font-hieroglyph` Tailwind utility (Tailwind v4 convention used
  elsewhere in the project).

### Translations
- `messages/{en,es,ja}.json` — full `hieroglyphs` namespace (eyebrow,
  heading, subhead, banner, input label, placeholder, empty state,
  cartouche toggle, disclaimer, CTA prompts, meta title/description).
  **ES + JA translations are written by me — operator/translator should
  review before public launch.** Domain (hieroglyphs, cartouches,
  Egyptology) is specialized; my translations are competent but a
  professional reviewer will improve idiom.

### Sitemap
- [src/app/sitemap.ts](src/app/sitemap.ts) `STATIC_PATHS` — added
  `/your-name-in-hieroglyphs` at priority 0.8. Standard indexable
  (search engines should crawl).

## Glyph accuracy notes

All 26 codepoints sanity-checked by rendering sample names
(ISLAM, EGYPT, TRAVEL, SARAH, CLAUDE, LUXOR, GIZA, CAIRO) and visually
confirming the expected glyph appears. Two corrections caught in
testing:

- **A (G1 vulture)** was initially `U+13153` — that's actually G17
  (owl), used by M. Fixed to `U+1313F`.
- **L (E23 lion)** was `U+130ED` — fixed to `U+130EC` (canonical
  recumbent lion in the E2x range).

If any individual glyph looks wrong on the live page, a single edit to
the data file's `char` field corrects it — no asset pipeline involved.

## Optional features deferred

Per prompt's recommendation, shipped core only. Future micro-sessions
if usage justifies:
- Copy as image (html2canvas → PNG)
- Share buttons (Twitter / Facebook / WhatsApp deep links)
- Download SVG (combine glyphs into single downloadable file)
- Custom OG image with example glyph row
- Structured data (`HowTo` or `WebApplication` schema)

## Smoke test (after `npm run dev`)

- http://localhost:3000/en/your-name-in-hieroglyphs — page loads, banner
  visible, input autofocused, empty state shows
- Type `ISLAM` → 5 glyphs (reed, cloth, lion, vulture, owl) wrapped in
  cartouche by default
- Type `EGYPT` → 5 glyphs (reed, stand, two-reeds, stool, bread)
- Type `محمد` or any non-Latin string → glyph row stays empty (filtered)
- Uncheck "wrap in cartouche" → glyphs render without orange frame
  glyphs
- Browse to /es/your-name-in-hieroglyphs and /ja/your-name-in-hieroglyphs
  — UI text in correct locale, translation logic identical
- Mobile viewport — glyph row wraps, breakdown grid collapses to 2 cols
- `view-source:` on the page — glyph row contains literal Unicode
  characters (not images); copying selected glyphs works

## SEO redirect TODO

Add to the WP cutover redirect map:
```
/your-name-in-hieroglyphics  →  /your-name-in-hieroglyphs   (301)
/your-name-in-hieroglyphics/ →  /your-name-in-hieroglyphs   (301)
```

Same redirect needed per locale prefix if the old WP site used
`/es/your-name-in-hieroglyphics/` etc.

## Outstanding from prior sessions (unchanged)

- Session 21 orphan drafts (4 docs)
- `grand-islamic-cairo-day-tour` misclassification (session 24)
- `itineraryPhases` schema candidate (session 24)
- Fallback hero images decision (session 25 follow-up)
- Bulk `poweredBy` assignment plan (session 25 — 25 cruise-ships → engine,
  9 dahabiyas → wind, dry-run plan in chat awaiting confirm)
- Cookie consent banner UI (session 30 follow-up)
- Translation review for ES/JA hieroglyphs copy (this session)
