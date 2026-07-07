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

async function main() {
  // Every asset, with a live count of references across ALL documents (drafts + published).
  const assets: any[] = await client.fetch(`
    *[_type == "sanity.imageAsset"]{
      _id,
      "refCount": count(*[references(^._id)]),
      "url": url,
      "originalFilename": originalFilename,
      "size": size,
      "w": metadata.dimensions.width,
      "h": metadata.dimensions.height
    }
  `);
  const orphans = assets.filter((a) => a.refCount === 0);
  const referenced = assets.length - orphans.length;
  console.log(`total assets: ${assets.length} | referenced (any doc): ${referenced} | TRUE orphans: ${orphans.length}`);

  // manifest for recovery (url lets you re-upload; sanity keeps CDN url live even post-delete until GC, but we snapshot anyway)
  const manifest = orphans.map((o) => ({
    _id: o._id, url: o.url, originalFilename: o.originalFilename ?? null,
    size: o.size ?? null, w: o.w ?? null, h: o.h ?? null,
  }));
  writeFileSync(
    '/Users/islamhussein/t2e/backups/orphan-assets-manifest.json',
    JSON.stringify({ takenAt: 'pre-delete', count: manifest.length, assets: manifest }, null, 2)
  );
  console.log(`backup manifest written: backups/orphan-assets-manifest.json (${manifest.length} assets)`);

  if (!APPLY) { console.log('DRY RUN — pass --apply to delete. No changes made.'); return; }

  let ok = 0, err = 0; const errors: string[] = [];
  for (const o of orphans) {
    try { await client.delete(o._id); ok++; }
    catch (e: any) { err++; errors.push(`${o._id}: ${e.message}`); }
  }
  console.log(`APPLIED. deleted assets ok: ${ok}, errored: ${err}`);
  for (const e of errors.slice(0, 10)) console.log('  ERR', e);
}
main();
