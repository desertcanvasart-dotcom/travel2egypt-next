#!/usr/bin/env node
/**
 * Phase 3 Batch 1 — WRITE the 78 slug-exact ES imports (hotels 50 + cruises 28).
 *   name[es]    ← corpus frontmatter title:
 *   summary[es] ← corpus frontmatter description:
 *
 * ADDITIVE & SAFE:
 *  - only the published doc, by exact (normalized) slug match to a corpus file
 *  - append { _key:'es', value } ONLY where es is absent or empty
 *  - never overwrite a non-empty es value; en/ja items preserved verbatim (own _keys)
 *  - batched transactions; raw @sanity/client
 *
 * Pass --commit to actually write. Without it, prints the plan and exits (no writes).
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const COMMIT = process.argv.includes('--commit');
const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const c = createClient({ projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: env.NEXT_PUBLIC_SANITY_DATASET, apiVersion: '2024-12-01', token: env.SANITY_STAGING_API_WRITE_TOKEN, useCdn: false });

const HOME = os.homedir();
const DIRS = { hotel: path.join(HOME, 'Downloads/All 3 langs/es/hotels'), nileCruise: path.join(HOME, 'Downloads/All 3 langs/es/cruises') };
const norm = (s) => (s || '').toLowerCase().replace(/^0+/, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function parseFm(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const fm = (txt.match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';
  const get = (k) => { const m = fm.match(new RegExp('^' + k + ':\\s*(.*)$', 'm')); return m ? (m[1].trim().replace(/^["']/, '').replace(/["']$/, '').trim() || null) : null; };
  return { slug: get('slug'), title: get('title'), description: get('description') };
}
function indexDir(dir) {
  const bySlug = {};
  for (const f of (fs.existsSync(dir) ? fs.readdirSync(dir) : [])) {
    if (!f.endsWith('.md')) continue;
    const fm = parseFm(path.join(dir, f));
    if (fm.slug) bySlug[norm(fm.slug)] = { ...fm, file: path.join(dir, f) };
  }
  return bySlug;
}
const idx = { hotel: indexDir(DIRS.hotel), nileCruise: indexDir(DIRS.nileCruise) };

const hasNonEmptyEs = (arr) => Array.isArray(arr) && arr.some((i) => i._key === 'es' && typeof i.value === 'string' && i.value.trim());
const withEs = (arr, value) => [...(Array.isArray(arr) ? arr.filter((i) => i._key !== 'es') : []), { _key: 'es', value }];

async function plan(type) {
  // include drafts? published docs only (perspective default 'raw' here since no perspective set) -> filter explicitly
  const docs = await c.fetch(
    `*[_type==$type && !(_id in path("drafts.**")) && defined(name[_key=="en"][0].value) && (!defined(name[_key=="es"][0].value) || !defined(summary[_key=="es"][0].value))]{
      _id, "slug":slug[_key=="en"][0].value.current, name, summary }`,
    { type }
  );
  const ops = [];
  let overwriteGuard = 0;
  for (const d of docs) {
    const rec = idx[type][norm(d.slug)];
    if (!rec) continue; // not slug-matched (Part B handles these)
    const patch = {};
    if (rec.title && !hasNonEmptyEs(d.name)) patch.name = withEs(d.name, rec.title);
    if (rec.description && !hasNonEmptyEs(d.summary)) patch.summary = withEs(d.summary, rec.description);
    // safety: count any case where es already non-empty (we will NOT touch those)
    if (hasNonEmptyEs(d.name) || hasNonEmptyEs(d.summary)) overwriteGuard++;
    if (Object.keys(patch).length) ops.push({ id: d._id, slug: d.slug, patch, file: rec.file });
  }
  return { docs, ops, overwriteGuard };
}

async function run() {
  const H = await plan('hotel');
  const C = await plan('nileCruise');
  const all = [...H.ops, ...C.ops];
  console.log(`HOTELS: ${H.ops.length} docs to patch (of ${H.docs.length} gaps) | es-already-set & skipped: ${H.overwriteGuard}`);
  console.log(`CRUISES: ${C.ops.length} docs to patch (of ${C.docs.length} gaps) | es-already-set & skipped: ${C.overwriteGuard}`);
  const nName = all.filter((o) => o.patch.name).length, nSum = all.filter((o) => o.patch.summary).length;
  console.log(`Total: ${all.length} docs | name[es] writes: ${nName} | summary[es] writes: ${nSum}`);

  if (!COMMIT) { console.log('\n[PLAN ONLY] pass --commit to write.'); return; }

  // batched transactions (20 docs each)
  const BATCH = 20;
  let written = 0;
  for (let i = 0; i < all.length; i += BATCH) {
    const chunk = all.slice(i, i + BATCH);
    let tx = c.transaction();
    for (const op of chunk) tx = tx.patch(op.id, (p) => p.set(op.patch));
    await tx.commit({ visibility: 'sync' });
    written += chunk.length;
    console.log(`  committed ${written}/${all.length}`);
  }
  console.log(`\n[DONE] patched ${written} docs.`);
}
run().catch((e) => { console.error(e); process.exit(1); });
