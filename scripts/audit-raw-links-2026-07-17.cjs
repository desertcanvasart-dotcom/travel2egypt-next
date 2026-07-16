/**
 * READ-ONLY recount of raw travel2egypt.org links in published Sanity docs.
 * JS substring scan over every markDef href (GROQ match tokenizes — unreliable).
 * Usage: node audit-raw-links.cjs   (run from repo root so .env loads)
 */
const { createClient } = require('@sanity/client');
require('dotenv').config();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2',
  dataset: 'production',
  apiVersion: '2024-12-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const NEEDLE = 'travel2egypt.org';

// Recursively find every object with an href containing the needle,
// recording the path so we know which field it lives in.
function scan(node, path, hits) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((child, i) => scan(child, `${path}[${i}]`, hits));
    return;
  }
  if (typeof node.href === 'string' && node.href.includes(NEEDLE)) {
    hits.push({ path, href: node.href, _type: node._type, _key: node._key });
  }
  for (const [k, v] of Object.entries(node)) {
    if (k === 'href') continue;
    scan(v, `${path}.${k}`, hits);
  }
}

async function main() {
  // Pull every published doc, in pages, and scan the whole document body.
  const types = await client.fetch(
    `array::unique(*[!(_id in path('drafts.**'))]._type)`
  );
  console.log('doc types:', types.join(', '));

  const perDoc = [];
  let totalDocs = 0;
  const PAGE = 200;
  for (const type of types) {
    if (type.startsWith('system.') || type.startsWith('sanity.')) continue;
    let offset = 0;
    for (;;) {
      const docs = await client.fetch(
        `*[_type == $type && !(_id in path('drafts.**'))] | order(_id) [${offset}...${offset + PAGE}]`,
        { type }
      );
      if (!docs.length) break;
      totalDocs += docs.length;
      for (const doc of docs) {
        const hits = [];
        scan(doc, '', hits);
        if (hits.length) {
          perDoc.push({ _id: doc._id, _type: doc._type, count: hits.length, hrefs: hits });
        }
      }
      offset += PAGE;
      if (docs.length < PAGE) break;
    }
  }

  perDoc.sort((a, b) => b.count - a.count);
  const totalHits = perDoc.reduce((s, d) => s + d.count, 0);
  console.log(`\nScanned ${totalDocs} published docs`);
  console.log(`Docs with raw ${NEEDLE} hrefs: ${perDoc.length}`);
  console.log(`Total raw link instances: ${totalHits}\n`);

  const byType = {};
  for (const d of perDoc) byType[d._type] = (byType[d._type] || 0) + d.count;
  console.log('By doc type:', JSON.stringify(byType, null, 2));

  const byUrl = {};
  for (const d of perDoc)
    for (const h of d.hrefs) byUrl[h.href] = (byUrl[h.href] || 0) + 1;

  require('fs').writeFileSync(
    __dirname + '/raw-links-remaining.json',
    JSON.stringify({ perDoc, byUrl }, null, 2)
  );
  console.log(`\nDistinct URLs: ${Object.keys(byUrl).length}`);
  console.log('Wrote raw-links-remaining.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
