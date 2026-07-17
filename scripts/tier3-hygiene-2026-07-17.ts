/**
 * Tier-3 content-hygiene data fixes (2026-07-17). Pure Sanity data, no
 * redirects. Rollback written first.
 *
 * 1. Esna city doc (wp-page-58844): the summary field says "60 kilometres
 *    south of Luxor" in all 3 locales while the entire rest of the Esna
 *    corpus (heritage doc wp-page-59603, all locales) says 55 km. The summary
 *    is the uniform outlier — normalize 60 -> 55. (Summary-field drift, the
 *    feedback_content_bug_sweep_fields pattern: wrong figure hides in the
 *    auto-excerpt, not the body.)
 * 2. Beni Suef price page (wp-page-72323): a standalone "<!DOCTYPE html>"
 *    block (EN, _key 000000000006) — WP-migration debris. Delete it.
 *
 * Usage: npx tsx scripts/tier3-hygiene-2026-07-17.ts [--apply]
 */
import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env' });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});
const APPLY = process.argv.includes('--apply');

const ESNA = 'wp-page-58844';
const BENI = 'wp-page-72323';
const DOCTYPE_KEY = '000000000006';

async function main() {
  const esna = await client.getDocument(ESNA);
  const beni = await client.getDocument(BENI);
  fs.writeFileSync(
    'backups/tier3-hygiene-rollback-2026-07-17.json',
    JSON.stringify({ esnaSummary: esna?.summary, beniBody: beni?.body }, null, 2)
  );
  console.log('rollback written');

  // 1. Esna summary 60 -> 55 (word-boundary, only the distance figure)
  const newSummary = (esna!.summary as any[]).map((s) => {
    const before = s.value as string;
    const after = before
      .replace(/\b60(\s*(?:kilomet\w*|km))/i, '55$1') // EN/ES
      .replace(/60(キロ)/, '55$1'); // JA
    if (before !== after) console.log(`  esna[${s._key}]: "…${before.slice(8, 34)}…" -> "…${after.slice(8, 34)}…"`);
    return { ...s, value: after };
  });

  // 2. Beni Suef: drop the DOCTYPE block from body[en]
  const newBody = (beni!.body as any[]).map((loc) => {
    if (loc._key !== 'en') return loc;
    const kept = loc.value.filter((b: any) => b._key !== DOCTYPE_KEY);
    console.log(`  beni body[en]: ${loc.value.length} -> ${kept.length} blocks (dropped DOCTYPE _key ${DOCTYPE_KEY})`);
    return { ...loc, value: kept };
  });

  if (APPLY) {
    await client.patch(ESNA).set({ summary: newSummary }).commit();
    await client.patch(BENI).set({ body: newBody }).commit();
    console.log('APPLIED both patches');
  } else {
    console.log('DRY RUN');
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
