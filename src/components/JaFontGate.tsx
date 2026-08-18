'use client';

/**
 * Lazy client boundary for the Japanese webfonts (see fonts-ja.ts for the
 * full rationale). The layout renders this unconditionally — it is a few
 * bytes — but the JP font chunk (and its ~126KB of @font-face CSS) is
 * dynamically imported ONLY when active (locale === 'ja').
 *
 * The ssr:false dynamic import must live in a client component (Next 15
 * forbids it in Server Components), which is why this two-file gate/loader
 * shape exists instead of a single conditional in the layout.
 */

import dynamic from 'next/dynamic';

const JaFontLoader = dynamic(() => import('./JaFontLoader'), { ssr: false });

export function JaFontGate({ active }: { active: boolean }) {
  if (!active) return null;
  return <JaFontLoader />;
}
