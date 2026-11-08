/**
 * Nile Dreamer (wp-page-89376) — homepage fix round 1, item 2 (2026-11-08).
 * The route has ONE sleeper train (Cairo → Aswan, outbound). Day 7 ended
 * with a Luxor → Cairo flight followed by a second "sleeping train" (EN/ES),
 * or with a Luxor → Cairo sleeper train instead of the flight (JA); day 8
 * then repeated the flight (EN/ES). Replaces exactly those sentences, nothing
 * else. Dry-run by default; pass --write to patch the published document.
 * Backup of the pre-change document: scratchpad nile-dreamer-backup-2026-11-08.json
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';

const c = createClient({
  projectId: 'ufallvd2',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN,
});
const ID = 'wp-page-89376';
const EDITS = [
  {
    loc: 'en',
    block: '000000000025',
    from: 'In the afternoon you transfer to Luxor Airport for a domestic flight back to Cairo, and that evening board the sleeping train, with dinner served onboard.',
    to: 'In the afternoon you transfer to Luxor Airport for the short domestic flight back to Cairo, where your driver meets you and takes you to your hotel for the night.',
  },
  {
    loc: 'en',
    block: '000000000029',
    from: 'You fly from Luxor back to Cairo, and day eight belongs to you.',
    to: 'Day eight belongs to you.',
  },
  {
    loc: 'es',
    block: '000000000025',
    from: 'Por la tarde, traslado al aeropuerto de Luxor y vuelo doméstico de regreso a El Cairo. Esa noche se embarca el tren nocturno con cena a bordo.',
    to: 'Por la tarde, traslado al aeropuerto de Luxor para el breve vuelo doméstico de regreso a El Cairo, donde su conductor le recibe y le lleva al hotel para pasar la noche.',
  },
  {
    loc: 'es',
    block: '000000000029',
    from: 'El vuelo matinal de Luxor a El Cairo abre el octavo día, que pertenece al viajero.',
    to: 'El octavo día pertenece al viajero.',
  },
  {
    loc: 'ja',
    block: '000000000025',
    from: '午後、駅へ向かい、ルクソール発カイロ行きの寝台列車に乗車します。車内で夕食を取り、朝にはカイロに戻っています（ご要望に応じてルクソール—カイロは国内線への切り替えも可能です）。',
    to: '午後はルクソール空港へ向かい、国内線の短いフライトでカイロへ戻ります。到着後はドライバーがお出迎えし、その夜のホテルへお送りします。',
  },
];

const doc = await c.fetch(`*[_id == $id][0]{_rev, body}`, { id: ID });
const tx = c.transaction();
for (const e of EDITS) {
  const loc = doc.body.find((l) => l._key === e.loc);
  const block = loc?.value.find((b) => b._key === e.block);
  const spans = (block?.children ?? []).filter((s) => typeof s.text === 'string' && s.text.includes(e.from));
  if (spans.length !== 1) throw new Error(`${e.loc}/${e.block}: expected 1 span containing the sentence, found ${spans.length}`);
  const span = spans[0];
  const next = span.text.replace(e.from, e.to);
  const path = `body[_key=="${e.loc}"].value[_key=="${e.block}"].children[_key=="${span._key}"].text`;
  console.log(`${e.loc}/${e.block}: OK\n  - ${e.from}\n  + ${e.to}`);
  tx.patch(ID, (p) => p.set({ [path]: next }));
}
if (process.argv.includes('--write')) {
  const res = await tx.commit({ autoGenerateArrayKeys: false });
  console.log('committed', res.transactionId);
} else {
  console.log('dry run — pass --write to apply');
}
