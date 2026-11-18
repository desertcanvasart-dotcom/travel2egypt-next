/**
 * Retire the 3-day Bahariya & White Desert tour in favour of the 4-day White Desert &
 * Wadi Al Hittan tour (owner, 18 Nov: "redirect this tour to the 4-day White Desert and
 * Wadi El Hitan"). Canon Gate D, as the Nubian Retreat (#280).
 *
 *   old  wp-page-89439  /3-day-bahariya-white-desert-tour (same slug in ES and JA)
 *        → hidden, superseded-duplicate, supersededBy the new one
 *   new  tour.4-days-white-desert-wadi-al-hittan-exploration
 *
 * Tour cards don't skip hidden tours (relatedTours[]-> / endTours[]->), so the old card
 * is taken out where it would still show:
 *   tourLanding.4-days-egypt-tours  relatedTours: removed (the 4-day is already there)
 *   6 articles                      endTours: the old card → the 4-day tour
 * The three URLs 301 in migration/redirect-map.generated.ts (same commit).
 *
 *   node --env-file=<.env> scripts/itinerary-format/retire-bahariya-3day-2026-11-18.mjs           # dry run
 *   node --env-file=<.env> scripts/itinerary-format/retire-bahariya-3day-2026-11-18.mjs --apply
 */
import { createClient } from '@sanity/client';
import { writeRollback } from '../lib/content-gates.mjs';

const OLD = 'wp-page-89439';
const NEW = 'tour.4-days-white-desert-wadi-al-hittan-exploration';
const apply = process.argv.includes('--apply');
const client = createClient({ projectId: 'ufallvd2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_PRODUCTION_API_WRITE_TOKEN });

const neu = await client.getDocument(NEW);
if (!neu || neu.hidden) throw new Error(`${NEW} missing or hidden`);
const old = await client.getDocument(OLD);
if (!old) throw new Error(`${OLD} missing`);
if (await client.getDocument(`drafts.${OLD}`)) throw new Error(`drafts.${OLD} exists — handle it first`);

const referrers = await client.fetch('*[references($id) && !(_id in path("drafts.**"))]{_id, _type, relatedTours, endTours}', { id: OLD });
const drafts = await client.fetch('*[references($id) && _id in path("drafts.**")]._id', { id: OLD });
if (drafts.length) throw new Error(`drafts reference the old tour: ${drafts.join(', ')}`);

const plan = [];
for (const d of referrers) {
  for (const field of ['relatedTours', 'endTours']) {
    for (const item of d[field] ?? []) {
      if (item._ref !== OLD) continue;
      const hasNew = (d[field] ?? []).some((x) => x._ref === NEW);
      plan.push({ id: d._id, field, key: item._key, action: hasNew ? 'remove' : 'swap' });
    }
  }
}
const covered = new Set(plan.map((p) => p.id));
const unhandled = referrers.filter((d) => !covered.has(d._id));
if (unhandled.length) throw new Error(`references in other fields: ${unhandled.map((d) => d._id).join(', ')}`);

const hide = { hidden: true, 'migration.reviewFlag': 'superseded-duplicate', 'migration.supersededBy': NEW, 'migration.supersededAt': new Date().toISOString() };
console.log(`OLD ${OLD}: ${JSON.stringify(old.title?.find((t) => t._key === 'en')?.value)} €${old.priceFrom}`);
console.log(`  slugs ${JSON.stringify(old.slug.map((s) => `${s._key}:${s.value.current}`))}`);
console.log(`  set ${JSON.stringify(hide)}`);
console.log(`NEW ${NEW}: ${JSON.stringify(neu.title?.find((t) => t._key === 'en')?.value)} €${neu.priceFrom}`);
for (const p of plan) console.log(`  ${p.id} ${p.field}[_key=="${p.key}"]: ${p.action}`);

if (apply) {
  await writeRollback(client, [OLD, ...covered], 'before-retire-bahariya-3day');
  const tx = client.transaction();
  tx.patch(OLD, (p) => p.set(hide));
  for (const p of plan) {
    const path = `${p.field}[_key=="${p.key}"]`;
    tx.patch(p.id, (q) => (p.action === 'remove' ? q.unset([path]) : q.set({ [`${path}._ref`]: NEW })));
  }
  await tx.commit();
  const left = await client.fetch('count(*[references($id) && _type != "tour"])', { id: OLD });
  console.log(`APPLIED: ${OLD} hidden; ${plan.length} cards changed; cards still pointing at the old tour: ${left}`);
} else console.log('dry run (pass --apply to write production)');
