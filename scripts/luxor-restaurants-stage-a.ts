/**
 * Luxor "Top Restaurants" (wp-page-60657) — STAGE A: structural deletions +
 * decorative-link cleanup ONLY. No prose is authored or reworded; retained
 * restaurant descriptions and the current summary/standfirst are left byte-
 * identical. Stage B (owner-authored locked copy) is separate.
 *
 * Per-locale plan is EXPLICIT (block _keys), each guarded by a content
 * assertion so the script aborts rather than delete the wrong thing if the
 * document has changed. Operates on all three locale bodies.
 *
 * Actions (per owner decisions):
 *   DELETE  dup-title line, repeated first paragraph, in-every-bite sign-off,
 *           Created/Updated date line, _pendingImage blocks, Culinary-Journey
 *           promo tail  (varies per locale; ES/JA have no image/promo tail).
 *   STRIP   every decorative externalLink mark in RETAINED blocks (mark removed
 *           from spans + markDef dropped; text untouched).
 *   REPOINT the genuine "Luxor Temple" external link -> internal guide ref
 *           (EN: As-Sahaby block; ES: Nile Valley block; JA: none exists).
 *
 * Gated: DRY RUN by default; APPLY=1 stages drafts (createOrReplace drafts.<id>)
 * and snapshots the original. Never publishes. Refuses if a draft already
 * exists (clean-draft rule) unless FORCE=1.
 *
 * Run (dry):    npx tsx scripts/luxor-restaurants-stage-a.ts
 * Run (stage):  APPLY=1 npx tsx scripts/luxor-restaurants-stage-a.ts
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync, mkdirSync } from 'node:fs';
loadEnv();

const ID = 'wp-page-60657';
const LUXOR_TEMPLE = 'guideArticle.luxor.the-luxor-temple';
const APPLY = process.env.APPLY === '1';
const FORCE = process.env.FORCE === '1';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
if (dataset !== 'production') throw new Error(`Refusing to run against "${dataset}".`);
const token =
  (APPLY ? process.env.SANITY_PRODUCTION_API_WRITE_TOKEN : undefined) ||
  process.env.SANITY_API_READ_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN;
if (APPLY && !process.env.SANITY_PRODUCTION_API_WRITE_TOKEN) {
  console.error('APPLY=1 requires SANITY_PRODUCTION_API_WRITE_TOKEN'); process.exit(1);
}
const client = createClient({ projectId: 'ufallvd2', dataset, apiVersion: '2024-12-01', token, useCdn: false });

type Loc = 'en' | 'es' | 'ja';

// blocks to delete outright (by _key), with a substring the block must contain
const DELETE: Record<Loc, { key: string; expect: string }[]> = {
  en: [
    { key: '000000000001', expect: 'Top Restaurants in Luxor' },
    { key: '000000000006', expect: 'renowned for its ancient monuments' },
    { key: '00000000008d', expect: 'in every bite' },
    { key: '000000000091', expect: 'Created on 18 March 2020' },
    { key: '000000000092', expect: '' }, // pendingImage
    { key: '000000000093', expect: '' }, // pendingImage
    { key: '000000000095', expect: 'Culinary Journey Through Egypt' },
    { key: '00000000009d', expect: 'Savor the flavors of Egypt' },
    { key: '00000000009f', expect: 'Learn more' },
  ],
  es: [
    { key: '000000000001', expect: 'DOCTYPE html' },
    { key: '000000000003', expect: 'Gastronomía y Restaurantes en Luxor' },
    { key: '000000000005', expect: 'Gastronomía y Restaurantes en Luxor' },
    { key: '000000000007', expect: 'célebre por sus monumentos' },
  ],
  ja: [
    { key: '000000000001', expect: 'ルクソールのレストラン＆グルメガイド' },
    { key: '000000000003', expect: '古代遺跡で知られる' },
    { key: '000000000064', expect: '美食の旅をお楽しみください' },
    { key: '000000000066', expect: '作成日' },
    { key: '000000000068', expect: '更新日' },
  ],
};

// externalLink markDefs to strip entirely (block key -> markDef key)
const STRIP: Record<Loc, { b: string; d: string }[]> = {
  en: [
    { b: '00000000000f', d: '00000000000c' }, { b: '000000000021', d: '00000000001e' },
    { b: '000000000028', d: '000000000025' }, { b: '00000000003b', d: '000000000038' },
    { b: '000000000042', d: '00000000003f' }, { b: '00000000004d', d: '00000000004a' },
    { b: '000000000054', d: '000000000051' }, { b: '00000000005d', d: '00000000005a' },
    { b: '000000000068', d: '000000000065' }, { b: '00000000006f', d: '00000000006c' },
    { b: '000000000081', d: '00000000007e' }, { b: '000000000088', d: '000000000085' },
  ],
  es: [
    { b: '000000000028', d: '000000000025' }, { b: '000000000037', d: '000000000034' },
  ],
  ja: [
    { b: '00000000001b', d: '000000000018' }, { b: '000000000025', d: '000000000022' },
  ],
};

// externalLink -> internalLink (Luxor Temple). block key -> markDef key
const REPOINT: Record<Loc, { b: string; d: string }[]> = {
  en: [{ b: '00000000001a', d: '000000000017' }],
  es: [{ b: '000000000054', d: '000000000051' }],
  ja: [],
};

const blockText = (b: any) => (b.children ?? []).map((s: any) => s.text ?? '').join('');

async function main() {
  const pub: any = await client.getDocument(ID);
  if (!pub) throw new Error('no published doc');
  const draft: any = await client.getDocument(`drafts.${ID}`);
  if (draft && !FORCE) {
    console.error(`drafts.${ID} already exists — refusing (clean-draft rule). Set FORCE=1 to override.`);
    process.exit(1);
  }

  const doc = JSON.parse(JSON.stringify(pub));
  const log: string[] = [];
  const fail: string[] = [];

  for (const entry of doc.body ?? []) {
    const loc = entry._key as Loc;
    if (!['en', 'es', 'ja'].includes(loc) || !Array.isArray(entry.value)) continue;
    const byKey = new Map<string, any>(entry.value.map((b: any) => [b._key, b]));
    const before = entry.value.length;

    // guard + collect deletions
    const delKeys = new Set<string>();
    for (const { key, expect } of DELETE[loc]) {
      const b = byKey.get(key);
      if (!b) { fail.push(`[${loc}] delete key ${key} MISSING`); continue; }
      if (expect && !blockText(b).includes(expect)) {
        fail.push(`[${loc}] delete key ${key} content mismatch (want "${expect}")`); continue;
      }
      delKeys.add(key);
    }

    // strip decorative external links (guard: markDef exists + is externalLink)
    for (const { b, d } of STRIP[loc]) {
      const blk = byKey.get(b);
      if (!blk || delKeys.has(b)) { fail.push(`[${loc}] strip target block ${b} missing/deleted`); continue; }
      const md = (blk.markDefs ?? []).find((m: any) => m._key === d);
      if (!md) { fail.push(`[${loc}] strip markDef ${d} missing in ${b}`); continue; }
      if (md._type !== 'externalLink') { fail.push(`[${loc}] strip markDef ${d} not externalLink (${md._type})`); continue; }
      blk.markDefs = blk.markDefs.filter((m: any) => m._key !== d);
      for (const s of blk.children ?? []) if (s.marks) s.marks = s.marks.filter((k: string) => k !== d);
      log.push(`[${loc}] STRIP ${b}/${d} (${md.href})`);
    }

    // repoint Luxor Temple external -> internal (keep _key so span marks hold)
    for (const { b, d } of REPOINT[loc]) {
      const blk = byKey.get(b);
      if (!blk || delKeys.has(b)) { fail.push(`[${loc}] repoint block ${b} missing/deleted`); continue; }
      const md = (blk.markDefs ?? []).find((m: any) => m._key === d);
      if (!md) { fail.push(`[${loc}] repoint markDef ${d} missing in ${b}`); continue; }
      if (md._type !== 'externalLink' || !/luxor|el-templo-de-luxor|the-luxor-temple/i.test(md.href || '')) {
        fail.push(`[${loc}] repoint markDef ${d} unexpected (${md._type} ${md.href})`); continue;
      }
      const old = md.href;
      md._type = 'internalLink';
      delete md.href; delete md.newTab;
      md.reference = { _ref: LUXOR_TEMPLE, _type: 'reference' };
      log.push(`[${loc}] REPOINT ${b}/${d} (${old} -> int:${LUXOR_TEMPLE})`);
    }

    // apply deletions last
    entry.value = entry.value.filter((b: any) => !delKeys.has(b._key));
    for (const k of delKeys) log.push(`[${loc}] DELETE ${k}`);
    log.push(`[${loc}] blocks ${before} -> ${entry.value.length}`);
  }

  console.log(`\n=== ${APPLY ? 'APPLY (staging draft)' : 'DRY RUN'} — ${ID} ===`);
  console.log(log.join('\n'));
  if (fail.length) {
    console.error(`\n✗ ${fail.length} GUARD FAILURES — aborting, no write:\n  ` + fail.join('\n  '));
    process.exit(1);
  }

  if (!APPLY) { console.log('\nDRY RUN — set APPLY=1 to stage the draft.'); return; }

  mkdirSync('backups', { recursive: true });
  writeFileSync(`backups/luxor-restaurants-stage-a-rollback.json`, JSON.stringify(pub, null, 2));
  await client.createOrReplace({ ...doc, _id: `drafts.${ID}` });
  console.log(`\n✓ staged drafts.${ID}. Original snapshot: backups/luxor-restaurants-stage-a-rollback.json`);
  console.log('Review the draft, then publish (separate gated step). NOT published.');
}

main().catch((e) => { console.error(e); process.exit(1); });
