/**
 * Body-structure cleanup, second pass — extends s47 fix-ja-es-body-structure.ts
 * to cover the newly-imported doc types (travelTip, hotel, nileCruise, article)
 * and adds a third transformation for list-item bullet prefixes.
 *
 * Three transformations on ES + JA bodies:
 *
 *   1. Strip `· · ·` (three middle-dot) separator paragraphs.
 *   2. Convert `■ <heading>` paragraphs to `style: "h2"` blocks.
 *   3. Strip leading `・` (Japanese fullwidth bullet) from <li> child text.
 *      Only the MD source for travel-tips emits this artifact (the EN MD
 *      uses `- ・<text>` markdown), but the rule is safe everywhere.
 *
 * Scope:
 *   travelTip.body      (field-level i18n: body[_key=='es|ja'][0].value)
 *   hotel.body          (field-level i18n)
 *   nileCruise.body     (field-level i18n)
 *   article.body        (DOC-level i18n: body is a flat PT array; doc has language)
 *
 * EN bodies left alone — the EN MD already has clean markdown structure.
 *
 * Idempotent. --dry-run first.
 *
 * Usage:
 *   npx tsx scripts/fix-ja-es-body-structure-v2.ts --dry-run
 *   npx tsx scripts/fix-ja-es-body-structure-v2.ts --commit
 *   (optional: --type=travelTip|hotel|nileCruise|article|all)
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');

type DocType = 'travelTip' | 'hotel' | 'nileCruise' | 'article';

interface Args { commit: boolean; dryRun: boolean; types: DocType[] }
function parseArgs(argv: string[]): Args {
  let commit = false; let dryRun = false; let types: DocType[] = ['travelTip', 'hotel', 'nileCruise', 'article'];
  for (const a of argv.slice(2)) {
    if (a === '--commit') commit = true;
    else if (a === '--dry-run') dryRun = true;
    else if (a.startsWith('--type=')) {
      const t = a.slice('--type='.length);
      if (t === 'all') types = ['travelTip', 'hotel', 'nileCruise', 'article'];
      else if (['travelTip', 'hotel', 'nileCruise', 'article'].includes(t)) types = [t as DocType];
      else die(`Unknown --type=${t}`);
    } else die(`Unknown arg: ${a}`);
  }
  if (commit === dryRun) die('Pass exactly one of --dry-run or --commit.');
  return { commit, dryRun, types };
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
const LIST_BULLET_PREFIX_RE = /^[・·•]\s*/;

interface TransformStats { stripped: number; promoted: number; liPrefixed: number }

function transformBlocks(blocks: any[], stats: TransformStats): any[] {
  if (!Array.isArray(blocks)) return blocks;
  const out: any[] = [];
  for (const block of blocks) {
    if (!block || block._type !== 'block') { out.push(block); continue; }

    const text = Array.isArray(block.children)
      ? block.children.map((c: any) => typeof c.text === 'string' ? c.text : '').join('')
      : '';

    // 1. Strip `· · ·` separator paragraphs
    if (block.style === 'normal' && SEPARATOR_RE.test(text)) {
      stats.stripped++;
      continue;
    }

    // 2. Promote `■ <heading>` paragraphs to h2
    if (block.style === 'normal' && HEADING_RE.test(text)
        && Array.isArray(block.children) && block.children.length === 1) {
      stats.promoted++;
      out.push({ ...block, style: 'h2' });
      continue;
    }

    // 3. Strip leading `・` from list-item children
    if (block.listItem && Array.isArray(block.children) && block.children.length > 0) {
      const first = block.children[0];
      if (first && typeof first.text === 'string' && LIST_BULLET_PREFIX_RE.test(first.text)) {
        const stripped = first.text.replace(LIST_BULLET_PREFIX_RE, '');
        if (stripped !== first.text) {
          stats.liPrefixed++;
          const newChildren = [{ ...first, text: stripped }, ...block.children.slice(1)];
          out.push({ ...block, children: newChildren });
          continue;
        }
      }
    }

    out.push(block);
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────────
// Per-doc-type runners
// ──────────────────────────────────────────────────────────────────────────

interface Plan { _id: string; field: string; newValue: any; stats: TransformStats }

async function runFieldLevelI18n(client: SanityClient, docType: DocType, args: Args): Promise<void> {
  console.log(`\n=== ${docType}.body — strip separators, promote h2, fix li prefixes ===`);
  const rows = await client.fetch<Array<{ _id: string; body: any[] }>>(
    `*[_type==$t && !(_id in path("drafts.**")) && defined(body)]{ _id, body }`,
    { t: docType },
  );
  console.log(`  Loaded ${rows.length} ${docType} docs with body`);

  const plans: Plan[] = [];
  for (const r of rows) {
    if (!Array.isArray(r.body)) continue;
    const stats: TransformStats = { stripped: 0, promoted: 0, liPrefixed: 0 };
    const newBody = r.body.map((entry) => {
      if (entry && (entry._key === 'es' || entry._key === 'ja') && Array.isArray(entry.value)) {
        return { ...entry, value: transformBlocks(entry.value, stats) };
      }
      return entry;
    });
    if (stats.stripped + stats.promoted + stats.liPrefixed > 0) {
      plans.push({ _id: r._id, field: 'body', newValue: newBody, stats });
    }
  }
  await reportAndApply(client, docType, plans, args);
}

async function runDocLevelI18nArticle(client: SanityClient, args: Args): Promise<void> {
  console.log(`\n=== article.body — strip separators, promote h2, fix li prefixes ===`);
  const rows = await client.fetch<Array<{ _id: string; language: string; body: any[] }>>(
    `*[_type=='article' && !(_id in path("drafts.**")) && language in ['es','ja'] && defined(body)]{ _id, language, body }`,
  );
  console.log(`  Loaded ${rows.length} ES/JA article docs with body`);

  const plans: Plan[] = [];
  for (const r of rows) {
    if (!Array.isArray(r.body)) continue;
    const stats: TransformStats = { stripped: 0, promoted: 0, liPrefixed: 0 };
    const newBody = transformBlocks(r.body, stats);
    if (stats.stripped + stats.promoted + stats.liPrefixed > 0) {
      plans.push({ _id: r._id, field: 'body', newValue: newBody, stats });
    }
  }
  await reportAndApply(client, 'article', plans, args);
}

async function reportAndApply(client: SanityClient, docType: DocType, plans: Plan[], args: Args): Promise<void> {
  const totals = plans.reduce(
    (a, p) => ({ stripped: a.stripped + p.stats.stripped, promoted: a.promoted + p.stats.promoted, liPrefixed: a.liPrefixed + p.stats.liPrefixed }),
    { stripped: 0, promoted: 0, liPrefixed: 0 },
  );
  console.log(`  Docs to patch: ${plans.length}`);
  console.log(`    separators stripped:  ${totals.stripped}`);
  console.log(`    h2 promotions:        ${totals.promoted}`);
  console.log(`    li-prefixes stripped: ${totals.liPrefixed}`);

  if (args.dryRun) {
    if (plans.length) console.log(`  Sample plans (first 3):`);
    for (const p of plans.slice(0, 3)) console.log(`    ${p._id}  stripped=${p.stats.stripped} h2=${p.stats.promoted} li=${p.stats.liPrefixed}`);
    return;
  }
  if (plans.length === 0) { console.log('  Nothing to do.'); return; }

  const BATCH = 25;
  let written = 0;
  for (let i = 0; i < plans.length; i += BATCH) {
    const batch = plans.slice(i, i + BATCH);
    let tx = client.transaction();
    for (const p of batch) tx = tx.patch(p._id, (pp) => pp.set({ [p.field]: p.newValue }));
    await tx.commit({ visibility: 'async' });
    written += batch.length;
    for (const p of batch) {
      appendLog({
        phase: 'CLEANUP-body-structure-v2', docType, _id: p._id,
        stripped: p.stats.stripped, promoted: p.stats.promoted, liPrefixed: p.stats.liPrefixed,
      });
    }
    process.stdout.write(`  ${written}/${plans.length}\r`);
  }
  console.log(`\n  ✓ ${docType} done — ${written} docs patched`);
}

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Body-structure cleanup v2 (ES + JA) ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}  types: ${args.types.join(', ')}`);
  const client = getClient();

  for (const t of args.types) {
    if (t === 'article') await runDocLevelI18nArticle(client, args);
    else await runFieldLevelI18n(client, t, args);
  }

  console.log('\n=== Done ===');
}

main().catch((err) => { console.error(err); process.exit(1); });
