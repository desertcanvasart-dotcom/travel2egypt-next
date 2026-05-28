/**
 * Two structural cleanups on guideArticle.body and city.overview for both
 * JA and ES locales:
 *
 *   1. Strip `· · ·` (three middle-dot) separator paragraphs. The
 *      translators used them as visual section dividers, but they read
 *      as rendering noise next to proper section headings.
 *
 *   2. Convert `■ <heading>` paragraphs to `style: "h2"` blocks. They
 *      were authored as plain paragraphs with a `■` prefix substituting
 *      for proper heading semantics. Per operator decision (option Z),
 *      keep the `■` prefix in the text so the visual ornament stays.
 *
 * Match conditions (defensive — only touch blocks that fit the pattern):
 *
 *   Separator:  block.style == 'normal'
 *               AND text matches `/^\s*[·・•]\s*[·・•]\s*[·・•]\s*$/`
 *               (handles U+00B7 middle dot, U+30FB katakana middle dot,
 *               U+2022 bullet — all variants we might encounter)
 *
 *   Heading:    block.style == 'normal'
 *               AND text starts with `■ ` (followed by at least one
 *               non-space character so we don't catch bare `■` lines)
 *               AND has only one child span (no inline links/bold to
 *               worry about preserving — heading lines are plain)
 *
 * Scope: published docs only, ES + JA, guideArticle.body + city.overview.
 *
 * Idempotent. --dry-run first.
 *
 * Usage:
 *   npx tsx scripts/fix-ja-es-body-structure.ts --dry-run [--type=guideArticle|city|all]
 *   npx tsx scripts/fix-ja-es-body-structure.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');
const LOCALES = ['en', 'es', 'ja'] as const;
type LocaleStrip = 'es' | 'ja'; // only these get cleaned

interface Args { commit: boolean; dryRun: boolean; type: 'guideArticle' | 'city' | 'all' }
function parseArgs(argv: string[]): Args {
  let commit = false; let dryRun = false; let type: Args['type'] = 'all';
  for (const a of argv.slice(2)) {
    if (a === '--commit') commit = true;
    else if (a === '--dry-run') dryRun = true;
    else if (a === '--type=guideArticle' || a === '--type=city' || a === '--type=all') {
      type = a.slice('--type='.length) as Args['type'];
    } else die(`Unknown arg: ${a}`);
  }
  if (commit === dryRun) die('Pass exactly one of --dry-run or --commit.');
  return { commit, dryRun, type };
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

// ──────────────────────────────────────────────────────────────────────────
// Block transformations
// ──────────────────────────────────────────────────────────────────────────

const SEPARATOR_RE = /^\s*[·・•]\s*[·・•]\s*[·・•]\s*$/;
const HEADING_RE = /^■\s+\S/;

function blockText(block: any): string {
  if (!block || block._type !== 'block' || !Array.isArray(block.children)) return '';
  return block.children.map((c: any) => (typeof c.text === 'string' ? c.text : '')).join('');
}

interface TransformStats {
  stripped: number;
  promoted: number;
}

function transformBlocks(blocks: any[], stats: TransformStats): any[] {
  if (!Array.isArray(blocks)) return blocks;
  const out: any[] = [];
  for (const block of blocks) {
    if (!block || block._type !== 'block' || block.style !== 'normal') {
      out.push(block);
      continue;
    }
    const text = blockText(block);
    if (SEPARATOR_RE.test(text)) {
      stats.stripped++;
      continue; // drop this block entirely
    }
    if (HEADING_RE.test(text) && Array.isArray(block.children) && block.children.length === 1) {
      stats.promoted++;
      out.push({ ...block, style: 'h2' });
      continue;
    }
    out.push(block);
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────────
// guideArticle.body pass
// ──────────────────────────────────────────────────────────────────────────

async function runGuideArticle(client: SanityClient, args: Args) {
  console.log('\n=== guideArticle.body — strip `· · ·`, promote `■ …` to h2 ===\n');
  const rows = await client.fetch<Array<{ _id: string; body: any[] }>>(`
    *[_type=="guideArticle" && !(_id in path("drafts.**")) && defined(body)]{ _id, body }
  `);
  console.log(`Loaded ${rows.length} guideArticles with a body field`);

  const plans: Array<{ _id: string; newBody: any[]; stats: TransformStats }> = [];
  for (const r of rows) {
    if (!Array.isArray(r.body)) continue;
    const stats: TransformStats = { stripped: 0, promoted: 0 };
    const newBody = r.body.map((entry) => {
      if (entry && (entry._key === 'es' || entry._key === 'ja') && Array.isArray(entry.value)) {
        return { ...entry, value: transformBlocks(entry.value, stats) };
      }
      return entry;
    });
    if (stats.stripped > 0 || stats.promoted > 0) {
      plans.push({ _id: r._id, newBody, stats });
    }
  }

  const totalStripped = plans.reduce((n, p) => n + p.stats.stripped, 0);
  const totalPromoted = plans.reduce((n, p) => n + p.stats.promoted, 0);
  console.log(`Docs touched:  ${plans.length}`);
  console.log(`Separators stripped (sum):  ${totalStripped}`);
  console.log(`H2 promotions (sum):        ${totalPromoted}`);

  if (args.dryRun) {
    console.log('\nSample (first 5):');
    for (const p of plans.slice(0, 5)) console.log(`  ${p._id}  stripped=${p.stats.stripped} promoted=${p.stats.promoted}`);
    return;
  }
  if (plans.length === 0) { console.log('Nothing to do.'); return; }

  const BATCH = 25;
  let written = 0;
  for (let i = 0; i < plans.length; i += BATCH) {
    const batch = plans.slice(i, i + BATCH);
    let tx = client.transaction();
    for (const p of batch) tx = tx.patch(p._id, (pp) => pp.set({ body: p.newBody }));
    try {
      await tx.commit({ visibility: 'sync' });
      written += batch.length;
      console.log(`  ✓ ${written}/${plans.length}`);
      for (const p of batch) appendLog({ phase: 'CLEANUP-body-structure', _id: p._id, stripped: p.stats.stripped, promoted: p.stats.promoted });
    } catch (err) {
      console.error(`  ✗ batch ${i}: ${(err as Error).message}`);
      throw err;
    }
  }
  console.log(`✓ guideArticle done. ${written} docs touched, ${totalStripped} separators stripped, ${totalPromoted} h2 promotions.`);
}

// ──────────────────────────────────────────────────────────────────────────
// city.overview pass — same shape (internationalized array of PT)
// ──────────────────────────────────────────────────────────────────────────

async function runCity(client: SanityClient, args: Args) {
  console.log('\n=== city.overview — strip `· · ·`, promote `■ …` to h2 ===\n');
  const rows = await client.fetch<Array<{ _id: string; overview: any[] }>>(`
    *[_type=="city" && !(_id in path("drafts.**")) && defined(overview)]{ _id, overview }
  `);
  console.log(`Loaded ${rows.length} cities with an overview field`);

  const plans: Array<{ _id: string; newOverview: any[]; stats: TransformStats }> = [];
  for (const r of rows) {
    if (!Array.isArray(r.overview)) continue;
    const stats: TransformStats = { stripped: 0, promoted: 0 };
    const newOverview = r.overview.map((entry) => {
      if (entry && (entry._key === 'es' || entry._key === 'ja') && Array.isArray(entry.value)) {
        return { ...entry, value: transformBlocks(entry.value, stats) };
      }
      return entry;
    });
    if (stats.stripped > 0 || stats.promoted > 0) {
      plans.push({ _id: r._id, newOverview, stats });
    }
  }

  const totalStripped = plans.reduce((n, p) => n + p.stats.stripped, 0);
  const totalPromoted = plans.reduce((n, p) => n + p.stats.promoted, 0);
  console.log(`Cities touched:  ${plans.length}`);
  console.log(`Separators stripped (sum):  ${totalStripped}`);
  console.log(`H2 promotions (sum):        ${totalPromoted}`);

  if (args.dryRun) {
    console.log('\nSample (first 5):');
    for (const p of plans.slice(0, 5)) console.log(`  ${p._id}  stripped=${p.stats.stripped} promoted=${p.stats.promoted}`);
    return;
  }
  if (plans.length === 0) { console.log('Nothing to do.'); return; }

  const BATCH = 10;
  let written = 0;
  for (let i = 0; i < plans.length; i += BATCH) {
    const batch = plans.slice(i, i + BATCH);
    let tx = client.transaction();
    for (const p of batch) tx = tx.patch(p._id, (pp) => pp.set({ overview: p.newOverview }));
    try {
      await tx.commit({ visibility: 'sync' });
      written += batch.length;
      console.log(`  ✓ ${written}/${plans.length}`);
      for (const p of batch) appendLog({ phase: 'CLEANUP-overview-structure', _id: p._id, stripped: p.stats.stripped, promoted: p.stats.promoted });
    } catch (err) {
      console.error(`  ✗ batch ${i}: ${(err as Error).message}`);
      throw err;
    }
  }
  console.log(`✓ city done. ${written} docs touched, ${totalStripped} separators stripped, ${totalPromoted} h2 promotions.`);
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`mode: ${args.commit ? 'COMMIT' : 'dry-run'}  type: ${args.type}`);
  const client = getClient();
  if (args.type === 'guideArticle' || args.type === 'all') await runGuideArticle(client, args);
  if (args.type === 'city' || args.type === 'all') await runCity(client, args);
}

main().catch((err) => { console.error(err); process.exit(1); });
