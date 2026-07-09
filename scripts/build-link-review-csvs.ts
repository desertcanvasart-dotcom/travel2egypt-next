/**
 * Derive owner-facing review CSVs from the two generator outputs:
 *   - mention-link-suggestions-tiered-<date>.csv  -> Tier-B-only review file
 *   - imported-link-audit-<date>.csv              -> flagged-only review file
 *
 * Each review file gets a leading `decision` column for the owner to fill,
 * and columns reordered so the human-judgment fields come first. Read-only
 * except for writing the two derived CSVs. No Sanity access.
 *
 * Run:  npx tsx scripts/build-link-review-csvs.ts 2026-07-09
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const date = process.argv[2] || new Date().toISOString().slice(0, 10);

// minimal RFC-4180 CSV parser (handles quoted fields, escaped quotes, newlines)
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ''));
}

const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const writeCsv = (path: string, header: string[], rows: string[][]) =>
  writeFileSync(path, [header, ...rows].map((r) => r.map(esc).join(',')).join('\n') + '\n');

// ── 1. Tier B mention-links ────────────────────────────────────────────────
{
  const src = parseCsv(readFileSync(resolve(`docs/mention-link-suggestions-tiered-${date}.csv`), 'utf8'));
  const head = src[0];
  const col = (name: string) => head.indexOf(name);
  const tier = col('tier');
  const body = src.slice(1).filter((r) => r[tier] === 'B');
  // decision + the review-relevant columns first, apply-machinery columns last
  const order = ['locale', 'flags', 'anchor', 'context', 'source_type', 'source_title',
    'source_url', 'target_type', 'target_title', 'target_url', 'target_id', 'source_id',
    'block_key', 'offset'];
  const outHead = ['decision', ...order];
  const outRows = body.map((r) => ['', ...order.map((c) => r[col(c)] ?? '')]);
  // sort: cross-city first (highest-value review), then by locale
  const rank = (r: string[]) => (r[1 + order.indexOf('flags')].includes('cross-city') ? 0 : 1);
  outRows.sort((a, b) => rank(a) - rank(b) || a[1].localeCompare(b[1]));
  writeCsv(resolve(`docs/review-tierB-mention-links-${date}.csv`), outHead, outRows);
  console.log(`Tier B review: ${outRows.length} rows -> docs/review-tierB-mention-links-${date}.csv`);
}

// ── 2. Flagged imported links ──────────────────────────────────────────────
{
  const src = parseCsv(readFileSync(resolve(`docs/imported-link-audit-${date}.csv`), 'utf8'));
  const head = src[0];
  const col = (name: string) => head.indexOf(name);
  const sev = col('severity');
  const body = src.slice(1).filter((r) => r[sev] === 'no-overlap' || r[sev] === 'low');
  // annotate self-links and wrong-language (the clear-cut removals) up front
  const srcId = col('source_id'), tgtId = col('target_id'), loc = col('locale'), tgtLang = col('target_language');
  const order = ['severity', 'score', 'locale', 'anchor', 'context', 'source_type',
    'source_id', 'source_title', 'target_type', 'target_id', 'target_title', 'target_language', 'key'];
  const outHead = ['decision', 'auto_class', ...order];
  const outRows = body.map((r) => {
    let cls = '';
    if (r[srcId] === r[tgtId]) cls = 'self-link';
    else if (r[tgtLang] && r[tgtLang] !== r[loc]) cls = 'wrong-language';
    return ['', cls, ...order.map((c) => r[col(c)] ?? '')];
  });
  // already sorted worst-first (score asc) by the generator; keep that
  writeCsv(resolve(`docs/review-imported-links-flagged-${date}.csv`), outHead, outRows);
  const self = outRows.filter((r) => r[1] === 'self-link').length;
  const wrong = outRows.filter((r) => r[1] === 'wrong-language').length;
  console.log(`Imported-link review: ${outRows.length} rows (self-link ${self}, wrong-language ${wrong}) -> docs/review-imported-links-flagged-${date}.csv`);
}
