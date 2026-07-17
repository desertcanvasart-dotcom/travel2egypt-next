/**
 * Rename stale Qalawun link-anchor text after the title change (2026-07-17).
 *
 * The rewrite changed the doc title to "Complex of Sultan Al-Mansur Qalawun"
 * but 39 visible docs still carry the OLD title as the anchor TEXT of their
 * internalLink references (related-monuments lists / in-body links) — stored
 * spans, not derived from the title.
 *
 * Precision rule: only spans whose marks include a markDef that REFERENCES
 * guideArticle.cairo.madrassa-mausoleum-of-qalawun are renamed, and only when
 * their text contains the old title variant. Prose mentions without a link are
 * left alone (reported). Locale-aware replacement. Rollback written first.
 *
 * Usage: npx tsx scripts/qalawun-anchor-rename-2026-07-17.ts [--apply]
 */
import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});
const APPLY = process.argv.includes('--apply');

const TARGET = 'guideArticle.cairo.madrassa-mausoleum-of-qalawun';
const RENAMES: Array<[string, string]> = [
  ['Madrassa & Mausoleum of Qalawun', 'Complex of Sultan Al-Mansur Qalawun'],
  ['Madrassa and Mausoleum of Qalawun', 'Complex of Sultan Al-Mansur Qalawun'],
  ['Madraza y Mausoleo de Qalawun', 'Complejo del Sultán Al-Mansur Qalawun'],
  ['カラーウーンのマドラサと霊廟', 'スルタン・カラーウーン複合体'],
];

function processBlock(block: any, changed: { n: number }, prose: string[]) {
  if (!block || block._type !== 'block') return block;
  const linkKeys = new Set(
    (block.markDefs || [])
      .filter((m: any) => m?.reference?._ref === TARGET || m?._ref === TARGET)
      .map((m: any) => m._key)
  );
  const children = (block.children || []).map((span: any) => {
    if (!span?.text) return span;
    const hasVariant = RENAMES.some(([o]) => span.text.includes(o));
    if (!hasVariant) return span;
    const isAnchor = (span.marks || []).some((mk: string) => linkKeys.has(mk));
    if (!isAnchor) { prose.push(span.text.slice(0, 60)); return span; }
    let text = span.text;
    for (const [o, n] of RENAMES) text = text.split(o).join(n);
    if (text !== span.text) changed.n++;
    return { ...span, text };
  });
  return { ...block, children };
}

function walk(node: any, changed: { n: number }, prose: string[]): any {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map((c) => walk(c, changed, prose));
  if (node._type === 'block') return processBlock(node, changed, prose);
  const out: any = {};
  for (const [k, v] of Object.entries(node)) out[k] = walk(v, changed, prose);
  return out;
}

async function main() {
  const referrers: any[] = await client.fetch(
    `*[references($id) && !(_id in path('drafts.**'))]{...}`,
    { id: TARGET }
  );
  fs.writeFileSync(
    'backups/qalawun-anchor-rename-rollback-2026-07-17.json',
    JSON.stringify(referrers, null, 2)
  );
  console.log(`rollback written (${referrers.length} referrer docs)`);

  let totalSpans = 0, docsTouched = 0;
  const proseMentions: string[] = [];
  for (const doc of referrers) {
    const changed = { n: 0 };
    const patched = walk(doc, changed, proseMentions);
    if (!changed.n) continue;
    docsTouched++;
    totalSpans += changed.n;
    if (APPLY) {
      const { _id, _rev, _createdAt, _updatedAt, _type, ...rest } = patched;
      await client.patch(_id).set(rest).commit();
    }
  }
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'}: ${totalSpans} anchor spans renamed across ${docsTouched} docs`);
  if (proseMentions.length) {
    console.log(`non-anchor prose mentions LEFT UNCHANGED (${proseMentions.length}):`);
    proseMentions.slice(0, 8).forEach((p) => console.log('  ', JSON.stringify(p)));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
