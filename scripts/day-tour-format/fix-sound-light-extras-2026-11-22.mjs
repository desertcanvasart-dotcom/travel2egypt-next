/**
 * Sound & Light evenings, owner 22 Nov: "the boat is included in the price of the ticket" (an exception for the
 * show; not in a normal Philae visit), "add a water bottle", "include the driver tip and the assistant"
 * (amounts: 250 EGP tip, 700 EGP assistant, accepted). Autoura templates T2E-DT-CAI-14 / LXR-08 / ASW-06
 * re-priced by the engine (2 travellers, 30 % margin, rounded up): Giza €62.10 → €63, Karnak €43.61 → €44,
 * Philae €41.98 → €42, one price for every language.
 *
 *   Prices:  Giza 52 → 63 · Karnak 33 → 44 · Philae 40 → 42 (priceFrom; no guide-language prices).
 *   Karnak:  water, driver's tip and the assistant (who meets you at the temple, hands out the headsets and
 *            collects them) now stated on the page (EN/ES/JA).
 *   Philae:  the boat crossings come with the show ticket (shared), not a private motorboat; same tip /
 *            assistant / water wording (EN/ES/JA).
 *   Giza:    price only (its new layout already lists the representative, the water and the driver's tip).
 *
 *   node --env-file=<.env> scripts/day-tour-format/fix-sound-light-extras-2026-11-22.mjs [--apply]
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const apply = process.argv.includes('--apply');
const GIZA = 'wp-page-110952', KARNAK = 'tour.sound-light-show-at-karnak-temple-in-luxor', PHILAE = 'wp-page-88604';
const PRICE = { [GIZA]: { old: 52, now: 63 }, [KARNAK]: { old: 33, now: 44 }, [PHILAE]: { old: 40, now: 42 } };

// [field, locale, blockKey|null, mode, find, replace]   mode: 'in' (find inside one span) | 'exact' (a span that is exactly `find`)
const ASSIST_EN = " your driver's tip is included, and an assistant from our team meets you at the temple, hands out the headsets and collects them afterwards. ";
const FIX = {
  [KARNAK]: [
    ['shape.character', 'en', null, 'in', 'then sit by the Sacred Lake', "then sit by the Sacred Lake · bottled water, your driver's tip and an assistant included"],
    ['shape.character', 'es', null, 'in', 'y el final es sentado junto al Lago Sagrado', 'y el final es sentado junto al Lago Sagrado · agua, propina del conductor y asistente incluidos'],
    ['shape.character', 'ja', null, 'in', '・1人1本のミネラルウォーター', '・1人1本のミネラルウォーター・ドライバーへのチップとスタッフの出迎えを含む'],
    ['body', 'en', '000000000015', 'in', ' is provided for the transfer. ', ` is provided for the transfer;${ASSIST_EN}`],
    ['body', 'es', '000000000017', 'in', ' para el traslado. ', ' para el traslado; la propina del conductor está incluida, y un asistente de nuestro equipo te recibe en el templo, reparte los auriculares y los recoge al terminar. '],
    ['body', 'ja', '00000000000d', 'in', '単独の夕方のアクティビティとしてもよく働きます。', '単独の夕方のアクティビティとしてもよく働きます。お一人様1本のミネラルウォーターとドライバーへのチップは料金に含まれ、神殿ではスタッフが出迎え、ヘッドセットの貸し出しと回収を行います。'],
  ],
  [PHILAE]: [
    ['conciergeNote', 'en', null, 'in', "your transfers and the boat are yours, but the show itself is shared with the evening's audience:", "your road transfer is yours, but the boat crossings come with the show ticket and the show itself is shared with the evening's audience:"],
    ['conciergeNote', 'es', null, 'in', 'los traslados y el barco son tuyos, pero el espectáculo se comparte con el público de esa noche:', 'el traslado por carretera es tuyo, pero las travesías en barco van con la entrada y el espectáculo se comparte con el público de esa noche:'],
    ['conciergeNote', 'ja', null, 'in', '送迎とボートは貸切ですが、ショーそのものは当夜の観客と共にするもので、', '送迎は貸切で、ボートでの往復は入場チケットに含まれ、ショーそのものは当夜の観客と共にするもので、'],
    ['shape.character', 'en', null, 'in', 'Private return transfer and motorboat to your party · shared performance at the temple (walk and stand, then seated for the finale) · entrance fees included · all languages', "Private return transfer to your party · shared performance at the temple (walk and stand, then seated for the finale) · the ticket includes the boat crossings · bottled water, your driver's tip and an assistant included · all languages"],
    ['shape.character', 'es', null, 'in', 'Traslado de ida y vuelta y lancha privados a su grupo · función compartida en el templo (a pie y de pie, con final sentado) · entradas incluidas · varios idiomas', 'Traslado de ida y vuelta privado a su grupo · función compartida en el templo (a pie y de pie, con final sentado) · la entrada incluye las travesías en barco · agua, propina del conductor y asistente incluidos · varios idiomas'],
    ['shape.character', 'ja', null, 'in', '完全プライベートな陸上送迎とボート横断・上演は神殿でのチケット制の相乗り公演・1人1本のミネラルウォーター', '完全プライベートな陸上送迎・上演は神殿でのチケット制の相乗り公演（チケットにボートでの往復を含む）・1人1本のミネラルウォーター・ドライバーへのチップとスタッフの出迎えを含む'],
    ['body', 'en', '000000000015', 'in', 'The road transfer and motorboat crossing are ', 'The road transfer is '],
    ['body', 'en', '000000000015', 'in', ' at the temple. The outing ', ' at the temple, and the ticket includes the boat crossings to the island and back. The outing '],
    ['body', 'en', '000000000015', 'in', ' is provided. ', ` is provided;${ASSIST_EN}`],
    ['body', 'es', '000000000017', 'in', 'El traslado por carretera y el cruce en lancha son ', 'El traslado por carretera es '],
    ['body', 'es', '000000000017', 'exact', 'privados a su grupo', 'privado a su grupo'],
    ['body', 'es', '000000000017', 'in', ' en el templo. La salida ', ' en el templo, y la entrada incluye las travesías en barco a la isla y de vuelta. La salida '],
    ['body', 'es', '000000000017', 'exact', '. ', ', la propina del conductor está incluida, y un asistente de nuestro equipo te recibe en el templo, reparte los auriculares y los recoge al terminar. '],
    ['body', 'ja', '000000000019', 'in', '2時間から3時間かかります。', '2時間から3時間かかります。ボートでの往復は入場チケットに含まれ、お一人様1本のミネラルウォーターとドライバーへのチップも料金に含まれます。神殿ではスタッフが出迎え、ヘッドセットの貸し出しと回収を行います。'],
  ],
};

const clone = (x) => JSON.parse(JSON.stringify(x));
const jobs = [];
for (const id of [GIZA, KARNAK, PHILAE]) {
  const doc = await client.getDocument(id);
  if (!doc) throw new Error(`${id} not found`);
  if (await client.getDocument(`drafts.${id}`)) throw new Error(`drafts.${id} exists`);
  const p = PRICE[id];
  const priceDone = doc.priceFrom === p.now;
  if (!priceDone && doc.priceFrom !== p.old) throw new Error(`${id}: unexpected priceFrom ${doc.priceFrom}`);
  if (doc.guideLanguagePrices) throw new Error(`${id}: guideLanguagePrices present`);
  const next = { conciergeNote: clone(doc.conciergeNote), body: clone(doc.body), shape: clone(doc.shapeOfDay?.character) };
  let changed = priceDone ? 0 : 1;
  console.log(`${priceDone ? 'already' : 'CHANGE '} ${id.slice(0, 24)} priceFrom ${doc.priceFrom} → ${p.now}`);
  for (const [field, loc, block, mode, find, repl] of FIX[id] ?? []) {
    let done = false;
    if (field === 'conciergeNote' || field === 'shape.character') {
      const row = (field === 'conciergeNote' ? next.conciergeNote : next.shape).find((r) => r._key === loc); if (!row) throw new Error(`${id} ${field}[${loc}] missing`);
      const n = row.value.split(find).length - 1;
      if (n === 1) { row.value = row.value.replace(find, () => repl); done = true; } else if (n === 0 && row.value.includes(repl)) done = false; else throw new Error(`${id} ${field}[${loc}] "${find.slice(0, 40)}" found ${n}×`);
    } else {
      const b = next.body.find((r) => r._key === loc)?.value.find((x) => x._key === block); if (!b) throw new Error(`${id} body[${loc}] ${block} missing`);
      const hits = b.children.filter((c) => (mode === 'exact' ? c.text === find : c.text.includes(find)));
      if (hits.length === 1) { hits[0].text = mode === 'exact' ? repl : hits[0].text.replace(find, () => repl); done = true; }
      else if (hits.length === 0 && b.children.some((c) => c.text.includes(repl.trim()))) done = false;
      else throw new Error(`${id} body[${loc}] ${block}: "${find.slice(0, 40)}" in ${hits.length} spans (${mode})`);
    }
    if (done) changed++;
    console.log(`${done ? 'CHANGE ' : 'already'} ${id.slice(0, 24)} ${field}[${loc}${block ? ' ' + block : ''}]`);
  }
  jobs.push({ id, next, changed, price: p.now, priceDone });
}
const total = jobs.reduce((a, j) => a + j.changed, 0);
console.log(`${total} change(s) across ${jobs.length} pages`);
if (apply && total) {
  await writeRollback(client, jobs.filter((j) => j.changed).map((j) => j.id), 'before-sound-light-extras');
  for (const j of jobs) {
    if (!j.changed) continue;
    const set = { priceFrom: j.price };
    if (FIX[j.id]) { set.conciergeNote = j.next.conciergeNote; set.body = j.next.body; set['shapeOfDay.character'] = j.next.shape; }
    await client.patch(j.id).set(set).commit();
    console.log(`APPLIED ${j.id}`);
  }
} else if (!apply) console.log('dry run (--apply writes production)');
