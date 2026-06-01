/**
 * Strip leaked production metadata from guideArticle bodies (migration-staging).
 *
 * Editorial review (2026-06-01) found two kinds of internal/production text
 * published as visible body content on ~70 guide pages:
 *
 *   1. A trailing EDITORIAL-NOTES region appended after the article — headed by
 *      one of: "What changed", "What I deliberately did not change",
 *      "Verification items…", "Cluster consistency callouts",
 *      "Internal-link opportunities…", or "Meta title and meta description
 *      added…". These run from that marker to the end of the body.
 *
 *   2. Raw SEO META lines leaked mid-body, e.g. "Meta Title: … Meta
 *      Description: …" (Hurghada). These are single stray blocks with real
 *      article content after them, so they are removed individually.
 *
 * Also: 4 Luxor summaries begin with a literal "Meta description: " prefix;
 * the remainder is a fine teaser, so we strip just the prefix.
 *
 * Per-locale (en/es/ja). Conservative: a body is never emptied; summary text
 * is only de-prefixed, never blanked.
 *
 * Usage:
 *   tsx scripts/fix-guide-leaked-notes.ts            # dry-run (default)
 *   tsx scripts/fix-guide-leaked-notes.ts --commit   # write changes
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';

const REQUIRED_DATASET = 'migration-staging';
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
const dataset = process.env.NEXT_PUBLIC_SANITY_STAGING_DATASET ?? REQUIRED_DATASET;
const COMMIT = process.argv.includes('--commit');

if (!projectId || !token) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_STAGING_API_WRITE_TOKEN');
  process.exit(1);
}
if (dataset !== REQUIRED_DATASET) {
  console.error(`Refusing: dataset=${dataset} but this script only writes to ${REQUIRED_DATASET}.`);
  process.exit(1);
}

const client = createClient({
  projectId, dataset, token, apiVersion: '2024-10-01', useCdn: false, perspective: 'raw',
});

const LOCALES = ['en', 'es', 'ja'] as const;
type Locale = (typeof LOCALES)[number];

// Markers that BEGIN the trailing editorial-notes region (lowercased startsWith).
const NOTES_MARKERS = [
  'what changed',
  'what i deliberately did not change',
  'verification items',
  'cluster consistency callouts',
  'internal-link opportunities',
  'meta title and meta description added',
  // NOTE: 'google drive copy' deliberately NOT a marker. On Port Said docs that
  // region contains a richer ALTERNATE version of the article (not just leaked
  // metadata), so auto-truncating would delete real content. Port Said
  // "Google Drive Copy" regions are flagged for manual review instead.
];

// Fields to clean, per document type.
const TARGETS: Array<{ type: string; field: string }> = [
  { type: 'guideArticle', field: 'body' },
  { type: 'city', field: 'overview' },
];
// Standalone raw SEO leak (remove the individual block).
const META_LINE_RE = /^\s*meta\s*(title|description)\s*[:\-]/i;
// Leading SEO prefix to strip from a summary.
const META_PREFIX_RE = /^\s*meta\s*(title|description)\s*[:\-]\s*/i;

interface Span { _type: string; text?: string }
interface Block { _key: string; _type: string; style?: string; children?: Span[] }
interface LE<T> { _key: string; value: T }
interface Doc { _id: string; _type: string; summary?: LE<string>[]; body?: LE<Block[]>[]; overview?: LE<Block[]>[] }

function blockText(b: Block | undefined): string {
  if (!b || b._type !== 'block' || !Array.isArray(b.children)) return '';
  return b.children.filter((c) => c._type === 'span' && typeof c.text === 'string').map((c) => c.text as string).join('');
}
function isNotesMarker(text: string): boolean {
  const t = text.trim().toLowerCase();
  return NOTES_MARKERS.some((m) => t.startsWith(m));
}

let notesTruncations = 0, metaBlocksRemoved = 0;
const log: string[] = [];

/** Clean a localized portable-text field; returns new value or null if unchanged. */
function cleanField(id: string, value: LE<Block[]>[] | undefined): LE<Block[]>[] | null {
  if (!Array.isArray(value)) return null;
  const next = value.map((e) => ({ ...e }));
  let changed = false;
  for (const loc of LOCALES) {
    const idx = next.findIndex((e) => e._key === loc);
    if (idx === -1 || !Array.isArray(next[idx].value)) continue;
    let blocks = next[idx].value;

    const cut = blocks.findIndex((b) => isNotesMarker(blockText(b)));
    if (cut > 0) {
      const removed = blocks.length - cut;
      if (loc === 'en') log.push(`  [${id}] notes-region: cut ${removed} trailing blocks at "${blockText(blocks[cut]).slice(0, 50)}"`);
      blocks = blocks.slice(0, cut);
      notesTruncations++;
      changed = true;
    }

    const before = blocks.length;
    const filtered = blocks.filter((b) => !META_LINE_RE.test(blockText(b)));
    if (filtered.length !== before && filtered.length > 0) {
      if (loc === 'en') log.push(`  [${id}] removed ${before - filtered.length} stray meta-line block(s)`);
      metaBlocksRemoved += before - filtered.length;
      blocks = filtered;
      changed = true;
    }

    next[idx] = { ...next[idx], value: blocks };
  }
  return changed ? next : null;
}

async function main() {
  console.log(`Dataset: ${dataset}   Mode: ${COMMIT ? 'COMMIT' : 'DRY-RUN'}\n`);

  let docsModified = 0, summaryPrefixStripped = 0;
  const BATCH = 50;
  let queue: Array<{ _id: string; set: Record<string, unknown> }> = [];
  async function flush() {
    if (queue.length && COMMIT) {
      const tx = client.transaction();
      for (const q of queue) tx.patch(q._id, (p) => p.set(q.set));
      await tx.commit();
    }
    queue = [];
  }

  for (const target of TARGETS) {
    const docs: Doc[] = await client.fetch(
      `*[_type == $t && !(_id in path("drafts.**"))]{ _id, _type, summary, body, overview }`,
      { t: target.type }
    );
    console.log(`Fetched ${docs.length} published ${target.type} docs`);

    for (const d of docs) {
      const set: Record<string, unknown> = {};
      let touched = false;

      const cleaned = cleanField(d._id, (d as unknown as Record<string, unknown>)[target.field] as LE<Block[]>[] | undefined);
      if (cleaned) { set[target.field] = cleaned; touched = true; }

      // summary de-prefix (guideArticle only)
      if (target.type === 'guideArticle' && d.summary) {
        const newSummary = d.summary.map((e) => ({ ...e }));
        let sumChanged = false;
        for (const e of newSummary) {
          if (typeof e.value === 'string' && META_PREFIX_RE.test(e.value)) {
            e.value = e.value.replace(META_PREFIX_RE, '').trim();
            sumChanged = true;
            summaryPrefixStripped++;
          }
        }
        if (sumChanged) { set.summary = newSummary; touched = true; }
      }

      if (touched) {
        docsModified++;
        queue.push({ _id: d._id, set });
        if (queue.length >= BATCH) await flush();
      }
    }
  }
  await flush();

  console.log('\n=== Summary ===');
  console.log(`Docs modified:              ${docsModified}`);
  console.log(`Notes-region truncations:   ${notesTruncations} (per-locale)`);
  console.log(`Stray meta blocks removed:  ${metaBlocksRemoved}`);
  console.log(`Summary prefixes stripped:  ${summaryPrefixStripped}`);
  console.log('\n=== Per-doc log (en) ===');
  console.log(log.join('\n'));
  if (!COMMIT) console.log('\nDRY-RUN only. Re-run with --commit to write.');
}

main().catch((e) => { console.error('\nFAILED:', e); process.exit(1); });
