/**
 * Abu Simbel spelling fix (2026-11-10, PR #202). Run AFTER #202 is deployed:
 * the redirects old→new must be live first.
 *  1. tour EN slugs: abu-simble-by-plane-from-aswan → abu-simbel-by-plane-from-aswan,
 *     private-tour-abu-simble-by-bus-from-aswan → abu-simbel-by-car-from-aswan.
 *  2. internal hrefs to the old addresses in content bodies → new addresses.
 * Usage (from the repo root): node scripts/abu-simbel-slug-fix-2026-11-10.mjs [--apply]
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

const SLUGS = {
  'tour.abu-simble-by-plane-from-aswan': ['abu-simble-by-plane-from-aswan', 'abu-simbel-by-plane-from-aswan'],
  'tour.private-tour-abu-simble-by-bus-from-aswan': ['private-tour-abu-simble-by-bus-from-aswan', 'abu-simbel-by-car-from-aswan'],
};
const HREF = {
  '/abu-simble-by-plane-from-aswan': '/abu-simbel-by-plane-from-aswan',
  '/private-tour-abu-simble-by-bus-from-aswan': '/abu-simbel-by-car-from-aswan',
};

let tx = c.transaction(), n = 0;
for (const [base, [from, to]] of Object.entries(SLUGS)) {
  for (const id of [base, `drafts.${base}`]) {
    const cur = await c.fetch(`*[_id==$id][0].slug[_key=="en"][0].value.current`, { id });
    if (cur === undefined || cur === null) continue;
    console.log(`${id} slug[en]: ${cur} → ${to}`);
    if (cur === to) continue;
    if (cur !== from) throw new Error(`${id}: unexpected slug ${cur}`);
    tx = tx.patch(c.patch(id).set({ 'slug[_key=="en"].value.current': to })); n++;
  }
}

// Rewrite hrefs anywhere in the body (markDefs), keeping every key intact.
const docs = await c.fetch(`*[_id in $ids]{_id, body}`, { ids: ['wp-page-57848', 'drafts.wp-page-57848', 'wp-page-60207', 'wp-page-87064'] });
for (const d of docs) {
  let s = JSON.stringify(d.body), changed = 0;
  for (const [from, to] of Object.entries(HREF)) {
    const re = new RegExp(`"href":"${from.replace(/[/-]/g, (m) => '\\' + m)}"`, 'g');
    s = s.replace(re, () => { changed++; return `"href":"${to}"`; });
  }
  console.log(`${d._id}: ${changed} link(s)`);
  if (changed) { tx = tx.patch(c.patch(d._id).set({ body: JSON.parse(s) })); n++; }
}

if (APPLY && n) { const r = await tx.commit({ autoGenerateArrayKeys: false }); console.log('committed', r.results.length, 'docs'); }
else console.log(`${n} docs to patch ${APPLY ? '' : '(dry run — pass --apply)'}`);
