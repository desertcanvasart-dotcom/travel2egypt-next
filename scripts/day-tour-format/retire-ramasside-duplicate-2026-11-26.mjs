/**
 * Merge "Kom Ombo & Edfu Temples Day Tour from Aswan to Luxor" into "Aswan to Luxor by Road: Private Day
 * Tour with Kom Ombo & Edfu" (owner, 22 Nov: "I agree on your approach. Go ahead and merge them"). Same
 * journey, same stops, same guide: the €164 page (old layout, three tiers, 18+) duplicated the €128 tour
 * published 20 Nov (PR #316). Canon Gate D.
 *
 *   old  wp-page-88609                                       /kom-ombo-and-edfu-temples-day-tour-from-aswan (€164) → hidden, superseded-duplicate
 *   new  tour.private-tour-transfer-from-aswan-to-luxor-by-bus  /private-tour-transfer-from-aswan-to-luxor-by-bus (€128)
 *
 * Same mechanics as retire-islamic-cairo-2026-11-20.mjs: references swapped to the keeper (drafts too, not
 * published), hard-coded hrefs updated, the old tour hidden (not deleted); the three old URLs 301 in
 * migration/redirect-map.* (same commit) and existing rows that pointed at them now go straight to the keeper.
 *
 *   node --env-file=<.env> scripts/day-tour-format/retire-kom-ombo-aswan-2026-11-22.mjs           # dry run
 *   node --env-file=<.env> scripts/day-tour-format/retire-kom-ombo-aswan-2026-11-22.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const OLD = 'tour.ramasside-tours-desert-adventure-snorkeling-experience';
const NEW = 'wp-page-146018';
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN });

const neu = await client.getDocument(NEW);
if (!neu || neu.hidden) throw new Error(`${NEW} missing or hidden`);
const old = await client.getDocument(OLD);
if (!old) throw new Error(`${OLD} missing`);
for (const id of [OLD, NEW]) if (await client.getDocument(`drafts.${id}`)) throw new Error(`drafts.${id} exists — handle it first`);
const slugOf = (d, l) => d.slug.find((s) => s._key === l).value.current;
const pathOf = (d, l) => `${l === 'en' ? '' : `/${l}`}/${slugOf(d, l)}`;
const OLD_SLUG = Object.fromEntries(['en', 'es', 'ja'].map((l) => [l, slugOf(old, l)]));
const OLD_RE = new RegExp(`/(?:(es|ja)/)?(${Object.values(OLD_SLUG).join('|')})/?(?=$|[#?])`);

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
const getAt = (d, path) => path.split(/\.(?![^[]*\])/).reduce((o, seg) => {
  const m = seg.match(/^([^[]+)((?:\[[^\]]+\])*)$/);
  let v = o?.[m[1]];
  for (const [, k] of m[2].matchAll(/\[_key=="([^"]+)"\]/g)) v = v?.find((x) => x._key === k);
  return v;
}, d);

// 1. References.
const referrers = (await client.fetch('*[references($id)]', { id: OLD })).filter((d) => d._id !== OLD);
const plan = [];
for (const d of referrers) {
  for (const path of refPaths(d, OLD)) {
    const listItem = path.match(/^(.*)\[_key=="([^"]+)"\]$/);
    const parent = listItem ? getAt(d, listItem[1]) : null;
    const dup = Array.isArray(parent) && parent.some((x) => x?._ref === NEW);
    plan.push({ id: d._id, type: d._type, title: d.title?.find?.((t) => t._key === 'en')?.value ?? d.title ?? '', path, action: dup ? 'remove (keeper already listed)' : 'swap' });
  }
}

// 2. Hard-coded links (scan every document, paged).
const hrefPlan = [];
const listed = [];
const scan = (o, p, doc) => {
  if (Array.isArray(o)) o.forEach((x, i) => scan(x, `${p}[${x?._key ? `_key=="${x._key}"` : i}]`, doc));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) scan(v, p ? `${p}.${k}` : k, doc);
  else if (typeof o === 'string' && OLD_RE.test(o)) {
    const provenance = /wpUrl|_pendingInternalRef|^migration\./.test(p);
    if (/\.href$/.test(p) && !provenance && !doc._id.startsWith('drafts.') && doc._id !== OLD) {
      const m = o.match(OLD_RE);
      const l = m[1] ?? (Object.entries(OLD_SLUG).find(([, s]) => s === m[2])?.[0] ?? 'en');
      const rest = o.slice(o.indexOf(m[0]) + m[0].length);
      hrefPlan.push({ id: doc._id, path: p, from: o, to: `${pathOf(neu, l)}${rest}` });
    } else if (doc._id !== OLD) listed.push(`${doc._id} ${p}: ${o}${doc._id.startsWith('drafts.') ? ' (draft, left)' : ' (not a link / provenance)'}`);
  }
};
let start = '';
for (;;) {
  const page = await client.fetch('*[_id > $start] | order(_id) [0...400]', { start });
  if (!page.length) break;
  for (const d of page) scan(d, '', d);
  start = page[page.length - 1]._id;
}

const hide = { hidden: true, 'migration.reviewFlag': 'superseded-duplicate', 'migration.supersededBy': NEW, 'migration.supersededAt': new Date().toISOString() };
console.log(`OLD ${OLD}: ${JSON.stringify(old.title?.find((t) => t._key === 'en')?.value)} €${old.priceFrom}`);
console.log(`  slugs ${JSON.stringify(OLD_SLUG)}`);
console.log(`  set ${JSON.stringify(hide)}`);
console.log(`NEW ${NEW}: ${JSON.stringify(neu.title?.find((t) => t._key === 'en')?.value)}  ${['en', 'es', 'ja'].map((l) => pathOf(neu, l)).join('  ')}`);
console.log(`\nreferences (${plan.length} in ${new Set(plan.map((p) => p.id)).size} documents):`);
for (const p of plan) console.log(`  ${p.id} (${p.type}) ${p.path}: ${p.action}`);
console.log(`\nhref links to update (${hrefPlan.length}):`);
for (const h of hrefPlan) console.log(`  ${h.id} ${h.path}\n    ${h.from} → ${h.to}`);
console.log(`\nother hits, not changed (${listed.length}):`);
for (const x of listed) console.log(`  ${x}`);

if (apply) {
  const ids = [OLD, ...new Set([...plan.map((p) => p.id), ...hrefPlan.map((h) => h.id)])];
  await writeRollback(client, ids, 'before-merge-ramasside-sharm');
  const tx = client.transaction();
  tx.patch(OLD, (p) => p.set(hide));
  for (const p of plan) tx.patch(p.id, (q) => (p.action === 'swap' ? q.set({ [`${p.path}._ref`]: NEW }) : q.unset([p.path])));
  for (const h of hrefPlan) tx.patch(h.id, (q) => q.set({ [h.path]: h.to }));
  await tx.commit();
  const left = await client.fetch('count(*[references($id) && _id != $id])', { id: OLD });
  console.log(`APPLIED: ${OLD} hidden; ${plan.length} references changed; ${hrefPlan.length} links updated; documents still pointing at it: ${left}`);
} else console.log('\ndry run (pass --apply to write production)');
