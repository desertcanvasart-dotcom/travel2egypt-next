/**
 * Stage A for wp-page-72314 (Ticket Prices for Attractions in Aswan) —
 * structural debris cleanup only, per Phase 1 investigation 2026-07-10.
 *
 * Deletes:
 *   - EN/ES/JA: the dead `_pendingImage` block (never resolved, redundant
 *     with the doc's real heroImage field)
 *   - JA only: the dead "2024年10月31日更新" date-stamp block (doesn't
 *     exist in EN/ES, classic WP leftover)
 *
 * Summary field:
 *   - EN left untouched (already clean, verified + published earlier
 *     this session)
 *   - ES already has no summary — no-op
 *   - JA summary cleared (it was a duplicate-of-body-intro debris block
 *     with raw English text bleeding into the end) — leaves JA with NO
 *     summary for now, matching the Minya intro-less pattern until
 *     replacement copy lands
 *
 * Does NOT touch price figures — that's a separate investigation.
 *
 * Every deletion is guarded against the block's current text; the script
 * aborts rather than delete past a mismatch (doc changed since audited).
 *
 * STAGING ONLY — writes go to `drafts.wp-page-72314`, never published.
 * Run (dry):    npx tsx scripts/aswan-prices-stage-a.ts
 * Run (stage):  APPLY=1 npx tsx scripts/aswan-prices-stage-a.ts
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync, mkdirSync } from 'node:fs';
loadEnv();

const APPLY = process.env.APPLY === '1';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
if (dataset !== 'production') throw new Error(`Refusing to run against "${dataset}".`);
const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (APPLY && !process.env.SANITY_PRODUCTION_API_WRITE_TOKEN) {
  console.error('APPLY=1 needs SANITY_PRODUCTION_API_WRITE_TOKEN');
  process.exit(1);
}
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset,
  apiVersion: '2024-12-01',
  useCdn: false,
  token,
});

const ID = 'wp-page-72314';

const DELETE_KEYS: Record<'en' | 'es' | 'ja', string[]> = {
  en: ['000000000007'], // pending image
  es: ['000000000008'], // pending image
  ja: ['000000000004', '00000000002a'], // pending image + dead date-stamp
};

// guard: expected block content at each key before we delete it
const GUARDS: { locale: 'en' | 'es' | 'ja'; key: string; check: (b: any) => boolean; label: string }[] = [
  { locale: 'en', key: '000000000007', check: (b) => b._type === 'image' && !!b._pendingImage, label: 'EN pending image' },
  { locale: 'es', key: '000000000008', check: (b) => b._type === 'image' && !!b._pendingImage, label: 'ES pending image' },
  { locale: 'ja', key: '000000000004', check: (b) => b._type === 'image' && !!b._pendingImage, label: 'JA pending image' },
  { locale: 'ja', key: '00000000002a', check: (b) => b._type === 'block' && (b.children ?? []).map((c: any) => c.text).join('') === '2024年10月31日更新', label: 'JA date-stamp' },
];

async function main() {
  console.log(`=== ${APPLY ? 'APPLY (staging draft)' : 'DRY RUN'}: ${ID} Stage A ===\n`);

  const pub: any = await client.getDocument(ID);
  const existingDraft: any = await client.getDocument(`drafts.${ID}`);
  if (existingDraft) throw new Error(`drafts.${ID} already exists — resolve/discard before staging`);
  const doc = JSON.parse(JSON.stringify(pub));

  for (const g of GUARDS) {
    const entry = doc.body.find((b: any) => b._key === g.locale);
    const block = entry.value.find((b: any) => b._key === g.key);
    if (!block) throw new Error(`[guard] ${g.label}: key ${g.key} not found in body[${g.locale}]`);
    if (!g.check(block)) throw new Error(`[guard] ${g.label}: content mismatch at key ${g.key}`);
    console.log(`  guard OK: ${g.label}`);
  }

  for (const locale of ['en', 'es', 'ja'] as const) {
    const entry = doc.body.find((b: any) => b._key === locale);
    const before = entry.value.length;
    entry.value = entry.value.filter((b: any) => !DELETE_KEYS[locale].includes(b._key));
    console.log(`body[${locale}]: ${before} -> ${entry.value.length} blocks (removed ${DELETE_KEYS[locale].length})`);
  }

  // Summary: EN untouched, ES already absent (no-op), JA cleared
  const jaSummary = doc.summary?.find((s: any) => s._key === 'ja');
  if (!jaSummary) throw new Error('[guard] expected a JA summary to clear, found none');
  console.log(`\nsummary[ja] BEFORE: ${jaSummary.value.slice(0, 80)}...`);
  doc.summary = (doc.summary ?? []).filter((s: any) => s._key !== 'ja');
  console.log('summary[ja] AFTER: (cleared, no summary)');
  console.log('summary[en]: untouched');
  console.log('summary[es]: already absent, no-op');

  if (!APPLY) {
    console.log('\nDRY RUN — no writes. Re-run with APPLY=1 to stage.');
    return;
  }

  mkdirSync('backups', { recursive: true });
  writeFileSync(`backups/aswan-prices-stage-a-rollback-2026-07-10.json`, JSON.stringify(pub, null, 2));
  doc._id = `drafts.${ID}`;
  await client.createOrReplace(doc);
  console.log(`\n✓ staged drafts.${ID} — NOT published. Review, then publish.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
