/**
 * Private Car & Guide for a Day in Cairo in the day-tour format, EN + ES + JA together,
 * the way the Aswan car and guide was done (import-aswan-car-and-guide-2026-11-19.mjs, PR #299).
 *
 *   tour  wp-page-87764   /cairo-private-car-and-guide
 *
 * The product (owner, 19 Nov, the locked copy + its open-items "Settled" list): a private car,
 * driver and Egyptologist for up to 8 hours in Cairo; up to 3 sites of the guest's choice from
 * a list of six, plus Khan El Khalili if they want it (the bazaar is not one of the three).
 * Included: car, driver, Egyptologist, the driver's tip. Not included: tickets, lunch (an
 * exception to standing rule 6), extra hours, the outer pickup areas, the guide's tip.
 * The owner's four open questions (water, "dates", NMEC, extra-hour price) are left as written.
 *
 * Price (Autoura T2E-DT-CAI-07, read 19 Nov): the engine's figure for 2 travellers sharing,
 * per person, at the house margin (30 %), lowest season, the higher of the EU / other bases,
 * the cheapest complete tier, rounded UP to the whole euro:
 *   English guide €53.31 → €54 (complete in every tier: car "HOREL -DAY-TOUR", English guide, water)
 *   Spanish guide  NOT COMPLETE: four T2E Spanish egyptologist rates apply to Cairo at
 *                  different prices (3,000 / 3,500 EGP) — the engine needs one kept
 *   Japanese guide NOT COMPLETE: no T2E Japanese egyptologist rate for Cairo (only "senior")
 * So NEW.es / NEW.ja stay null and --apply refuses until they are filled from Autoura.
 * Dry run and --preview keep the live ES / JA prices and say so.
 *
 * The panel uses the Cairo/Giza rule rows (children 50 %, the pickup zones, guide = page
 * language); the EN copy's "(ES: español · JA: 日本語)" note is an editor's aside, not written.
 * "Your day" is three label sections, as the copy heads them: the pickup, "Choose your stops:
 * any 3", and the optional bazaar with the way back.
 *
 * Essay (the open items' correction table + "all historical dates removed"): superlatives
 * softened or removed (docs/established-superlatives.md has no approved Tier 1 wording yet, so
 * the "Tier 1 candidates" are taken out, not kept); "for us" on the GEM (Tier 2); the Tahrir
 * Middle/New Kingdom line removed; every year and century removed (1902, 1922, 2025, c. 2560 /
 * 2530 BC, 1176, 1830–48, the 7th, 14th and 19th centuries, the 1980s, 1896); JA's "nothing in
 * the world compares" aside on the GEM removed. The old closing pair, ES standfirst and the
 * helper note are left out (the page has its own closing and "Make it your own").
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-cairo-car-and-guide-2026-11-19.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-cairo-car-and-guide-2026-11-19.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-cairo-car-and-guide-2026-11-19.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-87764';
const OLD = { from: 52, es: 63, ja: 70 };
// es / ja: null until Autoura prices them (see the header). --apply refuses while null.
const NEW = { from: 54, es: null, ja: null };
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/cairo-private-car-and-guide-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (19 Nov 2026; price from Autoura T2E-DT-CAI-07 for 2 travellers).`;

const G = {
  tahrir: 'guideArticle.cairo.egyptian-museum-of-antiquities',
  plateau: 'guideArticle.giza.the-giza-plateau',
  sphinx: 'guideArticle.giza.the-great-sphinx',
  citadel: 'guideArticle.cairo.the-citadel-of-saladin',
  muhammadAli: 'guideArticle.cairo.mosque-of-muhammad-ali',
  muizz: 'guideArticle.cairo.sharia-al-muizz-li-din-allah',
  hanging: 'guideArticle.cairo.hanging-church-al-mu-allaqa',
  abuSerga: 'guideArticle.cairo.church-of-saint-sergius-and-bacchus-abu-serga',
  benEzra: 'guideArticle.cairo.ben-ezra-synagogue',
  khan: 'guideArticle.cairo.khan-el-khalili',
};
// Per stop with sites, in file order, one entry per site on its line (the GEM has no guide page).
const SITE_GUIDES = [
  [null],
  [G.tahrir],
  [G.plateau, G.sphinx],
  [G.citadel, G.muhammadAli],
  [G.muizz],
  [G.hanging, G.abuSerga, G.benEzra],
  [G.khan],
];
const DURATION_LABEL = { en: 'Up to 8 hrs', es: 'Hasta 8 h', ja: '最大8時間' };
const PICKUP = { en: 'Pickup', es: 'Recogida', ja: 'お迎え' };
const ALLOW = {};

/* ── Parse ────────────────────────────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t]+$/gm, '').trim();
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
const SITES_RE = /^\*?(Sites|Lugares)[:：]\*?[:：]?\s*|^見学地[:：]\s*/;
function parseLocale(l) {
  const md = readFileSync(new URL(LOCKED[l], ROOT), 'utf8');
  const title = clean(md.match(/^# (.+)$/m)[1]);
  const secs = sections(md);
  if (secs.length !== 7) throw new Error(`${l}: expected 7 sections, found ${secs.length}`);
  const [panel, opening, why, day, incl, forYou, mine] = secs;
  const panelRows = Object.fromEntries(panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim()]));
  // "### Morning · Pickup" / "### Choose your stops: any 3" / "### Optional · Khan El Khalili"
  const parts = day.text.split(/\n### /).slice(1);
  if (parts.length !== 3) throw new Error(`${l}: expected 3 parts of the day, found ${parts.length}`);
  const periods = parts.map((part) => {
    const [head, ...rest] = part.split('\n');
    const stops = paras(rest.join('\n')).filter((p) => !p.startsWith('>')).map((p) => {
      const lines = p.split('\n');
      const hm = lines[0].match(/^\*\*(.+)\*\*$/);
      if (!hm) throw new Error(`${l}: unexpected stop paragraph: ${p.slice(0, 60)}`);
      const site = lines.find((x) => SITES_RE.test(x));
      const text = clean(lines.slice(1).filter((x) => x !== site).join(' '));
      const sites = site ? clean(site.replace(SITES_RE, '')).split(/\s*·\s*/).map(clean) : [];
      return { title: clean(hm[1]), text, sites };
    });
    return { label: clean(head), stops };
  });
  const sub = (t) => t.split(/\n(?=\*\*)/).map((blk) => ({ h: (blk.match(/^\*\*(.+?)\*\*/) ?? [])[1], items: bullets(blk) })).filter((x) => x.h);
  const [inc, exc] = sub(incl.text);
  const [fit, worth] = sub(forYou.text);
  const tail = paras(mine.text);
  return {
    title, panelRows, periods,
    opening: clean(paras(opening.text)[0]), whyThisOrder: clean(paras(why.text)[0]),
    included: inc.items, excluded: exc.items, fitFor: fit.items, worthKnowing: worth.items,
    options: bullets(mine.text), closingLine: clean(tail[tail.length - 1].replace(/^\*(.*)\*$/, '$1')),
  };
}
const P = Object.fromEntries(LANGS.map((l) => [l, parseLocale(l)]));
const shapeOf = (p) => JSON.stringify({ periods: p.periods.map((x) => x.stops.map((s) => s.sites.length)), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
for (const l of ['es', 'ja']) if (shapeOf(P.en) !== shapeOf(P[l])) throw new Error(`${l} structure differs from EN:\n ${shapeOf(P.en)}\n ${shapeOf(P[l])}`);
for (const l of LANGS) if (!P[l].panelRows[PICKUP[l]]) throw new Error(`${l}: no pickup row`);
const siteStops = P.en.periods.flatMap((x) => x.stops).filter((s) => s.sites.length);
if (siteStops.length !== SITE_GUIDES.length || siteStops.some((s, i) => s.sites.length !== SITE_GUIDES[i].length)) throw new Error('sites ≠ SITE_GUIDES');

/* ── Numeric gate ─────────────────────────────────────────────────────── */
const flat = (p) => ({
  opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
  ...Object.fromEntries(p.periods.flatMap((x, i) => [[`p${i}`, x.label], ...x.stops.flatMap((s, j) => [[`p${i}s${j}.t`, s.title], [`p${i}s${j}.x`, s.text]])])),
  ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
  ...Object.fromEntries(p.fitFor.map((t, i) => [`fit${i}`, t])),
  ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
});
// Same meaning, checked by hand 19 Nov. ES p1s1.x (the Egyptian Museum): «los dos es demasiado»
// = EN "both is too much". JA (the open items' numeric-gate note): the extra numbers
// are grammar, not facts — 1日 / 1名様 ("the day", "one traveller"), 2時間 ("two hours", a
// word in EN), 10月6日市 (the Japanese name of 6th of October City); the gate passes them.
const SAME_MEANING = { es: ['p1s1.x'], ja: [] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
  for (const k of SAME_MEANING[l]) { delete en[k]; delete lc[k]; console.log(`numeric gate (${l}): ${k} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

/* ── Build ────────────────────────────────────────────────────────────── */
function build(l) {
  const p = P[l];
  let si = 0;
  const timeline = p.periods.map((x, pi) => ({
    _key: `dt-${l}-${pi + 1}`, _type: 'dayTourPeriod', lang: l, period: 'label', periodLabel: x.label,
    stops: x.stops.map((s, j) => {
      const guides = s.sites.length ? SITE_GUIDES[si++] : [];
      return {
        _key: `s${pi + 1}-${j + 1}`, _type: 'dayTourStop', title: s.title, ...(s.text ? { text: s.text } : {}), skipGlance: true,
        ...(s.sites.length ? {
          sites: s.sites.map((name, k) => ({ _key: `x${pi + 1}${j + 1}${k}`, _type: 'dayTourSite', name, ...(guides[k] ? { guideRef: { _type: 'reference', _ref: guides[k], _weak: true } } : {}) })),
        } : {}),
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
      pickupLine: p.panelRows[PICKUP[l]],
      lunch: { status: 'notIncluded' },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'cgin'), excluded: fact(p.excluded, 'cgout'), options: fact(p.options, 'cgopt'),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));

/* ── Document and essay ───────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (doc.type !== 'dayTour') throw new Error('not a day tour');
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja].join();
const priceNew = [NEW.from, NEW.es ?? OLD.es, NEW.ja ?? OLD.ja].join();
if (![[OLD.from, OLD.es, OLD.ja].join(), priceNew].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const missing = ['es', 'ja'].filter((l) => NEW[l] == null);
if (missing.length) console.log(`⚠ ${missing.join(' / ').toUpperCase()} price NOT from Autoura (guide-rate gap): the live ${missing.map((l) => `€${doc.guideLanguagePrices?.[l]}`).join(' / ')} kept in this run; --apply refuses`);
if (apply && missing.length) throw new Error(`--apply refused: no Autoura price yet for ${missing.join(', ')} (T2E-DT-CAI-07 guide-rate gap)`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// The old closing line ("A private car and a good guide…"), now the page's own closing.
const CLOSING_REF = { en: '000000000026', es: '000000000028', ja: '00000000002c' };
// The closing's first half · the helper note (now "Make it your own") · ES: the standfirst.
const SKIP = {
  en: ['000000000024', '000000000035'],
  es: ['000000000003', '000000000026', '000000000039'],
  ja: ['00000000002a', '00000000003b'],
};
// [block, find, replace] — the open items' essay corrections and the dates (owner, 19 Nov).
const FIX = {
  en: [
    ['000000000005', 'It contains the only surviving wonder of the ancient world, one of', 'It contains the Great Pyramid, one of'],
    ['000000000005', 'two of the finest collections of pharaonic artefacts on earth', 'two great collections of pharaonic artefacts'],
    ['000000000005', ', which fully opened on 1 November 2025 and now holds', ', which now holds'],
    ['000000000010', 'is the most significant new cultural institution in Egypt in a generation', 'is, for us, the most significant new cultural institution in Egypt in a generation'],
    ['000000000010', 'excavated from KV62 in 1922', 'excavated from KV62'],
    ['000000000013', 'Built in 1902, it has the atmosphere of a 19th-century cabinet of curiosities', 'It has the atmosphere of a cabinet of curiosities'],
    ['000000000013', 'the Tahrir collection skews heavily towards the Middle and New Kingdoms and has an intimacy the newer building cannot replicate', 'the old building has an intimacy the newer one cannot replicate'],
    ['000000000016', 'The Great Pyramid of Khufu, built around 2560 BC, stood as the tallest structure on earth for nearly 4,000 years. ', 'The Great Pyramid was built for Khufu. '],
    ['000000000016', ', likely dates to the reign of Khafre, c. 2530 BC.', ', likely dates to the reign of Khafre.'],
    ['000000000019', 'The Citadel was founded by Saladin in 1176 and remained the seat of Egyptian government until the 19th century.', 'The Citadel was founded by Saladin and was long the seat of Egyptian government.'],
    ['000000000019', 'built by Muhammad Ali Pasha between 1830 and 1848 — is the most visited Islamic monument in Cairo', 'built by Muhammad Ali Pasha — is one of the most visited Islamic monuments in Cairo'],
    ['00000000001c', "is Cairo's oldest commercial district, established in the 14th century on the site", 'is one of Cairo’s oldest markets, built on the site'],
    ['00000000001f', 'is the backbone of one of the densest concentrations of medieval Islamic architecture in the world', 'is lined with medieval Islamic architecture'],
    ['000000000022', ', with a nave dating to the 7th century;', ';'],
    ['000000000022', 'the Ben Ezra Synagogue, restored in the 1980s and the site where the Cairo Geniza — one of the most significant manuscript discoveries in history — was found in 1896.', 'the Ben Ezra Synagogue, where the Cairo Geniza was found.'],
  ],
  es: [
    ['000000000007', 'Contiene la única maravilla superviviente del mundo antiguo, uno de', 'Contiene la Gran Pirámide, uno de'],
    ['000000000007', 'dos de las mejores colecciones de objetos faraónicos del planeta', 'dos grandes colecciones de objetos faraónicos'],
    ['000000000007', ', que abrió por completo el 1 de noviembre de 2025 y alberga ahora', ', que alberga ahora'],
    ['000000000012', 'es la institución cultural más significativa que ha abierto Egipto en una generación', 'es, para nosotros, la institución cultural más significativa que ha abierto Egipto en una generación'],
    ['000000000012', 'excavados en la KV62 en 1922', 'excavados en la KV62'],
    ['000000000015', 'Construido en 1902, conserva la atmósfera de un gabinete de curiosidades del siglo XIX, organizado', 'Conserva la atmósfera de un gabinete de curiosidades, organizado'],
    ['000000000015', 'la colección de Tahrir se inclina con fuerza hacia los Imperios Medio y Nuevo y tiene una intimidad que el edificio nuevo no puede replicar', 'el edificio antiguo tiene una intimidad que el nuevo no puede replicar'],
    ['000000000018', 'La Gran Pirámide de Keops, construida hacia el 2560 a. C., fue la estructura más alta de la Tierra durante casi 4.000 años. ', 'La Gran Pirámide se construyó para Keops. '],
    ['000000000018', ', data probablemente del reinado de Kefrén, hacia el 2530 a. C.', ', data probablemente del reinado de Kefrén.'],
    ['00000000001b', 'La Ciudadela fue fundada por Saladino en 1176 y siguió siendo sede del gobierno egipcio hasta el siglo XIX.', 'La Ciudadela fue fundada por Saladino y fue durante mucho tiempo sede del gobierno egipcio.'],
    ['00000000001b', 'construida por Mohamed Alí Pachá entre 1830 y 1848— es el monumento islámico más visitado de El Cairo', 'construida por Mohamed Alí Pachá— es uno de los monumentos islámicos más visitados de El Cairo'],
    ['00000000001e', 'es el distrito comercial más antiguo de El Cairo, fundado en el siglo XIV sobre el solar', 'es uno de los mercados más antiguos de El Cairo, levantado sobre el solar'],
    ['000000000021', 'es la espina dorsal de una de las concentraciones de arquitectura islámica medieval más densas del mundo', 'está flanqueada de arquitectura islámica medieval'],
    ['000000000024', ', con una nave que data del siglo VII;', ';'],
    ['000000000024', 'la sinagoga de Ben Ezra, restaurada en los años ochenta y lugar donde se halló en 1896 la Genizá de El Cairo, uno de los descubrimientos manuscritos más significativos de la historia.', 'la sinagoga de Ben Ezra, donde se halló la Genizá de El Cairo.'],
  ],
  ja: [
    ['00000000000b', '古代世界で唯一現存する不思議、', 'クフ王の大ピラミッド、'],
    ['00000000000b', '地上で最も見事なファラオ時代の遺物のコレクションのうちの二つ', 'ファラオ時代の遺物の二つの偉大なコレクション'],
    ['00000000000b', '（2025年11月1日に全面開館し、世界のどこにも比肩するものがありません）', ''],
    ['000000000016', 'は、エジプトでこの一世代で最も重要な新しい文化施設です', 'は、私たちにとって、エジプトでこの一世代で最も重要な新しい文化施設です'],
    ['000000000016', '2025年11月1日に全面開館し、', ''],
    ['000000000016', '1922年にKV62から発掘された', 'KV62から発掘された'],
    ['000000000019', '1902年に建てられ、二つのフロアにわたって年代順に整理された、19世紀の珍品陳列室のような趣があります', '二つのフロアにわたって年代順に整理された、珍品陳列室のような趣があります'],
    ['000000000019', 'タハリールのコレクションは中王国・新王国時代に大きく偏っており、新しい建物には再現できない親密さがあります', '古い建物には、新しい建物には再現できない親密さがあります'],
    ['00000000001c', 'クフ王の大ピラミッドは、紀元前2560年ごろに築かれ、4,000年近くにわたって地上で最も高い構造物であり続けました。', '大ピラミッドはクフ王のために築かれました。'],
    ['00000000001c', 'おそらくカフラー王の治世、紀元前2530年ごろのものです。', 'おそらくカフラー王の治世のものです。'],
    ['00000000001f', '城塞は1176年にサラディンによって築かれ、19世紀までエジプトの政庁の座であり続けました。', '城塞はサラディンによって築かれ、長くエジプトの政庁の座であり続けました。'],
    ['00000000001f', '1830年から1848年にかけてムハンマド・アリー・パシャによって建てられた', 'ムハンマド・アリー・パシャによって建てられた'],
    ['00000000001f', 'カイロで最も多く訪れられるイスラムの記念建造物であり、', 'カイロで最も多く訪れられるイスラムの記念建造物のひとつであり、'],
    ['000000000022', 'はカイロ最古の商業地区で、14世紀にファーティマ朝の王室墓地の跡地に開かれました。', 'はカイロで最も古い市場のひとつで、ファーティマ朝の王室墓地の跡地に開かれました。'],
    ['000000000025', '世界で最も中世イスラム建築が密集した一帯の背骨をなします', '中世イスラム建築が立ち並ぶ通りです'],
    ['000000000028', 'ローマ時代のバビロン要塞の南門楼の上に建てられ、身廊は7世紀にさかのぼります。', 'ローマ時代のバビロン要塞の南門楼の上に建てられました。'],
    ['000000000028', 'ベン・エズラ・シナゴーグは、1980年代に修復され、史上最も重要な写本の発見のひとつであるカイロ・ゲニザが1896年に見つかった場所です。', 'ベン・エズラ・シナゴーグは、カイロ・ゲニザが見つかった場所です。'],
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
        if (i < 0 && (repl === '' || children.some((c) => c.text.includes(repl) || c.text.includes(repl.replace(/'/g, '’'))))) continue; // re-run
        if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
        children[i].text = children[i].text.replace(alts.find((x) => children[i].text.includes(x)), repl);
      }
      return { ...b, children };
    }),
  };
});
// Nothing "More about this day" shows may keep what the page corrects (dates, superlatives).
const RETIRED = {
  en: /only surviving wonder|finest collections|on earth|November 2025|1922|1902|\d+(st|nd|rd|th)[- ]century|skews heavily|2560|2530|tallest|4,000 years|1176|1830|1848|is the most visited|oldest commercial|densest|1980s|1896|most significant manuscript/i,
  es: /única maravilla|mejores colecciones|del planeta|noviembre de 2025|1922|1902|siglo [IVX]+|Imperios Medio|2560|2530|más alta de la Tierra|4\.000 años|1176|1830|1848|es el monumento islámico más visitado|distrito comercial más antiguo|más densas|años ochenta|1896|descubrimientos manuscritos/i,
  ja: /唯一現存|最も見事|2025年|1922年|1902年|\d+世紀|中王国・新王国時代に大きく偏|紀元前|4,000年|最も高い構造物|1176年|1830年|1848年|記念建造物であり|最古の商業|最も中世イスラム建築が密集|1980年代|1896年|史上最も重要|比肩/,
};
for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const hidden = new Set([CLOSING_REF[row._key], ...SKIP[row._key]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
}

const set = {
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  durationLabel: LANGS.map((l) => ({ ...(doc.durationLabel?.find((t) => t._key === l) ?? { _key: l, _type: 'internationalizedArrayStringValue' }), value: DURATION_LABEL[l] })),
  durationHours: 8,
  priceFrom: NEW.from,
  guideLanguagePrices: { ...(doc.guideLanguagePrices ?? { _type: 'object' }), es: NEW.es ?? doc.guideLanguagePrices?.es, ja: NEW.ja ?? doc.guideLanguagePrices?.ja },
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
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]], ALLOW);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.periodLabel, x.stops.map((s) => s.title)]))}`);
  for (const b of set.body.find((r) => r._key === l).value) {
    const before = doc.body.find((r) => r._key === l).value.find((x) => x._key === b._key);
    if (textOf(before) !== textOf(b)) console.log(`  essay ${l} ${b._key}: ${textOf(b).slice(0, 160)}…`);
  }
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
    out[l] = Object.fromEntries(['title', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'citySlugsEn'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  await writeRollback(client, [DOC_ID], 'before-cairo-car-and-guide');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production; needs ES/JA Autoura prices first)');
