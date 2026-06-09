/**
 * Remove the day-by-day itinerary (`days` field) from private package tours.
 *
 * Private packages are meant to read as flexible narrative, not a fixed
 * day-by-day program. This unsets the `days` field (which drives the
 * "Day by day" / 日ごとの行程 section in TourPageView) on the given tours,
 * across every existing instance (published + draft). Nothing else is touched.
 *
 * Group packages KEEP their day-by-day — do not pass group package IDs here.
 *
 * Usage:
 *   tsx scripts/remove-package-days.ts <baseId...>            # dry-run
 *   tsx scripts/remove-package-days.ts <baseId...> --commit   # write
 *   (defaults to wp-page-145910 if no IDs given)
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';

const REQUIRED_DATASET = 'migration-staging';
const COMMIT = process.argv.includes('--commit');
const baseIds = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const TARGETS = baseIds.length ? baseIds : ['wp-page-145910'];

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
const dataset = process.env.NEXT_PUBLIC_SANITY_STAGING_DATASET ?? REQUIRED_DATASET;
if (!projectId || !token) { console.error('Missing project id / write token'); process.exit(1); }
if (dataset !== REQUIRED_DATASET) { console.error(`Refusing: dataset=${dataset}`); process.exit(1); }

const client = createClient({ projectId, dataset, token, apiVersion: '2024-10-01', useCdn: false, perspective: 'raw' });

async function main() {
  console.log(`Dataset: ${dataset}   Mode: ${COMMIT ? 'COMMIT' : 'DRY-RUN'}\nTargets: ${TARGETS.join(', ')}\n`);

  const ids = TARGETS.flatMap((id) => [id, `drafts.${id}`]);
  const docs: Array<{ _id: string; type?: string; tourMode?: string; daysLen?: number; en?: string }> =
    await client.fetch(
      `*[_id in $ids]{ _id, type, tourMode, "daysLen": count(days), "en": slug[_key=='en'][0].value.current }`,
      { ids }
    );

  const toPatch: string[] = [];
  for (const d of docs) {
    const note = d.tourMode === 'group' ? '  ⚠️ GROUP package — skipping (group keeps day-by-day)' : '';
    console.log(`${d._id} · /${d.en} · type=${d.type} tourMode=${d.tourMode || '(none)'} days=${d.daysLen ?? 0}${note}`);
    if (d.tourMode === 'group') continue;        // safety: never strip group packages
    if ((d.daysLen ?? 0) > 0) toPatch.push(d._id);
  }

  console.log(`\nInstances with a day-by-day to clear: ${toPatch.length}`);
  if (!COMMIT) { console.log('DRY-RUN — no writes. Re-run with --commit.'); return; }
  if (!toPatch.length) { console.log('Nothing to do.'); return; }

  const tx = client.transaction();
  for (const id of toPatch) tx.patch(id, (p) => p.unset(['days']));
  await tx.commit();
  console.log(`\n✓ Unset \`days\` on ${toPatch.length} instance(s).`);
}

main().catch((e) => { console.error('\nFAILED:', e); process.exit(1); });
