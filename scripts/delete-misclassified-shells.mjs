#!/usr/bin/env node
/**
 * Session 18 — Delete the 26 misclassified tour shell docs.
 *
 * Destructive. Requires SANITY_API_WRITE_TOKEN. Refuses to delete a doc
 * that has inbound references unless --force is set (and even then, logs
 * the references first so the operator can decide). Run order:
 *
 *   1. Read audit candidates → filter to recommended_target startsWith 'shell-empty'
 *   2. For each, count inbound references; abort with diagnostic if any.
 *   3. Verify all 26 currently exist + have body == null (safety check).
 *   4. Delete in a single transaction. Write deletion-log.json.
 *   5. Verify total tour count = 196.
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CANDIDATES = path.join(ROOT, 'migration/sessions/session-18-audit/tour-misclassification-candidates.json');
const OUT_LOG = path.join(ROOT, 'migration/sessions/session-18/deletion-log.json');

const FORCE = process.argv.includes('--force');
const DRY = process.argv.includes('--dry-run');

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, '')];
  })
);
const token = env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN in .env');
  process.exit(1);
}
const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
});

const all = JSON.parse(fs.readFileSync(CANDIDATES, 'utf8'));
const targets = all.filter((c) => String(c.recommended_target).startsWith('shell-empty'));
console.error(`Loaded ${all.length} candidates, ${targets.length} flagged for deletion.`);

if (targets.length !== 26) {
  console.error(`UNEXPECTED: expected 26 deletion targets, got ${targets.length}.`);
  process.exit(1);
}

// 1) Pre-delete safety check: each doc exists, has empty body, has no inbound refs.
const ids = targets.map((c) => c.wpId);
const liveDocs = await client.fetch(
  `*[_id in $ids]{
    _id,
    type,
    "bodyLen": length(coalesce(pt::text(body[_key=="en"][0].value), "")),
    "incomingRefs": *[references(^._id) && !(_id in path("drafts.**"))]{ _id, _type }
  }`,
  { ids }
);
const liveById = Object.fromEntries(liveDocs.map((d) => [d._id, d]));

const issues = [];
for (const t of targets) {
  const live = liveById[t.wpId];
  if (!live) {
    issues.push({ id: t.wpId, slug: t.slug, kind: 'missing-in-sanity' });
    continue;
  }
  if (live.bodyLen > 0) {
    issues.push({ id: t.wpId, slug: t.slug, kind: 'has-body', bodyLen: live.bodyLen });
  }
  if (live.incomingRefs && live.incomingRefs.length) {
    issues.push({ id: t.wpId, slug: t.slug, kind: 'has-inbound-refs', refs: live.incomingRefs });
  }
}

if (issues.length) {
  console.error('Pre-delete safety check failed:');
  console.error(JSON.stringify(issues, null, 2));
  if (!FORCE) {
    console.error('Aborting. Re-run with --force ONLY if all issues are explicable.');
    process.exit(1);
  } else {
    console.error('--force set; proceeding despite issues. Logged above for the deletion-log.');
  }
}

// 2) Delete (transaction). DRY mode just prints the planned operations.
if (DRY) {
  console.error('DRY RUN: would delete:');
  for (const id of ids) console.error(`  - ${id}`);
  process.exit(0);
}

console.error(`Deleting ${ids.length} docs in a single transaction…`);
const tx = client.transaction();
for (const id of ids) tx.delete(id);
const result = await tx.commit({ visibility: 'sync' });

// 3) Post-delete verification.
const tourCount = await client.fetch(`count(*[_type=="tour" && !(_id in path("drafts.**"))])`);
const remainingEmpty = await client.fetch(`
  count(*[_type=="tour" && !(_id in path("drafts.**")) &&
         length(coalesce(pt::text(body[_key=="en"][0].value), "")) == 0])
`);
const stillExists = await client.fetch(`*[_id in $ids]._id`, { ids });

const log = {
  deleted_at: new Date().toISOString(),
  intended_count: 26,
  deleted_ids: ids,
  remaining_unintended: stillExists,
  pre_delete_issues: issues,
  post_delete_tour_count: tourCount,
  post_delete_remaining_empty_body_tours: remainingEmpty,
  transaction_id: result.transactionId,
};
fs.mkdirSync(path.dirname(OUT_LOG), { recursive: true });
fs.writeFileSync(OUT_LOG, JSON.stringify(log, null, 2) + '\n');

console.error(`\n=== Deletion complete ===`);
console.error(`  Deleted: ${ids.length}`);
console.error(`  Tour count now: ${tourCount} (expected 196)`);
console.error(`  Remaining empty-body tours: ${remainingEmpty}`);
console.error(`  Log: ${OUT_LOG}`);
if (stillExists.length) {
  console.error(`  WARNING: ${stillExists.length} of the targeted docs still exist.`);
  process.exit(2);
}
