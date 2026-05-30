/**
 * Generate 301 redirect rows for the JA romaji-slug migration.
 *
 * After migrate-ja-romaji-slugs.ts rewrote each doc's JA slug from the
 * English-fallback value to a Hepburn romaji slug, the old JA URLs
 * (/ja/<en-slug>, /ja/nile-cruises/<en-slug>, etc.) no longer resolve —
 * slugLookupQuery matches on slug[ja], which is now romaji. This script
 * emits /ja/<en-slug> → /ja/<romaji-slug> redirects so previously-indexed
 * JA URLs (and the existing WP→/ja/<en> redirects that point at them)
 * keep working.
 *
 * Old slug  ← first-commit CSV `current_slug` column (the pre-migration
 *             English-fallback value that was live & indexed).
 * New slug  ← live Sanity state (authoritative; reflects all corrections).
 *
 * Appends 6-col rows to migration/redirect-map.csv. Idempotent: skips any
 * source path already present in the CSV. Run the regenerator afterwards.
 */
import { readFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';

loadEnv();

const CSV_PATH = resolve(process.cwd(), 'migration/redirect-map.csv');

// First-commit CSVs (captured the English-fallback current_slug before the
// JA slug was rewritten to romaji).
const FIRST_COMMIT_CSV: Record<string, string> = {
  tour: 'migration/.cache/ja-slug-tour-2026-05-30T01-33-55-556Z.csv',
  guideArticle: 'migration/.cache/ja-slug-guideArticle-2026-05-30T01-36-18-772Z.csv',
  nileCruise: 'migration/.cache/ja-slug-nileCruise-2026-05-30T01-33-10-706Z.csv',
  hotel: 'migration/.cache/ja-slug-hotel-2026-05-30T01-40-05-268Z.csv',
  travelTip: 'migration/.cache/ja-slug-travelTip-2026-05-30T01-40-29-744Z.csv',
};

// URL builders per type. `s` = slug, `city` = parent-city JA slug.
const URL_FOR: Record<string, (s: string, city?: string) => string> = {
  tour: (s) => `/ja/${s}`,
  nileCruise: (s) => `/ja/nile-cruises/${s}`,
  hotel: (s) => `/ja/hotels/${s}`,
  travelTip: (s) => `/ja/travel-tips/${s}`,
  guideArticle: (s, city) => `/ja/guide/${city}/${s}`,
};

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
  useCdn: false,
  token: process.env.SANITY_STAGING_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
});

/** Parse one RFC-4180-ish CSV line with double-quoted fields. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { out.push(cur); cur = ''; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

/** _id → old English-fallback slug (current_slug column). */
function readOldSlugs(file: string): Map<string, string> {
  const text = readFileSync(resolve(process.cwd(), file), 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  lines.shift(); // header: _id,title,current_slug,proposed_slug,source,flags
  const m = new Map<string, string>();
  for (const line of lines) {
    const cells = parseCsvLine(line);
    if (cells[0]) m.set(cells[0], cells[2]);
  }
  return m;
}

/** Existing redirect sources already in the CSV (path form, trailing slash stripped). */
function existingSources(): Set<string> {
  const text = readFileSync(CSV_PATH, 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0 && !l.startsWith('#'));
  lines.shift();
  const set = new Set<string>();
  for (const line of lines) {
    const from = line.split(',')[0];
    let path: string;
    try { path = decodeURI(new URL(from).pathname); }
    catch { path = decodeURI(from.replace(/^https?:\/\/[^/]+/, '')); }
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    set.add(path);
  }
  return set;
}

interface SanityRow { _id: string; s: string | null; city?: string | null; cityEn?: string | null; }

async function fetchFinal(type: string): Promise<Map<string, { s: string; city?: string }>> {
  const m = new Map<string, { s: string; city?: string }>();
  let rows: SanityRow[];
  if (type === 'guideArticle') {
    rows = await client.fetch(
      `*[_type == "guideArticle" && !(_id in path("drafts.**"))]{
         _id,
         "s": slug[_key=="ja"][0].value.current,
         "city": parentCity->slug[_key=="ja"][0].value.current,
         "cityEn": parentCity->slug[_key=="en"][0].value.current
       }`
    );
  } else {
    rows = await client.fetch(
      `*[_type == $t && !(_id in path("drafts.**"))]{
         _id, "s": slug[_key=="ja"][0].value.current
       }`,
      { t: type }
    );
  }
  for (const r of rows) {
    if (!r.s) continue;
    m.set(r._id, { s: r.s, city: r.city ?? r.cityEn ?? undefined });
  }
  return m;
}

async function main() {
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'migration-staging') {
    throw new Error(`Refusing to run against dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}".`);
  }
  const existing = existingSources();
  const newRows: string[] = [];
  let skippedSame = 0;
  let skippedExisting = 0;
  const perType: Record<string, number> = {};

  for (const type of Object.keys(FIRST_COMMIT_CSV)) {
    const oldSlugs = readOldSlugs(FIRST_COMMIT_CSV[type]);
    const final = await fetchFinal(type);
    let count = 0;
    for (const [_id, oldSlug] of oldSlugs) {
      const fin = final.get(_id);
      if (!fin) continue;
      if (!oldSlug || oldSlug === fin.s) { skippedSame++; continue; }
      if (type === 'guideArticle' && !fin.city) continue;
      const src = URL_FOR[type](oldSlug, fin.city);
      const dst = URL_FOR[type](fin.s, fin.city);
      if (existing.has(src)) { skippedExisting++; continue; }
      if (src === dst) { skippedSame++; continue; }
      // from_url, to_path, locale, status_code, legacy_wp_id, priority_score
      newRows.push(`${src},${dst},ja,301,,50.00`);
      existing.add(src); // guard against intra-run dupes
      count++;
    }
    perType[type] = count;
  }

  if (newRows.length > 0) {
    appendFileSync(CSV_PATH, newRows.join('\n') + '\n', 'utf8');
  }

  console.log('JA slug redirect generation');
  console.log('  per type:', JSON.stringify(perType));
  console.log(`  appended: ${newRows.length}`);
  console.log(`  skipped (slug unchanged): ${skippedSame}`);
  console.log(`  skipped (source already in CSV): ${skippedExisting}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
