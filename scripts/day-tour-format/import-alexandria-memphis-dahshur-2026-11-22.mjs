/**
 * Memphis, Saqqara & Dahshur: Private Day Trip from Alexandria, in the day-tour format, EN + ES + JA together
 * (owner, 22 Nov: locked copy + open items, delivered as a zip).
 *
 *   tour  tour.private-day-trip-to-memphis-saqqara-and-dahshur-from-alexandria
 *         /private-day-trip-to-memphis-saqqara-and-dahshur-from-alexandria   (URLs unchanged: no redirect)
 *
 * No tiers, no minimum age (the live essay said 18); the copy's own panel rows replace the rule rows (children 50 %,
 * pickup from any Alexandria hotel or at the port ENTRANCE, back, lunch, guide language). Included: entrance to
 * Memphis, Saqqara (with the Imhotep Museum and one nobles' tomb) and Dahshur, lunch, water, the driver's tip.
 * Inside the Step Pyramid, inside the Red Pyramid and further Saqqara tombs are EXTRA TICKETS, bought at the site
 * (the same handling as the Grand West Bank: optional extras with no prices).
 * Price: alexandria-memphis-dahshur-prices.json (Autoura T2E-DT-ALX-03 + the Memphis/Saqqara car card):
 * EUR 104 / ES 115 / JA 132 (live 122 / 133 / 140).
 *
 * Essay (Gate A.3, corrections 1-10): the tier paragraphs and the private paragraph (guide in your language, no
 * minimum age) are rewritten; the drive time is "about two and a half to three hours" (EN, ES and the JA road note);
 * pickup mentions the port entrance; the Step Pyramid line is "one of the earliest large buildings in dressed
 * stone"; the Bent Pyramid "keeps most of its original smooth casing"; the Red Pyramid is "about 105 metres high"
 * (no ranking). Hidden: the closing's second half (the page has its own closing), the concierge note that "advises
 * on tier", the ES-only closing and empty blocks.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-alexandria-memphis-dahshur-2026-11-22.mjs              # dry run
 *   node --env-file=<.env> scripts/day-tour-format/import-alexandria-memphis-dahshur-2026-11-22.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'tour.private-day-trip-to-memphis-saqqara-and-dahshur-from-alexandria';
const OLD = { from: 122, es: 133, ja: 140 };
const PRICES = JSON.parse(readFileSync(new URL('./alexandria-memphis-dahshur-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/memphis-saqqara-dahshur-from-alexandria';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (22 Nov 2026).`;

const G = {
  memphis: 'guideArticle.giza.memphis-mit-rahina',
  saqqara: 'guideArticle.giza.the-saqqara-necropolis',
  imhotep: 'guideArticle.giza.imhotep-museum-at-saqqara',
  bent: 'guideArticle.giza.the-bent-pyramid-of-sneferu',
  red: 'guideArticle.giza.the-red-pyramid-of-sneferu',
};
// Sites per stop, in file order: Memphis open-air museum · Saqqara + Step Pyramid of Djoser (no page of its own: the
// necropolis guide) · Imhotep Museum + Saqqara nobles' tombs · Bent Pyramid · Red Pyramid.
const SITE_GUIDES = [[G.memphis], [G.saqqara, G.saqqara], [G.imhotep, G.saqqara], [G.bent], [G.red]];
const DURATION_LABEL = { en: 'Long day · ~10–12 hrs', es: 'Jornada larga · ~10–12 h', ja: '長めの1日・約10〜12時間' };
const DURATION_HOURS = 11;
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo' },
  ja: { pickup: 'お迎え', lunch: '昼食' },
};
const PERIOD = { Evening: 'evening', Noche: 'evening', 夜: 'evening', Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 昼: 'midday', 午後: 'afternoon' };

/* ── Parse ────────────────────────────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t　]+$/gm, '').trim();
const plain = (s) => clean(s.replace(/\*\*|\*/g, ''));
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
const SEP = /\s+·\s+/;
function parseLocale(l) {
  const md = readFileSync(new URL(LOCKED[l], ROOT), 'utf8');
  const title = plain(md.match(/^# (.+)$/m)[1]);
  const secs = sections(md);
  if (secs.length !== 7) throw new Error(`${l}: expected 7 sections, found ${secs.length}`);
  const [panel, opening, why, day, incl, forYou, mine] = secs;
  const panelLines = panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], plain(m[2]).replace(/\s*\(ES: .*\)$/, '')]);
  const panelRows = Object.fromEntries(panelLines);
  // The panel's own rows, as written: all but the Type/Duration line and the From placeholder.
  const ownRows = panelLines.slice(1).filter(([, v]) => !/\{.*\}/.test(v)).map(([label, text]) => ({ label, text }));
  const periods = day.text.split(/\n### /).slice(1).map((chunk) => {
    const [head, ...rest] = chunk.split('\n');
    const [word, ...labelParts] = head.split(/\s*[·・]\s*/);
    const period = PERIOD[word.trim()];
    if (!period || !labelParts.length) throw new Error(`${l}: unknown period heading "${head}"`);
    const stops = [];
    for (const p of paras(rest.join('\n'))) {
      if (p.startsWith('>')) continue; // "More about this evening →" pointer
      const lines = p.split('\n');
      const hm = lines[0].match(/^\*\*(.+)\*\*$/);
      if (!hm) throw new Error(`${l}: unexpected paragraph in "${head}": ${p.slice(0, 60)}`);
      const tm = plain(hm[1]).match(/^(\d\d:\d\d)\s*[·・]\s*(.+)$/);
      const stop = tm ? { time: tm[1], title: tm[2] } : { title: plain(hm[1]) };
      const body = [];
      for (const ln of lines.slice(1)) {
        const sm = ln.match(/^\*?(Sites|Lugares|見学地)[^:：]*[:：]\*?[:：]?\s*(.+)$/);
        if (sm) stop.sites = sm[2].split(SEP).map((x) => plain(x));
        else if (ln.startsWith('- ')) (stop.optional ??= []).push(plain(ln.slice(2)));
        else body.push(ln);
      }
      if (body.length) stop.text = plain(body.join(' '));
      stops.push(stop);
    }
    return { period, periodLabel: plain(labelParts.join(l === 'ja' ? '・' : ' · ')), stops };
  });
  const sub = (t) => t.split(/\n(?=\*\*)/).map((blk) => ({ h: (blk.match(/^\*\*(.+?)\*\*/) ?? [])[1], items: bullets(blk).map(plain) })).filter((x) => x.h);
  const [inc, exc] = sub(incl.text);
  const [fit, worth] = sub(forYou.text);
  const tail = paras(mine.text);
  return {
    title, panelRows, ownRows, periods,
    opening: plain(paras(opening.text)[0]), whyThisOrder: plain(paras(why.text)[0]),
    included: inc.items, excluded: exc.items, fitFor: fit.items, worthKnowing: worth.items,
    options: bullets(mine.text).map(plain), closingLine: plain(tail[tail.length - 1]),
  };
}
const P = Object.fromEntries(LANGS.map((l) => [l, parseLocale(l)]));
// The summary / meta description: the locked opening's own first two sentences.
const SUMMARY = Object.fromEntries(LANGS.map((l) => [l, (P[l].opening.match(l === 'ja' ? /^(?:[^。]+。){2}/ : /^(?:.+?[.!?](?:\s+|$)){2}/) ?? [P[l].opening])[0].trim()]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [!!s.text, s.sites?.length ?? 0, !!s.time, s.optional?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opt: p.options.length, rows: p.ownRows.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
for (const l of LANGS) for (const k of ['pickup', 'lunch']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel (${Object.keys(P[l].panelRows).join(', ')})`);
const siteStops = P.en.periods.flatMap((x) => x.stops).filter((s) => s.sites);
if (siteStops.length !== SITE_GUIDES.length || siteStops.some((s, i) => s.sites.length !== SITE_GUIDES[i].length)) throw new Error('sites ≠ SITE_GUIDES');

/* ── Numeric gate ─────────────────────────────────────────────────────── */
const flat = (l) => {
  const p = P[l];
  return {
    opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
    ...Object.fromEntries(p.ownRows.map((r, i) => [`panel${i}`, r.text])),
    ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text], ...(s.optional ?? []).map((o, i) => [`p${pi}s${si}.o${i}`, o])])).filter(([, v]) => v)),
    ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
    ...Object.fromEntries(p.fitFor.map((t, i) => [`fit${i}`, t])),
    ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
  };
};
// Same figures, checked by hand (open items, "Numeric gate (22 Nov)": EN/ES 2, 6, 12, 50; JA adds 1 for 1名様).
const SAME_MEANING = { es: ['p0s1.x', 'p0s3.x', 'p2s0.x'], ja: ['why', 'p0s2.x'] };
for (const l of ['es', 'ja']) {
  const en = flat('en'), lc = flat(l);
  for (const k of SAME_MEANING[l]) { if (!(k in lc)) throw new Error(`${l}: SAME_MEANING key ${k} not found`); delete en[k]; delete lc[k]; console.log(`numeric gate (${l}): ${k} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

/* ── Build ────────────────────────────────────────────────────────────── */
function build(l) {
  const p = P[l];
  let siteStop = 0;
  const timeline = p.periods.map((x, pi) => ({
    _key: `dt-${l}-${pi + 1}`, _type: 'dayTourPeriod', lang: l, period: x.period, periodLabel: x.periodLabel,
    stops: x.stops.map((s, si) => {
      const guides = s.sites ? SITE_GUIDES[siteStop++] : null;
      if (s.sites && guides.length !== s.sites.length) throw new Error(`${l}: site/guide count mismatch at ${s.title}`);
      return {
        _key: `s${pi + 1}-${si + 1}`, _type: 'dayTourStop', ...(s.time ? { time: s.time } : {}), title: s.title, ...(s.text ? { text: s.text } : {}),
        ...(s.optional ? { skipGlance: true, optional: s.optional.map((text, k) => ({ _key: `o${k + 1}`, _type: 'dayTourOptional', text, cost: 'extraTicket' })) } : {}),
        ...(s.sites ? { sites: s.sites.map((name, k) => ({ _key: `x${pi + 1}${si + 1}${k}`, _type: 'dayTourSite', name, ...(guides[k] ? { guideRef: { _type: 'reference', _ref: guides[k], _weak: true } } : {}) })) } : {}),
      };
    }),
    source: SRC(l), needsReview: false,
  }));
  const fact = (list, prefix) => list.map((t, i) => ({ _key: `${prefix}${i + 1}-${l}`, _type: 'productFact', lang: l, text: t, source: SRC(l), needsReview: false }));
  return {
    timeline,
    intro: {
      _key: `dti-${l}`, _type: 'dayTourIntro', lang: l,
      opening: p.opening, whyThisOrder: p.whyThisOrder,
      pickupLine: p.panelRows[PANEL[l].pickup],
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      panelRows: p.ownRows.map((r, i) => ({ _key: `pr${i + 1}`, _type: 'dayPanelRow', ...r })),
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'gwin'), excluded: fact(p.excluded, 'gwout'), options: fact(p.options, 'gwopt'),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));

/* ── Document and essay ───────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (doc.type !== 'dayTour') throw new Error('not a day tour');
if (await client.getDocument(`drafts.${DOC_ID}`)) throw new Error(`drafts.${DOC_ID} exists — handle it first`);
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja].join();
if (![[OLD.from, OLD.es, OLD.ja].join(), [PRICES.en, PRICES.es, PRICES.ja].join()].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const TIER_FIELDS = ['priceTiers', 'tiers', 'tourLevels', 'levels', 'optionLink', 'optionLinks', 'minimumAge', 'ageLine', 'ageNote'];
const tierLeft = TIER_FIELDS.filter((f) => doc[f] != null);
if (tierLeft.length) throw new Error(`tier/age fields present (${tierLeft.join(', ')}) — retire them first`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// The essay's two closing sentences (the page has its own closing line): block 1 = closingRef, block 2 hidden.
const CLOSING_REF = { en: '00000000003f', es: '000000000043', ja: '000000000048' };
// Hidden: the closing's second sentence · the concierge note ("advise on tier") · empty block · ES the extra closing.
const SKIP = {
  en: ['000000000041', '00000000004f', '000000000052'],
  es: ['000000000045', '000000000055', '000000000058'],
  ja: ['00000000004a', '000000000058', '00000000005b'],
};
// Whole blocks rewritten (their bold / link runs are lost): the private-tour paragraph and the tier paragraph.
const REPLACE = {
  en: {
    '000000000015': 'This is a private tour, operated for your party alone — your vehicle, your Egyptologist guide, your pace — with pickup from Alexandria (any hotel, or the entrance of Alexandria port) and a full-day return the same evening. Because it is private, it runs for as few as one traveller, with no minimum group size and no waiting on other bookings; larger parties are accommodated in a suitable vehicle. A private, air-conditioned vehicle, a licensed Egyptologist guide in your language, and one bottle of mineral water per person are included. Given the long desert drive, the heat, and the uneven ground at the sites, it is a long day.',
    '00000000001d': 'Entrance to all three sites and lunch are included; inside the pyramids is extra.',
  },
  es: {
    '000000000017': 'Se trata de un tour estrictamente privado, operado en exclusiva para su grupo —vehículo propio, guía egiptólogo propio, ritmo propio— con recogida en Alejandría (en cualquier hotel o en la entrada del puerto de Alejandría) y regreso de día completo la misma noche. Por su carácter privado, opera desde un único viajero, sin tamaño mínimo de grupo y sin esperas a otras reservas; los grupos más amplios se acomodan en un vehículo adecuado. Se incluyen un vehículo privado con aire acondicionado, un guía egiptólogo titulado en tu idioma y una botella de agua mineral por persona. Dado el largo trayecto por el desierto, el calor y el terreno irregular de los sitios, es una jornada larga.',
    '00000000001f': 'Las entradas a los tres sitios y el almuerzo están incluidos; entrar en las pirámides es aparte.',
  },
  ja: {
    '00000000001b': 'これはプライベートツアーで、お客様のご一行だけのために運行します——お客様だけの車、お客様だけのエジプト学ガイド、お客様のペースで——アレクサンドリア（市内のホテル、またはアレクサンドリア港の入口）でお迎えし、同じ夜に一日がかりで戻ります。プライベートですので、お一人から承り、最少催行人数も、ほかの予約を待つこともありません。人数の多いご一行には、適した車両をご用意します。エアコン付きのプライベート車両、お客様の言語を話すライセンスを持つエジプト学ガイド、ミネラルウォーター1人1本が含まれます。長い砂漠のドライブ、暑さ、遺跡の不整地を考えると、長い一日になります。',
    '000000000023': '3つの遺跡への入場と昼食が含まれます。ピラミッドの内部は別料金です。',
  },
};
// [block, find, replace] — corrections 1-3 and 6, 9; each find sits inside one text run.
const FIX = {
  en: [
    ['000000000023', 'pickup from your Alexandria hotel.', 'pickup from your Alexandria hotel, or a meeting at the port entrance if you arrive by cruise ship.'], // 9
    ['000000000023', 'takes the better part of two hours under normal conditions', 'takes about two and a half to three hours under normal conditions'], // 6
    ['00000000002b', "It is Egypt's oldest monumental stone structure — not merely the first pyramid, but the first large-scale building in dressed stone anywhere in the world.", 'It is one of the earliest large buildings in dressed stone.'], // 1
    ['000000000037', 'It is the only major pyramid to retain most of its original smooth limestone casing', 'It keeps most of its original smooth limestone casing'], // 2
    ['000000000037', "At approximately 105 metres in height, it is Egypt's third-tallest pyramid.", 'It is about 105 metres high.'], // 3
  ],
  es: [
    ['000000000025', 'con la recogida en tu hotel de Alejandría.', 'con la recogida en tu hotel de Alejandría, o con un encuentro en la entrada del puerto si llegas en crucero.'],
    ['000000000025', 'consume la mejor parte de dos horas en condiciones normales', 'consume unas dos horas y media o tres en condiciones normales'],
    ['00000000002f', ' Es la estructura monumental en piedra más antigua de Egipto: no solo la primera pirámide, sino el primer edificio a gran escala en piedra labrada en cualquier parte del mundo.', ' Es uno de los primeros grandes edificios de piedra labrada.'],
    ['00000000003b', 'Es la única pirámide mayor que conserva la mayor parte de su revestimiento de caliza lisa original', 'Conserva la mayor parte de su revestimiento de caliza lisa original'],
    ['00000000003b', ' Con sus aproximadamente 105 metros de altura, es la tercera más alta de Egipto.', ' Tiene unos 105 metros de altura.'],
  ],
  ja: [
    ['000000000029', '一日はアレクサンドリアのホテルからの早朝のお迎えで始まります。', '一日はアレクサンドリアのホテルからの早朝のお迎え、またはクルーズでご到着の場合は港の入口での待ち合わせで始まります。'],
    ['000000000029', '通常の状況で2時間ほどかかり', '通常の状況で2時間半から3時間ほどかかり'],
    ['000000000031', 'エジプト最古の記念碑的な石造構造物——最初のピラミッドであるだけでなく、世界のどこでも最初の、切石による大規模な建築です。', '切石による、最も早い時期の大きな建築のひとつです。'],
    ['00000000003c', '当初のなめらかな石灰岩の化粧張りの大半を残す唯一の主要ピラミッドで、', '当初のなめらかな石灰岩の化粧張りの大半を残しており、'],
    ['00000000003c', '高さおよそ105メートルで、エジプトで三番目に高いピラミッドです。', '高さはおよそ105メートルです。'],
    ['000000000046', 'アレクサンドリアからの片道は通常2時間ほどですが', 'アレクサンドリアからの片道は通常2時間半から3時間ほどですが'],
  ],
};
const body = doc.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const k of [CLOSING_REF[l], ...SKIP[l], ...Object.keys(REPLACE[l]), ...FIX[l].map(([k]) => k)]) if (!keys.has(k)) throw new Error(`${l}: essay block ${k} missing`);
  return {
    ...row,
    value: row.value.map((b) => {
      if (REPLACE[l][b._key]) return { ...b, children: [{ ...b.children[0], marks: [], text: REPLACE[l][b._key] }] };
      const fixes = FIX[l].filter(([k]) => k === b._key);
      if (!fixes.length) return b;
      const children = b.children.map((c) => ({ ...c }));
      for (const [, find, repl] of fixes) {
        const alts = [find, find.replace(/'/g, '’'), find.replace(/’/g, "'")];
        const i = children.findIndex((c) => alts.some((x) => c.text.includes(x)));
        if (i < 0 && children.some((c) => [repl, repl.replace(/'/g, '’')].some((x) => c.text.includes(x)))) continue; // re-run
        if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
        children[i].text = children[i].text.replace(alts.find((x) => children[i].text.includes(x)), () => repl);
      }
      return { ...b, children };
    }),
  };
});
// Nothing "More about this day", the summary or the notes may keep what the page corrects.
const RETIRED = {
  en: /\btiers?\b(?! of)|minimum age|English-speaking|oldest monumental|only major pyramid|third-tallest|better part of two hours|advise on tier|Base \+/i,
  es: /tres niveles|cada nivel|nivel Base|edad mínima|angloparlante|más antigua de Egipto|única pirámide mayor|tercera más alta|mejor parte de dos horas|Base \+/i,
  ja: /段階|18歳|最低年齢|英語対応|最古の記念碑|唯一の主要ピラミッド|三番目に高い|2時間ほどかかり|2時間ほどですが/,
};
for (const row of body) {
  const l = row._key;
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[l].test(textOf(b))) throw new Error(`${l} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[l])[0]}"`);
}
for (const l of LANGS) {
  if (RETIRED[l].test(SUMMARY[l])) throw new Error(`${l}: summary still shows "${SUMMARY[l].match(RETIRED[l])[0]}"`);
  const note = doc.conciergeNote?.find((n) => n._key === l)?.value ?? '';
  if (RETIRED[l].test(note)) console.log(`WARNING ${l}: concierge note shows "${note.match(RETIRED[l])[0]}": ${note.slice(0, 160)}`);
}
const SHAPE = {
  duration: { en: 'Long day, about 10 to 12 hours, with about 220 km each way', es: 'Jornada larga, de 10 a 12 horas, con unos 220 km en cada sentido', ja: '長めの1日、10〜12時間（片道約220キロ）' },
  where: { en: 'Alexandria → Memphis → Saqqara → Dahshur → Alexandria', es: 'Alejandría → Menfis → Saqqara → Dahshur → Alejandría', ja: 'アレクサンドリア → メンフィス → サッカラ → ダハシュール → アレクサンドリア' },
};
const set = {
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  summary: LANGS.map((l) => ({ ...(doc.summary?.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: SUMMARY[l] })),
  durationLabel: LANGS.map((l) => ({ ...(doc.durationLabel?.find((t) => t._key === l) ?? { _key: l, _type: 'internationalizedArrayStringValue' }), value: DURATION_LABEL[l] })),
  durationHours: DURATION_HOURS,
  ...(ready ? { priceFrom: PRICES.en, guideLanguagePrices: { ...(doc.guideLanguagePrices ?? { _type: 'object' }), es: PRICES.es, ja: PRICES.ja } } : {}),
  dayTourIntro: LANGS.map((l) => ({ ...B[l].intro, closingRef: CLOSING_REF[l], skipRefs: SKIP[l] })),
  dayTimeline: LANGS.flatMap((l) => B[l].timeline),
  inclusions: LANGS.flatMap((l) => B[l].included),
  exclusions: LANGS.flatMap((l) => B[l].excluded),
  customisationOptions: LANGS.flatMap((l) => B[l].options),
  body,
};
for (const f of ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions']) set[f] = curlyRows(set[f], 'en');
for (const f of ['duration', 'where']) set[`shapeOfDay.${f}`] = LANGS.map((l) => ({ ...(doc.shapeOfDay?.[f]?.find((n) => n._key === l) ?? { _key: l, _type: 'internationalizedArrayStringValue' }), value: SHAPE[f][l] }));
const UNSET = doc.shapeOfDay?.character ? ['shapeOfDay.character'] : [];

/* ── Gates ────────────────────────────────────────────────────────────── */
for (const l of LANGS) {
  const rows = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]], {});
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

for (const f of Object.keys(set)) {
  if (f === 'body' || f.startsWith('shapeOfDay')) continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
console.log(`unset: ${UNSET.join(', ') || 'nothing'}`);
if (!ready) console.log('prices: NOT READY');
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  summary ${l}: ${set.summary.find((t) => t._key === l).value}`);
  console.log(`  panel ${l}: ${B[l].intro.panelRows.map((r) => `${r.label}: ${r.text}`).join(' | ')}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.period, x.periodLabel, x.stops.map((s) => [s.title, (s.sites ?? []).map((z) => z.name)])]))}`);
  const essay = set.body.find((r) => r._key === l).value;
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  console.log(`  essay ${l}: ${essay.length} blocks, ${essay.length - hidden.size} shown: ${essay.filter((b) => !hidden.has(b._key)).map((b) => textOf(b).slice(0, 70)).join(' | ')}`);
}

if (previewOut) {
  const cityIds = (doc.cities ?? []).map((c) => c._ref).filter(Boolean);
  const cities = await client.fetch('*[_id in $ids]', { ids: cityIds });
  const next = { ...doc, ...set };
  next.shapeOfDay = { ...doc.shapeOfDay, character: undefined, duration: set['shapeOfDay.duration'], where: set['shapeOfDay.where'] };
  delete next['shapeOfDay.duration']; delete next['shapeOfDay.where'];
  const dataset = [next, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const slug = doc.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'citySlugsEn'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  if (!ready) throw new Error('prices not ready');
  await writeRollback(client, [DOC_ID], 'before-alexandria-memphis-dahshur');
  await client.patch(DOC_ID).set(set).unset(UNSET).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (--apply --flags-approved writes production)');
