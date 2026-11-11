/**
 * Lake Nasser merge (2026-11-10): tour "from" prices for the three cards under
 * the merged post. Prices are stored in EUR (`priceFrom`) and shown in the
 * visitor's currency at the live ECB rate (src/lib/fx.ts), so the owner picks:
 *   --mode=usd  store EUR so that USD shows $750 / $1,390 at today's rate
 *               (the USD figure then moves a little with the exchange rate)
 *   --mode=eur  store €750 / €1,390 as given (USD shows ≈ $840 / $1,556)
 * The Four Days tour stays as it is in both modes.
 * Usage (from the repo root): node scripts/lake-nasser-merge-prices.mjs --mode=usd|eur [--apply]
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';

const APPLY = process.argv.includes('--apply');
const MODE = (process.argv.find((a) => a.startsWith('--mode=')) || '').split('=')[1];
if (!['usd', 'eur'].includes(MODE)) throw new Error('pass --mode=usd or --mode=eur');
const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

const rate = (await (await fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD')).json()).rates.USD;
const TOURS = [
  ['wp-page-90443', 'Lake Nasser Explorer: 4-Day Cruise from Abu Simbel to Aswan', 750],
  ['wp-page-90425', '5-Day Lake Nasser Cruise from Aswan: Temples of the Drowned Lands', 1390],
];
console.log(`EUR→USD ${rate} (mode: ${MODE})`);
let tx = c.transaction(), n = 0;
for (const [id, title, target] of TOURS) {
  const eur = MODE === 'usd' ? Math.round(target / rate) : target;
  for (const doc of [id, `drafts.${id}`]) {
    const cur = await c.fetch(`*[_id==$id][0].priceFrom`, { id: doc });
    if (cur === undefined || cur === null) continue;
    console.log(`${doc} ${title}\n  priceFrom €${cur} (≈$${Math.round(cur * rate)}) → €${eur} (≈$${Math.round(eur * rate)})`);
    if (cur === eur) continue;
    tx = tx.patch(c.patch(doc).set({ priceFrom: eur })); n++;
  }
}
if (APPLY && n) { const r = await tx.commit(); console.log('committed', r.results.length, 'docs'); }
else console.log(`${n} docs to patch ${APPLY ? '' : '(dry run — pass --apply)'}`);
