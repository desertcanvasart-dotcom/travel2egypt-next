/**
 * Al-Fishawi's date, one wording site-wide (owner, 19 Nov — open items of the Egyptian Museum,
 * Citadel, Al-Muizz & Khan El Khalili day tour, step 5):
 *
 *   EN "operating continuously since 1773, according to its own account"
 *   ES "en funcionamiento sin interrupción desde 1773, según su propio relato"
 *   JA 「店自身によれば1773年から営業を続けている」 (in a running sentence the verb takes its
 *      connective / polite form: 続けており / 続けています)
 *
 * The café's spelling is NOT changed (Al-Fishawy, El-Fishawi, フィシャウィ, フィシャーウィー… stay
 * as each page writes it).
 *
 * The scan reads EVERY document in the dataset (published and drafts, ~3,900; paged with
 * `*[_id > $start] | order(_id) [0...500]`), every string field. A sentence is a claim when it
 * names the café (Fishawi / Fishawy / Fichaoui / フィシャウィ / フィシャーウィー …) and carries a
 * year, "200 years", a century or "since/desde/から"; and, for the pages that name the café in
 * one block and date it in the next, a dated sentence about a coffeehouse within two blocks after
 * a block naming it, or right after the sentence naming it. Every claim must be covered by a REWRITE below or a KEEP (with its reason);
 * anything else stops the run.
 *
 * needsReview: these are essay / article body texts, which carry no needsReview flag (that flag
 * lives on the day-tour / itinerary rows only), so none is set. The owner's publish OK is the
 * approval; the rollback is written first.
 *
 *   node --env-file=<.env> scripts/fishawi-1773-sweep-2026-11-19.mjs                     # dry run: every hit, current → new
 *   node --env-file=<.env> scripts/fishawi-1773-sweep-2026-11-19.mjs --apply             # rollback first, then patch
 *   … --apply --include-held                                                             # also the held documents (see HELD)
 */
import { createClient } from '@sanity/client';
import { writeRollback } from './lib/content-gates.mjs';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const includeHeld = args.includes('--include-held');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false, perspective: 'raw' });

const NAME = /fish[aā]w|fichaou|fishaou|f[iy]shawy|フィー?シャー?ウィ/i;
const DATED = /\b1[5-9]\d\d\b|\b200\b|二百年|centur|siglo|世紀|since|desde|から|以来|founded|fundad|創業|開業/i;
const COFFEE = /coffee|caf[eé]|コーヒー|カフェ|喫茶/i;
const APPROVED = {
  en: 'operating continuously since 1773, according to its own account',
  es: 'en funcionamiento sin interrupción desde 1773, según su propio relato',
  ja: '店自身によれば1773年から営業を続け',
};

// Owner's call pending: the overlapping product /egyptian-museum-and-bazaar-tour is being rewritten
// in its own batch (open items step 4: "do not change any copy"); its Fishawi line is listed but
// only written with --include-held.
const HELD = new Set(['wp-page-87729']);

// [document (published _id; its draft gets the same change), locale, find, replace].
const REWRITE = [
  // The day tour this sweep comes from (its import makes the same change; whichever runs first).
  ['tour.egyptian-museum-citadel-and-khan-el-khalili-bazaar', 'en', 'operating continuously since 1773 according to its own account', 'operating continuously since 1773, according to its own account'],
  ['tour.egyptian-museum-citadel-and-khan-el-khalili-bazaar', 'es', 'en funcionamiento continuo desde 1773 según su propio relato', 'en funcionamiento sin interrupción desde 1773, según su propio relato'],
  ['tour.egyptian-museum-citadel-and-khan-el-khalili-bazaar', 'ja', 'その言い分によれば1773年から休まず営業を続けており', '店自身によれば1773年から営業を続けており'],
  // Guide: Khan el-Khalili.
  ['guideArticle.cairo.khan-el-khalili', 'en', 'open virtually without interruption since the eighteenth century', 'operating continuously since 1773, according to its own account'],
  ['guideArticle.cairo.khan-el-khalili', 'es', 'abierto prácticamente sin interrupción desde el siglo XVIII', 'en funcionamiento sin interrupción desde 1773, según su propio relato'],
  ['guideArticle.cairo.khan-el-khalili', 'ja', '18世紀からほぼ途切れることなく営業している', '店自身によれば1773年から営業を続けている'],
  // Guide: tours in Giza (EN/ES; the JA page does not name the café).
  ['guideArticle.giza.tours-in-giza', 'en', 'open virtually without interruption since the eighteenth century', 'operating continuously since 1773, according to its own account'],
  ['guideArticle.giza.tours-in-giza', 'es', 'abierto prácticamente sin interrupción desde el siglo XVIII', 'en funcionamiento sin interrupción desde 1773, según su propio relato'],
  // Guide: Midan al-Hussein.
  ['guideArticle.cairo.midan-al-hussein', 'en', 'in continuous operation since the eighteenth century.', 'operating continuously since 1773, according to its own account.'],
  ['guideArticle.cairo.midan-al-hussein', 'es', 'en funcionamiento continuo desde el siglo XVIII.', 'en funcionamiento sin interrupción desde 1773, según su propio relato.'],
  ['guideArticle.cairo.midan-al-hussein', 'ja', '18世紀から連続して営業しています。', '店自身によれば1773年から営業を続けています。'],
  // Day tour: Alexandria to Cairo (Giza, museum, Khan) — "1797".
  ['tour.alexandria-to-cairo-private-day-tour-of-giza-pyramids-sphinx-egyptian-museum-khan-el-khalili', 'en', ' has been open continuously since 1797 and is worth', ', operating continuously since 1773, according to its own account, is worth'],
  ['tour.alexandria-to-cairo-private-day-tour-of-giza-pyramids-sphinx-egyptian-museum-khan-el-khalili', 'es', ' lleva en operación ininterrumpida desde 1797 y vale', ', en funcionamiento sin interrupción desde 1773, según su propio relato, vale'],
  ['tour.alexandria-to-cairo-private-day-tour-of-giza-pyramids-sphinx-egyptian-museum-khan-el-khalili', 'ja', 'は1797年から休まず営業を続けており', 'は、店自身によれば1773年から営業を続けており'],
  // Day tour: Cairo by bus from Hurghada.
  ['tour.cairo-by-bus-group-day-tour-from-hurghada', 'en', ' has been operating since 1773 if you want', ', operating continuously since 1773, according to its own account, is there if you want'],
  ['tour.cairo-by-bus-group-day-tour-from-hurghada', 'es', ' funciona desde 1773, por si apetece', ', en funcionamiento sin interrupción desde 1773, según su propio relato, está ahí por si apetece'],
  ['tour.cairo-by-bus-group-day-tour-from-hurghada', 'ja', '1773年から続くアル・フィシャーウィー', '店自身によれば1773年から営業を続けているアル・フィシャーウィー'],
  // Day tour: NMEC, royal mummies and Old Cairo — "1797, allegedly without ever closing".
  ['tour.nmec-royal-mummies-old-cairo', 'en', 'has been open since 1797, allegedly without ever closing its doors', 'has been operating continuously since 1773, according to its own account'],
  ['tour.nmec-royal-mummies-old-cairo', 'es', 'lleva abierto desde 1797, supuestamente sin haber cerrado nunca las puertas', 'está en funcionamiento sin interrupción desde 1773, según su propio relato'],
  ['tour.nmec-royal-mummies-old-cairo', 'ja', 'は1797年から、伝えられるところでは一度も扉を閉じることなく営業を続けています', 'は、店自身によれば1773年から営業を続けています'],
  // Day tour /egyptian-museum-and-bazaar-tour (HELD, see above).
  ['wp-page-87729', 'en', 'a coffeehouse that has reportedly operated continuously since 1773', 'a coffeehouse operating continuously since 1773, according to its own account'],
  ['wp-page-87729', 'es', 'un café que supuestamente funciona sin interrupción desde 1773', 'un café en funcionamiento sin interrupción desde 1773, según su propio relato'],
  ['wp-page-87729', 'ja', 'その言い分によれば1773年から休まず営業を続けているコーヒーハウス', '店自身によれば1773年から営業を続けているコーヒーハウス'],
  // Day tour wp-page-87839 — "over 200 years" (said of the tea houses around the café; the claim is
  // moved to the café itself, the one thing the café's own account dates).
  ['wp-page-87839', 'en', 'The tea houses around the al-Fishawi café have been in continuous operation for over 200 years.', 'The al-Fishawi café has been operating continuously since 1773, according to its own account.'],
  ['wp-page-87839', 'es', 'Las casas de té en torno al café al-Fishawi llevan en operación continua más de 200 años.', 'El café al-Fishawi está en funcionamiento sin interrupción desde 1773, según su propio relato.'],
  ['wp-page-87839', 'ja', 'エル・フィシャーウィー・カフェの周りの茶店は、200年以上にわたって途切れず営まれてきました。', 'エル・フィシャーウィー・カフェは、店自身によれば1773年から営業を続けています。'],
  // Day tour wp-page-87840 — "since around 1773".
  ['wp-page-87840', 'en', 'El Fishawy has been operating since around 1773.', 'El Fishawy has been operating continuously since 1773, according to its own account.'],
  ['wp-page-87840', 'es', 'El Fishawy lleva funcionando desde aproximadamente 1773.', 'El Fishawy está en funcionamiento sin interrupción desde 1773, según su propio relato.'],
  ['wp-page-87840', 'ja', 'エル・フィシャーウィは1773年頃から営業を続けています。', 'エル・フィシャーウィは、店自身によれば1773年から営業を続けています。'],
  // Articles "Walking Khan el-Khalili" (EN / ES / JA are separate documents).
  ['wp-post-95442-en', 'en', 'A famous coffeehouse said to date back to the eighteenth century', 'A famous coffeehouse, operating continuously since 1773, according to its own account'],
  ['wp-post-144326-es', 'es', 'Se le atribuye una larga continuidad desde el siglo XVIII, aunque las fechas exactas varían según las fuentes.', 'Está en funcionamiento sin interrupción desde 1773, según su propio relato.'],
  ['wp-post-164355-ja', 'ja', '18世紀から続くとされる', '店自身によれば1773年から営業を続けている'],
];
// Dated sentences that are not a founding claim for the café: left as they are.
const KEEP = [
  ['wp-page-87829', /for centuries|durante siglos|幾世紀/, 'the coffeehouses on the street have stood "for centuries"; no date is given for al-Fishawi'],
];

/* ── Scan ─────────────────────────────────────────────────────────────── */
const sentences = (s) => s.split(/(?<=[.!?。])\s*/).filter(Boolean);
const baseId = (id) => id.replace(/^drafts\./, '');
function localeOf(doc, path) {
  const m = path.match(/^[a-zA-Z.]+\[_key=="(en|es|ja)"\]/);
  if (m) return m[1];
  return doc.language ?? (doc._id.match(/-(en|es|ja)$/) ?? [])[1] ?? '?';
}
function strings(v, path, out) {
  if (typeof v === 'string') { out.push({ path, text: v }); return; }
  if (Array.isArray(v)) { v.forEach((x, i) => strings(x, `${path}[${x && x._key ? `_key=="${x._key}"` : i}]`, out)); return; }
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!k.startsWith('_') && !['style', 'listItem', 'marks', 'markDefs'].includes(k)) strings(x, path ? `${path}.${k}` : k, out);
}
const blockOf = (path) => path.replace(/\.children\[[^\]]+\]\.text$/, '');
const hits = [];
let start = '', scanned = 0;
for (;;) {
  const page = await client.fetch('*[_id > $start] | order(_id) [0...500]', { start });
  if (!page.length) break;
  scanned += page.length; start = page[page.length - 1]._id;
  for (const doc of page) {
    const out = []; strings(doc, '', out);
    const named = out.map((s, i) => (NAME.test(s.text) ? i : -1)).filter((i) => i >= 0);
    if (!named.length) continue;
    // Strings in the same block as, or in the next two blocks after, a string naming the café.
    const blocks = [...new Set(out.map((s) => blockOf(s.path)))];
    const near = new Set();
    for (const i of named) { const b = blocks.indexOf(blockOf(out[i].path)); for (let k = b; k <= b + 2; k++) near.add(blocks[k]); }
    out.forEach((s, i) => {
      const named1 = NAME.test(s.text);
      if (!named1 && !near.has(blockOf(s.path))) return;
      // A dated sentence naming the café; or, about a coffeehouse, near a block that names it; or
      // right after the sentence that names it ("Fishawi es el café… Se le atribuye… desde el siglo XVIII").
      const ss = sentences(s.text);
      const claims = ss.filter((x, j) => DATED.test(x) && (NAME.test(x) || COFFEE.test(x) || (j > 0 && NAME.test(ss[j - 1]))));
      if (claims.length) hits.push({ doc, path: s.path, text: s.text, lang: localeOf(doc, s.path), claims });
    });
  }
}

/* ── Map every claim to a rewrite or a keep ───────────────────────────── */
const patches = new Map(); // id → { path: newText }
const used = new Set();
const problems = [];
console.log(`scanned ${scanned} documents; ${hits.length} string(s) with a dated Al-Fishawi sentence\n`);
for (const h of hits) {
  const id = baseId(h.doc._id);
  let text = h.text;
  const rules = REWRITE.filter(([rid, lang, find]) => rid === id && lang === h.lang && text.includes(find));
  for (const r of rules) { text = text.replace(r[2], r[3]); used.add(REWRITE.indexOf(r)); }
  const held = HELD.has(id);
  console.log(`${h.doc._id}  [${h.doc._type}, ${h.lang}]${held ? '  HELD' : ''}\n  ${h.path}`);
  for (const c of h.claims) {
    const after = sentences(text).find((x) => x.includes(c) || NAME.test(x) === NAME.test(c) && sentences(text).indexOf(x) === sentences(h.text).indexOf(c));
    const keep = KEEP.find(([kid, re]) => kid === id && re.test(c));
    if (keep) { console.log(`  KEEP   ${c}\n         (${keep[2]})`); continue; }
    if (c.includes(APPROVED[h.lang]) && !rules.length) { console.log(`  OK     ${c}`); continue; }
    if (!rules.length) { problems.push(`${h.doc._id} ${h.path}: no rewrite for "${c}"`); console.log(`  ??     ${c}`); continue; }
    console.log(`  NOW    ${c}\n  NEW    ${after ?? '(see full text)'}`);
  }
  console.log('');
  if (text !== h.text && (!held || includeHeld)) {
    if (!patches.has(h.doc._id)) patches.set(h.doc._id, {});
    patches.get(h.doc._id)[h.path] = text;
  }
  // After the change, every dated sentence naming the café uses the approved wording (or is kept).
  for (const s of sentences(text)) if (DATED.test(s) && NAME.test(s) && !s.includes(APPROVED[h.lang]) && !KEEP.some(([kid, re]) => kid === id && re.test(s))) problems.push(`${h.doc._id} ${h.path}: still dated without the approved wording: "${s}"`);
}
REWRITE.forEach((r, i) => { if (!used.has(i)) console.log(`note: rewrite not needed now (already applied?): ${r[0]} ${r[1]} "${r[2].slice(0, 60)}"`); });
if (problems.length) { console.log(`\nUNRESOLVED (${problems.length}):\n  ${problems.join('\n  ')}`); if (apply) throw new Error('unresolved Al-Fishawi claims — add a REWRITE or KEEP first'); }

console.log(`\n${patches.size} document(s) to patch: ${[...patches.keys()].join(', ')}`);
if (!includeHeld) console.log(`held (not patched without --include-held): ${[...HELD].join(', ')}`);

if (apply) {
  await writeRollback(client, [...patches.keys()], 'before-fishawi-1773-sweep');
  for (const [id, set] of patches) { await client.patch(id).set(set).commit(); console.log(`APPLIED ${id} (${Object.keys(set).length} field(s))`); }
} else console.log('dry run — nothing written (--apply writes production, rollback first)');
