/**
 * Sun Ray (wp-page-64331) JA arithmetic fix.
 * JA prose lists 54 outside + 2 junior + 2 superior + 2 deluxe + 2 executive (=62)
 * then asserts "合計すると66室規模です" (these total 66) — a false sum copied from a
 * self-contradictory Accor/reseller source (which itself lists the same 62 yet says 66).
 * EN/ES avoid the contradiction by not asserting a sum. Reword JA to attribute the
 * 66 figure to official materials instead of claiming the listed items add to it.
 * Safe single-span .text mutation; dry-run by default.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});
const FIND = '合計すると66室規模です。';
const REPLACE = '公式資料では、全体で66室規模として案内されています。';
(async () => {
  const commit = process.argv.includes('--commit');
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'migration-staging')
    throw new Error(`Refusing dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}".`);
  for (const target of ['wp-page-64331', 'drafts.wp-page-64331']) {
    const doc = await client.fetch(`*[_id == $id][0]{_id, body}`, { id: target });
    if (!doc) { if (!target.startsWith('drafts.')) console.log('(published not found?!)'); continue; }
    const entry = (doc.body||[]).find((b:any)=>b._key==='ja');
    let hits = 0;
    if (entry) for (const block of entry.value) {
      if (block._type!=='block'||!Array.isArray(block.children)) continue;
      for (const span of block.children) if (typeof span.text==='string'&&span.text.includes(FIND)) { span.text=span.text.split(FIND).join(REPLACE); hits++; }
    }
    console.log(`• ${target}: [ja] ${hits>0?'✓':'✗ NOT FOUND'} (${hits})`);
    if (commit && hits>0) { await client.patch(target).set({body:doc.body}).commit({visibility:'async'}); console.log('  → written'); }
  }
  if (!commit) console.log('DRY RUN. Re-run with --commit.');
})().catch(e=>{console.error(e);process.exit(1)});
