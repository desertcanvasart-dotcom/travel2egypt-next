/**
 * Frontmatter-driven importer for newly-authored tours laid out FLAT:
 *
 *   <dir>/{en,es,ja}/<anything>.md
 *
 * Unlike bulk-import-tours-md.ts (which derives type/tourMode/discriminator
 * from the folder path), every file here carries self-describing frontmatter:
 *
 *   slug, kind (day-tour|package), tourMode (private|group|shared),
 *   city, theme, title, description, locale
 *
 * For each canonical EN slug, the three locale files merge into one trilingual
 * `tour` doc. Upsert semantics match the folder importer:
 *   - existing tour with matching EN slug  → patch in place (preserve _id)
 *   - otherwise                            → create at tour.<slug>
 * Idempotent. Refuses to run against any dataset other than migration-staging.
 *
 * Usage:
 *   tsx scripts/import-tours-flat.ts (--dry-run | --commit)
 *        [--dir <path>] [--only <slug>] [--limit N]
 *
 * Default --dir: /Users/islamhussein/Downloads/tours
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync, readdirSync, existsSync, appendFileSync, mkdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { marked } from 'marked';

import { htmlToPortableText } from './wp-import-html.js';

loadEnv();

const DEFAULT_DIR = '/Users/islamhussein/Downloads/tours';
const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');
const LOCALES = ['en', 'es', 'ja'] as const;
type Locale = (typeof LOCALES)[number];

// ── Frontmatter → schema mappings ───────────────────────────────────────────

const KIND_TO_TYPE: Record<string, 'dayTour' | 'package'> = {
  'day-tour': 'dayTour',
  package: 'package',
};

// Schema tourMode enum is private|group only; "shared" departures are group.
function normalizeMode(m: string): 'private' | 'group' | null {
  const v = m.trim().toLowerCase();
  if (v === 'private') return 'private';
  if (v === 'group' || v === 'shared') return 'group';
  return null;
}

// Frontmatter theme label → theme doc _id.
const THEME_NAME_TO_ID: Record<string, string> = {
  'Dahabiya Nile Cruise': 'theme-dahabiya-nile-cruise',
  'Egypt Family Holidays': 'theme-family-egypt',
  'Egypt In-Depth Tours': 'theme-egypt-in-depth',
  'Egypt Luxury Holidays': 'theme-luxury',
  'Egypt and The Red Sea': 'theme-egypt-red-sea',
  'Egypt on the Go': 'theme-egypt-on-the-go',
  'Hassle Free Egypt': 'theme-hassle-free',
  'Nile Cruise Holidays': 'theme-nile-cruise',
  'Special Interest Tours': 'theme-special-interest',
};

// Group-package origin regions (frontmatter `region`/`originRegion`).
const REGION_NAME_TO_ENUM: Record<string, 'japan-east-asia' | 'usa-canada' | 'uk-europe'> = {
  'Japan & East Asia': 'japan-east-asia',
  'USA & Canada': 'usa-canada',
  'UK & Europe': 'uk-europe',
};

// City-slug fixups: the corpus city label doesn't always match the Sanity city
// slug. Operator decisions:
//   fayoum → cairo  (the Fayoum desert tour departs from Cairo)
const CITY_SLUG_REMAP: Record<string, string> = {
  fayoum: 'cairo',
};

function citySlug(raw: string): string {
  const s = raw.trim().toLowerCase().replace(/\s+/g, '-');
  return CITY_SLUG_REMAP[s] ?? s;
}

// ── Args + client ───────────────────────────────────────────────────────────

interface Args { commit: boolean; dryRun: boolean; dir: string; only: string | null; limit: number | null }
function parseArgs(argv: string[]): Args {
  let commit = false; let dryRun = false; let dir = DEFAULT_DIR; let only: string | null = null; let limit: number | null = null;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--commit') commit = true;
    else if (a === '--dry-run') dryRun = true;
    else if (a === '--dir') dir = argv[++i];
    else if (a.startsWith('--dir=')) dir = a.slice(6);
    else if (a === '--only') only = argv[++i];
    else if (a.startsWith('--only=')) only = a.slice(7);
    else if (a.startsWith('--limit=')) limit = parseInt(a.slice(8), 10);
    else die(`Unknown arg: ${a}`);
  }
  if (commit === dryRun) die('Pass exactly one of --dry-run or --commit.');
  return { commit, dryRun, dir: resolve(dir), only, limit };
}
function die(msg: string): never { process.stderr.write(`error: ${msg}\n`); process.exit(2); }

function getClient(): SanityClient {
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (dataset !== 'migration-staging') die(`Refusing against ${dataset}`);
  const token = process.env.SANITY_STAGING_API_WRITE_TOKEN;
  if (!token) die('SANITY_STAGING_API_WRITE_TOKEN required');
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    useCdn: false, token, perspective: 'raw',
  });
}

function appendLog(entry: Record<string, unknown>): void {
  mkdirSync(resolve(process.cwd(), 'migration'), { recursive: true });
  appendFileSync(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n', 'utf8');
}

// ── MD parser ───────────────────────────────────────────────────────────────

interface ParsedMd {
  slug: string;
  title: string;
  description: string;
  body: string;
  kind: string;
  tourMode: string;
  city: string;
  theme: string;
  region: string;
}

function parseFrontmatter(raw: string): { fm: Record<string, string>; rest: string } | null {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  const fm: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([\w]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^"|"$/g, '').trim();
  }
  return { fm, rest: m[2] };
}

function parseMd(raw: string): ParsedMd | null {
  const parsed = parseFrontmatter(raw);
  if (!parsed) return null;
  const { fm, rest } = parsed;
  if (!fm.slug || !fm.title) return null;
  // Strip the leading "**Meta Title:** … **Meta Description:** … ---" block
  // (any language) that precedes the real body.
  let body = rest;
  const metaMatch = body.match(/^\s*\*\*[^\n*]*\*\*[\s\S]*?\*\*[^\n*]*\*\*[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  if (metaMatch) body = metaMatch[1];
  return {
    slug: fm.slug,
    title: fm.title,
    description: fm.description ?? '',
    body: body.trim(),
    kind: fm.kind ?? '',
    tourMode: fm.tourMode ?? '',
    city: fm.city ?? '',
    theme: fm.theme ?? '',
    region: fm.region ?? fm.originRegion ?? '',
  };
}

// ── Per-tour aggregation across locales ─────────────────────────────────────

interface TourRecord {
  canonicalSlug: string;
  perLocale: Partial<Record<Locale, { fm: ParsedMd; bodyPt: unknown[] }>>;
}

function walkFlat(dir: string): TourRecord[] {
  const recsByKey = new Map<string, TourRecord>();
  for (const locale of LOCALES) {
    const locDir = join(dir, locale);
    if (!existsSync(locDir) || !statSync(locDir).isDirectory()) {
      console.warn(`  · missing locale dir: ${locale}`);
      continue;
    }
    for (const entry of readdirSync(locDir)) {
      if (!entry.endsWith('.md')) continue;
      const raw = readFileSync(join(locDir, entry), 'utf8');
      const parsed = parseMd(raw);
      if (!parsed) { console.warn(`  · unparseable: ${locale}/${entry}`); continue; }
      const html = marked.parse(parsed.body, { async: false }) as string;
      const { blocks: bodyPt } = htmlToPortableText(html, { locale });
      const rec = recsByKey.get(parsed.slug) ?? { canonicalSlug: parsed.slug, perLocale: {} };
      rec.perLocale[locale] = { fm: parsed, bodyPt };
      recsByKey.set(parsed.slug, rec);
    }
  }
  return [...recsByKey.values()].sort((a, b) => a.canonicalSlug.localeCompare(b.canonicalSlug));
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Import tours (flat, frontmatter-driven) ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}\ndir: ${args.dir}${args.only ? `\nonly: ${args.only}` : ''}\n`);
  const client = getClient();

  console.log('Walking corpus…');
  let records = walkFlat(args.dir);
  console.log(`  parsed ${records.length} unique tour slugs.`);
  if (args.only) records = records.filter((r) => r.canonicalSlug === args.only);
  if (args.limit) records = records.slice(0, args.limit);

  console.log('Resolving existing tour _ids by EN slug…');
  const existingTours = await client.fetch<Array<{ _id: string; slug: string }>>(
    `*[_type=='tour' && !(_id in path('drafts.**'))]{ _id, "slug": slug[_key=='en'][0].value.current }`,
  );
  const bySlug = new Map<string, string>();
  for (const t of existingTours) if (t.slug) bySlug.set(t.slug, t._id);
  console.log(`  ${existingTours.length} existing tours indexed.`);

  console.log('Resolving city refs…');
  const cities = await client.fetch<Array<{ _id: string; slug: string }>>(
    `*[_type=='city' && !(_id in path('drafts.**'))]{ _id, "slug": slug[_key=='en'][0].value.current }`,
  );
  const cityIdBySlug = new Map<string, string>();
  for (const c of cities) if (c.slug) cityIdBySlug.set(c.slug, c._id);

  let creates = 0, updates = 0, skipped = 0;
  const warnings: string[] = [];
  interface PreparedDoc { rec: TourRecord; _id: string; isNew: boolean; sets: Record<string, unknown>; unsets: string[]; cls: string }
  const prepared: PreparedDoc[] = [];

  for (const rec of records) {
    const en = rec.perLocale.en;
    if (!en) { skipped++; warnings.push(`SKIP ${rec.canonicalSlug}: no EN source`); continue; }

    const type = KIND_TO_TYPE[en.fm.kind];
    if (!type) { skipped++; warnings.push(`SKIP ${rec.canonicalSlug}: unknown kind "${en.fm.kind}"`); continue; }
    const mode = normalizeMode(en.fm.tourMode);
    if (!mode) { skipped++; warnings.push(`SKIP ${rec.canonicalSlug}: unknown tourMode "${en.fm.tourMode}"`); continue; }

    const titleArr: unknown[] = []; const slugArr: unknown[] = []; const summaryArr: unknown[] = []; const bodyArr: unknown[] = [];
    for (const loc of LOCALES) {
      const e = rec.perLocale[loc];
      if (!e) continue;
      titleArr.push({ _key: loc, _type: 'object', value: e.fm.title });
      slugArr.push({ _key: loc, _type: 'object', value: { _type: 'slug', current: rec.canonicalSlug } });
      if (e.fm.description) summaryArr.push({ _key: loc, _type: 'object', value: e.fm.description });
      bodyArr.push({ _key: loc, _type: 'object', value: e.bodyPt });
    }

    const sets: Record<string, unknown> = {
      type, tourMode: mode,
      title: titleArr, slug: slugArr, summary: summaryArr, body: bodyArr,
      migration: { wpUrl: `https://travel2egypt.org/${rec.canonicalSlug}/` },
    };
    const unsets: string[] = [];
    let cls: string;

    if (type === 'dayTour') {
      const cs = citySlug(en.fm.city);
      const cityId = cityIdBySlug.get(cs);
      if (!cs) { skipped++; warnings.push(`SKIP ${rec.canonicalSlug}: day tour has no city`); continue; }
      if (!cityId) { skipped++; warnings.push(`SKIP ${rec.canonicalSlug}: city "${cs}" not found in Sanity`); continue; }
      sets.cities = [{ _type: 'reference', _ref: cityId, _key: 'city-1' }];
      unsets.push('theme', 'originRegion');
      cls = `dayTour/${mode} · ${cs}`;
    } else if (mode === 'private') {
      const themeId = THEME_NAME_TO_ID[en.fm.theme];
      if (!themeId) { skipped++; warnings.push(`SKIP ${rec.canonicalSlug}: unknown theme "${en.fm.theme}"`); continue; }
      sets.theme = { _type: 'reference', _ref: themeId };
      unsets.push('originRegion'); // keep cities (editorial on packages)
      cls = `package/private · ${themeId}`;
    } else {
      const region = REGION_NAME_TO_ENUM[en.fm.region];
      if (!region) { skipped++; warnings.push(`SKIP ${rec.canonicalSlug}: group package missing/unknown region "${en.fm.region}"`); continue; }
      sets.originRegion = region;
      unsets.push('theme');
      cls = `package/group · ${region}`;
    }

    const existingId = bySlug.get(rec.canonicalSlug);
    const _id = existingId ?? `tour.${rec.canonicalSlug}`;
    const isNew = !existingId;
    if (isNew) creates++; else updates++;
    prepared.push({ rec, _id, isNew, sets, unsets, cls });
  }

  console.log(`\nPlan:  creates=${creates}  updates=${updates}  skipped=${skipped}\n`);
  for (const p of prepared) {
    console.log(`  ${p.isNew ? 'CREATE' : 'patch '}  ${p._id}  [${p.cls}]  (${p.rec.canonicalSlug})`);
  }
  if (warnings.length) {
    console.log(`\nWarnings (${warnings.length}):`);
    for (const w of warnings) console.log(`  · ${w}`);
  }

  if (args.dryRun) { console.log('\nDry-run — no writes.'); return; }
  if (prepared.length === 0) { console.log('Nothing to do.'); return; }

  const BATCH = 25;
  let written = 0;
  for (let i = 0; i < prepared.length; i += BATCH) {
    const chunk = prepared.slice(i, i + BATCH);
    let tx = client.transaction();
    for (const p of chunk) {
      if (p.isNew) {
        tx = tx.createIfNotExists({ _id: p._id, _type: 'tour', ...p.sets } as never);
      } else {
        tx = tx.patch(p._id, (pp) => {
          let chained = pp.set(p.sets);
          if (p.unsets.length) chained = chained.unset(p.unsets);
          return chained;
        });
      }
    }
    await tx.commit({ visibility: 'async' });
    written += chunk.length;
    process.stdout.write(`  ${written}/${prepared.length}\r`);
  }
  console.log(`\n✓ Wrote ${written} tour docs.`);

  for (const p of prepared) {
    appendLog({ phase: 'flat-tour-import', _id: p._id, slug: p.rec.canonicalSlug, cls: p.cls, isNew: p.isNew });
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
