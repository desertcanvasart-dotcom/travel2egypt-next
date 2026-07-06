/**
 * Set the structured "from" price on the three recently-imported tours so the
 * rail "PRICE LOGIC" box shows a number instead of "On inquiry". The box reads
 * `priceTiers`; the meta row reads `priceFrom` — so we set both.
 *
 * Prices are stored as the base EUR figure; formatPrice() localises the currency
 * per locale (es €, en $, ja ¥). Single "From" tier, matching the existing
 * working shape (internationalized items use _type:'object').
 *
 *   tsx scripts/set-tour-prices.ts          # dry run
 *   tsx scripts/set-tour-prices.ts --apply  # write + publish
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();
const APPLY = process.argv.includes('--apply');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

// EUR base figures, taken from each tour's authored "From · €X per person" line.
const TOURS: Array<{ slug: string; eur: number }> = [
  { slug: 'ramasside-tours', eur: 55 },
  { slug: 'memphis-saqqara-citadel-khan-tour', eur: 70 },
  { slug: 'aswan-city-tour-from-marsa-alam', eur: 95 },
];

const intl = (en: string, es: string, ja: string) => [
  { _key: 'en', _type: 'object', value: en },
  { _key: 'es', _type: 'object', value: es },
  { _key: 'ja', _type: 'object', value: ja },
];

function priceTier(eur: number) {
  return [
    {
      _key: 'p0',
      _type: 'object',
      name: intl('From', 'Desde', '料金'),
      unit: intl('pp', 'pp', 'pp'),
      price: eur,
    },
  ];
}

async function main() {
  console.log(APPLY ? '*** APPLY ***' : '--- DRY RUN (pass --apply) ---');
  for (const { slug, eur } of TOURS) {
    const id = await client.fetch<string | null>(
      `*[!(_id in path("drafts.**")) && _type=="tour" && slug[_key=="en"][0].value.current==$s][0]._id`,
      { s: slug }
    );
    if (!id) { console.log(`  MISSING  ${slug}`); continue; }
    if (!APPLY) { console.log(`  would set ${slug} (${id}) -> priceFrom=${eur}, tier "From"=${eur}`); continue; }
    await client.patch(id).set({ priceFrom: eur, priceTiers: priceTier(eur) }).commit({ visibility: 'sync' });
    console.log(`  set ${slug} (${id}) -> €${eur}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
