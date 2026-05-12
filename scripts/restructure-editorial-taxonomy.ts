/**
 * Phase 3 of the journal taxonomy restructure (session brief 2026-05-12).
 *
 * - Renames the two existing root buckets (category-planning, category-destination)
 *   to "Planning" / "Destination" in EN/JA. ES on category-planning shifts from
 *   "Consejos de planificación" to "Planificación"; ES on category-destination
 *   stays untouched per the brief.
 * - Updates the 19 wp-category-* docs: EN Title Case, &amp; entity decode,
 *   and sets parent reference to the appropriate root.
 * - Creates two new leaf catch-all docs: category-planning-advice and
 *   category-destination-depth.
 *
 * Writes to migration-staging via SANITY_STAGING_API_WRITE_TOKEN. Refuses to
 * run against any other dataset.
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';

const REQUIRED_DATASET = 'migration-staging';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
const dataset = process.env.SANITY_STAGING_DATASET ?? REQUIRED_DATASET;

if (!projectId) { console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID'); process.exit(1); }
if (!token) { console.error('Missing SANITY_STAGING_API_WRITE_TOKEN'); process.exit(1); }
if (dataset !== REQUIRED_DATASET) {
  console.error(`Refusing: dataset=${dataset} but this script only writes to ${REQUIRED_DATASET}.`);
  process.exit(1);
}

const client = createClient({
  projectId, dataset, token,
  apiVersion: '2024-10-01', useCdn: false, perspective: 'raw',
});

const NOW = new Date().toISOString();

const ref = (id: string) => ({ _type: 'reference' as const, _ref: id });

// ──────────────────────────────────────────────────────────────────────────
// Action 1 — Root renames
// ──────────────────────────────────────────────────────────────────────────
const rootRenames: Array<{ id: string; name: Array<{ _key: string; value: string }> }> = [
  {
    id: 'category-planning',
    name: [
      { _key: 'en', value: 'Planning' },
      { _key: 'es', value: 'Planificación' },
      { _key: 'ja', value: 'プランニング' },
    ],
  },
  {
    id: 'category-destination',
    name: [
      { _key: 'en', value: 'Destination' },
      // ES intentionally untouched per brief: stays "Profundidad de destino"
      { _key: 'es', value: 'Profundidad de destino' },
      { _key: 'ja', value: '目的地' },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Action 2 — Leaf updates on the 19 wp-category-* docs
// EN-only name; sets parent reference. Decodes &amp; for wp-category-21.
// ES/JA absent on all 19 today; nothing to decode there.
// ──────────────────────────────────────────────────────────────────────────
const PLANNING_ROOT = 'category-planning';
const DEST_ROOT = 'category-destination';

const leafUpdates: Array<{ id: string; en: string; parent: string }> = [
  // Planning leaves
  { id: 'wp-category-94', en: 'Egypt Travel Guide', parent: PLANNING_ROOT },
  { id: 'wp-category-21', en: 'Tips & Tricks',       parent: PLANNING_ROOT },
  { id: 'wp-category-78', en: 'Safety',              parent: PLANNING_ROOT },
  // Destination leaves
  { id: 'wp-category-1',   en: 'Hotels',             parent: DEST_ROOT },
  { id: 'wp-category-360', en: 'Nile Cruise',        parent: DEST_ROOT },
  { id: 'wp-category-356', en: 'Pharaoh Monuments',  parent: DEST_ROOT },
  { id: 'wp-category-354', en: 'Islamic Monuments',  parent: DEST_ROOT },
  { id: 'wp-category-355', en: 'Coptic Monuments',   parent: DEST_ROOT },
  { id: 'wp-category-73',  en: 'Places in Egypt',    parent: DEST_ROOT },
  { id: 'wp-category-75',  en: 'Things to Do',       parent: DEST_ROOT },
  { id: 'wp-category-74',  en: 'Tours',              parent: DEST_ROOT },
  { id: 'wp-category-76',  en: 'Luxury Stay',        parent: DEST_ROOT },
  { id: 'wp-category-20',  en: 'Lifestyle',          parent: DEST_ROOT },
  { id: 'wp-category-77',  en: 'Culture',            parent: DEST_ROOT },
  { id: 'wp-category-381', en: 'Adventure',          parent: DEST_ROOT },
  { id: 'wp-category-647', en: 'Wellness',           parent: DEST_ROOT },
  { id: 'wp-category-693', en: 'Food',               parent: DEST_ROOT },
  { id: 'wp-category-72',  en: 'History',            parent: DEST_ROOT },
  { id: 'wp-category-19',  en: 'Creative',           parent: DEST_ROOT },
];

// ──────────────────────────────────────────────────────────────────────────
// Action 3 — Create two new leaf catch-all documents
// JA on category-destination-depth uses the prior ja value from the
// destination root ("訪問先を深く知る"), which translates "Destination depth".
// ──────────────────────────────────────────────────────────────────────────
const newLeaves = [
  {
    _id: 'category-planning-advice',
    _type: 'editorialCategory',
    name: [
      { _key: 'en', value: 'Planning Advice' },
      { _key: 'es', value: 'Consejos de planificación' },
      { _key: 'ja', value: 'プランニングのアドバイス' },
    ],
    slug: [
      { _key: 'en', _type: 'object', value: { _type: 'slug', current: 'planning-advice' } },
      { _key: 'es', _type: 'object', value: { _type: 'slug', current: 'planning-advice' } },
      { _key: 'ja', _type: 'object', value: { _type: 'slug', current: 'planning-advice' } },
    ],
    parent: ref(PLANNING_ROOT),
    migration: { source: 'taxonomy-restructure-phase3', migratedAt: NOW },
  },
  {
    _id: 'category-destination-depth',
    _type: 'editorialCategory',
    name: [
      { _key: 'en', value: 'Destination Depth' },
      { _key: 'es', value: 'Destino en profundidad' },
      // Preserved from the prior category-destination JA value, which means
      // "to deeply know the destination" — a clean fit for the leaf semantics.
      { _key: 'ja', value: '訪問先を深く知る' },
    ],
    slug: [
      { _key: 'en', _type: 'object', value: { _type: 'slug', current: 'destination-depth' } },
      { _key: 'es', _type: 'object', value: { _type: 'slug', current: 'destination-depth' } },
      { _key: 'ja', _type: 'object', value: { _type: 'slug', current: 'destination-depth' } },
    ],
    parent: ref(DEST_ROOT),
    migration: { source: 'taxonomy-restructure-phase3', migratedAt: NOW },
  },
];

async function main() {
  console.log(`\n=== Phase 3 — editorial taxonomy restructure (${dataset}) ===\n`);

  // Action 1 — root renames (no parent change; roots have no parent)
  for (const r of rootRenames) {
    await client.patch(r.id).set({ name: r.name }).commit();
    console.log(`✓ renamed root: ${r.id} → en="${r.name.find((n) => n._key === 'en')!.value}"`);
  }

  // Action 2 — leaf renames + parent set
  for (const l of leafUpdates) {
    await client
      .patch(l.id)
      .set({
        name: [{ _key: 'en', value: l.en }],
        parent: ref(l.parent),
      })
      .commit();
    console.log(`✓ leaf: ${l.id.padEnd(20)} en="${l.en}"  parent=${l.parent}`);
  }

  // Action 3 — create new leaves (fail if exists)
  for (const doc of newLeaves) {
    try {
      await client.create(doc);
      console.log(`✓ created leaf: ${doc._id}`);
    } catch (e: any) {
      console.error(`✗ create failed for ${doc._id}: ${e?.message || e}`);
      throw e;
    }
  }

  // Validation pass — pull all 23 docs back, check invariants.
  const all = await client.fetch<Array<{
    _id: string;
    name: Array<{ _key: string; value: string }>;
    parent?: { _ref: string } | null;
    slug: Array<{ _key: string; value: { current: string } }>;
  }>>(`*[_type=="editorialCategory"]{_id, name, parent, slug}`);

  const roots = all.filter((d) => !d.parent?._ref);
  const leaves = all.filter((d) => d.parent?._ref);

  console.log(`\nTotal: ${all.length} docs (expected 23). Roots: ${roots.length} (expected 2). Leaves: ${leaves.length} (expected 21).`);

  const orphans = leaves.filter((l) => !['category-planning', 'category-destination'].includes(l.parent!._ref));
  if (orphans.length) {
    console.error(`✗ Leaves with non-root parent: ${orphans.map((o) => o._id).join(', ')}`);
    process.exit(1);
  }

  if (all.length !== 23 || roots.length !== 2 || leaves.length !== 21) {
    console.error('✗ Invariant violation. See counts above.');
    process.exit(1);
  }

  // Print final consolidated table (en name only) for the operator.
  console.log('\n=== Consolidated table ===');
  for (const root of roots) {
    const rootEn = root.name.find((n) => n._key === 'en')?.value;
    console.log(`\n[ROOT] ${root._id}  en="${rootEn}"`);
    for (const leaf of leaves.filter((l) => l.parent!._ref === root._id).sort((a, b) =>
      (a.name.find((n) => n._key === 'en')?.value ?? '').localeCompare(
        b.name.find((n) => n._key === 'en')?.value ?? ''
      )
    )) {
      const enName = leaf.name.find((n) => n._key === 'en')?.value;
      const enSlug = leaf.slug.find((s) => s._key === 'en')?.value?.current;
      console.log(`   └─ ${leaf._id.padEnd(28)}  en="${enName}"  slug="${enSlug}"`);
    }
  }

  console.log('\nDone.');
}

main().catch((e) => { console.error(e); process.exit(1); });
