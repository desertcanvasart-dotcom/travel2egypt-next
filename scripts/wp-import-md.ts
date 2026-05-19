/**
 * Bulk MD-content importer (Phase 3c — s56).
 *
 * Reads content/destinations/<city>/<slug>.<locale>.md, converts MD bodies to
 * Sanity Portable Text, uploads inline images, and writes one `guideArticle`
 * per (city, slug) — i18n arrays cover all three locales when authored.
 *
 * Usage:
 *   npm run import:content -- [--dir <path>] [--city <slug>] [--slug <slug>]
 *                              [--locale en|es|ja] [--dry-run] [--limit N]
 *
 * Defaults: --dir content/destinations
 * Dry-run: parses, validates, converts, simulates uploads (no Sanity writes).
 */

import { existsSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadEnv } from './wp-import/env.js';
import { makeSanityClient } from './wp-import/sanity.js';
import { walk } from './wp-import-md/walker.js';
import { crossLocaleValidate } from './wp-import-md/validate.js';
import { writeTriplet } from './wp-import-md/writer.js';
import { printRunSummary } from './wp-import-md/log.js';
import type { ImportResult, Locale, ValidationError } from './wp-import-md/types.js';
import { LOCALES } from './wp-import-md/types.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

interface CliArgs {
  dir: string;
  city?: string;
  slug?: string;
  locale?: Locale;
  dryRun: boolean;
  limit?: number;
}

const USAGE = `import:content — bulk MD → guideArticle importer

Usage: tsx scripts/wp-import-md.ts [options]

Options:
  --dir <path>      Source directory (default content/destinations)
  --city <slug>     Limit to one city
  --slug <slug>     Limit to one page slug
  --locale <code>   Limit to one locale (en|es|ja)
  --dry-run         Parse + validate + convert + simulate uploads, no Sanity writes
  --limit <N>       Stop after processing N triplets
  -h, --help        Show this help
`;

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { dir: 'content/destinations', dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') args.dir = argv[++i];
    else if (a === '--city') args.city = argv[++i];
    else if (a === '--slug') args.slug = argv[++i];
    else if (a === '--locale') {
      const v = argv[++i];
      if (!(LOCALES as readonly string[]).includes(v)) {
        process.stderr.write(`invalid --locale "${v}". Allowed: ${LOCALES.join(', ')}\n`);
        process.exit(2);
      }
      args.locale = v as Locale;
    } else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--limit') args.limit = Number(argv[++i]);
    else if (a === '--help' || a === '-h') {
      process.stdout.write(USAGE);
      process.exit(0);
    } else {
      process.stderr.write(`unknown argument: ${a}\n${USAGE}`);
      process.exit(2);
    }
  }
  return args;
}

export async function main(argv: string[]): Promise<number> {
  const args = parseArgs(argv);
  const rootDir = isAbsolute(args.dir) ? args.dir : resolve(ROOT, args.dir);
  if (!existsSync(rootDir)) {
    process.stderr.write(`[import-content] source directory not found: ${rootDir}\n`);
    return 2;
  }

  process.stdout.write(
    `[import-content] root=${rootDir}` +
      (args.city ? ` city=${args.city}` : '') +
      (args.slug ? ` slug=${args.slug}` : '') +
      (args.locale ? ` locale=${args.locale}` : '') +
      (args.dryRun ? ' DRY-RUN' : '') +
      '\n'
  );

  const walked = walk(rootDir, { city: args.city, slug: args.slug, locale: args.locale });
  const validationErrors: ValidationError[] = [...walked.errors];

  // Build Sanity client up-front (env-guarded). For dry-run we still build it
  // because writer.writeTriplet uses client.fetch for parentCity lookup —
  // but no client.assets.upload or transaction is sent.
  const client = makeSanityClient(loadEnv());

  let triplets = walked.triplets;
  if (args.limit !== undefined) triplets = triplets.slice(0, args.limit);

  const results: ImportResult[] = [];

  for (const triplet of triplets) {
    const cross = crossLocaleValidate(triplet);
    validationErrors.push(...cross.errors);
    if (cross.skipNoEn) {
      results.push({
        filePath: Object.values(triplet.files)[0]!.filePath,
        city: triplet.city,
        slug: triplet.slug,
        locales: [],
        status: 'skipped',
        reason: 'orphan locale(s) without EN sibling',
        warnings: [],
      });
      continue;
    }
    const warnings: string[] = [];
    if (cross.missingLocales.length > 0) {
      warnings.push(`locale-incomplete: missing [${cross.missingLocales.join(',')}]`);
    }

    try {
      const wr = await writeTriplet(triplet, { client, dryRun: args.dryRun });
      results.push({
        filePath: triplet.files.en!.filePath,
        city: triplet.city,
        slug: triplet.slug,
        locales: wr.locales,
        status: wr.noop ? 'noop' : wr.created ? 'created' : 'updated',
        warnings,
      });
    } catch (e) {
      results.push({
        filePath: triplet.files.en!.filePath,
        city: triplet.city,
        slug: triplet.slug,
        locales: [],
        status: 'failed',
        reason: (e as Error).message,
        warnings,
      });
    }
  }

  printRunSummary({
    results,
    validationErrors,
    filesScanned: walked.filesScanned,
    dryRun: args.dryRun,
  });

  const anyFailed = results.some((r) => r.status === 'failed');
  return anyFailed || validationErrors.length > 0 ? 1 : 0;
}

const isMain = (() => {
  try {
    return fileURLToPath(import.meta.url) === process.argv[1];
  } catch {
    return false;
  }
})();

if (isMain) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err) => {
      process.stderr.write(`[import-content] FATAL: ${err instanceof Error ? err.message : String(err)}\n`);
      process.exit(1);
    });
}
