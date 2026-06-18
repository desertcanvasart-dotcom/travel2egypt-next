#!/usr/bin/env node
/**
 * Audit — city.placesToGo broken-reference scanner (read-only).
 *
 * Backlog item from docs/migrations/phase-2-plan.md §11 ("`placesToGo`
 * broken-ref scanner"). The CityGuideSidebar renderer dereferences each
 * `city.placesToGo[]->` entry; a ref whose target doc was deleted (or whose
 * target hasn't propagated to the read-CDN) projects to null. The s57
 * defensive `.filter(Boolean)` (commit 9f15754) keeps the renderer up but
 * drops those nulls silently — so a stale/broken ref disappears without
 * warning and never gets re-curated.
 *
 * This script walks every `city` doc's `placesToGo` array and reports any
 * reference whose target document does not exist (broken/dangling ref),
 * grouped by city slug, with a total count. Surface the list to the operator
 * for re-curation in Studio. Non-blocking; run before Phase 4 wrap.
 *
 * Read-only. No mutations, no file output — prints a summary to stdout.
 *
 * Usage:  node scripts/audit-places-to-go-refs.mjs
 *         (or: npx tsx scripts/audit-places-to-go-refs.mjs)
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(ROOT, '.env'), 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, '')];
    })
);

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  // The production dataset is public (aclMode: public), so a token-less read
  // already surfaces every published doc. Fall back to a read token if one is
  // configured (mirrors the other read-only audit scripts).
  token: env.SANITY_API_READ_TOKEN || env.SANITY_AUTH_TOKEN || undefined,
  useCdn: false,
  perspective: 'published',
});

async function main() {
  console.error('Fetching published city docs with placesToGo refs…');

  // For each published city, project its EN slug and, for every placesToGo
  // entry, the raw `_ref` alongside the actual dereferenced target's `_id`
  // (`@->._id`). A null `targetId` means the `->` deref found no published
  // target — i.e. the reference is dangling/broken. This is exactly how the
  // CityGuideSidebar renderer reads it (a null deref is what its s57
  // `.filter(Boolean)` silently drops), so the report mirrors live behaviour.
  //
  // Cross-checked against a scope-free `count(*[_id in $refs])` bulk lookup —
  // both agree on the dangling set. (Note: `count(placesToGo[]->._id)` is NOT
  // a valid resolution check — it counts array slots including null derefs.)
  const cities = await client.fetch(`
    *[_type == "city" && !(_id in path("drafts.**")) && defined(placesToGo)]{
      _id,
      "slug": coalesce(slug[_key == "en"][0].value.current, slug.current),
      "refs": placesToGo[]{
        _ref,
        "targetId": @->._id
      }
    }
  `);

  console.error(`Loaded ${cities.length} city doc(s) with a placesToGo array.`);

  const broken = [];
  for (const c of cities) {
    for (const r of c.refs ?? []) {
      if (!r || !r._ref) continue;
      // A dangling ref dereferences to nothing — no target _id came back.
      if (!r.targetId) {
        broken.push({ citySlug: c.slug ?? '(no-slug)', cityId: c._id, ref: r._ref });
      }
    }
  }

  console.log('');
  console.log('=== city.placesToGo broken-reference report ===');
  console.log(`Dataset: ${env.NEXT_PUBLIC_SANITY_DATASET} (perspective: published)`);
  console.log('');

  if (broken.length === 0) {
    console.log('No dangling placesToGo references found. ✓');
  } else {
    // Group by city for readability.
    const byCity = new Map();
    for (const b of broken) {
      if (!byCity.has(b.citySlug)) byCity.set(b.citySlug, []);
      byCity.get(b.citySlug).push(b.ref);
    }
    for (const [citySlug, refs] of [...byCity.entries()].sort()) {
      console.log(`City: ${citySlug}`);
      for (const ref of refs) {
        console.log(`  - dangling _ref: ${ref}`);
      }
    }
    console.log('');
    console.log(
      `Total dangling references: ${broken.length} across ${byCity.size} city doc(s).`
    );
    console.log('Re-curate these placesToGo entries in Studio.');
  }
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
