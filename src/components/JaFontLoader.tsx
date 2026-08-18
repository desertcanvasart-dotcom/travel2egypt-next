'use client';

/**
 * Applies the Noto JP font-variable classes to <html> on the client.
 *
 * This module is the ONLY import path to fonts-ja.ts — its @font-face CSS
 * (~126KB for the two CJK faces) ships with THIS lazy chunk instead of the
 * shared layout CSS. Reached exclusively through JaFontGate's ssr:false
 * dynamic import, and only when locale === 'ja'.
 *
 * Classes go on <html> (same element fontVariables lives on) so the
 * --font-jp-serif / --font-jp-sans fallback chains in globals.css resolve
 * for the whole document, exactly as before the split.
 */

import { useEffect } from 'react';

import { jaFontVariables } from '@/app/fonts-ja';

export default function JaFontLoader() {
  useEffect(() => {
    const classes = jaFontVariables.split(' ');
    document.documentElement.classList.add(...classes);
    return () => document.documentElement.classList.remove(...classes);
  }, []);
  return null;
}
