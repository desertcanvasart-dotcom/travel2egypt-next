/**
 * Upload owner-supplied From-prices (priceFrom, EUR integer) to the unpriced
 * package tours. Matches the CSV "Trip Name" to the tour's EN title (normalized:
 * lowercase, &→and, apostrophes/punctuation stripped). Dry-run reports the
 * match plan + every anomaly (unmatched CSV row, ambiguous title, bad price,
 * tours left without a price); --commit writes priceFrom.
 *
 * Usage:
 *   npx tsx scripts/upload-tour-prices.ts --dry-run
 *   npx tsx scripts/upload-tour-prices.ts --commit
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv();
function die(m: string): never { process.stderr.write(`error: ${m}\n`); process.exit(2); }
const commit = process.argv.includes('--commit');
if (!commit && !process.argv.includes('--dry-run')) die('pass --dry-run or --commit');

const CSV_PATH = '/Users/islamhussein/Desktop/Package tours - prices.csv';

function getClient(): SanityClient {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'production') die('production only');
  const token = process.env.SANITY_PRODUCTION_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !token) die('missing projectId/token');
  return createClient({ projectId, dataset, apiVersion: '2024-12-01', useCdn: false, token, perspective: 'raw' });
}

/** Quote-aware CSV → array of {title, price}. */
function parseCSV(text: string): Array<{ title: string; price: string }> {
  const rows: string[][] = [];
  let field = '', row: string[] = [], inQ = false;
  const t = text.replace(/\r\n/g, '\n');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQ) {
      if (c === '"') { if (t[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.slice(1).filter((r) => r.some((c) => c.trim())).map((r) => ({ title: (r[0] ?? '').trim(), price: (r[1] ?? '').trim() }));
}

const norm = (s: string) =>
  s.toLowerCase().replace(/&/g, ' and ').replace(/['’‘`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const parsePrice = (s: string): number | null => {
  const n = parseInt(s.replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

interface Tour { id: string; slug: string | null; title: string | null; priceFrom?: number | null }

async function main() {
  const client = getClient();
  const rows = parseCSV(readFileSync(CSV_PATH, 'utf8'));
  const tours = await client.fetch<Tour[]>(
    `*[_type=="tour" && type=="package" && !(_id in path("drafts.**"))]{ "id": _id, "slug": slug[_key=="en"][0].value.current, "title": title[_key=="en"][0].value, priceFrom }`
  );
  const byTitle = new Map<string, Tour[]>();
  for (const t of tours) {
    if (!t.title) continue;
    const k = norm(t.title);
    (byTitle.get(k) ?? byTitle.set(k, []).get(k)!).push(t);
  }

  type Row = { id: string; slug: string | null; title: string; price: number; old: number | null; shared: boolean };
  const toSet: Row[] = [];       // unpriced → new price
  const toChange: Row[] = [];    // already priced, CSV differs
  const same: Row[] = [];        // already priced, CSV matches
  const unmatched: Array<{ title: string; price: string }> = [];
  for (const r of rows) {
    const price = parsePrice(r.price);
    const matches = byTitle.get(norm(r.title)) ?? [];
    if (matches.length === 0 || !price) { unmatched.push(r); continue; }
    for (const t of matches) {
      const rec: Row = { id: t.id, slug: t.slug, title: r.title, price, old: t.priceFrom ?? null, shared: matches.length > 1 };
      if (t.priceFrom == null) toSet.push(rec);
      else if (t.priceFrom !== price) toChange.push(rec);
      else same.push(rec);
    }
  }
  const ambiguous = toSet.filter((r) => r.shared);
  const touched = new Set([...toSet, ...toChange, ...same].map((r) => r.id));
  const unpricedNoCsv = tours.filter((t) => t.priceFrom == null && !touched.has(t.id));

  console.log(`\n=== upload tour prices ===  mode: ${commit ? 'COMMIT' : 'dry-run'}`);
  console.log(`CSV rows: ${rows.length} | packages in Sanity: ${tours.length}`);
  console.log(`NEW (unpriced → set): ${toSet.length} | CHANGE (already priced, CSV differs): ${toChange.length} | SAME: ${same.length}`);
  console.log(`Unmatched CSV rows: ${unmatched.length} | ambiguous: ${ambiguous.length} | packages still unpriced (no CSV row): ${unpricedNoCsv.length}`);
  if (ambiguous.length) { console.log(`\n(shared-title dups — same price applied to each):`); for (const a of ambiguous) console.log(`   €${a.price}  ${a.slug}`); }
  if (toChange.length) { console.log(`\n≠ CHANGES to already-priced tours (old → CSV) — NOT applied without --update-existing:`); for (const c of toChange) console.log(`   €${c.old} → €${c.price}   ${c.slug}`); }
  if (unmatched.length) { console.log(`\n⚠ UNMATCHED CSV rows (no package title matches):`); for (const u of unmatched) console.log(`   "${u.title}"  [${u.price}]`); }
  if (unpricedNoCsv.length) { console.log(`\n⚠ Packages left unpriced (no CSV row):`); for (const t of unpricedNoCsv) console.log(`   ${t.slug}  —  "${t.title}"`); }

  writeFileSync(resolve(process.cwd(), 'scripts/.price-upload-plan.json'), JSON.stringify({ toSet, toChange, same, unmatched, unpricedNoCsv }, null, 2), 'utf8');

  const withChanges = process.argv.includes('--update-existing');
  if (!commit) {
    console.log(`\nDry-run complete. --commit sets ${toSet.length} NEW prices; add --update-existing to also apply the ${toChange.length} CHANGES.`);
    return;
  }
  const apply = withChanges ? [...toSet, ...toChange] : toSet;
  console.log(`\nCommitting ${apply.length} prices (${toSet.length} new${withChanges ? ` + ${toChange.length} changed` : ', changes held'})…`);
  let ok = 0; const errors: Array<{ id: string; e: string }> = [];
  for (const p of apply) {
    try { await client.patch(p.id).set({ priceFrom: p.price }).commit({ visibility: 'async' }); ok++; }
    catch (e) { errors.push({ id: p.id, e: (e as Error).message }); }
  }
  console.log(`  set priceFrom: ${ok} / errors: ${errors.length}`);
  for (const e of errors.slice(0, 10)) console.log(`    ${e.id}: ${e.e}`);
  if (errors.length) process.exit(1);
}
main().catch((e) => { console.error(e); process.exit(1); });
