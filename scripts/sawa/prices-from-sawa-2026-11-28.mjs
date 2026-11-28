/**
 * Owner, 28 Nov 2026: "Take the prices from sawa." Writes priceFrom on the T2E group tours that run on
 * sawa.tours, from Sawa's 4-traveller rate (JSON-LD TouristTrip offers.highPrice), read live. Price only:
 * the sawaUrl link-out waits for PR #413 on 14 Dec (freeze). Same MAP as scripts/sawa/link-group-tours-to-sawa-2026-11-27.mjs.
 *   node --env-file=.env scripts/sawa/prices-from-sawa-2026-11-28.mjs [--apply]
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const MAP = {
  'pyramids-of-giza-and-sphinx-group-day-tour': 'tour/giza-uncovered-pyramids-sphinx-stories-from-cairo',
  'memphis-saqqara-and-dahshur-group-day-tour': 'tour/memphis-saqqara-dahshur-birth-pyramid-from-cairo',
  'fayoum-meidum-hawara-pyramids-group-day-tour': 'tour/fayoum-oasis-meidum-hawara-pyramids-full-day-tour-from-cairo',
  'alexandria-catacombs-pompeys-pillar-group-day-tour-from-cairo': 'tour/cairo-to-alexandria-mediterranean-day-tour',
  'grand-west-bank-group-day-tour-luxor': 'tour/grand-west-bank-tombs-temples-deir-el-medina-from-luxor',
  'esna-edfu-kom-ombo-temples-group-day-tour-from-luxor': 'tour/luxor-to-aswan-esna-edfu-kom-ombo-temple-road',
  'abu-simbel-temples-day-tour-from-aswan': 'tour/aswan-to-abu-simbel-temples-ramses-ii-nefertari',
  'dolphin-house-shared-snorkeling-day-from-hurghada': 'tour/dolphin-house-adventure-snorkeling-wild-dolphins-from-hurghada',
  'dendera-and-abydos-temple-day-tour-from-hurghada': 'tour/dendera-abydos-from-hurghada-far-temples-day-tour',
  'nubian-temples-day-tour-from-aswan': 'tour/nubian-temples-lake-nasser-kalabsha-beit-el-wali-kertassi-from-aswan',
  '9-day-egypt-group-tour-cairo-abu-simbel-nile': 'package/egypt-in-depth-9-day-nile-cruise-cairo',
};
const apply = process.argv.includes('--apply');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN, useCdn: false });

async function sawa(path) {
  const url = `https://sawa.tours/${path}`;
  const res = await fetch(url, { headers: { 'user-agent': 'travel2egypt-sawa-price/1.0' } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const html = await res.text();
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const trip = (JSON.parse(m[1])['@graph'] ?? []).find((n) => n['@type'] === 'TouristTrip' && n.url === url);
    const o = trip?.offers;
    if (typeof o?.highPrice === 'number' && o.highPrice > 0) return { four: o.highPrice, eight: o.lowPrice, ccy: o.priceCurrency, name: trip.name };
  }
  throw new Error(`${url}: no TouristTrip offers.highPrice`);
}

const plan = [];
for (const [slug, path] of Object.entries(MAP)) {
  const doc = await c.fetch('*[_type=="tour" && !(_id in path("drafts.**")) && slug[_key=="en"][0].value.current==$slug][0]{_id,tourMode,priceFrom}', { slug });
  if (!doc || doc.tourMode !== 'group') throw new Error(`${slug}: not a published group tour`);
  const s = await sawa(path);
  if (s.ccy !== 'EUR') throw new Error(`${slug}: Sawa currency ${s.ccy}, priceFrom is EUR`);
  plan.push({ id: doc._id, price: s.four });
  console.log(`${slug.padEnd(62)} €${doc.priceFrom ?? '—'} → €${s.four}  (Sawa 4 travellers; €${s.eight} with 8)  ${s.name}`);
}
if (!apply) { console.log(`\ndry run, ${plan.length} tours. --apply to write.`); process.exit(0); }
await writeRollback(c, plan.map((p) => p.id), 'before-sawa-prices');
for (const p of plan) { await c.patch(p.id).set({ priceFrom: p.price }).unset(['guideLanguagePrices']).commit(); console.log('APPLIED', p.id); }
