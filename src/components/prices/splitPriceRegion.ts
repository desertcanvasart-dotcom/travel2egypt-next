/**
 * Render-time identification of the legacy price-bullet region on the
 * ticket-price pages, so the page can suppress it and render PriceManifest
 * in its place. NOTHING is written to Sanity — an unverified page (no
 * priceData entry) simply never calls this and renders byte-identical.
 *
 * The region = bullet blocks matching the flattened WP table rows:
 *   header:  "<Name> Governorate · Adult · Student · Open · Last Close"
 *   row:     "<site> · EGP<n> · EGP<n> · <time> · <time>"
 * (same detection family as the Phase-1 extractor). The cross-link bullets
 * ("Price Table for Attractions in …") deliberately do NOT match. Blocks
 * between matched bullets that don't match (images, prose) are preserved
 * in `after`.
 */

interface Span {
  text?: string;
}
export interface PtBlock {
  _type: string;
  listItem?: string;
  children?: Span[];
  [k: string]: unknown;
}

const HEADER = /governorate\s*·/i;
const ROW = /·\s*(EGP\s?[\d,.]+|free)\s*·/i;

function blockText(b: PtBlock): string {
  return (b.children ?? []).map((c) => c.text ?? '').join('').trim();
}

function isPriceBullet(b: PtBlock): boolean {
  if (b._type !== 'block' || b.listItem !== 'bullet') return false;
  const t = blockText(b);
  return (HEADER.test(t) && /adult/i.test(t)) || ROW.test(t);
}

export function splitPriceRegion(blocks: PtBlock[]): {
  found: boolean;
  before: PtBlock[];
  after: PtBlock[];
} {
  const matched = blocks.map(isPriceBullet);
  const first = matched.indexOf(true);
  if (first < 0) return { found: false, before: blocks, after: [] };
  return {
    found: true,
    before: blocks.slice(0, first),
    after: blocks.slice(first).filter((_, i) => !matched[first + i]),
  };
}
