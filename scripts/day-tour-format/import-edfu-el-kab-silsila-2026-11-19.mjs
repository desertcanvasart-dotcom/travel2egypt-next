/**
 * Edfu, El Kab & Gebel Silsila from Aswan in the day-tour format, EN + ES + JA together. Owner,
 * 19 Nov: the locked copy and its open-items answers ("Instructions for Claude Code" §1).
 *
 *   keeper  wp-page-113193   /aswan-to-el-kab-and-edfu-temple-tour  →  /edfu-el-kab-and-gebel-silsila-from-aswan
 *   (the same document: reviews, images and references stay attached; 301s in the same commit,
 *   migration/redirect-map.*; the El Kab + Esna tour from Aswan is retired into it by
 *   retire-el-kab-esna-2026-11-19.mjs)
 *
 * The product (owner, 19 Nov): 09:00 pickup, Edfu → El Kab → lunch → Gebel Silsila on the way back
 * south. Entrance to all three and lunch included, no tiers; children under 12 pay 50 %; no age
 * line. Title "Edfu, El Kab & Gebel Silsila: Private Day Tour from Aswan" (the "Last Working
 * Temple" claim is gone). Guide in the page's language, so ES/JA keep their own price
 * (edfu-el-kab-silsila-prices.json; --apply refuses while any is null).
 *
 * New slugs: EN and ES as proposed; JA follows the repo's pattern (romaji of the Japanese title,
 * like the old asuwan-kara-eru-kabu-…), not the proposed English-spelled one — reported in the PR.
 *
 * Panel: the rule rows (children, pickup, back, lunch, guide language): the city is Aswan.
 *
 * Essay (Gate A.3, the approved corrections 1–8): Edfu ~105 km, El Kab ~20 km beyond it on the
 * east bank (1); the essay title (2); Edfu's Tier 1 wording, shared with the itineraries:
 * "the most completely preserved temple in Egypt" (3, 5); "much of the sandstone for the great
 * Theban temples" (6); the route reordered Edfu → El Kab → Silsila (8); (7) kept. Correction 4
 * ("the narrowest point of the Nile") is LEFT OUT until the owner approves the Tier 1 wording.
 * Also: the age-18 line removed; the guide "in your language".
 *
 * needsReview: the open items ask for `needsReview: true`, but the site shows only rows with
 * needsReview == false (src/sanity/lib/queries.ts), so `true` would publish an empty page. As
 * with every page in this batch, nothing is written until the owner says publish; that OK is the
 * approval, and the rows are written approved.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-edfu-el-kab-silsila-2026-11-19.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-edfu-el-kab-silsila-2026-11-19.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-edfu-el-kab-silsila-2026-11-19.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-113193';
const OLD = { from: 172.19, es: 183, ja: 190 };
const PRICES = JSON.parse(readFileSync(new URL('./edfu-el-kab-silsila-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/edfu-el-kab-gebel-silsila-from-aswan-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (19 Nov 2026; prices from Autoura for 2 travellers).`;

const G = {
  edfu: 'guideArticle.edfu.edfu-temple',
  elkab: 'guideArticle.edfu.elkab',
  silsila: 'guideArticle.kom-ombo.gebel-el-silsila',
  speos: 'guideArticle.kom-ombo.speos-of-horemheb',
};
// Sites per stop that has them, in file order: "Temple of Horus, Edfu"; "El Kab · Tomb of Ahmose
// son of Ibana · Tomb of Paheri" (no guide page for the two tombs); "Gebel Silsila · Speos of Horemheb".
const SITE_GUIDES = [[G.edfu], [G.elkab, null, null], [G.silsila, G.speos]];
const DURATION_LABEL = { en: 'Full day · ~8 hrs', es: 'Día completo · ~8 h', ja: '1日・約8時間' };
const DURATION_HOURS = 8;
// New addresses (open items §1.6). JA: the repo's romaji pattern (see the header).
const NEW_SLUG = {
  en: 'edfu-el-kab-and-gebel-silsila-from-aswan',
  es: 'edfu-el-kab-y-gebel-silsila-desde-asuan',
  ja: 'asuwan-hatsu-edofu-eru-kabu-geberu-shirushira',
};
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch', back: 'Back' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo', back: 'Regreso' },
  ja: { pickup: 'お迎え', lunch: '昼食', back: 'お戻り' },
};
const PERIOD = { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 午前: 'morning', 昼: 'midday', 午後: 'afternoon' };

/* ── Parse ────────────────────────────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t　]+$/gm, '').trim();
const plain = (s) => clean(s.replace(/\*\*|\*/g, ''));
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
// Separator "·" with spaces around it (JA uses full-width spaces: "朝　·　アビドス").
const SEP = /\s+·\s+/;
function parseLocale(l) {
  const md = readFileSync(new URL(LOCKED[l], ROOT), 'utf8');
  const title = plain(md.match(/^# (.+)$/m)[1]);
  const secs = sections(md);
  if (secs.length !== 7) throw new Error(`${l}: expected 7 sections, found ${secs.length}`);
  const [panel, opening, why, day, incl, forYou, mine] = secs;
  const panelRows = Object.fromEntries(panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], plain(m[2])]));
  const periods = day.text.split(/\n### /).slice(1).map((chunk) => {
    const [head, ...rest] = chunk.split('\n');
    const [word, ...labelParts] = head.split(SEP);
    const period = PERIOD[word.trim()];
    if (!period || !labelParts.length) throw new Error(`${l}: unknown period heading "${head}"`);
    const stops = [];
    for (const p of paras(rest.join('\n'))) {
      if (p.startsWith('>')) continue; // "More about this day →" pointer
      const lines = p.split('\n');
      const hm = lines[0].match(/^\*\*(.+)\*\*$/);
      if (!hm) throw new Error(`${l}: unexpected paragraph in "${head}": ${p.slice(0, 60)}`);
      // "09:00 · Pickup from your hotel" / JA "09:00　·　ホテルでのお迎え": the time is its own field.
      const [first, ...restTitle] = plain(hm[1]).split(SEP);
      const stop = /^\d\d:\d\d$/.test(first) && restTitle.length ? { time: first, title: restTitle.join(' · ') } : { title: plain(hm[1]) };
      const body = [];
      for (const ln of lines.slice(1)) {
        const sm = ln.match(/^\*?(Sites|Lugares|見学地)[:：]\*?[:：]?\s*(.+)$/);
        if (sm) stop.sites = sm[2].split(SEP).map((x) => plain(x));
        else body.push(ln);
      }
      if (body.length) stop.text = plain(body.join(' '));
      stops.push(stop);
    }
    return { period, periodLabel: plain(labelParts.join(' · ')), stops };
  });
  const sub = (t) => t.split(/\n(?=\*\*)/).map((blk) => ({ h: (blk.match(/^\*\*(.+?)\*\*/) ?? [])[1], items: bullets(blk).map(plain) })).filter((x) => x.h);
  const [inc, exc] = sub(incl.text);
  const [fit, worth] = sub(forYou.text);
  const tail = paras(mine.text);
  return {
    title, panelRows, periods,
    opening: plain(paras(opening.text)[0]), whyThisOrder: plain(paras(why.text)[0]),
    included: inc.items, excluded: exc.items, fitFor: fit.items, worthKnowing: worth.items,
    options: bullets(mine.text).map(plain), closingLine: plain(tail[tail.length - 1]),
  };
}
const P = Object.fromEntries(LANGS.map((l) => [l, parseLocale(l)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [s.time ?? '', !!s.text, s.sites?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
for (const l of LANGS) for (const k of ['pickup', 'lunch', 'back']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel (${Object.keys(P[l].panelRows).join(', ')})`);

/* ── Numeric gate ─────────────────────────────────────────────────────── */
const flat = (l) => {
  const p = P[l];
  return {
    opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
    ...Object.fromEntries(Object.keys(PANEL.en).map((k) => [`panel.${k}`, p.panelRows[PANEL[l][k]]])),
    ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text]])).filter(([, v]) => v)),
    ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
    ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
  };
};
// Checked by hand (19 Nov), same meaning as EN: JA opening 「両端」 = "two ends" (EN "Two ends of
// Egyptian history"); the gate reads no figure in it.
const SAME_MEANING = { es: [], ja: ['opening'] };
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
      pickupLine: p.panelRows[PANEL[l].pickup], returnNote: p.panelRows[PANEL[l].back],
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'ekin'), excluded: fact(p.excluded, 'ekout'), options: fact(p.options, 'ekopt'),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));

/* ── Document and essay ───────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (doc.type !== 'dayTour') throw new Error('not a day tour');
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja].join();
if (![[OLD.from, OLD.es, OLD.ja].join(), [PRICES.en, PRICES.es, PRICES.ja].join()].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

const CLOSING_REF = { en: '00000000001c', es: '00000000001c', ja: '00000000001c' };
// The closing's second half · the Philae / concierge pairing note (now "Make it your own") · the empty block.
const SKIP = {
  en: ['00000000001e', '00000000002c', '00000000002f'],
  es: ['00000000001e', '00000000002c', '00000000002f'],
  ja: ['00000000001e', '00000000002c', '00000000002f'],
};
const REPLACE = { en: {}, es: {}, ja: {} };
// Correction 8: Edfu, then El Kab, then Silsila. The route's blocks in their NEW order fill the
// route's existing slots (the same keys in every locale).
const ROUTE_EVERY = ['00000000000b', '000000000012', '00000000000e', '000000000016'];
const ROUTE = { en: ROUTE_EVERY, es: ROUTE_EVERY, ja: ROUTE_EVERY };
// [block, find, replace] — corrections 1, 2, 3/5, 6, the route's link sentences (8), no age line,
// the guide in your language. Finds inside bold runs («El Kab», «Edfu») are split per run.
const FIX = {
  en: [
    ['000000000001', 'Aswan to El Kab and Edfu: A Day Between the 18th Dynasty and the Last Working Temple', 'Aswan to Edfu, El Kab & Gebel Silsila'],
    ['000000000003', 'the other the most architecturally complete temple Egypt ever built.', 'the other the most completely preserved temple in Egypt.'],
    ['000000000005', 'The drive is roughly two hours north to Edfu, with El Kab fifteen minutes further on and Gebel Silsila a brief southern detour on the return.', 'The drive is roughly two hours north to Edfu, about 105 kilometres from Aswan, with El Kab some 20 kilometres beyond it on the east bank, and Gebel Silsila a brief stop on the way back south.'],
    ['000000000007', 'with a licensed Egyptologist, leaving', 'with a licensed Egyptologist guide in your language, leaving'],
    ['000000000007', 'The minimum age is 18: the days are long, the heat is real,', 'The day is long, the heat is real,'],
    ['000000000012', 'From El Kab the drive continues to ', 'The first stop is '],
    ['000000000012', ', fifteen minutes further north. The Temple of Horus here is the single most completely preserved temple from pharaonic Egypt —', ', about 105 kilometres north of Aswan, on the west bank. The Temple of Horus here is the most completely preserved temple in Egypt —'],
    ['00000000000e', ' sits roughly 110 kilometres north of Aswan, on the east bank.', ' lies some 20 kilometres beyond Edfu, on the east bank.'],
    ['000000000016', 'it explains where half of pharaonic Egypt\'s building stone came from.', 'it explains where much of the sandstone for the great Theban temples came from.'],
  ],
  es: [
    ['000000000001', 'De Asuán a El Kab y Edfú: un día entre la dinastía XVIII y el último templo en funcionamiento', 'De Asuán a Edfú, El Kab y Gebel Silsila'],
    ['000000000003', 'el templo arquitectónicamente más completo que llegó a construirse en el país del Nilo.', 'el templo que se conserva más completo de Egipto.'],
    ['000000000005', 'El trayecto al norte hasta Edfú lleva aproximadamente dos horas; El Kab queda quince minutos más allá y Gebel Silsila es un desvío breve hacia el sur en el camino de regreso.', 'El trayecto al norte hasta Edfú, a unos 105 kilómetros de Asuán, lleva aproximadamente dos horas; El Kab queda unos 20 kilómetros más allá, en la orilla oriental, y Gebel Silsila es una parada breve en el camino de regreso hacia el sur.'],
    ['000000000007', 'con un egiptólogo licenciado y vehículo', 'con un egiptólogo licenciado en su idioma y vehículo'],
    ['000000000007', 'La edad mínima es 18 años: la jornada es larga,', 'La jornada es larga,'],
    ['000000000012', 'Desde El Kab el trayecto continúa hasta ', 'La primera parada es '],
    ['000000000012', ', quince minutos más al norte. El templo de Horus es, sencillamente, el templo faraónico mejor conservado de todo Egipto, construido', ', a unos 105 kilómetros al norte de Asuán, en la orilla occidental. El templo de Horus es el templo que se conserva más completo de Egipto, construido'],
    ['00000000000e', ' se encuentra a unos 110 kilómetros al norte de Asuán, también en la orilla oriental.', ' se encuentra unos 20 kilómetros más allá de Edfú, en la orilla oriental.'],
    ['000000000016', 'explica de dónde salió la mitad de la piedra de construcción del Egipto faraónico.', 'explica de dónde salió buena parte de la arenisca de los grandes templos tebanos.'],
  ],
  ja: [
    ['000000000001', 'アスワンからエル・カブとエドフへ：第十八王朝とエジプト最後の神殿を、ひと日で読む', 'アスワンからエドフ、エル・カブ、ゲベル・シルシラへ'],
    ['000000000003', '構造的に最も完全なエジプト神殿', 'エジプトで最も完全な形で残る神殿'],
    ['000000000005', 'アスワンから北へ車でおよそ二時間、エドフ。さらに十五分でエル・カブ。帰路にゲベル・シルシラへ少し南下して立ち寄ります。', 'アスワンから北へ車でおよそ二時間、約105キロでエドフ。さらに20キロほど先の東岸にエル・カブ。南へ戻る帰り道にゲベル・シルシラへ立ち寄ります。'],
    ['000000000007', '専属のエジプト学ガイド', 'お客様の言語で案内する専属のエジプト学ガイド'],
    ['000000000007', '歩く距離、暑さ、足元の不均一さを踏まえ、参加は十八歳以上に限らせていただいています。', ''],
    ['000000000012', 'エル・カブから北へさらに十五分、', '最初に訪れるのは、アスワンから北へ約105キロ、西岸の'],
    ['000000000012', '。ホルス神殿は、ファラオ時代エジプトの神殿のなかで、構造的にもっとも完全な姿で残ったものです。', '。ホルス神殿は、エジプトで最も完全な形で残る神殿です。'],
    ['00000000000e', 'は、アスワンから北へおよそ百十キロ、東岸に位置します。', 'は、エドフからさらに20キロほど先、東岸に位置します。'],
    ['000000000016', 'ファラオ時代エジプトの建築用石材の半分がどこから来たのか、その答えがここにあります。', 'テーベの大神殿を築いた砂岩の多くがどこから来たのか、その答えがここにあります。'],
  ],
};
const body = doc.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const k of [CLOSING_REF[l], ...SKIP[l], ...Object.keys(REPLACE[l]), ...ROUTE[l], ...FIX[l].map(([k]) => k)]) if (!keys.has(k)) throw new Error(`${l}: essay block ${k} missing`);
  let value = row.value.map((b) => {
    if (REPLACE[l][b._key]) return { ...b, children: [{ ...b.children[0], marks: [], text: REPLACE[l][b._key] }] };
    const fixes = FIX[l].filter(([k]) => k === b._key);
    if (!fixes.length) return b;
    const children = b.children.map((c) => ({ ...c }));
    for (const [, find, repl] of fixes) {
      const alts = [find, find.replace(/'/g, '’'), find.replace(/’/g, "'")];
      const i = children.findIndex((c) => alts.some((x) => c.text.includes(x)));
      if (i < 0 && (repl === '' || children.some((c) => [repl, repl.replace(/'/g, '’')].some((x) => c.text.includes(x))))) continue; // re-run
      if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
      children[i].text = children[i].text.replace(alts.find((x) => children[i].text.includes(x)), (m) => (m.includes('’') ? repl.replace(/'/g, '’') : repl));
    }
    return { ...b, children };
  });
  // Reorder: the route blocks fill their own slots in the new order (re-runs are a no-op).
  const byKey = new Map(value.map((b) => [b._key, b]));
  const routeSet = new Set(ROUTE[l]);
  let next = 0;
  value = value.map((b) => (routeSet.has(b._key) ? byKey.get(ROUTE[l][next++]) : b));
  return { ...row, value };
});
// Nothing "More about this day" shows may keep what the page corrects.
const RETIRED = {
  en: /Last Working|minimum age|fifteen minutes|110 kilometres|half of pharaonic|architecturally complete|single most completely/i,
  es: /último templo|edad mínima|quince minutos|110 kilómetros|la mitad de la piedra|arquitectónicamente más completo|sencillamente, el templo/i,
  ja: /最後の神殿|十八歳|十五分|百十キロ|石材の半分|構造的に/,
};
for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const hidden = new Set([CLOSING_REF[row._key], ...SKIP[row._key]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
  // Edfu before El Kab in the shown essay's route.
  const shown = row.value.filter((b) => !hidden.has(b._key)).map(textOf).join('\n');
  const edfu = { en: 'The first stop is Edfu', es: 'La primera parada es Edfú', ja: '最初に訪れるのは' }[row._key];
  const elkab = { en: 'El Kab lies some 20 kilometres beyond Edfu', es: 'El Kab se encuentra unos 20 kilómetros más allá de Edfú', ja: 'エドフからさらに20キロほど先、東岸に位置します' }[row._key];
  if (!(shown.indexOf(edfu) >= 0 && shown.indexOf(edfu) < shown.indexOf(elkab))) throw new Error(`${row._key}: the essay's route is not Edfu → El Kab`);
}

// The new slugs must be free.
const taken = await client.fetch('*[_type == "tour" && _id != $id && !(_id in path("drafts.**")) && count(slug[value.current in $slugs]) > 0]{_id}', { id: DOC_ID, slugs: Object.values(NEW_SLUG) });
if (taken.length) throw new Error(`new slug already used by ${taken.map((t) => t._id).join(', ')}`);

const set = {
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  slug: doc.slug.map((s) => (NEW_SLUG[s._key] ? { ...s, value: { ...s.value, current: NEW_SLUG[s._key] } } : s)),
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

/* ── Gates ────────────────────────────────────────────────────────────── */
for (const l of LANGS) {
  const rows = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });
if (!ready) console.log('prices: NOT READY — fill edfu-el-kab-silsila-prices.json from Autoura (EN, ES and JA guide). Nothing can be applied yet.');

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  slug ${l}: ${doc.slug.find((s) => s._key === l)?.value.current} → ${NEW_SLUG[l]}`);
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine} · back: ${B[l].intro.returnNote} · lunch: ${B[l].intro.lunch.text}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.period, x.periodLabel, x.stops.map((s) => [(s.time ? s.time + ' · ' : '') + s.title, (s.sites ?? []).map((z) => z.name)])]))}`);
  const essay = set.body.find((r) => r._key === l).value;
  const before = doc.body.find((r) => r._key === l).value;
  for (const b of essay) {
    const old = before.find((x) => x._key === b._key);
    if (textOf(old) !== textOf(b)) console.log(`  essay ${l} ${b._key}: ${textOf(b).slice(0, 160)}…`);
  }
  console.log(`  essay ${l} order: ${essay.map((b) => b._key.slice(-2)).join(' ')}`);
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  const empty = essay.filter((b) => !hidden.has(b._key) && !textOf(b).trim()).map((b) => b._key);
  console.log(`  essay ${l}: ${essay.length} blocks, ${essay.length - hidden.size} shown${empty.length ? `, EMPTY shown: ${empty.join(', ')}` : ''}`);
}

if (previewOut) {
  const refs = await client.fetch('*[_id in $ids]', { ids: Object.values(G) });
  const cityIds = [...new Set([...refs.map((r) => r.parentCity?._ref), ...(doc.cities ?? []).map((c) => c._ref)].filter(Boolean))];
  const cities = await client.fetch('*[_id in $ids]', { ids: cityIds });
  const dataset = [{ ...doc, ...set }, ...refs, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const slug = NEW_SLUG[l];
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'citySlugsEn'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  if (!ready) throw new Error('prices not ready — fill edfu-el-kab-silsila-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-edfu-el-kab-silsila-day-tour');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
