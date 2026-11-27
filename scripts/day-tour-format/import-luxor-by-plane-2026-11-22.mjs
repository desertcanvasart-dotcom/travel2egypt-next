/**
 * Luxor in a Day by Plane from Cairo: Karnak, Luxor Temple & the West Bank — in the day-tour format,
 * EN + ES + JA together (owner, 22 Nov: locked copy + open items + "Build the Autoura template").
 *
 *   tour  wp-page-87760   /full-day-trip-to-luxor-by-plane-from-cairo   (URL unchanged: no redirect)
 *
 * Flights are NOT included (open items): removed from the price; the panel carries the copy's own rows
 * (children 50 % of the tour price, Flights, Pickup, the extra-charge pickup areas, Back, Lunch, guide) as
 * intro.panelRows, which replace the Cairo rule rows (those have no Flights row). No tiers, no age line,
 * no KV62 add-on (the old essay's KV62 block is hidden).
 *
 * Price: luxor-by-plane-prices.json (Autoura T2E-DT-LXR-09 + Cairo airport legs; see its _note).
 * Live today: €179 / ES €190 / JA €197 (flights were in the old price). The script refuses --apply while
 * the file is not filled in.
 *
 * Essay (Gate A.3, corrections 1–9): superlatives softened, "the group" → "you", "sixty-three" → "more than
 * sixty", the "largest ever built" mortuary temple → "vast"; the KV62 add-on block, the ES standfirst
 * (it says "con … vuelos internos") and the closing duplicate are hidden.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-luxor-by-plane-2026-11-22.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-luxor-by-plane-2026-11-22.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-luxor-by-plane-2026-11-22.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-87760';
const OLD = { from: 179, es: 190, ja: 197 };
const PRICES = JSON.parse(readFileSync(new URL('./luxor-by-plane-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/luxor-day-trip-by-plane-from-cairo';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (22 Nov 2026; price from Autoura for 2 travellers, flights excluded).`;

const G = {
  karnak: 'guideArticle.luxor.the-karnak-temple',
  luxor: 'guideArticle.luxor.the-luxor-temple',
  hatshepsut: 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut',
  valley: 'guideArticle.luxor.valley-of-the-kings',
  colossi: 'guideArticle.luxor.the-colossi-of-memnon',
};
// Sites per stop, in file order: "Karnak · Great Hypostyle Hall", "Luxor Temple · Avenue of Sphinxes",
// "Temple of Hatshepsut", "Valley of the Kings", "Colossi of Memnon".
const SITE_GUIDES = [[G.karnak, null], [G.luxor, null], [G.hatshepsut], [G.valley], [G.colossi]];
const DURATION_LABEL = { en: 'Extended · flight each way', es: 'Jornada larga · vuelo de ida y vuelta', ja: '延長・往復とも飛行機' };
const DURATION_HOURS = 14;
const PANEL = {
  en: { pickup: 'Pickup', back: 'Back', lunch: 'Lunch', flights: 'Flights' },
  es: { pickup: 'Recogida', back: 'Regreso', lunch: 'Almuerzo', flights: 'Vuelos' },
  ja: { pickup: 'お迎え', back: 'お戻り', lunch: '昼食', flights: '航空券' },
};
// Rows shown as written, in the file's order (Type, Duration and From are the hero facts).
const OWN_ROWS = {
  en: ['Children under 12', 'Flights', 'Pickup', 'Pickup areas with an extra charge', 'Back', 'Lunch', 'Your guide speaks'],
  es: ['Niños menores de 12 años', 'Vuelos', 'Recogida', 'Zonas de recogida con suplemento', 'Regreso', 'Almuerzo', 'Tu guía habla'],
  ja: ['12歳未満のお子様', '航空券', 'お迎え', '追加料金がかかるお迎えエリア', 'お戻り', '昼食', 'ガイドの言語'],
};
const PERIOD = { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 昼: 'midday', 午後: 'afternoon' };

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
      const stop = { title: plain(hm[1]) };
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
// The summary / meta description: the locked opening's own first two sentences.
const SUMMARY = Object.fromEntries(LANGS.map((l) => [l, (P[l].opening.match(l === 'ja' ? /^(?:[^。]+。){2}/ : /^(?:.+?[.!?](?:\s+|$)){2}/) ?? [P[l].opening])[0].trim()]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [!!s.text, s.sites?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opt: p.options.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
for (const l of LANGS) for (const k of Object.keys(PANEL.en)) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel (${Object.keys(P[l].panelRows).join(', ')})`);
for (const l of LANGS) for (const lab of OWN_ROWS[l]) if (!P[l].panelRows[lab]) throw new Error(`${l}: panel row "${lab}" missing (${Object.keys(P[l].panelRows).join(' | ')})`);
const siteStops = P.en.periods.flatMap((x) => x.stops).filter((s) => s.sites);
if (siteStops.length !== SITE_GUIDES.length || siteStops.some((s, i) => s.sites.length !== SITE_GUIDES[i].length)) throw new Error('sites ≠ SITE_GUIDES');

/* ── Numeric gate ─────────────────────────────────────────────────────── */
const flat = (l) => {
  const p = P[l];
  return {
    opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
    ...Object.fromEntries(OWN_ROWS[l].map((lab, i) => [`panel${i}`, p.panelRows[lab]])),
    ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text]])).filter(([, v]) => v)),
    ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
    ...Object.fromEntries(p.fitFor.map((t, i) => [`fit${i}`, t])),
    ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
  };
};
// Same figures, checked by hand (open items, "Numeric gate (22 Nov)"): the extra JA digits are Japanese
// conventions (1名様, セティ1世, ラムセス2世, アメンヘテプ3世, 10月6日市, ラムセス11世), not new facts; ES writes 1500.
const SAME_MEANING = { es: ['opening', 'fit0'], ja: ['opening', 'why', 'p2s0.x'] };
for (const l of ['es', 'ja']) {
  const en = flat('en'), lc = flat(l);
  for (const k of SAME_MEANING[l]) { delete en[k]; delete lc[k]; console.log(`numeric gate (${l}): ${k} checked by hand (same meaning)`); }
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
        _key: `s${pi + 1}-${si + 1}`, _type: 'dayTourStop', title: s.title, ...(s.text ? { text: s.text } : {}),
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
      pickupLine: p.panelRows[PANEL[l].pickup], flightsLine: p.panelRows[PANEL[l].flights], returnNote: p.panelRows[PANEL[l].back],
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      panelRows: OWN_ROWS[l].map((lab, i) => ({ _key: `pr${i + 1}`, _type: 'dayPanelRow', label: lab, text: p.panelRows[lab] })),
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'lpin'), excluded: fact(p.excluded, 'lpout'), options: fact(p.options, 'lpopt'),
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
if (doc.seo?.metaTitle?.length) throw new Error('seo.metaTitle exists — set it to the new title too');
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// The essay's two closing sentences (the page has its own closing line): block 1 = closingRef, block 2 hidden.
const CLOSING_REF = { en: '00000000002b', es: '00000000002d', ja: '000000000025' };
// Hidden: the closing's second sentence · the KV62 add-on block · ES the standfirst ("con … vuelos internos").
const SKIP = {
  en: ['00000000002d', '00000000003c'],
  es: ['000000000003', '00000000002f', '000000000040'],
  ja: ['000000000027', '000000000036'],
};
// [block, find, replace] — corrections 1–6, each find sits inside one text run.
const FIX = {
  en: [
    ['000000000003', 'the most powerful city in the world', 'one of the most powerful cities of its age'], // 3
    ['000000000007', 'are among the most physically impressive structures ever built', 'are, for us, among the most impressive structures ever built'], // 4
    ['000000000007', 'is one of the most architecturally considered buildings of the ancient world', 'is a remarkably considered building'], // 4
    ['00000000000f', 'Karnak is the largest religious complex ever built', 'Karnak is one of the largest religious complexes ever built'], // 1
    ['000000000019', 'the group crosses to the West Bank', 'you cross to the West Bank'], // 5
    ['000000000019', 'is one of the most formally accomplished buildings of the ancient world', 'is a formally accomplished building'], // 4
    ['00000000001d', 'Sixty-three tombs have been identified', 'More than sixty tombs have been identified'], // 2
    ['000000000021', 'his mortuary temple — the largest ever built in Egypt, though almost nothing of the temple itself remains above ground', 'his vast mortuary temple, though almost nothing of the temple itself remains above ground'], // 6
  ],
  es: [
    ['000000000005', 'la ciudad más poderosa del mundo', 'una de las ciudades más poderosas de su época'],
    ['000000000009', 'figuran entre las estructuras físicamente más impresionantes jamás construidas', 'figuran, para nosotros, entre las estructuras más impresionantes jamás construidas'],
    ['000000000009', 'es uno de los edificios más arquitectónicamente meditados del mundo antiguo', 'es un edificio notablemente meditado'],
    ['000000000011', 'Karnak es el mayor complejo religioso jamás construido', 'Karnak es uno de los mayores complejos religiosos jamás construidos'],
    ['00000000001b', 'el grupo cruza a la orilla occidental', 'cruzas a la orilla occidental'],
    ['00000000001b', 'es uno de los edificios formalmente más logrados del mundo antiguo', 'es un edificio formalmente logrado'],
    ['00000000001f', 'Se han identificado sesenta y tres tumbas', 'Se han identificado más de sesenta tumbas'],
    ['000000000023', 'su templo funerario —el mayor jamás construido en Egipto, aunque apenas quede nada del templo en superficie—', 'su vasto templo funerario, aunque apenas quede nada del templo en superficie'],
  ],
  ja: [
    ['000000000009', '幾世紀ものあいだ世界で最も強大だった街', '幾世紀ものあいだ当時屈指の強大さを誇った街'],
    ['00000000000d', '、これまでに建てられた最も身体的に圧倒する構造物のうちにあります', '、私たちにとって、これまでに建てられた最も印象的な構造物のうちにあります'],
    ['00000000000d', '古代世界で最も建築的に考え抜かれた建物のひとつです', 'よく考え抜かれた見事な建物です'],
    ['000000000013', 'これまでに建てられた最大の宗教複合体です', 'これまでに建てられた最大級の宗教複合体のひとつです'],
    ['000000000019', '昼食のあと、一行は西岸へ渡ります', '昼食のあと、西岸へ渡ります'],
    ['000000000019', '古代世界で最も形式的に完成された建物のひとつです', '形式の整った建物です'],
    ['00000000001b', '六十三基の墓が確認されています', '六十基を超える墓が確認されています'],
    ['00000000001d', 'かつて彼の葬祭殿の入口', 'かつて彼の広大な葬祭殿の入口'],
    ['00000000001d', 'エジプトでこれまでに築かれた最大の葬祭殿でしたが、', ''],
  ],
};
const body = doc.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const k of [CLOSING_REF[l], ...SKIP[l], ...FIX[l].map(([k]) => k)]) if (!keys.has(k)) throw new Error(`${l}: essay block ${k} missing`);
  const value = row.value.map((b) => {
    const fixes = FIX[l].filter(([k]) => k === b._key);
    if (!fixes.length) return b;
    const children = b.children.map((c) => ({ ...c }));
    for (const [, find, repl] of fixes) {
      const alts = [find, find.replace(/'/g, '’'), find.replace(/’/g, "'")];
      const i = children.findIndex((c) => alts.some((x) => c.text.includes(x)));
      if (i < 0 && repl && children.some((c) => [repl, repl.replace(/'/g, '’')].some((x) => c.text.includes(x)))) continue; // re-run
      if (i < 0 && !repl) continue; // re-run (removal)
      if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
      children[i].text = children[i].text.replace(alts.find((x) => children[i].text.includes(x)), () => repl.replace(/'/g, '’'));
    }
    return { ...b, children };
  });
  return { ...row, value };
});
// Nothing "More about this day", the summary or the concierge note shows may keep what the page corrects.
const RETIRED = {
  en: /\btiers?\b|minimum age|\blargest religious complex\b|most powerful city in the world|physically impressive|most architecturally considered|most formally accomplished|Sixty-three|the group crosses|largest ever built|added on the day|flights? (?:are |is )?included/i,
  es: /\bniveles\b|edad mínima|mayor complejo religioso|ciudad más poderosa del mundo|físicamente más|arquitectónicamente meditados|formalmente más logrados|sesenta y tres|el grupo cruza|mayor jamás construido|añadir la KV62|vuelos incluidos/i,
  ja: /段階|18歳|年齢制限|最大の宗教複合体|世界で最も強大|身体的に圧倒|最も建築的に|最も形式的に|六十三基|一行は西岸|最大の葬祭殿|別券/,
};
for (const row of body) {
  const l = row._key;
  if (!RETIRED[l]) continue;
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  for (const b of row.value) if (!hidden.has(b._key) && textOf(b).includes('�')) throw new Error(`${l} ${b._key}: broken character (U+FFFD) still shown`);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[l].test(textOf(b))) throw new Error(`${l} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[l])[0]}"`);
}
for (const l of LANGS) {
  if (RETIRED[l].test(SUMMARY[l])) throw new Error(`${l}: summary still shows "${SUMMARY[l].match(RETIRED[l])[0]}"`);
  const note = doc.conciergeNote?.find((n) => n._key === l)?.value ?? '';
  if (RETIRED[l].test(note)) console.log(`WARNING ${l}: concierge note still shows "${note.match(RETIRED[l])[0]}": ${note.slice(0, 200)}`);
}

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
// The concierge note carried the age line (rule 9: "no minimum age" goes; the children-and-shade sentence stays), and
// shapeOfDay.duration said the domestic flights were included.
const NOTE = {
  en: [/ Families are welcome here with no minimum age, so if children set your pace,/, ' If children set your pace,'],
  es: [/ Aquí no hay edad mínima y las familias son bienvenidas: si los niños marcan tu ritmo,/, ' Si los niños marcan tu ritmo,'],
  ja: [/このツアーは年齢制限がなく、ご家族でご参加いただけます。/, ''],
};
set.conciergeNote = LANGS.map((l) => {
  const row = doc.conciergeNote.find((n) => n._key === l);
  const [rx, rep] = NOTE[l];
  const v = rx.test(row.value) ? row.value.replace(rx, rep) : row.value;
  if (rx.test(row.value) === false && /minimum age|edad mínima|年齢制限/.test(v)) throw new Error(`${l}: concierge note age line not matched`);
  return { ...row, value: v };
});
const SHAPE_DURATION = { en: 'Extended day: a flight each way, an early start and a late return', es: 'Jornada larga: un vuelo de ida y otro de vuelta, salida temprano y regreso tarde', ja: '長めの1日：往復とも飛行機（早朝出発、夜遅く帰着）' };
set['shapeOfDay.duration'] = LANGS.map((l) => ({ ...doc.shapeOfDay.duration.find((n) => n._key === l), value: SHAPE_DURATION[l] }));
// shapeOfDay.character carried the tiers and the age line (rules 8 and 9); the day-tour layout does not show it.
const UNSET = doc.shapeOfDay?.character ? ['shapeOfDay.character'] : [];

/* ── Gates ────────────────────────────────────────────────────────────── */
for (const l of LANGS) {
  const rows = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]], {});
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });
if (!ready) console.log('prices: NOT READY — fill luxor-by-plane-prices.json. Nothing can be applied yet.');

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const u of UNSET) console.log(`unset ${u}: ${JSON.stringify(doc.shapeOfDay.character.map((c) => c.value))}`);
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  concierge ${l}: ${set.conciergeNote.find((n) => n._key === l).value}`);
  console.log(`  summary ${l}: ${set.summary.find((t) => t._key === l).value}`);
  console.log(`  panel ${l}: ${B[l].intro.panelRows.map((r) => `${r.label}: ${r.text}`).join(' | ')}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.period, x.periodLabel, x.stops.map((s) => [s.title, (s.sites ?? []).map((z) => z.name + (z.guideRef ? ' →' + z.guideRef._ref : ''))])]))}`);
  const essay = set.body.find((r) => r._key === l).value;
  const before = doc.body.find((r) => r._key === l).value;
  for (const b of essay) {
    const old = before.find((x) => x._key === b._key);
    if (textOf(old) !== textOf(b)) console.log(`  essay ${l} ${b._key}: ${textOf(b).slice(0, 220)}`);
  }
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  const empty = essay.filter((b) => !hidden.has(b._key) && !textOf(b).trim()).map((b) => b._key);
  console.log(`  essay ${l}: ${essay.length} blocks, ${essay.length - hidden.size} shown${empty.length ? `, EMPTY shown: ${empty.join(', ')}` : ''}`);
}

if (previewOut) {
  const refs = await client.fetch('*[_id in $ids]', { ids: Object.values(G) });
  const cityIds = [...new Set([...refs.map((r) => r.parentCity?._ref), ...(doc.cities ?? []).map((c) => c._ref)].filter(Boolean))];
  const cities = await client.fetch('*[_id in $ids]', { ids: cityIds });
  const next = { ...doc, ...set };
  if (UNSET.length) next.shapeOfDay = { ...doc.shapeOfDay, character: undefined };
  const dataset = [next, ...refs, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const slug = doc.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'durationLabel', 'shapeOfDay', 'citySlugsEn'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  if (!ready) throw new Error('prices not ready — fill luxor-by-plane-prices.json first.');
  await writeRollback(client, [DOC_ID], 'before-luxor-by-plane');
  await client.patch(DOC_ID).set(set).unset(UNSET).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (--apply --flags-approved writes production)');
