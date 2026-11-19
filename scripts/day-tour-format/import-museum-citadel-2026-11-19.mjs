/**
 * Egyptian Museum, the Citadel, Al-Muizz Street & Khan El Khalili in the day-tour format, EN + ES
 * + JA together. Owner, 19 Nov: the locked copy and its open-items answers ("Instructions for
 * Claude Code" §1–8).
 *
 *   tour  tour.egyptian-museum-citadel-and-khan-el-khalili-bazaar   /egyptian-museum-citadel-and-khan-el-khalili-bazaar
 *   (the URL is KEPT in every locale, owner 19 Nov: no redirect, step 6 skipped)
 *
 * The product (owner, 19 Nov): pickup → Egyptian Museum (Tahrir) → the Citadel and the Mosque of
 * Muhammad Ali → lunch → Al-Muizz Street → Khan El Khalili → back. Entrance to the museum, the
 * Citadel and the Al-Muizz monuments (combined ticket), lunch, water and the driver's tip
 * included; no tiers and no age line (standing rules 8–9); children under 12 pay 50 %. Title
 * names all four stops. Guide in the page's language, so ES/JA keep their own price
 * (museum-citadel-prices.json; --apply refuses while any is null).
 *
 * Panel: the city is Cairo, so the page shows the site's Cairo/Giza rule rows (children 50 %, the
 * pickup zones, guide = page language; SingleTourView) as the Cairo car-and-guide and Giza GEM
 * imports do; the intro stores the Pickup row and Lunch. The locked panel has no Back row. The EN
 * copy's "(ES: español · JA: 日本語)" note is an editor's aside, not written.
 *
 * Meta description (open items §3): the page's description is `summary` (no seo object on this
 * document); it is rewritten to name Al-Muizz Street. Its wording is NOT in the locked copy — it
 * is built from the locked opening's own phrases; the owner checks it in the PR.
 *
 * Essay (Gate A.3, the approved corrections 1–6): (1) the Citadel site "Tradition says … healthier
 * air; it was also easy to defend"; (2)(3)(4) kept; (5) the Al-Fishawi wording, kept and brought
 * to the site-wide form (EN comma; ES "sin interrupción … , según su propio relato"; JA
 * 「店自身によれば1773年から営業を続けて…」, see fishawi-1773-sweep-2026-11-19.mjs); (6) the
 * essay title names Al-Muizz Street. Left out of "More about this day": the closing's second
 * half, the ES lead line (the old dek), the old concierge/helper note (now "Make it your own";
 * JA's is a stray half-day note about the GEM and the Northern Cemetery).
 *
 * needsReview: the open items ask for `needsReview: true`, but the site shows only rows with
 * needsReview == false (src/sanity/lib/queries.ts), so `true` would publish an empty page. As
 * with every page in this batch, nothing is written until the owner says publish; that OK is the
 * approval, and the rows are written approved.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-museum-citadel-2026-11-19.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-museum-citadel-2026-11-19.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-museum-citadel-2026-11-19.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'tour.egyptian-museum-citadel-and-khan-el-khalili-bazaar';
const OLD = { from: 95, es: 106, ja: 113 };
const PRICES = JSON.parse(readFileSync(new URL('./museum-citadel-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/egyptian-museum-citadel-khan-el-khalili-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (19 Nov 2026; prices from Autoura for 2 travellers).`;

// Guide links (open items §3). No guide page exists for the Military Museum or Al-Fishawi; the
// GEM and the NMEC are named in the text only (no site line) and have no guide page either.
const G = {
  tahrir: 'guideArticle.cairo.egyptian-museum-of-antiquities',
  citadel: 'guideArticle.cairo.the-citadel-of-saladin',
  muhammadAli: 'guideArticle.cairo.mosque-of-muhammad-ali',
  muizz: 'guideArticle.cairo.sharia-al-muizz-li-din-allah',
  qalawun: 'guideArticle.cairo.madrassa-mausoleum-of-qalawun',
  ghuri: 'guideArticle.cairo.al-ghuriyya-complex',
  khan: 'guideArticle.cairo.khan-el-khalili',
};
// Sites per stop that has them, in file order: "Egyptian Museum"; "Citadel of Saladin · Mosque of
// Muhammad Ali · Military Museum"; "Al-Muizz Street · Qalawun Complex · Al-Ghuri Complex";
// "Khan El Khalili · Al-Fishawi".
const SITE_GUIDES = [[G.tahrir], [G.citadel, G.muhammadAli, null], [G.muizz, G.qalawun, G.ghuri], [G.khan, null]];
const DURATION_LABEL = { en: 'Full day · ~8 hrs', es: 'Día completo · ~8 h', ja: '終日・約8時間' };
const DURATION_HOURS = 8;
// Meta description (`summary`), naming all four stops (see the header).
const SUMMARY = {
  en: 'Pharaonic, Islamic and bazaar Cairo in one private day: the Egyptian Museum on Tahrir Square, the Citadel of Saladin, Al-Muizz Street and Khan El Khalili, with an Egyptologist guide and lunch.',
  es: 'El Cairo faraónico, el islámico y el del bazar en un solo día privado: el Museo Egipcio de la plaza Tahrir, la Ciudadela de Saladino, la calle Al-Muizz y el Jan el-Jalili, con guía egiptólogo y almuerzo.',
  ja: 'ファラオの時代、イスラームの街、バザールのカイロをプライベートな1日で。タハリール広場のエジプト考古学博物館、サラディンのシタデル、ムイッズ通り、ハーン・ハリーリを、エジプト学ガイドと昼食付きで巡ります。',
};
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo' },
  ja: { pickup: 'お迎え', lunch: '昼食' },
};
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
for (const l of LANGS) for (const k of Object.keys(PANEL.en)) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel (${Object.keys(P[l].panelRows).join(', ')})`);
// The owner's itinerary order (open items §3).
const ORDER = ['Pickup from your hotel', 'The Egyptian Museum, Tahrir Square', 'The Citadel of Saladin and the Mosque of Muhammad Ali', 'Lunch at a local restaurant (included)', 'Al-Muizz Street', 'Khan El Khalili', 'Back to your hotel'];
const enStops = P.en.periods.flatMap((x) => x.stops.map((s) => s.title));
if (JSON.stringify(enStops) !== JSON.stringify(ORDER)) throw new Error(`EN stop order is not the owner's:\n ${enStops.join(' → ')}`);

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
// Checked by hand (19 Nov), same meaning as EN: JA writes these numbers in kanji, which the gate
// does not read — p0s1.x 「所要約二時間」 = "About two hours"; p0s2.x 「およそ七世紀」 = "some seven
// centuries"; wk0 「三時間」 = "three hours". The open items' JA extras, 1名様 (in0) and 10月6日市
// (ex1, the Japanese name of 6th of October City), pass the gate as written.
const SAME_MEANING = { es: [], ja: ['p0s1.x', 'p0s2.x', 'wk0'] };
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
  if (siteStop !== SITE_GUIDES.length) throw new Error(`${l}: ${siteStop} stops with sites, SITE_GUIDES has ${SITE_GUIDES.length}`);
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
    included: fact(p.included, 'mcin'), excluded: fact(p.excluded, 'mcout'), options: fact(p.options, 'mcopt'),
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

// The closing pair's first half ("Cairo does not reveal itself gradually…"), now the page's own closing.
const CLOSING_REF = { en: '000000000029', es: '00000000002b', ja: '00000000002f' };
// The closing's second half · the old concierge/helper note (now "Make it your own"; JA's is a
// stray half-day note) · ES: the lead line (the old dek).
const SKIP = {
  en: ['00000000002b', '00000000003a'],
  es: ['00000000002d', '00000000003e', '000000000003'],
  ja: ['000000000031', '000000000040'],
};
// [block, find, replace] — corrections 6 (essay title), 1 (the Citadel's site) and 5 (Al-Fishawi,
// the site-wide wording). Finds sit in the plain run after the bold site name.
const FIX = {
  en: [
    ['000000000001', 'One Day, Three Cairos: Antiquities, Islamic Fortresses & the Bazaar Quarter', 'One Day, Three Cairos: the Egyptian Museum, the Citadel, Al-Muizz Street & Khan El Khalili'],
    ['000000000013', 'He chose the site for a practical reason: air quality. Medieval Cairo\'s plague-susceptible lowlands were demonstrably unhealthier than the elevated ridge, and a hilltop stronghold was also defensible.', 'Tradition says he chose the site for its healthier air; it was also easy to defend.'],
    ['000000000027', 'operating continuously since 1773 according to its own account', 'operating continuously since 1773, according to its own account'],
  ],
  es: [
    ['000000000001', 'Un día, tres Cairos: antigüedades, fortalezas islámicas y el barrio del bazar', 'Un día, tres Cairos: el Museo Egipcio, la Ciudadela, la calle Al-Muizz y el Jan el-Jalili'],
    ['000000000015', 'Eligió el emplazamiento por una razón práctica: la calidad del aire. Las tierras bajas del Cairo medieval, sensibles a la peste, eran demostrablemente más insalubres que la cresta elevada, y una fortaleza en alto era además defensible.', 'Según la tradición, eligió el emplazamiento por su aire más sano; además, era fácil de defender.'],
    ['000000000029', 'en funcionamiento continuo desde 1773 según su propio relato', 'en funcionamiento sin interrupción desde 1773, según su propio relato'],
  ],
  ja: [
    ['000000000007', '一日、三つのカイロ：考古、イスラムの要塞＆バザールの一角', '一日、三つのカイロ：エジプト考古学博物館、シタデル、ムイッズ通り、ハーン・ハリーリ'],
    ['000000000019', '彼がこの場所を選んだのは実務的な理由からでした——空気の質です。中世カイロの疫病にかかりやすい低地は、高い尾根よりも明らかに不健康で、丘の上の砦はまた防衛しやすくもありました。', '伝承によれば、彼がこの場所を選んだのは空気がより健やかだったからで、守りやすい場所でもありました。'],
    ['00000000002d', 'その言い分によれば1773年から休まず営業を続けており', '店自身によれば1773年から営業を続けており'],
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
      if (i < 0 && children.some((c) => [repl, repl.replace(/'/g, '’')].some((x) => c.text.includes(x)))) continue; // re-run / the Fishawi sweep ran first
      if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
      children[i].text = children[i].text.replace(alts.find((x) => children[i].text.includes(x)), (m) => (m.includes('’') ? repl.replace(/'/g, '’') : repl));
    }
    return { ...b, children };
  });
  return { ...row, value };
});
// Nothing "More about this day" shows may keep what the page corrects.
const RETIRED = {
  en: /practical reason: air quality|plague-susceptible|Islamic Fortresses|1773 according/i,
  es: /razón práctica: la calidad del aire|sensibles a la peste|fortalezas islámicas|continuo desde 1773/i,
  ja: /実務的な理由|疫病にかかりやすい|イスラムの要塞|その言い分/,
};
const MUST = { en: ['Al-Muizz Street', 'Tradition says'], es: ['la calle Al-Muizz', 'Según la tradición'], ja: ['ムイッズ通り', '伝承によれば'] };
for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const hidden = new Set([CLOSING_REF[row._key], ...SKIP[row._key]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
  const head = textOf(row.value.find((b) => b._key === FIX[row._key][0][0]));
  if (!head.includes(MUST[row._key][0])) throw new Error(`${row._key}: the essay title does not name Al-Muizz Street`);
  if (!row.value.some((b) => textOf(b).includes(MUST[row._key][1]))) throw new Error(`${row._key}: correction 1 not in the essay`);
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
for (const l of LANGS) if (!SUMMARY[l].includes({ en: 'Al-Muizz', es: 'Al-Muizz', ja: 'ムイッズ' }[l])) throw new Error(`${l}: summary must name Al-Muizz Street`);

/* ── Gates ────────────────────────────────────────────────────────────── */
for (const l of LANGS) {
  const rows = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });
if (!ready) console.log(`prices: NOT READY — fill museum-citadel-prices.json from Autoura (EN, ES and JA guide). Live stays €${OLD.from} / €${OLD.es} / €${OLD.ja}. Nothing can be applied yet.`);

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  slug ${l} (kept): ${doc.slug.find((s) => s._key === l)?.value.current}`);
  console.log(`  summary ${l}: ${set.summary.find((t) => t._key === l).value}`);
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine} · lunch: ${B[l].intro.lunch.text}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.period, x.periodLabel, x.stops.map((s) => [(s.time ? s.time + ' · ' : '') + s.title, (s.sites ?? []).map((z) => z.name + (z.guideRef ? ' ⇢' : ''))])]))}`);
  const essay = set.body.find((r) => r._key === l).value;
  const before = doc.body.find((r) => r._key === l).value;
  for (const b of essay) {
    const old = before.find((x) => x._key === b._key);
    if (textOf(old) !== textOf(b)) console.log(`  essay ${l} ${b._key}: ${textOf(b).slice(0, 200)}…`);
  }
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
    const slug = doc.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'citySlugsEn'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  if (!ready) throw new Error('prices not ready — fill museum-citadel-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-museum-citadel-day-tour');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
