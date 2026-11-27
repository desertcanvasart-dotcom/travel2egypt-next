/**
 * Luxor → Aswan pure transfer priced PER CAR, not per person (owner, 22 Nov: "all transfers like airport transfers
 * and from a city to another pure transfers should be by car, not by per person").
 *
 *   tour.private-tour-transfer-from-luxor-to-aswan-by-bus: priceBasis 'perCar', priceFrom = the car price (1-2
 *   travellers); a van (3-8 travellers) costs more. The page's "From" then reads "per car, each way".
 *
 * Autoura (22 Nov), Luxor → Aswan 'intercity_dropoff', higher of EU / non-EU, house margin 30 %, ~59.05 EGP/EUR,
 * rounded UP to the whole euro (the same rule as the airport transfers, airport-transfer-prices.json):
 *   sedan  5,400 EGP  x 1.3 / 59.05 = €118.9  → €119
 *   hiace  6,660 EGP  x 1.3 / 59.05 = €146.6  → €147
 * The body's price sentence (it said "per person for two travellers sharing") is rewritten in EN / ES / JA.
 *
 *   node --env-file=<.env> scripts/day-tour-format/transfer-per-car-luxor-aswan-2026-11-22.mjs           # dry run
 *   node --env-file=<.env> scripts/day-tour-format/transfer-per-car-luxor-aswan-2026-11-22.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const ID = 'tour.private-tour-transfer-from-luxor-to-aswan-by-bus';
const CAR = 119;
const apply = process.argv.includes('--apply');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN });
const doc = await c.getDocument(ID);
if (!doc) throw new Error('missing');
if (await c.getDocument(`drafts.${ID}`)) throw new Error('draft exists');
const SENT = {
  en: ['The price shown is per person for two travellers sharing, and it is confirmed when you book.', 'The price is per car, each way: a car for one or two travellers, or a van for three to eight, confirmed when you book.'],
  es: ['El precio mostrado es por persona para dos viajeros que comparten, y se confirma al reservar.', 'El precio es por coche, por trayecto: un coche para uno o dos viajeros, o una furgoneta para de tres a ocho, y se confirma al reservar.'],
  ja: ['表示の料金は2名様でご利用の場合の1人あたりで、ご予約の際に確定します。', '料金は1台あたり（片道）です。1〜2名様は乗用車、3〜8名様はバンで、ご予約の際に確定します。'],
};
let hits = 0;
const body = doc.body.map((row) => {
  const [find, repl] = SENT[row._key] ?? [];
  if (!find) return row;
  return {
    ...row,
    value: row.value.map((b) => {
      const i = (b.children ?? []).findIndex((x) => x.text?.includes(find));
      if (i < 0) return b;
      hits++;
      const children = b.children.map((x, k) => (k === i ? { ...x, text: x.text.replace(find, repl) } : x));
      return { ...b, children };
    }),
  };
});
if (hits !== 3 && doc.priceBasis !== 'perCar') throw new Error(`price sentence found ${hits} times (expected 3)`);
console.log(`priceBasis ${doc.priceBasis} → perCar; priceFrom ${doc.priceFrom} → ${CAR}; sentence rewritten in ${hits} languages`);
if (!apply) { console.log('dry run'); process.exit(0); }
await writeRollback(c, [ID], 'per-car');
await c.patch(ID).set({ priceBasis: 'perCar', priceFrom: CAR, body }).commit();
console.log('applied');
