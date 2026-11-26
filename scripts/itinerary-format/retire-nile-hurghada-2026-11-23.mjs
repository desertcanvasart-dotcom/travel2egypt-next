/**
 * Merge the 15-day Nile Cruise and Hurghada Tour (wp-page-249752) into the 15-day Nile cruise and Hurghada page (wp-page-86875) — owner, 23 Nov (group Nile cruises). Same mechanics as
 * retire-family-2026-11-23.mjs. Run AFTER import-nile-hurghada-2026-11-23.mjs.
 *
 *   node --env-file=<.env> scripts/itinerary-format/retire-nile-hurghada-2026-11-23.mjs           # dry run
 *   node --env-file=<.env> scripts/itinerary-format/retire-nile-hurghada-2026-11-23.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const OLDS = ['wp-page-249752'];
const NEW = 'wp-page-86875';
const LANGS = ['en', 'es', 'ja'];
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ?? process.env.SANITY_API_WRITE_TOKEN });

const neu = await client.getDocument(NEW);
if (!neu || neu.hidden) throw new Error(`${NEW} missing or hidden`);
const imported = (neu.itineraryIntro ?? []).length > 0;
if (apply && !imported) throw new Error('run import-10day-merged first (the keeper has no itinerary format yet)');
const slugOf = (d, l) => d.slug.find((s) => s._key === l).value.current;

const pathOf = (d, l) => `${l === 'en' ? '' : `/${l}`}/${slugOf(d, l)}`;
const KEEP = Object.fromEntries(LANGS.map((l) => [l, pathOf(neu, l)]));
const olds = [];
for (const id of OLDS) {
  const d = await client.getDocument(id);
  if (!d) throw new Error(`${id} missing`);
  if (await client.getDocument(`drafts.${id}`)) throw new Error(`drafts.${id} exists — handle it first`);
  olds.push(d);
}
// slug → target language and keeper path (old pages' slugs and the keeper's old English address)
const MAP = {};
for (const d of olds) for (const l of LANGS) MAP[slugOf(d, l)] = [l, KEEP[l]];
const RE = new RegExp(`/(?:(es|ja)/)?(${Object.keys(MAP).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})/?(?=$|[#?])`);

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

// 1. References (drafts included)
const plan = [];
for (const OLD of OLDS) {
  const referrers = (await client.fetch('*[references($id)]', { id: OLD })).filter((d) => !OLDS.includes(d._id) && d._id !== `drafts.${OLD}`);
  for (const d of referrers) for (const path of refPaths(d, OLD)) {
    const listItem = path.match(/^(.*)\[_key=="([^"]+)"\]$/);
    const parent = listItem ? getAt(d, listItem[1]) : null;
    // A landing page for one length ("10-Day Egypt Tours") is no place for an 8-day tour: the card is removed.
    const dup = /^tourLanding\.\d+-days?-egypt-tours$/.test(d._id) || d._id === NEW || (Array.isArray(parent) && parent.some((x) => x?._ref === NEW)) || plan.some((p) => p.id === d._id && p.parentPath === listItem?.[1] && p.action === 'swap');
    plan.push({ id: d._id, type: d._type, title: d.title?.find?.((t) => t._key === 'en')?.value ?? d.title ?? '', path, parentPath: listItem?.[1], old: OLD, action: dup ? 'remove (keeper already listed)' : 'swap' });
  }
}

// 2. Hard-coded links in published documents
const hrefPlan = [];
const listed = [];
const scan = (o, p, doc) => {
  if (Array.isArray(o)) o.forEach((x, i) => scan(x, `${p}[${x?._key ? `_key=="${x._key}"` : i}]`, doc));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) scan(v, p ? `${p}.${k}` : k, doc);
  else if (typeof o === 'string' && RE.test(o)) {
    const provenance = /wpUrl|_pendingInternalRef|^migration\./.test(p);
    const own = OLDS.includes(doc._id) || doc._id === NEW;
    if (/\.href$/.test(p) && !provenance && !doc._id.startsWith('drafts.') && !own) {
      const m = o.match(RE);
      const [, to] = MAP[m[2]];
      const rest = o.slice(o.indexOf(m[0]) + m[0].length);
      hrefPlan.push({ id: doc._id, path: p, from: o, to: `${to}${rest}` });
    } else if (!own) listed.push(`${doc._id} ${p}: ${o.slice(0, 120)}${doc._id.startsWith('drafts.') ? ' (draft, left)' : ' (not a link / provenance)'}`);
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
for (const d of olds) console.log(`OLD ${d._id}: ${JSON.stringify(d.title?.find((t) => t._key === 'en')?.value)} €${d.priceFrom}\n  slugs ${JSON.stringify(LANGS.map((l) => pathOf(d, l)))}`);
console.log(`  set ${JSON.stringify(hide)}`);
console.log(`NEW ${NEW}: ${LANGS.map((l) => KEEP[l]).join('  ')}`);
console.log(`\nredirect rows needed (source → destination):`);
for (const [slug, [l, to]] of Object.entries(MAP)) console.log(`  ${l === 'en' ? '' : `/${l}`}/${slug} → ${to}`);
console.log(`\nreferences (${plan.length} in ${new Set(plan.map((p) => p.id)).size} documents): swap ${plan.filter((p) => p.action === 'swap').length}, remove ${plan.filter((p) => p.action !== 'swap').length}`);
const byAction = {};
for (const p of plan) { byAction[`${p.type} ${p.action}`] = (byAction[`${p.type} ${p.action}`] ?? 0) + 1; }
console.log(byAction);
console.log(`\nhref links to update (${hrefPlan.length}):`);
for (const h of hrefPlan) console.log(`  ${h.id} ${h.path}\n    ${h.from} → ${h.to}`);
console.log(`\nother hits, not changed (${listed.length}):`);
for (const x of listed.slice(0, 25)) console.log(`  ${x}`);

if (apply) {
  const ids = [...OLDS, ...new Set([...plan.map((p) => p.id), ...hrefPlan.map((h) => h.id)])];
  await writeRollback(client, ids, 'before-merge-nile-hurghada');
  const tx = client.transaction();
  for (const OLD of OLDS) tx.patch(OLD, (p) => p.set(hide));
  for (const p of plan) tx.patch(p.id, (q) => (p.action === 'swap' ? q.set({ [`${p.path}._ref`]: NEW }) : q.unset([p.path])));
  for (const h of hrefPlan) tx.patch(h.id, (q) => q.set({ [h.path]: h.to }));
  await tx.commit();
  const left = await client.fetch('count(*[references($ids) && !(_id in $ids)])', { ids: OLDS });
  console.log(`APPLIED: ${OLDS.join(', ')} hidden; ${plan.length} references changed; ${hrefPlan.length} links updated; documents still pointing at them: ${left}`);
} else console.log('\ndry run (pass --apply to write production)');
