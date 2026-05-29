/**
 * READ-ONLY. Validates the operator's revised dedup decisions against live
 * Sanity data and previews the redirect rows + unpublish list before any
 * destructive write. Emits nothing to disk except stdout.
 *
 *   SET A  redirect old -> corpus tour (then unpublish old)
 *   SET B  redirect old -> a landing / category / other tour (then unpublish old)
 *   SET C  unpublish old, no redirect ("delete entirely" -> safe unpublish)
 *
 * For each old doc we fetch its PUBLISHED slugs (en/es/ja) = redirect sources.
 * For each target we fetch its PUBLISHED slugs = redirect destinations, using
 * the same resolution rule as slugLookupQuery (locale slug, else en fallback).
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

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

// SET A: old_en_slug -> corpus_en_slug  (redirect + unpublish)
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
  // MED
  'cairo-group-tour': 'private-tour-pyramids-of-giza-sphinx-egyptian-museum-and-khan-el-khalili-bazaar',
  'day-tour-to-visit-cairo-from-alexandria': 'alexandria-to-cairo-private-day-tour-of-giza-pyramids-sphinx-egyptian-museum-khan-el-khalili',
  'bahariya-oasis-and-white-desert-3-day-tour': 'the-white-desert-and-djara-cave',
  'half-day-tour-of-luxor-karnak-temples': 'day-tour-to-karnak-luxor-temples-luxor-museum',
  'fayoum-oasis-and-beni-suef-pyramids-tour': 'fayoum-meidum-hawara-pyramids-group-day-tour',
  'dendera-and-abydos-temple-tour-hurghada': 'dendera-and-abydos-temple-day-tour-from-hurghada',
  'group-day-tour-to-kom-ombo-and-edfu-temples-from-aswan': 'esna-edfu-kom-ombo-temples-group-day-tour-from-luxor',
  'private-tour-valley-of-kings-temples-day-tour': 'grand-west-bank-group-day-tour-luxor',
};

// SET B: old_en_slug -> target path (root slug). redirect + unpublish.
const SET_B: Record<string, string> = {
  '11-day-luxor-to-cairo-egypt-nile-cruise-vacation': 'egypt-group-tours-from-usa-canada',
  '12-day-red-sea-desert-friends-escape': 'egypt-and-the-red-sea-paradise',
  'group-day-trip-to-cairo-from-safaga': 'hurghada-small-group-day-tours',
  'group-day-tour-to-cairo-from-al-gouna': 'hurghada-small-group-day-tours',
  '5-days-cairo-luxor-romance-edition': 'marriott-mena-house-4-days-stay',
  '9-days-cairo-st-catherine-sharm-el-sheikh': '11-day-explore-egypt-and-red-sea-tour',
  '9-days-red-sea-desert-escape': '__ADVENTURE_CATEGORY__', // resolve below
  'cairo-in-3-days-insider-edition-solo-traveller': 'the-elegant-cairo-4-days-tour',
  'desert-oasis-siwa-retreat-solo-traveller': '3-day-siwa-journey-from-alexandria',
  'nile-in-5-days-luxor-aswan-solo-traveller': '5-day-river-cruise-from-luxor',
};

// SET C: old_en_slug -> unpublish, no redirect ("delete entirely")
const SET_C: string[] = [
  'luxor-to-cairo-egypt-nile-cruise-vacation', // 43 Australia
  'egypt-nile-cruise-vacation-from-india', // 45
  '18-day-grand-egypt-holiday-package', // 47
  '8-day-customized-aswan-travel-deal', // 57
  'egypt-escape-4-day-cairo-travel-package-from-australia', // 71
  '4-day-cairo-travel-package', // 72
  '10-day-romantic-egypt-travel-deals', // 76
  '3-days-cairo-highlights-for-friends', // 50
];

const SLUGS = `{
  "id": _id, _type,
  "en": slug[_key=="en"][0].value.current,
  "es": slug[_key=="es"][0].value.current,
  "ja": slug[_key=="ja"][0].value.current
}`;

async function lookup(enSlug: string) {
  // Published doc whose EN slug matches.
  return client.fetch(
    `*[!(_id in path("drafts.**")) && slug[_key=="en"][0].value.current == $s][0]${SLUGS}`,
    { s: enSlug }
  );
}

async function main() {
  // Resolve adventure category slug
  const cats = await client.fetch<Array<{ key: string; en: string; es: string; ja: string; title: string }>>(
    `*[_type=="tourCategory" && !(_id in path("drafts.**"))]{ key, "title": title[_key=="en"][0].value, "en": slug[_key=="en"][0].value.current, "es": slug[_key=="es"][0].value.current, "ja": slug[_key=="ja"][0].value.current }`
  );
  console.log('=== tourCategory docs (to pick adventure category) ===');
  for (const c of cats) console.log(`  [${c.key}] "${c.title}"  en=${c.en} es=${c.es ?? '-'} ja=${c.ja ?? '-'}`);

  // Check landing targets exist
  const landingTargets = ['egypt-group-tours-from-usa-canada', 'hurghada-small-group-day-tours', 'egypt-group-tours-from-uk-europe', 'egypt-group-tours-from-japan'];
  console.log('\n=== landing/category targets (existence) ===');
  for (const t of landingTargets) {
    const d = await client.fetch(`*[!(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$s][0]{_type,"id":_id}`, { s: t });
    console.log(`  ${t}: ${d ? d._type + ' ' + d.id : '*** NOT FOUND ***'}`);
  }

  // Tour targets used in SET B
  const tourTargets = ['egypt-and-the-red-sea-paradise', 'marriott-mena-house-4-days-stay', '11-day-explore-egypt-and-red-sea-tour', 'the-elegant-cairo-4-days-tour', '3-day-siwa-journey-from-alexandria', '5-day-river-cruise-from-luxor'];
  console.log('\n=== SET B tour targets (existence + slugs) ===');
  for (const t of tourTargets) {
    const d = await lookup(t);
    console.log(`  ${t}: ${d ? `${d._type} en=${d.en} es=${d.es ?? '-'} ja=${d.ja ?? '-'}` : '*** NOT FOUND ***'}`);
  }

  // SET A
  console.log('\n=== SET A: redirect old -> corpus (count ' + Object.keys(SET_A).length + ') ===');
  let aMissing = 0;
  for (const [oldS, corpusS] of Object.entries(SET_A)) {
    const oldD = await lookup(oldS);
    const newD = await lookup(corpusS);
    const flags: string[] = [];
    if (!oldD) { flags.push('OLD-MISSING'); aMissing++; }
    if (!newD) { flags.push('CORPUS-MISSING'); aMissing++; }
    console.log(
      `  ${oldS}\n    old: ${oldD ? `${oldD.id} en=${oldD.en} es=${oldD.es ?? '-'} ja=${oldD.ja ?? '-'}` : '—'}\n    ->   ${corpusS} ${newD ? `(${newD.id} es=${newD.es ?? '-'} ja=${newD.ja ?? '-'})` : ''} ${flags.length ? '!! ' + flags.join(',') : ''}`
    );
  }

  // SET B
  console.log('\n=== SET B: redirect old -> landing/tour (count ' + Object.keys(SET_B).length + ') ===');
  for (const [oldS, target] of Object.entries(SET_B)) {
    const oldD = await lookup(oldS);
    console.log(`  ${oldS} -> /${target} ${oldD ? `(old ${oldD.id} es=${oldD.es ?? '-'} ja=${oldD.ja ?? '-'})` : '!! OLD-MISSING'}`);
  }

  // SET C
  console.log('\n=== SET C: unpublish only (count ' + SET_C.length + ') ===');
  for (const oldS of SET_C) {
    const oldD = await lookup(oldS);
    console.log(`  ${oldS} ${oldD ? `(${oldD.id} es=${oldD.es ?? '-'} ja=${oldD.ja ?? '-'})` : '!! OLD-MISSING'}`);
  }

  console.log(`\nSET A pairs=${Object.keys(SET_A).length} missing=${aMissing}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
