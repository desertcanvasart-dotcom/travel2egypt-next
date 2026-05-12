/**
 * Phase 4 of the journal taxonomy restructure: re-tag all 508 article docs
 * in migration-staging onto the new 21-leaf taxonomy via the locked
 * specificity rule.
 *
 * - Pre-flight: confirm all 21 leaf editorialCategory docs exist and snapshot
 *   the current article→root reference counts.
 * - Compute target leaf for each article from migration.wpCategorySlugs.
 * - Cross-bucket articles get migration.reviewFlag = "category-ambiguous".
 * - Articles with no wpCategorySlugs (or no recognized slug) default to
 *   category-destination-depth + migration.reviewFlag = "category-orphan".
 * - Patches batched via client.transaction() in groups of 50.
 * - Pre-existing migration.reviewFlag values are preserved (we only set the
 *   new flag when the existing value is empty); conflicts are logged so the
 *   operator can decide whether to remediate.
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

const PLANNING_ROOT = 'category-planning';
const DEST_ROOT = 'category-destination';
const PLANNING_FALLBACK = 'category-planning-advice';
const DEST_FALLBACK = 'category-destination-depth';

// Locked specificity order. WP slug → target editorialCategory _id, ranked
// most specific (top) to least specific (bottom). The first slug in this
// list that appears in an article's wpCategorySlugs wins.
const PRIORITY: Array<{ wpSlug: string; targetId: string; bucket: 'D' | 'P' }> = [
  { wpSlug: 'pharaoh-monuments',  targetId: 'wp-category-356', bucket: 'D' },
  { wpSlug: 'islamic-monuments',  targetId: 'wp-category-354', bucket: 'D' },
  { wpSlug: 'coptic-monuments',   targetId: 'wp-category-355', bucket: 'D' },
  { wpSlug: 'nile-cruise',        targetId: 'wp-category-360', bucket: 'D' },
  { wpSlug: 'luxury-stay',        targetId: 'wp-category-76',  bucket: 'D' },
  { wpSlug: 'hotels',             targetId: 'wp-category-1',   bucket: 'D' },
  { wpSlug: 'wellness',           targetId: 'wp-category-647', bucket: 'D' },
  { wpSlug: 'food',               targetId: 'wp-category-693', bucket: 'D' },
  { wpSlug: 'adventure',          targetId: 'wp-category-381', bucket: 'D' },
  { wpSlug: 'history',            targetId: 'wp-category-72',  bucket: 'D' },
  { wpSlug: 'culture',            targetId: 'wp-category-77',  bucket: 'D' },
  { wpSlug: 'lifestyle',          targetId: 'wp-category-20',  bucket: 'D' },
  { wpSlug: 'creative',           targetId: 'wp-category-19',  bucket: 'D' },
  { wpSlug: 'places-in-egypt',    targetId: 'wp-category-73',  bucket: 'D' },
  { wpSlug: 'things-to-do',       targetId: 'wp-category-75',  bucket: 'D' },
  { wpSlug: 'tours',              targetId: 'wp-category-74',  bucket: 'D' },
  { wpSlug: 'safety',             targetId: 'wp-category-78',  bucket: 'P' },
  { wpSlug: 'tips-tricks',        targetId: 'wp-category-21',  bucket: 'P' },
  { wpSlug: 'egypt-travel-guide', targetId: 'wp-category-94',  bucket: 'P' },
];

const PLANNING_WP_SLUGS = new Set(['safety', 'tips-tricks', 'egypt-travel-guide']);
const DEST_WP_SLUGS = new Set(PRIORITY.filter((p) => p.bucket === 'D').map((p) => p.wpSlug));

interface ArticleRow {
  _id: string;
  language?: string;
  wpCategorySlugs?: string[];
  currentCategoryRef?: string;
  currentReviewFlag?: string;
}

interface Assignment {
  _id: string;
  targetId: string;
  reviewFlag?: 'category-ambiguous' | 'category-orphan';
  reason: 'matched' | 'orphan-no-slugs' | 'orphan-no-match';
}

function classify(article: ArticleRow): Assignment {
  const slugs = article.wpCategorySlugs ?? [];

  if (slugs.length === 0) {
    return { _id: article._id, targetId: DEST_FALLBACK, reviewFlag: 'category-orphan', reason: 'orphan-no-slugs' };
  }

  // Find the highest-priority slug present in the article's wpCategorySlugs.
  const slugSet = new Set(slugs);
  const matched = PRIORITY.find((p) => slugSet.has(p.wpSlug));

  if (!matched) {
    return { _id: article._id, targetId: DEST_FALLBACK, reviewFlag: 'category-orphan', reason: 'orphan-no-match' };
  }

  // Cross-bucket detection.
  const hasPlanning = slugs.some((s) => PLANNING_WP_SLUGS.has(s));
  const hasDest = slugs.some((s) => DEST_WP_SLUGS.has(s));
  const reviewFlag = hasPlanning && hasDest ? 'category-ambiguous' as const : undefined;

  return { _id: article._id, targetId: matched.targetId, reviewFlag, reason: 'matched' };
}

async function main() {
  console.log(`\n=== Phase 4 — article re-tagging (${dataset}) ===\n`);

  // Pre-flight: confirm all 21 leaf docs exist.
  const leafIds = [
    ...PRIORITY.map((p) => p.targetId),
    PLANNING_FALLBACK,
    DEST_FALLBACK,
  ];
  const foundLeaves = await client.fetch<string[]>(
    `*[_type=="editorialCategory" && _id in $ids]._id`,
    { ids: leafIds }
  );
  const missing = leafIds.filter((id) => !foundLeaves.includes(id));
  if (missing.length) {
    console.error(`✗ Missing leaf docs: ${missing.join(', ')}`);
    process.exit(1);
  }
  console.log(`✓ Pre-flight: all 21 leaf editorialCategory docs exist.`);

  // Snapshot article→root references before patching.
  const beforeCounts = await client.fetch<{ toPlanning: number; toDest: number; total: number }>(
    `{
       "toPlanning": count(*[_type=="article" && category._ref == "${PLANNING_ROOT}"]),
       "toDest": count(*[_type=="article" && category._ref == "${DEST_ROOT}"]),
       "total": count(*[_type=="article"])
     }`
  );
  console.log(`✓ Before snapshot: ${beforeCounts.toPlanning} articles → ${PLANNING_ROOT}, ${beforeCounts.toDest} → ${DEST_ROOT}, total=${beforeCounts.total}\n`);

  // Fetch all articles.
  const articles = await client.fetch<ArticleRow[]>(
    `*[_type=="article"]{
       _id,
       language,
       "wpCategorySlugs": migration.wpCategorySlugs,
       "currentCategoryRef": category._ref,
       "currentReviewFlag": migration.reviewFlag
     }`
  );
  console.log(`Fetched ${articles.length} article docs.\n`);

  // Classify all articles.
  const assignments = articles.map(classify);

  const reviewFlagConflicts: Array<{ _id: string; existing: string; proposed: string }> = [];
  for (const a of assignments) {
    if (a.reviewFlag) {
      const article = articles.find((x) => x._id === a._id)!;
      if (article.currentReviewFlag && article.currentReviewFlag !== a.reviewFlag) {
        reviewFlagConflicts.push({
          _id: a._id,
          existing: article.currentReviewFlag,
          proposed: a.reviewFlag,
        });
      }
    }
  }

  // Commit in batches of 50.
  const BATCH = 50;
  let committed = 0;
  for (let i = 0; i < assignments.length; i += BATCH) {
    const slice = assignments.slice(i, i + BATCH);
    const tx = client.transaction();
    for (const a of slice) {
      const article = articles.find((x) => x._id === a._id)!;
      const setOps: Record<string, any> = {
        category: { _type: 'reference', _ref: a.targetId },
      };
      // Only set reviewFlag if currently empty, to preserve prior signals
      // (e.g. "unclassified-as-article", "locale-orphan") that may still
      // be load-bearing. Conflicts are logged but not auto-resolved.
      if (a.reviewFlag && !article.currentReviewFlag) {
        setOps['migration.reviewFlag'] = a.reviewFlag;
      }
      tx.patch(a._id, (p) => p.set(setOps));
    }
    await tx.commit();
    committed += slice.length;
    process.stdout.write(`\r  committed ${committed}/${assignments.length}`);
  }
  console.log('\n');

  // ─── Verification ───────────────────────────────────────────────────────
  console.log('=== Verification ===\n');

  // Per-leaf article counts.
  const leafCounts: Record<string, number> = {};
  for (const id of leafIds) {
    leafCounts[id] = await client.fetch<number>(
      `count(*[_type=="article" && category._ref == $id])`,
      { id }
    );
  }

  const leafNames = await client.fetch<Array<{ _id: string; name: string }>>(
    `*[_type=="editorialCategory" && _id in $ids]{ _id, "name": name[_key=="en"][0].value }`,
    { ids: leafIds }
  );
  const nameById = Object.fromEntries(leafNames.map((l) => [l._id, l.name]));

  console.log('Per-leaf article counts:');
  const sortedLeaves = leafIds
    .map((id) => ({ id, name: nameById[id], count: leafCounts[id] }))
    .sort((a, b) => b.count - a.count);
  let leafSum = 0;
  for (const l of sortedLeaves) {
    leafSum += l.count;
    console.log(`  ${l.count.toString().padStart(4)}  ${l.name.padEnd(22)}  ${l.id}`);
  }
  console.log(`  ----`);
  console.log(`  ${leafSum.toString().padStart(4)}  total assigned to leaves`);

  // Ambiguous + orphan counts via reviewFlag.
  const ambiguousCount = await client.fetch<number>(
    `count(*[_type=="article" && migration.reviewFlag == "category-ambiguous"])`
  );
  const orphanCount = await client.fetch<number>(
    `count(*[_type=="article" && migration.reviewFlag == "category-orphan"])`
  );
  const ambiguousSamples = await client.fetch<string[]>(
    `*[_type=="article" && migration.reviewFlag == "category-ambiguous"][0...5]._id`
  );
  const orphanIds = await client.fetch<string[]>(
    `*[_type=="article" && migration.reviewFlag == "category-orphan"]._id`
  );

  console.log(`\nAmbiguous (reviewFlag=category-ambiguous): ${ambiguousCount}`);
  console.log(`  samples: ${ambiguousSamples.join(', ')}`);
  console.log(`\nOrphans (reviewFlag=category-orphan): ${orphanCount}`);
  console.log(`  ids: ${orphanIds.join(', ')}`);

  // Confirm zero articles still reference root buckets.
  const rootRefs = await client.fetch<number>(
    `count(*[_type=="article" && (category._ref == "${PLANNING_ROOT}" || category._ref == "${DEST_ROOT}")])`
  );
  console.log(`\nArticles still referencing root buckets: ${rootRefs} (expected 0)`);
  if (rootRefs !== 0) {
    console.error('✗ INVARIANT FAIL: articles still point to root buckets.');
    process.exit(1);
  }

  // Total doc count.
  const totalArticles = await client.fetch<number>(`count(*[_type=="article"])`);
  console.log(`Total article docs: ${totalArticles} (expected ${beforeCounts.total})`);
  if (totalArticles !== beforeCounts.total) {
    console.error('✗ INVARIANT FAIL: article doc count changed during patch.');
    process.exit(1);
  }

  // ReviewFlag conflicts.
  console.log(`\nReviewFlag conflicts (pre-existing flag preserved, proposed flag NOT applied): ${reviewFlagConflicts.length}`);
  if (reviewFlagConflicts.length) {
    for (const c of reviewFlagConflicts.slice(0, 20)) {
      console.log(`  ${c._id}  existing="${c.existing}"  proposed="${c.proposed}"`);
    }
    if (reviewFlagConflicts.length > 20) {
      console.log(`  ... and ${reviewFlagConflicts.length - 20} more`);
    }
  }

  console.log('\n✓ Phase 4 complete.');
}

main().catch((e) => { console.error(e); process.exit(1); });
