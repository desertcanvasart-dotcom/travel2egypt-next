/**
 * Luxor by Horse Carriage: The City at Night, the Nile & the Local Market, in the day-tour format, EN + ES + JA
 * together (owner, 22 Nov: locked copy + open items; "Yes to all three, use the Autoura rate").
 *
 *   tour  wp-page-88412   /private-tour-local-market-with-horse-carriage   (URLs unchanged: no redirect)
 *
 * One product, no options: the 1-, 2- and 4-hour categories and the tiers go. A single ride of about 2 hours, a
 * private carriage (max 2 per carriage), hotel pickup and return, an English-speaking ASSISTANT (no guide), water,
 * the driver's tip. No lunch, no café, no mango juice; shisha only at the guest's own cost. Minimum age 6, for
 * safety: an owner-approved exception to rule 9 (like the helicopter's operator minimum). The panel's own rows
 * (dayTourIntro.panelRows) show in place of the rule rows, so the guide-language row does not appear.
 *
 * Price: ONE price for every language (no guide), from Autoura rates, 2 travellers, house margin 30 %,
 * ~59.05 EGP/EUR, rounded UP (as the Karnak Sound & Light page, template T2E-DT-LXR-08): "Horse Carriage" ride,
 * Luxor, 600 EGP per ride (activity_rates ACT-JZ5TB2, per_unit, 1 carriage for 2) + the evening assistant 700 EGP
 * + the driver's tip 250 EGP = 1,550 EGP; 1,550 x 1.3 / 59.05 = €34.1 for two = €17.06 each, + water → €18.
 * Live today: €17.5 / ES €29 / JA €35 (the ES/JA steps were the Spanish / Japanese guide, which is gone).
 *
 * Essay (Gate A.3, corrections 1–6): the essay is built around the three categories, so the category blocks, the
 * café / shisha block, the old closing (mango juice, "costs almost nothing") and the concierge line are HIDDEN
 * (the page has its own closing); the private-experience paragraph, the "none of these is demanding" paragraph
 * and the market note are REPLACED (no tiers, minimum age 6, no "categories"); "a city that most visitors only
 * pass through on the way to a tomb" is kept. ES: the standfirst is hidden too.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-luxor-horse-carriage-2026-11-22.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-luxor-horse-carriage-2026-11-22.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-luxor-horse-carriage-2026-11-22.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-88412';
const OLD = { from: 17.5, es: 29, ja: 35 };
const PRICE = 18;
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/luxor-horse-carriage-night-market';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (22 Nov 2026; price from the Autoura horse-carriage rate, 2 travellers).`;

const SITE_GUIDES = [[null]]; // "Luxor local market" has no guide page
const DURATION_LABEL = { en: 'Evening · ~2 hrs', es: 'Noche · ~2 h', ja: '夜・約2時間' };
const DURATION_HOURS = 2;
const PANEL = {
  en: { pickup: 'Pickup', back: 'Back' },
  es: { pickup: 'Recogida', back: 'Regreso' },
  ja: { pickup: 'お迎え', back: 'お戻り' },
};
const PERIOD = { Evening: 'evening', Noche: 'evening', 夜: 'evening', Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 昼: 'midday', 午後: 'afternoon' };

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
  const panelLines = panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], plain(m[2])]);
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
      const stop = { title: plain(hm[1]) };
      const body = [];
      for (const ln of lines.slice(1)) {
        const sm = ln.match(/^\*?(Sites|Lugares|見学地)[:：]\*?[:：]?\s*(.+)$/);
        if (sm) stop.sites = sm[2].split(SEP).map((x) => plain(x));
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
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [!!s.text, s.sites?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opt: p.options.length, rows: p.ownRows.length });
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
    ...Object.fromEntries(p.ownRows.map((r, i) => [`panel${i}`, r.text])),
    ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text]])).filter(([, v]) => v)),
    ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
    ...Object.fromEntries(p.fitFor.map((t, i) => [`fit${i}`, t])),
    ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
  };
};
// Same figures, checked by hand (open items, "Numeric gate (22 Nov)": EN/ES 2, 6, 12, 50; JA adds 1 for 1名様).
const SAME_MEANING = { es: [], ja: ['p0s4.x'] };
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
    included: fact(p.included, 'hcin'), excluded: fact(p.excluded, 'hcout'), options: fact(p.options, 'hcopt'),
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
if (![[OLD.from, OLD.es, OLD.ja].join(), [PRICE, '', ''].join()].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const TIER_FIELDS = ['priceTiers', 'tiers', 'tourLevels', 'levels', 'optionLink', 'optionLinks', 'minimumAge', 'ageLine', 'ageNote'];
const tierLeft = TIER_FIELDS.filter((f) => doc[f] != null);
if (tierLeft.length) throw new Error(`tier/age fields present (${tierLeft.join(', ')}) — retire them first`);
if (doc.seo?.metaTitle?.length) throw new Error('seo.metaTitle exists — set it to the new title too');
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// The essay's old closing (mango juice, "costs almost nothing"): the page has its own closing line.
const CLOSING_REF = { en: '00000000002d', es: '00000000002f', ja: '000000000029' };
// Hidden: the three-category blocks · the café / shisha block · the concierge line · empty blocks · ES: the standfirst.
const SKIP = {
  en: ['000000000005', '000000000007', '000000000015', '000000000017', '000000000019', '00000000001b', '00000000001d', '00000000001f', '000000000021', '000000000029', '00000000003b', '00000000003e'],
  es: ['000000000003', '000000000007', '000000000009', '000000000017', '000000000019', '00000000001b', '00000000001d', '00000000001f', '000000000021', '000000000023', '00000000002b', '00000000003f', '000000000042'],
  ja: ['00000000000b', '00000000000d', '000000000011', '000000000013', '000000000015', '000000000017', '000000000019', '00000000001b', '00000000001d', '000000000025', '000000000037', '00000000003a'],
};
// Whole blocks rewritten (their bold / link runs are lost).
const REPLACE = {
  en: {
    '000000000013': 'This is a private ride, operated for your party alone — you will not be joined by other guests, and it takes bookings from a single person upward, with no minimum group (each carriage carries a maximum of two passengers, a firm limit for the horse’s welfare; larger parties travel in additional carriages). One bottle of mineral water per person is provided. The minimum age is 6, for safety in the carriage.',
    '000000000009': 'None of this is demanding. There are no long walks, no queues, no entrance fees to manage. What the ride offers is the specific pleasure of Luxor after dark — a city that most visitors only pass through on the way to a tomb.',
    '000000000027': 'If you step down to browse the market, the surfaces are uneven and the stalls busy. It is not strenuous, but it is not a smooth-paved heritage circuit either. Comfortable, closed-toe shoes are sensible.',
  },
  es: {
    '000000000015': 'Se trata de una experiencia estrictamente privada, operada en exclusiva para su grupo: no se le sumará a otros huéspedes y se reserva desde una sola persona, sin tamaño mínimo de grupo (cada calesa transporta a un máximo de dos pasajeros, un límite firme en atención al bienestar del caballo; los grupos más amplios viajan en calesas adicionales). Se entrega una botella de agua mineral por persona. La edad mínima es de 6 años, por seguridad en la calesa.',
    '00000000000b': 'Nada de esto es exigente. No hay caminatas largas, ni colas, ni entradas que gestionar. Lo que ofrece el paseo es el placer específico de Luxor después del anochecer: una ciudad que la mayoría de los visitantes solo atraviesa de paso hacia una tumba.',
    '000000000029': 'Si desciende a recorrer el mercado, el suelo es irregular y los puestos están concurridos. No es agotador, pero tampoco es un circuito patrimonial bien pavimentado. Conviene calzado cerrado y cómodo.',
  },
  ja: {
    '00000000000f': 'これは骨の折れる体験ではありません。長い歩きも、行列も、捌くべき入場料もありません。このドライブが差し出すのは、暗くなってからのルクソールという特有の喜びです——大半の来訪者が、墓へ向かう途中に通り過ぎるだけの街です。',
    '000000000023': '馬車を降りて市場を歩く場合は、凹凸のある路面や混み合った露店を縫って進むことになります。骨は折れませんが、舗装の整った遺産の周遊路でもありません。履き心地のよい、つま先の覆われた靴が賢明です。',
  },
};
const body = doc.body.map((row) => {
  const l = row._key;
  if (!REPLACE[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const k of [CLOSING_REF[l], ...SKIP[l], ...Object.keys(REPLACE[l])]) if (!keys.has(k)) throw new Error(`${l}: essay block ${k} missing`);
  return { ...row, value: row.value.map((b) => (REPLACE[l][b._key] ? { ...b, children: [{ ...b.children[0], marks: [], text: REPLACE[l][b._key] }] } : b)) };
});
// Nothing "More about this evening", the summary, the concierge or audience note may keep what the page corrects.
const RETIRED = {
  en: /categor|\btiers?\b|configurations?|guide|mango|shisha|café|cafe|one-hour|four hours|no minimum age|costs almost nothing|1 hour|4 hours/i,
  es: /categor|niveles|configuraciones|guía|mango|shisha|café|una hora|cuatro horas|no hay edad mínima|cuesta poco|1 hora|4 horas/i,
  ja: /カテゴリー|段階|構成|ガイド|マンゴー|シーシャ|カフェ|1時間|4時間/,
};
for (const row of body) {
  const l = row._key;
  if (!RETIRED[l]) continue;
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[l].test(textOf(b))) throw new Error(`${l} ${b._key}: "More about this evening" still shows "${textOf(b).match(RETIRED[l])[0]}": ${textOf(b).slice(0, 120)}`);
}
for (const l of LANGS) if (RETIRED[l].test(SUMMARY[l])) throw new Error(`${l}: summary still shows "${SUMMARY[l].match(RETIRED[l])[0]}"`);

// The audience note named the categories; the concierge note is kept (it carries no tier or age wording).
const AUDIENCE = {
  en: 'Travellers who have done the temples and want the working city after dark, a gentle, unguided evening with someone on hand to help',
  es: 'Viajeros que ya han recorrido los templos y quieren la ciudad en activo después del anochecer: una velada tranquila, sin guía, con alguien a mano para ayudar',
  ja: '神殿を巡り終え、夜の街の営みに触れたい旅人。ガイドなしの穏やかな夕べを、手助けしてくれる人とともに',
};
// shapeOfDay.character named the guide and categories; duration / where named three tiers and the café.
const SHAPE = {
  duration: { en: 'About 2 hours, evening', es: 'Unas 2 horas, por la tarde-noche', ja: '約2時間・夕方以降' },
  where: { en: 'Luxor: the lit temples, the Nile and the local market', es: 'Luxor: los templos iluminados, el Nilo y el mercado local', ja: 'ルクソール：ライトアップされた神殿、ナイル、地元の市場' },
};
const set = {
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  summary: LANGS.map((l) => ({ ...(doc.summary?.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: SUMMARY[l] })),
  audienceNote: LANGS.map((l) => ({ ...(doc.audienceNote?.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: AUDIENCE[l] })),
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
for (const f of ['duration', 'where']) set[`shapeOfDay.${f}`] = LANGS.map((l) => ({ ...(doc.shapeOfDay?.[f]?.find((n) => n._key === l) ?? { _key: l, _type: 'internationalizedArrayStringValue' }), value: SHAPE[f][l] }));
const UNSET = ['guideLanguagePrices', ...(doc.shapeOfDay?.character ? ['shapeOfDay.character'] : [])];
for (const l of LANGS) {
  const note = doc.conciergeNote?.find((n) => n._key === l)?.value ?? '';
  if (RETIRED[l].test(note)) console.log(`WARNING ${l}: concierge note shows "${note.match(RETIRED[l])[0]}": ${note.slice(0, 160)}`);
}

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
console.log(`unset: ${UNSET.join(', ')} (guideLanguagePrices was ${JSON.stringify(doc.guideLanguagePrices)})`);
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
  delete next['shapeOfDay.duration']; delete next['shapeOfDay.where']; delete next.guideLanguagePrices;
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
  await writeRollback(client, [DOC_ID], 'before-luxor-horse-carriage');
  await client.patch(DOC_ID).set(set).unset(UNSET).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (--apply --flags-approved writes production)');
