/**
 * The five airport-transfer pages in the day-tour format, per car, EN + ES + JA together.
 * Owner, 18–19 Nov: ONE page per city for both directions (arrival, departure or both ways,
 * the same price each way), priced PER CAR by area (Autoura's zones), a car for 1–2 and a van
 * for 3–8 (9+ on request), "meet and assist" at the gate as a per-booking add-on, no child
 * discount; Spanish and Japanese from the approved English (19 Nov). "Do everything and wait for
 * the cards … postpone the rates as a last step": this script is complete except the prices,
 * which come from airport-transfer-prices.json — a page is applied ONLY when every figure for it
 * is filled; until then it runs as a dry run / preview.
 *
 *   cairo            tour.transfer-from-cairo-airport-to-hotel     /transfer-from-cairo-airport-to-hotel
 *                    (the departure page tour.transfer-from-hotel-to-airport is retired into it
 *                     by retire-cairo-departure-transfer-2026-11-19.mjs, at publishing)
 *   luxor            tour.gateway-to-the-past-luxor-airport-transfer
 *   aswan            tour.aswan-airport-transfer
 *   hurghada         tour.hurghada-airport-transfer
 *   sharm-el-sheikh  tour.sharm-el-sheikh-airport-transfer
 *
 * Each page: priceBasis 'perCar'; priceFrom = the default area's car; one price on every page
 * (no guide, so guideLanguagePrices removed); the panel shows the copy's own rows with the area
 * prices filled in; the "Your day" periods are 'arrival' and 'departure'. "More about this day"
 * keeps the old essay's description of the place and drops what the page now corrects (the
 * USD 25 visa fee, the "Winner International Tours" sign, Aswan's airport "on the east bank",
 * Sharm's "no visas on arrival" and "further down towards Nabq", old closing lines, helper notes
 * and a stray "change the order of the visits" line).
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-airport-transfers-2026-11-19.mjs --only aswan             # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-airport-transfers-2026-11-19.mjs --only aswan --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-airport-transfers-2026-11-19.mjs --only aswan --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
// --prices <file> reads another prices file (tests); the default is the repo's.
const PRICES_FILE = args.includes('--prices') ? args[args.indexOf('--prices') + 1] : new URL('scripts/day-tour-format/airport-transfer-prices.json', ROOT);
const PRICES = JSON.parse(readFileSync(PRICES_FILE, 'utf8'));

// Per page: the document, the old prices it must still have (or the new ones, on a re-run),
// the duration, and the old essay's blocks the page now replaces (closing line + skipped),
// per language — block keys read from production on 19 Nov.
const PRODUCTS = {
  cairo: {
    id: 'tour.transfer-from-cairo-airport-to-hotel', oldPrices: [35, 46, 53],
    durationLabel: { en: '35 min–1 h+', es: '35 min–1 h o más', ja: '35分〜1時間以上' }, durationHours: 1,
    // visa "USD 25" · "Winner International Tours" sign · closing (2nd half) · "still yours to handle" note · empty / stray tour line
    closingRef: { en: '000000000013', es: '000000000015', ja: '000000000017' },
    skip: { en: ['00000000000d', '00000000000f', '000000000015', '000000000023', '000000000026'], es: ['00000000000f', '000000000011', '000000000017', '000000000027', '00000000002a'], ja: ['000000000011', '000000000013', '000000000019', '000000000027', '00000000002a'] },
  },
  luxor: {
    id: 'tour.gateway-to-the-past-luxor-airport-transfer', oldPrices: [34, 45, 52],
    durationLabel: { en: '15–30 min', es: '15–30 min', ja: '15〜30分' }, durationHours: 0.5,
    // visa "USD 25" · closing (2nd half) · helper note · empty
    closingRef: { en: '00000000001d', es: '00000000001f', ja: '000000000023' },
    skip: { en: ['00000000000c', '00000000001f', '00000000002d', '000000000030'], es: ['00000000000e', '000000000021', '000000000031', '000000000034'], ja: ['000000000012', '000000000025', '000000000033', '000000000036'] },
  },
  aswan: {
    id: 'tour.aswan-airport-transfer', oldPrices: [33, 44, 51],
    durationLabel: { en: '30–45 min', es: '30–45 min', ja: '30〜45分' }, durationHours: 0.75,
    // "on the east bank" · visa "$25" · the drive seen from the east · "A note on the visa" + "$25" · closing (2nd half) · helper note · empty
    closingRef: { en: '000000000015', es: '000000000017', ja: '00000000001b' },
    skip: { en: ['000000000005', '00000000000b', '00000000000f', '000000000011', '000000000013', '000000000017', '000000000025', '000000000028'], es: ['000000000007', '00000000000d', '000000000011', '000000000013', '000000000015', '000000000019', '000000000029', '00000000002c'], ja: ['00000000000b', '000000000011', '000000000015', '000000000017', '000000000019', '00000000001d', '00000000002b', '00000000002e'] },
  },
  hurghada: {
    id: 'tour.hurghada-airport-transfer', oldPrices: [12, 23, 30],
    durationLabel: { en: '15 min–2 h', es: '15 min–2 h', ja: '15分〜2時間' }, durationHours: 1,
    // visa "USD 25" · "Visa costs" heading + "USD 25" + e-visa · closing (2nd half) · "USD 25" note · empty
    closingRef: { en: '000000000029', es: '000000000031', ja: '00000000002f' },
    skip: { en: ['000000000017', '000000000023', '000000000025', '000000000027', '00000000002b', '000000000039', '00000000003c'], es: ['00000000001d', '000000000029', '00000000002b', '00000000002f', '000000000033', '000000000044'], ja: ['00000000001d', '000000000029', '00000000002b', '00000000002d', '000000000031', '000000000040'] },
  },
  'sharm-el-sheikh': {
    id: 'tour.sharm-el-sheikh-airport-transfer', oldPrices: [42.88, 54, 61],
    durationLabel: { en: '20–45 min', es: '20–45 min', ja: '20〜45分' }, durationHours: 0.5,
    // "no visas on arrival" + "$25" · "further down towards Nabq" · closing (2nd half) · helper note · empty / stray tour line
    closingRef: { en: '00000000001a', es: '00000000001c', ja: '000000000024' },
    skip: { en: ['00000000000c', '000000000018', '00000000001c', '00000000002a', '00000000002d'], es: ['00000000000e', '00000000001a', '00000000001e', '00000000002e', '000000000031'], ja: ['000000000012', '00000000001e', '000000000026', '000000000034', '000000000037'] },
  },
};
// Checked by hand (19 Nov): the gate reads these as figures, the meaning is the EN one.
// ES «los dos / las dos / en los dos» = "both"; JA 2,000万 = twenty million; JA 20〜45分 =
// "twenty to forty-five minutes" (the gate reads "forty-five" as 40 + 5).
const SAME_MEANING = {
  cairo: { es: ['opening', 'closing', 'op0'], ja: ['opening'] },
  luxor: { es: ['opening', 'in0'] },
  aswan: { es: ['opening'] },
  hurghada: { es: ['opening'] },
  'sharm-el-sheikh': { es: ['opening', 'in0'], ja: ['why'] },
};
// Nothing "More about this day" shows may keep what the page corrects.
const RETIRED = {
  en: /USD ?25|\$25|25 ?USD|Winner International|east bank of the Nile|does not issue visas on arrival|further down towards Nabq|change the order/i,
  es: /25 ?USD|USD ?25|\$ ?25|Winner International|orilla oriental del Nilo|no expide visado a la llegada|cambiar el orden/i,
  ja: /25ドル|25 ?USD|\$25|Winner International|ナイル東岸/,
};
const PERIOD = { Arrival: 'arrival', Departure: 'departure', Llegada: 'arrival', Salida: 'departure', 到着: 'arrival', 出発: 'departure' };
const money = (n, l) => (l === 'es' ? `${n} €` : `€${n}`);

/* ── Parse a locked file ──────────────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t]+$/gm, '').trim();
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
function parseLocale(file, l) {
  const md = readFileSync(new URL(file, ROOT), 'utf8');
  const title = clean(md.match(/^# (.+)$/m)[1]);
  const secs = sections(md);
  if (secs.length !== 7) throw new Error(`${file}: expected 7 sections, found ${secs.length}`);
  const [panel, opening, why, day, incl, forYou, mine] = secs;
  const panelLines = panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim()]);
  // The panel's own rows: all but the Type/Duration line and the "From" line (the page writes
  // that one from priceFrom + "per car, each way").
  const ownRows = panelLines.slice(2).map(([label, text]) => ({ label, text }));
  const periods = day.text.split(/\n### /).slice(1).map((chunk) => {
    const [head, ...rest] = chunk.split('\n');
    const [, word, label] = head.match(/^(.+?)\s*[·・]\s*(.+)$/);
    const period = PERIOD[word.trim()];
    if (!period) throw new Error(`${file}: unknown period "${word}"`);
    const stops = [];
    for (const p of paras(rest.join('\n'))) {
      if (p.startsWith('>')) continue; // "More about this day →" pointer
      const lines = p.split('\n');
      const hm = lines[0].match(/^\*\*(.+)\*\*$/);
      if (!hm) throw new Error(`${file}: unexpected paragraph in "${label}": ${p.slice(0, 60)}`);
      const body = lines.slice(1);
      stops.push({ title: clean(hm[1]), ...(body.length ? { text: clean(body.join(' ')) } : {}) });
    }
    return { period, periodLabel: clean(label), stops };
  });
  const sub = (t) => t.split(/\n(?=\*\*)/).map((blk) => ({ h: (blk.match(/^\*\*(.+?)\*\*/) ?? [])[1], items: bullets(blk) })).filter((x) => x.h);
  const [inc, exc] = sub(incl.text);
  const [fit, worth] = sub(forYou.text);
  const tail = paras(mine.text);
  return {
    title, ownRows, periods,
    opening: clean(paras(opening.text)[0]),
    whyThisOrder: clean(paras(why.text)[0]),
    included: inc.items, excluded: exc.items, fitFor: fit.items, worthKnowing: worth.items,
    options: bullets(mine.text),
    closingLine: clean(tail[tail.length - 1].replace(/^\*(.*)\*$/, '$1')),
  };
}

/* ── Prices: the panel rows with every {…} filled, or null when one is missing ── */
function priced(key, rows, l) {
  const pr = PRICES[key];
  const missing = [...pr.areas.filter((a) => a.car == null).map((a) => `${a.en} (car)`), ...(pr.meetAssist == null ? ['meet and assist'] : [])];
  if (missing.length) return { rows: null, missing };
  const out = rows.map((r, i) => {
    const slots = r.text.match(/\{[^}]*\}/g) ?? [];
    if (!slots.length) return r;
    // The first priced row is the area list (one {…} per area, in order); the other is meet and assist.
    const isAreas = slots.length > 1 || rows.findIndex((x) => /\{/.test(x.text)) === i;
    const figures = isAreas ? pr.areas.map((a) => a.car) : [pr.meetAssist];
    if (figures.length !== slots.length) throw new Error(`${key} ${l}: "${r.label}" has ${slots.length} price slot(s), prices give ${figures.length}`);
    let k = 0;
    return { ...r, text: r.text.replace(/\{[^}]*\}/g, () => money(figures[k++], l)) };
  });
  const from = pr.areas.find((a) => a.en === pr.fromArea)?.car;
  if (from == null) throw new Error(`${key}: no car price for the default area ${pr.fromArea}`);
  return { rows: out, from };
}

const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');
const keys = only ? [only] : Object.keys(PRODUCTS);
if (only && !PRODUCTS[only]) throw new Error(`--only: one of ${Object.keys(PRODUCTS).join(', ')}`);
const preview = {};

for (const key of keys) {
  const cfg = PRODUCTS[key];
  const LOCKED = { en: `review/locked/${key}-airport-transfer.md`, es: `review/locked/${key}-airport-transfer.es.md`, ja: `review/locked/${key}-airport-transfer.ja.md` };
  const SRC = (l) => `Locked file ${LOCKED[l]} (EN approved by the owner 18 Nov; ES/JA from it, 19 Nov).`;
  console.log(`\n═══ ${key} — ${cfg.id}`);
  const P = Object.fromEntries(LANGS.map((l) => [l, parseLocale(LOCKED[l], l)]));
  for (const l of ['es', 'ja']) {
    const shape = (p) => JSON.stringify({ rows: p.ownRows.length, periods: p.periods.map((x) => [x.period, x.stops.map((s) => !!s.text)]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
    if (shape(P.en) !== shape(P[l])) throw new Error(`${key} ${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
  }

  // Numeric gate: ES/JA figures equal EN, string by string (panel rows included).
  const flat = (p) => ({
    opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
    ...Object.fromEntries(p.ownRows.map((r, i) => [`row${i}`, r.text])),
    ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text]])).filter(([, v]) => v)),
    ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
    ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
  });
  // Strings checked by hand where the gate reads a word as a figure (ES «los dos/las dos» =
  // "both"; JA counters) — same meaning as EN; listed per page in SAME_MEANING below.
  for (const l of ['es', 'ja']) {
    const en = flat(P.en), lc = flat(P[l]);
    for (const k of SAME_MEANING[key]?.[l] ?? []) { if (!(k in lc)) throw new Error(`${key} ${l}: SAME_MEANING key ${k} not found`); delete en[k]; delete lc[k]; console.log(`numeric gate (${l}): ${k} checked by hand (same meaning)`); }
    if (args.includes('--numeric-report')) { try { numericGate(en, lc, l, { quiet: true }); } catch (e) { console.log(`[${key}] ${e.message}`); } }
    else numericGate(en, lc, l);
  }
  if (args.includes('--numeric-report')) continue;

  // Verbatim: every string checked against the locked copy BEFORE the prices go in.
  const build = (l, rows) => {
    const p = P[l];
    const timeline = p.periods.map((x, pi) => ({
      _key: `dt-${l}-${pi + 1}`, _type: 'dayTourPeriod', lang: l, period: x.period, periodLabel: x.periodLabel,
      stops: x.stops.map((s, si) => ({ _key: `s${pi + 1}-${si + 1}`, _type: 'dayTourStop', title: s.title, ...(s.text ? { text: s.text } : {}) })),
      source: SRC(l), needsReview: false,
    }));
    const fact = (list, prefix) => list.map((t, i) => ({ _key: `${prefix}${i + 1}-${l}`, _type: 'productFact', lang: l, text: t, source: SRC(l), needsReview: false }));
    return {
      timeline,
      intro: {
        _key: `dti-${l}`, _type: 'dayTourIntro', lang: l,
        opening: p.opening, whyThisOrder: p.whyThisOrder,
        panelRows: rows.map((r, i) => ({ _key: `pr${i}`, _type: 'dayPanelRow', ...r })),
        fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
        closingRef: cfg.closingRef[l], skipRefs: cfg.skip[l],
        source: SRC(l), needsReview: false,
      },
      included: fact(p.included, 'atin'), excluded: fact(p.excluded, 'atout'), options: fact(p.options, 'atopt'),
    };
  };
  const unpriced = Object.fromEntries(LANGS.map((l) => [l, build(l, P[l].ownRows)]));
  for (const l of LANGS) {
    const u = unpriced[l];
    const rows = curlyRows([u.intro, ...u.timeline, ...u.included, ...u.excluded, ...u.options], 'en');
    verbatimPreflight([...visibleStrings(rows, l), P[l].title], [LOCKED[l]]);
  }
  await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

  const prices = Object.fromEntries(LANGS.map((l) => [l, priced(key, P[l].ownRows, l)]));
  const ready = LANGS.every((l) => prices[l].rows);
  if (!ready) console.log(`prices: NOT READY — missing ${prices.en.missing.join(', ')} (airport-transfer-prices.json). Nothing can be applied for ${key}.`);
  const B = Object.fromEntries(LANGS.map((l) => [l, ready ? build(l, prices[l].rows) : unpriced[l]]));

  /* ── Document and essay ─────────────────────────────────────────────── */
  const doc = await client.getDocument(cfg.id);
  if (!doc) throw new Error(`${cfg.id} not found`);
  if (doc.type !== 'dayTour') throw new Error(`${cfg.id}: not a day tour`);
  const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es ?? '', doc.guideLanguagePrices?.ja ?? ''].join();
  const okPrice = priceNow === cfg.oldPrices.join() || (doc.priceBasis === 'perCar' && priceNow === [doc.priceFrom, '', ''].join());
  if (!okPrice) throw new Error(`${key}: unexpected prices ${priceNow}`);
  for (const row of doc.body ?? []) {
    const l = row._key;
    if (!cfg.skip[l]) continue;
    const blockKeys = new Set(row.value.map((b) => b._key));
    for (const k of [cfg.closingRef[l], ...cfg.skip[l]]) if (!blockKeys.has(k)) throw new Error(`${key} ${l}: essay block ${k} missing`);
    const hidden = new Set([cfg.closingRef[l], ...cfg.skip[l]]);
    for (const b of row.value) if (!hidden.has(b._key) && RETIRED[l].test(textOf(b))) throw new Error(`${key} ${l} ${b._key}: "More about this day" would still show "${textOf(b).match(RETIRED[l])[0]}"`);
  }

  const set = {
    title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
    durationLabel: LANGS.map((l) => ({ ...(doc.durationLabel?.find((t) => t._key === l) ?? { _key: l, _type: 'internationalizedArrayStringValue' }), value: cfg.durationLabel[l] })),
    durationHours: cfg.durationHours,
    priceBasis: 'perCar',
    ...(ready ? { priceFrom: prices.en.from } : {}),
    dayTourIntro: LANGS.map((l) => B[l].intro),
    dayTimeline: LANGS.flatMap((l) => B[l].timeline),
    inclusions: LANGS.flatMap((l) => B[l].included),
    exclusions: LANGS.flatMap((l) => B[l].excluded),
    customisationOptions: LANGS.flatMap((l) => B[l].options),
  };
  for (const f of ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions']) set[f] = curlyRows(set[f], 'en');

  for (const f of Object.keys(set)) {
    const v = set[f];
    console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
  }
  for (const l of LANGS) {
    console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
    console.log(`  panel ${l}: ${B[l].intro.panelRows.map((r) => `${r.label}: ${r.text}`).join(' | ').slice(0, 400)}`);
    console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.period, x.periodLabel, x.stops.map((s) => s.title)]))}`);
    const essay = doc.body.find((r) => r._key === l)?.value ?? [];
    const hidden = new Set([cfg.closingRef[l], ...cfg.skip[l]]);
    console.log(`  essay ${l}: ${essay.length} blocks, ${essay.filter((b) => !hidden.has(b._key)).length} shown under "More about this day"`);
  }

  if (previewOut) {
    const cityIds = (doc.cities ?? []).map((c) => c._ref).filter(Boolean);
    const cities = cityIds.length ? await client.fetch('*[_id in $ids]', { ids: cityIds }) : [];
    // As the write leaves it: guideLanguagePrices is unset (one price on every page).
    const { guideLanguagePrices: _gone, ...kept } = doc;
    const dataset = [{ ...kept, ...set, ...(ready ? {} : { priceFrom: doc.priceFrom }) }, ...cities];
    const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
    preview[key] = {};
    for (const l of LANGS) {
      const slug = doc.slug.find((s) => s._key === l).value.current;
      const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
      preview[key][l] = Object.fromEntries(['title', 'priceFrom', 'priceBasis', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours'].map((f) => [f, r?.[f]]));
    }
  }

  if (apply) {
    if (!ready) throw new Error(`${key}: prices not ready — fill airport-transfer-prices.json from Autoura first (owner: publish only when every area has a card).`);
    await writeRollback(client, [cfg.id], `before-airport-transfer-${key}`);
    await client.patch(cfg.id).set(set).unset(['guideLanguagePrices']).commit();
    console.log(`APPLIED to production ${cfg.id}`);
  }
}
if (previewOut) { writeFileSync(previewOut, JSON.stringify(preview, null, 1)); console.log(`\npreview → ${previewOut}`); }
if (!apply && !previewOut) console.log('\ndry run (prices filled + --apply --flags-approved writes production)');
