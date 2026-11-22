/**
 * The Grand West Bank: Valley of the Kings, Valley of the Queens & Deir el-Medina, Private Day Tour, in the
 * day-tour format, EN + ES + JA together (owner, 22 Nov: locked copy + open items; "Now do the Grand West Bank").
 *
 *   tour  wp-page-88170   /private-tour-full-day-to-grand-west-bank   (URLs unchanged: no redirect)
 *
 * No tiers. Included: entrance to all six sites (three tombs in the Valley of the Kings, the standard Valley of
 * the Queens ticket), lunch, water, the driver's tip. Tutankhamun's tomb (KV62) and Nefertari's tomb are EXTRA
 * tickets BOUGHT AT THE SITE (owner, 22 Nov): no priced add-ons, no daily cap / "we confirm your place". Nefertari's
 * tomb is CLOSED at present with no reopening date (owner): the locked copy was reworded accordingly on 22 Nov
 * (review/locked/luxor-grand-west-bank-day-tour{,.es,.ja}.md carry the changes). No minimum age; the children's
 * 50 % row is the copy's own panel row (own rows replace the rule rows).
 *
 * Price: luxor-grand-west-bank-prices.json (Autoura T2E-DT-LXR-10, created 22 Nov): EN 115.18 → €116, ES 126.18
 * → €127, JA 142.70 → €143 (2 travellers, margin 30 %, rounded up; the engine's "Extended day" Luxor car,
 * guide, six entrances, lunch, water). Live today: €118 / ES €129 / JA €136 (tiered).
 *
 * Essay (Gate A.3, corrections 1-8): the tier paragraphs are rewritten to the kept sentence; "English-speaking" and
 * "no minimum age" go; the Tutankhamun / Nefertari passages say "extra ticket, bought at the site" and Nefertari is
 * closed; superlatives softened ("the finest decorated tomb" -> "For us, ... the most beautiful painted tomb",
 * "largest such complex" -> "his great mortuary temple", "without parallel" -> "like few others", "more than
 * almost any other" -> "more than most", "one of the most concentrated stretches" -> "a rare concentration of
 * royal funerary architecture", Deir el-Medina's craftsmen softened); "most underrated" kept.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-luxor-grand-west-bank-2026-11-22.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-luxor-grand-west-bank-2026-11-22.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-luxor-grand-west-bank-2026-11-22.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-88170';
const OLD = { from: 118, es: 129, ja: 136 };
const PRICES = JSON.parse(readFileSync(new URL('./luxor-grand-west-bank-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/luxor-grand-west-bank-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (22 Nov 2026).`;

const G = {
  vok: 'guideArticle.luxor.valley-of-the-kings',
  voq: 'guideArticle.luxor.valley-of-the-queens',
  colossi: 'guideArticle.luxor.the-colossi-of-memnon',
  hatshepsut: 'guideArticle.luxor.the-mortuary-temple-of-queen-hatshepsut',
};
// Sites per stop, in file order: Valley of the Kings, Valley of the Queens, Colossi of Memnon, Temple of Hatshepsut,
// Medinet Habu, Deir el-Medina (the last two have no guide page).
const SITE_GUIDES = [[G.vok], [G.voq], [G.colossi], [G.hatshepsut], [null], [null]];
const DURATION_LABEL = { en: 'Full day · ~9 hrs', es: 'Día completo · ~9 h', ja: '1日・約9時間' };
const DURATION_HOURS = 9;
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo' },
  ja: { pickup: 'お迎え', lunch: '昼食' },
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
for (const l of LANGS) for (const k of ['pickup', 'lunch']) if (!P[l].panelRows[PANEL[l][k]]) throw new Error(`${l}: no ${k} row in the panel (${Object.keys(P[l].panelRows).join(', ')})`);
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
const SAME_MEANING = { es: ['opening', 'p0s3.x'], ja: ['opening', 'p0s1.x'] };
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
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
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

// The essay's two closing sentences (the page has its own closing line): block 1 = closingRef, block 2 hidden.
const CLOSING_REF = { en: '000000000033', es: '000000000035', ja: '000000000023' };
// Hidden: the closing's second sentence · the tier summary line (concierge) · empty blocks · ES: the standfirst.
const SKIP = {
  en: ['000000000035', '000000000043', '000000000046'],
  es: ['000000000003', '000000000037', '000000000047', '00000000004a'],
  ja: ['000000000025', '000000000033', '000000000036'],
};
// Whole blocks rewritten (their bold / link runs are lost): the private-tour paragraph (no tiers, no minimum age,
// the guide in your language), the tier paragraph (correction 1), the Nefertari paragraph (closed; extra ticket).
const REPLACE = {
  en: {
    '000000000017': 'This is a private tour, operated for your party alone — never shared with other guests. Because it is private, it runs for as few as one traveller, with no minimum group size and no waiting on other bookings; larger parties are accommodated in a suitable vehicle. A private, air-conditioned vehicle, a licensed Egyptologist guide in your language, and one bottle of mineral water per person are included. It is a long, hot day on foot with steep tomb descents — families with young children should weigh that honestly.',
    '00000000001f': 'Entrance to all six sites, with three tombs in the Valley of the Kings and the standard Valley of the Queens ticket, and lunch at a local restaurant are included. The tombs of Tutankhamun and Nefertari are extra tickets, bought at the site.',
    '000000000025': 'From the Valley of the Kings, the route moves to the Valley of the Queens, about two kilometres to the south. This is the burial ground of royal consorts, princes, and princesses of the Ramesside period. The tomb of Queen Nefertari — principal wife of Ramses II — is the centrepiece of the valley, but it is closed to visitors at present, and there is no date for its reopening; if it reopens, its ticket is an extra, bought at the site. Carved and painted around 1255 BC, it covers more than five hundred square metres of wall surface with scenes from the Book of Gates and the Book of the Dead, and the colours have survived with extraordinary fidelity. For us, it’s the most beautiful painted tomb in Egypt. Visitor numbers inside are limited to protect the pigment.',
  },
  es: {
    '000000000019': 'Se trata de un tour estrictamente privado, operado en exclusiva para su grupo y nunca compartido con otros viajeros. Por su carácter privado, opera desde un único viajero, sin tamaño mínimo de grupo y sin esperas a otras reservas; los grupos más amplios se acomodan en un vehículo adecuado. Se incluyen un vehículo privado con aire acondicionado, un guía egiptólogo licenciado en tu idioma y una botella de agua mineral por persona. Es una jornada larga y calurosa a pie con descensos empinados a las tumbas: las familias con niños pequeños deberían sopesarlo con honestidad.',
    '000000000021': 'Las entradas a los seis lugares, con tres tumbas en el Valle de los Reyes y la entrada estándar al Valle de las Reinas, y el almuerzo en un restaurante local están incluidos. Las tumbas de Tutankamón y de Nefertari son entradas aparte, que se compran en el lugar.',
    '000000000027': 'Desde el Valle de los Reyes, la ruta se desplaza al Valle de las Reinas, a unos dos kilómetros al sur. Es el cementerio de las consortes reales, los príncipes y las princesas del periodo ramésida. La tumba de la reina Nefertari —esposa principal de Ramsés II— es la pieza central del valle, pero está cerrada a las visitas por ahora y no hay fecha de reapertura; si reabre, su entrada es aparte y se compra en el lugar. Tallada y pintada hacia el 1255 a. C., cubre más de quinientos metros cuadrados de pared con escenas del Libro de las Puertas y del Libro de los Muertos, y el color ha sobrevivido con una fidelidad extraordinaria. Para nosotros, es la tumba pintada más hermosa de Egipto. El cupo de visitantes está limitado para proteger el pigmento.',
  },
  ja: {
    '000000000015': '王家の谷から、ルートはおよそ2キロメートル南の王妃の谷へ移ります。ここはラムセス朝の王妃、王子、王女たちの埋葬地です。王妃ネフェルタリ——ラムセス2世の正妃——の墓は谷の中心ですが、現在は見学できず、再開の時期は未定です。再開された場合は別のチケットが必要で、現地で購入します。紀元前1255年ごろに彫られ彩色され、500平方メートルを超える壁面を、門の書と死者の書の場面で覆い、その色彩は並外れた忠実さで生き延びました。私たちにとって、エジプトで最も美しい彩色の墓です。顔料を守るために内部の入場者数は制限されています。',
  },
};
// [block, find, replace] — corrections 2-6; each find sits inside one text run.
const FIX = {
  en: [
    ['000000000003', 'is one of the most concentrated stretches of ancient funerary architecture on earth', 'is a rare concentration of royal funerary architecture'], // 6
    ['000000000023', 'requires a separate ticket and is included on this tour: it is smaller', 'requires a separate ticket, bought at the site: it is smaller'], // 8
    ['000000000027', 'his mortuary temple, the largest such complex ever built in Egypt.', 'his great mortuary temple.'], // 4
    ['00000000002d', 'This is a site without parallel in the ancient world:', 'This is a site like few others:'], // 5
    ['00000000002d', 'these were the finest craftsmen in Egypt, and they buried themselves accordingly', 'these were the same craftsmen who decorated the royal tombs, painting for themselves'],
    ['000000000031', 'more than almost any other site in the ancient world', 'more than most sites in the ancient world'], // 5
  ],
  es: [
    ['000000000005', 'es uno de los tramos más concentrados de arquitectura funeraria antigua del planeta', 'es una concentración poco común de arquitectura funeraria real'],
    ['000000000025', 'requiere entrada aparte y se incluye en este tour:', 'requiere entrada aparte, que se compra en el lugar:'],
    ['000000000029', 'al templo funerario del rey, el mayor complejo de su clase nunca levantado en Egipto.', 'a su gran templo funerario.'],
    ['00000000002f', 'Es un yacimiento sin parangón en el mundo antiguo:', 'Es un yacimiento como pocos:'],
    ['00000000002f', 'eran los mejores oficiales del país, y se enterraban en consecuencia', 'eran los mismos artesanos que decoraron las tumbas reales, y pintaron para sí mismos'],
    ['000000000033', 'más que casi cualquier otro yacimiento del mundo antiguo', 'más que la mayoría de los yacimientos del mundo antiguo'],
  ],
  ja: [
    ['000000000009', '地上で最も密集した古代の葬祭建築の一区間のひとつです', '王家の葬祭建築が際立って密集した場所です'],
    ['000000000013', 'ツタンカーメンの墓は別のチケットを要し、このツアーに含まれます', 'ツタンカーメンの墓は別のチケットが必要で、現地で購入します'],
    ['000000000017', 'かつてエジプトでこれまでに築かれた最大のその種の複合体である彼の葬祭殿への入口', 'かつて彼の広大な葬祭殿への入口'],
    ['00000000001d', 'これは古代世界に並ぶもののない遺跡です', 'これはほかにほとんど例のない遺跡です'],
    ['00000000001d', '彼らはエジプトでも最も優れた職人であり、それにふさわしく自らを葬りました', '彼らは王墓を飾ったのと同じ職人たちで、自分たちのために描きました'],
    ['000000000021', '古代世界のほかのほぼどの遺跡をも上回ります', '古代世界のたいていの遺跡を上回ります'],
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
        const alts = [find, find.replace(/'/g, '’')];
        const i = children.findIndex((c) => alts.some((x) => c.text.includes(x)));
        if (i < 0 && children.some((c) => c.text.includes(repl))) continue; // re-run
        if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
        children[i].text = children[i].text.replace(alts.find((x) => children[i].text.includes(x)), () => repl);
      }
      return { ...b, children };
    }),
  };
});
// Nothing "More about this day", the summary or the notes may keep what the page corrects.
const RETIRED = {
  en: /\btiers?\b|Base \+|minimum age|English-speaking|most concentrated stretches|finest decorated|largest such|without parallel|almost any other|included on this tour|best craftsmen|finest craftsmen|daily cap|confirm your place/i,
  es: /tres niveles|cada nivel|nivel Base|Base \+|edad mínima|habla hispana|tramos más concentrados|tumba decorada más fina|mayor complejo|sin parangón|casi cualquier otro|se incluye en este tour|mejores oficiales|cupo diario/i,
  ja: /段階|18歳|最低年齢|密集した古代の葬祭建築|最も見事な装飾|最大のその種|並ぶもののない|ほかのほぼどの|このツアーに含まれます|最も優れた職人|枠の確保/,
};
for (const row of body) {
  const l = row._key;
  if (!RETIRED[l]) continue;
  const hidden = new Set([CLOSING_REF[l], ...SKIP[l]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[l].test(textOf(b))) throw new Error(`${l} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[l])[0]}"`);
}
for (const l of LANGS) {
  if (RETIRED[l].test(SUMMARY[l])) throw new Error(`${l}: summary still shows "${SUMMARY[l].match(RETIRED[l])[0]}"`);
  const note = doc.conciergeNote?.find((n) => n._key === l)?.value ?? '';
  if (RETIRED[l].test(note)) throw new Error(`${l}: concierge note still shows "${note.match(RETIRED[l])[0]}"`);
}
// shapeOfDay.character carried the tiers and Nefertari "included"; duration / where said 8-10 hours and Nefertari.
const SHAPE = {
  duration: { en: 'Full day, about 9 hours across six sites', es: 'Día completo, unas 9 horas por seis lugares', ja: '終日、約9時間（6か所）' },
  where: { en: 'Luxor West Bank: Valley of the Kings, Valley of the Queens, Colossi of Memnon, Hatshepsut, Medinet Habu, Deir el-Medina', es: 'Orilla oeste de Luxor: Valle de los Reyes, Valle de las Reinas, Colosos de Memnón, Hatshepsut, Medinet Habu, Deir el-Medina', ja: 'ルクソール西岸：王家の谷、王妃の谷、メムノンの巨像、ハトシェプスト葬祭殿、メディネト・ハブ、デイル・エル・メディナ' },
};
const set = {
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  summary: LANGS.map((l) => ({ ...(doc.summary?.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: SUMMARY[l] })),
  'seo.metaTitle': LANGS.map((l) => ({ ...(doc.seo?.metaTitle?.find((t) => t._key === l) ?? { _key: l, _type: 'internationalizedArrayStringValue' }), value: P[l].title })),
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
  if (f === 'body' || f.startsWith('shapeOfDay') || f === 'seo.metaTitle') continue;
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
  next.seo = { ...doc.seo, metaTitle: set['seo.metaTitle'] };
  delete next['shapeOfDay.duration']; delete next['shapeOfDay.where']; delete next['seo.metaTitle'];
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
  await writeRollback(client, [DOC_ID], 'before-grand-west-bank');
  await client.patch(DOC_ID).set(set).unset(UNSET).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (--apply --flags-approved writes production)');
