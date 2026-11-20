/**
 * Aswan to Luxor by Road: Private Day Tour with Kom Ombo & Edfu, in the day-tour format, EN + ES + JA
 * together. Owner, 19 Nov: the locked copy and its open items (the transfer format retired, standing
 * rule 8: car, driver, Egyptologist, entrance fees and lunch all included).
 *
 *   tour  tour.private-tour-transfer-from-aswan-to-luxor-by-bus   URL unchanged in all three locales
 *   (open items: the `…-by-bus` URL stays); no redirect.
 *
 * The product: early pickup in Aswan (hotel or cruise ship) → Kom Ombo and the Crocodile Museum →
 * Edfu → the road north → lunch on arrival in Luxor → drop-off at a hotel, ship or the airport.
 * Entrance to Kom Ombo (the Crocodile Museum is on its ticket) and Edfu included; no tiers; children
 * under 12 pay 50 %; no age line. Title "…Private Day Tour…". Guide in the page's language, so ES/JA
 * keep their own price (aswan-luxor-road-prices.json, from Autoura T2E-DT-ASW-05).
 *
 * Panel: the copy's own rows (dayTourIntro.panelRows), as the felucca and bird-watching imports do,
 * so the one-way "Drop-off" row reads as written instead of the rule rows' "Back". The EN guide
 * row's "(ES: español · JA: 日本語)" is an editor's aside, not written.
 * JA: 「・」 separates both the heading word and the sites, and also sits inside names
 * (コム・オンボ神殿), so the JA site lists are pinned (JA_SITES) and checked against the raw line.
 *
 * Summary (dek / meta description): the old one sold "the option to break the journey"; the new
 * one is built from the locked opening's own words.
 *
 * Essay (Gate A.3, corrections 1–6): 1 Edfu: the shared Tier 1 wording already live on the Edfu,
 * El Kab & Silsila page, "the most completely preserved temple in Egypt"; 2 Kom Ombo "Nothing else
 * in Egypt is quite arranged this way" REMOVED (no approved Tier 1 row in
 * docs/established-superlatives.md); 3 the comparison with the valley north of Luxor removed;
 * 4 kept (Tier 2); 5 "We'll confirm the pickup point"; 6 the transfer / optional-stop / guide-add-on
 * / cash-ticket passages hidden from "More about this day" (skipRefs), and "optional stop",
 * "completes the transfer", "if you stop here" reworded. The essay title loses "Private Transfer".
 * The concierge note still describes a transfer; the day-tour layout renders it in no locale, and it
 * is left as it is (not in the open items).
 *
 * needsReview: rows are written approved, as with every page in this batch (true would publish an
 * empty page); nothing is written until the owner says publish. The open items also ask for a
 * native-speaker review of ES/JA before going live (canon Part V).
 *
 *   node --env-file=<.env> scripts/day-tour-format/import-aswan-luxor-road-2026-11-20.mjs              # dry run
 *   npx tsx --env-file=<.env> scripts/day-tour-format/import-aswan-luxor-road-2026-11-20.mjs --preview <out.json>
 *   node --env-file=<.env> scripts/day-tour-format/import-aswan-luxor-road-2026-11-20.mjs --apply --flags-approved
 */
import { createClient } from '@sanity/client';
import { parse as gparse, evaluate } from 'groq-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { curlyRows, visibleStrings, verbatimPreflight, writeRollback, contentGate } from '../lib/content-gates.mjs';
import { numericGate } from '../content-lint/numeric-gate.mjs';

const DOC_ID = 'tour.private-tour-transfer-from-aswan-to-luxor-by-bus';
const OLD = { from: 82, es: 93, ja: 100 };
const PRICES = JSON.parse(readFileSync(new URL('./aswan-luxor-road-prices.json', import.meta.url), 'utf8'));
const ready = ['en', 'es', 'ja'].every((l) => typeof PRICES[l] === 'number' && PRICES[l] > 0);
const LANGS = ['en', 'es', 'ja'];
const ROOT = new URL('../../', import.meta.url);
const B0 = 'review/locked/aswan-to-luxor-kom-ombo-edfu-day-tour';
const LOCKED = { en: `${B0}.md`, es: `${B0}.es.md`, ja: `${B0}.ja.md` };
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
const SRC = (l) => `Owner's locked file ${LOCKED[l]} (19 Nov 2026; prices from Autoura for 2 travellers).`;

const G = {
  komombo: 'guideArticle.kom-ombo.the-temple-of-kom-ombo',
  edfu: 'guideArticle.edfu.edfu-temple',
};
// Sites per stop, in file order: "Temple of Kom Ombo · Crocodile Museum" (no guide page for the
// museum); "Temple of Horus, Edfu".
const SITE_GUIDES = [[G.komombo, null], [G.edfu]];
// JA site lines, as written (「・」 also sits inside コム・オンボ).
const JA_SITES = { 'コム・オンボ神殿・ワニ博物館': ['コム・オンボ神殿', 'ワニ博物館'], 'エドフのホルス神殿': ['エドフのホルス神殿'] };
const DURATION_LABEL = { en: 'Full day · ~8 hrs', es: 'Día completo · ~8 h', ja: '1日・約8時間' };
const DURATION_HOURS = 8;
// The dek / meta description: the locked opening's own words, naming all four stops.
const SUMMARY = {
  en: 'A private day from Aswan to Luxor by road, door to door, with your own car, driver and Egyptologist, the temples of Kom Ombo and Edfu on the way, and lunch when you arrive.',
  es: 'Un día privado de Asuán a Luxor por carretera, de puerta a puerta, con tu coche, tu conductor y tu egiptólogo, los templos de Kom Ombo y Edfu en el camino y el almuerzo al llegar.',
  ja: 'アスワンからルクソールまで陸路で、専用車・ドライバー・エジプト学者ガイドとともにドア・ツー・ドアで移動するプライベートな1日。途中でコム・オンボ神殿とエドフの神殿に立ち寄り、到着後に昼食。',
};
const PANEL = {
  en: { pickup: 'Pickup', lunch: 'Lunch' },
  es: { pickup: 'Recogida', lunch: 'Almuerzo' },
  ja: { pickup: 'お迎え', lunch: '昼食' },
};
const OPTIONAL_COST = ['extraTicket', 'extraCost'];
const PERIOD = { Morning: 'morning', Midday: 'midday', Afternoon: 'afternoon', Mañana: 'morning', Mediodía: 'midday', Tarde: 'afternoon', 朝: 'morning', 午前: 'morning', 昼: 'midday', 午後: 'afternoon' };

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
        if (sm && l === 'ja') { stop.sites = JA_SITES[plain(sm[2])]; if (!stop.sites) throw new Error(`ja: site line not in JA_SITES: ${sm[2]}`); }
        else if (sm) stop.sites = sm[2].split(SEP).map((x) => plain(x));
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
for (const l of ['es', 'ja']) {
  const shape = (p) => JSON.stringify({ periods: p.periods.map((x) => [x.period, x.stops.map((s) => [!!s.text, s.sites?.length ?? 0, !!s.includedNote, s.optional?.length ?? 0])]), inc: p.included.length, exc: p.excluded.length, fit: p.fitFor.length, worth: p.worthKnowing.length, opts: p.options.length });
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
    ...Object.fromEntries(p.periods.flatMap((x, pi) => x.stops.flatMap((s, si) => [[`p${pi}s${si}.t`, s.title], [`p${pi}s${si}.x`, s.text], [`p${pi}s${si}.inc`, s.includedNote], ...(s.optional ?? []).map((o, i) => [`p${pi}s${si}.o${i}`, o])])).filter(([, v]) => v)),
    ...Object.fromEntries(p.included.map((t, i) => [`in${i}`, t])), ...Object.fromEntries(p.excluded.map((t, i) => [`ex${i}`, t])),
    ...Object.fromEntries(p.fitFor.map((t, i) => [`fit${i}`, t])),
    ...Object.fromEntries(p.worthKnowing.map((t, i) => [`wk${i}`, t])), ...Object.fromEntries(p.options.map((t, i) => [`op${i}`, t])),
  };
};
// Checked by hand (20 Nov), same meaning as EN: ES why «los dos templos» = EN "both temples" (the gate reads «dos» as 2); JA why 「2つの神殿」, the same.
const SAME_MEANING = { es: ['why'], ja: ['why'] };
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
      lunch: { status: 'included', text: p.panelRows[PANEL[l].lunch] },
      fitFor: p.fitFor, worthKnowing: p.worthKnowing, closingLine: p.closingLine,
      source: SRC(l), needsReview: false,
    },
    included: fact(p.included, 'alin'), excluded: fact(p.excluded, 'alout'), options: fact(p.options, 'alopt'),
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

// The essay's closing ("…a reasonable use of a morning"), now the page's own closing ("…of a day").
const CLOSING_REF = { en: '000000000029', es: '00000000002b', ja: '00000000002f' };
// "This is a transfer…" · "if neither temple stop appeals…" · "The Temples in Brief" (heading, the
// guide-as-add-on note, the cash-ticket note) · the concierge helper line · empty blocks · ES: the standfirst.
const SKIP = {
  en: ['00000000000b', '00000000001f', '000000000021', '000000000023', '000000000025', '000000000037', '00000000003a'],
  es: ['000000000003', '00000000000d', '000000000021', '000000000023', '000000000025', '000000000027', '00000000003b', '00000000003e'],
  ja: ['000000000011', '000000000025', '000000000027', '000000000029', '00000000002b', '00000000003d', '000000000040'],
};
// [block, find, replace] — corrections 1, 2, 3, 5 and 6 (the wording that sold the stops as optional).
const FIX = {
  en: [
    ['000000000001', 'The Nile Road: Private Transfer from Aswan to Luxor', 'The Nile Road: Aswan to Luxor, by Way of Kom Ombo and Edfu'],
    ['000000000003', 'It takes roughly four to five hours at a steady pace — longer if you stop, which you should seriously consider. Two temples stand directly on the route, and both are worth the detour.', 'The driving takes about four hours. Two temples stand directly on the route, and both are part of the day.'],
    ['00000000000f', ', and the landscape, though interesting, is not dramatic in the way that the Nile valley north of Luxor can be.', ', and the landscape, though interesting, is not dramatic.'], // 3
    ['000000000013', 'if you are joining the transfer from a boat. The driver will confirm the pick-up point in advance.', "if you are joining from a boat. We'll confirm the pickup point in advance."], // 5
    ['000000000017', 'The first optional stop,', 'The first stop,'],
    ['000000000017', ' Nothing else in Egypt is quite arranged this way.', ''], // 2
    ['00000000001b', 'home to the Temple of Horus — the best-preserved ancient Egyptian temple still standing.', 'home to the Temple of Horus — the most completely preserved temple in Egypt.'], // 1
    ['00000000001b', 'Allow at least an hour if you stop here.', 'Allow at least an hour here.'],
    ['00000000001d', 'completes the transfer.', 'completes the day.'],
  ],
  es: [
    ['000000000001', 'La carretera del Nilo: traslado privado de Asuán a Luxor', 'La carretera del Nilo: de Asuán a Luxor por Kom Ombo y Edfu'],
    ['000000000005', 'Lleva entre cuatro y cinco horas a ritmo sostenido, más si se hacen paradas, y debería considerarse la posibilidad seriamente. Dos templos quedan directamente sobre la ruta, y ambos merecen el desvío.', 'La conducción lleva unas cuatro horas. Dos templos quedan directamente sobre la ruta, y ambos forman parte del día.'],
    ['000000000011', ', y el paisaje, aunque interesante, no es dramático al modo en que puede serlo el valle al norte de Luxor.', ', y el paisaje, aunque interesante, no es dramático.'],
    ['000000000015', 'si se incorpora al traslado desde un barco. El conductor confirmará el punto de recogida por adelantado.', 'si se incorpora desde un barco. Confirmaremos el punto de recogida por adelantado.'],
    ['000000000019', 'La primera parada opcional,', 'La primera parada,'],
    ['000000000019', ' Ningún otro yacimiento en Egipto se dispone así.', ''],
    ['00000000001d', 'sede del Templo de Horus, el templo egipcio antiguo mejor conservado que sigue en pie.', 'sede del Templo de Horus, el templo que se conserva más completo de Egipto.'],
    ['00000000001d', 'Reserve al menos una hora si decide detenerse.', 'Reserve al menos una hora.'],
    ['00000000001f', 'cierra el traslado.', 'cierra el día.'],
  ],
  ja: [
    ['000000000007', 'ナイルの道：アスワンからルクソールへのプライベート送迎', 'ナイルの道：コム・オンボとエドフを経て、アスワンからルクソールへ'],
    ['000000000009', '一定のペースでおよそ4時間から5時間かかります——途中で止まればより長く、そしてそれを真剣にご検討いただく価値があります。二つの神殿がルートの真上に立っており、どちらも寄り道する価値があります。', '車での移動はおよそ4時間です。二つの神殿がルートの真上に立っており、どちらもこの1日の一部です。'],
    ['000000000015', '、その風景は、興味深くはあっても、ルクソールより北のナイル渓谷のような劇的さはありません。', '、その風景は、興味深くはあっても、劇的ではありません。'],
    ['000000000019', 'あるいはボートから送迎にご参加なら、アスワンのクルーズ・ターミナルからです。ドライバーがお迎え地点を事前に確認します。', 'あるいはボートからご参加なら、アスワンのクルーズ・ターミナルからです。お迎え地点は事前にご連絡します。'],
    ['00000000001d', '最初の任意の立ち寄り先は、', '最初の立ち寄り先は、'],
    ['00000000001d', 'エジプトのほかのどこも、これほどの配置ではありません。', ''],
    ['000000000021', 'いまなお立つ古代エジプトの神殿で最もよく保存されたホルス神殿の地です。', 'エジプトで最も完全な形で残る神殿、ホルス神殿の地です。'],
    ['000000000021', 'ここで立ち寄るなら、少なくとも1時間を見込んでください。', 'ここでは少なくとも1時間を見込んでください。'],
    ['000000000023', '到着で、送迎は完了します。', '到着で、この1日は終わります。'],
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
  en: /best-preserved|Nothing else in Egypt|north of Luxor can be|driver will confirm|optional|transfer|paid on arrival|add-on/i,
  es: /mejor conservado|Ningún otro yacimiento|al norte de Luxor|conductor confirmará|opcional|traslado|se abonan|complemento/i,
  ja: /最もよく保存|ほかのどこも|北のナイル渓谷|ドライバーがお迎え|任意|送迎|支払い|追加として/,
};
for (const row of body) {
  if (!RETIRED[row._key]) continue;
  const hidden = new Set([CLOSING_REF[row._key], ...SKIP[row._key]]);
  for (const b of row.value) if (!hidden.has(b._key) && RETIRED[row._key].test(textOf(b))) throw new Error(`${row._key} ${b._key}: "More about this day" still shows "${textOf(b).match(RETIRED[row._key])[0]}"`);
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
for (const l of LANGS) {
  const rows = ['dayTourIntro', 'dayTimeline', 'inclusions', 'exclusions', 'customisationOptions'].flatMap((f) => set[f].filter((r) => r.lang === l));
  verbatimPreflight([...visibleStrings(rows, l), set.title.find((t) => t._key === l).value], [LOCKED[l]]);
}
await contentGate({ locked: LANGS.map((l) => [LOCKED[l], l]), apply });
if (!ready) console.log('prices: NOT READY — fill aswan-luxor-road-prices.json from Autoura (EN, ES and JA guide). Nothing can be applied yet.');

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
  if (!ready) throw new Error('prices not ready — fill aswan-luxor-road-prices.json from Autoura first.');
  await writeRollback(client, [DOC_ID], 'before-giza-museum-khan-day-tour');
  await client.patch(DOC_ID).set(set).commit();
  console.log(`APPLIED to production ${DOC_ID}`);
} else if (!previewOut) console.log('dry run (prices filled + --apply --flags-approved writes production)');
