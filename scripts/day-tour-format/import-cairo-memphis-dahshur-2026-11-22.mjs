/**
 * Memphis, Saqqara & Dahshur: Private Day Tour from Cairo, in the day-tour format, EN + ES + JA together (owner,
 * 22 Nov: locked copy + open items).
 *
 *   tour  wp-page-87756   /private-tour-memphis-saqqara-and-dahshur   (URLs unchanged: no redirect)
 *
 * No tiers, no minimum age. Included: entrance to Memphis, Saqqara (with the Imhotep Museum and one nobles' tomb)
 * and Dahshur, lunch, water, the driver's tip. Inside the Step Pyramid, inside the Red Pyramid and further Saqqara
 * tombs are EXTRA TICKETS bought at the site (optional extras, no prices: the Grand West Bank handling). Cairo, so the
 * rule rows show (children 50 %, the Cairo/Giza pickup zones, guide = the page's language).
 * Price: cairo-memphis-dahshur-prices.json (Autoura T2E-DT-CAI-03): EUR 83 / ES 94 / JA 111 (live 89 / 100 / 107).
 *
 * Essay (Gate A.3, corrections 1-8): "An Egyptologist guide in your language"; "about eight hours"; the "oldest /
 * first monumental stone building" claims -> "one of the earliest large buildings in cut stone"; "remarkable early
 * Egyptian painting"; the Red Pyramid keeps "the first true smooth-sided pyramid" and drops "third-largest"; the Giza
 * line; "a rare thing" kept. Hidden: the closing's second half, the concierge helper note, empty blocks, ES-only lede
 * and extras.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-cairo-memphis-dahshur-2026-11-22.mjs              # dry run
 *   node --env-file=<.env> scripts/day-tour-format/import-cairo-memphis-dahshur-2026-11-22.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-87756';
const OLD = { from: 89, es: 100, ja: 107 };
const PRICES = JSON.parse(readFileSync(new URL('./cairo-memphis-dahshur-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/memphis-saqqara-dahshur-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (22 Nov 2026; prices from Autoura for 2 travellers).`;

const G = {
  memphis: 'guideArticle.giza.memphis-mit-rahina',
  saqqara: 'guideArticle.giza.the-saqqara-necropolis',
  imhotep: 'guideArticle.giza.imhotep-museum-at-saqqara',
  dahshur: 'guideArticle.giza.dahshur-necropolis',
  bent: 'guideArticle.giza.the-bent-pyramid-of-sneferu',
  red: 'guideArticle.giza.the-red-pyramid-of-sneferu',
};
// Sites per stop, in file order: Memphis open-air museum · Saqqara + Step Pyramid · Imhotep Museum · Saqqara nobles'
// tombs · Dahshur + Bent Pyramid + Red Pyramid.
const SITE_GUIDES = [[G.memphis], [G.saqqara, G.saqqara], [G.imhotep], [G.saqqara], [G.dahshur, G.bent, G.red]];
const DURATION_LABEL = { en: 'Full day · ~8 hrs', es: 'Día completo · ~8 h', ja: '1日・約8時間' };
const DURATION_HOURS = 8;
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo' },
  ja: { pickup: 'お迎え', lunch: '昼食' },
};
const OPTIONAL_COST = ['extraTicket', 'extraTicket', 'extraTicket'];
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
const SUMMARY = Object.fromEntries(LANGS.map((l) => [l, (P[l].opening.match(l === 'ja' ? /^(?:[^。]+。){2}/ : /^(?:.+?[.!?](?:\s+|$)){2}/) ?? [P[l].opening])[0].trim()]));
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
const SAME_MEANING = { es: ['p0s2.x'], ja: ['opening', 'p0s2.x'] };
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
    included: fact(p.included, 'cmin'), excluded: fact(p.excluded, 'cmout'), options: fact(p.options, 'cmopt'),
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

// The essay's two closing sentences (the page has its own closing line): block 1 = closingRef, block 2 hidden.
const CLOSING_REF = { en: '000000000028', es: '00000000002a', ja: '00000000002e' };
// Hidden: the closing's second sentence · the concierge helper note · empty blocks · ES-only lede/extras.
const SKIP = {
  en: ['00000000002a', '000000000038', '00000000003b'],
  es: ['00000000002c', '00000000003c', '00000000003f'],
  ja: ['000000000030', '00000000003e', '000000000041'],
};
// [block, find, replace] — corrections 1-6 (7 kept, 8 is the page's own extras); each find sits inside one run.
const FIX = {
  en: [
    ['000000000003', "the world's first monumental stone building", 'one of the earliest large buildings in cut stone'], // 3
    ['000000000007', 'The tour runs six to eight hours', 'The tour runs about eight hours'], // 2
    ['000000000007', 'An English-speaking Egyptologist guide accompanies you', 'An Egyptologist guide in your language accompanies you'], // 1
    ['000000000014', 'It is the oldest large-cut-stone structure in the world.', 'It is one of the earliest large buildings in cut stone.'], // 3
    ['000000000016', 'are some of the finest examples of early Egyptian art anywhere', 'are remarkable early Egyptian painting'], // 5
    ['00000000001e', "It is the first true smooth-sided pyramid ever completed, and at 104 metres it remains Egypt's third-largest.", 'It is the first true smooth-sided pyramid ever completed, 104 metres high.'], // 4
    ['000000000024', 'Visitors who do this day before visiting Giza often say afterwards that the pyramids finally made sense.', 'Done before Giza, this day makes the pyramids there make sense.'], // 6
  ],
  es: [
    ['000000000005', 'del primer edificio monumental de piedra del mundo', 'de uno de los primeros grandes edificios de piedra labrada'],
    ['000000000009', 'El tour dura de seis a ocho horas', 'El tour dura unas ocho horas'],
    ['000000000009', 'Un guía egiptólogo angloparlante (o hispanohablante a petición) os acompaña', 'Un guía egiptólogo en vuestro idioma os acompaña'],
    ['000000000016', ' Es la estructura de piedra tallada a gran escala más antigua del mundo.', ' Es uno de los primeros grandes edificios de piedra tallada.'],
    ['000000000018', 'se cuentan entre los mejores ejemplos del arte egipcio temprano que existen', 'son una notable pintura egipcia temprana'],
    ['000000000020', 'y, con sus 104 metros, sigue siendo la tercera mayor de Egipto.', 'y tiene 104 metros de altura.'],
    ['000000000026', ' Quien hace este día antes de visitar la meseta suele decir después que las pirámides cobraron por fin sentido.', ' Hecho antes de Guiza, este día hace que las pirámides de allí cobren sentido.'],
  ],
  ja: [
    ['000000000009', '世界初の記念碑的な石造建築から', '最も早い時期の大きな石造建築のひとつから'],
    ['00000000000d', 'ツアーは6〜8時間で', 'ツアーはおよそ8時間で'],
    ['00000000000d', '終日、英語対応のエジプト学ガイドが同行します', '終日、お客様の言語を話すエジプト学ガイドが同行します'],
    ['00000000001a', '世界最古の大規模な切石による構造物です。', '切石による、最も早い時期の大きな建築のひとつです。'],
    ['00000000001c', '世界のどこにある初期エジプト美術のなかでも最も優れた例のいくつかです', '注目すべき最初期のエジプト絵画です'],
    ['000000000024', 'それは、これまでに完成した初めての真のなめらかな側面のピラミッドであり、104メートルで、エジプトで三番目に大きいものであり続けています。', 'それは、これまでに完成した初めての真のなめらかな側面のピラミッドで、高さは104メートルです。'],
    ['00000000002a', 'ギザを訪れる前にこの一日を過ごした来訪者は、しばしばあとで、ようやくピラミッドが腑に落ちたと口にします。', 'ギザの前に行えば、この一日で、ギザのピラミッドが腑に落ちるようになります。'],
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
  en: /English-speaking|six to eight|oldest large-cut|first monumental|third-largest|finest examples|before visiting Giza|three tiers|minimum age|Base \+/i,
  es: /angloparlante|seis a ocho|primer edificio monumental|más antigua del mundo|tercera mayor|mejores ejemplos|antes de visitar la meseta|tres niveles|edad mínima|Base \+/i,
  ja: /英語対応|6〜8時間|世界初の記念碑|世界最古|三番目に大きい|最も優れた例|ギザを訪れる前に|段階|18歳|最低年齢/,
};
for (const row of body) {
  const l = row._key;
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[l].test(textOf(b))) throw new Error(`${l} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[l])[0]}"`);
}
for (const l of LANGS) {
  if (RETIRED[l].test(SUMMARY[l])) throw new Error(`${l}: summary still shows "${SUMMARY[l].match(RETIRED[l])[0]}"`);
  const note = doc.conciergeNote?.find((n) => n._key === l)?.value ?? '';
  if (RETIRED[l].test(note)) console.log(`WARNING ${l}: concierge note shows "${note.match(RETIRED[l])[0]}"`);
}
// shapeOfDay.character carried the tiers and "minimum age 18" (rules 8 and 9); the day-tour layout does not show it.
const UNSET = doc.shapeOfDay?.character ? ['shapeOfDay.character'] : [];

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
if (!ready) console.log('prices: NOT READY — fill cairo-memphis-dahshur-prices.json from Autoura (EN, ES and JA guide). Nothing can be applied yet.');

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
  if (!ready) throw new Error('prices not ready — fill cairo-memphis-dahshur-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-cairo-memphis-dahshur');
  await client.patch(DOC_ID).set(set).unset(UNSET).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
