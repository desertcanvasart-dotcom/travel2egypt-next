/**
 * Enhanced internal-link relink pass.
 *
 * The base relinker (`scripts/wp-import/relink.ts`) only matched documents
 * by their literal `migration.wpUrl`. That misses three big classes of
 * legacy URLs that show up in body content:
 *
 *   1. Protocol mismatch  — index keyed by `https://…`, content has `http://…`.
 *   2. City-nested EN URLs — content links to
 *      `/<city>-travel-guide/<articleSlug>/` but the index only has the
 *      flat `/<articleSlug>/` variant.
 *   3. Localized ES/JA URLs — `/es/…/` and `/ja/…/` content links with no
 *      equivalent key in the index.
 *
 * This script builds a richer multi-key index per doc (protocol-stripped,
 * city-prefixed, locale-prefixed where slug data exists) and runs the
 * same patch logic as the base relinker. Falls back to the base behaviour
 * for any remaining unresolved cases — orphans are recorded.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');
const ORPHANS_PATH = resolve(process.cwd(), 'migration/relink-orphans.csv');
const STATS_PATH = resolve(process.cwd(), 'migration/relink-stats.json');

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

interface Hit { _id: string; _type: string }

/** Canonicalize: lower-case, strip protocol, strip leading/trailing slash. */
function canon(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^\/+|\/+$/g, '');
}

const DOC_TYPES = ['article', 'city', 'guideArticle', 'tour', 'wikiMonument', 'hotel', 'nileCruise'] as const;

interface IndexedDoc {
  _id: string;
  _type: string;
  wpUrl?: string;
  enSlug?: string;
  esSlug?: string;
  jaSlug?: string;
  citySlug?: string; // parent city EN slug (guideArticle only)
}

async function buildIndex(client: SanityClient): Promise<{ index: Map<string, Hit>; docCount: number; keyCount: number }> {
  const docs = await client.fetch<IndexedDoc[]>(`
    *[_type in $types && !(_id in path("drafts.**"))]{
      _id, _type,
      "wpUrl": migration.wpUrl,
      "enSlug": slug[_key=="en"][0].value.current,
      "esSlug": slug[_key=="es"][0].value.current,
      "jaSlug": slug[_key=="ja"][0].value.current,
      "citySlug": parentCity->slug[_key=="en"][0].value.current
    }
  `, { types: DOC_TYPES });

  const index = new Map<string, Hit>();
  const add = (key: string, hit: Hit) => {
    const k = canon(key);
    if (!k) return;
    // Don't overwrite — first writer wins (keeps wpUrl-resolved match preferred over synthetic)
    if (!index.has(k)) index.set(k, hit);
  };

  for (const d of docs) {
    const hit: Hit = { _id: d._id, _type: d._type };

    // 1. Literal wpUrl (whatever protocol the index doc has)
    if (d.wpUrl) {
      add(d.wpUrl, hit);
      // also force both protocol variants by stripping
    }

    // 2. Synthetic legacy WP URL keys for guideArticles
    if (d._type === 'guideArticle' && d.enSlug) {
      // Flat: /<slug>/
      add(`travel2egypt.org/${d.enSlug}`, hit);
      // City-nested: /<city>-travel-guide/<slug>/
      if (d.citySlug) add(`travel2egypt.org/${d.citySlug}-travel-guide/${d.enSlug}`, hit);
      // ES variant under /es/
      if (d.esSlug) add(`travel2egypt.org/es/${d.esSlug}`, hit);
      if (d.esSlug && d.citySlug) add(`travel2egypt.org/es/guia-de-viaje-de-${d.citySlug}/${d.esSlug}`, hit);
      // JA variant under /ja/
      if (d.jaSlug) add(`travel2egypt.org/ja/${d.jaSlug}`, hit);
      if (d.jaSlug && d.citySlug) add(`travel2egypt.org/ja/${d.citySlug}/${d.jaSlug}`, hit);
    }

    // 3. Synthetic keys for city pages
    if (d._type === 'city' && d.enSlug) {
      add(`travel2egypt.org/${d.enSlug}-travel-guide`, hit);
      add(`travel2egypt.org/${d.enSlug}`, hit);
      if (d.esSlug) {
        add(`travel2egypt.org/es/guia-de-viaje-de-${d.enSlug}`, hit);
        add(`travel2egypt.org/es/${d.esSlug}`, hit);
      }
      if (d.jaSlug) add(`travel2egypt.org/ja/${d.jaSlug}`, hit);
    }

    // 4. Article / tour / hotel / nileCruise — flat slug at root
    if ((d._type === 'article' || d._type === 'tour' || d._type === 'hotel' || d._type === 'nileCruise' || d._type === 'wikiMonument') && d.enSlug) {
      add(`travel2egypt.org/${d.enSlug}`, hit);
      if (d.esSlug) add(`travel2egypt.org/es/${d.esSlug}`, hit);
      if (d.jaSlug) add(`travel2egypt.org/ja/${d.jaSlug}`, hit);
    }
  }
  return { index, docCount: docs.length, keyCount: index.size };
}

interface Stats { scanned: number; resolved: number; orphaned: number; patched: number; resolvedBy: Record<string, number> }

function patchPtBlocks(blocks: any[], index: Map<string, Hit>, stats: Stats, orphans: string[], doc: { _id: string; _type: string }): { blocks: any[]; mutated: boolean } {
  let mutated = false;
  const out = blocks.map((b: any) => {
    if (!b || b._type !== 'block' || !Array.isArray(b.markDefs)) return b;
    const newMarkDefs = b.markDefs.map((md: any) => {
      if (md?._type !== 'externalLink' || !md._pendingInternalRef?.wpUrl) return md;
      const wpUrl = md._pendingInternalRef.wpUrl;
      const key = canon(wpUrl);
      let hit = index.get(key);
      // Fallback 1: try last path segment alone (handles /<city>-travel-guide/<slug>/, /egypt-travel-guide/<city>/<slug>/, etc.)
      if (!hit) {
        const segs = key.split('/').filter(Boolean);
        const last = segs[segs.length - 1];
        if (last && last !== 'travel2egypt.org') hit = index.get(`travel2egypt.org/${last}`);
      }
      // Fallback 2: for /es/... or /ja/... try the last segment under the en namespace
      if (!hit) {
        const segs = key.split('/').filter(Boolean);
        if (segs[1] === 'es' || segs[1] === 'ja') {
          const last = segs[segs.length - 1];
          if (last) hit = index.get(`travel2egypt.org/${last}`);
        }
      }
      if (hit) {
        stats.resolved++;
        stats.resolvedBy[hit._type] = (stats.resolvedBy[hit._type] ?? 0) + 1;
        mutated = true;
        return { _key: md._key, _type: 'internalLink', reference: { _type: 'reference', _ref: hit._id } };
      }
      // Orphan — drop pending marker, keep as externalLink (redirect map will cover)
      stats.orphaned++;
      mutated = true;
      orphans.push(`${doc._id},${doc._type},${wpUrl}`);
      const { _pendingInternalRef, ...rest } = md;
      void _pendingInternalRef;
      return rest;
    });
    return { ...b, markDefs: newMarkDefs };
  });
  return { blocks: out, mutated };
}

function patchPtField(value: unknown, index: Map<string, Hit>, stats: Stats, orphans: string[], doc: { _id: string; _type: string }): { transformed: unknown; mutated: boolean } {
  if (!Array.isArray(value)) return { transformed: value, mutated: false };
  let mutated = false;
  const out = value.map((entry: any) => {
    if (entry && typeof entry === 'object' && Array.isArray(entry.value)) {
      const r = patchPtBlocks(entry.value, index, stats, orphans, doc);
      if (r.mutated) mutated = true;
      return { ...entry, value: r.blocks };
    }
    return entry;
  });
  if (out.every((e: any) => e && typeof e === 'object' && '_type' in e && e._type === 'block')) {
    const r = patchPtBlocks(out, index, stats, orphans, doc);
    return { transformed: r.blocks, mutated: r.mutated };
  }
  return { transformed: out, mutated };
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Internal-link relink (enhanced) ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\n`);
  const client = getClient();

  console.log('Building URL index…');
  const { index, docCount, keyCount } = await buildIndex(client);
  console.log(`  ${docCount} docs → ${keyCount} indexable URL keys`);

  console.log('\nScanning docs for pending refs…');
  const docs = await client.fetch<Array<{ _id: string; _type: string; body?: unknown; overview?: unknown; description?: unknown }>>(
    `*[_type in $types && !(_id in path("drafts.**"))]{ _id, _type, body, overview, description }`,
    { types: DOC_TYPES },
  );

  const stats: Stats = { scanned: 0, resolved: 0, orphaned: 0, patched: 0, resolvedBy: {} };
  const orphans: string[] = [];

  let txBatch = client.transaction(); let txOpsInBatch = 0;
  const FLUSH = 50;

  for (const doc of docs) {
    stats.scanned++;
    const patches: Array<{ field: string; value: unknown }> = [];
    for (const field of ['body', 'overview', 'description'] as const) {
      const v = (doc as any)[field];
      if (!v) continue;
      const r = patchPtField(v, index, stats, orphans, doc);
      if (r.mutated) patches.push({ field, value: r.transformed });
    }
    if (patches.length === 0) continue;
    if (args.dryRun) { stats.patched += patches.length; continue; }
    for (const p of patches) txBatch = txBatch.patch(doc._id, (pp) => pp.set({ [p.field]: p.value }));
    stats.patched += patches.length;
    txOpsInBatch += patches.length;
    if (txOpsInBatch >= FLUSH) {
      await txBatch.commit({ visibility: 'async' });
      txBatch = client.transaction();
      txOpsInBatch = 0;
    }
  }
  if (!args.dryRun && txOpsInBatch > 0) await txBatch.commit({ visibility: 'async' });

  console.log('\n--- summary ---');
  console.log(`Scanned:  ${stats.scanned}`);
  console.log(`Resolved: ${stats.resolved}  (externalLink+pending → internalLink)`);
  for (const [t, n] of Object.entries(stats.resolvedBy).sort((a,b)=>b[1]-a[1])) console.log(`            ${t.padEnd(15)} ${n}`);
  console.log(`Orphaned: ${stats.orphaned}  (kept as externalLink, pending marker stripped)`);
  console.log(`Patched:  ${stats.patched} doc-field writes`);

  if (orphans.length > 0) {
    writeFileSync(ORPHANS_PATH, 'doc_id,doc_type,wp_url\n' + orphans.join('\n') + '\n');
    console.log(`Orphan list → ${ORPHANS_PATH}`);
  }

  writeFileSync(STATS_PATH, JSON.stringify({ ts: new Date().toISOString(), mode: args.commit ? 'commit' : 'dry-run', ...stats }, null, 2));

  if (!args.dryRun && stats.patched > 0) {
    mkdirSync(resolve(process.cwd(), 'migration'), { recursive: true });
    appendFileSync(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), phase: 'RELINK', scanned: stats.scanned, resolved: stats.resolved, orphaned: stats.orphaned, patched: stats.patched }) + '\n', 'utf8');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
