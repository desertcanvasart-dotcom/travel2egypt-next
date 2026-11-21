/**
 * The Grand Old Cairo Day Tour in the day-tour format, EN + ES + JA together. Owner, 20 Nov: the
 * locked copy and its open items (inner folder grand-old-cairo-day-tour/, answers received 20 Nov).
 *
 *   tour  wp-page-87828   /private-tour-the-grand-old-cairo-tour   URL unchanged in all three locales.
 *
 * The product: pickup → Bab Zuweila → the Mosque of Ibn Tulun → the Hanging Church, Abu Serga and
 * Ben Ezra → lunch → the Cave Church of Saint Simon (Mokattam) → Khan El Khalili → Al-Azhar Park →
 * back. Entrance to every site on the route (Al-Azhar Park included), the Bab Zuweila and Ibn Tulun
 * climbs, lunch, water, the driver's tip. No tiers; children under 12 pay 50 %; no age line. The
 * title is the locked one. Guide in the page's language, so ES/JA keep their own price
 * (grand-old-cairo-prices.json, Autoura T2E-DT-CAI-08). PRICE PENDING: the Mosque of Ibn Tulun gets
 * an entrance fee (EGP 200, owner 21 Nov); the current 66 / 77 / 93 exclude it. Re-run CAI-08 once
 * the fee is in Autoura and update the JSON before --apply.
 *
 * Panel: Cairo, so the rule rows show (children 50 %, the Cairo/Giza pickup zones, guide = page
 * language); the intro carries the pickup line and the lunch text.
 *
 * Essay (Gate A.3, corrections 1–12, all three locales): 1 Ibn Tulun "a vast open courtyard";
 * 2 "the Roman fortress of Babylon" (no date); 3 the Hanging Church's date and "oldest functioning
 * churches" removed; 4 the Geniza "some 400,000 manuscript fragments"; 5 "by a Polish artist" (no
 * name); 6 the Cave Church amphitheatre "holds thousands"; 7 Tier 2: "for us, one of the most
 * extraordinary…", "a fine city garden", "for us, one of the most satisfying…"; 8 kept (Khan El
 * Khalili since the fourteenth century = 1382); 9 "this itinerary lets you feel that stratigraphy";
 * 10 kept (it sits in the helper note, which is hidden); 11 "about eight hours"; 12 Ibn Tulun "one
 * of the oldest mosques in Cairo…". The concierge note says nothing any correction touches, so it
 * is left alone. Hidden: the closing (the page has its own) and its second half, the helper notes,
 * the empty block, ES: the standfirst.
 *
 * Guide links: Bab Zuweila · al-Mu'ayyad · Ibn Tulun · the Hanging Church · Abu Serga · Ben Ezra ·
 * Khan El Khalili. No guide page exists for the Cave Church, Mokattam, Khayamiyya or Al-Azhar Park.
 * A Coptic Cairo guide exists (wp-page-63606), but the locked "Sites" lines don't name Coptic Cairo,
 * so it has no site to hang on.
 *
 * needsReview: rows are written approved, as across the batch (true would publish an empty page;
 * the open items say "keep needsReview: true", flagged in the PR); nothing is written until the
 * owner says publish.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-grand-old-cairo-2026-11-21.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-grand-old-cairo-2026-11-21.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-grand-old-cairo-2026-11-21.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-87828';
const OLD = { from: 69, es: 80, ja: 87 };
const PRICES = JSON.parse(readFileSync(new URL('./grand-old-cairo-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/grand-old-cairo-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (20 Nov 2026; prices from Autoura for 2 travellers).`;

const G = {
  zuweila: 'guideArticle.cairo.bab-zuweila',
  muayyad: 'guideArticle.cairo.mosque-of-al-mu-ayyad-shaykh',
  tulun: 'guideArticle.cairo.mosque-of-ibn-tulun',
  hanging: 'guideArticle.cairo.hanging-church-al-mu-allaqa',
  abuSerga: 'guideArticle.cairo.church-of-saint-sergius-and-bacchus-abu-serga',
  benEzra: 'guideArticle.cairo.ben-ezra-synagogue',
  khan: 'guideArticle.cairo.khan-el-khalili',
};
// Sites per stop, in file order (no guide page for the Cave Church, Mokattam, Khayamiyya or Al-Azhar Park).
const SITE_GUIDES = [[G.zuweila, G.muayyad], [G.tulun], [G.hanging, G.abuSerga, G.benEzra], [null, null], [G.khan, null], [null]];
const DURATION_LABEL = { en: 'Full day · ~8 hrs', es: 'Día completo · ~8 h', ja: '1日・約8時間' };
const DURATION_HOURS = 8;
// The dek / meta description: the locked opening's own words.
const SUMMARY = {
  en: 'A private day through three of Cairo’s oldest quarters, Islamic Cairo, Coptic Cairo and the Mokattam Hills: under a gate that has stood since 1092, inside a church built over a Roman fortress wall, and on to Al-Azhar Park as the light softens over the minarets.',
  es: 'Un día privado por tres de los barrios más antiguos de El Cairo, el Cairo islámico, el Cairo copto y las colinas de Mokattam: bajo una puerta que lleva en pie desde 1092, dentro de una iglesia construida sobre el muro de una fortaleza romana, y hasta el parque Al-Azhar cuando la luz se suaviza sobre los minaretes.',
  ja: 'イスラーム地区、コプト地区、そしてモカッタムの丘という、カイロでも最も古い三つの地区を巡るプライベートな1日。1092年から建つ門の下から、ローマ時代の要塞の壁の上に建てられた教会を経て、ミナレットの上で光がやわらぐ頃、アズハル公園で締めくくります。',
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
// Separator "·" with spaces around it (JA uses full-width spaces: "朝　·　イスラーム地区").
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
// Checked by hand (21 Nov), same meaning as EN: ES p0s1.x «los dos minaretes» = "the twin minarets".
// JA p0s1.x 「二本のミナレット」 = "the twin minarets"; why 「十二世紀分」 = "about twelve centuries" and
// closing 「十四世紀」 = "fourteen centuries", written in kanji, which the gate doesn't read. (The open
// items expected JA extras 1 and 10, 1名様 and 10月6日市; the gate passes both.)
const SAME_MEANING = { es: ['p0s1.x'], ja: ['p0s1.x', 'why', 'closing'] };
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
    included: fact(p.included, 'goin'), excluded: fact(p.excluded, 'goout'), options: fact(p.options, 'goopt'),
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

// The closing's first half ("Cairo has been burying and rebuilding itself…"), now the page's own closing.
const CLOSING_REF = { en: '000000000030', es: '000000000034', ja: '000000000036' };
// The closing's second half ("This is a day that does exactly that.") · the helper notes (now
// "Make it your own"; the EN one also says the concierge "can confirm access conditions", which the
// owner says the Cave Church doesn't have) · empty blocks · ES: the standfirst.
const SKIP = {
  en: ['000000000032', '000000000040', '000000000043'],
  es: ['000000000003', '000000000036', '000000000046', '000000000049'],
  ja: ['000000000038', '000000000046', '000000000049'],
};
// [block, find, replace] — corrections 1–7, 9, 11 and 12 (8 and 10 are kept as written).
// Finds inside bold runs («Mosque of Ibn Tulun», «Hanging Church», «Cave Church…») start after the run.
const FIX = {
  en: [
    ['000000000007', 'this itinerary is one of the few ways to feel that stratigraphy in a single outing.', 'this itinerary lets you feel that stratigraphy in a single outing.'], // 9
    ['000000000007', ' — now among the finest city gardens in the Arab world.', ' — now a fine city garden.'], // 7
    ['000000000009', 'Expect six to eight hours on the ground,', 'Expect about eight hours on the ground,'], // 11
    ['00000000000e', 'and together they form one of the most satisfying vertical compositions in the city.', 'and together they form, for us, one of the most satisfying vertical compositions in the city.'], // 7
    ['000000000012', ', the oldest mosque in Cairo to survive largely in its original form.', ', one of the oldest mosques in Cairo to survive largely in its original form.'], // 12
    ['000000000012', 'nine hectares of open courtyard surrounded by covered arcades', 'a vast open courtyard surrounded by covered arcades'], // 1
    ['000000000018', 'sits over the site of Babylon-in-Egypt, a Roman fortress established around the first century AD.', 'sits over the site of the Roman fortress of Babylon.'], // 2 (before the bold «Hanging Church»)
    ['000000000018', 'It has been a place of worship since at least the fourth century, making it one of the oldest functioning churches in the world. ', ''], // 3
    ['000000000020', 'a repository of over 300,000 medieval Jewish manuscript fragments discovered here in 1896', 'a repository of some 400,000 manuscript fragments discovered here in 1896'], // 4
    ['000000000026', 'Carved directly into the limestone cliff face and capable of holding 20,000 worshippers in its largest amphitheatre, this is one of the most extraordinary religious sites in Egypt', 'Carved directly into the limestone cliff face, with an amphitheatre that holds thousands, this is, for us, one of the most extraordinary religious sites in Egypt'], // 6, 7
    ['000000000026', 'executed by a Polish artist named Mario Doulas,', 'executed by a Polish artist,'], // 5
  ],
  es: [
    ['000000000009', 'este itinerario es una de las pocas maneras de sentir esa estratigrafía en una sola salida.', 'este itinerario te permite sentir esa estratigrafía en una sola salida.'],
    ['000000000009', '—hoy entre los jardines urbanos más logrados del mundo árabe—.', '—hoy un jardín urbano logrado—.'],
    ['00000000000b', 'Calcula de seis a ocho horas sobre el terreno,', 'Calcula unas ocho horas sobre el terreno,'],
    ['000000000010', 'y juntos forman una de las composiciones verticales más satisfactorias de la ciudad.', 'y juntos forman, para nosotros, una de las composiciones verticales más satisfactorias de la ciudad.'],
    ['000000000016', ', la mezquita más antigua de El Cairo que sobrevive en gran medida en su forma original.', ', una de las mezquitas más antiguas de El Cairo que sobreviven en gran medida en su forma original.'],
    ['000000000016', 'nueve hectáreas de patio abierto rodeadas por arcadas cubiertas', 'un vasto patio abierto rodeado por arcadas cubiertas'],
    ['00000000001c', 'asentado sobre el solar de Babilonia de Egipto, una fortaleza romana establecida hacia el siglo I d. C.', 'asentado sobre el solar de la fortaleza romana de Babilonia.'],
    ['00000000001c', 'Ha sido lugar de culto desde al menos el siglo IV, lo que la convierte en una de las iglesias en activo más antiguas del mundo. ', ''],
    ['000000000024', 'un depósito de más de 300 000 fragmentos manuscritos judíos medievales descubierto aquí en 1896', 'un depósito de unos 400 000 fragmentos manuscritos descubierto aquí en 1896'],
    ['00000000002a', 'Tallada directamente en el acantilado de caliza y capaz de acoger a 20 000 fieles en su anfiteatro mayor, es uno de los sitios religiosos más extraordinarios de Egipto', 'Tallada directamente en el acantilado de caliza, con un anfiteatro que acoge a miles de fieles, es, para nosotros, uno de los sitios religiosos más extraordinarios de Egipto'],
    ['00000000002a', 'ejecutados por un artista polaco llamado Mario Doulas,', 'ejecutados por un artista polaco,'],
  ],
  ja: [
    ['00000000000d', 'この行程は、その層位を一度の外出で感じとれる数少ない方法のひとつです。', 'この行程なら、その層位を一度の外出で感じとれます。'],
    ['00000000000d', '——いまやアラブ世界で最も優れた都市庭園のひとつである——', '——いまや見事な都市庭園である——'],
    ['00000000000f', '地上で6時間から8時間を見込んでください。', '地上で約8時間を見込んでください。'],
    ['000000000014', '両者は相まって、市内で最も心地よい垂直の構成のひとつをかたちづくります。', '両者は相まって、私たちにとっては市内で最も心地よい垂直の構成のひとつをかたちづくります。'],
    ['000000000018', 'カイロでおおむね当初の姿のまま残る最古のモスクです。', 'カイロでおおむね当初の姿のまま残る、最も古いモスクのひとつです。'],
    ['000000000018', '9ヘクタールの開けた中庭が', '広大な開けた中庭が'],
    ['00000000001e', 'これは、紀元1世紀ごろに築かれたローマの要塞「バビロン・イン・エジプト」の跡地の上にある、より古い南の界隈です。', 'これは、ローマの要塞バビロンの跡地の上にある、より古い南の界隈です。'],
    ['00000000001e', '少なくとも4世紀から礼拝の場であり続け、世界で最も古い現役の教会のひとつです。', ''],
    ['000000000026', '1896年にここで発見された30万点を超える中世ユダヤ教の写本断片の集積', '1896年にここで発見された約40万点の写本断片の集積'],
    ['00000000002c', '最大の円形劇場には2万人の礼拝者を収容できるこれは、エジプトで最も並外れた宗教施設のひとつであり', '数千人を収める円形劇場をもつこれは、私たちにとってエジプトで最も並外れた宗教施設のひとつであり'],
    ['00000000002c', 'マリオ・ドゥラスというポーランド人芸術家による', 'ポーランド人芸術家による'],
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
  en: /nine hectares|first century AD|oldest functioning churches|300,000|Mario Doulas|20,000|finest city gardens|one of the few ways|six to eight hours|the oldest mosque in Cairo|(?<!for us, )one of the most extraordinary|(?<!for us, )one of the most satisfying/i,
  es: /nueve hectáreas|siglo I d\. C\.|iglesias en activo más antiguas|300 000|Mario Doulas|20 000|jardines urbanos más logrados|pocas maneras|seis a ocho horas|la mezquita más antigua|(?<!para nosotros, )uno de los sitios religiosos más extraordinarios|(?<!para nosotros, )una de las composiciones verticales/i,
  ja: /9ヘクタール|紀元1世紀|最も古い現役の教会|30万点|マリオ・ドゥラス|2万人|最も優れた都市庭園|数少ない方法|6時間から8時間|残る最古のモスク|(?<!私たちにとって)エジプトで最も並外れた|(?<!私たちにとっては)市内で最も心地よい/,
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
if (!ready) console.log('prices: NOT READY — fill grand-old-cairo-prices.json from Autoura (EN, ES and JA guide). Nothing can be applied yet.');

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
  if (!ready) throw new Error('prices not ready — fill grand-old-cairo-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-grand-old-cairo-day-tour');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
