/**
 * Retire "Alexandria in a Day" at /2-day-pyramids-mediterranean-tour — a one-day Alexandria
 * trip under a "2-day" URL — into the Alexandria Day Trip from Cairo (owner's open items,
 * 18 Nov: "this page is the keeper; /2-day-pyramids-mediterranean-tour redirects to it").
 * Canon Gate D.
 *
 *   old  wp-page-145910  /2-day-pyramids-mediterranean-tour (€115) → hidden, superseded-duplicate
 *   new  wp-page-88427   /private-tour-day-tour-to-alexandria-from-cairo (€132)
 *
 * Nothing references the old page; drafts are checked too. The three URLs 301 in
 * migration/redirect-map.generated.ts (same commit).
 *
 *   node --env-file=<.env> scripts/day-tour-format/retire-alexandria-duplicate-2026-11-18.mjs           # dry run
 *   node --env-file=<.env> scripts/day-tour-format/retire-alexandria-duplicate-2026-11-18.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const OLDS = ['wp-page-145910'];
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
if (unhandled.length) throw new Error(`references in other fields: ${unhandled.map((d) => d._id).join(', ')}`);

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
  await writeRollback(client, [...OLDS, ...touched], 'before-retire-alexandria-duplicate');
  const tx = client.transaction();
  for (const id of OLDS) tx.patch(id, (p) => p.set(hide));
  for (const p of plan.filter((x) => !OLDS.includes(x.id))) {
    const path = `${p.field}[_key=="${p.key}"]`;
    tx.patch(p.id, (q) => (p.action === 'remove' ? q.unset([path]) : q.set({ [`${path}._ref`]: NEW })));
  }
  await tx.commit();
  const left = await client.fetch('count(*[references($ids) && !(_id in $ids) && !(_id in path("drafts.**"))])', { ids: OLDS });
  console.log(`APPLIED: ${OLDS.join(', ')} hidden; ${plan.filter((x) => !OLDS.includes(x.id)).length} cards changed; pages still pointing at an old tour: ${left}`);
} else console.log('dry run (pass --apply to write production)');
