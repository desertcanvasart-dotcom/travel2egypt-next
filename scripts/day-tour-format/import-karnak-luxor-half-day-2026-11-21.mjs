/**
 * Karnak & Luxor Temple: Private Half-Day Tour in Ancient Thebes, in the day-tour format, EN + ES +
 * JA together. Owner, 21 Nov: the locked copy and its open items (answers of 21 Nov).
 *
 *   tour  wp-page-88397   /private-tour-karnak-temple-luxor-temple   URL unchanged in all three
 *   locales: no redirect. The full-day sibling tour.day-tour-to-karnak-luxor-temples-luxor-museum
 *   (/day-tour-to-karnak-luxor-temples-luxor-museum) is NOT touched: both products stay.
 *
 * The product: a half day of up to 5 hours. Pickup → Karnak → Hatshepsut's obelisk and the Sacred
 * Lake → the Avenue of Sphinxes → Luxor Temple → lunch → back to the hotel within 5 hours of
 * pickup. Entrance to both temples and lunch included, no tiers (the Base / + Entrance / + Lunch
 * tiers go from the essay and its tier summary; the doc has no tier field); children under 12 pay
 * 50 %; no age line. Title = the locked one (the doc has no seo.metaTitle, so the title is also
 * the SEO and og:title). Guide in the page's language, so ES/JA keep their own price
 * (karnak-luxor-half-day-prices.json, Autoura T2E-DT-LXR-02).
 *
 * Panel: Luxor, so not the Cairo rule rows: children 50 % + the copy's pickup line + lunch + guide
 * language. No "Back" panel row: "Back to your hotel · Within 5 hours of pickup." is a stop.
 * "Late morning · Luxor Temple" has no time-of-day value in the schema, so it is written as
 * period 'label' with the copy's heading (ES «Media mañana», JA 午前 with the layout's '・').
 *
 * Essay (Gate A.3, corrections 1–8): 1 the tier paragraph → "Entrance to both temples and lunch at
 * a local restaurant are included." and the tier summary hidden; 2 the private-tour paragraph
 * rewritten with the guide "in your language" (no tiers, no minimum age); 3 "The whole Karnak
 * complex covers about 100 hectares."; 4 "almost three kilometres to the south"; 5 "The wall has
 * long since eroded…" removed; 6 the three superlatives removed (docs/established-superlatives.md
 * has no Tier 1 rows): "the most powerful city in the New Kingdom world", "the wealthiest religious
 * institution…", and the closing sentence that carries "the largest columned room ever
 * constructed" is hidden (JA also loses its own "エジプトで最も高い" obelisk claim); 7 kept;
 * 8 "half a day, up to five hours", and the route reordered Karnak → Avenue → Luxor Temple with
 * its link sentences rewritten. Hidden: the old closing (the page has its own), ES the standfirst,
 * JA the concierge line about the order, empty blocks.
 *
 * Guide links: Karnak · Luxor Temple. No guide page exists for the Great Hypostyle Hall, the
 * Obelisk of Hatshepsut, the Sacred Lake, the Avenue of Sphinxes, the Mosque of Abu Haggag or the
 * Opet Festival (which is not a site line in the copy).
 *
 * needsReview: rows are written approved, as across the batch (true would publish an empty page);
 * nothing is written until the owner says publish.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-karnak-luxor-half-day-2026-11-21.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-karnak-luxor-half-day-2026-11-21.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-karnak-luxor-half-day-2026-11-21.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-88397';
const SIBLING = 'tour.day-tour-to-karnak-luxor-temples-luxor-museum'; // never written
const OLD = { from: 89, es: 100, ja: 107 };
const PRICES = JSON.parse(readFileSync(new URL('./karnak-luxor-half-day-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/karnak-and-luxor-temple-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (21 Nov 2026; prices from Autoura for 2 travellers).`;

const G = {
  karnak: 'guideArticle.luxor.the-karnak-temple',
  luxor: 'guideArticle.luxor.the-luxor-temple',
};
// Sites per stop, in file order: "Karnak · Great Hypostyle Hall", "Obelisk of Hatshepsut · Sacred
// Lake", "Avenue of Sphinxes", "Luxor Temple · Mosque of Abu Haggag". Only Karnak and Luxor Temple
// have a guide page.
const SITE_GUIDES = [[G.karnak, null], [null, null], [null], [G.luxor, null]];
const DURATION_LABEL = { en: 'Half day · up to 5 hrs', es: 'Medio día · hasta 5 h', ja: '半日・最大5時間' };
const DURATION_HOURS = 5;
// The dek / meta description: the locked opening's own words.
const SUMMARY = {
  en: 'This private half day follows the processional way the pharaohs used between the vast precinct of Karnak and Luxor Temple, along the Avenue of Sphinxes, in a few focused hours. With an Egyptologist of your own, the commentary becomes a conversation.',
  es: 'Este medio día privado sigue el camino procesional que usaban los faraones entre el inmenso recinto de Karnak y el templo de Luxor, por la Avenida de las Esfinges, en unas pocas horas bien aprovechadas. Con un egiptólogo para ti solo, las explicaciones se convierten en una conversación.',
  ja: 'このプライベートな半日ツアーでは、広大なカルナック神殿とルクソール神殿のあいだを、ファラオたちが用いた参道、スフィンクス参道に沿ってたどり、凝縮した数時間で巡ります。専属のエジプト学者がつくので、解説は会話になります。',
};
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo' },
  ja: { pickup: 'お迎え', lunch: '昼食' },
};
const PERIOD = { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 昼: 'midday', 午後: 'afternoon' };
// Headings with no time-of-day value in the schema: period 'label', the heading as written.
const LABEL_PERIOD = new Set(['Late morning', 'Media mañana', '午前']);
const LABEL_SEP = { en: ' · ', es: ' · ', ja: '・' }; // what the layout puts between word and place

/* ── Parse ────────────────────────────────────────────────────────────── */
const clean = (s) => s.replace(/[ \t　]+$/gm, '').trim();
const plain = (s) => clean(s.replace(/\*\*|\*/g, ''));
const sections = (md) => md.split(/\n## /).slice(1).map((s) => { const [h, ...rest] = s.split('\n'); return { h: h.trim(), text: rest.join('\n') }; });
const paras = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && p !== '---');
const bullets = (t) => t.split('\n').filter((l) => l.startsWith('- ')).map((l) => clean(l.slice(2)));
// Separator "·" with spaces around it (JA uses full-width spaces: "朝　·　カルナック神殿").
const SEP = /\s+·\s+/;
function parseLocale(l) {
  const md = readFileSync(new URL(LOCKED[l], ROOT), 'utf8');
  const title = plain(md.match(/^# (.+)$/m)[1]);
  const secs = sections(md);
  if (secs.length !== 7) throw new Error(`${l}: expected 7 sections, found ${secs.length}`);
  const [panel, opening, why, day, incl, forYou, mine] = secs;
  const panelRows = Object.fromEntries(panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], plain(m[2])]));
  const periods = day.text.split(/\n### /).slice(1).map((chunk) => {
    const [head, ...rest] = chunk.split('\n');
    const [word, ...labelParts] = head.split(SEP);
    const label = LABEL_PERIOD.has(word.trim());
    const period = label ? 'label' : PERIOD[word.trim()];
    if (!period || !labelParts.length) throw new Error(`${l}: unknown period heading "${head}"`);
    const stops = [];
    for (const p of paras(rest.join('\n'))) {
      if (p.startsWith('>')) continue; // "More about this day →" pointer
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
    const place = plain(labelParts.join(' · '));
    return { period, periodLabel: label ? `${word.trim()}${LABEL_SEP[l]}${place}` : place, stops };
  });
  const sub = (t) => t.split(/\n(?=\*\*)/).map((blk) => ({ h: (blk.match(/^\*\*(.+?)\*\*/) ?? [])[1], items: bullets(blk).map(plain) })).filter((x) => x.h);
  const [inc, exc] = sub(incl.text);
  const [fit, worth] = sub(forYou.text);
  const tail = paras(mine.text);
  return {
    title, panelRows, periods,
    opening: plain(paras(opening.text)[0]), whyThisOrder: plain(paras(why.text)[0]),
    included: inc.items, excluded: exc.items, fitFor: fit.items, worthKnowing: worth.items,
    options: bullets(mine.text).map(plain), closingLine: plain(tail[tail.length - 1]),
  };
}
const P = Object.fromEntries(LANGS.map((l) => [l, parseLocale(l)]));
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [!!s.text, s.sites?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
  if (shape(P.en) !== shape(P[l])) throw new Error(`${l} structure differs from EN:\n ${shape(P.en)}\n ${shape(P[l])}`);
}
for (const l of LANGS) for (const k of ['pickup', 'lunch']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel (${Object.keys(P[l].panelRows).join(', ')})`);
const siteStops = P.en.periods.flatMap((x) => x.stops).filter((s) => s.sites);
if (siteStops.length !== SITE_GUIDES.length || siteStops.some((s, i) => s.sites.length !== SITE_GUIDES[i].length)) throw new Error('sites ≠ SITE_GUIDES');

/* ── Numeric gate ─────────────────────────────────────────────────────── */
const flat = (l) => {
  const p = P[l];
  return {
    opening: p.opening, why: p.whyThisOrder, closing: p.closingLine,
    ...Object.fromEntries(Object.keys(PANEL.en).map((k) => [`panel.${k}`, p.panelRows[PANEL[l][k]]])),
    ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text]])).filter(([, v]) => v)),
    ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
    ...Object.fromEntries(p.fitFor.map((t, i) => [`fit${i}`, t])),
    ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
  };
};
// Checked by hand (21 Nov), same meaning as EN (the open items' "Numeric gate (21 Nov)"): ES wk0
// «Los dos recintos» = "Both sites" (the gate reads «dos» as 2); JA in0
// 1名様 = "from one traveller"; p0s1.x セティ1世・ラムセス2世 = Seti I, Ramses II (the figures 1, 2);
// p1s0.x アメンヘテプ3世・ラムセス2世 = Amenhotep III, Ramses II (3, 2) — EN writes the regnal numbers
// in Roman numerals, which the gate does not read.
const SAME_MEANING = { es: ['wk0'], ja: ['in0', 'p0s1.x', 'p1s0.x'] };
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
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'klin'), excluded: fact(p.excluded, 'klout'), options: fact(p.options, 'klopt'),
  };
}
const B = Object.fromEntries(LANGS.map((l) => [l, build(l)]));

/* ── Document and essay ───────────────────────────────────────────────── */
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const doc = await client.getDocument(DOC_ID);
if (!doc) throw new Error(`${DOC_ID} not found`);
if (doc.type !== 'dayTour') throw new Error('not a day tour');
if (DOC_ID === SIBLING) throw new Error('wrong document');
if (await client.getDocument(`drafts.${DOC_ID}`)) throw new Error(`drafts.${DOC_ID} exists — handle it first`);
const priceNow = [doc.priceFrom, doc.guideLanguagePrices?.es, doc.guideLanguagePrices?.ja].join();
if (![[OLD.from, OLD.es, OLD.ja].join(), [PRICES.en, PRICES.es, PRICES.ja].join()].includes(priceNow)) throw new Error(`unexpected prices ${priceNow}`);
// Tier / age / option-link fields: none exist on this doc today (tiers live only in the essay and
// in the old inclusion rows, which this import replaces). Refuse if one has appeared since.
const TIER_FIELDS = ['priceTiers', 'tiers', 'tourLevels', 'levels', 'optionLink', 'optionLinks', 'minimumAge', 'ageLine', 'ageNote'];
const tierLeft = TIER_FIELDS.filter((f) => doc[f] != null);
if (tierLeft.length) throw new Error(`tier/age fields present (${tierLeft.join(', ')}) — retire them first`);
if (doc.seo?.metaTitle?.length) throw new Error('seo.metaTitle exists — set it to the new title too');
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// "Some days in Egypt feel long. This one earns it." — the page has its own closing line now.
const CLOSING_REF = { en: '00000000003c', es: '00000000003e', ja: '00000000002c' };
// The superlative closing sentence ("…the largest columned room ever constructed", correction 6) ·
// the tier summary (correction 1) · empty blocks · ES: the standfirst · JA: the concierge line
// about the order (Luxor Temple in the morning or Karnak first).
const SKIP = {
  en: ['00000000003a', '00000000004a', '00000000004d'],
  es: ['000000000003', '00000000003c', '00000000004e', '000000000051'],
  ja: ['00000000002a', '00000000003a', '00000000003d'],
};
// Whole blocks rewritten (bold runs lost): the private-tour paragraph (2, no tiers, no minimum age)
// and the tier paragraph (1). JA has neither.
const REPLACE = {
  en: {
    '000000000017': 'This is a private tour, operated for your party alone and never shared with other guests. Because it is private, it runs for as few as one traveller, with no minimum group size and no waiting on other bookings; larger parties are accommodated in a suitable vehicle. A private, air-conditioned vehicle, a licensed Egyptologist guide in your language and one bottle of mineral water per person are included. Both sites are large and open to the sun, so come prepared for the heat.',
    '00000000001f': 'Entrance to both temples and lunch at a local restaurant are included.',
  },
  es: {
    '000000000019': 'Se trata de un tour estrictamente privado, operado en exclusiva para su grupo y nunca compartido con otros viajeros. Por su carácter privado, opera desde un único viajero, sin tamaño mínimo de grupo y sin esperar otras reservas; los grupos más amplios se acomodan en un vehículo adecuado. Se incluyen un vehículo privado con aire acondicionado, un guía egiptólogo licenciado en su idioma y una botella de agua mineral por persona. Ambos yacimientos son extensos y están expuestos al sol, así que conviene prever el calor.',
    '000000000021': 'Se incluyen la entrada a ambos templos y el almuerzo en un restaurante local.',
  },
  ja: {},
};
// Correction 8: the route in the day's order — Karnak, its obelisk and lake, the Avenue, then
// Luxor Temple. These are the route's blocks in their NEW order; they take the route's slots.
const ROUTE = {
  en: ['00000000002c', '000000000030', '000000000032', '000000000029', '000000000025', '000000000027'],
  es: ['00000000002e', '000000000032', '000000000034', '00000000002b', '000000000027', '000000000029'],
  ja: ['00000000001c', '000000000020', '000000000022', '000000000019', '000000000015', '000000000017'],
};
// [block, find, replace] — corrections 3, 4, 5, 6, 8 and the route's link sentences.
const FIX = {
  en: [
    ['000000000001', 'A Day in Ancient Thebes', 'Half a Day in Ancient Thebes'], // 8 (essay title)
    ['000000000005', ', the most powerful city in the New Kingdom world.', '.'], // 6
    ['000000000005', 'To spend a day moving between Luxor Temple and the Karnak complex', 'To spend a morning moving between the Karnak complex and Luxor Temple'], // 8
    ['000000000007', 'A full day is the right amount of time:', 'Half a day, up to five hours, is the right amount of time:'], // 8 (7 kept)
    ['00000000002c', ' is the second stop,', ' is the first stop,'], // 8
    ['00000000002c', 'At its height, the precinct of Amun alone covered more than 100 hectares.', 'The whole Karnak complex covers about 100 hectares.'], // 3
    ['000000000032', 'The wall has long since eroded; the obelisk remains. ', ''], // 5
    ['000000000029', 'That avenue — lined', 'The Avenue of Sphinxes — lined'], // 8 (now follows the Sacred Lake)
    ['000000000025', 'The day begins at ', 'The avenue leads to '], // 8
    ['000000000038', 'Amun — the state god of the New Kingdom, the divine patron of pharaonic power — and was the wealthiest religious institution in the ancient world at its peak.', 'Amun, the state god of the New Kingdom and the divine patron of pharaonic power.'], // 6
    ['000000000038', 'a kilometre and a half to the south', 'almost three kilometres to the south'], // 4
  ],
  es: [
    ['000000000001', 'Un día en la antigua Tebas', 'Medio día en la antigua Tebas'],
    ['000000000007', ', la ciudad más poderosa del mundo del Imperio Nuevo—.', '—.'],
    ['000000000007', 'Pasar el día moviéndose entre el templo de Luxor y el complejo de Karnak', 'Pasar una mañana moviéndose entre el complejo de Karnak y el templo de Luxor'],
    ['000000000009', 'Un día completo es la cantidad de tiempo adecuada:', 'Medio día, hasta cinco horas, es la cantidad de tiempo adecuada:'],
    ['00000000002e', ' es la segunda parada,', ' es la primera parada,'],
    ['00000000002e', 'En su apogeo, solo el recinto de Amón cubría más de 100 hectáreas.', 'El complejo de Karnak en su conjunto cubre unas 100 hectáreas.'],
    ['000000000034', 'El muro hace mucho que se erosionó; el obelisco permanece. ', ''],
    ['00000000002b', 'Esa avenida —flanqueada', 'La Avenida de las Esfinges —flanqueada'],
    ['000000000027', 'El día arranca en el ', 'La avenida lleva al '],
    ['00000000003a', 'Amón —el dios del Estado del Imperio Nuevo, patrón divino del poder faraónico— y, en su apogeo, fue la institución religiosa más rica del mundo antiguo.', 'Amón, el dios del Estado del Imperio Nuevo y patrón divino del poder faraónico.'],
    ['00000000003a', 'a kilómetro y medio al sur', 'a casi tres kilómetros al sur'],
  ],
  ja: [
    ['000000000007', '古代テーベで過ごす一日', '古代テーベで過ごす半日'],
    ['00000000000b', '新王国時代の世界で最も強大だった都市、古代テーベ', '古代テーベ'],
    ['00000000000b', 'ルクソール神殿とカルナック複合体のあいだを一日かけて', 'カルナック複合体とルクソール神殿のあいだを半日かけて'],
    ['00000000000d', '一日というのが、ちょうどよい時間です', '最大5時間の半日というのが、ちょうどよい時間です'],
    ['00000000001c', 'が二つめの立ち寄り先で', 'が最初の立ち寄り先で'],
    ['00000000001c', 'その絶頂期には、アムン神域だけで100ヘクタール以上を覆っていました。', 'カルナック神殿複合体全体の広さは、約100ヘクタールです。'],
    ['000000000022', 'およそ29.5メートルでエジプトで最も高いもの', 'およそ29.5メートル'],
    ['000000000022', '壁はとうに崩れ去り、オベリスクは残っています。', ''],
    ['000000000019', 'その参道——', 'スフィンクス参道——'],
    ['000000000015', '一日は、近代の街の中心', '参道の先は、近代の街の中心'],
    ['000000000015', 'から始まります。ここの建設', 'です。ここの建設'],
    ['000000000028', 'ファラオの権力の守護神であり、その絶頂期には古代世界で最も富裕な宗教施設でした。', 'ファラオの権力の守護神でした。'],
    ['000000000028', 'その1.5キロメートル南にある', 'その3キロメートル近く南にある'],
  ],
};
const body = doc.body.map((row) => {
  const l = row._key;
  if (!FIX[l]) return row;
  const keys = new Set(row.value.map((b) => b._key));
  for (const k of [CLOSING_REF[l], ...SKIP[l], ...Object.keys(REPLACE[l]), ...ROUTE[l], ...FIX[l].map(([k]) => k)]) if (!keys.has(k)) throw new Error(`${l}: essay block ${k} missing`);
  let value = row.value.map((b) => {
    if (REPLACE[l][b._key]) return { ...b, children: [{ ...b.children[0], marks: [], text: REPLACE[l][b._key] }] };
    const fixes = FIX[l].filter(([k]) => k === b._key);
    if (!fixes.length) return b;
    const children = b.children.map((c) => ({ ...c }));
    for (const [, find, repl] of fixes) {
      const alts = [find, find.replace(/'/g, '’'), find.replace(/’/g, "'")];
      const i = children.findIndex((c) => alts.some((x) => c.text.includes(x)));
      if (i < 0 && (repl === '' || children.some((c) => [repl, repl.replace(/'/g, '’')].some((x) => c.text.includes(x))))) continue; // re-run
      if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
      children[i].text = children[i].text.replace(alts.find((x) => children[i].text.includes(x)), (m) => (m.includes('’') ? repl.replace(/'/g, '’') : repl));
    }
    return { ...b, children };
  });
  // Reorder: the route blocks fill their own slots in the new order (re-runs are a no-op).
  const byKey = new Map(value.map((b) => [b._key, b]));
  const routeSet = new Set(ROUTE[l]);
  let next = 0;
  value = value.map((b) => (routeSet.has(b._key) ? byKey.get(ROUTE[l][next++]) : b));
  return { ...row, value };
});
// Nothing "More about this day", the summary or the concierge note shows may keep what the page
// corrects: tiers, the English-only guide, the age line, a full day / eight hours, Luxor Temple
// first, 1.5 km, "more than 100 hectares", the eroded wall, the superlatives.
const RETIRED = {
  en: /\btiers?\b|Base \+|English-speaking|minimum age|families are welcome|full day|one focused day|eight hours|\b8 hours|kilometre and a half|1\.5 km|more than 100 hectares|long since eroded|most powerful city|wealthiest|largest columned|ancient world's greatest|second stop|The day begins at|That avenue/i,
  es: /\bniveles?\b|Base \+|habla hispana|edad mínima|familias son bienvenidas|día completo|un día concentrado|ocho horas|\b8 horas|kilómetro y medio|1,5 km|más de 100 hectáreas|se erosionó|más poderosa|más rica|mayor sala de columnas|mayores complejos|segunda parada|El día arranca|Esa avenida/i,
  ja: /段階|料金構成|終日|8時間|八時間|一日かけて|過ごす一日|一日というのが|密度の高い一日|1\.5キロ|100ヘクタール以上|とうに崩れ|最も強大|最も富裕|最大の柱の間|エジプトで最も高い|最も偉大な|二つめの立ち寄り先|から始まります|その参道/,
};
for (const row of body) {
  const l = row._key;
  if (!RETIRED[l]) continue;
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[l].test(textOf(b))) throw new Error(`${l} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[l])[0]}"`);
  // Karnak before Luxor Temple in the shown essay's route.
  const shown = row.value.filter((b) => !hidden.has(b._key)).map(textOf).join('\n');
  const karnak = { en: 'Karnak is the first stop', es: 'Karnak es la primera parada', ja: 'カルナックが最初の立ち寄り先' }[l];
  const luxor = { en: 'The avenue leads to Luxor Temple', es: 'La avenida lleva al templo de Luxor', ja: '参道の先は、近代の街の中心' }[l];
  if (!(shown.indexOf(karnak) >= 0 && shown.indexOf(karnak) < shown.indexOf(luxor))) throw new Error(`${l}: the essay's route is not Karnak → Luxor Temple`);
}
for (const l of LANGS) {
  if (RETIRED[l].test(SUMMARY[l])) throw new Error(`${l}: summary still shows "${SUMMARY[l].match(RETIRED[l])[0]}"`);
  const note = doc.conciergeNote?.find((n) => n._key === l)?.value ?? '';
  if (RETIRED[l].test(note)) throw new Error(`${l}: concierge note still shows "${note.match(RETIRED[l])[0]}"`);
}

const set = {
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

/* ── Gates ────────────────────────────────────────────────────────────── */
// JA "午前　·　ルクソール神殿" with the separator the layout uses for every other period heading.
const ALLOW = { ja: { '午前・ルクソール神殿': `${LOCKED.ja} heading "午前　·　ルクソール神殿"` } };
for (const l of LANGS) {
  const rows = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]], ALLOW[l] ?? {});
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });
if (!ready) console.log('prices: NOT READY — fill karnak-luxor-half-day-prices.json from Autoura (EN, ES and JA guide). Nothing can be applied yet.');

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  summary ${l}: ${set.summary.find((t) => t._key === l).value}`);
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine} · lunch: ${B[l].intro.lunch.text}`);
  console.log(`  timeline ${l}: ${JSON.stringify(B[l].timeline.map((x) => [x.period, x.periodLabel, x.stops.map((s) => [s.title, (s.sites ?? []).map((z) => z.name)])]))}`);
  const essay = set.body.find((r) => r._key === l).value;
  const before = doc.body.find((r) => r._key === l).value;
  for (const b of essay) {
    const old = before.find((x) => x._key === b._key);
    if (textOf(old) !== textOf(b)) console.log(`  essay ${l} ${b._key}: ${textOf(b).slice(0, 160)}…`);
  }
  console.log(`  essay ${l} order: ${essay.map((b) => b._key.slice(-2)).join(' ')}`);
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  const empty = essay.filter((b) => !hidden.has(b._key) && !textOf(b).trim()).map((b) => b._key);
  console.log(`  essay ${l}: ${essay.length} blocks, ${essay.length - hidden.size} shown${empty.length ? `, EMPTY shown: ${empty.join(', ')}` : ''}`);
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
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'durationLabel', 'citySlugsEn', 'allSlugs'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  if (!ready) throw new Error('prices not ready — fill karnak-luxor-half-day-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-karnak-luxor-half-day');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
