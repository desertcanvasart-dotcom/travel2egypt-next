/**
 * Strip the duplicated English-title line from the JA body opening on
 * guideArticle and city docs.
 *
 * Background: JA editorial convention puts the English title as the
 * first body line as a cross-reference for JA readers. But Sanity also
 * renders the `summary` field as an italic eyebrow — and that summary
 * was extracted from the same first paragraph during the bulk MD upload,
 * so the English title appears twice (once as italic subtitle, once as
 * the body's first line). Operator decision: keep the italic subtitle,
 * strip the body line.
 *
 * Scope (published docs only, drafts left alone):
 *
 *   - guideArticle: if body.ja[0] text equals title.en (loose compare),
 *     drop body.ja[0].
 *   - city: if overview.ja[0] text equals "<en_name> Travel Guide"
 *     (loose compare), drop overview.ja[0].
 *
 * Loose-compare semantics:
 *   - case-insensitive
 *   - trimmed of leading/trailing whitespace
 *   - trailing punctuation `.,:;!?` ignored
 *   - tolerates a small variation in articles (drop leading "the ")
 *
 * Defensive: only strips when the first-block text fits the pattern.
 * If the first block is already real prose, leave it alone.
 *
 * Idempotent. --dry-run first.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');

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

function normalize(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[.,:;!?]+$/g, '')
    .trim();
}

function blockText(block: any): string {
  if (!block || block._type !== 'block' || !Array.isArray(block.children)) return '';
  return block.children.map((c: any) => (typeof c.text === 'string' ? c.text : '')).join('');
}

// ──────────────────────────────────────────────────────────────────────────
// guideArticle pass
// ──────────────────────────────────────────────────────────────────────────

interface GARow {
  _id: string;
  enTitle: string;
  bodyJa: any[]; // portable text array
}

async function runGuideArticle(client: SanityClient, args: Args) {
  console.log('\n=== guideArticle: strip body.ja[0] when equals title.en ===\n');
  const rows = await client.fetch<GARow[]>(`
    *[_type=="guideArticle" && !(_id in path("drafts.**"))]{
      _id,
      "enTitle": title[_key=="en"][0].value,
      "bodyJa": body[_key=="ja"][0].value
    }[defined(enTitle) && defined(bodyJa)]
  `);
  console.log(`Loaded ${rows.length} published guideArticles with EN title + JA body`);

  const toFix: Array<{ row: GARow; firstText: string; newBody: any[] }> = [];
  for (const r of rows) {
    if (!Array.isArray(r.bodyJa) || r.bodyJa.length === 0) continue;
    const first = r.bodyJa[0];
    const firstText = blockText(first);
    if (!firstText) continue;
    if (normalize(firstText) === normalize(r.enTitle)) {
      toFix.push({ row: r, firstText, newBody: r.bodyJa.slice(1) });
    }
  }
  console.log(`Will strip first block from: ${toFix.length} docs`);

  if (args.dryRun) {
    console.log('\nSample (first 8):');
    for (const f of toFix.slice(0, 8)) {
      console.log(`  ${f.row._id}`);
      console.log(`    drop: "${f.firstText}"`);
    }
    return;
  }

  if (toFix.length === 0) { console.log('Nothing to do.'); return; }

  const BATCH = 25;
  let written = 0;
  for (let i = 0; i < toFix.length; i += BATCH) {
    const batch = toFix.slice(i, i + BATCH);
    let tx = client.transaction();
    for (const f of batch) {
      // Build a new body array updating only the ja entry
      const newBodyArr = await client.fetch<any[]>(`*[_id==$id][0].body`, { id: f.row._id });
      const patched = (newBodyArr ?? []).map((entry) =>
        entry._key === 'ja' ? { ...entry, value: f.newBody } : entry,
      );
      tx = tx.patch(f.row._id, (p) => p.set({ body: patched }));
    }
    try {
      await tx.commit({ visibility: 'sync' });
      written += batch.length;
      console.log(`  ✓ ${written}/${toFix.length}`);
      for (const f of batch) appendLog({ phase: 'CLEANUP-strip-ja-body-title', _id: f.row._id, dropped: f.firstText });
    } catch (err) {
      console.error(`  ✗ batch ${i}: ${(err as Error).message}`);
      throw err;
    }
  }
  console.log(`✓ guideArticle done. ${written} bodies cleaned.`);
}

// ──────────────────────────────────────────────────────────────────────────
// city pass — strips "<EN Name> Travel Guide" from overview.ja[0]
// ──────────────────────────────────────────────────────────────────────────

interface CityRow {
  _id: string;
  enName: string;
  overviewJa: any[];
}

async function runCity(client: SanityClient, args: Args) {
  console.log('\n=== city: strip overview.ja[0] when equals "<EN Name> Travel Guide" ===\n');
  const rows = await client.fetch<CityRow[]>(`
    *[_type=="city" && !(_id in path("drafts.**"))]{
      _id,
      "enName": name[_key=="en"][0].value,
      "overviewJa": overview[_key=="ja"][0].value
    }[defined(enName) && defined(overviewJa)]
  `);
  console.log(`Loaded ${rows.length} published cities with EN name + JA overview`);

  const toFix: Array<{ row: CityRow; firstText: string; newOverview: any[] }> = [];
  for (const r of rows) {
    if (!Array.isArray(r.overviewJa) || r.overviewJa.length === 0) continue;
    const firstText = blockText(r.overviewJa[0]);
    if (!firstText) continue;
    const expected = `${r.enName} Travel Guide`;
    if (normalize(firstText) === normalize(expected)) {
      toFix.push({ row: r, firstText, newOverview: r.overviewJa.slice(1) });
    }
  }
  console.log(`Will strip first block from: ${toFix.length} cities`);

  if (args.dryRun) {
    console.log('\nSample (first 8):');
    for (const f of toFix.slice(0, 8)) {
      console.log(`  ${f.row._id} (${f.row.enName})`);
      console.log(`    drop: "${f.firstText}"`);
    }
    return;
  }

  if (toFix.length === 0) { console.log('Nothing to do.'); return; }

  const BATCH = 10;
  let written = 0;
  for (let i = 0; i < toFix.length; i += BATCH) {
    const batch = toFix.slice(i, i + BATCH);
    let tx = client.transaction();
    for (const f of batch) {
      const overviewArr = await client.fetch<any[]>(`*[_id==$id][0].overview`, { id: f.row._id });
      const patched = (overviewArr ?? []).map((entry) =>
        entry._key === 'ja' ? { ...entry, value: f.newOverview } : entry,
      );
      tx = tx.patch(f.row._id, (p) => p.set({ overview: patched }));
    }
    try {
      await tx.commit({ visibility: 'sync' });
      written += batch.length;
      console.log(`  ✓ ${written}/${toFix.length}`);
      for (const f of batch) appendLog({ phase: 'CLEANUP-strip-ja-overview-title', _id: f.row._id, dropped: f.firstText });
    } catch (err) {
      console.error(`  ✗ batch ${i}: ${(err as Error).message}`);
      throw err;
    }
  }
  console.log(`✓ city done. ${written} overviews cleaned.`);
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`mode: ${args.commit ? 'COMMIT' : 'dry-run'}  type: ${args.type}`);
  const client = getClient();
  if (args.type === 'guideArticle' || args.type === 'all') await runGuideArticle(client, args);
  if (args.type === 'city' || args.type === 'all') await runCity(client, args);
}

main().catch((err) => { console.error(err); process.exit(1); });
