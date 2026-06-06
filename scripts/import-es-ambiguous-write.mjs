#!/usr/bin/env node
/**
 * Phase 3 — final 4 ambiguous ES imports (explicit Sanity→corpus pairings, human-signed-off).
 * name[es] ← corpus title:, summary[es] ← corpus description:. Additive: es key only, fill where
 * null, never overwrite a non-empty es value, en/ja untouched. raw @sanity/client.
 * Pass --commit to write; otherwise plan-only.
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const COMMIT = process.argv.includes('--commit');
const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const c = createClient({ projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID, dataset: env.NEXT_PUBLIC_SANITY_DATASET, apiVersion: '2024-12-01', token: env.SANITY_STAGING_API_WRITE_TOKEN, useCdn: false });
const HOME = os.homedir();

// Sanity slug -> { type, dir, corpus file slug }
const PAIRS = [
  { type: 'hotel', sanity: 'the-cascades-soma-bay', corpus: 'the-westin-soma-bay-golf-resort-spa' },
  { type: 'hotel', sanity: 'sunrise-montemare-resort', corpus: 'sunrise-montemare-resort-grand-select' },
  { type: 'nileCruise', sanity: 'nour-el-nil-assouan-dahabiya', corpus: 'nour-el-nil-assouan' },
  { type: 'nileCruise', sanity: 'el-nil-dahabiya', corpus: 'nour-el-nil-el-nil-dahabiya' },
];
const DIR = { hotel: path.join(HOME, 'Downloads/All 3 langs/es/hotels'), nileCruise: path.join(HOME, 'Downloads/All 3 langs/es/cruises') };

function parseFm(file) { const txt = fs.readFileSync(file, 'utf8'); const fm = (txt.match(/^---\n([\s\S]*?)\n---/) || [])[1] || ''; const get = (k) => { const m = fm.match(new RegExp('^' + k + ':\\s*(.*)$', 'm')); return m ? (m[1].trim().replace(/^["']|["']$/g, '').trim() || null) : null; }; return { slug: get('slug'), title: get('title'), description: get('description') }; }
const hasNonEmptyEs = (arr) => Array.isArray(arr) && arr.some((i) => i._key === 'es' && typeof i.value === 'string' && i.value.trim());
const withEs = (arr, value) => [...(Array.isArray(arr) ? arr.filter((i) => i._key !== 'es') : []), { _key: 'es', value }];

const ops = [];
for (const p of PAIRS) {
  const file = path.join(DIR[p.type], `${p.corpus}_es_2026-05.md`);
  if (!fs.existsSync(file)) { console.log(`⚠ ${p.sanity}: corpus file MISSING (${file})`); continue; }
  const fm = parseFm(file);
  const d = await c.fetch(`*[_type==$t && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$s][0]{_id,name,summary}`, { t: p.type, s: p.sanity });
  if (!d) { console.log(`⚠ ${p.sanity}: Sanity doc not found`); continue; }
  const patch = {};
  if (fm.title && !hasNonEmptyEs(d.name)) patch.name = withEs(d.name, fm.title);
  if (fm.description && !hasNonEmptyEs(d.summary)) patch.summary = withEs(d.summary, fm.description);
  if (hasNonEmptyEs(d.name) || hasNonEmptyEs(d.summary)) console.log(`  ⚠ ${p.sanity}: es already set on a field → skipped (additive)`);
  console.log(`• ${p.sanity}  ←  ${p.corpus}`);
  console.log(`   name[es] ← ${fm.title}`);
  console.log(`   summary[es] ← ${(fm.description || '').slice(0, 110)}`);
  if (Object.keys(patch).length) ops.push({ id: d._id, patch });
}

if (!COMMIT) { console.log(`\n[PLAN ONLY] ${ops.length} docs would be patched. Pass --commit to write.`); process.exit(0); }
let tx = c.transaction();
for (const op of ops) tx = tx.patch(op.id, (pp) => pp.set(op.patch));
await tx.commit({ visibility: 'sync' });
console.log(`\n[DONE] patched ${ops.length} docs.`);
