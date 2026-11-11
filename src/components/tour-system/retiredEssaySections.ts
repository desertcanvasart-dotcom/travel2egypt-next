/**
 * The hub essays' "How to use this page" section is retired (owner specs,
 * 2026-11-09: packages hub + day-tour hubs). It is dropped at render time, not
 * deleted in Sanity: the heading below in each language, and everything after
 * it up to the next heading.
 */
const RETIRED_ESSAY_HEADINGS = new Set(['How to use this page', 'Cómo usar esta página', 'このページの使い方']);

export function withoutRetiredSections(essay: unknown): unknown {
  if (!Array.isArray(essay)) return essay;
  const out: unknown[] = [];
  let skipping = false;
  for (const b of essay as Array<{ _type?: string; style?: string; children?: Array<{ text?: string }> }>) {
    const isHeading = b?._type === 'block' && /^h[1-6]$/.test(b.style ?? '');
    if (isHeading) {
      const text = (b.children ?? []).map((c) => c.text ?? '').join('').trim();
      skipping = RETIRED_ESSAY_HEADINGS.has(text);
    }
    if (!skipping) out.push(b);
  }
  return out;
}
