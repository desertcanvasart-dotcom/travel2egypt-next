/** Smoke-test Step 3 helpers: theme heuristic + variant consolidation. */
import {
  inferTheme,
  consolidateCountryVariants,
  detectMatrixViolation,
  resolveDurationDays,
  EN_SLUG_OVERRIDES_BY_WP_ID,
  EXCLUDED_TOUR_WP_IDS,
  SLUG_TYPE_OVERRIDES_BY_WP_ID,
} from './wp-import/mappers/tour.js';

console.log('=== Theme heuristic ===');
const themeCases: Array<{ slug: string; title?: string; expect: string }> = [
  { slug: 'bahariya-and-siwa-oasis-vacation', title: 'Bahariya and Siwa Oasis Vacation', expect: 'theme-egypt-in-depth' }, // fallback
  { slug: '9-day-prestigious-egypt-vacation', title: 'Luxury & Legacy: 9-Day Prestigious', expect: 'theme-luxury' },
  { slug: 'the-elegant-cairo-4-days-tour', title: '', expect: 'theme-egypt-in-depth' }, // no signal
  { slug: '7-days-egyptian-desert-safari', title: '', expect: 'theme-adventure' },
  { slug: '10-day-romantic-egypt-travel-deals-from-canada', title: '', expect: 'theme-hassle-free' },
  { slug: 'cairo-and-alexandria-4-days-family-package', title: '', expect: 'theme-family-egypt' },
  { slug: 'meroes-journey-7-day-luxury-dahabiya-cruise-vacation', title: '', expect: 'theme-dahabiya-nile-cruise' },
  { slug: 'cairo-and-nile-cruise-tour', title: '', expect: 'theme-nile-cruise' },
  { slug: 'essential-egypt', title: '', expect: 'theme-egypt-in-depth' },
];
let pass = 0;
for (const c of themeCases) {
  const r = inferTheme(c.slug, c.title ?? '');
  const ok = r.themeId === c.expect;
  console.log(`${ok ? '✓' : '✗'}  ${c.slug}  → ${r.themeId} (matched: ${r.matchedPattern})${ok ? '' : `   EXPECTED ${c.expect}`}`);
  if (ok) pass++;
}
console.log(`${pass}/${themeCases.length} theme heuristic pass\n`);

console.log('=== Variant consolidation ===');
const consol = consolidateCountryVariants([
  { wpId: 218432, slug: '9-day-prestigious-egypt-vacation-from-germany' },
  { wpId: 160965, slug: '9-day-prestigious-egypt-vacation-from-usa' },
  { wpId: 161079, slug: '9-day-prestigious-egypt-vacation-from-spain' },
  { wpId: 86851,  slug: 'the-elegant-cairo-4-days-tour' }, // no consolidation
  { wpId: 161593, slug: 'bahariya-and-siwa-oasis-vacation-from-germany' },
  { wpId: 161111, slug: 'bahariya-and-siwa-oasis-vacation-from-spain' },
  { wpId: 160953, slug: 'bahariya-and-siwa-oasis-vacation-from-usa' },
]);
console.log(`canonical count: ${consol.canonical.length} (expect 3 = 2 clusters' canonicals + 1 standalone)`);
console.log(`redirects: ${consol.redirects.length} (expect 4 = 2 dropped from cluster 1 + 2 dropped from cluster 2)`);
for (const c of consol.clusters) {
  console.log(`  cluster "${c.baseSlug}":`);
  console.log(`    canonical wpId=${c.canonical.wpId} slug=${c.canonical.slug}`);
  for (const d of c.droppedVariants) console.log(`    dropped wpId=${d.wpId} country=${d.sourceCountry}`);
}
console.log('canonical slugs:', consol.canonical.map((c) => c.slug).join(', '));
console.log('redirect samples:', consol.redirects.slice(0, 2).map((r) => `${r.fromSlug} → ${r.toSlug}`).join(' | '));

console.log('\n=== Slug override + exclusions ===');
console.log(`EN_SLUG_OVERRIDES has wp-page-238471: ${238471 in EN_SLUG_OVERRIDES_BY_WP_ID} (expect true)`);
console.log(`  → ${EN_SLUG_OVERRIDES_BY_WP_ID[238471]}`);
console.log(`EXCLUDED_TOUR_WP_IDS size: ${EXCLUDED_TOUR_WP_IDS.size} (expect 19 = 1 archive + 3 listing-style + 11 reclassified + 4 deleted)`);
// Specific membership checks — pre/post 3.5 boundary
console.log(`  EXCLUDED has 161314 (egypt-tours-from-germany): ${EXCLUDED_TOUR_WP_IDS.has(161314)} (expect false — moved to type override)`);
console.log(`  EXCLUDED has 149374 (small-group-travel-packages): ${EXCLUDED_TOUR_WP_IDS.has(149374)} (expect true — true archive)`);
console.log(`  EXCLUDED has 64129 (the-nile-goddess-cruise): ${EXCLUDED_TOUR_WP_IDS.has(64129)} (expect true — deleted, defense-in-depth)`);

console.log('\n=== SLUG_TYPE_OVERRIDES_BY_WP_ID ===');
const overrideExpect = [
  [161314, 'package'], [160983, 'package'], [160833, 'package'], [160669, 'package'],
  [160423, 'package'], [160172, 'package'], [160026, 'package'], [158052, 'package'],
  [159772, 'package'], [159756, 'package'], [159124, 'package'],
] as const;
console.log(`SLUG_TYPE_OVERRIDES size: ${Object.keys(SLUG_TYPE_OVERRIDES_BY_WP_ID).length} (expect 11)`);
let typePass = 0;
for (const [id, expect] of overrideExpect) {
  const got = SLUG_TYPE_OVERRIDES_BY_WP_ID[id];
  const ok = got === expect;
  console.log(`  ${ok ? '✓' : '✗'}  wp-page-${id} → ${got}${ok ? '' : `   EXPECTED ${expect}`}`);
  if (ok) typePass++;
}
console.log(`${typePass}/${overrideExpect.length} type override pass`);

console.log('\n=== egypt-tours B3 cluster ===');
const eggCluster = consolidateCountryVariants([
  { wpId: 161314, slug: 'egypt-tours-from-germany' },
  { wpId: 160983, slug: 'egypt-tours-from-spain' },
  { wpId: 160833, slug: 'egypt-tours-from-usa' },
  { wpId: 160669, slug: 'egypt-tours-from-turkey' },
  { wpId: 160423, slug: 'egypt-tours-from-canada' },
  { wpId: 160172, slug: 'egypt-tours-from-australia' },
  { wpId: 160026, slug: 'egypt-tours-from-india' },
  { wpId: 158052, slug: 'egypt-tours-from-the-uk' },
]);
console.log(`canonical count: ${eggCluster.canonical.length} (expect 1)`);
console.log(`redirects: ${eggCluster.redirects.length} (expect 7)`);
console.log(`canonical: wpId=${eggCluster.canonical[0]?.wpId} slug=${eggCluster.canonical[0]?.slug} (expect lowest WP ID 158052, slug=egypt-tours)`);

console.log('\n=== resolveDurationDays ===');
const durationCases: Array<{ slug: string; title: string; type: 'dayTour' | 'package'; expectValue: number; expectSource: string }> = [
  { slug: 'egypt-tours',                            title: 'Egypt Tours from the UK',                       type: 'package', expectValue: 7, expectSource: 'package-placeholder' },
  { slug: '9-day-prestigious-egypt-vacation',       title: '9-Day Prestigious Egypt Vacation',              type: 'package', expectValue: 9, expectSource: 'slug-leading' },
  { slug: 'the-elegant-cairo-4-days-tour',          title: 'The Elegant Cairo 4-Days Tour',                 type: 'package', expectValue: 4, expectSource: 'slug-anywhere' },
  { slug: 'cairo-and-nile-cruise-tour',             title: 'Nile Tapestry: 8-Day Cairo and Nile Cruise Tour', type: 'package', expectValue: 8, expectSource: 'title' },
  { slug: 'some-day-tour',                          title: 'Some Day Tour',                                  type: 'dayTour', expectValue: 1, expectSource: 'daytour-default' },
];
let durationPass = 0;
for (const c of durationCases) {
  const r = resolveDurationDays(c.slug, c.title, c.type);
  const ok = r.value === c.expectValue && r.source === c.expectSource;
  console.log(`${ok ? '✓' : '✗'}  [${c.type}] ${c.slug} → ${r.value} (${r.source})${ok ? '' : `   EXPECTED ${c.expectValue} (${c.expectSource})`}`);
  if (ok) durationPass++;
}
console.log(`${durationPass}/${durationCases.length} resolveDurationDays pass`);

console.log('\n=== Matrix violation ===');
const cityIdToSlug = new Map([
  ['id-cairo', 'cairo'], ['id-alexandria', 'alexandria'], ['id-aswan', 'aswan'],
]);
const v1 = detectMatrixViolation('dayTour', 'group', [{ _ref: 'id-alexandria' }], cityIdToSlug);
console.log('  group dayTour in alexandria:', v1 ? `VIOLATION cities=${v1.cities.join(',')}` : 'no violation');
const v2 = detectMatrixViolation('dayTour', 'group', [{ _ref: 'id-cairo' }], cityIdToSlug);
console.log('  group dayTour in cairo:', v2 ? `VIOLATION` : 'no violation (expected)');
const v3 = detectMatrixViolation('dayTour', 'private', [{ _ref: 'id-alexandria' }], cityIdToSlug);
console.log('  private dayTour in alexandria:', v3 ? `VIOLATION` : 'no violation (expected — private bypasses matrix)');
const v4 = detectMatrixViolation('package', 'group', [{ _ref: 'id-alexandria' }], cityIdToSlug);
console.log('  package in alexandria:', v4 ? `VIOLATION` : 'no violation (expected — packages bypass matrix)');
