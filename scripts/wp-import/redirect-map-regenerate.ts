/**
 * Redirect-map regenerator (Phase 3b — s55).
 *
 * Sibling entry point to `redirect-map.ts`. Reads the canonical CSV, optionally
 * augments it from the destination-pages inventory CSV + Sanity, and emits:
 *
 *   - migration/redirect-map.csv           (canonical, 6-col)
 *   - migration/redirect-map.generated.ts  (typed module imported by next.config.ts)
 *
 * Per docs/migrations/phase-2-plan.md §5.2:
 *   a) inventory disposition=migrate + Sanity guideArticle present  → /guide/<city>/<slug>/
 *   b) inventory disposition=migrate + Sanity guideArticle absent   → /guide/<city>/ (parent fallback)
 *   c) inventory disposition=redirect-to-parent                     → /guide/<city>/
 *
 * "Degraded mode" — the inventory CSV is gitignored (`migration/content/*.csv`)
 * and may not be staged in the worktree. When absent, the regenerator emits a
 * warning and writes the generated TS module from the existing CSV baseline
 * only (the 128 rows produced by the wp-import flow). This is the s55 default
 * use case; Phase 4 sessions stage the inventory and exercise rules a/b/c.
 *
 * Idempotent. Run via: `npm run redirect-map:regenerate` (optionally
 * `-- --inventory <path> --diff --dry-run`).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Locale, RedirectEntry } from './types.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REDIRECT_MAP_CSV = join(ROOT, 'migration/redirect-map.csv');
const REDIRECT_MAP_GENERATED_TS = join(ROOT, 'migration/redirect-map.generated.ts');
const DEFAULT_INVENTORY_CSV = join(ROOT, 'migration/content/destination-pages-inventory.csv');

const CSV_HEADER = 'from_url,to_path,locale,status_code,legacy_wp_id,priority_score';

const LOCALES: readonly Locale[] = ['en', 'es', 'ja'] as const;

// ─── CSV I/O ──────────────────────────────────────────────────────────────────

export function readRedirectMapCsv(path: string): RedirectEntry[] {
  const text = readFileSync(path, 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const header = lines.shift();
  if (header !== CSV_HEADER) {
    throw new Error(
      `redirect-map.csv: unexpected header.\n  expected: ${CSV_HEADER}\n  actual:   ${header}`
    );
  }
  return lines.map((line, i) => {
    const cols = line.split(',');
    if (cols.length !== 6) {
      throw new Error(`redirect-map.csv: row ${i + 2} has ${cols.length} cols, expected 6`);
    }
    const [from_url, to_path, locale, status_code, legacy_wp_id, priority_score] = cols;
    if (!LOCALES.includes(locale as Locale)) {
      throw new Error(`redirect-map.csv: row ${i + 2} has invalid locale "${locale}"`);
    }
    return {
      from_url,
      to_path,
      locale: locale as Locale,
      status_code: 301,
      legacy_wp_id: legacy_wp_id === '' ? null : Number(legacy_wp_id),
      priority_score: Number(priority_score),
    } satisfies RedirectEntry;
  });
}

export function writeRedirectMapCsv(path: string, entries: RedirectEntry[]): void {
  const rows = entries.map((e) =>
    [
      e.from_url,
      e.to_path,
      e.locale,
      e.status_code,
      e.legacy_wp_id ?? '',
      e.priority_score.toFixed(2),
    ].join(',')
  );
  writeFileSync(path, CSV_HEADER + '\n' + rows.join('\n') + '\n');
}

// ─── Inventory schema ─────────────────────────────────────────────────────────
//
// The inventory CSV is operator-maintained, gitignored, and not staged in the
// repo. Expected columns (validated at read time):
//
//   legacy_url      — absolute WP URL (with or without trailing slash)
//   destination     — city slug, must match Sanity `city.slug.en`
//   slug            — page slug (only required when disposition=migrate)
//   disposition     — migrate | redirect-to-parent | unknown | note-only
//   locale          — en | es | ja (optional; defaults to 'en' if blank)
//
// Unknown / note-only rows are skipped with an info log. Operator can extend
// the schema later (e.g. `Best New URL` from per-destination xlsx); reader
// is forward-compatible — extra columns are ignored.

export type InventoryDisposition = 'migrate' | 'redirect-to-parent' | 'unknown' | 'note-only';

export interface InventoryRow {
  legacy_url: string;
  destination: string;
  slug: string;
  disposition: InventoryDisposition;
  locale: Locale;
}

const INVENTORY_REQUIRED_COLS = ['legacy_url', 'destination', 'slug', 'disposition'] as const;

export function readInventoryCsv(path: string): InventoryRow[] {
  const text = readFileSync(path, 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const header = lines.shift();
  if (!header) throw new Error(`inventory CSV is empty: ${path}`);
  const cols = header.split(',').map((c) => c.trim());
  for (const required of INVENTORY_REQUIRED_COLS) {
    if (!cols.includes(required)) {
      throw new Error(
        `inventory CSV missing required column "${required}". Found: ${cols.join(', ')}`
      );
    }
  }
  const idx = (name: string) => cols.indexOf(name);
  const I = {
    legacy_url: idx('legacy_url'),
    destination: idx('destination'),
    slug: idx('slug'),
    disposition: idx('disposition'),
    locale: idx('locale'),
  };
  return lines.map((line, i) => {
    const parts = line.split(',');
    const disposition = parts[I.disposition] as InventoryDisposition;
    if (!['migrate', 'redirect-to-parent', 'unknown', 'note-only'].includes(disposition)) {
      throw new Error(`inventory CSV row ${i + 2}: invalid disposition "${disposition}"`);
    }
    const rawLocale = I.locale >= 0 ? parts[I.locale] : '';
    const locale: Locale =
      rawLocale && LOCALES.includes(rawLocale as Locale) ? (rawLocale as Locale) : 'en';
    return {
      legacy_url: parts[I.legacy_url],
      destination: parts[I.destination],
      slug: parts[I.slug] ?? '',
      disposition,
      locale,
    };
  });
}

// ─── Sanity slug lookup ───────────────────────────────────────────────────────
//
// Single batched GROQ query → in-memory Set<"city/slug"> keys, keyed by
// city.slug.en + guideArticle.slug.en. Avoids N+1.

export interface SlugLookup {
  has(city: string, slug: string): boolean;
}

export function makeStaticSlugLookup(pairs: Iterable<readonly [string, string]>): SlugLookup {
  const set = new Set<string>();
  for (const [city, slug] of pairs) set.add(`${city}/${slug}`);
  return { has: (city, slug) => set.has(`${city}/${slug}`) };
}

/**
 * Build a real SlugLookup from Sanity. Lazily imports env/client so a degraded
 * run (no inventory) doesn't require Sanity credentials.
 */
async function makeSanitySlugLookup(): Promise<SlugLookup> {
  const { loadEnv } = await import('./env.js');
  const { makeSanityClient } = await import('./sanity.js');
  const client = makeSanityClient(loadEnv());
  const rows = await client.fetch<Array<{ city: string | null; slug: string | null }>>(
    `*[_type == "guideArticle" && defined(parentCity) && defined(slug)]{
       "city": parentCity->slug[_key=="en"][0].value.current,
       "slug": slug[_key=="en"][0].value.current
     }`
  );
  const pairs = rows
    .filter((r): r is { city: string; slug: string } => !!r.city && !!r.slug)
    .map((r) => [r.city, r.slug] as const);
  return makeStaticSlugLookup(pairs);
}

// ─── Path helpers ─────────────────────────────────────────────────────────────

/** Strip host + decode + drop trailing slash. Empty path → '/'. */
export function fromUrlToSource(fromUrl: string): string {
  let path: string;
  try {
    const u = new URL(fromUrl);
    path = decodeURI(u.pathname);
  } catch {
    path = fromUrl.replace(/^https?:\/\/[^/]+/, '');
    try {
      path = decodeURI(path);
    } catch {
      // leave as-is if decode fails (malformed % sequence)
    }
  }
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path || '/';
}

/** Targets stay as authored (no trailing slash, no host). */
export function toPathToDestination(toPath: string): string {
  if (toPath.length > 1 && toPath.endsWith('/')) return toPath.slice(0, -1);
  return toPath;
}

// ─── Rule engine ──────────────────────────────────────────────────────────────

export interface ApplyInventoryOpts {
  baseline: RedirectEntry[];
  inventory: InventoryRow[];
  slugLookup: SlugLookup;
  /** Sink for unknown/note-only rows + per-rule counts. */
  log?: (msg: string) => void;
}

export interface ApplyInventoryResult {
  entries: RedirectEntry[];
  added: number;
  upgraded: number;
  skipped: number;
  counts: { a_specific: number; b_fallback: number; c_parent: number };
}

/**
 * Apply the §5.2 rules. Idempotent: existing rows with the same (from_url, locale)
 * key are replaced (so a re-run upgrades parent-fallbacks to specific URLs once
 * a Sanity doc lands). Baseline rows without an inventory entry are preserved.
 */
export function applyInventory(opts: ApplyInventoryOpts): ApplyInventoryResult {
  const { baseline, inventory, slugLookup, log } = opts;
  const key = (fromUrl: string, locale: Locale) => `${locale} ${fromUrl}`;
  const byKey = new Map<string, RedirectEntry>();
  for (const e of baseline) byKey.set(key(e.from_url, e.locale), e);

  const beforeKeys = new Set(byKey.keys());
  let upgraded = 0;
  let skipped = 0;
  const counts = { a_specific: 0, b_fallback: 0, c_parent: 0 };

  for (const row of inventory) {
    if (row.disposition === 'unknown' || row.disposition === 'note-only') {
      log?.(`[skip] disposition=${row.disposition} ${row.legacy_url}`);
      skipped++;
      continue;
    }

    let toPath: string;
    if (row.disposition === 'redirect-to-parent') {
      toPath = `/guide/${row.destination}/`;
      counts.c_parent++;
    } else if (row.disposition === 'migrate') {
      if (!row.slug) {
        log?.(`[skip] migrate row without slug: ${row.legacy_url}`);
        skipped++;
        continue;
      }
      if (slugLookup.has(row.destination, row.slug)) {
        toPath = `/guide/${row.destination}/${row.slug}/`;
        counts.a_specific++;
      } else {
        toPath = `/guide/${row.destination}/`;
        counts.b_fallback++;
      }
    } else {
      continue; // exhaustive — keeps TS happy
    }

    const entry: RedirectEntry = {
      from_url: row.legacy_url,
      to_path: toPathToDestination(toPath),
      locale: row.locale,
      status_code: 301,
      legacy_wp_id: null,
      priority_score: 0,
    };
    const k = key(entry.from_url, entry.locale);
    const prev = byKey.get(k);
    if (prev) {
      // Preserve priority_score + legacy_wp_id from baseline; replace target.
      entry.priority_score = prev.priority_score;
      entry.legacy_wp_id = prev.legacy_wp_id;
      if (prev.to_path !== entry.to_path) upgraded++;
    }
    byKey.set(k, entry);
  }

  const added = [...byKey.keys()].filter((k) => !beforeKeys.has(k)).length;
  const entries = [...byKey.values()].sort(
    (a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0)
  );

  return { entries, added, upgraded, skipped, counts };
}

// ─── Generated TS module ──────────────────────────────────────────────────────

export interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
}

/** Emit the `migration/redirect-map.generated.ts` module body. */
export function emitGeneratedTs(entries: RedirectEntry[]): string {
  const rules: RedirectRule[] = entries.map((e) => ({
    source: fromUrlToSource(e.from_url),
    destination: toPathToDestination(e.to_path),
    permanent: true,
  }));

  // De-duplicate by source — a redirect with two definitions confuses Next.
  // First-wins (deterministic given priority-sorted input).
  const seen = new Set<string>();
  const deduped: RedirectRule[] = [];
  for (const r of rules) {
    if (seen.has(r.source)) continue;
    seen.add(r.source);
    deduped.push(r);
  }

  const header = `/* eslint-disable */
// AUTO-GENERATED by scripts/wp-import/redirect-map-regenerate.ts.
// Do not edit by hand. Run \`npm run redirect-map:regenerate\` to refresh.
//
// Source of truth: migration/redirect-map.csv.
// Imported by next.config.ts to populate \`async redirects()\`.

export interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
}

export const redirects: RedirectRule[] = ${JSON.stringify(deduped, null, 2)};
`;
  return header;
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

interface CliArgs {
  inventory?: string;
  diff: boolean;
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { diff: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--inventory') args.inventory = argv[++i];
    else if (a === '--diff') args.diff = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--help' || a === '-h') {
      process.stdout.write(USAGE);
      process.exit(0);
    }
  }
  return args;
}

const USAGE = `redirect-map-regenerate — regenerate migration/redirect-map.csv + generated.ts

Usage: tsx scripts/wp-import/redirect-map-regenerate.ts [options]

Options:
  --inventory <path>   Path to destination-pages inventory CSV. Defaults to
                       migration/content/destination-pages-inventory.csv.
                       If absent, runs in degraded mode (baseline-only).
  --diff               Print added / upgraded / skipped counts and per-rule totals.
  --dry-run            Compute output but don't write files.
  -h, --help           Show this help.
`;

async function main(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const inventoryPath = args.inventory ?? DEFAULT_INVENTORY_CSV;

  const baseline = readRedirectMapCsv(REDIRECT_MAP_CSV);
  process.stdout.write(`[regenerate] baseline: ${baseline.length} rows from ${rel(REDIRECT_MAP_CSV)}\n`);

  let final: RedirectEntry[] = baseline;
  let result: ApplyInventoryResult | null = null;

  if (existsSync(inventoryPath)) {
    process.stdout.write(`[regenerate] inventory: ${rel(inventoryPath)}\n`);
    const inventory = readInventoryCsv(inventoryPath);
    process.stdout.write(`[regenerate] inventory rows: ${inventory.length}\n`);
    const slugLookup = await makeSanitySlugLookup();
    result = applyInventory({
      baseline,
      inventory,
      slugLookup,
      log: args.diff ? (m) => process.stderr.write(m + '\n') : undefined,
    });
    final = result.entries;
  } else {
    process.stderr.write(
      `[regenerate] WARNING: inventory CSV not found at ${rel(inventoryPath)}.\n` +
        `[regenerate] Running in DEGRADED MODE — baseline-only pass-through to generated.ts.\n` +
        `[regenerate] Stage the inventory CSV at migration/content/destination-pages-inventory.csv\n` +
        `[regenerate] (or pass --inventory <path>) to exercise §5.2 rules a/b/c.\n`
    );
  }

  if (args.dryRun) {
    process.stdout.write(`[regenerate] DRY RUN — no files written.\n`);
  } else {
    writeRedirectMapCsv(REDIRECT_MAP_CSV, final);
    writeFileSync(REDIRECT_MAP_GENERATED_TS, emitGeneratedTs(final));
    process.stdout.write(
      `[regenerate] wrote ${rel(REDIRECT_MAP_CSV)} (${final.length} rows)\n` +
        `[regenerate] wrote ${rel(REDIRECT_MAP_GENERATED_TS)}\n`
    );
  }

  if (args.diff && result) {
    process.stdout.write(
      `[regenerate] diff: added=${result.added} upgraded=${result.upgraded} skipped=${result.skipped} ` +
        `a_specific=${result.counts.a_specific} b_fallback=${result.counts.b_fallback} c_parent=${result.counts.c_parent}\n`
    );
  }
}

function rel(p: string): string {
  return relative(ROOT, p) || p;
}

const isMain = (() => {
  try {
    return fileURLToPath(import.meta.url) === process.argv[1];
  } catch {
    return false;
  }
})();

if (isMain) {
  main(process.argv.slice(2)).catch((err) => {
    process.stderr.write(`[regenerate] FATAL: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
