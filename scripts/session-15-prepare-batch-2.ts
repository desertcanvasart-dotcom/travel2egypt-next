/**
 * Session 15 sub-step 4a — prepare Batch 2 (package) canonical ID list.
 *
 * Reads migration/sessions/session-15-audit/candidates.json, filters to
 * type=package, removes EXCLUDED_TOUR_WP_IDS, runs B3 country-variant
 * consolidation, then writes:
 *   - batch-2-package-ids.json            canonical wpId list
 *   - batch-2-package-slugs.txt           comma-separated slug list (for --slug-include)
 *   - batch-2-consolidation-preview.json  cluster structure for operator review
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  EXCLUDED_TOUR_WP_IDS,
  SLUG_TYPE_OVERRIDES_BY_WP_ID,
  consolidateCountryVariants,
} from './wp-import/mappers/tour.js';

interface Candidate {
  wpId: number;
  slug: string;
  title: string;
  type: 'dayTour' | 'package';
  classifierReason: string;
  confidence: string;
  durationDays?: number;
}

const AUDIT_DIR = 'migration/sessions/session-15-audit';
const candidates: Candidate[] = JSON.parse(
  readFileSync(join(AUDIT_DIR, 'candidates.json'), 'utf8'),
);

// Pull anything classified as package by the audit, PLUS anything the operator
// has type-overridden to package (these were originally classified as dayTour
// in candidates.json but operator review at sub-step 3.5 reclassified them as
// SEO-targeted package variants).
const auditPackages = candidates.filter((c) => c.type === 'package');
const overrideToPackage = candidates.filter(
  (c) => c.type !== 'package' && SLUG_TYPE_OVERRIDES_BY_WP_ID[c.wpId] === 'package',
);
const allPackages = [...auditPackages, ...overrideToPackage];
const afterExclude = allPackages.filter((c) => !EXCLUDED_TOUR_WP_IDS.has(c.wpId));
const excludedHits = allPackages.filter((c) => EXCLUDED_TOUR_WP_IDS.has(c.wpId));

const result = consolidateCountryVariants(
  afterExclude.map((c) => ({ wpId: c.wpId, slug: c.slug, title: c.title })),
);

const canonicalIds = result.canonical.map((c) => c.wpId).sort((a, b) => a - b);
const canonicalSlugs = result.canonical.map((c) => c.slug);

const preview = result.clusters
  .filter((cl) => cl.droppedVariants.length > 0)
  .map((cl) => ({
    cluster: cl.baseSlug,
    canonicalWpId: cl.canonical.wpId,
    canonicalSlug: cl.canonical.slug,
    variants: cl.droppedVariants.map((v) => ({
      wpId: v.wpId,
      slug: v.slug,
      sourceCountry: v.sourceCountry,
    })),
  }));

writeFileSync(
  join(AUDIT_DIR, 'batch-2-package-ids.json'),
  JSON.stringify(canonicalIds, null, 2) + '\n',
);
writeFileSync(
  join(AUDIT_DIR, 'batch-2-package-slugs.txt'),
  canonicalSlugs.join(',') + '\n',
);
writeFileSync(
  join(AUDIT_DIR, 'batch-2-consolidation-preview.json'),
  JSON.stringify(preview, null, 2) + '\n',
);

console.log('=== Session 15 Batch 2 prep ===');
console.log(`candidates.json total:                       ${candidates.length}`);
console.log(`  audit-classified packages:                 ${auditPackages.length}`);
console.log(`  operator type-override → package:          ${overrideToPackage.length}`);
console.log(`  combined package pool:                     ${allPackages.length}`);
console.log(`  excluded by EXCLUDED_TOUR_WP_IDS:          ${excludedHits.length}`);
console.log(`  after exclusion:                           ${afterExclude.length}`);
console.log(`  consolidation clusters total:              ${result.clusters.length}`);
console.log(`  consolidation clusters w/ variants:        ${preview.length}`);
console.log(`  variants dropped (redirects emitted):      ${result.redirects.length}`);
console.log(`  CANONICAL package count:                   ${canonicalIds.length}`);
console.log('');
console.log('Excluded hits in package list (wpId — slug):');
for (const e of excludedHits) console.log(`  ${e.wpId}  ${e.slug}`);
console.log('');
console.log('Consolidation clusters with variants:');
for (const cl of preview) {
  console.log(`  [${cl.cluster}]`);
  console.log(`    canonical: wpId=${cl.canonicalWpId} slug=${cl.canonicalSlug}`);
  for (const v of cl.variants) {
    console.log(`    dropped:   wpId=${v.wpId} country=${v.sourceCountry} slug=${v.slug}`);
  }
}
