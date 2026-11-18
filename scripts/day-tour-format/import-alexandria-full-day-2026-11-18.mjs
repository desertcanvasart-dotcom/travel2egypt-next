/**
 * Alexandria Full-Day Private Tour (from a hotel in Alexandria or a cruise ship at the port)
 * in the day-tour format, EN + ES + JA together — tour 4 of the day-tour batch. Owner, 18 Nov:
 * "Keep €84, redirect it" (the second "Alexandria in a Day" page, by
 * retire-alexandria-in-a-day-2026-11-18.mjs):
 *   - price kept: €84; ES €95, JA €102
 *   - defaults: Kom El Dikka "Roman times" (as on the Alexandria day trip from Cairo);
 *     "about 8 hours"; the Bibliotheca ticket as written (library); no cruise-day drop order
 * The owner's open items are already in the locked copy: starts in Alexandria (hotel or
 * cruise ship), the Bibliotheca added, Qaitbey visited inside, no tiers, no age line.
 *
 *   tour  wp-page-87309   /private-tour-alexandria-day-tour
 *
 * Essay (Gate A.3, open items 1–10): written for an older version (a drive from Cairo, six
 * stops, Qaitbey from outside, tiers); those passages are left out of "More about this day",
 * the rest corrected: Kom El Dikka "Roman times" and "one of the few"; about 27 m and no
 * "largest monolith"; the catacombs "among the most important"; the museum "a rich
 * collection"; Qaitbey visited inside; 331 BC; no "surpassing Rome"; JA 絶景 (banned) gone.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-alexandria-full-day-2026-11-18.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-alexandria-full-day-2026-11-18.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-alexandria-full-day-2026-11-18.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-87309';
// The owner kept the live prices.
const OLD_PRICES = { from: 84, es: 95, ja: 102 };
const PRICE = 84;
const GUIDE_PRICES = { es: 95, ja: 102 };
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/alexandria-full-day-private-tour-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (18 Nov 2026; owner: "Keep €84, redirect it").`;

const G = {
  catacombs: 'guideArticle.alexandria.catacombs-of-kom-el-shoqafa',
  theatre: 'guideArticle.alexandria.roman-theatre',
  museum: 'guideArticle.alexandria.the-greco-roman-museum',
  pillar: 'guideArticle.alexandria.pompeys-pillar',
  serapeum: 'guideArticle.alexandria.the-serapeum-temple',
  bibliotheca: 'guideArticle.alexandria.bibliotheca-alexandrina',
  qaitbey: 'guideArticle.alexandria.qaitbey-fort',
};
const JA_SITES = [['コム・エル・シュカーファのカタコンベ'], ['コム・エル・ディッカのローマ劇場'], ['グレコ・ローマン博物館'], ['ポンペイの柱', 'セラペウム'], ['アレクサンドリア図書館'], ['カーイトベイの要塞'], ['アレクサンドリアのコルニッシュ通り', '東港']];
// Sites per stop, in file order. No guide page for the Corniche or the Eastern Harbour.
const SITE_GUIDES = [[G.catacombs], [G.theatre], [G.museum], [G.pillar, G.serapeum], [G.bibliotheca], [G.qaitbey], [null, null]];
const DURATION_LABEL = { en: 'Full day · ~8 hrs', es: 'Día completo · ~8 h', ja: '終日・約8時間' };
const DURATION_HOURS = 8;
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch', back: 'Back' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo', back: 'Regreso' },
  ja: { pickup: 'お迎え', lunch: '昼食', back: 'お戻り' },
};
const PERIOD = { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 午前: 'morning', 昼: 'midday', 午後: 'afternoon' };

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
  const panelRows = Object.fromEntries(panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim()]));
  const periods = day.text.split(/\n### /).slice(1).map((chunk) => {
    const [head, ...rest] = chunk.split('\n');
    // Split on the first separator only: JA names contain 「・」 (アブ・シンベル).
    const [, word, label] = head.match(/^(.+?)\s*[·・]\s*(.+)$/);
    const period = PERIOD[word.trim()];
    if (!period) throw new Error(`${l}: unknown period "${word}"`);
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
    title, panelRows, periods,
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
for (const l of LANGS) for (const k of ['pickup', 'lunch', 'back']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel`);

/* ── Numeric gate: ES/JA figures equal EN, string by string ──────────── */
const flat = (p) => ({
  opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
  ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text]])).filter(([, v]) => v)),
  ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
  ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
});
// Same meaning, checked by hand 18 Nov: JA p0s1.x "forty-five minutes" = 45分 (the gate reads the
// EN words as 40 and 5); JA p2s2.x (Qaitbey) "on three sides" = 三方 (kanji, not read by the gate).
const SAME_MEANING = { es: [], ja: ['p0s1.x', 'p2s2.x'] };
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
      pickupLine: p.panelRows[PANEL[l].pickup], returnNote: p.panelRows[PANEL[l].back],
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'afin'), excluded: fact(p.excluded, 'afout'), options: fact(p.options, 'afopt'),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));

/* ── Document and essay ───────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (doc.type !== 'dayTour') throw new Error('not a day tour');
// On a re-run the prices are already the new ones.
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja].join();
if (![[OLD_PRICES.from, OLD_PRICES.es, OLD_PRICES.ja].join(), [PRICE, GUIDE_PRICES.es, GUIDE_PRICES.ja].join()].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

const CLOSING_REF = { en: '000000000041', es: '000000000043', ja: '000000000046' };
// The older version's passages (the drive from Cairo and "six stops", the tiers and "no
// minimum age"), the closing line's second half, the concierge lines, the empty block.
const SKIP = {
  en: ['000000000005', '000000000015', '00000000001d', '000000000043', '000000000051', '000000000054'],
  es: ['000000000007', '000000000017', '00000000001f', '000000000045', '000000000055', '000000000058'],
  ja: ['00000000000b', '00000000001b', '000000000023', '000000000048', '000000000056', '000000000059'],
};
// [block, find, replace] — open items 1–10 and the defaults; the find text sits in one run.
const FIX = {
  en: [
    ['000000000023', 'represent the most important Roman-period funerary site in Egypt', 'are among the most important Roman-period funerary sites in Egypt'],
    ['000000000027', 'the only Roman-era odeon excavated so far in Egypt', 'one of the few Roman-era theatres excavated in Egypt'],
    ['000000000027', 'Built in the fourth century AD and in use through the seventh', 'Built in Roman times and in use through the seventh century'],
    ['00000000002b', "holds the city's most significant collection of objects", 'holds a rich collection of objects'],
    ['000000000031', 'stands 26.85 metres tall in polished red Aswan granite, and is the largest ancient monolith in Egypt outside of Luxor and the Giza complex.', 'stands about 27 metres tall in polished red Aswan granite.'],
    ['000000000035', 'The route then moves to the harbour for an exterior stop at ', 'The route then moves to the harbour and into '],
    ['000000000035', 'The stop here is a photo opportunity and a moment to take in the harbour panorama rather than a full internal visit; the exterior framing, with the Mediterranean behind and the city stretching east along the shore, is the point.', 'You go inside, through its halls and up to the ramparts, with the Mediterranean behind and the city stretching east along the shore.'],
    ['000000000039', 'first planned in 332 BC', 'first planned in 331 BC'],
    ['00000000003d', 'founded by Alexander the Great in 332 BC', 'founded by Alexander the Great in 331 BC'],
    ['00000000003d', 'became the largest city in the Mediterranean world, surpassing Rome itself in population for a period.', 'became one of the largest cities in the Mediterranean world.'],
  ],
  es: [
    ['000000000025', 'representan el sitio funerario más importante de época romana en Egipto', 'están entre los sitios funerarios más importantes de época romana en Egipto'],
    ['000000000029', 'el único odeón de época romana excavado hasta ahora en Egipto', 'uno de los pocos odeones de época romana excavados en Egipto'],
    ['000000000029', 'Construido en el siglo IV d. C. y en uso hasta el siglo VII', 'Construido en época romana y en uso hasta el siglo VII'],
    ['00000000002d', 'alberga la colección más significativa de la ciudad de objetos', 'alberga una rica colección de objetos'],
    ['000000000033', 'alcanza 26,85 metros en granito rojo pulido de Asuán y es el mayor monolito antiguo de Egipto fuera de Luxor y del complejo de Guiza.', 'alcanza unos 27 metros en granito rojo pulido de Asuán.'],
    ['000000000037', 'La ruta se mueve después al puerto para una parada exterior en la ', 'La ruta se mueve después al puerto y entra en la '],
    ['000000000037', 'La parada aquí es oportunidad de foto y un momento para asimilar la panorámica del puerto antes que una visita interior completa; el encuadre exterior, con el Mediterráneo de fondo y la ciudad extendiéndose al este por la orilla, es el punto.', 'Entras en la fortaleza, recorres sus salas y subes a las murallas, con el Mediterráneo de fondo y la ciudad extendiéndose al este por la orilla.'],
    ['00000000003b', 'en 332 a. C.', 'en 331 a. C.'],
    ['00000000003f', 'en 332 a. C.', 'en 331 a. C.'],
    ['00000000003f', 'se convirtió en la mayor ciudad del mundo mediterráneo, sobrepasando incluso a Roma en población durante un periodo.', 'se convirtió en una de las mayores ciudades del mundo mediterráneo.'],
  ],
  ja: [
    ['000000000029', 'エジプトで最も重要なローマ期の埋葬遺跡です', 'エジプトでも有数のローマ期の埋葬遺跡です'],
    ['00000000002d', 'エジプトでこれまでに発掘された唯一のローマ期のオデオンです', 'エジプトで発掘された数少ないローマ期のオデオンのひとつです'],
    ['00000000002d', '紀元4世紀に築かれ7世紀まで使われたこの劇場は', 'ローマ時代に築かれ7世紀まで使われたこの劇場は'],
    ['000000000030', 'この街で最も重要な収蔵品を抱えます', '充実した収蔵品を抱えます'],
    ['000000000036', '高さ26.85メートル、ルクソールとギザ複合体を除けばエジプト最大の古代の一枚岩です。', '高さ約27メートルです。'],
    ['000000000036', 'アレクサンドリアでも知られざる絶景のひとつです', 'アレクサンドリアでも知られざる眺めのよい場所のひとつです'],
    ['00000000003a', 'で外観の立ち寄りをします。', 'の中へ入ります。'],
    ['00000000003a', 'ここでの立ち寄りは、内部の本格的な見学ではなく、撮影と港のパノラマを味わうひととき——背後に地中海、海岸沿いに東へ伸びる街を収める外観の構図こそが、その眼目です。', '要塞の中に入り、広間を抜けて城壁の上へ。背後に地中海、海岸沿いに東へ伸びる街が見渡せます。'],
    ['00000000003e', '紀元前332年', '紀元前331年'],
    ['000000000042', '紀元前332年', '紀元前331年'],
    ['000000000042', '地中海世界最大の都市となり、一時はローマそのものを人口で上回りました。', '地中海世界で最大級の都市のひとつとなりました。'],
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
// Nothing "More about this day" shows may keep the old convoy product or a corrected claim.
const RETIRED = {
  en: /which tier|332 BC|26\.85|exterior stop|full internal visit|largest ancient monolith|surpassing Rome|the only Roman-era|fourth century AD|most significant collection|represent the most important/i,
  es: /332 a\. C|26,85|parada exterior|visita interior completa|mayor monolito|sobrepasando incluso|el único odeón|siglo IV d\. C|colección más significativa|el sitio funerario más importante/i,
  ja: /段階|332年|26\.85|外観の立ち寄り|本格的な見学ではなく|最大の古代の一枚岩|ローマそのものを人口|唯一のローマ期|紀元4世紀|最も重要な収蔵品|最も重要なローマ期|絶景/,
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
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine} · back: ${B[l].intro.returnNote} · lunch: ${B[l].intro.lunch.text}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.periodLabel, x.stops.map((s) => (s.time ? `${s.time} · ` : '') + s.title)]))}`);
  for (const b of set.body.find((r) => r._key === l).value) {
    const before = doc.body.find((r) => r._key === l).value.find((x) => x._key === b._key);
    if (textOf(before) !== textOf(b)) console.log(`  essay ${l} ${b._key}: ${textOf(b).slice(0, 170)}…`);
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
    out[l] = Object.fromEntries(['title', 'priceFrom', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'citySlugsEn'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  await writeRollback(client, [DOC_ID], 'before-alexandria-full-day');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (pass --apply --flags-approved to write production)');
