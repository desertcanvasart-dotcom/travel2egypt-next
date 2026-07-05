/**
 * Mention-based internal-link APPLY step — writes internalLink annotations
 * to DRAFTS only. Never publishes. Companion to scripts/mention-linker.ts.
 *
 * Safety model:
 *   - DRY RUN by default; set APPLY=1 to write.
 *   - Drafts only: mutations land on `drafts.<id>`; the owner reviews and
 *     publishes from Studio. The live site never changes from this script.
 *   - Clean-draft rule: any source doc that ALREADY has a draft is skipped
 *     entirely (publishing our draft would ship the unrelated pending edits
 *     — e.g. the ~273 docs with draft-only hero changes).
 *   - Rollback snapshot: every published doc is saved to
 *     backups/mention-links-<date>/<docId>.json before its draft is written.
 *     Rollback = delete the draft (published content was never touched).
 *   - Drift check: the anchor text must still sit at the recorded
 *     block/offset (or be re-findable in that block, unlinked); otherwise the
 *     row is skipped and reported.
 *
 * Usage:
 *   npx tsx scripts/mention-link-apply.ts --csv docs/mention-link-suggestions-tiered-2026-07-05.csv --city aswan            # dry run
 *   APPLY=1 npx tsx scripts/mention-link-apply.ts --csv ... --city aswan     # write drafts
 * Filters:
 *   --city <slug>     pilot scope: only guideArticle sources under /guide/<slug>/
 *   --locale <en|es|ja>
 *   --tier <A|B>      default A
 *   --source-id <id>  single doc
 *   --limit <n>       cap number of source docs
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const APPLY = process.env.APPLY === '1';

const WRITE_TOKEN = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN;
if (APPLY && !WRITE_TOKEN) {
  console.error('APPLY=1 requires SANITY_PRODUCTION_API_WRITE_TOKEN (plain SANITY_API_WRITE_TOKEN is read-scoped).');
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-12-01',
  token: (APPLY ? WRITE_TOKEN : undefined) || process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// ── args ───────────────────────────────────────────────────────────────────

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const CSV_PATH = arg('csv');
const CITY = arg('city');
const LOCALE = arg('locale');
const TIER = arg('tier') ?? 'A';
const SOURCE_ID = arg('source-id');
const LIMIT = arg('limit') ? Number(arg('limit')) : Infinity;
if (!CSV_PATH) {
  console.error('Missing --csv <path>');
  process.exit(1);
}

// ── CSV parsing (matches csvEscape in mention-linker.ts) ───────────────────

function parseCsv(raw: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = '', row: string[] = [], inQ = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inQ) {
      if (ch === '"' && raw[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQ = false;
      else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); field = ''; if (row.some((f) => f !== '')) rows.push(row); row = []; }
    else if (ch !== '\r') field += ch;
  }
  if (field || row.length) { row.push(field); if (row.some((f) => f !== '')) rows.push(row); }
  const header = rows.shift()!;
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

// ── portable-text helpers ──────────────────────────────────────────────────

type PTSpan = { _type: string; _key?: string; text?: string; marks?: string[] };
type PTBlock = {
  _type: string;
  _key?: string;
  children?: PTSpan[];
  markDefs?: { _key: string; _type: string }[];
};

const randKey = () =>
  Array.from({ length: 12 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');

const linkKeysOf = (block: PTBlock) =>
  new Set(
    (block.markDefs ?? [])
      .filter((d) => d._type === 'internalLink' || d._type === 'externalLink')
      .map((d) => d._key)
  );

/** Flatten block spans to text + per-char span index + linked mask. */
function flatten(block: PTBlock) {
  const linkKeys = linkKeysOf(block);
  let text = '';
  const spanAt: number[] = [];
  const linked: boolean[] = [];
  (block.children ?? []).forEach((span, si) => {
    if (span._type !== 'span' || typeof span.text !== 'string') return;
    const isLinked = (span.marks ?? []).some((m) => linkKeys.has(m));
    // iterate UTF-16 units, not code points — offsets from indexOf are UTF-16
    for (let i = 0; i < span.text.length; i++) {
      text += span.text[i];
      spanAt.push(si);
      linked.push(isLinked);
    }
  });
  return { text, spanAt, linked };
}

/**
 * Insert an internalLink mark over [start, start+len) in the block.
 * Returns a mutated copy, or a skip reason string.
 */
function linkRange(block: PTBlock, start: number, len: number, targetId: string): PTBlock | string {
  const { text, spanAt, linked } = flatten(block);
  const end = start + len;
  if (end > text.length) return 'offset-out-of-range';
  for (let i = start; i < end; i++) if (linked[i]) return 'already-linked';
  const spanIdx = spanAt[start];
  if (spanAt[end - 1] !== spanIdx) return 'crosses-span-boundary';

  // char offset of the span's start within the block text
  let spanStart = start;
  while (spanStart > 0 && spanAt[spanStart - 1] === spanIdx) spanStart--;

  const children = [...(block.children ?? [])];
  const span = children[spanIdx];
  const local = start - spanStart;
  const t = span.text!;
  const markKey = randKey();
  const pieces: PTSpan[] = [];
  if (local > 0) pieces.push({ ...span, _key: randKey(), text: t.slice(0, local) });
  pieces.push({ ...span, _key: randKey(), text: t.slice(local, local + len), marks: [...(span.marks ?? []), markKey] });
  if (local + len < t.length) pieces.push({ ...span, _key: randKey(), text: t.slice(local + len) });
  children.splice(spanIdx, 1, ...pieces);

  return {
    ...block,
    children,
    markDefs: [
      ...(block.markDefs ?? []),
      { _key: markKey, _type: 'internalLink', reference: { _type: 'reference', _ref: targetId } } as any,
    ],
  };
}

// ── main ───────────────────────────────────────────────────────────────────

type Suggestion = Record<string, string>;

async function main() {
  const all = parseCsv(readFileSync(resolve(process.cwd(), CSV_PATH!), 'utf8'));
  let rows = all.filter((r) => r.tier === TIER);
  if (LOCALE) rows = rows.filter((r) => r.locale === LOCALE);
  if (SOURCE_ID) rows = rows.filter((r) => r.source_id === SOURCE_ID);
  if (CITY) {
    // comma-separated localized slugs (e.g. aswan,asuan,asuwan) so one doc's
    // EN/ES/JA rows all land in the same draft write
    const slugs = CITY.split(',');
    rows = rows.filter(
      (r) =>
        r.source_type === 'guideArticle' &&
        slugs.some((c) => r.source_url.replace(/^\/(es|ja)/, '').startsWith(`/guide/${c}/`))
    );
  }
  const byDoc = new Map<string, Suggestion[]>();
  for (const r of rows) {
    if (!byDoc.has(r.source_id)) byDoc.set(r.source_id, []);
    byDoc.get(r.source_id)!.push(r);
  }
  const docIds = [...byDoc.keys()].slice(0, LIMIT);
  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — ${rows.length} tier-${TIER} suggestions across ${byDoc.size} docs${CITY ? ` (city: ${CITY})` : ''}${Number.isFinite(LIMIT) ? `, limited to ${docIds.length} docs` : ''}\n`);

  const date = new Date().toISOString().slice(0, 10);
  const backupDir = resolve(process.cwd(), `backups/mention-links-${date}`);
  if (APPLY) mkdirSync(backupDir, { recursive: true });

  const stats = { applied: 0, docsWritten: 0, skippedDraftExists: 0, skippedRows: {} as Record<string, number> };
  const skipRow = (reason: string) => (stats.skippedRows[reason] = (stats.skippedRows[reason] ?? 0) + 1);

  for (const docId of docIds) {
    const suggestions = byDoc.get(docId)!;
    const [published, draft] = await Promise.all([
      client.getDocument(docId),
      client.getDocument(`drafts.${docId}`),
    ]);
    if (!published) { console.log(`  SKIP ${docId} — published doc not found`); continue; }
    if (draft) {
      stats.skippedDraftExists++;
      console.log(`  SKIP ${docId} — draft already exists (clean-draft rule): ${suggestions[0].source_url}`);
      continue;
    }

    const doc = JSON.parse(JSON.stringify(published));
    let appliedHere = 0;

    for (const s of suggestions) {
      // locate the block array for this row's locale
      let blocks: PTBlock[] | undefined;
      if (s.source_type === 'article') blocks = doc.body;
      else if (s.source_type === 'guideArticle')
        blocks = (doc.body ?? []).find((e: any) => e._key === s.locale)?.value;
      if (!Array.isArray(blocks)) { skipRow('body-missing'); continue; }
      const bi = blocks.findIndex((b) => b._key === s.block_key);
      if (bi === -1) { skipRow('block-missing'); continue; }

      // drift check: anchor still at offset? else re-find first unlinked occurrence
      const { text, linked } = flatten(blocks[bi]);
      let start = Number(s.offset);
      if (text.slice(start, start + s.anchor.length) !== s.anchor) {
        let found = -1, from = 0;
        while (true) {
          const i = text.indexOf(s.anchor, from);
          if (i === -1) break;
          if (!linked.slice(i, i + s.anchor.length).some(Boolean)) { found = i; break; }
          from = i + 1;
        }
        if (found === -1) { skipRow('anchor-drifted'); continue; }
        start = found;
      }

      const result = linkRange(blocks[bi], start, s.anchor.length, s.target_id);
      if (typeof result === 'string') { skipRow(result); continue; }
      blocks[bi] = result;
      appliedHere++;
      if (!APPLY)
        console.log(`  would link [${s.locale}] "${s.anchor}" -> ${s.target_url}  (${s.source_url})`);
    }

    if (appliedHere === 0) continue;

    if (APPLY) {
      writeFileSync(`${backupDir}/${docId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`, JSON.stringify(published, null, 2));
      // manifest keeps the REAL ids (filenames are sanitized) — rollback reads this
      appendFileSync(`${backupDir}/manifest.txt`, `${docId}\n`);
      await client.createOrReplace({ ...doc, _id: `drafts.${docId}` });
      console.log(`  WROTE drafts.${docId} — ${appliedHere} links (${suggestions[0].source_url})`);
      stats.docsWritten++;
    }
    stats.applied += appliedHere;
  }

  console.log(`\n${APPLY ? 'Applied' : 'Would apply'}: ${stats.applied} links across ${APPLY ? stats.docsWritten : docIds.length - stats.skippedDraftExists} docs`);
  console.log(`Docs skipped (existing draft): ${stats.skippedDraftExists}`);
  console.log(`Rows skipped: ${JSON.stringify(stats.skippedRows)}`);
  if (APPLY) console.log(`Snapshots: ${backupDir}\nRollback = discard the drafts (published docs untouched).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
