/**
 * Travel2Egypt fonts — brand spec (session 5.5, body face swapped session 13).
 *
 * Per migration/.brand-inputs/travel2egypt-brand-inputs.md Section 2:
 *   - Display (EN/ES): Cormorant Garamond — 400, 500, 600 (+ italic 400/500)
 *   - Body (EN/ES):    Source Serif 4 — 300, 400, 500, 600
 *   - Display (JA):    Noto Serif JP — 400, 500
 *   - Body (JA):       Noto Sans JP — 400, 500
 *
 * JA fonts are preload: false. They only ship when html[lang=ja] renders.
 * EN/ES locale uses Cormorant + Source Serif 4 only.
 *
 * Subsets are latin ONLY (perf session 2026-08-18): latin-ext was preloading
 * a second woff2 per face (~24 files, ~490KB critical-path total) for
 * Polish/Czech/Turkish-class diacritics the site never renders — Spanish is
 * fully covered by the latin subset (Latin-1 Supplement), Japanese by the
 * Noto JP faces. Re-add 'latin-ext' only if content gains such glyphs; the
 * serif fallback renders any stray one legibly in the meantime.
 */

import {
  Cormorant_Garamond,
  Source_Serif_4,
  Newsreader,
  DM_Sans,
  Noto_Serif_JP,
  Noto_Sans_JP,
  Noto_Sans_Egyptian_Hieroglyphs,
  Noto_Naskh_Arabic,
} from 'next/font/google';

export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

/**
 * Tour-system reference faces (journey-1/2/3 approved designs):
 *   - Reading/body → Newsreader (300/400/500 + italic 400)
 *   - UI/labels    → DM Sans (400/500/600)
 * Loaded site-wide because the canonical chrome (nav/footer/concierge)
 * reconciled to those designs uses them. Exact per spec — no substitution.
 */
export const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
});

export const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-source-serif-4',
  display: 'swap',
});

/**
 * Non-Latin faces (Noto JP ×2, Egyptian Hieroglyphs, Naskh Arabic) moved OUT
 * of this module in the 2026-08-18 perf session — see src/app/fonts-ja.ts and
 * the two specialty pages. Reason: next/font emits each face's @font-face CSS
 * into every route that (transitively) imports its module, and the two CJK
 * faces alone are ~126KB of render-blocking CSS (~100 unicode-range slices
 * each) that every EN/ES page was shipping without ever using the font.
 * JP loads client-side for ja only (JaFontGate in the locale layout);
 * Hieroglyphs/Naskh are page-scoped imports on their single pages.
 */

export const fontVariables = [
  cormorant.variable,
  sourceSerif4.variable,
  newsreader.variable,
  dmSans.variable,
].join(' ');
