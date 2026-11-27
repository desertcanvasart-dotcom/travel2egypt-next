/**
 * Luxor Hot-Air Balloon over the West Bank: Sunrise or After-Sunrise Flight, in the day-tour format, EN + ES + JA
 * together (owner, 22 Nov: "Update the Skyward Solitude copy now"; the second listing was retired into this page,
 * PR #351).
 *
 *   tour  wp-page-133463   /skyward-solitude-private-luxor-sunrise-hot-air-balloon-experience   (URLs unchanged)
 *
 * Two flights (sunrise, after-sunrise), each with its own price, chosen at booking: the copy says so in the panel,
 * the title, "Why the day runs this way", "Worth knowing" and "Make it your own". The prices live in the booking
 * engine, not in the copy: THIS PAGE'S priceFrom (EUR 85, the lower one, "From") is left as it is, as are the
 * Spanish / Japanese steps (96 / 103), because the site has no per-flight price field. No minimum age (rule 9: the
 * concierge note's "eighteen or over" and shapeOfDay.character, which carried it, go). No lunch (an early-morning
 * flight). Taken over from the retired listing: tea or coffee after landing, a flight certificate, "rest of the day
 * free" in the Back row. The panel's own rows (dayTourIntro.panelRows) replace the rule rows.
 *
 * Essay (Gate A.3, corrections 1-8): the essay is kept except: the sunrise-only wording made two-flight (pickup,
 * ascent), "tomb cluster cut into the south face" -> "the hidden valley behind the cliffs where the royal tombs are
 * cut", "has shifted very little in three thousand years" removed, "in roughly this order" -> "depending on the
 * wind", "most densely monumented in the world" -> "a landscape dense with monuments", "the only way most travellers
 * will see it" -> "From the air, most travellers see it that way for the first time". Hidden: the standfirst
 * ("thousand feet", sunrise only), the old closing (the page has its own), the concierge line, the empty block.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-luxor-balloon-2026-11-22.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-luxor-balloon-2026-11-22.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-luxor-balloon-2026-11-22.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-133463';
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/luxor-sunrise-balloon';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (22 Nov 2026).`;

const G = {
  colossi: 'guideArticle.luxor.the-colossi-of-memnon',
  hatshepsut: 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut',
  valley: 'guideArticle.luxor.valley-of-the-kings',
  karnak: 'guideArticle.luxor.the-karnak-temple',
};
// Sites seen from the air, in file order: Colossi of Memnon · Temple of Hatshepsut · Valley of the Kings · Karnak.
const SITE_GUIDES = [[G.colossi, G.hatshepsut, G.valley, G.karnak]];
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
        const sm = ln.match(/^\*?(Sites|Lugares|見学地)[^:：]*[:：]\*?[:：]?\s*(.+)$/);
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
const SAME_MEANING = { es: ['opening'], ja: ['opening', 'p0s2.x'] };
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
if (doc.priceFrom !== 85) throw new Error(`unexpected priceFrom ${doc.priceFrom} (the page's lower flight price, EUR 85, is left as it is)`);
const TIER_FIELDS = ['priceTiers', 'tiers', 'tourLevels', 'levels', 'optionLink', 'optionLinks', 'minimumAge', 'ageLine', 'ageNote'];
const tierLeft = TIER_FIELDS.filter((f) => doc[f] != null);
if (tierLeft.length) throw new Error(`tier/age fields present (${tierLeft.join(', ')}) — retire them first`);
if (doc.seo?.metaTitle?.length) throw new Error('seo.metaTitle exists — set it to the new title too');
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// The essay's old closing line: the page has its own closing line (the copy's italic last line).
const CLOSING_REF = { en: '000000000015', es: '000000000015', ja: '000000000015' };
// Hidden: the standfirst (sunrise-only, "thousand feet") · the concierge line · the empty block.
const SKIP = {
  en: ['000000000003', '000000000023', '000000000026'],
  es: ['000000000003', '000000000023', '000000000026'],
  ja: ['000000000003', '000000000023', '000000000026'],
};
// [block, find, replace] — corrections 1-8; each find sits inside one text run.
const FIX = {
  en: [
    ['000000000005', 'is one of the most densely monumented landscapes in the world', 'is a landscape dense with monuments'], // 5
    ['000000000005', 'From a hot-air balloon at sunrise, it is one map.', 'From a hot-air balloon at sunrise or just after, it is one map.'], // 7
    ['000000000007', 'with pre-dawn pickup from your Luxor hotel', 'with early-morning pickup (before dawn for the sunrise flight) from your Luxor hotel'], // 7
    ['00000000000b', 'Pickup is well before dawn — the flights launch with the sun, and the briefing and inflation take place in the dark.', 'There are two flights, sunrise and after-sunrise, each with its own price. For the sunrise flight, pickup is well before dawn: the balloon launches with the sun, and the briefing and inflation take place in the dark. The after-sunrise flight lifts off a little later in the morning, once the sun is up.'], // 7
    ['00000000000d', 'Ascent happens at the moment the sky begins to brighten.', 'On the sunrise flight, ascent happens at the moment the sky begins to brighten.'], // 7
    ['00000000000d', ' that has shifted very little in three thousand years', ''], // 2
    ['00000000000d', 'Then, in roughly this order as the light comes up:', 'Then, depending on the wind, as the light comes up:'], // 3
    ['00000000000d', ', which is the tomb cluster cut into the south face of the cliff', ', the hidden valley behind the cliffs where the royal tombs are cut'], // 1
    ['000000000013', 'The balloon is the only way most travellers will see it that way.', 'From the air, most travellers see it that way for the first time.'], // 4
  ],
  es: [
    ['000000000005', 'es uno de los paisajes con mayor densidad monumental del mundo', 'es un paisaje de gran densidad monumental'],
    ['000000000005', 'Desde un globo aerostático al amanecer, todo eso es un único mapa.', 'Desde un globo aerostático al amanecer o poco después, todo eso es un único mapa.'],
    ['000000000007', 'con recogida antes del amanecer en su hotel', 'con recogida a primera hora de la mañana (antes del amanecer en el vuelo al amanecer) en su hotel'],
    ['00000000000b', 'La recogida se produce bastante antes del amanecer: los vuelos despegan con el sol, y la sesión informativa y el inflado se llevan a cabo aún de noche.', 'Hay dos vuelos, al amanecer y después del amanecer, cada uno con su propio precio. En el vuelo al amanecer, la recogida se produce bastante antes del alba: el globo despega con el sol, y la sesión informativa y el inflado se llevan a cabo aún de noche. El vuelo posterior despega un poco más tarde por la mañana, con el sol ya alto.'],
    ['00000000000d', 'El ascenso coincide con el momento en que el cielo empieza a clarear.', 'En el vuelo al amanecer, el ascenso coincide con el momento en que el cielo empieza a clarear.'],
    ['00000000000d', ' que apenas se ha desplazado en tres mil años', ''],
    ['00000000000d', 'Luego, en este orden a medida que sube la luz:', 'Luego, según el viento, a medida que sube la luz:'],
    ['00000000000d', ', el conjunto de tumbas excavado en la cara sur del acantilado', ', el valle oculto tras los acantilados donde se excavaron las tumbas reales'],
    ['000000000013', 'El globo es la única manera en que la mayoría de los viajeros llegará a verlo así.', 'Desde el aire, la mayoría de los viajeros lo ve así por primera vez.'],
  ],
  ja: [
    ['000000000005', '世界でもっとも遺跡が密集した景観のひとつです', '遺跡が密集した景観です'],
    ['000000000005', '日の出の熱気球から見れば', '日の出（または日の出後）の熱気球から見れば'],
    ['000000000007', '未明にお迎え', '早朝（日の出フライトは未明）にお迎え'],
    ['00000000000b', 'お迎えは夜明けよりずっと前。日の出と同時に上昇するため、ブリーフィングと膨張作業は、暗いうちに進みます。', 'フライトは日の出フライトと日の出後フライトの2つで、料金はそれぞれ異なります。日の出フライトでは、お迎えは夜明けよりずっと前。日の出と同時に上昇するため、ブリーフィングと膨張作業は、暗いうちに進みます。日の出後フライトは、日が昇ったあと、朝の少し遅い時間に離陸します。'],
    ['00000000000d', '空が明るくなりはじめる、その瞬間に上昇します。', '日の出フライトでは、空が明るくなりはじめる、その瞬間に上昇します。'],
    ['00000000000d', '三千年のあいだ、ほとんど動いていない線です。', ''],
    ['00000000000d', '続いて、光がのぼってくるにつれ、おおむねこの順序で姿を現します', '続いて、風次第ですが、光がのぼってくるにつれて姿を現します'],
    ['00000000000d', '王家の谷、つまり崖の南面に刻まれた墓の集合体', '王家の谷、崖の裏の隠れた谷に王墓が刻まれた場所'],
    ['000000000013', '多くの旅人にとって、それが見える唯一の機会が、この気球です。', '空から見て初めて、多くの旅人にはそれが見えてきます。'],
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
        const i = children.findIndex((c) => c.text.includes(find));
        if (i < 0 && (repl === '' || children.some((c) => c.text.includes(repl)))) continue; // re-run
        if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
        children[i].text = children[i].text.replace(find, () => repl);
      }
      return { ...b, children };
    }),
  };
});
// Nothing "More about this day", the summary or the concierge note may keep what the page corrects.
const RETIRED = {
  en: /minimum age|eighteen|18 or over|thousand feet|densely monumented|only way most travellers|three thousand years|south face|roughly this order|tomb cluster/i,
  es: /edad mínima|dieciocho|mil pies|densidad monumental del mundo|única manera en que|tres mil años|cara sur|en este orden|conjunto de tumbas/i,
  ja: /18歳|十八歳|千フィート|もっとも遺跡が密集|唯一の機会|三千年|南面|おおむねこの順序|墓の集合体/,
};
for (const row of body) {
  const l = row._key;
  if (!RETIRED[l]) continue;
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[l].test(textOf(b))) throw new Error(`${l} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[l])[0]}"`);
}
for (const l of LANGS) if (RETIRED[l].test(SUMMARY[l])) throw new Error(`${l}: summary still shows "${SUMMARY[l].match(RETIRED[l])[0]}"`);

// The concierge note carried the age line (rule 9: "eighteen or over" goes).
const NOTE = {
  en: [', and flyers must be eighteen or over.', '.'],
  es: [', y para volar hay que haber cumplido los dieciocho.', '.'],
  ja: ['、ご搭乗は18歳以上に限られます。', '。'],
};
const conciergeNote = LANGS.map((l) => {
  const row = doc.conciergeNote.find((n) => n._key === l);
  const [find, repl] = NOTE[l];
  const v = row.value.includes(find) ? row.value.replace(find, repl) : row.value;
  if (RETIRED[l].test(v)) throw new Error(`${l}: concierge note still shows an age line: ${v.slice(0, 160)}`);
  return { ...row, value: v };
});
const set = {
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  summary: LANGS.map((l) => ({ ...(doc.summary?.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: SUMMARY[l] })),
  conciergeNote,
  dayTourIntro: LANGS.map((l) => ({ ...B[l].intro, closingRef: CLOSING_REF[l], skipRefs: SKIP[l] })),
  dayTimeline: LANGS.flatMap((l) => B[l].timeline),
  inclusions: LANGS.flatMap((l) => B[l].included),
  exclusions: LANGS.flatMap((l) => B[l].excluded),
  customisationOptions: LANGS.flatMap((l) => B[l].options),
  body,
};
for (const f of ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions']) set[f] = curlyRows(set[f], 'en');
// shapeOfDay.character carried "minimum age 18" (rule 9); the day-tour layout does not show it.
const UNSET = doc.shapeOfDay?.character ? ['shapeOfDay.character'] : [];
/* ── Gates ────────────────────────────────────────────────────────────── */
for (const l of LANGS) {
  const rows = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]], {});
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
console.log(`unset: ${UNSET.join(', ') || 'nothing'}; priceFrom stays ${doc.priceFrom}, guideLanguagePrices stay ${JSON.stringify(doc.guideLanguagePrices)}`);
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
  next.shapeOfDay = { ...doc.shapeOfDay, character: undefined };
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
  await writeRollback(client, [DOC_ID], 'before-skyward-balloon');
  await client.patch(DOC_ID).set(set).unset(UNSET).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (--apply --flags-approved writes production)');
