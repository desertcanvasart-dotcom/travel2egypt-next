/**
 * Remove bad internalLink annotations, driven by the audit CSV
 * (scripts/audit-imported-links.ts) — the cleanup counterpart of the
 * mention-link pipeline.
 *
 * Selection classes (--classes, comma-separated):
 *   self            source doc links to itself (any severity) — pure noise
 *   wrong-language  target is a language-versioned doc in a different
 *                   language than the text it sits in
 *   flagged         severity no-overlap or low — use with a hand-reviewed
 *                   CSV (delete the rows you want to KEEP, then run)
 *
 * Safety model mirrors mention-link-apply.ts:
 *   - DRY RUN by default; APPLY=1 writes DRAFTS only (owner or the gated
 *     bulk publisher takes them live).
 *   - Clean-draft rule: docs with a pre-existing draft are skipped.
 *   - Removal is surgical: the markDef is matched by its _key AND target
 *     ref in the row's locale; the mark is stripped from spans; text is
 *     never touched. Rows that no longer match are reported, not guessed.
 *   - Snapshot + manifest in backups/mention-links-removed-<date>/.
 *
 * Usage:
 *   npx tsx scripts/mention-link-remove.ts --csv docs/imported-link-audit-<date>.csv --classes self,wrong-language
 *   APPLY=1 npx tsx scripts/mention-link-remove.ts --csv ... --classes self,wrong-language
 */
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();

const APPLY = process.env.APPLY === '1';
const WRITE_TOKEN = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN;
if (APPLY && !WRITE_TOKEN) {
  console.error('APPLY=1 requires SANITY_PRODUCTION_API_WRITE_TOKEN.');
  process.exit(1);
}
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-12-01',
  token: (APPLY ? WRITE_TOKEN : undefined) || process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const CSV_PATH = arg('csv');
const CLASSES = new Set((arg('classes') ?? '').split(',').filter(Boolean));
if (!CSV_PATH || !CLASSES.size) {
  console.error('Usage: --csv <audit csv> --classes self,wrong-language[,flagged]');
  process.exit(1);
}

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

const inClass = (r: Record<string, string>): string | null => {
  if (CLASSES.has('self') && r.source_id === r.target_id) return 'self';
  if (CLASSES.has('wrong-language') && r.target_language && r.target_language !== r.locale) return 'wrong-language';
  if (CLASSES.has('flagged') && (r.severity === 'no-overlap' || r.severity === 'low')) return 'flagged';
  return null;
};

async function main() {
  const all = parseCsv(readFileSync(resolve(process.cwd(), CSV_PATH!), 'utf8'));
  const selected = all.map((r) => ({ r, cls: inClass(r) })).filter((x) => x.cls) as { r: Record<string, string>; cls: string }[];
  const byDoc = new Map<string, typeof selected>();
  for (const s of selected) {
    if (!byDoc.has(s.r.source_id)) byDoc.set(s.r.source_id, []);
    byDoc.get(s.r.source_id)!.push(s);
  }
  const clsCount: Record<string, number> = {};
  for (const s of selected) clsCount[s.cls] = (clsCount[s.cls] ?? 0) + 1;
  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — removing ${selected.length} links (${JSON.stringify(clsCount)}) across ${byDoc.size} docs\n`);

  const date = new Date().toISOString().slice(0, 10);
  const backupDir = resolve(process.cwd(), `backups/mention-links-removed-${date}`);
  if (APPLY) mkdirSync(backupDir, { recursive: true });

  let removed = 0, docsStaged = 0, skippedDraft = 0;
  const missed: string[] = [];

  for (const [docId, entries] of byDoc) {
    const [pub, draft] = await Promise.all([client.getDocument(docId), client.getDocument(`drafts.${docId}`)]);
    if (!pub) { missed.push(`${docId} (no published doc)`); continue; }
    if (draft) { skippedDraft++; console.log(`  SKIP ${docId} — draft already exists`); continue; }

    const doc = JSON.parse(JSON.stringify(pub));
    let removedHere = 0;
    for (const { r, cls } of entries) {
      let found = false;
      const scan = (blocks: any[]) => {
        for (const b of blocks ?? []) {
          const md = (b.markDefs ?? []).find((m: any) => m._key === r.key && m._type === 'internalLink' && m.reference?._ref === r.target_id);
          if (!md) continue;
          b.markDefs = b.markDefs.filter((m: any) => m._key !== md._key);
          for (const s of b.children ?? []) if (s.marks) s.marks = s.marks.filter((k: string) => k !== md._key);
          found = true;
          return;
        }
      };
      if (r.source_type === 'article') scan(doc.body);
      else {
        const entry = (doc.body ?? []).find((e: any) => e._key === r.locale);
        scan(entry?.value);
      }
      if (found) {
        removedHere++;
        if (!APPLY) console.log(`  would remove [${cls}] [${r.locale}] "${r.anchor}" -> ${r.target_id}  (${docId})`);
      } else missed.push(`${docId} [${r.locale}] "${r.anchor}" -> ${r.target_id}`);
    }
    if (!removedHere) continue;

    if (APPLY) {
      writeFileSync(`${backupDir}/${docId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`, JSON.stringify(pub, null, 2));
      appendFileSync(`${backupDir}/manifest.txt`, `${docId}\n`);
      await client.createOrReplace({ ...doc, _id: `drafts.${docId}` });
      console.log(`  STAGED drafts.${docId} — ${removedHere} links removed`);
      docsStaged++;
    }
    removed += removedHere;
  }

  console.log(`\n${APPLY ? 'Staged removal of' : 'Would remove'}: ${removed} links${APPLY ? ` across ${docsStaged} drafts` : ''}`);
  console.log(`Docs skipped (existing draft): ${skippedDraft}`);
  if (missed.length) console.log(`Rows not matched (${missed.length}):\n  ` + missed.join('\n  '));
  if (APPLY) console.log(`Snapshots + manifest: ${backupDir}\nNext: publish via scripts/mention-link-publish.ts --ids ${backupDir}/manifest.txt`);
}

main().catch((err) => { console.error(err); process.exit(1); });
