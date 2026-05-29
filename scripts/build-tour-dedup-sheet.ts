/**
 * READ-ONLY. Emits a human-review sheet for tour dedup.
 *
 * The old→new pairing below was hand-curated by reading both catalogs
 * (token scoring proved unreliable — see session notes). Each orphan
 * (published wp-page-* tour, EN body, no ES body) maps to either:
 *   - a corpus tour.* EN slug  → proposed REDIRECT+UNPUBLISH
 *   - 'UNIQUE'                 → KEEP + flag for ES translation
 *
 * Confidence: HIGH (clear twin), MED (plausible, verify), UNIQUE.
 * The script validates that every live orphan is covered by the map and
 * that every corpus target exists, then writes a CSV for the operator to
 * confirm/correct/strike before any destructive write runs.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';

loadEnv();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  perspective: 'published',
  token: process.env.SANITY_API_READ_TOKEN || process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

// orphan EN slug -> [corpus EN slug | 'UNIQUE', confidence]
const MAP: Record<string, [string, 'HIGH' | 'MED' | 'UNIQUE']> = {
  // ---- country-variant packages & themed editions: unique, no corpus twin ----
  'luxor-to-cairo-egypt-nile-cruise-vacation': ['UNIQUE', 'UNIQUE'],
  '11-day-luxor-to-cairo-egypt-nile-cruise-vacation': ['UNIQUE', 'UNIQUE'],
  'egypt-nile-cruise-vacation-from-india': ['UNIQUE', 'UNIQUE'],
  '12-day-red-sea-desert-friends-escape': ['UNIQUE', 'UNIQUE'],
  '18-day-grand-egypt-holiday-package': ['UNIQUE', 'UNIQUE'],
  '3-days-cairo-highlights-for-friends': ['UNIQUE', 'UNIQUE'],
  '5-days-cairo-luxor-romance-edition': ['UNIQUE', 'UNIQUE'],
  '9-days-cairo-st-catherine-sharm-el-sheikh': ['UNIQUE', 'UNIQUE'],
  '9-days-red-sea-desert-escape': ['UNIQUE', 'UNIQUE'],
  'cairo-in-3-days-insider-edition-solo-traveller': ['UNIQUE', 'UNIQUE'],
  'nile-in-5-days-luxor-aswan-solo-traveller': ['UNIQUE', 'UNIQUE'],
  'desert-oasis-siwa-retreat-solo-traveller': ['UNIQUE', 'UNIQUE'],
  'nile-love-journey-luxor-aswan': ['UNIQUE', 'UNIQUE'],
  'bahariya-and-siwa-oasis-vacation': ['UNIQUE', 'UNIQUE'],
  '8-day-customized-aswan-travel-deal': ['UNIQUE', 'UNIQUE'],
  '10-day-romantic-egypt-travel-deals': ['UNIQUE', 'UNIQUE'],
  'egypt-escape-4-day-cairo-travel-package-from-australia': ['UNIQUE', 'UNIQUE'],
  '4-day-cairo-travel-package': ['UNIQUE', 'UNIQUE'],
  // ---- unique day-tours/packages with no corpus equivalent ----
  '2-day-desert-nature-wildlife-retreat': ['UNIQUE', 'UNIQUE'],
  '3-day-nubian-fishing-safari': ['UNIQUE', 'UNIQUE'],
  'siwa-oasis-adventure-tour': ['UNIQUE', 'UNIQUE'],
  '3-day-siwa-journey-from-alexandria': ['UNIQUE', 'UNIQUE'],
  '4-day-ultimate-lake-nasser-experience': ['UNIQUE', 'UNIQUE'],
  '7-days-in-egypt-pyramids-temples-and-timeless-wonders': ['UNIQUE', 'UNIQUE'],
  'aswan-and-abu-simbel-from-luxor': ['UNIQUE', 'UNIQUE'],
  'luxor-2-day-tour-by-plane-from-cairo': ['UNIQUE', 'UNIQUE'],
  'aswan-to-el-kab-and-edfu-temple-tour': ['UNIQUE', 'UNIQUE'],
  'cairo-and-alexandria-4-days-family-package': ['UNIQUE', 'UNIQUE'],
  'cairo-and-nile-cruise-8-day-family-package': ['UNIQUE', 'UNIQUE'],
  '2-day-pyramids-mediterranean-tour': ['UNIQUE', 'UNIQUE'],
  'group-day-trip-to-cairo-from-safaga': ['UNIQUE', 'UNIQUE'],
  'private-tour-2-day-trip-to-bahariya-oasis': ['UNIQUE', 'UNIQUE'],
  'shared-seas-full-day-snorkeling-tour': ['UNIQUE', 'UNIQUE'],
  'exclusive-chartered-experience-private-boat-journey-to-orange-bay': ['UNIQUE', 'UNIQUE'],
  'fayoum-desert-adventure': ['UNIQUE', 'UNIQUE'],
  'group-day-tour-to-cairo-from-al-gouna': ['UNIQUE', 'UNIQUE'],
  'private-tour-2-days-1-night-trip-to-saint-catherine-from-cairo': ['UNIQUE', 'UNIQUE'],
  'private-tour-nubian-village-with-motor-boat': ['UNIQUE', 'UNIQUE'],
  'ramasside-tours': ['UNIQUE', 'UNIQUE'],
  'skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience': ['UNIQUE', 'UNIQUE'],
  'sunrise-hot-air-balloon-ride-over-luxors-ancient-landmarks': ['UNIQUE', 'UNIQUE'],
  '10-days-eternal-egypt-tour': ['UNIQUE', 'UNIQUE'],
  // ---- HIGH-confidence twins ----
  'abu-simbel-by-plane-from-aswan': ['abu-simble-by-plane-from-aswan', 'HIGH'],
  'abu-simbel-car-day-tour-from-aswan': ['private-tour-abu-simble-by-bus-from-aswan', 'HIGH'],
  'alexandria-day-tour': ['alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo', 'HIGH'],
  'aswan-city-tour-from-marsa-alam-small-group-tour': ['aswan-city-tour-from-marsa-alam', 'HIGH'],
  'cairo-day-tour-from-alexandria': ['alexandria-to-cairo-private-day-tour-of-giza-pyramids-sphinx-egyptian-museum-khan-el-khalili', 'HIGH'],
  'group-trip-to-cairo-by-bus-from-hurghada': ['cairo-by-bus-group-day-tour-from-hurghada', 'HIGH'],
  'shared-snorkeling-day-at-giftun-island': ['giftun-island-shared-snorkeling-day-from-hurghada', 'HIGH'],
  'dendera-and-abydos-temples-tour-from-safaga': ['dendera-and-abydos-temples-day-tour', 'HIGH'],
  'desert-quad-bike-safari-from-hurghada': ['desert-quad-bike-safari-to-bedouin-village-from-hurghada', 'HIGH'],
  'group-day-tour-of-the-pyramids-and-sphinx': ['pyramids-of-giza-and-sphinx-group-day-tour', 'HIGH'],
  'grand-islamic-cairo-day-tour': ['islamic-cairo-day-tour', 'HIGH'],
  'karnak-luxor-temples-and-museum-day-tour': ['day-tour-to-karnak-luxor-temples-luxor-museum', 'HIGH'],
  'luxor-full-day-tour-from-hurghada': ['luxor-day-tour-from-hurghadafull-day', 'HIGH'],
  'group-tour-luxor-hurghada': ['luxor-highlights-group-day-tour-from-hurghada', 'HIGH'],
  'abu-simbel-temples-day-tour': ['abu-simbel-temples-day-tour-from-aswan', 'HIGH'],
  'private-snorkeling-adventure-in-marsa-alam': ['group-snorkeling-adventure-in-marsa-alam', 'HIGH'],
  'marsa-alam-to-cairo-small-group-tour-full-day-by-plane': ['marsa-alam-to-cairo-full-day-tour-by-plane', 'HIGH'],
  'memphis-saqqara-dahshur-tour-from-alexandria': ['private-day-trip-to-memphis-saqqara-and-dahshur-from-alexandria', 'HIGH'],
  'memphis-saqqara-citadel-khan-tour': ['private-tour-memphis-saqqara-citadel-and-khan-el-khalili-bazaar', 'HIGH'],
  'mount-sinai-sunrise-trek': ['mount-sinai-sunrise-trek-group-day-tour', 'HIGH'],
  'private-car-transfer-from-aswan-to-luxor': ['private-tour-transfer-from-aswan-to-luxor-by-bus', 'HIGH'],
  'esna-edfu-kom-ombo-day-tour': ['esna-edfu-kom-ombo-temples-group-day-tour-from-luxor', 'HIGH'],
  'group-day-tour-to-memphis-saqqara-and-dahshur': ['memphis-saqqara-and-dahshur-group-day-tour', 'HIGH'],
  'dendera-and-abydos-temples-from-hurghada': ['dendera-and-abydos-temple-day-tour-from-hurghada', 'HIGH'],
  'private-tour-transfer-from-luxor-to-hurghada-by-car': ['private-tour-transfer-from-luxor-to-hurghada-by-bus', 'HIGH'],
  'pyramids-of-giza-sphinx-memphis-and-saqqara-tour': ['private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara', 'HIGH'],
  'pyramids-of-giza-sphinx-egyptian-museum-khan-el-khalili-tour': ['private-tour-pyramids-of-giza-sphinx-egyptian-museum-and-khan-el-khalili-bazaar', 'HIGH'],
  'snorkeling-sea-trip-in-sharm-el-sheikh': ['diving-sea-trip-in-sharm-el-sheikh', 'HIGH'],
  'temples-of-time-day-tour-to-nubian-temples-from-aswan': ['nubian-temples-day-tour-from-aswan', 'HIGH'],
  'desert-rides-hurghada-quad-bike-adventure': ['hurghada-quad-bike-tour', 'HIGH'],
  'the-grand-west-bank-tour': ['grand-west-bank-group-day-tour-luxor', 'HIGH'],
  // ---- MED-confidence: plausible twin, verify by eye ----
  'ancient-egypt-and-the-red-sea-tour': ['egypt-and-the-red-sea-paradise', 'MED'],
  'cairo-group-tour': ['private-tour-pyramids-of-giza-sphinx-egyptian-museum-and-khan-el-khalili-bazaar', 'MED'],
  'day-tour-to-visit-cairo-from-alexandria': ['alexandria-to-cairo-private-day-tour-of-giza-pyramids-sphinx-egyptian-museum-khan-el-khalili', 'MED'],
  'bahariya-oasis-and-white-desert-3-day-tour': ['the-white-desert-and-djara-cave', 'MED'],
  'half-day-tour-of-luxor-karnak-temples': ['day-tour-to-karnak-luxor-temples-luxor-museum', 'MED'],
  'safaga-to-luxor-full-day-group-ancient-city-adventure': ['luxor-day-tour-from-hurghadafull-day', 'MED'],
  'fayoum-oasis-and-beni-suef-pyramids-tour': ['fayoum-meidum-hawara-pyramids-group-day-tour', 'MED'],
  'dendera-and-abydos-temple-tour-hurghada': ['dendera-and-abydos-temple-day-tour-from-hurghada', 'MED'],
  'group-day-tour-to-kom-ombo-and-edfu-temples-from-aswan': ['esna-edfu-kom-ombo-temples-group-day-tour-from-luxor', 'MED'],
  'private-tour-valley-of-kings-temples-day-tour': ['grand-west-bank-group-day-tour-luxor', 'MED'],
};

interface Doc { _id: string; enSlug: string; enTitle: string; esSlug: string | null }

const csvCell = (s: string | null | undefined) => {
  const v = (s ?? '').replace(/"/g, '""');
  return /[",\n]/.test(v) ? `"${v}"` : v;
};

async function main() {
  const broken = await client.fetch<Doc[]>(`*[_type=="tour" && !(_id in path("drafts.**")) && _id match "wp-page-*" &&
    defined(body[_key=="en"][0].value) && !defined(body[_key=="es"][0].value)]{
    _id, "enSlug": slug[_key=="en"][0].value.current, "enTitle": title[_key=="en"][0].value,
    "esSlug": slug[_key=="es"][0].value.current }`);
  const corpus = await client.fetch<Doc[]>(`*[_type=="tour" && !(_id in path("drafts.**")) && _id match "tour.*"]{
    _id, "enSlug": slug[_key=="en"][0].value.current, "enTitle": title[_key=="en"][0].value,
    "esSlug": slug[_key=="es"][0].value.current }`);

  const corpusBySlug = new Map(corpus.map((c) => [c.enSlug, c]));

  // Validate coverage.
  const uncovered = broken.filter((o) => !MAP[o.enSlug]);
  if (uncovered.length) {
    console.error(`✗ ${uncovered.length} live orphan(s) missing from MAP — fix before trusting the sheet:`);
    for (const o of uncovered) console.error(`    ${o.enSlug}  ("${o.enTitle}")`);
  }
  const staleKeys = Object.keys(MAP).filter((k) => !broken.find((o) => o.enSlug === k));
  if (staleKeys.length) {
    console.error(`\n⚠ ${staleKeys.length} MAP key(s) no longer match a live orphan (already handled?):`);
    for (const k of staleKeys) console.error(`    ${k}`);
  }
  const badTargets = Object.entries(MAP).filter(([, [t]]) => t !== 'UNIQUE' && !corpusBySlug.has(t));
  if (badTargets.length) {
    console.error(`\n✗ ${badTargets.length} target slug(s) not found in corpus:`);
    for (const [k, [t]] of badTargets) console.error(`    ${k} -> ${t}`);
  }

  // Collision detection: corpus targets claimed by >1 orphan.
  const claims = new Map<string, string[]>();
  for (const o of broken) {
    const m = MAP[o.enSlug];
    if (m && m[0] !== 'UNIQUE') (claims.get(m[0]) ?? claims.set(m[0], []).get(m[0])!).push(o.enSlug);
  }

  const lines: string[] = [];
  lines.push('decision,confidence,action,old_en_title,old_en_slug,old_es_slug,proposed_corpus_title,proposed_corpus_en_slug,collision,old_id,new_id');
  const rows = broken
    .map((o) => ({ o, m: MAP[o.enSlug] }))
    .sort((a, b) => {
      const rank = (c?: string) => (c === 'HIGH' ? 0 : c === 'MED' ? 1 : 2);
      return rank(a.m?.[1]) - rank(b.m?.[1]) || a.o.enTitle.localeCompare(b.o.enTitle);
    });
  for (const { o, m } of rows) {
    const target = m?.[0];
    const conf = m?.[1] ?? 'UNCOVERED';
    const unique = !target || target === 'UNIQUE';
    const c = unique ? null : corpusBySlug.get(target)!;
    const action = unique ? 'KEEP+TRANSLATE' : 'REDIRECT+UNPUBLISH';
    const collision = !unique && (claims.get(target!)?.length ?? 0) > 1 ? `shared:${claims.get(target!)!.length}` : '';
    lines.push([
      '', conf, action,
      csvCell(o.enTitle), csvCell(o.enSlug), csvCell(o.esSlug),
      csvCell(c?.enTitle), csvCell(c?.enSlug), collision,
      csvCell(o._id), csvCell(c?._id),
    ].join(','));
  }

  fs.writeFileSync('migration/tour-dedup-sheet.csv', lines.join('\n') + '\n');

  const n = (c: string) => rows.filter((r) => r.m?.[1] === c).length;
  console.log(`\nWrote migration/tour-dedup-sheet.csv`);
  console.log(`  orphans=${broken.length}  HIGH=${n('HIGH')}  MED=${n('MED')}  UNIQUE=${n('UNIQUE')}`);
  console.log(`  collisions (corpus doc claimed by >1 orphan): ${[...claims].filter(([, v]) => v.length > 1).length}`);
  for (const [t, v] of claims) if (v.length > 1) console.log(`    ${t}  <-  ${v.join(', ')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
