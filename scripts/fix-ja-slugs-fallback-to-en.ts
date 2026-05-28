/**
 * URL-fix pass: for every guideArticle whose JA slug contains non-ASCII
 * characters (kana/kanji), replace it with the EN slug. Unbreaks the
 * `/ja/guide/<city>/<slug>` URLs that 404 today.
 *
 * This is a TEMPORARY fix. The proper solution is the romaji migration in
 * `scripts/migrate-ja-romaji-slugs.ts`, which produces Hepburn-romanized
 * slugs per the documented design. That script needs collision resolution
 * across draft + published docs before it can run cleanly — see the dry-run
 * output. Until then, falling back to the EN slug is preferable to leaving
 * URLs broken: ASCII, deterministic, no collisions, valid 200 responses.
 *
 * Scope: published guideArticle docs only. Drafts left alone.
 *
 * Idempotent. --dry-run first.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');

interface Args { commit: boolean; dryRun: boolean }
function parseArgs(argv: string[]): Args {
  let commit = false; let dryRun = false;
  for (const a of argv.slice(2)) {
    if (a === '--commit') commit = true;
    else if (a === '--dry-run') dryRun = true;
    else die(`Unknown arg: ${a}`);
  }
  if (commit === dryRun) die('Pass exactly one of --dry-run or --commit.');
  return { commit, dryRun };
}
function die(msg: string): never { process.stderr.write(`error: ${msg}\n`); process.exit(2); }

function getClient(): SanityClient {
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') die(`Refusing against ${dataset}`);
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) die('SANITY_STAGING_API_WRITE_TOKEN required');
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false, token, perspective: 'raw',
  });
}

function appendLog(entry: Record<string, unknown>): void {
  mkdirSync(resolve(process.cwd(), 'migration'), { recursive: true });
  appendFileSync(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n', 'utf8');
}

interface Row {
  _id: string;
  slugEn: string;
  slugJa: string;
  slugArr: Array<{ _key: string; value: { _type: string; current: string } }>;
}

const ASCII_SLUG = /^[a-z0-9-]+$/;

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== JA slug fallback fix ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);

  const client = getClient();

  // Pull all published guideArticles with both EN and JA slugs.
  const rows = await client.fetch<Row[]>(`
    *[_type=="guideArticle" && !(_id in path("drafts.**"))]{
      _id,
      "slugEn": slug[_key=="en"][0].value.current,
      "slugJa": slug[_key=="ja"][0].value.current,
      "slugArr": slug
    }[defined(slugEn) && defined(slugJa)]
  `);
  console.log(`Loaded ${rows.length} published guideArticles with EN+JA slugs`);

  // Find rows whose JA slug is non-ASCII (Japanese chars, etc.)
  const bad = rows.filter((r) => !ASCII_SLUG.test(r.slugJa));
  console.log(`Non-ASCII JA slugs to patch: ${bad.length}`);

  if (bad.length === 0) {
    console.log('Nothing to fix.');
    return;
  }

  console.log('\nSample (first 10):');
  for (const r of bad.slice(0, 10)) {
    console.log(`  ${r._id}`);
    console.log(`    ja: "${r.slugJa}"`);
    console.log(`    →   "${r.slugEn}"`);
  }

  if (args.dryRun) {
    console.log(`\nDry-run — no writes. ${bad.length} docs would be patched.`);
    return;
  }

  // Build a fresh slug array per doc: keep EN/ES as-is, overwrite JA with EN.
  const BATCH = 25;
  let written = 0;
  for (let i = 0; i < bad.length; i += BATCH) {
    const batch = bad.slice(i, i + BATCH);
    let tx = client.transaction();
    for (const r of batch) {
      const newSlug = r.slugArr.map((entry) =>
        entry._key === 'ja'
          ? { _key: 'ja', value: { _type: 'slug', current: r.slugEn } }
          : entry,
      );
      tx = tx.patch(r._id, (p) => p.set({ slug: newSlug }));
    }
    try {
      await tx.commit({ visibility: 'sync' });
      written += batch.length;
      console.log(`  ✓ patched ${written}/${bad.length}`);
      for (const r of batch) appendLog({ phase: 'CLEANUP-ja-slug-fallback', _id: r._id, from: r.slugJa, to: r.slugEn });
    } catch (err) {
      console.error(`  ✗ batch starting at ${i} failed: ${(err as Error).message}`);
      throw err;
    }
  }
  console.log(`\n✓ Patched ${written} JA slugs to ASCII (EN-slug fallback).`);
}

main().catch((err) => { console.error(err); process.exit(1); });
