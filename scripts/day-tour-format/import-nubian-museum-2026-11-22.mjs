/**
 * The Nubian Museum & Aswan's Local Market: Private Half-Day Tour, in the day-tour format, EN + ES + JA together
 * (owner, 22 Nov: locked copy + open items).
 *
 *   tour  wp-page-88599   /nubian-museum-local-market-tour-in-aswan   (URLs unchanged: no redirect)
 *
 * An afternoon into the evening; the meal is DINNER (not lunch). Entrance to the Nubian Museum and dinner included.
 * No tiers, no minimum age. The copy's own panel rows replace the rule rows (children 50 %, pickup, dinner, guide).
 * Price: nubian-museum-prices.json (Autoura T2E-DT-ASW-07): EUR 78 / ES 89 / JA 106 (live 80 / 91 / 98).
 *
 * Essay (Gate A.3): corrections 2-4 and 6-8 applied (the "operator" note, the tier paragraphs, the private paragraph,
 * "An afternoon here"); corrections 1 (the 100,000 people) and 5 (the reconstructed tomb facade and fortification wall)
 * are HELD for the owner's answers (open items 1 and 2): the live sentences are left as they are. The concierge note's
 * morning option goes (afternoon only). Hidden: the essay's closing (the page has its own), the tier helper note, empty
 * blocks.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-nubian-museum-2026-11-22.mjs              # dry run
 *   node --env-file=<.env> scripts/day-tour-format/import-nubian-museum-2026-11-22.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-88599';
const OLD = { from: 80, es: 91, ja: 98 };
const PRICES = JSON.parse(readFileSync(new URL('./nubian-museum-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/nubian-museum-aswan-market';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (22 Nov 2026).`;

const G = { museum: 'guideArticle.aswan.the-nubian-museum' };
// Sites per stop, in file order: Nubian Museum · Aswan souk (no guide page for the souk).
const SITE_GUIDES = [[G.museum], [null]];
const DURATION_LABEL = { en: 'Half day · ~4 hrs', es: 'Medio día · ~4 h', ja: '半日・約4時間' };
const DURATION_HOURS = 4;
const PANEL = { en: { pickup: 'Pickup' }, es: { pickup: 'Recogida' }, ja: { pickup: 'お迎え' } };
const PERIOD = { 'Afternoon and evening': 'evening', 'Tarde y noche': 'evening', '午後から夜': 'evening', Evening: 'evening', Noche: 'evening', 夜: 'evening', Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 昼: 'midday', 午後: 'afternoon' };

/* ── Parse ────────────────────────────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t　]+$/gm, '').trim();
const plain = (s) => clean(s.replace(/\*\*|\*/g, ''));
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
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
      if (p.startsWith('>')) continue; // "More about this evening →" pointer
      const lines = p.split('\n');
      const hm = lines[0].match(/^\*\*(.+)\*\*$/);
      if (!hm) throw new Error(`${l}: unexpected paragraph in "${head}": ${p.slice(0, 60)}`);
      const tm = plain(hm[1]).match(/^(\d\d:\d\d)\s*[·・]\s*(.+)$/);
      const stop = tm ? { time: tm[1], title: tm[2] } : { title: plain(hm[1]) };
      const body = [];
      for (const ln of lines.slice(1)) {
        const sm = ln.match(/^\*?(Sites|Lugares|見学地)[^:：]*[:：]\*?[:：]?\s*(.+)$/);
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
// The summary / meta description: the locked opening's own first two sentences.
const SUMMARY = Object.fromEntries(LANGS.map((l) => [l, (P[l].opening.match(l === 'ja' ? /^(?:[^。]+。){2}/ : /^(?:.+?[.!?](?:\s+|$)){2}/) ?? [P[l].opening])[0].trim()]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [!!s.text, s.sites?.length ?? 0, !!s.time, s.optional?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opt: p.options.length, rows: p.ownRows.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
for (const l of LANGS) for (const k of ['pickup']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel (${Object.keys(P[l].panelRows).join(', ')})`);
const siteStops = P.en.periods.flatMap((x) => x.stops).filter((s) => s.sites);
if (siteStops.length !== SITE_GUIDES.length || siteStops.some((s, i) => s.sites.length !== SITE_GUIDES[i].length)) throw new Error('sites ≠ SITE_GUIDES');

/* ── Numeric gate ─────────────────────────────────────────────────────── */
const flat = (l) => {
  const p = P[l];
  return {
    opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
    ...Object.fromEntries(p.ownRows.map((r, i) => [`panel${i}`, r.text])),
    ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text], ...(s.optional ?? []).map((o, i) => [`p${pi}s${si}.o${i}`, o])])).filter(([, v]) => v)),
    ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
    ...Object.fromEntries(p.fitFor.map((t, i) => [`fit${i}`, t])),
    ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
  };
};
// Same figures, checked by hand (open items, "Numeric gate (22 Nov)": EN/ES 2, 6, 12, 50; JA adds 1 for 1名様).
const SAME_MEANING = { es: ['fit0'], ja: ['p0s1.x'] };
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
        _key: `s${pi + 1}-${si + 1}`, _type: 'dayTourStop', ...(s.time ? { time: s.time } : {}), title: s.title, ...(s.text ? { text: s.text } : {}),
        ...(s.optional ? { skipGlance: true, optional: s.optional.map((text, k) => ({ _key: `o${k + 1}`, _type: 'dayTourOptional', text, cost: 'extraTicket' })) } : {}),
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
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'gwin'), excluded: fact(p.excluded, 'gwout'), options: fact(p.options, 'gwopt'),
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
const TIER_FIELDS = ['priceTiers', 'tiers', 'tourLevels', 'levels', 'optionLink', 'optionLinks', 'minimumAge', 'ageLine', 'ageNote'];
const tierLeft = TIER_FIELDS.filter((f) => doc[f] != null);
if (tierLeft.length) throw new Error(`tier/age fields present (${tierLeft.join(', ')}) — retire them first`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// The essay's closing sentences (the page has its own closing line).
const CLOSING_REF = { en: '00000000003f', es: '000000000041', ja: '000000000031' };
// Hidden: the tier helper note · empty blocks.
const SKIP = { en: ['00000000004d', '000000000050'], es: ['000000000051', '000000000054'], ja: ['00000000003f', '000000000042'] };
// Whole blocks rewritten (their bold / link runs are lost): the practical note (afternoon into the evening, "we'll
// confirm the timing with you"), the private-tour paragraph and the tier paragraph.
const REPLACE = {
  en: {
    '00000000000b': "A practical note before anything else: this tour is organised as a half-day excursion, run in the afternoon and into the evening to avoid the worst of Aswan's midday heat. We'll confirm the timing with you, particularly in summer, when temperatures routinely exceed 40°C.",
    '000000000019': 'This is a private tour, operated for your party alone — never shared with other guests. Because it is private, it runs for as few as one traveller, with no minimum group size and no waiting on other bookings; larger parties are accommodated in a suitable vehicle. A private, air-conditioned vehicle, a licensed Egyptologist guide in your language, and one bottle of mineral water per person are included. It is a gentle museum-and-market half-day that suits families.',
    '000000000021': 'Entrance to the Nubian Museum and dinner at a local restaurant are included.',
  },
  es: {
    '00000000000d': 'Una nota práctica antes que nada: este tour se organiza como excursión de medio día, por la tarde y hasta entrada la noche, para esquivar el peor calor de mediodía en Asuán. Confirmaremos el horario contigo, en particular en verano, cuando las temperaturas superan rutinariamente los 40 °C.',
    '00000000001b': 'Se trata de un tour estrictamente privado, operado en exclusiva para su grupo y nunca compartido con otros viajeros. Por su carácter privado, opera desde un único viajero, sin tamaño mínimo de grupo y sin esperas a otras reservas; los grupos más amplios se acomodan en un vehículo adecuado. Se incluyen un vehículo privado con aire acondicionado, un guía egiptólogo licenciado en tu idioma y una botella de agua mineral por persona. Es un medio día suave de museo y mercado que conviene a las familias.',
    '000000000023': 'Las entradas al Museo Nubio y la cena en un restaurante local están incluidas.',
  },
  ja: {
    '000000000011': '何よりまず実務的な注記を。このツアーは半日の小旅行として組まれており、アスワンの正午の最も厳しい暑さを避けるため、午後から夕方にかけて催行されます。とりわけ気温が決まって40℃を超える夏には、時間はご相談のうえ確定いたします。',
  },
};
const body = doc.body.map((row) => {
  const l = row._key;
  if (!REPLACE[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const k of [CLOSING_REF[l], ...SKIP[l], ...Object.keys(REPLACE[l])]) if (!keys.has(k)) throw new Error(`${l}: essay block ${k} missing`);
  return { ...row, value: row.value.map((b) => (REPLACE[l][b._key] ? { ...b, children: [{ ...b.children[0], marks: [], text: REPLACE[l][b._key] }] } : b)) };
});
// Nothing "More about this day", the summary or the notes may keep what the page corrects (1 and 5 are held).
const RETIRED = {
  en: /three tiers|Base \+|every tier|minimum age|English-speaking|your operator|morning or late afternoon|lunch/i,
  es: /tres niveles|Base \+|cada nivel|edad mínima|angloparlante|su operador|mañana o última hora|almuerzo/i,
  ja: /段階|18歳|最低年齢|英語対応|催行会社|午前か午後の遅い|昼食/,
};
for (const row of body) {
  const l = row._key;
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[l].test(textOf(b))) throw new Error(`${l} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[l])[0]}"`);
}
for (const l of LANGS) if (RETIRED[l].test(SUMMARY[l])) throw new Error(`${l}: summary still shows "${SUMMARY[l].match(RETIRED[l])[0]}"`);
// The concierge note offered a morning start; the product is afternoon into the evening.
const NOTE = {
  en: "This day is timed for the afternoon and into the evening, after the worst of the heat. Families are welcome, and the pace bends easily to browsers and hagglers alike. Tell our concierge where you're staying, and we'll set the hour.",
  es: 'Este día está pensado para la tarde y hasta entrada la noche, pasado lo peor del calor. Las familias son bienvenidas y el ritmo se adapta sin esfuerzo a curiosos y regateadores por igual. Dile a nuestro concierge dónde te alojas y fijamos la hora.',
  ja: 'この一日は、暑さの峠を過ぎた午後から夕方にかけて組んであります。ご家族連れも歓迎で、じっくり眺める方にも値段交渉を楽しむ方にも、歩調は柔軟に合わせられます。ご滞在先をコンシェルジュにお知らせいただければ、時刻を決めます。',
};
const conciergeNote = LANGS.map((l) => ({ ...(doc.conciergeNote.find((n) => n._key === l) ?? { _key: l, _type: 'object' }), value: NOTE[l] }));
const SHAPE = {
  duration: { en: 'Half day, about 4 hours, afternoon into the evening', es: 'Medio día, unas 4 horas, por la tarde y hasta la noche', ja: '半日、約4時間（午後から夕方）' },
  where: { en: 'Aswan: the Nubian Museum, the local market, dinner', es: 'Asuán: el Museo Nubio, el mercado local y la cena', ja: 'アスワン：ヌビア博物館、地元の市場、夕食' },
};
const set = {
  conciergeNote,
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
for (const f of ['duration', 'where']) set[`shapeOfDay.${f}`] = LANGS.map((l) => ({ ...(doc.shapeOfDay?.[f]?.find((n) => n._key === l) ?? { _key: l, _type: 'internationalizedArrayStringValue' }), value: SHAPE[f][l] }));
const UNSET = doc.shapeOfDay?.character ? ['shapeOfDay.character'] : [];

/* ── Gates ────────────────────────────────────────────────────────────── */
for (const l of LANGS) {
  const rows = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]], {});
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

for (const f of Object.keys(set)) {
  if (f === 'body' || f.startsWith('shapeOfDay')) continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
console.log(`unset: ${UNSET.join(', ') || 'nothing'}`);
if (!ready) console.log('prices: NOT READY');
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  summary ${l}: ${set.summary.find((t) => t._key === l).value}`);
  console.log(`  panel ${l}: ${B[l].intro.panelRows.map((r) => `${r.label}: ${r.text}`).join(' | ')}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.period, x.periodLabel, x.stops.map((s) => [s.title, (s.sites ?? []).map((z) => z.name)])]))}`);
  const essay = set.body.find((r) => r._key === l).value;
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  console.log(`  essay ${l}: ${essay.length} blocks, ${essay.length - hidden.size} shown: ${essay.filter((b) => !hidden.has(b._key)).map((b) => textOf(b).slice(0, 70)).join(' | ')}`);
}

if (previewOut) {
  const cityIds = (doc.cities ?? []).map((c) => c._ref).filter(Boolean);
  const cities = await client.fetch('*[_id in $ids]', { ids: cityIds });
  const next = { ...doc, ...set };
  next.shapeOfDay = { ...doc.shapeOfDay, character: undefined, duration: set['shapeOfDay.duration'], where: set['shapeOfDay.where'] };
  delete next['shapeOfDay.duration']; delete next['shapeOfDay.where'];
  const dataset = [next, ...cities];
  const { tourBySlugQuery } = await import('../../src/sanity/lib/queries.ts');
  const out = {};
  for (const l of LANGS) {
    const slug = doc.slug.find((s) => s._key === l).value.current;
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'citySlugsEn'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  if (!ready) throw new Error('prices not ready');
  await writeRollback(client, [DOC_ID], 'before-nubian-museum');
  await client.patch(DOC_ID).set(set).unset(UNSET).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (--apply --flags-approved writes production)');
