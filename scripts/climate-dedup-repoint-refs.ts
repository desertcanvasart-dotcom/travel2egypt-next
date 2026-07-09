/**
 * Climate-page dedup cleanup (Farafra + Siwa).
 *
 * The 3 legacy "duplicate" climate guideArticles (Farafra wp-page-59634,
 * Rosetta wp-page-60419, Siwa wp-page-60506) are superseded by canonical
 * guideArticle.<city>.weather-in-<city> keepers and already sit behind 301s.
 * Rosetta had 0 refs and was unpublished directly. Farafra + Siwa are blocked
 * from unpublish because superseded legacy wikiMonument docs still carry an
 * internalLink to them in their PortableText body.
 *
 * This script repoints every reference (in ANY field, published + draft) that
 * points at a legacy climate doc to its keeper, so the legacy docs can then be
 * unpublished. It mutates only the `_ref` string leaf — all `_key`s are
 * preserved (the "safe leaf set" path per the raw @sanity/client), so no
 * PortableText keys are regenerated. Originals are backed up first.
 *
 * Run (preview):  npx tsx scripts/climate-dedup-repoint-refs.ts
 * Run (apply):    npx tsx scripts/climate-dedup-repoint-refs.ts --apply
 */
import 'dotenv/config';
import { createClient } from '@sanity/client';
import { writeFileSync, mkdirSync } from 'node:fs';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token =
  process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;

if (dataset !== 'production') {
  throw new Error(`Refusing to run against dataset "${dataset}" — this targets production.`);
}
if (!projectId || !token) {
  console.error('Missing project id or production write token');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');
const STAMP = '2026-07-09';
const client = createClient({ projectId, dataset, apiVersion: '2024-12-01', token, useCdn: false });

// legacy climate doc  ->  keeper climate doc
const REPOINT: Record<string, string> = {
  'wp-page-59634': 'guideArticle.farafra-oasis.weather-in-farafra-oasis',
  'wp-page-60506': 'guideArticle.siwa-oasis.weather-in-siwa-oasis',
};
const LEGACY_IDS = Object.keys(REPOINT);

type SetOp = { id: string; path: string; from: string; to: string };

// Deep-walk a value, building a Sanity JSONMatch path (prefer [_key=="..."]
// selectors so edits are order-independent) and collect every reference whose
// _ref targets a legacy climate doc.
function collect(node: unknown, path: string, ops: SetOp[], docId: string) {
  if (Array.isArray(node)) {
    node.forEach((item, i) => {
      const seg =
        item && typeof item === 'object' && typeof (item as any)._key === 'string'
          ? `[_key=="${(item as any)._key}"]`
          : `[${i}]`;
      collect(item, `${path}${seg}`, ops, docId);
    });
    return;
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (obj._type === 'reference' && typeof obj._ref === 'string' && REPOINT[obj._ref]) {
      ops.push({ id: docId, path: `${path}._ref`, from: obj._ref, to: REPOINT[obj._ref] });
    }
    for (const [k, v] of Object.entries(obj)) {
      if (k === '_ref' || k === '_key' || k === '_type') continue;
      collect(v, path ? `${path}.${k}` : k, ops, docId);
    }
  }
}

async function main() {
  // raw perspective: includes both published and drafts.* versions
  const docs: any[] = await client.fetch(
    `*[references($ids)]`,
    { ids: LEGACY_IDS },
    { perspective: 'raw' } as any,
  );

  const ops: SetOp[] = [];
  for (const doc of docs) {
    for (const [k, v] of Object.entries(doc)) {
      if (k.startsWith('_')) continue;
      collect(v, k, ops, doc._id);
    }
  }

  console.log(`Referrer docs: ${docs.length}`);
  console.log(`Reference leaves to repoint: ${ops.length}\n`);
  for (const op of ops) {
    console.log(`  ${op.id}\n    ${op.path}\n    ${op.from} -> ${op.to}`);
  }

  // sanity check: every op path actually resolved a legacy ref
  const byDoc = new Map<string, SetOp[]>();
  for (const op of ops) {
    if (!byDoc.has(op.id)) byDoc.set(op.id, []);
    byDoc.get(op.id)!.push(op);
  }

  // backup the full original docs
  mkdirSync('backups', { recursive: true });
  const backupPath = `backups/climate-dedup-repoint-rollback-${STAMP}.json`;
  writeFileSync(backupPath, JSON.stringify({ stamp: STAMP, repoint: REPOINT, docs }, null, 2));
  console.log(`\nBackup written: ${backupPath} (${docs.length} full docs)`);

  if (!APPLY) {
    console.log('\nDRY RUN — re-run with --apply to commit.');
    return;
  }

  for (const [id, docOps] of byDoc) {
    let p = client.patch(id);
    for (const op of docOps) p = p.set({ [op.path]: op.to });
    const res = await p.commit({ autoGenerateArrayKeys: false });
    console.log(`patched ${id}: ${docOps.length} ref(s) -> rev ${res._rev}`);
  }

  // verify no more references to the legacy docs anywhere
  const remaining: string[] = await client.fetch(
    `*[references($ids)]._id`,
    { ids: LEGACY_IDS },
    { perspective: 'raw' } as any,
  );
  console.log(`\nRemaining referrers after repoint: ${remaining.length}`);
  if (remaining.length) console.log(remaining.join('\n'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
