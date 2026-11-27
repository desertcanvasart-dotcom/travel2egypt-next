/**
 * Karnak and Philae Sound & Light pages: bring their claims in line with the owner's article
 * "Egypt's Sound and Light Shows" (21 Nov, PR #335). Owner: "Yes, fix them". Only statements that contradict
 * the article change; everything else on the pages is untouched (find/replace inside single spans).
 *
 *   Karnak: "seated, unhurried / seated and undemanding" → you walk and stand, then sit by the Sacred Lake;
 *           "guided after-dark experience" → the show itself; "no minimum age… undemanding" → steady on feet,
 *           not for small children.
 *   Philae: "seated performance" → walk and stand, then benches for the finale; "children find it genuinely
 *           exciting / no minimum age" → not for small children; "motorboat crossing" → the boat there and back.
 *   Both:   ES/JA equivalents; the hidden JA audience notes drop "families".
 * NOT changed (owner to decide): the bottle of water each page lists (the article says "the show and nothing
 * added"); the Giza page (its new layout in PR #321 carries the owner's locked copy).
 *
 *   node --env-file=<.env> scripts/day-tour-format/fix-sound-light-claims-2026-11-21.mjs [--apply]
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const apply = process.argv.includes('--apply');

// [field, locale, blockKey|null, find, replace]
const KARNAK = 'tour.sound-light-show-at-karnak-temple-in-luxor';
const PHILAE = 'wp-page-88604';
const FIX = {
  [KARNAK]: [
    // concierge note
    ['conciergeNote', 'en', null, 'This is the gentlest evening Luxor offers — seated, unhurried, an hour among the lit columns.', "This is an evening on your feet and then in a seat: you walk and stand through the lit temple, then sit by the Sacred Lake for the finale, about an hour in all. If anyone in your party can't manage the walk, say so when you book and we can take them straight to the seating."],
    ['conciergeNote', 'es', null, 'Es la velada más amable que ofrece Luxor: sentado, sin prisa, una hora entre columnas iluminadas.', 'Es una velada primero de pie y luego sentado: se camina y se permanece de pie por el templo iluminado y, para el final, uno se sienta junto al Lago Sagrado, en torno a una hora en total. Si alguien de tu grupo no puede hacer el recorrido a pie, dilo al reservar y podemos llevarlo directamente a los asientos.'],
    ['conciergeNote', 'ja', null, 'ルクソールで最も穏やかな夜の過ごし方です——座ったまま、急がず、光に浮かぶ列柱のなかで1時間。', '照らされた神殿を歩き、立ち止まりながらめぐり、最後は聖なる湖のほとりに座って見る夜です——全体でおよそ1時間。歩くのが難しい方がいらっしゃる場合は、ご予約時にお知らせください。そのまま客席へご案内します。'],
    // card
    ['shape.character', 'en', null, 'seated and undemanding', 'you walk and stand through the temple, then sit by the Sacred Lake'],
    ['shape.character', 'es', null, 'sentada y sin exigencia · Suave, sin caminatas largas', 'se recorre el templo a pie y de pie, y el final es sentado junto al Lago Sagrado'],
    // inclusions (hidden rows, kept consistent)
    ['inclusions', 'en', null, 'Guided after-dark experience of Karnak', 'Your entrance to the Sound & Light Show at Karnak'],
    ['inclusions', 'es', null, 'Experiencia guiada después del anochecer en Karnak', 'Tu entrada al espectáculo de luz y sonido de Karnak'],
    ['inclusions', 'ja', null, '暗くなってからのガイド付き体験', 'カルナックの光と音のショーの入場'],
    // body
    ['body', 'en', '000000000005', 'the willingness to sit still and let the scale of the place land', "the willingness to move at the show's pace and let the scale of the place land"],
    ['body', 'es', '000000000007', 'la disposición a permanecer sentado y a dejar que la escala del lugar se asiente', 'la disposición a avanzar al ritmo del espectáculo y a dejar que la escala del lugar se asiente'],
    ['body', 'ja', '00000000000b', 'じっと座り、この場所の規模が腑に落ちるのにまかせる気構えに', 'ショーの歩みに合わせて進み、この場所の規模が腑に落ちるのにまかせる気構えに'],
    ['body', 'en', '000000000007', 'is a guided after-dark experience of a site most visitors have already seen by daylight', 'is the Sound & Light Show at a site most visitors have already seen by daylight'],
    ['body', 'es', '000000000009', 'una experiencia guiada después del anochecer en un yacimiento que la mayoría de los visitantes ya ha pisado de día', 'el espectáculo de luz y sonido en un yacimiento que la mayoría de los visitantes ya ha pisado de día'],
    ['body', 'ja', '00000000000d', 'の、暗くなってからのガイド付き体験と、', 'での光と音のショーと、'],
    // the "no minimum age" lead-in (bold span) + its sentence: rewritten together, bold kept
    ['lead', 'en', '000000000015', ' is provided for the transfer. There is ', ' is provided for the transfer. ', 'Suited to those steady on their feet', ". You walk and stand through the temple in low light, on uneven ground, before sitting for the finale. We don't recommend it for small children: the narration is long and the evening is late."],
    ['lead', 'es', '000000000017', ' para el traslado. ', ' para el traslado. ', 'Conviene a quien se mantiene firme sobre sus pies', '. Se camina y se permanece de pie por el templo con poca luz, sobre terreno irregular, antes de sentarse para el final. No lo recomendamos para niños pequeños: la narración es larga y la velada es tarde.'],
    // hidden audience note
    ['audienceNote', 'ja', null, '、夕方のアクティビティを探す家族', ''],
  ],
  [PHILAE]: [
    ['conciergeNote', 'en', null, "but the show itself is a seated performance shared with the evening's audience. It sits gently at the end of a day,", "but the show itself is shared with the evening's audience: you walk and stand through the temple, then sit on benches for the finale. It sits well at the end of a day,"],
    ['conciergeNote', 'es', null, 'el espectáculo es una función con asientos que se comparte con el público de esa noche. Encaja con suavidad al final del día,', 'el espectáculo se comparte con el público de esa noche: se recorre el templo a pie y de pie, y para el final uno se sienta en bancos. Encaja bien al final del día,'],
    ['conciergeNote', 'ja', null, 'ショーそのものは当夜の観客と共にする着席式の公演です。一日の締めくくりに静かに収まる催しで', 'ショーそのものは当夜の観客と共にするもので、神殿を歩いて立ったままめぐり、最後はベンチに座ってご覧いただきます。一日の締めくくりに収まる催しで'],
    ['shape.character', 'en', null, 'shared seated performance at the temple', 'shared performance at the temple (walk and stand, then seated for the finale)'],
    ['shape.character', 'es', null, 'función sentada y compartida en el templo · entradas incluidas · varios idiomas · Suave', 'función compartida en el templo (a pie y de pie, con final sentado) · entradas incluidas · varios idiomas'],
    ['inclusions', 'en', null, 'Private road transfer and motorboat crossing', 'Private road transfer and the motorboat to the island and back'],
    ['inclusions', 'es', null, 'Traslado por carretera y cruce en lancha privados a su grupo', 'Traslado por carretera y lancha de ida y vuelta a la isla, privados a su grupo'],
    ['body', 'en', '000000000005', 'Children tend to find it genuinely exciting.', "We don't recommend it for small children: the evening is late and the narration is long."],
    ['body', 'es', '000000000007', 'A los niños suele resultarles genuinamente emocionante.', 'No lo recomendamos para niños pequeños: la velada es tarde y la narración es larga.'],
    ['body', 'ja', '00000000000b', 'お子様はたいてい本当に胸を躍らせます。', '小さなお子様にはおすすめしません。夜が遅く、語りも長いためです。'],
    ['lead', 'en', '000000000015', ' is provided. There is ', ' is provided. ', 'Suited to those steady on their feet', ". You step on and off a small boat in the dark, then walk and stand through the temple on uneven paving before sitting for the finale. We don't recommend it for small children."],
    ['lead', 'es', '000000000017', '. ', '. ', 'Conviene a quien se mantiene firme sobre sus pies', '. Se sube y se baja de una lancha pequeña en la oscuridad y se recorre el templo a pie y de pie sobre pavimento irregular antes de sentarse para el final. No lo recomendamos para niños pequeños.'],
    ['audienceNote', 'ja', null, '家族、', ''],
  ],
};

const clone = (x) => JSON.parse(JSON.stringify(x));
function replaceOnce(str, find, repl) { const n = str.split(find).length - 1; if (n === 1) return str.replace(find, () => repl); if (n === 0 && repl && str.includes(repl)) return str; if (n === 0 && !repl) return str; throw new Error(`"${find.slice(0, 50)}" found ${n}× (needs exactly 1)`); }

const results = [];
for (const [id, fixes] of Object.entries(FIX)) {
  const doc = await client.getDocument(id);
  if (!doc) throw new Error(`${id} not found`);
  if (await client.getDocument(`drafts.${id}`)) throw new Error(`drafts.${id} exists`);
  const next = { conciergeNote: clone(doc.conciergeNote), audienceNote: clone(doc.audienceNote), inclusions: clone(doc.inclusions), body: clone(doc.body), shapeCharacter: clone(doc.shapeOfDay?.character) };
  let changed = 0;
  for (const [field, loc, block, find, repl] of fixes) {
    let done = false;
    if (field === 'conciergeNote' || field === 'audienceNote') {
      const row = next[field].find((r) => r._key === loc); if (!row) throw new Error(`${id} ${field}[${loc}] missing`);
      const v = replaceOnce(row.value, find, repl); done = v !== row.value; row.value = v;
    } else if (field === 'shape.character') {
      const row = next.shapeCharacter.find((r) => r._key === loc); if (!row) throw new Error(`${id} shape.character[${loc}] missing`);
      const v = replaceOnce(row.value, find, repl); done = v !== row.value; row.value = v;
    } else if (field === 'inclusions') {
      const row = next.inclusions.find((r) => r.lang === loc && r.text === find);
      if (row) { row.text = repl; done = true; } else if (!next.inclusions.some((r) => r.lang === loc && r.text === repl)) throw new Error(`${id} inclusion "${find}" (${loc}) missing`);
    } else if (field === 'lead') {
      // find=span8 old text, repl=span8 new text, then bold lead + tail sentence replace spans 9 and 10
      const b = next.body.find((r) => r._key === loc)?.value.find((x) => x._key === block); if (!b) throw new Error(`${id} body[${loc}] ${block} missing`);
      const [, , , , , boldText, tailText] = fixes.find((f) => f[0] === 'lead' && f[1] === loc && f[2] === block);
      const c = b.children; const i9 = c.findIndex((x, i) => i >= 1 && x.marks?.includes('strong') && /no minimum age|No hay edad mínima|Suited to those|Conviene a quien/.test(x.text));
      if (i9 < 1 || !c[i9 + 1]) throw new Error(`${id} body[${loc}] ${block}: lead-in span not found`);
      if (c[i9].text === boldText) { done = false; } else { c[i9 - 1].text = c[i9 - 1].text.replace(find, () => repl); c[i9].text = boldText; c[i9 + 1].text = tailText; done = true; }
    } else if (field === 'body') {
      const b = next.body.find((r) => r._key === loc)?.value.find((x) => x._key === block); if (!b) throw new Error(`${id} body[${loc}] ${block} missing`);
      const hits = b.children.filter((c) => c.text.includes(find));
      if (hits.length === 1) { hits[0].text = hits[0].text.replace(find, () => repl); done = true; }
      else if (hits.length === 0 && b.children.some((c) => c.text.includes(repl))) done = false;
      else throw new Error(`${id} body[${loc}] ${block}: "${find.slice(0, 50)}" in ${hits.length} spans (needs exactly 1)`);
    }
    if (done) changed++;
    console.log(`${done ? 'CHANGE ' : 'already'} ${id.slice(0, 22)} ${field}[${loc}${block ? ' ' + block : ''}] ${done ? '← ' + find.slice(0, 60) : ''}`);
  }
  results.push({ id, next, changed });
}
const total = results.reduce((a, r) => a + r.changed, 0);
console.log(`${total} change(s) across ${results.length} pages`);
if (apply && total) {
  await writeRollback(client, results.filter((r) => r.changed).map((r) => r.id), 'before-sound-light-claims-fix');
  for (const { id, next, changed } of results) {
    if (!changed) continue;
    await client.patch(id).set({ conciergeNote: next.conciergeNote, audienceNote: next.audienceNote, inclusions: next.inclusions, body: next.body, 'shapeOfDay.character': next.shapeCharacter }).commit();
    console.log(`APPLIED ${id}`);
  }
} else if (!apply) console.log('dry run (--apply writes production)');
