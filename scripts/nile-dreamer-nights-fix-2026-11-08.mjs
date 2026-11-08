/**
 * Nile Dreamer (wp-page-89376) — owner's final night breakdown, 2026-11-08:
 * 5 hotel nights (Cairo 2 + Aswan 1 + Cairo 2) + 1 sleeper-train night +
 * 3 cruise nights = 9 nights. Every "four nights" cruise / "4 hotel nights"
 * statement in EN/ES/JA is corrected; nothing else changes.
 * Dry run by default; --write to apply. Backup: backups/nile-dreamer-backup-2026-11-08.json
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';

const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const ID = 'wp-page-89376';

// [locale, block key | 'summary', from, to]
const EDITS = [
  ['en', '000000000003', 'Aswan to Luxor by cruise across four nights', 'Aswan to Luxor by cruise across three nights'],
  ['en', '000000000009', 'boards a Nile cruise for four nights', 'boards a Nile cruise for three nights'],
  ['en', '00000000000b', 'Four nights on the Nile', 'Three nights on the Nile'],
  ['en', '00000000001b', 'The cruise will carry you for four nights;', 'The cruise will carry you for three nights;'],
  ['en', '00000000002f', 'Four nights in carefully selected five-star hotels, four nights aboard', 'Five nights in carefully selected five-star hotels, three nights aboard'],
  ['en', '000000000037', '4 hotel nights + 1 sleeper-train night + 4 cruise nights', '5 hotel nights + 1 sleeper-train night + 3 cruise nights'],
  ['en', '000000000039', 'four-night Nile cruise', 'three-night Nile cruise'],
  ['en', 'summary', 'four nights cruising', 'three nights cruising'],

  ['es', '000000000003', 'Asuán a Luxor en crucero durante cuatro noches', 'Asuán a Luxor en crucero durante tres noches'],
  ['es', '000000000009', 'un crucero durante cuatro noches', 'un crucero durante tres noches'],
  ['es', '00000000000b', 'Cuatro noches sobre el Nilo', 'Tres noches sobre el Nilo'],
  ['es', '00000000001b', 'El crucero acompañará cuatro noches;', 'El crucero acompañará tres noches;'],
  ['es', '00000000002f', 'Cuatro noches en hoteles cinco estrellas cuidadosamente seleccionados, cuatro noches en un crucero', 'Cinco noches en hoteles cinco estrellas cuidadosamente seleccionados, tres noches en un crucero'],
  ['es', '000000000037', '4 noches de hotel + 1 noche en tren nocturno + 4 noches de crucero', '5 noches de hotel + 1 noche en tren nocturno + 3 noches de crucero'],
  ['es', '000000000039', 'crucero de cuatro noches por el Nilo', 'crucero de tres noches por el Nilo'],
  ['es', 'summary', 'cuatro noches de crucero', 'tres noches de crucero'],

  ['ja', '000000000003', 'アスワンからルクソールは4泊のクルーズで', 'アスワンからルクソールは3泊のクルーズで'],
  ['ja', '000000000009', '4泊のナイル・クルーズに乗り換え', '3泊のナイル・クルーズに乗り換え'],
  ['ja', '00000000000b', '4泊、岸辺が流れ', '3泊、岸辺が流れ'],
  ['ja', '00000000001b', 'クルーズはこのあと4泊にわたって', 'クルーズはこのあと3泊にわたって'],
  ['ja', '00000000002f', '5つ星ホテル4泊と、プール、スパ、エンタテインメントを備えた5つ星クルーズ船での4泊', '5つ星ホテル5泊と、プール、スパ、エンタテインメントを備えた5つ星クルーズ船での3泊'],
  ['ja', '000000000037', 'ホテル4泊＋寝台列車1泊＋クルーズ4泊', 'ホテル5泊＋寝台列車1泊＋クルーズ3泊'],
  ['ja', '000000000039', '4泊のナイル・クルーズ', '3泊のナイル・クルーズ'],
  ['ja', 'summary', '4泊の川旅', '3泊の川旅'],
];

const doc = await c.fetch(`*[_id == $id][0]{body, summary}`, { id: ID });
// Accumulate per-span text so several edits to one span compose.
const pending = new Map();
for (const [loc, block, from, to] of EDITS) {
  let path, text;
  if (block === 'summary') {
    path = `summary[_key=="${loc}"].value`;
    text = pending.get(path) ?? doc.summary.find((s) => s._key === loc).value;
  } else {
    const b = doc.body.find((l) => l._key === loc).value.find((x) => x._key === block);
    const spans = b.children.filter((s) => (pending.get(`${loc}|${block}|${s._key}`) ?? s.text).includes(from));
    if (spans.length !== 1) throw new Error(`${loc}/${block}: expected 1 span with "${from}", found ${spans.length}`);
    path = `body[_key=="${loc}"].value[_key=="${block}"].children[_key=="${spans[0]._key}"].text`;
    text = pending.get(path) ?? spans[0].text;
  }
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`${loc}/${block}: "${from}" occurs ${n}×`);
  pending.set(path, text.replace(from, to));
  console.log(`${loc}/${block}: - ${from}\n${' '.repeat(loc.length + block.length + 3)}+ ${to}`);
}
if (process.argv.includes('--write')) {
  const res = await c.patch(ID).set(Object.fromEntries(pending)).commit();
  console.log('committed', res._rev);
} else console.log(`dry run — ${pending.size} fields; pass --write`);
