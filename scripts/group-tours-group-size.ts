/**
 * Set groupSize on the 18 remaining group day tours (owner 2026-07-22):
 * Cairo/Luxor/Aswan departures = 4–12; Red Sea departures = 1–30.
 * (The Giza group tour already carries 4–12 from the earlier fix.)
 *   npx tsx scripts/group-tours-group-size.ts
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: 'production',
  apiVersion: '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  perspective: 'raw',
});

const CITY = { en: '4–12 guests', es: '4–12 personas', ja: '4〜12名' };
const RED_SEA = { en: '1–30 guests', es: '1–30 personas', ja: '1〜30名' };

/** slug → size class. Departure city decides (owner rule). */
const SIZES: Record<string, typeof CITY> = {
  // Cairo / Luxor / Aswan
  'abu-simbel-temples-day-tour-from-aswan': CITY,
  'alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo': CITY,
  'esna-edfu-kom-ombo-temples-group-day-tour-from-luxor': CITY,
  'fayoum-meidum-hawara-pyramids-group-day-tour': CITY,
  'grand-west-bank-group-day-tour-luxor': CITY,
  'memphis-saqqara-and-dahshur-group-day-tour': CITY,
  'nubian-temples-day-tour-from-aswan': CITY,
  // Red Sea (Hurghada / Sharm / Safaga)
  'cairo-by-bus-group-day-tour-from-hurghada': RED_SEA,
  'dahab-blue-hole-desert-snorkel-group-day-tour-from-sharm': RED_SEA,
  'dendera-and-abydos-temple-day-tour-from-hurghada': RED_SEA,
  'dolphin-house-shared-snorkeling-day-from-hurghada': RED_SEA,
  'dolphins-dance-group-shared-seas-full-day-snorkeling-tour': RED_SEA,
  'giftun-island-shared-snorkeling-day-from-hurghada': RED_SEA,
  'jerusalem-dead-sea-bethlehem-group-day-tour-from-sharm': RED_SEA,
  'luxor-highlights-group-day-tour-from-hurghada': RED_SEA,
  'mount-sinai-and-st-catherine-full-day-tour-from-sharm': RED_SEA,
  'mount-sinai-sunrise-trek-group-day-tour': RED_SEA,
  'safaga-to-luxor-full-day-group-ancient-city-adventure': RED_SEA,
};

const i18n = (v: { en: string; es: string; ja: string }) => [
  { _key: 'en', _type: 'internationalizedArrayStringValue', value: v.en },
  { _key: 'es', _type: 'internationalizedArrayStringValue', value: v.es },
  { _key: 'ja', _type: 'internationalizedArrayStringValue', value: v.ja },
];

async function main() {
  const docs: Array<{ _id: string; slug: string }> = await client.fetch(
    `*[_type == "tour" && type == "dayTour" && tourMode == "group" && !(_id in path("drafts.**"))]{_id, "slug": slug[_key=="en"][0].value.current}`,
  );
  for (const d of docs) {
    const size = SIZES[d.slug];
    if (!size) {
      if (d.slug !== 'pyramids-of-giza-and-sphinx-group-day-tour') console.log(`SKIP (unmapped): ${d.slug}`);
      continue;
    }
    await client.patch(d._id).set({ groupSize: i18n(size) }).commit();
    console.log(`✓ ${d.slug} → ${size.en}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
