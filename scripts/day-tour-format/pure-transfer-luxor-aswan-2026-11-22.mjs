/**
 * Luxor → Aswan by road becomes a PURE TRANSFER (owner, 22 Nov: "Transfer, keep it and transfer only. Don't show
 * any options to turn it into a tour at all. Just a pure transfer."). Removed in EN/ES/JA: the three service
 * levels, the optional Edfu / Kom Ombo stops, the guide and entrance-fee wording, the guide-language prices.
 * The temple day is the separate Aswan → Luxor tour (merged 22 Nov, PR #345); this page does not link to it.
 *
 * Price: priceFrom stays 76 (EUR, as live); guideLanguagePrices removed, so ES/JA show the same single price.
 * Duration: "about four hours" (the JA page already said ~4 h direct; the 5–6 h figure included the temple stops).
 * Copy is new text for the owner to review (needsReview on the inclusion facts).
 *
 *   node --env-file=<.env> scripts/day-tour-format/pure-transfer-luxor-aswan-2026-11-22.mjs           # dry run
 *   node --env-file=<.env> scripts/day-tour-format/pure-transfer-luxor-aswan-2026-11-22.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const ID = 'tour.private-tour-transfer-from-luxor-to-aswan-by-bus';
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN });
const doc = await client.getDocument(ID);
if (!doc) throw new Error('missing ' + ID);
if (await client.getDocument(`drafts.${ID}`)) throw new Error('draft exists');

const COPY = {
  en: {
    title: 'Luxor to Aswan by Road: Private Transfer',
    summary: 'A private road transfer between Luxor and Aswan: your own vehicle, picked up at your Luxor hotel and delivered to your Aswan hotel. Around four hours, door to door.',
    concierge: 'Tell us your Luxor hotel, your Aswan hotel and the hour you would like to leave, and we will arrange the car and the road permit around it.',
    audience: 'Travellers moving south to Aswan or joining a Nile cruise who want to arrive without flying or taking the night train',
    duration: 'Half day · ~4 hrs',
    character: 'Private to your party · air-conditioned vehicle · mandatory road permit handled · transfer only · minimum age 18',
    where: 'Luxor hotel → Aswan hotel',
    durationLine: 'Around 4 hours door to door',
    facts: ['Private vehicle, exclusive to your party', 'Fixed pickup from your Luxor hotel', 'One bottle of mineral water per person', 'Drop-off at your Aswan hotel', 'The drive and the mandatory road permit'],
    body: [
      ['h2', 'Luxor to Aswan by Road'],
      ['p', 'A private road transfer between two of Egypt\'s great river cities: your own vehicle, your driver at the hotel door, and the Nile Valley passing the window. No flight, no terminal queue, no hours lost between stations.'],
      ['p', 'This is a transfer and nothing more. It moves you between Luxor and Aswan in a private vehicle, exclusive to your party, in roughly four hours depending on traffic. Your driver collects you from your Luxor hotel, the mandatory road permit is handled for you, and there is one bottle of mineral water per person. It takes bookings from a single traveller upward, with no minimum group; larger parties are accommodated in a suitable vehicle. The price shown is per person for two travellers sharing, and it is confirmed when you book.'],
      ['h4', 'The Route'],
      ['p', 'Your driver collects you from your Luxor hotel and heads south out of the city. The road keeps to the Nile Valley for most of the way, through sugarcane and farmland, with the desert edge never far off and the river keeping company for much of the journey. About 215 kilometres later, your driver delivers you to your Aswan hotel.'],
      ['h4', 'Who It Suits'],
      ['p', 'This transfer suits travellers who already have accommodation booked in Aswan, who want to arrive without finding their own way in an unfamiliar city, and who would rather spend the road time looking out of the window than managing a hire car.'],
      ['p', 'One practical note: this is a daytime journey, with departure from Luxor in the morning and arrival in Aswan around midday. The road is straightforward.'],
      ['p', 'Send the concierge your hotels and your preferred departure time, and the rest is arranged.'],
    ],
  },
  es: {
    title: 'Traslado privado de Luxor a Asuán por carretera',
    summary: 'Un traslado privado por carretera entre Luxor y Asuán: vehículo propio, con recogida en su hotel de Luxor y llegada a su hotel de Asuán. Unas cuatro horas, puerta a puerta.',
    concierge: 'Díganos su hotel en Luxor, su hotel en Asuán y la hora a la que desea salir, y organizaremos el coche y el permiso de carretera en torno a ella.',
    audience: 'Viajeros que se desplazan al sur hacia Asuán o que se incorporan a un crucero del Nilo y quieren llegar sin volar ni tomar el tren nocturno',
    duration: 'Medio día · ~4 h',
    character: 'Privado a su grupo · vehículo con aire acondicionado · permiso obligatorio de carretera incluido · solo traslado · edad mínima 18 años',
    where: 'Hotel de Luxor → hotel de Asuán',
    durationLine: 'Aproximadamente 4 horas puerta a puerta',
    facts: ['Vehículo privado, en exclusiva para su grupo', 'Recogida en su hotel de Luxor', 'Una botella de agua mineral por persona', 'Traslado al hotel de Asuán', 'La conducción y el permiso obligatorio de carretera'],
    body: [
      ['h2', 'De Luxor a Asuán por carretera'],
      ['p', 'Un traslado privado entre dos de las grandes ciudades del Nilo: vehículo propio, su conductor en la puerta del hotel y el valle del Nilo pasando por la ventanilla. Sin vuelo, sin colas de terminal, sin horas perdidas entre estaciones.'],
      ['p', 'Esto es un traslado y nada más. Le lleva entre Luxor y Asuán en un vehículo privado, en exclusiva para su grupo, en aproximadamente cuatro horas según el tráfico. Su conductor le recoge en el hotel de Luxor, el permiso obligatorio de carretera corre de nuestra cuenta y hay una botella de agua mineral por persona. Admite reservas desde un solo viajero, sin grupo mínimo; los grupos más numerosos se acomodan en un vehículo adecuado. El precio mostrado es por persona para dos viajeros que comparten, y se confirma al reservar.'],
      ['h4', 'La ruta'],
      ['p', 'Su conductor le recoge en el hotel de Luxor y sale de la ciudad hacia el sur. La carretera sigue el valle del Nilo casi todo el camino, entre cañaverales y campos, con el borde del desierto siempre cerca y el río haciendo compañía durante buena parte del trayecto. Unos 215 kilómetros después, su conductor le deja en su hotel de Asuán.'],
      ['h4', 'A quién le conviene'],
      ['p', 'Este traslado se ajusta al viajero que ya tiene alojamiento reservado en Asuán, que desea llegar sin tener que orientarse por su cuenta en una ciudad desconocida y que prefiere dedicar el tiempo de carretera a mirar por la ventanilla en lugar de gestionar un coche de alquiler.'],
      ['p', 'Una nota práctica: es un trayecto diurno, con salida de Luxor por la mañana y llegada a Asuán hacia el mediodía. La carretera es directa.'],
      ['p', 'Envíe al concierge sus hoteles y la hora de salida que prefiera, y el resto queda organizado.'],
    ],
  },
  ja: {
    title: 'ルクソールからアスワンへ陸路で：プライベート送迎',
    summary: 'ルクソールとアスワンを結ぶプライベートの陸路送迎です。ルクソールのホテルでお迎えし、アスワンのホテルまでお届けします。ドアからドアまで、およそ4時間です。',
    concierge: 'ルクソールのホテル、アスワンのホテル、ご希望の出発時刻をお知らせください。車と道路通行許可を、その時刻に合わせて手配いたします。',
    audience: '飛行機や夜行列車を使わずに、陸路でアスワンへ入りたい旅人、またはナイルクルーズに乗船される方',
    duration: '半日・約4時間',
    character: '完全プライベート・専用車両・道路通行許可は手配済・送迎のみ',
    where: 'ルクソールのホテル → アスワンのホテル',
    durationLine: 'ドアからドアまでおよそ4時間',
    facts: ['お客様のご一行だけのプライベートな専用車', 'ルクソールのホテルからの定められたお迎え', 'ミネラルウォーター1人1本', 'アスワンのホテルへの送り', 'ドライブと必須の道路通行許可'],
    body: [
      ['h2', 'ルクソールからアスワンへ陸路で'],
      ['p', 'エジプトを代表する二つのナイルの街を結ぶ、プライベートの送迎です。専用の車、ホテルの入口でお待ちするドライバー、そして窓の外を流れるナイル渓谷。飛行機も、ターミナルの行列も、駅と駅のあいだで失われる時間もありません。'],
      ['p', 'これは送迎であり、それ以上のものではありません。お客様のご一行だけの専用車で、ルクソールとアスワンのあいだを、交通状況によりますがおよそ4時間でお運びします。ドライバーがルクソールのホテルでお迎えし、必須の道路通行許可は当方で手配し、ミネラルウォーターを1人1本ご用意します。お一人からお受けし、最少催行人数はありません。人数の多いご一行には、適した車両をご用意します。表示の料金は2名様でご利用の場合の1人あたりで、ご予約の際に確定します。'],
      ['h4', '行程'],
      ['p', 'ドライバーがルクソールのホテルでお迎えし、街を出て南へ向かいます。道のりの大半はナイル渓谷に沿って進み、サトウキビ畑や農地を抜け、砂漠の縁がすぐそばにあり、川が長く寄り添います。およそ215キロメートル先のアスワンで、ドライバーがホテルまでお送りします。'],
      ['h4', 'こんな方に'],
      ['p', 'すでにアスワンの宿を予約していて、不慣れな街で自力で道を探すことなく到着したい方、そして道中の時間をレンタカーの運転ではなく窓の外を眺めて過ごしたい方に向いています。'],
      ['p', '実務的な一言：これは日中の道のりで、ルクソールを午前に出発し、正午ごろにアスワンに到着します。道は分かりやすいものです。'],
      ['p', 'ホテルとご希望の出発時刻をコンシェルジュにお知らせいただければ、あとは当方で手配します。'],
    ],
  },
};

const rnd = () => Math.random().toString(36).slice(2, 12);
const blocks = (rows) => rows.map(([k, t], i) => ({ _type: 'block', _key: `b${String(i).padStart(2, '0')}${rnd().slice(0, 4)}`, style: k === 'p' ? 'normal' : k, markDefs: [], children: [{ _type: 'span', _key: `s${rnd().slice(0, 6)}`, text: t, marks: [] }] }));
const setLang = (arr, lang, value) => (arr ?? []).map((r) => (r._key === lang ? { ...r, value } : r));
const mapAll = (arr, get) => ['en', 'es', 'ja'].reduce((a, l) => setLang(a, l, get(COPY[l])), arr);

const set = {
  title: mapAll(doc.title, (c) => c.title),
  summary: mapAll(doc.summary, (c) => c.summary),
  conciergeNote: mapAll(doc.conciergeNote, (c) => c.concierge),
  audienceNote: mapAll(doc.audienceNote, (c) => c.audience),
  durationLabel: mapAll(doc.durationLabel, (c) => c.duration),
  durationHours: 4,
  body: doc.body.map((r) => (COPY[r._key] ? { ...r, value: blocks(COPY[r._key].body) } : r)),
  inclusions: ['en', 'es', 'ja'].flatMap((l) => COPY[l].facts.map((t) => ({ _key: rnd(), _type: 'productFact', lang: l, needsReview: true, text: t, source: COPY[l].body[2][1] }))),
  shapeOfDay: {
    ...doc.shapeOfDay,
    character: mapAll(doc.shapeOfDay.character, (c) => c.character),
    where: mapAll(doc.shapeOfDay.where, (c) => c.where),
    duration: mapAll(doc.shapeOfDay.duration, (c) => c.durationLine),
  },
};

// Dry-run guard: nothing about stops, guide, levels or entrance fees may survive in any language.
const banned = /Edfu|Kom Ombo|Egyptolog|guide|entrance|admission|level|temple|エドフ|コム・オンボ|ガイド|入場|段階|神殿|egiptólog|guía|entradas|nivel|templo|parada|Horus|Sobek/i;
const visible = JSON.stringify([set.title, set.summary, set.conciergeNote, set.audienceNote, set.body, set.inclusions.map((f) => f.text), set.shapeOfDay]);
const hits = [...new Set(visible.match(new RegExp(banned.source, 'gi')) ?? [])];
console.log('banned-word check:', hits.length ? 'HITS ' + hits.join(', ') : 'clean');
if (hits.length) throw new Error('banned words remain');
console.log('priceFrom', doc.priceFrom, '→ unchanged; guideLanguagePrices', JSON.stringify(doc.guideLanguagePrices), '→ removed');
for (const l of ['en', 'es', 'ja']) console.log(l, COPY[l].title, '|', COPY[l].body.length, 'blocks');
if (!apply) { console.log('dry run — nothing written'); process.exit(0); }
await writeRollback(client, [ID], 'pure-transfer');
await client.patch(ID).set(set).unset(['guideLanguagePrices']).commit();
console.log('applied');
