/**
 * Esna, Edfu & Kom Ombo: Private Day Tour from Luxor to Aswan, in the day-tour format, EN + ES + JA
 * together. Owner, 20 Nov: the locked copy and its open items (standing rules 8 and 9).
 *
 *   tour  wp-page-88179   /day-tour-to-esna-edfu-kom-ombo-from-luxor   URL unchanged; no redirect.
 *
 * The product: early pickup wherever the guest stays in Luxor (hotel or cruise ship) → Esna → Edfu
 * → lunch → Kom Ombo and the Crocodile Museum → drop-off wherever they stay in Aswan by early
 * evening. One way. Entrance to the three temples (the Crocodile Museum is on the Kom Ombo ticket)
 * and lunch included; the Base / + Entrance / + Lunch tiers and the minimum age 18 are gone;
 * children under 12 pay 50 %. Guide in the page's language, so ES/JA keep their own price
 * (esna-edfu-kom-ombo-prices.json, from Autoura T2E-DT-LXR-06).
 * The transfer product /private-tour-transfer-from-luxor-to-aswan-by-bus is NOT touched (open items:
 * it stays a transfer; its rewrite comes in its own batch).
 *
 * Panel: the copy's own rows (dayTourIntro.panelRows), so the one-way "Drop-off" row reads as
 * written instead of the rule rows' "Back". The EN guide row's "(ES: español · JA: 日本語)" is an
 * editor's aside, not written.
 *
 * Summary (dek / meta description): the old one called them "three of Egypt's best-preserved
 * ancient temples"; the new one is built from the locked opening's own words.
 *
 * Essay (Gate A.3, corrections 1–6): 1 the tier paragraph → "Entrance to all three temples and
 * lunch at a local restaurant are included."; the concierge tier line hidden; 2 "a licensed
 * Egyptologist guide in your language"; 3 Edfu: the shared Tier 1 wording, "the most completely
 * preserved temple in Egypt", the Luxor Temple comparison dropped; 4 "a one-way transfer, with three
 * temples on the way"; 5 kept; 6 the minimum age removed, pickup "from your hotel or cruise ship in
 * Luxor". JA has no tier or age paragraph. The concierge note (not rendered by the day-tour layout)
 * is left as it is.
 *
 * Guide links: Esna, Edfu, Kom Ombo (the Crocodile Museum has no guide page). The open items also
 * list Aswan and Philae: those names sit only in "Make it your own", whose rows are plain text until
 * the option-link field (PR #315) is merged.
 *
 * needsReview: rows are written approved, as with every page in this batch (true would publish an
 * empty page); nothing is written until the owner says publish.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-esna-edfu-kom-ombo-2026-11-20.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-esna-edfu-kom-ombo-2026-11-20.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-esna-edfu-kom-ombo-2026-11-20.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-88179';
const OLD = { from: 162, es: 173, ja: 180 };
const PRICES = JSON.parse(readFileSync(new URL('./esna-edfu-kom-ombo-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/esna-edfu-kom-ombo-luxor-to-aswan-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (19 Nov 2026; prices from Autoura for 2 travellers).`;

const G = {
  esna: 'guideArticle.esna.the-temple-of-khnum-at-esna',
  edfu: 'guideArticle.edfu.edfu-temple',
  komombo: 'guideArticle.kom-ombo.the-temple-of-kom-ombo',
};
// Sites per stop, in file order: Esna; Edfu; "Temple of Kom Ombo · Crocodile Museum" (no guide page
// for the museum).
const SITE_GUIDES = [[G.esna], [G.edfu], [G.komombo, null]];
const DURATION_LABEL = { en: 'Full day · ~10 hrs', es: 'Día completo · ~10 h', ja: '1日・約10時間' };
const DURATION_HOURS = 10;
// The dek / meta description: the locked opening's own words, naming all four stops.
const SUMMARY = {
  en: 'A private one-way day from Luxor to Aswan with three Ptolemaic and Roman temples on the way, Esna, Edfu and Kom Ombo, with your own car, driver and Egyptologist, and lunch included.',
  es: 'Un día privado, solo de ida, de Luxor a Asuán con tres templos ptolemaicos y romanos en el camino, Esna, Edfu y Kom Ombo, con tu coche, tu conductor y tu egiptólogo, y el almuerzo incluido.',
  ja: 'ルクソールからアスワンへ片道で移動しながら、エスナ、エドフ、コム・オンボの3つの神殿を訪ねるプライベートな1日。専用車・ドライバー・エジプト学者ガイド付きで、昼食も含まれます。',
};
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo' },
  ja: { pickup: 'お迎え', lunch: '昼食' },
};
const OPTIONAL_COST = ['extraTicket', 'extraCost'];
const PERIOD = { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 午前: 'morning', 昼: 'midday', 午後: 'afternoon' };

/* ── Parse ────────────────────────────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t　]+$/gm, '').trim();
const plain = (s) => clean(s.replace(/\*\*|\*/g, ''));
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
// Separator "·" with spaces around it (JA uses full-width spaces: "朝　·　エジプト考古学博物館").
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
      if (p.startsWith('>')) continue; // "More about this day →" pointer
      const lines = p.split('\n');
      const inc = p.match(/^\*\*(.+?)\*\*\s+([\s\S]+)$/);
      if (inc && !lines[0].endsWith('**')) {
        // "**Inside a pyramid (included).** text" → the previous stop's includedNote, as one string.
        stops[stops.length - 1].includedNote = plain(`${inc[1]} ${inc[2]}`);
        continue;
      }
      const hm = lines[0].match(/^\*\*(.+)\*\*$/);
      if (!hm) throw new Error(`${l}: unexpected paragraph in "${head}": ${p.slice(0, 60)}`);
      const stop = { title: plain(hm[1]) };
      const body = [];
      for (const ln of lines.slice(1)) {
        const sm = ln.match(/^\*?(Sites|Lugares|見学地)[:：]\*?[:：]?\s*(.+)$/);
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
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [!!s.text, s.sites?.length ?? 0, !!s.includedNote, s.optional?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
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
    ...Object.fromEntries(Object.keys(PANEL.en).map((k) => [`panel.${k}`, p.panelRows[PANEL[l][k]]])),
    ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text], [`p${pi}s${si}.inc`, s.includedNote], ...(s.optional ?? []).map((o, i) => [`p${pi}s${si}.o${i}`, o])])).filter(([, v]) => v)),
    ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
    ...Object.fromEntries(p.fitFor.map((t, i) => [`fit${i}`, t])),
    ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
  };
};
// Checked by hand (20 Nov), same meaning as EN: ES p0s1.x «siglos I y II» = EN "1st and 2nd centuries" (Roman numerals, as the open items note). JA writes 「四世紀」 (closing), 「約九メートル」 (p0s1.x), the two sets of halls (p2s0.x) and 「約三時間」 (wk1) in kanji numerals, which the gate does not read.
const SAME_MEANING = { es: ['p0s1.x'], ja: ['closing', 'p0s1.x', 'p2s0.x', 'wk1'] };
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
        ...(s.includedNote ? { includedNote: s.includedNote } : {}),
        // Khufu's interior = extra ticket, the camel ride = extra cost (file order).
        ...(s.optional ? { skipGlance: true, optional: s.optional.map((text, k) => ({ _key: `o${k + 1}`, _type: 'dayTourOptional', text, cost: OPTIONAL_COST[k] })) } : {}),
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
      panelRows: p.ownRows.map((r, i) => ({ _key: `pr${i + 1}`, _type: 'dayPanelRow', ...r })),
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'eein'), excluded: fact(p.excluded, 'eeout'), options: fact(p.options, 'eeopt'),
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
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// The essay's closing, first half ("Three temples, built across four centuries…"), now the page's
// own closing line.
const CLOSING_REF = { en: '000000000039', es: '00000000003b', ja: '000000000028' };
// The closing's second half · the concierge tier line · empty blocks · ES: the standfirst.
const SKIP = {
  en: ['00000000003b', '000000000049', '00000000004c'],
  es: ['000000000003', '00000000003d', '00000000004d', '000000000050'],
  ja: ['00000000002a', '000000000038', '00000000003b'],
};
// Whole-block rewrites (the blocks are split into bold and plain runs): the "what's included" paragraph
// (corrections 2 and 6: guide in your language, no age line, no tier) and the tier paragraph (1).
const REPLACE = {
  en: {
    '000000000017': 'This is a private tour, operated for your party alone — never shared with other guests. Because it is private, it runs for as few as one traveller, with no minimum group size and no waiting on other bookings; larger parties are accommodated in a suitable vehicle. A private, air-conditioned vehicle, a licensed Egyptologist guide in your language, and one bottle of mineral water per person are included.',
    '00000000001f': 'Entrance to all three temples and lunch at a local restaurant are included.',
  },
  es: {
    '000000000019': 'Se trata de un tour estrictamente privado, operado en exclusiva para su grupo y nunca compartido con otros viajeros. Por su carácter privado, opera desde un único viajero, sin tamaño mínimo de grupo y sin esperas a otras reservas; los grupos más amplios se acomodan en un vehículo adecuado. Se incluyen vehículo privado con aire acondicionado, guía egiptólogo licenciado en su idioma y una botella de agua mineral por persona.',
    '000000000021': 'Se incluyen la entrada a los tres templos y el almuerzo en un restaurante local.',
  },
  ja: {},
};
// [block, find, replace] — corrections 3, 4 and 6 (pickup).
const FIX = {
  en: [
    ['000000000009', 'It also works as a one-way transfer between the two cities dressed as a tour, which is an honest and efficient way to spend the day.', 'It also works as a one-way transfer, with three temples on the way.'], // 4
    ['000000000023', 'The day begins in Luxor and heads south', 'The day begins with pickup from your hotel or cruise ship in Luxor and heads south'], // 6
    ['00000000002b', 'The Temple of Horus at Edfu is the largest and most completely preserved Ptolemaic temple in Egypt, and by most measures the best-preserved ancient Egyptian temple of any period after Luxor Temple.', 'The Temple of Horus at Edfu is the most completely preserved temple in Egypt.'], // 3
  ],
  es: [
    ['00000000000b', 'Funciona también como traslado en un sentido entre ambas ciudades vestido de tour, que es una forma honesta y eficiente de aprovechar la jornada.', 'Funciona también como traslado en un solo sentido, con tres templos en el camino.'],
    ['000000000025', 'El día arranca en Luxor y avanza hacia el sur', 'El día arranca con la recogida en su hotel o su crucero en Luxor y avanza hacia el sur'],
    ['00000000002d', 'El Templo de Horus en Edfu es el templo ptolemaico más grande y mejor conservado de Egipto y, por la mayoría de medidas, el templo egipcio antiguo de cualquier época más íntegro tras el templo de Luxor.', 'El Templo de Horus en Edfu es el templo que se conserva más completo de Egipto.'],
  ],
  ja: [
    ['00000000000f', 'また、二都市間の片道移動をツアーの装いでこなすやり方としても働き、それは正直で効率のよい一日の過ごし方でもあります。', 'また、3つの神殿に立ち寄る片道の移動としても使えます。'],
    ['000000000013', '一日はルクソールに始まり、', '一日はルクソールのホテルまたはクルーズ船でのお迎えに始まり、'],
    ['00000000001a', 'エドフのホルス神殿はエジプト最大かつ最も完全に保存されたプトレマイオス朝の神殿であり、多くの尺度において、ルクソール神殿に次いで、いかなる時代のものよりもよく保存された古代エジプトの神殿です。', 'エドフのホルス神殿は、エジプトで最も完全な形で残る神殿です。'],
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
        if (i < 0 && (repl === '' || children.some((c) => [repl, repl.replace(/'/g, '’')].some((x) => c.text.includes(x))))) continue; // re-run
        if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
        children[i].text = children[i].text.replace(alts.find((x) => children[i].text.includes(x)), (m) => (m.includes('’') ? repl.replace(/'/g, '’') : repl));
      }
      return { ...b, children };
    }),
  };
});
// Nothing "More about this day" shows may keep what the page corrects.
const RETIRED = {
  en: /\btiers?\b|minimum age|English-speaking|best-preserved|after Luxor Temple|dressed as a tour/i,
  es: /\bniveles?\b|edad mínima|habla hispana|mejor conservado|tras el templo de Luxor|vestido de tour/i,
  ja: /最大かつ最も完全|ルクソール神殿に次いで|ツアーの装い|最低年齢/,
};
for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const hidden = new Set([CLOSING_REF[row._key], ...SKIP[row._key]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
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

/* ── Gates ────────────────────────────────────────────────────────────── */
for (const l of LANGS) {
  const rows = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });
if (!ready) console.log('prices: NOT READY — fill esna-edfu-kom-ombo-prices.json from Autoura (EN, ES and JA guide). Nothing can be applied yet.');

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  summary ${l}: ${set.summary.find((t) => t._key === l).value}`);
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine} · lunch: ${B[l].intro.lunch.text}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.period, x.periodLabel, x.stops.map((s) => [s.title, (s.sites ?? []).map((z) => z.name)])]))}`);
  const essay = set.body.find((r) => r._key === l).value;
  const before = doc.body.find((r) => r._key === l).value;
  for (const b of essay) {
    const old = before.find((x) => x._key === b._key);
    if (textOf(old) !== textOf(b)) console.log(`  essay ${l} ${b._key}: ${textOf(b).slice(0, 160)}…`);
  }
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  console.log(`  essay ${l}: ${essay.length} blocks, ${essay.length - hidden.size} shown`);
}

if (previewOut) {
  const refs = await client.fetch('*[_id in $ids]', { ids: Object.values(G) });
  const cityIds = [...new Set([...refs.map((r) => r.parentCity?._ref), ...(doc.cities ?? []).map((c) => c._ref)].filter(Boolean))];
  const cities = await client.fetch('*[_id in $ids]', { ids: cityIds });
  const dataset = [{ ...doc, ...set }, ...refs, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const slug = doc.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'citySlugsEn', 'allSlugs'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  if (!ready) throw new Error('prices not ready — fill esna-edfu-kom-ombo-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-esna-edfu-kom-ombo-day-tour');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
