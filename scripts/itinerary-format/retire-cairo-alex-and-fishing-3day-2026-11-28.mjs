/**
 * Owner, 28 Nov 2026 (old-format package review):
 *   - "Cairo & Alexandria 5 days: retire it into the 4-day."
 *       old tour.cairo-alexandria-city-break-5-days  /cairo-alexandria-city-break-5-days
 *       new wp-page-153242                             /4-day-history-culture-escape
 *   - "Merge the two fishing safaris, 3 and 4 day, to the 4 day one."
 *       old wp-page-129996  /3-day-nubian-fishing-safari
 *       new wp-page-130067  /4-day-ultimate-lake-nasser-experience  (its new copy offers the 3-day as a shorter version)
 * Same method as retire-city-break-2026-11-18.mjs: old tour hidden (superseded-duplicate), tour cards swapped
 * for the new tour or removed where the page already lists it; EN/ES/JA URLs 301 in
 * migration/redirect-map.generated.ts (same commit, --redirects).
 *
 *   node --env-file=<.env> scripts/itinerary-format/retire-cairo-alex-and-fishing-3day-2026-11-28.mjs             # dry run
 *   node --env-file=<.env> scripts/itinerary-format/retire-cairo-alex-and-fishing-3day-2026-11-28.mjs --apply
 *   node --env-file=<.env> scripts/itinerary-format/retire-cairo-alex-and-fishing-3day-2026-11-28.mjs --redirects  # rewrite the map
 */
import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync } from 'node:fs';
import { writeRollback } from '../lib/content-gates.mjs';

const PAIRS = [
  ['tour.cairo-alexandria-city-break-5-days', 'wp-page-153242'],
  ['wp-page-129996', 'wp-page-130067'],
];
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const url = (d, l) => `${l === 'en' ? '' : `/${l}`}/${d.slug.find((s) => s._key === l).value.current}`;

if (process.argv.includes('--redirects')) {
  const file = new URL('../../migration/redirect-map.generated.ts', import.meta.url);
  let src = readFileSync(file, 'utf8');
  const head = src.indexOf('export const redirects: RedirectRule[] = [') + 'export const redirects: RedirectRule[] = ['.length;
  const rows = JSON.parse('[' + src.slice(head, src.lastIndexOf('];')).trim().replace(/,\s*$/, '') + ']');
  const add = [];
  for (const [o, n] of PAIRS) {
    const old = await client.getDocument(o); const neu = await client.getDocument(n);
    for (const l of ['en', 'es', 'ja']) {
      const from = url(old, l), to = url(neu, l);
      let rep = 0;
      for (const r of rows) if (r.destination === from) { r.destination = to; rep++; }
      if (!rows.some((r) => r.source === from)) add.push({ source: from, destination: to, permanent: true });
      console.log(`${from} → ${to}${rep ? ` (${rep} older rows repointed)` : ''}`);
    }
  }
  const all = [...add, ...rows];
  src = src.slice(0, head) + '\n' + all.map((r) => '  ' + JSON.stringify(r, null, 2).replace(/\n/g, '\n  ')).join(',\n') + '\n];\n';
  writeFileSync(file, src);
  console.log(`redirect map: +${add.length} rows, ${all.length} total`);
  process.exit(0);
}

const hide = (n) => ({ hidden: true, 'migration.reviewFlag': 'superseded-duplicate', 'migration.supersededBy': n, 'migration.supersededAt': new Date().toISOString() });
const tx = client.transaction();
const touched = new Set();
for (const [OLD, NEW] of PAIRS) {
  const neu = await client.getDocument(NEW); const old = await client.getDocument(OLD);
  if (!neu || neu.hidden) throw new Error(`${NEW} missing or hidden`);
  if (!old) throw new Error(`${OLD} missing`);
  if (await client.getDocument(`drafts.${OLD}`)) throw new Error(`drafts.${OLD} exists`);
  const refs = await client.fetch('*[references($id) && !(_id in path("drafts.**"))]{_id, relatedTours, endTours}', { id: OLD });
  const dr = await client.fetch('*[references($id) && _id in path("drafts.**")]._id', { id: OLD });
  if (dr.length) throw new Error(`drafts reference ${OLD}: ${dr.join(', ')}`);
  console.log(`OLD ${OLD} ${JSON.stringify(old.title.find((t) => t._key === 'en').value)} → NEW ${NEW} ${JSON.stringify(neu.title.find((t) => t._key === 'en').value)}`);
  tx.patch(OLD, (p) => p.set(hide(NEW))); touched.add(OLD);
  for (const d of refs) {
    let handled = false;
    for (const field of ['relatedTours', 'endTours']) for (const it of d[field] ?? []) {
      if (it._ref !== OLD) continue;
      handled = true;
      const path = `${field}[_key=="${it._key}"]`;
      const has = (d[field] ?? []).some((x) => x._ref === NEW) || d._id === NEW;
      console.log(`  ${d._id} ${path}: ${has ? 'remove' : 'swap'}`);
      tx.patch(d._id, (q) => (has ? q.unset([path]) : q.set({ [`${path}._ref`]: NEW }))); touched.add(d._id);
    }
    if (!handled) throw new Error(`${d._id} references ${OLD} in another field`);
  }
}
if (!apply) { console.log('dry run (pass --apply)'); process.exit(0); }
await writeRollback(client, [...touched], 'before-retire-cairo-alex-fishing3');
await tx.commit();
for (const [OLD] of PAIRS) console.log(OLD, 'cards still pointing:', await client.fetch('count(*[references($id) && _type != "tour"])', { id: OLD }));
