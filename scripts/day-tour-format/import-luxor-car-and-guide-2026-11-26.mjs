/**
 * Private Car & Guide in Luxor in the day-tour format, EN + ES + JA together, the way the Cairo and
 * Aswan car and guide pages were done (import-cairo-car-and-guide-2026-11-19.mjs, PR #306).
 *
 *   tour  wp-page-88169   /luxor-private-car-and-guide   (URL unchanged, no redirect)
 *
 * The product (owner, 22 Nov, the locked copy + its open items "Resolved"): a private car, driver
 * and Egyptologist guide in the guest's language for up to 8 hours; the guest chooses the sites;
 * one crossing of the river (start on either bank, back to the hotel or ship on whichever side).
 * Included: car and driver, guide, hotel/ship pickup and return, water, the driver's tip.
 * Not included: entrance tickets, lunch (owner-approved exception to rule 6, as Cairo/Aswan),
 * drinks, airport transfers, the guide's tip. Tiers and the minimum-age line retired; the
 * children-under-12 rule row is the page's own. Pickup zones come from Autoura at booking.
 *
 * Price (Autoura T2E-DT-LXR-03, read 26 Nov): the engine's figure for 2 travellers sharing, per
 * person, house margin 30 %, higher of EU / other, rounded UP to the whole euro:
 *   English guide €62.41 → €63 · Spanish guide €73.28 → €74 · Japanese guide €89.59 → €90
 * (car EXTENDED-DAY-TOUR EGP 3,200, the guide in the page's language, water). Owner, 26 Nov:
 * "Both-banks car": LXR-03 was set to long_day_tour (autoura-saas scripts/tmp-t2e/lxr03-long-day.mts,
 * snapshot lxr03.before.json) so the engine picks that car instead of the East Bank-only card
 * (EGP 1,100 → €40 / €51 / €67). No attractions added: guide_only, no entrance fees.
 * ES locked copy: "impresionantes" (banned word) → "imponentes", owner 26 Nov.
 *
 * Essay (Gate A.3, the open items' table): "Egyptologist guide in your language" (#1); the
 * minimum-age line out; "his vast mortuary temple" (#3); "Luxor charges per site" (#4); "Begin."
 * and the Tier 2 superlatives kept; no lunch or back-and-forth crossing in it (#6, #7, checked).
 * The old closing line (now the page's own), the helper note and ES standfirst are not shown.
 *
 *   node -r dotenv/config scripts/day-tour-format/import-luxor-car-and-guide-2026-11-26.mjs              # dry run
 *   npx tsx --env-file=.env scripts/day-tour-format/import-luxor-car-and-guide-2026-11-26.mjs --preview <out.json>
 *   node -r dotenv/config scripts/day-tour-format/import-luxor-car-and-guide-2026-11-26.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-88169';
const OLD = { from: 73, es: 84, ja: 91 };
// From Autoura T2E-DT-LXR-03 for 2 travellers on the EXTENDED-DAY-TOUR car (26 Nov): €62.41 / €73.28 / €89.59, rounded up.
const NEW = { from: 63, es: 74, ja: 90 };
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/luxor-private-car-and-guide-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (22 Nov 2026; price from Autoura T2E-DT-LXR-03 for 2 travellers).`;

const G = {
  vok: 'guideArticle.luxor.valley-of-the-kings',
  hatshepsut: 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut',
  colossi: 'guideArticle.luxor.the-colossi-of-memnon',
  karnak: 'guideArticle.luxor.the-karnak-temple',
  luxor: 'guideArticle.luxor.the-luxor-temple',
};
// Per stop with sites, in file order, one entry per site on its line (the Hypostyle Hall is part of Karnak's page).
const SITE_GUIDES = [[G.vok], [G.hatshepsut], [G.colossi], [G.karnak, null], [G.luxor]];
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
  // "### Morning · Pickup and the first stops" / "### Choose your stops" (ending with the way back)
  const parts = day.text.split(/\n### /).slice(1);
  if (parts.length !== 2) throw new Error(`${l}: expected 2 parts of the day, found ${parts.length}`);
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
// Same meaning, checked by hand 26 Nov (the open items' numeric-gate note): JA writes 1名様 (EN "one
// traveller"), ラムセス2世 / アメンヘテプ3世 (EN Ramses II / Amenhotep III, Roman numerals); ES writes 1500.
// JA writes some figures in kanji, which the gate cannot read: why = 二、三か所 (two or three) · 五か所;
// p1s0.x = 六十を超える (more than sixty) · 三つ; p1s1.x = 三段 (three terraces) · 約二十年 (some twenty years).
const SAME_MEANING = { es: [], ja: ['why', 'p1s0.x', 'p1s1.x'] };
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
if (await client.getDocument(`drafts.${DOC_ID}`)) throw new Error('a draft exists: resolve it first');
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja].join();
const priceNew = [NEW.from ?? OLD.from, NEW.es ?? OLD.es, NEW.ja ?? OLD.ja].join();
if (![[OLD.from, OLD.es, OLD.ja].join(), priceNew].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const missing = ['from', 'es', 'ja'].filter((l) => NEW[l] == null);
if (missing.length) console.log(`⚠ price not set yet (${missing.join(' / ')}): the live €${OLD.from} / €${OLD.es} / €${OLD.ja} kept in this run; --apply refuses`);
if (apply && missing.length) throw new Error('--apply refused: the owner has not chosen the Autoura price yet (T2E-DT-LXR-03 car card)');
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// The old closing line ("Luxor does not need embellishment…"), now the page's own closing.
const CLOSING_REF = { en: '000000000038', es: '00000000003b', ja: '000000000032' };
// The helper note (now "Make it your own") · the empty last block · ES: the standfirst.
const SKIP = {
  en: ['000000000048', '00000000004b'],
  es: ['000000000003', '00000000004d', '000000000050'],
  ja: ['000000000042', '000000000045'],
};
// [block, find, replace] — the open items' essay corrections (owner, 22 Nov).
const FIX = {
  en: [
    ['000000000005', 'a private, English-speaking Egyptologist guide', 'a private Egyptologist guide in your language'],
    // Bold runs: "licensed, English-speaking Egyptologist guide"; "There is " + **no minimum age** + " — families…".
    ['000000000015', 'licensed, English-speaking Egyptologist guide', 'licensed Egyptologist guide in your language'],
    ['000000000015', ' vehicle. There is ', ' vehicle. '],
    ['000000000015', 'no minimum age', ''],
    ['000000000015', ' — families are welcome — though', 'Families are welcome, though'],
    ['000000000025', 'what was the largest mortuary temple ever built in Egypt', 'what was his vast mortuary temple'],
    ['000000000032', "As of 2026, Luxor's ticketing structure charges per site", 'Luxor charges per site'],
  ],
  es: [
    ['000000000007', 'guía egiptólogo licenciado de habla hispana', 'guía egiptólogo licenciado en su idioma'],
    ['000000000017', 'guía egiptólogo licenciado de habla hispana', 'guía egiptólogo licenciado en su idioma'],
    ['000000000017', 'No hay edad mínima', ''],
    ['000000000017', ' —las familias son bienvenidas—, aunque', 'Las familias son bienvenidas, aunque'],
    ['000000000027', 'lo que fue el mayor templo funerario jamás construido en Egipto', 'lo que fue su vasto templo funerario'],
    ['000000000035', 'A día de 2026, la estructura de boletería de Luxor cobra por sitio', 'Luxor cobra por sitio'],
  ],
  ja: [
    ['00000000000b', 'プライベートの英語対応のエジプト学ガイド', 'ご希望の言語で案内するプライベートのエジプト学ガイド'],
    ['00000000001e', 'かつてエジプトでこれまでに築かれた最大の葬祭殿への入口', 'かつて彼の広大な葬祭殿への入口'],
    ['00000000002c', '2026年現在、ルクソールのチケット制度は遺跡ごとに課金し', 'ルクソールは遺跡ごとに課金し'],
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
  en: /English-speaking|minimum age|largest mortuary temple|As of 2026|ticketing structure|lunch/i,
  es: /habla hispana|edad mínima|mayor templo funerario|A día de 2026|boletería|almuerzo/i,
  ja: /英語対応|最大の葬祭殿|2026年|チケット制度|昼食|ランチ/,
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
  priceFrom: NEW.from ?? doc.priceFrom,
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
  await writeRollback(client, [DOC_ID], 'before-luxor-car-and-guide');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
