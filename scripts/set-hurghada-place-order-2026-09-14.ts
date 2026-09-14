/**
 * Hurghada sidebar "Other sites" order — founder call 2026-09-14:
 * Hurghada Aquarium · Hurghada Marina · The Giftun Islands, identical in
 * every locale. Sets guideArticle.orderRank (schema "Display order within
 * city", default 100) on the three docs; CityGuideSidebar sorts places by
 * orderRank then name. Rollback JSON written before the write.
 *   npx tsx scripts/set-hurghada-place-order-2026-09-14.ts --dry-run | --commit
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
loadEnv();
const ORDER: Record<string, number> = {
  'wp-page-59711': 1, // Hurghada Aquarium
  'wp-page-59712': 2, // Hurghada Marina
  'guideArticle.hurghada.giftun-islands': 3,
};
const commit = process.argv.includes('--commit');
if (!commit && !process.argv.includes('--dry-run')) { console.error('pass --dry-run or --commit'); process.exit(2); }
const client = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset: 'production', apiVersion: '2024-12-01', useCdn: false, perspective: 'published',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN });
(async () => {
  const ids = Object.keys(ORDER);
  const before = await client.fetch(`*[_id in $ids]{_id, _rev, orderRank, "t": title[_key=="en"][0].value}`, { ids });
  if (before.length !== ids.length) throw new Error(`expected ${ids.length} docs, got ${before.length}`);
  writeFileSync(resolve(process.cwd(), 'backups', 'hurghada-place-order-before-2026-09-14.json'), JSON.stringify(before, null, 2));
  for (const d of before) console.log(`${d.t}: orderRank ${d.orderRank ?? 'unset'} → ${ORDER[d._id]}`);
  if (!commit) { console.log('dry-run: no write'); return; }
  let tx = client.transaction();
  for (const d of before) tx = tx.patch(d._id, (p) => p.ifRevisionId(d._rev).set({ orderRank: ORDER[d._id] }));
  await tx.commit();
  console.log('committed');
})().catch((e) => { console.error(e); process.exit(1); });
