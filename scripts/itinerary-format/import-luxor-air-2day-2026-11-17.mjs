/**
 * Luxor by Air from Cairo: Two Days — merge the duplicate into the keeper and
 * publish the owner's locked copy (EN/ES/JA, 17 Nov; reviewed and corrected
 * the same evening; owner: "publish them the same way").
 *
 *   keeper    tour.02-day-luxor-tour-by-plane-from-cairo   /02-day-luxor-tour-by-plane-from-cairo
 *   duplicate wp-page-86790                                 /luxor-2-day-tour-by-plane-from-cairo
 *
 * Keeper receives: the locked itinerary (days, intro with the "Your guide
 * speaks" panel row and the stay rows, included / not included, options, route
 * legs), the new titles ×3, a new summary ×3 (owner-approved 17 Nov: the old
 * one said "the greatest concentration of ancient monuments on earth"), the
 * concierge note (EN/ES only — JA never shows concierge content), the
 * duplicate's price (€565, ES/JA guide prices; owner 17 Nov: "copy across"),
 * and the essay corrections (Gate A.3) in the passages the page shows.
 * Keeper keeps its slugs, hero, essay and relatedTours.
 *
 * --retire (after the 301s are live): repoints the duplicate's two inbound
 * references to the keeper (keys kept) and hides the duplicate
 * (hidden, migration.reviewFlag = superseded-duplicate, supersededBy).
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-luxor-air-2day-2026-11-17.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/itinerary-format/import-luxor-air-2day-2026-11-17.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/itinerary-format/import-luxor-air-2day-2026-11-17.mjs --apply --flags-approved
 *   node --env-file=<.env> scripts/itinerary-format/import-luxor-air-2day-2026-11-17.mjs --retire --apply
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const KEEPER = 'tour.02-day-luxor-tour-by-plane-from-cairo';
const DUP = 'wp-page-86790';
const INBOUND = ['wp-page-153242', 'wp-page-86832'];
const LANGS = ['en', 'es', 'ja'];
const B0 = 'review/locked/2-day-luxor-by-air-from-cairo';
const LOCKED = { en: `${B0}.md`, es: `${B0}-es.md`, ja: `${B0}-ja.md` };
const CFG = { locked: LOCKED };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const retire = args.includes('--retire');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = 'Owner locked copy "2-day-luxor-by-air-from-cairo" (EN/ES/JA), 17 Nov 2026, reviewed and corrected 17 Nov evening.';

// The keeper's essay keys differ per language. "More about this stop":
// Day 1 = Karnak, Luxor Temple, "Karnak: a note on scale"; Day 2 = the West Bank.
const MORE = {
  en: { 1: ['00000000000e', '000000000011', '00000000001b'], 2: ['000000000015'] },
  es: { 1: ['000000000010', '000000000013', '00000000001d'], 2: ['000000000017'] },
  ja: { 1: ['000000000016', '000000000019', '000000000023'], 2: ['00000000001d'] },
};
// Guide links (open items): Karnak · Luxor Temple · Valley of the Kings · Hatshepsut · Colossi.
// No guide page exists for the Hypostyle Hall, the Sacred Lake or the Avenue of Sphinxes.
const GUIDES = {
  1: ['guideArticle.luxor.the-karnak-temple', null, null, null, 'guideArticle.luxor.the-luxor-temple'],
  2: ['guideArticle.luxor.valley-of-the-kings', 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut', 'guideArticle.luxor.the-colossi-of-memnon'],
};
const ROUTE = {
  en: [['Cairo', 'Luxor'], ['Luxor', 'Cairo']],
  es: [['El Cairo', 'Luxor'], ['Luxor', 'El Cairo']],
  ja: [['カイロ', 'ルクソール'], ['ルクソール', 'カイロ']],
};
// Owner-approved 17 Nov.
const SUMMARY = {
  en: 'A private two-day trip by air from Cairo: Karnak and Luxor Temple on the first day, the West Bank tombs on the second, with a night in Luxor.',
  es: 'Un viaje privado de dos días en avión desde El Cairo: Karnak y el templo de Luxor el primer día, las tumbas de la orilla occidental el segundo, con una noche en Luxor.',
  ja: 'カイロから空路で行くプライベートな2日間の旅。1日目にカルナック神殿とルクソール神殿、2日目に西岸の墓所をめぐり、ルクソールで1泊します。',
};

/* Essay corrections (open items, 17 Nov; canon Gate A.3), in the passages the page shows:
 * Karnak's superlative → the one approved Tier 1 wording; "thirty dynasties" → "some
 * 1,500 years"; the reseller wording ("depending on your booking", "in many itineraries",
 * "verify … before booking") removed; Karnak no longer "begins the afternoon" (the page
 * arrives in the morning). */
const FIX = {
  en: [
    // The bold lead ("Karnak Temple Complex") is its own run; the fix starts after it.
    ['00000000000e', ' is where the afternoon begins, and rightly so. This is the largest religious site ever built:', ' comes first, and rightly so. Karnak is one of the largest religious complexes ever built:'],
    ['00000000001b', 'It accumulated across roughly thirty dynasties,', 'It accumulated across some 1,500 years,'],
    ['000000000015', 'The second day, depending on your specific booking, typically covers the West Bank:', 'The second day covers the West Bank:'],
    ['000000000015', 'and, in many itineraries, the Colossi of Memnon', 'and the Colossi of Memnon'],
    ['000000000015', ' Verify which West Bank sites are included in your specific programme before booking.', ''],
  ],
  es: [
    ['000000000010', ' abre la tarde, y con razón. Es el mayor recinto religioso jamás construido:', ' va primero, y con razón. Karnak es uno de los mayores complejos religiosos jamás construidos:'],
    ['00000000001d', 'Se acumuló a lo largo de unas treinta dinastías;', 'Se acumuló a lo largo de unos 1.500 años;'],
    ['000000000017', 'El segundo día, según la reserva concreta, cubre habitualmente la orilla occidental:', 'El segundo día cubre la orilla occidental:'],
    ['000000000017', 'y, en muchos itinerarios, los colosos de Memnón', 'y los colosos de Memnón'],
    ['000000000017', ' Conviene confirmar qué sitios concretos de la orilla occidental incluye el programa contratado antes de reservar.', ''],
  ],
  ja: [
    ['000000000016', 'で午後がはじまり、それは当然のことです。ここはこれまでに建てられた最大の宗教遺跡です——', 'から見学をはじめます。それは当然のことです。カルナック神殿は、史上最大級の宗教建築群のひとつです——'],
    ['000000000023', 'およそ三十の王朝にわたって積み重なり', 'およそ1,500年にわたって積み重なり'],
    ['00000000001d', '二日目は、ご予約の内容にもよりますが、通例は西岸を巡ります——', '二日目は西岸を巡ります——'],
    ['00000000001d', 'そして多くの行程に組み込まれるメムノンの巨像', 'そしてメムノンの巨像'],
    ['00000000001d', 'ご予約前に、ご自身の具体的なプログラムにどの西岸の遺跡が含まれるかをご確認ください。', ''],
  ],
};

// The EN panel's guide row carries an authoring note for the other languages.
const panelText = (l, t) => (l === 'en' ? t.replace(/\s*\*\(ES:.*\)\*\s*$/, '') : t);

// The concierge note: its own section after "Make it your own" (EN/ES only).
function conciergeNote(l) {
  if (l === 'ja') return null;
  const md = readFileSync(new URL(`../../${LOCKED[l]}`, import.meta.url), 'utf8');
  const m = md.match(/\n## (A note from our concierge|Una nota de nuestro concierge)\n([\s\S]*)$/);
  if (!m) throw new Error(`${l}: concierge note section missing`);
  const text = m[2].split('\n').map((x) => x.replace(/^>\s?/, '').trim()).filter(Boolean).join(' ');
  if (!text) throw new Error(`${l}: concierge note empty`);
  return text;
}

const P = Object.fromEntries(LANGS.map((l) => [l, parse(l, CFG)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ days: p.days.map((d) => [d.day, d.body?.length, d.sites.length, d.meals.map((m) => m.meal), d.optional.length, !!d.overnight]), inc: p.included.length, exc: p.excluded.map((x) => x.seeDay ?? 0), fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length, panel: p.panelRows.length, stay: p.stayRows.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
const flat = (p) => {
  const o = { opening: p.opening, why: p.whyRoute, closing: p.closingLine };
  for (const d of p.days) { o[`d${d.day}.t`] = d.title; (d.body ?? []).forEach((s, i) => (o[`d${d.day}.b${i}`] = s)); o[`d${d.day}.travel`] = d.travel; d.optional.forEach((s, i) => (o[`d${d.day}.o${i}`] = s)); }
  p.stayRows.forEach((r, i) => (o[`stay${i}`] = r.text));
  p.included.forEach((s, i) => (o[`in${i}`] = s)); p.excluded.forEach((s, i) => (o[`ex${i}`] = s.text)); p.worthKnowing.forEach((s, i) => (o[`wk${i}`] = s));
  return o;
};
// Same meaning, checked by hand 17 Nov: EN "on both days" = ES «los dos días» (the gate reads «dos» as 2).
const SAME_MEANING = { es: ['in6'] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
  for (const key of SAME_MEANING[l] ?? []) { delete en[key]; delete lc[key]; console.log(`numeric gate (${l}): ${key} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const [keeper, dup] = await Promise.all([client.getDocument(KEEPER), client.getDocument(DUP)]);
if (!keeper || !dup) throw new Error('keeper or duplicate not found');
if (keeper.durationDays !== 2 || dup.durationDays !== 2) throw new Error('not 2-day documents');

/* ---------- --retire: after the 301s are live ---------- */
if (retire) {
  const docs = await Promise.all(INBOUND.map((id) => client.getDocument(id)));
  const patches = [];
  docs.forEach((doc, n) => {
    if (!doc) throw new Error(`${INBOUND[n]} not found`);
    // Key-addressed paths (arrays by _key), so the patch survives reordering.
    const kp = [];
    const walkK = (o, p) => {
      if (Array.isArray(o)) { o.forEach((v) => walkK(v, `${p}[_key=="${v?._key}"]`)); return; }
      if (o && typeof o === 'object') { if (o._ref === DUP) kp.push(`${p}._ref`); for (const [k, v] of Object.entries(o)) walkK(v, `${p}${p ? '.' : ''}${k}`); }
    };
    walkK(doc, '');
    if (!kp.length) console.log(`${doc._id}: no reference to ${DUP} (already repointed?)`);
    for (const p of kp) console.log(`repoint ${doc._id} ${p} → ${KEEPER}`);
    if (kp.length) patches.push([doc._id, Object.fromEntries(kp.map((p) => [p, KEEPER]))]);
  });
  const hide = { hidden: true, 'migration.reviewFlag': 'superseded-duplicate', 'migration.supersededBy': KEEPER, 'migration.supersededAt': new Date().toISOString() };
  console.log(`hide ${DUP}: ${JSON.stringify(hide)}`);
  if (apply) {
    await writeRollback(client, [DUP, ...INBOUND], 'before-luxor-air-retire');
    for (const [id, set] of patches) await client.patch(id).set(set).commit();
    await client.patch(DUP).set(hide).commit();
    const left = await client.fetch('count(*[references($id) && !(_id in path("drafts.**"))])', { id: DUP });
    console.log(`RETIRED ${DUP}; published references left: ${left}`);
  } else console.log('dry run (pass --apply to write production)');
  process.exit(0);
}

/* ---------- essay corrections ---------- */
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');
const body = keeper.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const ref of Object.values(MORE[l]).flat()) if (!keys.has(ref)) throw new Error(`${l}: essay block ${ref} missing`);
  return {
    ...row,
    value: row.value.map((b) => {
      const fixes = FIX[l].filter(([k]) => k === b._key);
      if (!fixes.length) return b;
      const children = b.children.map((c) => ({ ...c }));
      for (const [, find, repl] of fixes) {
        const alts = [find, find.replace(/’/g, "'")];
        const i = children.findIndex((c) => alts.some((f) => c.text.includes(f)));
        if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
        children[i] = { ...children[i], text: children[i].text.replace(alts.find((f) => children[i].text.includes(f)), repl) };
      }
      return { ...b, children };
    }),
  };
});

/* ---------- itinerary ---------- */
const para = (text, i) => ({ _key: `p${i}`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `s${i}`, _type: 'span', text, marks: [] }] });
const fact = (key, l, text) => ({ _key: key, _type: 'productFact', lang: l, text, source: SRC, needsReview: false });
const row = (key, r) => ({ _key: key, _type: 'labelledRow', label: r.label, text: r.text });
function build(l) {
  const p = P[l];
  const exKey = (i) => `lxa-ex-${l}-${i}`;
  const taken = new Set();
  // An optional extra on a day links to its "Not included" row (same day, in order).
  const optRef = (day, oi) => {
    const cands = p.excluded.map((x, i) => ({ ...x, i })).filter((x) => x.seeDay === day && !taken.has(x.i));
    const opts = p.days.find((d) => d.day === day).optional;
    if (oi < opts.length - cands.length || !cands.length) return undefined;
    taken.add(cands[0].i);
    return exKey(cands[0].i);
  };
  const prev = new Map((keeper.itineraryDays ?? []).filter((r) => r.lang === l).map((r) => [r.day, r]));
  const days = p.days.map((d) => ({
    _key: prev.get(d.day)?._key ?? `lxa-${l}-${d.day}`,
    _type: 'itineraryDay', lang: l, day: d.day, place: d.place, title: d.title,
    body: d.body.map(para),
    sites: d.sites.map((name, i) => ({ _key: `site${i}`, _type: 'daySite', name, ...(GUIDES[d.day][i] ? { guideRef: { _type: 'reference', _ref: GUIDES[d.day][i], _weak: true } } : {}) })),
    ...(d.overnight ? { overnight: d.overnight } : {}),
    meals: d.meals.map((m, i) => ({ _key: `m${i}`, _type: 'dayMeal', meal: m.meal, ...(m.note ? { note: m.note } : {}) })),
    travel: d.travel,
    optional: d.optional.map((text, i) => { const ref = optRef(d.day, i); return { _key: `o${i}`, _type: 'dayOptional', text, ...(ref ? { exclusionRef: ref } : {}) }; }),
    narrativeRefs: MORE[l][d.day],
    source: SRC, needsReview: false, overnightNeedsReview: false,
  }));
  for (const d of p.days) if (GUIDES[d.day].length !== d.sites.length) throw new Error(`${l} day ${d.day}: ${d.sites.length} sites, ${GUIDES[d.day].length} guide slots`);
  const intro = {
    _key: `intro-${l}`, _type: 'itineraryIntro', lang: l,
    opening: p.opening, whyRoute: p.whyRoute, whyRouteRefs: [],
    closingLine: p.closingLine,
    panelRows: p.panelRows.map((r, i) => row(`pr${i}`, { ...r, text: panelText(l, r.text) })),
    stayRows: p.stayRows.map((r, i) => row(`sr${i}`, r)),
    fitFor: p.fitFor, worthKnowing: p.worthKnowing, makeItYoursIntro: p.makeItYoursIntro,
    source: SRC, needsReview: false,
  };
  return {
    days, intro,
    included: p.included.map((t, i) => fact(`lxa-in-${l}-${i}`, l, t)),
    excluded: p.excluded.map((x, i) => fact(exKey(i), l, x.text)),
    options: p.options.map((t, i) => fact(`lxa-opt-${l}-${i}`, l, t)),
    legs: ROUTE[l].map(([from, to], i) => ({ _key: `lxa-leg-${l}-${i}`, _type: 'routeLeg', lang: l, from, to, mode: 'flight', ...(i === 0 ? { nights: 1 } : {}), source: SRC, needsReview: false })),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));
const loc = (arr, l) => (arr ?? []).find((t) => t._key === l);
const set = {
  title: LANGS.map((l) => ({ ...(loc(keeper.title, l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  summary: LANGS.map((l) => ({ ...(loc(keeper.summary, l) ?? { _key: l, _type: 'object' }), value: SUMMARY[l] })),
  body,
  itineraryDays: LANGS.flatMap((l) => B[l].days),
  itineraryIntro: LANGS.map((l) => B[l].intro),
  inclusions: LANGS.flatMap((l) => B[l].included),
  exclusions: LANGS.flatMap((l) => B[l].excluded),
  customisationOptions: LANGS.flatMap((l) => B[l].options),
  routeLegs: LANGS.flatMap((l) => B[l].legs),
  conciergeNote: LANGS.map((l) => [l, conciergeNote(l)]).filter(([, v]) => v).map(([l, value]) => ({ _key: l, _type: 'internationalizedArrayTextValue', value })),
  priceFrom: dup.priceFrom,
  guideLanguagePrices: dup.guideLanguagePrices,
};
if (typeof set.priceFrom !== 'number' || set.priceFrom <= 0) throw new Error('duplicate price missing');
for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions', 'routeLegs']) set[f] = curlyRows(set[f], 'en');

for (const l of LANGS) {
  const rows = ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions', 'routeLegs'].flatMap((f) => set[f].filter((r) => r.lang === l)).map(({ mode, ...r }) => r);
  const note = set.conciergeNote.find((n) => n._key === l)?.value;
  verbatimPreflight([...visibleStrings(rows, l), P[l].title, ...(note ? [note] : [])], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

console.log('BEFORE (keeper / duplicate):');
for (const l of LANGS) {
  console.log(`  title ${l}: ${loc(keeper.title, l)?.value}  |  dup: ${loc(dup.title, l)?.value}`);
  console.log(`  summary ${l}: ${String(loc(keeper.summary, l)?.value).slice(0, 110)}  |  dup: ${String(loc(dup.summary, l)?.value).slice(0, 80)}`);
}
console.log(`  metaDescription keeper ${JSON.stringify(keeper.metaDescription ?? keeper.seo ?? null)} · dup ${JSON.stringify(dup.metaDescription ?? dup.seo ?? null)}`);
console.log(`  hero keeper ${keeper.heroImage?.asset?._ref} · dup ${dup.heroImage?.asset?._ref}; price keeper ${keeper.priceFrom ?? '—'} · dup €${dup.priceFrom} ${JSON.stringify(dup.guideLanguagePrices)}`);
console.log('AFTER:');
for (const l of LANGS) console.log(`  title ${l}: ${P[l].title}\n  summary ${l}: ${SUMMARY[l]}\n  panel ${l}: ${JSON.stringify(B[l].intro.panelRows.map((r) => `${r.label}: ${r.text}`))}`);
for (const [f, v] of Object.entries(set)) console.log(`${f}: ${Array.isArray(keeper[f]) ? keeper[f].length : JSON.stringify(keeper[f] ?? null)} → ${Array.isArray(v) ? v.length : JSON.stringify(v)}`);
for (const l of LANGS) for (const b of body.find((x) => x._key === l).value) {
  const before = keeper.body.find((x) => x._key === l).value.find((x) => x._key === b._key);
  if (textOf(before) !== textOf(b)) console.log(`essay ${l} ${b._key}: ${textOf(b)}`);
}

if (previewOut) {
  const ids = Object.values(GUIDES).flat().filter(Boolean);
  const refs = await client.fetch(`*[_id in $ids]`, { ids });
  const cities = await client.fetch(`*[_id in $ids]`, { ids: [...(keeper.cities ?? []).map((c) => c._ref), ...refs.map((r) => r.parentCity?._ref).filter(Boolean)] });
  const dataset = [{ ...keeper, ...set }, ...refs, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const slug = keeper.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'conciergeNoteStrict', 'approvedInclusions', 'approvedExclusionRows', 'itineraryFormat', 'approvedOptions', 'approvedRoute'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  await writeRollback(client, [KEEPER, DUP], 'before-luxor-air-merge');
  await client.patch(KEEPER).set(set).commit();
  console.log(`APPLIED to production ${KEEPER}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
