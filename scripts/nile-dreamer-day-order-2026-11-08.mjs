/**
 * Nile Dreamer (wp-page-89376) — fix round 2, Task B (2026-11-08).
 * Re-orders the day-by-day to the owner's programme:
 *   1 Cairo · 2 Cairo · 3 Cairo + night train · 4 Aswan (hotel) · 5 board cruise ·
 *   6 Kom Ombo & Edfu · 7 Luxor East Bank · 8 West Bank + flight → Cairo ·
 *   9 Memphis/Saqqara/Dahshur + free time · 10 departure
 *   = 2 Cairo + 1 train + 1 Aswan + 3 cruise + 2 Cairo nights.
 * Existing sentences are reused; only day references and connecting phrases
 * change. The old day-2 paragraph is split into day 2 and a new day-3 block.
 * Dry run by default; --write to apply. Backup: scratchpad nile-dreamer-pre-round2.json
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';

const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });
const ID = 'wp-page-89376';
const doc = await c.fetch(`*[_id == $id][0]{_rev, body}`, { id: ID });

function rep(text, from, to) {
  const n = text.split(from).length - 1;
  if (n !== 1) throw new Error(`expected 1× "${from.slice(0, 60)}", found ${n}`);
  return text.replace(from, to);
}
function lastSentences(text, startMarker) {
  const i = text.indexOf(startMarker);
  if (i < 0) throw new Error(`marker not found: ${startMarker.slice(0, 40)}`);
  return [text.slice(0, i).trimEnd(), text.slice(i)];
}

const PLAN = {
  en: {
    split: { marker: 'From there the day climbs to the Saladin Citadel', d2Tail: ' The night is spent again at your Cairo hotel.', d3Head: 'Day three stays in Cairo. ', d3Fix: ['From there the day climbs to the Saladin Citadel', 'The day climbs to the Saladin Citadel'] },
    edits: {
      '000000000015': [['You wake on the train to breakfast', 'On day four you wake on the train to breakfast']],
      '000000000017': [['The night is spent in an Aswan hotel.', 'Tonight is spent in a hotel in Aswan; the cruise boards tomorrow morning.']],
      '00000000001b': [['The fourth day marks the shift', 'The fifth day marks the shift'], ['and a morning of Aswan monuments', 'and a day of Aswan monuments']],
      '00000000001d': [['Day five is the heart', 'Day six is the heart']],
      '000000000023': [['The cruise arrives in Luxor', 'On day seven the cruise arrives in Luxor']],
      '000000000025': [['The West Bank is where the New Kingdom pharaohs buried their dead', 'Day eight is for the West Bank, where the New Kingdom pharaohs buried their dead'], ['In the afternoon you transfer to Luxor Airport', 'In the afternoon you disembark and transfer to Luxor Airport']],
      '00000000002f': [['with the open day after the cruise built in as recovery', 'with free time after the cruise built in as recovery']],
    },
    close: {
      memphisLead: ['The final full day reaches back', 'Day nine, the final full day, reaches back'],
      dinnerMarker: 'The day ends with a dinner cruise',
      free: [
        ['Day eight belongs to you.', 'The rest of the day belongs to you.'],
        ['The programme makes no demands — after a week of early starts', 'The programme makes no further demands — after more than a week of early starts'],
        ['You can return to any site from day two that deserved more time', 'You can return to any Cairo site that deserved more time'],
        ['after seven days of monuments.', 'after more than a week of monuments.'],
      ],
      nightTail: ' The night is spent at your Cairo hotel.',
    },
  },
  es: {
    split: { marker: 'Después, la jornada sube a la Ciudadela', d2Tail: ' La noche se pasa de nuevo en el hotel de El Cairo.', d3Head: 'El tercer día sigue en El Cairo. ', d3Fix: ['Después, la jornada sube a la Ciudadela', 'La jornada sube a la Ciudadela'] },
    edits: {
      '000000000015': [['Se desayuna en el tren', 'El cuarto día se desayuna en el tren']],
      '000000000017': [['La noche se pasa en un hotel de Asuán.', 'Esta noche se pasa en un hotel de Asuán; el crucero se embarca mañana por la mañana.']],
      '00000000001b': [['El cuarto día marca el cambio', 'El quinto día marca el cambio'], ['y una mañana de monumentos en Asuán', 'y una jornada de monumentos en Asuán']],
      '00000000001d': [['El quinto día concentra', 'El sexto día concentra']],
      '000000000023': [['El crucero llega a Luxor', 'El séptimo día el crucero llega a Luxor']],
      '000000000025': [['La orilla occidental es donde los faraones del Imperio Nuevo enterraron a sus muertos', 'El octavo día es para la orilla occidental, donde los faraones del Imperio Nuevo enterraron a sus muertos'], ['Por la tarde, traslado al aeropuerto de Luxor', 'Por la tarde, desembarque y traslado al aeropuerto de Luxor']],
      '00000000002f': [['con la jornada abierta después del crucero pensada como recuperación', 'con tiempo libre después del crucero pensado como recuperación']],
    },
    close: {
      memphisLead: ['El último día completo recupera', 'El noveno día, el último completo, recupera'],
      dinnerMarker: 'El día termina con una cena-crucero',
      free: [
        ['El octavo día pertenece al viajero.', 'El resto del día pertenece al viajero.'],
        ['El programa no exige nada: después de una semana de madrugones', 'El programa no exige nada más: después de más de una semana de madrugones'],
        ['Se puede volver a cualquier sitio del segundo día que merezca más tiempo', 'Se puede volver a cualquier sitio de El Cairo que merezca más tiempo'],
        ['tras siete días de monumentos.', 'tras más de una semana de monumentos.'],
      ],
      nightTail: ' La noche se pasa en el hotel de El Cairo.',
    },
  },
  ja: {
    split: { marker: 'そこからサラディン城塞へ登り', d2Tail: 'この夜もカイロのホテルに宿泊します。', d3Head: '三日目もカイロです。', d3Fix: ['そこからサラディン城塞へ登り', 'サラディン城塞へ登り'] },
    edits: {
      '000000000015': [['列車で朝食を取りつつ目を覚ますと', '四日目、列車で朝食を取りつつ目を覚ますと']],
      '000000000017': [['夜はアスワンのホテルに宿泊します。', '今夜はアスワンのホテルに宿泊し、クルーズへの乗船は翌朝です。']],
      '00000000001b': [['四日目は、旅の性格', '五日目は、旅の性格'], ['アスワンの遺跡の朝のあと', 'アスワンの遺跡の一日のあと']],
      '00000000001d': [['五日目はクルーズ', '六日目はクルーズ']],
      '000000000023': [['クルーズはルクソール', '七日目、クルーズはルクソール']],
      '000000000025': [['翌朝は西岸。', '八日目の朝は西岸。'], ['午後はルクソール空港へ向かい', '午後は下船してルクソール空港へ向かい']],
      '00000000002f': [['クルーズ後の自由日が', 'クルーズ後の自由時間が']],
    },
    close: {
      memphisLead: ['最終フル日は、', '九日目、最終フル日は、'],
      dinnerMarker: '一日はカイロでのナイル・ディナークルーズで締めくくります。',
      free: [
        ['八日目は完全な自由日です。', '残りの時間は自由です。'],
        ['一週間早朝発と密度の高い日程を続けてきたあとに、これは意図して置いた一日です。', '一週間以上早朝発と密度の高い日程を続けてきたあとに、これは意図して置いた時間です。'],
        ['二日目の遺跡で時間をもっと取りたかった場所へ戻る', 'もっと時間を取りたかったカイロの遺跡へ戻る'],
        ['七日間の遺跡行程を経たあとなら', '一週間以上の遺跡行程を経たあとなら'],
      ],
      nightTail: 'その夜もカイロのホテルに宿泊します。',
    },
  },
};

const sets = {};
const inserts = [];
for (const [loc, plan] of Object.entries(PLAN)) {
  const blocks = doc.body.find((l) => l._key === loc).value;
  const get = (k) => {
    const b = blocks.find((x) => x._key === k);
    if (!b || b.children.length !== 1) throw new Error(`${loc}/${k}: missing or multi-span`);
    return b;
  };
  const pathOf = (k) => `body[_key=="${loc}"].value[_key=="${k}"].children[_key=="${get(k).children[0]._key}"].text`;

  // Split old day 2 into day 2 + new day 3.
  const b11 = get('000000000011');
  const [d2, rest] = lastSentences(b11.children[0].text, plan.split.marker);
  sets[pathOf('000000000011')] = d2 + plan.split.d2Tail;
  const d3 = plan.split.d3Head + rep(rest, plan.split.d3Fix[0], plan.split.d3Fix[1]);
  inserts.push({ loc, block: { _key: 'r2day3', _type: 'block', style: 'normal', markDefs: [], children: [{ _key: 'r2day3s', _type: 'span', marks: [], text: d3 }] } });

  for (const [k, pairs] of Object.entries(plan.edits)) {
    let t = get(k).children[0].text;
    for (const [a, b] of pairs) t = rep(t, a, b);
    sets[pathOf(k)] = t;
  }

  // Close: block 29 ← Memphis (old 2b minus the dinner close); block 2b ← free time + dinner close + night.
  const old29 = get('000000000029').children[0].text;
  const old2b = get('00000000002b').children[0].text;
  const [memphis, dinner] = lastSentences(old2b, plan.close.dinnerMarker);
  sets[pathOf('000000000029')] = rep(memphis, plan.close.memphisLead[0], plan.close.memphisLead[1]);
  let free = old29;
  for (const [a, b] of plan.close.free) free = rep(free, a, b);
  sets[pathOf('00000000002b')] = `${free}${loc === 'ja' ? '' : ' '}${dinner}${plan.close.nightTail}`;
}

for (const [k, v] of Object.entries(sets)) console.log('\n' + k.replace(/children.*/, '') + '\n  ' + v.slice(0, 220) + (v.length > 220 ? ' …' : ''));
for (const i of inserts) console.log(`\nINSERT after 000000000011 [${i.loc}]\n  ${i.block.children[0].text.slice(0, 220)} …`);

if (process.argv.includes('--write')) {
  const res = await c.patch(ID).set(sets).commit({ autoGenerateArrayKeys: false });
  console.log('\ncommitted sets', res._rev);
  // A patch carries only ONE insert operation (chained .insert() calls
  // overwrite each other), so each locale's new day-3 block is its own commit.
  for (const i of inserts) {
    await c.patch(ID).insert('after', `body[_key=="${i.loc}"].value[_key=="000000000011"]`, [i.block]).commit({ autoGenerateArrayKeys: false });
    console.log('inserted day 3 for', i.loc);
  }
} else console.log(`\ndry run — ${Object.keys(sets).length} sets, ${inserts.length} inserts; pass --write`);
