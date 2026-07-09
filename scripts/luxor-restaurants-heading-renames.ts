/**
 * Luxor "Top Restaurants" (wp-page-60657) — rider: rename two section
 * headings per owner decision. ES/JA Additional-Dining heading only.
 *   ES: "Otras Opciones Gastronómicas" -> "Otras opciones para comer"
 *   JA: "その他のグルメスポット"           -> "その他の食の選択肢"
 * EN ("Additional Dining Options") and JA Note ("ご注意") are LEFT AS-IS
 * (EN pending owner confirmation; メモ rename dropped by owner).
 *
 * Gated: DRY RUN default; APPLY=1 stages draft + snapshot; no publish;
 * refuses if a draft exists (FORCE=1).
 *
 * Run (dry):    npx tsx scripts/luxor-restaurants-heading-renames.ts
 * Run (stage):  APPLY=1 npx tsx scripts/luxor-restaurants-heading-renames.ts
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync, mkdirSync } from 'node:fs';
loadEnv();

const ID = 'wp-page-60657';
const APPLY = process.env.APPLY === '1';
const FORCE = process.env.FORCE === '1';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
if (dataset !== 'production') throw new Error(`Refusing to run against "${dataset}".`);
const token = (APPLY ? process.env.SANITY_PRODUCTION_API_WRITE_TOKEN : undefined) ||
  process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (APPLY && !process.env.SANITY_PRODUCTION_API_WRITE_TOKEN) { console.error('APPLY=1 needs SANITY_PRODUCTION_API_WRITE_TOKEN'); process.exit(1); }
const client = createClient({ projectId: 'ufallvd2', dataset, apiVersion: '2024-12-01', token, useCdn: false });

// locale -> { blockKey, from (guard), to }
const RENAME: Record<string, { k: string; from: string; to: string }> = {
  es: { k: '00000000005e', from: 'Otras Opciones Gastronómicas', to: 'Otras opciones para comer' },
  ja: { k: '000000000055', from: 'その他のグルメスポット', to: 'その他の食の選択肢' },
};
const blockText = (b: any) => (b.children ?? []).map((s: any) => s.text ?? '').join('');

async function main() {
  const pub: any = await client.getDocument(ID);
  const draft: any = await client.getDocument(`drafts.${ID}`);
  if (draft && !FORCE) { console.error(`drafts.${ID} exists — FORCE=1 to override`); process.exit(1); }
  const doc = JSON.parse(JSON.stringify(pub));
  const fail: string[] = []; const log: string[] = [];

  for (const [loc, { k, from, to }] of Object.entries(RENAME)) {
    const e = (doc.body ?? []).find((x: any) => x._key === loc);
    const b = e?.value.find((x: any) => x._key === k);
    if (!b || b.style !== 'h2') { fail.push(`[${loc}] heading ${k} missing/not h2`); continue; }
    if (blockText(b).trim() !== from) { fail.push(`[${loc}] heading ${k} guard fail (got "${blockText(b).trim()}")`); continue; }
    b.children = [{ _type: 'span', _key: `${k}s0`, text: to, marks: [] }];
    b.markDefs = [];
    log.push(`[${loc}] HEADING ${k}: "${from}" -> "${to}"`);
  }

  console.log(`\n=== ${APPLY ? 'APPLY (staging)' : 'DRY RUN'} — ${ID} heading renames ===`);
  console.log(log.join('\n'));
  if (fail.length) { console.error(`\n✗ ${fail.length} GUARD FAILURES:\n  ` + fail.join('\n  ')); process.exit(1); }
  if (!APPLY) { console.log('\nDRY RUN — set APPLY=1 to stage.'); return; }
  mkdirSync('backups', { recursive: true });
  writeFileSync('backups/luxor-heading-renames-rollback.json', JSON.stringify(pub, null, 2));
  await client.createOrReplace({ ...doc, _id: `drafts.${ID}` });
  console.log(`\n✓ staged drafts.${ID} (snapshot backups/luxor-heading-renames-rollback.json)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
