/**
 * Bulk-import tours from the MD corpus.
 *
 * Source: /Users/islamhussein/Downloads/All 3 langs/{en,es,ja}/{private,group} {day tours,packages}/<sub>/<slug>.md
 *
 * For each canonical slug across the 3 locales:
 *   • Parse frontmatter + body (en/es/ja each)
 *   • Convert MD → HTML → PortableText via existing htmlToPortableText
 *   • Resolve category (type × tourMode) from folder path
 *   • Resolve discriminator:
 *       - day tours    → cities = [<city from folder>]
 *       - private pkg  → theme  = ref<theme>
 *       - group pkg    → originRegion = enum
 *   • Upsert into Sanity:
 *       - If an existing `tour` doc has matching EN slug → patch (preserve _id)
 *       - Otherwise → create at `tour.<slug>`
 *
 * Preserves existing tour fields not touched (durationDays, durationLabel,
 * tourMode, etc.) on upsert. Updates title, slug, summary, body, type, theme
 * or cities or originRegion, and migration.wpUrl.
 *
 * Idempotent — re-running produces no change once data is consistent.
 *
 * Refuses to run against any dataset other than migration-staging.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { config as loadEnv } from 'dotenv';
import { readFileSync, readdirSync, existsSync, appendFileSync, mkdirSync, statSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { marked } from 'marked';

import { htmlToPortableText } from './wp-import-html.js';

loadEnv();

const CORPUS_ROOT = '/Users/islamhussein/Downloads/All 3 langs';
const LOG_PATH = resolve(process.cwd(), 'migration/bulk-upload-log.jsonl');
const LOCALES = ['en', 'es', 'ja'] as const;
type Locale = (typeof LOCALES)[number];

// ── Folder → schema mappings ──────────────────────────────────────────────

interface CategoryConfig {
  // Folder name (without locale prefix; may need trailing-space variant)
  folder: string;
  type: 'dayTour' | 'package';
  tourMode: 'private' | 'group';
  /** discriminator axis */
  subAxis: 'city' | 'theme' | 'originRegion';
}

const CATEGORIES: CategoryConfig[] = [
  { folder: 'private day tours', type: 'dayTour', tourMode: 'private', subAxis: 'city' },
  { folder: 'group day tours',   type: 'dayTour', tourMode: 'group',   subAxis: 'city' },
  { folder: 'private packages',  type: 'package', tourMode: 'private', subAxis: 'theme' },
  { folder: 'group packages',    type: 'package', tourMode: 'group',   subAxis: 'originRegion' },
];

// Folder name → city slug (for day-tour sub-folders)
const CITY_FOLDER_TO_SLUG: Record<string, string> = {
  'Al-Gouna': 'al-gouna',
  'Alexandria': 'alexandria',
  'Aswan': 'aswan',
  'Cairo': 'cairo',
  'Hurghada': 'hurghada',
  'Luxor': 'luxor',
  'Marsa Alam': 'marsa-alam',
  'Safaga': 'safaga',
  'Sharm El Sheikh': 'sharm-el-sheikh',
};

// Folder name → theme _id (for private packages sub-folders)
const THEME_FOLDER_TO_ID: Record<string, string> = {
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

// Folder name → originRegion enum (for group packages sub-folders)
const REGION_FOLDER_TO_ENUM: Record<string, 'japan-east-asia' | 'usa-canada' | 'uk-europe'> = {
  'Japan & East Asia': 'japan-east-asia',
  'USA & Canada': 'usa-canada',
  'UK & Europe': 'uk-europe',
};

// ── Args + client ─────────────────────────────────────────────────────────

interface Args { commit: boolean; dryRun: boolean; limit: number | null; only: string | null }
function parseArgs(argv: string[]): Args {
  let commit = false; let dryRun = false; let limit: number | null = null; let only: string | null = null;
  for (const a of argv.slice(2)) {
    if (a === '--commit') commit = true;
    else if (a === '--dry-run') dryRun = true;
    else if (a.startsWith('--limit=')) limit = parseInt(a.slice(8), 10);
    else if (a.startsWith('--only=')) only = a.slice(7);
    else die(`Unknown arg: ${a}`);
  }
  if (commit === dryRun) die('Pass exactly one of --dry-run or --commit.');
  return { commit, dryRun, limit, only };
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

// ── MD parser ─────────────────────────────────────────────────────────────

interface ParsedMd {
  slug: string;
  title: string;
  description: string;
  body: string;        // body text after frontmatter, with leading "Meta Title:"/"Meta Description:" sections stripped
  city: string | null;
}

function parseFrontmatter(raw: string): { fm: Record<string, string>; rest: string } | null {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  const fm: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^"|"$/g, '').trim();
  }
  return { fm, rest: m[2] };
}

function parseMd(raw: string): ParsedMd | null {
  const parsed = parseFrontmatter(raw);
  if (!parsed) return null;
  const { fm, rest } = parsed;
  if (!fm.slug || !fm.title) return null;
  // Strip the leading "Meta Title: ... Meta Description: ..." block followed by --- before the actual content
  // Pattern observed: after frontmatter, there's "**Meta Title:** ..." then "**Meta Description:** ..." then --- then real body.
  let body = rest;
  const metaMatch = body.match(/^\s*\*\*Meta Title:?\*\*[\s\S]*?\*\*Meta Description:?\*\*[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  if (metaMatch) body = metaMatch[1];
  return {
    slug: fm.slug,
    title: fm.title,
    description: fm.description ?? '',
    body: body.trim(),
    city: fm.city ? fm.city.trim() || null : null,
  };
}

function findCategoryDir(locale: Locale, category: CategoryConfig): string | null {
  const variants = [
    join(CORPUS_ROOT, locale, category.folder),
    join(CORPUS_ROOT, locale, category.folder + ' '), // trailing-space variant present in some JA folders
  ];
  for (const p of variants) if (existsSync(p) && statSync(p).isDirectory()) return p;
  return null;
}

// ── Per-tour aggregation across locales ───────────────────────────────────

interface TourRecord {
  canonicalSlug: string;
  category: CategoryConfig;
  subValue: string;            // city slug (day tour), theme id (private pkg), or region enum (group pkg)
  perLocale: Partial<Record<Locale, { fm: ParsedMd; bodyPt: any[]; warnings: string[] }>>;
}

function walkCorpus(): TourRecord[] {
  const recsByKey = new Map<string, TourRecord>();

  for (const category of CATEGORIES) {
    for (const locale of LOCALES) {
      const catDir = findCategoryDir(locale, category);
      if (!catDir) {
        console.warn(`  · missing dir: ${locale}/${category.folder}`);
        continue;
      }
      // Each sub-folder = one sub-axis value
      for (const sub of readdirSync(catDir).filter((n) => statSync(join(catDir, n)).isDirectory())) {
        let subValue: string;
        if (category.subAxis === 'city') {
          subValue = CITY_FOLDER_TO_SLUG[sub] ?? '';
        } else if (category.subAxis === 'theme') {
          subValue = THEME_FOLDER_TO_ID[sub] ?? '';
        } else {
          subValue = REGION_FOLDER_TO_ENUM[sub] ?? '';
        }
        if (!subValue) {
          console.warn(`  · unknown sub-folder for ${category.folder}/${locale}: "${sub}" — skipping`);
          continue;
        }
        const subDir = join(catDir, sub);
        for (const file of readdirSync(subDir).filter((n) => n.endsWith('.md'))) {
          const fullPath = join(subDir, file);
          const raw = readFileSync(fullPath, 'utf8');
          const parsed = parseMd(raw);
          if (!parsed) continue;
          const html = marked.parse(parsed.body, { async: false }) as string;
          const { blocks: bodyPt } = htmlToPortableText(html, { locale });
          const key = parsed.slug;
          const existing = recsByKey.get(key);
          if (!existing) {
            recsByKey.set(key, {
              canonicalSlug: parsed.slug,
              category,
              subValue,
              perLocale: { [locale]: { fm: parsed, bodyPt, warnings: [] } },
            });
          } else {
            // Sanity check: same slug in multiple categories would be a data bug
            if (existing.category.folder !== category.folder) {
              existing.perLocale[locale] = { fm: parsed, bodyPt, warnings: [`slug appears in multiple categories: ${existing.category.folder} + ${category.folder}`] };
            } else if (existing.subValue !== subValue) {
              existing.perLocale[locale] = { fm: parsed, bodyPt, warnings: [`slug appears in multiple sub-folders: ${existing.subValue} + ${subValue}`] };
            } else {
              existing.perLocale[locale] = { fm: parsed, bodyPt, warnings: [] };
            }
          }
        }
      }
    }
  }
  return [...recsByKey.values()].sort((a, b) => a.canonicalSlug.localeCompare(b.canonicalSlug));
}

// ── Doc shape builder ─────────────────────────────────────────────────────

interface BuildContext {
  /** Map of EN slug → existing Sanity tour doc _id (so we upsert in place) */
  bySlug: Map<string, string>;
}

function buildSanityDoc(rec: TourRecord, ctx: BuildContext): { _id: string; ops: Array<[string, unknown]>; isNew: boolean } {
  // Per-locale i18n arrays
  const titleArr: any[] = [];
  const slugArr: any[] = [];
  const summaryArr: any[] = [];
  const bodyArr: any[] = [];
  for (const loc of LOCALES) {
    const e = rec.perLocale[loc];
    if (!e) continue;
    titleArr.push({ _key: loc, _type: 'object', value: e.fm.title });
    slugArr.push({ _key: loc, _type: 'object', value: { _type: 'slug', current: e.fm.slug } });
    if (e.fm.description) summaryArr.push({ _key: loc, _type: 'object', value: e.fm.description });
    bodyArr.push({ _key: loc, _type: 'object', value: e.bodyPt });
  }

  const ops: Array<[string, unknown]> = [
    ['type', rec.category.type],
    ['tourMode', rec.category.tourMode],
    ['title', titleArr],
    ['slug', slugArr],
    ['summary', summaryArr],
    ['body', bodyArr],
    ['migration', { wpUrl: `https://travel2egypt.org/${rec.canonicalSlug}/` }],
  ];

  // Set discriminator + reset the others
  if (rec.category.subAxis === 'city') {
    ops.push(['cities', [{ _type: 'reference', _ref: `wp-page-${cityIdFromSlug(rec.subValue)}` }]]);
    // ↑ won't be right — need real cityId, defer to a Map prepared upstream
  } else if (rec.category.subAxis === 'theme') {
    ops.push(['theme', { _type: 'reference', _ref: rec.subValue }]);
  } else {
    ops.push(['originRegion', rec.subValue]);
  }

  // Reset the other discriminators so an upsert from one axis to another stays clean
  const unsetByAxis: Record<string, string[]> = {
    city: ['theme', 'originRegion'],
    theme: ['originRegion'], // keep cities — packages may have editorial cities later
    originRegion: ['theme'],
  };
  for (const f of unsetByAxis[rec.category.subAxis]) ops.push([`__unset__${f}`, null]);

  const existingId = ctx.bySlug.get(rec.canonicalSlug);
  return {
    _id: existingId ?? `tour.${rec.canonicalSlug}`,
    ops,
    isNew: !existingId,
  };
}

// Placeholder — real city refs are resolved in buildContext below
function cityIdFromSlug(_slug: string): string { return _slug; }

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);
  console.log(`\n=== Bulk-import tours from MD ===\nmode: ${args.commit ? 'COMMIT' : 'dry-run'}${args.limit ? `  limit: ${args.limit}` : ''}${args.only ? `  only: ${args.only}` : ''}\n`);
  const client = getClient();

  console.log('Walking corpus…');
  let records = walkCorpus();
  console.log(`  parsed ${records.length} unique tour slugs across 4 categories.`);
  if (args.only) records = records.filter((r) => r.canonicalSlug === args.only);
  if (args.limit) records = records.slice(0, args.limit);

  // Build the (slug → _id) map of existing tours, and the (city-slug → city _id) map
  console.log('Resolving existing tour _ids by EN slug…');
  const existingTours = await client.fetch<Array<{ _id: string; slug: string }>>(
    `*[_type=='tour' && !(_id in path('drafts.**'))]{ _id, "slug": slug[_key=='en'][0].value.current }`,
  );
  const bySlug = new Map<string, string>();
  for (const t of existingTours) if (t.slug) bySlug.set(t.slug, t._id);
  console.log(`  ${existingTours.length} existing tours indexed by slug.`);

  console.log('Resolving city refs…');
  const cities = await client.fetch<Array<{ _id: string; slug: string }>>(
    `*[_type=='city' && !(_id in path('drafts.**'))]{ _id, "slug": slug[_key=='en'][0].value.current }`,
  );
  const cityIdBySlug = new Map<string, string>();
  for (const c of cities) if (c.slug) cityIdBySlug.set(c.slug, c._id);

  // Stats
  let creates = 0, updates = 0, skipped = 0;
  const warnings: string[] = [];

  // Build all docs first (sanity check before any writes)
  interface PreparedDoc { rec: TourRecord; _id: string; isNew: boolean; sets: Record<string, unknown>; unsets: string[] }
  const prepared: PreparedDoc[] = [];

  for (const rec of records) {
    if (!rec.perLocale.en) { skipped++; warnings.push(`SKIP ${rec.canonicalSlug}: no EN MD source`); continue; }

    const existingId = bySlug.get(rec.canonicalSlug);
    const _id = existingId ?? `tour.${rec.canonicalSlug}`;
    const isNew = !existingId;

    // Build i18n field arrays
    const titleArr: any[] = []; const slugArr: any[] = []; const summaryArr: any[] = []; const bodyArr: any[] = [];
    for (const loc of LOCALES) {
      const e = rec.perLocale[loc];
      if (!e) continue;
      titleArr.push({ _key: loc, _type: 'object', value: e.fm.title });
      slugArr.push({ _key: loc, _type: 'object', value: { _type: 'slug', current: e.fm.slug } });
      if (e.fm.description) summaryArr.push({ _key: loc, _type: 'object', value: e.fm.description });
      bodyArr.push({ _key: loc, _type: 'object', value: e.bodyPt });
    }

    const sets: Record<string, unknown> = {
      type: rec.category.type,
      tourMode: rec.category.tourMode,
      title: titleArr,
      slug: slugArr,
      summary: summaryArr,
      body: bodyArr,
      migration: { wpUrl: `https://travel2egypt.org/${rec.canonicalSlug}/` },
    };
    const unsets: string[] = [];

    // Discriminator
    if (rec.category.subAxis === 'city') {
      const cityId = cityIdBySlug.get(rec.subValue);
      if (!cityId) { warnings.push(`SKIP ${rec.canonicalSlug}: city "${rec.subValue}" not found in Sanity`); skipped++; continue; }
      sets.cities = [{ _type: 'reference', _ref: cityId, _key: 'city-1' }];
      unsets.push('theme', 'originRegion');
    } else if (rec.category.subAxis === 'theme') {
      sets.theme = { _type: 'reference', _ref: rec.subValue };
      unsets.push('originRegion');
      // Keep cities untouched on packages (allows editorial-set cities to survive)
    } else {
      sets.originRegion = rec.subValue;
      unsets.push('theme');
    }

    if (isNew) creates++; else updates++;
    prepared.push({ rec, _id, isNew, sets, unsets });
  }

  console.log(`\nPlan:`);
  console.log(`  creates:  ${creates}`);
  console.log(`  updates:  ${updates}`);
  console.log(`  skipped:  ${skipped}`);
  if (warnings.length) {
    console.log(`\nWarnings (${warnings.length}):`);
    for (const w of warnings.slice(0, 15)) console.log(`  · ${w}`);
    if (warnings.length > 15) console.log(`  · …+${warnings.length - 15} more`);
  }

  if (args.dryRun) { console.log('\nDry-run — no writes.'); return; }
  if (prepared.length === 0) { console.log('Nothing to do.'); return; }

  // Write in batches of 25 to keep tx size reasonable
  const BATCH = 25;
  let written = 0;
  for (let i = 0; i < prepared.length; i += BATCH) {
    const chunk = prepared.slice(i, i + BATCH);
    let tx = client.transaction();
    for (const p of chunk) {
      if (p.isNew) {
        tx = tx.createIfNotExists({ _id: p._id, _type: 'tour', ...p.sets } as any);
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
    appendLog({
      phase: 'S48-tour-import',
      _id: p._id,
      slug: p.rec.canonicalSlug,
      category: `${p.rec.category.type}/${p.rec.category.tourMode}`,
      subAxis: p.rec.category.subAxis,
      subValue: p.rec.subValue,
      isNew: p.isNew,
    });
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
