/**
 * Retire "El Kab & Esna Temple Day Tour from Aswan" into the Edfu, El Kab & Gebel Silsila day
 * tour (owner, 19 Nov, open items §2: "Only this Aswan product is retired. Any Esna product
 * starting from Luxor stays."). Canon Gate D.
 *
 *   old  wp-page-88483   /el-kab-and-esna-temple-day-tour-from-aswan (€144) → hidden, superseded-duplicate
 *   new  wp-page-113193  /edfu-el-kab-and-gebel-silsila-from-aswan (import-edfu-el-kab-silsila-2026-11-19.mjs)
 *
 * Inbound references (19 Nov): three inline links in essay text (body … markDefs[].reference),
 * `_key`s kept:
 *   - wp-page-87064 (Aswan Private Day Tours), link "Hidden Gems: El Kab and Esna Temple Day Tour
 *     from Aswan" → the keeper, as the open items say.
 *   - wikiMonument wp-page-59624 (The Temple of Khnum at Esna) and guideArticle wp-page-86841
 *     (Luxor Private Day Tours), both linking the words "Esna Temple" → NOT the keeper, which has
 *     no Esna, but the Esna tour that stays (open items: "Any Esna product starting from Luxor
 *     stays"): wp-page-88167 "Esna and El Kab Day Tour from Luxor". A deviation, reported in the
 *     PR; remove the two lines in TARGET to send them to the keeper instead.
 * Any other reference path is repointed to the keeper, and a list that would then hold its target
 * twice loses the duplicate.
 *
 * Hard-coded links (open items §3.3, a scan of all 3,884 documents on 19 Nov): four published
 * guide articles link an old address as text (markDefs[].href). They would work through the 301s,
 * but are updated to the final address here, in the same write:
 *   - wp-page-59619 "Tours In Esna" (en) "El Kab" and wp-page-72314 "Ticket Prices … Aswan" (en)
 *     "Al Kab" → the keeper (EN); wp-page-78370 "History Of Kom Ombo" (es) "Edfu" → the keeper (ES).
 *   - wp-page-59603 "History of Esna" (es) "templo de Esna" → the Esna tour from Luxor (ES), as
 *     its text is about Esna.
 * Not touched: drafts.wp-page-65281 (an unpublished Nile-cruise draft, "El Kab" → the old Esna
 * URL), listed in the PR.
 * Drafts are refused (handle them first).
 *
 * The three URLs 301 in migration/redirect-map.* (same commit). Run AFTER the keeper import.
 *
 *   node --env-file=<.env> scripts/day-tour-format/retire-el-kab-esna-2026-11-19.mjs           # dry run
 *   node --env-file=<.env> scripts/day-tour-format/retire-el-kab-esna-2026-11-19.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const OLD = 'wp-page-88483';
const NEW = 'wp-page-113193';
const ESNA_FROM_LUXOR = 'wp-page-88167';
// Per referrer: where its link goes (default: the keeper).
const TARGET = { 'wp-page-59624': ESNA_FROM_LUXOR, 'wp-page-86841': ESNA_FROM_LUXOR };
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

const neu = await client.getDocument(NEW);
if (!neu || neu.hidden) throw new Error(`${NEW} missing or hidden`);
const esna = await client.getDocument(ESNA_FROM_LUXOR);
if (!esna || esna.hidden) throw new Error(`${ESNA_FROM_LUXOR} missing or hidden`);
const old = await client.getDocument(OLD);
if (!old) throw new Error(`${OLD} missing`);
for (const id of [OLD, NEW]) if (await client.getDocument(`drafts.${id}`)) throw new Error(`drafts.${id} exists — handle it first`);

// Every path in a document where `_ref` is `id`, as a Sanity patch path.
const refPaths = (o, id, p = '') => {
  const out = [];
  if (Array.isArray(o)) o.forEach((x, i) => out.push(...refPaths(x, id, `${p}[${x?._key ? `_key=="${x._key}"` : i}]`)));
  else if (o && typeof o === 'object') {
    if (o._ref === id) out.push(p);
    for (const [k, v] of Object.entries(o)) if (k !== '_ref') out.push(...refPaths(v, id, p ? `${p}.${k}` : k));
  }
  return out;
};

// [document, locale row, block, markDef, target document]
const HREFS = [
  ['wp-page-59619', 'en', '000000000033', '00000000002c', NEW],
  ['wp-page-72314', 'en', '000000000006', '000000000003', NEW],
  ['wp-page-78370', 'es', '000000000010', '000000000008', NEW],
  ['wp-page-59603', 'es', '00000000002f', '00000000002c', ESNA_FROM_LUXOR],
];
const OLD_PATHS = /aswan-to-el-kab-and-edfu-temple-tour|de-asuan-a-el-kab-y-edfu-un-dia|asuwan-kara-eru-kabu-to-edofu|el-kab-and-esna-temple-day-tour-from-aswan|el-kab-y-esna-desde-asuan|asuwan-hatsu-eru-kabu-esuna/;
const pathOf = (doc, l) => `${l === 'en' ? '' : `/${l}`}/${doc.slug.find((s) => s._key === l).value.current}`;
const hrefPlan = [];
for (const [id, l, blk, mk, target] of HREFS) {
  const d = await client.getDocument(id);
  if (await client.getDocument(`drafts.${id}`)) throw new Error(`drafts.${id} exists — handle it first`);
  const md = d.body.find((r) => r._key === l)?.value.find((b) => b._key === blk)?.markDefs?.find((m) => m._key === mk);
  if (!md) throw new Error(`${id}: link ${l}/${blk}/${mk} not found`);
  const tdoc = target === NEW ? neu : esna;
  const to = pathOf(tdoc, l);
  if (!OLD_PATHS.test(md.href) && md.href !== to) throw new Error(`${id}: link now ${md.href} — changed since 19 Nov`);
  hrefPlan.push({ id, path: `body[_key=="${l}"].value[_key=="${blk}"].markDefs[_key=="${mk}"].href`, from: md.href, to });
}

const referrers = (await client.fetch('*[references($id)]', { id: OLD })).filter((d) => d._id !== OLD);
const drafts = referrers.filter((d) => d._id.startsWith('drafts.'));
if (drafts.length) throw new Error(`drafts reference ${OLD}: ${drafts.map((d) => d._id).join(', ')} — handle them first`);
const plan = [];
for (const d of referrers) {
  const to = TARGET[d._id] ?? NEW;
  for (const path of refPaths(d, OLD)) {
    // A list item (…[_key=="x"]) in an array that already holds the keeper: remove it; else swap.
    const listItem = path.match(/^(.*)\[_key=="([^"]+)"\]$/);
    let dup = false;
    if (listItem) {
      const parent = listItem[1].split(/\.(?![^[]*\])/).reduce((o, seg) => {
        const m = seg.match(/^([^[]+)((?:\[[^\]]+\])*)$/);
        let v = o?.[m[1]];
        for (const [, k] of m[2].matchAll(/\[_key=="([^"]+)"\]/g)) v = v?.find((x) => x._key === k);
        return v;
      }, d);
      dup = Array.isArray(parent) && parent.some((x) => x?._ref === to);
    }
    plan.push({ id: d._id, type: d._type, path, to, action: dup ? 'remove (target already listed)' : 'swap' });
  }
}

const hide = { hidden: true, 'migration.reviewFlag': 'superseded-duplicate', 'migration.supersededBy': NEW, 'migration.supersededAt': new Date().toISOString() };
console.log(`OLD ${OLD}: ${JSON.stringify(old.title?.find((t) => t._key === 'en')?.value)} €${old.priceFrom}`);
console.log(`  slugs ${JSON.stringify(old.slug.map((s) => `${s._key}:${s.value.current}`))}`);
console.log(`  set ${JSON.stringify(hide)}`);
console.log(`NEW ${NEW}: ${JSON.stringify(neu.title?.find((t) => t._key === 'en')?.value)}`);
console.log(`  slugs ${JSON.stringify(neu.slug.map((s) => `${s._key}:${s.value.current}`))}`);
for (const p of plan) console.log(`  ${p.id} (${p.type}) ${p.path}: ${p.action} → ${p.to}${p.to === ESNA_FROM_LUXOR ? ' (Esna and El Kab from Luxor)' : ' (keeper)'}`);
for (const h of hrefPlan) console.log(`  ${h.id} href: ${h.from} → ${h.to}`);

if (apply) {
  if (neu.slug.find((s) => s._key === 'en')?.value.current !== 'edfu-el-kab-and-gebel-silsila-from-aswan') throw new Error('run the keeper import first (its new slug is not live yet)');
  await writeRollback(client, [OLD, ...new Set([...plan.map((p) => p.id), ...hrefPlan.map((h) => h.id)])], 'before-retire-el-kab-esna');
  const tx = client.transaction();
  tx.patch(OLD, (p) => p.set(hide));
  for (const p of plan) tx.patch(p.id, (q) => (p.action === 'swap' ? q.set({ [`${p.path}._ref`]: p.to }) : q.unset([p.path])));
  for (const h of hrefPlan) tx.patch(h.id, (q) => q.set({ [h.path]: h.to }));
  await tx.commit();
  const left = await client.fetch('count(*[references($id) && _id != $id && !(_id in path("drafts.**"))])', { id: OLD });
  console.log(`APPLIED: ${OLD} hidden; ${plan.length} references changed; documents still pointing at it: ${left}`);
} else console.log('dry run (pass --apply to write production)');
