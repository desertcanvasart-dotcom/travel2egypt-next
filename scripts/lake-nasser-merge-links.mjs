/**
 * Lake Nasser merge (2026-11-10): repoint every internal link and reference
 * to the retired post (/blog/lake-nasser-cruises and its ES/JA versions) to
 * the surviving post in the same language. Writes a report of every change.
 * Usage (from the repo root): node scripts/lake-nasser-merge-links.mjs [--apply]
 */
import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

// Retired → surviving, per language (paths and document ids).
const PATHS = {
  '/blog/lake-nasser-cruises': '/blog/lake-nasser-cruise',
  '/es/blog/lago-nasser': '/es/blog/por-que-elegir-un-crucero-por-el-lago-nasser',
  '/ja/blog/naseru-ko-kuruzu-no-erabikata': '/ja/blog/naseru-ko-kuruzu-to-wa-nani-ka',
};
const IDS = {
  'wp-post-144896-en': 'wp-post-145378-en',
  'wp-post-155635-es': 'wp-post-155359-es',
  'wp-post-170183-ja': 'wp-post-170181-ja',
};
const RETIRED = Object.keys(IDS);
const SKIP_TYPES = new Set(['translation.metadata', 'sanity.imageAsset', 'sanity.fileAsset']);

// Normalise an href to a site path, or null if it is not one of ours.
function retiredTarget(href) {
  let p = href;
  const m = p.match(/^https?:\/\/(www\.)?travel2egypt\.org(\/.*)?$/i);
  if (m) p = m[2] || '/';
  else if (/^https?:/i.test(p)) return null;
  const [path, rest = ''] = p.split(/(?=[?#])/);
  const clean = decodeURI(path).replace(/\/+$/, '');
  return PATHS[clean] ? PATHS[clean] + rest : null;
}

const docs = await c.fetch(`*[!(_type in $skip) && !(_id in $retired) && !(_id in $retiredDrafts)]`, {
  skip: [...SKIP_TYPES], retired: RETIRED, retiredDrafts: RETIRED.map((i) => `drafts.${i}`),
});
const report = [];
let tx = c.transaction(), n = 0;
for (const doc of docs) {
  const changes = [];
  const walk = (o, path) => {
    if (Array.isArray(o)) return o.forEach((v, i) => walk(v, `${path}[${o[i]?._key ? `_key=="${o[i]._key}"` : i}]`));
    if (!o || typeof o !== 'object') return;
    if (typeof o.href === 'string') {
      const to = retiredTarget(o.href);
      if (to) { changes.push({ field: `${path}.href`, from: o.href, to }); o.href = to; }
    }
    if (typeof o._ref === 'string' && IDS[o._ref]) {
      changes.push({ field: `${path}._ref`, from: o._ref, to: IDS[o._ref] }); o._ref = IDS[o._ref];
    }
    for (const [k, v] of Object.entries(o)) if (v && typeof v === 'object') walk(v, path ? `${path}.${k}` : k);
  };
  const copy = JSON.parse(JSON.stringify(doc));
  walk(copy, '');
  if (!changes.length) continue;
  report.push({ id: doc._id, type: doc._type, changes });
  // Write back only the top-level fields that changed.
  const set = {};
  for (const k of Object.keys(copy)) if (!k.startsWith('_') && JSON.stringify(copy[k]) !== JSON.stringify(doc[k])) set[k] = copy[k];
  tx = tx.patch(c.patch(doc._id).set(set));
  n++;
}
fs.writeFileSync('docs/lake-nasser-merge-links-2026-11-10.json', JSON.stringify(report, null, 1));
const total = report.reduce((a, r) => a + r.changes.length, 0);
console.log(`${report.length} documents, ${total} links/references`);
for (const r of report) for (const ch of r.changes) console.log(`${r.id} (${r.type}) · ${ch.from} → ${ch.to}`);
if (APPLY && n) { const r = await tx.commit({ autoGenerateArrayKeys: false }); console.log('committed', r.results.length, 'docs'); }
else console.log(`${n} docs to patch ${APPLY ? '' : '(dry run — pass --apply)'}`);
