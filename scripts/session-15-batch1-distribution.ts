/**
 * Simulate mapper's city-prefix + tourMode resolution against the 155 slug list
 * to surface distribution before the --commit run.
 */
import { readFileSync } from 'node:fs';
import { resolveTopLevelCities } from './wp-import/mappers/tour.js';

const CITY_SLUGS = [
  'abu-simbel','akhmim','al-fayoum','al-arish','al-minya','al-quseir','wadi-el-natrun','al-gouna',
  'alexandria','aswan','asyut','bahariya-oasis','baris','beni-suef','dakhla-oasis','edfu','esna',
  'farafra-oasis','giza','hurghada','ismailia','kharga-oasis','kom-ombo','luxor','marsa-alam',
  'marsa-matruh','nuweiba','port-said','qena','ras-sudr','rosetta-rasheed','safaga','saint-catherine',
  'sharm-el-sheikh','siwa-oasis','sohag','suez','taba','al-wadi-al-gadid','dahab','cairo',
];

const SLUG_CITY_OVERRIDES: Record<string, string> = {
  'snorkeling-adventure-on-the-nefertari-submarine': 'marsa-alam',
};

const ALLOWED_GROUP_DAYTOUR_CITIES = new Set([
  'aswan','cairo','hurghada','luxor','marsa-alam','sharm-el-sheikh',
]);

function daysFromSlug(slug: string): number {
  const m = /^(\d+)-?days?-/.exec(slug) ?? /(\d+)-day-/.exec(slug);
  return m ? Number(m[1]) : 0;
}

function classifyType(slug: string): 'dayTour' | 'package' {
  const isPackage =
    /-package(-|$)|-vacation(-|$)|-itinerary(-|$)|cruise-vacation/.test(slug) ||
    daysFromSlug(slug) > 7;
  return isPackage ? 'package' : 'dayTour';
}

const cityRefsMap = new Map<string, string>();
for (const s of CITY_SLUGS) cityRefsMap.set(s, `id-${s}`);

function resolveCity(slug: string): { cities: string[]; source: 'override' | 'full-slug-scan' | 'default-cairo' } {
  const r = resolveTopLevelCities(slug, cityRefsMap);
  return { cities: r.cities.map((c) => c._ref.replace(/^id-/, '')), source: r.resolution };
}

function tourMode(slug: string, type: 'dayTour' | 'package'): 'private' | 'group' | undefined {
  if (type === 'package') return undefined;
  if (/-private-car-and-guide$/.test(slug)) return 'private';
  return 'group';
}

const slugsCsv = readFileSync('migration/sessions/session-15-audit/batch-1-daytour-slugs.txt', 'utf8');
const slugs = slugsCsv.split(',');
console.log(`Slugs in batch: ${slugs.length}`);

const cityHits: Record<string, number> = {};
const sourceHits: Record<string, number> = { 'override': 0, 'full-slug-scan': 0, 'default-cairo': 0 };
const modeHits: Record<string, number> = { 'private': 0, 'group': 0, 'package(unset)': 0 };
const multiCityHist: Record<number, number> = {};
const matrixViolations: Array<{ slug: string; cities: string[] }> = [];

const samples: Array<{ slug: string; cities: string[]; source: string; mode?: string; days: number }> = [];

for (const s of slugs) {
  const type = classifyType(s);
  const { cities, source } = resolveCity(s);
  const mode = tourMode(s, type);
  // Count each city in the array (a multi-city tour contributes to multiple cities)
  for (const c of cities) cityHits[c] = (cityHits[c] ?? 0) + 1;
  sourceHits[source]++;
  modeHits[mode ?? 'package(unset)']++;
  multiCityHist[cities.length] = (multiCityHist[cities.length] ?? 0) + 1;
  // Matrix check: any of the resolved cities outside allowed set?
  if (mode === 'group' && type === 'dayTour') {
    const offending = cities.filter((c) => !ALLOWED_GROUP_DAYTOUR_CITIES.has(c));
    if (offending.length > 0) matrixViolations.push({ slug: s, cities: offending });
  }
  if (samples.length < 10) samples.push({ slug: s, cities, source, mode, days: daysFromSlug(s) });
}

console.log('\nCity hit counts (city appears in N tour docs; multi-city tours count toward each):');
for (const [k, v] of Object.entries(cityHits).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  console.log(`  ${String(v).padStart(4)}  ${k}`);
}
console.log('\nCity resolution source (per doc):');
for (const [k, v] of Object.entries(sourceHits)) console.log(`  ${String(v).padStart(4)}  ${k}`);
console.log('\ncities[] length distribution:');
for (const [n, count] of Object.entries(multiCityHist).sort()) console.log(`  ${count} doc(s) have ${n} city ref(s)`);
console.log('\nTour mode:');
for (const [k, v] of Object.entries(modeHits)) console.log(`  ${String(v).padStart(4)}  ${k}`);
console.log(`\nMatrix violations (group dayTour with any city outside allowed set): ${matrixViolations.length}`);
for (const v of matrixViolations.slice(0, 25)) console.log(`  [${v.cities.join(',')}]  ${v.slug}`);
if (matrixViolations.length > 25) console.log(`  ... +${matrixViolations.length - 25} more`);

console.log('\nFirst 10 samples:');
for (const s of samples) console.log(`  ${s.slug}\n    cities=[${s.cities.join(', ')}]  (${s.source})  mode=${s.mode}  days=${s.days}`);
