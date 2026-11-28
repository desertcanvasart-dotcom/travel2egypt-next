/**
 * Cairo Nile dinner cruise in the day-tour format, EN + ES + JA together. Owner, 19 Nov: the
 * locked copy (cairo-nile-dinner-cruise, with its open-items answers); prices last, from Autoura.
 *
 *   tour  tour.cairo-dinner-cruise-with-belly-dancing-show   /cairo-dinner-cruise-with-belly-dancing-show
 *
 * The product (owner, 19 Nov): always all-inclusive (private transfers, the shared dinner
 * cruise, dinner, the live show). The one choice is the dinner and its boat, each priced
 * separately: a buffet on the Nile Pharaoh, a set menu on the Nile Maxim. Children 5–11 pay
 * 50 %. Drinks not included (paid on board, card or cash). No guide, so one price in every
 * language (guideLanguagePrices is unset).
 *
 * Panel: the page's own rows (the two options with their prices, children, pickup, extra-charge
 * areas, back, dinner), in place of the rule rows (no guide row, no lunch row). The header's
 * "From" = the lower of the two boat prices (cairo-dinner-cruise-prices.json, null until
 * Autoura prices them; --apply refuses until both are filled).
 *
 * Boat names: italics removed on the page (the site writes no inline italics; JA never had them).
 *
 * Essay (Gate A.3, the open items' corrections): drinks → paid on board; "package tier" → the
 * two boats, each priced separately; "most exported" → "one of Egypt's best-known exports";
 * the minimum age 18 removed; the JA "Package A / B" paragraph, the old tier note, the closing's
 * second half and the ES lead line are left out.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-cairo-dinner-cruise-2026-11-19.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-cairo-dinner-cruise-2026-11-19.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-cairo-dinner-cruise-2026-11-19.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'tour.cairo-dinner-cruise-with-belly-dancing-show';
const OLD = { from: 74, es: 85, ja: 92 };
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/cairo-nile-dinner-cruise-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const PRICES = JSON.parse(readFileSync(new URL('./cairo-dinner-cruise-prices.json', import.meta.url), 'utf8'));
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (19 Nov 2026; prices from Autoura for 2 travellers).`;

const DURATION_LABEL = { en: '4 hrs', es: '4 h', ja: '4時間' };
const PERIOD = { Evening: 'evening', Noche: 'evening', 夜: 'evening' };
const PICKUP = { en: 'Pickup', es: 'Recogida', ja: 'お迎え' };
// "from €X" after each option in the panel (2 travellers; the price moves with group size).
const FROM = { en: (n) => `from €${n}`, es: (n) => `desde ${n} €`, ja: (n) => `€${n}〜` };
const OPT_SEP = { en: ': ', es: ': ', ja: '：' };

/* ── Parse ────────────────────────────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t]+$/gm, '').trim();
const plain = (s) => clean(s.replace(/\*\*|\*/g, ''));
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
// Strings the page writes by joining verbatim pieces (each piece is checked on its own).
const joined = { en: [], es: [], ja: [] };
const join = (l, pieces, sep) => { joined[l].push(pieces); return pieces.join(sep); };
function parseLocale(l) {
  const md = readFileSync(new URL(LOCKED[l], ROOT), 'utf8');
  const title = plain(md.match(/^# (.+)$/m)[1]);
  const secs = sections(md);
  if (secs.length !== 7) throw new Error(`${l}: expected 7 sections, found ${secs.length}`);
  const [panel, opening, why, day, incl, forYou, mine] = secs;
  // Panel: line 1 = Type/Duration (the header), then the options heading + its two bullets,
  // then From (the page writes it from priceFrom), then the page's own rows.
  const lines = panel.text.split('\n').map((x) => x.trim()).filter((x) => x && x !== '---');
  const optHead = lines[1].match(/^\*\*(.+?)[:：]\*\*\s*$/);
  if (!optHead) throw new Error(`${l}: panel line 2 is not the options heading: ${lines[1]}`);
  const optionBullets = bullets(panel.text).map(plain);
  if (optionBullets.length !== 2) throw new Error(`${l}: expected 2 boat options, found ${optionBullets.length}`);
  const rowMatch = (x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/);
  const afterBullets = lines.slice(2).filter((x) => !x.startsWith('- '));
  if (!/\{/.test(afterBullets[0])) throw new Error(`${l}: expected the From line after the options, found ${afterBullets[0]}`);
  const rows = afterBullets.slice(1).map(rowMatch).map((m) => { if (!m) throw new Error(`${l}: bad panel row`); return { label: plain(m[1]), text: plain(m[2]) }; });
  const periods = day.text.split(/\n### /).slice(1).map((chunk) => {
    const [head, ...rest] = chunk.split('\n');
    const [, word, label] = head.match(/^(.+?)\s*[·・]\s*(.+)$/);
    const period = PERIOD[word.trim()];
    if (!period) throw new Error(`${l}: unknown period "${word}"`);
    const stops = [];
    for (const p of paras(rest.join('\n'))) {
      if (p.startsWith('>')) continue; // "More about this evening →" pointer
      const ls = p.split('\n');
      const hm = ls[0].match(/^\*\*(.+)\*\*$/);
      if (!hm) { // a plain paragraph closes the stop before it ("Both boats moor…")
        const prev = stops[stops.length - 1];
        prev.pieces.push(plain(p));
        continue;
      }
      const site = ls.find((x) => /^\*?(Sites|Lugares)[:：]|^見学地[:：]/.test(x));
      const body = ls.slice(1).filter((x) => x !== site);
      // Bullets (the two boats) become sentences of the stop, each piece verbatim.
      const pieces = body.length ? (body.some((x) => x.startsWith('- ')) ? body.map((x) => plain(x.replace(/^- /, ''))) : [plain(body.join(' '))]) : [];
      const siteText = site ? plain(site.replace(/^\*?(Sites|Lugares)[:：]\*?[:：]?\s*|^見学地[:：]\s*/, '')) : null;
      // Two sites: split on the FIRST separator only (JA カイロ・タワー keeps its own dot).
      const sites = siteText ? (() => { const m = siteText.match(/^(.+?)\s*[·・]\s*(.+)$/); return m ? [m[1], m[2]] : [siteText]; })() : [];
      stops.push({ title: plain(hm[1]), pieces, sites });
    }
    return {
      period, periodLabel: plain(label),
      stops: stops.map((s) => ({ title: s.title, ...(s.pieces.length ? { text: s.pieces.length > 1 ? join(l, s.pieces, l === 'ja' ? '' : ' ') : s.pieces[0] } : {}), sites: s.sites })),
    };
  });
  const sub = (t) => t.split(/\n(?=\*\*)/).map((blk) => ({ h: (blk.match(/^\*\*(.+?)\*\*/) ?? [])[1], items: bullets(blk).map(plain) })).filter((x) => x.h);
  const [inc, exc] = sub(incl.text);
  const [fit, worth] = sub(forYou.text);
  const tail = paras(mine.text);
  return {
    title, optionsLabel: plain(optHead[1]), optionBullets, rows, periods,
    opening: plain(paras(opening.text)[0]), whyThisOrder: plain(paras(why.text)[0]),
    included: inc.items, excluded: exc.items, fitFor: fit.items, worthKnowing: worth.items,
    options: bullets(mine.text).map(plain), closingLine: plain(tail[tail.length - 1]),
  };
}
const P = Object.fromEntries(LANGS.map((l) => [l, parseLocale(l)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ rows: p.rows.length, periods: p.periods.map((x) => [x.period, x.stops.map((s) => [!!s.text, s.sites.length])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
for (const l of LANGS) if (!P[l].rows.some((r) => r.label === PICKUP[l])) throw new Error(`${l}: no pickup row`);

/* ── Numeric gate ─────────────────────────────────────────────────────── */
const flat = (p) => ({
  opening: p.opening, why: p.whyThisOrder, closing: p.closingLine, optLabel: p.optionsLabel,
  ...Object.fromEntries(p.optionBullets.map((t, i) => [`ob${i}`, t])),
  ...Object.fromEntries(p.rows.map((r, i) => [`row${i}`, r.text])),
  ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text]])).filter(([, v]) => v)),
  ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
  ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
});
// Checked by hand (19 Nov): ES «Los dos barcos» = "both boats" (the gate reads «dos» as 2).
const SAME_MEANING = { es: ['p0s1.x'], ja: [] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
  for (const k of SAME_MEANING[l]) { if (!(k in lc)) throw new Error(`${l}: SAME_MEANING key ${k} not found`); delete en[k]; delete lc[k]; console.log(`numeric gate (${l}): ${k} checked by hand (same meaning)`); }
  numericGate(en, lc, l);
}

/* ── Prices ───────────────────────────────────────────────────────────── */
const figures = [PRICES.nilePharaohBuffet, PRICES.nileMaximSetMenu];
const ready = figures.every((n) => typeof n === 'number' && n > 0);
// The options row: "Buffet dinner on the Nile Pharaoh, from €X · Set-menu dinner on the Nile Maxim, from €Y".
const optionsRow = (l, priced) => ({
  label: P[l].optionsLabel,
  text: priced
    ? P[l].optionBullets.map((b, i) => `${b}${OPT_SEP[l]}${FROM[l](figures[i])}`).join(' · ')
    : join(l, P[l].optionBullets, ' · '),
});

/* ── Build ────────────────────────────────────────────────────────────── */
function build(l, priced) {
  const p = P[l];
  const timeline = p.periods.map((x, pi) => ({
    _key: `dt-${l}-${pi + 1}`, _type: 'dayTourPeriod', lang: l, period: x.period, periodLabel: x.periodLabel,
    stops: x.stops.map((s, si) => ({
      _key: `s${pi + 1}-${si + 1}`, _type: 'dayTourStop', title: s.title, ...(s.text ? { text: s.text } : {}),
      ...(s.sites.length ? { sites: s.sites.map((name, k) => ({ _key: `x${pi + 1}${si + 1}${k}`, _type: 'dayTourSite', name })) } : { skipGlance: true }),
    })),
    source: SRC(l), needsReview: false,
  }));
  const rows = [optionsRow(l, priced), ...p.rows];
  const fact = (list, prefix) => list.map((t, i) => ({ _key: `${prefix}${i + 1}-${l}`, _type: 'productFact', lang: l, text: t, source: SRC(l), needsReview: false }));
  return {
    timeline,
    intro: {
      _key: `dti-${l}`, _type: 'dayTourIntro', lang: l,
      opening: p.opening, whyThisOrder: p.whyThisOrder,
      pickupLine: p.rows.find((r) => r.label === PICKUP[l]).text,
      panelRows: rows.map((r, i) => ({ _key: `pr${i}`, _type: 'dayPanelRow', ...r })),
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'dcin'), excluded: fact(p.excluded, 'dcout'), options: fact(p.options, 'dcopt'),
  };
}

// Verbatim on the unpriced build: every string from the locked copy; joined strings only when
// each of their pieces is.
const unpriced = Object.fromEntries(LANGS.map((l) => [l, build(l, false)]));
for (const l of LANGS) {
  const u = unpriced[l];
  const rows = curlyRows([u.intro, ...u.timeline, ...u.included, ...u.excluded, ...u.options], 'en');
  verbatimPreflight(joined[l].flat(), [LOCKED[l]]);
  const allow = Object.fromEntries(joined[l].map((pieces) => [pieces.join(l === 'ja' ? '' : ' '), 'verbatim pieces joined']).concat(joined[l].map((pieces) => [pieces.join(' · '), 'the two option bullets in one row'])));
  verbatimPreflight([...visibleStrings(rows, l), P[l].title], [LOCKED[l]], allow);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });
// Owner rule (27 Nov): a missing Autoura price never holds the itinerary back. Unpriced, the page
// publishes with both options listed, no figures, and the old single price REMOVED.
if (!ready) console.log('prices: NOT READY — publishing WITHOUT a price (old From removed); fill cairo-dinner-cruise-prices.json from Autoura and re-run to add both boats.');
const B = Object.fromEntries(LANGS.map((l) => [l, ready ? build(l, true) : unpriced[l]]));

/* ── Document and essay ───────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (doc.type !== 'dayTour') throw new Error('not a day tour');
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es ?? '', doc.guideLanguagePrices?.ja ?? ''].join();
const fromNew = ready ? Math.min(...figures) : null;
if (![[OLD.from, OLD.es, OLD.ja].join(), [fromNew, '', ''].join(), ',,'].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

const CLOSING_REF = { en: '000000000019', es: '00000000001b', ja: '000000000021' };
// The closing's second half · the old tier note · (ES) the lead line · (JA) Package A / B.
const SKIP = {
  en: ['00000000001b', '00000000002a'],
  es: ['00000000001d', '00000000002e', '000000000003'],
  ja: ['000000000023', '000000000032', '00000000000f'],
};
// [block, find, replace] — the open items' essay corrections (owner, 19 Nov).
const FIX = {
  en: [
    ['000000000005', 'It suits adults — the minimum age is 18 — and works equally well', 'Families are welcome, and it works equally well'],
    ['000000000007', 'Belly-dancing is Egypt\'s most exported art form', 'Belly-dancing is one of Egypt’s best-known exports'],
    ['00000000000d', 'The open buffet (or set-menu dinner, depending on which package tier you select) leans on', 'Dinner, a buffet on the Nile Pharaoh or a set menu on the Nile Maxim, each priced separately, leans on'],
    ['00000000000d', 'Beverages are available; soft drinks are typically included, alcohol is an additional charge.', 'Drinks are extra: you order them on board and pay there, by card or in cash.'],
  ],
  es: [
    ['000000000007', 'Es para adultos —la edad mínima es 18 años— y funciona', 'Las familias son bienvenidas, y funciona'],
    ['000000000009', 'La danza oriental es la forma artística egipcia más exportada', 'La danza oriental es una de las exportaciones más conocidas de Egipto'],
    ['00000000000f', 'El bufé abierto (o cena de menú, según el nivel de paquete elegido) se apoya en', 'La cena, un bufé en el Nile Pharaoh o un menú en el Nile Maxim, cada uno con su propio precio, se apoya en'],
    ['00000000000f', 'Las bebidas están disponibles; los refrescos suelen estar incluidos y el alcohol se cobra aparte.', 'Las bebidas se pagan aparte: se piden a bordo y se pagan allí, con tarjeta o en efectivo.'],
  ],
  ja: [
    ['00000000000b', '大人向けで——参加年齢は18歳以上——カイロでの', 'ご家族でも楽しめ、カイロでの'],
    ['00000000000d', 'ベリーダンスはエジプトが最も多く海外へ送り出してきた芸術形式であり、', 'ベリーダンスはエジプトを代表する、世界に知られた芸術のひとつであり、'],
    ['000000000015', 'オープン・ビュッフェ（あるいはお選びのパッケージの段階により、セットメニューの夕食）は、', '夕食は、ナイル・ファラオ号でのビュッフェか、ナイル・マキシム号でのコース料理（料金はそれぞれ異なります）で、'],
    ['000000000015', '飲み物もご用意があります。ソフトドリンクは通常含まれ、アルコールは追加料金です。', 'お飲み物は料金に含まれません。船上でご注文いただき、その場でカードまたは現金でお支払いください。'],
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
        if (i < 0 && children.some((c) => c.text.includes(repl))) continue; // re-run
        if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
        children[i].text = children[i].text.replace(alts.find((x) => children[i].text.includes(x)), repl);
      }
      return { ...b, children };
    }),
  };
});
// Nothing "More about this evening" shows may keep what the page corrects.
const RETIRED = {
  en: /minimum age|adults|most exported|package tier|soft drinks|transfer-only|Package [AB]/i,
  es: /edad mínima|para adultos|más exportada|nivel de paquete|refrescos|solo de traslado/i,
  ja: /18歳|大人向け|最も多く海外|パッケージ|ソフトドリンク/,
};
for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const hidden = new Set([CLOSING_REF[row._key], ...SKIP[row._key]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: "More about this evening" still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
}

const set = {
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  durationLabel: LANGS.map((l) => ({ ...(doc.durationLabel?.find((t) => t._key === l) ?? { _key: l, _type: 'internationalizedArrayStringValue' }), value: DURATION_LABEL[l] })),
  durationHours: 4,
  ...(ready ? { priceFrom: fromNew } : {}),
  dayTourIntro: LANGS.map((l) => ({ ...B[l].intro, closingRef: CLOSING_REF[l], skipRefs: SKIP[l] })),
  dayTimeline: LANGS.flatMap((l) => B[l].timeline),
  inclusions: LANGS.flatMap((l) => B[l].included),
  exclusions: LANGS.flatMap((l) => B[l].excluded),
  customisationOptions: LANGS.flatMap((l) => B[l].options),
  body,
};
for (const f of ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions']) set[f] = curlyRows(set[f], 'en');

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  panel ${l}: ${B[l].intro.panelRows.map((r) => `${r.label}: ${r.text}`).join(' | ')}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.period, x.periodLabel, x.stops.map((s) => [s.title, (s.sites ?? []).map((z) => z.name)])]))}`);
  const essay = set.body.find((r) => r._key === l).value;
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  for (const b of essay) {
    const before = doc.body.find((r) => r._key === l).value.find((x) => x._key === b._key);
    if (textOf(before) !== textOf(b)) console.log(`  essay ${l} ${b._key}: ${textOf(b).slice(0, 200)}…`);
  }
  const empty = essay.filter((b) => !hidden.has(b._key) && !textOf(b).trim()).map((b) => b._key);
  console.log(`  essay ${l}: ${essay.length} blocks, ${essay.length - hidden.size} shown${empty.length ? `, EMPTY shown: ${empty.join(', ')}` : ''}`);
}

if (previewOut) {
  const cityIds = (doc.cities ?? []).map((c) => c._ref).filter(Boolean);
  const cities = cityIds.length ? await client.fetch('*[_id in $ids]', { ids: cityIds }) : [];
  // As the write leaves it: guideLanguagePrices unset (one price in every language).
  const { guideLanguagePrices: _gone, ...kept } = doc;
  const dataset = [{ ...kept, ...set, ...(ready ? {} : { priceFrom: undefined }) }, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const slug = doc.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  await writeRollback(client, [DOC_ID], 'before-cairo-dinner-cruise');
  await client.patch(DOC_ID).set(set).unset(ready ? ['guideLanguagePrices'] : ['guideLanguagePrices', 'priceFrom']).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
