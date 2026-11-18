/**
 * Retire the second "Alexandria in a Day" page, /private-tour-2-day-trip-to-alexandria-from-cairo
 * — a one-day Alexandria trip from Cairo under a "2-day" URL, the twin of the page retired by
 * retire-alexandria-duplicate-2026-11-18.mjs — into the Alexandria Day Trip from Cairo
 * (owner, 18 Nov: "Keep €84, redirect it"). Canon Gate D.
 *
 *   old  wp-page-87976  /private-tour-2-day-trip-to-alexandria-from-cairo (€177) → hidden, superseded-duplicate
 *   new  wp-page-88427  /private-tour-day-tour-to-alexandria-from-cairo (€132)
 *
 * Tour cards don't skip hidden tours: each card for the old page is swapped for the keeper, or
 * removed where the page already lists it, is the keeper, or is a landing page for one length
 * (the keeper is a day tour). Drafts too. The three URLs 301 in migration/redirect-map.generated.ts.
 *
 *   node --env-file=<.env> scripts/day-tour-format/retire-alexandria-in-a-day-2026-11-18.mjs           # dry run
 *   node --env-file=<.env> scripts/day-tour-format/retire-alexandria-in-a-day-2026-11-18.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const OLDS = ['wp-page-87976'];
const NEW = 'wp-page-88427';
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

const neu = await client.getDocument(NEW);
if (!neu || neu.hidden) throw new Error(`${NEW} missing or hidden`);
const olds = [];
for (const id of OLDS) {
  const d = await client.getDocument(id);
  if (!d) throw new Error(`${id} missing`);
  if (await client.getDocument(`drafts.${id}`)) throw new Error(`drafts.${id} exists — handle it first`);
  olds.push(d);
}

// Unpublished drafts are repointed too, so publishing one later can't bring an old card back.
const referrers = await client.fetch('*[references($ids)]{_id, _type, "t": coalesce(title[_key=="en"][0].value, title), relatedTours, endTours}', { ids: OLDS });
for (const d of referrers) console.log(`referrer ${d._id} (${d._type}) ${typeof d.t === 'string' ? d.t.slice(0, 60) : ''}`);

const plan = [];
for (const d of referrers) {
  for (const field of ['relatedTours', 'endTours']) {
    // Walk the list as it will be after earlier changes, so a page never lists the 6-day twice.
    // A landing page for another length ("4-Day Egypt Tours") is no place for a 7-day tour: the card is removed.
    const lengthLanding = /^tourLanding\.\d+-days?-egypt-tours$/.test(d._id) && true;
    let hasNew = lengthLanding || d._id === NEW || d._id === `drafts.${NEW}` || (d[field] ?? []).some((x) => x._ref === NEW);
    for (const item of d[field] ?? []) {
      if (!OLDS.includes(item._ref)) continue;
      plan.push({ id: d._id, field, key: item._key, from: item._ref, action: hasNew ? 'remove' : 'swap' });
      hasNew = true;
    }
  }
}
const covered = new Set(plan.map((p) => p.id));
const unhandled = referrers.filter((d) => !covered.has(d._id) && !OLDS.includes(d._id));
// In-text links (a reference inside an article's markDefs) point straight at the keeper too.
const linkPlan = [];
if (unhandled.length) {
  const full = await client.fetch('*[_id in $ids]', { ids: unhandled.map((d) => d._id) });
  const walk = (o, path) => {
    const out = [];
    if (!o || typeof o !== 'object') return out;
    if (OLDS.includes(o._ref)) out.push(path);
    for (const [k, v] of Object.entries(o)) {
      const seg = Array.isArray(o) ? (v?._key ? `[_key=="${v._key}"]` : `[${k}]`) : (path ? `.${k}` : k);
      out.push(...walk(v, path + seg));
    }
    return out;
  };
  for (const d of full) {
    const paths = walk(d, '');
    if (!paths.length || paths.some((x) => !/markDefs\[_key=="[^"]+"\]\.reference$/.test(x))) throw new Error(`${d._id}: a reference that isn't a card or an in-text link: ${paths.join(', ')}`);
    for (const path of paths) linkPlan.push({ id: d._id, path });
  }
}
for (const x of linkPlan) console.log(`  link ${x.id} ${x.path}: → ${NEW}`);

const hide = { hidden: true, 'migration.reviewFlag': 'superseded-duplicate', 'migration.supersededBy': NEW, 'migration.supersededAt': new Date().toISOString() };
for (const old of olds) {
  console.log(`OLD ${old._id}: ${JSON.stringify(old.title?.find((t) => t._key === 'en')?.value)} €${old.priceFrom}`);
  console.log(`  slugs ${JSON.stringify(old.slug.map((s) => `${s._key}:${s.value.current}`))}`);
}
console.log(`  set ${JSON.stringify(hide)}`);
console.log(`NEW ${NEW}: ${JSON.stringify(neu.title?.find((t) => t._key === 'en')?.value)} €${neu.priceFrom}`);
console.log(`  slugs ${JSON.stringify(neu.slug.map((s) => `${s._key}:${s.value.current}`))}`);
for (const p of plan) console.log(`  ${p.id} ${p.field}[_key=="${p.key}"] (${p.from}): ${p.action}`);

if (apply) {
  // An old tour that lists the other one is changed only by being hidden; its cards are not shown.
  const touched = [...covered].filter((id) => !OLDS.includes(id));
  await writeRollback(client, [...OLDS, ...new Set([...touched, ...linkPlan.map((x) => x.id)])], 'before-retire-alexandria-in-a-day');
  const tx = client.transaction();
  for (const id of OLDS) tx.patch(id, (p) => p.set(hide));
  for (const p of plan.filter((x) => !OLDS.includes(x.id))) {
    const path = `${p.field}[_key=="${p.key}"]`;
    tx.patch(p.id, (q) => (p.action === 'remove' ? q.unset([path]) : q.set({ [`${path}._ref`]: NEW })));
  }
  for (const x of linkPlan) tx.patch(x.id, (q) => q.set({ [`${x.path}._ref`]: NEW }));
  await tx.commit();
  const left = await client.fetch('count(*[references($ids) && !(_id in $ids)])', { ids: OLDS });
  console.log(`APPLIED: ${OLDS.join(', ')} hidden; ${plan.filter((x) => !OLDS.includes(x.id)).length} cards and ${linkPlan.length} in-text links changed; pages (drafts included) still pointing at an old tour: ${left}`);
} else console.log('dry run (pass --apply to write production)');
