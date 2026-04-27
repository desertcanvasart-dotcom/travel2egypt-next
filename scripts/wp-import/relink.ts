/**
 * Phase 2 — internal-link resolution.
 *
 * Walks every imported Sanity document, finds Portable Text marks of type
 * `externalLink` with a `_pendingInternalRef.wpUrl` field, looks up the
 * corresponding Sanity doc by `migration.wpUrl`, and patches the mark to
 * `internalLink` with a proper reference.
 *
 * Unresolvable links are kept as `externalLink` to the WP URL (the redirect
 * map will 301 visitors to the new path) and logged to relink-orphans.csv.
 */

import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SanityClient } from '@sanity/client';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ORPHANS_PATH = join(ROOT, 'migration/relink-orphans.csv');

interface ImportedDoc {
  _id: string;
  _type: string;
  body?: unknown;
  overview?: unknown;
  description?: unknown;
  migration?: { wpUrl?: string };
}

export interface RelinkSummary {
  scanned: number;
  resolved: number;
  orphaned: number;
  patched: number;
}

export async function runRelinkPhase(
  client: SanityClient,
  opts: { dryRun?: boolean; redirectMap?: Map<string, string> } = {}
): Promise<RelinkSummary> {
  const summary: RelinkSummary = { scanned: 0, resolved: 0, orphaned: 0, patched: 0 };

  // Build a URL → docId index of everything we've imported.
  const all = (await client.fetch(
    `*[_type in ["article","city","guideArticle","tour","wikiMonument","hotel","nileCruise"]]{ _id, _type, "wpUrl": migration.wpUrl }`
  )) as Array<{ _id: string; _type: string; wpUrl?: string }>;

  const urlIndex = new Map<string, { _id: string; _type: string }>();
  for (const d of all) {
    if (d.wpUrl) urlIndex.set(d.wpUrl.replace(/\/$/, ''), { _id: d._id, _type: d._type });
  }

  // Now scan each doc's PT fields for pending refs.
  const docs = (await client.fetch(
    `*[_type in ["article","city","guideArticle","tour","wikiMonument","hotel","nileCruise"]]`
  )) as ImportedDoc[];

  const orphanLines: string[] = [];

  for (const doc of docs) {
    summary.scanned++;
    const patches = findAndPatchPendingRefs(doc, urlIndex, summary, orphanLines);
    if (patches.length === 0) continue;
    if (opts.dryRun) continue;
    // Apply each patch as a Sanity transaction.
    const tx = client.transaction();
    for (const p of patches) tx.patch(doc._id, p);
    await tx.commit({ visibility: 'async' });
    summary.patched += patches.length;
  }

  if (orphanLines.length > 0) {
    const header = 'doc_id,doc_type,wp_url\n';
    writeFileSync(ORPHANS_PATH, header + orphanLines.join('\n') + '\n');
  }
  return summary;
}

interface PatchOp {
  set?: Record<string, unknown>;
  unset?: string[];
}

/**
 * Walk a document's PT fields. For each block.markDefs entry that is an
 * externalLink with `_pendingInternalRef.wpUrl`, replace with an
 * internalLink that references the matching Sanity doc.
 *
 * Note: this implementation rewrites entire i18n PT arrays in one set
 * operation, which is simple but coarse. Acceptable for migration scale
 * (a few thousand docs).
 */
function findAndPatchPendingRefs(
  doc: ImportedDoc,
  urlIndex: Map<string, { _id: string; _type: string }>,
  summary: RelinkSummary,
  orphans: string[]
): PatchOp[] {
  const patches: PatchOp[] = [];
  for (const fieldName of ['body', 'overview', 'description'] as const) {
    const value = (doc as any)[fieldName];
    if (!value) continue;
    const { transformed, mutated } = transformPtField(value, urlIndex, summary, orphans, doc);
    if (mutated) patches.push({ set: { [fieldName]: transformed } });
  }
  return patches;
}

function transformPtField(
  value: unknown,
  urlIndex: Map<string, { _id: string; _type: string }>,
  summary: RelinkSummary,
  orphans: string[],
  doc: ImportedDoc
): { transformed: unknown; mutated: boolean } {
  if (!Array.isArray(value)) return { transformed: value, mutated: false };
  let mutated = false;
  const out = value.map((entry: any) => {
    // Field-level i18n shape: { _key, value: PtBlock[] }
    if (entry && typeof entry === 'object' && Array.isArray(entry.value)) {
      const r = transformPtBlocks(entry.value, urlIndex, summary, orphans, doc);
      if (r.mutated) mutated = true;
      return { ...entry, value: r.blocks };
    }
    // Document-level: array IS the blocks.
    return entry;
  });
  // Document-level shape: array of blocks directly.
  if (out.every((e: any) => e && typeof e === 'object' && '_type' in e && e._type === 'block')) {
    const r = transformPtBlocks(out, urlIndex, summary, orphans, doc);
    return { transformed: r.blocks, mutated: r.mutated };
  }
  return { transformed: out, mutated };
}

function transformPtBlocks(
  blocks: any[],
  urlIndex: Map<string, { _id: string; _type: string }>,
  summary: RelinkSummary,
  orphans: string[],
  doc: ImportedDoc
): { blocks: any[]; mutated: boolean } {
  let mutated = false;
  const out = blocks.map((b: any) => {
    if (!b || b._type !== 'block' || !Array.isArray(b.markDefs)) return b;
    const newMarkDefs = b.markDefs.map((md: any) => {
      if (md._type !== 'externalLink' || !md._pendingInternalRef?.wpUrl) return md;
      const wpUrl = md._pendingInternalRef.wpUrl.replace(/\/$/, '');
      const hit = urlIndex.get(wpUrl);
      if (hit) {
        summary.resolved++;
        mutated = true;
        return {
          _key: md._key,
          _type: 'internalLink',
          reference: { _type: 'reference', _ref: hit._id },
        };
      }
      // Orphaned — keep as externalLink, drop the pending marker.
      summary.orphaned++;
      mutated = true;
      orphans.push(`${doc._id},${doc._type},${md._pendingInternalRef.wpUrl}`);
      const { _pendingInternalRef, ...rest } = md;
      void _pendingInternalRef;
      return rest;
    });
    return { ...b, markDefs: newMarkDefs };
  });
  return { blocks: out, mutated };
}
