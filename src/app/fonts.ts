/**
 * Travel2Egypt fonts — brand spec (session 5.5).
 *
 * Per migration/.brand-inputs/travel2egypt-brand-inputs.md Section 2:
 *   - Display (EN/ES): Cormorant Garamond — 400, 500, 600 (+ italic 400/500)
 *   - Body (EN/ES):    Inter — 300, 400, 500, 600
 *   - Display (JA):    Noto Serif JP — 400, 500
 *   - Body (JA):       Noto Sans JP — 400, 500
 *
 * JA fonts are preload: false. They only ship when html[lang=ja] renders.
 * EN/ES locale uses Cormorant + Inter only.
 */

import {
  Cormorant_Garamond,
  Inter,
  Noto_Serif_JP,
  Noto_Sans_JP,
} from 'next/font/google';

export const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
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

export const fontVariables = [
  cormorant.variable,
  inter.variable,
  notoSerifJp.variable,
  notoSansJp.variable,
].join(' ');
