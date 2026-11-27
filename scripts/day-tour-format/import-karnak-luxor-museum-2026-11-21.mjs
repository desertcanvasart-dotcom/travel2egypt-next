/**
 * Karnak, Luxor Temple & the Luxor Museum: Private Day Tour, in the day-tour format, EN + ES + JA
 * together. Owner, 21 Nov: the locked copy and its open items (answers of 21 Nov).
 *
 *   tour  tour.day-tour-to-karnak-luxor-temples-luxor-museum   /day-tour-to-karnak-luxor-temples-luxor-museum
 *   URL unchanged in all three locales: no redirect. The half-day sibling wp-page-88397
 *   (/private-tour-karnak-temple-luxor-temple, published 21 Nov) is NOT touched: both products stay.
 *
 * The product: a full day of about 8 hours. Pickup → Karnak → a walk along a section of the Avenue
 * of Sphinxes → Luxor Temple → lunch → the Luxor Museum → a complimentary visit to Luxor's local
 * market → back to the hotel. Entrance to all three sites, lunch and the market visit included, no
 * tiers (the Base / + Entrance Fees / + Entrance Fees & Lunch tiers go from the essay and its tier
 * summary; the doc has no tier field); children under 12 pay 50 %; no age line (the "minimum age
 * 18" goes from the essay, and from shapeOfDay.character, which also carried the tiers and which
 * the day-tour layout does not show). Title = the locked one (the doc has no seo field, so the
 * title is also the SEO and og:title).
 *
 * Price: karnak-luxor-museum-prices.json, Autoura T2E-DT-LXR-07 (created 21 Nov), after the Luxor
 * 'Hotel - East Bank' car card was widened on 21 Nov to cover the Luxor Museum (owner's request,
 * rates unchanged): €82 / ES €93 / JA €109 (guide in the page's language). Live today: €99 / €110 /
 * €117, tiered. The script refuses --apply if the file is ever emptied (`ready`).
 *
 * Panel: Luxor, so not the Cairo rule rows: children 50 % + the copy's pickup line + the copy's
 * "Back" line (returnNote, no returnTime: "in the afternoon, with the evening free") + lunch +
 * guide language. "Back to your hotel" is also a stop, as in the copy.
 *
 * Essay (Gate A.3, corrections 1–8): 1 the tier paragraph hidden, and the tier summary rewritten to
 * the kept sentence "The concierge can sequence the day to avoid the midday heat at Karnak's open
 * courts." (EN, ES; JA has no tier text and its concierge line is hidden); 2 the private-tour
 * paragraph rewritten with the guide "in your language" (no "every tier", no minimum age; bold
 * runs lost; JA has no such paragraph); 3 "…a larger proportion of surviving ancient Egyptian
 * history…" and "That is not a selling point. It is simply true." removed; 4 the spectacle-seekers
 * clause → "If you want a quick photograph rather than an explanation, this day will feel long.
 * It's built for people who want…"; 5 "few sites prepare you for what this complex turns out to
 * be"; 6 "on a scale that still takes adjusting to" (the sentence's own "still operating" goes
 * with it, so the replacement reads once: "enormous, intact, and on a scale that still takes
 * adjusting to"); 7 the minimum age removed (it was only in the private-tour paragraph); 8 the
 * market line "The day ends with a complimentary walk through Luxor's local market." is an essay
 * correction, so it is written into the essay, in the slot of the removed "larger proportion"
 * sentence (right after the museum paragraph). The page's own closing line is the copy's italic
 * last line. "Where the Cairo Museum overwhelms, the Luxor Museum edits." is kept.
 * Hidden: "That is not a selling point…" (the old closing, closingRef), the tier paragraph, ES the
 * standfirst, JA the concierge line, empty blocks.
 *
 * Guide links: Karnak · Luxor Temple · Luxor Museum. No guide page exists for the Great Hypostyle
 * Hall, the Sacred Lake, the Festival Temple of Thutmose III, the Avenue of Sphinxes, the Mosque of
 * Abu Haggag or Luxor's market. "Luxor West Bank" is only in "Worth knowing" and "A good fit"
 * (plain strings, no link support), and no Luxor West Bank guide page exists either.
 *
 * needsReview: the open items say true; rows are written false, as across the batch (true would
 * publish an empty page); nothing is written until the owner says publish.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-karnak-luxor-museum-2026-11-21.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-karnak-luxor-museum-2026-11-21.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-karnak-luxor-museum-2026-11-21.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'tour.day-tour-to-karnak-luxor-temples-luxor-museum';
const SIBLING = 'wp-page-88397'; // the half-day tour: never written
const OLD = { from: 99, es: 110, ja: 117 };
const PRICES = JSON.parse(readFileSync(new URL('./karnak-luxor-museum-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/karnak-luxor-temple-luxor-museum-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (21 Nov 2026; prices from Autoura for 2 travellers).`;

const G = {
  karnak: 'guideArticle.luxor.the-karnak-temple',
  luxor: 'guideArticle.luxor.the-luxor-temple',
  museum: 'guideArticle.luxor.the-luxor-museum',
};
// Sites per stop, in file order: "Karnak · Great Hypostyle Hall · Sacred Lake · Festival Temple of
// Thutmose III", "Avenue of Sphinxes", "Luxor Temple · Mosque of Abu Haggag", "Luxor Museum",
// "Luxor market". Karnak, Luxor Temple and the Luxor Museum have a guide page.
const SITE_GUIDES = [[G.karnak, null, null, null], [null], [G.luxor, null], [G.museum], [null]];
const DURATION_LABEL = { en: 'Full day · ~8 hrs', es: 'Día completo · ~8 h', ja: '1日・約8時間' };
const DURATION_HOURS = 8;
// The dek / meta description: the locked opening's own first sentences (checked below).
const SUMMARY = {
  en: 'Karnak, Luxor Temple and the Luxor Museum are the three strongest reasons to spend a day on Luxor’s East Bank, and this private day takes in all three with an Egyptologist. Two open-air temple complexes in the morning, then a museum that shows you the statues and objects those temples were built around, and a walk through Luxor’s local market to finish.',
  es: 'Karnak, el templo de Luxor y el Museo de Luxor son las tres mejores razones para pasar un día en la orilla este de Luxor, y este día privado los recorre los tres con un egiptólogo. Dos grandes conjuntos de templos al aire libre por la mañana, después un museo que te muestra las estatuas y los objetos en torno a los cuales se construyeron esos templos y, para terminar, un paseo por el mercado local de Luxor.',
  ja: 'カルナック神殿、ルクソール神殿、ルクソール博物館。ルクソール東岸で1日を過ごすなら、この三つが何よりの理由になります。このプライベートな1日では、エジプト学者とともにその三つをすべて巡ります。午前中は野外の二つの大神殿へ、続いて、それらの神殿の中心にあった彫像や品々を見せてくれる博物館へ、そして最後にルクソールの地元の市場を歩きます。',
};
const PANEL = {
  en: { pickup: 'Pickup', back: 'Back', lunch: 'Lunch' },
  es: { pickup: 'Recogida', back: 'Regreso', lunch: 'Almuerzo' },
  ja: { pickup: 'お迎え', back: 'お戻り', lunch: '昼食' },
};
const PERIOD = { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 昼: 'midday', 午後: 'afternoon' };

/* ── Parse ────────────────────────────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t　]+$/gm, '').trim();
const plain = (s) => clean(s.replace(/\*\*|\*/g, ''));
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
// Separator "·" with spaces around it (JA uses full-width spaces: "朝　·　カルナック神殿").
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
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [!!s.text, s.sites?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
for (const l of LANGS) for (const k of Object.keys(PANEL.en)) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel (${Object.keys(P[l].panelRows).join(', ')})`);
for (const l of LANGS) if (!P[l].opening.startsWith(SUMMARY[l])) throw new Error(`${l}: the summary is not the opening's own first sentences`);
const siteStops = P.en.periods.flatMap((x) => x.stops).filter((s) => s.sites);
if (siteStops.length !== SITE_GUIDES.length || siteStops.some((s, i) => s.sites.length !== SITE_GUIDES[i].length)) throw new Error('sites ≠ SITE_GUIDES');

/* ── Numeric gate ─────────────────────────────────────────────────────── */
const flat = (l) => {
  const p = P[l];
  return {
    opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
    ...Object.fromEntries(Object.keys(PANEL.en).map((k) => [`panel.${k}`, p.panelRows[PANEL[l][k]]])),
    ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text]])).filter(([, v]) => v)),
    ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
    ...Object.fromEntries(p.fitFor.map((t, i) => [`fit${i}`, t])),
    ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
  };
};
// Checked by hand (21 Nov), same meaning as EN (the open items' "Numeric gate (21 Nov)"): JA in0
// 1名様 = "from one traveller"; p0s1.x セティ1世・ラムセス2世・トトメス1世・トトメス3世 = Seti I,
// Ramses II, Thutmose I, Thutmose III; p0s3.x アメンヘテプ3世・ラムセス2世 = Amenhotep III,
// Ramses II; p2s0.x アメンヘテプ3世・アフメス1世・トトメス3世 = Amenhotep III, Ahmose I,
// Thutmose III — EN writes the regnal numbers in Roman numerals, which the gate does not read;
// wk3 八時間 = "eight hours" (the gate reads kanji numerals only before its own counters, not 時間).
// ES why «ambos» and fit2 «ambos» = EN "the two" (the gate reads "two" as 2); p0s2.x «2,7 kilómetros»
// = 2.7 km (the gate does not read the ES decimal comma) and «ambos templos» = "the two temples".
const SAME_MEANING = { es: ['why', 'p0s2.x', 'fit2'], ja: ['in0', 'p0s1.x', 'p0s3.x', 'p2s0.x', 'wk3'] };
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
      pickupLine: p.panelRows[PANEL[l].pickup], returnNote: p.panelRows[PANEL[l].back],
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'kmin'), excluded: fact(p.excluded, 'kmout'), options: fact(p.options, 'kmopt'),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));

/* ── Document and essay ───────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (doc.type !== 'dayTour') throw new Error('not a day tour');
if (DOC_ID === SIBLING) throw new Error('wrong document');
if (await client.getDocument(`drafts.${DOC_ID}`)) throw new Error(`drafts.${DOC_ID} exists — handle it first`);
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja].join();
if (![[OLD.from, OLD.es, OLD.ja].join(), [PRICES.en, PRICES.es, PRICES.ja].join()].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
// Tier / age / option-link fields: none exist on this doc today (tiers live in the essay, in the old
// inclusion rows, which this import replaces, and in shapeOfDay.character, unset below). Refuse if
// one has appeared since.
const TIER_FIELDS = ['priceTiers', 'tiers', 'tourLevels', 'levels', 'optionLink', 'optionLinks', 'minimumAge', 'ageLine', 'ageNote'];
const tierLeft = TIER_FIELDS.filter((f) => doc[f] != null);
if (tierLeft.length) throw new Error(`tier/age fields present (${tierLeft.join(', ')}) — retire them first`);
if (doc.seo?.metaTitle?.length) throw new Error('seo.metaTitle exists — set it to the new title too');
// Pickup zones come from Autoura at booking (owner, 21 Nov); report any zone field on the doc.
const zoneFields = Object.keys(doc).filter((k) => /zone/i.test(k));
console.log(`pickup-zone fields on the doc: ${zoneFields.length ? zoneFields.join(', ') : 'none'}`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// "That is not a selling point. It is simply true." — the old closing (correction 3); the page has
// its own closing line now.
const CLOSING_REF = { en: '00000000002d', es: '00000000002f', ja: '00000000001d' };
// The tier paragraph (correction 1) · empty blocks · ES: the standfirst · JA: the concierge line
// about the order and an evening return to Luxor Temple (concierge content is hidden in JA).
const SKIP = {
  en: ['00000000001d', '00000000003e'],
  es: ['000000000003', '00000000001f', '000000000042'],
  ja: ['00000000002b', '00000000002e'],
};
// Whole blocks rewritten (bold runs lost): the private-tour paragraph (2, 7: no tiers, no minimum
// age), the "larger proportion" sentence's slot → the market line (3, 8), and the tier summary →
// the kept concierge sentence (1). JA has no private-tour paragraph and no tier summary.
const REPLACE = {
  en: {
    '000000000015': 'This is a private tour, operated for your party alone — never shared with other guests. Because it is private, it runs for as few as one traveller, with no minimum group size and no waiting on other bookings; larger parties are accommodated in a suitable vehicle. A private, air-conditioned vehicle, a licensed Egyptologist guide in your language, and one bottle of mineral water per person are included.',
    '00000000002b': 'The day ends with a complimentary walk through Luxor’s local market.',
    '00000000003b': 'The concierge can sequence the day to avoid the midday heat at Karnak’s open courts.',
  },
  es: {
    '000000000017': 'Se trata de un tour estrictamente privado, operado en exclusiva para su grupo y nunca compartido con otros viajeros. Por su carácter privado, opera desde un único viajero, sin tamaño mínimo de grupo y sin esperar otras reservas; los grupos más amplios se acomodan en un vehículo adecuado. Se incluyen un vehículo privado con aire acondicionado, un guía egiptólogo licenciado en su idioma y una botella de agua mineral por persona.',
    '00000000002d': 'El día termina con un paseo de regalo por el mercado local de Luxor.',
    '00000000003f': 'El concierge puede ordenar el día para evitar el calor de mediodía en los patios abiertos de Karnak.',
  },
  ja: {
    '00000000001b': '一日の締めくくりは、ルクソールの地元の市場の散策です。この散策は私たちからのサービスです。',
  },
};
// [block, find, replace] — corrections 4, 5 and 6.
const FIX = {
  en: [
    ['000000000003', 'still operating on a scale that makes most of the ancient world look modest', 'on a scale that still takes adjusting to'], // 6
    ['000000000005', ' — not spectacle-seekers after a quick photograph, but people who want', '. If you want a quick photograph rather than an explanation, this day will feel long. It\'s built for people who want'], // 4
    ['000000000021', 'no other site in Egypt prepares you for quite what this complex turns out to be', 'few sites prepare you for what this complex turns out to be'], // 5
  ],
  es: [
    ['000000000005', 'todavía operando a una escala que hace que buena parte del mundo antiguo parezca modesto', 'a una escala a la que todavía cuesta acostumbrarse'],
    ['000000000007', ': no buscadores de espectáculo apurados por una foto, sino viajeros que esperan', '. Si busca una foto rápida más que una explicación, este día se le hará largo. Está pensado para viajeros que esperan'],
    ['000000000023', 'ningún otro yacimiento de Egipto prepara al visitante para lo que este complejo termina por revelar', 'pocos yacimientos preparan al visitante para lo que este complejo termina por revelar'],
  ],
  ja: [
    ['000000000009', '古代世界の大半をつましく見せてしまう規模で、いまなお機能しています。', 'いまなお目が慣れるまでに時間のかかる規模です。'],
    ['00000000000b', '——手早い一枚の写真を求める見物客ではなく、', '。解説よりも手早く写真を撮りたい方には、この一日は長く感じられるでしょう。このツアーが向いているのは、'],
    ['000000000011', 'エジプトのほかのどの遺跡も、この複合体が結局いったい何であるのかを、あなたに前もって備えさせてはくれないからです。', 'この複合体が結局いったい何であるのかに、前もって備えさせてくれる遺跡はほとんどないからです。'],
    // Broken characters (U+FFFD) already in the live JA essay, five blocks: the word each one
    // replaced is unambiguous from its context.
    ['000000000009', '中心を���めた', '中心を占めた'],
    ['00000000000d', '不���合', '不都合'],
    ['000000000011', 'ラム��ス2世', 'ラムセス2世'],
    ['000000000017', '再発見され���というより', '再発見されたというより'],
    ['000000000019', '並べ��れています', '並べられています'],
  ],
};
const body = doc.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const k of [CLOSING_REF[l], ...SKIP[l], ...Object.keys(REPLACE[l]), ...FIX[l].map(([k]) => k)]) if (!keys.has(k)) throw new Error(`${l}: essay block ${k} missing`);
  const value = row.value.map((b) => {
    if (REPLACE[l][b._key]) return { ...b, children: [{ ...b.children[0], marks: [], text: REPLACE[l][b._key] }] };
    const fixes = FIX[l].filter(([k]) => k === b._key);
    if (!fixes.length) return b;
    const children = b.children.map((c) => ({ ...c }));
    for (const [, find, repl] of fixes) {
      const alts = [find, find.replace(/'/g, '’'), find.replace(/’/g, "'")];
      const i = children.findIndex((c) => alts.some((x) => c.text.includes(x)));
      if (i < 0 && children.some((c) => [repl, repl.replace(/'/g, '’')].some((x) => c.text.includes(x)))) continue; // re-run
      if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
      children[i].text = children[i].text.replace(alts.find((x) => children[i].text.includes(x)), () => repl.replace(/'/g, '’'));
    }
    return { ...b, children };
  });
  return { ...row, value };
});
// Nothing "More about this day", the summary or the concierge note shows may keep what the page
// corrects: tiers, the English-only guide, the age line, the removed superlatives and "not a
// selling point", "dodge".
const RETIRED = {
  en: /\btiers?\b|Base \+|English-speaking|minimum age|\bage (?:is )?18\b|\b18 or over|look modest|no other site in Egypt|spectacle-seekers|larger proportion of surviving|any other single day|not a selling point|simply true|dodge/i,
  es: /\bniveles\b|cada nivel|nivel Base|Base \+|habla hispana|edad mínima|\b18 años|parezca modesto|ningún otro yacimiento|buscadores de espectáculo|proporción mayor|cualquier otro itinerario|argumento de venta|sencillamente, un hecho|esquivar/i,
  ja: /段階|料金構成|18歳|年齢制限|つましく見せ|ほかのどの遺跡も|見物客|現存する古代エジプト史|ほかのどの一日の行程|売り文句|ただ、そうなのです/,
};
const MARKET = { en: 'complimentary walk through Luxor’s local market', es: 'paseo de regalo por el mercado local de Luxor', ja: 'ルクソールの地元の市場の散策' };
const MUSEUM = { en: 'Where the Cairo Museum overwhelms, the Luxor Museum edits.', es: 'Donde el Museo de El Cairo abruma, el de Luxor edita.', ja: 'カイロ博物館が圧倒するところを、ルクソール博物館は刈り込みます。' };
for (const row of body) {
  const l = row._key;
  if (!RETIRED[l]) continue;
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  for (const b of row.value) if (!hidden.has(b._key) && textOf(b).includes('�')) throw new Error(`${l} ${b._key}: broken character (U+FFFD) still shown`);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[l].test(textOf(b))) throw new Error(`${l} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[l])[0]}"`);
  // The museum line is kept, and the market line follows the museum in the shown essay.
  const shown = row.value.filter((b) => !hidden.has(b._key)).map(textOf).join('\n');
  if (!(shown.indexOf(MUSEUM[l]) >= 0 && shown.indexOf(MUSEUM[l]) < shown.indexOf(MARKET[l]))) throw new Error(`${l}: the essay does not keep the museum line before the market line`);
}
for (const l of LANGS) {
  if (RETIRED[l].test(SUMMARY[l])) throw new Error(`${l}: summary still shows "${SUMMARY[l].match(RETIRED[l])[0]}"`);
  const note = doc.conciergeNote?.find((n) => n._key === l)?.value ?? '';
  if (RETIRED[l].test(note)) throw new Error(`${l}: concierge note still shows "${note.match(RETIRED[l])[0]}"`);
  for (const f of ['where', 'duration']) {
    const v = doc.shapeOfDay?.[f]?.find((n) => n._key === l)?.value ?? '';
    if (RETIRED[l].test(v)) throw new Error(`${l}: shapeOfDay.${f} still shows "${v.match(RETIRED[l])[0]}"`);
  }
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
// "Fully private · … · tiered pricing with optional entrance-fee bundle · minimum age 18": the tiers
// and the age line (owner rules 8 and 9). The day-tour layout does not show shapeOfDay.
const UNSET = doc.shapeOfDay?.character ? ['shapeOfDay.character'] : [];

/* ── Gates ────────────────────────────────────────────────────────────── */
for (const l of LANGS) {
  const rows = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]], {});
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });
if (!ready) console.log('prices: NOT READY — fill karnak-luxor-museum-prices.json from Autoura T2E-DT-LXR-07 (EN, ES and JA guide). Nothing can be applied yet.');

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const u of UNSET) console.log(`unset ${u}: ${JSON.stringify(doc.shapeOfDay.character.map((c) => c.value))}`);
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  summary ${l}: ${set.summary.find((t) => t._key === l).value}`);
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine} · back: ${B[l].intro.returnNote} · lunch: ${B[l].intro.lunch.text}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.period, x.periodLabel, x.stops.map((s) => [s.title, (s.sites ?? []).map((z) => z.name + (z.guideRef ? ' →' + z.guideRef._ref : ''))])]))}`);
  const essay = set.body.find((r) => r._key === l).value;
  const before = doc.body.find((r) => r._key === l).value;
  for (const b of essay) {
    const old = before.find((x) => x._key === b._key);
    if (textOf(old) !== textOf(b)) console.log(`  essay ${l} ${b._key}: ${textOf(b)}`);
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
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'durationLabel', 'shapeOfDay', 'citySlugsEn', 'allSlugs'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  if (!ready) throw new Error('prices not ready — fill karnak-luxor-museum-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-karnak-luxor-museum');
  await client.patch(DOC_ID).set(set).unset(UNSET).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
