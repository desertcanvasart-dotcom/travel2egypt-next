/**
 * Delete image assets that are BOTH narrow (<3000px wide) AND orphaned
 * (referenced by no document, drafts + published). Backup manifest first.
 *
 *   npx tsx scripts/alt-backfill/prune-narrow-orphans.ts            # dry run
 *   npx tsx scripts/alt-backfill/prune-narrow-orphans.ts --apply    # delete
 */
import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync } from 'node:fs';

const env: Record<string, string> = {};
for (const line of readFileSync('/Users/islamhussein/t2e/.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2',
  dataset: env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-12-01',
  token: env.SANITY_PRODUCTION_API_WRITE_TOKEN || env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});
const APPLY = process.argv.includes('--apply');
const MAX_W = 3000;

async function main() {
  const rows: any[] = await client.fetch(`
    *[_type == "sanity.imageAsset"]{
      _id,
      "w": metadata.dimensions.width,
      "h": metadata.dimensions.height,
      "refCount": count(*[references(^._id)]),
      "url": url,
      "originalFilename": originalFilename,
      "size": size
    }
  `);
  const targets = rows.filter((r) => r.refCount === 0 && typeof r.w === 'number' && r.w < MAX_W);
  console.log(`total assets: ${rows.length} | orphans: ${rows.filter((r) => r.refCount === 0).length}`);
  console.log(`TARGETS (orphan AND <${MAX_W}px wide): ${targets.length}`);

  const manifest = targets.map((t) => ({
    _id: t._id, url: t.url, originalFilename: t.originalFilename ?? null,
    w: t.w ?? null, h: t.h ?? null, size: t.size ?? null,
  }));
  writeFileSync(
    '/Users/islamhussein/t2e/backups/narrow-orphan-prune-manifest.json',
    JSON.stringify({ maxWidth: MAX_W, count: manifest.length, assets: manifest }, null, 2)
  );
  console.log(`backup manifest written: backups/narrow-orphan-prune-manifest.json (${manifest.length})`);

  if (!APPLY) { console.log('DRY RUN — pass --apply to delete. No changes made.'); return; }

  let ok = 0, err = 0; const errors: string[] = [];
  for (const t of targets) {
    try { await client.delete(t._id); ok++; }
    catch (e: any) { err++; errors.push(`${t._id}: ${e.message}`); }
  }
  console.log(`APPLIED. deleted: ${ok}, errored: ${err}`);
  for (const e of errors.slice(0, 15)) console.log('  ERR', e);
}
main();
