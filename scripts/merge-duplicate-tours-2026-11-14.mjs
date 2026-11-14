// Owner decision 2026-11-14: merge tours that are certainly duplicates; keep the one
// with the better profile (Search Console) and presentation; 301 the other to it.
// Verified pairs (identical title+summary, or same four sites / same tour type):
//   Saint Catherine 2-day: keep wp-page-87832 (21.7K impressions) ← tour.mount-sinai-pilgrimage-…
//   Bahariya 2-day:        keep wp-page-87834 (1.9K)              ← tour.desert-oasis-2-day-…
//   Memphis/Saqqara/Citadel/Khan: keep wp-page-87840 (1.3K)       ← tour.private-tour-memphis-…
// node scripts/merge-duplicate-tours-2026-11-14.mjs [--repoint] [--redirects] [--unpublish]
//   --repoint   point every reference at the keeper (run first; harmless)
//   --redirects append EN/ES/JA 301 rows loser→keeper to the migration redirect map
//   --unpublish unpublish the losers (ONLY after the redirects are deployed)
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@sanity/client';

const c = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2025-02-19',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});
const has = (f) => process.argv.includes(f);
const PAIRS = [
  ['tour.mount-sinai-pilgrimage-2-day-trip-to-saint-catherine-from-cairo', 'wp-page-87832'],
  ['tour.desert-oasis-2-day-bahariya-oasis-private-tour-from-cairo', 'wp-page-87834'],
  ['tour.private-tour-memphis-saqqara-citadel-and-khan-el-khalili-bazaar', 'wp-page-87840'],
];
const slugs = async (id) => Object.fromEntries((await c.fetch(`*[_id==$id][0].slug[]{_key,"v":value.current}`, { id })).map((s) => [s._key, s.v]));

// Replace every {_ref: lose} inside a value with keep; drop it if keep already sits in the same array.
function repoint(v, lose, keep) {
  if (Array.isArray(v)) {
    const out = [];
    for (const item of v) {
      if (item && item._ref === lose) {
        if (v.some((x) => x && x._ref === keep)) continue;
        out.push({ ...item, _ref: keep });
      } else out.push(repoint(item, lose, keep));
    }
    return out;
  }
  if (v && typeof v === 'object') {
    if (v._ref === lose) return { ...v, _ref: keep };
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, repoint(x, lose, keep)]));
  }
  return v;
}

for (const [lose, keep] of PAIRS) {
  const [ls, ks] = [await slugs(lose), await slugs(keep)];
  console.log(`\n${lose} → ${keep}`);
  if (has('--repoint')) {
    for (const ref of await c.fetch(`*[references($l)]{_id}`, { l: lose })) {
      const d = await c.getDocument(ref._id);
      const fixed = {};
      for (const [k, v] of Object.entries(d)) if (!k.startsWith('_')) { const nv = repoint(v, lose, keep); if (JSON.stringify(nv) !== JSON.stringify(v)) fixed[k] = nv; }
      console.log(`  repoint ${ref._id}: ${Object.keys(fixed).join(', ')}`);
      await c.patch(ref._id).set(fixed).ifRevisionId(d._rev).commit();
    }
  }
  if (has('--redirects')) {
    const csvP = 'migration/redirect-map.csv', tsP = 'migration/redirect-map.generated.ts';
    let csv = readFileSync(csvP, 'utf8'), ts = readFileSync(tsP, 'utf8');
    for (const loc of ['en', 'es', 'ja']) {
      if (!ls[loc] || !ks[loc]) continue;
      const pre = loc === 'en' ? '' : `/${loc}`;
      const src = `${pre}/${ls[loc]}`, dst = `${pre}/${ks[loc]}`;
      if (ts.includes(`"source": "${src}"`)) { console.log(`  exists: ${src}`); continue; }
      csv = csv.replace(/\n?$/, `\n${src},${dst},${loc},301,,0.00\n`);
      ts = ts.replace(/\n\];\s*$/, `,\n  {\n    "source": "${src}",\n    "destination": "${dst}",\n    "permanent": true\n  }\n];\n`).replace(/\},,\n/, '},\n');
      console.log(`  301 ${src} → ${dst}`);
    }
    writeFileSync(csvP, csv); writeFileSync(tsP, ts);
  }
  if (has('--unpublish')) {
    if ((await c.fetch(`count(*[references($l)])`, { l: lose })) > 0) throw new Error(`${lose} still referenced`);
    const r = await c.action({ actionType: 'sanity.action.document.unpublish', draftId: `drafts.${lose}`, publishedId: lose });
    console.log(`  unpublished (kept as draft) ${r.transactionId}`);
  }
}
