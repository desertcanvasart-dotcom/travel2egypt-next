/**
 * Review tooling for journey pages (Phase A): resolves every proposed or
 * approved tour pick in src/lib/journeys/curation.ts BY SLUG (shared helper
 * src/lib/products/bySlug.ts — never by _id) and reports any pick that is
 * missing, unpublished, unpriced or not a multi-day package.
 *
 *   npx tsx scripts/check-journey-picks.ts      (run from the repo root)
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';

import { CURATION } from '../src/lib/journeys/curation';
import { JOURNEY_KEYS } from '../src/lib/journeys/registry';
import { ALL_SLUGS, EN_SLUG, PRODUCTS_BY_SLUGS_FILTER, indexBySlugs } from '../src/lib/products/bySlug';

const client = createClient({
  projectId: 'ufallvd2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
  useCdn: false,
});

async function main() {
  const slugs = [...new Set(JOURNEY_KEYS.flatMap((k) => CURATION[k].tours.map((t) => t.slug)))];
  const rows = await client.fetch<Array<{ _id: string; en: string; slugs: string[]; type?: string; durationDays?: number; priceFrom?: number }>>(
    `*[${PRODUCTS_BY_SLUGS_FILTER}]{ _id, "en": ${EN_SLUG}, "slugs": ${ALL_SLUGS}, type, durationDays, priceFrom }`,
    { slugs },
  );
  const bySlug = indexBySlugs(rows, slugs);
  let problems = 0;
  for (const k of JOURNEY_KEYS) {
    for (const t of CURATION[k].tours) {
      const r = bySlug.get(t.slug);
      const issue = !r
        ? 'NOT FOUND (unpublished or wrong slug)'
        : r.type !== 'package'
          ? `not a package (${r.type})`
          : !(r.priceFrom && r.priceFrom > 0)
            ? 'unpriced'
            : !(r.durationDays && r.durationDays > 1)
              ? 'not multi-day'
              : null;
      if (issue) problems++;
      console.log(`${issue ? '✗' : '✓'} ${k.padEnd(12)} ${t.needsReview ? 'proposed' : 'APPROVED'}  ${t.slug}${r ? `  (${r._id}, ${r.durationDays}d, €${r.priceFrom})` : ''}${issue ? `  — ${issue}` : ''}`);
    }
  }
  console.log(problems ? `\n${problems} problem(s).` : '\nAll picks resolve to published, priced multi-day packages.');
  process.exit(problems ? 1 : 0);
}
main();
