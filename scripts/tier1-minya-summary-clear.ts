/**
 * Tier-1 completion fix — Minya price page (wp-page-72364): clear the wrong-city
 * EN `summary` field. The summary is an auto-excerpt of the already-deleted
 * Aswan intro paragraph ("…stunning landscapes of Aswan…") and still renders as
 * the standfirst. Category (a) deletable debris: removing it leaves the correct
 * H1 + heading + price table (intro-less, like Esna/Edfu/Siwa). NOT authoring.
 *
 * Missed in the first Minya pass (that pass only removed body blocks; the
 * summary is a separate field). ES/JA carry no summary — EN only.
 *
 * Gated: DRY RUN default; APPLY=1 stages draft + snapshot; no publish; refuses
 * if a draft exists (FORCE=1).
 *
 * Run (dry):    npx tsx scripts/tier1-minya-summary-clear.ts
 * Run (stage):  APPLY=1 npx tsx scripts/tier1-minya-summary-clear.ts
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync, mkdirSync } from 'node:fs';
loadEnv();

const ID = 'wp-page-72364';
const APPLY = process.env.APPLY === '1';
const FORCE = process.env.FORCE === '1';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
if (dataset !== 'production') throw new Error(`Refusing to run against "${dataset}".`);
const token = (APPLY ? process.env.SANITY_PRODUCTION_API_WRITE_TOKEN : undefined) ||
  process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (APPLY && !process.env.SANITY_PRODUCTION_API_WRITE_TOKEN) { console.error('APPLY=1 needs SANITY_PRODUCTION_API_WRITE_TOKEN'); process.exit(1); }
const client = createClient({ projectId: 'ufallvd2', dataset, apiVersion: '2024-12-01', token, useCdn: false });

async function main() {
  const pub: any = await client.getDocument(ID);
  const draft: any = await client.getDocument(`drafts.${ID}`);
  if (draft && !FORCE) { console.error(`drafts.${ID} exists — FORCE=1 to override`); process.exit(1); }
  const doc = JSON.parse(JSON.stringify(pub));

  const en = (doc.summary ?? []).find((s: any) => s._key === 'en');
  if (!en) { console.error('summary.en not found — nothing to clear'); process.exit(1); }
  if (!/Aswan|Asuán|アスワン/.test(en.value || '')) { console.error(`guard fail: summary.en does not reference Aswan (got "${(en.value||'').slice(0,50)}")`); process.exit(1); }
  // remove the wrong-city EN summary entry (leaves no standfirst — intro-less)
  doc.summary = (doc.summary ?? []).filter((s: any) => s._key !== 'en');

  console.log(`=== ${APPLY ? 'APPLY (staging)' : 'DRY RUN'} — ${ID} ===`);
  console.log(`summary.en CLEARED (was: "${(en.value || '').slice(0, 90)}…")`);
  console.log(`summary array: ${(pub.summary ?? []).length} -> ${doc.summary.length} entries`);
  if (!APPLY) { console.log('\nDRY RUN — set APPLY=1 to stage.'); return; }
  mkdirSync('backups', { recursive: true });
  writeFileSync(`backups/tier1-minya-summary-clear-rollback.json`, JSON.stringify(pub, null, 2));
  await client.createOrReplace({ ...doc, _id: `drafts.${ID}` });
  console.log(`\n✓ staged drafts.${ID} (snapshot backups/tier1-minya-summary-clear-rollback.json)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
