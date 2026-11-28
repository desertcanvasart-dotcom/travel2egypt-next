/**
 * The old-format private packages rebuilt in the multi-day format (owner, 28 Nov 2026: "Let us start with group
 * number 2" of review/old-format-tours-2026-11-28.md; answers in review/drafts/packages-2026-11-28/open-items.md;
 * "Start ES/JA now"). Each page is updated IN PLACE: same _id and slugs (URLs unchanged), hero, theme, cities,
 * tourMode, relatedTours and departures untouched; cities are set only where the tour had none (config `cities`). The old essay stays in the document but is not shown.
 *
 * Copy: review/locked/<slug>.md, -es.md, -ja.md (moved from review/drafts/packages-2026-11-28/ once approved).
 * Price: prices come later from Autoura (owner rule, 27 Nov: a missing price never blocks publishing). Per product
 * `price: 'unset'` removes priceFrom + guideLanguagePrices; `price: 'keep'` leaves them.
 *
 *   node --env-file=<.env> scripts/itinerary-format/import-old-packages-2026-11-28.mjs [--only <slug>]            # dry run
 *   ... --drafts   # dry run straight from review/drafts/packages-2026-11-28/ (before the files are locked)
 *   node --env-file=<.env> scripts/itinerary-format/import-old-packages-2026-11-28.mjs [--only <slug>] --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { existsSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';
import { parse } from './multi-day.parse.mjs';
import { PKGS } from './import-old-packages-2026-11-28.config.mjs';

const LANGS = ['en', 'es', 'ja'];
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });

const panelText = (l, t) => (l === 'en' ? t.replace(/\s*\*\(ES:.*\)\*\s*$/, '') : t);
const paraText = (s) => (typeof s === 'string' ? s : `${s.lead} ${s.text}`);
const para = (s, i) => (typeof s === 'string'
  ? { _key: `p${i}`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `s${i}`, _type: 'span', text: s, marks: [] }] }
  : { _key: `p${i}`, _type: 'block', style: 'normal', markDefs: [], children: [{ _key: `s${i}a`, _type: 'span', text: s.lead, marks: ['strong'] }, { _key: `s${i}b`, _type: 'span', text: ` ${s.text}`, marks: [] }] });
const row = (key, r) => ({ _key: key, _type: 'labelledRow', label: r.label, text: r.text });
const shape = (p) => JSON.stringify({ days: p.days.map((d) => [d.day, d.body?.map((s) => typeof s), d.segments?.length ?? 0, d.sites.length, d.meals.map((m) => [m.meal, !!m.note]), d.optional.length, !!d.overnight, !!d.pace]), inc: p.included.length, exc: p.excluded.map((x) => x.seeDay ?? 0), fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length, panel: p.panelRows.length, stay: p.stayRows.length, note: !!p.daysNote });
const flat = (p) => {
  const o = { opening: p.opening, why: p.whyRoute, note: p.daysNote?.text, closing: p.closingLine, mine: p.makeItYoursIntro };
  for (const d of p.days) { o[`d${d.day}.t`] = d.title; (d.body ?? []).forEach((s, i) => (o[`d${d.day}.b${i}`] = paraText(s))); (d.segments ?? []).forEach((s, i) => (o[`d${d.day}.g${i}`] = s.text)); o[`d${d.day}.travel`] = d.travel; o[`d${d.day}.pace`] = d.pace; d.optional.forEach((s, i) => (o[`d${d.day}.o${i}`] = s)); }
  p.panelRows.forEach((r, i) => (o[`panel${i}`] = r.text)); p.stayRows.forEach((r, i) => (o[`stay${i}`] = r.text));
  p.included.forEach((s, i) => (o[`in${i}`] = s)); p.excluded.forEach((s, i) => (o[`ex${i}`] = s.text)); p.worthKnowing.forEach((s, i) => (o[`wk${i}`] = s)); p.fitFor.forEach((s, i) => (o[`fit${i}`] = s)); p.options.forEach((s, i) => (o[`opt${i}`] = s));
  return o;
};

// Guide links: EN site name → published guide article with that exact EN title (weak reference), plus aliases.
const ALIAS = {
  'Giza pyramids': 'guideArticle.giza.the-giza-plateau', 'Great Sphinx': 'guideArticle.giza.the-great-sphinx', Memphis: 'guideArticle.giza.memphis-mit-rahina', Saqqara: 'guideArticle.giza.the-saqqara-necropolis',
  Karnak: 'guideArticle.luxor.the-karnak-temple', 'Luxor Temple': 'guideArticle.luxor.the-luxor-temple', 'Valley of the Kings': 'guideArticle.luxor.valley-of-the-kings', 'Temple of Hatshepsut': 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut', 'Colossi of Memnon': 'guideArticle.luxor.the-colossi-of-memnon',
  'Temple of Horus at Edfu': 'guideArticle.edfu.edfu-temple', 'Temple of Kom Ombo': 'guideArticle.kom-ombo.the-temple-of-kom-ombo', 'Temple of Philae': 'guideArticle.aswan.the-philae-temple', 'Unfinished Obelisk': 'guideArticle.aswan.the-unfinished-obelisk', 'Aswan High Dam': 'wp-page-59236',
  'Abu Simbel': 'guideArticle.abu-simbel.the-great-temple-of-abu-simbel', 'Great Temple of Ramses II': 'guideArticle.abu-simbel.the-great-temple-of-abu-simbel',
  'Khan El Khalili': 'guideArticle.cairo.khan-el-khalili', 'Citadel of Saladin': 'guideArticle.cairo.the-citadel-of-saladin', 'Mosque of Muhammad Ali': 'guideArticle.cairo.mosque-of-muhammad-ali', 'Hanging Church': 'guideArticle.cairo.hanging-church-al-mu-allaqa', 'Egyptian Museum': 'guideArticle.cairo.egyptian-museum-of-antiquities',
  'Golden Mummies': 'guideArticle.bahariya-oasis.valley-of-the-golden-mummies', 'Crystal Mountain': 'guideArticle.bahariya-oasis.crystal-mountain', 'White Desert National Park': 'guideArticle.farafra-oasis.white-desert-national-park',
  'Deir el-Hagar': 'guideArticle.dakhla-oasis.deir-el-hagar', 'Temple of Hibis': 'guideArticle.kharga-oasis.hibis-temple', 'Bagawat necropolis': 'guideArticle.kharga-oasis.cemetery-of-el-bagawat',
  'Elephantine Island': 'guideArticle.aswan.elephantine-island',
};
const guides = await client.fetch('*[_type == "guideArticle" && !(_id in path("drafts.**")) && hidden != true]{_id, "t": title[_key == "en"][0].value}');
const norm = (t) => t.toLowerCase().replace(/[’']/g, '').replace(/\s*\(.*\)\s*$/, '').replace(/^the\s+/, '').replace(/^(temple|tomb) of (the )?/, '$1 of ').trim();
const BY_TITLE = new Map();
for (const g of guides.filter((x) => x.t)) for (const k of [g.t.toLowerCase(), norm(g.t), norm(g.t).replace(/ temple$/, '')]) if (!BY_TITLE.has(k)) BY_TITLE.set(k, g._id);
const aliasIds = [...new Set(Object.values(ALIAS))];
const okAlias = new Set(await client.fetch('*[_id in $ids]._id', { ids: aliasIds }));
const guideFor = (name) => (ALIAS[name] && okAlias.has(ALIAS[name]) ? ALIAS[name] : BY_TITLE.get(name.toLowerCase()) ?? BY_TITLE.get(norm(name)) ?? BY_TITLE.get(norm(name).replace(/^temple of /, '')) ?? null);

let n = 0;
for (const [slug, cfg] of Object.entries(PKGS)) {
  if (only && only !== slug) continue;
  n++;
  const base = args.includes('--drafts') ? `review/drafts/packages-2026-11-28/${slug}` : `review/locked/${slug}`;
  if (apply && args.includes('--drafts')) throw new Error('--drafts is for dry runs only: move the approved files to review/locked/ first');
  const LOCKED = { en: `${base}.md`, es: `${base}-es.md`, ja: `${base}-ja.md` };
  for (const f of Object.values(LOCKED)) if (!existsSync(f)) throw new Error(`${slug}: ${f} missing`);
  const SRC = `Owner-reviewed copy "${slug}" (EN/ES/JA), 28 Nov 2026 (old-format package batch).`;
  const P = Object.fromEntries(LANGS.map((l) => [l, parse(l, { locked: LOCKED, jaSites: cfg.jaSites ?? {} })]));
  for (const l of ['es', 'ja']) if (shape(P.en) !== shape(P[l])) throw new Error(`${slug} ${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
  const ROUTE_LABEL = { en: 'Route', es: 'Ruta', ja: 'ルート' };
  const WHERE = Object.fromEntries(LANGS.map((l) => [l, P[l].panel[ROUTE_LABEL[l]]]));
  for (const l of LANGS) if (!WHERE[l]) throw new Error(`${slug} ${l}: no route line in the panel`);
  for (const l of ['es', 'ja']) {
    const en = flat(P.en), lc = flat(P[l]);
    for (const k of cfg.sameMeaning?.[l] ?? []) { delete en[k]; delete lc[k]; }
    numericGate(en, lc, l);
  }

  const existing = await client.fetch('*[_type == "tour" && !(_id in path("drafts.**")) && slug[_key == "en"][0].value.current == $slug][0]', { slug });
  if (!existing) throw new Error(`${slug}: no published tour`);
  if (existing.hidden) throw new Error(`${slug}: tour is hidden`);
  if (cfg.id && cfg.id !== existing._id) throw new Error(`${slug}: id ${existing._id}, expected ${cfg.id}`);
  if (await client.getDocument(`drafts.${existing._id}`)) throw new Error(`drafts.${existing._id} exists: handle it first`);
  const days = P.en.days.length;
  const key = cfg.key;

  function build(l) {
    const p = P[l];
    return {
      days: p.days.map((d) => {
        const enSites = P.en.days[d.day - 1].sites;
        return {
          _key: `${key}-${l}-${d.day}`, _type: 'itineraryDay', lang: l, day: d.day, place: d.place, title: d.title,
          ...(d.segments ? { segments: d.segments.map((sg, i) => ({ _key: `g${i}`, _type: 'daySegment', label: sg.label, ...(sg.heading ? { heading: sg.heading } : {}), text: sg.text })) } : { body: d.body.map(para) }),
          sites: d.sites.map((name, i) => { const g = guideFor(enSites[i]); return { _key: `site${i}`, _type: 'daySite', name, ...(g ? { guideRef: { _type: 'reference', _ref: g, _weak: true } } : {}) }; }),
          ...(d.overnight ? { overnight: d.overnight } : {}),
          meals: d.meals.map((m, i) => ({ _key: `m${i}`, _type: 'dayMeal', meal: m.meal, ...(m.note ? { note: m.note } : {}) })),
          travel: d.travel, ...(d.pace ? { pace: d.pace } : {}),
          optional: d.optional.map((text, i) => ({ _key: `o${i}`, _type: 'dayOptional', text, ...(/extra ticket|entrada.* (extra|aparte)|entradas extra|別途チケット|別途入場券/i.test(text) ? { cost: 'extraTicket' } : {}) })),
          narrativeRefs: [], source: SRC, needsReview: false, overnightNeedsReview: false,
        };
      }),
      intro: {
        _key: `intro-${l}`, _type: 'itineraryIntro', lang: l, opening: p.opening, whyRoute: p.whyRoute, whyRouteRefs: [],
        ...(p.daysNote ? { daysNote: p.daysNote } : {}), ...(p.closingLine ? { closingLine: p.closingLine } : {}),
        panelRows: p.panelRows.map((r, i) => row(`pr${i}`, { ...r, text: panelText(l, r.text) })),
        stayRows: p.stayRows.map((r, i) => row(`sr${i}`, r)),
        fitFor: p.fitFor, worthKnowing: p.worthKnowing, ...(p.makeItYoursIntro ? { makeItYoursIntro: p.makeItYoursIntro } : {}),
        source: SRC, needsReview: false,
      },
      included: p.included.map((t, i) => ({ _key: `${key}-in-${l}-${i}`, _type: 'productFact', lang: l, text: t, source: SRC, needsReview: false })),
      excluded: p.excluded.map((x, i) => ({ _key: `${key}-ex-${l}-${i}`, _type: 'productFact', lang: l, text: x.text, source: SRC, needsReview: false })),
      options: p.options.map((t, i) => ({ _key: `${key}-opt-${l}-${i}`, _type: 'productFact', lang: l, text: t, source: SRC, needsReview: false })),
    };
  }
  const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));
  const intl = (type, m) => LANGS.map((l) => ({ _key: l, _type: type, value: m[l] }));
  const doc = {
    title: intl('internationalizedArrayStringValue', Object.fromEntries(LANGS.map((l) => [l, P[l].title]))),
    summary: intl('internationalizedArrayTextValue', Object.fromEntries(LANGS.map((l) => [l, P[l].opening]))),
    shapeOfDay: { ...(existing.shapeOfDay ?? {}), where: intl('internationalizedArrayTextValue', WHERE) },
    durationDays: days,
    itineraryDays: LANGS.flatMap((l) => B[l].days),
    itineraryIntro: LANGS.map((l) => B[l].intro),
    inclusions: LANGS.flatMap((l) => B[l].included),
    exclusions: LANGS.flatMap((l) => B[l].excluded),
    customisationOptions: LANGS.flatMap((l) => B[l].options),
    routeLegs: [],
    ...(cfg.cities && !(existing.cities ?? []).length ? { cities: cfg.cities.map((id) => ({ _key: id, _type: 'reference', _ref: id })) } : {}),
  };
  const F = ['itineraryDays', 'itineraryIntro', 'inclusions', 'exclusions', 'customisationOptions'];
  for (const f of F) doc[f] = curlyRows(doc[f], 'en');
  for (const l of LANGS) {
    const rows = F.flatMap((f) => doc[f].filter((r) => r.lang === l));
    verbatimPreflight([...visibleStrings(rows, l).filter((x) => x !== 'strong'), P[l].title, WHERE[l], P[l].opening], [LOCKED[l]]);
  }
  await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

  const unset = cfg.price === 'keep' ? [] : ['priceFrom', 'guideLanguagePrices'];
  const linked = B.en.days.reduce((a, d) => a + d.sites.filter((s) => s.guideRef).length, 0), sites = B.en.days.reduce((a, d) => a + d.sites.length, 0);
  console.log(`\n== ${slug} (${existing._id})`);
  console.log(`  days ${existing.durationDays} → ${days} · price €${existing.priceFrom ?? '—'} ${unset.length ? 'REMOVED' : 'kept'} · cities ${(existing.cities ?? []).length} · sites linked ${linked}/${sites}`);
  for (const l of LANGS) console.log(`  ${l}: ${P[l].title}\n    days: ${B[l].days.map((d) => `${d.day} ${d.place} [${d.meals.map((m) => m.meal[0]).join('')}]`).join(' | ')}`);
  for (const f of F) console.log(`  ${f}: ${(existing[f] ?? []).length} → ${doc[f].length}`);
  if (doc.cities) console.log(`  cities set: ${cfg.cities.join(', ')}`);
  else if (!(existing.cities ?? []).length) console.log('  ⚠ no cities set on this tour');

  if (apply) {
    await writeRollback(client, [existing._id], 'before-old-package-batch');
    const tx = client.patch(existing._id).set(doc);
    await (unset.length ? tx.unset(unset) : tx).commit();
    console.log(`APPLIED: ${existing._id}`);
  }
}
if (only && !n) throw new Error(`--only ${only}: not in config`);
if (!apply) console.log(`\ndry run, ${n} package(s) (pass --apply --flags-approved to write production)`);
