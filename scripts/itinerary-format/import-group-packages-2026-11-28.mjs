/**
 * The three old-format GROUP packages rebuilt in the multi-day format (owner, 27 Nov 2026: "Follow Sawa's trips";
 * copy approved 27 Nov; "Yes, import them" 28 Nov). Each page is updated IN PLACE: same _id, slugs (owner: "keep the
 * URL as it is"), hero, theme, tourMode and price (the owner sets prices later). The old essay is not shown.
 *   9-day:  tour.9-day-egypt-group-tour-cairo-abu-simbel-nile    follows Sawa "Egypt in Depth"
 *   12-day: tour.12-day-egypt-group-tour-cairo-dahabiya-red-sea  Sawa "Egypt End to End" + dahabiya, Abu Simbel by air
 *   10-day: tour.10-day-egypt-group-tour-cairo-nile-red-sea      our own trip, corrected (Abu Simbel by road)
 *
 * Measurement freeze until 13 Dec: the buying path does not change here. Future departure dates are KEPT (they also
 * feed /group-departures); only past dates are dropped. The "Book this trip" (Sawa) paragraph is NOT written yet: the
 * Sawa link-out ships with PR #413 on 14 Dec, which also removes the dates. Cities set where they were missing.
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-group-packages-2026-11-28.mjs [--only 9|10|12]            # dry run
 *   node --env-file=<.env> scripts/itinerary-format/import-group-packages-2026-11-28.mjs [--only …] --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';

const LANGS = ['en', 'es', 'ja'];
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const TODAY = new Date().toISOString().slice(0, 10);

const CITY = { cairo: 'wp-page-83284', aswan: 'wp-page-58758', luxor: 'wp-page-58877', hurghada: 'wp-page-58859' };
// EN site name → guide page (weak reference). Sites not listed get no link.
const GUIDE = {
  Memphis: 'guideArticle.giza.memphis-mit-rahina',
  Saqqara: 'guideArticle.giza.the-saqqara-necropolis',
  'Hanging Church': 'guideArticle.cairo.hanging-church-al-mu-allaqa',
  'Egyptian Museum': 'guideArticle.cairo.egyptian-museum-of-antiquities',
  'Giza pyramids': 'guideArticle.giza.the-giza-plateau',
  'Great Sphinx': 'guideArticle.giza.the-great-sphinx',
  Karnak: 'guideArticle.luxor.the-karnak-temple',
  'Luxor Temple': 'guideArticle.luxor.the-luxor-temple',
  'Valley of the Kings': 'guideArticle.luxor.valley-of-the-kings',
  'Temple of Hatshepsut': 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut',
  'Colossi of Memnon': 'guideArticle.luxor.the-colossi-of-memnon',
  'Temple of Horus at Edfu': 'guideArticle.edfu.edfu-temple',
  'Temple of Kom Ombo': 'guideArticle.kom-ombo.the-temple-of-kom-ombo',
  'Elephantine Island': 'guideArticle.aswan.elephantine-island',
  'Aga Khan Mausoleum (from the water)': 'guideArticle.aswan.the-aga-khan-mausoleum',
  'Temple of Philae': 'guideArticle.aswan.the-philae-temple',
  'Aswan High Dam': 'wp-page-59236',
  'Unfinished Obelisk': 'guideArticle.aswan.the-unfinished-obelisk',
  'Khan El Khalili': 'guideArticle.cairo.khan-el-khalili',
  'Abu Simbel': 'guideArticle.abu-simbel.the-great-temple-of-abu-simbel',
  'Great Temple of Ramses II': 'guideArticle.abu-simbel.the-great-temple-of-abu-simbel',
  'Islamic Cairo': 'guideArticle.cairo.from-al-azhar-to-the-citadel-walking-islamic-cairo',
  'Citadel of Saladin': 'guideArticle.cairo.the-citadel-of-saladin',
  'Mosque of Muhammad Ali': 'guideArticle.cairo.mosque-of-muhammad-ali',
};

const PKGS = {
  9: {
    id: 'tour.9-day-egypt-group-tour-cairo-abu-simbel-nile', days: 9, key: 'g9', base: 'review/locked/9-day-group-cairo-nile-cruise',
    cities: ['cairo', 'luxor', 'aswan'],
    // JA: d5.b0 「六十」 in kanji = "more than sixty"; stay1 / in2 「3食付き」 = "full board" (three meals).
    sameMeaning: { ja: ['d5.b0', 'stay1', 'in2'] },
    jaSites: { 6: ['エドフのホルス神殿', 'コム・オンボ神殿', 'ワニ博物館'], 7: ['ファルーカ', 'エレファンティネ島', 'アガ・ハーン廟（船上から）', '自由時間'], 8: ['フィラエ神殿', 'アスワン・ハイ・ダム', 'ハーン・ハリーリ'] },
  },
  12: {
    id: 'tour.12-day-egypt-group-tour-cairo-dahabiya-red-sea', days: 12, key: 'g12', base: 'review/locked/12-day-group-dahabiya-nile-red-sea',
    cities: null, // already set (Cairo, Aswan, Luxor, Hurghada)
    // JA: d8.b0 「六十」 in kanji = "more than sixty".
    sameMeaning: { ja: ['d8.b0'] },
    jaSites: { 4: ['アブ・シンベル', 'ラムセス2世の大神殿', 'ネフェルタリ神殿', 'ファルーカ'], 5: ['アスワン・ハイ・ダム', '未完成のオベリスク', 'フィラエ神殿'], 6: ['コム・オンボ神殿', 'ワニ博物館'], 11: ['ハーン・ハリーリ'] },
  },
  10: {
    id: 'tour.10-day-egypt-group-tour-cairo-nile-red-sea', days: 10, key: 'g10', base: 'review/locked/10-day-group-cairo-nile-red-sea',
    cities: ['cairo', 'aswan', 'luxor', 'hurghada'],
    // ES: d6.b0 «los dos templos» = "both temples" (read as 2).
    // JA: d6.b0 「2つの神殿」 = "both temples"; d7.b0 「六十」 in kanji = "more than sixty".
    sameMeaning: { es: ['d6.b0'], ja: ['d6.b0', 'd7.b0'] },
    jaSites: { 3: ['吊り下げ教会', 'コプト地区', 'イスラーム地区', 'ハーン・ハリーリ'], 4: ['アスワン・ハイ・ダム', 'フィラエ神殿'], 5: ['アブ・シンベル', 'ラムセス2世の大神殿', 'ネフェルタリ神殿', 'コム・オンボ神殿', 'ワニ博物館'], 9: ['サラディンのシタデル', 'ムハンマド・アリー・モスク'] },
  },
};

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const paraText = (s) => (typeof s === 'string' ? s : `${s.lead} ${s.text}`);
const para = (s, i) => (typeof s === 'string'
  ? { _key: `p${i}`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `s${i}`, _type: 'span', text: s, marks: [] }] }
  : { _key: `p${i}`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `s${i}a`, _type: 'span', text: s.lead, marks: ['strong'] }, { _key: `s${i}b`, _type: 'span', text: ` ${s.text}`, marks: [] }] });
const row = (key, r) => ({ _key: key, _type: 'labelledRow', label: r.label, text: r.text });

const targets = [...new Set(Object.values(GUIDE))];
const found = await client.fetch('*[_id in $ids]._id', { ids: targets });
for (const id of targets) if (!found.includes(id)) throw new Error(`guide target ${id} missing`);

for (const [n, cfg] of Object.entries(PKGS)) {
  if (only && only !== n) continue;
  const LOCKED = { en: `${cfg.base}.md`, es: `${cfg.base}-es.md`, ja: `${cfg.base}-ja.md` };
  const SRC = `Owner-approved copy "${cfg.base.split('/').pop()}" (EN/ES/JA), 27 Nov 2026.`;
  const P = Object.fromEntries(LANGS.map((l) => [l, parse(l, { locked: LOCKED, jaSites: cfg.jaSites ?? {} })]));
  const shape = (p) => JSON.stringify({ days: p.days.map((d) => [d.day, d.body?.map((s) => typeof s), d.segments?.length ?? 0, d.sites.length, d.meals.map((m) => [m.meal, !!m.note]), d.optional.length, !!d.overnight, !!d.pace]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, panel: p.panelRows.length, stay: p.stayRows.length });
  for (const l of ['es', 'ja']) if (shape(P.en) !== shape(P[l])) throw new Error(`${n}-day ${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
  if (P.en.days.length !== cfg.days) throw new Error(`${n}-day: expected ${cfg.days} days, found ${P.en.days.length}`);

  const ROUTE_LABEL = { en: 'Route', es: 'Ruta', ja: 'ルート' };
  const WHERE = Object.fromEntries(LANGS.map((l) => [l, P[l].panel[ROUTE_LABEL[l]]]));
  for (const l of LANGS) if (!WHERE[l]) throw new Error(`${n}-day ${l}: no route line in the panel`);

  // Numbers must match EN in every string (centuries in Roman numerals and spelled-out counts are checked by hand).
  const flat = (p) => {
    const o = { opening: p.opening, why: p.whyRoute };
    for (const d of p.days) { o[`d${d.day}.t`] = d.title; (d.body ?? []).forEach((s, i) => (o[`d${d.day}.b${i}`] = paraText(s))); o[`d${d.day}.travel`] = d.travel; o[`d${d.day}.pace`] = d.pace; }
    p.panelRows.forEach((r, i) => (o[`panel${i}`] = r.text)); p.stayRows.forEach((r, i) => (o[`stay${i}`] = r.text));
    p.included.forEach((s, i) => (o[`in${i}`] = s)); p.excluded.forEach((s, i) => (o[`ex${i}`] = s.text)); p.worthKnowing.forEach((s, i) => (o[`wk${i}`] = s));
    return o;
  };
  for (const l of ['es', 'ja']) {
    const en = flat(P.en), lc = flat(P[l]);
    for (const k of cfg.sameMeaning?.[l] ?? []) { delete en[k]; delete lc[k]; console.log(`${n}-day numeric gate (${l}): ${k} checked by hand (same meaning)`); }
    numericGate(en, lc, l);
  }

  const existing = await client.getDocument(cfg.id);
  if (!existing) throw new Error(`${cfg.id} not found`);
  if (existing.tourMode !== 'group') throw new Error(`${cfg.id}: tourMode ${existing.tourMode}`);
  if (await client.getDocument(`drafts.${cfg.id}`)) throw new Error(`drafts.${cfg.id} exists: handle it first`);

  function build(l) {
    const p = P[l];
    const days = p.days.map((d) => {
      const enSites = P.en.days[d.day - 1].sites;
      return {
        _key: `${cfg.key}-${l}-${d.day}`,
        _type: 'itineraryDay', lang: l, day: d.day, place: d.place, title: d.title,
        ...(d.segments ? { segments: d.segments.map((sg, i) => ({ _key: `g${i}`, _type: 'daySegment', label: sg.label, ...(sg.heading ? { heading: sg.heading } : {}), text: sg.text })) } : { body: d.body.map(para) }),
        sites: d.sites.map((name, i) => ({ _key: `site${i}`, _type: 'daySite', name, ...(GUIDE[enSites[i]] ? { guideRef: { _type: 'reference', _ref: GUIDE[enSites[i]], _weak: true } } : {}) })),
        ...(d.overnight ? { overnight: d.overnight } : {}),
        meals: d.meals.map((m, i) => ({ _key: `m${i}`, _type: 'dayMeal', meal: m.meal, ...(m.note ? { note: m.note } : {}) })),
        travel: d.travel, ...(d.pace ? { pace: d.pace } : {}),
        optional: d.optional.map((text, i) => ({ _key: `o${i}`, _type: 'dayOptional', text, ...(/extra ticket|entrada.* extra|entradas extra|別途チケット|別途入場券/i.test(text) ? { cost: 'extraTicket' } : {}) })),
        narrativeRefs: [],
        source: SRC, needsReview: false, overnightNeedsReview: false,
      };
    });
    const intro = {
      _key: `intro-${l}`, _type: 'itineraryIntro', lang: l,
      opening: p.opening, whyRoute: p.whyRoute, whyRouteRefs: [],
      ...(p.closingLine ? { closingLine: p.closingLine } : {}),
      panelRows: p.panelRows.map((r, i) => row(`pr${i}`, r)),
      stayRows: p.stayRows.map((r, i) => row(`sr${i}`, r)),
      fitFor: p.fitFor, worthKnowing: p.worthKnowing,
      // "Book this trip" (Sawa) is held until the link-out ships on 14 Dec (PR #413).
      source: SRC, needsReview: false,
    };
    const fact = (k, text) => ({ _key: k, _type: 'productFact', lang: l, text, source: SRC, needsReview: false });
    return {
      days, intro,
      included: p.included.map((t, i) => fact(`${cfg.key}-in-${l}-${i}`, t)),
      excluded: p.excluded.map((x, i) => fact(`${cfg.key}-ex-${l}-${i}`, x.text)),
    };
  }
  const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));
  const intl = (type, m) => LANGS.map((l) => ({ _key: l, _type: type, value: m[l] }));
  const futureDeps = (existing.departures ?? []).filter((d) => d.startDate >= TODAY);
  const doc = {
    title: intl('internationalizedArrayStringValue', Object.fromEntries(LANGS.map((l) => [l, P[l].title]))),
    summary: intl('internationalizedArrayTextValue', Object.fromEntries(LANGS.map((l) => [l, P[l].opening]))),
    shapeOfDay: { ...(existing.shapeOfDay ?? {}), where: intl('internationalizedArrayTextValue', WHERE) },
    durationDays: cfg.days,
    itineraryDays: LANGS.flatMap((l) => B[l].days),
    itineraryIntro: LANGS.map((l) => B[l].intro),
    inclusions: LANGS.flatMap((l) => B[l].included),
    exclusions: LANGS.flatMap((l) => B[l].excluded),
    customisationOptions: [],
    routeLegs: [],
    departures: futureDeps,
    ...(cfg.cities ? { cities: cfg.cities.map((c) => ({ _key: c, _type: 'reference', _ref: CITY[c] })) } : {}),
  };
  for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions']) doc[f] = curlyRows(doc[f], 'en');

  for (const l of LANGS) {
    const rows = ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions'].flatMap((f) => doc[f].filter((r) => r.lang === l));
    verbatimPreflight([...visibleStrings(rows, l).filter((x) => x !== 'strong'), P[l].title, WHERE[l], P[l].opening], [LOCKED[l]]);
  }
  await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

  const SLUGS = LANGS.map((l) => existing.slug.find((x) => x._key === l)?.value.current);
  console.log(`\n== ${n}-day ${cfg.id} (price ${existing.priceFrom} / ${JSON.stringify(existing.guideLanguagePrices)} kept; slugs kept: ${SLUGS.join(' | ')})`);
  for (const l of LANGS) console.log(`  ${l}: ${P[l].title}\n    where: ${WHERE[l]}\n    panel: ${JSON.stringify(B[l].intro.panelRows.map((r) => `${r.label}: ${r.text}`))}\n    days: ${JSON.stringify(B[l].days.map((d) => `${d.day} ${d.place} | ${d.overnight ?? '—'} | ${d.meals.map((m) => m.meal[0]).join('')} | sites ${d.sites.length}/${d.sites.filter((s) => s.guideRef).length} linked | opt ${d.optional.length}`))}`);
  for (const f of ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions']) console.log(`  ${f}: ${(existing[f] ?? []).length} → ${doc[f].length}`);
  console.log(`  departures: ${(existing.departures ?? []).length} → ${futureDeps.length} (past dropped; future kept until the Sawa switch on 14 Dec)`);
  if (cfg.cities) console.log(`  cities: ${(existing.cities ?? []).length} → ${cfg.cities.join(', ')}`);

  if (apply) {
    await writeRollback(client, [cfg.id], `before-group-${n}day`);
    await client.patch(cfg.id).set(doc).commit();
    console.log(`APPLIED: ${cfg.id} updated in production`);
  }
}
if (!apply) console.log('\ndry run (pass --apply --flags-approved to write production)');
