/**
 * Environment loading + safety guards. Loud failure when anything is wrong.
 *
 * The importer ABORTS on:
 *   - Missing WP_APPLICATION_USERNAME / WP_APPLICATION_PASSWORD
 *   - Missing SANITY_STAGING_API_WRITE_TOKEN
 *   - Missing NEXT_PUBLIC_SANITY_PROJECT_ID
 *   - Configured Sanity dataset is anything other than "migration-staging"
 *
 * The intent is that there is no path through this file that can result in
 * a write to the production dataset, even by accident.
 */

import { config as loadDotenv } from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

loadDotenv({ path: join(ROOT, '.env') });

export interface Env {
  wpUsername: string;
  wpPassword: string;
  sanityProjectId: string;
  sanityDataset: 'migration-staging';
  sanityToken: string;
  wpHost: string;
}

const REQUIRED_DATASET = 'migration-staging';

function fail(msg: string): never {
  process.stderr.write(`\n[wp-import] FATAL: ${msg}\n\n`);
  process.exit(1);
}

export function loadEnv(): Env {
  const wpUsername = process.env.WP_APPLICATION_USERNAME;
  const wpPassword = process.env.WP_APPLICATION_PASSWORD;
  const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const sanityToken = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  // Allow override but default to migration-staging.
  const sanityDataset = process.env.SANITY_STAGING_DATASET ?? REQUIRED_DATASET;

  if (!wpUsername) fail('WP_APPLICATION_USERNAME missing in .env. See migration/MIGRATION_MAPPING.md §1.');
  if (!wpPassword) fail('WP_APPLICATION_PASSWORD missing in .env. See migration/MIGRATION_MAPPING.md §1.');
  if (!sanityProjectId) fail('NEXT_PUBLIC_SANITY_PROJECT_ID missing in .env.');
  if (!sanityToken)
    fail(
      'SANITY_STAGING_API_WRITE_TOKEN missing in .env. Create a separate write token at https://manage.sanity.io for the migration-staging dataset — do NOT reuse SANITY_API_WRITE_TOKEN (the production token).'
    );

  if (sanityDataset !== REQUIRED_DATASET) {
    fail(
      `Refusing to run: SANITY_STAGING_DATASET="${sanityDataset}" but this importer only writes to "${REQUIRED_DATASET}". Production-write attempts are blocked at the env layer per Phase B safety constraints.`
    );
  }

  return {
    wpUsername: wpUsername!,
    wpPassword: wpPassword!,
    sanityProjectId: sanityProjectId!,
    sanityDataset: REQUIRED_DATASET,
    sanityToken: sanityToken!,
    wpHost: process.env.WP_HOST ?? 'https://travel2egypt.org',
  };
}
