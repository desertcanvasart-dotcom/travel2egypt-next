#!/usr/bin/env node
/**
 * Phase 3 Batch 1 — DRY RUN. Maps Sanity hotel/nileCruise docs missing es name/summary
 * to corpus ES files (~/Downloads/All 3 langs/es/{hotels,cruises}) via slug; for the
 * unmatched "voids", rechecks by TITLE. Writes NOTHING (no Sanity mutations).
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const c = createClient({ projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: env.NEXT_PUBLIC_SANITY_DATASET, apiVersion: '2024-12-01', token: env.SANITY_STAGING_API_WRITE_TOKEN, useCdn: false, perspective: 'published' });

const HOME = os.homedir();
const DIRS = {
  hotel: path.join(HOME, 'Downloads/All 3 langs/es/hotels'),
  nileCruise: path.join(HOME, 'Downloads/All 3 langs/es/cruises'),
};
const norm = (s) => (s || '').toLowerCase().replace(/^0+/, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// parse frontmatter title/description/slug from a corpus file
function parseFm(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const fm = (txt.match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';
  const get = (k) => {
    const m = fm.match(new RegExp('^' + k + ':\\s*(.*)$', 'm'));
    if (!m) return null;
    return m[1].trim().replace(/^["']/, '').replace(/["']$/, '').trim() || null;
  };
  return { slug: get('slug'), title: get('title'), description: get('description') };
}

// index corpus dir by normalized slug + collect titles for fuzzy
function indexDir(dir) {
  const bySlug = {}; const files = [];
  let ents = []; try { ents = fs.readdirSync(dir); } catch {}
  for (const f of ents) {
    if (!f.endsWith('.md')) continue;
    const full = path.join(dir, f);
    const fm = parseFm(full);
    if (!fm.slug) continue;
    const rec = { ...fm, file: full };
    files.push(rec);
    bySlug[norm(fm.slug)] = rec;
  }
  return { bySlug, files };
}

const idx = { hotel: indexDir(DIRS.hotel), nileCruise: indexDir(DIRS.nileCruise) };

// fuzzy title match: token-overlap of normalized title vs en name
function fuzzyByTitle(enName, files) {
  const toks = (s) => new Set(norm(s).split('-').filter((t) => t.length > 2));
  const target = toks(enName);
  let best = null, bestScore = 0;
  for (const f of files) {
    const cand = toks(f.title || f.slug);
    let inter = 0; for (const t of target) if (cand.has(t)) inter++;
    const score = inter / Math.max(1, Math.min(target.size, cand.size));
    if (score > bestScore) { bestScore = score; best = f; }
  }
  return { best, score: bestScore };
}

async function run(type, label) {
  const docs = await c.fetch(
    `*[_type==$type && defined(name[_key=="en"][0].value) && (!defined(name[_key=="es"][0].value) || !defined(summary[_key=="es"][0].value))]{
      "id":_id, "slug":slug[_key=="en"][0].value.current, "enName":name[_key=="en"][0].value,
      "esName":name[_key=="es"][0].value, "esSum":summary[_key=="es"][0].value }`,
    { type }
  );
  const matched = [], voids = [];
  for (const d of docs) {
    const rec = idx[type].bySlug[norm(d.slug)];
    if (rec) matched.push({ d, rec });
    else voids.push(d);
  }
  console.log(`\n==================== ${label} ====================`);
  console.log(`gaps: ${docs.length} | slug-matched: ${matched.length} | void(slug): ${voids.length}`);
  return { docs, matched, voids };
}

const H = await run('hotel', 'HOTELS');
const C = await run('nileCruise', 'CRUISES');

// ---------- PART A: sample table ----------
function sample(matched, n, kind) {
  console.log(`\n----- PART A SAMPLE — ${kind} (${n} of ${matched.length}) -----`);
  for (const { d, rec } of matched.slice(0, n)) {
    const willName = !d.esName && rec.title ? rec.title : (d.esName ? '(es name already set — SKIP)' : '(no title in file!)');
    const willSum = !d.esSum && rec.description ? rec.description : (d.esSum ? '(es summary already set — SKIP)' : '(no description in file!)');
    const uncertain = norm(rec.slug) !== norm(d.slug) ? '  ⚠ SLUG-NORMALIZED MATCH' : '';
    console.log(`\n• ${d.slug}${uncertain}`);
    console.log(`   file: ${rec.file.replace(HOME, '~')}`);
    console.log(`   name[es] ← ${willName}`);
    console.log(`   summary[es] ← ${String(willSum).slice(0, 160)}${String(willSum).length > 160 ? '…' : ''}`);
  }
}
sample(H.matched, 8, 'HOTELS');
sample(C.matched, 5, 'CRUISES');

// integrity: any matched file missing title/description, or any es already set?
const issues = [];
for (const kind of [['hotel', H], ['nileCruise', C]]) {
  for (const { d, rec } of kind[1].matched) {
    if (!d.esName && !rec.title) issues.push(`${kind[0]} ${d.slug}: file has NO title (name[es] would be empty)`);
    if (!d.esSum && !rec.description) issues.push(`${kind[0]} ${d.slug}: file has NO description (summary[es] would be empty)`);
    if (d.esName) issues.push(`${kind[0]} ${d.slug}: es name ALREADY set → will skip name (additive)`);
    if (d.esSum) issues.push(`${kind[0]} ${d.slug}: es summary ALREADY set → will skip summary (additive)`);
  }
}
console.log(`\n----- PART A integrity flags (${issues.length}) -----`);
issues.forEach((i) => console.log('  ⚠ ' + i));

// ---------- PART B: void recheck by title ----------
function recheck(voids, files, kind) {
  console.log(`\n========== PART B — ${kind} void recheck by title (${voids.length}) ==========`);
  let real = 0, gen = 0;
  for (const d of voids) {
    const { best, score } = fuzzyByTitle(d.enName, files);
    const verdict = score >= 0.6 ? 'LIKELY IMPORT' : score >= 0.4 ? 'MAYBE' : 'GENUINE VOID';
    if (score >= 0.6) real++; else if (score < 0.4) gen++;
    console.log(`  [${verdict} ${score.toFixed(2)}] ${d.slug}`);
    if (score >= 0.4) console.log(`        ↳ ${best?.slug}  "${(best?.title || '').slice(0, 70)}"`);
  }
  console.log(`  -> LIKELY IMPORT: ${real} | GENUINE VOID: ${gen} | MAYBE: ${voids.length - real - gen}`);
}
recheck(H.voids, idx.hotel.files, 'HOTELS');
recheck(C.voids, idx.nileCruise.files, 'CRUISES');

console.log('\n[DRY RUN] No Sanity writes performed.');
