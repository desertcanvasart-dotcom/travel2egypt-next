/**
 * splitClimateRegion — render-time detection of the inline climate-signature
 * marker in a weather-page body, mirroring splitPriceRegion.
 *
 * A "rewritten" weather page (the Stage A/B editorial rebuild) carries one
 * sentinel block whose trimmed text is exactly CLIMATE_MARKER. When present,
 * the page renders a full-bleed PHOTO hero at the top and injects the ruled
 * inline ClimateSignature into the body at the marker's position (the marker
 * block itself is dropped). When ABSENT — every un-rewritten weather page —
 * the split reports `found: false`, the body renders untouched, and the page
 * keeps the current boxed-card climate-signature hero. This is the per-page
 * gate: no marker → byte-identical to the pre-change behaviour.
 */

interface Block {
  _type: string;
  children?: Array<{ text?: string }>;
  [k: string]: unknown;
}

/** The sentinel block the content rebuild inserts where the chart should sit. */
export const CLIMATE_MARKER = '[[climate-signature]]';

function blockText(b: Block): string {
  return (b.children ?? []).map((c) => c.text ?? '').join('').trim();
}

export function splitClimateRegion(blocks: Block[]): {
  found: boolean;
  before: Block[];
  after: Block[];
} {
  const i = blocks.findIndex(
    (b) => b._type === 'block' && blockText(b) === CLIMATE_MARKER,
  );
  if (i < 0) return { found: false, before: blocks, after: [] };
  return { found: true, before: blocks.slice(0, i), after: blocks.slice(i + 1) };
}
