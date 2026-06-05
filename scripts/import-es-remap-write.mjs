#!/usr/bin/env node
/**
 * Phase 3 Batch 1b — WRITE the 38 HIGH-confidence remapped ES imports.
 * Sanity slug → corpus slug (curated map). name[es] ← corpus title:, summary[es] ← description:.
 * Additive (es key only, fill where null, never overwrite, en/ja untouched). raw @sanity/client.
 * Pass --commit to write; otherwise plan-only. The 4 AMBIGUOUS rows are intentionally EXCLUDED.
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const COMMIT = process.argv.includes('--commit');
const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const c = createClient({ projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: env.NEXT_PUBLIC_SANITY_DATASET, apiVersion: '2024-12-01', token: env.SANITY_STAGING_API_WRITE_TOKEN, useCdn: false });
const HOME = os.homedir();
const DIRS = { hotel: path.join(HOME, 'Downloads/All 3 langs/es/hotels'), nileCruise: path.join(HOME, 'Downloads/All 3 langs/es/cruises') };
const norm = (s) => (s || '').toLowerCase().replace(/^0+/, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
function parseFm(file) { const txt = fs.readFileSync(file, 'utf8'); const fm = (txt.match(/^---\n([\s\S]*?)\n---/) || [])[1] || ''; const get = (k) => { const m = fm.match(new RegExp('^' + k + ':\\s*(.*)$', 'm')); return m ? (m[1].trim().replace(/^["']|["']$/g, '').trim() || null) : null; }; return { slug: get('slug'), title: get('title'), description: get('description') }; }
function indexDir(dir) { const o = {}; for (const f of fs.readdirSync(dir)) { if (!f.endsWith('.md')) continue; const fm = parseFm(path.join(dir, f)); if (fm.slug) o[norm(fm.slug)] = fm; } return o; }
const idx = { hotel: indexDir(DIRS.hotel), nileCruise: indexDir(DIRS.nileCruise) };

// HIGH-confidence map only (Sanity slug → corpus slug). 4 ambiguous excluded.
const MAP = {
  hotel: {
    'sharm-el-sheikh-fayrouz-resort': 'fayrouz-resort-sharm-el-sheikh',
    'renaissance-sharm-el-sheikh-resort': 'renaissance-sharm-el-sheikh',
    'cairo-marriott-hotel-and-omar-khayyam-casino': 'cairo-marriott-hotel-casino',
    'maritim-jolie-ville-kings-island-luxor': 'maritim-jolie-ville-kings-island-hotel',
    'cairo-hotel-pyramids': 'cairo-pyramids-hotel',
    'hurghada-marriott-red-sea-resort': 'hurghada-marriott-resort',
    'marriott-mena-house-hotel-cairo': 'marriott-mena-house-hotel',
    'hilton-alexandria-corniche-hotel': 'hilton-alexandria-corniche',
    'helnan-palestine-hotel-alexandria': 'helnan-royal-palestine-hotel-montazah-gardens',
    'the-four-seasons-hotel-san-stephano': 'the-four-seasons-san-stefano',
    'royal-maxim-palace-kempinski-cairo': 'royal-maxim-palace-kempinski',
    'four-seasons-hotel-cairo-nile-plaza': 'four-seasons-nile-plaza-hotel',
    'four-seasons-hotel-cairo-first-residence': 'four-seasons-first-residence',
    'westin-cairo-golf-resort-and-spa': 'westin-cairo-golf-resort-spa',
    'badawiya-hotel-el-dakhla-oasis': 'badawiya-dakhla-hotel',
    'sol-y-mar-pioneers-hotel-al-kharga-oasis': 'sol-y-mar-pioneers-al-kharga',
    'steigenberger-nile-palace-luxor-hotel': 'steigenberger-nile-palace-hotel',
    'movenpick-resort-spa-el-gouna': 'm-venpick-resort-spa-el-gouna',
    'the-nile-ritz-carlton': 'the-nile-ritz-carlton-hotel',
    'movenpick-resort-aswan': 'm-venpick-resort-aswan',
  },
  nileCruise: {
    'swiss-inn-radamis-ii-nile-cruise': 'swiss-inn-radamis-ii',
    'm-s-amwaj-livingstone-nile-cruise': 'm-s-amwaj-livingstone',
    'sonesta-amirat-dahabiya': 'amirat-dahabiya',
    'nour-el-nil-meroe-dahabiya': 'meroe-dahabiya',
    'movenpick-prince-abbas-cruise': 'm-venpick-prince-abbas',
    'm-s-steigenberger-omar-el-khayam': 'm-s-omar-el-khayam',
    'm-s-steigenberger-minerva-nile-cruise': 'm-s-minerva-nile-cruise',
    'm-s-sonesta-st-george-nile-cruise': 'm-s-sonesta-st-george',
    'movenpick-ms-hamees-nile-cruise': 'm-venpick-m-s-hamees',
    'movenpick-ms-darakum-nile-cruise': 'm-venpick-m-s-darakum',
    'movenpick-ms-royal-lotus-nile-cruise': 'm-venpick-m-s-royal-lotus',
    'movenpick-ms-sun-ray-nile-cruise': 'm-venpick-m-s-sun-ray',
    'm-s-steigenberger-legacy-nile-cruise': 'steigenberger-legacy-nile-cruise',
    'm-s-alexander-the-great-nile-cruise': 'y-s-alexander-the-great',
    'm-s-sonesta-star-goddess-nile-cruise': 'm-s-sonesta-star-goddess',
    'movenpick-sb-feddya-dahabiya': 'sb-feddya-dahabiya',
    'm-s-mayfair': 'm-s-mayfair-nile-cruise',
    'adelaide-dahabiya': 'adela-de-dahabiya',
  },
};

const hasNonEmptyEs = (arr) => Array.isArray(arr) && arr.some((i) => i._key === 'es' && typeof i.value === 'string' && i.value.trim());
const withEs = (arr, value) => [...(Array.isArray(arr) ? arr.filter((i) => i._key !== 'es') : []), { _key: 'es', value }];

async function plan(type) {
  const slugs = Object.keys(MAP[type]);
  const docs = await c.fetch(`*[_type==$type && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current in $s]{ _id, "slug":slug[_key=="en"][0].value.current, name, summary }`, { type, s: slugs });
  const bySlug = Object.fromEntries(docs.map((d) => [d.slug, d]));
  const ops = []; const problems = [];
  for (const sslug of slugs) {
    const d = bySlug[sslug];
    if (!d) { problems.push(`${type} ${sslug}: NOT FOUND in Sanity`); continue; }
    const rec = idx[type][norm(MAP[type][sslug])];
    if (!rec) { problems.push(`${type} ${sslug}: corpus file ${MAP[type][sslug]} MISSING`); continue; }
    const patch = {};
    if (rec.title && !hasNonEmptyEs(d.name)) patch.name = withEs(d.name, rec.title);
    if (rec.description && !hasNonEmptyEs(d.summary)) patch.summary = withEs(d.summary, rec.description);
    if (hasNonEmptyEs(d.name) || hasNonEmptyEs(d.summary)) problems.push(`${type} ${sslug}: es already set → that field skipped (additive)`);
    if (Object.keys(patch).length) ops.push({ id: d._id, slug: sslug, patch });
  }
  return { ops, problems };
}

const H = await plan('hotel');
const C = await plan('nileCruise');
const all = [...H.ops, ...C.ops];
console.log(`HOTELS: ${H.ops.length}/20 to patch | CRUISES: ${C.ops.length}/18 to patch | total ${all.length}`);
console.log(`name[es]: ${all.filter((o) => o.patch.name).length} | summary[es]: ${all.filter((o) => o.patch.summary).length}`);
[...H.problems, ...C.problems].forEach((p) => console.log('  ⚠ ' + p));

if (!COMMIT) { console.log('\n[PLAN ONLY] pass --commit to write.'); process.exit(0); }
const BATCH = 20; let written = 0;
for (let i = 0; i < all.length; i += BATCH) {
  let tx = c.transaction();
  for (const op of all.slice(i, i + BATCH)) tx = tx.patch(op.id, (p) => p.set(op.patch));
  await tx.commit({ visibility: 'sync' });
  written += all.slice(i, i + BATCH).length;
  console.log(`  committed ${written}/${all.length}`);
}
console.log(`\n[DONE] patched ${written} docs.`);
