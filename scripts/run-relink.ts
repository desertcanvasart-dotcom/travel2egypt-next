/**
 * Standalone runner for the internal-link relink phase. Scans every doc
 * in migration-staging, swaps externalLink+_pendingInternalRef marks for
 * internalLink references where the WP URL resolves to a known doc, and
 * strips the pending marker on orphans (keeping the externalLink so the
 * redirect map covers them).
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { runRelinkPhase } from './wp-import/relink.js';

loadEnv();

function die(m: string): never { process.stderr.write(`error: ${m}\n`); process.exit(2); }

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const commit = process.argv.includes('--commit');
  if (commit === dryRun) die('Pass exactly one of --dry-run or --commit.');

  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') die(`Refusing against ${dataset}`);
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) die('SANITY_STAGING_API_WRITE_TOKEN required');

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false, token, perspective: 'raw',
  });

  console.log(`\n=== Internal-link relink ===\nmode: ${commit ? 'COMMIT' : 'dry-run'}\n`);
  const summary = await runRelinkPhase(client, { dryRun });
  console.log(`\nScanned:  ${summary.scanned}`);
  console.log(`Resolved: ${summary.resolved}  (will become internalLink)`);
  console.log(`Orphaned: ${summary.orphaned}  (kept as externalLink, pending marker stripped)`);
  console.log(`Patched:  ${summary.patched} doc-field writes`);
  if (summary.orphaned > 0) console.log(`Orphan list → migration/relink-orphans.csv`);
}

main().catch((e) => { console.error(e); process.exit(1); });
