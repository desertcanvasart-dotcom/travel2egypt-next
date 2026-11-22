/**
 * APPLY step: in-content internal links to the five thin pages among the 16 that Google crawled but did not
 * index (GSC "Crawled – currently not indexed", 22 Nov 2026). Owner: "Yes, start" (measure internal links,
 * add links where thin). Each op links an EXISTING mention (no copy change) in a published guide/article/tip
 * to the target page. Tour, tour-landing and hotel pages are NOT used as link sources (buying-path freeze
 * until 13 Dec). The 9 pages that already have more links than the site median are left alone.
 *
 *   node --env-file=<.env> scripts/link-unindexed-apply-2026-11-22.mjs [--apply]
 */
import { createClient } from '@sanity/client';
import { randomBytes } from 'node:crypto';
import { writeRollback } from './lib/content-gates.mjs';

const c = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-05-23', token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
const apply = process.argv.includes('--apply');
// [source doc, language, block _key, phrase, target _id]
const OPS = [["guideArticle.sohag.tours-in-sohag", "en", "00000000004f", "Temple of Seti I at Abydos", "wp-page-60788"], ["wp-page-96052", "en", "000000000011", "Temple of Seti I at Abydos", "wp-page-60788"], ["guideArticle.hurghada.only-in-hurghada", "en", "000000000033", "Royal Seascope", "tour.royal-seascope-submarine-hurghada"], ["wp-page-60649", "en", "00000000000e", "Hilton Luxor", "wp-page-63552"], ["wp-page-60931", "en", "000000000049", "Hilton Luxor Resort & Spa", "wp-page-63552"], ["wp-page-60932", "en", "000000000025", "Hilton Luxor Resort & Spa", "wp-page-63552"], ["wp-page-60936", "en", "00000000002f", "Hilton Luxor Resort & Spa", "wp-page-63552"], ["wp-post-112120-en", "en", "000000000035", "Hilton Luxor Resort & Spa", "wp-page-63552"], ["guideArticle.wadi-el-natrun.paromeos-monastery", "ja", "000000000007", "パロメオス修道院", "wp-page-60797"], ["wp-page-60595", "ja", "000000000015", "バラムス修道院", "wp-page-60797"], ["guideArticle.siwa-oasis.top-hotels-in-siwa-oasis", "es", "000000000017", "Taziry Ecolodge", "hotel.taziry-ecolodge-siwa-safari"], ["wp-post-144316-es", "es", "000000000011", "Taziry", "hotel.taziry-ecolodge-siwa-safari"]];
const key = () => randomBytes(6).toString('hex');
const text = (b) => (b.children ?? []).map((s) => s.text ?? '').join('');
const docs = {};
const skipped = new Set();
let done = 0;
for (const [id, loc, bk, phrase, target] of OPS) {
  if (await c.getDocument(`drafts.${id}`)) { console.log(`SKIP     ${id} has an unpublished draft (not touched)`); skipped.add(id); continue; }
  if (!(await c.getDocument(target))) throw new Error(`target ${target} missing`);
  const d = (docs[id] ??= await c.getDocument(id));
  const row = Array.isArray(d.body) && d.body[0]?._key && Array.isArray(d.body[0].value) ? d.body.find((r) => r._key === loc) : null;
  const blocks = row ? row.value : d.language === loc ? d.body : null;
  if (!blocks) throw new Error(`${id}: no ${loc} body`);
  if (JSON.stringify(blocks).includes(`"_ref":"${target}"`)) { console.log(`already  ${id} → ${target}`); continue; }
  const bi = blocks.findIndex((b) => b._key === bk && b._type === 'block');
  if (bi < 0) throw new Error(`${id}: block ${bk} missing`);
  const blk = blocks[bi];
  const si = blk.children.findIndex((s) => !s.marks?.length && (s.text ?? '').includes(phrase));
  if (si < 0) throw new Error(`${id} ${bk}: no unmarked "${phrase}"`);
  const sp = blk.children[si]; const at = sp.text.indexOf(phrase); const mk = key();
  const parts = [
    sp.text.slice(0, at) && { ...sp, _key: key(), text: sp.text.slice(0, at) },
    { ...sp, _key: key(), marks: [mk], text: phrase },
    sp.text.slice(at + phrase.length) && { ...sp, _key: key(), text: sp.text.slice(at + phrase.length) },
  ].filter(Boolean);
  const next = { ...blk, children: [...blk.children.slice(0, si), ...parts, ...blk.children.slice(si + 1)], markDefs: [...(blk.markDefs ?? []), { _key: mk, _type: 'internalLink', reference: { _type: 'reference', _ref: target } }] };
  if (text(next) !== text(blk)) throw new Error(`${id} ${bk}: text drift`);
  blocks[bi] = next; done++;
  console.log(`LINK  ${id.padEnd(48)} [${loc}] "${phrase}" → ${target}`);
}
console.log(`${done} link(s) in ${Object.keys(docs).length} documents (${skipped.size} skipped for drafts)`);
if (!apply) { console.log('dry run (--apply writes production)'); process.exit(0); }
if (!done) process.exit(0);
await writeRollback(c, Object.keys(docs), 'before-link-unindexed');
const tx = c.transaction();
for (const [id, d] of Object.entries(docs)) tx.patch(id, (p) => p.set({ body: d.body }).ifRevisionId(d._rev));
console.log('committed', (await tx.commit()).transactionId);
