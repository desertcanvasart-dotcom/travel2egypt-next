/**
 * Private Car & Guide in Aswan in the day-tour format, EN + ES + JA together. Owner, 19 Nov:
 * "take the price of two persons from Autoura and publish … if you find all relevant data."
 *
 *   tour  wp-page-87438   /aswan-private-car-and-guide
 *
 * The product (owner, 19 Nov, the locked copy): a private car, driver and Egyptologist guide
 * for 8 hours within Aswan, used as the guest likes; five places offered as ideas, not a route,
 * with a suggested shape. Tickets, the Philae boat and lunch not included (the copy's defaults:
 * the owner's open questions were left as written).
 *
 * Price (Autoura T2E-DT-ASW-02, read 19 Nov): the engine's figure for 2 travellers sharing,
 * per person, at the house margin (30 %), lowest season, the higher of the EU / other bases,
 * the cheapest complete tier — complete in every language, rounded UP to the whole euro:
 *   English guide  €46.15 → €47 · Spanish guide €57.17 → €58 · Japanese guide €73.69 → €74
 * (services: car "Hotel → Town Tour → Hotel", the guide in the page's language, water.)
 *
 * The panel uses the rule rows (children 50 %, pickup from the copy, guide = page language);
 * the EN copy's "(ES: español · JA: 日本語)" note is an editor's aside and is not written.
 * "Your day" is two label sections: the five ideas, then "A suggested shape".
 *
 * Essay (Gate A.3, the open items): Kitchener's Island removed (not on the list); "rewrote the
 * hydrology of an entire continent" → "the life of the Nile"; Philae reached by heading south,
 * not "crossing to the western bank", and its boat no longer "included"; Nectanebo I "in the
 * 4th century BC"; the Nubians resettled = one figure across the site (about 50,000, as on the
 * Nubian village page); no age line; "Egyptologist in your language"; "Many of Egypt's
 * obelisks and sarcophagi were quarried here"; the old closing and helper note left out.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-aswan-car-and-guide-2026-11-19.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-aswan-car-and-guide-2026-11-19.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-aswan-car-and-guide-2026-11-19.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-87438';
const OLD = { from: 87, es: 98, ja: 105 };
const NEW = { from: 47, es: 58, ja: 74 };
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/aswan-private-car-and-guide-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (19 Nov 2026; price from Autoura T2E-DT-ASW-02 for 2 travellers).`;

const G = {
  obelisk: 'guideArticle.aswan.the-unfinished-obelisk',
  philae: 'guideArticle.aswan.the-philae-temple',
  nubian: 'guideArticle.aswan.the-nubian-museum',
};
// One site per idea, in file order (High Dam and the market have no guide page).
const SITE_GUIDES = [G.obelisk, G.philae, null, G.nubian, null];
const DURATION_LABEL = { en: '8 hrs', es: '8 h', ja: '8時間' };
const PICKUP = { en: 'Pickup', es: 'Recogida', ja: 'お迎え' };
// Headings the page shows alone, capitalised (the copy writes them after "Your day: ").
const IDEAS_LABEL = { en: 'Ideas for your eight hours', es: 'Ideas para tus ocho horas', ja: '8時間の過ごし方のアイデア' };
const ALLOW = { 'Ideas for your eight hours': 'heading after "Your day: "', 'Ideas para tus ocho horas': 'heading after "Tu día: "', '8時間の終わりに、ホテルまたはクルーズ船へお送りします。': 'the line with its bold removed' };

/* ── Parse ────────────────────────────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t]+$/gm, '').trim();
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
function parseLocale(l) {
  const md = readFileSync(new URL(LOCKED[l], ROOT), 'utf8');
  const title = clean(md.match(/^# (.+)$/m)[1]);
  const secs = sections(md);
  if (secs.length !== 7) throw new Error(`${l}: expected 7 sections, found ${secs.length}`);
  const [panel, opening, why, day, incl, forYou, mine] = secs;
  const panelRows = Object.fromEntries(panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim()]));
  const [ideasPart, shapePart] = day.text.split(/\n### /);
  const ip = paras(ideasPart);
  const lead = ip[0];
  const ideas = ip.slice(1).filter((p) => !p.startsWith('>')).map((p) => {
    const lines = p.split('\n');
    const hm = lines[0].match(/^\*\*(.+)\*\*$/);
    if (!hm) throw new Error(`${l}: unexpected idea paragraph: ${p.slice(0, 60)}`);
    const site = lines.find((x) => /^\*?(Sites|Lugares)[:：]|^見学地[:：]/.test(x));
    const text = clean(lines.slice(1).filter((x) => x !== site).join(' '));
    return { title: clean(hm[1]), text, site: clean(site.replace(/^\*?(Sites|Lugares)[:：]\*?[:：]?\s*|^見学地[:：]\s*/, '')) };
  });
  const [shapeHead, ...shapeRest] = shapePart.split('\n');
  const sp = paras(shapeRest.join('\n')).filter((p) => !p.startsWith('>'));
  const shape = bullets(sp[0]).map((b) => { const m = b.match(/^\*\*(.+?)[:：]\*\*\s*(.+)$/); return { title: clean(m[1]), text: clean(m[2]) }; });
  // "**Back to your hotel or ship**, at the end…" / JA "8時間の終わりに、**…**"
  const backLine = sp[1];
  const bm = backLine.match(/^\*\*(.+?)\*\*[,，]?\s*(.+)$/);
  const back = l === 'ja' ? { title: backLine.replace(/\*\*/g, '') } : { title: clean(bm[1]), text: clean(bm[2]) };
  const sub = (t) => t.split(/\n(?=\*\*)/).map((blk) => ({ h: (blk.match(/^\*\*(.+?)\*\*/) ?? [])[1], items: bullets(blk) })).filter((x) => x.h);
  const [inc, exc] = sub(incl.text);
  const [fit, worth] = sub(forYou.text);
  const tail = paras(mine.text);
  return {
    title, panelRows, lead, ideas, shapeLabel: clean(shapeHead), shape, back,
    opening: clean(paras(opening.text)[0]), whyThisOrder: clean(paras(why.text)[0]),
    included: inc.items, excluded: exc.items, fitFor: fit.items, worthKnowing: worth.items,
    options: bullets(mine.text), closingLine: clean(tail[tail.length - 1].replace(/^\*(.*)\*$/, '$1')),
  };
}
const P = Object.fromEntries(LANGS.map((l) => [l, parseLocale(l)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ ideas: p.ideas.length, shape: p.shape.length, inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
for (const l of LANGS) if (!P[l].panelRows[PICKUP[l]]) throw new Error(`${l}: no pickup row`);
if (P.en.ideas.length !== SITE_GUIDES.length) throw new Error('ideas ≠ site guides');

/* ── Numeric gate ─────────────────────────────────────────────────────── */
const flat = (p) => ({
  opening: p.opening, why: p.whyThisOrder, closing: p.closingLine, lead: p.lead,
  ...Object.fromEntries(p.ideas.flatMap((s, i) => [[`i${i}.t`, s.title], [`i${i}.x`, s.text]])),
  ...Object.fromEntries(p.shape.flatMap((s, i) => [[`s${i}.x`, s.text]])),
  ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
  ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
});
// Same meaning, checked by hand 19 Nov: ES writes the 25th Dynasty in Roman numerals
// («dinastía XXV»), as Spanish does; the gate reads only the Arabic 25.
const SAME_MEANING = { es: ['i3.x'], ja: [] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
  for (const k of SAME_MEANING[l]) { delete en[k]; delete lc[k]; console.log(`numeric gate (${l}): ${k} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

/* ── Build ────────────────────────────────────────────────────────────── */
function build(l) {
  const p = P[l];
  const timeline = [
    {
      _key: `dt-${l}-1`, _type: 'dayTourPeriod', lang: l, period: 'label', periodLabel: IDEAS_LABEL[l],
      stops: [
        { _key: 's1-0', _type: 'dayTourStop', title: p.lead, skipGlance: true },
        ...p.ideas.map((s, i) => ({
          _key: `s1-${i + 1}`, _type: 'dayTourStop', title: s.title, text: s.text,
          sites: [{ _key: `x1${i + 1}0`, _type: 'dayTourSite', name: s.site, ...(SITE_GUIDES[i] ? { guideRef: { _type: 'reference', _ref: SITE_GUIDES[i], _weak: true } } : {}) }],
        })),
      ],
      source: SRC(l), needsReview: false,
    },
    {
      _key: `dt-${l}-2`, _type: 'dayTourPeriod', lang: l, period: 'label', periodLabel: p.shapeLabel,
      stops: [
        ...p.shape.map((s, i) => ({ _key: `s2-${i + 1}`, _type: 'dayTourStop', title: s.title, text: s.text, skipGlance: true })),
        { _key: `s2-${p.shape.length + 1}`, _type: 'dayTourStop', title: p.back.title, ...(p.back.text ? { text: p.back.text } : {}), skipGlance: true },
      ],
      source: SRC(l), needsReview: false,
    },
  ];
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
if (![[OLD.from, OLD.es, OLD.ja].join(), [NEW.from, NEW.es, NEW.ja].join()].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

const CLOSING_REF = { en: '000000000029', es: '00000000002b', ja: '000000000023' };
// Kitchener's Island · the closing's second half · the helper note (gardens) · empty.
const SKIP = {
  en: ['000000000021', '00000000002b', '000000000039', '00000000003c'],
  es: ['000000000023', '00000000002d', '00000000003d', '000000000040'],
  ja: ['00000000001b', '000000000025', '000000000033', '000000000036'],
};
// [block, find, replace] — the open items' essay corrections (owner's locked copy, 19 Nov).
const FIX = {
  en: [
    ['000000000003', 'a Soviet-era dam that rewrote the hydrology of an entire continent', 'a Soviet-era dam that rewrote the life of the Nile'],
    ['000000000005', 'If you want to spend an extra hour at the Nubian Museum and skip the Botanical Gardens, that is', 'If you want to spend an extra hour at the Nubian Museum, that is'],
    // Bold runs: "licensed, English-speaking Egyptologist guide"; "There is " + **no minimum age** + " — families…".
    ['000000000015', 'licensed, English-speaking Egyptologist guide', 'licensed Egyptologist guide in your language'],
    ['000000000015', ' vehicle. There is ', ' vehicle. '],
    ['000000000015', 'no minimum age', ''],
    ['000000000015', ' — families are welcome — though', 'Families are welcome, though'],
    ['00000000001b', 'the route crosses to the western bank for Philae. This requires a short motor boat crossing, which is included in the tour. ', 'the route heads south to the landing for Philae. '],
    ['00000000001b', 'built and expanded between roughly 380 and 362 BC under Nectanebo I, then', 'begun under Nectanebo I in the 4th century BC, then'],
    ['00000000001d', 'approximately 100,000 Nubian people', 'approximately 50,000 Nubian people'],
    ['000000000025', 'Virtually every obelisk and sarcophagus in Egypt was quarried here', 'Many of Egypt’s obelisks and sarcophagi were quarried here'],
  ],
  es: [
    ['000000000005', 'reescribió la hidrología de un continente entero', 'reescribió la vida del Nilo'],
    ['000000000007', 'al Museo Nubio y prescindir del Jardín Botánico, es', 'al Museo Nubio, es'],
    ['000000000017', 'guía egiptólogo licenciado de habla hispana', 'guía egiptólogo licenciado en su idioma'],
    ['000000000017', 'No hay edad mínima', ''],
    ['000000000017', ' —las familias son bienvenidas—, aunque', 'Las familias son bienvenidas, aunque'],
    ['00000000001d', 'la ruta cruza a la orilla occidental hacia Philae. Esto requiere un breve traslado en lancha motora, incluido en el tour. ', 'la ruta se dirige al sur, al embarcadero de Philae. '],
    ['00000000001d', 'levantado y ampliado entre, aproximadamente, el 380 y el 362 a. C. bajo Nectanebo I, y', 'iniciado bajo Nectanebo I en el siglo IV a. C., y'],
    ['00000000001f', 'unas 100.000 personas nubias', 'unas 50.000 personas nubias'],
    ['000000000027', 'Casi cada obelisco y cada sarcófago de Egipto se extrajo aquí y se transportó', 'Muchos de los obeliscos y sarcófagos de Egipto se extrajeron aquí y se transportaron'],
  ],
  ja: [
    ['000000000009', 'ひとつの大陸の水文をまるごと書き換えたソビエト時代のダム', 'ナイルの営みを書き換えたソビエト時代のダム'],
    ['00000000000b', 'ヌビア博物館でもう1時間過ごして植物園を飛ばしたいなら', 'ヌビア博物館でもう1時間過ごしたいなら'],
    ['000000000015', '石切場から、ルートは西岸へ渡ってフィラエへ。これには短いモーターボートの横断が要り、ツアーに含まれます。', '石切場から、ルートは南へ向かい、フィラエへの船着き場へ。'],
    ['000000000015', 'ネクタネボ1世のもとでおよそ紀元前380〜362年に築かれ拡張され', '紀元前4世紀にネクタネボ1世のもとで建設が始まり'],
    ['000000000017', 'およそ10万人のヌビアの人々', 'およそ5万人のヌビアの人々'],
    ['00000000001f', 'エジプトのほぼすべてのオベリスクと石棺がここで切り出され', 'エジプトのオベリスクや石棺の多くがここで切り出され'],
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
// Nothing "More about this day" shows may keep what the page corrects.
const RETIRED = {
  en: /Kitchener|Botanical Garden|hydrology|western bank for Philae|included in the tour|380 and 362|100,000|minimum age|English-speaking|Virtually every/i,
  es: /Kitchener|Jardín Botánico|hidrología|orilla occidental hacia Philae|incluido en el tour|380 y el 362|100\.000|edad mínima|habla hispana|Casi cada obelisco/i,
  ja: /キッチナー|植物園|水文|西岸へ渡って|ツアーに含まれます|380〜362|10万人|ほぼすべてのオベリスク/,
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
  guideLanguagePrices: { ...(doc.guideLanguagePrices ?? { _type: 'object' }), es: NEW.es, ja: NEW.ja },
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
  await writeRollback(client, [DOC_ID], 'before-aswan-car-and-guide');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
