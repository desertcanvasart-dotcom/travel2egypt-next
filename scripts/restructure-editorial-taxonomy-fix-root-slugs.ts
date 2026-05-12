/**
 * Corrective patch between Phase 3 and Phase 4 of the journal taxonomy
 * restructure. Root buckets share EN slugs with the new catch-all leaves
 * (`planning-advice`, `destination-depth`), which would make
 * /blog/category/<slug> ambiguous. Rewrite the root slugs to match their
 * new EN names so the URL space is clean before Phase 5 routing work.
 *
 * Uses Sanity's keyed-path syntax `slug[_key=="en"].value.current` so
 * only the targeted locale entry is rewritten — siblings are preserved.
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';

const REQUIRED_DATASET = 'migration-staging';
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
const dataset = process.env.SANITY_STAGING_DATASET ?? REQUIRED_DATASET;

if (!projectId) { console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID'); process.exit(1); }
if (!token) { console.error('Missing SANITY_STAGING_API_WRITE_TOKEN'); process.exit(1); }
if (dataset !== REQUIRED_DATASET) {
  console.error(`Refusing: dataset=${dataset} but this script only writes to ${REQUIRED_DATASET}.`);
  process.exit(1);
}

const client = createClient({
  projectId, dataset, token,
  apiVersion: '2024-10-01', useCdn: false, perspective: 'raw',
});

const rootSlugPatches: Array<{ id: string; en: string; es: string; ja: string }> = [
  { id: 'category-planning',    en: 'planning',    es: 'planificacion', ja: 'planning' },
  { id: 'category-destination', en: 'destination', es: 'destino',       ja: 'destination' },
];

async function main() {
  for (const r of rootSlugPatches) {
    await client
      .patch(r.id)
      .set({
        'slug[_key=="en"].value.current': r.en,
        'slug[_key=="es"].value.current': r.es,
        'slug[_key=="ja"].value.current': r.ja,
      })
      .commit();
    console.log(`✓ ${r.id}: slug.en=${r.en} slug.es=${r.es} slug.ja=${r.ja}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
