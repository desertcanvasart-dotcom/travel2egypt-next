/**
 * Factual errors and leftover editing notes on the two Nefertari pages (owner, 25 Nov: "Fix the Nefertari
 * errors now"). Text only: slugs, prices and heroes stay.
 *
 *   wp-page-115615 (9:00–3:30, lunch): "forty metres below the surface" (a semi-submarine does not dive);
 *     notes about "the source" shown to visitors; "sunset" / "dinner" for what is a lunch trip (title,
 *     heading, summary, and the Japanese notes fields).
 *   wp-page-115573 (2:00–7:30, dinner): Port Ghalib placed south of Marsa Alam (it is north); the Spanish
 *     start time half an hour off the English.
 *
 *   node --env-file=<.env> scripts/day-tour-format/fix-nefertari-errors-2026-11-25.mjs           # dry run
 *   node --env-file=<.env> scripts/day-tour-format/fix-nefertari-errors-2026-11-25.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN });

const k = (key) => `[_key=="${key}"]`;
const body = (l, block, child) => `body${k(l)}.value${k(block)}.children${k(child)}.text`;
const loc = (field, l) => `${field}${k(l)}.value`;

// [path, 'whole', newText]  or  [path, oldFragment, newFragment]
const EDITS = {
  'wp-page-115615': [
    [loc('title', 'en'), 'whole', 'Nefertari Submarine & Lunch Cruise from Marsa Alam'],
    [loc('title', 'ja'), 'サンセット・ディナークルーズ', 'ランチクルーズ'],
    [loc('summary', 'en'), 'whole', 'Go below the waterline on the Nefertari semi-submarine, snorkel the reefs off Port Ghalib, then have a seafood lunch on the upper deck. One day; two very different views of the Red Sea.'],
    [loc('summary', 'ja'), '太陽が水へ沈むなかアッパーデッキで食事を', 'アッパーデッキで昼食を'],
    [body('en', '000000000001', '000000000000'), 'Sunset Cruise', 'Lunch Cruise'],
    [body('en', '000000000003', '000000000002'), "continues forty metres below the Red Sea's surface in a climate-controlled observation deck", 'continues below the waterline in an air-conditioned observation deck'],
    [body('en', '000000000003', '000000000002'), 'closes over a seafood dinner on an upper deck while the sky goes orange and the marina lights come on', 'closes over a seafood lunch on the upper deck'],
    [body('en', '000000000021', '000000000020'), 'whole', 'As the snorkelling session ends, the boat transitions into its second mode. The upper deck is set for lunch: seafood and drinks, served from a set menu rather than a buffet.'],
    [body('en', '00000000003b', '00000000003a'), 'whole', 'If you would rather eat as the sun goes down, ask us about the afternoon Nefertari departure.'],
    [body('es', '000000000005', '000000000004'), ' mientras el cielo se vuelve naranja y se encienden las luces del puerto', ''],
    [body('es', '00000000002f', '00000000002e'), 'whole', 'A medida que termina la sesión de snorkel, el barco entra en su segunda modalidad. La cubierta superior se prepara para la comida: pescado y bebidas, un menú servido, no un bufé.'],
    [body('es', '00000000004c', '00000000004a'), 'whole', 'Si prefiere comer mientras cae el sol, pregúntenos por la salida de tarde del Nefertari.'],
    [body('ja', '000000000007', '000000000006'), 'サンセットクルーズ', 'ランチクルーズ'],
    [body('ja', '000000000009', '000000000008'), '温度の整えられた観覧デッキで紅海の水面の40メートル下へと続き', '冷房の効いた水面下の観覧デッキへと続き'],
    [body('ja', '000000000009', '000000000008'), '空がオレンジに染まりマリーナの灯がともるなか、アッパーデッキでのシーフードの食事で締めくくられます', 'アッパーデッキでのシーフードの昼食で締めくくられます'],
    [body('ja', '000000000027', '000000000026'), 'whole', 'シュノーケリングの時間が終わるころ、ボートは第二の様相へと移ります。アッパーデッキが昼食のために整えられます。献立はシーフードと飲み物が中心で、ビュッフェではなく、専用のメニューから供される食事です。'],
    [loc('audienceNote', 'ja'), '夜のディナークルーズ', '船上の昼食'],
    [loc('shapeOfDay.character', 'ja'), 'whole', 'ホテル送迎はプライベート・半潜水艇は乗り合い・ウェルカムドリンク、ガイド付きの海中観覧、ご希望の方はシュノーケリング、船上でシーフードの昼食'],
    [loc('shapeOfDay.duration', 'ja'), 'whole', '午前9時のお迎えから午後3時30分のお戻りまで'],
    [loc('shapeOfDay.where', 'ja'), 'whole', 'マルサ・アラムのホテル → ポート・ガリブ・マリーナ（北へ約65キロ） → 沖合の珊瑚礁でネフェルタリ潜水艇 → マリーナで自由時間'],
  ],
  'wp-page-115573': [
    [body('en', '000000000007', '000000000006'), '65 kilometres south of Marsa Alam', '65 kilometres north of Marsa Alam'],
    [body('es', '00000000000f', '00000000000d'), '65 kilómetros al sur de Marsa Alam', '65 kilómetros al norte de Marsa Alam'],
    [body('es', '000000000009', '000000000008'), 'entre las dos y media y las siete y media', 'entre las dos y las siete y media'],
    [body('ja', '00000000000d', '00000000000c'), 'マルサ・アラムの南', 'マルサ・アラムの北'],
    [loc('shapeOfDay.where', 'en'), 'about 65 km south', 'about 65 km north'],
    [loc('shapeOfDay.where', 'es'), 'a unos 65 km al sur', 'a unos 65 km al norte'],
  ],
};

/** Read a value at a keyed path like body[_key=="en"].value[_key=="x"].children[_key=="y"].text */
const read = (doc, path) => [...path.matchAll(/([A-Za-z]+)|\[_key=="([^"]+)"\]/g)]
  .reduce((v, m) => (m[2] ? v?.find((x) => x._key === m[2]) : v?.[m[1]]), doc);

const plan = [];
for (const [id, edits] of Object.entries(EDITS)) {
  const doc = await client.getDocument(id);
  if (!doc) throw new Error(`missing ${id}`);
  if (await client.getDocument(`drafts.${id}`)) throw new Error(`${id}: a draft exists`);
  const set = {};
  for (const [path, from, to] of edits) {
    const now = set[path] ?? read(doc, path);
    if (typeof now !== 'string') throw new Error(`${id}: nothing at ${path}`);
    if (from !== 'whole' && !now.includes(from)) throw new Error(`${id} ${path}: "${from}" not found`);
    set[path] = from === 'whole' ? to : now.replace(from, to);
  }
  console.log(`\n═══ ${id}`);
  for (const [path, v] of Object.entries(set)) console.log(`- ${path}\n    was: ${read(doc, path)}\n    now: ${v}`);
  plan.push({ id, set, rev: doc._rev });
}

if (!apply) { console.log('\ndry run (--apply writes production)'); process.exit(0); }
for (const { id, set, rev } of plan) {
  await writeRollback(client, [id], 'before-nefertari-fixes');
  await client.patch(id).ifRevisionId(rev).set(set).commit();
  console.log(`APPLIED to production ${id}`);
}
