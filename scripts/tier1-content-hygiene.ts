/**
 * Tier-1 content-hygiene sweep — live wrong-title / wrong-city fixes.
 * Scope (owner-confirmed): TWO fixes only.
 *   1. Sohag weather page (wp-page-60533): EN title "Seasons Travel Guide"
 *      -> "Weather in Sohag" (sibling convention). EN only; ES/JA correct.
 *   2. Minya price page (wp-page-72364): delete the wrong-city Aswan intro
 *      (paragraph + Aswan image) in ALL THREE locales — category (a) deletable
 *      debris; the correct Minya/Asyut heading + price table stay. No new prose.
 *
 * Every target guarded by a content assertion; aborts on mismatch. Gated:
 * DRY RUN default; APPLY=1 stages drafts + per-doc snapshot; never publishes;
 * refuses if a draft exists (FORCE=1).
 *
 * Run (dry):    npx tsx scripts/tier1-content-hygiene.ts
 * Run (stage):  APPLY=1 npx tsx scripts/tier1-content-hygiene.ts
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync, mkdirSync } from 'node:fs';
loadEnv();

const APPLY = process.env.APPLY === '1';
const FORCE = process.env.FORCE === '1';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
if (dataset !== 'production') throw new Error(`Refusing to run against "${dataset}".`);
const token = (APPLY ? process.env.SANITY_PRODUCTION_API_WRITE_TOKEN : undefined) ||
  process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (APPLY && !process.env.SANITY_PRODUCTION_API_WRITE_TOKEN) { console.error('APPLY=1 needs SANITY_PRODUCTION_API_WRITE_TOKEN'); process.exit(1); }
const client = createClient({ projectId: 'ufallvd2', dataset, apiVersion: '2024-12-01', token, useCdn: false });

const SOHAG = 'wp-page-60533';
const MINYA = 'wp-page-72364';
// Minya wrong-city blocks per locale: [paragraph key, image key]
const MINYA_DEL: Record<string, { para: string; img: string }> = {
  en: { para: '000000000003', img: '000000000004' },
  es: { para: '000000000007', img: '000000000008' },
  ja: { para: '000000000003', img: '000000000004' },
};

const blockText = (b: any) => (b.children ?? []).map((s: any) => s.text ?? '').join('');
const fail: string[] = []; const log: string[] = [];

async function stage(id: string, mutate: (doc: any) => void) {
  const pub: any = await client.getDocument(id);
  const draft: any = await client.getDocument(`drafts.${id}`);
  if (draft && !FORCE) { fail.push(`drafts.${id} exists — FORCE=1 to override`); return; }
  const doc = JSON.parse(JSON.stringify(pub));
  mutate(doc);
  if (fail.length) return;
  if (APPLY) {
    mkdirSync('backups', { recursive: true });
    writeFileSync(`backups/tier1-${id}-rollback.json`, JSON.stringify(pub, null, 2));
    await client.createOrReplace({ ...doc, _id: `drafts.${id}` });
    log.push(`✓ staged drafts.${id} (snapshot backups/tier1-${id}-rollback.json)`);
  }
}

async function main() {
  // 1. Sohag EN title
  await stage(SOHAG, (doc) => {
    const en = (doc.title ?? []).find((t: any) => t._key === 'en');
    if (!en) { fail.push('[sohag] title.en missing'); return; }
    if (en.value !== 'Seasons Travel Guide') { fail.push(`[sohag] title.en guard fail (got "${en.value}")`); return; }
    log.push(`[sohag ${SOHAG}] TITLE.en: "Seasons Travel Guide" -> "Weather in Sohag"`);
    en.value = 'Weather in Sohag';
  });

  // 2. Minya wrong-city intro deletion (all locales)
  await stage(MINYA, (doc) => {
    for (const [loc, { para, img }] of Object.entries(MINYA_DEL)) {
      const e = (doc.body ?? []).find((x: any) => x._key === loc);
      if (!e) { fail.push(`[minya] body.${loc} missing`); continue; }
      const byKey = new Map<string, any>(e.value.map((b: any) => [b._key, b]));
      const p = byKey.get(para), im = byKey.get(img);
      // guard paragraph = wrong-city Aswan copy
      if (!p || !/Aswan|Asuán|アスワン/.test(blockText(p))) { fail.push(`[minya.${loc}] paragraph ${para} not the Aswan block`); continue; }
      // guard image = Aswan isis-temple pendingImage
      if (!im || im._type !== 'image' || !/isis-temple-in-aswan/.test(im._pendingImage || '')) { fail.push(`[minya.${loc}] image ${img} not the Aswan image`); continue; }
      // guard heading (kept) = correct Minya/Asyut
      const h = e.value.find((b: any) => b._type === 'block' && b.style === 'h2');
      if (!h || !/Minya|Asyut|ミニヤ|アスユート/.test(blockText(h))) { fail.push(`[minya.${loc}] correct heading not found — refusing`); continue; }
      e.value = e.value.filter((b: any) => b._key !== para && b._key !== img);
      log.push(`[minya ${MINYA}].${loc} DELETE paragraph ${para} + image ${img}; kept h2 "${blockText(h).trim().slice(0, 40)}…" + price table`);
    }
  });

  console.log(`\n=== ${APPLY ? 'APPLY (staging)' : 'DRY RUN'} — Tier-1 hygiene ===`);
  console.log(log.join('\n'));
  if (fail.length) { console.error(`\n✗ ${fail.length} GUARD FAILURES — aborting:\n  ` + fail.join('\n  ')); process.exit(1); }
  if (!APPLY) console.log('\nDRY RUN — set APPLY=1 to stage.');
}
main().catch((e) => { console.error(e); process.exit(1); });
