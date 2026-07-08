/**
 * Set `priceFrom` (EUR number) on published day-tour docs from the owner's
 * "day tours prices.xlsx" — ONLY the confidently-matched tours. The renderer
 * converts EUR → USD (en) / JPY (ja) via src/lib/currency.ts; ES shows EUR.
 * Value rounded to 2dp (strips float noise; display rounds further).
 *
 * DRY RUN by default; --apply writes. Backs up prior priceFrom to backups/.
 * Idempotent: skips docs whose priceFrom already equals the target.
 * Run: npx tsx scripts/apply-daytour-from-prices.ts [--apply]
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: 'production',
  apiVersion: '2024-12-01', useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});
const rows: { slug: string; priceEur: number }[] = JSON.parse(
  readFileSync(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '/private/tmp/claude-501/-Users-islamhussein-t2e/76d26772-d792-446b-a977-618ea66e9d83/scratchpad/definite.json', 'utf8'),
);

(async () => {
  const backup: Record<string, unknown> = {};
  let toWrite = 0, skipSame = 0, notFound = 0;
  const plan: { id: string; price: number }[] = [];
  for (const r of rows) {
    const price = Math.round(r.priceEur * 100) / 100;
    const doc = await client.fetch<{ _id: string; priceFrom?: number }>(
      `*[_type=="tour" && type=="dayTour" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$s][0]{_id, priceFrom}`,
      { s: r.slug },
    );
    if (!doc) { console.log(`✗ not found: ${r.slug}`); notFound++; continue; }
    backup[doc._id] = { slug: r.slug, priceFromBefore: doc.priceFrom ?? null };
    if (doc.priceFrom === price) { skipSame++; continue; }
    plan.push({ id: doc._id, price }); toWrite++;
  }
  console.log(`rows=${rows.length}  toWrite=${toWrite}  alreadySet=${skipSame}  notFound=${notFound}`);
  if (!APPLY) { console.log('DRY RUN — re-run with --apply'); return; }
  mkdirSync('backups', { recursive: true });
  const bpath = `backups/daytour-from-prices-rollback-2026-07-08.json`;
  writeFileSync(bpath, JSON.stringify(backup, null, 2));
  console.log(`backup → ${bpath}`);
  for (const p of plan) { await client.patch(p.id).set({ priceFrom: p.price }).commit({ visibility: 'async' }); }
  console.log(`✓ wrote priceFrom to ${plan.length} day tours`);
})();
