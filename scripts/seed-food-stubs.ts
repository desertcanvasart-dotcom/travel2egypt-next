/**
 * Seed the nine planned Food-section articles as UNPUBLISHED EN drafts, to
 * reserve their slugs/routes ahead of the September–November publishing run.
 *
 * Each stub is a `foodArticle` draft (language 'en') carrying only its title,
 * slug, format, and region — enough for the /food hub grouping to be testable
 * immediately, and for editors to see the reserved pieces in Studio. Drafts are
 * excluded from published queries (and generateStaticParams), so nothing goes
 * live until real content is imported and published.
 *
 * Idempotent: createOrReplace on a deterministic draft id, so re-running is
 * safe and never duplicates. Validation is intentionally NOT satisfied (no
 * author/body; route stubs have no tour/lastVerified) — Sanity validation gates
 * publish, not draft creation, so the write API accepts these as-is.
 *
 * No translation.metadata is created: a lone EN doc is a single-locale group
 * that falls back to EN gracefully. The `import:food` step (modelled on
 * scripts/create-eclipse-article.ts) creates the ES/JA sibling docs later and
 * upserts the `tmeta.<slug>` joiner then.
 *
 *   npx tsx scripts/seed-food-stubs.ts --dry-run
 *   npx tsx scripts/seed-food-stubs.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

function die(m: string): never {
  process.stderr.write(`error: ${m}\n`);
  process.exit(2);
}

const commit = process.argv.includes('--commit');
if (!commit && !process.argv.includes('--dry-run')) die('pass --dry-run or --commit');

function getClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'production') die('production only');
  const token =
    process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !token) die('missing projectId/token');
  // perspective 'raw' so we can read our own drafts back for the report.
  return createClient({ projectId, dataset, apiVersion: '2024-12-01', useCdn: false, token, perspective: 'raw' });
}

type Format = 'biography' | 'generations' | 'route' | 'practical';
type Region = 'cairo' | 'alexandria-coast' | 'nile-south' | 'oases-sinai' | 'all-egypt';

interface Stub {
  slug: string;
  title: string;
  format: Format;
  region: Region;
}

/** The nine September–November pieces (titles from the editorial calendar). */
const STUBS: Stub[] = [
  { slug: 'sayadeya-alexandria-port-said-suez', title: 'One Country, Three Plates of Sayadeya', format: 'biography', region: 'alexandria-coast' },
  { slug: 'cairo-one-day-food-journey', title: 'A One-Day Food Journey Through Cairo', format: 'route', region: 'cairo' },
  { slug: 'is-street-food-safe-in-egypt', title: 'Is Street Food in Egypt Safe? An Honest Answer', format: 'practical', region: 'all-egypt' },
  { slug: 'alexandria-one-day-food-journey', title: 'A One-Day Food Journey Through Alexandria', format: 'route', region: 'alexandria-coast' },
  { slug: 'siwa-salt', title: 'The Salt of Siwa', format: 'biography', region: 'oases-sinai' },
  { slug: 'koshari-biography', title: 'Koshari: A Biography', format: 'biography', region: 'cairo' },
  { slug: 'three-generations-molokhia', title: 'Three Generations, One Pot of Molokhia', format: 'generations', region: 'cairo' },
  { slug: 'luxor-aswan-nubian-food', title: 'Eating the Nile: Food Between Luxor and Aswan', format: 'route', region: 'nile-south' },
  { slug: 'vegetarian-food-egypt', title: 'What Vegetarians Actually Eat in Egypt', format: 'practical', region: 'all-egypt' },
];

const REGION_ORDER: Region[] = ['cairo', 'alexandria-coast', 'nile-south', 'oases-sinai', 'all-egypt'];
const REGION_LABEL: Record<Region, string> = {
  cairo: 'Cairo',
  'alexandria-coast': 'Alexandria, the Coast & the Canal',
  'nile-south': 'The Nile South',
  'oases-sinai': 'The Oases & Sinai',
  'all-egypt': 'Egypt-wide (practical)',
};

const now = new Date().toISOString();

function draftId(slug: string): string {
  // Published id would be foodArticle.<slug>.en; the draft reserves it.
  return `drafts.foodArticle.${slug}.en`;
}

const docs = STUBS.map((s) => ({
  _id: draftId(s.slug),
  _type: 'foodArticle',
  language: 'en',
  title: s.title,
  slug: { _type: 'slug', current: s.slug },
  format: s.format,
  region: s.region,
  migration: {
    source: 'seed-food-stubs',
    reviewFlag: 'stub-awaiting-content',
    migratedAt: now,
  },
}));

/** Print the region-grouped index the /food hub will render. */
function report(rows: Array<{ slug: string; title: string; format: string; region: string }>) {
  console.log('\nRegion-grouping (what the /food hub index renders):');
  for (const region of REGION_ORDER) {
    const inRegion = rows.filter((r) => r.region === region);
    if (!inRegion.length) continue;
    console.log(`\n  ${REGION_LABEL[region as Region]}  (${inRegion.length})`);
    for (const r of inRegion.sort((a, b) => a.slug.localeCompare(b.slug))) {
      console.log(`    · [${r.format.padEnd(11)}] ${r.title}  —  /food/${r.slug}`);
    }
  }
  const ungrouped = rows.filter((r) => !REGION_ORDER.includes(r.region as Region));
  if (ungrouped.length) console.log(`\n  ⚠ ungrouped (unknown region): ${ungrouped.map((r) => r.slug).join(', ')}`);
}

async function main() {
  console.log(`\n=== seed food stubs ===  mode: ${commit ? 'COMMIT' : 'dry-run'}  (${docs.length} EN drafts)`);

  // Backup the exact docs we will write.
  const backupDir = resolve(process.cwd(), 'migration');
  mkdirSync(backupDir, { recursive: true });
  const backupPath = resolve(backupDir, 'food-stubs-seed-backup.json');
  writeFileSync(backupPath, JSON.stringify({ createdAt: now, docs }, null, 2), 'utf8');
  console.log(`backup written: ${backupPath}`);

  // In dry-run, report from the in-memory plan (authoritative stamping).
  report(STUBS.map((s) => ({ slug: s.slug, title: s.title, format: s.format, region: s.region })));

  if (!commit) {
    console.log('\nDry-run complete. No writes. Re-run with --commit to create the drafts.');
    return;
  }

  const client = getClient();
  let tx = client.transaction();
  for (const d of docs) tx = tx.createOrReplace(d);
  // 'sync' so the docs are query-visible before the read-back below (avoids the
  // async-visibility race that reports 0 on an otherwise-successful write).
  await tx.commit({ visibility: 'sync' });
  console.log(`\n✓ Committed ${docs.length} drafts.`);

  // Read back from the DB (raw perspective incl. drafts) to prove they landed
  // and re-run the grouping on real data.
  const readback = await client.fetch<Array<{ slug: string; title: string; format: string; region: string }>>(
    `*[_type == "foodArticle"]{ "slug": slug.current, title, format, region }`,
  );
  console.log(`\nRead back ${readback.length} foodArticle doc(s) from production.`);
  report(readback);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
