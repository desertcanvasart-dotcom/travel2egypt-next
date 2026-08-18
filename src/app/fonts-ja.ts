/**
 * Japanese faces — Noto Serif JP (Mincho, display+body) and Noto Sans JP
 * (Gothic, UI), per the brand spec in fonts.ts.
 *
 * DELIBERATELY a separate module from fonts.ts (perf session 2026-08-18):
 * next/font attaches a face's @font-face CSS to every route that imports its
 * module, and these two CJK faces carry ~63KB of declarations EACH (~100
 * unicode-range slices per face). Imported from the shared layout they were
 * render-blocking on every page in every locale. This module is reached ONLY
 * via the lazy client chunk in JaFontGate (ssr:false dynamic import), so the
 * declarations load asynchronously, and only when the locale is ja.
 *
 * Tradeoff, flagged to the owner: ja pages paint first in the system serif
 * (Mincho-class) and swap to Noto once the lazy chunk + slices arrive —
 * same visual contract as font-display:swap, starting slightly later.
 * EN/ES pages are entirely unaffected.
 */

import { Noto_Serif_JP, Noto_Sans_JP } from 'next/font/google';

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

export const jaFontVariables = [notoSerifJp.variable, notoSansJp.variable].join(' ');
