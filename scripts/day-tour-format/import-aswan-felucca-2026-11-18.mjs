/**
 * Aswan Felucca Sail with Lunch on a Nile Beach in the day-tour format, EN + ES + JA together.
 * Owner, 18 Nov: "Keep €48, defaults" — after the open items were settled the same day:
 *   - €48 per person on every page: the assistant speaks English on every page, so no
 *     Spanish/Japanese price (guideLanguagePrices removed; was €48 / €59 / €66)
 *   - lunch included, after the sail, at a table on a sandy beach by the river (no onboard or
 *     riverside-restaurant option); drinks not included, a bottle of water is
 *   - starting point: the boat dock in front of the EgyptAir office on the Corniche; no pickup
 *     (a transfer at extra cost); no wind → a motorboat tows the felucca; best season Nov–Mar
 * The panel shows the copy's own rows (dayTourIntro.panelRows). The timeline headings are the
 * copy's labels alone (period 'label'): the sail runs morning or afternoon.
 *
 *   tour  wp-page-113206   /aswan-felucca-adventure
 *
 * Essay (Gate A.3, owner-approved corrections 1–8): lunch included on the beach; no Nile Feast;
 * drinks line; the lateen sail's date dropped; "for us"; November to March; the starting point.
 * Left out of "More about this day": the summary block that repeats the panel with "no minimum
 * age" (and, in ES, a Spanish-speaking assistant), the Nile Feast summary, empty blocks.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-aswan-felucca-2026-11-18.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-aswan-felucca-2026-11-18.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-aswan-felucca-2026-11-18.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-113206';
const OLD_PRICES = { from: 48, es: 59, ja: 66 };
// Owner: €48, the same on every page (English-speaking assistant).
const PRICE = 48;
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/aswan-felucca-sail-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (18 Nov 2026; owner: "Keep €48, defaults").`;

const G = {
  corniche: null, // no guide article for the Corniche yet
  elephantine: 'guideArticle.aswan.elephantine-island',
};
const JA_SITES = [['アスワンのコルニッシュ通り', 'エレファンティネ島（水上から）']];
// Sites per stop, in file order.
const SITE_GUIDES = [[G.corniche, G.elephantine]];
const DURATION_LABEL = { en: '~3 hrs', es: '~3 h', ja: '約3時間' };
const DURATION_HOURS = 3;
const PANEL = {
  en: { pickup: 'Starting point', lunch: 'Lunch' },
  es: { pickup: 'Punto de salida', lunch: 'Almuerzo' },
  ja: { pickup: '出発地点', lunch: '昼食' },
};
// The copy's timeline headings are labels alone (no time-of-day word): period 'label'.
const HEADS = {
  en: ['On the Nile', 'Lunch on a Nile beach'],
  es: ['En el Nilo', 'Almuerzo en una playa del Nilo'],
  ja: ['ナイル川の上で', 'ナイルの砂浜で昼食'],
};

/* ── Parse a locked day-tour file ─────────────────────────────────────── */
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
  const panelLines = panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim()]);
  const panelRows = Object.fromEntries(panelLines);
  // The panel's own rows, as written: all but the Type/Duration line and the From placeholder.
  const ownRows = panelLines.slice(1).filter(([, v]) => !/\{.*\}/.test(v)).map(([label, text]) => ({ label, text }));
  const periods = day.text.split(/\n### /).slice(1).map((chunk) => {
    const [head, ...rest] = chunk.split('\n');
    const label = head.trim();
    if (!HEADS[l].includes(label)) throw new Error(`${l}: unknown heading "${label}"`);
    const period = 'label';
    const stops = [];
    for (const p of paras(rest.join('\n'))) {
      if (p.startsWith('>')) continue; // "More about this day →" pointer
      const lines = p.split('\n');
      const hm = lines[0].match(/^\*\*(.+)\*\*$/);
      if (!hm) throw new Error(`${l}: unexpected paragraph in "${label}": ${p.slice(0, 60)}`);
      // "06:00 · Pickup…", "Around 16:00 · Back…", "16:00頃・…": the time part is kept as written.
      const parts = hm[1].split(/\s*[·・]\s*/);
      const stop = parts.length > 1 && /\d\d:\d\d/.test(parts[0]) ? { time: clean(parts[0]), title: clean(parts.slice(1).join(l === 'ja' ? '・' : ' · ')) } : { title: clean(hm[1]) };
      const body = [];
      for (const ln of lines.slice(1)) {
        const sm = ln.match(/^\*?(Sites|Lugares|見学地)[:：]\*?[:：]?\s*(.+)$/);
        if (sm) {
          // JA names contain 「・」, the separator: their lists are given (checked against the file).
          const given = l === 'ja' ? JA_SITES.find((list) => list.join('・') === sm[2].trim()) : null;
          if (l === 'ja' && !given) throw new Error(`ja: no given site list for "${sm[2]}"`);
          stop.sites = given ?? sm[2].split(' · ').map((x) => x.trim());
        }
        else body.push(ln);
      }
      if (body.length) stop.text = clean(body.join(' '));
      stops.push(stop);
    }
    return { period, periodLabel: clean(label), stops };
  });
  const sub = (t) => t.split(/\n(?=\*\*)/).map((blk) => ({ h: (blk.match(/^\*\*(.+?)\*\*/) ?? [])[1], items: bullets(blk) })).filter((x) => x.h);
  const [inc, exc] = sub(incl.text);
  const [fit, worth] = sub(forYou.text);
  const tail = paras(mine.text);
  return {
    title, panelRows, ownRows, periods,
    opening: clean(paras(opening.text)[0]),
    whyThisOrder: clean(paras(why.text)[0]),
    included: inc.items, excluded: exc.items, fitFor: fit.items, worthKnowing: worth.items,
    options: bullets(mine.text),
    closingLine: clean(tail[tail.length - 1].replace(/^\*(.*)\*$/, '$1')),
  };
}
const P = Object.fromEntries(LANGS.map((l) => [l, parseLocale(l)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [!!s.time, !!s.text, s.sites?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
for (const l of LANGS) for (const k of ['pickup', 'lunch']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel`);

/* ── Numeric gate: ES/JA figures equal EN, string by string ──────────── */
const flat = (p) => ({
  opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
  ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text]])).filter(([, v]) => v)),
  ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
  ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
});
// Same meaning, checked by hand 18 Nov: "November to March" = «de noviembre a marzo» / 11月から3月
// (the gate reads ES/JA months as numbers, not EN ones); "both banks" = «las dos orillas».
const SAME_MEANING = { es: ['why', 'p0s1.x', 'wk0'], ja: ['why', 'wk0'] };
for (const l of ['es', 'ja']) {
  const en = flat(P.en), lc = flat(P[l]);
  for (const key of SAME_MEANING[l]) { delete en[key]; delete lc[key]; console.log(`numeric gate (${l}): ${key} checked by hand (same meaning)`); }
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
        _key: `s${pi + 1}-${si + 1}`, _type: 'dayTourStop',
        ...(s.time ? { time: s.time } : {}), title: s.title, ...(s.text ? { text: s.text } : {}),
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
      // Outside Cairo and Giza: the panel's Pickup row is this line as written.
      pickupLine: p.panelRows[PANEL[l].pickup],
      panelRows: p.ownRows.map((r, i) => ({ _key: `pr${i}`, _type: 'dayPanelRow', ...r })),
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'flin'), excluded: fact(p.excluded, 'flout'), options: fact(p.options, 'flopt'),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));

/* ── Document and essay ───────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (doc.type !== 'dayTour') throw new Error('not a day tour');
// On a re-run the price is already the new one and the guide-language prices are gone.
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja].join();
if (![[OLD_PRICES.from, OLD_PRICES.es, OLD_PRICES.ja].join(), [PRICE, '', ''].join()].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

const CLOSING_REF = { en: '00000000002b', es: '000000000031', ja: '000000000025' };
// The summary block that repeats the panel ("no minimum age"; ES: a Spanish-speaking assistant,
// item 2), the Nile Feast summary (item 5), the empty block.
const SKIP = {
  en: ['000000000015', '000000000039', '00000000003c'],
  es: ['000000000019', '000000000041', '000000000044'],
  ja: ['000000000033', '000000000036'],
};
// Whole blocks rewritten (items 1, 3, 4): the lunch paragraphs.
const REWRITE = {
  en: {
    '000000000007': 'Lunch is part of the day: freshly baked Egyptian bread, baba ghanoush and tahini, then grilled chicken or meat with rice and seasonal vegetables, served at a table on a sandy beach by the river, after the sail.',
    '00000000001f': 'The sail ends at a sandy beach on the river, where lunch is served at a proper table and chairs. The menu runs to freshly baked Egyptian bread, baba ghanoush and tahini for dipping, followed by grilled chicken or seasoned meat with aromatic rice and seasonal vegetables. Drinks aren’t included; a bottle of water per person is.',
  },
  es: {
    '00000000000b': 'El almuerzo forma parte del día: pan egipcio recién hecho con baba ganush y tahini y, después, pollo o carne a la parrilla con arroz y verduras de temporada, servido en una mesa sobre una playa de arena junto al río, después del paseo.',
    '000000000025': 'El paseo termina en una playa de arena junto al río, donde el almuerzo se sirve en una mesa con sillas. El menú abarca pan egipcio recién horneado, baba ganush y tahini para mojar, seguidos de pollo a la parrilla o carne sazonada con arroz aromático y verduras de temporada. Las bebidas no están incluidas; una botella de agua por persona, sí.',
  },
  ja: {
    '00000000000d': '昼食はこの一日に含まれます。焼きたてのエジプトのパンにババガヌーシュとタヒーナ、続いてグリルしたチキンまたは肉に、ライスと季節の野菜。帆走のあと、川辺の砂浜に用意したテーブルでお出しします。',
    '000000000019': '帆走の終わりは川辺の砂浜。きちんとしたテーブルと椅子を用意し、昼食をお出しします。献立は、焼きたてのエジプトのパン、つけて食べるババガヌーシュとタヒーナ、続いて、香り立つライスと季節の野菜を添えたグリルチキンか味付けした肉。飲み物は含まれません。お一人様1本のミネラルウォーターは含まれます。',
  },
};
// [block, find, replace] — items 6, 7, 8 (+ the ES assistant: English, open items 18 Nov).
const FIX = {
  en: [
    ['000000000003', 'and it remains the most honest way', 'and it remains, for us, the most honest way'],
    ['000000000019', 'The experience begins with a pick-up from your agreed meeting point and a short transfer to the Aswan Corniche', 'The experience begins at the boat dock in front of the EgyptAir office on the Aswan Corniche'],
    ['000000000025', 'reached the Nile from the Arab maritime tradition somewhere around the seventh century AD, and the felucca as a vessel type became the dominant craft of the upper Nile from that point forward.', 'is the felucca’s signature, and its design has changed little in centuries.'],
    ['000000000027', 'from October through April', 'from November to March'],
  ],
  es: [
    ['000000000005', 'y sigue siendo la manera más honesta', 'y sigue siendo, para nosotros, la manera más honesta'],
    ['00000000001d', 'La experiencia arranca con una recogida en el punto de encuentro acordado y un corto traslado a la Corniche de Asuán', 'La experiencia arranca en el embarcadero frente a la oficina de EgyptAir, en la Corniche de Asuán'],
    ['00000000001d', 'Su asistente de habla hispana', 'Su asistente de habla inglesa'],
    ['00000000002b', 'llegó al Nilo desde la tradición marítima árabe en torno al siglo VII d. C., y la faluca como tipo de embarcación se convirtió a partir de entonces en el barco dominante del Nilo alto.', 'es la seña de identidad de la faluca, y su diseño ha cambiado poco en siglos.'],
    ['00000000002d', 'de octubre a abril', 'de noviembre a marzo'],
  ],
  ja: [
    ['000000000009', 'そしてそれは、なぜアスワンが', 'そしてそれは、私たちにとって、なぜアスワンが'],
    ['000000000013', '体験は、お約束の集合場所でのお迎えと、アスワンのコルニッシュ——ナイル東岸沿いに走る広い河畔の遊歩道——への短い移動で始まります。', '体験は、アスワンのコルニッシュ——ナイル東岸沿いに走る広い河畔の遊歩道——にある、エジプト航空のオフィス前のボート乗り場から始まります。'],
    ['00000000001f', 'は、紀元7世紀ごろのどこかで、アラブの海洋の伝統からナイルへ伝わり、フェルッカは船の型として、その時点から上ナイルの主要な船となりました。', 'は、フェルッカを象徴するもので、その設計は何世紀ものあいだほとんど変わっていません。'],
    ['000000000021', '10月から4月にかけて', '11月から3月にかけて'],
  ],
};
const body = doc.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const k of [CLOSING_REF[l], ...SKIP[l], ...FIX[l].map(([k]) => k), ...Object.keys(REWRITE[l])]) if (!keys.has(k)) throw new Error(`${l}: essay block ${k} missing`);
  return {
    ...row,
    value: row.value.map((b) => {
      if (REWRITE[l][b._key]) return { ...b, children: [{ ...b.children[0], marks: [], text: REWRITE[l][b._key] }] };
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
// Nothing "More about this day" shows may keep the old convoy product or a corrected claim.
const RETIRED = {
  en: /optional|Nile Feast|riverside restaurant|onboard|seventh century|October|pick-up|meeting point|no minimum age|Soft drinks/i,
  es: /opcional|Festín|restaurante|siglo VII|octubre|recogida|punto de encuentro acordado|edad mínima|hispana|bebidas sin alcohol/i,
  ja: /任意|フィースト|レストラン|船上|7世紀|10月|集合場所|ソフトドリンク/,
};
for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const hidden = new Set([CLOSING_REF[row._key], ...SKIP[row._key]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
}

const set = {
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  durationLabel: LANGS.map((l) => ({ ...(doc.durationLabel?.find((t) => t._key === l) ?? { _key: l, _type: 'internationalizedArrayStringValue' }), value: DURATION_LABEL[l] })),
  durationHours: DURATION_HOURS,
  priceFrom: PRICE,
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

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  start ${l}: ${B[l].intro.pickupLine} · lunch: ${B[l].intro.lunch.text} · panel: ${B[l].intro.panelRows.map((r) => r.label).join(' | ')}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.periodLabel, x.stops.map((s) => (s.time ? `${s.time} · ` : '') + s.title)]))}`);
  for (const b of set.body.find((r) => r._key === l).value) {
    const before = doc.body.find((r) => r._key === l).value.find((x) => x._key === b._key);
    if (textOf(before) !== textOf(b)) console.log(`  essay ${l} ${b._key}: ${textOf(b).slice(0, 170)}…`);
  }
}

if (previewOut) {
  const refs = await client.fetch('*[_id in $ids]', { ids: Object.values(G).filter(Boolean) });
  const cityIds = [...new Set([...refs.map((r) => r.parentCity?._ref), ...(doc.cities ?? []).map((c) => c._ref)].filter(Boolean))];
  const cities = await client.fetch('*[_id in $ids]', { ids: cityIds });
  const dataset = [{ ...doc, ...set }, ...refs, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const slug = doc.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'priceFrom', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'citySlugsEn'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  await writeRollback(client, [DOC_ID], 'before-aswan-felucca');
  await client.patch(DOC_ID).set(set).unset(['guideLanguagePrices']).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
