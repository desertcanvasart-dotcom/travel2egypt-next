/**
 * Appends tour-dedup redirect rows to migration/redirect-map.csv (idempotent),
 * then the operator runs `npm run redirect-map:regenerate` to emit generated.ts.
 *
 * Sources  = each old doc's PUBLISHED slug per locale (en always; es/ja if set).
 * Dest     = target's slug per locale, with en fallback (matches slugLookupQuery),
 *            so /es/<x> and /ja/<x> always resolve.
 *
 * SET A (old -> corpus tour) + SET B (old -> landing/tour). SET C has no redirect.
 * Does NOT unpublish anything — redirects only.
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

loadEnv();

const CSV = join(process.cwd(), 'migration/redirect-map.csv');
const HOST = 'https://travel2egypt.org';
const PRIORITY = '50.00';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  perspective: 'published',
  token:
    process.env.SANITY_API_READ_TOKEN ||
    process.env.SANITY_STAGING_API_WRITE_TOKEN ||
    process.env.SANITY_API_WRITE_TOKEN,
});

const SET_A: Record<string, string> = {
  'abu-simbel-by-plane-from-aswan': 'abu-simble-by-plane-from-aswan',
  'abu-simbel-car-day-tour-from-aswan': 'private-tour-abu-simble-by-bus-from-aswan',
  'alexandria-day-tour': 'alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo',
  'aswan-city-tour-from-marsa-alam-small-group-tour': 'aswan-city-tour-from-marsa-alam',
  'cairo-day-tour-from-alexandria': 'alexandria-to-cairo-private-day-tour-of-giza-pyramids-sphinx-egyptian-museum-khan-el-khalili',
  'group-trip-to-cairo-by-bus-from-hurghada': 'cairo-by-bus-group-day-tour-from-hurghada',
  'shared-snorkeling-day-at-giftun-island': 'giftun-island-shared-snorkeling-day-from-hurghada',
  'dendera-and-abydos-temples-tour-from-safaga': 'dendera-and-abydos-temples-day-tour',
  'desert-quad-bike-safari-from-hurghada': 'desert-quad-bike-safari-to-bedouin-village-from-hurghada',
  'group-day-tour-of-the-pyramids-and-sphinx': 'pyramids-of-giza-and-sphinx-group-day-tour',
  'karnak-luxor-temples-and-museum-day-tour': 'day-tour-to-karnak-luxor-temples-luxor-museum',
  'luxor-full-day-tour-from-hurghada': 'luxor-day-tour-from-hurghadafull-day',
  'group-tour-luxor-hurghada': 'luxor-highlights-group-day-tour-from-hurghada',
  'abu-simbel-temples-day-tour': 'abu-simbel-temples-day-tour-from-aswan',
  'private-snorkeling-adventure-in-marsa-alam': 'group-snorkeling-adventure-in-marsa-alam',
  'marsa-alam-to-cairo-small-group-tour-full-day-by-plane': 'marsa-alam-to-cairo-full-day-tour-by-plane',
  'memphis-saqqara-dahshur-tour-from-alexandria': 'private-day-trip-to-memphis-saqqara-and-dahshur-from-alexandria',
  'mount-sinai-sunrise-trek': 'mount-sinai-sunrise-trek-group-day-tour',
  'private-car-transfer-from-aswan-to-luxor': 'private-tour-transfer-from-aswan-to-luxor-by-bus',
  'esna-edfu-kom-ombo-day-tour': 'esna-edfu-kom-ombo-temples-group-day-tour-from-luxor',
  'group-day-tour-to-memphis-saqqara-and-dahshur': 'memphis-saqqara-and-dahshur-group-day-tour',
  'dendera-and-abydos-temples-from-hurghada': 'dendera-and-abydos-temple-day-tour-from-hurghada',
  'private-tour-transfer-from-luxor-to-hurghada-by-car': 'private-tour-transfer-from-luxor-to-hurghada-by-bus',
  'pyramids-of-giza-sphinx-memphis-and-saqqara-tour': 'private-tour-pyramids-of-giza-sphinx-memphis-and-saqqara',
  'pyramids-of-giza-sphinx-egyptian-museum-khan-el-khalili-tour': 'private-tour-pyramids-of-giza-sphinx-egyptian-museum-and-khan-el-khalili-bazaar',
  'snorkeling-sea-trip-in-sharm-el-sheikh': 'diving-sea-trip-in-sharm-el-sheikh',
  'temples-of-time-day-tour-to-nubian-temples-from-aswan': 'nubian-temples-day-tour-from-aswan',
  'desert-rides-hurghada-quad-bike-adventure': 'hurghada-quad-bike-tour',
  'the-grand-west-bank-tour': 'grand-west-bank-group-day-tour-luxor',
  'cairo-group-tour': 'private-tour-pyramids-of-giza-sphinx-egyptian-museum-and-khan-el-khalili-bazaar',
  'day-tour-to-visit-cairo-from-alexandria': 'alexandria-to-cairo-private-day-tour-of-giza-pyramids-sphinx-egyptian-museum-khan-el-khalili',
  'bahariya-oasis-and-white-desert-3-day-tour': 'the-white-desert-and-djara-cave',
  'half-day-tour-of-luxor-karnak-temples': 'day-tour-to-karnak-luxor-temples-luxor-museum',
  'fayoum-oasis-and-beni-suef-pyramids-tour': 'fayoum-meidum-hawara-pyramids-group-day-tour',
  'dendera-and-abydos-temple-tour-hurghada': 'dendera-and-abydos-temple-day-tour-from-hurghada',
  'group-day-tour-to-kom-ombo-and-edfu-temples-from-aswan': 'esna-edfu-kom-ombo-temples-group-day-tour-from-luxor',
  'private-tour-valley-of-kings-temples-day-tour': 'grand-west-bank-group-day-tour-luxor',
};

const SET_B: Record<string, string> = {
  '11-day-luxor-to-cairo-egypt-nile-cruise-vacation': 'egypt-group-tours-from-usa-canada',
  '12-day-red-sea-desert-friends-escape': 'egypt-and-the-red-sea-paradise',
  'group-day-trip-to-cairo-from-safaga': 'hurghada-small-group-day-tours',
  'group-day-tour-to-cairo-from-al-gouna': 'hurghada-small-group-day-tours',
  '5-days-cairo-luxor-romance-edition': 'marriott-mena-house-4-days-stay',
  '9-days-cairo-st-catherine-sharm-el-sheikh': '11-day-explore-egypt-and-red-sea-tour',
  '9-days-red-sea-desert-escape': 'multiday-adventure-and-safari-tours',
  'cairo-in-3-days-insider-edition-solo-traveller': 'the-elegant-cairo-4-days-tour',
  'desert-oasis-siwa-retreat-solo-traveller': '3-day-siwa-journey-from-alexandria',
  'nile-in-5-days-luxor-aswan-solo-traveller': '5-day-river-cruise-from-luxor',
};

const SLUGS = `{ "id": _id, "en": slug[_key=="en"][0].value.current, "es": slug[_key=="es"][0].value.current, "ja": slug[_key=="ja"][0].value.current }`;
type Doc = { id: string; en: string | null; es: string | null; ja: string | null } | null;

async function bySlug(en: string): Promise<Doc> {
  return client.fetch(`*[!(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$s][0]${SLUGS}`, { s: en });
}

function wpId(id: string): string {
  const m = id.match(/wp-page-(\d+)/);
  return m ? m[1] : '';
}

async function main() {
  const existing = readFileSync(CSV, 'utf8');
  const existingSources = new Set(
    existing.split(/\r?\n/).slice(1).filter(Boolean).map((l) => l.split(',')[0])
  );

  const rows: string[] = [];
  let skipped = 0;

  async function emitPair(oldEn: string, targetEn: string) {
    const oldD = await bySlug(oldEn);
    const tgt = await bySlug(targetEn);
    if (!oldD || !tgt) { console.error(`!! missing old=${oldEn} (${!!oldD}) tgt=${targetEn} (${!!tgt})`); return; }
    const legacy = wpId(oldD.id);
    const locales: Array<['en' | 'es' | 'ja', string | null, string]> = [
      ['en', oldD.en, `/${tgt.en}`],
      ['es', oldD.es, `/es/${tgt.es ?? tgt.en}`],
      ['ja', oldD.ja, `/ja/${tgt.ja ?? tgt.en}`],
    ];
    for (const [loc, oldSlug, dest] of locales) {
      if (!oldSlug) continue;
      const prefix = loc === 'en' ? '' : `/${loc}`;
      const from = `${HOST}${prefix}/${oldSlug}/`;
      if (existingSources.has(from)) { skipped++; continue; }
      rows.push([from, dest, loc, '301', legacy, PRIORITY].join(','));
    }
  }

  for (const [o, t] of Object.entries(SET_A)) await emitPair(o, t);
  for (const [o, t] of Object.entries(SET_B)) await emitPair(o, t);

  if (rows.length === 0) {
    console.log(`No new rows (skipped ${skipped} already present).`);
    return;
  }
  appendFileSync(CSV, rows.join('\n') + '\n');
  console.log(`Appended ${rows.length} rows to migration/redirect-map.csv (skipped ${skipped} dup sources).`);
  console.log('Next: npm run redirect-map:regenerate');
}

main().catch((e) => { console.error(e); process.exit(1); });
