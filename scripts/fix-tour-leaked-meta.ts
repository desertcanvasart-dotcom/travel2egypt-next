/**
 * Strip leaked SEO/frontmatter metadata from tour & nileCruise bodies (migration-staging).
 *
 * Discovered 2026-06-07: localized tour/cruise bodies were imported with the
 * source markdown's production metadata still inlined as visible body blocks at
 * the top of the article, above the real H2 lede:
 *
 *   1. SEO meta lines — rendered as ordinary paragraphs, e.g.
 *        "メタタイトル： …" / "メタディスクリプション： …"   (ja tours)
 *        "Meta Title: …" / "Meta Description: …"          (es nileCruise)
 *
 *   2. A leaked YAML frontmatter header (es nileCruise only), e.g.
 *        'slug: nour-el-nil-dahabiya city: kind: cruise locale: es title: "…"'
 *
 * Scope (raw perspective, published + drafts): 260 meta blocks across
 * 100 tour (ja) + 30 nileCruise (es) docs, plus 30 frontmatter blocks
 * (nileCruise es). Each affected block is removed individually; the real
 * article content (starting at the H2) is untouched. Conservative: a body is
 * never emptied.
 *
 * Patches each doc in place by its real _id (published AND draft), matching the
 * raw-client approach in scripts/fix-guide-leaked-notes.ts — no draft is
 * published as a side effect.
 *
 * Usage:
 *   tsx scripts/fix-tour-leaked-meta.ts            # dry-run (default)
 *   tsx scripts/fix-tour-leaked-meta.ts --commit   # write changes
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

// Leaked SEO meta line (en/es "Meta Title:" / ja "メタタイトル："), any colon variant.
const META_RE = /^\s*(meta\s*(title|description)|メタ(タイトル|ディスクリプション))\s*[:：\-]/i;
// Leaked YAML frontmatter header — a body block that starts with "slug:".
const FM_RE = /^\s*slug\s*:\s*\S/i;
const isLeak = (text: string) => META_RE.test(text) || FM_RE.test(text);

interface Span { _type: string; text?: string }
interface Block { _key: string; _type: string; style?: string; children?: Span[] }
interface LE<T> { _key: string; value: T }
interface Doc { _id: string; _type: string; body?: LE<Block[]>[] }

function blockText(b: Block | undefined): string {
  if (!b || b._type !== 'block' || !Array.isArray(b.children)) return '';
  return b.children.filter((c) => c._type === 'span' && typeof c.text === 'string').map((c) => c.text as string).join('');
}

let metaRemoved = 0, fmRemoved = 0;
const log: string[] = [];

/** Remove leaked blocks from a localized body; returns new value or null if unchanged. */
function cleanBody(id: string, value: LE<Block[]>[] | undefined): LE<Block[]>[] | null {
  if (!Array.isArray(value)) return null;
  const next = value.map((e) => ({ ...e }));
  let changed = false;
  for (const e of next) {
    if (!Array.isArray(e.value)) continue;
    const kept: Block[] = [];
    let metaHit = 0, fmHit = 0;
    for (const b of e.value) {
      const t = blockText(b);
      if (META_RE.test(t)) { metaHit++; continue; }
      if (FM_RE.test(t)) { fmHit++; continue; }
      kept.push(b);
    }
    if ((metaHit || fmHit) && kept.length > 0) {
      metaRemoved += metaHit; fmRemoved += fmHit;
      log.push(`  [${id}] (${e._key}) removed ${metaHit} meta + ${fmHit} frontmatter block(s)`);
      e.value = kept;
      changed = true;
    } else if ((metaHit || fmHit) && kept.length === 0) {
      log.push(`  [${id}] (${e._key}) SKIPPED — removal would empty the body`);
    }
  }
  return changed ? next : null;
}

async function main() {
  console.log(`Dataset: ${dataset}   Mode: ${COMMIT ? 'COMMIT' : 'DRY-RUN'}\n`);

  // raw perspective → includes both published and drafts.* docs.
  const docs: Doc[] = await client.fetch(
    `*[_type in ['tour','nileCruise'] && defined(body)]{ _id, _type, body }`
  );
  console.log(`Fetched ${docs.length} tour/nileCruise docs (published + drafts)\n`);

  let docsModified = 0;
  const BATCH = 50;
  let queue: Array<{ _id: string; body: unknown }> = [];
  async function flush() {
    if (queue.length && COMMIT) {
      const tx = client.transaction();
      for (const q of queue) tx.patch(q._id, (p) => p.set({ body: q.body }));
      await tx.commit();
    }
    queue = [];
  }

  for (const d of docs) {
    const cleaned = cleanBody(d._id, d.body);
    if (cleaned) {
      docsModified++;
      queue.push({ _id: d._id, body: cleaned });
      if (queue.length >= BATCH) await flush();
    }
  }
  await flush();

  console.log('\n=== Summary ===');
  console.log(`Docs modified:            ${docsModified}`);
  console.log(`Meta blocks removed:      ${metaRemoved}`);
  console.log(`Frontmatter removed:      ${fmRemoved}`);
  console.log('\n=== Per-doc log ===');
  console.log(log.join('\n'));
  if (!COMMIT) console.log('\nDRY-RUN only. Re-run with --commit to write.');
}

main().catch((e) => { console.error('\nFAILED:', e); process.exit(1); });
