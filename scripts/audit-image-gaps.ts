/**
 * Two checks against PRODUCTION:
 *   1. Orphan image assets — uploaded but referenced by no document.
 *   2. Images under 3000px wide — total, and specifically which live pages
 *      carry a sub-3000px hero (the actionable upgrade list).
 *
 *   npx tsx scripts/audit-image-gaps.ts
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';

const token =
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN;
const c = createClient({
  projectId: 'ufallvd2',
  dataset: 'production',
  apiVersion: '2024-12-01',
  token,
  useCdn: false,
  perspective: 'raw', // count refs from drafts too — a draft ref = still "in use"
});

const mb = (b: number) => (b / 1024 / 1024).toFixed(1) + ' MB';

async function main() {
  const total = await c.fetch<number>('count(*[_type=="sanity.imageAsset"])');
  const subTotal = await c.fetch<number>('count(*[_type=="sanity.imageAsset" && metadata.dimensions.width < 3000])');

  // 1) ORPHANS — image assets referenced by no non-asset document.
  const orphans = await c.fetch<Array<{ _id: string; fn: string | null; w: number | null; h: number | null; size: number | null }>>(
    `*[_type=="sanity.imageAsset" && count(*[_type != "sanity.imageAsset" && references(^._id)]) == 0]{
       _id, "fn": originalFilename, "w": metadata.dimensions.width, "h": metadata.dimensions.height, size
     } | order(size desc)`,
  );
  const orphanBytes = orphans.reduce((s, o) => s + (o.size || 0), 0);
  const orphanUnder3k = orphans.filter((o) => (o.w ?? 0) < 3000).length;

  // 2) Live (non-draft) pages whose hero asset is < 3000px wide.
  const subHero = await c.fetch<Array<{ _type: string; _id: string; slug: string | null; w: number; h: number }>>(
    `*[ !(_id in path("drafts.**")) && defined(heroImage.asset) && heroImage.asset->metadata.dimensions.width < 3000 ]{
       _type, _id, "slug": coalesce(slug[_key=="en"][0].value.current, slug.current), "w": heroImage.asset->metadata.dimensions.width, "h": heroImage.asset->metadata.dimensions.height
     } | order(_type asc, w asc)`,
  );

  console.log(`\n=== Image asset overview (production) ===`);
  console.log(`  total image assets:      ${total}`);
  console.log(`  under 3000px wide:       ${subTotal}`);

  console.log(`\n=== 1) ORPHAN assets (assigned to no document) ===`);
  console.log(`  count: ${orphans.length}  ·  reclaimable: ${mb(orphanBytes)}  ·  of which <3000px wide: ${orphanUnder3k}`);
  for (const o of orphans.slice(0, 20)) {
    console.log(`    ${String(o.w ?? '?').padStart(4)}x${String(o.h ?? '?').padEnd(5)}  ${o.size ? (o.size / 1024).toFixed(0).padStart(5) + 'KB' : '   ?'}  ${o.fn ?? o._id}`);
  }
  if (orphans.length > 20) console.log(`    … +${orphans.length - 20} more`);

  console.log(`\n=== 2) Live PAGES with a sub-3000px hero (upgrade candidates) ===`);
  const byType = new Map<string, number>();
  for (const p of subHero) byType.set(p._type, (byType.get(p._type) ?? 0) + 1);
  console.log(`  count: ${subHero.length}  ·  by type: ${[...byType].map(([t, n]) => `${t}:${n}`).join(', ') || 'none'}`);
  for (const p of subHero.slice(0, 30)) {
    console.log(`    ${String(p.w).padStart(4)}x${String(p.h).padEnd(5)}  ${p._type.padEnd(13)} ${p.slug ?? p._id}`);
  }
  if (subHero.length > 30) console.log(`    … +${subHero.length - 30} more`);
}

main().catch((e) => { console.error(e); process.exit(1); });
