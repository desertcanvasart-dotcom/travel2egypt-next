/**
 * Generate 301 redirect rows for the ES slug-localization migration.
 *
 * migrate-es-slugs.ts rewrote each in-scope doc's ES slug from the
 * English-fallback value to a slugified Spanish title. The old ES URLs
 * (/es/<en-slug>, /es/travel-tips/<en-slug>, /es/guide/<city>/<en-slug>,
 * /es/guide/<en-city>) no longer resolve. This script emits
 * /es/<en-slug> → /es/<es-slug> redirects so previously-indexed ES URLs
 * keep working.
 *
 * Old slug ← commit-CSV `current_slug` column (pre-migration EN-fallback).
 * New slug ← commit-CSV `proposed_slug` column (== live Sanity state, since
 *            ES migration had 0 collisions/empties so every proposal applied).
 *
 * guideArticle URLs embed the parent-city ES slug, which itself may have
 * changed (wadi-el-natrun → wadi-al-natron). We query Sanity for each
 * article's parent-city EN slug (old) and final ES slug (new) so the
 * source uses the old city path and the destination the new one.
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

// Commit CSVs written by migrate-es-slugs.ts --commit (current_slug = old
// EN-fallback, proposed_slug = new ES slug).
const COMMIT_CSV: Record<string, string> = {
  tour: 'migration/.cache/es-slug-tour-2026-05-30T11-00-03-027Z.csv',
  guideArticle: 'migration/.cache/es-slug-guideArticle-2026-05-30T11-00-53-475Z.csv',
  travelTip: 'migration/.cache/es-slug-travelTip-2026-05-30T11-02-58-066Z.csv',
  city: 'migration/.cache/es-slug-city-2026-05-30T11-03-07-721Z.csv',
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

interface Row { _id: string; oldSlug: string; newSlug: string; }

/** Read commit CSV → rows where current_slug !== proposed_slug. */
function readChanges(file: string): Row[] {
  const text = readFileSync(resolve(process.cwd(), file), 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  lines.shift(); // header: _id,title,current_slug,proposed_slug,source,flags
  const rows: Row[] = [];
  for (const line of lines) {
    const c = parseCsvLine(line);
    const _id = c[0], oldSlug = c[2], newSlug = c[3];
    if (!_id || !oldSlug || !newSlug || oldSlug === newSlug) continue;
    rows.push({ _id, oldSlug, newSlug });
  }
  return rows;
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

/** _id → { oldCity (EN slug), newCity (final ES slug) } for guideArticle. */
async function fetchCities(): Promise<Map<string, { oldCity: string; newCity: string }>> {
  const rows: { _id: string; en?: string | null; es?: string | null }[] = await client.fetch(
    `*[_type == "guideArticle" && !(_id in path("drafts.**"))]{
       _id,
       "en": parentCity->slug[_key=="en"][0].value.current,
       "es": parentCity->slug[_key=="es"][0].value.current
     }`
  );
  const m = new Map<string, { oldCity: string; newCity: string }>();
  for (const r of rows) {
    if (!r.en) continue;
    m.set(r._id, { oldCity: r.en, newCity: r.es ?? r.en });
  }
  return m;
}

async function main() {
  // post-cutover: production is the canonical dataset holding the final slugs
  if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'production') {
    throw new Error(`Refusing to run against dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}".`);
  }
  const existing = existingSources();
  const cities = await fetchCities();
  const newRows: string[] = [];
  const perType: Record<string, number> = {};
  let skippedExisting = 0;

  for (const type of Object.keys(COMMIT_CSV)) {
    const changes = readChanges(COMMIT_CSV[type]);
    let count = 0;
    for (const { _id, oldSlug, newSlug } of changes) {
      let src: string, dst: string;
      if (type === 'tour') { src = `/es/${oldSlug}`; dst = `/es/${newSlug}`; }
      else if (type === 'travelTip') { src = `/es/travel-tips/${oldSlug}`; dst = `/es/travel-tips/${newSlug}`; }
      else if (type === 'city') { src = `/es/guide/${oldSlug}`; dst = `/es/guide/${newSlug}`; }
      else { // guideArticle
        const c = cities.get(_id);
        if (!c) continue;
        src = `/es/guide/${c.oldCity}/${oldSlug}`;
        dst = `/es/guide/${c.newCity}/${newSlug}`;
      }
      if (existing.has(src)) { skippedExisting++; continue; }
      if (src === dst) continue;
      // from_url, to_path, locale, status_code, legacy_wp_id, priority_score
      newRows.push(`${src},${dst},es,301,,50.00`);
      existing.add(src);
      count++;
    }
    perType[type] = count;
  }

  if (newRows.length > 0) {
    appendFileSync(CSV_PATH, newRows.join('\n') + '\n', 'utf8');
  }

  console.log('ES slug redirect generation');
  console.log('  per type:', JSON.stringify(perType));
  console.log(`  appended: ${newRows.length}`);
  console.log(`  skipped (source already in CSV): ${skippedExisting}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
