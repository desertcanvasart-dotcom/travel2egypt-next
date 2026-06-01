/**
 * Workstream C — fix orphaned guide pages + a cross-city stray nav ref.
 *
 * ORPHANS: several `section == "places-to-go"` guideArticles are live but not
 * referenced by their city's `placesToGo` array — and the sidebar's places-to-go
 * section is populated ONLY from that array, so they're unreachable in nav.
 * Fix: append a reference to the published city doc (and unhide where hidden).
 *
 * STRAY REF: suez.placesToGo references a port-said-parented doc, so the sidebar
 * builds /guide/suez/<slug> which 404s. Fix: remove the stray ref.
 *
 * (The Kharga/Kom Ombo/Marsa Matruh/Alexandria stray nav links were already
 * resolved as a side effect of dedup-guide-legacy-pages.ts hiding the docs that
 * cross-referenced those cities.)
 *
 * Reversible & idempotent. Usage:
 *   npx tsx scripts/fix-guide-orphans-and-strays.ts --dry-run
 *   npx tsx scripts/fix-guide-orphans-and-strays.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
loadEnv();

// Orphan article id → its published city doc id (+ unhide flag).
const ORPHANS: Array<{ articleId: string; cityId: string; slug: string; unhide?: boolean }> = [
  { articleId: 'wp-page-63606', cityId: 'wp-page-83284', slug: 'coptic-cairo' },           // cairo
  { articleId: 'wp-page-61666', cityId: 'wp-page-58530', slug: 'al-fayoum-waterwheels' },   // al-fayoum
  { articleId: 'wp-page-72890', cityId: 'wp-page-58090', slug: 'unique-sites-in-akhmim' },  // akhmim
  { articleId: 'wp-page-60695', cityId: 'wp-page-58885', slug: 'the-town-of-marsa-alam' },  // marsa-alam
  { articleId: 'wp-page-69927', cityId: 'wp-page-58854', slug: 'the-giza-sound-and-light-show', unhide: true }, // giza
  { articleId: 'guideArticle.safaga.places-in-safaga', cityId: 'wp-page-58920', slug: 'places-in-safaga' }, // safaga (published city had null placesToGo)
];

// Cross-city stray placesToGo refs to remove: cityId → ref to drop.
const STRAY_REFS: Array<{ cityId: string; dropRef: string; note: string }> = [
  { cityId: 'wp-page-58938', dropRef: 'wp-page-76463', note: 'suez → port-said suez-canal-house' },
];

interface Args { commit: boolean; dryRun: boolean }
function parseArgs(argv: string[]): Args {
  let commit = false, dryRun = false;
  for (const a of argv.slice(2)) {
    if (a === '--commit') commit = true; else if (a === '--dry-run') dryRun = true;
    else { process.stderr.write(`Unknown arg: ${a}\n`); process.exit(2); }
  }
  if (commit === dryRun) { process.stderr.write('Pass exactly one of --dry-run or --commit.\n'); process.exit(2); }
  return { commit, dryRun };
}
function getClient(): SanityClient {
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') { process.stderr.write(`Refusing against ${dataset}\n`); process.exit(2); }
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) { process.stderr.write('SANITY_STAGING_API_WRITE_TOKEN required\n'); process.exit(2); }
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false, token, perspective: 'raw',
  });
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Orphans + stray-ref fix ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();
  let tx = client.transaction();
  let ops = 0;

  // Orphans: append ref to city.placesToGo (idempotent), unhide article if needed.
  for (const o of ORPHANS) {
    const city = await client.fetch<{ placesToGo?: Array<{ _ref: string }> } | null>(`*[_id==$id][0]{ placesToGo }`, { id: o.cityId });
    if (!city) { console.log(`  ✗ city ${o.cityId} not found (orphan ${o.slug}) — skip`); continue; }
    const refs = city.placesToGo ?? [];
    const present = refs.some((r) => r._ref === o.articleId);
    if (present) {
      console.log(`  - ${o.slug}: already in placesToGo — skip`);
    } else {
      console.log(`  ✓ ${o.slug}: add → city ${o.cityId} placesToGo (${refs.length} → ${refs.length + 1})`);
      if (args.commit) {
        const newRef = { _type: 'reference', _ref: o.articleId, _key: `auto-${o.slug}` };
        tx = tx.patch(o.cityId, (p) => p.setIfMissing({ placesToGo: [] }).append('placesToGo', [newRef]));
        ops++;
      }
    }
    if (o.unhide) {
      const art = await client.fetch<{ hidden?: boolean } | null>(`*[_id==$id][0]{ hidden }`, { id: o.articleId });
      if (art?.hidden) {
        console.log(`  ✓ ${o.slug}: unhide article ${o.articleId}`);
        if (args.commit) { tx = tx.patch(o.articleId, (p) => p.set({ hidden: false })); ops++; }
      }
    }
  }

  // Stray refs: remove from placesToGo.
  for (const s of STRAY_REFS) {
    const city = await client.fetch<{ placesToGo?: Array<{ _ref: string }> } | null>(`*[_id==$id][0]{ placesToGo }`, { id: s.cityId });
    const refs = city?.placesToGo ?? [];
    if (!refs.some((r) => r._ref === s.dropRef)) {
      console.log(`  - stray ${s.note}: already removed — skip`);
      continue;
    }
    const next = refs.filter((r) => r._ref !== s.dropRef);
    console.log(`  ✓ remove stray ${s.note}: placesToGo ${refs.length} → ${next.length}`);
    if (args.commit) { tx = tx.patch(s.cityId, (p) => p.set({ placesToGo: next })); ops++; }
  }

  if (args.commit && ops > 0) {
    await tx.commit({ visibility: 'sync' });
    console.log(`\n✓ Committed ${ops} ops.`);
  } else if (!args.commit) {
    console.log(`\nDry-run — no writes.`);
  } else {
    console.log(`\nNothing to do.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
