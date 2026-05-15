#!/usr/bin/env node
/**
 * Session 21 — Delete 8 editorial-flagged hotel + nileCruise docs.
 * Refuses to delete on inbound refs or non-empty body unless --force.
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'migration/sessions/session-21');
const OUT_LOG = path.join(OUT_DIR, 'deletion-log.json');

const FORCE = process.argv.includes('--force');
const DRY = process.argv.includes('--dry-run');

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, '')];
  })
);
const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const targets = {
  'wrong-entity-type': [
    { id: 'wp-page-86853', name: '4-Days Stay at Marriott Mena House', should_be: 'tour package (private, 4-day, Cairo/Giza)' },
  ],
  superseded: [
    { id: 'wp-page-72456', name: "Hilton Sharm Shark's Bay", redirect_to: 'Double Tree Sharks Bay Resort' },
  ],
  'theme-hub-misclassified': [
    { id: 'wp-page-86752', name: 'Nile Cruise Holidays' },
    { id: 'wp-page-86704', name: 'Dahabiya Nile Cruise' },
  ],
  duplicates: [
    { id: 'wp-page-65309', name: 'Nour El Nil Malouka Dahabiya', kept: 'wp-page-64203', kept_name: 'Malouka Dahabiya' },
    { id: 'wp-page-106202', name: 'Adelaïde Dahabiya: A Journey Along the Nile', kept: 'wp-page-83685', kept_name: 'Adelaïde Dahabiya' },
    { id: 'wp-page-106203', name: 'Agatha Dahabiya: Journey Along the Nile', kept: 'wp-page-83686', kept_name: 'Agatha Dahabiya' },
    { id: 'wp-page-70064', name: ' Nour El Nil Meroe Dahabiya', kept: 'wp-page-64190', kept_name: 'Nour El Nil Meroe Dahabiya', note: 'Inferred 4th duplicate (operator listed Adelaïde twice; Meroe is the only other nileCruise duplicate pair, math reconciles to 34).' },
  ],
};

const allIds = Object.values(targets).flat().map((t) => t.id);
if (allIds.length !== 8) {
  console.error(`Expected 8 targets, got ${allIds.length}.`);
  process.exit(1);
}

// 1) Pre-delete safety: live, empty body, no inbound refs.
const live = await client.fetch(
  `*[_id in $ids]{
    _id, _type,
    "nameEn": name[_key=="en"].value,
    "bodyLen": length(coalesce(pt::text(body), "")),
    "incomingRefs": *[references(^._id) && !(_id in path("drafts.**"))]{_id, _type}
  }`,
  { ids: allIds }
);
const liveById = Object.fromEntries(live.map((d) => [d._id, d]));

const issues = [];
for (const id of allIds) {
  const l = liveById[id];
  if (!l) issues.push({ id, kind: 'missing-in-sanity' });
  else {
    if (l.bodyLen > 0) issues.push({ id, kind: 'has-body', bodyLen: l.bodyLen });
    if (l.incomingRefs?.length) issues.push({ id, kind: 'has-inbound-refs', refs: l.incomingRefs });
  }
}

// Verify canonicals still exist (so we don't orphan).
const keepIds = targets.duplicates.map((d) => d.kept);
const canonicalsAlive = await client.fetch(`*[_id in $ids]._id`, { ids: keepIds });
for (const k of keepIds) {
  if (!canonicalsAlive.includes(k)) issues.push({ id: k, kind: 'canonical-missing' });
}

if (issues.length) {
  console.error('Pre-delete safety check failed:');
  console.error(JSON.stringify(issues, null, 2));
  if (!FORCE) {
    console.error('Aborting. Re-run with --force ONLY if all issues are explicable.');
    process.exit(1);
  }
}

if (DRY) {
  console.error('DRY RUN: would delete:');
  for (const id of allIds) console.error(`  - ${id}  (${liveById[id]?.nameEn?.[0] ?? '?'})`);
  process.exit(0);
}

// 2) Delete in single transaction.
console.error(`Deleting ${allIds.length} docs in a single transaction…`);
const tx = client.transaction();
for (const id of allIds) tx.delete(id);
const result = await tx.commit({ visibility: 'sync' });

// 3) Post-delete verification.
const hotelCount = await client.fetch(`count(*[_type=="hotel" && !(_id in path("drafts.**"))])`);
const cruiseCount = await client.fetch(`count(*[_type=="nileCruise" && !(_id in path("drafts.**"))])`);
const stillExists = await client.fetch(`*[_id in $ids]._id`, { ids: allIds });

const log = {
  deleted_at: new Date().toISOString(),
  count: allIds.length,
  transaction_id: result.transactionId,
  by_category: targets,
  pre_delete_snapshot: live,
  pre_delete_issues: issues,
  post_delete: {
    hotel_count: hotelCount,
    nileCruise_count: cruiseCount,
    expected_hotel: 64,
    expected_nileCruise: 34,
    still_existing: stillExists,
  },
};
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_LOG, JSON.stringify(log, null, 2) + '\n');

console.error(`\n=== Deletion complete ===`);
console.error(`  Deleted: ${allIds.length}`);
console.error(`  Hotel count: ${hotelCount} (expected 64)`);
console.error(`  NileCruise count: ${cruiseCount} (expected 34)`);
console.error(`  Log: ${OUT_LOG}`);
if (stillExists.length) {
  console.error(`  WARNING: ${stillExists.length} targets still exist.`);
  process.exit(2);
}
