/**
 * Philae After Dark: The Sound & Light Show at Aswan's Island Temple, in the day-tour format, EN + ES + JA together
 * (owner, 22 Nov: locked copy + open items).
 *
 *   tour  wp-page-88604   /private-tour-sound-light-show-at-philae-temple   (URLs unchanged: no redirect)
 *
 * The product: dusk pickup from a hotel in Aswan, a private motorboat to Agilkia Island, the temple, the 45-55 minute
 * show, back by boat and car. Included: private transfers, the motorboat, show tickets, a translation headset (all
 * languages), water, the driver's tip. No meal, no guide. No tiers, no minimum age; children not recommended (the
 * copy's own panel row; no children's discount row). The copy's own panel rows replace the rule rows (Pickup, Back,
 * Show language, Winter evenings, Children). One period: Evening.
 * Price: ONE price for every language (no guide): EUR 42, Autoura T2E-DT-ASW-06; already live (the sound & light
 * repricing of 22 Nov), so this import writes the same value and leaves guideLanguagePrices unset.
 *
 * Essay (Gate A.3, corrections 1-8): 2 "Few relocations match it."; 6 the language-by-night wording -> "Translation
 * headsets are available in all languages."; 7 "It isn't recommended for children."; 8 the winter cold: "in winter,
 * it's genuinely cold on the water and on the open island: bring a warm jacket"; 1, 3, 4, 5 kept. Hidden: the closing
 * (the page has its own) and its second half, the concierge helper note ("language rotates by night"), empty blocks,
 * ES: the standfirst.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-philae-sound-light-2026-11-22.mjs              # dry run
 *   node --env-file=<.env> scripts/day-tour-format/import-philae-sound-light-2026-11-22.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-88604';
const PRICES = JSON.parse(readFileSync(new URL('./philae-sound-light-prices.json', import.meta.url), 'utf8'));
const ready = typeof PRICES.price === 'number' && PRICES.price > 0;
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/philae-sound-and-light-show';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (22 Nov 2026; price from Autoura template T2E-DT-ASW-06).`;

const G = { philae: 'guideArticle.aswan.the-philae-temple' };
// Sites per stop, in file order: Philae Temple · Trajan's Kiosk (the kiosk has no page of its own).
const SITE_GUIDES = [[G.philae, null]];
const DURATION_LABEL = { en: 'Evening · show ~1 hr', es: 'Noche · espectáculo ~1 h', ja: '夜・ショー約1時間' };
const DURATION_HOURS = 3;
const PANEL = {
  en: { pickup: 'Pickup', back: 'Back' },
  es: { pickup: 'Recogida', back: 'Regreso' },
  ja: { pickup: 'お迎え', back: 'お戻り' },
};
const OPTIONAL_COST = ['extraTicket', 'extraCost'];
const PERIOD = { Evening: 'evening', Noche: 'evening', 夜: 'evening', Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 午前: 'morning', 昼: 'midday', 午後: 'afternoon' };

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
  const panelLines = panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], plain(m[2]).replace(/\s*\(ES: .*\)$/, '')]);
  const panelRows = Object.fromEntries(panelLines);
  // The panel's own rows, as written: all but the Type/Duration line and the From placeholder.
  const ownRows = panelLines.slice(1).filter(([, v]) => !/\{.*\}/.test(v)).map(([label, text]) => ({ label, text }));
  const periods = day.text.split(/\n### /).slice(1).map((chunk) => {
    const [head, ...rest] = chunk.split('\n');
    const [word, ...labelParts] = head.split(/\s*[·・]\s*/);
    const period = PERIOD[word.trim()];
    if (!period || !labelParts.length) throw new Error(`${l}: unknown period heading "${head}"`);
    const stops = [];
    for (const p of paras(rest.join('\n'))) {
      if (p.startsWith('>')) continue; // "More about this day →" pointer
      const lines = p.split('\n');
      const inc = p.match(/^\*\*(.+?)\*\*\s+([\s\S]+)$/);
      if (inc && !lines[0].endsWith('**')) {
        // "**Inside a pyramid (included).** text" → the previous stop's includedNote, as one string.
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
    return { period, periodLabel: plain(labelParts.join(l === 'ja' ? '・' : ' · ')), stops };
  });
  const sub = (t) => t.split(/\n(?=\*\*)/).map((blk) => ({ h: (blk.match(/^\*\*(.+?)\*\*/) ?? [])[1], items: bullets(blk).map(plain) })).filter((x) => x.h);
  const [inc, exc] = sub(incl.text);
  const [fit, worth] = sub(forYou.text);
  const tail = paras(mine.text);
  return {
    title, panelRows, ownRows, periods,
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
for (const l of LANGS) for (const k of ['pickup', 'back']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel (${Object.keys(P[l].panelRows).join(', ')})`);
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
// Checked by hand: filled in after the first run.
const SAME_MEANING = { es: ['wk0'], ja: ['wk0'] };
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
        // Khufu's interior = extra ticket, the camel ride = extra cost (file order).
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
      panelRows: p.ownRows.map((r, i) => ({ _key: `pr${i + 1}`, _type: 'dayPanelRow', ...r })),
      returnNote: p.panelRows[PANEL[l].back],
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'slin'), excluded: fact(p.excluded, 'slout'), options: fact(p.options, 'slopt'),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));

/* ── Document and essay ───────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (doc.type !== 'dayTour') throw new Error('not a day tour');
if (await client.getDocument(`drafts.${DOC_ID}`)) throw new Error(`drafts.${DOC_ID} exists — handle it first`);
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es ?? '', doc.guideLanguagePrices?.ja ?? ''].join();
if (priceNow !== [PRICES.price, '', ''].join()) throw new Error(`unexpected prices ${priceNow} (live must be ${PRICES.price}, no guideLanguagePrices)`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// The essay's closing ("Philae was saved from the lake…"), now the page's own closing line; its second half hidden.
const CLOSING_REF = { en: '000000000025', es: '000000000027', ja: '00000000001f' };
// Hidden: the closing's second sentence · the concierge helper note (language rotates) · empty blocks · ES the standfirst.
const SKIP = {
  en: ['000000000027', '000000000035', '000000000038'],
  es: ['000000000003', '000000000029', '000000000039', '00000000003c'],
  ja: ['000000000021', '00000000002f', '000000000032'],
};
// Whole blocks rewritten (their runs are lost): the private-transfer paragraph (headsets, children) and the cold note.
const REPLACE = {
  en: {
    '000000000009': "Aswan evenings are rarely cold by northern European standards, but in winter, from October to March, it's genuinely cold on the water and on the open island: bring a warm jacket.",
    '000000000015': 'The road transfer is private to your party; the show itself is a shared, ticketed performance at the temple, and the ticket includes the boat crossings to the island and back. The outing takes bookings from a single person upward, with no minimum group, and one bottle of mineral water per person is provided; your driver’s tip is included, and an assistant from our team meets you at the temple, hands out the translation headsets and collects them afterwards. Suited to those steady on their feet. You step on and off a small boat in the dark, then walk and stand through the temple on uneven paving before sitting for the finale. It isn’t recommended for children.',
  },
  es: {
    '00000000000b': 'Las tardes de Asuán rara vez son frías para los estándares del norte de Europa, pero en invierno, de octubre a marzo, hace un frío real sobre el agua y en la isla abierta: lleva una chaqueta de abrigo.',
    '000000000017': 'El traslado por carretera es privado a su grupo; el espectáculo en sí es una función con boleto compartida en el templo, y la entrada incluye las travesías en barco a la isla y de vuelta. La salida se reserva desde una sola persona, sin tamaño mínimo de grupo, y se entrega una botella de agua mineral por persona, la propina del conductor está incluida, y un asistente de nuestro equipo te recibe en el templo, reparte los auriculares de traducción y los recoge al terminar. Conviene a quien se mantiene firme sobre sus pies. Se sube y se baja de una lancha pequeña en la oscuridad y se recorre el templo a pie y de pie sobre pavimento irregular antes de sentarse para el final. No se recomienda para niños.',
  },
  ja: {
    '00000000000f': 'アスワンの夜は、北ヨーロッパの基準ではめったに寒くなりませんが、冬（10月から3月）は水の上や吹きさらしの島が本当に冷えます。暖かい上着をお持ちください。',
  },
};
// [block, find, replace] — corrections 2, 6 and 7; each find sits inside one text run.
const FIX = {
  en: [
    ['000000000005', " We don't recommend it for small children: the evening is late and the narration is long.", " It isn't recommended for children."], // 7
    ['00000000001d', ' The show cycles between Arabic, English, French, and other languages on different nights; confirm which language corresponds to your chosen evening when booking.', ' Translation headsets are available in all languages.'], // 6
    ['000000000023', ' No other relocated site in Egypt competes with Philae for the completeness and fidelity of the reconstruction.', ' Few relocations match it.'], // 2
  ],
  es: [
    ['000000000007', ' No lo recomendamos para niños pequeños: la velada es tarde y la narración es larga.', ' No se recomienda para niños.'],
    ['00000000001f', ' El espectáculo rota entre árabe, inglés, francés y otras lenguas según la noche; confirme qué idioma corresponde a su velada elegida al reservar.', ' Hay auriculares de traducción disponibles en todos los idiomas.'],
    ['000000000025', ' Ningún otro yacimiento reubicado en Egipto compite con Philae por la integridad y fidelidad de la reconstrucción.', ' Pocas reubicaciones se le igualan.'],
  ],
  ja: [
    ['00000000000b', '小さなお子様にはおすすめしません。夜が遅く、語りも長いためです。', 'お子様にはおすすめしません。'],
    ['000000000017', 'ショーは夜ごとにアラビア語、英語、フランス語、そしてほかの言語のあいだを巡ります。お選びになった夜にどの言語にあたるかは、ご予約時にご確認ください。', '翻訳ヘッドセットは、すべての言語でご用意があります。'],
  ],
};
const body = doc.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const k of [CLOSING_REF[l], ...SKIP[l], ...Object.keys(REPLACE[l]), ...FIX[l].map(([k]) => k)]) if (!keys.has(k)) throw new Error(`${l}: essay block ${k} missing`);
  return {
    ...row,
    value: row.value.map((b) => {
      if (REPLACE[l][b._key]) return { ...b, children: [{ ...b.children[0], marks: [], text: REPLACE[l][b._key] }] };
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
  en: /cycles between|rotates by night|small children|No other relocated|\btiers?\b|minimum age|English-speaking/i,
  es: /rota entre|rota por noche|niños pequeños|Ningún otro yacimiento|tres niveles|edad mínima|angloparlante/i,
  ja: /夜ごとにアラビア語|お選びになった夜|小さなお子様|段階|18歳|最低年齢|英語対応/,
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

const set = {
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  summary: LANGS.map((l) => ({ ...(doc.summary?.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: SUMMARY[l] })),
  durationLabel: LANGS.map((l) => ({ ...(doc.durationLabel?.find((t) => t._key === l) ?? { _key: l, _type: 'internationalizedArrayStringValue' }), value: DURATION_LABEL[l] })),
  durationHours: DURATION_HOURS,
  ...(ready ? { priceFrom: PRICES.price } : {}),
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
if (!ready) console.log('price: NOT READY — fill giza-sound-light-prices.json from Autoura (one price; no guide). Nothing can be applied yet.');

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  summary ${l}: ${set.summary.find((t) => t._key === l).value}`);
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine} · back: ${B[l].intro.returnNote}`);
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
  if (!ready) throw new Error('prices not ready — fill giza-sound-light-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-philae-sound-light');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
