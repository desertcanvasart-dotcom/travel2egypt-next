/** Smoke-test the new full-slug city resolver against 10 known slugs. */
import { resolveTopLevelCities } from './wp-import/mappers/tour.js';

const CITY_SLUGS = [
  'abu-simbel','akhmim','al-fayoum','al-arish','al-minya','al-quseir','wadi-el-natrun','al-gouna',
  'alexandria','aswan','asyut','bahariya-oasis','baris','beni-suef','dakhla-oasis','edfu','esna',
  'farafra-oasis','giza','hurghada','ismailia','kharga-oasis','kom-ombo','luxor','marsa-alam',
  'marsa-matruh','nuweiba','port-said','qena','ras-sudr','rosetta-rasheed','safaga','saint-catherine',
  'sharm-el-sheikh','siwa-oasis','sohag','suez','taba','al-wadi-al-gadid','dahab','cairo',
];

const map = new Map<string, string>();
for (const s of CITY_SLUGS) map.set(s, `id-${s}`);

const cases: Array<{ slug: string; expected: string[] }> = [
  { slug: 'cairo-day-tour-from-alexandria', expected: ['cairo', 'alexandria'] },
  { slug: 'desert-oasis-siwa-retreat-solo-traveller', expected: ['siwa-oasis'] }, // siwa-oasis not "siwa" — but inventory has only "siwa-oasis", so "siwa" alone is NOT in inventory and won't match. Note: slug contains "siwa-retreat" — "siwa-oasis" won't match because "oasis" isn't there.
  { slug: 'aswan-and-abu-simbel-from-luxor', expected: ['aswan', 'abu-simbel', 'luxor'] },
  { slug: 'nile-in-5-days-luxor-aswan-solo-traveller', expected: ['luxor', 'aswan'] },
  { slug: 'pyramids-of-giza-and-grand-egyptian-museum', expected: ['giza'] },
  { slug: 'cairo-in-3-days-insider-edition-solo-traveller', expected: ['cairo'] },
  { slug: 'safaga-to-luxor-full-day-ancient-city-exploration', expected: ['safaga', 'luxor'] },
  { slug: 'alexandria-day-tour', expected: ['alexandria'] },
  { slug: 'abu-simbel-temples-day-tour', expected: ['abu-simbel'] },
  { slug: 'esna-edfu-kom-ombo-day-tour', expected: ['esna', 'edfu', 'kom-ombo'] },
];

let pass = 0, fail = 0;
for (const c of cases) {
  const { cities, resolution } = resolveTopLevelCities(c.slug, map);
  const got = cities.map((r) => r._ref.replace(/^id-/, ''));
  const ok = JSON.stringify(got) === JSON.stringify(c.expected);
  console.log(`${ok ? '✓' : '✗'}  ${c.slug}`);
  console.log(`     expected: [${c.expected.join(', ')}]`);
  console.log(`     got:      [${got.join(', ')}]  (resolution=${resolution})`);
  if (ok) pass++; else fail++;
}
console.log(`\n${pass}/${cases.length} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
