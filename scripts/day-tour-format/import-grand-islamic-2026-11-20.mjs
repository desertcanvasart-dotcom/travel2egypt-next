/**
 * The Grand Islamic Cairo Day Tour in the day-tour format, EN + ES + JA together. Owner, 20 Nov: the
 * locked copy and its open items ("Instructions for Claude Code" §1). The KEEPER: /islamic-cairo-day-tour
 * is retired into it by retire-islamic-cairo-2026-11-20.mjs (run after this import).
 *
 *   tour  wp-page-87839   /the-grand-islamic-day-tour   URL unchanged in all three locales.
 *
 * The product: pickup → Mosque of Ibn Tulun (new, a short first stop) → Gayer-Anderson Museum →
 * the Citadel and the Mosque of Muhammad Ali → Sultan Hassan and the Rifai Mosque → lunch → Beit
 * el-Suhaymi on Al-Muizz Street → Khan El Khalili → back. Entrance to all six paying sites (Ibn
 * Tulun included; Autoura has no fee for it, so it adds nothing to the price), lunch, water, the
 * driver's tip. No tiers; children under 12 pay 50 %; no age line. The title is the locked one
 * (the old "Six Centuries in One Day" goes: correction 8). Guide in the page's language, so ES/JA
 * keep their own price (grand-islamic-prices.json, Autoura T2E-DT-CAI-10).
 *
 * Panel: Cairo, so the rule rows show (children 50 %, the Cairo/Giza pickup zones, guide = page
 * language); the intro carries the pickup line and the lunch text.
 *
 * Essay (Gate A.3, corrections 1–10): 1 Historic Cairo "dense with medieval Islamic architecture";
 * 2 "the most efficient days… anywhere in the country" removed; 3 "across a narrow street in one of
 * Cairo's most theatrical streetscapes"; 4 "a rare surviving merchant's house of the Ottoman period";
 * 5 "larger than London or Paris" removed; 6 kept; 7 the concierge note "Seven sites…" (EN, ES and
 * JA, though the day-tour layout renders it in no locale); 8 "seven sites… roughly a thousand
 * years", and "Six sites, seven centuries" left out of "More about this day"; 9 Ibn Tulun opens the
 * route paragraph with the page's own facts; 10 the café line already carries the site-wide 1773
 * wording (19 Nov sweep). Hidden: the closing (the page has its own), the helper lines, ES: the
 * standfirst.
 *
 * Guide links: Ibn Tulun · Gayer-Anderson · the Citadel · Muhammad Ali · Sultan Hassan · Beit
 * el-Suhaymi · Al-Muizz Street · Khan El Khalili. No guide page exists for the Rifai Mosque.
 *
 * needsReview: rows are written approved, as across the batch (true would publish an empty page);
 * nothing is written until the owner says publish.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-grand-islamic-2026-11-20.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-grand-islamic-2026-11-20.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-grand-islamic-2026-11-20.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-87839';
const OLD = { from: 79, es: 90, ja: 97 };
const PRICES = JSON.parse(readFileSync(new URL('./grand-islamic-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/grand-islamic-cairo-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (19 Nov 2026; prices from Autoura for 2 travellers).`;

const G = {
  tulun: 'guideArticle.cairo.mosque-of-ibn-tulun',
  gayer: 'guideArticle.cairo.gayer-anderson-museum',
  citadel: 'guideArticle.cairo.the-citadel-of-saladin',
  mali: 'guideArticle.cairo.mosque-of-muhammad-ali',
  hassan: 'guideArticle.cairo.mosque-madrassa-of-sultan-hassan',
  suhaymi: 'guideArticle.cairo.beit-al-suhaymi',
  muizz: 'guideArticle.cairo.sharia-al-muizz-li-din-allah',
  khan: 'guideArticle.cairo.khan-el-khalili',
};
// Sites per stop, in file order (no guide page for the Rifai Mosque).
const SITE_GUIDES = [[G.tulun], [G.gayer], [G.citadel, G.mali], [G.hassan, null], [G.suhaymi, G.muizz], [G.khan]];
const DURATION_LABEL = { en: 'Full day · ~9 hrs', es: 'Día completo · ~9 h', ja: '1日・約9時間' };
const DURATION_HOURS = 9;
// The dek / meta description: the locked opening's own words, naming all four stops.
const SUMMARY = {
  en: 'A private day inside Islamic Cairo: seven sites across roughly a thousand years, from the Mosque of Ibn Tulun and the Gayer-Anderson house to the Citadel, Sultan Hassan and the Rifai Mosque, Beit el-Suhaymi and Khan El Khalili.',
  es: 'Un día privado dentro del Cairo islámico: siete lugares a lo largo de unos mil años, de la mezquita de Ibn Tulun y la casa Gayer-Anderson a la Ciudadela, Sultán Hassan y la mezquita de al-Rifai, Beit el-Suhaymi y el Jan el-Jalili.',
  ja: 'イスラム・カイロの内側で過ごすプライベートな1日。約千年にわたる7か所を、イブン・トゥールーン・モスクとガイヤー・アンダーソンの家から、シタデル、スルタン・ハサンとリファーイー・モスク、ベイト・エル・スハイミ、ハーン・ハリーリまで巡ります。',
};
// Correction 7 (the concierge note). Not rendered by the day-tour layout in any locale.
const CONCIERGE = {
  en: ['Six sites in nine hours', 'Seven sites in nine hours'],
  es: ['Seis sitios en nueve horas', 'Siete sitios en nueve horas'],
  ja: ['9時間で6か所', '9時間で7か所'],
};
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo' },
  ja: { pickup: 'お迎え', lunch: '昼食' },
};
const OPTIONAL_COST = ['extraTicket', 'extraCost'];
const PERIOD = { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 昼: 'midday', 午後: 'afternoon' };

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
// Checked by hand (20 Nov), same meaning as EN: ES writes the centuries in Roman numerals (p0s2.x «siglos XVI y XVII», p2s0.x «XVII y principios del XVIII»), which the gate reads in part; p0s3.x «dos alminares» = "twin minarets". JA p0s2.x the two townhouses in kanji; p0s3.x the twin minarets written as 2.
const SAME_MEANING = { es: ['p0s2.x', 'p0s3.x', 'p2s0.x'], ja: ['p0s2.x', 'p0s3.x'] };
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
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'giin'), excluded: fact(p.excluded, 'giout'), options: fact(p.options, 'giopt'),
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

// The closing's first half ("Islamic Cairo is not the Egypt…"), now the page's own closing.
const CLOSING_REF = { en: '00000000002b', es: '000000000031', ja: '000000000031' };
// "Six sites, seven centuries…" (correction 8) · the concierge helper line · empty blocks ·
// ES: the standfirst and two helper lines.
const SKIP = {
  en: ['00000000002d', '00000000003b', '00000000003e'],
  es: ['000000000003', '000000000033', '000000000043', '000000000046'],
  ja: ['000000000033', '000000000041', '000000000044'],
};
// [block, find, replace] — corrections 1–5, 8 and 9 (10 is already the site-wide wording).
const FIX = {
  en: [
    ['000000000003', "Cairo's Islamic quarter is one of the most densely layered urban environments on earth, yet", "Cairo's Islamic quarter is dense with medieval Islamic architecture, yet"], // 1
    ['000000000003', 'It moves through six distinct sites spanning roughly 700 years of Islamic Cairo', 'It moves through seven distinct sites spanning roughly a thousand years of Islamic Cairo'], // 8
    ['000000000005', 'this is one of the most efficient days you can spend anywhere in the country.', 'this is the day for it.'], // 2
    ['00000000000f', 'The day opens at the ', 'The day opens at the Mosque of Ibn Tulun in the southern quarter of Islamic Cairo, built in the 9th century by Ahmad ibn Tulun, governor of Egypt, around a vast open courtyard, with a minaret whose stair spirals up the outside. Immediately beside it is the '], // 9 (before the bold «Gayer-Anderson Museum»)
    ['00000000000f', ', tucked immediately beside the Ibn Tulun Mosque in the southern quarter of Islamic Cairo.', '.'], // 9 (after it)
    ['00000000001b', 'face one another across a wide forecourt in what is probably the most architecturally theatrical streetscape in Cairo.', "face one another across a narrow street in one of Cairo's most theatrical streetscapes."], // 3
    ['000000000021', "and is the best-preserved example of a wealthy Cairo merchant's residence from the Ottoman period.", "and is a rare surviving merchant's house of the Ottoman period."], // 4
    ['000000000029', ' — larger than London or Paris at the time, a commercial', ' — a commercial'], // 5
  ],
  es: [
    ['000000000005', 'El cuarto islámico de El Cairo es uno de los entornos urbanos más densamente estratificados del mundo, y', 'El cuarto islámico de El Cairo está lleno de arquitectura islámica medieval, y'],
    ['000000000005', 'Recorre seis sitios distintos que abarcan aproximadamente 700 años del Cairo islámico', 'Recorre siete sitios distintos que abarcan aproximadamente mil años del Cairo islámico'],
    ['000000000007', ', es uno de los días más eficientes que se pueden pasar en cualquier punto del país.', ', este es el día para ello.'],
    ['000000000011', 'El día abre en el ', 'El día abre en la mezquita de Ibn Tulún, en el cuarto sur del Cairo islámico, levantada en el siglo IX por Ahmad ibn Tulún, gobernador de Egipto, en torno a un vasto patio abierto, con un alminar cuya escalera sube en espiral por el exterior. Justo a su lado está el '],
    ['000000000011', ', encajado inmediatamente al lado de la mezquita de Ibn Tulún en el cuarto sur del Cairo islámico.', '.'],
    ['000000000021', 'se enfrentan a uno y otro lado de un amplio antepatio en lo que probablemente sea el conjunto urbano más teatral de El Cairo.', 'se enfrentan a uno y otro lado de una calle estrecha en uno de los conjuntos urbanos más teatrales de El Cairo.'],
    ['000000000027', 'y es el ejemplo mejor conservado de la residencia de un comerciante cairota acomodado del periodo otomano.', 'y es una rara casa de comerciante superviviente del periodo otomano.'],
    ['00000000002f', '—más grande que Londres o París en aquel momento, eje comercial', '—eje comercial'],
  ],
  ja: [
    ['000000000009', '地上で最も密に層をなした都市環境のひとつでありながら', '中世のイスラム建築が密集する地区でありながら'],
    ['000000000009', 'おおよそ700年のイスラム・カイロにわたる六つの異なる施設', 'おおよそ千年のイスラム・カイロにわたる七つの異なる施設'],
    ['00000000000b', 'これはこの国のどこで過ごすよりも効率的な一日のひとつです。', 'これはそのための一日です。'],
    ['000000000015', '一日は', '一日はイスラム・カイロ南部の界隈にあるイブン・トゥールーン・モスクで開きます。9世紀にエジプト総督アフマド・イブン・トゥールーンが広大な中庭を囲んで築いたモスクで、ミナレットの階段は外側をらせん状にのぼっています。そのすぐ脇にあるのが、'],
    ['000000000015', 'で開きます。イスラム・カイロ南部の界隈、イブン・トゥールーン・モスクのすぐ脇に収まっています。', 'です。'],
    ['000000000021', 'おそらくカイロで最も建築的に劇場的な街路の眺めのなかで、広い前庭をはさんで向かい合っています。', 'カイロでもとりわけ劇的な街路の眺めのなかで、狭い通りをはさんで向かい合っています。'],
    ['000000000027', 'オスマン期の裕福なカイロの商人の住まいの、最も保存状態のよい例です。', 'オスマン期の商人の館として、今に残る数少ない例です。'],
    ['00000000002f', '——当時のロンドンやパリより大きく、サハラ以南のアフリカ', '——サハラ以南のアフリカ'],
  ],
};
const body = doc.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const k of [CLOSING_REF[l], ...SKIP[l], ...FIX[l].map(([k]) => k)]) if (!keys.has(k)) throw new Error(`${l}: essay block ${k} missing`);
  return {
    ...row,
    value: row.value.map((b) => {
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
  en: /densely layered|most efficient days|wide forecourt|probably the most|best-preserved example|London or Paris|six distinct sites|700 years of Islamic/i,
  es: /densamente estratificados|más eficientes|amplio antepatio|probablemente sea|mejor conservado|Londres o París|seis sitios|700 años del Cairo/i,
  ja: /最も密に層|効率的な一日|広い前庭|最も建築的に劇場的|最も保存状態のよい|ロンドンやパリ|六つの異なる施設|700年のイスラム/,
};
for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const hidden = new Set([CLOSING_REF[row._key], ...SKIP[row._key]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
}
const conciergeNote = LANGS.map((l) => {
  const row = doc.conciergeNote?.find((n) => n._key === l);
  if (!row) throw new Error(`${l}: no concierge note`);
  const [find, repl] = CONCIERGE[l];
  if (!row.value.includes(find) && !row.value.includes(repl)) throw new Error(`${l}: concierge note changed since 19 Nov`);
  return { ...row, value: row.value.replace(find, repl) };
});

const set = {
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  summary: LANGS.map((l) => ({ ...(doc.summary?.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: SUMMARY[l] })),
  conciergeNote,
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
if (!ready) console.log('prices: NOT READY — fill grand-islamic-prices.json from Autoura (EN, ES and JA guide). Nothing can be applied yet.');

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  summary ${l}: ${set.summary.find((t) => t._key === l).value}`);
  console.log(`  concierge ${l}: ${conciergeNote.find((t) => t._key === l).value.slice(0, 90)}…`);
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
  if (!ready) throw new Error('prices not ready — fill grand-islamic-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-grand-islamic-day-tour');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
