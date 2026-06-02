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
 */

import {
  Cormorant_Garamond,
  Source_Serif_4,
  Newsreader,
  DM_Sans,
  Noto_Serif_JP,
  Noto_Sans_JP,
  Noto_Sans_Egyptian_Hieroglyphs,
} from 'next/font/google';

export const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
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
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
});

export const dmSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const sourceSerif4 = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-source-serif-4',
  display: 'swap',
});

export const notoSerifJp = Noto_Serif_JP({
  weight: ['400', '500'],
  variable: '--font-noto-serif-jp',
  display: 'swap',
  preload: false,
});

export const notoSansJp = Noto_Sans_JP({
  weight: ['400', '500'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
  preload: false,
});

/**
 * Noto Sans Egyptian Hieroglyphs — used only on the
 * /your-name-in-hieroglyphs translator page. preload: false so the ~50KB
 * font file doesn't ship on every page.
 */
export const notoSansEgyptianHieroglyphs = Noto_Sans_Egyptian_Hieroglyphs({
  weight: ['400'],
  variable: '--font-noto-sans-egyptian-hieroglyphs',
  display: 'swap',
  preload: false,
});

export const fontVariables = [
  cormorant.variable,
  sourceSerif4.variable,
  newsreader.variable,
  dmSans.variable,
  notoSerifJp.variable,
  notoSansJp.variable,
  notoSansEgyptianHieroglyphs.variable,
].join(' ');
