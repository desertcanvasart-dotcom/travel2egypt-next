/**
 * Patch every city in migration-staging with `coordinates: { lat, lng }`.
 *
 * Source of truth is the table inline below — 41 destinations with
 * approximate central coordinates. Slug is the join key. Aliases handled:
 *   - "Al Wadi Al Gadid / Kharga"  -> al-wadi-al-gadid (+ kharga-oasis share coords)
 *   - "El Dakhla Oasis / Mut"      -> dakhla-oasis
 *   - "Bahariya / Bawiti"          -> bahariya-oasis
 *   - "Baris Oasis"                -> baris
 *   - "Wadi Al-Natrun"             -> wadi-el-natrun
 *   - "Rosetta / Rasheed"          -> rosetta-rasheed
 *
 * Usage:
 *   npx tsx scripts/set-city-coordinates.ts --dry-run
 *   npx tsx scripts/set-city-coordinates.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

interface Args { commit: boolean; dryRun: boolean }

function parseArgs(argv: string[]): Args {
  let commit = false;
  let dryRun = false;
  for (const arg of argv.slice(2)) {
    if (arg === '--commit') commit = true;
    else if (arg === '--dry-run') dryRun = true;
    else die(`Unknown argument: ${arg}`);
  }
  if (commit === dryRun) die('Pass exactly one of --dry-run or --commit.');
  return { commit, dryRun };
}

function die(msg: string): never {
  process.stderr.write(`error: ${msg}\n`);
  process.exit(2);
}

function getClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) die('NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET must be set in .env');
  if (dataset !== 'migration-staging') die(`Refusing to run against dataset "${dataset}". migration-staging only.`);
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) die('SANITY_STAGING_API_WRITE_TOKEN must be set in .env');
  return createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false,
    token,
    perspective: 'raw',
  });
}

const COORDS: Record<string, { lat: number; lng: number }> = {
  'abu-simbel':       { lat: 22.3372, lng: 31.6258 },
  'akhmim':           { lat: 26.5622, lng: 31.7450 },
  'al-arish':         { lat: 31.1316, lng: 33.7984 },
  'al-fayoum':        { lat: 29.3084, lng: 30.8428 },
  'al-gouna':         { lat: 27.3942, lng: 33.6783 },
  'al-minya':         { lat: 28.1099, lng: 30.7503 },
  'al-quseir':        { lat: 26.1043, lng: 34.2779 },
  'al-wadi-al-gadid': { lat: 25.4390, lng: 30.5586 },
  'alexandria':       { lat: 31.2001, lng: 29.9187 },
  'aswan':            { lat: 24.0889, lng: 32.8998 },
  'asyut':            { lat: 27.1809, lng: 31.1837 },
  'bahariya-oasis':   { lat: 28.3492, lng: 28.8659 },
  'baris':            { lat: 24.6690, lng: 30.6030 },
  'beni-suef':        { lat: 29.0661, lng: 31.0994 },
  'cairo':            { lat: 30.0444, lng: 31.2357 },
  'dahab':            { lat: 28.5090, lng: 34.5136 },
  'dakhla-oasis':     { lat: 25.4934, lng: 28.9792 },
  'edfu':             { lat: 24.9792, lng: 32.8772 },
  'esna':             { lat: 25.2934, lng: 32.5540 },
  'farafra-oasis':    { lat: 27.0560, lng: 27.9707 },
  'giza':             { lat: 30.0131, lng: 31.2089 },
  'hurghada':         { lat: 27.2579, lng: 33.8116 },
  'ismailia':         { lat: 30.5965, lng: 32.2715 },
  'kharga-oasis':     { lat: 25.4390, lng: 30.5586 },
  'kom-ombo':         { lat: 24.4520, lng: 32.9282 },
  'luxor':            { lat: 25.6872, lng: 32.6396 },
  'marsa-alam':       { lat: 25.0676, lng: 34.8789 },
  'marsa-matruh':     { lat: 31.3543, lng: 27.2373 },
  'nuweiba':          { lat: 29.0468, lng: 34.6634 },
  'port-said':        { lat: 31.2653, lng: 32.3019 },
  'qena':             { lat: 26.1551, lng: 32.7160 },
  'ras-sudr':         { lat: 29.6002, lng: 32.7100 },
  'rosetta-rasheed':  { lat: 31.4044, lng: 30.4165 },
  'safaga':           { lat: 26.7491, lng: 33.9365 },
  'saint-catherine':  { lat: 28.5619, lng: 33.9493 },
  'sharm-el-sheikh':  { lat: 27.9158, lng: 34.3299 },
  'siwa-oasis':       { lat: 29.2041, lng: 25.5195 },
  'sohag':            { lat: 26.5591, lng: 31.6957 },
  'suez':             { lat: 29.9668, lng: 32.5498 },
  'taba':             { lat: 29.4917, lng: 34.8969 },
  'wadi-el-natrun':   { lat: 30.4000, lng: 30.3500 },
};

interface CityRow {
  _id: string;
  slug: string | null;
  existing: { lat: number | null; lng: number | null } | null;
}

const QUERY = `*[_type=="city" && !(_id in path("drafts.**"))]{
  _id,
  "slug": slug[_key=="en"][0].value.current,
  "existing": coordinates
} | order(slug asc)`;

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Set city coordinates ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);

  const client = getClient();
  const rows = await client.fetch<CityRow[]>(QUERY);

  const datasetSlugs = new Set(rows.map((r) => r.slug).filter((s): s is string => !!s));
  const tableSlugs = new Set(Object.keys(COORDS));

  const missingInDataset = [...tableSlugs].filter((s) => !datasetSlugs.has(s));
  const missingInTable = [...datasetSlugs].filter((s) => !tableSlugs.has(s));
  if (missingInDataset.length) console.log(`! in table but not in dataset: ${missingInDataset.join(', ')}`);
  if (missingInTable.length)    console.log(`! in dataset but not in table: ${missingInTable.join(', ')}`);
  if (missingInDataset.length || missingInTable.length) console.log('');

  const ops = rows
    .filter((r) => r.slug && COORDS[r.slug])
    .map((r) => {
      const target = COORDS[r.slug!];
      const cur = r.existing;
      const unchanged = cur && cur.lat === target.lat && cur.lng === target.lng;
      return { row: r, target, unchanged };
    });

  const toWrite = ops.filter((o) => !o.unchanged);
  const noop = ops.filter((o) => o.unchanged);

  console.log(`cities matched: ${ops.length}`);
  console.log(`will write:     ${toWrite.length}`);
  console.log(`already correct:${noop.length}\n`);

  console.log('Plan:');
  for (const o of toWrite) {
    const prev = o.row.existing ? `(was ${o.row.existing.lat},${o.row.existing.lng})` : '(new)';
    console.log(`  - ${o.row.slug}  ${o.target.lat}, ${o.target.lng}  ${prev}`);
  }
  console.log('');

  if (args.dryRun) {
    console.log('Dry run — no writes. Re-run with --commit to apply.');
    return;
  }

  let ok = 0;
  let failed = 0;
  // One transaction, all patches — atomic and faster.
  let tx = client.transaction();
  for (const o of toWrite) {
    tx = tx.patch(o.row._id, (p) =>
      p.set({ coordinates: { _type: 'coordinates', lat: o.target.lat, lng: o.target.lng } }),
    );
  }
  try {
    await tx.commit({ visibility: 'async' });
    ok = toWrite.length;
    for (const o of toWrite) console.log(`✓ ${o.row.slug}`);
  } catch (err) {
    failed = toWrite.length;
    console.error(`✗ transaction failed: ${(err as Error).message}`);
  }

  console.log(`\nDone. patched=${ok} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
