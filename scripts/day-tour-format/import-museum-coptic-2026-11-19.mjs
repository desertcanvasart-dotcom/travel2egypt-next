/**
 * Egyptian Museum, Coptic Cairo, Al-Muizz Street & Khan El Khalili in the day-tour format,
 * EN + ES + JA together. Owner, 19 Nov: the locked copy and its open-items answers
 * ("Instructions for Claude Code" §1–§3).
 *
 *   tour  wp-page-87729   /egyptian-museum-and-bazaar-tour  →  /egyptian-museum-coptic-cairo-al-muizz-and-khan-el-khalili
 *   (the same document: reviews, images and references stay attached; 301s in the same commit,
 *   migration/redirect-map.*; hard-coded links to the old addresses are updated afterwards by
 *   relink-museum-coptic-2026-11-19.mjs)
 *
 * The product (owner, 19 Nov): pickup → Egyptian Museum → Hanging Church → Abu Serga and Ben
 * Ezra → lunch → Al-Muizz Street → Khan El Khalili → back. Entrance to the Egyptian Museum,
 * Coptic Cairo and the Al-Muizz monuments (combined ticket), lunch, water and the driver's tip
 * included; no tiers; children under 12 pay 50 %; no age line. Title "Egyptian Museum, Coptic
 * Cairo, Al-Muizz Street & Khan El Khalili: Private Day Tour" (it names all four stops). Guide in
 * the page's language, so ES/JA keep their own price (museum-coptic-prices.json; --apply refuses
 * while any is null).
 *
 * New slugs: EN and ES as proposed; JA follows the repo's pattern (Hepburn romaji of the Japanese
 * title before the colon, as the old ichi-nichi-de-meguru-kairo-… and the guide pages
 * ejiputo-kokogaku-hakubutsukan / koputo / muizzu-dori / han-eru-hariri), not the proposed
 * English-spelled egypt-hakubutsukan-copt-… — reported in the PR.
 *
 * Panel: the city is Cairo, so the rule rows show (children 50 %, the Cairo/Giza pickup zones,
 * guide = page language); the intro carries the pickup line and the lunch text, as the Cairo car
 * and guide import does. No Back row (the copy gives no return time). The EN copy's
 * "(ES: español · JA: 日本語)" note is an editor's aside, not written.
 *
 * Summary (the dek and, with no seo.metaDescription, the meta description): it must name all
 * four stops (open items §2), and the old one named none of Coptic Cairo or Al-Muizz. The new
 * one is built from the locked opening's own words. Title / SEO title / og:title follow the
 * title (the document has no seo.metaTitle).
 *
 * Essay (Gate A.3, the correction table 1–10): 2 "still a vast collection"; 3 "the quarter's
 * best-known site"; 4 "an early Christian space"; 5 "the oldest synagogue in Cairo" REMOVED (not
 * approved as Tier 1; the rest of that sentence, the 19th-century restoration and the Geniza,
 * stays because the next sentence depends on it); 6 "dense with medieval architecture"; 7 the
 * fortress date removed; 8 "since the Mamluk period" (the 14th-century and 15th-century claims
 * removed); 9 Al-Fishawy "operating continuously since 1773, according to its own account" (this
 * page only; the site-wide sweep is another PR; the café's spelling is unchanged in every locale);
 * 10 Al-Muizz Street added to the essay title. Row 1 is the concierge note (conciergeNote field):
 * "This day earns its exhaustion" in all three; the day-tour layout does not render the
 * concierge note in any locale, so it is hidden in JA (and EN/ES) on this page.
 * Left out of "More about this day": the closing's second half (the page has its own closing),
 * the helper note (now "Make it your own"), ES: the standfirst.
 *
 * needsReview: the open items ask for `needsReview: true`, but the site shows only rows with
 * needsReview == false (src/sanity/lib/queries.ts), so `true` would publish an empty page. As
 * with every page in this batch, nothing is written until the owner says publish; that OK is the
 * approval, and the rows are written approved.
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-museum-coptic-2026-11-19.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-museum-coptic-2026-11-19.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-museum-coptic-2026-11-19.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'wp-page-87729';
const OLD = { from: 81, es: 92, ja: 99 };
const PRICES = JSON.parse(readFileSync(new URL('./museum-coptic-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/egyptian-museum-coptic-cairo-al-muizz-khan-el-khalili-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (19 Nov 2026; prices from Autoura for 2 travellers).`;

const G = {
  tahrir: 'guideArticle.cairo.egyptian-museum-of-antiquities',
  hanging: 'guideArticle.cairo.hanging-church-al-mu-allaqa',
  abuSerga: 'guideArticle.cairo.church-of-saint-sergius-and-bacchus-abu-serga',
  benEzra: 'guideArticle.cairo.ben-ezra-synagogue',
  muizz: 'guideArticle.cairo.sharia-al-muizz-li-din-allah',
  qalawun: 'guideArticle.cairo.madrassa-mausoleum-of-qalawun',
  ghuri: 'guideArticle.cairo.al-ghuriyya-complex',
  khan: 'guideArticle.cairo.khan-el-khalili',
};
// Sites per stop that has them, in file order: "Egyptian Museum"; "Hanging Church · Abu Serga ·
// Ben Ezra Synagogue"; "Al-Muizz Street · Qalawun Complex · Al-Ghuri Complex"; "Khan El Khalili ·
// Al-Fishawy" (no guide page for the café). Coptic Cairo (wp-page-63606) has a guide page but no
// site line of its own; the GEM and the NMEC have only blog articles — reported in the PR.
const SITE_GUIDES = [[G.tahrir], [G.hanging, G.abuSerga, G.benEzra], [G.muizz, G.qalawun, G.ghuri], [G.khan, null]];
const DURATION_LABEL = { en: 'Full day · ~8 hrs', es: 'Día completo · ~8 h', ja: '1日・約8時間' };
const DURATION_HOURS = 8;
// New addresses (open items §3). JA: the repo's romaji pattern (see the header).
const NEW_SLUG = {
  en: 'egyptian-museum-coptic-cairo-al-muizz-and-khan-el-khalili',
  es: 'museo-egipcio-cairo-copto-al-muizz-y-jan-el-jalili',
  ja: 'ejiputo-kokogaku-hakubutsukan-koputo-chiku-muizzu-dori-han-hariri',
};
// The dek / meta description: the locked opening's own words, naming all four stops.
const SUMMARY = {
  en: 'A private day in Cairo, in order: the Egyptian Museum on Tahrir Square, the churches and synagogue of Coptic Cairo, Al-Muizz Street and the Khan El Khalili bazaar.',
  es: 'Un día privado en El Cairo, en orden: el Museo Egipcio de la plaza Tahrir, las iglesias y la sinagoga del Cairo copto, la calle Al-Muizz y el bazar del Jan el-Jalili.',
  ja: 'カイロを順番にたどるプライベートな1日。タハリール広場のエジプト考古学博物館、コプト地区の教会とシナゴーグ、ムイッズ通り、ハーン・ハリーリのバザール。',
};
// Correction 1 (the concierge note). Not rendered by the day-tour layout in any locale.
const CONCIERGE = {
  en: ['The summary says it plainly: this day earns its exhaustion,', 'This day earns its exhaustion,'],
  es: ['El resumen lo dice sin rodeos: es un día que se gana su cansancio,', 'Es un día que se gana su cansancio,'],
  ja: ['包み隠さず言えば、これは疲れるだけの価値がある一日で、', 'これは疲れるだけの価値がある一日で、'],
};
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo' },
  ja: { pickup: 'お迎え', lunch: '昼食' },
};
const PERIOD = { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 昼: 'midday', 午後: 'afternoon' };

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
  const panelRows = Object.fromEntries(panel.text.split('\n').map((x) => x.match(/^\*\*(.+?)[:：]\*\*\s*(.*)$/)).filter(Boolean).map((m) => [m[1], plain(m[2])]));
  const periods = day.text.split(/\n### /).slice(1).map((chunk) => {
    const [head, ...rest] = chunk.split('\n');
    const [word, ...labelParts] = head.split(SEP);
    const period = PERIOD[word.trim()];
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
    return { period, periodLabel: plain(labelParts.join(' · ')), stops };
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
// Checked by hand (19 Nov), same meaning as EN: ES wk0 «las dos son visitas aparte» = EN "both
// separate visits" (the gate reads «dos» as 2, EN "both" as no figure). JA why / wk2 「正午から三時」
// = EN "between noon and three", and p0s1.x 「約二時間」 = EN "about two hours": the copy writes
// these in kanji numerals, which the gate does not read (1902 / 3100 / 100,000 do match).
const SAME_MEANING = { es: ['wk0'], ja: ['why', 'p0s1.x', 'wk2'] };
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
    included: fact(p.included, 'mcin'), excluded: fact(p.excluded, 'mcout'), options: fact(p.options, 'mcopt'),
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
const textOf = (b) => (b.children ?? []).map((c) => c.text).join('');

// The closing's first half ("Cairo asks you to hold contradictions…"), now the page's own closing.
const CLOSING_REF = { en: '000000000033', es: '000000000036', ja: '000000000039' };
// The closing's second half · the helper note (now "Make it your own") · ES: the standfirst.
const SKIP = {
  en: ['000000000035', '000000000044'],
  es: ['000000000003', '000000000038', '000000000049'],
  ja: ['00000000003b', '00000000004a'],
};
// [block, find, replace] — corrections 2–10 (open items, Gate A.3). Row 5 removes the claim.
// Finds inside bold runs («Hanging Church», «Iglesia Colgante», 「宙吊り教会」) start after the run.
const FIX = {
  en: [
    ['000000000001', "One City, Three Worlds: Cairo's Museum, Old Quarter & Bazaar", "One City, Three Worlds: Cairo's Museum, Old Quarter, Al-Muizz Street & Bazaar"], // 10
    ['000000000003', 'the bazaar that has been selling spices and silverware since the fourteenth century.', 'the bazaar that has traded here since the Mamluk period.'], // 8
    ['000000000011', 'this is still one of the largest holdings of ancient Egyptian material anywhere.', 'this is still a vast collection.'], // 2
    ['000000000015', 'the Roman fortress of Babylon, built around the first century BC, and the layering', 'the Roman fortress of Babylon, and the layering'], // 7
    ['000000000019', " (Al-Mu'allaqa) is the most visited site in the quarter, and it earns the attention.", " is the quarter's best-known site, and it earns the attention."], // 3 (after the bold «Hanging Church»)
    ['00000000001c', 'is among the oldest Christian spaces in Egypt.', 'is an early Christian space.'], // 4
    ['000000000020', 'It is the oldest synagogue in Cairo, restored in the nineteenth century, and notable in part because', 'Restored in the nineteenth century, it is notable in part because'], // 5
    ['000000000029', 'one of the most architecturally dense in the Islamic world.', 'dense with medieval architecture.'], // 6
    ['00000000002d', 'The current market largely dates to the fifteenth century, though it has been rebuilt and extended many times.', 'It has been rebuilt and extended many times.'], // 8
    ['00000000002d', 'a coffeehouse that has reportedly operated continuously since 1773, sits', 'a coffeehouse operating continuously since 1773, according to its own account, sits'], // 9
  ],
  es: [
    ['000000000001', 'Una ciudad, tres mundos: museo, barrio antiguo y bazar de El Cairo', 'Una ciudad, tres mundos: museo, barrio antiguo, calle Al-Muizz y bazar de El Cairo'],
    ['000000000005', 'el bazar que vende especias y orfebrería desde el siglo XIV.', 'el bazar donde se comercia desde la época mameluca.'],
    ['000000000013', 'sigue siendo uno de los mayores fondos de material del Egipto antiguo en cualquier parte.', 'sigue siendo una colección vastísima.'],
    ['000000000017', 'la fortaleza romana de Babilonia, levantada en torno al siglo I a. C., y la superposición', 'la fortaleza romana de Babilonia, y la superposición'],
    ['00000000001b', ' (al-Muallaqa) es el sitio más visitado del barrio,', ' es el sitio más conocido del barrio,'],
    ['00000000001f', 'figura entre los espacios cristianos más antiguos de Egipto.', 'es un espacio cristiano temprano.'],
    ['000000000023', 'Es la sinagoga más antigua del Cairo, restaurada en el siglo XIX, y notable en parte porque', 'Restaurada en el siglo XIX, es notable en parte porque'],
    ['00000000002c', 'se convirtió, a lo largo de los cinco siglos siguientes, en una de las más densas arquitectónicamente del mundo islámico.', 'se llenó, a lo largo de los cinco siglos siguientes, de arquitectura medieval.'],
    ['000000000030', 'El mercado actual data en gran medida del siglo XV, aunque se ha reconstruido y ampliado muchas veces.', 'Se ha reconstruido y ampliado muchas veces.'],
    ['000000000030', 'un café que supuestamente funciona sin interrupción desde 1773, ocupa', 'un café en funcionamiento sin interrupción desde 1773, según su propio relato, ocupa'],
  ],
  ja: [
    ['000000000007', 'ひとつの街、三つの世界：カイロの博物館、旧市街＆バザール', 'ひとつの街、三つの世界：カイロの博物館、旧市街、ムイッズ通り＆バザール'],
    ['000000000009', '14世紀から香辛料と銀細工を売ってきたバザール、ハーン・ハリーリです。', 'マムルーク朝の時代から商いが続くバザール、ハーン・ハリーリです。'],
    ['000000000017', 'これはいまだに、世界のどこにあっても最大級の古代エジプト資料の収蔵のひとつです。', 'これはいまだに膨大なコレクションです。'],
    ['00000000001d', 'ローマ時代のバビロン要塞（紀元前1世紀ごろに築かれた）の上に', 'ローマ時代のバビロン要塞の上に'],
    ['000000000020', '（アル・ムアッラカ）はこの一角で最も多く訪れられる場所であり', 'はこの一角で最もよく知られた場所であり'],
    ['000000000023', 'エジプトで最も古いキリスト教の空間のうちにあります。', '初期キリスト教の空間です。'],
    ['000000000026', 'カイロで最も古いシナゴーグで、19世紀に修復されました。', '19世紀に修復されています。'],
    ['00000000002f', 'イスラム世界で最も建築的に密集した通りのひとつとなりました。', '中世の建築が密集する通りとなりました。'],
    ['000000000033', '現在の市場はおおむね15世紀にさかのぼりますが、幾度も建て替えられ拡張されてきました。', '市場は幾度も建て替えられ拡張されてきました。'],
    ['000000000033', 'その言い分によれば1773年から休まず営業を続けているコーヒーハウス', '店自身によれば1773年から営業を続けているコーヒーハウス'],
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
        if (i < 0 && (repl === '' || children.some((c) => [repl, repl.replace(/'/g, '’')].some((x) => c.text.includes(x))))) continue; // re-run
        if (i < 0) throw new Error(`${l} ${b._key}: "${find.slice(0, 50)}" not found in one run`);
        children[i].text = children[i].text.replace(alts.find((x) => children[i].text.includes(x)), (m) => (m.includes('’') ? repl.replace(/'/g, '’') : repl));
      }
      return { ...b, children };
    }),
  };
});
// Nothing "More about this day" shows may keep what the page corrects.
const RETIRED = {
  en: /largest holdings|most visited site|oldest Christian|oldest synagogue|most architecturally dense|first century BC|fourteenth century|fifteenth century|reportedly/i,
  es: /mayores fondos|más visitado|más antiguos de Egipto|sinagoga más antigua|más densas arquitect|siglo I a\. C\.|siglo XIV|siglo XV\b|supuestamente/i,
  ja: /最大級|最も多く訪れられる|最も古いキリスト教|最も古いシナゴーグ|最も建築的に密集|紀元前1世紀|14世紀|15世紀|言い分/,
};
for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const hidden = new Set([CLOSING_REF[row._key], ...SKIP[row._key]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
  const shown = row.value.filter((b) => !hidden.has(b._key)).map(textOf).join('\n');
  if (!/Muizz|ムイッズ/.test(textOf(row.value[0]))) throw new Error(`${row._key}: the essay title does not name Al-Muizz Street`);
  if (!/1773/.test(shown)) throw new Error(`${row._key}: the Al-Fishawy line is gone`);
}
const conciergeNote = LANGS.map((l) => {
  const row = doc.conciergeNote?.find((n) => n._key === l);
  if (!row) throw new Error(`${l}: no concierge note`);
  const [find, repl] = CONCIERGE[l];
  if (!row.value.includes(find) && !row.value.startsWith(repl)) throw new Error(`${l}: concierge note changed since 19 Nov`);
  return { ...row, value: row.value.replace(find, repl) };
});

// The new slugs must be free (any document type, in any locale).
const taken = await client.fetch('*[_id != $id && !(_id in path("drafts.**")) && count(slug[value.current in $slugs]) > 0]{_id}', { id: DOC_ID, slugs: Object.values(NEW_SLUG) });
if (taken.length) throw new Error(`new slug already used by ${taken.map((t) => t._id).join(', ')}`);

const set = {
  title: LANGS.map((l) => ({ ...(doc.title.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: P[l].title })),
  slug: doc.slug.map((s) => (NEW_SLUG[s._key] ? { ...s, value: { ...s.value, current: NEW_SLUG[s._key] } } : s)),
  summary: LANGS.map((l) => ({ ...(doc.summary?.find((t) => t._key === l) ?? { _key: l, _type: 'object' }), value: SUMMARY[l] })),
  conciergeNote,
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
for (const l of LANGS) {
  const rows = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });
if (!ready) console.log('prices: NOT READY — fill museum-coptic-prices.json from Autoura (EN, ES and JA guide). Nothing can be applied yet.');

for (const f of Object.keys(set)) {
  if (f === 'body') continue;
  const v = set[f];
  console.log(`${f}: ${Array.isArray(v) ? `${(doc[f] ?? []).length} → ${v.length} rows` : `${JSON.stringify(doc[f])} → ${JSON.stringify(v)}`}`);
}
for (const l of LANGS) {
  console.log(`title ${l}: ${doc.title.find((t) => t._key === l)?.value} → ${set.title.find((t) => t._key === l).value}`);
  console.log(`  slug ${l}: ${doc.slug.find((s) => s._key === l)?.value.current} → ${NEW_SLUG[l]}`);
  console.log(`  summary ${l}: ${set.summary.find((t) => t._key === l).value}`);
  console.log(`  concierge ${l}: ${conciergeNote.find((t) => t._key === l).value.slice(0, 90)}…`);
  console.log(`  pickup ${l}: ${B[l].intro.pickupLine} · lunch: ${B[l].intro.lunch.text}`);
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
    const slug = NEW_SLUG[l];
    const r = await (await evaluate(gparse(tourBySlugQuery(l)), { dataset, params: { slug } })).get();
    out[l] = Object.fromEntries(['title', 'summary', 'priceFrom', 'guideLanguagePrices', 'approvedInclusions', 'approvedExclusionRows', 'approvedOptions', 'dayTourFormat', 'durationHours', 'citySlugsEn', 'allSlugs'].map((f) => [f, r?.[f]]));
  }
  writeFileSync(previewOut, JSON.stringify(out, null, 1));
  console.log(`preview → ${previewOut}`);
}

if (apply) {
  if (!ready) throw new Error('prices not ready — fill museum-coptic-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-museum-coptic-day-tour');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
